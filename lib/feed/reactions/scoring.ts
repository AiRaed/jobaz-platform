import { REACTION_SCORE_WEIGHTS } from './constants'
import type { PostReactionCounts } from './types'

/**
 * Ranking signal for future Pulse feed ordering.
 * Boost = visibility, Useful = relevance, Support = community encouragement.
 */
export function calculatePostScore(counts: PostReactionCounts): number {
  return (
    counts.boost * REACTION_SCORE_WEIGHTS.boost +
    counts.useful * REACTION_SCORE_WEIGHTS.useful +
    counts.support * REACTION_SCORE_WEIGHTS.support
  )
}

export function calculatePostScoreFromRows(
  rows: { reaction_type: string }[]
): number {
  const counts = { boost: 0, support: 0, useful: 0 }
  for (const row of rows) {
    if (row.reaction_type === 'boost') counts.boost++
    else if (row.reaction_type === 'support') counts.support++
    else if (row.reaction_type === 'useful') counts.useful++
  }
  return calculatePostScore(counts)
}
