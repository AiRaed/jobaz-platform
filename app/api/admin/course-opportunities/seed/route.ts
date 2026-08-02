import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { findExistingByName } from '@/lib/admin/opportunities/duplicateUtils'
import { opportunityInputToInsertRow } from '@/lib/admin/opportunities/mappers'
import {
  planSeedOperations,
  summarizeSeedOperations,
} from '@/lib/admin/opportunities/seedPlanningTemplate'
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
    const operations = planSeedOperations(running)
    const summary = summarizeSeedOperations(operations)

    for (const op of operations) {
      const existing = findExistingByName(running, op.input.courseName)

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
      message:
        'Starter planning template imported. Duplicates were skipped and route links were updated.',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to seed planning template' },
      { status: 500 }
    )
  }
}
