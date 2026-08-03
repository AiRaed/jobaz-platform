/**
 * Seed Logistics, Supply Chain & Transport Management field + specialisms.
 *   npx tsx scripts/seed-career-library-logistics-supply-chain-transport.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureLsctStageModel,
  FIELD_SLUG,
  MODEL_KEY,
} from './career-library-logistics/shared'
import { LSCT_SPEC_DEFS } from './career-library-logistics/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureLsctStageModel(supabase)

  const fieldSlug =
    normalizeSlug(undefined, 'Logistics, Supply Chain & Transport Management') || FIELD_SLUG
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
        name: 'Logistics, Supply Chain & Transport Management',
        slug: fieldSlug,
        description:
          'UK careers in logistics management, supply chain, procurement, planning, distribution, fleet, aviation and maritime management, ports, trade compliance and logistics analytics. Built primarily for Work in My Education. Driver, courier, forklift and warehouse-operative roles are limited foundation context only. Distinct from Engineering, Business general ops, Finance, Construction, Hospitality and Government. Master\'s/PhD are not automatic seniority.',
        status: 'draft',
        active: true,
        sort_order: 150,
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

  for (let i = 0; i < LSCT_SPEC_DEFS.length; i++) {
    const item = LSCT_SPEC_DEFS[i]
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
      description: `UK ${item.label} careers within Logistics, Supply Chain & Transport Management (Work in My Education focus).`,
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

  console.log('\n=== Logistics, Supply Chain & Transport Management foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${LSCT_SPEC_DEFS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
