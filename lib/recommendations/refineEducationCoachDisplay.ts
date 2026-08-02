import type {
  EducationFieldId,
  EducationPathAnswers,
  EssentialAction,
  JobEntry,
} from '@/lib/career-engine/education-path/types'
import { dedupeEssentialActions } from '@/lib/career-engine/shared/dedupeActions'
import type { OtherSuggestion } from './types'

const ENGINEERING_MEMBERSHIP_PATTERN =
  /\b(IET|IMechE|ICE|IStructE|Engineering Council)\b|professional body|chartered engineer.*(route|pathway)|membership/i

const ELECTRICAL_SPECS = new Set([
  'electrical_engineering',
  'electronic_engineering',
  'electrician',
  'building_services',
  'electrical_installation',
])

const CIVIL_SPECS = new Set([
  'civil_engineering',
  'structural_engineering',
  'architecture',
  'quantity_surveying',
  'bim',
  'building_surveying',
])

const MECH_SPECS = new Set([
  'mechanical_engineering',
  'industrial_engineering',
  'mechatronics',
  'automotive_engineering',
])

type BodyAction = Pick<EssentialAction, 'id' | 'title' | 'description' | 'href' | 'priority'>

function engineeringBodyForSpec(spec: string): BodyAction | null {
  if (ELECTRICAL_SPECS.has(spec)) {
    return {
      id: 'iet',
      title: 'IET Membership',
      description:
        'Institution of Engineering and Technology — the UK professional body for electrical and electronic engineers pursuing CEng / IEng.',
      href: 'https://www.theiet.org/',
      priority: 'critical',
    }
  }
  if (MECH_SPECS.has(spec)) {
    return {
      id: 'imeche',
      title: 'IMechE Membership',
      description:
        'Institution of Mechanical Engineers — chartered engineer pathway for mechanical and manufacturing disciplines.',
      href: 'https://www.imeche.org/',
      priority: 'critical',
    }
  }
  if (CIVIL_SPECS.has(spec)) {
    return {
      id: 'ice',
      title: 'ICE Membership',
      description:
        'Institution of Civil Engineers — professional body for civil and structural engineering chartership in the UK.',
      href: 'https://www.ice.org.uk/',
      priority: 'critical',
    }
  }
  return null
}

function isEngineeringMembershipAction(action: EssentialAction): boolean {
  if (['iet', 'imeche', 'ice', 'istructe', 'engc'].includes(action.id)) return true
  return ENGINEERING_MEMBERSHIP_PATTERN.test(action.title)
}

function isEngCouncilDuplicate(action: EssentialAction, spec: string): boolean {
  if (!/engineering council/i.test(action.title)) return false
  return ELECTRICAL_SPECS.has(spec) || MECH_SPECS.has(spec) || CIVIL_SPECS.has(spec)
}

export function refineEssentialActions(
  actions: EssentialAction[],
  answers: EducationPathAnswers
): EssentialAction[] {
  if (answers.education_field !== 'engineering') {
    return dedupeEssentialActions(actions).slice(0, 6)
  }

  const spec = answers.education_specialisation ?? ''
  const preferredBody = engineeringBodyForSpec(spec)
  const withoutMembership = actions.filter((a) => !isEngineeringMembershipAction(a))
  const withoutEngcDup = withoutMembership.filter((a) => !isEngCouncilDuplicate(a, spec))

  if (preferredBody) {
    return dedupeEssentialActions([preferredBody, ...withoutEngcDup]).slice(0, 6)
  }

  return dedupeEssentialActions(actions).slice(0, 6)
}

const ELECTRICAL_ROLE_POOL: JobEntry[] = [
  { title: 'Electrical Engineer', seniority: 'mid', searchKeyword: 'electrical engineer', salaryRange: '£32k–£45k' },
  { title: 'Electrical Design Engineer', seniority: 'mid', searchKeyword: 'electrical design engineer', salaryRange: '£32k–£46k' },
  { title: 'Building Services Engineer', seniority: 'mid', searchKeyword: 'building services engineer', salaryRange: '£30k–£44k' },
  { title: 'Electrical Project Engineer', seniority: 'mid', searchKeyword: 'electrical project engineer', salaryRange: '£34k–£48k' },
  { title: 'Graduate Electrical Engineer', seniority: 'graduate', searchKeyword: 'graduate electrical engineer', salaryRange: '£28k–£35k' },
  { title: 'Maintenance Engineer', seniority: 'junior', searchKeyword: 'maintenance engineer electrical', salaryRange: '£28k–£38k' },
  { title: 'Controls Engineer', seniority: 'mid', searchKeyword: 'controls engineer', salaryRange: '£34k–£48k' },
]

const CIVIL_ROLE_POOL: JobEntry[] = [
  { title: 'Graduate Civil Engineer', seniority: 'graduate', searchKeyword: 'graduate civil engineer', salaryRange: '£28k–£35k' },
  { title: 'Structural Engineer', seniority: 'mid', searchKeyword: 'structural engineer', salaryRange: '£34k–£46k' },
  { title: 'Site Engineer', seniority: 'graduate', searchKeyword: 'site engineer civil', salaryRange: '£27k–£34k' },
  { title: 'Project Engineer', seniority: 'mid', searchKeyword: 'civil project engineer', salaryRange: '£35k–£48k' },
]

const MECH_ROLE_POOL: JobEntry[] = [
  { title: 'Graduate Mechanical Engineer', seniority: 'graduate', searchKeyword: 'graduate mechanical engineer', salaryRange: '£28k–£36k' },
  { title: 'Design Engineer', seniority: 'mid', searchKeyword: 'mechanical design engineer', salaryRange: '£32k–£45k' },
  { title: 'Project Engineer', seniority: 'mid', searchKeyword: 'mechanical project engineer', salaryRange: '£35k–£48k' },
]

function jobDedupKey(job: JobEntry): string {
  return job.searchKeyword.trim().toLowerCase()
}

function dedupeJobList(jobs: JobEntry[]): JobEntry[] {
  const seen = new Set<string>()
  const out: JobEntry[] = []
  for (const job of jobs) {
    const key = jobDedupKey(job)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(job)
  }
  return out
}

function forbiddenForSpec(spec: string): RegExp | null {
  if (ELECTRICAL_SPECS.has(spec)) {
    return /structural|civil engineer|quantity surveyor|mechanical engineer|architectural assistant/i
  }
  if (CIVIL_SPECS.has(spec)) {
    return /electrical engineer|electrician|electronic engineer|controls engineer/i
  }
  if (MECH_SPECS.has(spec)) {
    return /structural engineer|civil engineer|electrical engineer|electrician/i
  }
  return null
}

function rolePoolForSpec(spec: string, level: EducationPathAnswers['qualification_level']): JobEntry[] {
  const seniorities =
    level === 'bachelors' ? ['graduate', 'junior'] : level === 'masters' ? ['junior', 'mid'] : ['research', 'senior', 'mid']

  let pool: JobEntry[] = []
  if (ELECTRICAL_SPECS.has(spec)) pool = ELECTRICAL_ROLE_POOL
  else if (CIVIL_SPECS.has(spec)) pool = CIVIL_ROLE_POOL
  else if (MECH_SPECS.has(spec)) pool = MECH_ROLE_POOL

  return pool.filter((j) => !j.seniority || seniorities.includes(j.seniority))
}

export function refineWorkNowJobs(
  jobs: JobEntry[],
  answers: EducationPathAnswers
): JobEntry[] {
  if (answers.education_field !== 'engineering') {
    return dedupeJobList(jobs).slice(0, 4)
  }

  const spec = answers.education_specialisation ?? ''
  const forbidden = forbiddenForSpec(spec)
  let pool = forbidden ? jobs.filter((j) => !forbidden.test(`${j.title} ${j.searchKeyword}`)) : [...jobs]

  const defaults = rolePoolForSpec(spec, answers.qualification_level)
  if (defaults.length) {
    pool = [...pool, ...defaults]
  }

  return dedupeJobList(pool).slice(0, 4)
}

export function buildTodaysActionPlan(
  dailyActions: string[] | undefined,
  experienceGaps: string[] | undefined,
  alternativeRoles: string[] | undefined
): OtherSuggestion | null {
  const actions: string[] = []

  for (const action of dailyActions ?? []) {
    const cleaned = action.replace(/^Action:\s*/i, '').trim()
    if (cleaned && !actions.includes(cleaned)) actions.push(cleaned)
    if (actions.length >= 5) break
  }

  if (actions.length < 3 && experienceGaps?.length) {
    const gap = `Address gap: ${experienceGaps[0]}`
    if (!actions.includes(gap)) actions.push(gap)
  }

  if (actions.length < 3 && alternativeRoles?.length) {
    const explore = `Explore alternative role: ${alternativeRoles[0]}`
    if (!actions.includes(explore)) actions.push(explore)
  }

  if (actions.length === 0) return null

  return {
    id: 'todays-action-plan',
    title: "Today's Action Plan",
    actions: actions.slice(0, 5),
  }
}

export function parseCertIds(answers: Record<string, string>): string[] {
  const raw = answers.professional_certifications ?? ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function siteOrProjectWorkRelevant(
  answers: EducationPathAnswers & Record<string, string>
): boolean {
  const spec = answers.education_specialisation ?? ''
  if (CIVIL_SPECS.has(spec) || ELECTRICAL_SPECS.has(spec) || answers.education_field === 'construction') {
    return true
  }

  const certs = parseCertIds(answers)
  return certs.some((c) =>
    ['cscs', 'cscs_card', 'ecs_card', 'iosh', 'nebosh', 'niceic_napit', '18th_edition'].includes(c)
  )
}

export function courseTitleBoostForEducation(
  title: string,
  answers: EducationPathAnswers & Record<string, string>
): number {
  const spec = answers.education_specialisation ?? ''
  const field = answers.education_field as EducationFieldId
  const norm = title.toLowerCase()
  let boost = 0

  if (field === 'engineering' && ELECTRICAL_SPECS.has(spec)) {
    if (/18th edition|wiring regulation/i.test(norm)) boost += 28
    else if (/\becs\b|electrotechnical certification/i.test(norm)) boost += 26
    else if (/\bapm\b|project management|prince2/i.test(norm)) boost += 18
    else if (/autocad/i.test(norm)) boost += 14
    else if (/niceic|napit|2391|inspection.*test|nvq.*electrical|city.*guilds.*electrical/i.test(norm)) boost += 12

    if (/iosh|nebosh/i.test(norm)) {
      boost += siteOrProjectWorkRelevant(answers) ? 6 : -12
    }
  }

  if (field === 'engineering' && CIVIL_SPECS.has(spec)) {
    if (/autocad|revit|bim/i.test(norm)) boost += 16
    if (/cscs/i.test(norm)) boost += 12
    if (/iosh|nebosh/i.test(norm)) boost += siteOrProjectWorkRelevant(answers) ? 8 : -8
  }

  if (field === 'engineering' && MECH_SPECS.has(spec)) {
    if (/solidworks|autocad/i.test(norm)) boost += 14
    if (/apm|project management/i.test(norm)) boost += 10
  }

  return boost
}
