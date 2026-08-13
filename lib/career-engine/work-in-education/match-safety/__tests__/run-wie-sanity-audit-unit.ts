/**
 * WIE cross-field sanity audit unit runner.
 *   npx tsx lib/career-engine/work-in-education/match-safety/__tests__/run-wie-sanity-audit-unit.ts
 */

import assert from 'node:assert/strict'
import {
  runWieSanityAudit,
  formatWieSanityAuditMarkdown,
  polishWieRoleTitle,
  shouldDeprioritiseCareCourseForRoute,
} from '../index'

console.log('\n=== WIE cross-field sanity audit ===\n')

{
  assert.equal(
    polishWieRoleTitle(
      'Civil Engineering Graduate Civil Engineer',
      'Engineering',
      'Civil Engineering'
    ),
    'Graduate Civil Engineer'
  )
  assert.equal(
    polishWieRoleTitle('Accounting Graduate Accounts Assistant', 'Accounting', 'Financial Accounting'),
    'Accounts Assistant'
  )
  assert.equal(
    polishWieRoleTitle('IT Support Technician', 'IT & Technology', 'Software Development'),
    'IT Support Assistant'
  )
  assert.equal(
    polishWieRoleTitle('SEN Teaching Assistant', 'Education & Teaching', 'Primary Education'),
    'SEN Support Assistant'
  )
  assert.equal(
    polishWieRoleTitle(
      'Anthropology Research Admin Assistant',
      'Humanities & Social Sciences',
      'Anthropology'
    ),
    'Research Assistant'
  )
  console.log('  ✓ Global role-title polish across fields')
}

{
  assert.ok(
    shouldDeprioritiseCareCourseForRoute(
      'Counselling Skills Introduction',
      'Business & Management',
      'Operations'
    )
  )
  assert.ok(
    shouldDeprioritiseCareCourseForRoute(
      'Mental Health Awareness',
      'IT & Technology',
      'Software Development'
    )
  )
  assert.ok(
    !shouldDeprioritiseCareCourseForRoute(
      'Care Certificate',
      'Healthcare & Medicine',
      'Adult Care'
    )
  )
  assert.ok(
    !shouldDeprioritiseCareCourseForRoute(
      'Safeguarding Children',
      'Education & Teaching',
      'Primary Education'
    )
  )
  console.log('  ✓ Care-course gates: blocked for business/IT, allowed for care/education')
}

{
  const result = runWieSanityAudit()
  const failed = result.findings.filter((f) => !f.ok)
  if (failed.length) {
    console.error(formatWieSanityAuditMarkdown(result))
  }
  assert.equal(
    result.failed,
    0,
    `Sanity audit failed ${result.failed} check(s):\n` +
      failed.map((f) => `  - [${f.personaId}] ${f.message}`).join('\n')
  )
  console.log(
    `  ✓ Sanity audit: ${result.personasChecked} personas, ${result.passed} checks passed`
  )
}

console.log('\nAll WIE sanity audit tests passed.\n')
