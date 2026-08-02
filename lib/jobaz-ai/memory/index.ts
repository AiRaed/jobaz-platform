/**
 * JobAZ AI Memory — assessment persistence, user profiles, and behaviour tracking.
 * Foundation for personalization, returning-user context, private AI context, and analytics.
 */

export { getOrCreateAnonymousId, getOrCreateSessionId } from './identity'
export { trackAiCareerEvent } from './events'
export { saveAiCareerAssessment } from './assessments'
export { saveUnifiedCareerAssessment } from './saveUnifiedAssessment'
export type { SaveUnifiedAssessmentInput } from './saveUnifiedAssessment'
export type { SaveAiCareerAssessmentInput } from './assessments'
export { updateAiUserProfileFromAssessment } from './profile'
export { mergeAnonymousAiProfileOnAuth } from './mergeAnonymousProfile'
export { fetchLatestAssessmentForUser } from './loadUserAssessment'
export type { UserAssessmentRecord } from './loadUserAssessment'
export type { UpdateAiUserProfileInput } from './profile'
export { computeEngagementScore, computeReadinessScore } from './profileScoring'
export type { EngagementSignals } from './profileScoring'
export {
  AI_CAREER_SOURCE,
  AI_CAREER_PAGE,
  type AiCareerEventName,
  type AiCareerEventMetadata,
} from './types'
