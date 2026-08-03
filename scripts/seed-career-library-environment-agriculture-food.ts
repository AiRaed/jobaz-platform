/**
 * Seed Environment, Agriculture & Food field + specialisms.
 *   npx tsx scripts/seed-career-library-environment-agriculture-food.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureEafStageModel,
  FIELD_SLUG,
} from './career-library-environment/shared'
import { EAF_SPEC_DEFS } from './career-library-environment/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureEafStageModel(supabase)

  const fieldSlug =
    normalizeSlug(undefined, 'Environment, Agriculture & Food') || FIELD_SLUG
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
        name: 'Environment, Agriculture & Food',
        slug: fieldSlug,
        description:
          'UK careers in agriculture, food systems, environmental management, forestry, conservation, horticulture and rural land. Focused on land, food and sustainability practice. Distinct from Natural Sciences laboratory Environmental Science, Engineering, Construction, Healthcare nutrition/dietetics clinical routes and general Business management. Master\'s and PhD mainly support HE teaching and research.',
        status: 'draft',
        active: true,
        sort_order: 120,
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

  for (let i = 0; i < EAF_SPEC_DEFS.length; i++) {
    const item = EAF_SPEC_DEFS[i]
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
      description: `UK ${item.label} careers within Environment, Agriculture & Food.`,
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

  console.log('\n=== Environment, Agriculture & Food foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: environment_agriculture_food_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${EAF_SPEC_DEFS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
