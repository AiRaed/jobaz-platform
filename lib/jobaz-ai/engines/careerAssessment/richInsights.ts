/**
 * Rule-based rich career insights — personalized copy, plans, and scores.
 * No LLM; deterministic from assessment answers + engine result.
 */

import { careerStageFromReadiness } from '@/lib/jobaz-ai/profile/careerStage'
import {
  computeEngagementScore,
  computeReadinessScore,
  type EngagementSignals,
} from '@/lib/jobaz-ai/memory/profileScoring'
import type { AssessmentAnswers, CareerAssessmentResult } from '../../types'
import type { CareerStage } from '@/lib/jobaz-ai/profile/careerStage'
import { TOOL_CATALOG } from './toolCatalog'
import type { ToolCatalogKey } from './pathProfiles'
import {
  getStrongestAreaFromSignals,
  getWeakestAreaFromSignals,
  normalizeGoal,
  signalsFromAnswers,
  type ProfileSignals,
} from './profileSignals'

export type RichActionPlanPriority = 'high' | 'medium' | 'low'

export type RichActionPlanTask = {
  label: string
  toolName: string
  toolId: string
  route: string
  priority: RichActionPlanPriority
  estimatedMinutes: number
}

export type StoredRichActionPlan = {
  title: string
  summary: string
  weeklyTasks: RichActionPlanTask[]
}

export type RichCareerInsights = {
  recommendationReason: string
  strongestArea: string
  weakestArea: string
  readinessScore: number
  engagementScore: number
  careerStage: CareerStage
  improvementTimeline: string
  firstWeekFocus: string
  nextAction: string
  fastestImprovementPath: string
  personalizedInsights: string[]
  bestToolId: string
  bestToolName: string
  bestToolRoute: string
  actionPlan: StoredRichActionPlan
}

const PRIORITY_RANK: Record<RichActionPlanPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

const ESTIMATED_MINUTES: Partial<Record<ToolCatalogKey, number>> = {
  cvBuilder: 50,
  jobFinder: 35,
  writingReview: 25,
  interviewCoach: 30,
  buildYourPath: 25,
  ukCareerAssistant: 15,
}

function taskFromKey(
  key: ToolCatalogKey,
  label: string,
  priority: RichActionPlanPriority
): RichActionPlanTask {
  const t = TOOL_CATALOG[key]
  return {
    label,
    toolName: t.name,
    toolId: t.id,
    route: t.href,
    priority,
    estimatedMinutes: ESTIMATED_MINUTES[key] ?? 20,
  }
}

function buildRecommendationReason(
  answers: AssessmentAnswers,
  result: CareerAssessmentResult,
  signals: ProfileSignals
): string {
  const goal = normalizeGoal(signals.dominantGoal)
  const path = result.recommendedPath

  if (answers.situation === 'need_job_quickly') {
    return `${path} fits your need to move into work quickly — it prioritises realistic UK entry roles and fast, practical steps.`
  }
  if (answers.situation === 'no_uk_experience') {
    return `${path} is tailored for building UK-relevant experience and confidence step by step, even without local work history.`
  }
  if (answers.situation === 'limited_english') {
    return `${path} balances achievable roles with ways to strengthen professional English so applications and interviews land better.`
  }
  if (answers.situation === 'change_career') {
    return `${path} supports a structured career change in the UK with clearer options and skills aligned to your next direction.`
  }
  if (goal === 'interviews') {
    return `${path} matches your focus on interview readiness — building confidence and answers employers expect in the UK.`
  }
  if (goal === 'find_jobs') {
    return `${path} aligns with your goal to find suitable UK jobs, using your current strengths while closing key gaps.`
  }
  return `${path} reflects your answers today — realistic next steps for the UK job market without overwhelming change.`
}

function buildPersonalizedInsights(
  answers: AssessmentAnswers,
  signals: ProfileSignals,
  strongest: string,
  weakest: string
): string[] {
  const lines: string[] = []

  if (
    (answers.experience === 'some' || answers.experience === 'strong') &&
    (answers.english === 'beginner' || answers.english === 'basic')
  ) {
    lines.push(
      'You already have some experience, but your English confidence may slow down job opportunities.'
    )
  }

  if (strongest === 'Career motivation') {
    lines.push(
      'Your strongest area is motivation and willingness to improve — that consistency will accelerate your progress.'
    )
  } else {
    lines.push(`Your strongest area right now is ${strongest.toLowerCase()}.`)
  }

  lines.push(
    `Your main growth area is ${weakest.toLowerCase()} — small weekly wins here will raise your overall readiness fastest.`
  )

  lines.push(buildFastestImprovementPath(signals, weakest))

  if (answers.situation === 'better_job' && answers.experience === 'strong') {
    lines.push(
      'You are positioned to aim for better roles — focus on presentation (CV + interviews) as much as new skills.'
    )
  }

  return lines.slice(0, 4)
}

function buildFastestImprovementPath(
  signals: ProfileSignals,
  weakest: string
): string {
  const goal = normalizeGoal(signals.dominantGoal)

  if (weakest === 'CV quality' && signals.readinessScore >= 50) {
    return 'The fastest improvement path for you is CV quality + interview practice.'
  }
  if (weakest === 'CV quality') {
    return 'The fastest improvement path for you is CV quality, then targeted job applications.'
  }
  if (weakest === 'English confidence') {
    return 'The fastest improvement path for you is professional English practice + a stronger CV.'
  }
  if (weakest === 'UK work experience') {
    return 'The fastest improvement path for you is UK-relevant experience signals on your CV + realistic role targeting.'
  }
  if (weakest === 'Interview practice' || goal === 'interviews') {
    return 'The fastest improvement path for you is interview practice + confident storytelling about your experience.'
  }
  return 'The fastest improvement path for you is clearer career direction, then one focused JobAZ tool per week.'
}

function buildImprovementTimeline(readiness: number): string {
  if (readiness <= 25) {
    return 'Estimated timeline: 4–8 weeks with consistent weekly practice in JobAZ.'
  }
  if (readiness <= 50) {
    return 'Estimated timeline: 3–5 weeks if you complete your weekly action plan.'
  }
  if (readiness <= 75) {
    return 'Estimated timeline: 2–4 weeks focusing on your weakest area.'
  }
  return 'Estimated timeline: 1–2 weeks before active applications and interviews.'
}

function buildFirstWeekFocus(weakest: string, goal: string | null): string {
  switch (weakest) {
    case 'CV quality':
      return 'Week 1 focus: build or upgrade your UK CV, then save 3 matching roles.'
    case 'English confidence':
      return 'Week 1 focus: improve one application email or CV paragraph, then review it in Writing Review.'
    case 'UK work experience':
      return 'Week 1 focus: map a realistic UK entry path and align your CV to it.'
    case 'Interview practice':
      return 'Week 1 focus: practice 5 common UK interview questions with feedback.'
    default:
      if (goal === 'find_jobs') {
        return 'Week 1 focus: search, shortlist, and save 5 suitable UK jobs.'
      }
      return 'Week 1 focus: complete one clear next step in JobAZ and track your progress.'
  }
}

function buildNextAction(weakest: string, bestToolName: string): string {
  return `Recommended next action: address ${weakest.toLowerCase()} using ${bestToolName}.`
}

function resolveBestTool(
  signals: ProfileSignals,
  weakest: string
): { key: ToolCatalogKey; id: string; name: string; route: string } {
  const goal = normalizeGoal(signals.dominantGoal)

  if (weakest === 'English confidence') {
    const t = TOOL_CATALOG.writingReview
    return { key: 'writingReview', id: t.id, name: t.name, route: t.href }
  }
  if (weakest === 'CV quality') {
    const t = TOOL_CATALOG.cvBuilder
    return { key: 'cvBuilder', id: t.id, name: t.name, route: t.href }
  }
  if (weakest === 'UK work experience') {
    const t = TOOL_CATALOG.buildYourPath
    return { key: 'buildYourPath', id: t.id, name: t.name, route: t.href }
  }
  if (weakest === 'Interview practice' || goal === 'interviews') {
    const t = TOOL_CATALOG.interviewCoach
    return { key: 'interviewCoach', id: t.id, name: t.name, route: t.href }
  }
  if (goal === 'find_jobs') {
    const t = TOOL_CATALOG.jobFinder
    return { key: 'jobFinder', id: t.id, name: t.name, route: t.href }
  }
  if (goal === 'improve_skills') {
    const t = TOOL_CATALOG.buildYourPath
    return { key: 'buildYourPath', id: t.id, name: t.name, route: t.href }
  }
  if (signals.readinessScore >= 60) {
    const t = TOOL_CATALOG.interviewCoach
    return { key: 'interviewCoach', id: t.id, name: t.name, route: t.href }
  }
  const t = TOOL_CATALOG.ukCareerAssistant
  return { key: 'ukCareerAssistant', id: t.id, name: t.name, route: t.href }
}

function buildWeeklyActionPlan(
  signals: ProfileSignals,
  weakest: string
): StoredRichActionPlan {
  const goal = normalizeGoal(signals.dominantGoal)
  const candidates: RichActionPlanTask[] = [
    {
      label: 'Review your AI career profile summary',
      toolName: 'AI Career Path Finder',
      toolId: 'ai_career_path',
      route: '/ai-career-path',
      priority: 'low',
      estimatedMinutes: 10,
    },
  ]

  if (signals.cvStatus === 'no' || signals.cvStatus === 'needs_improvement') {
    candidates.push(taskFromKey('cvBuilder', 'Improve your CV', 'high'))
  }

  if (goal === 'find_jobs') {
    candidates.push(taskFromKey('jobFinder', 'Search and save 5 suitable jobs', 'high'))
  }

  if (
    signals.englishLevel === 'beginner' ||
    signals.englishLevel === 'basic'
  ) {
    candidates.push(
      taskFromKey('writingReview', 'Improve English confidence in one professional text', 'high')
    )
  }

  if (goal === 'improve_skills') {
    candidates.push(taskFromKey('buildYourPath', 'Explore one skill path', 'medium'))
  }

  if (signals.readinessScore >= 55) {
    candidates.push(taskFromKey('interviewCoach', 'Practice interview questions', 'medium'))
  }

  if (weakest === 'Interview practice' && !candidates.some((t) => t.toolId === 'interview_coach')) {
    candidates.push(taskFromKey('interviewCoach', 'Practice one mock interview answer', 'high'))
  }

  const seen = new Set<string>()
  let weeklyTasks = candidates.filter((t) => {
    if (seen.has(t.route)) return false
    seen.add(t.route)
    return true
  })

  if (weeklyTasks.length < 3) {
    weeklyTasks.push(
      taskFromKey(
        'ukCareerAssistant',
        'Ask the UK Career Assistant one question about your next step',
        'low'
      )
    )
  }

  const [first, ...rest] = weeklyTasks
  rest.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
  weeklyTasks = [first, ...rest].slice(0, 5)

  return {
    title: "Your first-week action plan",
    summary: `Focus on ${weakest.toLowerCase()} with ${weeklyTasks.length} practical tasks (~${weeklyTasks.reduce((s, t) => s + t.estimatedMinutes, 0)} min total).`,
    weeklyTasks,
  }
}

export type RichInsightsEngagementInput = {
  assessmentCount: number
  hasSignupClick?: boolean
  hasToolClick?: boolean
}

/**
 * Builds full rich insights for result UI and ai_user_profiles persistence.
 */
export function generateRichCareerInsights(
  answers: AssessmentAnswers,
  result: CareerAssessmentResult,
  engagementInput: RichInsightsEngagementInput
): RichCareerInsights {
  const readinessScore = computeReadinessScore(answers)
  const signals = signalsFromAnswers(answers, readinessScore)
  const strongestArea = getStrongestAreaFromSignals(signals)
  const weakestArea = getWeakestAreaFromSignals(signals)
  const engagementScore = computeEngagementScore({
    assessmentCount: engagementInput.assessmentCount,
    hasSignupClick: engagementInput.hasSignupClick ?? false,
    hasToolClick: engagementInput.hasToolClick ?? false,
  } satisfies EngagementSignals)

  const best = resolveBestTool(signals, weakestArea)
  const actionPlan = buildWeeklyActionPlan(signals, weakestArea)
  const goal = normalizeGoal(signals.dominantGoal)

  return {
    recommendationReason: buildRecommendationReason(answers, result, signals),
    strongestArea,
    weakestArea,
    readinessScore,
    engagementScore,
    careerStage: careerStageFromReadiness(readinessScore),
    improvementTimeline: buildImprovementTimeline(readinessScore),
    firstWeekFocus: buildFirstWeekFocus(weakestArea, goal),
    nextAction: buildNextAction(weakestArea, best.name),
    fastestImprovementPath: buildFastestImprovementPath(signals, weakestArea),
    personalizedInsights: buildPersonalizedInsights(
      answers,
      signals,
      strongestArea,
      weakestArea
    ),
    bestToolId: best.id,
    bestToolName: best.name,
    bestToolRoute: best.route,
    actionPlan,
  }
}
