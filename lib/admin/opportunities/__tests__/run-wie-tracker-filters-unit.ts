/**
 * Unit tests for WIE admin tracker filters.
 *   npx tsx lib/admin/opportunities/__tests__/run-wie-tracker-filters-unit.ts
 */

import assert from 'node:assert/strict'
import { filterOpportunities } from '../query'
import {
  opportunityMatchesEducationField,
  opportunityMatchesSpecialism,
  opportunityPassesWieContaminationGate,
} from '../wieTrackerFilters'
import type { CourseOpportunity } from '../types'

function opp(
  name: string,
  fields: string[],
  specs: string[],
  extra?: Partial<CourseOpportunity>
): CourseOpportunity {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: `id-${name}`,
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
    suggestedSearchKeywords: name,
    adminNotes: `source=generated_from_work_in_education_course_gap · library_field=${fields[0] ?? ''}`,
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
        goalLabel: 'WIE',
      },
    ],
    providers: [],
    ...extra,
  }
}

console.log('\n=== WIE tracker filters ===\n')

const rows = [
  opp('AutoCAD', ['Engineering', 'Construction'], ['Civil Engineering', 'Mechanical Engineering']),
  opp('Revit', ['Engineering'], ['Civil Engineering', 'Architecture']),
  opp('Civil 3D', ['Engineering'], ['Civil Engineering'], {
    adminNotes:
      'source=generated_from_work_in_education_course_gap · library_field=Engineering · stage_hints=graduate|junior',
  }),
  opp('CompTIA A+', ['IT & Technology'], ['IT Support']),
  opp('Laboratory Skills', ['Natural Sciences & Research', 'Science'], ['Biology']),
  opp('Research Methods', ['Natural Sciences & Research'], ['Biology'], {
    adminNotes:
      'source=generated_from_work_in_education_course_gap · library_field=Natural Sciences & Research · wie_purpose=technical_skill_booster',
  }),
  opp('SIA Door Supervisor', ['Security'], ['Security'], {
    goals: [{ id: 'g2', opportunityId: 'x', goalKey: 'start_new_career', goalLabel: 'Start' }],
  }),
  opp('Forklift', ['Logistics'], ['Warehouse']),
]

{
  assert.ok(opportunityMatchesEducationField(rows[0], 'Engineering'))
  assert.ok(!opportunityMatchesEducationField(rows[3], 'Engineering'))
  console.log('  ✓ Education field filter matches Engineering rows')
}

{
  assert.ok(opportunityMatchesSpecialism(rows[0], 'Civil Engineering'))
  assert.ok(!opportunityMatchesSpecialism(rows[3], 'Civil Engineering'))
  console.log('  ✓ Specialism filter matches Civil Engineering')
}

{
  assert.equal(
    opportunityPassesWieContaminationGate(rows[6], 'Engineering', 'Civil Engineering'),
    false
  )
  assert.equal(opportunityPassesWieContaminationGate(rows[0], 'Engineering', 'all'), true)
  console.log('  ✓ Contamination gate hides SIA under Engineering')
}

{
  const filtered = filterOpportunities(rows, {
    search: '',
    routeKey: 'all',
    coursePurpose: 'all',
    opportunityStatus: 'all',
    affiliateStatus: 'all',
    publishStatus: 'all',
    provider: 'all',
    visibilityStatus: 'all',
    commercialStatus: 'all',
    canBeCourseCard: 'all',
    educationField: 'Engineering',
    specialisation: 'all',
    stage: 'all',
    quickView: 'all',
  })
  assert.ok(filtered.every((r) => /Engineering|Construction/i.test(r.educationFields.join(' '))))
  assert.ok(!filtered.some((r) => /sia|forklift|comptia|laboratory/i.test(r.courseName)))
  console.log(`  ✓ Engineering field → ${filtered.length} engineering-related rows, no SIA/IT/Science`)
}

{
  const filtered = filterOpportunities(rows, {
    search: '',
    routeKey: 'all',
    coursePurpose: 'all',
    opportunityStatus: 'all',
    affiliateStatus: 'all',
    publishStatus: 'all',
    provider: 'all',
    visibilityStatus: 'all',
    commercialStatus: 'all',
    canBeCourseCard: 'all',
    educationField: 'Engineering',
    specialisation: 'Civil Engineering',
    stage: 'all',
    quickView: 'all',
  })
  assert.ok(filtered.every((r) =>
    r.specialisations.some((s) => /civil/i.test(s)) || /civil|autocad|revit/i.test(r.courseName)
  ))
  assert.ok(!filtered.some((r) => /sia|comptia/i.test(r.courseName)))
  console.log(`  ✓ Engineering + Civil → ${filtered.length} civil-related rows`)
}

{
  const filtered = filterOpportunities(rows, {
    search: '',
    routeKey: 'all',
    coursePurpose: 'all',
    opportunityStatus: 'all',
    affiliateStatus: 'all',
    publishStatus: 'all',
    provider: 'all',
    visibilityStatus: 'all',
    commercialStatus: 'all',
    canBeCourseCard: 'all',
    educationField: 'Natural Sciences & Research',
    specialisation: 'Biology',
    stage: 'all',
    quickView: 'all',
  })
  assert.ok(filtered.some((r) => /lab|research|biology/i.test(r.courseName)))
  assert.ok(!filtered.some((r) => /autocad|sia|comptia/i.test(r.courseName)))
  console.log(`  ✓ Natural Sciences + Biology → science rows only (${filtered.length})`)
}

{
  const filtered = filterOpportunities(rows, {
    search: '',
    routeKey: 'all',
    coursePurpose: 'all',
    opportunityStatus: 'all',
    affiliateStatus: 'all',
    publishStatus: 'all',
    provider: 'all',
    visibilityStatus: 'all',
    commercialStatus: 'all',
    canBeCourseCard: 'all',
    educationField: 'all',
    specialisation: 'all',
    stage: 'all',
    quickView: 'all',
  })
  assert.equal(filtered.length, rows.length)
  console.log('  ✓ Clear filters returns all rows')
}

console.log('\nAll WIE tracker filter tests passed.\n')
