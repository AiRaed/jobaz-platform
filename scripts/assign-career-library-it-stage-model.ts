/**
 * Create/assign the IT skill & experience stage model to all IT specialisms.
 * Sets per-specialism disabled stages. Does NOT create or modify roles.
 * Does NOT modify Engineering.
 *
 *   npx tsx scripts/assign-career-library-it-stage-model.ts
 */

import { ensureItSkillStageModel, createServiceClient } from './career-library-it/shared'

const RESEARCH_SPECIALISM_SLUGS = new Set([
  'data-science',
  'artificial-intelligence',
  'machine-learning',
  'computer-vision',
  'robotics-software',
])

const DISABLE_ARCHITECT_SLUGS = new Set(['it-support'])

function disabledKeysForSpecialism(slug: string): string[] {
  const disabled: string[] = []
  if (!RESEARCH_SPECIALISM_SLUGS.has(slug)) disabled.push('academic_research')
  if (DISABLE_ARCHITECT_SLUGS.has(slug)) disabled.push('architect_specialist')
  return disabled
}

function withDisabledMarker(description: string, keys: string[]): string {
  const cleaned = description.replace(/\[\[disabled_stage_keys:[a-z0-9_,]+\]\]/gi, '').trim()
  if (!keys.length) return cleaned
  return `${cleaned}\n\n[[disabled_stage_keys:${keys.join(',')}]]`
}

async function main() {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureItSkillStageModel(supabase)

  console.log('\nStages (ordered):')
  const ordered = [...stageByKey.values()].sort((a, b) => {
    // stageByKey values don't include sort_order here — refetch
    return a.stage_key.localeCompare(b.stage_key)
  })

  const { data: stages } = await supabase
    .from('career_library_stages')
    .select('stage_key, label, sort_order')
    .eq('stage_model_id', modelId)
    .order('sort_order', { ascending: true })

  for (const s of stages ?? []) {
    console.log(`  ${String(s.sort_order).padStart(3, ' ')}. ${s.stage_key} — ${s.label}`)
  }
  void ordered

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, status')
    .eq('slug', 'it-technology')
    .maybeSingle()

  if (!field) {
    throw new Error('IT & Technology field not found. Run seed-career-library-it-technology.ts first.')
  }

  // Probe whether disabled_stage_keys column exists
  let hasDisabledColumn = true
  {
    const { error } = await supabase
      .from('career_library_specialisms')
      .select('id, disabled_stage_keys')
      .eq('field_id', field.id)
      .limit(1)
    if (error && (error.message?.includes('disabled_stage_keys') || error.code === '42703')) {
      hasDisabledColumn = false
      console.warn(
        '\nNOTE: disabled_stage_keys column not applied yet. Using description markers until migration 20250802210000 is applied.\n'
      )
    } else if (error) {
      throw new Error(error.message)
    }
  }

  const { data: specialisms, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, description, stage_model_id, status')
    .eq('field_id', field.id)
    .order('sort_order', { ascending: true })

  if (specErr) throw new Error(specErr.message)

  const assigned: string[] = []
  const withDisabled: Array<{ slug: string; disabled: string[] }> = []

  for (const spec of specialisms ?? []) {
    const disabled = disabledKeysForSpecialism(spec.slug)
    const patch: Record<string, unknown> = {
      stage_model_id: modelId,
      status: 'draft',
      description: withDisabledMarker(spec.description ?? '', disabled),
    }
    if (hasDisabledColumn) {
      patch.disabled_stage_keys = disabled
      // Keep description clean when column is available
      patch.description = (spec.description ?? '')
        .replace(/\[\[disabled_stage_keys:[a-z0-9_,]+\]\]/gi, '')
        .trim()
    }

    const { error } = await supabase
      .from('career_library_specialisms')
      .update(patch)
      .eq('id', spec.id)

    if (error) throw new Error(`${spec.slug}: ${error.message}`)

    assigned.push(spec.slug)
    if (disabled.length) withDisabled.push({ slug: spec.slug, disabled })
  }

  // Engineering untouched check
  const { data: engField } = await supabase
    .from('career_library_fields')
    .select('id')
    .eq('slug', 'engineering')
    .maybeSingle()

  let engCheck = 'n/a'
  if (engField) {
    const { data: engSpecs } = await supabase
      .from('career_library_specialisms')
      .select('career_library_stage_models(model_key)')
      .eq('field_id', engField.id)
      .limit(8)

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
    engCheck = [...keys].join(', ')
  }

  const { data: legacy } = await supabase
    .from('career_library_stage_models')
    .select('model_key, active')
    .eq('model_key', 'experience_level')
    .maybeSingle()

  console.log('\n=== Assignment summary ===')
  console.log(`Stage model created/used: it_skill_experience (${modelId})`)
  console.log(`Field: ${field.name} (${field.slug}) status=${field.status}`)
  console.log(`Disabled-stage storage: ${hasDisabledColumn ? 'disabled_stage_keys column' : 'description markers (temporary)'}`)
  console.log(`Specialisms assigned: ${assigned.length}`)
  for (const slug of assigned) console.log(`  - ${slug}`)
  console.log(`\nSpecialisms with stages disabled: ${withDisabled.length}`)
  for (const row of withDisabled) {
    console.log(`  - ${row.slug}: ${row.disabled.join(', ')}`)
  }
  console.log(`\nLegacy experience_level active=${legacy?.active ?? 'absent'}`)
  console.log(`Engineering stage model(s) untouched: ${engCheck}`)
  console.log('Roles: not created or modified.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
