import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  extractGoal,
  extractPlanContextFromResult,
  hasSavedPlan,
  normalizeRouteLabel,
} from '@/lib/admin/ai/sessionQuality'
import { isMeaningfulCv } from '@/lib/cv/isMeaningfulCv'
import { calculateCvReadiness } from '@/lib/cv/calculateCvReadiness'
import {
  buildInsight,
  computeEngagement,
  deriveCvStatus,
  isLikelyTestEmail,
} from './engagement'
import type {
  AdminCvStatus,
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersListResult,
  AdminUsersSummary,
  AdminUsersTracking,
  TrackingFlag,
} from './types'

export type AdminUsersFilters = {
  search?: string
  route?: string
  joinedFrom?: string
  joinedTo?: string
  hasSavedPlan?: 'all' | 'yes' | 'no'
  hasCv?: 'all' | 'yes' | 'no'
  hasApplyNow?: 'all' | 'yes' | 'no'
  engagement?: string
  limit?: number
}

function flag(available: boolean, label: string, hint?: string): TrackingFlag {
  return {
    available,
    label: available ? label : 'Not tracked yet',
    hint: available ? hint : hint || 'Not wired yet — monitoring missing, not necessarily a failure',
  }
}

async function probeTable(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  if (/does not exist|relation|schema cache/i.test(error.message)) return false
  // Permission or empty is still "available"
  return !/does not exist/i.test(error.message)
}

function displayName(user: User, profileName?: string | null): string {
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const fromMeta =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
    ''
  if (profileName && profileName.trim()) return profileName.trim()
  if (fromMeta) return fromMeta
  const email = user.email || ''
  if (email.includes('@')) return email.split('@')[0]
  return 'User'
}

function pickLatest(...dates: Array<string | null | undefined>): string | null {
  let best: string | null = null
  let bestTs = 0
  for (const d of dates) {
    if (!d) continue
    const t = new Date(d).getTime()
    if (!Number.isNaN(t) && t >= bestTs) {
      bestTs = t
      best = d
    }
  }
  return best
}

function weekAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
}

type AssessmentAgg = {
  count: number
  latestAt: string | null
  goal: string | null
  route: string | null
  savedPlan: boolean
  currentTarget: string | null
  nextUpgrade: string | null
  isTest: boolean
}

type CvAgg = {
  exists: boolean
  status: AdminCvStatus
  updatedAt: string | null
  readiness: number | null
  readinessTracked: boolean
}

type ClickAgg = {
  count: number
  latestAt: string | null
  courses: string[]
  providers: string[]
  interest: string | null
}

async function loadAuthUsers(
  supabase: SupabaseClient,
  perPage = 200
): Promise<{ users: User[]; error?: string }> {
  const all: User[] = []
  let page = 1
  // Cap pages to keep admin page responsive
  for (; page <= 5; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })
    if (error) {
      return { users: all, error: error.message }
    }
    const batch = data?.users || []
    all.push(...batch)
    if (batch.length < perPage) break
  }
  return { users: all }
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

async function loadAssessmentAggs(
  supabase: SupabaseClient,
  available: boolean
): Promise<Map<string, AssessmentAgg>> {
  const map = new Map<string, AssessmentAgg>()
  if (!available) return map

  const trySelect = async (cols: string) =>
    supabase
      .from('ai_career_assessments')
      .select(cols)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(800)

  let { data, error } = await trySelect(
    'id, user_id, created_at, recommended_path, answers, result, source, is_test'
  )
  if (error && /is_test|column/i.test(error.message)) {
    const retry = await trySelect(
      'id, user_id, created_at, recommended_path, answers, result, source'
    )
    data = retry.data
    error = retry.error
  }

  if (error || !data) return map

  for (const row of data) {
    const uid = String((row as { user_id?: string | null }).user_id || '')
    if (!uid) continue
    const existing = map.get(uid)
    const answers = ((row as { answers?: unknown }).answers || {}) as Record<string, unknown>
    const result = (row as { result?: unknown }).result as Record<string, unknown> | null
    const goal = extractGoal(answers) || null
    const route =
      normalizeRouteLabel(
        String(
          (row as { recommended_path?: string | null }).recommended_path ||
            answers.path ||
            ''
        )
      ) || null
    const saved = hasSavedPlan(result)
    const planCtx = extractPlanContextFromResult({
      route: route || '—',
      goal: goal || '—',
      result,
      savedPlan: saved,
    })
    const createdAt = String((row as { created_at?: string }).created_at || '')
    const isTest = Boolean((row as { is_test?: boolean }).is_test)

    if (!existing) {
      map.set(uid, {
        count: 1,
        latestAt: createdAt || null,
        goal,
        route: route && route !== '—' ? route : null,
        savedPlan: saved,
        currentTarget:
          planCtx.currentTarget && planCtx.currentTarget !== '—'
            ? planCtx.currentTarget
            : null,
        nextUpgrade:
          planCtx.nextUpgrade && planCtx.nextUpgrade !== '—'
            ? planCtx.nextUpgrade
            : null,
        isTest,
      })
    } else {
      existing.count += 1
      existing.savedPlan = existing.savedPlan || saved
      existing.isTest = existing.isTest || isTest
      // Keep latest fields from first (already ordered desc)
    }
  }
  return map
}

async function loadCvAggs(
  supabase: SupabaseClient,
  available: boolean,
  options: { deep?: boolean } = {}
): Promise<Map<string, CvAgg>> {
  const map = new Map<string, CvAgg>()
  if (!available) return map

  const deep = Boolean(options.deep)
  const select = deep
    ? 'id, user_id, updated_at, saved_at, created_at, title, summary, personal_info, experience, education, skills, data'
    : 'id, user_id, updated_at, saved_at, created_at, title, summary, skills'

  const { data, error } = await supabase
    .from('cvs')
    .select(select)
    .order('updated_at', { ascending: false })
    .limit(deep ? 50 : 800)

  if (error || !data) {
    const retry = await supabase
      .from('cvs')
      .select('id, user_id, updated_at, created_at')
      .limit(800)
    if (retry.error || !retry.data) return map
    return buildCvMap(retry.data as unknown as Record<string, unknown>[], deep)
  }

  return buildCvMap(data as unknown as Record<string, unknown>[], deep)
}

function buildCvMap(rows: Record<string, unknown>[], deep: boolean): Map<string, CvAgg> {
  const map = new Map<string, CvAgg>()
  for (const row of rows) {
    const uid = String(row.user_id || '')
    if (!uid || map.has(uid)) continue

    const updatedAt =
      (row.updated_at as string | null) ||
      (row.saved_at as string | null) ||
      (row.created_at as string | null) ||
      null

    let meaningful: boolean | null = null
    let readiness: number | null = null
    let readinessTracked = false

    if (deep) {
      const personalInfo = row.personal_info as Record<string, unknown> | null
      const dataObj = row.data as Record<string, unknown> | null
      const like = {
        personalInfo: personalInfo
          ? {
              fullName: String(personalInfo.fullName || personalInfo.full_name || ''),
              email: String(personalInfo.email || ''),
              phone: String(personalInfo.phone || ''),
              location: String(personalInfo.location || personalInfo.city || ''),
            }
          : undefined,
        summary: String(row.summary || dataObj?.summary || ''),
        skills: (row.skills || dataObj?.skills) as string[] | string | undefined,
        experience: (row.experience || dataObj?.experience) as MeaningfulExp,
        education: (row.education || dataObj?.education) as MeaningfulEdu,
      }
      try {
        meaningful = isMeaningfulCv(like)
      } catch {
        meaningful = null
      }
      try {
        const score = calculateCvReadiness(like as never)
        readiness = Number(score?.score)
        readinessTracked = !Number.isNaN(readiness)
      } catch {
        readinessTracked = false
      }
    } else {
      // Lightweight list heuristic — no personal contact fields used in response
      const summary = String(row.summary || '').trim()
      const skills = row.skills
      const skillLen = Array.isArray(skills)
        ? skills.length
        : typeof skills === 'string'
          ? skills.split(/[,|]/).filter(Boolean).length
          : 0
      if (summary.length >= 40 || skillLen >= 3) meaningful = true
      else if (summary.length > 0 || skillLen > 0) meaningful = false
      else meaningful = null
    }

    map.set(uid, {
      exists: true,
      status: deriveCvStatus({ exists: true, meaningful, updatedAt }),
      updatedAt,
      readiness,
      readinessTracked,
    })
  }
  return map
}

type MeaningfulExp = Array<{
  jobTitle?: string
  company?: string
  description?: string
  bullets?: string[]
}>
type MeaningfulEdu = Array<{
  degree?: string
  school?: string
  field?: string
}>

async function loadClickAggs(
  supabase: SupabaseClient,
  available: boolean
): Promise<Map<string, ClickAgg>> {
  const map = new Map<string, ClickAgg>()
  if (!available) return map

  const { data, error } = await supabase
    .from('course_clicks')
    .select('user_id, course_id, provider_name, clicked_at, action, source')
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
  const courseTitles = new Map<string, string>()
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds.slice(0, 200))
    for (const c of courses || []) {
      courseTitles.set(String((c as { id: string }).id), String((c as { title?: string }).title || ''))
    }
  }

  for (const row of data) {
    const uid = String((row as { user_id?: string | null }).user_id || '')
    if (!uid) continue
    const courseId = (row as { course_id?: string | null }).course_id
    const title = courseId ? courseTitles.get(courseId) || null : null
    const provider = String((row as { provider_name?: string | null }).provider_name || '').trim()
    const clickedAt = String((row as { clicked_at?: string }).clicked_at || '') || null

    const existing = map.get(uid)
    if (!existing) {
      map.set(uid, {
        count: 1,
        latestAt: clickedAt,
        courses: title ? [title] : [],
        providers: provider ? [provider] : [],
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

async function loadUserIdSet(
  supabase: SupabaseClient,
  table: string,
  available: boolean
): Promise<Set<string>> {
  const set = new Set<string>()
  if (!available) return set
  const { data, error } = await supabase
    .from(table)
    .select('user_id')
    .not('user_id', 'is', null)
    .limit(1000)
  if (error || !data) return set
  for (const row of data) {
    const uid = String((row as { user_id?: string }).user_id || '')
    if (uid) set.add(uid)
  }
  return set
}

function buildTracking(flags: {
  auth: boolean
  profiles: boolean
  assessments: boolean
  cvs: boolean
  clicks: boolean
  cover: boolean
  writing: boolean
  interview: boolean
}): AdminUsersTracking {
  return {
    authUsers: flag(flags.auth, 'Auth users', 'Loaded via auth.admin.listUsers'),
    profiles: flag(flags.profiles, 'Profiles', 'Display names from profiles table when present'),
    assessments: flag(
      flags.assessments,
      'Career assessments',
      'ai_career_assessments linked by user_id'
    ),
    cvs: flag(flags.cvs, 'CVs', 'cvs table — content never shown in list'),
    courseClicks: flag(flags.clicks, 'Course / Apply Now clicks', 'course_clicks by user_id'),
    coverLetters: flag(flags.cover, 'Cover letters', 'cover_letters existence only'),
    writingReview: flag(
      flags.writing,
      'Writing review',
      'proofreading_documents existence only'
    ),
    interviewCoach: flag(
      flags.interview,
      'Interview coach',
      'interview_sessions if present'
    ),
  }
}

function emptySummary(notes: string[]): AdminUsersSummary {
  return {
    totalUsers: 0,
    newUsersThisWeek: 0,
    usersWithSavedPlans: 0,
    usersWithCvs: 0,
    usersWithApplyNow: 0,
    mostCommonRoute: null,
    returningUsers: 0,
    usersAvailable: false,
    notes,
  }
}

export async function listAdminUsers(
  filters: AdminUsersFilters = {}
): Promise<AdminUsersListResult> {
  const notes: string[] = []
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    const tracking = buildTracking({
      auth: false,
      profiles: false,
      assessments: false,
      cvs: false,
      clicks: false,
      cover: false,
      writing: false,
      interview: false,
    })
    return {
      ok: false,
      users: [],
      summary: emptySummary([
        'Supabase service role not configured — cannot load auth users',
      ]),
      tracking,
      routes: [],
      error: 'Supabase service role not configured',
    }
  }

  const [
    profilesOk,
    assessmentsOk,
    cvsOk,
    clicksOk,
    coverOk,
    writingOk,
    interviewOk,
  ] = await Promise.all([
    probeTable(supabase, 'profiles'),
    probeTable(supabase, 'ai_career_assessments'),
    probeTable(supabase, 'cvs'),
    probeTable(supabase, 'course_clicks'),
    probeTable(supabase, 'cover_letters'),
    probeTable(supabase, 'proofreading_documents'),
    probeTable(supabase, 'interview_sessions'),
  ])

  const { users: authUsers, error: authError } = await loadAuthUsers(supabase)
  if (authError) notes.push(`auth.users: ${authError}`)
  if (authUsers.length === 0 && authError) {
    const tracking = buildTracking({
      auth: false,
      profiles: profilesOk,
      assessments: assessmentsOk,
      cvs: cvsOk,
      clicks: clicksOk,
      cover: coverOk,
      writing: writingOk,
      interview: interviewOk,
    })
    return {
      ok: false,
      users: [],
      summary: emptySummary(notes),
      tracking,
      routes: [],
      error: authError,
    }
  }

  const userIds = authUsers.map((u) => u.id)
  const [profileNames, assessments, cvs, clicks, coverSet, writingSet, interviewSet] =
    await Promise.all([
      profilesOk ? loadProfileNames(supabase, userIds) : Promise.resolve(new Map<string, string>()),
      loadAssessmentAggs(supabase, assessmentsOk),
      loadCvAggs(supabase, cvsOk, { deep: false }),
      loadClickAggs(supabase, clicksOk),
      loadUserIdSet(supabase, 'cover_letters', coverOk),
      loadUserIdSet(supabase, 'proofreading_documents', writingOk),
      loadUserIdSet(supabase, 'interview_sessions', interviewOk),
    ])

  if (!assessmentsOk) notes.push('Career assessments: Not tracked yet')
  if (!cvsOk) notes.push('CVs: Not tracked yet')
  if (!clicksOk) notes.push('Apply Now clicks: Not tracked yet')

  // cover/writing/interview sets are only needed for detail views
  void coverSet
  void writingSet
  void interviewSet

  const weekAgo = weekAgoIso()
  const routeCounts = new Map<string, number>()
  let usersWithSavedPlans = 0
  let usersWithCvs = 0
  let usersWithApplyNow = 0
  let newUsersThisWeek = 0
  let returningUsers = 0

  let items: AdminUserListItem[] = authUsers.map((user) => {
    const email = user.email || ''
    const a = assessments.get(user.id)
    const c = cvs.get(user.id)
    const k = clicks.get(user.id)
    const hasSavedPlan = Boolean(a?.savedPlan)
    const hasCv = Boolean(c?.exists)
    const applyNow = k?.count || 0
    const joinedAt = user.created_at || null
    const lastActiveAt = pickLatest(
      user.last_sign_in_at,
      a?.latestAt,
      c?.updatedAt,
      k?.latestAt
    )
    const engagement = computeEngagement({
      email,
      joinedAt,
      lastActiveAt,
      hasSavedPlan,
      hasCv,
      applyNowClicks: applyNow,
      hasCourseInterest: Boolean(k?.interest),
      assessmentCount: a?.count || 0,
      forceTest: a?.isTest,
    })
    const insight = buildInsight({
      engagement,
      hasSavedPlan,
      hasCv,
      applyNowClicks: applyNow,
      courseInterest: k?.interest || null,
      assessmentCount: a?.count || 0,
    })

    if (joinedAt && joinedAt >= weekAgo) newUsersThisWeek += 1
    if (hasSavedPlan) usersWithSavedPlans += 1
    if (hasCv) usersWithCvs += 1
    if (applyNow > 0) usersWithApplyNow += 1
    if (a?.count && a.count > 1) returningUsers += 1
    else if (lastActiveAt && joinedAt && lastActiveAt !== joinedAt) returningUsers += 1

    const route = a?.route || null
    if (route) routeCounts.set(route, (routeCounts.get(route) || 0) + 1)

    return {
      id: user.id,
      name: displayName(user, profileNames.get(user.id)),
      email: email || '—',
      joinedAt,
      lastActiveAt,
      selectedRoute: route,
      goal: a?.goal || null,
      hasSavedPlan,
      savedPlanTracked: assessmentsOk,
      cvStatus: c?.status || 'none',
      cvTracked: cvsOk,
      applyNowClicks: applyNow,
      applyNowTracked: clicksOk,
      courseInterest: k?.interest || null,
      engagement,
      insight,
    }
  })

  // Filters
  const search = String(filters.search || '').trim().toLowerCase()
  if (search) {
    items = items.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        u.name.toLowerCase().includes(search)
    )
  }
  if (filters.route && filters.route !== 'all') {
    const r = filters.route.toLowerCase()
    items = items.filter((u) => (u.selectedRoute || '').toLowerCase().includes(r))
  }
  if (filters.joinedFrom) {
    items = items.filter((u) => u.joinedAt && u.joinedAt >= filters.joinedFrom!)
  }
  if (filters.joinedTo) {
    items = items.filter((u) => u.joinedAt && u.joinedAt <= filters.joinedTo!)
  }
  if (filters.hasSavedPlan === 'yes') items = items.filter((u) => u.hasSavedPlan)
  if (filters.hasSavedPlan === 'no') items = items.filter((u) => !u.hasSavedPlan)
  if (filters.hasCv === 'yes') items = items.filter((u) => u.cvStatus !== 'none')
  if (filters.hasCv === 'no') items = items.filter((u) => u.cvStatus === 'none')
  if (filters.hasApplyNow === 'yes') items = items.filter((u) => u.applyNowClicks > 0)
  if (filters.hasApplyNow === 'no') items = items.filter((u) => u.applyNowClicks === 0)
  if (filters.engagement && filters.engagement !== 'all') {
    items = items.filter((u) => u.engagement === filters.engagement)
  }

  items.sort((a, b) => {
    const ta = a.joinedAt ? new Date(a.joinedAt).getTime() : 0
    const tb = b.joinedAt ? new Date(b.joinedAt).getTime() : 0
    return tb - ta
  })

  const limit = Math.min(filters.limit || 200, 500)
  items = items.slice(0, limit)

  let mostCommonRoute: string | null = null
  let best = 0
  for (const [route, count] of routeCounts) {
    if (count > best) {
      best = count
      mostCommonRoute = route
    }
  }

  const tracking = buildTracking({
    auth: !authError,
    profiles: profilesOk,
    assessments: assessmentsOk,
    cvs: cvsOk,
    clicks: clicksOk,
    cover: coverOk,
    writing: writingOk,
    interview: interviewOk,
  })

  // Silence unused tracking helpers already reflected in notes/flags

  return {
    ok: true,
    users: items,
    summary: {
      totalUsers: authUsers.length,
      newUsersThisWeek,
      usersWithSavedPlans: assessmentsOk ? usersWithSavedPlans : 0,
      usersWithCvs: cvsOk ? usersWithCvs : 0,
      usersWithApplyNow: clicksOk ? usersWithApplyNow : 0,
      mostCommonRoute: assessmentsOk ? mostCommonRoute : null,
      returningUsers,
      usersAvailable: !authError,
      notes,
    },
    tracking,
    routes: [...routeCounts.keys()].sort(),
  }
}

export async function getAdminUserDetail(userId: string): Promise<
  | { ok: true; user: AdminUserDetail }
  | { ok: false; error: string }
> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
  if (userError || !userData?.user) {
    return { ok: false, error: userError?.message || 'User not found' }
  }
  const user = userData.user

  const [
    profilesOk,
    assessmentsOk,
    cvsOk,
    clicksOk,
    coverOk,
    writingOk,
    interviewOk,
  ] = await Promise.all([
    probeTable(supabase, 'profiles'),
    probeTable(supabase, 'ai_career_assessments'),
    probeTable(supabase, 'cvs'),
    probeTable(supabase, 'course_clicks'),
    probeTable(supabase, 'cover_letters'),
    probeTable(supabase, 'proofreading_documents'),
    probeTable(supabase, 'interview_sessions'),
  ])

  const [profileNames, assessments, cvs, clicks, coverSet, writingSet, interviewSet] =
    await Promise.all([
      profilesOk
        ? loadProfileNames(supabase, [userId])
        : Promise.resolve(new Map<string, string>()),
      loadAssessmentAggs(supabase, assessmentsOk),
      loadCvAggs(supabase, cvsOk, { deep: true }),
      loadClickAggs(supabase, clicksOk),
      loadUserIdSet(supabase, 'cover_letters', coverOk),
      loadUserIdSet(supabase, 'proofreading_documents', writingOk),
      loadUserIdSet(supabase, 'interview_sessions', interviewOk),
    ])

  // For deep CV, filter to this user only if map has others — reload single user CV if needed
  let c = cvs.get(userId)
  if (cvsOk && !c) {
    const one = await supabase
      .from('cvs')
      .select(
        'id, user_id, updated_at, saved_at, created_at, title, summary, personal_info, experience, education, skills, data'
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
    if (one.data?.length) {
      c = buildCvMap(one.data as unknown as Record<string, unknown>[], true).get(userId)
    }
  }
  const a = assessments.get(userId)
  const k = clicks.get(userId)
  const email = user.email || ''
  const hasSavedPlan = Boolean(a?.savedPlan)
  const hasCv = Boolean(c?.exists)
  const applyNow = k?.count || 0
  const joinedAt = user.created_at || null
  const lastActiveAt = pickLatest(
    user.last_sign_in_at,
    a?.latestAt,
    c?.updatedAt,
    k?.latestAt
  )
  const engagement = computeEngagement({
    email,
    joinedAt,
    lastActiveAt,
    hasSavedPlan,
    hasCv,
    applyNowClicks: applyNow,
    hasCourseInterest: Boolean(k?.interest),
    assessmentCount: a?.count || 0,
    forceTest: a?.isTest || isLikelyTestEmail(email),
  })
  const insight = buildInsight({
    engagement,
    hasSavedPlan,
    hasCv,
    applyNowClicks: applyNow,
    courseInterest: k?.interest || null,
    assessmentCount: a?.count || 0,
  })

  const tracking = buildTracking({
    auth: true,
    profiles: profilesOk,
    assessments: assessmentsOk,
    cvs: cvsOk,
    clicks: clicksOk,
    cover: coverOk,
    writing: writingOk,
    interview: interviewOk,
  })

  const detail: AdminUserDetail = {
    profile: {
      id: user.id,
      name: displayName(user, profileNames.get(userId)),
      email: email || '—',
      createdAt: joinedAt,
      lastSignInAt: user.last_sign_in_at || null,
      accountStatus: user.email_confirmed_at ? 'Active' : 'Unconfirmed email',
    },
    career: {
      tracked: assessmentsOk,
      latestGoal: a?.goal || null,
      latestRoute: a?.route || null,
      currentTargetRole: a?.currentTarget || null,
      nextUpgrade: a?.nextUpgrade || null,
      readinessScore: null,
      readinessTracked: false,
      savedPlan: hasSavedPlan,
      assessmentCount: a?.count || 0,
      hint: assessmentsOk
        ? undefined
        : 'Not tracked yet — ai_career_assessments unavailable',
    },
    documents: {
      cvTracked: cvsOk,
      cvExists: hasCv,
      cvLastUpdated: c?.updatedAt || null,
      cvStatus: c?.status || 'none',
      cvReadinessScore: c?.readiness ?? null,
      cvReadinessTracked: Boolean(c?.readinessTracked),
      coverLetterTracked: coverOk,
      coverLetterExists: coverSet.has(userId),
      writingReviewTracked: writingOk,
      writingReviewUsed: writingSet.has(userId),
      hint: cvsOk ? undefined : 'Not tracked yet — cvs table unavailable',
    },
    courses: {
      tracked: clicksOk,
      applyNowClicks: applyNow,
      clickedCourses: k?.courses || [],
      clickedProviders: k?.providers || [],
      latestClickAt: k?.latestAt || null,
      hint: clicksOk ? undefined : 'Not tracked yet — course_clicks unavailable',
    },
    aiUsage: {
      careerAssistantSessions: a?.count || 0,
      careerAssistantTracked: assessmentsOk,
      cvBuilderUsage: cvsOk
        ? hasCv
          ? 'Used (CV row present)'
          : 'No CV saved'
        : 'Not tracked yet',
      coverLetterUsage: coverOk
        ? coverSet.has(userId)
          ? 'Used'
          : 'Not used'
        : 'Not tracked yet',
      writingReviewUsage: writingOk
        ? writingSet.has(userId)
          ? 'Used'
          : 'Not used'
        : 'Not tracked yet',
      interviewCoachUsage: interviewOk
        ? interviewSet.has(userId)
          ? 'Used'
          : 'Not used'
        : 'Not tracked yet',
    },
    adminNotes: {
      available: false,
      note: null,
      placeholder: 'Admin notes — coming soon (no schema change in this phase)',
    },
    engagement,
    insight,
    tracking,
  }

  return { ok: true, user: detail }
}
