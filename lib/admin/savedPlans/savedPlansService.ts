import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  extractGoal,
  extractPlanContextFromResult,
  hasSavedPlan,
  normalizeRouteLabel,
} from '@/lib/admin/ai/sessionQuality'
import { buildPlanInsight, classifyPlanStatus } from './insights'
import type {
  AdminCvStatus,
  SavedPlanDetail,
  SavedPlanListItem,
  SavedPlansListResult,
  SavedPlansSummary,
} from './types'

export type SavedPlansFilters = {
  search?: string
  route?: string
  goal?: string
  hasCv?: 'all' | 'yes' | 'no'
  hasApplyNow?: 'all' | 'yes' | 'no'
  savedFrom?: string
  savedTo?: string
  status?: string
  limit?: number
}

async function probeTable(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  if (/does not exist|relation|schema cache/i.test(error.message)) return false
  return !/does not exist/i.test(error.message)
}

function weekAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

function displayNameFromUser(user: User | null, profileName?: string | null): string {
  if (profileName && profileName.trim()) return profileName.trim()
  if (!user) return 'Anonymous / guest'
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
    ''
  if (fromMeta) return fromMeta
  const email = user.email || ''
  if (email.includes('@')) return email.split('@')[0]
  return 'User'
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) {
      out.push(item.trim())
      continue
    }
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>
      const label = String(o.title || o.name || o.role || o.label || '').trim()
      if (label) out.push(label)
    }
  }
  return out.slice(0, 12)
}

function extractPlanExtras(result: Record<string, unknown> | null | undefined): {
  workNowRoles: string[]
  optionalAddons: string[]
  cvAction: string | null
} {
  if (!result || typeof result !== 'object') {
    return { workNowRoles: [], optionalAddons: [], cvAction: null }
  }
  const plan =
    result.jobaz_plan && typeof result.jobaz_plan === 'object'
      ? (result.jobaz_plan as Record<string, unknown>)
      : result.plan && typeof result.plan === 'object'
        ? (result.plan as Record<string, unknown>)
        : null

  const workNowRoles = asStringList(plan?.work_now ?? result.work_now)
  const optionalAddons = asStringList(
    plan?.optional_addons ??
      plan?.addons ??
      result.optional_addons ??
      result.addons
  )
  const cvRaw = plan?.cv_action ?? result.cv_action ?? result.cvAction
  const cvAction =
    cvRaw == null || cvRaw === ''
      ? null
      : typeof cvRaw === 'string'
        ? cvRaw.trim() || null
        : typeof cvRaw === 'object'
          ? String(
              (cvRaw as Record<string, unknown>).title ||
                (cvRaw as Record<string, unknown>).text ||
                (cvRaw as Record<string, unknown>).action ||
                ''
            ).trim() || null
          : String(cvRaw).trim() || null

  return { workNowRoles, optionalAddons, cvAction }
}

async function loadUsersByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Map<string, User>> {
  const map = new Map<string, User>()
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 200)
  await Promise.all(
    unique.map(async (id) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(id)
        if (data?.user) map.set(id, data.user)
      } catch {
        // ignore per-user failures
      }
    })
  )
  return map
}

async function loadProfileNames(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (userIds.length === 0) return map
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, headline')
    .in('user_id', userIds.slice(0, 500))
  if (error || !data) return map
  for (const row of data) {
    const uid = String((row as { user_id?: string }).user_id || '')
    if (!uid) continue
    const username = String((row as { username?: string | null }).username || '').trim()
    const headline = String((row as { headline?: string | null }).headline || '').trim()
    map.set(uid, username || headline || '')
  }
  return map
}

type CvLite = { status: AdminCvStatus; updatedAt: string | null }

async function loadCvByUser(
  supabase: SupabaseClient,
  available: boolean
): Promise<Map<string, CvLite>> {
  const map = new Map<string, CvLite>()
  if (!available) return map
  const { data, error } = await supabase
    .from('cvs')
    .select('user_id, updated_at, saved_at, created_at, summary, skills')
    .order('updated_at', { ascending: false })
    .limit(800)
  if (error || !data) {
    const retry = await supabase.from('cvs').select('user_id, updated_at, created_at').limit(800)
    if (retry.error || !retry.data) return map
    for (const row of retry.data as unknown as Record<string, unknown>[]) {
      const uid = String(row.user_id || '')
      if (!uid || map.has(uid)) continue
      const updatedAt =
        (row.updated_at as string | null) || (row.created_at as string | null) || null
      map.set(uid, { status: updatedAt ? 'saved' : 'started', updatedAt })
    }
    return map
  }
  for (const row of data as unknown as Record<string, unknown>[]) {
    const uid = String(row.user_id || '')
    if (!uid || map.has(uid)) continue
    const updatedAt =
      (row.updated_at as string | null) ||
      (row.saved_at as string | null) ||
      (row.created_at as string | null) ||
      null
    const summary = String(row.summary || '').trim()
    const skills = row.skills
    const skillLen = Array.isArray(skills)
      ? skills.length
      : typeof skills === 'string'
        ? skills.split(/[,|]/).filter(Boolean).length
        : 0
    let status: AdminCvStatus = 'started'
    if (summary.length >= 40 || skillLen >= 3) status = 'completed'
    else if (updatedAt) status = 'saved'
    map.set(uid, { status, updatedAt })
  }
  return map
}

type ClickLite = {
  count: number
  courses: string[]
  providers: string[]
  latestAt: string | null
  interest: string | null
}

async function loadClicksByUser(
  supabase: SupabaseClient,
  available: boolean
): Promise<Map<string, ClickLite>> {
  const map = new Map<string, ClickLite>()
  if (!available) return map
  const { data, error } = await supabase
    .from('course_clicks')
    .select('user_id, course_id, provider_name, clicked_at')
    .not('user_id', 'is', null)
    .order('clicked_at', { ascending: false })
    .limit(1000)
  if (error || !data) return map

  const courseIds = [
    ...new Set(
      data
        .map((r) => (r as { course_id?: string | null }).course_id)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  const titles = new Map<string, string>()
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds.slice(0, 200))
    for (const c of courses || []) {
      titles.set(String((c as { id: string }).id), String((c as { title?: string }).title || ''))
    }
  }

  for (const row of data) {
    const uid = String((row as { user_id?: string | null }).user_id || '')
    if (!uid) continue
    const courseId = (row as { course_id?: string | null }).course_id
    const title = courseId ? titles.get(courseId) || null : null
    const provider = String((row as { provider_name?: string | null }).provider_name || '').trim()
    const clickedAt = String((row as { clicked_at?: string }).clicked_at || '') || null
    const existing = map.get(uid)
    if (!existing) {
      map.set(uid, {
        count: 1,
        courses: title ? [title] : [],
        providers: provider ? [provider] : [],
        latestAt: clickedAt,
        interest: title || provider || null,
      })
    } else {
      existing.count += 1
      if (title && !existing.courses.includes(title) && existing.courses.length < 8) {
        existing.courses.push(title)
      }
      if (provider && !existing.providers.includes(provider) && existing.providers.length < 8) {
        existing.providers.push(provider)
      }
      if (!existing.interest) existing.interest = title || provider || null
    }
  }
  return map
}

type RawPlanRow = {
  id: string
  userId: string | null
  createdAt: string
  goal: string | null
  route: string | null
  targetRole: string | null
  nextUpgrade: string | null
  recommendedCourse: string | null
  readiness: number | null
  readinessTracked: boolean
  isTest: boolean
  workNowRoles: string[]
  optionalAddons: string[]
  cvAction: string | null
  relatedProvider: string | null
}

async function loadSavedAssessmentPlans(
  supabase: SupabaseClient
): Promise<{ rows: RawPlanRow[]; error?: string }> {
  const trySelect = async (cols: string) =>
    supabase
      .from('ai_career_assessments')
      .select(cols)
      .order('created_at', { ascending: false })
      .limit(500)

  let { data, error } = await trySelect(
    'id, user_id, created_at, recommended_path, answers, result, recommended_tools, source, is_test'
  )
  if (error && /is_test|column/i.test(error.message)) {
    const retry = await trySelect(
      'id, user_id, created_at, recommended_path, answers, result, recommended_tools, source'
    )
    data = retry.data
    error = retry.error
  }
  if (error) return { rows: [], error: error.message }
  if (!data) return { rows: [] }

  const rows: RawPlanRow[] = []
  for (const row of data as unknown as Record<string, unknown>[]) {
    const result = (row.result || null) as Record<string, unknown> | null
    if (!hasSavedPlan(result)) continue

    const answers = (row.answers || {}) as Record<string, unknown>
    const goal = extractGoal(answers) || null
    const route =
      normalizeRouteLabel(
        String(row.recommended_path || answers.path || '')
      ) || null
    const tools = Array.isArray(row.recommended_tools) ? row.recommended_tools : []
    const planCtx = extractPlanContextFromResult({
      route: route || '—',
      goal: goal || '—',
      result,
      tools,
      savedPlan: true,
      isTest: Boolean(row.is_test),
    })
    const extras = extractPlanExtras(result)

    let readiness: number | null = null
    let readinessTracked = false
    if (result && typeof result === 'object') {
      const candidates = [
        result.readiness_score,
        result.readinessScore,
        result.readiness,
        (result.jobaz_plan as Record<string, unknown> | undefined)?.readiness_score,
      ]
      for (const c of candidates) {
        const n = Number(c)
        if (!Number.isNaN(n) && c != null && String(c).trim() !== '') {
          readiness = n
          readinessTracked = true
          break
        }
      }
    }

    const relatedProvider =
      extras.cvAction && /provider/i.test(extras.cvAction)
        ? null
        : (() => {
            const training =
              result?.training_next && typeof result.training_next === 'object'
                ? (result.training_next as Record<string, unknown>)
                : result?.jobaz_plan &&
                    typeof result.jobaz_plan === 'object' &&
                    (result.jobaz_plan as Record<string, unknown>).training_next &&
                    typeof (result.jobaz_plan as Record<string, unknown>).training_next ===
                      'object'
                  ? ((result.jobaz_plan as Record<string, unknown>)
                      .training_next as Record<string, unknown>)
                  : null
            const p = String(training?.provider_name || training?.provider || '').trim()
            return p || null
          })()

    rows.push({
      id: String(row.id || ''),
      userId: row.user_id ? String(row.user_id) : null,
      createdAt: String(row.created_at || ''),
      goal,
      route: route && route !== '—' ? route : null,
      targetRole:
        planCtx.currentTarget && planCtx.currentTarget !== '—'
          ? planCtx.currentTarget
          : null,
      nextUpgrade:
        planCtx.nextUpgrade && planCtx.nextUpgrade !== '—'
          ? planCtx.nextUpgrade
          : null,
      recommendedCourse:
        planCtx.recommendedCourse && planCtx.recommendedCourse !== '—'
          ? planCtx.recommendedCourse
          : null,
      readiness,
      readinessTracked,
      isTest: Boolean(row.is_test),
      workNowRoles: extras.workNowRoles,
      optionalAddons: extras.optionalAddons,
      cvAction: extras.cvAction,
      relatedProvider,
    })
  }
  return { rows }
}

function emptySummary(notes: string[], available: boolean): SavedPlansSummary {
  return {
    totalSavedPlans: 0,
    savedThisWeek: 0,
    mostCommonRoute: null,
    mostCommonTargetRole: null,
    plansWithRecommendedCourse: 0,
    plansWithApplyNow: 0,
    plansWithCv: 0,
    assessmentsAvailable: available,
    notes,
  }
}

export async function listSavedPlans(
  filters: SavedPlansFilters = {}
): Promise<SavedPlansListResult> {
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      ok: false,
      plans: [],
      summary: emptySummary(
        ['Supabase service role not configured — cannot load saved plans'],
        false
      ),
      routes: [],
      goals: [],
      error: 'Supabase service role not configured',
    }
  }

  const [assessmentsOk, cvsOk, clicksOk, profilesOk] = await Promise.all([
    probeTable(supabase, 'ai_career_assessments'),
    probeTable(supabase, 'cvs'),
    probeTable(supabase, 'course_clicks'),
    probeTable(supabase, 'profiles'),
  ])

  if (!assessmentsOk) {
    notes.push('ai_career_assessments: Not tracked yet')
    return {
      ok: true,
      plans: [],
      summary: emptySummary(notes, false),
      routes: [],
      goals: [],
    }
  }

  const { rows, error } = await loadSavedAssessmentPlans(supabase)
  if (error) notes.push(`assessments: ${error}`)
  if (!cvsOk) notes.push('CVs: Not tracked yet')
  if (!clicksOk) notes.push('Apply Now clicks: Not tracked yet')

  const userIds = rows.map((r) => r.userId).filter((id): id is string => Boolean(id))
  const [users, profileNames, cvs, clicks] = await Promise.all([
    loadUsersByIds(supabase, userIds),
    profilesOk ? loadProfileNames(supabase, userIds) : Promise.resolve(new Map<string, string>()),
    loadCvByUser(supabase, cvsOk),
    loadClicksByUser(supabase, clicksOk),
  ])

  const weekAgo = weekAgoIso()
  const routeCounts = new Map<string, number>()
  const targetCounts = new Map<string, number>()
  let savedThisWeek = 0
  let plansWithRecommendedCourse = 0
  let plansWithApplyNow = 0
  let plansWithCv = 0

  let plans: SavedPlanListItem[] = rows.map((row) => {
    const user = row.userId ? users.get(row.userId) || null : null
    const email = user?.email || (row.userId ? '—' : 'Guest / anonymous')
    const name = displayNameFromUser(
      user,
      row.userId ? profileNames.get(row.userId) : null
    )
    const cv = row.userId ? cvs.get(row.userId) : undefined
    const click = row.userId ? clicks.get(row.userId) : undefined
    const cvStatus: AdminCvStatus = !cvsOk
      ? 'not_tracked'
      : cv?.status || 'none'
    const applyNow = click?.count || 0
    const hasCv = Boolean(cv && cv.status !== 'none')
    const status = classifyPlanStatus({
      savedAt: row.createdAt || null,
      isTest: row.isTest,
      email: user?.email,
    })
    const { insight } = buildPlanInsight({
      status,
      hasCv,
      applyNowClicks: applyNow,
      recommendedCourse: row.recommendedCourse,
      courseInterest: Boolean(click?.interest || row.recommendedCourse),
    })

    if (row.createdAt && row.createdAt >= weekAgo) savedThisWeek += 1
    if (row.recommendedCourse) plansWithRecommendedCourse += 1
    if (applyNow > 0) plansWithApplyNow += 1
    if (hasCv) plansWithCv += 1
    if (row.route) routeCounts.set(row.route, (routeCounts.get(row.route) || 0) + 1)
    if (row.targetRole) {
      targetCounts.set(row.targetRole, (targetCounts.get(row.targetRole) || 0) + 1)
    }

    return {
      id: row.id,
      userId: row.userId,
      userName: name,
      email,
      goal: row.goal,
      route: row.route,
      targetRole: row.targetRole,
      nextUpgrade: row.nextUpgrade,
      recommendedCourse: row.recommendedCourse,
      readiness: row.readiness,
      readinessTracked: row.readinessTracked,
      savedAt: row.createdAt || null,
      cvStatus,
      applyNowClicks: applyNow,
      applyNowTracked: clicksOk,
      status,
      insight,
    }
  })

  // Filters
  const search = String(filters.search || '').trim().toLowerCase()
  if (search) {
    plans = plans.filter(
      (p) =>
        p.email.toLowerCase().includes(search) ||
        p.userName.toLowerCase().includes(search)
    )
  }
  if (filters.route && filters.route !== 'all') {
    const r = filters.route.toLowerCase()
    plans = plans.filter((p) => (p.route || '').toLowerCase().includes(r))
  }
  if (filters.goal && filters.goal !== 'all') {
    const g = filters.goal.toLowerCase()
    plans = plans.filter((p) => (p.goal || '').toLowerCase().includes(g))
  }
  if (filters.hasCv === 'yes') {
    plans = plans.filter((p) => p.cvStatus !== 'none' && p.cvStatus !== 'not_tracked')
  }
  if (filters.hasCv === 'no') {
    plans = plans.filter((p) => p.cvStatus === 'none' || p.cvStatus === 'not_tracked')
  }
  if (filters.hasApplyNow === 'yes') plans = plans.filter((p) => p.applyNowClicks > 0)
  if (filters.hasApplyNow === 'no') plans = plans.filter((p) => p.applyNowClicks === 0)
  if (filters.savedFrom) {
    plans = plans.filter((p) => p.savedAt && p.savedAt >= filters.savedFrom!)
  }
  if (filters.savedTo) {
    plans = plans.filter((p) => p.savedAt && p.savedAt <= filters.savedTo!)
  }
  if (filters.status && filters.status !== 'all') {
    plans = plans.filter((p) => p.status === filters.status)
  }

  plans.sort((a, b) => {
    const ta = a.savedAt ? new Date(a.savedAt).getTime() : 0
    const tb = b.savedAt ? new Date(b.savedAt).getTime() : 0
    return tb - ta
  })

  const limit = Math.min(filters.limit || 200, 500)
  plans = plans.slice(0, limit)

  const mode = (m: Map<string, number>) => {
    let best: string | null = null
    let n = 0
    for (const [k, v] of m) {
      if (v > n) {
        n = v
        best = k
      }
    }
    return best
  }

  return {
    ok: true,
    plans,
    summary: {
      totalSavedPlans: rows.length,
      savedThisWeek,
      mostCommonRoute: mode(routeCounts),
      mostCommonTargetRole: mode(targetCounts),
      plansWithRecommendedCourse,
      plansWithApplyNow: clicksOk ? plansWithApplyNow : 0,
      plansWithCv: cvsOk ? plansWithCv : 0,
      assessmentsAvailable: true,
      notes,
    },
    routes: [...routeCounts.keys()].sort(),
    goals: [
      ...new Set(rows.map((r) => r.goal).filter((g): g is string => Boolean(g))),
    ].sort(),
  }
}

export async function getSavedPlanDetail(planId: string): Promise<
  | { ok: true; plan: SavedPlanDetail }
  | { ok: false; error: string }
> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return { ok: false, error: 'Supabase service role not configured' }

  const assessmentsOk = await probeTable(supabase, 'ai_career_assessments')
  if (!assessmentsOk) return { ok: false, error: 'Saved plans not tracked yet' }

  const trySelect = async (cols: string) =>
    supabase.from('ai_career_assessments').select(cols).eq('id', planId).maybeSingle()

  let { data, error } = await trySelect(
    'id, user_id, created_at, recommended_path, answers, result, recommended_tools, source, is_test'
  )
  if (error && /is_test|column/i.test(error.message)) {
    const retry = await trySelect(
      'id, user_id, created_at, recommended_path, answers, result, recommended_tools, source'
    )
    data = retry.data
    error = retry.error
  }
  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Plan not found' }

  const row = data as unknown as Record<string, unknown>
  const result = (row.result || null) as Record<string, unknown> | null
  if (!hasSavedPlan(result)) {
    return { ok: false, error: 'Assessment found but no saved plan detected' }
  }

  const [cvsOk, clicksOk, profilesOk] = await Promise.all([
    probeTable(supabase, 'cvs'),
    probeTable(supabase, 'course_clicks'),
    probeTable(supabase, 'profiles'),
  ])

  const userId = row.user_id ? String(row.user_id) : null
  const users = userId
    ? await loadUsersByIds(supabase, [userId])
    : new Map<string, User>()
  const user = userId ? users.get(userId) || null : null
  const profileNames =
    profilesOk && userId
      ? await loadProfileNames(supabase, [userId])
      : new Map<string, string>()
  const cvs = await loadCvByUser(supabase, cvsOk)
  const clicks = await loadClicksByUser(supabase, clicksOk)

  const answers = (row.answers || {}) as Record<string, unknown>
  const goal = extractGoal(answers) || null
  const route =
    normalizeRouteLabel(String(row.recommended_path || answers.path || '')) || null
  const tools = Array.isArray(row.recommended_tools) ? row.recommended_tools : []
  const planCtx = extractPlanContextFromResult({
    route: route || '—',
    goal: goal || '—',
    result,
    tools,
    savedPlan: true,
    isTest: Boolean(row.is_test),
  })
  const extras = extractPlanExtras(result)

  let readiness: number | null = null
  let readinessTracked = false
  if (result) {
    for (const c of [
      result.readiness_score,
      result.readinessScore,
      result.readiness,
    ]) {
      const n = Number(c)
      if (!Number.isNaN(n) && c != null && String(c).trim() !== '') {
        readiness = n
        readinessTracked = true
        break
      }
    }
  }

  const training =
    result?.training_next && typeof result.training_next === 'object'
      ? (result.training_next as Record<string, unknown>)
      : result?.jobaz_plan &&
          typeof result.jobaz_plan === 'object' &&
          (result.jobaz_plan as Record<string, unknown>).training_next &&
          typeof (result.jobaz_plan as Record<string, unknown>).training_next === 'object'
        ? ((result.jobaz_plan as Record<string, unknown>).training_next as Record<
            string,
            unknown
          >)
        : null
  const relatedProvider =
    String(training?.provider_name || training?.provider || '').trim() || null

  const cv = userId ? cvs.get(userId) : undefined
  const click = userId ? clicks.get(userId) : undefined
  const applyNow = click?.count || 0
  const hasCv = Boolean(cv && cv.status !== 'none')
  const savedAt = String(row.created_at || '') || null
  const status = classifyPlanStatus({
    savedAt,
    isTest: Boolean(row.is_test),
    email: user?.email,
  })
  const recommendedCourse =
    planCtx.recommendedCourse && planCtx.recommendedCourse !== '—'
      ? planCtx.recommendedCourse
      : null
  const { insight, detail } = buildPlanInsight({
    status,
    hasCv,
    applyNowClicks: applyNow,
    recommendedCourse,
    courseInterest: Boolean(click?.interest || recommendedCourse),
  })

  return {
    ok: true,
    plan: {
      id: String(row.id),
      profile: {
        userId,
        name: displayNameFromUser(
          user,
          userId ? profileNames.get(userId) : null
        ),
        email: user?.email || (userId ? '—' : 'Guest / anonymous'),
      },
      plan: {
        goal,
        route: route && route !== '—' ? route : null,
        targetRole:
          planCtx.currentTarget && planCtx.currentTarget !== '—'
            ? planCtx.currentTarget
            : null,
        nextUpgrade:
          planCtx.nextUpgrade && planCtx.nextUpgrade !== '—'
            ? planCtx.nextUpgrade
            : null,
        recommendedCourse,
        readiness,
        readinessTracked,
        savedAt,
        status,
        workNowRoles: extras.workNowRoles,
        optionalAddons: extras.optionalAddons,
        cvAction: extras.cvAction,
      },
      documents: {
        cvTracked: cvsOk,
        cvStatus: !cvsOk ? 'not_tracked' : cv?.status || 'none',
        cvUpdatedAt: cv?.updatedAt || null,
      },
      courses: {
        tracked: clicksOk,
        applyNowClicks: applyNow,
        clickedCourses: click?.courses || [],
        clickedProviders: click?.providers || [],
        relatedProvider,
        latestClickAt: click?.latestAt || null,
      },
      insight,
      insightDetail: detail,
    },
  }
}
