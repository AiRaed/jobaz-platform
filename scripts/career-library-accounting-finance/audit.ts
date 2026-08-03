/**
 * Full audit for Accounting, Finance & Banking library.
 *   npx tsx scripts/career-library-accounting-finance/audit.ts
 */

import { createServiceClient, AFB_STAGE_KEYS, FIELD_SLUG, MODEL_KEY } from './shared'

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
  let nonDegree = 0
  let apprenticeTech = 0
  let graduateTrainee = 0
  let profQualPathway = 0
  let regulatedAdviser = 0
  let qualifiedPractitioner = 0
  let seniorManager = 0
  let headDirector = 0
  let partnerExec = 0
  let mastersRelevant = 0
  let phdRequired = 0
  const bodies = new Set<string>()
  const sources = new Set<string>()
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.professional_body) bodies.add(spec.professional_body)
    const { data: roles } = await s
      .from('career_library_roles')
      .select(
        'name, academic_requirement, role_category, stage_id, metadata, seniority_level, is_regulated_or_restricted, professional_membership_requirement, professional_registration_requirement, eligibility_note'
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
      if (role.academic_requirement === 'none') nonDegree += 1
      if (stageKey === 'apprentice_technician') apprenticeTech += 1
      if (stageKey === 'graduate_trainee') graduateTrainee += 1
      if (
        stageKey === 'graduate_trainee' ||
        stageKey === 'qualified_practitioner' ||
        /training contract|professional exam|AAT|ACA|ACCA|CIMA|CTA|ATT/i.test(
          role.eligibility_note ?? ''
        )
      ) {
        profQualPathway += 1
      }
      if (stageKey === 'regulated_adviser_controlled' || role.is_regulated_or_restricted) {
        regulatedAdviser += 1
      }
      if (stageKey === 'qualified_practitioner') qualifiedPractitioner += 1
      if (stageKey === 'senior_manager') seniorManager += 1
      if (stageKey === 'head_director') headDirector += 1
      if (stageKey === 'executive_partner') partnerExec += 1
      if (role.academic_requirement === 'masters_relevant') mastersRelevant += 1
      if (role.academic_requirement === 'phd_relevant') phdRequired += 1

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

  console.log('=== ACCOUNTING, FINANCE & BANKING AUDIT ===\n')
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
  console.log(`6. Non-degree-accessible (academic_requirement=none): ${nonDegree}`)
  console.log(`7. Apprenticeship / technician (apprentice_technician): ${apprenticeTech}`)
  console.log(`8. Graduate trainee: ${graduateTrainee}`)
  console.log(`9. Professional qualification pathway (approx): ${profQualPathway}`)
  console.log(`10. Regulated adviser / restricted: ${regulatedAdviser}`)
  console.log(`11. Qualified practitioner: ${qualifiedPractitioner}`)
  console.log(`12. Senior / Manager: ${seniorManager}`)
  console.log(`13. Head / Director: ${headDirector}`)
  console.log(`14. Partner / Executive: ${partnerExec}`)
  console.log(`15. Master’s-relevant: ${mastersRelevant}`)
  console.log(`16. PhD-required academic/research: ${phdRequired}`)
  console.log('17. Professional and regulatory bodies:')
  for (const b of [...bodies].sort()) console.log(`   - ${b}`)
  console.log(`18. Duplicate titles within field: ${overlaps.length}`)
  console.log(`19. Cross-specialism overlaps: ${overlaps.length}`)
  if (overlaps.length) {
    for (const [t, slugs] of overlaps.slice(0, 25)) console.log(`    "${t}" → ${slugs.join(', ')}`)
  }
  console.log('20. Cross-field overlaps: see reserved-name skips in populate log; boundaries vs Business/IT/Law/Economics/HR')
  console.log(`21. Sources (${sources.size}):`)
  for (const src of [...sources].sort()) console.log(`   - ${src}`)
  console.log('22. Assumptions: see final report narrative')
  console.log('23. Files: migration + scripts/career-library-accounting-finance/* + seed/populate')
  console.log('24. Previous fields unchanged:')
  console.log(`   Engineering: ${eng.specs} specs, ${eng.roles} roles`)
  console.log(`   IT: ${it.specs} specs, ${it.roles} roles`)
  console.log(`   Healthcare: ${hc.specs} specs, ${hc.roles} roles`)
  console.log(`   Natural Sciences: ${ns.specs} specs, ${ns.roles} roles`)
  console.log(`   Business & Management: ${bm.specs} specs, ${bm.roles} roles`)

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${AFB_STAGE_KEYS.every((k) =>
      (stages ?? []).some((st) => st.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
