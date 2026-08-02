import type { RouteRequirement, TrainingSectionTier } from './types'

const PROFESSIONAL_BODY = /\b(ACCA|CIMA|ICAEW|ACA|AAT|CFA|CPA|chartered|professional qualification)\b/i
const REQUIRED_FIRST = /enic|qualification recognition|uk qualification|dbs|sia|cscs|licence|license|care certificate|safeguarding|first aid|advanced excel|microsoft excel|\bexcel\b/i

export function getTrainingActionLabel(req: RouteRequirement): string {
  const name = req.name.trim()
  if (req.status === 'completed') return 'View Course'
  if (req.status === 'in_progress') return 'Continue'

  if (/enic|qualification recognition|uk qualification/i.test(name)) return 'Check Eligibility'
  if (PROFESSIONAL_BODY.test(name)) return 'Begin Qualification'
  if (req.type === 'licence') return 'Check Eligibility'
  if (req.source === 'recommended_course' || req.type === 'course') return 'Start Course'
  return 'View Course'
}

export function categorizeTrainingTier(req: RouteRequirement): TrainingSectionTier {
  const name = req.name.trim()

  if (REQUIRED_FIRST.test(name) || req.type === 'licence') return 'required_first'
  if (
    PROFESSIONAL_BODY.test(name) ||
    req.source === 'essential_action' ||
    (req.required && req.type === 'certification')
  ) {
    return 'professional_qualifications'
  }
  return 'future_development'
}

export const TRAINING_SECTION_LABELS: Record<TrainingSectionTier, string> = {
  required_first: 'Required First',
  professional_qualifications: 'Professional Qualifications',
  future_development: 'Future Development',
}

export const TRAINING_SECTION_ORDER: TrainingSectionTier[] = [
  'required_first',
  'professional_qualifications',
  'future_development',
]

export function groupRequirementsBySection(
  requirements: RouteRequirement[]
): Array<{ tier: TrainingSectionTier; label: string; items: RouteRequirement[] }> {
  const buckets: Record<TrainingSectionTier, RouteRequirement[]> = {
    required_first: [],
    professional_qualifications: [],
    future_development: [],
  }

  for (const req of requirements) {
    buckets[categorizeTrainingTier(req)].push(req)
  }

  return TRAINING_SECTION_ORDER.filter((tier) => buckets[tier].length > 0).map((tier) => ({
    tier,
    label: TRAINING_SECTION_LABELS[tier],
    items: buckets[tier],
  }))
}
