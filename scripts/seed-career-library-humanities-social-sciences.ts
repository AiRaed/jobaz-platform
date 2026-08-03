/**
 * Seed Humanities & Social Sciences field + specialisms.
 *   npx tsx scripts/seed-career-library-humanities-social-sciences.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureHssStageModel,
  FIELD_SLUG,
} from './career-library-humanities/shared'
import { HSS_SPEC_DEFS } from './career-library-humanities/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureHssStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Humanities & Social Sciences') || FIELD_SLUG
  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .eq('slug', fieldSlug)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Humanities & Social Sciences',
        slug: fieldSlug,
        description:
          'UK humanities and social sciences careers spanning psychology (non-clinical), sociology, anthropology, history, archaeology, geography, politics, international relations, philosophy, theology, criminology, social policy, cultural and media studies. Professional and academic stages are separate. Graduate entry does not require professional registration. Master\'s and PhD mainly support HE teaching and research. Distinct from Languages & Literature, Arts, Healthcare clinical psychology, Education and Law.',
        status: 'draft',
        active: true,
        sort_order: 110,
      })
      .select('id, name, slug')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'Failed to create field')
    fieldId = created.id
    fieldCreated = true
    console.log(`Created field: ${created.name} (${created.slug})`)
  }

  const { data: existingSpecialisms } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug')
    .eq('field_id', fieldId)

  const existingBySlug = new Set((existingSpecialisms ?? []).map((s) => s.slug))
  const existingByName = new Set(
    (existingSpecialisms ?? []).map((s) => s.name.trim().toLowerCase())
  )

  let createdCount = 0
  let skipped = 0

  for (let i = 0; i < HSS_SPEC_DEFS.length; i++) {
    const item = HSS_SPEC_DEFS[i]
    const slug = item.slug
    if (!slug) {
      skipped += 1
      continue
    }

    if (existingBySlug.has(slug) || existingByName.has(item.label.trim().toLowerCase())) {
      await supabase
        .from('career_library_specialisms')
        .update({
          stage_model_id: modelId,
          professional_body: item.professionalBody,
          regulated_profession: false,
          status: 'draft',
        })
        .eq('field_id', fieldId)
        .eq('slug', slug)
      skipped += 1
      continue
    }

    const { error } = await supabase.from('career_library_specialisms').insert({
      field_id: fieldId,
      name: item.label,
      slug,
      description: `UK ${item.label} careers within Humanities & Social Sciences.`,
      stage_model_id: modelId,
      regulated_profession: false,
      professional_body: item.professionalBody,
      status: 'draft',
      active: true,
      sort_order: (i + 1) * 10,
    })

    if (error) {
      if (error.code === '23505') {
        skipped += 1
        continue
      }
      throw new Error(`${item.label}: ${error.message}`)
    }
    createdCount += 1
    existingBySlug.add(slug)
  }

  console.log('\n=== Humanities & Social Sciences foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: humanities_social_sciences_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${HSS_SPEC_DEFS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
