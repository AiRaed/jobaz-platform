import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  canonicalOpportunityTitleKey,
  findExistingOpportunityByTitle,
} from '@/lib/admin/opportunities/titleNormalization'
import { opportunityInputToInsertRow } from '@/lib/admin/opportunities/mappers'
import {
  planWieGeneratedCourseTypeOperations,
  WIE_GENERATED_SEED_MESSAGE,
} from '@/lib/admin/opportunities/seedWieGeneratedCourseTypes'
import type { CourseOpportunity, CourseOpportunityInput } from '@/lib/admin/opportunities/types'
import {
  loadAllCourseOpportunities,
  replaceOpportunityNested,
  updateOpportunityRecord,
} from '@/lib/admin/opportunities/supabaseOpportunities'
import {
  loadLibraryFields,
  loadLibrarySpecialismsForField,
} from '@/lib/career-engine/work-in-education/library-browse'

export const dynamic = 'force-dynamic'

/**
 * GET — dry-run plan (no writes).
 * POST — insert missing WIE course-type rows into course_opportunities.
 */
export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const plan = await buildPlan(supabase)
    const creates = plan.operations.filter((o) => o.action === 'create')
    return NextResponse.json({
      ok: true,
      dry_run: true,
      total_before: plan.totalBefore,
      planned_creates: creates.length,
      planned_updates: plan.operations.filter((o) => o.action === 'update').length,
      planned_skips: plan.operations.filter((o) => o.action === 'skip').length,
      summary: plan.summary,
      create_sample: creates.slice(0, 40).map((o) => o.input.courseName),
      message: 'Dry run only — POST to insert rows into Supabase.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dry run failed' },
      { status: 500 }
    )
  }
}

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const plan = await buildPlan(supabase)
    const { operations, summary, totalBefore } = plan

    let running = plan.opportunities
    const seenKeys = new Set(running.map((o) => canonicalOpportunityTitleKey(o.courseName)))

    let insertedCount = 0
    let updatedCount = 0
    let skippedDuplicates = 0
    const insertedTitles: string[] = []
    const errors: string[] = []

    for (const op of operations) {
      if (op.action === 'skip') {
        skippedDuplicates += 1
        continue
      }

      const titleKey = canonicalOpportunityTitleKey(op.input.courseName)
      const existing = findExistingOpportunityByTitle(running, op.input.courseName)

      if (existing || seenKeys.has(titleKey)) {
        if (op.action === 'update' && existing) {
          try {
            await updateOpportunityRecord(supabase, existing.id, op.input)
            updatedCount += 1
            // Refresh this row in memory lightly
            running = running.map((o) =>
              o.id === existing.id
                ? {
                    ...o,
                    educationFields: op.input.educationFields ?? o.educationFields,
                    specialisations: op.input.specialisations ?? o.specialisations,
                    adminNotes: op.input.adminNotes ?? o.adminNotes,
                    goals: [
                      ...o.goals,
                      ...op.input.goals
                        .filter((g) => !o.goals.some((eg) => eg.goalKey === g.goalKey))
                        .map((g) => ({
                          id: `tmp-${g.goalKey}`,
                          opportunityId: o.id,
                          goalKey: g.goalKey,
                          goalLabel: g.goalLabel,
                        })),
                    ],
                  }
                : o
            )
          } catch (e) {
            errors.push(
              `update ${op.input.courseName}: ${e instanceof Error ? e.message : 'failed'}`
            )
          }
        } else {
          skippedDuplicates += 1
        }
        continue
      }

      if (op.action !== 'create') {
        skippedDuplicates += 1
        continue
      }

      try {
        assertSafeGeneratedInput(op.input)

        const row = opportunityInputToInsertRow(op.input)
        const { data, error } = await supabase
          .from('course_opportunities')
          .insert(row)
          .select('*')
          .single()

        if (error || !data) {
          throw new Error(error?.message ?? `Failed to create ${op.input.courseName}`)
        }

        await replaceOpportunityNested(supabase, data.id, op.input)

        seenKeys.add(titleKey)
        insertedCount += 1
        insertedTitles.push(op.input.courseName)

        running = [
          ...running,
          {
            id: data.id,
            courseName: op.input.courseName,
            shortLabel: op.input.shortLabel,
            coursePurpose: op.input.coursePurpose,
            priority: op.input.priority,
            opportunityStatus: op.input.opportunityStatus,
            publishStatus: op.input.publishStatus,
            importance: op.input.importance,
            notes: op.input.notes,
            nextAction: op.input.nextAction,
            publishedCourseId: op.input.publishedCourseId,
            visibilityStatus: op.input.visibilityStatus,
            educationFields: op.input.educationFields ?? [],
            specialisations: op.input.specialisations ?? [],
            commercialStatus: op.input.commercialStatus,
            suggestedSearchKeywords: op.input.suggestedSearchKeywords,
            adminNotes: op.input.adminNotes,
            canBeCourseCard: op.input.canBeCourseCard,
            recommendationType: op.input.recommendationType,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            routes: [],
            goals: op.input.goals.map((g) => ({
              id: `tmp-${g.goalKey}`,
              opportunityId: data.id,
              goalKey: g.goalKey,
              goalLabel: g.goalLabel,
            })),
            providers: [],
          } satisfies CourseOpportunity,
        ]
      } catch (e) {
        errors.push(`insert ${op.input.courseName}: ${e instanceof Error ? e.message : 'failed'}`)
      }
    }

    const opportunities = await loadAllCourseOpportunities(supabase)
    const totalAfter = opportunities.length

    if (errors.length && insertedCount === 0 && updatedCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: errors.slice(0, 5).join(' · '),
          errors: errors.slice(0, 20),
          inserted_count: 0,
          skipped_duplicates: skippedDuplicates,
          total_before: totalBefore,
          total_after: totalAfter,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: WIE_GENERATED_SEED_MESSAGE,
      inserted_count: insertedCount,
      skipped_duplicates: skippedDuplicates,
      updated_count: updatedCount,
      total_before: totalBefore,
      total_after: totalAfter,
      total: totalAfter,
      summary: {
        ...summary,
        inserted_count: insertedCount,
        skipped_duplicates: skippedDuplicates,
        updated_count: updatedCount,
        added_count: insertedCount,
        total_before: totalBefore,
        total_after: totalAfter,
      },
      generated_sample: insertedTitles.slice(0, 40),
      errors: errors.length ? errors.slice(0, 10) : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to generate WIE course type opportunities',
      },
      { status: 500 }
    )
  }
}

function assertSafeGeneratedInput(input: CourseOpportunityInput) {
  if (input.providers.length > 0) {
    throw new Error(`Refusing to insert providers for generated row: ${input.courseName}`)
  }
  if (input.publishStatus === 'Published' || input.visibilityStatus === 'public_listed') {
    throw new Error(`Refusing to publish generated row: ${input.courseName}`)
  }
  if (input.commercialStatus !== 'no_link') {
    throw new Error(`Refusing non-no_link commercial status for: ${input.courseName}`)
  }
}

async function buildPlan(supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>) {
  let fields: Array<{ id: string; name: string }> = []
  let specialisms: Array<{ id: string; field_id: string; name: string }> = []

  try {
    const loaded = await loadLibraryFields(supabase, { includeDrafts: true })
    fields = loaded.fields.map((f) => ({ id: f.id, name: f.name }))
    for (const field of loaded.fields) {
      try {
        const pack = await loadLibrarySpecialismsForField(supabase, field.id, {
          includeDrafts: true,
        })
        specialisms.push(
          ...pack.specialisms.map((s) => ({
            id: s.id,
            field_id: s.field_id,
            name: s.name,
          }))
        )
      } catch {
        // continue
      }
    }
  } catch {
    fields = []
    specialisms = []
  }

  const opportunities = await loadAllCourseOpportunities(supabase)
  const { operations, summary } = planWieGeneratedCourseTypeOperations({
    fields,
    specialisms,
    opportunities,
  })

  return {
    operations,
    summary: {
      ...summary,
      library_fields_loaded: fields.length,
    },
    opportunities,
    totalBefore: opportunities.length,
  }
}
