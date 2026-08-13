/**
 * Career Roadmap — single source of truth for My Plan dashboard.
 * All widgets derive from generateCareerRoadmap().
 */

import { slugifyCourseName } from '@/lib/career-hub/slug'
import { courseDetailHref } from '@/lib/career-hub/myPlan'
import type { MissionItem } from '@/lib/career-journey/actionPlanTypes'
import {
  JOURNEY_STEP_APPLY,
  JOURNEY_STEP_ASSESSMENT,
  JOURNEY_STEP_CV,
  JOURNEY_STEP_FIRST_JOB,
  JOURNEY_STEP_GROWTH,
  JOURNEY_STEP_INTERVIEW,
  JOURNEY_STEP_TRAINING,
} from '@/lib/career-journey/actionPlanTypes'
import type { AssessmentBundle } from './planFromAssessment'
import {
  detectPlanType,
  extractSuggestedRoles,
  resolvePathId,
  resolveRouteLabel,
  resolveTimeToEmployment,
} from './planFromAssessment'
import { buildCareerDestination, destinationTargetRole } from './careerDestination'
import { buildRouteInsightCards } from './routeInsights'
import { collectAssessmentTrainingRequirements } from './routeRequirements'
import { computeCareerReadiness } from './readiness'
import { groupRequirementsBySection } from './trainingActions'
import { buildPathPlanLadder } from './pathPlanLadder'
import type { PathPlanLadder } from './pathPlanLadder'
import { isJobAZPlan } from './mapCareerCoachResultToPlan'
import { isSiaDoorTitle, titlesMatchLoose } from './myPlanDisplayFilter'
import type {
  CareerMilestone,
  CareerPlanType,
  CareerRoadmap,
  MilestoneStatus,
  PlanActivitySignals,
  PlanNextAction,
  RouteRequirement,
  RoadmapTaskKind,
  RoadmapTaskSource,
} from './types'

const ROUTE_BODY = /\b(ACCA|CIMA|ICAEW|ACA|AAT|CFA)\b/i
const APPLY_TARGET = 5
const INTERVIEW_READY = 55

function formatTrainingMissionLabel(name: string): string {
  const n = name.trim()
  if (/enic|qualification recognition|uk qualification/i.test(n)) {
    return 'Complete UK qualification recognition'
  }
  if (/\broute\b/i.test(n) && ROUTE_BODY.test(n)) {
    return `Check ${n.replace(/\s*route\s*/i, ' ').trim()} entry requirements`
  }
  if (ROUTE_BODY.test(n)) {
    return `Check ${n.replace(/\s*route\s*/i, ' ').trim()} entry requirements`
  }
  return `Complete ${n}`
}

function inferTaskSource(req: RouteRequirement): RoadmapTaskSource {
  if (req.source === 'essential_action') return 'essential_action'
  if (req.source === 'recommended_course') return 'recommended_course'
  if (req.type === 'course') return 'recommended_course'
  return 'requirement'
}

function splitTrainingDetails(requirements: RouteRequirement[]) {
  const essentialActions = requirements.filter(
    (r) =>
      r.source === 'essential_action' ||
      r.type === 'licence' ||
      /enic|recognition|route|membership|\b(ACCA|CIMA|ICAEW|AAT)\b/i.test(r.name)
  )
  const essentialIds = new Set(essentialActions.map((r) => r.id))
  const recommendedCourses = requirements.filter(
    (r) => !essentialIds.has(r.id) && (r.source === 'recommended_course' || r.type === 'course')
  )
  return { essentialActions, recommendedCourses }
}

function buildRawTasks(
  requirements: RouteRequirement[],
  signals: PlanActivitySignals
): Omit<CareerRoadmap['tasks'][number], 'status' | 'completed'>[] {
  const tasks: Omit<CareerRoadmap['tasks'][number], 'status' | 'completed'>[] = [
    {
      id: 'assessment',
      phaseId: 'assessment',
      kind: 'assessment',
      source: 'system',
      label: 'Assessment Completed',
      missionLabel: 'Complete Career Assessment',
      href: '/uk-career-assistant',
    },
    {
      id: 'cv',
      phaseId: 'build_cv',
      kind: 'cv',
      source: 'system',
      label: 'Build UK CV',
      missionLabel: signals.hasBaseCv && !signals.cvReady ? 'Improve UK CV' : 'Build UK CV',
      href: '/cv-builder-v2',
      target: 1,
    },
  ]

  for (const req of requirements) {
    tasks.push({
      id: `training-${req.id}`,
      phaseId: 'training',
      kind: 'training',
      source: inferTaskSource(req),
      label: req.name,
      missionLabel: formatTrainingMissionLabel(req.name),
      href: req.courseHref ?? (req.pathId ? courseDetailHref(req.pathId, req.slug) : '/dashboard#recommended-training'),
      actionLabel: req.actionLabel,
      description: req.expectedImpact,
      requirement: req,
      target: 1,
    })
  }

  tasks.push(
    {
      id: 'apply',
      phaseId: 'apply_jobs',
      kind: 'apply',
      source: 'system',
      label: `Apply to ${APPLY_TARGET} Jobs`,
      missionLabel: `Apply to ${APPLY_TARGET} Jobs`,
      href: '/job-finder',
      target: APPLY_TARGET,
    },
    {
      id: 'interview',
      phaseId: 'interview',
      kind: 'interview',
      source: 'system',
      label: 'Interview Practice',
      missionLabel: 'Practice Interview Questions',
      href: '/interview-coach',
      target: 1,
    },
    {
      id: 'first_job',
      phaseId: 'first_job',
      kind: 'first_job',
      source: 'system',
      label: 'First Job',
      missionLabel: 'Land Your First UK Role',
      href: '/job-finder',
      target: 1,
    },
    {
      id: 'growth',
      phaseId: 'career_growth',
      kind: 'growth',
      source: 'system',
      label: 'Career Growth',
      missionLabel: 'Plan Your Next Career Move',
      href: '/dashboard?tab=plan',
      target: 1,
    }
  )

  return tasks
}

function isTaskComplete(
  task: Omit<CareerRoadmap['tasks'][number], 'status' | 'completed'>,
  signals: PlanActivitySignals
): boolean {
  switch (task.kind) {
    case 'assessment':
      return true
    case 'cv':
      return Boolean(signals.cvReady || signals.hasBaseCv)
    case 'training':
      return task.requirement?.status === 'completed'
    case 'apply':
      return signals.appliedJobsCount >= APPLY_TARGET
    case 'interview':
      return signals.interviewConfidence >= INTERVIEW_READY
    case 'first_job':
    case 'growth':
      return false
    default:
      return false
  }
}

function taskCurrentValue(
  task: Omit<CareerRoadmap['tasks'][number], 'status' | 'completed'>,
  signals: PlanActivitySignals
): number {
  if (task.kind === 'cv') return signals.cvReady || signals.hasBaseCv ? 1 : 0
  if (task.kind === 'apply') return signals.appliedJobsCount
  if (task.kind === 'interview') return signals.interviewConfidence >= INTERVIEW_READY ? 1 : 0
  if (task.kind === 'training') return task.requirement?.status === 'completed' ? 1 : 0
  return 0
}

function applyTaskStatuses(tasks: CareerRoadmap['tasks']): CareerRoadmap['tasks'] {
  const firstIncomplete = tasks.findIndex((t) => !t.completed)
  return tasks.map((task, index) => {
    if (task.completed) return { ...task, status: 'complete' as MilestoneStatus }
    if (firstIncomplete === -1) return { ...task, status: 'pending' as MilestoneStatus }
    if (index === firstIncomplete) return { ...task, status: 'current' as MilestoneStatus }
    return { ...task, status: 'pending' as MilestoneStatus }
  })
}

function buildPhases(tasks: CareerRoadmap['tasks'], hasTraining: boolean): CareerRoadmap['phases'] {
  const phaseDefs: Array<{ id: string; label: string; journeyLabel: string; taskIds: string[] }> = [
    { id: 'assessment', label: 'Assessment Completed', journeyLabel: JOURNEY_STEP_ASSESSMENT, taskIds: ['assessment'] },
    { id: 'build_cv', label: 'Build UK CV', journeyLabel: JOURNEY_STEP_CV, taskIds: ['cv'] },
  ]

  if (hasTraining) {
    phaseDefs.push({
      id: 'training',
      label: JOURNEY_STEP_TRAINING,
      journeyLabel: JOURNEY_STEP_TRAINING,
      taskIds: tasks.filter((t) => t.kind === 'training').map((t) => t.id),
    })
  }

  phaseDefs.push(
    { id: 'apply_jobs', label: `Apply to ${APPLY_TARGET} Jobs`, journeyLabel: JOURNEY_STEP_APPLY, taskIds: ['apply'] },
    { id: 'interview', label: 'Interview Practice', journeyLabel: JOURNEY_STEP_INTERVIEW, taskIds: ['interview'] },
    { id: 'first_job', label: 'First Job', journeyLabel: JOURNEY_STEP_FIRST_JOB, taskIds: ['first_job'] },
    { id: 'career_growth', label: 'Career Growth', journeyLabel: JOURNEY_STEP_GROWTH, taskIds: ['growth'] }
  )

  return phaseDefs.map((def) => {
    const phaseTasks = tasks.filter((t) => def.taskIds.includes(t.id))
    const completed = phaseTasks.length > 0 && phaseTasks.every((t) => t.completed)
    const status: MilestoneStatus = completed
      ? 'complete'
      : phaseTasks.some((t) => t.status === 'current')
        ? 'current'
        : 'pending'
    const currentTask = phaseTasks.find((t) => t.status === 'current') ?? phaseTasks.find((t) => !t.completed)
    return {
      id: def.id,
      label: def.journeyLabel,
      status,
      href: currentTask?.href,
      tasks: phaseTasks,
    }
  })
}

function buildJourneySteps(phases: CareerRoadmap['phases']): readonly string[] {
  return phases.map((p) => p.label)
}

function computeCurrentPhaseIndex(phases: CareerRoadmap['phases']): number {
  const current = phases.findIndex((p) => p.status === 'current')
  if (current >= 0) return current
  const firstPending = phases.findIndex((p) => p.status === 'pending')
  return firstPending >= 0 ? firstPending : phases.length - 1
}

function computeProgressPercent(phases: CareerRoadmap['phases']): number {
  const tracked = phases.filter((p) => p.id !== 'career_growth')
  if (!tracked.length) return 0
  const complete = tracked.filter((p) => p.status === 'complete').length
  return Math.round((complete / tracked.length) * 100)
}

function taskToNextAction(task: CareerRoadmap['tasks'][number]): PlanNextAction {
  switch (task.kind) {
    case 'cv':
      return { priority: task.missionLabel, buttonLabel: 'Open CV Builder', href: task.href }
    case 'training':
      return {
        priority: task.missionLabel,
        buttonLabel:
          task.actionLabel ??
          (task.requirement?.status === 'in_progress' ? 'Continue Training' : 'Open Training'),
        href: task.href,
      }
    case 'apply':
      return { priority: task.missionLabel, buttonLabel: 'Find Jobs', href: task.href }
    case 'interview':
      return { priority: task.missionLabel, buttonLabel: 'Interview Coach', href: task.href }
    case 'first_job':
      return { priority: task.missionLabel, buttonLabel: 'Find Jobs', href: task.href }
    case 'growth':
      return { priority: task.missionLabel, buttonLabel: 'View Career Plan', href: task.href }
    default:
      return { priority: task.missionLabel, buttonLabel: 'Continue', href: task.href }
  }
}

function statusFromProgress(completed: boolean, started: boolean): MissionItem['status'] {
  if (completed) return 'done'
  if (started) return 'in_progress'
  return 'not_started'
}

function buildMissions(tasks: CareerRoadmap['tasks']): MissionItem[] {
  const missionTasks = tasks.filter((t) => t.kind === 'cv' || t.kind === 'training' || t.kind === 'apply')
  return missionTasks.map((task) => {
    const completed = Boolean(task.completed)
    const started = !completed && (task.current ?? 0) > 0
    return {
      id: task.id,
      label: task.missionLabel,
      href: task.href,
      completed,
      guestLocked: false,
      locked: false,
      target: task.target,
      current: task.current,
      status: statusFromProgress(completed, started),
      actionLabel:
        task.kind === 'cv'
          ? 'Open CV Builder'
          : task.kind === 'training'
            ? task.actionLabel ?? 'View course'
            : 'Find jobs',
    }
  })
}

function buildSecurityExtraIncomeMissions(
  ladder: PathPlanLadder,
  signals: PlanActivitySignals
): MissionItem[] {
  const startRole = ladder.startNow[0]?.title ?? 'Matchday Steward'
  const trainRaw = ladder.trainNext[0]?.title ?? 'SIA Door Supervisor'
  const trainStepLabel = isSiaDoorTitle(trainRaw) ? 'SIA Door Supervisor' : trainRaw
  const firstAid = ladder.relevantAddOns.find((s) => /first\s*aid/i.test(s.title))
  const trainCard = ladder.structuredCards.find((c) =>
    titlesMatchLoose(c.title, trainRaw) || isSiaDoorTitle(c.title)
  )
  const trainHref = trainCard?.slug
    ? `/courses/${trainCard.slug}`
    : '/dashboard#recommended-training'
  const trainActionLabel = trainCard?.referralUrl?.trim()
    ? 'Apply Now'
    : trainCard?.slug || trainCard?.officialUrl
      ? 'View Course'
      : 'View Course'

  const cvDone = Boolean(signals.cvReady || signals.hasBaseCv)
  const applyDone = signals.appliedJobsCount >= 3
  const applyStarted = signals.appliedJobsCount > 0
  const saveDone = signals.savedJobsCount >= 2
  const saveStarted = signals.savedJobsCount > 0

  const missions: MissionItem[] = [
    {
      id: 'cv-security',
      label: 'Improve simple security/events CV',
      href: '/cv-builder-v2?planTask=cv-security',
      completed: cvDone,
      guestLocked: false,
      locked: false,
      target: 1,
      current: cvDone ? 1 : 0,
      status: statusFromProgress(cvDone, false),
      actionLabel: 'Open CV Builder',
    },
    {
      id: 'train-sia',
      label: isSiaDoorTitle(trainRaw)
        ? 'Compare/book an SIA Door Supervisor course'
        : `Compare/book a ${trainStepLabel} course`,
      href: trainHref,
      completed: false,
      guestLocked: false,
      locked: false,
      target: 1,
      current: 0,
      status: 'not_started',
      actionLabel: trainActionLabel,
      confirmOnDone: 'course_booked',
    },
    {
      id: 'apply-steward',
      label: `Apply to 3 ${startRole} roles`,
      href: `/job-finder?query=${encodeURIComponent(startRole)}&planTask=apply-steward`,
      completed: applyDone,
      guestLocked: false,
      locked: false,
      target: 3,
      current: Math.min(signals.appliedJobsCount, 3),
      status: statusFromProgress(applyDone, applyStarted),
      actionLabel: 'View jobs',
    },
    {
      id: 'save-security',
      label: 'Save 2 security/event jobs',
      href: `/job-finder?query=${encodeURIComponent(
        /matchday|steward/i.test(startRole) ? 'Event Steward' : 'security steward'
      )}&planTask=save-security`,
      completed: saveDone,
      guestLocked: false,
      locked: false,
      target: 2,
      current: Math.min(signals.savedJobsCount, 2),
      status: statusFromProgress(saveDone, saveStarted),
      actionLabel: 'Find jobs',
    },
  ]

  if (firstAid) {
    const firstAidCard = ladder.structuredCards.find((c) => titlesMatchLoose(c.title, firstAid.title))
    const firstAidPublished = Boolean(
      firstAidCard?.slug || firstAidCard?.referralUrl || firstAidCard?.officialUrl
    )
    missions.push({
      id: 'optional-first-aid',
      label: /first\s*aid/i.test(firstAid.title)
        ? 'Optional: Compare First Aid at Work'
        : `Optional: Compare ${firstAid.title}`,
      href: firstAidCard?.slug
        ? `/courses/${firstAidCard.slug}`
        : '/dashboard#recommended-training',
      completed: false,
      guestLocked: false,
      locked: false,
      target: 1,
      current: 0,
      status: 'not_started',
      optional: true,
      actionLabel: firstAidPublished ? 'View course' : 'Optional add-on',
    })
  }

  return missions
}

function filterRequirementsToLadder(
  requirements: RouteRequirement[],
  ladder: PathPlanLadder | null
): RouteRequirement[] {
  if (!ladder?.trainingTitles.length) return requirements
  return requirements.filter((req) =>
    ladder.trainingTitles.some((t) => titlesMatchLoose(t, req.name))
  )
}

function nextActionFromSecurityMissions(
  missions: MissionItem[]
): PlanNextAction {
  const next =
    missions.find((m) => !m.optional && m.status !== 'done' && !m.completed) ??
    missions.find((m) => !m.completed) ??
    missions[0]
  if (!next) {
    return { priority: 'Continue your plan', buttonLabel: 'Open Plan', href: '/dashboard' }
  }
  return {
    priority: next.label,
    buttonLabel: next.actionLabel || 'Continue',
    href: next.href,
  }
}

function buildMilestones(phases: CareerRoadmap['phases']): CareerMilestone[] {
  return phases.map((phase) => ({
    id: phase.id,
    label: phase.label,
    status: phase.status,
    href: phase.href,
    kind:
      phase.id === 'assessment'
        ? 'assessment'
        : phase.id === 'build_cv'
          ? 'cv'
          : phase.id === 'training'
            ? 'requirement'
            : phase.id === 'apply_jobs'
              ? 'jobs_applied'
              : phase.id === 'interview'
                ? 'interview'
                : 'employment',
  }))
}

export function generateCareerRoadmap(
  bundle: AssessmentBundle,
  signals: PlanActivitySignals
): CareerRoadmap {
  const planType = detectPlanType(bundle.brain)
  const pathId = resolvePathId(bundle)
  const pathLadder = buildPathPlanLadder(bundle)
  const routeLabel = pathLadder?.routeLabel ?? resolveRouteLabel(bundle)
  const cvReady = signals.hasBaseCv && signals.cvQualityScore >= 55
  const enrichedSignals = { ...signals, cvReady }

  let requirements = collectAssessmentTrainingRequirements(bundle, pathId, enrichedSignals)
  requirements = filterRequirementsToLadder(requirements, pathLadder)
  const hasTraining = requirements.length > 0
  const { essentialActions, recommendedCourses } = splitTrainingDetails(requirements)

  const destination = buildCareerDestination(bundle, routeLabel, pathId, planType)
  const storedPlan = bundle.aiState?.jobaz_plan
  const caFocus =
    storedPlan && isJobAZPlan(storedPlan)
      ? storedPlan.ca_selection?.immediate_role ||
        storedPlan.ca_selection?.current_focus_role ||
        storedPlan.route_summary.current_target_role ||
        storedPlan.cv_target_role
      : null
  const targetRole =
    pathLadder?.startNow[0]?.title ?? caFocus ?? destinationTargetRole(destination)
  const suggestedRoles =
    pathLadder?.upgradeAfter.map((s) => ({ title: s.title })) ??
    extractSuggestedRoles(bundle, targetRole)

  const rawTasks = buildRawTasks(requirements, enrichedSignals)
  let tasks: CareerRoadmap['tasks'] = rawTasks.map((task) => {
    const completed = isTaskComplete(task, enrichedSignals)
    return {
      ...task,
      completed,
      current: taskCurrentValue(task, enrichedSignals),
      status: 'pending' as MilestoneStatus,
    }
  })
  tasks = applyTaskStatuses(tasks)

  const phases = buildPhases(tasks, hasTraining)
  const firstIncomplete = tasks.find((t) => !t.completed) ?? tasks[tasks.length - 1]
  const trainingPhase = phases.find((p) => p.id === 'training')
  const trainingPhaseActive = Boolean(trainingPhase && trainingPhase.status !== 'complete')
  const trainingSections = groupRequirementsBySection(requirements)

  const securityMissions =
    pathLadder?.isSecurityRoute && pathLadder.pathId === 'side_job'
      ? buildSecurityExtraIncomeMissions(pathLadder, enrichedSignals)
      : null

  const missions = securityMissions ?? buildMissions(tasks)
  const nextAction = securityMissions
    ? nextActionFromSecurityMissions(securityMissions)
    : taskToNextAction(firstIncomplete)

  const readiness = computeCareerReadiness({
    signals: enrichedSignals,
    routeLabel,
    routePathId: pathId,
    targetRole,
    pathLadder,
    missions,
    assessmentCompleted: true,
  })

  return {
    hasAssessment: true,
    planType,
    routeLabel,
    routePathId: pathId,
    targetRole,
    timeToEmployment: resolveTimeToEmployment(bundle, planType),
    routeInsights: buildRouteInsightCards(bundle, enrichedSignals),
    destination: {
      ...destination,
      currentRoute: routeLabel,
      targetRole,
      nextRole: pathLadder?.upgradeAfter[0]?.title ?? destination.nextRole,
    },
    suggestedRoles,
    requirements,
    phases,
    tasks,
    journeySteps: buildJourneySteps(phases),
    currentPhaseIndex: computeCurrentPhaseIndex(phases),
    missions,
    nextAction,
    continueJourney: nextAction,
    progressPercent: computeProgressPercent(phases),
    careerReadinessPercent: readiness.percent,
    readinessInsights: readiness.insights,
    readinessBreakdown: {
      completed: readiness.completed,
      missing: readiness.missing,
      factors: readiness.factors,
    },
    milestones: buildMilestones(phases),
    firstIncompleteTask: firstIncomplete,
    trainingDetails: hasTraining
      ? {
          phaseActive: trainingPhaseActive,
          essentialActions,
          recommendedCourses,
          sections: trainingSections,
          all: requirements,
        }
      : null,
    pathLadder,
  }
}
