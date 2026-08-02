/**
 * Career domain detection — field-first routing for questions and recommendations.
 */

import type { CareerDomain, CareerProfile } from './types'

export const SPECIALIST_DOMAINS: ReadonlySet<CareerDomain> = new Set([
  'animation_design',
  'creative_media',
  'IT_digital',
  'healthcare',
  'finance_accounting',
  'education_training',
  'construction_trades',
  'driving_logistics',
  'care_support',
])

const DOMAIN_RULES: Array<{
  domain: CareerDomain
  re: RegExp
  weight: number
}> = [
  {
    domain: 'animation_design',
    re: /\b(animat(or|ion)|maya|after\s*effects|motion\s*graphics|blender|cinema\s*4d|3d\s*artist|showreel)\b/i,
    weight: 10,
  },
  {
    domain: 'creative_media',
    re: /\b(graphic\s*design|video\s*edit|illustrator|photoshop|figma|ui\/ux|creative\s*studio|content\s*design)\b/i,
    weight: 8,
  },
  {
    domain: 'IT_digital',
    re: /\b(developer|software|programmer|javascript|python|react|full[\s-]?stack|it\s*support|qa\s*test)\b/i,
    weight: 8,
  },
  {
    domain: 'finance_accounting',
    re: /\b(accounting|accountant|bookkeep|audit|finance\s*degree|acca|aia)\b/i,
    weight: 9,
  },
  {
    domain: 'healthcare',
    re: /\b(nurse|nursing|midwife|doctor|clinical|hospital\s*ward)\b/i,
    weight: 9,
  },
  {
    domain: 'care_support',
    re: /\b(care\s*worker|care\s*assistant|support\s*worker|domiciliary|residential\s*care)\b/i,
    weight: 8,
  },
  {
    domain: 'driving_logistics',
    re: /\b(taxi|uber|delivery\s*driver|courier|hgv|van\s*driver|private\s*hire|logistics\s*driver)\b/i,
    weight: 9,
  },
  {
    domain: 'education_training',
    re: /\b(teacher|teaching|tutor|pgce|classroom|lecturer|training\s*assessor)\b/i,
    weight: 8,
  },
  {
    domain: 'construction_trades',
    re: /\b(construction|builder|plumber|electrician|carpenter|bricklayer|site\s*operative)\b/i,
    weight: 8,
  },
  {
    domain: 'hospitality',
    re: /\b(chef|kitchen|waiter|waitress|barista|hotel|restaurant|hospitality)\b/i,
    weight: 7,
  },
  {
    domain: 'retail_customer_service',
    re: /\b(retail|shop\s*assistant|customer\s*service|call\s*centre|sales\s*assistant)\b/i,
    weight: 6,
  },
  {
    domain: 'admin_business',
    re: /\b(admin|administrator|office\s*assistant|reception|business\s*support|data\s*entry)\b/i,
    weight: 6,
  },
]

const FORBIDDEN_PRIMARY_FOR_SPECIALIST =
  /\b(construction|warehouse|maintenance|transport\s*operative|admin\s*assistant|cleaner\s*operative)\b/i

export function detectCareerDomain(text: string, profile?: Partial<CareerProfile>): {
  domain: CareerDomain
  confidence: number
} {
  const blob = [
    text,
    profile?.studyField,
    profile?.workExperienceField,
    profile?.targetField,
    ...(profile?.toolsAndSkills ?? []),
    ...(profile?.detectedRoles ?? []),
  ]
    .filter(Boolean)
    .join(' ')

  if (
    /\b(no\s+experience|never\s+worked|first\s+job|no\s+education|no\s+qualifications)\b/i.test(blob) &&
    !/\b(studied|degree|worked|years?)\b/i.test(blob)
  ) {
    return { domain: 'no_experience_general', confidence: 0.75 }
  }

  const scores = new Map<CareerDomain, number>()
  for (const rule of DOMAIN_RULES) {
    if (rule.re.test(blob)) {
      scores.set(rule.domain, (scores.get(rule.domain) ?? 0) + rule.weight)
    }
  }

  if (profile?.wantsCareerChange && profile?.studyField?.match(/account|finance/i)) {
    scores.set('finance_accounting', (scores.get('finance_accounting') ?? 0) + 5)
  }

  let best: CareerDomain = 'no_experience_general'
  let bestScore = 0
  for (const [domain, score] of scores) {
    if (score > bestScore) {
      bestScore = score
      best = domain
    }
  }

  if (bestScore === 0) {
    if (
      profile?.educationLevel === 'none' ||
      profile?.yearsOfExperience === 0 ||
      (!profile?.studyField && !profile?.workExperienceField)
    ) {
      return { domain: 'no_experience_general', confidence: 0.55 }
    }
    return { domain: 'no_experience_general', confidence: 0.35 }
  }

  const confidence = Math.min(0.95, 0.45 + bestScore / 20)
  return { domain: best, confidence }
}

export function isFieldFirstMode(profile: CareerProfile): boolean {
  if (profile.constraints.includes('field-only-mode')) return true
  if (profile.constraints.includes('any-job-ok')) return false
  if (profile.constraints.includes('flexible-employment-mode')) return false
  if (profile.constraints.includes('deprioritise-study-alignment')) return false
  if (profile.wantsCareerChange === true) return false
  if (profile.wantsSameField === false) return false
  if (profile.urgencyLevel === 'high' && profile.wantsSameField !== true) return false
  if (SPECIALIST_DOMAINS.has(profile.domain)) return true
  if (profile.studyField || profile.workExperienceField) {
    return profile.domain !== 'no_experience_general' && profile.domain !== 'retail_customer_service'
  }
  return false
}

export function isGenericJobTitle(title: string): boolean {
  return FORBIDDEN_PRIMARY_FOR_SPECIALIST.test(title)
}

export function domainLabel(domain: CareerDomain): string {
  const labels: Record<CareerDomain, string> = {
    animation_design: 'animation & motion design',
    creative_media: 'creative & media',
    IT_digital: 'IT & digital',
    healthcare: 'healthcare',
    driving_logistics: 'driving & logistics',
    admin_business: 'admin & business support',
    finance_accounting: 'finance & accounting',
    education_training: 'education & training',
    construction_trades: 'construction & trades',
    hospitality: 'hospitality',
    retail_customer_service: 'retail & customer service',
    care_support: 'care & support work',
    no_experience_general: 'entry-level UK work',
  }
  return labels[domain]
}
