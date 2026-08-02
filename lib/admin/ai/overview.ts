import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { listAdminTasks } from './tasks'
import { getAffiliateProviderSummary, getTechnicalChecks } from './metrics'
import { getActiveSiteBrain } from './siteBrain'

export type AdminAiOverview = {
  lastManagerReportAt: string | null
  openTasks: number
  highPriorityTasks: number
  technicalLaunchBlockers: number | null
  technicalLaunchBlockersHint: string
  missingProviderGaps: number | null
  missingProviderGapsHint: string
  siteBrainSource: 'database' | 'defaults'
  siteBrainVersion: number
  siteBrainNote: string | null
  notes: string[]
}

export async function getAdminAiOverview(): Promise<AdminAiOverview> {
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()

  let lastManagerReportAt: string | null = null
  if (supabase) {
    const { data, error } = await supabase
      .from('admin_ai_reports')
      .select('created_at')
      .eq('report_type', 'manager')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) notes.push(`manager report: ${error.message}`)
    else lastManagerReportAt = data?.created_at ? String(data.created_at) : null
  } else {
    notes.push('Supabase not configured — overview limited')
  }

  const [tasksResult, affiliate, checks, brain] = await Promise.all([
    listAdminTasks({}),
    getAffiliateProviderSummary(),
    getTechnicalChecks(),
    getActiveSiteBrain(),
  ])

  const openTasks = tasksResult.ok ? tasksResult.summary.open : 0
  const highPriorityTasks = tasksResult.ok ? tasksResult.summary.highPriority : 0
  if (!tasksResult.ok) notes.push(`tasks: ${tasksResult.error}`)

  const missingRef = checks.find((c) => c.id === 'missing_referral')
  const missingProv = checks.find((c) => c.id === 'missing_provider')
  let technicalLaunchBlockers: number | null = null
  let technicalLaunchBlockersHint =
    'Published courses missing referral URL (revenue/launch risk). Not wired checks are informational only.'
  if (missingRef?.available && missingRef.count != null) {
    technicalLaunchBlockers = missingRef.count
    if (missingProv?.available && (missingProv.count || 0) > 0) {
      technicalLaunchBlockersHint = `${missingRef.count} missing referral URL(s); ${missingProv.count} published course record(s) without provider_name. Route-level gaps are in Affiliate Scout.`
    }
  } else {
    technicalLaunchBlockersHint = 'Not wired yet — could not count missing referral URLs.'
  }

  const missingGaps = affiliate.available
    ? affiliate.missingByRoute.filter((m) => m.missingProvider).length
    : null

  return {
    lastManagerReportAt,
    openTasks,
    highPriorityTasks,
    technicalLaunchBlockers,
    technicalLaunchBlockersHint,
    missingProviderGaps: missingGaps,
    missingProviderGapsHint: affiliate.available
      ? 'Priority routes with no live published course/referral (Affiliate Scout).'
      : 'Not wired yet — affiliate provider summary unavailable.',
    siteBrainSource: brain.source,
    siteBrainVersion: brain.brain.version,
    siteBrainNote:
      brain.source === 'defaults'
        ? brain.message ||
          'Using default Site Brain rules — activate Site Brain in the Site Brain tab.'
        : null,
    notes,
  }
}
