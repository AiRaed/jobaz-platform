/**
 * Acceptance tests for contextual WIP experience questions (all fields) + no-goal flow.
 *   npx tsx lib/career-engine/work-in-profession/__tests__/run-wip-contextual-levels-unit.ts
 */

import assert from 'node:assert/strict'
import {
  DEFAULT_PROFESSION_GOAL,
  getExperienceQuestionForField,
  listProfessionFields,
  matchProfessionLibrary,
  WIP_DEFAULT_RESULT_FRAMING,
} from '../index'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

console.log('\n=== Work in My Profession contextual levels ===\n')

{
  for (const field of listProfessionFields()) {
    const q = getExperienceQuestionForField(field.slug)
    assert.notEqual(q.mode, 'generic', `${field.slug} should be contextual`)
    assert.match(q.question, /What best describes/i, field.slug)
    assert.equal(q.result_label, 'Experience', field.slug)
    assert.ok(q.options.length >= 5, `${field.slug} needs enough options`)
    assert.ok(!q.options.some((o) => o.label === 'Helper / Assistant'), field.slug)
    assert.ok(!q.options.some((o) => /New to care/i.test(o.label)), field.slug)
  }
  console.log('  ✓ Every profession field has a contextual Step 3 question')
}

{
  const security = getExperienceQuestionForField('security-facilities')
  assert.equal(security.mode, 'security')
  assert.match(security.question, /security position/i)
  const labels = security.options.map((o) => o.label)
  assert.ok(labels.some((l) => /do not have an SIA licence yet, but I want to start/i.test(l)))
  assert.ok(labels.some((l) => /SIA Door Supervisor/i.test(l)))
  console.log('  ✓ Security Step 3 uses security-specific options')
}

{
  const electrical = getExperienceQuestionForField('electrical-technical')
  assert.equal(electrical.mode, 'electrical')
  assert.match(electrical.question, /electrical\/technical experience/i)
  assert.ok(electrical.options.some((o) => /assisted electricians/i.test(o.label)))
  assert.ok(!electrical.options.some((o) => o.label === 'Helper / Assistant'))
  console.log('  ✓ Electrical Step 3 uses electrical-specific options')
}

{
  const warehouse = getExperienceQuestionForField('warehouse-logistics')
  assert.equal(warehouse.mode, 'warehouse')
  assert.match(warehouse.question, /warehouse\/logistics experience/i)
  assert.ok(warehouse.options.some((o) => /forklift\/FLT/i.test(o.label)))
  console.log('  ✓ Warehouse Step 3 uses warehouse-specific options')
}

{
  const care = getExperienceQuestionForField('care-support')
  assert.equal(care.mode, 'care')
  assert.match(care.question, /care\/support experience/i)
  assert.ok(care.options.some((o) => /informal care\/support/i.test(o.label)))
  assert.ok(care.options.some((o) => /worked as a Care Assistant/i.test(o.label)))
  assert.ok(!care.options.some((o) => /New to care/i.test(o.label)))
  console.log('  ✓ Care Step 3 uses experience-based options (no New to care)')
}

{
  const office = getExperienceQuestionForField('office-admin')
  assert.equal(office.mode, 'office')
  assert.match(office.question, /office\/admin experience/i)
  assert.ok(office.options.some((o) => /basic admin or reception/i.test(o.label)))
  assert.ok(office.options.some((o) => /worked as a Receptionist/i.test(o.label)))
  console.log('  ✓ Office Step 3 uses office/admin-specific options')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'office-admin',
    specialism_slug: 'receptionist',
    experience_option_id: 'office_basic',
  })
  assert.equal(result.experience_mode, 'office')
  assert.equal(result.experience_result_label, 'Experience')
  assert.equal(result.experience_display_label, 'Basic admin or reception experience')
  assert.notEqual(result.experience_display_label, 'Helper / Assistant')
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(!titles.some((t) => /Reception Helper|Helper/i.test(t)), titles.join(', '))
  assert.ok(
    titles.some((t) => /Receptionist|Front Desk Receptionist|Office Receptionist|Admin Assistant/i.test(t)),
    `expected realistic reception titles, got: ${titles.join(', ')}`
  )
  console.log('  ✓ Office → Receptionist → basic experience shows realistic titles')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_no_sia',
  })
  assert.equal(result.experience_mode, 'security')
  assert.match(result.experience_display_label, /No SIA licence yet/i)
  assert.equal(result.experience_result_label, 'Experience')
  assert.equal(result.selected_goal, DEFAULT_PROFESSION_GOAL)
  assert.equal(result.result_framing, WIP_DEFAULT_RESULT_FRAMING)
  assert.notEqual(result.experience_display_label, 'Helper / Assistant')
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(!titles.some((t) => /Event Door Helper/i.test(t)))
  const top = titles.slice(0, 3).join(' | ')
  assert.ok(
    /Event Steward|Event Security Steward|Venue Security Support|Door Supervisor Trainee/i.test(
      top
    ),
    `expected steward-first tops, got: ${top}`
  )
  console.log('  ✓ Security no SIA → steward-first + contextual Experience label')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_sia_door',
  })
  assert.equal(result.experience_display_label, 'SIA Door Supervisor licence')
  const titles = result.roles.map((r) => r.role_title)
  const top = titles.slice(0, 3).join(' | ')
  assert.ok(/Door Supervisor/i.test(top), `expected Door Supervisor near top, got: ${top}`)
  console.log('  ✓ Security with SIA prioritises Door / Retail / Venue Security')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'electrical-technical',
    specialism_slug: 'electrician',
    experience_option_id: 'elec_assisted',
  })
  assert.equal(result.experience_mode, 'electrical')
  assert.equal(result.experience_display_label, 'Assisted electricians or technical workers')
  assert.notEqual(result.experience_display_label, 'Helper / Assistant')
  assert.equal(result.selected_goal, DEFAULT_PROFESSION_GOAL)
  assert.ok(result.roles.some((r) => r.role_title === 'Electrician Mate'))
  console.log('  ✓ Electrical → contextual experience, not generic Helper label')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'warehouse-logistics',
    specialism_slug: 'forklift-flt',
    experience_option_id: 'wh_forklift',
  })
  assert.equal(result.experience_mode, 'warehouse')
  assert.match(result.experience_display_label, /forklift/i)
  assert.ok(result.roles.length >= 1)
  console.log('  ✓ Warehouse → Forklift uses warehouse-specific experience')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'care-support',
    specialism_slug: 'adult-care',
    experience_option_id: 'care_assistant',
  })
  assert.equal(result.experience_mode, 'care')
  assert.equal(result.experience_display_label, 'Worked as a Care Assistant')
  assert.notEqual(result.experience_display_label, 'Beginner')
  assert.ok(result.roles.some((r) => /Care Assistant/i.test(r.role_title)))
  assert.ok(!/New to care/i.test(JSON.stringify(result)))
  console.log('  ✓ Care → Adult Care uses care-specific question')
}

{
  const wizardSrc = readFileSync(
    join(process.cwd(), 'components/career-engine/work-in-profession/ProfessionPathWizard.tsx'),
    'utf8'
  )
  assert.ok(!/What do you want to do with this profession now/i.test(wizardSrc))
  assert.ok(!/Find similar work now/i.test(wizardSrc))
  assert.ok(!/PROFESSION_GOAL_OPTIONS/i.test(wizardSrc))
  assert.ok(/label: 'Result'/.test(wizardSrc))
  assert.ok(!/label: 'Goal'/.test(wizardSrc))
  const stepLabels = [...wizardSrc.matchAll(/label: '([^']+)'/g)].map((m) => m[1])
  const progressLabels = stepLabels.filter((l) =>
    ['Profession', 'Trade area', 'Experience', 'Result', 'Goal'].includes(l)
  )
  assert.deepEqual(progressLabels, ['Profession', 'Trade area', 'Experience', 'Result'])
  console.log('  ✓ Wizard has 4 steps and no goal question')
}

{
  const busQ = getExperienceQuestionForField('driving-transport', 'bus-pcv')
  const busLabels = busQ.options.map((o) => o.label)
  assert.ok(busLabels.some((l) => /bus \/ coach \/ PCV driving experience/i.test(l)))
  assert.ok(!busLabels.some((l) => /HGV\s*\/\s*LGV or bus/i.test(l)))
  assert.ok(!busLabels.some((l) => /HGV \/ LGV goods vehicle/i.test(l)))
  assert.ok(busQ.options.some((o) => o.id === 'drive_bus'))
  assert.ok(!busQ.options.some((o) => o.id === 'drive_hgv'))

  const hgvQ = getExperienceQuestionForField('driving-transport', 'hgv-lgv')
  const hgvLabels = hgvQ.options.map((o) => o.label)
  assert.ok(hgvLabels.some((l) => /HGV \/ LGV goods vehicle driving experience/i.test(l)))
  assert.ok(!hgvLabels.some((l) => /bus \/ coach/i.test(l)))
  assert.ok(hgvQ.options.some((o) => o.id === 'drive_hgv'))
  assert.ok(!hgvQ.options.some((o) => o.id === 'drive_bus'))

  const broadQ = getExperienceQuestionForField('driving-transport', 'van-driver')
  assert.ok(broadQ.options.some((o) => o.id === 'drive_hgv'))
  assert.ok(broadQ.options.some((o) => o.id === 'drive_bus'))
  assert.ok(!broadQ.options.some((o) => /HGV\/LGV or bus\/coach/i.test(o.label)))
  console.log('  ✓ Driving experience options separate Bus / PCV from HGV / LGV')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'driving-transport',
    specialism_slug: 'bus-pcv',
    experience_option_id: 'drive_bus',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.some((t) => /Bus Driver/i.test(t)))
  assert.ok(titles.some((t) => /Trainee Bus Driver|PCV Driver/i.test(t)))
  assert.ok(titles.some((t) => /Coach Driver|Passenger Transport|Community Transport|School Transport/i.test(t)))
  assert.ok(!titles.some((t) => /\bHGV\b|\bLGV\b|Class\s*[12]|HIAB/i.test(t)))
  assert.ok(!titles.some((t) => /Taxi|Private Hire|PHV/i.test(t)))
  console.log('  ✓ Bus / PCV match returns passenger roles only')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'driving-transport',
    specialism_slug: 'hgv-lgv',
    experience_option_id: 'drive_hgv',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.some((t) => /\bHGV Driver\b/i.test(t)))
  assert.ok(titles.some((t) => /\bLGV Driver\b|Class\s*[12]/i.test(t)))
  assert.ok(!titles.some((t) => /\bBus\b|\bPCV\b|Coach Driver|Passenger Transport/i.test(t)))
  console.log('  ✓ HGV / LGV match returns goods vehicle roles only')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'driving-transport',
    specialism_slug: 'taxi-phv',
    experience_option_id: 'drive_taxi',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.some((t) => /Taxi|Private Hire|PHV/i.test(t)))
  assert.ok(!titles.some((t) => /\bHGV\b|\bLGV\b|\bBus\b|\bPCV\b|Coach/i.test(t)))
  console.log('  ✓ Taxi / PHV stays separate from bus and HGV')
}

console.log('\nAll contextual level tests passed.\n')
