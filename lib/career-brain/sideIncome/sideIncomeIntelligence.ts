/**
 * JAZ Side Income Intelligence — evidence-based final report.
 */

import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from '../types'
import { buildSideIncomeUnderstanding } from './sideIncomeUnderstanding'
import {
  evaluateSideIncomeOpportunities,
  pickBestByCategory,
  rankOpportunities,
} from './sideIncomeOpportunities'
import type { SideIncomeFinalReport, SideIncomeGrowthOutput } from './sideIncomeTypes'

function labelEmployment(v: string | null): string {
  const map: Record<string, string> = {
    employed_full: 'employed full-time',
    employed_part: 'employed part-time',
    unemployed: 'not currently employed',
    student: 'a student',
    self_employed: 'already self-employed',
  }
  return v ? map[v] ?? v.replace(/_/g, ' ') : 'unknown'
}

function labelHours(v: string | null): string {
  const map: Record<string, string> = {
    under_5: 'under 5 hours per week',
    '5_10': '5–10 hours per week',
    '10_20': '10–20 hours per week',
    '20_plus': '20+ hours per week',
  }
  return v ? map[v] ?? v : 'not specified'
}

export function buildSideIncomeFinalReport(state: CareerBrainState): SideIncomeFinalReport {
  const u = buildSideIncomeUnderstanding(state)
  const opportunities = rankOpportunities(u)
  const evaluated = evaluateSideIncomeOpportunities(u)

  const assets: string[] = []
  if (u.hasCar) assets.push('Car available for driving-based income')
  if (u.hasDrivingLicence) assets.push('UK driving licence')
  if (u.hasComputer) assets.push('Computer / laptop for remote work')
  if (u.hasHomeWorkspace) assets.push('Home workspace for freelance or online work')
  if (u.hasCapital) assets.push('Capital available for small business or reselling')
  if (u.assets.includes('professional_tools')) assets.push('Professional tools or equipment')
  if (!assets.length) assets.push('Limited physical assets reported — income options will rely on time and skills')

  const barriers: string[] = []
  if (u.hoursPerWeek === 'under_5') barriers.push('Very limited weekly hours cap realistic earnings')
  if (u.incomeTimeline === 'this_week' && !opportunities.some((o) => o.category === 'fastest')) {
    barriers.push('Urgent timeline — specialist freelance routes may be too slow to start')
  }
  if (avoidPhysicalBarrier(u)) barriers.push('Preference to avoid physical work limits driving, security, and warehouse options')
  if (u.workStyle.peopleVsIndependent === 'avoid_people') {
    barriers.push('Minimal people contact preference limits retail, tutoring, and rideshare')
  }
  if (!u.skills.length || u.skills.includes('none_specialist')) {
    barriers.push('No specialist skills reported — upside may depend on availability and general shift work')
  }
  if (!barriers.length) barriers.push('No major barriers identified from your answers')

  const skillsToDevelop: string[] = []
  if (!u.hasDrivingLicence && u.hasCar) skillsToDevelop.push('Ensure licence and insurance are valid for gig driving')
  if (u.skills.includes('tech') && !u.professionalField) {
    skillsToDevelop.push('Define a clear freelance service (e.g. landing pages, admin automation)')
  }
  if (evaluated.find((o) => o.id === 'security_sia' && !o.supported) && u.schedule === 'evenings') {
    skillsToDevelop.push('SIA licence training if you want evening security income')
  }
  if (u.teachingExperience && !opportunities.some((o) => o.id === 'tutoring')) {
    skillsToDevelop.push('DBS check and tutoring platform profile to monetise teaching experience')
  }
  skillsToDevelop.push('Track weekly hours and net pay to compare side income options accurately')

  const incomeRanges = opportunities.length
    ? opportunities.map((o) => `${o.title}: ${o.incomeRange} (confidence: ${o.confidence})`).join('\n')
    : 'Insufficient evidence to estimate ranges — more answers needed before suggesting specific options.'

  const actionPlan: string[] = []
  const fastest = pickBestByCategory(opportunities, 'fastest')
  const flexible = pickBestByCategory(opportunities, 'flexible')
  const highest = pickBestByCategory(opportunities, 'highest_potential')

  if (fastest) {
    actionPlan.push(`Research UK platforms and local employers for: ${fastest.title}`)
    actionPlan.push('Check right-to-work, tax (Self Assessment), and insurance requirements before starting')
  }
  if (flexible && flexible.id !== fastest?.id) {
    actionPlan.push(`Compare flexible option: ${flexible.title} against your main job schedule`)
  }
  if (highest && highest.id !== fastest?.id && highest.id !== flexible?.id) {
    actionPlan.push(`Build evidence for higher-upside route: ${highest.title} (portfolio, reviews, or listings)`)
  }
  if (!actionPlan.length) {
    actionPlan.push('Complete your availability and skills profile before committing to a side income route')
    actionPlan.push('List 2–3 options that match your hours — do not guess based on generic advice')
  }

  return {
    incomeProfileSummary: [
      `You are ${labelEmployment(u.employment)} seeking extra income.`,
      u.monthlyGoal ? `Target: roughly ${u.monthlyGoal.replace(/_/g, ' ')} per month.` : '',
      u.hoursPerWeek ? `Availability: ${labelHours(u.hoursPerWeek)}.` : '',
      u.schedule ? `Best times: ${u.schedule.replace(/_/g, ' ')}.` : '',
      u.mainField ? `Background: ${u.mainField}.` : '',
      `JAZ confidence: ${u.confidence}% based on ${u.questionCount} answers collected.`,
    ]
      .filter(Boolean)
      .join(' '),
    availableAssetsAnalysis: assets,
    incomeBarriers: barriers,
    fastestIncomeOption: fastest,
    mostFlexibleOption: flexible ?? fastest,
    highestPotentialOption: highest,
    recommendedSkillsToIncreaseEarnings: skillsToDevelop.slice(0, 5),
    expectedIncomeRanges: incomeRanges,
    actionPlan,
    allOpportunities: opportunities,
  }
}

function avoidPhysicalBarrier(u: ReturnType<typeof buildSideIncomeUnderstanding>): boolean {
  return u.workStyle.physicalVsDesk === 'avoid_physical' || u.workStyle.physicalVsDesk === 'desk'
}

export function buildSideIncomeIntelligence(
  profile: CareerProfile,
  state: CareerBrainState
): {
  growth: SideIncomeGrowthOutput
  recommendations: CareerBrainRecommendation[]
  reasoning: string[]
} | null {
  const u = buildSideIncomeUnderstanding(state)
  if (u.confidence < 65 && u.questionCount < 5) return null

  const report = buildSideIncomeFinalReport(state)
  const domain = profile.domain ?? 'admin_business'

  const recs: CareerBrainRecommendation[] = report.allOpportunities.slice(0, 4).map((opp, i) => ({
    title: opp.title,
    why: `${opp.why} Expected range: ${opp.incomeRange}. Confidence: ${opp.confidence}.`,
    track: i === 0 ? 'work_now' : i === 1 ? 'build_next' : 'long_term',
    field_tag: 'side_income',
    domain,
    source: 'fallback' as const,
    stepType: 'career_step' as const,
  }))

  const summaryParts = [
    report.incomeProfileSummary,
    report.fastestIncomeOption
      ? `Fastest realistic option: ${report.fastestIncomeOption.title} (${report.fastestIncomeOption.confidence} confidence).`
      : 'No fast-start option is supported by your current answers.',
    report.mostFlexibleOption
      ? `Most flexible: ${report.mostFlexibleOption.title}.`
      : '',
    report.highestPotentialOption
      ? `Highest upside: ${report.highestPotentialOption.title}.`
      : '',
  ].filter(Boolean)

  const growth: SideIncomeGrowthOutput = {
    summary: summaryParts.join(' '),
    confidence: u.confidence,
    finalReport: report,
    recommendedJobAZActions: [
      { action: 'JOB_FINDER', label: 'Search part-time roles matching your hours', href: '/job-finder' },
      { action: 'CREATE_CV', label: 'Add a skills section for freelance services', href: '/cv-builder-v2' },
    ],
  }

  return {
    growth,
    recommendations: recs,
    reasoning: [
      'JAZ Side Income Intelligence — extra income only, not a new career path.',
      `Evidence collected: ${u.questionCount} answers, ${u.confidence}% confidence.`,
      ...report.actionPlan.map((a) => `Action: ${a}`),
    ],
  }
}

export function mergeSideIncomeIntelligenceIntoOutput(
  output: import('../types').CareerBrainOutput,
  intelligence: NonNullable<ReturnType<typeof buildSideIncomeIntelligence>>,
  state: CareerBrainState
): import('../types').CareerBrainOutput {
  const { growth, recommendations } = intelligence
  const report = growth.finalReport
  const workNow = recommendations.filter((r) => r.track === 'work_now')
  const buildNext = recommendations.filter((r) => r.track === 'build_next')
  const longTerm = recommendations.filter((r) => r.track === 'long_term')

  return {
    ...output,
    recommendedPaths: {
      workNow: workNow.map((r) => ({ title: r.title, why: r.why, domain: r.domain, source: r.source })),
      buildNext: buildNext.map((r) => ({ title: r.title, why: r.why, domain: r.domain, source: r.source })),
      longTerm: longTerm.map((r) => ({ title: r.title, why: r.why, domain: r.domain, source: r.source })),
      backupIncome: [],
    },
    whyThisPath: formatSideIncomeWhyThisPath(report),
    personalizedSummary: growth.summary,
    careerLadderSummary: 'Extra income options — not a new career path',
    employabilityScore: growth.confidence,
    nextJobAZActions: growth.recommendedJobAZActions,
    practicalNextSteps: growth.recommendedJobAZActions,
    sideIncomeGrowth: growth,
    notRecommended: [
      {
        title: 'Generic side hustle suggestions',
        reason:
          'Excluded — JAZ only recommends side income options supported by your reported skills, assets, hours, and preferences.',
      },
    ],
    reasoning: [...output.reasoning, ...intelligence.reasoning],
  }
}

export function formatSideIncomeWhyThisPath(report: SideIncomeFinalReport): string {
  return [
    'Income Profile Summary',
    report.incomeProfileSummary,
    '',
    'Available Assets',
    ...report.availableAssetsAnalysis.map((a) => `• ${a}`),
    '',
    'Income Barriers',
    ...report.incomeBarriers.map((b) => `• ${b}`),
    '',
    'Fastest Income Option',
    report.fastestIncomeOption
      ? `${report.fastestIncomeOption.title} — ${report.fastestIncomeOption.why}\n${report.fastestIncomeOption.incomeRange}`
      : 'None supported by current evidence.',
    '',
    'Most Flexible Option',
    report.mostFlexibleOption
      ? `${report.mostFlexibleOption.title} — ${report.mostFlexibleOption.why}`
      : 'None supported by current evidence.',
    '',
    'Highest Income Potential',
    report.highestPotentialOption
      ? `${report.highestPotentialOption.title} — ${report.highestPotentialOption.why}`
      : 'None supported by current evidence.',
    '',
    'Recommended Skills To Increase Earnings',
    ...report.recommendedSkillsToIncreaseEarnings.map((s, i) => `${i + 1}. ${s}`),
    '',
    'Expected Income Ranges',
    report.expectedIncomeRanges,
    '',
    'Action Plan',
    ...report.actionPlan.map((a, i) => `${i + 1}. ${a}`),
  ].join('\n')
}
