/**
 * Build Jobs For You search query from active Career Assistant plan + saved CV.
 *
 * Rules:
 * - Active plan controls primary search direction (never old CV sector).
 * - CV-only uses sector-aware inference (Animation ≠ Customer Service).
 * - Never fall back to "customer service" unless CV strongly indicates it.
 */

import { extractKeywordsFromText } from '@/lib/job-matching'
import type { JobAZPlan } from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { mapPlanOrCvToJobQueries } from '@/lib/jobs/mapPlanOrCvToJobQueries'

export type JobsForYouCvInput = {
  summary?: string
  skills?: string[]
  experience?: Array<{ jobTitle?: string; title?: string }>
  education?: Array<{ degree?: string; field?: string; school?: string }>
  projects?: Array<{ title?: string; description?: string }>
  professionalTitle?: string
  targetRole?: string
}

export type JobsForYouPlanInput = {
  planTitle?: string
  route?: string
  currentTarget?: string
  nextUpgrade?: string
  recommendedJobs?: string[]
  cvFocusKeywords?: string[]
  currentFocus?: string
  immediateRoles?: string[]
  selectedJobTitles?: string[]
  pathwayRoute?: string
} | null

export type JobsForYouSourceType = 'plan_and_cv' | 'plan_only' | 'cv_only' | 'empty'

export type JobsForYouQueryResult = {
  query: string
  keywords: string[]
  sourceType: JobsForYouSourceType
  matchLabel: string
  hasPlan: boolean
  hasCv: boolean
  planPrimaryTerms: string[]
  cvSecondaryTerms: string[]
  alternativeQueries: string[]
  forbiddenTerms: string[]
}

const TRANSFERABLE_CV_SKILLS = new Set([
  'communication',
  'teamwork',
  'reliable',
  'reliability',
  'flexible',
  'flexibility',
  'availability',
  'right to work',
  'organisation',
  'organization',
  'time management',
  'problem solving',
  'empathy',
  'listening',
  'creativity',
  'attention to detail',
])

const TYPO_MAP: Record<string, string> = {
  cleaneing: 'cleaning',
  cleanning: 'cleaning',
  cleaninig: 'cleaning',
  cleanering: 'cleaning',
  custmer: 'customer',
  customre: 'customer',
  securty: 'security',
  secuirty: 'security',
  warehous: 'warehouse',
  assitant: 'assistant',
  assistent: 'assistant',
  recption: 'reception',
  recepton: 'reception',
  midwifry: 'midwifery',
  midwivery: 'midwifery',
  heathcare: 'healthcare',
  healtcare: 'healthcare',
  animaton: 'animation',
  animater: 'animator',
}

const JUNK_TOKENS = new Set([
  'undefined',
  'null',
  'n/a',
  'na',
  'none',
  'test',
  'todo',
  'placeholder',
  'example',
])

const SECTOR_LOCK_TERMS: Array<{ id: string; terms: RegExp }> = [
  { id: 'cleaning', terms: /\b(clean(?:er|ing|eing)?|housekeep|domestic|janitor)\b/i },
  { id: 'security', terms: /\b(security|sia|steward|door\s*supervisor|cctv)\b/i },
  { id: 'warehouse', terms: /\b(warehouse|forklift|picker|packer)\b/i },
  { id: 'driving', terms: /\b(driver|delivery|courier|hgv|lgv)\b/i },
  { id: 'retail', terms: /\b(retail|shop\s*assistant|cashier)\b/i },
  { id: 'hospitality', terms: /\b(hospitality|barista|waiter|waitress|kitchen)\b/i },
  {
    id: 'healthcare',
    terms: /\b(midwifery|midwife|maternity|healthcare|health\s*care|care\s*assistant|support\s*worker|nursing|nhs)\b/i,
  },
  { id: 'teaching', terms: /\b(teaching|tutor|classroom|teaching\s*assistant)\b/i },
  { id: 'construction', terms: /\b(construction|cscs|labourer|site\s*operative)\b/i },
  {
    id: 'animation',
    terms: /\b(animation|animator|motion\s*design|after\s*effects|cinema\s*4d|maya|blender|digital\s*media|creative\s*media|vfx|2d\s*animation|3d\s*animation)\b/i,
  },
  {
    id: 'customer_service',
    terms: /\b(customer\s*service|call\s*centre|call\s*center|contact\s*centre|help\s*desk|client\s*service)\b/i,
  },
]

/** CV sector → realistic UK job search titles (primary first) */
const CV_SECTOR_QUERIES: Array<{
  id: string
  match: RegExp
  primary: string
  alternates: string[]
}> = [
  {
    id: 'animation',
    match:
      /\b(animation|animator|motion\s*design(?:er)?|after\s*effects|cinema\s*4d|maya|blender|digital\s*media|creative\s*media|vfx|illustrator|premiere|toon\s*boom|spine|unity\s*art)\b/i,
    primary: 'Junior Animator',
    alternates: ['Motion Designer', 'Digital Designer', 'Creative Assistant', 'Animation'],
  },
  {
    id: 'midwifery',
    match: /\b(midwifery|midwife|maternity\s*support|maternity)\b/i,
    primary: 'Maternity Support Worker',
    alternates: ['Healthcare Support Worker', 'Healthcare Assistant', 'Care Assistant'],
  },
  {
    id: 'healthcare',
    match: /\b(healthcare|health\s*care|care\s*assistant|support\s*worker|nursing|nhs|hca)\b/i,
    primary: 'Healthcare Assistant',
    alternates: ['Care Assistant', 'Support Worker'],
  },
  {
    id: 'cleaning',
    match: /\b(clean(?:er|ing)|housekeep|domestic|janitor)\b/i,
    primary: 'Cleaning Operative',
    alternates: ['Cleaner', 'Domestic Cleaner'],
  },
  {
    id: 'security',
    match: /\b(security|sia|door\s*supervisor|steward|cctv)\b/i,
    primary: 'Security Guard',
    alternates: ['Door Supervisor', 'Event Steward'],
  },
  {
    id: 'warehouse',
    match: /\b(warehouse|forklift|picker|packer|logistics)\b/i,
    primary: 'Warehouse Operative',
    alternates: ['Picker Packer', 'Logistics Operative'],
  },
  {
    id: 'teaching',
    match: /\b(teaching\s*assistant|learning\s*support|tutor|classroom)\b/i,
    primary: 'Teaching Assistant',
    alternates: ['Learning Support Assistant', 'Tutor'],
  },
  {
    id: 'it',
    match: /\b(it\s*support|helpdesk|help\s*desk|software|developer|cyber|network)\b/i,
    primary: 'IT Support',
    alternates: ['Service Desk Analyst', 'Junior Developer'],
  },
  {
    id: 'customer_service',
    match: /\b(customer\s*service|call\s*centre|call\s*center|contact\s*centre|retail\s*assistant)\b/i,
    primary: 'Customer Service Advisor',
    alternates: ['Customer Service Assistant', 'Contact Centre Advisor'],
  },
]

function detectSectors(text: string): Set<string> {
  const found = new Set<string>()
  for (const s of SECTOR_LOCK_TERMS) {
    if (s.terms.test(text)) found.add(s.id)
  }
  return found
}

function normalizeToken(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^\w\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned || cleaned.length < 2) return ''
  if (JUNK_TOKENS.has(cleaned)) return ''
  const compact = cleaned.replace(/\s+/g, '')
  if (TYPO_MAP[compact]) return TYPO_MAP[compact]
  return cleaned
    .split(/\s+/)
    .map((p) => TYPO_MAP[p] || p)
    .join(' ')
    .trim()
}

function normalizePhrase(phrase: string): string {
  if (!phrase?.trim()) return ''
  return phrase
    .split(/[\s,/|]+/)
    .map((w) => normalizeToken(w))
    .filter(Boolean)
    .join(' ')
    .trim()
}

function uniquePhrases(items: Array<string | undefined | null>, max = 8): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of items) {
    const n = normalizePhrase(String(item || ''))
    if (!n || n.length < 3) continue
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(n)
    if (out.length >= max) break
  }
  return out
}

function buildCvBlob(cv: JobsForYouCvInput): string {
  const bits: string[] = []
  if (cv.professionalTitle) bits.push(cv.professionalTitle)
  if (cv.targetRole) bits.push(cv.targetRole)
  if (cv.summary) bits.push(cv.summary)
  if (cv.skills?.length) bits.push(cv.skills.join(' '))
  for (const e of cv.experience || []) {
    bits.push(String(e.jobTitle || e.title || ''))
  }
  for (const ed of cv.education || []) {
    bits.push([ed.degree, ed.field, ed.school].filter(Boolean).join(' '))
  }
  for (const p of cv.projects || []) {
    bits.push([p.title, p.description].filter(Boolean).join(' '))
  }
  return bits.join(' ')
}

function cvHasContent(cv: JobsForYouCvInput | null | undefined): boolean {
  if (!cv) return false
  if (cv.professionalTitle?.trim() || cv.targetRole?.trim()) return true
  if (cv.summary?.trim()) return true
  if (Array.isArray(cv.skills) && cv.skills.some((s) => String(s || '').trim())) return true
  if (
    Array.isArray(cv.experience) &&
    cv.experience.some((e) => String(e?.jobTitle || e?.title || '').trim())
  ) {
    return true
  }
  if (
    Array.isArray(cv.education) &&
    cv.education.some((e) => String(e?.degree || e?.field || '').trim())
  ) {
    return true
  }
  if (Array.isArray(cv.projects) && cv.projects.some((p) => String(p?.title || '').trim())) {
    return true
  }
  return false
}

function planHasDirection(plan: JobsForYouPlanInput): boolean {
  if (!plan) return false
  return (
    uniquePhrases(
      [
        plan.currentFocus,
        plan.currentTarget,
        ...(plan.immediateRoles || []),
        ...(plan.selectedJobTitles || []),
        ...(plan.recommendedJobs || []),
        plan.pathwayRoute,
        plan.route,
        plan.planTitle,
      ],
      1
    ).length > 0
  )
}

/**
 * Lightweight plan shape for Jobs For You (from server JobAZPlan).
 */
export function fromJobAZPlanForJobs(
  plan: JobAZPlan,
  planId: string | null = null
): {
  planId: string | null
  planTitle: string
  route: string
  currentTarget: string
  nextUpgrade: string
  recommendedJobs: string[]
  cvFocusKeywords: string[]
  pathLabel: string
  targetRole: string
} {
  const ca = plan.ca_selection
  const currentTarget =
    ca?.current_focus_role ||
    ca?.immediate_role ||
    plan.route_summary.current_target_role ||
    plan.work_now?.[0]?.title ||
    ''
  const planTitle = plan.route_summary.route_title || ca?.route_title || 'Your career plan'
  const recommendedJobs = [
    ...(plan.work_now || []).map((w) => w.title),
    ...(ca?.roles || []).map((r) => r.title),
    ...(ca?.selected_roles || []).map((r) => r.title),
  ].filter(Boolean)

  return {
    planId,
    planTitle,
    route: planTitle,
    currentTarget,
    nextUpgrade: plan.route_summary.next_upgrade_role || ca?.future_route || '',
    recommendedJobs,
    cvFocusKeywords: [],
    pathLabel: planTitle,
    targetRole: currentTarget || planTitle,
  }
}

export function toJobsForYouPlanInput(
  plan: {
    planTitle?: string
    route?: string
    currentTarget?: string
    nextUpgrade?: string
    recommendedJobs?: string[]
    cvFocusKeywords?: string[]
    pathLabel?: string
    targetRole?: string
  } | null,
  jobazPlan?: JobAZPlan | null
): JobsForYouPlanInput {
  if (!plan && !jobazPlan) return null

  const ca = jobazPlan?.ca_selection
  const immediateFromCa = [
    ca?.immediate_role,
    ca?.current_focus_role,
    ...(ca?.roles || []).map((r) => r.title),
    ...(ca?.selected_roles || []).map((r) => r.title),
  ].filter(Boolean) as string[]

  const selectedTitles = [
    ...(jobazPlan?.work_now || []).map((w) => w.title),
    ...(plan?.recommendedJobs || []),
  ].filter(Boolean)

  // Future routes are secondary only
  const futureOnly =
    !immediateFromCa.length &&
    !selectedTitles.length &&
    !plan?.currentTarget &&
    !jobazPlan?.route_summary?.current_target_role
      ? [ca?.future_route, ...(ca?.future_routes || []).map((r) => r.title)].filter(Boolean)
      : []

  return {
    planTitle: plan?.planTitle || jobazPlan?.route_summary?.route_title || ca?.route_title,
    route: plan?.route || jobazPlan?.route_summary?.route_title || ca?.route_title,
    currentTarget:
      plan?.currentTarget ||
      jobazPlan?.route_summary?.current_target_role ||
      ca?.immediate_role ||
      (futureOnly[0] as string | undefined),
    nextUpgrade: plan?.nextUpgrade || jobazPlan?.route_summary?.next_upgrade_role || undefined,
    recommendedJobs: selectedTitles.length ? selectedTitles : (futureOnly as string[]),
    cvFocusKeywords: plan?.cvFocusKeywords || [],
    currentFocus:
      ca?.current_focus_role ||
      ca?.immediate_role ||
      jobazPlan?.route_summary?.current_target_role ||
      plan?.currentTarget ||
      plan?.targetRole,
    immediateRoles: immediateFromCa,
    selectedJobTitles: selectedTitles,
    pathwayRoute: ca?.specialism || ca?.field || plan?.pathLabel || plan?.route,
  }
}

function expandPlanRouteTerms(planBlob: string, primary: string[]): string[] {
  const blob = planBlob.toLowerCase()
  const extras: string[] = []

  if (/midwifery|midwife|maternity/.test(blob) || primary.some((p) => /midwif|maternity/i.test(p))) {
    extras.push(
      'Maternity Support Worker',
      'Healthcare Support Worker',
      'Healthcare Assistant',
      'Care Assistant',
      'Support Worker',
      'Midwifery'
    )
  } else if (/healthcare|health care|nursing|nhs|care assistant/.test(blob)) {
    extras.push('Healthcare Assistant', 'Care Assistant', 'Support Worker', 'Healthcare Support')
  } else if (/animation|animator|motion|digital media|creative media/.test(blob)) {
    extras.push('Junior Animator', 'Motion Designer', 'Digital Designer', 'Creative Assistant')
  } else if (/security|sia|steward/.test(blob)) {
    extras.push('Security Guard', 'Door Supervisor', 'Event Steward')
  } else if (/teaching|tutor|education/.test(blob)) {
    extras.push('Teaching Assistant', 'Learning Support Assistant')
  }

  return uniquePhrases([...primary, ...extras], 10)
}

function pickPrimaryQuery(terms: string[]): string {
  if (terms.length === 0) return ''
  // Prefer realistic multi-word job titles
  const multi = terms.find((t) => t.split(/\s+/).length >= 2)
  return multi || terms[0]
}

function transferableFromCv(cv: JobsForYouCvInput): string[] {
  const skills = (cv.skills || [])
    .map((s) => normalizePhrase(String(s || '')))
    .filter((s) => s && TRANSFERABLE_CV_SKILLS.has(s))

  const fromSummary = extractKeywordsFromText(cv.summary || '')
    .map((k) => normalizeToken(k))
    .filter((k) => k && TRANSFERABLE_CV_SKILLS.has(k))

  return uniquePhrases([...skills, ...fromSummary], 6)
}

function stripConflictingCvTerms(cvTerms: string[], planSectors: Set<string>): string[] {
  if (planSectors.size === 0) return cvTerms
  return cvTerms.filter((term) => {
    const termSectors = detectSectors(term)
    if (termSectors.size === 0) return true
    return [...termSectors].every((s) => planSectors.has(s))
  })
}

/**
 * Infer a concrete UK job query from CV content — never generic CS by default.
 */
export function inferCvPrimaryQuery(cv: JobsForYouCvInput): {
  query: string
  keywords: string[]
} {
  const blob = buildCvBlob(cv)
  const blobNorm = normalizePhrase(blob)

  // 1) Explicit professional / target title
  const explicit = uniquePhrases([cv.professionalTitle, cv.targetRole], 2)
  if (explicit.length > 0) {
    const q = improveKnownTitle(explicit[0])
    return {
      query: q,
      keywords: uniquePhrases([q, ...explicit, ...extractKeywordsFromText(blobNorm)], 16),
    }
  }

  // 2) Experience titles (most recent last, then first)
  const titles = (cv.experience || [])
    .map((e) => normalizePhrase(String(e.jobTitle || e.title || '')))
    .filter(Boolean)
  if (titles.length > 0) {
    const latest = improveKnownTitle(titles[titles.length - 1] || titles[0])
    // If title is junk/typo-only sector word, expand via sector profile
    const sectorHit = CV_SECTOR_QUERIES.find((s) => s.match.test(latest) || s.match.test(blob))
    if (sectorHit && /^[\w\s]+$/i.test(latest) && latest.split(/\s+/).length <= 2) {
      return {
        query: sectorHit.primary,
        keywords: uniquePhrases([sectorHit.primary, ...sectorHit.alternates, latest], 16),
      }
    }
    return {
      query: latest,
      keywords: uniquePhrases([latest, ...titles, ...extractKeywordsFromText(blobNorm)], 16),
    }
  }

  // 3) Sector profile from full CV blob (summary + skills + education + projects)
  for (const sector of CV_SECTOR_QUERIES) {
    if (sector.match.test(blob)) {
      // Customer service only if strong signal (avoid weak/generic)
      if (sector.id === 'customer_service') {
        const strong =
          (sector.match.exec(blob) || []).length > 0 &&
          /\b(customer\s*service|call\s*centre|call\s*center|contact\s*centre)\b/i.test(blob)
        if (!strong) continue
      }
      return {
        query: sector.primary,
        keywords: uniquePhrases([sector.primary, ...sector.alternates], 16),
      }
    }
  }

  // 4) Meaningful skill phrases (not random summary stopwords)
  const skillPhrases = (cv.skills || [])
    .map((s) => normalizePhrase(String(s || '')))
    .filter((s) => s.length >= 4 && !TRANSFERABLE_CV_SKILLS.has(s))
  if (skillPhrases.length > 0) {
    const q = improveKnownTitle(skillPhrases[0])
    return {
      query: q,
      keywords: uniquePhrases([q, ...skillPhrases.slice(0, 5)], 16),
    }
  }

  // 5) Education field
  const edu = (cv.education || [])
    .map((e) => normalizePhrase([e.field, e.degree].filter(Boolean).join(' ')))
    .filter(Boolean)
  if (edu.length > 0) {
    for (const sector of CV_SECTOR_QUERIES) {
      if (sector.match.test(edu.join(' '))) {
        return {
          query: sector.primary,
          keywords: uniquePhrases([sector.primary, ...sector.alternates, ...edu], 16),
        }
      }
    }
    return {
      query: improveKnownTitle(edu[0]),
      keywords: uniquePhrases(edu, 12),
    }
  }

  // No useful signal — empty (UI empty state), NOT customer service
  return { query: '', keywords: [] }
}

function improveKnownTitle(raw: string): string {
  const normalized = normalizePhrase(raw)
  if (!normalized) return ''
  if (/^cleaning$/i.test(normalized) || /^cleaner$/i.test(normalized)) return 'Cleaning Operative'
  if (/^warehouse$/i.test(normalized)) return 'Warehouse Operative'
  if (/^security$/i.test(normalized)) return 'Security Guard'
  if (/^care$/i.test(normalized)) return 'Care Assistant'
  if (/^animation$/i.test(normalized) || /^animator$/i.test(normalized)) return 'Junior Animator'
  if (/^customer\s*service$/i.test(normalized)) return 'Customer Service Advisor'
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase())
}

function matchLabelFor(sourceType: JobsForYouSourceType): string {
  switch (sourceType) {
    case 'plan_and_cv':
      return 'Matched from your plan and CV'
    case 'plan_only':
      return 'Matched from your career plan'
    case 'cv_only':
      return 'Matched from your saved CV'
    default:
      return ''
  }
}

/**
 * Build the final Jobs For You search query + match keywords.
 * Delegates to mapPlanOrCvToJobQueries (course→role, forbidden terms).
 */
export function buildJobsForYouQuery(
  cv: JobsForYouCvInput | null | undefined,
  plan: JobsForYouPlanInput
): JobsForYouQueryResult {
  const mapped = mapPlanOrCvToJobQueries({ plan, cv })
  const hasCv = cvHasContent(cv)
  const hasPlan = planHasDirection(plan)

  return {
    query: mapped.primaryQuery,
    keywords: mapped.supportingKeywords,
    sourceType: mapped.sourceType,
    matchLabel: mapped.sourceLabel,
    hasPlan,
    hasCv,
    planPrimaryTerms: hasPlan ? [mapped.primaryQuery, ...mapped.alternativeQueries] : [],
    cvSecondaryTerms: hasPlan ? [] : mapped.supportingKeywords,
    alternativeQueries: mapped.alternativeQueries,
    forbiddenTerms: mapped.forbiddenTerms,
  }
}
