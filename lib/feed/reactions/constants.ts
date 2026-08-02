import type { ReactionType } from './types'

export const REACTION_META: Record<
  ReactionType,
  { emoji: string; label: string; shortLabel: string; glow: string; active: string }
> = {
  boost: {
    emoji: '🚀',
    label: 'Boost',
    shortLabel: 'Boost',
    glow: 'shadow-[0_0_12px_rgba(139,92,246,0.45)]',
    active: 'border-violet-400/50 bg-violet-500/15 text-violet-200',
  },
  support: {
    emoji: '🤝',
    label: 'Support',
    shortLabel: 'Support',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    active: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200',
  },
  useful: {
    emoji: '💡',
    label: 'Useful',
    shortLabel: 'Useful',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]',
    active: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
  },
}

export const REACTION_SCORE_WEIGHTS = {
  boost: 5,
  useful: 3,
  support: 2,
} as const
