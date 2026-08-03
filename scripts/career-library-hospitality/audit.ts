/**
 * Full audit for Hospitality, Tourism & Events.
 *   npx tsx scripts/career-library-hospitality/audit.ts
 */

import { createServiceClient, FIELD_SLUG, HTE_STAGE_KEYS, MODEL_KEY } from './shared'

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
    .select('id, name, slug, professional_body')
    .eq('field_id', field!.id)
    .order('sort_order')

  const perSpec: Array<{ slug: string; name: string; count: number }> = []
  let totalRoles = 0
  const byStage: Record<string, number> = {}
  for (const k of HTE_STAGE_KEYS) byStage[k] = 0

  let vocational = 0
  let graduate = 0
  let opsSupport = 0
  let supervisor = 0
  let professionalMgr = 0
  let commercial = 0
  let tourismDev = 0
  let eventsCount = 0
  let venuesCount = 0
  let seniorHead = 0
  let directorGm = 0
  let ownershipConsult = 0
  let masters = 0
  let phd = 0
  let lowBarrier = 0
  const licenceNames = new Set<string>()
  const bodies = new Set<string>()
  const sources = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select('name, academic_requirement, stage_id, metadata')
      .eq('specialism_id', spec.id)

    const count = roles?.length ?? 0
    totalRoles += count
    perSpec.push({ slug: spec.slug, name: spec.name, count })

    for (const role of roles ?? []) {
      const k = role.name.trim().toLowerCase()
      const list = titleMap.get(k) ?? []
      list.push(spec.slug)
      titleMap.set(k, list)

      const meta = (role.metadata ?? {}) as Record<string, unknown>
      const stageKey = role.stage_id ? stageIdToKey.get(role.stage_id) : null
      if (stageKey && byStage[stageKey] !== undefined) byStage[stageKey] += 1

      if (meta.vocational_route || meta.apprenticeship_route) vocational += 1
      if (stageKey === 'graduate_management_entry') graduate += 1
      if (stageKey === 'foundation_operational_support') opsSupport += 1
      if (stageKey === 'supervisor_coordinator') supervisor += 1
      if (stageKey === 'professional_practitioner_manager') professionalMgr += 1
      if (String(meta.domain_tag) === 'commercial_analytical') commercial += 1
      if (
        String(meta.domain_tag) === 'tourism' ||
        String(meta.domain_tag) === 'sustainability_policy'
      ) {
        tourismDev += 1
      }
      if (String(meta.domain_tag) === 'events') eventsCount += 1
      if (String(meta.domain_tag) === 'venues') venuesCount += 1
      if (
        stageKey === 'experienced_specialist_senior_manager' ||
        stageKey === 'head_multisite_leadership'
      ) {
        seniorHead += 1
      }
      if (stageKey === 'director_general_management') directorGm += 1
      if (
        meta.ownership_route ||
        meta.consultancy_route ||
        stageKey === 'executive_ownership_consultancy'
      ) {
        ownershipConsult += 1
      }
      if (role.academic_requirement === 'masters_relevant') masters += 1
      if (role.academic_requirement === 'phd_relevant') phd += 1
      if (meta.low_barrier_operational) lowBarrier += 1

      const licences = meta.licences
      if (Array.isArray(licences)) {
        for (const lic of licences) {
          if (lic && typeof lic === 'object' && 'name' in lic) {
            licenceNames.add(String((lic as { name: string }).name))
          }
        }
      }
      const srcs = meta.sources
      if (Array.isArray(srcs)) for (const x of srcs) sources.add(String(x))
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
    countFieldRoles(s, 'humanities-social-sciences'),
    countFieldRoles(s, 'environment-agriculture-food'),
    countFieldRoles(s, 'government-public-policy-international-development'),
  ])

  console.log('=== HOSPITALITY, TOURISM & EVENTS AUDIT ===\n')
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
  for (const k of HTE_STAGE_KEYS) console.log(`   ${k}: ${byStage[k]}`)
  console.log(`7. Vocational/apprenticeship entry: ${vocational}`)
  console.log(`8. Graduate-management entry: ${graduate}`)
  console.log(`9. Operational-support roles: ${opsSupport}`)
  console.log(`10. Coordinator/supervisor: ${supervisor}`)
  console.log(`11. Professional-manager: ${professionalMgr}`)
  console.log(`12. Revenue/commercial/analytical domain: ${commercial}`)
  console.log(`13. Tourism-development / sustainability domain: ${tourismDev}`)
  console.log(`14. Events domain: ${eventsCount}`)
  console.log(`15. Venue/attraction domain: ${venuesCount}`)
  console.log(`16. Senior/head roles: ${seniorHead}`)
  console.log(`17. Director/GM roles: ${directorGm}`)
  console.log(`18. Ownership/consultancy routes: ${ownershipConsult}`)
  console.log(`19. Master’s-relevant: ${masters}`)
  console.log(`20. PhD-relevant academic/research: ${phd}`)
  console.log('21. Licensing/compliance metadata used:')
  for (const n of [...licenceNames].sort()) console.log(`   - ${n}`)
  console.log('22. Professional bodies (sample):')
  for (const b of [...bodies].sort().slice(0, 25)) console.log(`   - ${b}`)
  if (bodies.size > 25) console.log(`   ... +${bodies.size - 25} more`)
  console.log(`23. Low-barrier operational (tagged): ${lowBarrier}`)
  console.log(`24. Duplicate titles within field: ${overlaps.length}`)
  console.log('25. Sources:')
  for (const src of [...sources].sort()) console.log(`   - ${src}`)
  console.log('26. Previous fields unchanged:')
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
    'Humanities & Social Sciences',
    'Environment, Agriculture & Food',
    'Government, Public Policy & International Development',
  ]
  prev.forEach((c, i) => console.log(`   ${labels[i]}: ${c.specs} specs, ${c.roles} roles`))

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${HTE_STAGE_KEYS.every((k) =>
      (stages ?? []).some((st) => st.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
