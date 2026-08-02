import type { TrainingMentionStatus } from './types'

/**
 * Trust-safe wording for training mentions.
 * Only "trained / qualified / certified / completed" when status === completed.
 */
export function incompleteTrainingPhrase(
  trainingTitle: string,
  status: TrainingMentionStatus
): string {
  const title = trainingTitle.trim() || 'recommended training'
  if (status === 'in_progress') return `working towards ${title}`
  if (status === 'interested') return `planning to complete ${title}`
  if (status === 'none') return `interested in progressing toward ${title} later`
  return `building experience before completing ${title}`
}

export function trainedClaim(trainingTitle: string, status: TrainingMentionStatus): string | null {
  if (status !== 'completed') return null
  return `${trainingTitle.trim()} trained`
}

export function canClaimCompleted(status: TrainingMentionStatus): boolean {
  return status === 'completed'
}

/**
 * Affiliate-first CTA mode — never show fake Apply Now without a referral URL.
 */
export function resolveCourseCtaMode(input: {
  referralUrl?: string | null
  officialUrl?: string | null
  published?: boolean
}): 'apply_now' | 'course_type' | 'coming_soon' {
  if (input.referralUrl?.trim()) return 'apply_now'
  if (input.officialUrl?.trim() || input.published) return 'course_type'
  return 'coming_soon'
}
