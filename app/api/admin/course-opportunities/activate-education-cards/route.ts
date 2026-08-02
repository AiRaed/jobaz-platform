import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  planActivateWorkInEducationCards,
  buildWorkInEducationCardActivationRow,
  formatActivateEducationCardsMessage,
} from '@/lib/admin/opportunities/activateWorkInEducationCards'
import { loadAllCourseOpportunities } from '@/lib/admin/opportunities/supabaseOpportunities'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const opportunities = await loadAllCourseOpportunities(supabase)
    const plan = planActivateWorkInEducationCards(opportunities)

    for (const opp of plan.toUpdate) {
      const row = buildWorkInEducationCardActivationRow(opp)
      const { error } = await supabase.from('course_opportunities').update(row).eq('id', opp.id)
      if (error) throw new Error(error.message)

      const preferred = opp.providers.find((p) => p.isPreferred) ?? opp.providers[0]
      if (preferred) {
        const providerStatus = (preferred.providerStatus ?? '').trim()
        if (!providerStatus || providerStatus === 'Unknown') {
          await supabase
            .from('course_opportunity_providers')
            .update({
              provider_status: 'Need check',
              updated_at: new Date().toISOString(),
            })
            .eq('id', preferred.id)
        }
      }
    }

    const refreshed = await loadAllCourseOpportunities(supabase)

    return NextResponse.json({
      ok: true,
      summary: plan.summary,
      message: formatActivateEducationCardsMessage(plan.summary),
      opportunities: refreshed,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to activate recommendation cards' },
      { status: 500 }
    )
  }
}
