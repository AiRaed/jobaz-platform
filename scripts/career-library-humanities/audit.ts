/**
 * Full audit for Humanities & Social Sciences library.
 *   npx tsx scripts/career-library-humanities/audit.ts
 */

import { createServiceClient, HSS_STAGE_KEYS, FIELD_SLUG, MODEL_KEY } from './shared'

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
    .select('id, name, slug, professional_body, stage_model_id')
    .eq('field_id', field!.id)
    .order('sort_order')

  const perSpec: Array<{ slug: string; name: string; count: number }> = []
  let totalRoles = 0
  const byStage: Record<string, number> = {}
  for (const k of HSS_STAGE_KEYS) byStage[k] = 0
  let entryRegRequired = 0
  let nonDegree = 0
  let masters = 0
  let phd = 0
  const bodies = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select(
        'name, academic_requirement, stage_id, professional_registration_requirement, metadata'
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
      if (stageKey && byStage[stageKey] !== undefined) byStage[stageKey] += 1
      if (
        (stageKey === 'foundation_social_support' ||
          stageKey === 'graduate_social_sciences_entry') &&
        role.professional_registration_requirement !== 'none'
      ) {
        entryRegRequired += 1
      }
      if (role.academic_requirement === 'none') nonDegree += 1
      if (role.academic_requirement === 'masters_relevant') masters += 1
      if (role.academic_requirement === 'phd_relevant') phd += 1
    }
  }

  const overlaps = [...titleMap.entries()].filter(([, slugs]) => slugs.length > 1)

  const prev = await Promise.all([
    countFieldRoles(s, 'engineering'),
    countFieldRoles(s, 'it-technology'),
    countFieldRoles(s, 'healthcare-medicine'),
    countFieldRoles(s, 'natural-sciences-research'),
    countFieldRoles(s, 'business-management'),
    countFieldRoles(s, 'accounting-finance-banking'),
    countFieldRoles(s, 'law-legal-justice'),
    countFieldRoles(s, 'education-teaching'),
    countFieldRoles(s, 'arts-media-creative-industries'),
    countFieldRoles(s, 'languages-literature'),
  ])

  console.log('=== HUMANITIES & SOCIAL SCIENCES AUDIT ===\n')
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
  console.log('6. Roles by stage:')
  for (const k of HSS_STAGE_KEYS) console.log(`   ${k}: ${byStage[k]}`)
  console.log(`7. Entry roles requiring registration (expect 0): ${entryRegRequired}`)
  console.log(`8. Non-degree-accessible: ${nonDegree}`)
  console.log(`9. Master’s-relevant: ${masters}`)
  console.log(`10. PhD-relevant: ${phd}`)
  console.log(`11. Duplicate titles: ${overlaps.length}`)
  console.log('12. Previous fields unchanged:')
  const labels = [
    'Engineering',
    'IT',
    'Healthcare',
    'Natural Sciences',
    'Business & Management',
    'Accounting, Finance & Banking',
    'Law, Legal & Justice',
    'Education & Teaching',
    'Arts, Media & Creative Industries',
    'Languages & Literature',
  ]
  prev.forEach((c, i) => console.log(`   ${labels[i]}: ${c.specs} specs, ${c.roles} roles`))

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${HSS_STAGE_KEYS.every((k) =>
      (stages ?? []).some((st) => st.stage_key === k)
    )}`
  )
  console.log(
    `All specialisms on HSS stage model: ${(specs ?? []).every((sp) => sp.stage_model_id === model!.id)}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
