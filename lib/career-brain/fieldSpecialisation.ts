/**
 * Broad-field specialisation — one follow-up question when sub-discipline materially changes UK paths.
 */

import { rec } from './resultBuilder'
import { resolveQualificationTier, type QualificationTier } from './pathContext'
import type { CareerBrainQuestion, CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export const CB_FIELD_SPECIALISATION = 'cb_field_specialisation'

export type FieldSpecialisationValue = string

type SpecialisationOption = {
  value: FieldSpecialisationValue
  label: string
  /** Resolved study text for profile / bridge inference */
  studyText: string
}

type BroadFieldConfig = {
  key: string
  /** Slugs from structured study-field questions (e.g. first job) */
  studySlugs: string[]
  questionText: string
  options: SpecialisationOption[]
  /** When false, registry exists but no extra question is asked yet */
  enabled: boolean
  /**
   * If study text already matches one of these, the field is specific enough — skip the question.
   */
  specificTextPatterns: RegExp[]
}

const ENGINEERING_OPTIONS: SpecialisationOption[] = [
  { value: 'mechanical', label: 'Mechanical Engineering', studyText: 'mechanical engineering' },
  { value: 'electrical', label: 'Electrical Engineering', studyText: 'electrical engineering' },
  { value: 'civil', label: 'Civil Engineering', studyText: 'civil engineering' },
  {
    value: 'software',
    label: 'Software / Computer Engineering',
    studyText: 'software engineering',
  },
  { value: 'industrial', label: 'Industrial Engineering', studyText: 'industrial engineering' },
  { value: 'chemical', label: 'Chemical Engineering', studyText: 'chemical engineering' },
  { value: 'other', label: 'Other Engineering', studyText: 'engineering' },
]

/** Registry — add broad fields here; set `enabled: true` when the follow-up is live. */
export const BROAD_FIELD_REGISTRY: BroadFieldConfig[] = [
  {
    key: 'engineering',
    studySlugs: ['engineering'],
    questionText: 'What type of engineering?',
    options: ENGINEERING_OPTIONS,
    enabled: true,
    specificTextPatterns: [
      /mechanical\s+engineer/i,
      /electrical\s+engineer/i,
      /civil\s+engineer/i,
      /software\s+engineer/i,
      /computer\s+engineer/i,
      /industrial\s+engineer/i,
      /chemical\s+engineer/i,
      /aerospace\s+engineer/i,
      /biomedical\s+engineer/i,
    ],
  },
  {
    key: 'it_computing',
    studySlugs: ['it_computing', 'computer science', 'computing', 'information technology'],
    questionText: 'What area of IT / computing?',
    options: [
      { value: 'software', label: 'Software Development', studyText: 'software development' },
      { value: 'cybersecurity', label: 'Cybersecurity', studyText: 'cybersecurity' },
      { value: 'data', label: 'Data & Analytics', studyText: 'data analytics' },
      { value: 'networking', label: 'Networking & Infrastructure', studyText: 'networking' },
      { value: 'other', label: 'Other IT', studyText: 'information technology' },
    ],
    enabled: false,
    specificTextPatterns: [
      /cyber\s*security/i,
      /network\s+engineer/i,
      /data\s+(science|analyst|engineering)/i,
      /software\s+(developer|engineer)/i,
    ],
  },
  {
    key: 'healthcare',
    studySlugs: ['healthcare', 'health care', 'health sciences'],
    questionText: 'Which healthcare area best matches your studies?',
    options: [
      { value: 'nursing', label: 'Nursing', studyText: 'nursing' },
      { value: 'public_health', label: 'Public Health', studyText: 'public health' },
      { value: 'pharmacy', label: 'Pharmacy', studyText: 'pharmacy' },
      { value: 'healthcare_management', label: 'Healthcare Management', studyText: 'healthcare management' },
      { value: 'other', label: 'Other Healthcare', studyText: 'healthcare' },
    ],
    enabled: false,
    specificTextPatterns: [
      /nursing|nurse\b|midwif/i,
      /pharmacy|pharmacist/i,
      /public\s+health/i,
      /healthcare\s+management|health\s+administration/i,
    ],
  },
]

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

function q(
  broadKey: string,
  text: string,
  options: SpecialisationOption[]
): CareerBrainQuestion {
  return {
    id: CB_FIELD_SPECIALISATION,
    text,
    type: 'single',
    options: options.map((o) => ({ value: `${broadKey}:${o.value}`, label: o.label })),
    allow_free_text: false,
  }
}

export function getBroadFieldConfig(key: string): BroadFieldConfig | undefined {
  return BROAD_FIELD_REGISTRY.find((c) => c.key === key)
}

export function isBroadStudySlug(slug: string): boolean {
  const s = slug.trim().toLowerCase()
  return BROAD_FIELD_REGISTRY.some(
    (c) => c.enabled && c.studySlugs.some((slug) => slug === s)
  )
}

/** Free-text study fields — skip follow-up when discipline is already named. */
export function detectBroadFieldFromStudyText(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  for (const config of BROAD_FIELD_REGISTRY) {
    if (!config.enabled) continue
    if (config.specificTextPatterns.some((re) => re.test(t))) return null
    const slugHit = config.studySlugs.some((slug) => {
      const s = slug.toLowerCase()
      return t === s || new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t)
    })
    const broadOnly =
      config.key === 'engineering' &&
      (/^engineering\b|engineer(ing)?\s*(degree|bachelor|master|phd|doctorate)/i.test(t) ||
        /\bengineering\s+degree\b/i.test(t))
    if (slugHit || broadOnly) return config.key
  }
  return null
}

export function parseSpecialisationAnswer(
  raw: string
): { broadKey: string; value: string } | null {
  const m = String(raw).trim().match(/^([^:]+):(.+)$/)
  if (!m) return null
  return { broadKey: m[1], value: m[2] }
}

export function getActiveBroadFieldKey(state: CareerBrainState): string | null {
  const a = answers(state)
  const fj = String(a.cb_first_job_study_field ?? '').trim()
  if (fj && isBroadStudySlug(fj)) return fj

  const grad = String(a.cb_graduate_study_field ?? a.cb_study_field ?? '').trim()
  if (grad) {
    const fromText = detectBroadFieldFromStudyText(grad)
    if (fromText) return fromText
  }

  const student = String(a.cb_student_study_field ?? '').trim()
  if (student) {
    const fromText = detectBroadFieldFromStudyText(student)
    if (fromText) return fromText
  }

  return null
}

export function needsFieldSpecialisationQuestion(state: CareerBrainState): boolean {
  if (hasAnswer(state, CB_FIELD_SPECIALISATION)) return false
  const broadKey = getActiveBroadFieldKey(state)
  if (!broadKey) return false
  const config = getBroadFieldConfig(broadKey)
  return !!config?.enabled
}

export function isFieldSpecialisationComplete(state: CareerBrainState): boolean {
  if (!needsFieldSpecialisationQuestion(state)) return true
  return hasAnswer(state, CB_FIELD_SPECIALISATION)
}

export function pickFieldSpecialisationQuestion(
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  const broadKey = getActiveBroadFieldKey(state)
  if (!broadKey || hasAnswer(state, CB_FIELD_SPECIALISATION)) {
    return { question: null, reason: 'No broad field specialisation needed' }
  }
  const config = getBroadFieldConfig(broadKey)
  if (!config?.enabled) {
    return { question: null, reason: `Broad field ${broadKey} specialisation not enabled yet` }
  }
  return {
    question: q(broadKey, config.questionText, config.options),
    reason: `Broad field (${broadKey}) — sub-discipline follow-up`,
  }
}

export function resolveEffectiveStudyField(state: CareerBrainState, fallback?: string): string {
  const parsed = parseSpecialisationAnswer(String(answers(state)[CB_FIELD_SPECIALISATION] ?? ''))
  if (parsed) {
    const config = getBroadFieldConfig(parsed.broadKey)
    const opt = config?.options.find((o) => o.value === parsed.value)
    if (opt) return opt.studyText
  }

  if (fallback?.trim()) return fallback.trim()

  const grad = String(answers(state).cb_graduate_study_field ?? answers(state).cb_study_field ?? '').trim()
  if (grad) return grad

  const student = String(answers(state).cb_student_study_field ?? '').trim()
  if (student) return student

  return ''
}

export function getSpecialisationValue(state: CareerBrainState): string | null {
  const parsed = parseSpecialisationAnswer(String(answers(state)[CB_FIELD_SPECIALISATION] ?? ''))
  return parsed?.value ?? null
}

export function specialisationStudyLabel(state: CareerBrainState): string | null {
  const parsed = parseSpecialisationAnswer(String(answers(state)[CB_FIELD_SPECIALISATION] ?? ''))
  if (!parsed) return null
  const config = getBroadFieldConfig(parsed.broadKey)
  return config?.options.find((o) => o.value === parsed.value)?.label ?? null
}

const ENGINEERING_UNDERGRAD_PACKS: Record<string, CareerBrainRecommendation[]> = {
  mechanical: [
    rec('Mechanical Engineering Technician', 'Work Now — manufacturing/CAD technician route', 'work_now', 'construction_trades'),
    rec('CAD Technician (mechanical)', 'Work Now — technical drawings and design office exposure', 'work_now', 'construction_trades'),
    rec('Manufacturing Engineering Trainee', 'Work Now — production floor with engineering qualification', 'work_now', 'construction_trades'),
    rec('HNC / BTEC Mechanical Engineering (part-time)', 'Build Next — formal mechanical engineering progression', 'build_next', 'construction_trades'),
    rec('SolidWorks / CAD short course', 'Build Next — design skills for mechanical roles', 'build_next', 'construction_trades'),
    rec('Mechanical Design Engineer', 'Long-term — chartered mechanical engineering pathway (IMechE)', 'long_term', 'construction_trades'),
  ],
  electrical: [
    rec('Electrical Engineering Technician', 'Work Now — panel/building services technician support', 'work_now', 'construction_trades'),
    rec('Maintenance Electrician (trainee)', 'Work Now — industrial maintenance with supervision', 'work_now', 'construction_trades'),
    rec('Electrical Design Office Assistant', 'Work Now — drawings and compliance documentation', 'work_now', 'construction_trades'),
    rec('18th Edition / ECS pathway preparation', 'Build Next — UK electrical competency route', 'build_next', 'construction_trades'),
    rec('Electrical Installation Diploma (evening)', 'Build Next — installer competency while earning', 'build_next', 'construction_trades'),
    rec('Electrical Design Engineer', 'Long-term — building services / power systems career', 'long_term', 'construction_trades'),
  ],
  civil: [
    rec('Civil Engineering Site Assistant', 'Work Now — site exposure with engineering degree', 'work_now', 'construction_trades'),
    rec('Civil Engineering Technician', 'Work Now — drawings, surveys, and site records', 'work_now', 'construction_trades'),
    rec('Surveying / CAD Admin Assistant', 'Work Now — office-side civil project support', 'work_now', 'construction_trades'),
    rec('CSCS + site safety induction', 'Build Next — site access for civil graduate routes', 'build_next', 'construction_trades'),
    rec('Graduate Civil Engineer (trainee)', 'Build Next — structured civil engineering grad scheme', 'build_next', 'construction_trades'),
    rec('Civil Engineer / Project Engineer', 'Long-term — ICE-aligned civil engineering career', 'long_term', 'construction_trades'),
  ],
  software: [
    rec('Junior Software Tester', 'Work Now — QA entry aligned with software engineering degree', 'work_now', 'IT_digital'),
    rec('IT Support Analyst (graduate)', 'Work Now — service desk with progression to development', 'work_now', 'IT_digital'),
    rec('Technical Support Engineer (junior)', 'Work Now — product support with engineering background', 'work_now', 'IT_digital'),
    rec('Cloud fundamentals (AWS/Azure basics)', 'Build Next — platform skills for software careers', 'build_next', 'IT_digital'),
    rec('Software engineering graduate scheme', 'Build Next — structured development grad route', 'build_next', 'IT_digital'),
    rec('Senior Software Developer', 'Long-term — development career target', 'long_term', 'IT_digital'),
  ],
  industrial: [
    rec('Production Engineering Assistant', 'Work Now — process and line improvement exposure', 'work_now', 'construction_trades'),
    rec('Process Improvement Assistant', 'Work Now — lean/operations support in manufacturing', 'work_now', 'construction_trades'),
    rec('Manufacturing Graduate Operator', 'Work Now — shop floor with engineering oversight', 'work_now', 'construction_trades'),
    rec('Lean / Six Sigma Yellow Belt', 'Build Next — industrial engineering toolkit', 'build_next', 'construction_trades'),
    rec('Operations Management certificate', 'Build Next — production leadership skills', 'build_next', 'construction_trades'),
    rec('Industrial Engineer', 'Long-term — operations and process engineering career', 'long_term', 'construction_trades'),
  ],
  chemical: [
    rec('Laboratory Technician (graduate)', 'Work Now — lab operations with chemical engineering background', 'work_now', 'healthcare'),
    rec('Process Technician', 'Work Now — plant operations trainee route', 'work_now', 'construction_trades'),
    rec('Quality Control Assistant (manufacturing)', 'Work Now — QA in process industries', 'work_now', 'construction_trades'),
    rec('Process safety awareness training', 'Build Next — COMAH/process industries baseline', 'build_next', 'construction_trades'),
    rec('Graduate Process Engineer (trainee)', 'Build Next — structured process engineering scheme', 'build_next', 'construction_trades'),
    rec('Process / Chemical Engineer', 'Long-term — process industries engineering career', 'long_term', 'construction_trades'),
  ],
}

const ENGINEERING_MASTERS_PACKS: Partial<Record<string, CareerBrainRecommendation[]>> = {
  mechanical: [
    rec('Graduate Mechanical Engineer (trainee)', 'Work Now — graduate entry aligned with Master\'s qualification', 'work_now', 'construction_trades'),
    rec('Junior Design Engineer', 'Work Now — design office route for engineering graduates', 'work_now', 'construction_trades'),
    rec('Engineering Project Assistant', 'Work Now — project coordination with engineering oversight', 'work_now', 'construction_trades'),
    rec('CAD Technician (mechanical)', 'Work Now — technical drawings while building UK references', 'work_now', 'construction_trades'),
    rec('SolidWorks / CAD professional development', 'Build Next — advanced design tools for graduate mechanical roles', 'build_next', 'construction_trades'),
    rec('Engineering graduate development programme', 'Build Next — structured employer graduate pathway', 'build_next', 'construction_trades'),
    rec('Mechanical Design Engineer', 'Long-term — design engineering career destination', 'long_term', 'construction_trades'),
  ],
  software: [
    rec('Graduate Software Engineer (trainee)', 'Work Now — development graduate route', 'work_now', 'IT_digital'),
    rec('Junior Software Developer', 'Work Now — coding entry with engineering background', 'work_now', 'IT_digital'),
    rec('Technical Business Analyst (junior)', 'Work Now — requirements and systems exposure', 'work_now', 'IT_digital'),
    rec('Cloud fundamentals (AWS/Azure basics)', 'Build Next — platform skills for software careers', 'build_next', 'IT_digital'),
    rec('Software engineering graduate scheme', 'Build Next — structured development grad route', 'build_next', 'IT_digital'),
    rec('Senior Software Developer', 'Long-term — development career target', 'long_term', 'IT_digital'),
  ],
}

const ENGINEERING_PHD_PACKS: Partial<Record<string, CareerBrainRecommendation[]>> = {
  mechanical: [
    rec('Graduate Mechanical Engineer', 'Work Now — graduate engineer route for PhD holders', 'work_now', 'construction_trades'),
    rec('Junior Design Engineer', 'Work Now — design-focused entry using advanced technical background', 'work_now', 'construction_trades'),
    rec('R&D Assistant', 'Work Now — research and development exposure in industry', 'work_now', 'construction_trades'),
    rec('Engineering Project Assistant', 'Work Now — technical projects with engineering teams', 'work_now', 'construction_trades'),
    rec('Professional CAD / FEA development', 'Build Next — advanced analysis and design tools', 'build_next', 'construction_trades'),
    rec('Chartered Engineer (CEng) pathway briefing', 'Build Next — IMechE professional registration route', 'build_next', 'construction_trades'),
    rec('Mechanical Design Engineer', 'Long-term — design engineering career destination', 'long_term', 'construction_trades'),
    rec('R&D Engineer', 'Long-term — research and development engineering career', 'long_term', 'construction_trades'),
  ],
  software: [
    rec('Graduate Software Engineer', 'Work Now — graduate development entry for advanced qualification', 'work_now', 'IT_digital'),
    rec('Junior Software Developer', 'Work Now — product development with engineering PhD background', 'work_now', 'IT_digital'),
    rec('Research Software Engineer (junior)', 'Work Now — computational and research coding roles', 'work_now', 'IT_digital'),
    rec('Cloud fundamentals (AWS/Azure basics)', 'Build Next — platform skills for software careers', 'build_next', 'IT_digital'),
    rec('Software engineering graduate scheme', 'Build Next — structured development grad route', 'build_next', 'IT_digital'),
    rec('Senior Software Developer', 'Long-term — development career target', 'long_term', 'IT_digital'),
    rec('Machine Learning Engineer (entry)', 'Long-term — advanced technical specialism', 'long_term', 'IT_digital'),
  ],
  civil: [
    rec('Graduate Civil Engineer', 'Work Now — graduate civil engineering entry', 'work_now', 'construction_trades'),
    rec('Civil Engineering Project Assistant', 'Work Now — project delivery support on infrastructure schemes', 'work_now', 'construction_trades'),
    rec('Civil Engineering Technician', 'Work Now — drawings, surveys, and site records', 'work_now', 'construction_trades'),
    rec('CSCS + site safety induction', 'Build Next — site access for civil graduate routes', 'build_next', 'construction_trades'),
    rec('Graduate Civil Engineer (structured scheme)', 'Build Next — ICE-aligned graduate development', 'build_next', 'construction_trades'),
    rec('Civil Engineer / Project Engineer', 'Long-term — ICE-aligned civil engineering career', 'long_term', 'construction_trades'),
  ],
  electrical: [
    rec('Graduate Electrical Engineer', 'Work Now — graduate electrical engineering entry', 'work_now', 'construction_trades'),
    rec('Electrical Design Office Assistant', 'Work Now — drawings and compliance documentation', 'work_now', 'construction_trades'),
    rec('Electrical Engineering Technician', 'Work Now — panel/building services technician support', 'work_now', 'construction_trades'),
    rec('18th Edition / ECS pathway preparation', 'Build Next — UK electrical competency route', 'build_next', 'construction_trades'),
    rec('Electrical Design Engineer development', 'Build Next — design engineering progression', 'build_next', 'construction_trades'),
    rec('Electrical Design Engineer', 'Long-term — building services / power systems career', 'long_term', 'construction_trades'),
  ],
}

function pickEngineeringPack(
  spec: string,
  tier: QualificationTier
): CareerBrainRecommendation[] | null {
  if (tier === 'phd') {
    return ENGINEERING_PHD_PACKS[spec] ?? ENGINEERING_MASTERS_PACKS[spec] ?? ENGINEERING_UNDERGRAD_PACKS[spec] ?? null
  }
  if (tier === 'masters') {
    return ENGINEERING_MASTERS_PACKS[spec] ?? ENGINEERING_UNDERGRAD_PACKS[spec] ?? null
  }
  return ENGINEERING_UNDERGRAD_PACKS[spec] ?? null
}

export function getSpecialisationRecommendations(
  state?: CareerBrainState,
  profile?: CareerProfile
): CareerBrainRecommendation[] | null {
  if (!state) return null
  const parsed = parseSpecialisationAnswer(String(answers(state)[CB_FIELD_SPECIALISATION] ?? ''))
  if (!parsed || parsed.broadKey !== 'engineering') return null
  const tier = resolveQualificationTier(state, profile)
  const pack = pickEngineeringPack(parsed.value, tier)
  if (!pack) return null
  const specLabel =
    getBroadFieldConfig('engineering')?.options.find((o) => o.value === parsed.value)?.label ??
    parsed.value
  return pack.map((r) => ({
    ...r,
    why: `${r.why} — ${specLabel}`,
  }))
}

/** Keywords for scoring / track-family when specialisation is set */
export function specialisationRoleKeywords(state?: CareerBrainState): RegExp | null {
  if (!state) return null
  const spec = getSpecialisationValue(state)
  if (!spec) return null
  const patterns: Record<string, RegExp> = {
    mechanical: /mechanical|manufacturing|cad technician|design engineer|solidworks|r&d|graduate mechanical|junior design|project assistant|fea|ceng/i,
    electrical: /electrical|electrician|ecs|18th edition|panel|maintenance electric/i,
    civil: /civil|site assistant|surveying|cscs|project engineer|ice/i,
    software: /software|developer|tester|it support|cloud|technical support engineer/i,
    industrial: /production|process improvement|lean|six sigma|operations engineer|manufacturing graduate/i,
    chemical: /laboratory|process technician|quality control|process engineer|chemical/i,
  }
  return patterns[spec] ?? null
}

export function fieldClarityEmployabilityBonus(state?: CareerBrainState): number {
  if (!state || !hasAnswer(state, CB_FIELD_SPECIALISATION)) return 0
  return 4
}
