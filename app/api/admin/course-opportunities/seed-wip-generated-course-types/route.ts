import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  canonicalOpportunityTitleKey,
  findExistingOpportunityByTitle,
} from '@/lib/admin/opportunities/titleNormalization'
import { opportunityInputToInsertRow } from '@/lib/admin/opportunities/mappers'
import {
  assertSafeWipGeneratedInput,
  planWipGeneratedCourseTypeOperations,
  WIP_GENERATED_SEED_MESSAGE,
} from '@/lib/admin/opportunities/seedWipGeneratedCourseTypes'
import {
  loadAllCourseOpportunities,
  replaceOpportunityNested,
} from '@/lib/admin/opportunities/supabaseOpportunities'

export const dynamic = 'force-dynamic'

async function buildPlan(supabase: NonNullable<ReturnType<typeof getAdminCoursesSupabase>>) {
  const opportunities = await loadAllCourseOpportunities(supabase)
  const planned = planWipGeneratedCourseTypeOperations({ opportunities })
  return {
    ...planned,
    opportunities,
    totalBefore: opportunities.length,
  }
}

/** GET — dry-run plan (no writes). */
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

/** POST — insert missing WIP course-type rows. */
export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const plan = await buildPlan(supabase)
    let running = plan.opportunities
    const seenKeys = new Set(running.map((o) => canonicalOpportunityTitleKey(o.courseName)))

    let insertedCount = 0
    let skippedDuplicates = 0
    const insertedTitles: string[] = []

    for (const op of plan.operations) {
      if (op.action !== 'create') {
        if (op.action === 'skip') skippedDuplicates += 1
        continue
      }

      assertSafeWipGeneratedInput(op.input)
      const key = canonicalOpportunityTitleKey(op.input.courseName)
      if (seenKeys.has(key) || findExistingOpportunityByTitle(running, op.input.courseName)) {
        skippedDuplicates += 1
        continue
      }

      const row = opportunityInputToInsertRow(op.input)
      const { data, error } = await supabase
        .from('course_opportunities')
        .insert(row)
        .select('id')
        .single()

      if (error || !data?.id) {
        throw new Error(error?.message || `Failed to insert ${op.input.courseName}`)
      }

      await replaceOpportunityNested(supabase, data.id, op.input)
      seenKeys.add(key)
      insertedCount += 1
      insertedTitles.push(op.input.courseName)
      running = [
        ...running,
        {
          id: data.id,
          courseName: op.input.courseName,
        } as (typeof running)[number],
      ]
    }

    const after = await loadAllCourseOpportunities(supabase)
    return NextResponse.json({
      ok: true,
      message: WIP_GENERATED_SEED_MESSAGE,
      inserted_count: insertedCount,
      skipped_duplicates: skippedDuplicates,
      total_before: plan.totalBefore,
      total_after: after.length,
      inserted_sample: insertedTitles.slice(0, 30),
      summary: {
        ...plan.summary,
        inserted_count: insertedCount,
        skipped_duplicates: skippedDuplicates,
        total_before: plan.totalBefore,
        total_after: after.length,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Seed failed' },
      { status: 500 }
    )
  }
}
