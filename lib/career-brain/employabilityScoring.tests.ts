/**
 * Employability score realism checks.
 * Run: npx tsx lib/career-brain/employabilityScoring.tests.ts
 */

import { enrichCareerProfile } from './enrichProfile'
import { computeEmployabilityScore } from './employabilityScoring'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function scoreFor(answers: Record<string, unknown>): number {
  const state = { answers }
  const profile = enrichCareerProfile(state)
  return computeEmployabilityScore(profile, state)
}

function run() {
  const lawHospitality = scoreFor({
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'hospitality',
    cb_experience_country: 'mostly_international',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'law',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
    cb_english: 'good',
  })
  assert(
    lawHospitality >= 58 && lawHospitality <= 76,
    `Law degree + hospitality + no UK legal exp should be 58–76, got ${lawHospitality}`
  )
  console.log(`✓ Law + hospitality employability: ${lawHospitality}`)

  const mediaMarketingUk = scoreFor({
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'marketing',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'media_communications',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
    cb_english: 'good',
  })
  assert(
    mediaMarketingUk >= 68 && mediaMarketingUk <= 88,
    `Marketing + media + UK exp should be 68–88, got ${mediaMarketingUk}`
  )
  console.log(`✓ Media + marketing UK employability: ${mediaMarketingUk}`)

  console.log('\nAll employability scoring tests passed.')
}

run()
