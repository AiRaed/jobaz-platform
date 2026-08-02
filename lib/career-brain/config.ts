/**
 * Career Brain feature flag — old scoring path remains when disabled.
 */
export function isCareerBrainEnabled(): boolean {
  const raw = (process.env.CAREER_BRAIN_ENABLED ?? 'true').trim().toLowerCase()
  return raw !== 'false' && raw !== '0'
}

export const CAREER_BRAIN_EXTRACT_FEATURE = 'career-brain-extract'
export const CAREER_BRAIN_RECOMMEND_FEATURE = 'career-brain-recommend'
export const CAREER_BRAIN_QUESTION_FEATURE = 'career-brain-question'

/** Minimum adaptive questions before results (unless urgent + confident). */
export const MIN_QUESTIONS_BEFORE_RESULT = 4

/** Profile confidence threshold to allow finalization. */
export const PROFILE_CONFIDENCE_THRESHOLD = 0.62
