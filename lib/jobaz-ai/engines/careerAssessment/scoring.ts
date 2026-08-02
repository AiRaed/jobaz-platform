import type { AssessmentAnswers, CareerAssessmentScores } from '../../types'

const SITUATION_URGENCY: Record<AssessmentAnswers['situation'], number> = {
  need_job_quickly: 95,
  no_uk_experience: 75,
  limited_english: 70,
  better_job: 35,
  change_career: 40,
}

const ENGLISH_SCORE: Record<AssessmentAnswers['english'], number> = {
  beginner: 15,
  basic: 35,
  intermediate: 60,
  good: 90,
}

const EXPERIENCE_SCORE: Record<AssessmentAnswers['experience'], number> = {
  none: 10,
  some: 45,
  outside_uk: 50,
  strong: 88,
}

const CV_SCORE: Record<AssessmentAnswers['cv'], number> = {
  no: 12,
  needs_improvement: 48,
  yes: 82,
}

const HELP_DIRECTION: Record<AssessmentAnswers['helpNext'], number> = {
  find_jobs: 72,
  build_cv: 58,
  improve_skills: 68,
  interviews: 78,
  understand_options: 32,
}

/**
 * Derives normalised scores (0–100) from assessment answers.
 * Used by the rule-based engine to pick and personalise path profiles.
 */
export function calculateCareerAssessmentScores(
  answers: AssessmentAnswers
): CareerAssessmentScores {
  const urgencyScore = SITUATION_URGENCY[answers.situation]
  const englishScore = ENGLISH_SCORE[answers.english]
  const experienceScore = EXPERIENCE_SCORE[answers.experience]
  const cvReadinessScore = CV_SCORE[answers.cv]
  const directionScore = HELP_DIRECTION[answers.helpNext]

  const languageBarrier =
    answers.english === 'beginner' || answers.english === 'basic' ? 22 : 0
  const experienceGap =
    answers.experience === 'none' || answers.experience === 'outside_uk' ? 18 : 0
  const cvGap = answers.cv === 'no' ? 20 : answers.cv === 'needs_improvement' ? 10 : 0

  const confidenceBase =
    englishScore * 0.4 + experienceScore * 0.35 + cvReadinessScore * 0.25
  const confidenceScore = Math.max(
    8,
    Math.min(95, Math.round(confidenceBase - languageBarrier - experienceGap - cvGap))
  )

  return {
    urgencyScore,
    englishScore,
    confidenceScore,
    experienceScore,
    cvReadinessScore,
    directionScore,
  }
}
