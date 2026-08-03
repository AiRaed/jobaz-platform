/**
 * Seed Law, Legal & Justice field + specialisms.
 *   npx tsx scripts/seed-career-library-law-legal-justice.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureLawStageModel,
  FIELD_SLUG,
} from './career-library-law/shared'
import { LAW_SPEC_DEFS } from './career-library-law/packs'

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureLawStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Law, Legal & Justice') || FIELD_SLUG
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
        name: 'Law, Legal & Justice',
        slug: fieldSlug,
        description:
          'UK law, legal practice and justice careers spanning solicitor, barrister and CILEx pathways, practice areas, court/justice services, judicial appointments and legal academia. Progression is qualification- and appointment-driven. Master\'s and PhD are not automatic seniority. Distinct from Business, Finance, Healthcare, Government (non-legal) and IT.',
        status: 'draft',
        active: true,
        sort_order: 70,
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

  for (let i = 0; i < LAW_SPEC_DEFS.length; i++) {
    const item = LAW_SPEC_DEFS[i]
    const slug = item.slug
    if (!slug) {
      skipped += 1
      continue
    }
    const regulated =
      item.profile === 'solicitor_core' ||
      item.profile === 'barrister_core' ||
      item.profile === 'cilex_core' ||
      item.profile === 'practice_area'

    if (existingBySlug.has(slug) || existingByName.has(item.label.trim().toLowerCase())) {
      await supabase
        .from('career_library_specialisms')
        .update({
          stage_model_id: modelId,
          professional_body: item.professionalBody,
          regulated_profession: regulated,
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
      description: `UK ${item.label} careers within Law, Legal & Justice.`,
      stage_model_id: modelId,
      regulated_profession: regulated,
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

  console.log('\n=== Law, Legal & Justice foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: law_legal_justice_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${LAW_SPEC_DEFS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
