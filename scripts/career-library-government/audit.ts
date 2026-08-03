/**
 * Full audit for Government, Public Policy & International Development.
 *   npx tsx scripts/career-library-government/audit.ts
 */

import { createServiceClient, FIELD_SLUG, GOV_STAGE_KEYS, MODEL_KEY } from './shared'

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

  const perSpec: Array<{ slug: string; name: string; count: number; domain?: string }> = []
  let totalRoles = 0
  const byStage: Record<string, number> = {}
  for (const k of GOV_STAGE_KEYS) byStage[k] = 0

  let nonDegree = 0
  let graduateEntry = 0
  let masters = 0
  let phd = 0
  let securitySensitive = 0
  let policyAnalytical = 0
  let intlDev = 0
  let diplomatic = 0
  let publicAffairs = 0
  let regulation = 0
  let scsHead = 0
  let directorExec = 0
  const professions = new Set<string>()
  const titleMap = new Map<string, string[]>()
  const sources = new Set<string>()

  for (const spec of specs ?? []) {
    const { data: roles } = await s
      .from('career_library_roles')
      .select('name, academic_requirement, stage_id, metadata, is_regulated_or_restricted')
      .eq('specialism_id', spec.id)

    const count = roles?.length ?? 0
    totalRoles += count
    const domain = (roles?.[0]?.metadata as { domain_tag?: string } | null)?.domain_tag
    perSpec.push({ slug: spec.slug, name: spec.name, count, domain })

    for (const role of roles ?? []) {
      const k = role.name.trim().toLowerCase()
      const list = titleMap.get(k) ?? []
      list.push(spec.slug)
      titleMap.set(k, list)

      const meta = (role.metadata ?? {}) as Record<string, unknown>
      const stageKey = role.stage_id ? stageIdToKey.get(role.stage_id) : null
      if (stageKey && byStage[stageKey] !== undefined) byStage[stageKey] += 1

      if (role.academic_requirement === 'none') nonDegree += 1
      if (stageKey === 'graduate_public_service_entry') graduateEntry += 1
      if (role.academic_requirement === 'masters_relevant') masters += 1
      if (role.academic_requirement === 'phd_relevant') phd += 1

      const clearance = String(meta.security_clearance ?? 'none')
      if (
        role.is_regulated_or_restricted ||
        (clearance !== 'none' && clearance !== 'baseline_possible')
      ) {
        securitySensitive += 1
      }

      const domainTag = String(meta.domain_tag ?? '')
      if (domainTag === 'policy' || domainTag === 'government_analytical') policyAnalytical += 1
      if (domainTag === 'international_development') intlDev += 1
      if (domainTag === 'diplomacy') diplomatic += 1
      if (domainTag === 'public_affairs') publicAffairs += 1
      if (domainTag === 'regulation_governance') regulation += 1
      if (stageKey === 'head_senior_civil_service') scsHead += 1
      if (
        stageKey === 'director_diplomatic_leadership' ||
        stageKey === 'executive_public_service_leadership'
      ) {
        directorExec += 1
      }

      if (meta.government_profession) professions.add(String(meta.government_profession))
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
  ])

  console.log('=== GOVERNMENT, PUBLIC POLICY & INTERNATIONAL DEVELOPMENT AUDIT ===\n')
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
  for (const k of GOV_STAGE_KEYS) console.log(`   ${k}: ${byStage[k]}`)
  console.log(`7. Non-degree public-service entry: ${nonDegree}`)
  console.log(`8. Graduate-entry stage roles: ${graduateEntry}`)
  console.log(`9. Policy and analytical roles: ${policyAnalytical}`)
  console.log(`10. International-development roles: ${intlDev}`)
  console.log(`11. Diplomatic / foreign-affairs roles: ${diplomatic}`)
  console.log(`12. Public-affairs roles: ${publicAffairs}`)
  console.log(`13. Regulatory and governance roles: ${regulation}`)
  console.log(`14. Senior Civil Service / Head roles: ${scsHead}`)
  console.log(`15. Director / Executive roles: ${directorExec}`)
  console.log(`16. Master’s-relevant roles: ${masters}`)
  console.log(`17. PhD-relevant academic/research roles: ${phd}`)
  console.log(`18. Security-sensitive / restricted roles: ${securitySensitive}`)
  console.log('19. Elected/public-office routes: excluded from role packs (elected_office=false)')
  console.log('20. UK government professions referenced:')
  for (const p of [...professions].sort()) console.log(`   - ${p}`)
  console.log(`21. Duplicate titles within field: ${overlaps.length}`)
  if (overlaps.length) {
    for (const [title, slugs] of overlaps.slice(0, 20)) {
      console.log(`   ${title} -> ${slugs.join(', ')}`)
    }
  }
  console.log('22. Sources (from metadata):')
  for (const src of [...sources].sort()) console.log(`   - ${src}`)
  console.log('23. Previous fields unchanged:')
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
  ]
  prev.forEach((c, i) => console.log(`   ${labels[i]}: ${c.specs} specs, ${c.roles} roles`))

  const empty = perSpec.filter((p) => p.count === 0)
  console.log(`\nEmpty specialisms: ${empty.length ? empty.map((e) => e.slug).join(', ') : 'none'}`)
  console.log(
    `All stage keys present: ${GOV_STAGE_KEYS.every((k) =>
      (stages ?? []).some((st) => st.stage_key === k)
    )}`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
