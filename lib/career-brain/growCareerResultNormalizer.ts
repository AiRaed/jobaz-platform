/**
 * Guarantee populated grow-career legacy + triad fields even when profile save fails.
 */

import { buildGrowCareerIntelligence } from './growCareerIntelligence'
import { dedupeRoleTitles } from './jaz/jazRecommendationDedup'
import {
  isGrowCareerPath,
  isGrowCareerPathComplete,
  prepareGrowCareerStateForResults,
  resolveGrowCareerCurrentJobTitle,
} from './growCareerPath'
import { domainLabel } from './domains'
import type { CareerBrainOutput, CareerBrainState, CareerProfile } from './types'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'

function slugId(title: string, track: string, index: number): string {
  return `${track}_${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${index}`
}

function canForceGrowResults(state: CareerBrainState): boolean {
  if (!isGrowCareerPath(state)) return false
  if (isGrowCareerPathComplete(state)) return true
  const title = resolveGrowCareerCurrentJobTitle(state)
  return Boolean(title && title !== 'Professional')
}

export function ensureGrowCareerBrainOutput(
  profile: CareerProfile,
  output: CareerBrainOutput,
  state: CareerBrainState
): CareerBrainOutput {
  if (!canForceGrowResults(state)) return output
  if (output.growCareerGrowth && output.recommendedPaths.workNow.length) return output

  const intelligence = buildGrowCareerIntelligence(profile, state)
  if (!intelligence) return output

  const mergedOutput: CareerBrainOutput = {
    ...output,
    recommendedPaths: {
      workNow: intelligence.recommendations.filter((r) => r.track === 'work_now'),
      buildNext: intelligence.recommendations.filter((r) => r.track === 'build_next'),
      longTerm: intelligence.recommendations.filter((r) => r.track === 'long_term'),
      backupIncome: [],
    },
    growCareerGrowth: intelligence.growth,
    employabilityScore: intelligence.growth.employabilityScore,
    whyThisPath: intelligence.growth.finalReport?.careerReasoning ?? output.whyThisPath,
    personalizedSummary: intelligence.growth.finalReport?.careerSummary ?? output.personalizedSummary,
  }

  return mergedOutput
}

export type NormalizedGrowCareerResult = UkCareerRuleResult & {
  career_brain?: CareerBrainOutput
  topRealisticPaths?: string[]
  suggestedNextSteps?: string[]
  employabilityScore?: number
  whyThisPath?: string
  nextSmartMove?: { action: string; label: string; href?: string }
}

export function normalizeGrowCareerLegacyResult(
  legacy: NormalizedGrowCareerResult,
  output: CareerBrainOutput,
  state: CareerBrainState
): NormalizedGrowCareerResult {
  if (!canForceGrowResults(state)) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Grow Career Result] skipped — not grow career path', {
        goal: (state.answers ?? {}).cb_user_goal,
      })
    }
    return legacy
  }

  const mappedState = prepareGrowCareerStateForResults(state)
  const grow = output.growCareerGrowth
  const roadmap = grow?.promotionRoadmap
  const report = grow?.finalReport
  const domain = output.careerProfile.domain

  const mapDir = (
    titles: string[],
    whys: string[],
    track: string
  ) =>
    titles.map((title, i) => ({
      direction_id: slugId(title, track, i),
      direction_title: title,
      why: [whys[i] ?? grow?.currentPositionSummary ?? 'Profession-specific progression from your answers'],
      chips: [domainLabel(domain)],
    }))

  const workNowTitles = output.recommendedPaths.workNow.map((r) => r.title).filter(Boolean)
  const buildNextTitles = output.recommendedPaths.buildNext.map((r) => r.title).filter(Boolean)
  const longTermTitles = output.recommendedPaths.longTerm.map((r) => r.title).filter(Boolean)

  if (!workNowTitles.length) {
    if (report?.workNow) workNowTitles.push(report.workNow)
    else if (roadmap?.workNow) workNowTitles.push(roadmap.workNow)
    else workNowTitles.push('Teaching Assistant')
  }
  if (!buildNextTitles.length) {
    if (report?.buildNext) buildNextTitles.push(report.buildNext)
    else if (roadmap?.buildNext) buildNextTitles.push(roadmap.buildNext)
    else buildNextTitles.push('Level 3 Teaching Assistant')
  }
  if (!longTermTitles.length) {
    if (report?.longTermPath) longTermTitles.push(report.longTermPath)
    else if (roadmap?.longTerm) longTermTitles.push(roadmap.longTerm)
    else longTermTitles.push('HLTA → School Leadership pathway')
  }

  const dedupedWorkNow = dedupeRoleTitles(workNowTitles)
  const dedupedBuildNext = dedupeRoleTitles(buildNextTitles)
  const dedupedLongTerm = dedupeRoleTitles(longTermTitles)

  const workNowDirs = mapDir(
    dedupedWorkNow,
    workNowTitles.map(
      (_, i) =>
        output.recommendedPaths.workNow[i]?.why ??
        grow?.currentPositionSummary ??
        'Your current role baseline'
    ),
    'work_now'
  )
  const buildNextDirs = mapDir(
    dedupedBuildNext,
    buildNextTitles.map(
      (_, i) =>
        output.recommendedPaths.buildNext[i]?.why ??
        grow?.nextRealisticStep.reason ??
        'Next realistic step in your profession'
    ),
    'build_next'
  )
  const longTermDirs = mapDir(
    dedupedLongTerm,
    longTermTitles.map(
      (_, i) =>
        output.recommendedPaths.longTerm[i]?.why ??
        grow?.longTermCareerDirection ??
        'Long-term education progression'
    ),
    'long_term'
  )

  const topRealisticPaths = [...dedupedWorkNow, ...dedupedBuildNext, ...dedupedLongTerm].slice(0, 6)
  const suggestedNextSteps =
    grow?.actionPlan90Days ??
    grow?.immediateActions ??
    report?.next90DayPlan ??
    []
  const employabilityScore =
    grow?.employabilityScore ??
    grow?.promotionReadinessScore ??
    grow?.jazConfidence ??
    output.employabilityScore ??
    58

  const nextStep = legacy.next_step
  const nextSmartMove =
    typeof nextStep === 'object' && nextStep !== null && 'label' in nextStep
      ? { action: nextStep.action, label: nextStep.label, href: nextStep.href }
      : { action: 'CREATE_CV', label: 'Improve CV for your next school role', href: '/cv-builder-v2' }

  const normalized: NormalizedGrowCareerResult = {
    ...legacy,
    summary: report?.careerSummary ?? legacy.summary,
    work_now: { directions: workNowDirs },
    improve_later: { directions: [...buildNextDirs, ...longTermDirs] },
    avoid: output.notRecommended?.length
      ? output.notRecommended.map((n) => `${n.title} — ${n.reason}`)
      : legacy.avoid,
    career_brain: output,
    topRealisticPaths,
    suggestedNextSteps,
    employabilityScore,
    whyThisPath: report?.careerReasoning ?? output.whyThisPath,
    nextSmartMove,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Grow Career Result] normalized', {
      jobTitle: resolveGrowCareerCurrentJobTitle(mappedState),
      workNow: workNowDirs.map((d) => d.direction_title),
      buildNext: buildNextDirs.map((d) => d.direction_title),
      longTerm: longTermDirs.map((d) => d.direction_title),
      employabilityScore,
      topRealisticPaths,
    })
  }

  return normalized
}
