/**
 * Seed Government, Public Policy & International Development field + specialisms.
 *   npx tsx scripts/seed-career-library-government-public-policy-id.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureGovStageModel,
  FIELD_SLUG,
} from './career-library-government/shared'
import { GOV_SPEC_DEFS } from './career-library-government/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureGovStageModel(supabase)

  const fieldSlug =
    normalizeSlug(undefined, 'Government, Public Policy & International Development') ||
    FIELD_SLUG
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
        name: 'Government, Public Policy & International Development',
        slug: fieldSlug,
        description:
          'UK careers in central and local government, Civil Service, public policy, parliamentary work, diplomacy, international development, public affairs, regulation, public finance policy and government analytical professions. Distinct from Humanities academic Politics/IR, Law solicitor routes, Business general PM, Finance accountancy, Natural Sciences, Healthcare, Education QTS and Environment land/food Environmental Policy. Master\'s and PhD are not automatic seniority. Elected office is excluded from ordinary employment progression.',
        status: 'draft',
        active: true,
        sort_order: 130,
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

  for (let i = 0; i < GOV_SPEC_DEFS.length; i++) {
    const item = GOV_SPEC_DEFS[i]
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
      description: `UK ${item.label} careers within Government, Public Policy & International Development.`,
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

  console.log('\n=== Government, Public Policy & International Development foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: ${MODEL_KEY_LABEL} (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${GOV_SPEC_DEFS.length}`)
}

const MODEL_KEY_LABEL = 'government_public_policy_international_development_route'

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
