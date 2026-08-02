/**
 * Grow career pathway tests.
 * Run: npx tsx lib/career-brain/growCareerEngine.tests.ts
 */

import { buildGrowCareerGrowthPlan } from './growCareerEngine'
import { isGrowCareerPathComplete } from './growCareerPath'
import type { CareerProfile } from './types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const profile = {
  domain: 'creative_media',
  constraints: ['grow-career-path'],
  transferableSkills: [],
} as unknown as CareerProfile

const motionDesignerJunior = {
  answers: {
    cb_user_goal: 'grow_career',
    cb_grow_field: 'creative_media',
    currentJobTitle: 'Motion Designer',
    cb_grow_years: '1_3',
    cb_grow_level: 'junior',
    cb_grow_goal: 'promotion',
    cb_grow_blocker: ['weak_cv'],
    cb_grow_study_willing: 'yes',
    cb_grow_dev_time: '3_12_months',
    cb_grow_leadership_ready: 'yes',
    cb_grow_employer_change: 'maybe',
    coreSkills: ['design', 'problem_solving', 'technical_skills'],
  },
}

const mechanicalEngineerJunior = {
  answers: {
    cb_user_goal: 'grow_career',
    cb_grow_field: 'engineering',
    currentJobTitle: 'Mechanical Engineer',
    cb_grow_years: '1_3',
    cb_grow_level: 'junior',
    cb_grow_goal: 'promotion',
    cb_grow_blocker: ['qualification'],
    cb_grow_study_willing: 'yes',
    cb_grow_dev_time: '3_12_months',
    cb_grow_leadership_ready: 'not_sure',
    cb_grow_employer_change: 'no',
    coreSkills: ['technical_skills', 'problem_solving', 'analysis'],
  },
}

function runTests() {
  assert(isGrowCareerPathComplete(motionDesignerJunior), 'path complete with 11 answers')

  const motionPlan = buildGrowCareerGrowthPlan(profile, motionDesignerJunior)
  assert(/motion designer/i.test(motionPlan.promotionRoadmap.workNow), motionPlan.promotionRoadmap.workNow)
  assert(
    /senior motion designer|motion designer/i.test(motionPlan.promotionRoadmap.buildNext),
    `expected Motion Designer progression next, got ${motionPlan.promotionRoadmap.buildNext}`
  )
  assert(/senior motion designer|lead motion designer|creative director/i.test(motionPlan.promotionRoadmap.longTerm), motionPlan.promotionRoadmap.longTerm)
  assert(motionPlan.growthScoreLabel.length > 3, 'score label')
  assert(motionPlan.immediateActions.length === 3, 'three immediate actions')
  assert(motionPlan.coach.careerProfile.length > 3, 'career profile label')
  assert(motionPlan.coach.promotionReadinessExplanation.length > 20, 'promotion readiness explanation')
  assert(motionPlan.coach.alternativeGrowthRoute.role.length > 2, 'alternative route')
  assert(motionPlan.coach.actionPlan90Days.length >= 3, '90-day plan')
  assert(motionPlan.coach.growthPlan6To12Months.length >= 3, '6-12 month plan')
  assert(motionPlan.coach.longTermCareerDirection.includes('3–5 years'), 'long-term direction')
  assert(motionPlan.strengths.includes('Design'), 'core skills as strengths')
  assert(!/warehouse|retail assistant/i.test(motionPlan.workNow[0]!.title), 'no generic fallback jobs')

  const mechPlan = buildGrowCareerGrowthPlan(profile, mechanicalEngineerJunior)
  assert(/mechanical engineer/i.test(mechPlan.promotionRoadmap.workNow), mechPlan.promotionRoadmap.workNow)
  assert(/mechanical engineer/i.test(mechPlan.promotionRoadmap.buildNext), mechPlan.promotionRoadmap.buildNext)
  assert(/senior mechanical engineer|lead mechanical engineer|chartered mechanical engineer/i.test(mechPlan.promotionRoadmap.longTerm), mechPlan.promotionRoadmap.longTerm)

  console.log('✓ grow career engine tests passed')
}

runTests()
