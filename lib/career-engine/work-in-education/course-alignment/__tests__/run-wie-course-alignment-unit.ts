/**
 * Work in My Education course alignment acceptance tests.
 *   npx tsx lib/career-engine/work-in-education/course-alignment/__tests__/run-wie-course-alignment-unit.ts
 */

import assert from 'node:assert/strict'
import {
  classifyWieCourse,
  filterCoursesForWorkInEducation,
  isTitleSafeForWorkInEducation,
} from '../index'

console.log('\n=== WIE course alignment tests ===\n')

function assertIncludes(titles: string[], needles: string[]) {
  for (const n of needles) {
    assert.ok(
      titles.some((t) => t.toLowerCase().includes(n.toLowerCase())),
      `Expected include containing "${n}", got: ${titles.join(', ')}`
    )
  }
}

function assertExcludes(titles: string[], needles: string[]) {
  for (const n of needles) {
    assert.ok(
      !titles.some((t) => t.toLowerCase().includes(n.toLowerCase())),
      `Expected exclude "${n}", got: ${titles.join(', ')}`
    )
  }
}

// Contamination
{
  const sia = classifyWieCourse({
    title: 'SIA Door Supervisor',
    educationFields: [],
    goalKeys: ['start_new_career', 'extra_income'],
  })
  assert.equal(sia.purpose, 'not_suitable_for_work_in_education')
  assert.ok(sia.excluded_goal_paths.includes('work_in_education'))
  assert.ok(sia.contamination_risk)

  const forkOk = classifyWieCourse({
    title: 'Forklift Counterbalance',
    educationFields: ['Logistics'],
    specialisations: ['Warehouse'],
    goalKeys: ['work_in_education'],
  })
  assert.notEqual(forkOk.purpose, 'not_suitable_for_work_in_education')

  assert.equal(
    isTitleSafeForWorkInEducation('SIA Door Supervisor', { educationField: 'Accounting' }),
    false
  )
  assert.equal(
    isTitleSafeForWorkInEducation('Food Hygiene Level 2', { educationField: 'Hospitality' }),
    true
  )
  console.log('  ✓ Contamination rules (SIA/forklift/food)')
}

// Accounting persona
{
  const pool = [
    { title: 'AAT', educationFields: ['Business & Finance'], specialisations: ['Accounting'], goalKeys: ['work_in_education'] },
    { title: 'Excel for Finance', educationFields: ['Business & Finance'], specialisations: ['Finance'], goalKeys: ['work_in_education'] },
    { title: 'Xero', educationFields: ['Business & Finance'], specialisations: ['Bookkeeping'], goalKeys: ['work_in_education'] },
    { title: 'Bookkeeping', educationFields: ['Business & Finance'], specialisations: ['Bookkeeping'], goalKeys: ['work_in_education'] },
    { title: 'SIA Door Supervisor', educationFields: [], goalKeys: ['start_new_career'] },
    { title: 'Forklift', educationFields: [], goalKeys: ['extra_income'] },
    { title: 'Food Hygiene Level 2', educationFields: [], goalKeys: ['start_new_career'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'Accounting & Finance',
    specialism: 'Accounting',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['AAT', 'Excel', 'Xero', 'Bookkeeping'])
  assertExcludes(titles, ['SIA', 'Forklift', 'Food Hygiene'])
  console.log('  ✓ Accounting education includes finance courses, excludes job-entry')
}

// IT persona
{
  const pool = [
    { title: 'CompTIA A+', educationFields: ['IT & Technology'], specialisations: ['IT Support'], goalKeys: ['work_in_education'] },
    { title: 'AWS Cloud Practitioner', educationFields: ['IT & Technology'], specialisations: ['Cloud'], goalKeys: ['work_in_education'] },
    { title: 'CompTIA Security+', educationFields: ['IT & Technology'], specialisations: ['Cyber Security'], goalKeys: ['work_in_education'] },
    { title: 'ISTQB Foundation', educationFields: ['IT & Technology'], specialisations: ['Software Testing'], goalKeys: ['work_in_education'] },
    { title: 'Taxi / PHV Licence', educationFields: [], goalKeys: ['extra_income'] },
    { title: 'SIA Door Supervisor', educationFields: [], goalKeys: ['start_new_career'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'IT & Technology',
    specialism: 'Software Development',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['CompTIA', 'AWS', 'Security+', 'ISTQB'])
  assertExcludes(titles, ['SIA', 'Taxi'])
  console.log('  ✓ IT education includes CompTIA/cloud/cyber, excludes SIA/taxi')
}

// Civil Engineering
{
  const pool = [
    { title: 'AutoCAD', educationFields: ['Engineering'], specialisations: ['Civil Engineering'], goalKeys: ['work_in_education'] },
    { title: 'Revit / BIM', educationFields: ['Engineering', 'Construction'], specialisations: ['Civil Engineering'], goalKeys: ['work_in_education'] },
    { title: 'IOSH Managing Safely', educationFields: ['Engineering', 'Construction'], specialisations: ['Civil Engineering'], goalKeys: ['work_in_education'] },
    { title: 'APM Project Management', educationFields: ['Engineering'], specialisations: ['Civil Engineering'], goalKeys: ['work_in_education'] },
    { title: 'CSCS Green Card', educationFields: ['Construction'], specialisations: ['Civil Engineering'], goalKeys: ['work_in_education'] },
    { title: 'SIA Door Supervisor', educationFields: [], goalKeys: ['start_new_career'] },
    { title: 'Warehouse Operative Basics', educationFields: [], goalKeys: ['extra_income'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'Engineering',
    specialism: 'Civil Engineering',
    stageLabel: 'Graduate Engineer',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['AutoCAD', 'Revit', 'IOSH', 'APM', 'CSCS'])
  assertExcludes(titles, ['SIA', 'Warehouse'])
  console.log('  ✓ Civil Engineering includes CAD/IOSH/PM/CSCS, excludes SIA/warehouse')
}

// Teaching
{
  const pool = [
    { title: 'Teaching Assistant Level 2', educationFields: ['Education & Teaching'], specialisations: ['Teaching Assistant'], goalKeys: ['work_in_education'] },
    { title: 'SEN / Autism Awareness', educationFields: ['Education & Teaching'], specialisations: ['SEN Support'], goalKeys: ['work_in_education'] },
    { title: 'Safeguarding Children', educationFields: ['Education & Teaching'], specialisations: ['School Support'], goalKeys: ['work_in_education'] },
    { title: 'Child Protection', educationFields: ['Education & Teaching'], specialisations: ['School Support'], goalKeys: ['work_in_education'] },
    { title: 'TEFL', educationFields: ['Education & Teaching', 'Languages'], specialisations: ['English Teaching'], goalKeys: ['work_in_education'] },
    { title: 'Forklift', educationFields: [], goalKeys: ['extra_income'] },
    { title: 'SIA Door Supervisor', educationFields: [], goalKeys: ['start_new_career'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'Education & Teaching',
    specialism: 'Primary Education',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['Teaching Assistant', 'SEN', 'Safeguarding', 'Child Protection', 'TEFL'])
  assertExcludes(titles, ['Forklift', 'SIA'])
  console.log('  ✓ Teaching includes TA/SEN/safeguarding, excludes forklift/SIA')
}

// Care / Health
{
  const pool = [
    { title: 'Care Certificate', educationFields: ['Healthcare', 'Social Care'], specialisations: ['Adult Care'], goalKeys: ['work_in_education'] },
    { title: 'Safeguarding Adults', educationFields: ['Healthcare'], specialisations: ['Care Worker'], goalKeys: ['work_in_education'] },
    { title: 'Medication Administration', educationFields: ['Healthcare'], specialisations: ['Care Worker'], goalKeys: ['work_in_education'] },
    { title: 'Moving and Handling People', educationFields: ['Healthcare'], specialisations: ['Care Worker'], goalKeys: ['work_in_education'] },
    { title: 'Level 2 Diploma in Care', educationFields: ['Healthcare'], specialisations: ['Adult Care'], goalKeys: ['work_in_education'] },
    { title: 'SIA Door Supervisor', educationFields: [], goalKeys: ['start_new_career'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'Healthcare',
    specialism: 'Adult Care',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['Care Certificate', 'Safeguarding', 'Medication', 'Moving', 'Level 2'])
  assertExcludes(titles, ['SIA'])
  console.log('  ✓ Care/Health includes Care Certificate stack, excludes SIA')
}

// Marketing
{
  const pool = [
    { title: 'Digital Marketing', educationFields: ['Media & Communications', 'Business'], specialisations: ['Marketing'], goalKeys: ['work_in_education'] },
    { title: 'Social Media Marketing', educationFields: ['Media & Communications'], specialisations: ['Social Media'], goalKeys: ['work_in_education'] },
    { title: 'SEO', educationFields: ['Media & Communications'], specialisations: ['Digital Marketing'], goalKeys: ['work_in_education'] },
    { title: 'Google Ads', educationFields: ['Business'], specialisations: ['Paid Ads'], goalKeys: ['work_in_education'] },
    { title: 'Power BI / Data Analysis', educationFields: ['Business', 'IT & Technology'], specialisations: ['Data Analysis'], goalKeys: ['work_in_education'] },
    { title: 'Forklift', educationFields: [], goalKeys: ['extra_income'] },
  ]
  const filtered = filterCoursesForWorkInEducation(pool, {
    educationField: 'Marketing & Digital Marketing',
    specialism: 'Digital Marketing',
  })
  const titles = filtered.map((c) => c.title)
  assertIncludes(titles, ['Digital Marketing', 'Social Media', 'SEO', 'Google Ads'])
  assertExcludes(titles, ['Forklift'])
  console.log('  ✓ Marketing includes digital stack, excludes job-entry licences')
}

console.log('\nAll WIE course alignment tests passed.\n')
