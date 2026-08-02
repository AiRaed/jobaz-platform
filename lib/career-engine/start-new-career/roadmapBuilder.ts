import { buildCareerChangeTransitionPlan } from '@/lib/career-brain/careerChangeEngine'
import { getTargetBlueprint, resolveWorkNowRoles } from '@/lib/career-brain/careerChangeTransitionAdvisor'
import type { CareerProfile } from '@/lib/career-brain/types'
import { careerHubPathHref } from '@/lib/career-hub/myPlan'
import { analyzeProfession } from '@/lib/career-engine/experience-path/consultant'
import type { ExperiencePathAnswers, YearsExperience } from '@/lib/career-engine/experience-path/types'
import type { EnglishLevel, EssentialAction } from '@/lib/career-engine/shared/planTypes'
import { resolveCareerSectorId, type CareerSectorId } from '@/lib/career-engine/shared/careerSectors'
import {
  mapStartNewCareerToCareerBrainState,
  resolveDisplayCurrentField,
  resolveDisplayTargetField,
} from './mapToCareerBrain'
import { resolveTargetIndustryAndSpec } from './targetSector'
import { SITUATION_LABELS } from './questions'
import { requireExplicitTargetForKnownCareerPath } from './situationUtils'
import {
  buildNextRoadmap,
  buildPersonalizedTimelinePhases,
  buildRealityCheckSummary,
  ladderToLongTermDirections,
  prioritizeEssentialActions,
  resolveProgressiveCareerLadder,
} from './roadmapAdvisor'
import {
  assessProfile,
  attachTargetSector,
  buildPathRationale,
  resolvePersonalizedLongTerm,
  resolveRealisticWorkNow,
  resolveTargetSlugForSector,
} from './transitionAdvisor'
import type { StartNewCareerPlanResult, StartNewCareerSituation, TransitionRouteType } from './types'

const CV = '/cv-builder'

function mapExperienceYears(years?: string): YearsExperience {
  if (years === '0_1' || years === '1_3') return '1_2'
  if (years === '3_5') return '3_5'
  if (years === '5_10') return '6_10'
  return '10_plus'
}

function classifyRouteType(
  difficulty: string,
  mustUseBridge: boolean,
  urgency?: string,
  studyWilling?: string
): { routeType: TransitionRouteType; routeTypeLabel: string } {
  if (mustUseBridge && (urgency === 'study_first' || studyWilling === 'yes')) {
    return { routeType: 'long_term_goal', routeTypeLabel: 'Long-Term Goal' }
  }
  if (mustUseBridge && difficulty === 'Hard') {
    return { routeType: 'major_retraining', routeTypeLabel: 'Major Retraining' }
  }
  if (mustUseBridge) {
    return { routeType: 'bridge_transition', routeTypeLabel: 'Bridge Transition' }
  }
  if (difficulty === 'Easy') {
    return { routeType: 'direct_transition', routeTypeLabel: 'Direct Transition' }
  }
  return { routeType: 'bridge_transition', routeTypeLabel: 'Bridge Transition' }
}

function buildSyntheticTargetAnswers(
  answers: Record<string, string>,
  industryId: string,
  specId: string
): ExperiencePathAnswers {
  const experienced =
    answers.starting_situation === 'experienced_known_target' ||
    answers.starting_situation === 'experienced_unknown_target'

  return {
    industry: industryId as ExperiencePathAnswers['industry'],
    experience_specialisation: specId,
    years_experience: experienced ? mapExperienceYears(answers.experience_years) : '1_2',
    highest_position: 'skilled_worker',
    experience_country: answers.uk_work_experience === 'yes' ? 'uk' : 'outside_uk',
    english_level: (answers.english_level ?? 'intermediate') as EnglishLevel,
    uk_work_experience: answers.uk_work_experience === 'yes' ? 'yes' : 'no',
    management_experience: 'no',
    open_to_certifications: answers.study_willing === 'yes' ? 'yes' : 'no',
    driving_licence: 'not_applicable',
    preferred_location: answers.preferred_location ?? 'UK-wide',
  }
}

/** Build full roadmap — used for confirmed careers and discovery previews. */
export function buildStartNewCareerRoadmap(
  answers: Record<string, string>
): StartNewCareerPlanResult {
  requireExplicitTargetForKnownCareerPath(answers)

  const situation = answers.starting_situation as StartNewCareerSituation
  const location = answers.preferred_location?.trim() || 'UK-wide'
  const state = mapStartNewCareerToCareerBrainState(answers)
  const profile = {
    domain: 'admin_business',
    constraints: ['start-new-career-path'],
    transferableSkills: [],
  } as CareerProfile

  const plan = buildCareerChangeTransitionPlan(profile, state)
  const currentField = resolveDisplayCurrentField(answers)
  const targetField = resolveDisplayTargetField(answers)

  const targetSector = resolveCareerSectorId(String(answers.target_field ?? ''))
  if (!targetSector) {
    throw new Error('Invalid or missing target career — user must select a career field explicitly.')
  }

  let assessment = assessProfile(answers, targetField || plan.targetField, currentField)
  assessment = attachTargetSector(assessment, targetSector)

  const targetSlug = resolveTargetSlugForSector(targetSector)
  const blueprint = targetSlug ? getTargetBlueprint(targetSlug) : getTargetBlueprint(plan.targetSlug)
  const blueprintWorkNow = targetSlug
    ? resolveWorkNowRoles(plan.currentSlug, targetSlug)
    : plan.workNow.map((r) => ({
        title: r.title,
        expectedSalary: r.expectedSalary ?? '£21k–£26k',
        entryDifficulty: r.entryDifficulty ?? ('Low' as const),
      }))

  const targetMapping = resolveTargetIndustryAndSpec(targetSector)
  let rawEssentialActions: EssentialAction[] = []
  let recommendedCourses: StartNewCareerPlanResult['recommendedCourses'] = []

  if (targetMapping) {
    const targetAnswers = buildSyntheticTargetAnswers(
      answers,
      targetMapping.industryId,
      targetMapping.specId
    )
    const targetProfile = analyzeProfession(targetAnswers)
    rawEssentialActions = targetProfile.essentialActions
    recommendedCourses = targetProfile.courses.map((course) => ({
      ...course,
      href: course.pathId ? careerHubPathHref(course.pathId) : CV,
    }))
  }

  const essentialActions = prioritizeEssentialActions(assessment, rawEssentialActions, answers)

  const workNow = resolveRealisticWorkNow(assessment, blueprintWorkNow, location)
  const buildNext = buildNextRoadmap(
    assessment,
    blueprint,
    essentialActions,
    recommendedCourses
  )

  const careerProgression = resolveProgressiveCareerLadder(targetSector, blueprint, assessment)
  const longTermResult = resolvePersonalizedLongTerm(assessment, targetSector, blueprint)
  let longTerm = ladderToLongTermDirections(careerProgression, assessment)
  if (longTermResult.honestNote && longTerm[0]) {
    longTerm = [
      {
        ...longTerm[0],
        why: [longTermResult.honestNote, ...longTerm[0].why],
      },
      ...longTerm.slice(1),
    ]
  }

  const pathRationale = buildPathRationale(
    assessment,
    workNow.map((w) => w.title),
    targetSlug
  )

  const { routeType, routeTypeLabel } = classifyRouteType(
    plan.transitionDifficulty,
    assessment.mustUseBridgeEmployment,
    answers.urgency,
    answers.study_willing
  )

  const supportiveMessage =
    longTermResult.honestNote && assessment.mustUseBridgeEmployment
      ? `${pathRationale} ${longTermResult.honestNote}`
      : pathRationale

  const estimatedTimeline = longTermResult.timeline ?? plan.estimatedTimeline
  const realityCheckSummary = buildRealityCheckSummary(
    assessment,
    answers,
    targetField || plan.targetField,
    estimatedTimeline,
    plan.transitionReadinessScore
  )
  const timelinePhases = buildPersonalizedTimelinePhases(
    assessment,
    essentialActions.map((a) => a.title),
    buildNext.map((b) => b.title),
    estimatedTimeline
  )
  const ladderSummary = careerProgression.join(' → ')

  return {
    pathId: 'start_new_career',
    phase: 'roadmap',
    situation,
    situationLabel: SITUATION_LABELS[situation] ?? situation,
    currentField,
    targetField: targetField || plan.targetField,
    routeType,
    routeTypeLabel,
    supportiveMessage,
    pathRationale,
    barriers: assessment.barriers,
    answers,
    realityCheckSummary,
    careerProgression,
    transition: {
      difficulty: plan.transitionDifficulty,
      estimatedTimeline,
      readinessScore: plan.transitionReadinessScore,
      readinessSummary: plan.transitionReadinessSummary,
      transferableSkills: plan.transferableSkills,
      summary: plan.summary,
      realityCheck: plan.realityCheck,
      fastestRouteSummary: plan.fastestRouteSummary,
    },
    triad: {
      workNow,
      buildNext,
      longTerm,
      supportiveSummary: pathRationale,
      ladderSummary,
    },
    timelinePhases,
    essentialActions,
    recommendedCourses,
    location,
  }
}

export function buildStartNewCareerRoadmapForSector(
  answers: Record<string, string>,
  sectorId: CareerSectorId
): StartNewCareerPlanResult {
  return buildStartNewCareerRoadmap({
    ...answers,
    target_field: sectorId,
    target_confirmed: 'yes',
  })
}
