import { supabase } from '@/lib/supabase'
import type { ReactionType } from './types'
import { calculatePostScoreFromRows } from './scoring'

const REACTION_TABLE = 'feed_post_reactions'

/**
 * Future Pulse sections — reusable query helpers (not wired to pages yet).
 */

export async function fetchPostsByReactionVolume(
  reactionType: ReactionType,
  limit = 20
): Promise<{ postId: string; count: number }[]> {
  const { data, error } = await supabase
    .from(REACTION_TABLE)
    .select('post_id')
    .eq('reaction_type', reactionType)
  if (error || !data?.length) return []

  const counts = new Map<string, number>()
  for (const row of data) {
    const postId = row.post_id
    counts.set(postId, (counts.get(postId) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([postId, count]) => ({ postId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export const fetchMostBoostedPosts = (limit?: number) => fetchPostsByReactionVolume('boost', limit)
export const fetchMostUsefulPosts = (limit?: number) => fetchPostsByReactionVolume('useful', limit)
export const fetchMostSupportedPosts = (limit?: number) => fetchPostsByReactionVolume('support', limit)

export async function fetchPostsByEngagementScore(limit = 20): Promise<{ postId: string; score: number }[]> {
  const { data, error } = await supabase.from(REACTION_TABLE).select('post_id, reaction_type')
  if (error || !data?.length) return []

  const byPost = new Map<string, { reaction_type: string }[]>()
  for (const row of data) {
    const list = byPost.get(row.post_id) ?? []
    list.push({ reaction_type: row.reaction_type })
    byPost.set(row.post_id, list)
  }

  return [...byPost.entries()]
    .map(([postId, rows]) => ({ postId, score: calculatePostScoreFromRows(rows) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
