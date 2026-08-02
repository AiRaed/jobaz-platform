/**
 * Career assessment domain types for JobAZ AI.
 * Shared by engines, providers, and UI — stable across backend swaps.
 */

export type SituationAnswer =
  | 'need_job_quickly'
  | 'better_job'
  | 'no_uk_experience'
  | 'limited_english'
  | 'change_career'

export type ExperienceAnswer = 'none' | 'some' | 'strong' | 'outside_uk'

export type EnglishAnswer = 'beginner' | 'basic' | 'intermediate' | 'good'

export type CvAnswer = 'yes' | 'no' | 'needs_improvement'

export type HelpNextAnswer =
  | 'find_jobs'
  | 'build_cv'
  | 'improve_skills'
  | 'interviews'
  | 'understand_options'

/** User answers from the 5-step career assessment. */
export interface AssessmentAnswers {
  situation: SituationAnswer
  experience: ExperienceAnswer
  english: EnglishAnswer
  cv: CvAnswer
  helpNext: HelpNextAnswer
}

/** Internal path category used by the assessment engine. */
export type CareerPathType =
  | 'quick_entry'
  | 'career_upgrade'
  | 'uk_transition'
  | 'skills_development'
  | 'interview_preparation'
  | 'career_change'

export interface RecommendedTool {
  id: string
  name: string
  description: string
  href: string
}

export interface CareerAssessmentScores {
  urgencyScore: number
  englishScore: number
  confidenceScore: number
  experienceScore: number
  cvReadinessScore: number
  directionScore: number
}

/** Structured output from any career assessment provider. */
export interface CareerAssessmentResult {
  recommendedPath: string
  summary: string
  suggestedJobs: string[]
  nextSteps: string[]
  recommendedTools: RecommendedTool[]
  /** Internal path category — not shown in UI unless needed later */
  pathType?: CareerPathType
  /** Internal scoring snapshot — for analytics or future AI context */
  scores?: CareerAssessmentScores
}
