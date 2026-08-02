/**
 * Rule-based dashboard recommendations from ai_user_profiles.
 *
 * Future: AI-generated plans, memory context, and predictive models.
 */

import { TOOL_CATALOG } from '@/lib/jobaz-ai/engines/careerAssessment/toolCatalog'
import {
  getStrongestAreaFromSignals,
  getWeakestAreaFromSignals,
  normalizeGoal,
} from '@/lib/jobaz-ai/engines/careerAssessment/profileSignals'
import { generateSmartRecommendations } from '@/lib/jobaz-ai/engine/generateInsights'
import { EVOLUTION_STAGE_LABELS } from '@/lib/jobaz-ai/engine/evolveStage'
import { PROGRESS_TREND_LABELS } from './careerStage'
import type { AiUserProfile, DashboardAiInsights, DashboardRecommendation } from './types'

const CAREER_PATH_HREF = '/uk-career-assistant'

const GOAL_LABELS: Record<string, string> = {
  find_jobs: 'finding UK jobs',
  build_cv: 'building your CV',
  improve_skills: 'improving your skills',
  interviews: 'interview preparation',
  prepare_interviews: 'interview preparation',
  understand_options: 'exploring career options',
}

function profileToSignals(profile: AiUserProfile) {
  return {
    cvStatus: profile.cvStatus,
    englishLevel: profile.englishLevel,
    experienceLevel: profile.experienceLevel,
    dominantGoal: profile.dominantGoal,
    readinessScore: profile.readinessScore,
  }
}

export function getStrongestArea(profile: AiUserProfile): string {
  if (profile.strongestArea) return profile.strongestArea
  return getStrongestAreaFromSignals(profileToSignals(profile))
}

/** Priority-ordered gap used to pick the Continue CTA destination. */
export function getWeakestArea(profile: AiUserProfile): string {
  if (profile.weakestArea) return profile.weakestArea
  return getWeakestAreaFromSignals(profileToSignals(profile))
}

/** Smart Continue button: route to the best next JobAZ tool from profile signals. */
export function resolveContinuePathFromProfile(profile: AiUserProfile): {
  href: string
  toolId: string
  toolName: string
  weakestArea: string
} {
  const weakestArea = getWeakestArea(profile)

  if (weakestArea === 'English confidence') {
    const t = TOOL_CATALOG.writingReview
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (weakestArea === 'CV quality') {
    const t = TOOL_CATALOG.cvBuilder
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (weakestArea === 'UK work experience') {
    const t = TOOL_CATALOG.buildYourPath
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (weakestArea === 'Interview practice') {
    const t = TOOL_CATALOG.interviewCoach
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }

  const goal = normalizeGoal(profile.dominantGoal)
  if (profile.readinessScore >= 70) {
    const t = TOOL_CATALOG.interviewCoach
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (goal === 'find_jobs') {
    const t = TOOL_CATALOG.jobFinder
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (goal === 'improve_skills') {
    const t = TOOL_CATALOG.buildYourPath
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (goal === 'interviews') {
    const t = TOOL_CATALOG.interviewCoach
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }
  if (goal === 'build_cv') {
    const t = TOOL_CATALOG.cvBuilder
    return { href: t.href, toolId: t.id, toolName: t.name, weakestArea }
  }

  const t = TOOL_CATALOG.ukCareerAssistant
  return {
    href: t.href,
    toolId: t.id,
    toolName: t.name,
    weakestArea,
  }
}

function toolRec(
  key: keyof typeof TOOL_CATALOG,
  type: DashboardRecommendation['type'],
  description: string
): DashboardRecommendation {
  const t = TOOL_CATALOG[key]
  return {
    id: `rec_${t.id}`,
    type,
    title: t.name,
    description,
    href: t.href,
    toolId: t.id,
    toolName: t.name,
  }
}

function dedupeRecommendations(items: DashboardRecommendation[]): DashboardRecommendation[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.href)) return false
    seen.add(item.href)
    return true
  })
}

function buildRuleRecommendations(profile: AiUserProfile): DashboardRecommendation[] {
  return generateSmartRecommendations(profile)
}

function getNextAction(profile: AiUserProfile, recommendations: DashboardRecommendation[]): string {
  if (profile.nextAction?.trim()) {
    return profile.nextAction
  }
  if (profile.cvStatus === 'no' || profile.cvStatus === 'needs_improvement') {
    return 'Recommended next step: Strengthen your CV with CV Builder.'
  }
  if (profile.englishLevel === 'beginner' || profile.englishLevel === 'basic') {
    return 'Recommended next step: Improve your professional English with Writing Review.'
  }
  if (profile.readinessScore >= 70) {
    return 'You look ready for interview preparation — try Interview Coach.'
  }
  const goal = normalizeGoal(profile.dominantGoal)
  if (goal === 'find_jobs') {
    return 'Recommended next step: Search for matching roles in Job Finder.'
  }
  if (goal === 'interviews') {
    return 'Recommended next step: Practice with Interview Coach.'
  }
  if (goal === 'improve_skills') {
    return 'Recommended next step: Explore Build Your Path.'
  }
  if (recommendations[0]) {
    return recommendations[0].description
  }
  return 'Continue your AI career path for more tailored guidance.'
}

function suggestedTools(
  profile: AiUserProfile,
  recommendations: DashboardRecommendation[]
): DashboardRecommendation[] {
  const fromProfile = profile.preferredTools.slice(0, 3).map((t) => ({
    id: `pref_${t.id}`,
    type: 'general' as const,
    title: t.name,
    description: 'From your AI Career Path assessment.',
    href: t.href,
    toolId: t.id,
    toolName: t.name,
  }))

  return dedupeRecommendations([...recommendations, ...fromProfile]).slice(0, 4)
}

/** Rule-based insights for dashboard; pass null when no profile row exists. */
export function generateDashboardRecommendations(
  profile: AiUserProfile | null
): DashboardAiInsights | null {
  if (!profile) return null

  const recommendations = buildRuleRecommendations(profile)
  const tools = suggestedTools(profile, recommendations)
  const goal = normalizeGoal(profile.dominantGoal)
  const continueTarget = resolveContinuePathFromProfile(profile)
  const ai = profile.aiPersonalizedAssessment

  return {
    currentPath: profile.lastRecommendedPath,
    careerStage: profile.careerStage,
    evolutionStage: profile.evolutionStage,
    evolutionStageLabel: profile.evolutionStage
      ? EVOLUTION_STAGE_LABELS[profile.evolutionStage]
      : null,
    progressTrend: profile.progressTrend,
    progressTrendLabel: PROGRESS_TREND_LABELS[profile.progressTrend],
    strongestArea: profile.strongestArea ?? getStrongestArea(profile),
    readinessScore: profile.readinessScore,
    nextAction: ai?.nextBestAction?.trim() || getNextAction(profile, recommendations),
    suggestedTools: tools,
    continuePathHref: continueTarget.href,
    continueToolId: continueTarget.toolId,
    continueToolName: continueTarget.toolName,
    weakestArea: profile.weakestArea ?? continueTarget.weakestArea,
    retakeAssessmentHref: CAREER_PATH_HREF,
    goalLabel: goal ? (GOAL_LABELS[goal] ?? goal.replace(/_/g, ' ')) : null,
    isReturning: profile.assessmentCount >= 2,
    lastRecommendedPath: profile.lastRecommendedPath,
    recommendations,
    personalizedSummary: ai?.personalisedSummary?.trim() || null,
    whyThisPathFits:
      ai?.whyThisPathFits?.trim() || profile.recommendationReason?.trim() || null,
    confidenceNote: ai?.confidenceNote?.trim() || null,
    weeklyFocus: ai?.firstWeekActionPlan?.trim() || profile.weeklyFocus?.trim() || null,
  }
}

export const AI_CAREER_PATH_FINDER_HREF = CAREER_PATH_HREF
