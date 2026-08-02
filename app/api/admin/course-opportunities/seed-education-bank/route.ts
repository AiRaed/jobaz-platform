import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { findExistingOpportunityByTitle } from '@/lib/admin/opportunities/titleNormalization'
import { opportunityInputToInsertRow } from '@/lib/admin/opportunities/mappers'
import {
  planWorkInEducationBankOperations,
  summarizeWorkInEducationBankOperations,
  WORK_IN_EDUCATION_SEED_MESSAGE,
} from '@/lib/admin/opportunities/seedWorkInEducationBank'
import {
  loadAllCourseOpportunities,
  replaceOpportunityNested,
  updateOpportunityRecord,
} from '@/lib/admin/opportunities/supabaseOpportunities'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    let running = await loadAllCourseOpportunities(supabase)
    const operations = planWorkInEducationBankOperations(running)
    const summary = summarizeWorkInEducationBankOperations(operations)

    for (const op of operations) {
      if (op.action === 'skip') continue

      const existing = findExistingOpportunityByTitle(running, op.input.courseName)

      if (existing) {
        await updateOpportunityRecord(supabase, existing.id, op.input)
        running = await loadAllCourseOpportunities(supabase)
        continue
      }

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
      running = await loadAllCourseOpportunities(supabase)
    }

    const opportunities = await loadAllCourseOpportunities(supabase)

    return NextResponse.json({
      ok: true,
      summary,
      total: opportunities.length,
      message: WORK_IN_EDUCATION_SEED_MESSAGE,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to seed Work in my Education bank' },
      { status: 500 }
    )
  }
}
