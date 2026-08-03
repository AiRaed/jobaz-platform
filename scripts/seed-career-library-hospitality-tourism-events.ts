/**
 * Seed Hospitality, Tourism & Events field + specialisms.
 *   npx tsx scripts/seed-career-library-hospitality-tourism-events.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureHteStageModel,
  FIELD_SLUG,
  MODEL_KEY,
} from './career-library-hospitality/shared'
import { HTE_SPEC_DEFS } from './career-library-hospitality/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureHteStageModel(supabase)

  const fieldSlug =
    normalizeSlug(undefined, 'Hospitality, Tourism & Events') || FIELD_SLUG
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
        name: 'Hospitality, Tourism & Events',
        slug: fieldSlug,
        description:
          'UK careers in hospitality management, hotels, food and beverage management, culinary leadership, tourism and destination management, travel, events, venues, leisure and hospitality commercial roles. Built primarily for Work in My Education — graduate, management, commercial, destination and academic routes. Low-barrier waiter/bar/kitchen-porter/room-attendant roles are limited foundation context only. Distinct from Business general marketing, Finance accountancy, Arts event design, EAF food science and Government tourism-policy adviser tracks. Master\'s/PhD are not automatic seniority; ownership is not guaranteed employment.',
        status: 'draft',
        active: true,
        sort_order: 140,
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

  for (let i = 0; i < HTE_SPEC_DEFS.length; i++) {
    const item = HTE_SPEC_DEFS[i]
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
      description: `UK ${item.label} careers within Hospitality, Tourism & Events (Work in My Education focus).`,
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

  console.log('\n=== Hospitality, Tourism & Events foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${HTE_SPEC_DEFS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
