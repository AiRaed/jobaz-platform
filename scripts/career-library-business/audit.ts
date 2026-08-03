/**
 * Full audit for Business & Management library.
 *   npx tsx scripts/career-library-business/audit.ts
 */

import { createServiceClient, BUSINESS_STAGE_KEYS, FIELD_SLUG } from './shared'

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
    .eq('model_key', 'business_management_route')
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
  let vocational = 0
  let graduateEntry = 0
  let nonDegree = 0
  let management = 0
  let seniorHeadDirector = 0
  let mbaRelevant = 0
  let phdRequired = 0
  let consulting = 0
  const bodies = new Set<string>()
  const sources = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select(
        'name, academic_requirement, role_category, stage_id, metadata, seniority_level'
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
      if (stageKey === 'foundation_business_support') vocational += 1
      if (stageKey === 'graduate_entry') graduateEntry += 1
      if (role.academic_requirement === 'none') nonDegree += 1
      if (
        role.role_category === 'leadership' ||
        stageKey === 'experienced_manager' ||
        stageKey === 'senior_manager_specialist'
      ) {
        management += 1
      }
      if (
        stageKey === 'senior_manager_specialist' ||
        stageKey === 'head_programme_leadership' ||
        stageKey === 'director_executive'
      ) {
        seniorHeadDirector += 1
      }
      if (role.academic_requirement === 'masters_relevant') mbaRelevant += 1
      if (role.academic_requirement === 'phd_relevant') phdRequired += 1
      if (stageKey === 'consultant_independent' || role.role_category === 'consultancy') {
        consulting += 1
      }

      const meta = role.metadata as Record<string, unknown> | null
      const src = meta?.sources
      if (Array.isArray(src)) {
        for (const x of src) if (typeof x === 'string') sources.add(x)
      }
    }
  }

  const overlaps = [...titleMap.entries()].filter(([, slugs]) => slugs.length > 1)

  const eng = await countFieldRoles(s, 'engineering')
  const it = await countFieldRoles(s, 'it-technology')
  const hc = await countFieldRoles(s, 'healthcare-medicine')
  const ns = await countFieldRoles(s, 'natural-sciences-research')

  console.log('=== BUSINESS & MANAGEMENT AUDIT ===\n')
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
  console.log(`6. Apprenticeship / vocational (foundation_business_support): ${vocational}`)
  console.log(`7. Graduate-entry: ${graduateEntry}`)
  console.log(`8. Non-degree-accessible (academic_requirement=none): ${nonDegree}`)
  console.log(`9. Management-role count (leadership category / manager stages): ${management}`)
  console.log(`10. Senior / Head / Director stage roles: ${seniorHeadDirector}`)
  console.log(`11. MBA-relevant (masters_relevant): ${mbaRelevant}`)
  console.log(`12. PhD-required (phd_relevant): ${phdRequired}`)
  console.log(`13. Consulting / independent pathway: ${consulting}`)
  console.log('14. Professional bodies:')
  for (const b of [...bodies].sort()) console.log(`   - ${b}`)
  console.log(`15. Duplicate titles within field: ${overlaps.length}`)
  console.log(`16. Cross-specialism overlaps: ${overlaps.length}`)
  if (overlaps.length) {
    for (const [t, slugs] of overlaps.slice(0, 20)) console.log(`    "${t}" → ${slugs.join(', ')}`)
  }
  console.log(`17. Sources (${sources.size}):`)
  for (const src of [...sources].sort().slice(0, 40)) console.log(`   - ${src}`)
  if (sources.size > 40) console.log(`   ... +${sources.size - 40} more`)
  console.log('20. Previous fields unchanged:')
  console.log(`   Engineering: ${eng.specs} specs, ${eng.roles} roles`)
  console.log(`   IT: ${it.specs} specs, ${it.roles} roles`)
  console.log(`   Healthcare: ${hc.specs} specs, ${hc.roles} roles`)
  console.log(`   Natural Sciences: ${ns.specs} specs, ${ns.roles} roles`)

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${BUSINESS_STAGE_KEYS.every((k) =>
      (stages ?? []).some((s) => s.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
