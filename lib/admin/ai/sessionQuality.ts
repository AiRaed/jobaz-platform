/** Classify Career Assistant assessment rows for Admin AI hygiene. */

import type {
  SupervisorPriorityHint,
  SupervisorQualityClassification,
  SupervisorSessionStatus,
} from './types'

export type { SupervisorSessionStatus, SupervisorQualityClassification, SupervisorPriorityHint }

const MALFORMED_ROUTES = new Set([
  '',
  '—',
  '-',
  'unknown',
  'n/a',
  'na',
  'null',
  'undefined',
  'master',
  'test',
  'demo',
  'other',
  'none',
])

const OLD_DAYS = 30

/** Career families used for lightweight route/context mismatch heuristics. */
const FAMILY_PATTERNS: Array<{ family: string; re: RegExp }> = [
  {
    family: 'security_extra_income',
    re: /security|sia|steward|matchday|door supervisor|event staff|extra.?income|warehouse|delivery|cctv/i,
  },
  {
    family: 'education_engineering',
    re: /design engineer|engineering|iet|chartered engineer|education path|work in education/i,
  },
  {
    family: 'care',
    re: /\bcare\b|care assistant|nhs|support worker|health and social/i,
  },
  {
    family: 'construction',
    re: /cscs|construction|site operative|labourer|trades/i,
  },
  {
    family: 'digital',
    re: /\bdigital\b|it support|software|web.?dev|data analyst/i,
  },
  {
    family: 'teaching',
    re: /teaching assistant|tefl|classroom|education assistant/i,
  },
  {
    family: 'admin_finance',
    re: /\baat\b|bookkeep|accountan|payroll|office admin/i,
  },
]

export function normalizeRouteLabel(raw: string | null | undefined): string {
  return String(raw || '')
    .trim()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
}

export function isMalformedRoute(route: string): boolean {
  const r = normalizeRouteLabel(route).toLowerCase()
  if (!r || r === '—') return true
  if (MALFORMED_ROUTES.has(r)) return true
  if (r.length < 2) return true
  return false
}

export function extractGoal(answers: Record<string, unknown> | null | undefined): string {
  if (!answers || typeof answers !== 'object') return ''
  const raw =
    answers.goal ||
    answers.strategic_goal ||
    answers.path ||
    answers.primary_goal ||
    answers.selected_goal
  return normalizeRouteLabel(String(raw || ''))
}

export function hasSavedPlan(result: Record<string, unknown> | null | undefined): boolean {
  if (!result || typeof result !== 'object') return false
  if (result.jobaz_plan) return true
  if (result.plan) return true
  if (result.ladder) return true
  if (Array.isArray(result.steps) && result.steps.length > 0) return true
  if (result.recommended_path || result.recommendedPath) return true
  // Non-empty result object counts as saved assessment result
  return Object.keys(result).length > 2
}

export function isCompleteAssessment(params: {
  goal: string
  route: string
  result: Record<string, unknown> | null | undefined
  resultSaved: boolean
}): boolean {
  if (!params.resultSaved && !hasSavedPlan(params.result)) return false
  const goalOk = Boolean(params.goal) && params.goal !== '—' && !isMalformedRoute(params.goal)
  const routeOk = !isMalformedRoute(params.route)
  // Prefer rows with a real goal OR a real route plus saved result
  return Boolean(params.result) && (goalOk || routeOk)
}

export function classifySessionStatus(params: {
  isTest: boolean
  createdAt: string
  complete: boolean
  possibleMismatch?: boolean
  now?: Date
}): SupervisorSessionStatus {
  if (params.isTest) return 'test'
  if (params.possibleMismatch) return 'possible_mismatch'
  const created = new Date(params.createdAt).getTime()
  const now = (params.now || new Date()).getTime()
  const ageDays = (now - created) / (24 * 60 * 60 * 1000)
  if (!Number.isNaN(ageDays) && ageDays > OLD_DAYS) return 'old'
  if (!params.complete) return 'incomplete'
  return 'complete'
}

/** Route values eligible for "Most selected route" aggregation. */
export function isRouteEligibleForInsights(route: string, complete: boolean): boolean {
  if (!complete) return false
  if (isMalformedRoute(route)) return false
  return true
}

function detectFamilies(text: string): string[] {
  const hit: string[] = []
  for (const { family, re } of FAMILY_PATTERNS) {
    if (re.test(text)) hit.push(family)
  }
  return hit
}

export type PlanContextExtract = {
  currentTarget: string
  nextUpgrade: string
  recommendedCourse: string
  publishedCourseUsed: boolean | null
  hasCvAction: boolean | null
  workNowCount: number | null
  supervisorFlag: string | null
  possibleMismatch: boolean
  /** Extra Income / Security route checks */
  isSecurityExtraIncomeRoute: boolean
  hasWorkNowStewardRole: boolean | null
  hasSiaDoorSupervisorUpgrade: boolean | null
  qualityClassification: SupervisorQualityClassification
  priorityHint: SupervisorPriorityHint
  isHistoricalOrTest: boolean
}

function isSecurityExtraIncomeRouteText(text: string): boolean {
  return /security|sia|steward|matchday|extra.?income|event staff|door supervisor/i.test(text)
}

function hasWorkNowStewardRoleInBlob(blob: string, workNow: unknown[] | null): boolean | null {
  const stewardRe =
    /matchday steward|event steward|venue steward|steward|security guard|crowd control|event staff/i
  if (workNow && workNow.length > 0) {
    const titles = workNow
      .map((w) =>
        String(
          (w as { title?: string }).title ||
            (w as { role?: string }).role ||
            w ||
            ''
        )
      )
      .join(' ')
    return stewardRe.test(titles)
  }
  if (stewardRe.test(blob)) return true
  return null
}

function hasSiaDoorSupervisorInBlob(
  blob: string,
  nextUpgrade: string,
  trainingTitle: string
): boolean | null {
  const siaRe = /sia.*door supervisor|door supervisor.*sia|sia door supervisor/i
  if (siaRe.test(nextUpgrade) || siaRe.test(trainingTitle)) return true
  if (/door supervisor/i.test(nextUpgrade) && /sia/i.test(blob)) return true
  if (siaRe.test(blob)) return true
  return null
}

function isDesignEngineerContext(text: string): boolean {
  return /design engineer|engineering path|work in education.*engineer/i.test(text)
}

function isHistoricalSession(params: {
  isTest: boolean
  statusWouldBeOld: boolean
}): boolean {
  return params.isTest || params.statusWouldBeOld
}

function fieldMissing(value: string | null | undefined): boolean {
  const v = String(value || '').trim()
  return !v || v === '—' || v === '-'
}

/**
 * Classify session quality with route-aware rubric.
 * Matchday Steward = work-now role, NOT a published course requirement.
 * Missing/not-wired fields → needs_data (not needs_improvement).
 */
export function classifySupervisorQuality(params: {
  route: string
  goal: string
  status: SupervisorSessionStatus
  isTest: boolean
  isOld: boolean
  complete: boolean
  savedPlan: boolean
  planCtx: Omit<
    PlanContextExtract,
    'qualityClassification' | 'priorityHint' | 'isHistoricalOrTest'
  >
  blob: string
}): Pick<PlanContextExtract, 'qualityClassification' | 'priorityHint' | 'isHistoricalOrTest'> {
  const isHistoricalOrTest = isHistoricalSession({
    isTest: params.isTest,
    statusWouldBeOld: params.isOld || params.status === 'old' || params.status === 'test',
  })

  if (isHistoricalOrTest) {
    return {
      qualityClassification: 'possible_test_old',
      priorityHint: 'low',
      isHistoricalOrTest: true,
    }
  }

  // Design Engineer outside security flow → treat as possible test/old unless mismatch
  if (
    isDesignEngineerContext(`${params.route} ${params.goal} ${params.blob}`) &&
    !params.planCtx.isSecurityExtraIncomeRoute
  ) {
    return {
      qualityClassification: 'possible_test_old',
      priorityHint: 'low',
      isHistoricalOrTest: false,
    }
  }

  const securityRoute = params.planCtx.isSecurityExtraIncomeRoute
  const siaKnown = params.planCtx.hasSiaDoorSupervisorUpgrade
  const workNowKnown = params.planCtx.hasWorkNowStewardRole
  const cvKnown = params.planCtx.hasCvAction
  const upgradeMissing = fieldMissing(params.planCtx.nextUpgrade)
  const courseMissing = fieldMissing(params.planCtx.recommendedCourse)
  const targetMissing = fieldMissing(params.planCtx.currentTarget)

  // Key fields not extractable / not wired → Needs data (do not judge as weak)
  const planFieldsUnwired =
    (siaKnown == null && upgradeMissing && courseMissing) ||
    (cvKnown == null && targetMissing && upgradeMissing) ||
    (securityRoute && siaKnown == null && workNowKnown == null)

  if (securityRoute) {
    // Good: work-now + SIA Door Supervisor upgrade (+ preferably CV + saved)
    if (workNowKnown === true && siaKnown === true) {
      if (cvKnown === false) {
        return {
          qualityClassification: 'needs_improvement',
          priorityHint: 'medium',
          isHistoricalOrTest: false,
        }
      }
      return {
        qualityClassification: 'good',
        priorityHint: 'low',
        isHistoricalOrTest: false,
      }
    }

    // Can see result and SIA next upgrade is actually absent → Needs improvement
    if (siaKnown === false) {
      return {
        qualityClassification: 'needs_improvement',
        priorityHint: 'medium',
        isHistoricalOrTest: false,
      }
    }

    // Can see result and work-now steward is actually absent → Needs improvement
    if (workNowKnown === false && (siaKnown === true || !upgradeMissing)) {
      return {
        qualityClassification: 'needs_improvement',
        priorityHint: 'medium',
        isHistoricalOrTest: false,
      }
    }

    // Cannot verify nextUpgrade / recommendedCourse / SIA → Needs data
    if (siaKnown == null || (upgradeMissing && courseMissing) || planFieldsUnwired) {
      return {
        qualityClassification: 'needs_data',
        priorityHint: 'low',
        isHistoricalOrTest: false,
      }
    }
  }

  if (
    params.planCtx.possibleMismatch &&
    params.status === 'possible_mismatch' &&
    !isHistoricalOrTest
  ) {
    return {
      qualityClassification: 'needs_improvement',
      priorityHint: 'high',
      isHistoricalOrTest: false,
    }
  }

  // Incomplete / empty result with no plan fields → Needs data, not weak judgment
  if (!params.complete || planFieldsUnwired) {
    return {
      qualityClassification: 'needs_data',
      priorityHint: 'low',
      isHistoricalOrTest: false,
    }
  }

  // Explicit negatives only when fields are known
  if (cvKnown === false) {
    return {
      qualityClassification: 'needs_improvement',
      priorityHint: 'medium',
      isHistoricalOrTest: false,
    }
  }

  if (!params.savedPlan && cvKnown === true) {
    return {
      qualityClassification: 'needs_improvement',
      priorityHint: 'medium',
      isHistoricalOrTest: false,
    }
  }

  if (cvKnown == null && upgradeMissing) {
    return {
      qualityClassification: 'needs_data',
      priorityHint: 'low',
      isHistoricalOrTest: false,
    }
  }

  return {
    qualityClassification: 'good',
    priorityHint: 'low',
    isHistoricalOrTest: false,
  }
}

/**
 * Extract plan/target fields from assessment result without inventing data.
 * Detects lightweight route/context mismatches (e.g. Design Engineer vs Security).
 */
export function extractPlanContextFromResult(params: {
  route: string
  goal: string
  result: Record<string, unknown> | null | undefined
  tools?: unknown[]
  isTest?: boolean
  isOld?: boolean
  complete?: boolean
  savedPlan?: boolean
  sessionStatus?: SupervisorSessionStatus
}): PlanContextExtract {
  const result = params.result
  const emptyBase = {
    currentTarget: '—',
    nextUpgrade: '—',
    recommendedCourse: '—',
    publishedCourseUsed: null as boolean | null,
    hasCvAction: null as boolean | null,
    workNowCount: null as number | null,
    supervisorFlag: null as string | null,
    possibleMismatch: false,
    isSecurityExtraIncomeRoute: false,
    hasWorkNowStewardRole: null as boolean | null,
    hasSiaDoorSupervisorUpgrade: null as boolean | null,
  }
  if (!result || typeof result !== 'object') {
    return {
      ...emptyBase,
      qualityClassification: params.isTest || params.isOld ? 'possible_test_old' : 'needs_data',
      priorityHint: 'low',
      isHistoricalOrTest: Boolean(params.isTest || params.isOld),
    }
  }

  const plan =
    result.jobaz_plan && typeof result.jobaz_plan === 'object'
      ? (result.jobaz_plan as Record<string, unknown>)
      : result.plan && typeof result.plan === 'object'
        ? (result.plan as Record<string, unknown>)
        : null

  const routeSummary =
    plan?.route_summary && typeof plan.route_summary === 'object'
      ? (plan.route_summary as Record<string, unknown>)
      : null

  const currentTarget = normalizeRouteLabel(
    String(
      routeSummary?.current_target_role ||
        result.current_target_role ||
        result.currentTarget ||
        ''
    )
  )
  const nextUpgrade = normalizeRouteLabel(
    String(
      routeSummary?.next_upgrade_role ||
        result.next_upgrade_role ||
        result.nextUpgrade ||
        ''
    )
  )

  const trainingNext =
    plan?.training_next && typeof plan.training_next === 'object'
      ? (plan.training_next as Record<string, unknown>)
      : result.training_next && typeof result.training_next === 'object'
        ? (result.training_next as Record<string, unknown>)
        : null

  const tools = Array.isArray(params.tools) ? params.tools : []
  const courseFromTools =
    tools.length > 0
      ? String(
          (tools[0] as { title?: string; name?: string })?.title ||
            (tools[0] as { name?: string })?.name ||
            tools[0] ||
            ''
        )
      : ''
  const courseFromResult = String(
    trainingNext?.title ||
      (result as { recommendedCourse?: string }).recommendedCourse ||
      ''
  )
  const recommendedCourse = normalizeRouteLabel(courseFromTools || courseFromResult) || '—'

  let publishedCourseUsed: boolean | null = null
  if (trainingNext) {
    const type = String(trainingNext.type || '')
    if (type === 'published_course' || trainingNext.published_course_id || trainingNext.apply_url) {
      publishedCourseUsed = true
    } else if (type === 'recommendation_only' || type === 'course_type') {
      publishedCourseUsed = false
    }
  }

  const cvActionRaw = plan?.cv_action ?? result.cv_action ?? result.cvAction
  const hasCvAction =
    cvActionRaw == null ? null : Boolean(String(cvActionRaw).trim().length > 0)

  const workNow = Array.isArray(plan?.work_now)
    ? plan!.work_now
    : Array.isArray(result.work_now)
      ? result.work_now
      : null
  const workNowCount = workNow == null ? null : workNow.length

  const routeTitle = normalizeRouteLabel(
    String(routeSummary?.route_title || params.route || '')
  )
  const trainingTitle = String(trainingNext?.title || '')
  const blob = [
    params.route,
    params.goal,
    routeTitle,
    currentTarget,
    nextUpgrade,
    recommendedCourse,
    trainingTitle,
    String(cvActionRaw || ''),
    JSON.stringify(workNow || []).slice(0, 500),
  ]
    .join(' ')
    .toLowerCase()

  const isSecurityExtraIncomeRoute = isSecurityExtraIncomeRouteText(
    `${params.route} ${params.goal} ${routeTitle}`
  )
  const hasWorkNowStewardRole = hasWorkNowStewardRoleInBlob(blob, workNow)
  const hasSiaDoorSupervisorUpgrade = hasSiaDoorSupervisorInBlob(
    blob,
    nextUpgrade,
    trainingTitle
  )

  const routeFamilies = detectFamilies(`${params.route} ${params.goal} ${routeTitle}`)
  const targetFamilies = detectFamilies(`${currentTarget} ${nextUpgrade}`)
  const blobFamilies = detectFamilies(blob)

  let supervisorFlag: string | null = null
  let possibleMismatch = false

  const isHistorical = isHistoricalSession({
    isTest: Boolean(params.isTest),
    statusWouldBeOld: Boolean(params.isOld || params.sessionStatus === 'old' || params.sessionStatus === 'test'),
  })

  const hasDesignEngineer = isDesignEngineerContext(blob)
  const hasSecurityExtra = isSecurityExtraIncomeRoute || routeFamilies.includes('security_extra_income')
  const hasEducationEng =
    routeFamilies.includes('education_engineering') ||
    /work in education|education path/i.test(`${params.route} ${params.goal}`)

  // Only flag cross-family mismatches for current, non-test sessions
  if (!isHistorical) {
    if (hasDesignEngineer && hasSecurityExtra) {
      possibleMismatch = true
      supervisorFlag = 'Design Engineer vs Security/extra income context (current session)'
    } else if (
      routeFamilies.includes('security_extra_income') &&
      targetFamilies.includes('education_engineering')
    ) {
      possibleMismatch = true
      supervisorFlag = 'Route Security/extra income but target looks engineering/education'
    } else if (
      hasEducationEng &&
      targetFamilies.includes('security_extra_income') &&
      !routeFamilies.includes('security_extra_income')
    ) {
      possibleMismatch = true
      supervisorFlag = 'Education/engineering route but security/extra-income target'
    } else if (
      routeFamilies.length > 0 &&
      targetFamilies.length > 0 &&
      !routeFamilies.some((f) => targetFamilies.includes(f)) &&
      currentTarget &&
      currentTarget !== '—'
    ) {
      possibleMismatch = true
      supervisorFlag = `Possible route/target family mismatch (${routeFamilies[0]} vs ${targetFamilies[0]})`
    }

    if (
      /door supervisor/i.test(currentTarget) &&
      /security/i.test(`${params.route} ${params.goal}`) &&
      !/door supervisor/i.test(`${params.route} ${params.goal}`) &&
      /already selected|you chose|you selected door/i.test(blob)
    ) {
      possibleMismatch = true
      supervisorFlag =
        supervisorFlag || 'May imply Door Supervisor already selected when only Security chosen'
    }
  } else if (hasDesignEngineer && isHistorical) {
    supervisorFlag = 'Historical/test Design Engineer data — clean or ignore'
  } else if (hasDesignEngineer && !isSecurityExtraIncomeRoute) {
    supervisorFlag = null
  }

  const planCtxPartial = {
    currentTarget: currentTarget || '—',
    nextUpgrade: nextUpgrade || '—',
    recommendedCourse,
    publishedCourseUsed,
    hasCvAction,
    workNowCount,
    supervisorFlag,
    possibleMismatch,
    isSecurityExtraIncomeRoute,
    hasWorkNowStewardRole,
    hasSiaDoorSupervisorUpgrade,
  }

  const quality = classifySupervisorQuality({
    route: params.route,
    goal: params.goal,
    status: params.sessionStatus || 'complete',
    isTest: Boolean(params.isTest),
    isOld: Boolean(params.isOld),
    complete: Boolean(params.complete),
    savedPlan: Boolean(params.savedPlan),
    planCtx: planCtxPartial,
    blob,
  })

  return {
    ...planCtxPartial,
    ...quality,
  }
}

export function anonymiseSessionId(id: string): string {
  if (!id) return 'sess-unknown'
  return `sess-${id.replace(/-/g, '').slice(0, 8)}`
}
