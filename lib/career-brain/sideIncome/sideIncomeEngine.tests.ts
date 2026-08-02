/**
 * JAZ Side Income Intelligence tests.
 * Run: npx tsx lib/career-brain/sideIncome/sideIncomeEngine.tests.ts
 */

import { pickNextSideIncomeQuestion, buildSideIncomeIntelligence } from './sideIncomeEngine'
import { isSideIncomePathComplete } from '../sideIncomePath'
import type { CareerBrainState, CareerProfile } from '../types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function stateWith(answers: Record<string, unknown>): CareerBrainState {
  return {
    answers: { cb_user_goal: 'side_job', cb_side_job_profile: 'employed_full', ...answers },
    career_brain_asked: Object.keys(answers).filter((k) => k.startsWith('si_')),
  }
}

const profile = {
  domain: 'admin_business',
  constraints: ['side-income-path'],
  transferableSkills: [],
} as unknown as CareerProfile

function runTests() {
  const empty = stateWith({})
  const first = pickNextSideIncomeQuestion(empty)
  assert(first.question?.id === 'si_employment' || first.question?.id === 'si_monthly_goal', `First Q: ${first.question?.id}`)

  const driving = stateWith({
    si_employment: 'employed_full',
    si_monthly_goal: '500_1000',
    si_income_timeline: '2_4_weeks',
    si_hours_week: '10_20',
    si_schedule: 'evenings',
    si_main_field: 'Office administrator',
    si_skills: ['driving', 'customer_service'],
    si_assets: ['car', 'driving_licence', 'smartphone'],
    si_work_physical: 'light_physical',
    si_work_location: 'outside',
    si_work_people: 'people',
    si_risk_tolerance: 'medium',
  })

  assert(isSideIncomePathComplete(driving), 'Driving profile should complete questioning')
  const intel = buildSideIncomeIntelligence(profile, driving)
  assert(intel !== null, 'Intelligence should build')
  const text = intel!.recommendations.map((r) => r.title + r.why).join(' ')
  assert(/delivery|private hire|uber/i.test(text), `Expected driving options: ${text}`)
  assert(!/tutoring|freelance design/i.test(text), 'Should not suggest tutoring/design without evidence')

  const designer = stateWith({
    si_employment: 'employed_part',
    si_monthly_goal: '200_500',
    si_income_timeline: '1_3_months',
    si_hours_week: '5_10',
    si_schedule: 'online_anytime',
    si_main_field: 'Graphic designer',
    si_skills: ['design', 'writing'],
    si_assets: ['computer', 'home_workspace'],
    si_work_physical: 'desk',
    si_work_location: 'home',
    si_work_people: 'independent',
    si_risk_tolerance: 'medium',
    si_professional_field: 'Brand identity and social media design',
  })

  const designIntel = buildSideIncomeIntelligence(profile, designer)
  assert(designIntel !== null, 'Designer intelligence')
  const designText = designIntel!.recommendations.map((r) => r.title + r.why).join(' ')
  assert(/freelance|consulting|content/i.test(designText), `Expected creative options: ${designText}`)
  assert(!/uber|security/i.test(designText), 'Should not suggest uber/security for home designer')

  const noSkills = stateWith({
    si_employment: 'unemployed',
    si_monthly_goal: 'under_200',
    si_income_timeline: 'this_week',
    si_hours_week: 'under_5',
    si_schedule: 'flexible',
    si_main_field: 'General worker',
    si_skills: ['none_specialist'],
    si_assets: ['none'],
    si_work_physical: 'physical',
    si_work_location: 'outside',
    si_work_people: 'mix',
    si_risk_tolerance: 'low',
  })

  const noIntel = buildSideIncomeIntelligence(profile, noSkills)
  if (noIntel) {
    const noText = noIntel.recommendations.map((r) => r.title).join(' ')
    assert(!/freelance|tutoring|consulting|content creation/i.test(noText), 'No unsupported specialist routes')
  }

  console.log('✓ JAZ Side Income engine tests passed')
}

runTests()
