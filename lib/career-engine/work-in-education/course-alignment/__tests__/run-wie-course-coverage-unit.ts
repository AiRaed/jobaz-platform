/**
 * WIE course coverage audit unit tests.
 *   npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-course-coverage-unit.ts
 */

import assert from 'node:assert/strict'
import {
  buildWieCourseCoverageAudit,
  buildWieMissingCourseTypeCards,
  isTitleSafeForWorkInEducation,
  suggestCourseTypesForWieRoute,
} from '../index'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { matchEducationRecommendations } from '@/lib/recommendations/matchEducationRecommendations'

console.log('\n=== WIE course coverage tests ===\n')

function opp(partial: {
  id: string
  courseName: string
  educationFields?: string[]
  specialisations?: string[]
  goals?: string[]
}): CourseOpportunity {
  return {
    id: partial.id,
    courseName: partial.courseName,
    shortLabel: '',
    coursePurpose: 'CV booster',
    priority: 70,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'High',
    notes: '',
    nextAction: '',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields: partial.educationFields ?? [],
    specialisations: partial.specialisations ?? [],
    commercialStatus: 'no_link',
    suggestedSearchKeywords: partial.courseName,
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: '',
    updatedAt: '',
    routes: [],
    goals: (partial.goals ?? ['work_in_education']).map((goalKey) => ({
      id: `${partial.id}-${goalKey}`,
      opportunityId: partial.id,
      goalKey,
      goalLabel: goalKey,
    })),
    providers: [],
  }
}

{
  const s = suggestCourseTypesForWieRoute({
    fieldName: 'Psychology',
    specialismName: 'Clinical Psychology',
  })
  assert.ok(s.some((x) => /mental health/i.test(x.title)))
  assert.ok(s.some((x) => /counsell/i.test(x.title)))
  console.log('  ✓ Psychology suggests Mental Health / Counselling types')
}

{
  const fields = [
    { id: 'f1', name: 'Accounting & Finance' },
    { id: 'f2', name: 'Psychology' },
  ]
  const specialisms = [
    { id: 's1', field_id: 'f1', name: 'Financial Accounting' },
    { id: 's2', field_id: 'f2', name: 'Clinical Psychology' },
  ]
  const opportunities = [
    opp({
      id: '1',
      courseName: 'AAT',
      educationFields: ['Business & Finance'],
      specialisations: ['Accounting', 'Financial Accounting'],
    }),
    opp({
      id: '2',
      courseName: 'Xero',
      educationFields: ['Business & Finance'],
      specialisations: ['Bookkeeping'],
    }),
    opp({
      id: '3',
      courseName: 'Excel for Finance',
      educationFields: ['Business & Finance'],
      specialisations: ['Finance'],
    }),
    opp({
      id: '4',
      courseName: 'SIA Door Supervisor',
      educationFields: [],
      goals: ['start_new_career', 'extra_income'],
    }),
  ]

  const audit = buildWieCourseCoverageAudit({ fields, specialisms, opportunities })
  const acct = audit.fields.find((f) => /account/i.test(f.field_name))!
  const psych = audit.fields.find((f) => /psych/i.test(f.field_name))!
  assert.ok(
    acct.status === 'covered' || acct.status === 'partially_covered',
    `Accounting should be covered/partial, got ${acct.status}`
  )
  assert.equal(psych.status, 'missing_course_coverage')
  assert.ok(audit.specialisms_missing_courses >= 1)
  console.log('  ✓ Coverage statuses: Accounting supported, Psychology missing')
}

{
  const cards = buildWieMissingCourseTypeCards({
    suggestions: suggestCourseTypesForWieRoute({ fieldName: 'Biology' }),
    fieldName: 'Biology',
    specialismName: 'Molecular Biology',
    coverageStatus: 'missing_course_coverage',
    limit: 3,
  })
  assert.ok(cards.length > 0)
  for (const c of cards) {
    assert.equal(c.commercialStatus, 'no_link')
    assert.ok(!c.referralUrl)
    assert.match(c.badge, /coming soon/i)
  }
  console.log('  ✓ Gap cards are Coming soon with no referral_url')
}

{
  const opportunities = [
    opp({
      id: 'sia',
      courseName: 'SIA Door Supervisor',
      educationFields: [],
      goals: ['work_in_education', 'start_new_career'],
    }),
    opp({
      id: 'fork',
      courseName: 'Forklift Counterbalance',
      educationFields: [],
      goals: ['extra_income'],
    }),
  ]
  const cards = matchEducationRecommendations({
    answers: {
      education_field: 'psychology',
      education_specialisation: 'clinical',
    } as never,
    opportunities,
    publishedCourses: [],
    goalKey: 'work_in_education',
    limit: 4,
    minScore: 10,
  })
  assert.ok(!cards.some((c) => /sia|forklift/i.test(c.title)))
  assert.ok(cards.length > 0, 'Should surface suggested course types')
  assert.ok(cards.every((c) => c.id.startsWith('wie-gap-')))
  assert.equal(
    isTitleSafeForWorkInEducation('SIA Door Supervisor', { educationField: 'Psychology' }),
    false
  )
  console.log('  ✓ Missing Psychology coverage does not recommend SIA/Forklift')
}

{
  const opportunities = [
    opp({
      id: 'aat',
      courseName: 'AAT',
      educationFields: ['Business & Finance', 'Accounting'],
      specialisations: ['Accounting'],
    }),
    opp({
      id: 'sia',
      courseName: 'SIA Door Supervisor',
      educationFields: [],
      goals: ['start_new_career'],
    }),
  ]
  const cards = matchEducationRecommendations({
    answers: {
      education_field: 'business_finance',
      education_specialisation: 'accounting',
    } as never,
    opportunities,
    publishedCourses: [],
    goalKey: 'work_in_education',
    limit: 4,
    minScore: 20,
  })
  assert.ok(!cards.some((c) => /sia/i.test(c.title)))
  console.log('  ✓ Accounting path never includes SIA')
}

console.log('\nAll WIE course coverage tests passed.\n')
