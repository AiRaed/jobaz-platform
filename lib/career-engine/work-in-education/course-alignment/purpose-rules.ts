/**
 * Purpose classification + field include patterns for Work in My Education.
 */

import type { WieCoursePurpose, WieUserStageFit } from './types'

export const PURPOSE_LABELS: Record<WieCoursePurpose, string> = {
  career_bridge: 'Career bridge',
  uk_workplace_bridge: 'UK workplace bridge',
  technical_skill_booster: 'Technical skill booster',
  professional_pathway: 'Professional pathway',
  cpd_add_on: 'CPD add-on',
  not_suitable_for_work_in_education: 'Not suitable for Work in My Education',
}

type PurposePattern = {
  purpose: WieCoursePurpose
  re: RegExp
  stages: WieUserStageFit[]
  strength: 'high' | 'medium' | 'low'
}

const PURPOSE_PATTERNS: PurposePattern[] = [
  {
    purpose: 'uk_workplace_bridge',
    re: /\b(english\s*for\s*work|uk\s*cv|interview\s*preparation|workplace\s*english|uk\s*workplace)\b/i,
    stages: ['any_early_career', 'graduate'],
    strength: 'high',
  },
  {
    purpose: 'professional_pathway',
    re: /\b(acca|cima|aat|cilex|prince2|apm|nebosh|chartered|pathway|foundation\s*certificate)\b/i,
    stages: ['graduate', 'specialist', 'professional'],
    strength: 'high',
  },
  {
    purpose: 'career_bridge',
    re: /\b(comptia|istqb|aws\s*cloud|azure\s*fundamentals|teaching\s*assistant|care\s*certificate|paralegal|legal\s*secretary|bookkeeping|xero|quickbooks|digital\s*marketing|ux\/?ui|lab(oratory)?\s*technician)\b/i,
    stages: ['foundation', 'apprentice', 'graduate', 'any_early_career'],
    strength: 'high',
  },
  {
    purpose: 'technical_skill_booster',
    re: /\b(autocad|revit|solidworks|bim|excel|power\s*bi|photoshop|illustrator|premiere|after\s*effects|figma|seo|google\s*ads|analytics|cisco|ccna|iosh|lean|six\s*sigma|cad)\b/i,
    stages: ['graduate', 'apprentice', 'specialist', 'any_early_career'],
    strength: 'medium',
  },
  {
    purpose: 'cpd_add_on',
    re: /\b(safeguarding|child\s*protection|medication|moving\s*(and|&)\s*handling|infection\s*control|dementia|mental\s*health|sen|autism|gdpr|data\s*protection|behaviour\s*management|tefl)\b/i,
    stages: ['any_early_career', 'foundation', 'graduate'],
    strength: 'medium',
  },
]

/** Field family → title patterns that are clearly WIE-relevant. */
export const FIELD_INCLUDE_PATTERNS: Array<{ fieldRe: RegExp; courseRe: RegExp }> = [
  {
    fieldRe: /account|finance|banking|bookkeep/i,
    courseRe:
      /\b(aat|acca|cima|excel|xero|quickbooks|sage|bookkeeping|payroll|finance)\b/i,
  },
  {
    fieldRe: /\bit\b|technology|computer|software|cyber|data|digital/i,
    courseRe:
      /\b(comptia|aws|azure|google\s*cloud|istqb|cisco|ccna|security\+|network\+|data\s*analysis|power\s*bi|cyber|github|portfolio)\b/i,
  },
  {
    fieldRe: /engineer|construction|architecture|survey|built|civil|mechanical|electrical/i,
    courseRe:
      /\b(autocad|revit|solidworks|bim|iosh|nebosh|apm|prince2|cscs|lean|six\s*sigma|18th|ecs|project\s*management)\b/i,
  },
  {
    fieldRe: /educat|teach|school|pgce|tutor/i,
    courseRe:
      /\b(teaching\s*assistant|sen|autism|safeguarding|child\s*protection|classroom|tefl|behaviour)\b/i,
  },
  {
    fieldRe: /health|care|nurs|social\s*work|medic|paramedic/i,
    courseRe:
      /\b(care\s*certificate|safeguarding|medication|moving\s*(and|&)\s*handling|infection|health\s*and\s*social\s*care|dbs|level\s*[23].*care)\b/i,
  },
  {
    fieldRe: /market|advertis|brand|\bpr\b|communication/i,
    courseRe:
      /\b(digital\s*marketing|social\s*media|seo|google\s*ads|analytics|content\s*marketing|copywriting|power\s*bi)\b/i,
  },
  {
    fieldRe: /creative|design|art|media|animation|film|graphic/i,
    courseRe:
      /\b(photoshop|illustrator|premiere|after\s*effects|figma|ux|ui|motion|web\s*design|portfolio|adobe)\b/i,
  },
  {
    fieldRe: /admin|office|business\s*admin|secretar/i,
    courseRe:
      /\b(microsoft\s*office|excel|business\s*admin|customer\s*service|data\s*entry|bookkeeping)\b/i,
  },
  {
    fieldRe: /\blaw\b|legal|justice|paralegal/i,
    courseRe: /\b(paralegal|legal\s*assistant|legal\s*secretary|cilex|compliance|gdpr|uk\s*legal)\b/i,
  },
  {
    fieldRe: /hospitality|tourism|catering|food|nutrition|events/i,
    courseRe: /\b(food\s*(hygiene|safety)|hospitality|catering|allergen|nutrition)\b/i,
  },
  {
    fieldRe: /logistic|warehouse|supply\s*chain/i,
    courseRe: /\b(forklift|warehouse|logistics|supply\s*chain|iosh|cscs)\b/i,
  },
]

export function inferPurposeFromTitle(
  title: string,
  coursePurpose?: string | null
): { purpose: WieCoursePurpose; stages: WieUserStageFit[]; strength: 'high' | 'medium' | 'low' } {
  for (const p of PURPOSE_PATTERNS) {
    if (p.re.test(title)) {
      return { purpose: p.purpose, stages: p.stages, strength: p.strength }
    }
  }

  const purposeLower = (coursePurpose ?? '').toLowerCase()
  if (/cpd/.test(purposeLower)) {
    return { purpose: 'cpd_add_on', stages: ['any_early_career'], strength: 'low' }
  }
  if (/career\s*growth|advanced/.test(purposeLower)) {
    return {
      purpose: 'professional_pathway',
      stages: ['graduate', 'professional'],
      strength: 'medium',
    }
  }
  if (/career\s*starter|job-entry|licence/.test(purposeLower)) {
    return {
      purpose: 'career_bridge',
      stages: ['foundation', 'graduate', 'any_early_career'],
      strength: 'medium',
    }
  }
  if (/cv\s*booster/.test(purposeLower)) {
    return {
      purpose: 'technical_skill_booster',
      stages: ['any_early_career', 'graduate'],
      strength: 'medium',
    }
  }

  return {
    purpose: 'technical_skill_booster',
    stages: ['any_early_career'],
    strength: 'low',
  }
}

export function titleMatchesEducationField(
  title: string,
  educationField: string | null | undefined,
  specialism?: string | null
): boolean {
  const fieldBlob = `${educationField ?? ''} ${specialism ?? ''}`
  if (!fieldBlob.trim()) return false
  for (const row of FIELD_INCLUDE_PATTERNS) {
    if (row.fieldRe.test(fieldBlob) && row.courseRe.test(title)) return true
  }
  return false
}
