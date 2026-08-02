import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminAiDateRange } from './dateRange'
import { rangeStartIso } from './dateRange'
import {
  classifySessionStatus,
  extractGoal,
  extractPlanContextFromResult,
  anonymiseSessionId,
  hasSavedPlan,
  isCompleteAssessment,
  isMalformedRoute,
  isRouteEligibleForInsights,
  normalizeRouteLabel,
} from './sessionQuality'
import type {
  AdminAiMetricsSnapshot,
  AffiliateProviderSummary,
  MetricValue,
  SupervisorSessionRow,
  SupervisorSessionsResult,
  TechnicalCheck,
} from './types'
import { AFFILIATE_PRIORITY_ROUTES } from './types'
import { getAffiliateRouteDefaultPriority } from './priorityGuide'

function card(
  label: string,
  value: number | string | null,
  available: boolean,
  hint?: string
): MetricValue {
  return { label, value: available ? value : null, available, hint }
}

function applyCreatedAtFilter<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  column: string,
  range: AdminAiDateRange
): T {
  const start = rangeStartIso(range)
  if (start) return query.gte(column, start)
  return query
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return false
  // Probe with a filtered head query — PostgREST returns error if column missing
  const { error } = await supabase.from(table).select(column).limit(1)
  if (!error) return true
  const msg = error.message || ''
  if (/does not exist|column/i.test(msg)) return false
  // Other errors (RLS etc.) — assume column may exist; try again carefully
  return !/Could not find/i.test(msg)
}

async function safeCountInRange(
  table: string,
  range: AdminAiDateRange,
  dateColumn: string,
  extra?: { column: string; op: 'eq' | 'not'; value?: string | boolean }
): Promise<{ count: number | null; available: boolean; error?: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { count: null, available: false, error: 'Supabase service role not configured' }
  }
  try {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    q = applyCreatedAtFilter(q, dateColumn, range)
    if (extra?.op === 'eq' && extra.value != null) {
      q = q.eq(extra.column, extra.value)
    }
    if (extra?.op === 'not') {
      q = q.not(extra.column, 'is', null)
    }
    const { count, error } = await q
    if (error) {
      return { count: null, available: false, error: error.message }
    }
    return { count: count ?? 0, available: true }
  } catch (e) {
    return {
      count: null,
      available: false,
      error: e instanceof Error ? e.message : 'Count failed',
    }
  }
}

export type MetricsQueryOptions = {
  range?: AdminAiDateRange
  includeTest?: boolean
}

/** High-level Admin AI Manager metrics — real counts where tables exist. */
export async function getAdminAiMetrics(
  options: MetricsQueryOptions = {}
): Promise<AdminAiMetricsSnapshot> {
  const range = options.range || '7d'
  const includeTest = Boolean(options.includeTest)
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    notes.push('Supabase service role is not configured — showing empty metrics.')
  }

  const [hasIsTest, hasEventIsTest] = await Promise.all([
    columnExists('ai_career_assessments', 'is_test'),
    columnExists('ai_career_events', 'is_test'),
  ])
  if (!hasIsTest) {
    notes.push(
      'is_test column not applied yet — run migration 20250717140000_admin_ai_is_test_flags.sql to exclude demo rows.'
    )
  }

  const [
    cvs,
    courseClicks,
    coursesPublished,
  ] = await Promise.all([
    safeCountInRange('cvs', range, 'created_at'),
    safeCountInRange('course_clicks', range, 'clicked_at'),
    // Catalogue snapshot is not period-based
    (async () => {
      const supabaseInner = getAdminCoursesSupabase()
      if (!supabaseInner) return { count: null as number | null, available: false, error: 'no supabase' }
      const { count, error } = await supabaseInner
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
      return { count: error ? null : count ?? 0, available: !error, error: error?.message }
    })(),
  ])

  // Guest sessions in period
  let guestSessions: MetricValue = card(
    'Guest sessions',
    null,
    false,
    'Not wired yet'
  )
  if (supabase) {
    const eventCols = hasEventIsTest
      ? 'anonymous_id, session_id, is_test'
      : 'anonymous_id, session_id'
    let q = supabase.from('ai_career_events').select(eventCols)
    q = applyCreatedAtFilter(q, 'created_at', range)
    if (hasEventIsTest && !includeTest) {
      q = q.or('is_test.is.null,is_test.eq.false')
    }
    const { data, error } = await q.limit(3000)
    if (!error && data) {
      const keys = new Set<string>()
      for (const row of data) {
        const isTest = Boolean((row as { is_test?: boolean }).is_test)
        if (!includeTest && isTest) continue
        const a = (row as { anonymous_id?: string | null }).anonymous_id
        const s = (row as { session_id?: string | null }).session_id
        if (a) keys.add(`a:${a}`)
        else if (s) keys.add(`s:${s}`)
      }
      guestSessions = card(
        'Guest sessions',
        keys.size,
        true,
        `Distinct anonymous/session ids from AI events (${range})`
      )
    } else if (error) {
      notes.push(`Guest sessions unavailable: ${error.message}`)
      guestSessions = card('Guest sessions', null, false, 'Not wired yet')
    }
  }

  let savedPlans = 0
  let incompleteCount = 0
  let excludedTestCount = 0
  let mostRoute: MetricValue = card(
    'Most selected route in selected period',
    null,
    false,
    'No complete assessments in this period'
  )

  if (supabase) {
    const selectCols = hasIsTest
      ? 'id, created_at, recommended_path, answers, result, is_test'
      : 'id, created_at, recommended_path, answers, result'
    let q = supabase.from('ai_career_assessments').select(selectCols)
    q = applyCreatedAtFilter(q, 'created_at', range)
    const { data, error } = await q.limit(2000)

    if (error) {
      notes.push(`Assessment metrics unavailable: ${error.message}`)
    } else {
      const freq = new Map<string, number>()
      for (const row of data || []) {
        const isTest = Boolean((row as { is_test?: boolean }).is_test)
        if (isTest) {
          excludedTestCount += 1
          if (!includeTest) continue
        }
        const answers = ((row as { answers?: Record<string, unknown> }).answers ||
          {}) as Record<string, unknown>
        const result = (row as { result?: Record<string, unknown> | null }).result
        const goal = extractGoal(answers) || '—'
        const route =
          normalizeRouteLabel(
            String((row as { recommended_path?: string }).recommended_path || answers.path || '')
          ) || '—'
        const resultSaved = Boolean(result)
        const complete = isCompleteAssessment({
          goal,
          route,
          result,
          resultSaved,
        })
        if (!complete) {
          incompleteCount += 1
          continue
        }
        savedPlans += 1
        if (isRouteEligibleForInsights(route, complete)) {
          freq.set(route, (freq.get(route) || 0) + 1)
        }
      }

      let top = ''
      let topN = 0
      for (const [k, n] of freq) {
        if (n > topN) {
          top = k
          topN = n
        }
      }
      if (top) {
        mostRoute = card(
          'Most selected route in selected period',
          `${top} (${topN})`,
          true,
          'From complete, non-malformed assessments in the selected period only'
        )
      } else {
        mostRoute = card(
          'Most selected route in selected period',
          'None in period',
          true,
          incompleteCount
            ? `${incompleteCount} incomplete/malformed rows excluded from route ranking`
            : 'No complete assessments with a clear route in this period'
        )
      }
    }
  }

  if (!cvs.available && cvs.error) notes.push(`CVs: ${cvs.error}`)
  if (!courseClicks.available && courseClicks.error) notes.push(`Clicks: ${courseClicks.error}`)

  if (incompleteCount > 0) {
    notes.push(
      `${incompleteCount} incomplete/unknown-goal assessments excluded from route ranking and saved-plan count.`
    )
  }
  if (!includeTest && excludedTestCount > 0) {
    notes.push(`${excludedTestCount} is_test rows excluded.`)
  }

  const cards: MetricValue[] = [
    guestSessions,
    card(
      'Saved career plans',
      savedPlans,
      true,
      'Complete assessments with saved result + clear goal/route in selected period'
    ),
    card(
      'CVs saved',
      cvs.count,
      cvs.available,
      cvs.available ? `Rows in public.cvs created in period (${range})` : 'Not wired yet'
    ),
    card(
      'Published courses',
      coursesPublished.count,
      coursesPublished.available,
      'Current published catalogue (not period-filtered)'
    ),
    card(
      'Apply Now clicks',
      courseClicks.count,
      courseClicks.available,
      courseClicks.available
        ? `course_clicks in selected period (${range})`
        : 'Not wired yet'
    ),
    mostRoute,
    card(
      'Estimated revenue placeholder',
      null,
      false,
      'Not wired yet — needs commission reports / confirmed conversions'
    ),
  ]

  return {
    generatedAt: new Date().toISOString(),
    range,
    cards,
    notes: [...new Set(notes)].slice(0, 10),
    incompleteCount,
    excludedTestCount: includeTest ? 0 : excludedTestCount,
  }
}

export type SupervisorQueryOptions = {
  range?: AdminAiDateRange
  completeOnly?: boolean
  includeTest?: boolean
  /** When false, exclude status=old (unless includeTest also pulls tests). Default true for backward compat in report generators. */
  includeOld?: boolean
  /** Only incomplete / possible_mismatch / flagged rows */
  problemOnly?: boolean
  route?: string
  limit?: number
}

export async function getSupervisorSessions(
  options: SupervisorQueryOptions = {}
): Promise<SupervisorSessionsResult> {
  const range = options.range || '7d'
  const completeOnly = Boolean(options.completeOnly)
  const includeTest = Boolean(options.includeTest)
  const includeOld = options.includeOld !== false
  const problemOnly = Boolean(options.problemOnly)
  const routeFilter = normalizeRouteLabel(options.route || '').toLowerCase()
  const limit = options.limit ?? 50

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      rows: [],
      available: false,
      message: 'Supabase service role not configured',
      isTestColumnAvailable: false,
    }
  }

  const hasIsTest = await columnExists('ai_career_assessments', 'is_test')
  const selectCols = hasIsTest
    ? 'id, created_at, recommended_path, answers, result, recommended_tools, source, is_test'
    : 'id, created_at, recommended_path, answers, result, recommended_tools, source'

  let q = supabase.from('ai_career_assessments').select(selectCols).order('created_at', {
    ascending: false,
  })
  q = applyCreatedAtFilter(q, 'created_at', range)
  const { data, error } = await q.limit(Math.min(limit * 4, 400))

  if (error) {
    return {
      rows: [],
      available: false,
      message: error.message,
      isTestColumnAvailable: hasIsTest,
    }
  }

  type AssessmentRow = {
    id: string
    created_at: string
    recommended_path?: string | null
    answers?: Record<string, unknown> | null
    result?: Record<string, unknown> | null
    recommended_tools?: unknown
    source?: string | null
    is_test?: boolean | null
  }

  const mapped: SupervisorSessionRow[] = ((data || []) as unknown as AssessmentRow[]).map((row) => {
    const answers = (row.answers || {}) as Record<string, unknown>
    const result = row.result as Record<string, unknown> | null
    const tools = Array.isArray(row.recommended_tools) ? row.recommended_tools : []
    const goalRaw = extractGoal(answers)
    const goal = goalRaw || '—'
    const route =
      normalizeRouteLabel(
        String(row.recommended_path || answers.path || '')
      ) || '—'
    const resultSaved = Boolean(result)
    const savedPlan = hasSavedPlan(result)
    const isTest = Boolean(row.is_test)
    const complete = isCompleteAssessment({ goal, route, result, resultSaved })
    const created = new Date(row.created_at).getTime()
    const ageDays = (Date.now() - created) / (24 * 60 * 60 * 1000)
    const isOld = !Number.isNaN(ageDays) && ageDays > 30

    const planCtx = extractPlanContextFromResult({
      route,
      goal: goalRaw || goal,
      result,
      tools,
      isTest,
      isOld,
      complete,
      savedPlan,
      sessionStatus: isTest ? 'test' : isOld ? 'old' : complete ? 'complete' : 'incomplete',
    })

    const status = classifySessionStatus({
      isTest,
      createdAt: row.created_at,
      complete,
      possibleMismatch: planCtx.possibleMismatch && !planCtx.isHistoricalOrTest,
    })

    return {
      id: row.id,
      anonId: anonymiseSessionId(row.id),
      date: row.created_at,
      goal: goalRaw ? goal : isMalformedRoute(route) ? 'incomplete' : goal,
      route: isMalformedRoute(route) ? `${route === '—' ? 'unknown' : route} (incomplete)` : route,
      currentTarget: planCtx.currentTarget,
      nextUpgrade: planCtx.nextUpgrade,
      status,
      source: String(row.source || 'unknown'),
      savedPlan,
      resultSaved,
      recommendedCourse: planCtx.recommendedCourse,
      publishedCourseUsed: planCtx.publishedCourseUsed,
      applyClick: null,
      isTest,
      supervisorFlag: planCtx.supervisorFlag,
      hasCvAction: planCtx.hasCvAction,
      workNowCount: planCtx.workNowCount,
      qualityClassification: planCtx.qualityClassification,
      priorityHint: planCtx.priorityHint,
      isHistoricalOrTest: planCtx.isHistoricalOrTest,
      isSecurityExtraIncomeRoute: planCtx.isSecurityExtraIncomeRoute,
      hasWorkNowStewardRole: planCtx.hasWorkNowStewardRole,
      hasSiaDoorSupervisorUpgrade: planCtx.hasSiaDoorSupervisorUpgrade,
    }
  })

  let rows = mapped
  if (!includeTest) {
    rows = rows.filter((r) => !r.isTest && r.status !== 'test')
  }
  if (!includeOld) {
    rows = rows.filter((r) => r.status !== 'old')
  }
  if (problemOnly) {
    rows = rows.filter(
      (r) =>
        !r.isHistoricalOrTest &&
        (r.qualityClassification === 'needs_improvement' ||
          r.qualityClassification === 'risky' ||
          r.status === 'incomplete')
    )
  } else if (completeOnly) {
    rows = rows.filter(
      (r) =>
        r.status === 'complete' ||
        r.status === 'possible_mismatch' ||
        (includeOld && r.status === 'old')
    )
  }
  if (routeFilter) {
    rows = rows.filter((r) => r.route.toLowerCase().includes(routeFilter))
  }
  rows = rows.slice(0, limit)

  return {
    rows,
    available: true,
    isTestColumnAvailable: hasIsTest,
    message: hasIsTest
      ? undefined
      : 'is_test column missing — mark-as-test requires migration 20250717140000_admin_ai_is_test_flags.sql',
  }
}

export async function getAffiliateProviderSummary(): Promise<AffiliateProviderSummary> {
  const basisNote =
    'Based on published courses and opportunity tracker. Missing provider = no live published course with a referral link for this route.'

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      activeProviders: 0,
      pendingProviders: 0,
      publishedPartnerCourses: 0,
      coursesWithLiveReferral: 0,
      missingByRoute: AFFILIATE_PRIORITY_ROUTES.map((route) => ({
        route,
        note: 'Provider data unavailable — configure Supabase service role',
        missingProvider: true,
        suggestedPriority: getAffiliateRouteDefaultPriority(route),
      })),
      available: false,
      basisNote,
    }
  }

  const [{ data: providers }, { count: publishedCount }, { data: courses }, { data: opps }] =
    await Promise.all([
      supabase.from('providers').select('id, name, affiliate_status, account_status'),
      supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('courses')
        .select('title, category, provider_name, referral_url, status')
        .eq('status', 'published')
        .limit(500),
      supabase
        .from('course_opportunities')
        .select('title, referral_url, status, category')
        .limit(500),
    ])

  const list = providers || []
  const active = list.filter((p) => {
    const a = String((p as { affiliate_status?: string }).affiliate_status || '')
    const acc = String((p as { account_status?: string }).account_status || '')
    return /active|approved/i.test(a) || /active/i.test(acc)
  }).length
  const pending = list.filter((p) => {
    const a = String((p as { affiliate_status?: string }).affiliate_status || '')
    return /pending|applied/i.test(a)
  }).length

  const published = courses || []
  const withReferral = published.filter((c) => {
    const url = String((c as { referral_url?: string | null }).referral_url || '').trim()
    return Boolean(url)
  })

  const haystack = [
    ...withReferral.map((c) => {
      const title = String((c as { title?: string }).title || '')
      const cat = String((c as { category?: string }).category || '')
      const provider = String((c as { provider_name?: string }).provider_name || '')
      return `${title} ${cat} ${provider}`.toLowerCase()
    }),
    ...(opps || [])
      .filter((o) => String((o as { referral_url?: string | null }).referral_url || '').trim())
      .map((o) => {
        const title = String((o as { title?: string }).title || '')
        const cat = String((o as { category?: string }).category || '')
        return `${title} ${cat}`.toLowerCase()
      }),
  ].join(' | ')

  const missingByRoute = AFFILIATE_PRIORITY_ROUTES.map((route) => {
    const keywords = route
      .toLowerCase()
      .split(/[\/,&]+/)
      .map((s) => s.trim())
      .filter((k) => k.length > 2)
    const covered = keywords.some((k) => haystack.includes(k))
    const suggestedPriority = getAffiliateRouteDefaultPriority(route)
    return {
      route,
      missingProvider: !covered,
      suggestedPriority,
      note: covered
        ? suggestedPriority === 'Low'
          ? 'Live referral coverage found — Low priority: verify partner still active (e.g. Get Licensed / UKPDA)'
          : 'Live published course/opportunity with referral link found — verify partner still active'
        : `Missing provider: no live published course/referral for this route (default priority ${suggestedPriority})`,
    }
  })

  return {
    activeProviders: active,
    pendingProviders: pending,
    publishedPartnerCourses: publishedCount ?? published.length,
    coursesWithLiveReferral: withReferral.length,
    missingByRoute,
    available: true,
    basisNote,
  }
}

export async function getTechnicalChecks(): Promise<TechnicalCheck[]> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return [
      {
        id: 'supabase',
        label: 'Database connection',
        count: null,
        available: false,
        hint: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      },
    ]
  }

  const checks: TechnicalCheck[] = []
  const hasIsTest = await columnExists('ai_career_assessments', 'is_test')

  {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('referral_url.is.null,referral_url.eq.')
    checks.push({
      id: 'missing_referral',
      label: 'Missing referral URLs (published courses)',
      count: error ? null : count ?? 0,
      available: !error,
      hint: error?.message || 'courses.status=published with empty referral_url',
    })
  }

  {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('provider_name.is.null,provider_name.eq.')
    checks.push({
      id: 'missing_provider',
      label: 'Published course records without provider',
      count: error ? null : count ?? 0,
      available: !error,
      hint:
        error?.message ||
        'Published course rows with empty provider_name (data quality). Route-level gaps are in Affiliate Scout.',
    })
  }

  {
    const { count, error } = await supabase
      .from('course_opportunities')
      .select('*', { count: 'exact', head: true })
      .or('referral_url.is.null,referral_url.eq.')
    checks.push({
      id: 'opp_missing_referral',
      label: 'Opportunities missing referral URL',
      count: error ? null : count ?? 0,
      available: !error,
      hint: error?.message || 'course_opportunities.referral_url empty',
    })
  }

  if (hasIsTest) {
    const { count, error } = await supabase
      .from('ai_career_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('is_test', true)
    checks.push({
      id: 'test_assessments',
      label: 'Assessments marked is_test',
      count: error ? null : count ?? 0,
      available: !error,
      hint: 'Safe to clear via Clear local/test analytics (dev only)',
    })
  } else {
    checks.push({
      id: 'test_assessments',
      label: 'Assessments marked is_test',
      count: null,
      available: false,
      hint: 'Not wired yet — run is_test migration',
    })
  }

  checks.push({
    id: 'broken_apply',
    label: 'Broken Apply Now links',
    count: null,
    available: false,
    hint: 'Not wired yet',
  })
  checks.push({
    id: 'ai_errors',
    label: 'AI errors',
    count: null,
    available: false,
    hint: 'Not wired yet',
  })
  checks.push({
    id: 'api_errors',
    label: 'API errors',
    count: null,
    available: false,
    hint: 'Not wired yet',
  })
  checks.push({
    id: 'tracking_events',
    label: 'Tracking events',
    count: null,
    available: false,
    hint: 'Not wired yet',
  })
  checks.push({
    id: 'score_mismatch',
    label: 'CV Builder / Documents score mismatch',
    count: null,
    available: false,
    hint: 'Not wired yet — shared calculateCvReadinessForPlan; needs monitoring',
  })
  checks.push({
    id: 'assistant_save_failures',
    label: 'Assistant result save failures',
    count: null,
    available: false,
    hint: 'Not wired yet',
  })

  return checks
}

/** Compact catalogue / funnel context for Admin AI reports — real rows only. */
export async function getAdminReportCatalogueContext(): Promise<{
  available: boolean
  publishedCourses: Array<{
    title: string
    provider_name: string | null
    referral_url: string | null
    category: string | null
  }>
  opportunities: Array<{
    title: string
    referral_url: string | null
    status: string | null
  }>
  providers: Array<{
    name: string
    affiliate_status: string | null
    account_status: string | null
  }>
  recentClicks: Array<{
    course_id: string | null
    provider_name: string | null
    clicked_at: string | null
  }>
  notes: string[]
}> {
  const notes: string[] = []
  const empty = {
    available: false,
    publishedCourses: [],
    opportunities: [],
    providers: [],
    recentClicks: [],
    notes,
  }

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    notes.push('Supabase service role not configured')
    return empty
  }

  const [coursesRes, oppsRes, providersRes, clicksRes] = await Promise.all([
    supabase
      .from('courses')
      .select('title, provider_name, referral_url, category, status')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(40),
    supabase
      .from('course_opportunities')
      .select('title, referral_url, status')
      .order('updated_at', { ascending: false })
      .limit(40),
    supabase.from('providers').select('name, affiliate_status, account_status').limit(40),
    supabase
      .from('course_clicks')
      .select('course_id, provider_name, clicked_at')
      .order('clicked_at', { ascending: false })
      .limit(30),
  ])

  if (coursesRes.error) notes.push(`courses: ${coursesRes.error.message}`)
  if (oppsRes.error) notes.push(`course_opportunities: ${oppsRes.error.message}`)
  if (providersRes.error) notes.push(`providers: ${providersRes.error.message}`)
  if (clicksRes.error) notes.push(`course_clicks: ${clicksRes.error.message}`)

  return {
    available: true,
    publishedCourses: (coursesRes.data || []).map((c) => ({
      title: String((c as { title?: string }).title || ''),
      provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
      referral_url: (c as { referral_url?: string | null }).referral_url ?? null,
      category: (c as { category?: string | null }).category ?? null,
    })),
    opportunities: (oppsRes.data || []).map((o) => ({
      title: String((o as { title?: string }).title || ''),
      referral_url: (o as { referral_url?: string | null }).referral_url ?? null,
      status: (o as { status?: string | null }).status ?? null,
    })),
    providers: (providersRes.data || []).map((p) => ({
      name: String((p as { name?: string }).name || ''),
      affiliate_status: (p as { affiliate_status?: string | null }).affiliate_status ?? null,
      account_status: (p as { account_status?: string | null }).account_status ?? null,
    })),
    recentClicks: (clicksRes.data || []).map((c) => ({
      course_id: (c as { course_id?: string | null }).course_id ?? null,
      provider_name: (c as { provider_name?: string | null }).provider_name ?? null,
      clicked_at: (c as { clicked_at?: string | null }).clicked_at ?? null,
    })),
    notes,
  }
}

export async function markAssessmentIsTest(
  id: string,
  isTest: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { ok: false, error: 'Supabase service role not configured' }

  const hasIsTest = await columnExists('ai_career_assessments', 'is_test')
  if (!hasIsTest) {
    return {
      ok: false,
      error:
        'is_test column missing — run migration 20250717140000_admin_ai_is_test_flags.sql',
    }
  }

  const { error } = await supabase
    .from('ai_career_assessments')
    .update({ is_test: isTest })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function clearMarkedTestAnalytics(): Promise<{
  ok: boolean
  deletedAssessments: number
  deletedEvents: number
  message: string
  historicalUnmarkedHint?: string
}> {
  if (process.env.NODE_ENV !== 'development') {
    return {
      ok: false,
      deletedAssessments: 0,
      deletedEvents: 0,
      message: 'Clear test analytics is only allowed in development.',
    }
  }

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      ok: false,
      deletedAssessments: 0,
      deletedEvents: 0,
      message: 'Supabase service role not configured',
    }
  }

  const hasAssessmentFlag = await columnExists('ai_career_assessments', 'is_test')
  const hasEventFlag = await columnExists('ai_career_events', 'is_test')

  if (!hasAssessmentFlag && !hasEventFlag) {
    return {
      ok: false,
      deletedAssessments: 0,
      deletedEvents: 0,
      message:
        'Historical test data found. Add is_test column before bulk cleanup.',
      historicalUnmarkedHint:
        'Run migration 20250717140000_admin_ai_is_test_flags.sql, mark demo rows in AI Supervisor, then clear again.',
    }
  }

  let deletedAssessments = 0
  let deletedEvents = 0

  if (hasAssessmentFlag) {
    const { data, error } = await supabase
      .from('ai_career_assessments')
      .delete()
      .eq('is_test', true)
      .select('id')
    if (error) {
      return {
        ok: false,
        deletedAssessments: 0,
        deletedEvents: 0,
        message: error.message,
      }
    }
    deletedAssessments = data?.length ?? 0
  }

  if (hasEventFlag) {
    const { data, error } = await supabase
      .from('ai_career_events')
      .delete()
      .eq('is_test', true)
      .select('id')
    if (!error) deletedEvents = data?.length ?? 0
  }

  // Unmarked historical rows are never deleted automatically
  let historicalUnmarkedHint: string | undefined
  if (hasAssessmentFlag) {
    const { count: remaining } = await supabase
      .from('ai_career_assessments')
      .select('*', { count: 'exact', head: true })
      .or('is_test.is.null,is_test.eq.false')
    if ((remaining ?? 0) > 0 && deletedAssessments === 0 && deletedEvents === 0) {
      historicalUnmarkedHint =
        'Historical test data found. Mark demo rows as test in AI Supervisor before bulk cleanup. Unmarked rows were not deleted.'
    }
  }

  return {
    ok: true,
    deletedAssessments,
    deletedEvents,
    message: `Deleted ${deletedAssessments} test assessment(s) and ${deletedEvents} test event(s). Real users, CVs, courses, providers, and Site Brain were not touched.`,
    historicalUnmarkedHint,
  }
}
