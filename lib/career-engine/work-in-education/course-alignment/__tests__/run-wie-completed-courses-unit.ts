/**
 * Acceptance tests for WIE completed-courses + training comparison.
 *   npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-completed-courses-unit.ts
 */

import assert from 'node:assert/strict'
import {
  buildWieCompletedCourseOptions,
  buildWieTrainingRecommendations,
  normalizeCompletedCoursesSelection,
  WIE_COMPLETED_NONE_ID,
} from '../completed-courses'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'

function opp(
  name: string,
  fields: string[],
  specs: string[],
  extra?: Partial<CourseOpportunity>
): CourseOpportunity {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: `opp-${name}`,
    courseName: name,
    shortLabel: '',
    coursePurpose: 'CV booster',
    priority: 70,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'Medium',
    notes: '',
    nextAction: '',
    publishedCourseId: null,
    visibilityStatus: 'recommendation_only',
    educationFields: fields,
    specialisations: specs,
    commercialStatus: 'no_link',
    suggestedSearchKeywords: `${name} UK`,
    adminNotes: '',
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: now,
    updatedAt: now,
    routes: [],
    goals: [
      {
        id: 'g1',
        opportunityId: 'x',
        goalKey: 'work_in_education',
        goalLabel: 'Work in my Education',
      },
    ],
    providers: [],
    ...extra,
  }
}

console.log('\n=== WIE completed courses + training report ===\n')

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'Accounting, Finance & Banking',
    specialismName: 'Financial Accounting',
    stageLabel: 'Graduate / Entry',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /aat|excel|xero|bookkeep|payroll|quickbooks/i.test(l)))
  assert.ok(labels.includes('None yet'))
  assert.ok(labels.includes('Not sure'))
  assert.ok(labels.includes('Other / something else'))
  assert.ok(!labels.some((l) => /\bsia\b|forklift|taxi/i.test(l)))
  console.log('  ✓ Accounting options include finance courses, not SIA/Forklift')
}

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'IT & Technology',
    specialismName: 'Software Development',
    stageLabel: 'Graduate',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /web|sql|github|aws|comptia|cyber/i.test(l)))
  assert.ok(!labels.some((l) => /\bsia\b|forklift/i.test(l)))
  console.log('  ✓ IT options include tech courses, not SIA/Forklift')
}

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'Engineering',
    specialismName: 'Civil Engineering',
    stageLabel: 'Graduate Engineer',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /autocad|revit|iosh|project management|portfolio/i.test(l)))
  assert.ok(!labels.some((l) => /\bsia\b/i.test(l)))
  console.log('  ✓ Civil Engineering options include CAD/H&S, not SIA')
}

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'Education',
    specialismName: 'Primary Education',
    stageLabel: 'Graduate',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /teaching assistant|safeguarding|sen|child protection/i.test(l)))
  console.log('  ✓ Teaching options include TA / safeguarding / SEN')
}

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'Healthcare',
    specialismName: 'Adult Social Care',
    stageLabel: 'Support / Foundation',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /care certificate|safeguarding|moving|medication|infection/i.test(l)))
  console.log('  ✓ Care/Health options include Care Certificate and related CPD')
}

{
  const opportunities = [
    opp('Excel for Finance', ['Accounting'], ['Financial Accounting']),
    opp('AAT Foundation', ['Accounting'], ['Financial Accounting']),
    opp('Xero', ['Accounting'], ['Bookkeeping']),
    opp('Bookkeeping', ['Accounting'], ['Bookkeeping']),
    opp('Payroll', ['Accounting'], ['Payroll']),
    opp('SIA Door Supervisor', ['Security'], ['Security']),
  ]

  const training = buildWieTrainingRecommendations({
    fieldName: 'Accounting',
    specialismName: 'Financial Accounting',
    stageLabel: 'Graduate / Entry',
    completed: {
      completed_course_types: ['Excel for Finance'],
      course_confidence: 'known',
    },
    opportunities,
  })

  assert.ok(training.already_completed.some((c) => /excel/i.test(c.title)))
  assert.ok(
    training.recommended_next.some((c) => /aat|xero|bookkeep|payroll/i.test(c.title)) ||
      training.optional_boosters.some((c) => /aat|xero|bookkeep|payroll/i.test(c.title)) ||
      training.provider_not_listed.some((c) => /aat|xero|bookkeep|payroll/i.test(c.title))
  )
  assert.ok(!training.recommended_next.some((c) => /excel/i.test(c.title)))
  assert.ok(!training.recommended_next.some((c) => /\bsia\b|forklift/i.test(c.title)))
  console.log('  ✓ Accounting: Excel completed → next AAT/Xero/Bookkeeping/Payroll, no SIA')
}

{
  const opportunities = [
    opp('Web Development Fundamentals', ['IT & Technology'], ['Software Development']),
    opp('GitHub Portfolio Projects', ['IT & Technology'], ['Software Development']),
    opp('SQL Fundamentals', ['IT & Technology'], ['Software Development']),
    opp('AWS Cloud Practitioner', ['IT & Technology'], ['Cloud']),
    opp('SIA Door Supervisor', ['Security'], ['Security']),
  ]

  const training = buildWieTrainingRecommendations({
    fieldName: 'IT & Technology',
    specialismName: 'Software Development',
    stageLabel: 'Graduate',
    completed: {
      completed_course_types: ['Web Development Fundamentals'],
      course_confidence: 'known',
    },
    opportunities,
  })

  assert.ok(training.already_completed.some((c) => /web development/i.test(c.title)))
  const nextBlob = [
    ...training.recommended_next,
    ...training.optional_boosters,
    ...training.provider_not_listed,
  ]
    .map((c) => c.title)
    .join(' ')
  assert.ok(/github|sql|aws|cloud/i.test(nextBlob))
  assert.ok(!/sia|forklift/i.test(nextBlob))
  console.log('  ✓ IT: Web Dev completed → GitHub/SQL/Cloud next, no SIA')
}

{
  const opportunities = [
    opp('AutoCAD', ['Engineering'], ['Civil Engineering']),
    opp('Revit', ['Engineering'], ['Civil Engineering']),
    opp('BIM Fundamentals', ['Engineering'], ['Civil Engineering']),
    opp('Project Management Fundamentals', ['Engineering'], ['Civil Engineering']),
    opp('CSCS Green Card Pathway', ['Construction'], ['Site']),
  ]

  const training = buildWieTrainingRecommendations({
    fieldName: 'Engineering',
    specialismName: 'Civil Engineering',
    stageLabel: 'Graduate Engineer',
    completed: {
      completed_course_types: ['AutoCAD'],
      course_confidence: 'known',
    },
    opportunities,
  })

  assert.ok(training.already_completed.some((c) => /autocad/i.test(c.title)))
  const nextBlob = [
    ...training.recommended_next,
    ...training.optional_boosters,
    ...training.provider_not_listed,
  ]
    .map((c) => c.title)
    .join(' ')
  assert.ok(/revit|bim|project management/i.test(nextBlob))
  assert.ok(!training.recommended_next.some((c) => /autocad/i.test(c.title)))
  assert.ok(!/\bsia\b/i.test(nextBlob))
  console.log('  ✓ Civil: AutoCAD completed → Revit/BIM/PM next, no SIA')
}

{
  const norm = normalizeCompletedCoursesSelection({
    selectedIds: [WIE_COMPLETED_NONE_ID],
  })
  assert.equal(norm.course_confidence, 'none')
  assert.deepEqual(norm.completed_course_types, [])
  console.log('  ✓ None yet normalises to empty completed list')
}

{
  // Apply Now safety: no_link cards must not carry referralUrl
  const training = buildWieTrainingRecommendations({
    fieldName: 'Accounting',
    specialismName: 'Bookkeeping',
    stageLabel: 'Foundation',
    completed: { completed_course_types: [], course_confidence: 'none' },
    opportunities: [opp('AAT Foundation', ['Accounting'], ['Bookkeeping'])],
  })
  for (const card of [
    ...training.recommended_next,
    ...training.provider_not_listed,
    ...training.optional_boosters,
  ]) {
    if (card.commercialStatus === 'no_link') {
      assert.ok(!card.referralUrl?.trim(), `no_link card ${card.title} must not have referralUrl`)
    }
  }
  console.log('  ✓ no_link recommendations never invent referral URLs')
}

{
  const options = buildWieCompletedCourseOptions({
    fieldName: 'Humanities & Social Sciences',
    specialismName: 'Anthropology',
    stageLabel: 'Leadership',
  })
  const labels = options.map((o) => o.label)
  assert.ok(labels.some((l) => /Public Sector Applications/i.test(l)))
  assert.ok(labels.some((l) => /Charity \/ NGO Administration/i.test(l)))
  assert.ok(labels.some((l) => /Project Coordination/i.test(l)))
  assert.ok(labels.some((l) => /Data Analysis for Social Research/i.test(l)))
  assert.ok(!labels.some((l) => /Counselling Skills|Mental Health Awareness|Support Worker Bridge/i.test(l)))
  // Safeguarding must not be among top primary options
  const primary = labels.filter((l) => !/None yet|Not sure|Other/.test(l)).slice(0, 6)
  assert.ok(!primary.some((l) => /Safeguarding|Counselling|Mental Health|Support Worker/i.test(l)))

  const training = buildWieTrainingRecommendations({
    fieldName: 'Humanities & Social Sciences',
    specialismName: 'Anthropology',
    stageLabel: 'Leadership',
    stageKey: 'leadership',
    completed: {
      completed_course_types: ['Research Methods'],
      course_confidence: 'known',
    },
    opportunities: [],
  })
  assert.ok(
    training.already_completed.some((c) => /Research Methods/i.test(c.title)),
    'Research Methods should appear under Already completed'
  )
  const listedCards = [
    ...training.recommended_next,
    ...training.optional_boosters,
    ...training.provider_not_listed,
  ]
  const listed = listedCards.map((c) => c.title)
  assert.ok(listed.some((t) => /Public Sector Applications/i.test(t)))
  assert.ok(listed.some((t) => /Charity \/ NGO Administration/i.test(t)))
  assert.ok(listed.some((t) => /Project Coordination/i.test(t)))
  assert.ok(listed.some((t) => /Data Analysis for Social Research/i.test(t)))
  assert.ok(listed.some((t) => /Community Engagement/i.test(t)))
  assert.ok(!listed.some((t) => /Counselling Skills|Mental Health Awareness|Support Worker Bridge/i.test(t)))
  assert.ok(!listed.some((t) => /^Safeguarding$/i.test(t)))

  const byTitle = (re: RegExp) => listedCards.find((c) => re.test(c.title))
  const publicSector = byTitle(/Public Sector Applications/i)
  assert.ok(publicSector)
  assert.equal(publicSector!.training_item_type, 'career_preparation')
  assert.equal(publicSector!.provider_eligible, false)
  assert.ok(!/provider not listed/i.test(publicSector!.status_label || ''))
  assert.ok(!/provider not listed/i.test(publicSector!.statusMessage || ''))

  const charity = byTitle(/Charity \/ NGO Administration/i)
  assert.ok(charity)
  assert.equal(charity!.training_item_type, 'career_preparation')

  const dataAnalysis = byTitle(/Data Analysis for Social Research/i)
  assert.ok(dataAnalysis)
  assert.equal(dataAnalysis!.training_item_type, 'course')

  const policy = byTitle(/Policy Research Basics/i)
  if (policy) {
    assert.equal(policy.training_item_type, 'knowledge_area')
    assert.equal(policy.provider_eligible, false)
  }

  assert.ok(!training.recommended_next.some((c) => /Research Methods/i.test(c.title)))
  console.log('  ✓ Anthropology / HSS: policy/charity courses first; Research Methods completed; typed training items')
}

console.log('\nAll WIE completed-courses acceptance tests passed.\n')
