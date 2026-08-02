/**
 * Career change pathway tests.
 * Run: npx tsx lib/career-brain/careerChangeEngine.tests.ts
 */

import { buildCareerChangeTransitionPlan } from './careerChangeEngine'
import { isCareerChangePathComplete } from './careerChangePath'
import type { CareerProfile } from './types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const profile = {
  domain: 'admin_business',
  constraints: ['career-change-path'],
  transferableSkills: [],
} as unknown as CareerProfile

const hospitalityMarketing = {
  answers: {
    cb_user_goal: 'career_change',
    cb_change_current_field: 'hospitality',
    cb_change_experience_years: '3_5',
    cb_change_reason: 'opportunities',
    cb_change_target_field: 'marketing',
    cb_change_study_willing: 'yes',
    cb_change_retrain_time: '3_12_months',
    cb_change_salary_reduction: 'yes',
  },
}

function runTests() {
  assert(isCareerChangePathComplete(hospitalityMarketing), 'path complete')
  const plan = buildCareerChangeTransitionPlan(profile, hospitalityMarketing)
  assert(plan.transferableSkills.length >= 4 && plan.transferableSkills.length <= 6, 'transferable skills 4-6')
  assert(plan.workNow.length === 3, 'three work now roles')
  assert(plan.longTerm.length === 3, 'three long term roles')
  assert(/marketing/i.test(plan.workNow[0].title), plan.workNow[0].title)
  assert(plan.transferableSkills.some((s) => /customer communication/i.test(s)), 'hospitality skills')
  assert(plan.currentField.toLowerCase().includes('hospitality'), plan.currentField)
  assert(plan.targetField.toLowerCase().includes('marketing'), plan.targetField)
  assert(plan.transitionReadinessScore >= 50 && plan.transitionReadinessScore <= 92, 'readiness score')
  assert(plan.buildNextPath.milestones.length >= 3, 'build milestones')
  assert(!plan.longTerm.some((r) => /software developer/i.test(r.title)), 'marketing path long term')
  assert(plan.workNow.every((r) => r.expectedSalary), 'work now salary bands')
  assert(plan.timelinePhases.length === 3, 'timeline phases')

  const engineeringMarketing = {
    answers: {
      ...hospitalityMarketing.answers,
      cb_change_current_field: 'engineering',
      cb_change_target_field: 'marketing',
    },
  }
  const plan2 = buildCareerChangeTransitionPlan(profile, engineeringMarketing)
  assert(
    plan2.transferableSkills.some((s) => /analytical thinking/i.test(s)),
    `engineering skills: ${plan2.transferableSkills.join(', ')}`
  )

  const lawTechnology = {
    answers: {
      ...hospitalityMarketing.answers,
      cb_change_current_field: 'law',
      cb_change_target_field: 'technology',
    },
  }
  const planLawTech = buildCareerChangeTransitionPlan(profile, lawTechnology)
  assert(planLawTech.transitionDifficulty === 'Medium', `law→tech difficulty: ${planLawTech.transitionDifficulty}`)
  assert(
    !planLawTech.longTerm.some((r) => /software developer/i.test(r.title)),
    'tech long term stays infrastructure/security'
  )
  assert(planLawTech.workNow.every((r) => r.why.includes('Why it fits')), 'work now why blocks')

  const hospitalityTechnology = {
    answers: {
      ...hospitalityMarketing.answers,
      cb_change_current_field: 'hospitality',
      cb_change_target_field: 'technology',
      cb_change_study_willing: 'no',
      cb_change_retrain_time: '1_3_months',
    },
  }
  const planHard = buildCareerChangeTransitionPlan(profile, hospitalityTechnology)
  assert(planHard.transitionDifficulty === 'Hard', `hospitality→tech difficulty: ${planHard.transitionDifficulty}`)
  assert(planHard.realityCheck.length > 40, 'reality check present')

  console.log('✓ career change engine tests passed')
}

runTests()
