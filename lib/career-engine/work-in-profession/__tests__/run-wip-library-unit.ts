/**

 * Acceptance tests for Work in My Profession library v1.

 *   npx tsx lib/career-engine/work-in-profession/__tests__/run-wip-library-unit.ts

 */



import assert from 'node:assert/strict'

import {

  dedupeProfessionRoles,

  getProfessionLibraryCounts,

  listProfessionFields,

  listRoles,

  listSpecialismsForField,

  loadProfessionKnowledge,

  lookupProfessionRoles,

  professionRoleDedupeKey,

  WIP_STATUS,

  type ProfessionRole,

} from '../index'



console.log('\n=== Work in My Profession library v1 (audit) ===\n')



{

  const counts = getProfessionLibraryCounts()

  assert.equal(counts.fields, 18)

  assert.ok(counts.specialisms > 80)

  assert.ok(counts.roles > 200)

  assert.equal(counts.role_targets, counts.roles)

  assert.equal(counts.status, WIP_STATUS)

  assert.ok(typeof counts.duplicates_removed === 'number')

  assert.ok(counts.raw_roles >= counts.roles)

  console.log(

    `  ✓ Library loaded: ${counts.fields} fields · ${counts.specialisms} specialisms · ${counts.levels} levels · ${counts.role_targets} role targets · ${counts.duplicates_removed} duplicates removed`

  )

}



{

  const knowledge = loadProfessionKnowledge()

  const keys = new Set<string>()

  for (const role of knowledge.roles) {

    assert.ok(role.role_title.trim().length > 0, `empty role_title on ${role.id}`)

    const key = professionRoleDedupeKey(role)

    assert.equal(keys.has(key), false, `duplicate role key: ${key}`)

    keys.add(key)

    assert.equal(role.status, WIP_STATUS)

  }

  console.log('  ✓ No duplicate field+specialism+level+role_title+licence rows; all titles present')

}



{

  const result = lookupProfessionRoles({

    fieldSlug: 'warehouse-logistics',

    specialismSlug: 'forklift-flt',

    professionalLevel: 'experienced_worker',

  })

  const titles = result.roles.map((r) => r.role_title)

  assert.ok(titles.length >= 3)

  assert.ok(titles.includes('Forklift Driver'))

  assert.ok(titles.includes('Goods In Operative'))

  assert.ok(titles.includes('Stock Controller'))

  console.log('  ✓ Warehouse → Forklift → Experienced Worker has multiple UK target roles')

}



{

  const result = lookupProfessionRoles({

    fieldSlug: 'electrical-technical',

    specialismSlug: 'electrician',

    professionalLevel: 'helper_assistant',

  })

  const titles = result.roles.map((r) => r.role_title)

  assert.ok(titles.includes('Electrician Mate'))

  assert.ok(titles.includes('Electrical Labourer'))

  assert.ok(!titles.every((t) => /helper|assistant/i.test(t) && t.split(/\s+/).length <= 1))

  console.log('  ✓ Electrical → Electrician → Helper shows concrete UK target roles')

}



{

  const result = lookupProfessionRoles({

    fieldSlug: 'hospitality',

    specialismSlug: 'kitchen-assistant',

    professionalLevel: 'beginner',

  })

  const titles = result.roles.map((r) => r.role_title)

  assert.ok(titles.includes('Kitchen Assistant'))

  assert.ok(titles.includes('Catering Assistant'))

  assert.ok(titles.includes('Commis Chef'))

  console.log('  ✓ Hospitality → Kitchen Assistant → Beginner roles')

}



{

  const result = lookupProfessionRoles({

    fieldSlug: 'care-support',

    specialismSlug: 'adult-care',

    professionalLevel: 'beginner',

  })

  const titles = result.roles.map((r) => r.role_title)

  assert.ok(titles.includes('Care Assistant'))

  assert.ok(titles.includes('Support Worker'))

  assert.ok(titles.includes('Home Care Assistant'))

  console.log('  ✓ Care → Adult Care → Beginner roles')

}



{

  const result = lookupProfessionRoles({

    fieldSlug: 'digital-it-support',

    specialismSlug: 'it-support',

    professionalLevel: 'beginner',

  })

  const titles = result.roles.map((r) => r.role_title)

  assert.ok(titles.includes('IT Support Assistant'))

  assert.ok(titles.includes('Helpdesk Assistant'))

  console.log('  ✓ Digital → IT Support → Beginner roles')

}



{

  const filtered = listRoles({

    field_slug: 'warehouse-logistics',

    specialism_slug: 'forklift-flt',

    professional_level: 'experienced_worker',

  })

  assert.ok(filtered.length >= 3)

  assert.ok(filtered.every((r) => r.role_title.trim().length > 0))

  console.log('  ✓ Filtering by field + specialism + level still works')

}



{

  const base = listRoles({

    field_slug: 'electrical-technical',

    specialism_slug: 'electrician',

    professional_level: 'helper_assistant',

  })[0]

  assert.ok(base)

  const clone: ProfessionRole = {

    ...base,

    id: `${base.id}-dup`,

    description: `${base.description} (merged)`,

    progression_roles: [...base.progression_roles, 'Extra Progression'],

  }

  const result = dedupeProfessionRoles([base, clone])

  assert.equal(result.raw_count, 2)

  assert.equal(result.unique_count, 1)

  assert.equal(result.duplicates_removed, 1)

  assert.ok(result.roles[0].progression_roles.includes('Extra Progression'))

  console.log('  ✓ Dedupe merge helper removes duplicate rows and merges metadata')

}



{

  const specs = listSpecialismsForField('warehouse-logistics')

  assert.ok(specs.some((s) => s.slug === 'forklift-flt'))

  const all = listRoles()

  assert.ok(all.every((r) => r.status === WIP_STATUS))

  assert.ok(all.every((r) => !('referralUrl' in r)))

  const knowledge = loadProfessionKnowledge()

  assert.equal(knowledge.version, 'work_in_profession.v1')

  assert.equal(listProfessionFields().length, 18)

  console.log('  ✓ Draft status only; no course/affiliate fields')

}



console.log('\nAll Work in My Profession audit tests passed.\n')


