/**
 * Verify IT stage model assignment (read-only).
 *   npx tsx scripts/career-library-it/verify-stage-model.ts
 */

import { createServiceClient, IT_SKILL_STAGE_KEYS } from './shared'
import { DISABLED_STAGE_MARKER_RE } from '../../lib/admin/career-library/disabledStages'

async function main() {
  const supabase = createServiceClient()

  const { data: model } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key, name, active, is_system')
    .eq('model_key', 'it_skill_experience')
    .maybeSingle()

  if (!model) throw new Error('it_skill_experience missing')

  const { data: stages } = await supabase
    .from('career_library_stages')
    .select('stage_key, label, sort_order, active')
    .eq('stage_model_id', model.id)
    .order('sort_order', { ascending: true })

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id')
    .eq('slug', 'it-technology')
    .single()

  const { data: specs } = await supabase
    .from('career_library_specialisms')
    .select('slug, name, stage_model_id, status, description')
    .eq('field_id', field!.id)
    .order('sort_order')

  const { data: engField } = await supabase
    .from('career_library_fields')
    .select('id')
    .eq('slug', 'engineering')
    .maybeSingle()

  let engModel = 'n/a'
  if (engField) {
    const { data: engSpecs } = await supabase
      .from('career_library_specialisms')
      .select('career_library_stage_models(model_key)')
      .eq('field_id', engField.id)
      .limit(3)
    const keys = new Set(
      (engSpecs ?? []).map((s) => {
        const m = s.career_library_stage_models as
          | { model_key: string }
          | { model_key: string }[]
          | null
        if (!m) return 'null'
        return Array.isArray(m) ? m[0]?.model_key ?? 'null' : m.model_key
      })
    )
    engModel = [...keys].join(', ')
  }

  const { data: legacy } = await supabase
    .from('career_library_stage_models')
    .select('active')
    .eq('model_key', 'experience_level')
    .maybeSingle()

  console.log('=== IT stage model verification ===')
  console.log(`Model: ${model.model_key} | ${model.name} | active=${model.active} | system=${model.is_system}`)
  console.log('Stages:')
  for (const s of stages ?? []) {
    console.log(`  ${s.sort_order}. ${s.stage_key} — ${s.label} (active=${s.active})`)
  }

  const missingKeys = IT_SKILL_STAGE_KEYS.filter(
    (k) => !(stages ?? []).some((s) => s.stage_key === k)
  )
  console.log(`Missing stage keys: ${missingKeys.length ? missingKeys.join(', ') : 'none'}`)

  const wrongModel = (specs ?? []).filter((s) => s.stage_model_id !== model.id)
  console.log(`Specialisms on wrong model: ${wrongModel.length}`)
  console.log(`IT specialisms: ${specs?.length ?? 0}`)

  const withDisabled: string[] = []
  for (const s of specs ?? []) {
    const m = (s.description ?? '').match(DISABLED_STAGE_MARKER_RE)
    if (m?.[1]) withDisabled.push(`${s.slug}: ${m[1]}`)
  }
  console.log(`Specialisms with disabled stages (markers): ${withDisabled.length}`)
  for (const line of withDisabled) console.log(`  - ${line}`)

  const researchEnabled = (specs ?? []).filter((s) => {
    const m = (s.description ?? '').match(DISABLED_STAGE_MARKER_RE)
    const keys = m?.[1]?.split(',') ?? []
    return !keys.includes('academic_research')
  })
  console.log(
    `Research stage enabled on: ${researchEnabled.map((s) => s.slug).join(', ') || 'none'}`
  )
  console.log(`Legacy experience_level active=${legacy?.active ?? 'absent'}`)
  console.log(`Engineering stage model: ${engModel}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
