import { defaultSalaryForPath } from '@/lib/career-hub/marketplace/salary'
import type { AssessmentBundle } from './planFromAssessment'
import {
  EXPERIENCED_TECH_PROGRESSION,
  getRouteProgression,
  isExperiencedProfessionalPlan,
  isUnrealisticEntryTitle,
  resolveFirstRealisticRole,
} from './routeProfiles'
import type { CareerDestination, CareerPlanType } from './types'

export function buildCareerDestination(
  bundle: AssessmentBundle,
  routeLabel: string,
  pathId: string | null,
  planType: CareerPlanType
): CareerDestination {
  const brain = bundle.brain
  const uk = brain?.ukTransitionGrowth?.finalReport
  const workNowTitle = brain?.recommendedPaths?.workNow?.[0]?.title
  const ukJobTitle = uk?.recommendedJobs?.[0]?.title

  const experienced = isExperiencedProfessionalPlan({
    pathId,
    yearsOfExperience: brain?.careerProfile?.yearsOfExperience,
    planType,
    domain: brain?.careerProfile?.domain,
  })

  const isTechExperienced =
    experienced &&
    (brain?.careerProfile?.domain === 'IT_digital' ||
      pathId === 'digital-ai-beginner' ||
      /developer|software|engineer|it/i.test(workNowTitle ?? ''))

  const progression = isTechExperienced
    ? EXPERIENCED_TECH_PROGRESSION
    : getRouteProgression(pathId)

  const targetRole = resolveFirstRealisticRole(
    [uk?.targetRole, workNowTitle, ukJobTitle, bundle.ruleResult.work_now?.directions?.[0]?.direction_title],
    pathId
  )

  const nextRole = resolveFirstRealisticRole(
    [brain?.recommendedPaths?.buildNext?.[0]?.title, uk?.ukPathSteps?.[1]?.title],
    pathId
  )
  const advancedPath = resolveFirstRealisticRole(
    [brain?.recommendedPaths?.longTerm?.[0]?.title, uk?.longTermCareerPath?.split('.')[0]],
    pathId
  )

  const finalNext = !nextRole || isUnrealisticEntryTitle(nextRole) || nextRole === targetRole
    ? progression.nextRole
    : nextRole

  const finalAdvanced =
    !advancedPath || isUnrealisticEntryTitle(advancedPath) || advancedPath === finalNext
      ? progression.advancedPath
      : advancedPath

  const workSalary = brain?.recommendedPaths?.workNow?.[0]?.expectedSalary
  const buildSalary = brain?.recommendedPaths?.buildNext?.[0]?.expectedSalary
  const longSalary = brain?.recommendedPaths?.longTerm?.[0]?.expectedSalary

  let salarySteps = progression.salaries.map((amount, i) => ({
    label: progression.horizons[i] ?? (i === 0 ? 'Now' : 'Future'),
    amount,
  }))

  if (workSalary) {
    salarySteps = [
      { label: 'Now', amount: workSalary },
      { label: '6–24 months', amount: buildSalary ?? progression.salaries[1] },
      { label: '2–5 years', amount: longSalary ?? progression.salaries[2] },
    ]
  } else if (pathId && !workSalary) {
    const s = defaultSalaryForPath(pathId)
    salarySteps = [
      { label: 'Now', amount: s.starting },
      { label: '6–24 months', amount: s.experienced },
      { label: '2–5 years', amount: s.levels?.[2]?.range ?? '£40k+' },
    ]
  }

  return {
    currentRoute: routeLabel,
    targetRole,
    nextRole: finalNext,
    advancedPath: finalAdvanced,
    salarySteps,
    timeHorizons: [
      { label: targetRole, period: 'Now' },
      { label: finalNext, period: '6–24 months' },
      { label: finalAdvanced, period: '2–5 years' },
    ],
  }
}

export function destinationTargetRole(destination: CareerDestination): string {
  return destination.targetRole
}
