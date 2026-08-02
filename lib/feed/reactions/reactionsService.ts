import { supabase } from '@/lib/supabase'
import { notifyPostReaction } from './notifications'

async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}
import {
  EMPTY_REACTION_COUNTS,
  EMPTY_USER_REACTIONS,
  isReactionType,
  type PostReactionCounts,
  type PostUserReactions,
  type ReactionRow,
  type ReactionType,
} from './types'

const TABLE = 'feed_post_reactions'

export function buildReactionMaps(
  rows: ReactionRow[],
  userId: string | null
): {
  countsByPost: Map<string, PostReactionCounts>
  userByPost: Map<string, PostUserReactions>
} {
  const countsByPost = new Map<string, PostReactionCounts>()
  const userByPost = new Map<string, PostUserReactions>()

  for (const row of rows) {
    if (!isReactionType(row.reaction_type)) continue

    const counts = countsByPost.get(row.post_id) ?? { ...EMPTY_REACTION_COUNTS }
    counts[row.reaction_type]++
    countsByPost.set(row.post_id, counts)

    if (userId && row.user_id === userId) {
      const user = userByPost.get(row.post_id) ?? { ...EMPTY_USER_REACTIONS }
      user[row.reaction_type] = true
      userByPost.set(row.post_id, user)
    }
  }

  return { countsByPost, userByPost }
}

export function getCountsForPost(
  countsByPost: Map<string, PostReactionCounts>,
  postId: string
): PostReactionCounts {
  return countsByPost.get(postId) ?? { ...EMPTY_REACTION_COUNTS }
}

export function getUserReactionsForPost(
  userByPost: Map<string, PostUserReactions>,
  postId: string
): PostUserReactions {
  return userByPost.get(postId) ?? { ...EMPTY_USER_REACTIONS }
}

export async function fetchReactionsForPosts(postIds: string[]): Promise<ReactionRow[]> {
  if (postIds.length === 0) return []

  const { data, error } = await supabase
    .from(TABLE)
    .select('post_id, user_id, reaction_type')
    .in('post_id', postIds)

  if (error) {
    console.error('[pulse] fetchReactionsForPosts', error.message)
    return []
  }

  return (data ?? []) as ReactionRow[]
}

export async function getPostReactionCounts(postId: string): Promise<PostReactionCounts> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('reaction_type')
    .eq('post_id', postId)

  if (error) throw new Error(error.message)

  const counts = { ...EMPTY_REACTION_COUNTS }
  for (const row of data ?? []) {
    if (isReactionType(row.reaction_type)) counts[row.reaction_type]++
  }
  return counts
}

export async function getUserPostReactions(postId: string): Promise<PostUserReactions> {
  const userId = await getSessionUserId()
  if (!userId) return { ...EMPTY_USER_REACTIONS }

  const { data, error } = await supabase
    .from(TABLE)
    .select('reaction_type')
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  const user = { ...EMPTY_USER_REACTIONS }
  for (const row of data ?? []) {
    if (isReactionType(row.reaction_type)) user[row.reaction_type] = true
  }
  return user
}

export async function toggleReaction(
  postId: string,
  reactionType: ReactionType
): Promise<{ active: boolean; counts: PostReactionCounts; user: PostUserReactions }> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Sign in to react on Pulse.')

  const { data: existing } = await supabase
    .from(TABLE)
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from(TABLE).delete().eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from(TABLE).insert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType,
    })
    if (error) throw new Error(error.message)

    const { data: post } = await supabase.from('feed_posts').select('author_id').eq('id', postId).maybeSingle()
    if (post?.author_id) {
      void notifyPostReaction({
        postId,
        postAuthorId: post.author_id,
        actorId: userId,
        reactionType,
      })
    }
  }

  const [counts, user] = await Promise.all([
    getPostReactionCounts(postId),
    getUserPostReactions(postId),
  ])

  return { active: !existing, counts, user }
}
