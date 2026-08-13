export type ActionCta = {
  label: string
  href: string
}

export type JobRecommendation = {
  id: string
  title: string
  subtitle?: string
  salaryRange?: string
  entryDifficulty?: 'Easy' | 'Medium' | 'Advanced'
  demandLevel?: 'High' | 'Medium' | 'Low'
  hiringSpeed?: string
  badges: string[]
  searchKeyword: string
  href: string
}

export type CourseRecommendation = {
  id: string
  title: string
  duration?: string
  costLabel?: string
  qualification?: string
  careerImpact?: string
  salaryImprovement?: string
  searchKeyword: string
  href: string
  pathId?: string
}

export type CareerTimelineStep = {
  id: string
  label: string
  kind: 'today' | 'role' | 'qualification' | 'goal'
}

export type ActionTier = {
  id: 'work_now' | 'build_next' | 'long_term'
  label: string
  subtitle: string
  /** @deprecated use jobs/courses */
  items: string[]
  jobs?: JobRecommendation[]
  courses?: CourseRecommendation[]
  timeline?: CareerTimelineStep[]
  cta: ActionCta
  accent: 'emerald' | 'cyan' | 'violet'
}

export type MissionTaskStatus = 'not_started' | 'in_progress' | 'applied' | 'done'

export type MissionItem = {
  id: string
  label: string
  href: string
  completed?: boolean
  guestLocked?: boolean
  /** Locked until previous sequential mission is complete. Prefer unlocked next steps. */
  locked?: boolean
  /** e.g. 5 for "Apply to 5 jobs" */
  target?: number
  /** current progress count */
  current?: number
  /** Launch-safe task status for First Action Plan */
  status?: MissionTaskStatus
  /** Optional steps never block required progress */
  optional?: boolean
  /** Per-row action button label */
  actionLabel?: string
  /** Ask for confirmation when marking done (e.g. course booked vs compared) */
  confirmOnDone?: 'course_booked'
}

export type CareerActionPlan = {
  headline: string
  oneLiner: string
  whySummary?: string
  tiers: ActionTier[]
  missions: MissionItem[]
  journeyStep: number
  primaryCta: ActionCta
  pathId?: string
}

export const JOURNEY_STEP_ASSESSMENT = 'Assessment'
export const JOURNEY_STEP_CV = 'Build CV'
export const JOURNEY_STEP_TRAINING = 'Training / Qualification'
export const JOURNEY_STEP_APPLY = 'Apply Jobs'
export const JOURNEY_STEP_INTERVIEW = 'Interview'
export const JOURNEY_STEP_FIRST_JOB = 'First Job'
export const JOURNEY_STEP_GROWTH = 'Career Growth'

/** Default strip without a training phase (legacy / guest flows). */
export function buildJourneySteps(includeTrainingStep: boolean): readonly string[] {
  const tail = [
    JOURNEY_STEP_APPLY,
    JOURNEY_STEP_INTERVIEW,
    JOURNEY_STEP_FIRST_JOB,
    JOURNEY_STEP_GROWTH,
  ] as const

  if (includeTrainingStep) {
    return [JOURNEY_STEP_ASSESSMENT, JOURNEY_STEP_CV, JOURNEY_STEP_TRAINING, ...tail]
  }

  return [JOURNEY_STEP_ASSESSMENT, JOURNEY_STEP_CV, ...tail]
}

export const JOURNEY_STEPS = buildJourneySteps(false)
