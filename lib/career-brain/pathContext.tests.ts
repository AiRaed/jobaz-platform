/**
 * Source-consistent recommendation explanations.
 * Run: npx tsx lib/career-brain/pathContext.tests.ts
 */

import { enrichRecommendationsWithJourneyContext } from './journeyPersonalization'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function extractWhyFit(why: string): string {
  const match = why.match(/Why this fits:\s*([^.]+(?:\.[^N]*)?)/i)
  return match?.[1]?.trim() ?? why
}

const profile = {
  domain: 'admin_business',
  studyField: 'law',
  workExperienceField: 'marketing',
  constraints: [],
} as unknown as CareerProfile

const state: CareerBrainState = {
  answers: {
    cb_first_job_study_field: 'law',
    cb_work_experience_field: 'marketing',
    cb_experience_level: 'have_experience',
  },
}

function rec(
  title: string,
  fieldSource: CareerBrainRecommendation['fieldSource'],
  pathOrigin?: CareerBrainRecommendation['pathOrigin']
): CareerBrainRecommendation {
  return {
    title,
    why: 'Marketing entry using your experience background',
    track: 'work_now',
    field_tag: 'admin_business',
    domain: 'admin_business',
    source: 'fallback',
    fieldSource,
    pathOrigin,
  }
}

function runTests() {
  const enriched = enrichRecommendationsWithJourneyContext(
    [
      rec('Marketing Assistant', 'experience', 'experience'),
      rec('Legal Receptionist', 'education', 'education'),
      rec('Marketing Admin Assistant', 'mixed', 'blended'),
    ],
    profile,
    state
  )

  const marketing = enriched.find((r) => r.title === 'Marketing Assistant')
  const legal = enriched.find((r) => r.title === 'Legal Receptionist')
  const hybrid = enriched.find((r) => r.title === 'Marketing Admin Assistant')

  assert(!!marketing?.why, 'Marketing Assistant enriched')
  assert(!!legal?.why, 'Legal Receptionist enriched')
  assert(!!hybrid?.why, 'Hybrid role enriched')

  const marketingFit = extractWhyFit(marketing!.why)
  assert(/marketing experience/i.test(marketingFit), `Marketing why: ${marketingFit}`)
  assert(!/law (background|education|studies)/i.test(marketingFit), `Marketing must not cite law: ${marketingFit}`)

  const legalFit = extractWhyFit(legal!.why)
  assert(/law education/i.test(legalFit), `Legal why: ${legalFit}`)
  assert(!/marketing experience/i.test(legalFit), `Legal must not cite marketing: ${legalFit}`)

  const hybridFit = extractWhyFit(hybrid!.why)
  assert(
    /combines your Marketing experience with your Law background/i.test(hybridFit),
    `Hybrid why: ${hybridFit}`
  )

  console.log('✓ recommendation explanation consistency tests passed')
}

runTests()
