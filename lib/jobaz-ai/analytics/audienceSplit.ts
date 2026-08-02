import type { AiAudienceSplit } from './types'
import { analyticsDevLog } from './logger'
import { getAnalyticsSupabase } from './supabase'

const EMPTY: AiAudienceSplit = {
  anonymousProfiles: 0,
  authenticatedProfiles: 0,
  anonymousSharePercent: 0,
}

export async function getAiAudienceSplit(): Promise<AiAudienceSplit> {
  const supabase = getAnalyticsSupabase()
  if (!supabase) return EMPTY

  const [anonRes, authRes] = await Promise.all([
    supabase
      .from('ai_user_profiles')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null),
    supabase
      .from('ai_user_profiles')
      .select('*', { count: 'exact', head: true })
      .not('user_id', 'is', null),
  ])

  if (anonRes.error) analyticsDevLog('Anonymous profile count failed', anonRes.error)
  if (authRes.error) analyticsDevLog('Authenticated profile count failed', authRes.error)

  const anonymousProfiles = anonRes.count ?? 0
  const authenticatedProfiles = authRes.count ?? 0
  const total = anonymousProfiles + authenticatedProfiles
  const anonymousSharePercent =
    total > 0 ? Math.round((anonymousProfiles / total) * 1000) / 10 : 0

  return { anonymousProfiles, authenticatedProfiles, anonymousSharePercent }
}
