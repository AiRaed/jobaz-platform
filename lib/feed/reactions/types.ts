export const REACTION_TYPES = ['boost', 'support', 'useful'] as const

export type ReactionType = (typeof REACTION_TYPES)[number]

export type PostReactionCounts = {
  boost: number
  support: number
  useful: number
}

export type PostUserReactions = {
  boost: boolean
  support: boolean
  useful: boolean
}

export type ReactionRow = {
  post_id: string
  user_id: string
  reaction_type: string
}

export const EMPTY_REACTION_COUNTS: PostReactionCounts = {
  boost: 0,
  support: 0,
  useful: 0,
}

export const EMPTY_USER_REACTIONS: PostUserReactions = {
  boost: false,
  support: false,
  useful: false,
}

export function isReactionType(value: string): value is ReactionType {
  return REACTION_TYPES.includes(value as ReactionType)
}

export function totalReactions(counts: PostReactionCounts): number {
  return counts.boost + counts.support + counts.useful
}
