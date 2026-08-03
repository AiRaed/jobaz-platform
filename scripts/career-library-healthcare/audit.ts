import { createServiceClient, HEALTHCARE_STAGE_KEYS } from './shared'

async function main() {
  const s = createServiceClient()

  const { data: field } = await s
    .from('career_library_fields')
    .select('id, name, slug, status')
    .eq('slug', 'healthcare-medicine')
    .single()

  const { data: model } = await s
    .from('career_library_stage_models')
    .select('id, model_key, name')
    .eq('model_key', 'healthcare_professional_route')
    .single()

  const { data: stages } = await s
    .from('career_library_stages')
    .select('stage_key, label, sort_order')
    .eq('stage_model_id', model!.id)
    .order('sort_order')

  const { data: specs } = await s
    .from('career_library_specialisms')
    .select('id, slug, name, stage_model_id, status')
    .eq('field_id', field!.id)
    .order('sort_order')

  let totalRoles = 0
  const empty: string[] = []
  for (const spec of specs ?? []) {
    const { count } = await s
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', spec.id)
      .eq('status', 'draft')
    const n = count ?? 0
    totalRoles += n
    if (!n) empty.push(spec.slug)
    console.log(`${spec.slug}: ${n} | model_ok=${spec.stage_model_id === model!.id}`)
  }

  const { data: eng } = await s.from('career_library_fields').select('id').eq('slug', 'engineering').single()
  const { data: engSpecs } = await s.from('career_library_specialisms').select('id').eq('field_id', eng!.id)
  let engRoles = 0
  for (const sp of engSpecs ?? []) {
    const { count } = await s
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', sp.id)
    engRoles += count ?? 0
  }

  const { data: it } = await s.from('career_library_fields').select('id').eq('slug', 'it-technology').single()
  const { data: itSpecs } = await s.from('career_library_specialisms').select('id').eq('field_id', it!.id)
  let itRoles = 0
  for (const sp of itSpecs ?? []) {
    const { count } = await s
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', sp.id)
    itRoles += count ?? 0
  }

  console.log('\n=== Summary ===')
  console.log(`Field: ${field!.name} (${field!.slug}) status=${field!.status}`)
  console.log(`Stage model: ${model!.model_key} — ${model!.name}`)
  console.log('Stages:')
  for (const st of stages ?? []) console.log(`  ${st.sort_order}. ${st.stage_key} — ${st.label}`)
  console.log(`Specialisms: ${specs?.length ?? 0}`)
  console.log(`Draft roles: ${totalRoles}`)
  console.log(`Empty specialisms: ${empty.length ? empty.join(', ') : 'none'}`)
  console.log(`Expected stage keys present: ${HEALTHCARE_STAGE_KEYS.every((k) => (stages ?? []).some((s) => s.stage_key === k))}`)
  console.log(`Engineering roles (untouched): ${engRoles}`)
  console.log(`IT roles (untouched): ${itRoles}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
