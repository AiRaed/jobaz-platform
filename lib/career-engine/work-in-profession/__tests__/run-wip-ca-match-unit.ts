/**
 * Acceptance tests for Work in My Profession Career Assistant match.
 *   npx tsx lib/career-engine/work-in-profession/__tests__/run-wip-ca-match-unit.ts
 */

import assert from 'node:assert/strict'
import {
  DEFAULT_PROFESSION_GOAL,
  matchProfessionLibrary,
  WIP_COURSES_PLACEHOLDER,
  WIP_DEFAULT_RESULT_FRAMING,
} from '../index'

console.log('\n=== Work in My Profession → Career Assistant match ===\n')

{
  const result = matchProfessionLibrary({
    field_slug: 'electrical-technical',
    specialism_slug: 'electrician',
    experience_option_id: 'elec_assisted',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.equal(result.pathway, 'work_in_my_profession')
  assert.equal(result.result_source, 'work_in_profession_library')
  assert.equal(result.selected_goal, DEFAULT_PROFESSION_GOAL)
  assert.equal(result.result_framing, WIP_DEFAULT_RESULT_FRAMING)
  assert.equal(result.experience_result_label, 'Experience')
  assert.equal(result.experience_display_label, 'Assisted electricians or technical workers')
  assert.ok(titles.includes('Electrician Mate'))
  assert.ok(titles.includes('Electrical Labourer'))
  assert.ok(titles.includes('Electrical Improver') || titles.some((t) => /Improver|PAT/i.test(t)))
  assert.ok(result.matched_role_count >= 3)
  assert.ok(!/graduate|degree|university|education field/i.test(JSON.stringify(result)))
  assert.ok(!/What do you want to do with this profession now/i.test(JSON.stringify(result)))
  assert.equal(result.courses_note, WIP_COURSES_PLACEHOLDER)
  console.log('  ✓ Electrical → Electrician → contextual assisted experience')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'warehouse-logistics',
    specialism_slug: 'forklift-flt',
    experience_option_id: 'wh_forklift',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.includes('Forklift Driver'))
  assert.ok(titles.includes('Goods In Operative') || titles.some((t) => /Goods In/i.test(t)))
  assert.ok(titles.includes('Stock Controller') || titles.some((t) => /Stock/i.test(t)))
  assert.ok(result.matched_role_count >= 3)
  assert.equal(result.experience_mode, 'warehouse')
  console.log('  ✓ Warehouse → Forklift → warehouse-specific experience')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_sia_door',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.includes('Door Supervisor'))
  assert.ok(titles.some((t) => /Event Security|Retail Security|Door Supervisor|Venue Security/i.test(t)))
  assert.ok(result.requirements.some((r) => /SIA/i.test(r)))
  assert.ok(result.roles.some((r) => r.licence_or_check && /SIA/i.test(r.licence_or_check)))
  assert.equal(result.experience_display_label, 'SIA Door Supervisor licence')
  console.log('  ✓ Security → Door Security → SIA Door Supervisor')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'care-support',
    specialism_slug: 'adult-care',
    experience_option_id: 'care_assistant',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.includes('Care Assistant') || titles.some((t) => /Care Assistant/i.test(t)))
  assert.ok(result.requirements.some((r) => /DBS/i.test(r)))
  assert.equal(result.experience_display_label, 'Worked as a Care Assistant')
  console.log('  ✓ Care → Adult Care → Care Assistant (direct result)')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'hospitality',
    specialism_slug: 'kitchen-assistant',
    experience_option_id: 'hosp_kitchen',
  })
  const titles = result.roles.map((r) => r.role_title)
  assert.ok(titles.includes('Kitchen Assistant'))
  assert.ok(titles.includes('Catering Assistant') || titles.some((t) => /Catering|Commis/i.test(t)))
  assert.ok(titles.includes('Commis Chef') || titles.some((t) => /Chef|Cook/i.test(t)))
  assert.ok(result.roles.every((r) => r.role_title.trim().length > 0))
  assert.equal(result.experience_mode, 'hospitality')
  assert.ok(
    result.roles.every((r) =>
      ['Best immediate route', 'Good match', 'Progression route'].includes(r.match_label)
    )
  )
  console.log('  ✓ Hospitality → Kitchen Assistant → kitchen experience')
}

{
  const result = matchProfessionLibrary({
    field_slug: 'digital-it-support',
    specialism_slug: 'it-support',
    experience_option_id: 'digital_helpdesk',
  })
  assert.ok(result.roles.some((r) => /IT Support|Helpdesk/i.test(r.role_title)))
  assert.equal(result.experience_mode, 'digital')
  assert.ok(!('referralUrl' in (result.roles[0] || {})))
  assert.ok(!JSON.stringify(result).includes('Apply Now'))
  assert.ok(!JSON.stringify(result).includes('draft_internal'))
  console.log('  ✓ No courses / Apply Now / draft_internal in public result')
}

console.log('\nAll Work in My Profession CA match tests passed.\n')
