/**
 * Add to My Plan — initial selection freshness tests.
 *   npx tsx lib/career-assistant/add-to-my-plan/__tests__/run-add-to-plan-selection-unit.ts
 */

import assert from 'node:assert/strict'
import { buildCaStepKey } from '../stepKey'
import { buildAddToPlanInitialSelection } from '../buildAddToPlanInitialSelection'
import type { PlanPickCatalog, PlanPickItem } from '../types'

console.log('\n=== Add to Plan initial selection unit tests ===\n')

function role(
  title: string,
  opts?: Partial<PlanPickItem>
): PlanPickItem {
  return {
    id: `role:${title}`,
    group: 'roles',
    kind: 'role',
    title,
    route_timing: 'start_now',
    step_key: buildCaStepKey('work_in_my_education', 'role', title),
    default_selected: false,
    ...opts,
  }
}

function course(title: string, opts?: Partial<PlanPickItem>): PlanPickItem {
  return {
    id: `train:${title}`,
    group: 'training',
    kind: 'course',
    title,
    step_key: buildCaStepKey('work_in_my_education', 'course', title),
    default_selected: false,
    provider_status: 'provider_not_listed',
    ...opts,
  }
}

{
  // Midwifery catalog with Care Certificate present — must NOT auto-check the course
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    field: 'Healthcare & Medicine',
    specialism: 'Midwifery',
    result_token: 'wie-midwifery-1',
    roles: [
      role('Care Assistant', { default_selected: true, metadata: { start_now: true } }),
      {
        ...role('Midwifery Educator'),
        route_timing: 'future_progression',
        default_selected: false,
      },
    ],
    training: [
      course('Care Certificate', { default_selected: false }),
      course('Qualifi Level 2 Diploma in Care'),
    ],
    skills: [
      {
        id: 'skill:cv',
        group: 'skills',
        kind: 'cv',
        title: 'Prepare my CV',
        step_key: buildCaStepKey('work_in_my_education', 'cv', 'cv'),
        default_selected: false,
      },
    ],
  }

  const init = buildAddToPlanInitialSelection(catalog)
  assert.deepEqual(init.selectedIds, ['role:Care Assistant'])
  assert.ok(!init.selectedItems.some((i) => /Care Certificate/i.test(i.title)))
  assert.ok(!init.selectedItems.some((i) => i.group === 'training'))
  assert.ok(!init.selectedItems.some((i) => i.group === 'skills'))
  console.log('  ✓ 1. Midwifery — only Care Assistant preselected; Care Certificate unchecked')
}

{
  // Stale default_selected on training must still be ignored by the pure helper
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Civil Engineering',
    field: 'Engineering',
    specialism: 'Civil Engineering',
    result_token: 'wie-civil-2',
    roles: [role('Assistant Civil Engineer', { default_selected: true })],
    training: [
      course('AutoCAD', { default_selected: true }),
      course('Care Certificate', { default_selected: true }),
    ],
    skills: [],
  }
  const init = buildAddToPlanInitialSelection(catalog)
  assert.equal(init.selectedItems.length, 1)
  assert.equal(init.selectedItems[0]?.title, 'Assistant Civil Engineer')
  assert.ok(!init.selectedIds.some((id) => /Care Certificate|AutoCAD/i.test(id)))
  console.log('  ✓ 2. Civil Engineering after Midwifery — no Care Certificate leak')
}

{
  // Different result_token → independent selection keys (remount identity)
  const a = buildAddToPlanInitialSelection({
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    specialism: 'Midwifery',
    result_token: 'token-a',
    roles: [role('Care Assistant', { default_selected: true })],
    training: [course('Care Certificate')],
    skills: [],
  })
  const b = buildAddToPlanInitialSelection({
    goal_path: 'work_in_my_education',
    route_title: 'Civil Engineering',
    specialism: 'Civil Engineering',
    result_token: 'token-b',
    roles: [role('Assistant Civil Engineer', { default_selected: true })],
    training: [course('AutoCAD')],
    skills: [],
  })
  assert.notDeepEqual(a.selectedIds, b.selectedIds)
  assert.ok(!a.selectedItems.some((i) => /AutoCAD/i.test(i.title)))
  assert.ok(!b.selectedItems.some((i) => /Care Certificate/i.test(i.title)))
  console.log('  ✓ 3. Separate results produce independent initial selections')
}

{
  // Future-only roles — no auto-select progression; no training
  const catalog: PlanPickCatalog = {
    goal_path: 'work_in_my_education',
    route_title: 'Midwifery',
    specialism: 'Midwifery',
    roles: [
      {
        ...role('Midwifery Educator'),
        route_timing: 'future_progression',
        default_selected: true,
      },
    ],
    training: [course('Care Certificate', { default_selected: true })],
    skills: [],
  }
  const init = buildAddToPlanInitialSelection(catalog)
  assert.equal(init.selectedIds.length, 0)
  console.log('  ✓ 4. Future routes / training never auto-selected alone')
}

{
  // Pure helper must not throw on empty catalog
  const init = buildAddToPlanInitialSelection(null)
  assert.deepEqual(init.selectedIds, [])
  console.log('  ✓ 5. Null catalog → empty selection')
}

console.log('\nAll Add to Plan selection unit tests passed.\n')
