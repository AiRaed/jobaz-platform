/**
 * Smart recommendation engine — prioritises tools from profile state.
 */

import { TOOL_CATALOG } from '@/lib/jobaz-ai/engines/careerAssessment/toolCatalog'
import { normalizeGoal } from '@/lib/jobaz-ai/engines/careerAssessment/profileSignals'
import type { AiUserProfile, DashboardRecommendation } from '@/lib/jobaz-ai/profile/types'
import type { ProfileEngineRow } from './types'
import { isEnglishConfidenceStrong } from './englishConfidence'
import {
  hasJobSearchActivity,
  isLowJobActivity,
  shouldRecommendInterviewAfterApplications,
} from './jobSearchActivity'
import { hasActiveSkillLearning } from './skillLearning'

function toolRec(
  key: keyof typeof TOOL_CATALOG,
  type: DashboardRecommendation['type'],
  description: string,
  priority: number
): DashboardRecommendation & { priority: number } {
  const t = TOOL_CATALOG[key]
  return {
    id: `rec_${t.id}`,
    type,
    title: t.name,
    description,
    href: t.href,
    toolId: t.id,
    toolName: t.name,
    priority,
  }
}

function dedupeRecs(
  items: (DashboardRecommendation & { priority: number })[]
): DashboardRecommendation[] {
  const seen = new Set<string>()
  return items
    .sort((a, b) => a.priority - b.priority)
    .filter((item) => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })
    .map(({ priority: _p, ...rest }) => rest)
}

export function generateSmartRecommendations(
  profile: AiUserProfile | ProfileEngineRow
): DashboardRecommendation[] {
  const cvStatus = 'cvStatus' in profile ? profile.cvStatus : profile.cv_status
  const englishLevel =
    'englishLevel' in profile ? profile.englishLevel : profile.english_level
  const dominantGoal =
    'dominantGoal' in profile ? profile.dominantGoal : profile.dominant_goal
  const readiness =
    'readinessScore' in profile ? profile.readinessScore : (profile.readiness_score ?? 0)
  const weakest =
    ('weakestArea' in profile ? profile.weakestArea : profile.weakest_area) ?? ''
  const meta =
    'progressionMeta' in profile ? profile.progressionMeta : profile.progression_meta
  const jobsApplied = meta?.jobsAppliedCount ?? 0
  const jobsSaved = meta?.jobsSavedCount ?? 0
  const hasJobActivity = hasJobSearchActivity(meta ?? undefined)

  const goal = normalizeGoal(dominantGoal)
  const recs: (DashboardRecommendation & { priority: number })[] = []
  const lowEnglish =
    englishLevel === 'beginner' || englishLevel === 'basic'
  const englishStrong = isEnglishConfidenceStrong(meta ?? undefined, englishLevel)
  const weakInterview =
    weakest.toLowerCase().includes('interview') || goal === 'interviews'

  if (hasJobActivity && shouldRecommendInterviewAfterApplications(meta ?? undefined, readiness)) {
    recs.push(
      toolRec(
        'interviewCoach',
        'interview',
        'You are applying to jobs — prepare for interviews next.',
        1
      )
    )
  }

  if (!hasJobActivity) {
    recs.push(
      toolRec('jobFinder', 'jobs', 'Search and save UK roles that match your profile.', 1)
    )
  }

  if (englishStrong && hasJobActivity) {
    recs.push(
      toolRec('jobFinder', 'jobs', 'Your English is improving — explore matching UK roles.', 1),
      toolRec('interviewCoach', 'interview', 'Practice interviews now that your writing is stronger.', 2)
    )
  }

  if (lowEnglish && weakInterview && !englishStrong) {
    recs.push(
      toolRec('interviewCoach', 'interview', 'Build interview confidence with practice.', 3),
      toolRec('writingReview', 'english', 'Strengthen professional English for applications.', 4)
    )
  }

  if (readiness >= 65 && jobsApplied >= 3) {
    recs.push(
      toolRec('jobFinder', 'jobs', 'You are ready — focus on finding and applying to roles.', 1)
    )
  }

  if (cvStatus === 'no' || cvStatus === 'needs_improvement') {
    recs.push(
      toolRec('cvBuilder', 'cv', 'Improve your CV before applying widely.', 2)
    )
  }

  if (lowEnglish && !englishStrong) {
    recs.push(
      toolRec('writingReview', 'english', 'Improve professional English in applications.', 5)
    )
  }

  if (goal === 'find_jobs') {
    recs.push(
      toolRec('jobFinder', 'jobs', 'Search UK jobs matching your profile.', 4)
    )
  }

  if (goal === 'improve_skills') {
    recs.push(
      toolRec('buildYourPath', 'skills', 'Explore realistic UK skill paths.', 2)
    )
  }

  if (hasActiveSkillLearning(meta ?? undefined)) {
    recs.push(
      toolRec(
        'cvBuilder',
        'cv',
        'Turn your new skills into a CV that highlights your training.',
        2
      ),
      toolRec(
        'jobFinder',
        'jobs',
        'Search for entry-level roles that match your skill path.',
        3
      )
    )
  }

  if (weakInterview || readiness >= 55) {
    recs.push(
      toolRec('interviewCoach', 'interview', 'Practice interviews and build confidence.', 5)
    )
  }

  if (recs.length === 0) {
    recs.push(
      toolRec('ukCareerAssistant', 'general', 'Get guided support for your next step.', 10)
    )
  }

  return dedupeRecs(recs).slice(0, 4)
}

export function generateNextAction(
  profile: AiUserProfile | ProfileEngineRow,
  recommendations: DashboardRecommendation[]
): string {
  const stored =
    'nextAction' in profile ? profile.nextAction : profile.next_action
  if (stored?.trim()) return stored

  const weakest =
    ('weakestArea' in profile ? profile.weakestArea : profile.weakest_area) ??
    'your next career step'
  const top = recommendations[0]
  if (top) {
    return `Recommended next action: address ${weakest.toLowerCase()} with ${top.toolName}.`
  }
  return 'Recommended next action: continue your AI career path in JobAZ.'
}

export function generateRecommendationReason(
  profile: AiUserProfile | ProfileEngineRow
): string {
  const stored =
    'recommendationReason' in profile
      ? profile.recommendationReason
      : profile.recommendation_reason
  if (stored?.trim()) return stored

  const path =
    ('lastRecommendedPath' in profile
      ? profile.lastRecommendedPath
      : profile.last_recommended_path) ?? 'your career path'
  const readiness =
    'readinessScore' in profile ? profile.readinessScore : (profile.readiness_score ?? 0)

  return `JobAZ is prioritising ${path} based on your readiness (${readiness}/100) and recent activity across tools.`
}

export function generateWeeklyFocus(
  profile: AiUserProfile | ProfileEngineRow,
  options?: { forceRegenerate?: boolean }
): string {
  if (!options?.forceRegenerate) {
    const stored =
      'weeklyFocus' in profile
        ? (profile as AiUserProfile & { weeklyFocus?: string }).weeklyFocus
        : profile.weekly_focus
    if (stored?.trim()) return stored
  }

  const cvStatus = 'cvStatus' in profile ? profile.cvStatus : profile.cv_status
  const meta =
    'progressionMeta' in profile ? profile.progressionMeta : profile.progression_meta
  const weakest =
    ('weakestArea' in profile ? profile.weakestArea : profile.weakest_area) ??
    'career readiness'

  if (
    (cvStatus === 'yes' || cvStatus === 'needs_improvement') &&
    isLowJobActivity(meta ?? undefined)
  ) {
    return 'This week: your CV is ready — save and apply to 3 suitable roles in Job Finder.'
  }

  if (hasJobSearchActivity(meta ?? undefined)) {
    const applied = meta?.jobsAppliedCount ?? 0
    if (applied >= 1) {
      return 'This week: follow up on applications and practice interviews with Interview Coach.'
    }
    return 'This week: apply to saved roles and tailor your CV for each application.'
  }

  if (hasActiveSkillLearning(meta ?? undefined)) {
    return 'This week: turn your learning into applications — build your CV and search for matching roles.'
  }

  return `This week: focus on ${weakest.toLowerCase()} with one JobAZ tool each day.`
}

export function generateEngineInsightsFromProfile(
  profile: AiUserProfile
): {
  recommendations: DashboardRecommendation[]
  nextAction: string
  recommendationReason: string
  weeklyFocus: string
} {
  const recommendations = generateSmartRecommendations(profile)
  return {
    recommendations,
    nextAction: generateNextAction(profile, recommendations),
    recommendationReason: generateRecommendationReason(profile),
    weeklyFocus: generateWeeklyFocus(profile),
  }
}
