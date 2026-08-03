/**
 * Remap IT & Technology roles from legacy experience_level stages onto
 * it_skill_experience. Idempotent: roles already on it_skill_experience are
 * left unchanged. Preserves role IDs, titles, specialism links, status, active.
 *
 *   npx tsx scripts/remap-it-skill-experience-stages.ts
 *   npx tsx scripts/remap-it-skill-experience-stages.ts --dry-run
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'
import {
  createServiceClient,
  ensureItSkillStageModel,
  IT_SKILL_STAGE_KEYS,
  type ItSkillStageKey,
} from './career-library-it/shared'
import { mapItRoleFromLegacyExperience } from './career-library-it/mapLegacyExperienceStage'

const DRY_RUN = process.argv.includes('--dry-run')
const FIELD_SLUG = 'it-technology'
const MODEL_KEY = 'it_skill_experience'
const LEGACY_MODEL_KEY = 'experience_level'

type AmbiguousRow = {
  role_id: string
  name: string
  specialism: string
  legacy: string
  mapped: string
  notes: string[]
  reason: string
}

async function main() {
  const supabase = createServiceClient()
  const { modelId, stageByKey } = await ensureItSkillStageModel(supabase)

  console.log(`\n=== IT skill/experience stage remap ${DRY_RUN ? '(DRY RUN)' : ''} ===`)
  console.log(`Stage model: ${MODEL_KEY} (${modelId})`)
  for (const key of IT_SKILL_STAGE_KEYS) {
    const st = stageByKey.get(key)!
    console.log(`  ${st.stage_key} — ${st.label}`)
  }

  const { data: legacyModel } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key, active')
    .eq('model_key', LEGACY_MODEL_KEY)
    .maybeSingle()

  if (!legacyModel) {
    console.log('No experience_level model found — nothing to remap from.')
  }

  const legacyStageById = new Map<string, string>()
  if (legacyModel) {
    const { data: legacyStages } = await supabase
      .from('career_library_stages')
      .select('id, stage_key')
      .eq('stage_model_id', legacyModel.id)
    for (const st of legacyStages ?? []) {
      legacyStageById.set(st.id, st.stage_key)
    }
  }

  const itStageIds = new Set([...stageByKey.values()].map((s) => s.id))

  const { data: field } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .eq('slug', FIELD_SLUG)
    .single()

  if (!field) throw new Error('IT & Technology field not found')

  const { data: specialisms, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, stage_model_id')
    .eq('field_id', field.id)
    .order('sort_order', { ascending: true })

  if (specErr) throw new Error(specErr.message)

  let specsUpdated = 0
  for (const spec of specialisms ?? []) {
    if (spec.stage_model_id === modelId) continue
    if (DRY_RUN) {
      specsUpdated += 1
      continue
    }
    const { error } = await supabase
      .from('career_library_specialisms')
      .update({ stage_model_id: modelId, status: 'draft' })
      .eq('id', spec.id)
    if (error) throw new Error(`${spec.slug}: ${error.message}`)
    specsUpdated += 1
  }
  console.log(`\nSpecialisms to assign to ${MODEL_KEY}: ${specsUpdated}`)

  const byLegacy: Record<string, number> = {}
  const byNew: Record<string, number> = {}
  for (const k of IT_SKILL_STAGE_KEYS) byNew[k] = 0
  const mappingPairs: Record<string, number> = {}

  let inspected = 0
  let alreadyOk = 0
  let remapped = 0
  let inactiveSkipped = 0
  const ambiguous: AmbiguousRow[] = []
  const sampleLogs: string[] = []

  for (const spec of specialisms ?? []) {
    const { data: roles, error: rolesErr } = await supabase
      .from('career_library_roles')
      .select(
        'id, name, slug, seniority_level, minimum_experience_years, role_category, fit_classification, is_research_role, is_academic_role, metadata, stage_id, status, active'
      )
      .eq('specialism_id', spec.id)

    if (rolesErr) throw new Error(`${spec.slug}: ${rolesErr.message}`)

    for (const role of roles ?? []) {
      inspected += 1

      if (role.stage_id && itStageIds.has(role.stage_id)) {
        alreadyOk += 1
        continue
      }

      if (!role.active) {
        // Still remap inactive roles that sit on legacy stages to avoid orphans
        inactiveSkipped += 0
      }

      const legacyKey =
        (role.stage_id && legacyStageById.get(role.stage_id)) ||
        String(
          (role.metadata as Record<string, unknown> | null)?.stage_key ??
            (role.metadata as Record<string, unknown> | null)?.experience_level ??
            'unknown'
        )

      const mapped = mapItRoleFromLegacyExperience({
        name: role.name,
        seniority_level: role.seniority_level,
        minimum_experience_years: role.minimum_experience_years,
        role_category: role.role_category,
        fit_classification: role.fit_classification,
        is_research_role: role.is_research_role,
        is_academic_role: role.is_academic_role,
        metadata: (role.metadata ?? {}) as Record<string, unknown>,
        legacyStageKey: legacyKey,
      })

      byLegacy[mapped.legacyKey] = (byLegacy[mapped.legacyKey] ?? 0) + 1
      byNew[mapped.stageKey] = (byNew[mapped.stageKey] ?? 0) + 1
      const pair = `${mapped.legacyKey}→${mapped.stageKey}`
      mappingPairs[pair] = (mappingPairs[pair] ?? 0) + 1

      if (mapped.ambiguous) {
        ambiguous.push({
          role_id: role.id,
          name: role.name,
          specialism: spec.slug,
          legacy: mapped.legacyKey,
          mapped: mapped.stageKey,
          notes: mapped.ambiguityNotes,
          reason: mapped.reason,
        })
      }

      const stage = stageByKey.get(mapped.stageKey as ItSkillStageKey)
      if (!stage) throw new Error(`Missing target stage ${mapped.stageKey}`)

      const prevMeta = (role.metadata ?? {}) as Record<string, unknown>
      const nextMeta = {
        ...prevMeta,
        stage_id: stage.id,
        stage_key: stage.stage_key,
        stage_label: stage.label,
        progression_model: MODEL_KEY,
        legacy_experience_stage: mapped.legacyKey,
        remap_reason: mapped.reason,
        remapped_at: new Date().toISOString(),
        // keep historical experience_level label only as attribute
        experience_level: prevMeta.experience_level ?? mapped.legacyKey,
      }

      if (sampleLogs.length < 15) {
        sampleLogs.push(
          `  ${spec.slug}: "${role.name}" ${mapped.legacyKey} → ${mapped.stageKey} (${mapped.reason})`
        )
      }

      if (DRY_RUN) {
        remapped += 1
        continue
      }

      const { error } = await supabase
        .from('career_library_roles')
        .update({
          stage_id: stage.id,
          metadata: nextMeta,
          status: role.status ?? 'draft',
        })
        .eq('id', role.id)

      if (error) throw new Error(`${spec.slug} / ${role.name}: ${error.message}`)
      remapped += 1
    }
  }

  // Verify: no active IT role remains on experience_level
  let stillOnLegacy = 0
  let activeOk = 0
  let orphanStage = 0
  for (const spec of specialisms ?? []) {
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('id, stage_id, active')
      .eq('specialism_id', spec.id)
      .eq('active', true)

    for (const role of roles ?? []) {
      if (!role.stage_id) {
        orphanStage += 1
        continue
      }
      if (legacyStageById.has(role.stage_id)) stillOnLegacy += 1
      else if (itStageIds.has(role.stage_id)) activeOk += 1
      else orphanStage += 1
    }
  }

  console.log('\n--- Samples ---')
  for (const line of sampleLogs) console.log(line)

  console.log('\n=== Remap summary ===')
  console.log(`IT roles inspected: ${inspected}`)
  console.log(`Already on it_skill_experience: ${alreadyOk}`)
  console.log(`Remapped: ${remapped}`)
  console.log(`Ambiguous (manual review): ${ambiguous.length}`)
  console.log('\nBy legacy stage:')
  for (const [k, v] of Object.entries(byLegacy).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${k}: ${v}`)
  }
  console.log('\nBy new stage:')
  for (const k of IT_SKILL_STAGE_KEYS) {
    console.log(`  ${k}: ${byNew[k] ?? 0}`)
  }
  console.log('\nMapping pairs (old→new):')
  for (const [k, v] of Object.entries(mappingPairs).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`)
  }

  console.log('\n=== Post-check (active roles) ===')
  console.log(`Active on it_skill_experience: ${activeOk}`)
  console.log(`Active still on experience_level: ${stillOnLegacy}`)
  console.log(`Active orphan/other stage: ${orphanStage}`)
  console.log(`Legacy model active=${legacyModel?.active ?? 'absent'}`)
  void inactiveSkipped

  const reportsDir = resolve(process.cwd(), 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })
  const reportPath = resolve(reportsDir, 'it-stage-remap-batch-1.json')
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        dry_run: DRY_RUN,
        inspected,
        already_ok: alreadyOk,
        remapped,
        by_legacy: byLegacy,
        by_new: byNew,
        mapping_pairs: mappingPairs,
        ambiguous_count: ambiguous.length,
        ambiguous: ambiguous.slice(0, 200),
        post_check: {
          active_ok: activeOk,
          still_on_legacy: stillOnLegacy,
          orphan_stage: orphanStage,
        },
      },
      null,
      2
    ),
    'utf8'
  )
  console.log(`\nWrote ${reportPath}`)

  if (!DRY_RUN && stillOnLegacy > 0) {
    throw new Error(`${stillOnLegacy} active IT roles still on experience_level after remap`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
