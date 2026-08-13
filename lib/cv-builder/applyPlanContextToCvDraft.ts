/**
 * Apply My Plan / Career Assistant route context to a CV draft.
 * Single source of truth for "Tailor CV for this plan".
 *
 * When options.replaceSkills === true (default on tailor):
 * - Fully replaces the skills array (no append / merge of old role skills)
 * - Keeps only explicitly allowed transferable skills from the previous CV
 */

export type PlanTailorContext = {
  targetRole: string
  routeTitle?: string | null
  nextUpgrade?: string | null
  pathLabel?: string | null
  futureRoute?: string | null
  /** Curated skill phrases only — never raw keyword tokens from course titles. */
  suggestedSkills?: string[]
  cvFocusKeywords?: string[]
}

export type ApplyPlanContextOptions = {
  /** When true (default), replace skills entirely with route-specific set. */
  replaceSkills?: boolean
  /** Keep allow-listed transferable skills from the previous CV. Default true. */
  keepTransferableSkills?: boolean
  /** Dev-only console debug of previous → replacement → final skills. */
  debug?: boolean
}

export type CvDraftLike = {
  personalInfo: {
    fullName: string
    email: string
    phone?: string
    location?: string
    linkedin?: string
    website?: string
  }
  summary: string
  experience: unknown[]
  education: unknown[]
  skills: string[]
  projects?: unknown[]
  languages?: string[]
  certifications?: unknown[]
  publications?: unknown[]
}

type RoleFamily =
  | 'midwifery_healthcare'
  | 'nursing_care'
  | 'security'
  | 'education'
  | 'admin'
  | 'general'

/** Only these previous skills may survive a replaceSkills tailor. */
const TRANSFERABLE_ALLOWLIST = [
  'communication',
  'reliability',
  'teamwork',
  'time management',
  'customer service',
  'attention to detail',
  'empathy',
  'organisation',
  'organization',
]

/** Route-specific skills to drop when leaving that identity. */
const STALE_SECTOR_SKILL_PATTERNS: RegExp[] = [
  /\bclean(ing|er|liness)?\b/,
  /\bhousekeep/,
  /\bsanitation\b/,
  /\bwaste\b/,
  /\bmop(ping)?\b/,
  /\bvaccum|\bvacuum\b/,
  /\bjanitor/,
  /\bdomestic\b/,
  /\bdisinfect/,
  /\bcleaning supplies\b/,
  /\bcleaning schedules?\b/,
  /\brecycl/,
  /\bhygiene cleaning\b/,
  /\bbuff(ing|er)?\b/,
  /\bpolishing\b/,
]

/** Tokens that look like course/title fragments, not CV skills. */
const NON_SKILL_TOKENS = new Set([
  'level',
  'diploma',
  'certificate',
  'qualifi',
  'nvq',
  'rqf',
  'btec',
  'course',
  'training',
  'module',
  'award',
  'pathway',
  'route',
  'plan',
  'uk',
  'nhs',
  'and',
  'the',
  'for',
  'with',
  'care',
  'midwifery',
  'nursing',
  'security',
  'care certificate',
])

export const CV_PLAN_TAILORED_AT_KEY = 'jobaz_cv_plan_tailored_at_v1'
export const CV_PLAN_TAILORED_SKILLS_KEY = 'jobaz_cv_plan_tailored_skills_v1'

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function detectRoleFamily(role: string, route?: string | null): RoleFamily {
  const blob = `${role} ${route || ''}`.toLowerCase()
  if (/midwif|maternity|antenatal|obstetric/.test(blob)) return 'midwifery_healthcare'
  if (
    /nurs|healthcare|health care|care assistant|support worker|hca|social care|care certificate|qualifi.*care/.test(
      blob
    )
  ) {
    return 'nursing_care'
  }
  if (/security|sia|door supervisor|steward|cctv/.test(blob)) return 'security'
  if (/teach|tutor|education|ta\b|teaching assistant|learning support/.test(blob)) return 'education'
  if (/admin|office|receptionist|data entry|coordinator/.test(blob)) return 'admin'
  return 'general'
}

function familySkills(family: RoleFamily): string[] {
  const base: Record<RoleFamily, string[]> = {
    midwifery_healthcare: [
      'Communication',
      'Empathy',
      'Confidentiality',
      'Safeguarding awareness',
      'Patient care awareness',
      'Record keeping',
      'Teamwork',
      'NHS values awareness',
      'Maternity care interest',
      'Reliability',
    ],
    nursing_care: [
      'Communication',
      'Compassion',
      'Safeguarding awareness',
      'Personal care support',
      'Record keeping',
      'Teamwork',
      'Confidentiality',
      'Infection control awareness',
      'Patient dignity',
      'Reliability',
    ],
    security: [
      'Customer service',
      'Conflict awareness',
      'Observation',
      'Reliability',
      'Teamwork',
      'Communication',
      'Right to work awareness',
      'Crowd awareness',
      'Report writing',
    ],
    education: [
      'Communication',
      'Safeguarding awareness',
      'Supporting learning',
      'Patience',
      'Organisation',
      'Teamwork',
      'Behaviour support awareness',
      'Record keeping',
    ],
    admin: [
      'Organisation',
      'Communication',
      'Microsoft Office',
      'Data entry',
      'Customer service',
      'Attention to detail',
      'Time management',
      'Email and diary management',
    ],
    general: [
      'Communication',
      'Teamwork',
      'Reliability',
      'Time management',
      'Problem solving',
      'Customer service',
      'Organisation',
      'Willingness to learn',
    ],
  }
  return base[family]
}

/** Coerce skills from array or comma-separated string. */
export function normalizeSkillsInput(skills: unknown): string[] {
  if (Array.isArray(skills)) {
    return skills
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
  }
  if (typeof skills === 'string' && skills.trim()) {
    return skills
      .split(/[,;|•·\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function isStaleSectorSkill(skill: string): boolean {
  const n = norm(skill)
  return STALE_SECTOR_SKILL_PATTERNS.some((re) => re.test(n))
}

function isJunkSkillToken(skill: string): boolean {
  const n = norm(skill)
  if (!n || n.length < 3) return true
  if (NON_SKILL_TOKENS.has(n)) return true
  if (!/\s/.test(n) && /^(level|diploma|certificate|qualifi|nvq)\d*$/i.test(n)) return true
  return false
}

function isTransferableAllowed(skill: string): boolean {
  const n = norm(skill)
  if (isStaleSectorSkill(n) || isJunkSkillToken(n)) return false
  return TRANSFERABLE_ALLOWLIST.some((t) => n === t || n.includes(t))
}

/**
 * Only keep curated multi-word / known skill phrases from plan extras.
 * Never import raw keyword tokens from route/course titles.
 */
function sanitizePlanSkillExtras(extras: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of extras) {
    const skill = raw.trim()
    if (!skill || isJunkSkillToken(skill) || isStaleSectorSkill(skill)) continue
    const words = skill.split(/\s+/).filter(Boolean)
    if (words.length === 1 && !isTransferableAllowed(skill) && skill.length < 12) continue
    const key = norm(skill)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(skill)
  }
  return out.slice(0, 4)
}

function buildReplacedSkills(
  family: RoleFamily,
  existing: string[],
  planExtras: string[],
  keepTransferable: boolean
): { previousSkills: string[]; replacementSkills: string[]; finalSkills: string[] } {
  const previousSkills = normalizeSkillsInput(existing)
  const replacementSkills = familySkills(family)
  const curatedExtras = sanitizePlanSkillExtras(planExtras)
  const transferable = keepTransferable
    ? previousSkills.filter(isTransferableAllowed)
    : []

  const merged: string[] = []
  const seen = new Set<string>()

  for (const skill of [...replacementSkills, ...curatedExtras, ...transferable]) {
    const key = norm(skill)
    if (!key || seen.has(key) || isStaleSectorSkill(skill) || isJunkSkillToken(skill)) continue
    seen.add(key)
    merged.push(skill)
  }

  return {
    previousSkills,
    replacementSkills,
    finalSkills: merged.slice(0, 12),
  }
}

function buildSummary(ctx: PlanTailorContext, family: RoleFamily): string {
  const role = (ctx.targetRole || 'UK role').trim()
  const route = (ctx.routeTitle || ctx.pathLabel || '').trim()
  const training = (ctx.nextUpgrade || '').trim()
  const future = (ctx.futureRoute || '').trim()

  if (family === 'midwifery_healthcare') {
    const trainingLine = training
      ? ` I am currently building towards this pathway through training such as ${training}.`
      : ' I am building foundational care knowledge and seeking entry-level healthcare support experience.'
    const futureLine = future
      ? ` Longer term, I am working toward a ${future} pathway.`
      : ' Longer term, I aim to progress along the Midwifery pathway with the right qualifications and experience.'

    return (
      `Motivated candidate focused on entering healthcare support and building toward a Midwifery pathway in the UK. ` +
      `I bring strong communication, empathy, and reliability from previous work, and I am keen to apply these strengths in maternity and patient-care settings.` +
      trainingLine +
      ` I do not claim clinical registration or midwife status; I am seeking supervised, entry-level opportunities that develop care, safeguarding awareness, and NHS values.` +
      futureLine
    )
  }

  if (family === 'nursing_care') {
    const trainingLine = training
      ? ` I am preparing through ${training} and related care training.`
      : ' I am developing care skills and looking for entry-level healthcare support roles.'
    return (
      `Reliable and compassionate candidate preparing for ${role} and healthcare support roles in the UK. ` +
      `I offer strong communication, teamwork, and a commitment to dignity, confidentiality, and safeguarding awareness.` +
      trainingLine +
      ` I am seeking entry-level or support roles where I can learn under supervision while building toward my care pathway.`
    )
  }

  if (family === 'security') {
    return (
      `Reliable candidate preparing for ${role} roles in the UK events and security sector. ` +
      `I bring customer service, calm communication, and a professional approach to responsibility and teamwork.` +
      (training ? ` I am working toward ${training} to strengthen my readiness for this route.` : '') +
      ` Focused on safe, customer-facing environments and progressing with the right licences and experience.`
    )
  }

  if (family === 'education') {
    return (
      `Enthusiastic candidate preparing for ${role} opportunities in UK education settings. ` +
      `I bring clear communication, patience, and a commitment to safeguarding awareness and supporting learners.` +
      (training ? ` I am developing through ${training} where relevant.` : '') +
      ` Seeking roles where I can contribute positively while building classroom and support experience.`
    )
  }

  const focus = route && route.toLowerCase() !== role.toLowerCase() ? `${role} (${route})` : role
  return (
    `Motivated professional preparing a CV for ${focus} opportunities in the UK. ` +
    `I bring transferable strengths in communication, reliability, and teamwork, and I am focused on roles that match my current career plan.` +
    (training ? ` Next training step: ${training}.` : '') +
    ` Ready to tailor applications and build relevant experience toward this pathway.`
  )
}

/**
 * Apply plan route context to draft CV — single source of truth for Tailor.
 */
export function applyPlanContextToCvDraft<T extends CvDraftLike>(
  cvDraft: T,
  planContext: PlanTailorContext,
  options: ApplyPlanContextOptions = {}
): T {
  const role = (planContext.targetRole || '').trim()
  if (!role) return cvDraft

  const replaceSkills = options.replaceSkills !== false
  const keepTransferable = options.keepTransferableSkills !== false
  const debug =
    options.debug === true ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')

  const family = detectRoleFamily(role, planContext.routeTitle || planContext.pathLabel)
  // Never feed raw cvFocusKeywords into skills — those are match tokens.
  const planExtras = [...(planContext.suggestedSkills || [])]
  const summary = buildSummary(planContext, family)

  let skills: string[]
  if (replaceSkills) {
    const built = buildReplacedSkills(family, cvDraft.skills || [], planExtras, keepTransferable)
    skills = built.finalSkills
    if (debug && typeof console !== 'undefined') {
      console.debug('[cvPlanTailor] skills replace', {
        previousSkills: built.previousSkills,
        replacementSkills: built.replacementSkills,
        finalSkills: built.finalSkills,
      })
    }
  } else {
    skills = normalizeSkillsInput(cvDraft.skills)
  }

  return {
    ...cvDraft,
    personalInfo: { ...cvDraft.personalInfo },
    experience: Array.isArray(cvDraft.experience) ? [...cvDraft.experience] : cvDraft.experience,
    education: Array.isArray(cvDraft.education) ? [...cvDraft.education] : cvDraft.education,
    summary,
    skills: [...skills],
  }
}

/** Alias matching product naming. */
export const applyPlanContextToCVDraft = applyPlanContextToCvDraft

export function planTailorToastLabel(role: string): string {
  const r = role.trim() || 'your'
  return `CV tailored for ${r} plan.`
}

export const PLAN_SKILLS_UPDATED_TOAST = 'CV skills updated for your plan.'

/** Filter UI suggestion chips — drop course-title tokens and stale sector skills. */
export function filterPlanSkillSuggestions(items: string[] | null | undefined): string[] {
  if (!items?.length) return []
  return sanitizePlanSkillExtras(items)
}

export function markCvPlanTailoredLocally(skills: string[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CV_PLAN_TAILORED_AT_KEY, String(Date.now()))
    sessionStorage.setItem(CV_PLAN_TAILORED_SKILLS_KEY, JSON.stringify(skills))
  } catch {
    // ignore
  }
}

export function readCvPlanTailoredLocally(): { at: number; skills: string[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const at = Number(sessionStorage.getItem(CV_PLAN_TAILORED_AT_KEY) || 0)
    if (!at || !Number.isFinite(at)) return null
    const raw = sessionStorage.getItem(CV_PLAN_TAILORED_SKILLS_KEY)
    const skills = raw ? (JSON.parse(raw) as string[]) : []
    return { at, skills: Array.isArray(skills) ? skills : [] }
  } catch {
    return null
  }
}

export function clearCvPlanTailoredLocally(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(CV_PLAN_TAILORED_AT_KEY)
    sessionStorage.removeItem(CV_PLAN_TAILORED_SKILLS_KEY)
  } catch {
    // ignore
  }
}

/** True if skill list still looks like a previous cleaner / unrelated sector CV. */
export function skillsLookStaleForPlan(skills: string[], targetRole: string): boolean {
  const family = detectRoleFamily(targetRole, targetRole)
  const list = normalizeSkillsInput(skills)
  if (!list.length) return false
  const staleCount = list.filter(isStaleSectorSkill).length
  if (staleCount >= 1 && (family === 'midwifery_healthcare' || family === 'nursing_care')) {
    return true
  }
  return staleCount >= 2
}
