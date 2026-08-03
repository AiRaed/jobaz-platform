import { createServiceClient } from './shared'

async function main() {
  const s = createServiceClient()
  const { data: model } = await s
    .from('career_library_stage_models')
    .select('id')
    .eq('model_key', 'it_skill_experience')
    .single()

  const targets = [
    'software-development',
    'full-stack-development',
    'frontend-development',
    'backend-development',
  ]

  for (const slug of targets) {
    const { data: spec } = await s
      .from('career_library_specialisms')
      .select('id, stage_model_id')
      .eq('slug', slug)
      .single()
    const { count } = await s
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', spec!.id)
      .eq('status', 'draft')
    console.log(
      `${slug}: ${count} draft | model_ok=${spec!.stage_model_id === model!.id}`
    )
  }

  const { data: web } = await s
    .from('career_library_specialisms')
    .select('id')
    .eq('slug', 'web-development')
    .single()
  const { count: wc } = await s
    .from('career_library_roles')
    .select('id', { count: 'exact', head: true })
    .eq('specialism_id', web!.id)
  console.log(`web-development (other IT, untouched): ${wc}`)

  const { data: ef } = await s
    .from('career_library_fields')
    .select('id')
    .eq('slug', 'engineering')
    .single()
  const { data: es } = await s
    .from('career_library_specialisms')
    .select('id')
    .eq('field_id', ef!.id)
  let eng = 0
  for (const sp of es ?? []) {
    const { count } = await s
      .from('career_library_roles')
      .select('id', { count: 'exact', head: true })
      .eq('specialism_id', sp.id)
    eng += count ?? 0
  }
  console.log(`engineering roles total: ${eng}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
