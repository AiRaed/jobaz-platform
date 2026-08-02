/**
 * Final quality tests — progression realism for key UK Career Assistant scenarios.
 * Run: npx tsx lib/career-brain/progressionQuality.tests.ts
 */

import {
  buildPathwayProfile,
  getCareerRecommendations,
  pathwayToCareerBrainRecommendations,
} from './pathwayRecommendations'
import { refineProgressionLadder, computeRecommendationConfidence } from './progressionRefinement'
import { isTrainingOrLicence } from './careerProgressionValidation'
import type { CareerProfile } from './types'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function assertExcludes(titles: string[], pattern: RegExp, msg: string) {
  assert(!titles.some((t) => pattern.test(t)), `${msg}: ${titles.join(', ')}`)
}

function assertIncludes(titles: string[], pattern: RegExp, msg: string) {
  assert(titles.some((t) => pattern.test(t)), `${msg}: ${titles.join(', ')}`)
}

function runScenario(
  name: string,
  answers: Record<string, unknown>,
  checks: {
    workNow?: RegExp
    buildNextCareer?: RegExp
    buildNextNo?: RegExp
    longTerm?: RegExp
    longTermNo?: RegExp
  }
) {
  const raw = getCareerRecommendations(answers)
  const profile = buildPathwayProfile(answers)
  const recs = pathwayToCareerBrainRecommendations(raw, undefined, profile.studyFieldSlug, profile)
  const stubProfile: CareerProfile = {
    educationLevel: 'degree',
    studyField: profile.studyFieldText,
    workExperienceField: profile.experienceFieldText,
    targetField: null,
    yearsOfExperience: 3,
    experienceCountry: 'UK',
    toolsAndSkills: [],
    hasPortfolio: null,
    certificates: [],
    licences: [],
    englishLevel: 'good',
    ukLocation: null,
    urgencyLevel: 'medium',
    wantsSameField: true,
    wantsCareerChange: false,
    domain: 'no_experience_general',
    domainConfidence: 0.8,
    detectedRoles: [],
    transferableSkills: [],
    constraints: ['pathway-deterministic-locked', 'unemployed-path'],
    confidence: 0.8,
  }
  const refined = refineProgressionLadder(
    recs.filter((r) => r.track === 'work_now'),
    recs.filter((r) => r.track === 'build_next'),
    recs.filter((r) => r.track === 'long_term'),
    stubProfile,
    { answers }
  )

  const workNow = refined.workNow.map((r) => r.title)
  const buildNext = refined.buildNext.map((r) => r.title)
  const buildNextCareer = refined.buildNext.filter((r) => !isTrainingOrLicence(r.title)).map((r) => r.title)
  const longTerm = refined.longTerm.map((r) => r.title)
  const confidence = computeRecommendationConfidence(
    [...refined.workNow, ...refined.buildNext, ...refined.longTerm],
    stubProfile,
    { answers }
  )

  if (checks.workNow) assertIncludes(workNow, checks.workNow, `${name} Work Now`)
  if (checks.buildNextCareer) assertIncludes(buildNextCareer, checks.buildNextCareer, `${name} Build Next career steps`)
  if (checks.buildNextNo) assertExcludes(buildNext, checks.buildNextNo, `${name} Build Next must exclude`)
  if (checks.longTerm) assertIncludes(longTerm, checks.longTerm, `${name} Long Term`)
  if (checks.longTermNo) assertExcludes(longTerm, checks.longTermNo, `${name} Long Term must exclude`)

  const workScores = confidence.filter((c) => c.track === 'work_now')
  assert(workScores.length >= 1, `${name} should have confidence scores`)
  assert(
    workScores[0].score >= (workScores[1]?.score ?? 0),
    `${name} confidence should rank highest first`
  )

  console.log(`✓ ${name}`)
  console.log(`  Work Now: ${workNow.slice(0, 3).join(' | ')}`)
  console.log(`  Build Next: ${buildNextCareer.slice(0, 3).join(' | ')}`)
  console.log(`  Long Term: ${longTerm.slice(0, 2).join(' | ')}`)
}

function runTests() {
  runScenario('Marketing + Media & Communications', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'marketing',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'media_communications',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }, {
    workNow: /marketing|content|communications|admin/i,
    buildNextCareer: /coordinator|executive|creator|producer|designer/i,
    buildNextNo: /certif|course|training|animator$/i,
    longTerm: /marketing|content|motion|communications|strategist/i,
  })

  runScenario('Law + Law', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'office_admin',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '1_3',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'law',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /legal|casework|admin/i,
    buildNextCareer: /legal|casework|administrator|officer|assistant/i,
    buildNextNo: /certif|course|training|research skills/i,
    longTerm: /legal|paralegal|administrator|operations/i,
    longTermNo: /animator|software engineer|nurse/i,
  })

  runScenario('Education + Education', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'education',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '5_10',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'education',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /teaching|learning support|education/i,
    buildNextCareer: /learning support|education|cover supervisor|administrator/i,
    longTerm: /education|learning|teaching/i,
    longTermNo: /animator|software engineer/i,
  })

  runScenario('Driving + No Degree', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'driving',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '5_10',
    cb_first_job_education_level: 'gcse_a_levels',
    cb_career_direction_priority: 'experience_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /driver|delivery|courier|transport|admin/i,
    buildNextCareer: /coordinator|administrator|transport|fleet/i,
    longTermNo: /animator|paralegal|nurse|software engineer/i,
  })

  runScenario('Warehouse + No Degree', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'warehouse',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'no_formal',
    cb_career_direction_priority: 'fast_employment',
    cb_cert_openness: 'yes',
  }, {
    workNow: /warehouse|picker|operative|administrator|customer service/i,
    buildNextCareer: /team leader|coordinator|supervisor|administrator/i,
    longTermNo: /animator|software engineer|paralegal/i,
  })

  runScenario('Customer Service + Business', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'customer_service',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'business_management',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }, {
    workNow: /customer service|admin|operations|marketing/i,
    buildNextCareer: /coordinator|administrator|operations|marketing/i,
    longTermNo: /animator|nurse|software engineer/i,
  })

  runScenario('Healthcare + Healthcare', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'healthcare',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '1_3',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'healthcare',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /care|healthcare|support/i,
    buildNextCareer: /healthcare|care|support|coordinator/i,
    longTerm: /care|healthcare|coordinator/i,
    longTermNo: /animator|marketing manager|software engineer/i,
  })

  runScenario('IT + IT', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'it',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'it_computing',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /it support|helpdesk|data|web|technical/i,
    buildNextCareer: /systems|support|helpdesk|administrator|specialist/i,
    longTerm: /systems|support|developer|analyst/i,
    longTermNo: /animator|retail manager|paralegal/i,
  })

  runScenario('Animation & Design + Arts & Design', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'arts_design',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '1_3',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'arts_design',
    cb_career_direction_priority: 'education_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /content|design|creative|production|video/i,
    buildNextCareer: /creator|designer|coordinator|motion|production/i,
    longTerm: /motion|designer|creative|content/i,
    longTermNo: /paralegal|warehouse supervisor|nurse/i,
  })

  runScenario('Retail + Business', {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'retail',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '5_10',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'business_management',
    cb_career_direction_priority: 'experience_field',
    cb_cert_openness: 'yes',
  }, {
    workNow: /retail|supervisor|customer service|team leader/i,
    buildNextCareer: /supervisor|coordinator|team leader|operations/i,
    longTerm: /store manager|operations|area manager|retail/i,
    longTermNo: /animator|software engineer|paralegal/i,
  })

  console.log('\nAll progression quality tests passed.')
}

runTests()
