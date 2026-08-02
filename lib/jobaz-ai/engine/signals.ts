/**
 * Unified AI signal rules — readiness/engagement deltas and journey labels.
 */

import type { AiSignalRule, AiSignalType } from './types'

export const AI_SIGNAL_RULES: Record<AiSignalType, AiSignalRule> = {
  cv_created: {
    readiness: 15,
    engagement: 5,
    journeyLabel: 'Created your CV',
    dedupe: 'once',
    patch: { cv_status: 'yes' },
  },
  cv_updated: {
    readiness: 5,
    engagement: 2,
    journeyLabel: 'Updated your CV',
    dedupe: 'daily',
    patch: { cv_status: 'needs_improvement' },
  },
  cv_quality_improved: {
    readiness: 10,
    engagement: 4,
    journeyLabel: 'CV improved',
    dedupe: 'daily',
    patch: { cv_status: 'yes' },
    metaKey: 'cvQualityImprovements',
  },
  cv_exported: {
    readiness: 3,
    engagement: 4,
    journeyLabel: 'Exported CV',
    dedupe: 'daily',
    metaKey: 'cvQualityImprovements',
  },
  writing_review_completed: {
    readiness: 5,
    engagement: 4,
    journeyLabel: 'Completed a writing review',
    dedupe: 'daily',
    metaKey: 'writingReviewCount',
  },
  writing_review_used: {
    readiness: 5,
    engagement: 3,
    journeyLabel: 'Used Writing Review',
    dedupe: 'daily',
    metaKey: 'writingReviewCount',
  },
  grammar_improved: {
    readiness: 4,
    engagement: 3,
    journeyLabel: 'English confidence improved',
    dedupe: 'daily',
    metaKey: 'writingReviewCount',
  },
  professional_writing_improved: {
    readiness: 5,
    engagement: 4,
    journeyLabel: 'Professional writing improved',
    dedupe: 'daily',
    metaKey: 'writingReviewCount',
  },
  interview_completed: {
    readiness: 14,
    engagement: 10,
    journeyLabel: 'Completed interview training',
    dedupe: 'daily',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  interview_started: {
    readiness: 1,
    engagement: 2,
    journeyLabel: 'Started interview training',
    dedupe: 'daily',
    patch: { dominant_goal: 'interviews' },
  },
  interview_question_answered: {
    readiness: 3,
    engagement: 4,
    journeyLabel: 'Practiced interview answers',
    dedupe: 'once',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  interview_training_completed: {
    readiness: 10,
    engagement: 10,
    journeyLabel: 'Practiced interview training',
    dedupe: 'once',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  voice_training_completed: {
    readiness: 10,
    engagement: 12,
    journeyLabel: 'Finished voice interview session',
    dedupe: 'once',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  mock_interview_completed: {
    readiness: 12,
    engagement: 10,
    journeyLabel: 'Completed mock interview',
    dedupe: 'once',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  confidence_improved: {
    readiness: 6,
    engagement: 5,
    journeyLabel: 'Built interview confidence',
    dedupe: 'daily',
    metaKey: 'interviewSessionsCount',
  },
  confidence_practice_completed: {
    readiness: 6,
    engagement: 6,
    journeyLabel: 'Confidence practice completed',
    dedupe: 'daily',
    metaKey: 'interviewSessionsCount',
    patch: { dominant_goal: 'interviews' },
  },
  jobs_viewed: {
    engagement: 2,
    journeyLabel: 'Explored job listings',
    dedupe: 'daily',
  },
  job_detail_viewed: {
    engagement: 2,
    journeyLabel: 'Viewed a job listing',
    dedupe: 'once',
  },
  jobs_saved: {
    readiness: 3,
    engagement: 5,
    journeyLabel: 'Saved a job to your list',
    dedupe: 'once',
    metaKey: 'jobsSavedCount',
    patch: { dominant_goal: 'find_jobs' },
  },
  jobs_applied: {
    readiness: 12,
    engagement: 10,
    journeyLabel: 'Applied to jobs',
    dedupe: 'once',
    metaKey: 'jobsAppliedCount',
    patch: { dominant_goal: 'find_jobs' },
  },
  applied_job_saved: {
    readiness: 5,
    engagement: 8,
    journeyLabel: 'Saved an applied job',
    dedupe: 'once',
    metaKey: 'jobsAppliedCount',
    patch: { dominant_goal: 'find_jobs' },
  },
  skill_path_viewed: {
    engagement: 2,
    journeyLabel: 'Explored skill paths',
    dedupe: 'daily',
  },
  skill_path_started: {
    readiness: 6,
    engagement: 5,
    journeyLabel: 'Started a skill path',
    dedupe: 'once',
    patch: { dominant_goal: 'improve_skills' },
  },
  skill_goal_selected: {
    readiness: 4,
    engagement: 4,
    journeyLabel: 'Selected a skill goal',
    dedupe: 'once',
    patch: { dominant_goal: 'improve_skills' },
  },
  lesson_completed: {
    readiness: 8,
    engagement: 6,
    journeyLabel: 'Completed a learning step',
    dedupe: 'once',
    metaKey: 'lessonsCompleted',
    patch: { dominant_goal: 'improve_skills' },
  },
  ai_assessment_completed: {
    readiness: 0,
    engagement: 10,
    journeyLabel: 'Completed AI Career Path assessment',
    dedupe: 'none',
  },
  ai_dashboard_tool_clicked: {
    engagement: 3,
    journeyLabel: 'Continued your AI career path',
    dedupe: 'daily',
  },
  flow_abandoned: {
    engagement: -5,
    journeyLabel: 'Restarted career path flow',
    dedupe: 'daily',
  },
}

/** Legacy progression event names → unified signals. */
export const LEGACY_SIGNAL_MAP: Partial<Record<string, AiSignalType>> = {
  job_listings_viewed: 'jobs_viewed',
  cv_created: 'cv_created',
  cv_updated: 'cv_updated',
  writing_review_used: 'writing_review_used',
  interview_training_completed: 'interview_training_completed',
  voice_training_completed: 'voice_training_completed',
  confidence_practice_completed: 'voice_training_completed',
  applied_job_saved: 'applied_job_saved',
  ai_dashboard_tool_clicked: 'ai_dashboard_tool_clicked',
  flow_abandoned: 'flow_abandoned',
}

export function normalizeSignal(signal: AiSignalType | string): AiSignalType {
  const mapped = LEGACY_SIGNAL_MAP[signal]
  if (mapped) return mapped
  if (signal in AI_SIGNAL_RULES) return signal as AiSignalType
  return 'ai_dashboard_tool_clicked'
}
