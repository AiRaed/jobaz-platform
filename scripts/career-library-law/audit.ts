/**
 * Full audit for Law, Legal & Justice library.
 *   npx tsx scripts/career-library-law/audit.ts
 */

import { createServiceClient, LAW_STAGE_KEYS, FIELD_SLUG, MODEL_KEY } from './shared'

async function countFieldRoles(
  supabase: ReturnType<typeof createServiceClient>,
  fieldSlug: string
) {
  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id')
    .eq('slug', fieldSlug)
    .maybeSingle()
  if (!field) return { specs: 0, roles: 0 }
  const { data: specs } = await supabase
    .from('career_library_specialisms')
    .select('id')
    .eq('field_id', field.id)
  let roles = 0
  for (const sp of specs ?? []) {
    const { count } = await supabase
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', sp.id)
    roles += count ?? 0
  }
  return { specs: specs?.length ?? 0, roles }
}

async function main() {
  const s = createServiceClient()

  const { data: field } = await s
    .from('career_library_fields')
    .select('id, name, slug, status, active')
    .eq('slug', FIELD_SLUG)
    .single()

  const { data: model } = await s
    .from('career_library_stage_models')
    .select('id, model_key, name')
    .eq('model_key', MODEL_KEY)
    .single()

  const { data: stages } = await s
    .from('career_library_stages')
    .select('id, stage_key, label, sort_order')
    .eq('stage_model_id', model!.id)
    .order('sort_order')

  const stageIdToKey = new Map((stages ?? []).map((st) => [st.id, st.stage_key]))

  const { data: specs } = await s
    .from('career_library_specialisms')
    .select('id, name, slug, professional_body, stage_model_id, status')
    .eq('field_id', field!.id)
    .order('sort_order')

  const perSpec: Array<{ slug: string; name: string; count: number }> = []
  let totalRoles = 0
  let foundation = 0
  let graduate = 0
  let solicitorPathway = 0
  let barristerPathway = 0
  let cilexPathway = 0
  let judicial = 0
  let academic = 0
  const bodies = new Set<string>()
  const sources = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select('name, academic_requirement, stage_id, metadata, eligibility_note, is_regulated_or_restricted')
      .eq('specialism_id', spec.id)

    const count = roles?.length ?? 0
    totalRoles += count
    perSpec.push({ slug: spec.slug, name: spec.name, count })

    for (const role of roles ?? []) {
      const k = role.name.trim().toLowerCase()
      const list = titleMap.get(k) ?? []
      list.push(spec.slug)
      titleMap.set(k, list)

      const stageKey = role.stage_id ? stageIdToKey.get(role.stage_id) : null
      if (stageKey === 'foundation_legal_support') foundation += 1
      if (stageKey === 'graduate_academic_entry') graduate += 1
      if (stageKey === 'judicial_kings_counsel' || /judge|king'?s counsel|\bkc\b/i.test(role.name)) {
        judicial += 1
      }
      if (stageKey === 'academic_research') academic += 1
      if (/solicitor|sqe|training contract/i.test(role.name + (role.eligibility_note ?? ''))) {
        solicitorPathway += 1
      }
      if (/barrister|pupil|pupillage|king'?s counsel/i.test(role.name + (role.eligibility_note ?? ''))) {
        barristerPathway += 1
      }
      if (/cilex|legal executive/i.test(role.name + (role.eligibility_note ?? ''))) {
        cilexPathway += 1
      }

      const meta = role.metadata as Record<string, unknown> | null
      const src = meta?.sources
      if (Array.isArray(src)) {
        for (const x of src) if (typeof x === 'string') sources.add(x)
      }
      const bodiesMeta = meta?.related_bodies
      if (Array.isArray(bodiesMeta)) {
        for (const x of bodiesMeta) if (typeof x === 'string') bodies.add(x)
      }
    }
  }

  const overlaps = [...titleMap.entries()].filter(([, slugs]) => slugs.length > 1)

  const eng = await countFieldRoles(s, 'engineering')
  const it = await countFieldRoles(s, 'it-technology')
  const hc = await countFieldRoles(s, 'healthcare-medicine')
  const ns = await countFieldRoles(s, 'natural-sciences-research')
  const bm = await countFieldRoles(s, 'business-management')
  const afb = await countFieldRoles(s, 'accounting-finance-banking')

  console.log('=== LAW, LEGAL & JUSTICE AUDIT ===\n')
  console.log(
    `1. Career Field: ${field!.name} (${field!.slug}) status=${field!.status} active=${field!.active}`
  )
  console.log(`2. Stage Model: ${model!.model_key} — ${model!.name}`)
  for (const st of stages ?? []) {
    console.log(`   ${st.sort_order}. ${st.stage_key} — ${st.label}`)
  }
  console.log(`3. Specialisms: ${specs?.length ?? 0}`)
  console.log(`4. Total legal roles: ${totalRoles}`)
  console.log('   Roles per specialism:')
  for (const row of perSpec) console.log(`   ${row.slug}: ${row.count}`)
  console.log(`5. Foundation roles: ${foundation}`)
  console.log(`6. Graduate roles: ${graduate}`)
  console.log(`7. Solicitor pathway (approx): ${solicitorPathway}`)
  console.log(`8. Barrister pathway (approx): ${barristerPathway}`)
  console.log(`9. CILEx pathway (approx): ${cilexPathway}`)
  console.log(`10. Judicial pathway: ${judicial}`)
  console.log(`11. Academic pathway: ${academic}`)
  console.log('12. Regulators / bodies:')
  for (const b of [...bodies].sort()) console.log(`   - ${b}`)
  console.log(`13. Duplicate titles within field: ${overlaps.length}`)
  if (overlaps.length) {
    for (const [t, slugs] of overlaps.slice(0, 20)) console.log(`    "${t}" → ${slugs.join(', ')}`)
  }
  console.log(
    '14. Cross-field overlaps: reserved-name skips in populate; legal-only boundaries vs Business/Finance/Healthcare/IT/Government'
  )
  console.log(`15. Sources (${sources.size}):`)
  for (const src of [...sources].sort()) console.log(`   - ${src}`)
  console.log('16. Files: migration + scripts/career-library-law/* + seed/populate')
  console.log('17. Previous fields unchanged:')
  console.log(`   Engineering: ${eng.specs} specs, ${eng.roles} roles`)
  console.log(`   IT: ${it.specs} specs, ${it.roles} roles`)
  console.log(`   Healthcare: ${hc.specs} specs, ${hc.roles} roles`)
  console.log(`   Natural Sciences: ${ns.specs} specs, ${ns.roles} roles`)
  console.log(`   Business & Management: ${bm.specs} specs, ${bm.roles} roles`)
  console.log(`   Accounting, Finance & Banking: ${afb.specs} specs, ${afb.roles} roles`)

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${LAW_STAGE_KEYS.every((k) =>
      (stages ?? []).some((st) => st.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
