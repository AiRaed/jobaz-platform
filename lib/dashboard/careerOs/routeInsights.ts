import type { AssessmentBundle } from './planFromAssessment'
import type { PlanActivitySignals, RouteInsightCards } from './types'

const BLOCKED_PATTERNS = [
  /^cb_/i,
  /WHY THIS PATH/i,
  /YOUR NEXT STEPS/i,
  /assessment_type/i,
  /rule_result/i,
  /career_brain/i,
  /^\{.*\}$/,
]

function isBlocked(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 90) return true
  return BLOCKED_PATTERNS.some((p) => p.test(t))
}

function clean(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[-•*]\s*/, '')
    .trim()
}

function uniqueShort(items: string[], limit: number): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of items) {
    const t = clean(raw)
    if (!t || isBlocked(t) || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t.length > 60 ? `${t.slice(0, 57)}…` : t)
    if (out.length >= limit) break
  }
  return out
}

const INTEREST_LABELS: Record<string, string> = {
  people: 'Matches your interest in helping people',
  hands_on: 'Matches your hands-on work preference',
  driving: 'Matches your interest in driving roles',
  office: 'Matches your office and admin strengths',
  healthcare_education: 'Matches your care and education interests',
  business: 'Matches your business and independence goals',
}

function whyFromAssessment(bundle: AssessmentBundle): string[] {
  const items: string[] = []
  const uk = bundle.brain?.ukTransitionGrowth?.finalReport
  const answers = (bundle.aiState?.answers ?? {}) as Record<string, unknown>
  const interest = String(answers.ntuk_interest_area ?? '')
  if (interest && INTEREST_LABELS[interest]) items.push(INTEREST_LABELS[interest]!)

  if (uk?.categoryExplanation && !isBlocked(uk.categoryExplanation)) {
    items.push(clean(uk.categoryExplanation))
  }

  const pathReasons = bundle.brain?.pathConfidence?.map((p) => p.reason).filter(Boolean) ?? []
  items.push(...pathReasons.filter((r): r is string => Boolean(r && !isBlocked(r))))

  const dirWhy = bundle.ruleResult.work_now?.directions?.[0]?.why ?? []
  items.push(...dirWhy)

  if (uk?.fastestRouteIntoWork && uk.fastestRouteIntoWork.length < 70) {
    items.push('Accessible entry requirements')
  }

  items.push('Strong UK demand in this sector', 'Good long-term progression')

  return uniqueShort(items, 4)
}

function bringFromAssessment(bundle: AssessmentBundle): string[] {
  const items: string[] = []
  const uk = bundle.brain?.ukTransitionGrowth?.finalReport
  if (uk?.whatYouBring?.length) items.push(...uk.whatYouBring)

  const skills = bundle.brain?.careerProfile?.transferableSkills ?? []
  items.push(...skills.slice(0, 3))

  const strengths = bundle.brain?.growCareerGrowth?.readinessStrengths ?? []
  items.push(...strengths.slice(0, 2))

  if (bundle.brain?.careerProfile?.englishLevel && bundle.brain.careerProfile.englishLevel !== 'basic') {
    items.push('Communication ability')
  }

  items.push('Motivation to progress', 'Long-term career focus')

  return uniqueShort(items, 4)
}

function improveFromAssessment(bundle: AssessmentBundle, signals: PlanActivitySignals): string[] {
  const items: string[] = []

  const barriers = bundle.brain?.mainBarriers ?? []
  items.push(...barriers.slice(0, 2))

  const gaps = bundle.brain?.missingSkills ?? []
  items.push(...gaps.slice(0, 2))

  const profile = bundle.brain?.careerProfile
  if (!profile?.yearsOfExperience || profile.yearsOfExperience === 0) {
    items.push('UK work experience')
  }

  if (!signals.hasBaseCv || signals.cvQualityScore < 55) {
    items.push('Professional CV')
  }

  if (signals.interviewConfidence < 55) {
    items.push('Interview confidence')
  }

  const english = bundle.brain?.englishDevelopmentPlan
  if (english?.limitations?.length) {
    items.push('Workplace English practice')
  }

  return uniqueShort(items, 4)
}

export function buildRouteInsightCards(
  bundle: AssessmentBundle,
  signals: PlanActivitySignals
): RouteInsightCards {
  return {
    whyThisRoute: whyFromAssessment(bundle),
    whatYouBring: bringFromAssessment(bundle),
    areasToImprove: improveFromAssessment(bundle, signals),
  }
}
