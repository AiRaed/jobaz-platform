/**
 * Global blocker detection from role title, stage, seniority, academic requirement,
 * registration requirement, eligibility notes, and regulated flags.
 *
 * Intentionally conservative: shared field/specialism alone must not imply
 * advanced academic or regulated blockers.
 * DBS / SIA / CSCS / AAT are checks or courses — not "professional registration".
 */

export type BlockerKind =
  | 'experience'
  | 'professional'
  | 'academic'
  | 'qualification'
  | 'recognition'
  | 'stage_mismatch'

export type DetectedBlocker = {
  kind: BlockerKind
  code: string
  label: string
}

const EXPERIENCE_RE =
  /\b(senior|manager|head\b|principal|consultant|director|experienced|executive)\b/i

/** Strong professional/licence signals in titles (not soft “desirable”). */
const PROFESSIONAL_TITLE_RE =
  /\b(chartered|registered\s+(nurse|teacher|social\s+worker|practitioner|engineer)|licensed|licenced|solicitor|barrister|paramedic|midwife|qualified\s+teacher|clinical\s+psychologist)\b/i

/** Real professional bodies / protected pathways — not DBS/SIA/CSCS/AAT. */
const PROFESSIONAL_BODY_RE =
  /\b(nmc|gmc|hcpc|sra|bsb|riba|\bceng\b|\bieng\b|acca|cima|\bqts\b|gas\s*safe|\becs\b|niceic)\b/i

const ACADEMIC_TITLE_RE =
  /\b(lecturer|postdoctoral|post[\s-]?doc|research\s+associate|research\s+fellow|professor|phd\s+candidate|doctoral\s+researcher)\b/i

const QUALIFICATION_RE =
  /\b(degree\s+required|master'?s?\s+required|phd\s+required|licence\s+required|license\s+required|certification\s+required|uk\s+recognition\s+required|accredited\s+degree)\b/i

const RECOGNITION_RE =
  /\b(uk\s+recognition|overseas|international\s+qualification|equivalence|naric|enic)\b/i

const REG_NOT_REQUIRED_RE =
  /\b(none|not\s+required|not\s+needed|no\s+professional\s+registration|registration\s+not\s+required)\b/i

export type BlockerInput = {
  roleTitle: string
  stageKey?: string | null
  stageLabel?: string | null
  seniority?: string | null
  academicRequirement?: string | null
  registrationRequirement?: string | null
  eligibilityNote?: string | null
  regulated?: boolean
  isResearchRole?: boolean
  isAcademicRole?: boolean
  minimumExperienceYears?: number | null
}

export function detectRoleBlockers(input: BlockerInput): DetectedBlocker[] {
  const titleStage = [input.roleTitle, input.stageKey, input.stageLabel, input.seniority]
    .filter(Boolean)
    .join(' ')

  const notes = [input.eligibilityNote, input.registrationRequirement].filter(Boolean).join(' ')
  const regRaw = (input.registrationRequirement ?? '').trim()

  const out: DetectedBlocker[] = []
  const push = (kind: BlockerKind, code: string, label: string) => {
    if (!out.some((b) => b.code === code)) out.push({ kind, code, label })
  }

  // Do not treat bare "lead" / "team lead" as senior experience — those are common
  // on Leadership stage practical routes.
  const leadOnly =
    /\b(team\s+lead|programme\s+lead|program\s+lead|project\s+lead|research\s*\/\s*programme\s+lead)\b/i.test(
      input.roleTitle
    ) && !EXPERIENCE_RE.test(input.roleTitle)

  if (
    (!leadOnly && EXPERIENCE_RE.test(titleStage)) ||
    (input.minimumExperienceYears ?? 0) >= 5
  ) {
    push('experience', 'blocker.experience', 'Relevant experience is typically required')
  }

  const regNotRequired = REG_NOT_REQUIRED_RE.test(regRaw) || regRaw.toLowerCase() === 'none'
  const hardRegistration =
    Boolean(input.regulated) ||
    (!regNotRequired &&
      (/^(required|mandatory)/i.test(regRaw) ||
        /\b(required|mandatory)\b/i.test(regRaw)))

  if (
    PROFESSIONAL_TITLE_RE.test(titleStage) ||
    PROFESSIONAL_BODY_RE.test(`${titleStage} ${notes}`) ||
    hardRegistration
  ) {
    push(
      'professional',
      'blocker.professional',
      'Professional registration or a licence may be required'
    )
  }

  // Academic: flags + clear title/stage research signals only.
  // Do NOT treat bare “research” in stage keys like graduate research assistant titles
  // as doctoral blockers — only academic_research stage / hard titles / flags.
  const academicStage = /\b(academic[_/\s-]*research|academic\s*\/\s*research)\b/i.test(
    `${input.stageKey ?? ''} ${input.stageLabel ?? ''}`
  )
  if (
    input.isResearchRole ||
    input.isAcademicRole ||
    ACADEMIC_TITLE_RE.test(titleStage) ||
    academicStage ||
    /\b(phd_relevant|doctorate)\b/i.test(input.academicRequirement ?? '')
  ) {
    push('academic', 'blocker.academic', 'Academic or research credentials are typically required')
  }

  if (
    QUALIFICATION_RE.test(`${titleStage} ${notes}`) ||
    /masters_relevant|phd_relevant|accredited/i.test(input.academicRequirement ?? '')
  ) {
    push(
      'qualification',
      'blocker.qualification',
      'A specific qualification level is typically required'
    )
  }

  if (RECOGNITION_RE.test(`${titleStage} ${notes}`)) {
    push(
      'recognition',
      'blocker.recognition',
      'UK recognition of your qualification may be needed'
    )
  }

  return out
}
