/**
 * Build canonical CareerBrainOutput + legacy UI mapping.
 */

import { domainLabel, isFieldFirstMode, isGenericJobTitle } from './domains'
import { getHighBarrierAcknowledgement, isHighBarrierField } from './dualPathMode'
import { inferBridgeField } from './bridgeRoleIntelligence'
import {
  assembleCareerRoadmap,
  buildRoadmapJourneyReasoning,
} from './careerRoadmap'
import { validateCareerProgression, enforceCareerProgressionTracks } from './careerProgressionValidation'
import { buildWorkStyleReasoning } from './workStylePreferences'
import {
  buildCertificationSuggestions,
  buildSpeedDevelopmentReasoning,
  filterForFastIncome,
} from './speedDevelopmentMode'
import {
  buildPathStrategyReasoning,
} from './pathStrategy'
import {
  buildPersonalizedJourneySummary,
  buildPracticalNextSteps,
  buildWhyThisPathExplanation,
  buildCareerLadderSummary,
  enrichRecommendationsWithJourneyContext,
  softenBarrierLanguage,
} from './journeyPersonalization'
import {
  applyDualPathBalance,
  buildDualPathSummaryLine,
  shouldApplyDualPathWeighting,
} from './dualPathBalance'
import { buildEnglishDevelopmentPlan } from './englishDevelopmentPlan'
import { buildWhyOtherPathsNotSelected } from './pathAlternativesExplained'
import { buildRightToWorkGuidance, buildWorkEligibilityNextSteps, getWorkEligibilityResult } from './rightToWork'
import { buildSpecialPathwayPlan } from './specialPathways'
import { buildEducationAlignmentReasoning } from './globalEducationAlignment'
import { validateAndRepairRecommendations } from './recommendationValidation'
import {
  applyFinalResultPolish,
  collectRecommendedTitles,
} from './resultPolish'
import {
  buildCareerTrackLockReasoning,
} from './careerTrackLock'
import {
  applyUniversalCareerPathRules,
  buildUniversalCareerPathReasoning,
} from './universalCareerPath'
import {
  applyGlobalRecommendationRules,
  buildGlobalPreferenceReasoning,
} from './globalPreferenceEngine'
import { applyEnglishConfidenceRules } from './englishConfidenceRules'
import {
  applyFieldCareerConsistencyRules,
  buildFieldCareerConsistencyReasoning,
  buildCareerPathComparisonSummary,
} from './fieldCareerConsistency'
import {
  applyCareerDirectionPriorityToProfile,
  buildDualEducationExperiencePaths,
  buildMergedEducationExperienceRecommendations,
  buildSplitPathReasoning,
  getCareerDirectionPriority,
  wantsMergedEducationExperiencePath,
} from './educationExperienceSplit'
import {
  buildUnemployedPathReasoning,
  isUnemployedPath,
} from './unemployedPath'
import {
  buildUnemployedIntelligence,
  mergeUnemployedIntelligenceIntoOutput,
} from './unemployedIntelligence'
import {
  buildCareerChangeIntelligence,
  mergeCareerChangeIntelligenceIntoOutput,
} from './careerChangeIntelligence'
import { buildCareerChangePathReasoning, isCareerChangePath, isCareerChangePathComplete } from './careerChangePath'
import {
  buildGrowCareerIntelligence,
  mergeGrowCareerIntelligenceIntoOutput,
} from './growCareerIntelligence'
import { buildGrowCareerPathReasoning, isGrowCareerPathComplete } from './growCareerPath'
import {
  buildSideIncomeIntelligence,
  mergeSideIncomeIntelligenceIntoOutput,
} from './sideIncome/sideIncomeIntelligence'
import {
  buildSideIncomePathReasoning,
  isSideIncomePathComplete,
  prepareSideIncomeStateForResults,
} from './sideIncomePath'
import {
  buildBusinessDiscoveryIntelligence,
  mergeBusinessDiscoveryIntoOutput,
} from './businessDiscovery/businessDiscoveryIntelligence'
import {
  buildBusinessDiscoveryPathReasoning,
  isBusinessDiscoveryPathComplete,
  prepareBusinessDiscoveryStateForResults,
} from './businessDiscoveryPath'
import {
  buildUkTransitionIntelligence,
  mergeUkTransitionIntoOutput,
} from './ukTransition/ukTransitionEngine'
import {
  buildUkTransitionPathReasoning,
  isUkTransitionPathComplete,
  prepareUkTransitionStateForResults,
} from './ukTransitionPath'
import {
  computeEmployabilityScore,
  computePathConfidenceScores,
} from './employabilityScoring'
import {
  computeRecommendationConfidence,
  buildCareerLadderFromPaths,
} from './progressionRefinement'
import { isTrainingOrLicence, titlesOverlapProgression } from './careerProgressionValidation'
import {
  getDeterministicCareerRecommendations,
} from './pathwayRecommendations'
import { buildCourseLayerReasoning } from './courseRecommendationLayer'
import type {
  CareerBrainOutput,
  CareerBrainRecommendation,
  CareerBrainTurnResult,
  CareerProfile,
  CareerPathRole,
} from './types'

function slugId(title: string, track: string, index: number): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40)
  return `cb_${track}_${base || index}`
}

function toPathRole(
  rec: CareerBrainRecommendation,
  confidence?: import('./types').PathConfidenceScore[]
): CareerPathRole {
  const match = confidence?.find(
    (c) => c.track === rec.track && titlesOverlapProgression(c.title, rec.title)
  )
  return {
    title: rec.title,
    why: rec.why,
    domain: rec.domain,
    source: rec.source,
    pathOrigin: rec.pathOrigin,
    confidence: match?.score,
    stepType:
      rec.stepType ?? (isTrainingOrLicence(rec.title) ? 'training' : 'career_step'),
    recommendedTraining: rec.recommendedTraining,
    fieldSource: rec.fieldSource,
  }
}

export function buildJobSearchKeywords(profile: CareerProfile, roles: CareerPathRole[]): string[] {
  const kw = new Set<string>()
  const domainKw: Record<string, string[]> = {
    animation_design: ['junior animator', 'motion designer', 'video editor', 'after effects', 'maya'],
    creative_media: ['graphic designer', 'content designer', 'creative assistant'],
    driving_logistics: ['delivery driver', 'courier', 'taxi driver', 'van driver'],
    finance_accounting: ['accounts assistant', 'bookkeeper', 'finance admin'],
    no_experience_general: ['retail assistant', 'warehouse operative', 'entry level'],
  }
  for (const k of domainKw[profile.domain] ?? []) kw.add(k)
  for (const r of roles.slice(0, 4)) kw.add(r.title.toLowerCase())
  if (profile.ukLocation) kw.add(profile.ukLocation.replace(/_/g, ' '))
  return [...kw].slice(0, 12)
}

export function buildMainBarriers(profile: CareerProfile): string[] {
  const barriers: string[] = []
  if (profile.englishLevel === 'basic') {
    barriers.push('English — may limit customer-facing roles until confidence improves')
  }
  if (profile.hasPortfolio === false && /animat|creative|design/i.test(profile.domain)) {
    barriers.push('Portfolio / showreel needed for creative applications')
  }
  if (profile.experienceCountry === 'non-UK') {
    barriers.push('Building UK work history — local references strengthen applications over time')
  }
  if (profile.wantsCareerChange && !profile.targetField) {
    barriers.push('Career change target not yet defined')
  }
  if (profile.constraints.includes('no-customer-facing')) {
    barriers.push('Customer-facing roles may not suit your preferences')
  }
  if (profile.constraints.includes('hybrid-path-mode') || profile.constraints.includes('dual-path-mode')) {
    const field = inferBridgeField(profile.studyField, profile.targetField)
    if (isHighBarrierField(field)) {
      const ack = getHighBarrierAcknowledgement(field)
      if (ack) barriers.push(ack)
    }
  }
  if (!profile.licences.length && profile.urgencyLevel === 'high') {
    barriers.push('No driving licence — fewer quick-start delivery options')
  }
  const needsCert =
    profile.domain === 'healthcare' ||
    profile.domain === 'care_support' ||
    /warehouse|security|care/i.test(profile.workExperienceField ?? '')
  if (needsCert && profile.certificates.length === 0) {
    barriers.push('UK certifications or training may be required (e.g. forklift, SIA, care)')
  }
  return [...new Set(barriers.map(softenBarrierLanguage))]
}

export function buildMissingSkills(profile: CareerProfile, state?: import('./types').CareerBrainState): string[] {
  const missing: string[] = [...buildMainBarriers(profile)]
  const upgrades = buildCertificationSuggestions(profile, state)
  if (upgrades.length) {
    missing.push('Employability upgrades to explore (Rule 7):')
    missing.push(...upgrades)
  }
  if (
    profile.englishLevel === 'basic' ||
    profile.englishLevel === 'intermediate' ||
    profile.englishLevel === 'functional'
  ) {
    missing.push('English improvement — practise workplace English daily to unlock more customer-facing and office roles')
  }
  if (profile.domain === 'animation_design' || profile.domain === 'creative_media') {
    if (!profile.toolsAndSkills.some((t) => /after effects|premiere|maya|blender/i.test(t))) {
      missing.push('Industry-standard creative software skills')
    }
  }
  if (profile.wantsCareerChange && profile.targetField) {
    missing.push(`Bridge skills for moving into ${profile.targetField}`)
  }
  return [...new Set(missing)]
}

export function buildNextJobAZActions(
  profile: CareerProfile,
  state?: import('./types').CareerBrainState,
  workNow?: CareerPathRole[]
): CareerBrainOutput['nextJobAZActions'] {
  return buildPracticalNextSteps(profile, state, workNow)
}

export function buildCareerBrainOutput(
  profile: CareerProfile,
  recs: CareerBrainRecommendation[],
  reasoning: string[],
  source: 'ai' | 'fallback',
  state?: import('./types').CareerBrainState
): CareerBrainOutput {
  let baseProfile = profile
  if (state) {
    const det = getDeterministicCareerRecommendations(state.answers ?? {}, profile, state)
    if (det?.extraConstraints?.length) {
      baseProfile = {
        ...profile,
        constraints: [...new Set([...profile.constraints, ...det.extraConstraints])],
      }
    }
  }

  const directedProfile = state
    ? applyCareerDirectionPriorityToProfile(baseProfile, state)
    : baseProfile

  if (state && isCareerChangePathComplete(state)) {
    const intelligence = buildCareerChangeIntelligence(directedProfile, state)
    if (intelligence) {
      const workNow = intelligence.plan.workNow.map((r) => toPathRole(r))
      const buildNext = intelligence.plan.buildNext.map((r) => toPathRole(r))
      const longTerm = intelligence.plan.longTerm.map((r) => toPathRole(r))
      const baseOutput: CareerBrainOutput = {
        careerProfile: directedProfile,
        recommendedPaths: { workNow, buildNext, longTerm, backupIncome: [] },
        jobSearchKeywords: intelligence.plan.workNow.map((r) => r.title),
        missingSkills: [],
        mainBarriers: [],
        nextJobAZActions: [],
        practicalNextSteps: [],
        whyThisPath: intelligence.transition.summary,
        careerLadderSummary: `${workNow[0]?.title ?? 'Bridge role'} → ${buildNext[0]?.title ?? 'Training'} → ${longTerm[0]?.title ?? 'Destination'}`,
        personalizedSummary: intelligence.transition.summary,
        reasoning: [...reasoning, ...intelligence.reasoning, ...buildCareerChangePathReasoning(directedProfile, state)],
        employabilityScore: intelligence.transition.confidenceScore,
        pathConfidence: [],
        englishDevelopmentPlan: null,
        notRecommended: [],
        rightToWorkGuidance: '',
        specialPathway: null,
      }
      return mergeCareerChangeIntelligenceIntoOutput(baseOutput, intelligence, state)
    }
  }

  if (state && isBusinessDiscoveryPathComplete(state)) {
    const mappedState = prepareBusinessDiscoveryStateForResults(state)
    const intelligence = buildBusinessDiscoveryIntelligence(directedProfile, mappedState)
    const baseOutput: CareerBrainOutput = {
      careerProfile: directedProfile,
      recommendedPaths: { workNow: [], buildNext: [], longTerm: [], backupIncome: [] },
      jobSearchKeywords: [],
      missingSkills: intelligence.growth.finalReport.first30DaysPlan.slice(0, 3),
      mainBarriers: intelligence.growth.finalReport.challenges.slice(0, 3),
      nextJobAZActions: intelligence.growth.recommendedJobAZActions,
      practicalNextSteps: intelligence.growth.recommendedJobAZActions,
      whyThisPath: intelligence.growth.summary,
      careerLadderSummary: 'UK Business Advisor — startup plan',
      personalizedSummary: intelligence.growth.summary,
      reasoning: [
        ...reasoning,
        ...intelligence.reasoning,
        ...buildBusinessDiscoveryPathReasoning(mappedState),
      ],
      employabilityScore: 0,
      pathConfidence: [],
      englishDevelopmentPlan: null,
      notRecommended: [],
      rightToWorkGuidance: '',
      specialPathway: null,
    }
    return mergeBusinessDiscoveryIntoOutput(baseOutput, intelligence)
  }

  if (state && isUkTransitionPathComplete(state)) {
    const mappedState = prepareUkTransitionStateForResults(state)
    const intelligence = buildUkTransitionIntelligence(directedProfile, mappedState)
    if (intelligence) {
      const baseOutput: CareerBrainOutput = {
        careerProfile: directedProfile,
        recommendedPaths: { workNow: [], buildNext: [], longTerm: [], backupIncome: [] },
        jobSearchKeywords: intelligence.growth.finalReport.recommendedJobs.map((j) => j.title),
        missingSkills: intelligence.growth.finalReport.recommendedCertifications.slice(0, 3),
        mainBarriers: intelligence.growth.finalReport.currentBarriers.slice(0, 3),
        nextJobAZActions: intelligence.growth.recommendedJobAZActions,
        practicalNextSteps: intelligence.growth.recommendedJobAZActions,
        whyThisPath: intelligence.growth.summary,
        careerLadderSummary: 'JAZ UK Transition Advisor — your UK entry plan',
        personalizedSummary: intelligence.growth.summary,
        reasoning: [
          ...reasoning,
          ...intelligence.reasoning,
          ...buildUkTransitionPathReasoning(mappedState),
        ],
        employabilityScore: 0,
        pathConfidence: [],
        englishDevelopmentPlan: null,
        notRecommended: [],
        rightToWorkGuidance: '',
        specialPathway: null,
        recommendedCourses: intelligence.growth.finalReport.recommendedCourses,
      }
      return mergeUkTransitionIntoOutput(baseOutput, intelligence)
    }
  }

  if (state && isSideIncomePathComplete(state)) {
    const mappedState = prepareSideIncomeStateForResults(state)
    const intelligence = buildSideIncomeIntelligence(directedProfile, mappedState)
    if (intelligence) {
      const workNow = intelligence.recommendations
        .filter((r) => r.track === 'work_now')
        .map((r) => toPathRole(r))
      const buildNext = intelligence.recommendations
        .filter((r) => r.track === 'build_next')
        .map((r) => toPathRole(r))
      const longTerm = intelligence.recommendations
        .filter((r) => r.track === 'long_term')
        .map((r) => toPathRole(r))
      const baseOutput: CareerBrainOutput = {
        careerProfile: directedProfile,
        recommendedPaths: { workNow, buildNext, longTerm, backupIncome: [] },
        jobSearchKeywords: intelligence.recommendations.map((r) => r.title),
        missingSkills: intelligence.growth.finalReport.recommendedSkillsToIncreaseEarnings.slice(0, 3),
        mainBarriers: intelligence.growth.finalReport.incomeBarriers.slice(0, 3),
        nextJobAZActions: intelligence.growth.recommendedJobAZActions,
        practicalNextSteps: intelligence.growth.recommendedJobAZActions,
        whyThisPath: intelligence.growth.summary,
        careerLadderSummary: 'Side income options based on your evidence',
        personalizedSummary: intelligence.growth.summary,
        reasoning: [
          ...reasoning,
          ...intelligence.reasoning,
          ...buildSideIncomePathReasoning(mappedState),
        ],
        employabilityScore: intelligence.growth.confidence,
        pathConfidence: [],
        englishDevelopmentPlan: null,
        notRecommended: [],
        rightToWorkGuidance: '',
        specialPathway: null,
      }
      return mergeSideIncomeIntelligenceIntoOutput(baseOutput, intelligence, mappedState)
    }
  }

  if (state && isGrowCareerPathComplete(state)) {
    const intelligence = buildGrowCareerIntelligence(directedProfile, state)
    if (intelligence) {
      const workNow = intelligence.plan.workNow.map((r) => toPathRole(r))
      const buildNext = intelligence.plan.buildNext.map((r) => toPathRole(r))
      const longTerm = intelligence.plan.longTerm.map((r) => toPathRole(r))
      const baseOutput: CareerBrainOutput = {
        careerProfile: directedProfile,
        recommendedPaths: { workNow, buildNext, longTerm, backupIncome: [] },
        jobSearchKeywords: intelligence.plan.workNow.map((r) => r.title),
        missingSkills: intelligence.plan.weaknesses.slice(0, 3),
        mainBarriers: [intelligence.growth.mainBarrier],
        nextJobAZActions: intelligence.growth.recommendedJobAZActions,
        practicalNextSteps: intelligence.growth.recommendedJobAZActions,
        whyThisPath: intelligence.growth.summary,
        careerLadderSummary: `${workNow[0]?.title ?? 'Current role'} → ${buildNext[0]?.title ?? 'Next step'} → ${longTerm[0]?.title ?? 'Long-term'}`,
        personalizedSummary: intelligence.growth.summary,
        reasoning: [...reasoning, ...intelligence.reasoning, ...buildGrowCareerPathReasoning(directedProfile, state)],
        employabilityScore: intelligence.growth.employabilityScore,
        pathConfidence: [],
        englishDevelopmentPlan: null,
        notRecommended: [],
        rightToWorkGuidance: '',
        specialPathway: null,
      }
      return mergeGrowCareerIntelligenceIntoOutput(baseOutput, intelligence, state)
    }
  }

  const strategyReasoning = [
    ...buildRoadmapJourneyReasoning(directedProfile, state),
    ...buildEducationAlignmentReasoning(directedProfile, state),
    ...buildCareerTrackLockReasoning(directedProfile, state),
    ...buildUniversalCareerPathReasoning(directedProfile, state),
    ...buildGlobalPreferenceReasoning(directedProfile, state),
    ...buildFieldCareerConsistencyReasoning(directedProfile, state),
    ...buildWorkStyleReasoning(directedProfile, state),
    ...buildSpeedDevelopmentReasoning(directedProfile, state),
    ...buildPathStrategyReasoning(directedProfile, state),
    ...buildSplitPathReasoning(directedProfile, state),
    ...buildUnemployedPathReasoning(directedProfile, state),
    ...buildCareerChangePathReasoning(directedProfile, state),
    ...buildGrowCareerPathReasoning(directedProfile, state ?? { answers: {} }),
    ...(state
      ? (getDeterministicCareerRecommendations(state.answers ?? {}, profile, state)?.result.explanationContext ?? [])
      : []),
    ...buildCourseLayerReasoning(directedProfile, state),
  ]

  let enrichedRecs = assembleCareerRoadmap(recs, directedProfile, state)
  enrichedRecs = applyGlobalRecommendationRules(enrichedRecs, directedProfile, state)
  enrichedRecs = applyUniversalCareerPathRules(enrichedRecs, directedProfile, state)

  if (state && wantsMergedEducationExperiencePath(state) && !directedProfile.constraints.includes('pathway-deterministic-locked')) {
    const merged = buildMergedEducationExperienceRecommendations(directedProfile, state)
    if (merged?.length) {
      enrichedRecs = merged
    }
  }

  const backup = enrichedRecs.filter((r) => r.track === 'backup_income')
  const enforced = enforceCareerProgressionTracks(
    enrichedRecs.filter((r) => r.track === 'work_now'),
    enrichedRecs.filter((r) => r.track === 'build_next'),
    enrichedRecs.filter((r) => r.track === 'long_term'),
    directedProfile,
    state
  )
  enrichedRecs = [...enforced.workNow, ...backup, ...enforced.buildNext, ...enforced.longTerm]

  enrichedRecs = applyEnglishConfidenceRules(enrichedRecs, directedProfile, state)
  enrichedRecs = applyFieldCareerConsistencyRules(enrichedRecs, directedProfile, state)

  if (state && shouldApplyDualPathWeighting(state, directedProfile) && !directedProfile.constraints.includes('career-change-path')) {
    enrichedRecs = applyDualPathBalance(enrichedRecs, directedProfile, state)
  }

  if (!directedProfile.constraints.includes('career-change-path')) {
    enrichedRecs = filterForFastIncome(enrichedRecs, directedProfile, state)
  }

  const profileValidation = validateAndRepairRecommendations(enrichedRecs, directedProfile, state)
  const validationNotes: string[] = []
  if (profileValidation.repaired) {
    enrichedRecs = profileValidation.recs
    const reEnforced = enforceCareerProgressionTracks(
      enrichedRecs.filter((r) => r.track === 'work_now'),
      enrichedRecs.filter((r) => r.track === 'build_next'),
      enrichedRecs.filter((r) => r.track === 'long_term'),
      directedProfile,
      state
    )
    enrichedRecs = [
      ...reEnforced.workNow,
      ...backup,
      ...reEnforced.buildNext,
      ...reEnforced.longTerm,
    ]
    if (state && shouldApplyDualPathWeighting(state, directedProfile)) {
      enrichedRecs = applyDualPathBalance(enrichedRecs, directedProfile, state)
    }
    validationNotes.push(
      `Profile validation adjusted recommendations: ${profileValidation.issues.slice(0, 2).join('; ')}`
    )
  } else if (!profileValidation.valid) {
    validationNotes.push(`Profile validation note: ${profileValidation.issues.slice(0, 2).join('; ')}`)
  } else {
    validationNotes.push('Profile validation passed — recommendations reflect user preferences and constraints.')
  }

  enrichedRecs = enrichRecommendationsWithJourneyContext(enrichedRecs, directedProfile, state)

  const dualCareerPaths = state ? buildDualEducationExperiencePaths(directedProfile, state) : null

  let workNowRoles = enrichedRecs.filter((r) => r.track === 'work_now').map((r) => toPathRole(r))
  let buildNextRoles = enrichedRecs.filter((r) => r.track === 'build_next').map((r) => toPathRole(r))
  let longTermRoles = enrichedRecs.filter((r) => r.track === 'long_term').map((r) => toPathRole(r))
  const backupIncome = enrichedRecs.filter((r) => r.track === 'backup_income').map((r) => toPathRole(r))

  let employabilityScore = computeEmployabilityScore(directedProfile, state)
  let pathConfidence =
    directedProfile.constraints.includes('pathway-deterministic-locked')
      ? computeRecommendationConfidence(enrichedRecs, directedProfile, state)
      : computePathConfidenceScores(enrichedRecs, directedProfile, state)
  let notRecommended = buildWhyOtherPathsNotSelected(directedProfile, state)

  const polish = applyFinalResultPolish(
    enrichedRecs,
    directedProfile,
    state,
    employabilityScore,
    pathConfidence,
    notRecommended
  )
  enrichedRecs = polish.recs
  employabilityScore = polish.employabilityScore
  pathConfidence = directedProfile.constraints.includes('pathway-deterministic-locked')
    ? computeRecommendationConfidence(enrichedRecs, directedProfile, state)
    : polish.pathConfidence
  notRecommended = buildWhyOtherPathsNotSelected(directedProfile, state)

  if (polish.issues.length) {
    validationNotes.push(`Final polish: ${polish.issues.slice(0, 2).join('; ')}`)
  } else {
    validationNotes.push('Final polish passed — no duplication, ranked confidence, or contradictions.')
  }

  workNowRoles = enrichedRecs.filter((r) => r.track === 'work_now').map((r) => toPathRole(r, pathConfidence))
  buildNextRoles = enrichedRecs.filter((r) => r.track === 'build_next').map((r) => toPathRole(r, pathConfidence))
  longTermRoles = enrichedRecs.filter((r) => r.track === 'long_term').map((r) => toPathRole(r, pathConfidence))

  const workNow = workNowRoles
  const buildNext = buildNextRoles
  const longTerm = longTermRoles

  const careerLadderSummary = directedProfile.constraints.includes('pathway-deterministic-locked')
    ? buildCareerLadderFromPaths(workNow, buildNext, longTerm)
    : buildCareerLadderSummary(workNow, buildNext, longTerm)

  const mergedReasoning = [...strategyReasoning, ...reasoning, ...validationNotes]
  const progressionCheck = validateCareerProgression(
    enrichedRecs.filter((r) => r.track === 'work_now'),
    enrichedRecs.filter((r) => r.track === 'build_next'),
    enrichedRecs.filter((r) => r.track === 'long_term'),
    directedProfile,
    state
  )
  if (!progressionCheck.valid) {
    mergedReasoning.push(
      `Career ladder validation repaired output: ${progressionCheck.issues.slice(0, 3).join('; ')}`
    )
  } else {
    mergedReasoning.push('Career ladder validation passed — Long-Term Path contains destination roles only.')
  }
  mergedReasoning.push(`Recommendations built via ${source} for domain ${profile.domain}`)

  const allRoles = [...workNow, ...buildNext, ...longTerm, ...backupIncome]

  const personalizedSummary = buildPersonalizedJourneySummary(directedProfile, state, workNow)
  const pathComparison = buildCareerPathComparisonSummary(directedProfile, state)
  let whyThisPath = buildWhyThisPathExplanation(directedProfile, state, workNow)
  if (state && shouldApplyDualPathWeighting(state, directedProfile)) {
    whyThisPath = `${buildDualPathSummaryLine(directedProfile, state)}\n\n${whyThisPath}`
  }
  if (pathComparison) {
    whyThisPath = `${pathComparison}\n\n${whyThisPath}`
  }
  const practicalNextSteps = buildPracticalNextSteps(directedProfile, state, workNow)
  const englishDevelopmentPlan = buildEnglishDevelopmentPlan(directedProfile, workNow, state)
  const rightToWorkGuidance = buildRightToWorkGuidance(state ?? { answers: {} })
  const workEligibilityResult = getWorkEligibilityResult(state ?? { answers: {} })
  const specialPathway = buildSpecialPathwayPlan(
    directedProfile,
    workNow,
    buildNext,
    longTerm,
    state
  )

  const baseOutput: CareerBrainOutput = {
    careerProfile: directedProfile,
    recommendedPaths: { workNow, buildNext, longTerm, backupIncome },
    dualCareerPaths: dualCareerPaths ?? undefined,
    jobSearchKeywords: buildJobSearchKeywords(directedProfile, allRoles),
    missingSkills: buildMissingSkills(directedProfile, state).map(softenBarrierLanguage),
    mainBarriers: buildMainBarriers(directedProfile),
    nextJobAZActions: buildNextJobAZActions(directedProfile, state, workNow),
    practicalNextSteps,
    whyThisPath,
    careerLadderSummary,
    personalizedSummary,
    reasoning: mergedReasoning,
    employabilityScore,
    pathConfidence,
    englishDevelopmentPlan,
    notRecommended,
    rightToWorkGuidance,
    workEligibilityGuidance: workEligibilityResult.message || rightToWorkGuidance,
    workEligibilityNextSteps: workEligibilityResult.nextSteps,
    specialPathway,
  }

  if (state && isUnemployedPath(state)) {
    const intelligence = buildUnemployedIntelligence(directedProfile, state, employabilityScore)
    if (intelligence) {
      return mergeUnemployedIntelligenceIntoOutput(baseOutput, intelligence, state)
    }
  }

  if (state && isCareerChangePath(state)) {
    const intelligence = buildCareerChangeIntelligence(directedProfile, state)
    if (intelligence) {
      return mergeCareerChangeIntelligenceIntoOutput(baseOutput, intelligence, state)
    }
  }

  if (state && isGrowCareerPathComplete(state)) {
    const intelligence = buildGrowCareerIntelligence(directedProfile, state)
    if (intelligence) {
      return mergeGrowCareerIntelligenceIntoOutput(baseOutput, intelligence, state)
    }
  }

  return baseOutput
}

/** Output when work eligibility blocks standard job pathways. */
export function buildBlockedCareerBrainOutput(
  profile: CareerProfile,
  state?: import('./types').CareerBrainState
): CareerBrainOutput {
  const s = state ?? { answers: {} }
  const guidance = buildRightToWorkGuidance(s)
  const engineSteps = buildWorkEligibilityNextSteps(s)
  const eligibility = getWorkEligibilityResult(s)
  const practicalNextSteps = (
    engineSteps.length
      ? engineSteps
      : [
          'Verify your right to work with the Home Office or an immigration adviser',
          'Contact your local Jobcentre Plus for permitted support options',
        ]
  ).map((label) => ({
    action: 'GUIDANCE' as const,
    label,
  }))

  return {
    careerProfile: { ...profile, canWorkInUk: false },
    recommendedPaths: { workNow: [], buildNext: [], longTerm: [], backupIncome: [] },
    jobSearchKeywords: [],
    missingSkills: [],
    mainBarriers: [guidance],
    nextJobAZActions: practicalNextSteps,
    practicalNextSteps,
    whyThisPath: guidance,
    careerLadderSummary: '',
    personalizedSummary: guidance,
    reasoning: ['UK work eligibility engine blocked standard job pathway generation.'],
    employabilityScore: 0,
    pathConfidence: [],
    englishDevelopmentPlan: null,
    notRecommended: [],
    rightToWorkGuidance: guidance,
    workEligibilityGuidance: eligibility.message || guidance,
    workEligibilityNextSteps: engineSteps,
    specialPathway: null,
  }
}

function buildSummary(
  profile: CareerProfile,
  state?: import('./types').CareerBrainState,
  workNow?: CareerPathRole[]
): string {
  return buildWhyThisPathExplanation(profile, state, workNow)
}

export function mapOutputToLegacyResult(
  output: CareerBrainOutput,
  state?: import('./types').CareerBrainState
): NonNullable<CareerBrainTurnResult['response']['result']> {
  const profile = output.careerProfile
  const grow = output.growCareerGrowth
  let { recommendedPaths } = output

  if (grow && grow.finalReport) {
    const domain = profile.domain
    recommendedPaths = {
      workNow: [{ title: grow.finalReport.workNow, why: grow.currentPositionSummary, domain, source: 'fallback' }],
      buildNext: [{ title: grow.finalReport.buildNext, why: grow.nextRealisticStep.reason, domain, source: 'fallback' }],
      longTerm: [{ title: grow.finalReport.longTermPath, why: grow.longTermCareerDirection, domain, source: 'fallback' }],
      backupIncome: [],
    }
  }

  const mapDir = (roles: CareerPathRole[], track: string) =>
    roles.map((r, i) => ({
      direction_id: slugId(r.title, track, i),
      direction_title: r.title,
      why: [r.why, `(${r.source})`],
      chips: [domainLabel(r.domain)],
    }))

  const workNowDirs = mapDir(recommendedPaths.workNow, 'work_now')
  const improveDirs = [
    ...mapDir(recommendedPaths.buildNext, 'build_next'),
    ...mapDir(recommendedPaths.longTerm, 'long_term'),
    ...mapDir(recommendedPaths.backupIncome, 'backup'),
  ]

  const avoid: string[] = output.notRecommended.map((n) => `${n.title} — ${n.reason}`)
  if (output.rightToWorkGuidance && !recommendedPaths.workNow.length && !grow) {
    avoid.unshift(output.rightToWorkGuidance)
  }
  if (isFieldFirstMode(profile) && avoid.length < 4 && !grow) {
    avoid.push(
      'Treating construction, warehouse, or generic admin as your main career plan unless you explicitly need any urgent job'
    )
  }

  const summaryText = grow?.finalReport?.careerSummary ?? buildSummary(profile, state, recommendedPaths.workNow)

  const useGrowFallback = !!grow
  const workNowDirections = workNowDirs.length
    ? workNowDirs
    : useGrowFallback
      ? workNowDirs
      : improveDirs.slice(0, 2)

  return {
    summary: summaryText,
    work_now: {
      directions: workNowDirections,
    },
    improve_later: improveDirs.length ? { directions: improveDirs } : null,
    avoid,
    next_step: (() => {
      const first =
        output.practicalNextSteps[0] ??
        output.nextJobAZActions[0]
      if (first && ['CREATE_CV', 'JOB_FINDER', 'BUILD_YOUR_PATH'].includes(first.action)) {
        return first as {
          action: 'CREATE_CV' | 'JOB_FINDER' | 'BUILD_YOUR_PATH'
          label: string
          href?: string
        }
      }
      return {
        action: 'CREATE_CV' as const,
        label: 'Build your UK-style CV',
        href: '/cv-builder-v2',
      }
    })(),
    career_brain: output,
  }
}

export function rec(
  title: string,
  why: string,
  track: CareerBrainRecommendation['track'],
  domain: CareerProfile['domain'],
  source: 'ai' | 'fallback' = 'fallback'
): CareerBrainRecommendation {
  return { title, why, track, field_tag: domain, domain, source }
}

export function filterFieldFirstRecs(
  profile: CareerProfile,
  recs: CareerBrainRecommendation[]
): CareerBrainRecommendation[] {
  if (!isFieldFirstMode(profile)) return recs
  const primary = recs.filter((r) => r.track !== 'backup_income')
  const backup = recs.filter((r) => r.track === 'backup_income')
  const cleanPrimary = primary.filter((r) => !isGenericJobTitle(r.title))
  if (cleanPrimary.length >= 3) return [...cleanPrimary, ...backup]
  return recs
}
