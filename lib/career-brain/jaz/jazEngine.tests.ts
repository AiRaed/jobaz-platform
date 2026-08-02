/**
 * JAZ dynamic career questioning tests.
 * Run: npx tsx lib/career-brain/jaz/jazEngine.tests.ts
 */

import { pickNextJazQuestion, mapJazAnswersToGrowCareerState } from './jazEngine'
import { inferProfessionProgression } from './jazProfessionProgression'
import { buildJazUnderstanding } from './jazUnderstanding'
import { buildGrowCareerIntelligence } from '../growCareerIntelligence'
import { buildCurrentPositionSummary } from '../growCareerGrowthAdvisor'
import { isGrowCareerPathComplete } from '../growCareerPath'
import type { CareerBrainState, CareerProfile } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function stateWith(answers: Record<string, unknown>): CareerBrainState {
  return {
    answers: { cb_user_goal: 'grow_career', ...answers },
    career_brain_asked: Object.keys(answers),
  }
}

function runTests() {
  const empty = stateWith({})
  const first = pickNextJazQuestion(empty)
  assert(first.question?.id === 'jaz_goal', `First question should be goal, got ${first.question?.id}`)

  const withGoal = stateWith({ jaz_goal: 'promotion' })
  const second = pickNextJazQuestion(withGoal)
  assert(second.question?.id === 'jaz_job_title', `Second question should be job title, got ${second.question?.id}`)

  const ta = stateWith({ jaz_goal: 'promotion', jaz_job_title: 'Teaching Assistant' })
  const taPick = pickNextJazQuestion(ta)
  assert(
    taPick.question?.id === 'jaz_edu_qualification' || taPick.question?.id === 'jaz_edu_responsibilities',
    `TA should get education question, got ${taPick.question?.id}`
  )

  const dev = stateWith({ jaz_goal: 'promotion', jaz_job_title: 'Software Developer' })
  const devPick = pickNextJazQuestion(dev)
  assert(devPick.question?.id === 'jaz_tech_stack', `Developer should get stack question, got ${devPick.question?.id}`)

  const nearlyComplete = stateWith({
    jaz_job_title: 'Mechanical Engineer',
    jaz_eng_qualification: 'degree',
    jaz_eng_specialism: 'design',
    jaz_eng_progression: 'senior_engineer',
    jaz_years: '3_5',
    jaz_level: 'mid',
    jaz_goal: 'promotion',
    jaz_blockers: ['qualification'],
    jaz_strengths: ['technical_skills', 'problem_solving'],
    jaz_study: 'yes',
    jaz_dev_time: '3_12_months',
    jaz_leadership: 'yes',
    jaz_employer: 'maybe',
  })
  const u = buildJazUnderstanding(nearlyComplete)
  assert(u.confidence >= 80, `Expected confidence >= 80, got ${u.confidence}`)
  assert(isGrowCareerPathComplete(nearlyComplete), 'Should finalize at 80%+ confidence')

  const mapped = mapJazAnswersToGrowCareerState(nearlyComplete)
  assert(mapped.answers?.currentJobTitle === 'Mechanical Engineer', 'Maps job title')
  assert(mapped.answers?.cb_grow_field === 'engineering', 'Infers engineering field')
  assert(mapped.answers?.cb_grow_years === '3_5', 'Maps years')

  const taState = stateWith({
    jaz_goal: 'promotion',
    jaz_job_title: 'Teaching Assistant',
    jaz_edu_qualification: 'none',
    jaz_edu_responsibilities: ['sen', '1to1'],
    jaz_edu_progression: 'teacher',
    jaz_edu_seniority: 'ta',
    jaz_years: '3_5',
    jaz_blockers: ['qualification'],
    jaz_strengths: ['communication'],
    jaz_study: 'yes',
    jaz_dev_time: '3_12_months',
    jaz_leadership: 'yes',
    jaz_employer: 'maybe',
  })
  const taProgression = inferProfessionProgression(taState)
  assert(taProgression !== null, 'TA progression')
  assert(/level 3|hlta/i.test(taProgression!.buildNextTitle), `TA build next: ${taProgression!.buildNextTitle}`)
  assert(!/warehouse|retail/i.test(taProgression!.longTermTitle), 'TA long term stays in education')

  const taEarlyCareer = stateWith({
    jaz_goal: 'leadership',
    jaz_job_title: 'Teaching Assistant',
    jaz_edu_qualification: 'none',
    jaz_edu_responsibilities: ['1to1'],
    jaz_edu_progression: 'leadership',
    jaz_edu_seniority: 'ta',
    jaz_years: '0_1',
    jaz_blockers: ['qualification'],
    jaz_strengths: ['communication'],
    jaz_study: 'yes',
    jaz_dev_time: '3_12_months',
    jaz_leadership: 'not_sure',
    jaz_employer: 'maybe',
  })
  const mappedTa = mapJazAnswersToGrowCareerState(taEarlyCareer)
  assert(mappedTa.answers?.cb_grow_level === 'entry' || mappedTa.answers?.cb_grow_level === 'junior', 'Early TA maps to entry/junior level')
  const summary = buildCurrentPositionSummary(mappedTa)
  assert(/early-career teaching assistant/i.test(summary), `Summary should say early-career: ${summary}`)
  assert(!/experienced teaching assistant/i.test(summary), 'Must not label <1 year as experienced')

  const profile = {
    domain: 'education_training',
    constraints: ['grow-career-path'],
    transferableSkills: [],
  } as unknown as CareerProfile
  assert(isGrowCareerPathComplete(taEarlyCareer), 'TA early career should be complete enough for results')
  const intelligence = buildGrowCareerIntelligence(profile, taEarlyCareer)
  assert(intelligence !== null, 'TA intelligence should build')
  const report = intelligence!.growth.finalReport
  assert(report !== undefined, 'Expected final report')
  assert(/teaching assistant/i.test(report!.workNow), `Work now: ${report!.workNow}`)
  assert(/level 3|hlta/i.test(report!.buildNext), `Build next: ${report!.buildNext}`)
  assert(!/warehouse|retail|hospitality/i.test(`${report!.workNow} ${report!.buildNext} ${report!.longTermPath}`), 'No generic fallback jobs')

  const taLeadership = stateWith({
    jaz_goal: 'leadership',
    jaz_job_title: 'Teaching Assistant',
    jaz_edu_qualification: 'none',
    jaz_edu_responsibilities: ['1to1'],
    jaz_edu_progression: 'leadership',
    jaz_edu_seniority: 'ta',
    jaz_years: '1_3',
    jaz_blockers: ['qualification'],
    jaz_strengths: ['communication'],
    jaz_study: 'yes',
    jaz_dev_time: '3_12_months',
    jaz_leadership: 'not_sure',
    jaz_employer: 'maybe',
  })
  const leadershipIntel = buildGrowCareerIntelligence(profile, taLeadership)
  assert(leadershipIntel !== null, 'Leadership TA intelligence')
  assert(
    leadershipIntel!.growth.promotionReadinessScore >= 45 &&
      leadershipIntel!.growth.promotionReadinessScore <= 70,
    `Promotion readiness should be 45-70 for TA with qual gap, got ${leadershipIntel!.growth.promotionReadinessScore}`
  )
  assert(
    (leadershipIntel!.growth.careerConfidenceScore ?? 0) >= 55,
    `Career confidence should reflect answer quality, got ${leadershipIntel!.growth.careerConfidenceScore}`
  )
  const workNowRecs = leadershipIntel!.recommendations.filter((r) => r.track === 'work_now')
  const workNowTitles = workNowRecs.map((r) => r.title)
  assert(
    new Set(workNowTitles.map((t) => t.toLowerCase())).size === workNowTitles.length,
    `Work now roles must not duplicate: ${workNowTitles.join(', ')}`
  )
  assert(
    (leadershipIntel!.growth.progressionRoutes?.length ?? 0) >= 3,
    'Expected at least 3 education progression routes'
  )
  assert(
    Boolean(leadershipIntel!.growth.recommendedQualification?.qualification.includes('Level 3')),
    'Expected Level 3 TA qualification recommendation'
  )
  const recTitles = leadershipIntel!.recommendations.map((r) => r.title).join(' ')
  assert(/sen support|learning support|teaching assistant/i.test(recTitles), `Work now paths: ${recTitles}`)
  assert(!/warehouse|retail|hospitality/i.test(recTitles), 'No generic fallback')

  const softwareIc = stateWith({
    jaz_goal: 'specialist',
    jaz_job_title: 'Junior Developer',
    jaz_tech_stack: 'javascript',
    jaz_tech_architecture: 'some',
    jaz_tech_progression: 'senior_ic',
    jaz_tech_seniority: 'graduate',
    jaz_years: '1_3',
    jaz_blockers: ['technical_skills'],
    jaz_study: 'yes',
  })
  const softwareIntel = buildGrowCareerIntelligence(profile, softwareIc)
  assert(softwareIntel !== null, 'Software IC intelligence')
  const swProgression = inferProfessionProgression(softwareIc)
  assert(swProgression !== null, 'Software progression')
  assert(
    /mid-level developer/i.test(swProgression!.buildNextTitle),
    `Junior should next be Mid-Level, got ${swProgression!.buildNextTitle}`
  )
  assert(
    !/engineering manager|head of engineering/i.test(
      `${swProgression!.buildNextTitle} ${swProgression!.longTermTitle} ${softwareIntel!.recommendations.map((r) => r.title + r.why).join(' ')}`
    ),
    'IC track must not suggest engineering management'
  )
  const swWorkNow = softwareIntel!.recommendations.filter((r) => r.track === 'work_now').map((r) => r.title)
  assert(swWorkNow.length >= 2, `Expected multiple Work Now roles, got ${swWorkNow.join(', ')}`)
  assert(
    !/classroom|school progression|education pathway/i.test(
      softwareIntel!.recommendations.map((r) => r.why).join(' ')
    ),
    'Software output must not contain education template language'
  )

  console.log('✓ JAZ engine tests passed')
}

runTests()
