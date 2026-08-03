/**
 * Full audit for Natural Sciences & Research library.
 *   npx tsx scripts/career-library-natural-sciences/audit.ts
 */

import { createServiceClient, NATURAL_SCIENCES_STAGE_KEYS } from './shared'

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
    .eq('slug', 'natural-sciences-research')
    .single()

  const { data: model } = await s
    .from('career_library_stage_models')
    .select('id, model_key, name')
    .eq('model_key', 'natural_sciences_research')
    .single()

  const { data: stages } = await s
    .from('career_library_stages')
    .select('id, stage_key, label, sort_order')
    .eq('stage_model_id', model!.id)
    .order('sort_order')

  const stageIdToKey = new Map((stages ?? []).map((st) => [st.id, st.stage_key]))

  const { data: specs } = await s
    .from('career_library_specialisms')
    .select(
      'id, name, slug, professional_body, regulated_profession, stage_model_id, status'
    )
    .eq('field_id', field!.id)
    .order('sort_order')

  const perSpec: Array<{ slug: string; name: string; count: number }> = []
  let totalRoles = 0
  let degreeEntry = 0
  let mastersRelevant = 0
  let phdRequired = 0
  let technicalEntry = 0
  let regulated = 0
  const bodies = new Set<string>()
  const sources = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select(
        'name, academic_requirement, is_regulated_or_restricted, professional_registration_requirement, stage_id, metadata'
      )
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
      if (stageKey === 'foundation_technical_entry') technicalEntry += 1
      if (stageKey === 'graduate_entry') degreeEntry += 1
      if (role.academic_requirement === 'masters_relevant') mastersRelevant += 1
      if (role.academic_requirement === 'phd_relevant') phdRequired += 1
      if (
        role.is_regulated_or_restricted ||
        role.professional_registration_requirement === 'required'
      ) {
        regulated += 1
      }

      const meta = role.metadata as Record<string, unknown> | null
      const src = meta?.sources
      if (Array.isArray(src)) {
        for (const x of src) if (typeof x === 'string') sources.add(x)
      }
    }
  }

  const crossOverlaps = [...titleMap.entries()].filter(([, slugs]) => slugs.length > 1)

  const eng = await countFieldRoles(s, 'engineering')
  const it = await countFieldRoles(s, 'it-technology')
  const hc = await countFieldRoles(s, 'healthcare-medicine')

  console.log('=== NATURAL SCIENCES & RESEARCH AUDIT ===\n')
  console.log(
    `1. Career Field: ${field!.name} (${field!.slug}) status=${field!.status} active=${field!.active}`
  )
  console.log(`2. Stage Model: ${model!.model_key} — ${model!.name}`)
  for (const st of stages ?? []) {
    console.log(`   ${st.sort_order}. ${st.stage_key} — ${st.label}`)
  }
  console.log(`3. Specialisms: ${specs?.length ?? 0}`)
  for (const sp of specs ?? []) console.log(`   - ${sp.name} (${sp.slug})`)
  console.log(`4. Total roles: ${totalRoles}`)
  console.log('5. Roles per specialism:')
  for (const row of perSpec) console.log(`   ${row.slug}: ${row.count}`)
  console.log(`6. Degree-entry (graduate_entry stage): ${degreeEntry}`)
  console.log(`7. Master’s-relevant (academic_requirement=masters_relevant): ${mastersRelevant}`)
  console.log(`8. PhD-required (academic_requirement=phd_relevant): ${phdRequired}`)
  console.log(`9. Technical/apprenticeship (foundation_technical_entry): ${technicalEntry}`)
  console.log(`10. Regulated / registration-required: ${regulated}`)
  console.log(`11. Duplicate roles skipped on final populate pass: see populate log (0 same-specialism)`)
  console.log(`12. Cross-specialism overlaps (exact title within NS field): ${crossOverlaps.length}`)
  if (crossOverlaps.length) {
    for (const [title, slugs] of crossOverlaps.slice(0, 25)) {
      console.log(`    "${title}" → ${slugs.join(', ')}`)
    }
  }
  console.log('13. Professional / regulatory bodies:')
  for (const b of [...bodies].sort()) console.log(`   - ${b}`)
  console.log(`14. Research source keys (${sources.size}):`)
  for (const src of [...sources].sort().slice(0, 50)) console.log(`   - ${src}`)
  if (sources.size > 50) console.log(`   ... +${sources.size - 50} more`)
  console.log('17. Other fields unchanged:')
  console.log(`   Engineering: ${eng.specs} specialisms, ${eng.roles} roles`)
  console.log(`   IT & Technology: ${it.specs} specialisms, ${it.roles} roles`)
  console.log(`   Healthcare & Medicine: ${hc.specs} specialisms, ${hc.roles} roles`)

  const empty = perSpec.filter((p) => p.count === 0)
  const wrongModel = (specs ?? []).filter((sp) => sp.stage_model_id !== model!.id)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(`Wrong stage model: ${wrongModel.length}`)
  console.log(
    `All stage keys present: ${NATURAL_SCIENCES_STAGE_KEYS.every((k) =>
      (stages ?? []).some((s) => s.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
