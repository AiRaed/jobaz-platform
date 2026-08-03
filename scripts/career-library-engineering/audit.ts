/**
 * Audit Engineering after professional stage remap.
 *   npx tsx scripts/career-library-engineering/audit.ts
 */

import {
  createServiceClient,
  ENG_STAGE_KEYS,
  FIELD_SLUG,
  MODEL_KEY,
  LEGACY_MODEL_KEY,
} from './shared'

async function countFieldRoles(
  supabase: ReturnType<typeof createServiceClient>,
  fieldSlug: string
) {
  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id')
    .eq('slug', fieldSlug)
    .maybeSingle()
  if (!field) return { specs: 0, roles: 0, modelKeys: [] as string[] }
  const { data: specs } = await supabase
    .from('career_library_specialisms')
    .select('id, stage_model_id')
    .eq('field_id', field.id)
  let roles = 0
  const modelIds = new Set((specs ?? []).map((s) => s.stage_model_id).filter(Boolean))
  const modelKeys: string[] = []
  for (const mid of modelIds) {
    const { data: m } = await supabase
      .from('career_library_stage_models')
      .select('model_key')
      .eq('id', mid as string)
      .maybeSingle()
    if (m?.model_key) modelKeys.push(m.model_key)
  }
  for (const sp of specs ?? []) {
    const { count } = await supabase
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', sp.id)
    roles += count ?? 0
  }
  return { specs: specs?.length ?? 0, roles, modelKeys }
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
    .select('id, name, slug, stage_model_id')
    .eq('field_id', field!.id)
    .order('sort_order')

  const byStage: Record<string, number> = {}
  for (const k of ENG_STAGE_KEYS) byStage[k] = 0
  let total = 0
  let stillOnAcademicStage = 0
  let withPreferredQual = 0
  let phdReq = 0
  let mastersReq = 0
  let degreeReq = 0
  let noneReq = 0
  const wrongModel: string[] = []

  for (const spec of specs ?? []) {
    if (spec.stage_model_id !== model!.id) wrongModel.push(spec.slug)
    const { data: roles } = await s
      .from('career_library_roles')
      .select('name, academic_requirement, stage_id, metadata')
      .eq('specialism_id', spec.id)

    for (const role of roles ?? []) {
      total += 1
      const sk = role.stage_id ? stageIdToKey.get(role.stage_id) : null
      const meta = (role.metadata ?? {}) as Record<string, unknown>
      if (sk && byStage[sk] !== undefined) byStage[sk] += 1
      if (['degree', 'masters', 'phd'].includes(String(meta.stage_key ?? ''))) {
        stillOnAcademicStage += 1
      }
      if (meta.preferred_qualification) withPreferredQual += 1
      if (role.academic_requirement === 'phd_relevant') phdReq += 1
      else if (role.academic_requirement === 'masters_relevant') mastersReq += 1
      else if (role.academic_requirement === 'none') noneReq += 1
      else degreeReq += 1
    }
  }

  const { data: legacy } = await s
    .from('career_library_stage_models')
    .select('model_key, active')
    .eq('model_key', LEGACY_MODEL_KEY)
    .maybeSingle()

  const prev = await Promise.all([
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
    countFieldRoles(s, 'hospitality-tourism-events'),
    countFieldRoles(s, 'logistics-supply-chain-transport-management'),
  ])

  console.log('=== ENGINEERING PROFESSIONAL STAGE AUDIT ===\n')
  console.log(
    `1. Field: ${field!.name} (${field!.slug}) status=${field!.status} active=${field!.active}`
  )
  console.log(`2. Stage Model: ${model!.model_key} — ${model!.name}`)
  for (const st of stages ?? []) {
    console.log(`   ${st.sort_order}. ${st.stage_key} — ${st.label}`)
  }
  console.log(`3. Specialisms: ${specs?.length ?? 0}`)
  console.log(
    `   On professional model: ${(specs ?? []).filter((x) => x.stage_model_id === model!.id).length}`
  )
  if (wrongModel.length) console.log(`   WRONG MODEL: ${wrongModel.join(', ')}`)
  console.log(`4. Total roles preserved: ${total}`)
  console.log('5. Roles by professional stage:')
  for (const k of ENG_STAGE_KEYS) console.log(`   ${k}: ${byStage[k]}`)
  console.log(`6. Roles still keyed as degree/masters/phd in metadata.stage_key: ${stillOnAcademicStage}`)
  console.log(`7. Roles with preferred_qualification metadata: ${withPreferredQual}`)
  console.log(
    `8. academic_requirement — none: ${noneReq}, degree-ish: ${degreeReq}, masters: ${mastersReq}, phd: ${phdReq}`
  )
  console.log(
    `9. Legacy academic_level model preserved: ${legacy ? `yes (active=${legacy.active})` : 'NO'}`
  )
  console.log('10. Other fields unchanged:')
  const labels = [
    'IT',
    'Healthcare',
    'Natural Sciences',
    'Business',
    'AFB',
    'Law',
    'Education',
    'Arts',
    'Languages',
    'HSS',
    'EAF',
    'Government',
    'Hospitality',
    'Logistics',
  ]
  prev.forEach((c, i) =>
    console.log(
      `   ${labels[i]}: ${c.specs} specs, ${c.roles} roles [${c.modelKeys.join('|') || 'n/a'}]`
    )
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
