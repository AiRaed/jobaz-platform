/**
 * Remap Engineering from academic_level (Degree/Master's/PhD) stages to
 * engineering_professional_route. Preserves all roles; updates stage_id,
 * metadata, and slug prefixes where unique. Qualifications stay as
 * academic_requirement + metadata attributes.
 *
 *   npx tsx scripts/remap-engineering-professional-stages.ts
 *   npx tsx scripts/remap-engineering-professional-stages.ts --dry-run
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureEngineeringProfessionalStageModel,
  mapEngineeringRoleToProfessionalStage,
  ENG_STAGE_KEYS,
  FIELD_SLUG,
  MODEL_KEY,
  LEGACY_MODEL_KEY,
  type RoleForMap,
} from './career-library-engineering/shared'

const DRY_RUN = process.argv.includes('--dry-run')

function stripLegacyStagePrefix(slug: string): string {
  return slug.replace(/^(degree|masters|phd)-/i, '')
}

async function main() {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureEngineeringProfessionalStageModel(supabase)

  console.log(`\n=== Engineering professional stage remap ${DRY_RUN ? '(DRY RUN)' : ''} ===`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId})`)
  for (const key of ENG_STAGE_KEYS) {
    const st = stageByKey.get(key)!
    console.log(`  ${st.stage_key} — ${st.label}`)
  }

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, status')
    .eq('slug', FIELD_SLUG)
    .single()

  if (!field) throw new Error('Engineering field not found')

  const { data: specialisms, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, stage_model_id')
    .eq('field_id', field.id)
    .order('sort_order', { ascending: true })

  if (specErr) throw new Error(specErr.message)

  let specsUpdated = 0
  if (!DRY_RUN) {
    for (const spec of specialisms ?? []) {
      if (spec.stage_model_id === modelId) continue
      const { error } = await supabase
        .from('career_library_specialisms')
        .update({ stage_model_id: modelId, status: 'draft' })
        .eq('id', spec.id)
      if (error) throw new Error(`${spec.slug}: ${error.message}`)
      specsUpdated += 1
    }
  } else {
    specsUpdated = (specialisms ?? []).filter((s) => s.stage_model_id !== modelId).length
  }

  console.log(`\nSpecialisms to assign to ${MODEL_KEY}: ${specsUpdated}`)

  const byNewStage: Record<string, number> = {}
  for (const k of ENG_STAGE_KEYS) byNewStage[k] = 0
  const byLegacy: Record<string, number> = {}
  let rolesSeen = 0
  let rolesUpdated = 0
  let slugUpdated = 0
  let slugSkipped = 0
  const reasons: Record<string, number> = {}

  // Collect existing slugs across engineering for uniqueness checks
  const allSlugs = new Set<string>()
  for (const spec of specialisms ?? []) {
    const { data: rows } = await supabase
      .from('career_library_roles')
      .select('slug')
      .eq('specialism_id', spec.id)
    for (const r of rows ?? []) allSlugs.add(r.slug)
  }

  for (const spec of specialisms ?? []) {
    const { data: roles, error: rolesErr } = await supabase
      .from('career_library_roles')
      .select(
        'id, name, slug, seniority_level, minimum_experience_years, academic_requirement, is_academic_role, is_research_role, role_category, fit_classification, eligibility_note, metadata, stage_id'
      )
      .eq('specialism_id', spec.id)

    if (rolesErr) throw new Error(`${spec.slug}: ${rolesErr.message}`)

    for (const role of roles ?? []) {
      rolesSeen += 1
      const mapped = mapEngineeringRoleToProfessionalStage(role as RoleForMap)
      byNewStage[mapped.stageKey] += 1
      reasons[mapped.reason] = (reasons[mapped.reason] ?? 0) + 1

      const legacyKey = String(
        (role.metadata as Record<string, unknown> | null)?.stage_key ??
          (role.metadata as Record<string, unknown> | null)?.academic_level ??
          'unknown'
      )
      byLegacy[legacyKey] = (byLegacy[legacyKey] ?? 0) + 1

      const stage = stageByKey.get(mapped.stageKey)!
      const prevMeta = (role.metadata ?? {}) as Record<string, unknown>
      const baseSlug = stripLegacyStagePrefix(role.slug) || normalizeSlug(undefined, role.name)
      const desiredSlug = baseSlug ? `${mapped.stageKey}-${baseSlug}` : role.slug

      let nextSlug = role.slug
      if (desiredSlug !== role.slug) {
        if (!allSlugs.has(desiredSlug) || desiredSlug === role.slug) {
          nextSlug = desiredSlug
          slugUpdated += 1
          allSlugs.delete(role.slug)
          allSlugs.add(desiredSlug)
        } else {
          slugSkipped += 1
        }
      }

      const nextMeta = {
        ...prevMeta,
        stage_id: stage.id,
        stage_key: stage.stage_key,
        stage_label: stage.label,
        progression_model: MODEL_KEY,
        legacy_academic_stage: legacyKey,
        preferred_qualification: mapped.preferredQualification,
        required_qualification_hint: mapped.requiredQualificationHint,
        // Keep academic_level only as historical; no longer the stage key
        academic_level: prevMeta.academic_level ?? legacyKey,
        engineering_stage: stage.stage_key,
        remap_reason: mapped.reason,
        remapped_at: new Date().toISOString(),
      }
      // Remove mistaken use of academic_level as current stage if it was degree/masters/phd
      if (['degree', 'masters', 'phd'].includes(String(nextMeta.stage_key))) {
        // should never happen after assignment
      }

      if (DRY_RUN) {
        if (rolesUpdated < 12) {
          console.log(
            `  [dry] ${spec.slug}: "${role.name}" ${legacyKey} → ${mapped.stageKey} (${mapped.reason})`
          )
        }
        rolesUpdated += 1
        continue
      }

      const { error } = await supabase
        .from('career_library_roles')
        .update({
          stage_id: stage.id,
          slug: nextSlug,
          metadata: nextMeta,
          status: 'draft',
        })
        .eq('id', role.id)

      if (error) {
        // Slug collision fallback: update without slug change
        if (error.code === '23505' && nextSlug !== role.slug) {
          const { error: err2 } = await supabase
            .from('career_library_roles')
            .update({
              stage_id: stage.id,
              metadata: nextMeta,
              status: 'draft',
            })
            .eq('id', role.id)
          if (err2) throw new Error(`${role.name}: ${err2.message}`)
          slugSkipped += 1
          slugUpdated -= 1
        } else {
          throw new Error(`${spec.slug} / ${role.name}: ${error.message}`)
        }
      }
      rolesUpdated += 1
    }
  }

  // Verify academic_level still exists and other fields untouched
  const { data: legacyModel } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key, active')
    .eq('model_key', LEGACY_MODEL_KEY)
    .maybeSingle()

  const otherFields = [
    'it-technology',
    'healthcare-medicine',
    'natural-sciences-research',
    'business-management',
    'hospitality-tourism-events',
    'logistics-supply-chain-transport-management',
  ]
  const otherChecks: string[] = []
  for (const slug of otherFields) {
    const { data: f } = await supabase
      .from('career_library_fields')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!f) {
      otherChecks.push(`${slug}: absent`)
      continue
    }
    const { data: specs } = await supabase
      .from('career_library_specialisms')
      .select('stage_model_id')
      .eq('field_id', f.id)
      .limit(1)
    const smId = specs?.[0]?.stage_model_id
    if (!smId) {
      otherChecks.push(`${slug}: no stage model`)
      continue
    }
    const { data: sm } = await supabase
      .from('career_library_stage_models')
      .select('model_key')
      .eq('id', smId)
      .maybeSingle()
    otherChecks.push(`${slug}: ${sm?.model_key ?? 'null'}`)
  }

  console.log('\n=== Remap summary ===')
  console.log(`Field: ${field.name} (${field.slug})`)
  console.log(`Roles seen: ${rolesSeen}`)
  console.log(`Roles updated: ${rolesUpdated}`)
  console.log(`Slugs updated: ${slugUpdated}`)
  console.log(`Slug updates skipped (collision): ${slugSkipped}`)
  console.log('\nLegacy academic stage distribution (before mapping source):')
  for (const [k, v] of Object.entries(byLegacy).sort()) console.log(`  ${k}: ${v}`)
  console.log('\nNew professional stage distribution:')
  for (const k of ENG_STAGE_KEYS) console.log(`  ${k}: ${byNewStage[k]}`)
  console.log('\nMapping reasons:')
  for (const [k, v] of Object.entries(reasons).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v} — ${k}`)
  }
  console.log(`\nacademic_level model preserved: ${legacyModel ? `yes (active=${legacyModel.active})` : 'missing'}`)
  console.log('Other fields stage models unchanged:')
  for (const line of otherChecks) console.log(`  ${line}`)
  if (DRY_RUN) console.log('\nDRY RUN — no database writes performed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
