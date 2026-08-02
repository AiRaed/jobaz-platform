import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  extractGoal,
  extractPlanContextFromResult,
  normalizeRouteLabel,
} from '@/lib/admin/ai/sessionQuality'
import { consentStatusForCampaign, loadUserPrefsMap, tableExists } from './preferences'
import type { AudienceRules, CampaignType, MatchCandidate } from './types'

function displayName(user: User): string {
  const meta = (user.user_metadata || {}) as Record<string, unknown>
  const name =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    ''
  if (name) return name
  return user.email?.split('@')[0] || 'User'
}

function scoreBoost(reasons: string[], label: string, points: number, score: { n: number }) {
  reasons.push(label)
  score.n = Math.min(100, score.n + points)
}

function textHaystack(...parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function includesAny(hay: string, needles: string[]): boolean {
  return needles.some((n) => n && hay.includes(n.toLowerCase()))
}

type UserSignal = {
  user: User
  route: string | null
  targetRole: string | null
  location: string | null
  intent: string | null
  planAgeDays: number | null
  courseClicks: number
  signals: string[]
}

/**
 * Suggest recipients for a campaign using available JobAZ signals.
 * Missing tables are skipped (no crash). Consent gates marketing sends.
 */
export async function matchRecipientsForCampaign(params: {
  supabase: SupabaseClient
  campaignType: CampaignType
  rules: AudienceRules
  limit?: number
}): Promise<{
  candidates: MatchCandidate[]
  ai_summary: string
  excluded_summary: string
  compliance_warnings: string[]
  tracking_notes: string[]
}> {
  const { supabase, campaignType, rules } = params
  const limit = params.limit ?? 80
  const tracking_notes: string[] = []
  const compliance_warnings: string[] = [
    'Only send to users with matching consent/preferences.',
    'AI does not send automatically — admin approval is required.',
    'Do not promise jobs, income, or guaranteed outcomes in emails.',
  ]

  const signals: UserSignal[] = []

  let users: User[] = []
  try {
    const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
    users = data?.users ?? []
  } catch {
    tracking_notes.push('Auth user list: Not tracked yet / unavailable')
  }

  const assessmentByUser = new Map<
    string,
    {
      result: Record<string, unknown> | null
      answers: Record<string, unknown> | null
      recommended_path: string | null
      updated_at: string | null
    }
  >()
  if (await tableExists(supabase, 'ai_career_assessments')) {
    const { data } = await supabase
      .from('ai_career_assessments')
      .select('user_id, result, answers, recommended_path, created_at, updated_at')
      .not('user_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(500)
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>
      const uid = String(r.user_id || '')
      if (!uid || assessmentByUser.has(uid)) continue
      assessmentByUser.set(uid, {
        result: r.result && typeof r.result === 'object' ? (r.result as Record<string, unknown>) : null,
        answers:
          r.answers && typeof r.answers === 'object' ? (r.answers as Record<string, unknown>) : null,
        recommended_path: r.recommended_path ? String(r.recommended_path) : null,
        updated_at: r.updated_at
          ? String(r.updated_at)
          : r.created_at
            ? String(r.created_at)
            : null,
      })
    }
  } else {
    tracking_notes.push('Career Assistant assessments: Not tracked yet')
  }

  const clicksByUser = new Map<string, number>()
  if (await tableExists(supabase, 'course_clicks')) {
    const { data } = await supabase.from('course_clicks').select('user_id').limit(2000)
    for (const row of data ?? []) {
      const uid = String((row as { user_id?: string }).user_id || '')
      if (!uid) continue
      clicksByUser.set(uid, (clicksByUser.get(uid) || 0) + 1)
    }
  } else {
    tracking_notes.push('Course clicks: Not tracked yet')
  }

  if (!(await tableExists(supabase, 'opportunities'))) {
    tracking_notes.push('Local opportunities: Not tracked yet')
  }
  if (!(await tableExists(supabase, 'jobs'))) {
    tracking_notes.push('Managed jobs: Not tracked yet')
  }

  for (const user of users) {
    if (!user.email) continue
    const assessment = assessmentByUser.get(user.id)
    const answers = assessment?.answers ?? null
    const goal = extractGoal(answers) || ''
    const routeFromRow = normalizeRouteLabel(
      String(assessment?.recommended_path || answers?.path || '')
    )
    const planCtx = extractPlanContextFromResult({
      route: routeFromRow || goal || '',
      goal,
      result: assessment?.result ?? null,
    })
    const route =
      routeFromRow ||
      (planCtx.currentTarget && planCtx.currentTarget !== '—' ? planCtx.currentTarget : null)
    const targetRole =
      planCtx.currentTarget && planCtx.currentTarget !== '—' ? planCtx.currentTarget : null
    const planAgeDays = assessment?.updated_at
      ? Math.floor(
          (Date.now() - new Date(assessment.updated_at).getTime()) / (24 * 60 * 60 * 1000)
        )
      : null

    signals.push({
      user,
      route,
      targetRole,
      location: null,
      intent: goal || null,
      planAgeDays,
      courseClicks: clicksByUser.get(user.id) || 0,
      signals: [
        route ? `route:${route}` : '',
        targetRole ? `role:${targetRole}` : '',
        goal ? `goal:${goal}` : '',
      ].filter(Boolean),
    })
  }

  const emails = signals.map((s) => s.user.email!).filter(Boolean)
  const { byEmail, byUserId, available: prefsAvailable } = await loadUserPrefsMap(supabase, emails)
  if (!prefsAvailable) {
    tracking_notes.push('Email preferences: Not tracked yet — all marketing recipients excluded')
    compliance_warnings.push('Preference tables missing — marketing campaigns cannot send safely.')
  }

  const routeNeedle = (rules.target_route || '').toLowerCase()
  const roleNeedle = (rules.target_role || '').toLowerCase()
  const locationNeedle = (rules.location || '').toLowerCase()
  const intentNeedle = (rules.user_intent || '').toLowerCase()
  const sourceTitle = (rules.source_title || '').toLowerCase()
  const inactiveDays = rules.inactive_days ?? 14

  const localIntentWords = [
    'extra income',
    'flexible',
    'delivery',
    'cleaning',
    'warehouse',
    'hospitality',
    'local',
    'no experience',
    'quick',
    'care',
    'barber',
    'handyman',
  ]

  const candidates: MatchCandidate[] = []

  for (const s of signals) {
    const email = s.user.email!.toLowerCase()
    const prefs = byUserId.get(s.user.id) || byEmail.get(email) || null
    const consent = consentStatusForCampaign(prefs, campaignType, email)
    const reasons: string[] = []
    const score = { n: 10 }
    const hay = textHaystack(s.route, s.targetRole, s.intent, ...s.signals)

    if (campaignType === 'course_alert') {
      if (routeNeedle && s.route && s.route.toLowerCase().includes(routeNeedle)) {
        scoreBoost(reasons, 'Career route matches course audience', 28, score)
      }
      if (roleNeedle && s.targetRole && s.targetRole.toLowerCase().includes(roleNeedle)) {
        scoreBoost(reasons, 'Target role related to course', 22, score)
      }
      if (s.courseClicks > 0) {
        scoreBoost(reasons, `Has course engagement (${s.courseClicks} clicks)`, 18, score)
      }
      if (sourceTitle && includesAny(hay, sourceTitle.split(/\s+/).slice(0, 4))) {
        scoreBoost(reasons, 'Signals relate to course title keywords', 12, score)
      }
      if (s.route) scoreBoost(reasons, 'Has a saved/known career route', 10, score)
    } else if (campaignType === 'job_alert') {
      if (roleNeedle && s.targetRole && s.targetRole.toLowerCase().includes(roleNeedle)) {
        scoreBoost(reasons, 'CV/plan target role matches job focus', 30, score)
      }
      if (routeNeedle && s.route && s.route.toLowerCase().includes(routeNeedle)) {
        scoreBoost(reasons, 'Career Assistant route matches', 22, score)
      }
      if (locationNeedle) scoreBoost(reasons, 'Location filter set (verify manually)', 8, score)
      if (s.targetRole || s.route) scoreBoost(reasons, 'Has role/route profile signals', 12, score)
    } else if (campaignType === 'local_opportunity_alert') {
      if (includesAny(hay, localIntentWords) || includesAny(intentNeedle, localIntentWords)) {
        scoreBoost(reasons, 'Intent/signals suggest flexible or local work', 30, score)
      }
      if (locationNeedle) scoreBoost(reasons, 'Location audience set for opportunity', 15, score)
      if (s.intent) scoreBoost(reasons, `Career goal: ${s.intent}`, 10, score)
      if (!reasons.length) scoreBoost(reasons, 'Weak local-work signal — review carefully', 5, score)
    } else if (campaignType === 'plan_reminder') {
      if (s.planAgeDays != null && s.planAgeDays >= inactiveDays) {
        scoreBoost(
          reasons,
          `Saved plan inactive ~${s.planAgeDays} days (threshold ${inactiveDays})`,
          35,
          score
        )
      } else if (s.planAgeDays != null) {
        scoreBoost(reasons, `Plan age ${s.planAgeDays} days (below inactive threshold)`, 8, score)
      }
      if (s.route) scoreBoost(reasons, `Has plan route: ${s.route}`, 20, score)
      else scoreBoost(reasons, 'No strong plan signal found', 5, score)
    } else {
      if (s.route) scoreBoost(reasons, 'Has career route context', 20, score)
      if (s.courseClicks > 0) scoreBoost(reasons, 'Engaged with courses', 12, score)
      if (intentNeedle && includesAny(hay, [intentNeedle])) {
        scoreBoost(reasons, 'Matches campaign intent keywords', 15, score)
      }
      scoreBoost(reasons, 'Eligible for reactivation review', 10, score)
    }

    candidates.push({
      user_id: s.user.id,
      email,
      display_name: displayName(s.user),
      route: s.route,
      target_role: s.targetRole,
      location: s.location || locationNeedle || null,
      match_score: score.n,
      match_reasons: reasons,
      consent_status: consent,
      recommended_action: consent === 'allowed' && score.n >= 25 ? 'send' : 'do_not_send',
    })
  }

  candidates.sort((a, b) => {
    if (a.consent_status === 'allowed' && b.consent_status !== 'allowed') return -1
    if (b.consent_status === 'allowed' && a.consent_status !== 'allowed') return 1
    return b.match_score - a.match_score
  })

  const trimmed = candidates.slice(0, limit)
  const allowed = trimmed.filter((c) => c.consent_status === 'allowed')
  const noConsent = trimmed.filter((c) => c.consent_status === 'excluded_no_consent').length
  const unsub = trimmed.filter((c) => c.consent_status === 'excluded_unsubscribed').length

  const ai_summary = [
    `Campaign type: ${campaignType}.`,
    `Suggested ${trimmed.length} users from available signals (${allowed.length} consent-allowed).`,
    routeNeedle ? `Target route filter: ${rules.target_route}.` : 'No route filter.',
    roleNeedle ? `Target role filter: ${rules.target_role}.` : 'No role filter.',
    'Matching used Career Assistant/plan signals and course clicks where available.',
    'Site Brain: no fake promises; published courses preferred when recommending training; admin decides who receives email.',
  ].join(' ')

  const excluded_summary = [
    `${noConsent} excluded for missing consent/preferences.`,
    `${unsub} excluded as unsubscribed.`,
    `${trimmed.filter((c) => c.recommended_action === 'do_not_send' && c.consent_status === 'allowed').length} allowed but low match score — review before approve.`,
  ].join(' ')

  return {
    candidates: trimmed,
    ai_summary,
    excluded_summary,
    compliance_warnings,
    tracking_notes,
  }
}
