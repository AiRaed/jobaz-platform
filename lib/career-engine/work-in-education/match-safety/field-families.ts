/**
 * Work in My Education — field-family requirement rules (global).
 * Controls when "professional registration" / regulated language is allowed.
 */

export type WieFieldFamily =
  | 'regulated_sensitive'
  | 'non_regulated_practical'
  | 'unknown'

/** Truly licence / registration sensitive education families. */
const REGULATED_FIELD_RE =
  /\b(healthcare|medicine|nursing|midwif|pharmacy|pharmaceut|dentistry|dental|veterinary|social\s*work|teaching|education|qts|law|legal|solicitor|barrister|architecture|architect|psycholog|counsell|therap|psychotherap|accounting|accountancy|chartered\s*account)\b/i

/** Non-regulated practical families — never default to professional registration. */
const NON_REGULATED_FIELD_RE =
  /\b(humanities|social\s*science|anthropolog|sociolog|history|politic|international\s*relation|language|literature|linguist|business|management|marketing|digital\s*market|human\s*resource|\bhr\b|office|admin|creative|media|design|hospitality|tourism|event|logistic|supply\s*chain|public\s*policy|international\s*development|natural\s*science|biology|chemistr|physics|environment|geography|it\b|information\s*technology|computer|software|digital\s*tech|technology)\b/i

/** Hard role titles that are genuinely regulated regardless of field family. */
export const HARD_REGULATED_ROLE_TITLE_RE =
  /\b(chartered\s+(civil\s+)?engineer|chartered\s+accountant|registered\s+nurse|registered\s+midwife|registered\s+social\s+worker|solicitor|barrister|paramedic|qualified\s+teacher|clinical\s+psychologist|veterinary\s+surgeon|chartered\s+architect|registered\s+architect)\b/i

/** Soft practical leadership / coordinator titles suitable as immediate on Leadership stage. */
export const PRACTICAL_LEADERSHIP_TITLE_RE =
  /\b(coordinator|co-ordinator|officer|programme\s+lead|program\s+lead|project\s+lead|team\s+lead|research\s*\/\s*programme\s+lead|project\s+coordinator|programme\s+coordinator|operations\s+coordinator|supervisor)\b/i

/** Entry / adjacent practical titles across families. */
export const PRACTICAL_ENTRY_TITLE_RE =
  /\b(assistant|graduate|junior|trainee|technician|support|administrator|admin\b|coordinator|co-ordinator|officer|analyst|paralegal|bookkeeper|cad|helper|labourer|laborer|steward)\b/i

export function classifyWieFieldFamily(
  fieldName: string | null | undefined,
  fieldSlug?: string | null,
  specialismName?: string | null
): WieFieldFamily {
  const hay = `${fieldName ?? ''} ${fieldSlug ?? ''} ${specialismName ?? ''}`.trim()
  if (!hay) return 'unknown'
  // Engineering is mixed — treat as regulated_sensitive only for chartered context via role flags;
  // field itself stays non_regulated_practical unless specialty is clearly professional.
  if (/\bengineering\b/i.test(hay) && !/\bchartered|professional\s+engineer\b/i.test(hay)) {
    return 'non_regulated_practical'
  }
  if (REGULATED_FIELD_RE.test(hay)) return 'regulated_sensitive'
  if (NON_REGULATED_FIELD_RE.test(hay)) return 'non_regulated_practical'
  return 'unknown'
}

export function fieldFamilyAllowsProfessionalRegistrationLanguage(
  family: WieFieldFamily
): boolean {
  return family === 'regulated_sensitive'
}

export function isHardRegulatedRoleTitle(title: string): boolean {
  if (/\b(software|solutions|enterprise|data|cloud|security|network|it|systems?)\s+architect\b/i.test(title)) {
    return false
  }
  return HARD_REGULATED_ROLE_TITLE_RE.test(title)
}

export function softRequirementWarning(kind: 'experience' | 'portfolio' | 'dbs' | 'study' | 'employer'): string {
  switch (kind) {
    case 'experience':
      return 'UK sector experience may strengthen applications.'
    case 'portfolio':
      return 'Portfolio or writing evidence may help.'
    case 'dbs':
      return 'DBS may be needed for roles involving vulnerable people.'
    case 'study':
      return 'Further study may be needed for academic progression.'
    case 'employer':
    default:
      return 'Some employers may ask for qualification evidence.'
  }
}
