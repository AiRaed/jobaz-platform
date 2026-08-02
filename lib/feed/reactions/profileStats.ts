import { supabase } from '@/lib/supabase'
import type { PostReactionCounts } from './types'
import { EMPTY_REACTION_COUNTS } from './types'

export type ProfileReactionStats = {
  totalBoostsReceived: number
  totalUsefulReceived: number
  totalSupportReceived: number
  helpfulContributions: number
  communitySupportReceived: number
}

/**
 * Aggregates reactions on posts authored by a user (profile header / future stats).
 */
export async function getProfileReactionStats(userId: string): Promise<ProfileReactionStats> {
  const { data: posts } = await supabase.from('feed_posts').select('id').eq('author_id', userId)
  const postIds = (posts ?? []).map((p) => p.id)
  if (postIds.length === 0) {
    return {
      totalBoostsReceived: 0,
      totalUsefulReceived: 0,
      totalSupportReceived: 0,
      helpfulContributions: 0,
      communitySupportReceived: 0,
    }
  }

  const { data: reactions } = await supabase
    .from('feed_post_reactions')
    .select('reaction_type')
    .in('post_id', postIds)

  const counts: PostReactionCounts = { ...EMPTY_REACTION_COUNTS }
  for (const r of reactions ?? []) {
    if (r.reaction_type === 'boost') counts.boost++
    else if (r.reaction_type === 'support') counts.support++
    else if (r.reaction_type === 'useful') counts.useful++
  }

  return {
    totalBoostsReceived: counts.boost,
    totalUsefulReceived: counts.useful,
    totalSupportReceived: counts.support,
    helpfulContributions: counts.useful,
    communitySupportReceived: counts.support,
  }
}
