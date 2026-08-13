/**
 * Central role-query mapper for Jobs For You.
 * Converts plan / CV signals into job search queries — never course names as primary.
 */

import type {
  JobsForYouCvInput,
  JobsForYouPlanInput,
  JobsForYouSourceType,
} from '@/lib/jobs/buildJobsForYouQuery'

export type MappedJobQueries = {
  primaryQuery: string
  alternativeQueries: string[]
  sourceType: JobsForYouSourceType
  sourceLabel: string
  forbiddenTerms: string[]
  /** Keywords used for relevance scoring (not the Adzuna keyword) */
  supportingKeywords: string[]
}

type SectorId =
  | 'midwifery'
  | 'healthcare'
  | 'animation'
  | 'cleaning'
  | 'security'
  | 'warehouse'
  | 'driving'
  | 'construction'
  | 'teaching'
  | 'customer_service'
  | 'it'
  | 'generic'

type SectorProfile = {
  id: SectorId
  match: RegExp
  primaryQuery: string
  alternatives: string[]
  forbiddenTerms: string[]
}

const COURSE_NAME_RE =
  /\b(qualifi|diploma|certificate|nvq|btec|level\s*[1-7]|course|module|award|foundation\s*degree)\b/i

/** Course / training titles → job roles (never search the course name) */
const COURSE_TO_ROLES: Array<{ match: RegExp; primary: string; alts: string[] }> = [
  {
    match: /\b(midwifery|midwife|maternity)\b/i,
    primary: 'maternity support worker',
    alts: ['healthcare assistant', 'care assistant', 'NHS support worker', 'midwifery assistant'],
  },
  {
    match: /\b(care\s*certificate|qualifi.*care|diploma\s+in\s+care|health\s*and\s*social\s*care|adult\s*care)\b/i,
    primary: 'care assistant',
    alts: ['healthcare assistant', 'support worker', 'healthcare support worker'],
  },
  {
    match: /\b(sia|door\s*supervisor|security\s*guard)\b/i,
    primary: 'security guard',
    alts: ['door supervisor', 'event steward'],
  },
  {
    match: /\b(cscs|construction)\b/i,
    primary: 'construction labourer',
    alts: ['site operative', 'general labourer'],
  },
  {
    match: /\b(teaching\s*assistant|ta\b|safeguarding\s*children)\b/i,
    primary: 'teaching assistant',
    alts: ['learning support assistant'],
  },
  {
    match: /\b(customer\s*service|retail)\b/i,
    primary: 'customer service advisor',
    alts: ['customer service assistant', 'retail assistant'],
  },
  {
    match: /\b(animation|motion\s*design|digital\s*media|creative\s*media)\b/i,
    primary: 'junior animator',
    alts: ['motion designer', '3D animator', 'digital designer', 'creative designer'],
  },
]

const SECTORS: SectorProfile[] = [
  {
    id: 'midwifery',
    match: /\b(midwifery|midwife|maternity\s*support|maternity)\b/i,
    primaryQuery: 'maternity support worker',
    alternatives: [
      'healthcare assistant',
      'care assistant',
      'NHS support worker',
      'midwifery assistant',
      'healthcare support worker',
    ],
    forbiddenTerms: [
      'cleaner',
      'cleaning',
      'housekeeper',
      'site manager',
      'hgv',
      'commercial manager',
      'quantity surveyor',
      'forklift',
      'warehouse',
    ],
  },
  {
    id: 'healthcare',
    match: /\b(healthcare|health\s*care|care\s*assistant|support\s*worker|nursing|nhs|hca|social\s*care)\b/i,
    primaryQuery: 'healthcare assistant',
    alternatives: ['care assistant', 'support worker', 'healthcare support worker', 'NHS support worker'],
    forbiddenTerms: [
      'cleaner',
      'cleaning',
      'site manager',
      'hgv',
      'commercial manager',
      'quantity surveyor',
      'animator',
      'forklift',
    ],
  },
  {
    id: 'animation',
    match:
      /\b(animation|animator|motion\s*design|after\s*effects|cinema\s*4d|maya|blender|digital\s*media|creative\s*media|vfx|3d\s*anim|2d\s*anim|illustrator|premiere)\b/i,
    primaryQuery: 'junior animator',
    alternatives: ['motion designer', '3D animator', 'digital designer', 'creative designer'],
    forbiddenTerms: [
      'cleaner',
      'cleaning',
      'hgv',
      'site manager',
      'quantity surveyor',
      'commercial manager',
      'warehouse',
      'forklift',
      'door supervisor',
      'security guard',
    ],
  },
  {
    id: 'cleaning',
    match: /\b(clean(?:er|ing)|housekeep|domestic|janitor)\b/i,
    primaryQuery: 'cleaning operative',
    alternatives: ['cleaner', 'domestic cleaner', 'housekeeper'],
    forbiddenTerms: ['animator', 'midwifery', 'maternity', 'hgv', 'quantity surveyor', 'site manager'],
  },
  {
    id: 'security',
    match: /\b(security|sia|door\s*supervisor|steward|cctv)\b/i,
    primaryQuery: 'security guard',
    alternatives: ['door supervisor', 'event steward'],
    forbiddenTerms: ['cleaner', 'animator', 'hgv', 'quantity surveyor', 'midwifery'],
  },
  {
    id: 'warehouse',
    match: /\b(warehouse|forklift|picker|packer|logistics)\b/i,
    primaryQuery: 'warehouse operative',
    alternatives: ['picker packer', 'logistics operative'],
    forbiddenTerms: ['animator', 'midwifery', 'maternity', 'quantity surveyor'],
  },
  {
    id: 'driving',
    match: /\b(hgv|lgv|driver|delivery\s*driver|courier)\b/i,
    primaryQuery: 'delivery driver',
    alternatives: ['HGV driver', 'van driver'],
    forbiddenTerms: ['animator', 'midwifery', 'cleaner'],
  },
  {
    id: 'construction',
    match: /\b(construction|cscs|labourer|site\s*operative|quantity\s*surveyor|site\s*manager)\b/i,
    primaryQuery: 'construction labourer',
    alternatives: ['site operative', 'general labourer'],
    forbiddenTerms: ['animator', 'midwifery', 'maternity', 'cleaner'],
  },
  {
    id: 'teaching',
    match: /\b(teaching\s*assistant|learning\s*support|tutor|classroom)\b/i,
    primaryQuery: 'teaching assistant',
    alternatives: ['learning support assistant', 'tutor'],
    forbiddenTerms: ['cleaner', 'hgv', 'site manager', 'animator'],
  },
  {
    id: 'it',
    match: /\b(it\s*support|helpdesk|help\s*desk|software|developer|cyber|network)\b/i,
    primaryQuery: 'IT support',
    alternatives: ['service desk analyst', 'junior developer'],
    forbiddenTerms: ['cleaner', 'hgv', 'site manager', 'midwifery'],
  },
  {
    id: 'customer_service',
    match: /\b(customer\s*service|call\s*centre|call\s*center|contact\s*centre)\b/i,
    primaryQuery: 'customer service advisor',
    alternatives: ['customer service assistant', 'contact centre advisor'],
    forbiddenTerms: ['cleaner', 'hgv', 'site manager', 'quantity surveyor', 'animator'],
  },
]

const UNIVERSAL_FORBIDDEN_WHEN_NOT_GENERIC = [
  'quantity surveyor',
  'commercial manager',
  'site manager',
  'hgv technician',
  'hgv',
]

function sourceLabelFor(t: JobsForYouSourceType): string {
  switch (t) {
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

function isCourseLike(text: string): boolean {
  return COURSE_NAME_RE.test(text)
}

function mapCourseToRoles(text: string): { primary: string; alts: string[] } | null {
  for (const c of COURSE_TO_ROLES) {
    if (c.match.test(text)) return { primary: c.primary, alts: c.alts }
  }
  return null
}

function detectSector(blob: string): SectorProfile | null {
  for (const s of SECTORS) {
    if (s.match.test(blob)) return s
  }
  return null
}

function uniqueLower(items: string[], max = 10): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of items) {
    const t = String(raw || '')
      .trim()
      .replace(/\s+/g, ' ')
    if (!t || t.length < 3) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

function buildPlanBlob(plan: JobsForYouPlanInput): string {
  if (!plan) return ''
  return [
    plan.currentFocus,
    plan.currentTarget,
    plan.pathwayRoute,
    plan.route,
    plan.planTitle,
    ...(plan.immediateRoles || []),
    ...(plan.selectedJobTitles || []),
    ...(plan.recommendedJobs || []),
    plan.nextUpgrade,
  ]
    .filter(Boolean)
    .join(' ')
}

function buildCvBlob(cv: JobsForYouCvInput | null | undefined): string {
  if (!cv) return ''
  const bits: string[] = []
  if (cv.professionalTitle) bits.push(cv.professionalTitle)
  if (cv.targetRole) bits.push(cv.targetRole)
  if (cv.summary) bits.push(cv.summary)
  if (cv.skills?.length) bits.push(cv.skills.join(' '))
  for (const e of cv.experience || []) bits.push(String(e.jobTitle || e.title || ''))
  for (const ed of cv.education || []) {
    bits.push([ed.degree, ed.field, ed.school].filter(Boolean).join(' '))
  }
  for (const p of cv.projects || []) {
    bits.push([p.title, p.description].filter(Boolean).join(' '))
  }
  return bits.join(' ')
}

function planHasDirection(plan: JobsForYouPlanInput): boolean {
  if (!plan) return false
  return Boolean(
    plan.currentFocus?.trim() ||
      plan.currentTarget?.trim() ||
      plan.route?.trim() ||
      plan.planTitle?.trim() ||
      (plan.immediateRoles && plan.immediateRoles.length) ||
      (plan.selectedJobTitles && plan.selectedJobTitles.length) ||
      (plan.recommendedJobs && plan.recommendedJobs.length) ||
      plan.pathwayRoute?.trim()
  )
}

function cvHasContent(cv: JobsForYouCvInput | null | undefined): boolean {
  if (!cv) return false
  return Boolean(
    cv.professionalTitle?.trim() ||
      cv.targetRole?.trim() ||
      cv.summary?.trim() ||
      (cv.skills && cv.skills.some((s) => String(s || '').trim())) ||
      (cv.experience && cv.experience.some((e) => String(e?.jobTitle || e?.title || '').trim())) ||
      (cv.education && cv.education.some((e) => String(e?.degree || e?.field || '').trim())) ||
      (cv.projects && cv.projects.some((p) => String(p?.title || '').trim()))
  )
}

/**
 * Prefer a real job title; convert course-like strings to roles.
 */
function resolveTitleToJobQuery(raw: string): { primary: string; alts: string[] } | null {
  const text = String(raw || '').trim()
  if (!text || text.length < 3) return null

  if (isCourseLike(text)) {
    const mapped = mapCourseToRoles(text)
    if (mapped) return mapped
    // Unknown course — do not use as primary query
    return null
  }

  // Strip leading "Level X" noise if somehow present without diploma keyword
  const cleaned = text.replace(/^(qualifi|nvq|btec)\s+/i, '').trim()
  return { primary: cleaned, alts: [] }
}

/**
 * Map active plan and/or saved CV into searchable job queries + forbidden terms.
 */
export function mapPlanOrCvToJobQueries(source: {
  plan?: JobsForYouPlanInput
  cv?: JobsForYouCvInput | null
}): MappedJobQueries {
  const plan = source.plan ?? null
  const cv = source.cv ?? null
  const hasPlan = planHasDirection(plan)
  const hasCv = cvHasContent(cv)

  if (!hasPlan && !hasCv) {
    return {
      primaryQuery: '',
      alternativeQueries: [],
      sourceType: 'empty',
      sourceLabel: '',
      forbiddenTerms: [],
      supportingKeywords: [],
    }
  }

  if (hasPlan && plan) {
    const planBlob = buildPlanBlob(plan)
    const sector = detectSector(planBlob) || detectSector(mapCourseToRoles(planBlob)?.primary || '')

    // Collect candidate role titles from plan (skip course-only strings)
    const candidates: string[] = []
    const rawTitles = [
      plan.currentFocus,
      plan.currentTarget,
      ...(plan.immediateRoles || []),
      ...(plan.selectedJobTitles || []),
      ...(plan.recommendedJobs || []),
    ]
    for (const t of rawTitles) {
      const resolved = resolveTitleToJobQuery(String(t || ''))
      if (resolved) {
        candidates.push(resolved.primary)
        candidates.push(...resolved.alts)
      }
    }

    // Pathway / route may be "Midwifery" — expand via sector or course map
    const routeBits = [plan.pathwayRoute, plan.route, plan.planTitle].filter(Boolean).join(' ')
    if (routeBits) {
      const fromCourse = mapCourseToRoles(routeBits)
      if (fromCourse) {
        candidates.push(fromCourse.primary, ...fromCourse.alts)
      } else if (!isCourseLike(routeBits)) {
        const s = detectSector(routeBits)
        if (s) candidates.push(s.primaryQuery, ...s.alternatives)
      }
    }

    const profile = sector || (candidates.length ? detectSector(candidates.join(' ')) : null)

    let primaryQuery = ''
    let alternatives: string[] = []

    if (profile) {
      primaryQuery = profile.primaryQuery
      alternatives = [...profile.alternatives]
      // Prefer an immediate plan role if it is already a good job title
      for (const c of candidates) {
        if (!isCourseLike(c) && c.split(/\s+/).length >= 2 && profile.match.test(c)) {
          primaryQuery = c.toLowerCase()
          break
        }
      }
    } else if (candidates.length > 0) {
      primaryQuery = candidates[0].toLowerCase()
      alternatives = candidates.slice(1, 6).map((c) => c.toLowerCase())
    }

    // Hard Midwifery guard
    if (/midwif|maternity/i.test(planBlob) || profile?.id === 'midwifery') {
      primaryQuery = 'maternity support worker'
      alternatives = [
        'healthcare assistant',
        'care assistant',
        'NHS support worker',
        'midwifery assistant',
        'healthcare support worker',
      ]
    }

    const forbidden = uniqueLower([
      ...(profile?.forbiddenTerms || []),
      ...UNIVERSAL_FORBIDDEN_WHEN_NOT_GENERIC,
      'cleaner',
      'cleaning',
    ])

    // When plan is midwifery/healthcare, never allow cleaning in alternatives
    alternatives = alternatives.filter((a) => !/clean/i.test(a))

    const sourceType: JobsForYouSourceType = hasCv ? 'plan_and_cv' : 'plan_only'
    const supportingKeywords = uniqueLower([primaryQuery, ...alternatives], 16)

    return {
      primaryQuery,
      alternativeQueries: uniqueLower(alternatives, 8),
      sourceType,
      sourceLabel: sourceLabelFor(sourceType),
      forbiddenTerms: forbidden,
      supportingKeywords,
    }
  }

  // CV-only
  const cvBlob = buildCvBlob(cv)
  const sector = detectSector(cvBlob)

  // Explicit title / target role first (if not a course)
  const explicit = [cv?.professionalTitle, cv?.targetRole]
    .map((t) => resolveTitleToJobQuery(String(t || '')))
    .filter(Boolean) as Array<{ primary: string; alts: string[] }>

  if (explicit.length > 0 && !sector) {
    const ex = explicit[0]
    const sourceType: JobsForYouSourceType = 'cv_only'
    return {
      primaryQuery: ex.primary.toLowerCase(),
      alternativeQueries: uniqueLower(ex.alts, 6),
      sourceType,
      sourceLabel: sourceLabelFor(sourceType),
      forbiddenTerms: uniqueLower([...UNIVERSAL_FORBIDDEN_WHEN_NOT_GENERIC], 12),
      supportingKeywords: uniqueLower([ex.primary, ...ex.alts], 12),
    }
  }

  if (sector) {
    // Customer service only with strong signal
    if (sector.id === 'customer_service') {
      const strong = /\b(customer\s*service|call\s*centre|call\s*center|contact\s*centre)\b/i.test(cvBlob)
      if (!strong) {
        // fall through to other detection
      } else {
        const sourceType: JobsForYouSourceType = 'cv_only'
        return {
          primaryQuery: sector.primaryQuery,
          alternativeQueries: sector.alternatives,
          sourceType,
          sourceLabel: sourceLabelFor(sourceType),
          forbiddenTerms: sector.forbiddenTerms,
          supportingKeywords: uniqueLower([sector.primaryQuery, ...sector.alternatives], 12),
        }
      }
    } else {
      const sourceType: JobsForYouSourceType = 'cv_only'
      // Prefer experience title if it matches sector
      const expTitles = (cv?.experience || [])
        .map((e) => String(e.jobTitle || e.title || '').trim())
        .filter(Boolean)
      let primary = sector.primaryQuery
      for (const t of [...expTitles].reverse()) {
        const resolved = resolveTitleToJobQuery(t)
        if (resolved && sector.match.test(resolved.primary)) {
          primary = resolved.primary.toLowerCase()
          break
        }
      }
      return {
        primaryQuery: primary,
        alternativeQueries: sector.alternatives,
        sourceType,
        sourceLabel: sourceLabelFor(sourceType),
        forbiddenTerms: sector.forbiddenTerms,
        supportingKeywords: uniqueLower([primary, ...sector.alternatives], 12),
      }
    }
  }

  // Education / skills as last resort — map courses to roles
  const eduBlob = (cv?.education || [])
    .map((e) => [e.degree, e.field].filter(Boolean).join(' '))
    .join(' ')
  const fromEdu = mapCourseToRoles(eduBlob) || mapCourseToRoles(cvBlob)
  if (fromEdu) {
    const sourceType: JobsForYouSourceType = 'cv_only'
    const s = detectSector(fromEdu.primary)
    return {
      primaryQuery: fromEdu.primary,
      alternativeQueries: fromEdu.alts,
      sourceType,
      sourceLabel: sourceLabelFor(sourceType),
      forbiddenTerms: s?.forbiddenTerms || uniqueLower(UNIVERSAL_FORBIDDEN_WHEN_NOT_GENERIC, 12),
      supportingKeywords: uniqueLower([fromEdu.primary, ...fromEdu.alts], 12),
    }
  }

  // Meaningful non-transferable skill as query
  const skill = (cv?.skills || [])
    .map((s) => String(s || '').trim())
    .find((s) => s.length >= 4 && !isCourseLike(s) && !/communication|teamwork|reliable/i.test(s))
  if (skill) {
    const mapped = mapCourseToRoles(skill)
    const s = detectSector(skill)
    const primary = mapped?.primary || s?.primaryQuery || skill.toLowerCase()
    const sourceType: JobsForYouSourceType = 'cv_only'
    return {
      primaryQuery: primary,
      alternativeQueries: mapped?.alts || s?.alternatives || [],
      sourceType,
      sourceLabel: sourceLabelFor(sourceType),
      forbiddenTerms: s?.forbiddenTerms || uniqueLower(UNIVERSAL_FORBIDDEN_WHEN_NOT_GENERIC, 12),
      supportingKeywords: uniqueLower([primary], 8),
    }
  }

  return {
    primaryQuery: '',
    alternativeQueries: [],
    sourceType: 'empty',
    sourceLabel: '',
    forbiddenTerms: [],
    supportingKeywords: [],
  }
}

/**
 * Filter live Recommended Jobs — never mix with saved/applied.
 * Drops 0% matches and jobs whose titles hit forbidden sector terms.
 */
export function filterJobsByForbiddenAndScore<
  T extends { title?: string; description?: string; matchPercentage?: number },
>(jobs: T[], forbiddenTerms: string[], minScore = 1): T[] {
  const forbidden = forbiddenTerms.map((t) => t.toLowerCase()).filter(Boolean)

  return jobs.filter((job) => {
    const score = job.matchPercentage ?? 0
    if (score < minScore) return false

    const title = (job.title || '').toLowerCase()
    const hasForbidden = forbidden.some((term) => term && title.includes(term))

    // Always hide clearly wrong-sector titles from Recommended Jobs
    if (hasForbidden) return false

    return true
  })
}

/** Client-side recommendation cache key (user + plan + cv timestamps). */
export function jobsForYouCacheKey(parts: {
  userId: string
  planId?: string | null
  cvId?: string | null
  planUpdatedAt?: string | null
  cvUpdatedAt?: string | null
}): string {
  return [
    'jfy',
    parts.userId,
    parts.planId || 'no-plan',
    parts.cvId || 'no-cv',
    parts.planUpdatedAt || '',
    parts.cvUpdatedAt || '',
  ].join('::')
}

export function clearJobsForYouLocalCache(userId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith('jobaz_jfy_rec_')) keys.push(k)
    }
    for (const k of keys) {
      if (!userId || k.includes(userId)) sessionStorage.removeItem(k)
    }
  } catch {
    // ignore
  }
}
