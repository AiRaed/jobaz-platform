import { buildExtraIncomeResult } from '../lib/career-engine/extra-income/decisionEngine.ts'
import { EXTRA_INCOME_QUESTIONS } from '../lib/career-engine/conversation/pathQuestions.ts'
import { getCareerEnginePath } from '../lib/career-engine/conversation/pathRegistry.ts'

const config = getCareerEnginePath('side_job')
if (!config.hasStructuredResult) throw new Error('side_job must have structured result')

const skillsQ = EXTRA_INCOME_QUESTIONS.find((q) => q.id === 'side_skills')
if (!skillsQ?.allowMultiple) throw new Error('side_skills must be multi-select')
if ((skillsQ.options?.length ?? 0) < 15) throw new Error('side_skills list must be expanded')

const result = buildExtraIncomeResult({
  side_profile: 'employed_full',
  side_hours: '10_20',
  side_schedule: 'evenings_weekends',
  side_income_goal: '500_1000',
  side_skills: 'driving,hospitality',
})

if (result.pathId !== 'side_job') throw new Error('wrong pathId')
if (result.location !== 'UK-wide') throw new Error('Phase 1 should default location to UK-wide')
if (EXTRA_INCOME_QUESTIONS.some((q) => q.id === 'preferred_location')) {
  throw new Error('Phase 1 Extra Income must not ask preferred_location')
}
if (!result.immediateOpportunities.length) throw new Error('missing immediate opportunities')
if (!result.qualifications.length) throw new Error('missing qualifications')
if (!result.longTermStreams.length) throw new Error('missing long-term streams')
if (!result.earnings.immediate.label.includes('£')) throw new Error('missing earnings estimate')
if (result.actionPlan.length !== 4) throw new Error('expected 4-week action plan')

const top = result.immediateOpportunities[0]
if (!top.whyMatch || !top.hourlyPay || !top.monthlyEstimate) {
  throw new Error('opportunity cards must include why, pay, and monthly estimate')
}
if (!top.matchReasons?.length || top.matchReasons.length < 3) {
  throw new Error('opportunity must include 3+ match reasons')
}
if (!top.startTimeline || !top.difficulty || !top.hiringDemand) {
  throw new Error('opportunity must include start timeline, difficulty, and hiring demand')
}
if (!result.fastestPath?.lines?.length) {
  throw new Error('missing Your Fastest Path summary')
}
if (top.officialUrl != null && top.officialUrl !== null) {
  // allow null only — no hardcoded affiliate links
}
if (top.affiliateUrl) throw new Error('must not hardcode affiliate URLs')

const qual = result.qualifications[0]
if (!qual.cost || !qual.studyTime || !qual.averageIncrease) {
  throw new Error('qualifications must include cost, study time, and pay boost')
}

console.log('OK Extra Income money-making roadmap')
console.log(`  top job: ${top.title} (${top.monthlyEstimate})`)
console.log(`  earnings: ${result.earnings.immediate.label} → ${result.earnings.after12Months.label}`)
console.log(`  quals: ${result.qualifications.map((q) => q.title).join(', ')}`)
