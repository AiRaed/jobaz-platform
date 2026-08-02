import { supabase } from '@/lib/supabase'
import type { ReactionType } from './types'

const MESSAGES: Record<ReactionType, { title: string; body: string; type: string }> = {
  boost: {
    title: 'Someone boosted your post',
    body: 'Your update is getting more visibility on Pulse.',
    type: 'post_boost',
  },
  support: {
    title: 'Someone supported your update',
    body: 'A member encouraged you on Pulse.',
    type: 'post_support',
  },
  useful: {
    title: 'Someone found your post useful',
    body: 'Your post helped someone in the community.',
    type: 'post_useful',
  },
}

export async function notifyPostReaction(params: {
  postId: string
  postAuthorId: string
  actorId: string
  reactionType: ReactionType
}): Promise<void> {
  const { postId, postAuthorId, actorId, reactionType } = params
  if (postAuthorId === actorId) return

  const msg = MESSAGES[reactionType]

  const { error } = await supabase.from('pulse_notifications').insert({
    recipient_id: postAuthorId,
    actor_id: actorId,
    post_id: postId,
    notification_type: msg.type,
    title: msg.title,
    body: msg.body,
  })

  if (error) {
    console.warn('[pulse] notifyPostReaction', error.message)
  }
}
