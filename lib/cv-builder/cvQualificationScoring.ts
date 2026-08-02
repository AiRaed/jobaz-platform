import type { CvTrainingQualification } from './trainingQualifications'

export type EnrichedCvQualification = CvTrainingQualification & {
  scoreBoost: number
  valueCopy: string
  ctaLabel: string
}

export type CvQualificationScoreSummary = {
  currentScore: number
  potentialScore: number
  remainingBoost: number
  items: EnrichedCvQualification[]
}

/** Estimated CV Score lift when this qualification is completed and reflected on the CV. */
export function estimateQualificationCvBoost(qual: CvTrainingQualification): number {
  if (qual.status === 'completed') return 0

  const name = qual.name.trim()

  if (/enic|qualification recognition|uk qualification/i.test(name)) return 6
  if (/\b(AAT|bookkeeping)\b/i.test(name)) return 12
  if (/\b(ACCA|CIMA|ICAEW|ACA|CFA|CPA|chartered)\b/i.test(name)) return 12
  if (/advanced excel|microsoft excel|\bexcel\b/i.test(name)) return 8
  if (/sage|xero|quickbooks/i.test(name)) return 7
  if (qual.type === 'licence' || /dbs|sia|cscs/i.test(name)) return 9
  if (qual.sectionTier === 'required_first') return 7
  if (qual.sectionTier === 'professional_qualifications') return 10
  if (qual.type === 'course') return 6
  return 5
}

export function getQualificationValueCopy(qual: CvTrainingQualification): string {
  const generic = /builds skills employers expect|check provider/i
  if (qual.expectedImpact && !generic.test(qual.expectedImpact)) {
    return qual.expectedImpact
  }

  const name = qual.name.trim()
  if (/enic|qualification recognition|uk qualification/i.test(name)) {
    return 'Helps UK employers understand overseas qualifications.'
  }
  if (/\b(AAT|bookkeeping)\b/i.test(name)) {
    return 'Recognised UK bookkeeping qualification preferred by employers.'
  }
  if (/advanced excel|microsoft excel|\bexcel\b/i.test(name)) {
    return 'Frequently requested in finance and accounting interviews.'
  }
  if (/\b(ACCA|CIMA|ICAEW|ACA)\b/i.test(name)) {
    return 'Professional body route that senior finance employers expect in the UK.'
  }
  if (qual.type === 'licence') {
    return 'Required before you can legally work in regulated UK roles.'
  }
  if (qual.sectionTier === 'required_first') {
    return 'Closes a gap your AI plan flagged before you can compete for target roles.'
  }
  return 'Strengthens your profile for roles matched to your career goal.'
}

export function getQualificationCtaLabel(qual: CvTrainingQualification): string {
  if (qual.status === 'completed') return 'Completed'
  if (qual.status === 'in_progress') return 'Continue'

  const name = qual.name.trim()
  if (/enic|qualification recognition|uk qualification/i.test(name)) return 'Learn More'
  if (/\b(ACCA|CIMA|ICAEW|ACA|AAT|CFA|CPA|chartered)\b/i.test(name)) return 'Begin Qualification'
  if (qual.type === 'licence') return 'Check Eligibility'
  if (qual.type === 'course' || qual.actionLabel === 'Start Course') return 'Start Course'
  return qual.actionLabel ?? 'View Course'
}

function sortQualifications(items: EnrichedCvQualification[]): EnrichedCvQualification[] {
  const tierRank = (q: EnrichedCvQualification) => {
    if (q.status === 'completed') return 3
    if (q.sectionTier === 'required_first') return 0
    if (q.sectionTier === 'professional_qualifications') return 1
    return 2
  }

  return [...items].sort((a, b) => {
    const ta = tierRank(a)
    const tb = tierRank(b)
    if (ta !== tb) return ta - tb
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (b.status === 'completed' && a.status !== 'completed') return -1
    return b.scoreBoost - a.scoreBoost
  })
}

export function enrichQualificationsForCvPanel(
  qualifications: CvTrainingQualification[],
  currentCvScore: number
): CvQualificationScoreSummary {
  const items = qualifications.map((q) => ({
    ...q,
    scoreBoost: estimateQualificationCvBoost(q),
    valueCopy: getQualificationValueCopy(q),
    ctaLabel: getQualificationCtaLabel(q),
  }))

  const remainingBoost = items
    .filter((q) => q.status !== 'completed')
    .reduce((sum, q) => sum + q.scoreBoost, 0)

  const potentialScore = Math.min(100, currentCvScore + remainingBoost)

  return {
    currentScore: currentCvScore,
    potentialScore,
    remainingBoost,
    items: sortQualifications(items),
  }
}
