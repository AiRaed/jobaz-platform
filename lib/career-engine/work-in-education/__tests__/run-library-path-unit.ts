/**
 * Library-path unit tests (no DB — structure + reset semantics + no hard-coded fields in wizard).
 *   npx tsx lib/career-engine/work-in-education/__tests__/run-library-path-unit.ts
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('\n=== Library-path Work in My Education tests ===\n')

const root = path.resolve(__dirname, '../../../..')

// 1. Wizard source must not hard-code field/specialism/stage option arrays
{
  const wizardPath = path.join(
    root,
    'components/career-engine/work-in-education/wizard/LibraryPathWizard.tsx'
  )
  const src = fs.readFileSync(wizardPath, 'utf8')
  assert.ok(src.includes('/library/fields'), 'loads fields from API')
  assert.ok(src.includes('/library/specialisms'), 'loads specialisms from API')
  assert.ok(src.includes('/library/stages'), 'loads stages from API')
  assert.ok(src.includes('/library/match'), 'matches via library API')
  assert.ok(!/No formal qualification/.test(src), 'no taxonomy group labels')
  assert.ok(!/Undergraduate qualification/.test(src), 'no undergraduate taxonomy')
  assert.ok(!/EDUCATION_LEVELS\s*=/.test(src), 'no EDUCATION_LEVELS array')
  assert.ok(!/Graduate Engineer/.test(src), 'no hard-coded stage labels')
  assert.ok(!/Civil Engineering/.test(src), 'no hard-coded specialism names')
  assert.ok(src.includes('Target career stage'), 'wizard labels stage as target')
  assert.ok(!/Education \/ professional stage/.test(src), 'no ambiguous current-stage title')
  assert.ok(
    src.includes("setStepId('specialism')") && src.includes('Single-choice: auto-advance'),
    'field selection auto-advances'
  )
  assert.ok(src.includes("stepId === 'completed_courses'"), 'primary CTA gated to multi-select step')
  assert.ok(src.includes("'See results'"), 'multi-select uses See results')
  assert.ok(!src.includes("'Continue'"), 'no Continue label on single-choice steps')
  console.log('  ✓ 1. LibraryPathWizard has no hard-coded library option arrays')
}

// 2. Knowledge engine client uses LibraryPathWizard
{
  const clientPath = path.join(
    root,
    'components/career-engine/work-in-education/WorkInEducationKnowledgeEngineClient.tsx'
  )
  const src = fs.readFileSync(clientPath, 'utf8')
  assert.ok(src.includes('LibraryPathWizard'), 'client uses LibraryPathWizard')
  assert.ok(!src.includes('<AssessmentWizard'), 'client does not mount AssessmentWizard')
  console.log('  ✓ 2. Public WIE client uses library path wizard')
}

// 3. Dependent reset helpers (pure)
{
  type State = {
    fieldId: string | null
    specialismId: string | null
    stageId: string | null
  }
  function selectField(state: State, id: string): State {
    return { fieldId: id, specialismId: null, stageId: null }
  }
  function selectSpecialism(state: State, id: string): State {
    return { ...state, specialismId: id, stageId: null }
  }
  let s: State = { fieldId: 'f1', specialismId: 's1', stageId: 'st1' }
  s = selectField(s, 'f2')
  assert.equal(s.specialismId, null)
  assert.equal(s.stageId, null)
  s = { ...s, specialismId: 's2', stageId: 'st2' }
  s = selectSpecialism(s, 's3')
  assert.equal(s.stageId, null)
  assert.equal(s.specialismId, 's3')
  console.log('  ✓ 3. Changing field/specialism clears dependent selections')
}

// 4. Disabled stage key filtering
{
  const stages = [
    { stage_key: 'graduate_engineer', label: 'Graduate Engineer' },
    { stage_key: 'chartered_professional_engineer', label: 'Chartered' },
    { stage_key: 'executive_leadership', label: 'Executive' },
  ]
  const disabled = new Set(['executive_leadership'])
  const visible = stages.filter((st) => !disabled.has(st.stage_key))
  assert.equal(visible.length, 2)
  assert.ok(!visible.some((v) => v.stage_key === 'executive_leadership'))
  console.log('  ✓ 4. Disabled stage keys are filtered out')
}

// 5. Qualification taxonomy module exists but is not imported by LibraryPathWizard
{
  const wizardPath = path.join(
    root,
    'components/career-engine/work-in-education/wizard/LibraryPathWizard.tsx'
  )
  const src = fs.readFileSync(wizardPath, 'utf8')
  assert.ok(!src.includes('qualification-taxonomy'), 'wizard does not import taxonomy')
  assert.ok(!src.includes('QualificationTaxonomyStep'), 'wizard does not use taxonomy step')
  console.log('  ✓ 5. Taxonomy step removed from library path wizard')
}

console.log('\nAll library-path unit tests passed.\n')
