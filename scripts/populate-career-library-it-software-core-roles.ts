/**
 * Populate draft roles for four IT specialisms on it_skill_experience:
 *   Software Development, Full Stack, Frontend, Backend
 *
 * Replaces existing draft roles for these specialisms only (legacy experience_level
 * roles would otherwise block titles and sit on the wrong stage model).
 * Does NOT modify Engineering or other IT specialisms.
 *
 *   npx tsx scripts/populate-career-library-it-software-core-roles.ts
 */

import { SOFTWARE_CORE_PACKS } from './career-library-it/packs-software-core'
import {
  createServiceClient,
  ensureItSkillStageModel,
  populateItPack,
  IT_SKILL_STAGE_KEYS,
  type SpecialismPack,
} from './career-library-it/shared'

const TARGET_SLUGS = new Set(SOFTWARE_CORE_PACKS.map((p) => p.slug))

async function clearDraftRolesForTargets(
  packs: SpecialismPack[]
): Promise<Record<string, number>> {
  const supabase = createServiceClient()
  const removed: Record<string, number> = {}

  for (const pack of packs) {
    const { data: spec, error } = await supabase
      .from('career_library_specialisms')
      .select('id, slug')
      .eq('slug', pack.slug)
      .maybeSingle()

    if (error || !spec) {
      throw new Error(`${pack.label} not found: ${error?.message ?? 'missing'}`)
    }

    const { data: roles, error: listErr } = await supabase
      .from('career_library_roles')
      .select('id')
      .eq('specialism_id', spec.id)
      .eq('status', 'draft')

    if (listErr) throw new Error(listErr.message)

    const ids = (roles ?? []).map((r) => r.id)
    if (!ids.length) {
      removed[pack.slug] = 0
      continue
    }

    // Delete in chunks
    let deleted = 0
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100)
      const { error: delErr, count } = await supabase
        .from('career_library_roles')
        .delete({ count: 'exact' })
        .in('id', chunk)
      if (delErr) throw new Error(`${pack.slug} delete failed: ${delErr.message}`)
      deleted += count ?? chunk.length
    }
    removed[pack.slug] = deleted
  }

  return removed
}

async function main() {
  const packs = SOFTWARE_CORE_PACKS
  const supabase = createServiceClient()

  // Ensure stage model + specialisms point at it
  const { modelId, stageByKey } = await ensureItSkillStageModel(supabase)

  for (const pack of packs) {
    const { data: spec, error } = await supabase
      .from('career_library_specialisms')
      .select('id, stage_model_id, status')
      .eq('slug', pack.slug)
      .maybeSingle()
    if (error || !spec) throw new Error(`${pack.slug} missing`)
    if (spec.stage_model_id !== modelId) {
      await supabase
        .from('career_library_specialisms')
        .update({ stage_model_id: modelId, status: 'draft' })
        .eq('id', spec.id)
    }
  }

  const allNames = packs.flatMap((p) => p.roles.map((r) => r.name))
  const seen = new Set<string>()
  const internalDupes: string[] = []
  for (const n of allNames) {
    const k = n.trim().toLowerCase()
    if (seen.has(k)) internalDupes.push(n)
    seen.add(k)
  }
  if (internalDupes.length) {
    throw new Error(`Duplicate titles within packs: ${internalDupes.join('; ')}`)
  }

  console.log('\n=== IT Software Core roles populate (it_skill_experience) ===')
  console.log(`Stage model: it_skill_experience (${modelId})`)
  console.log('Clearing prior draft roles for target specialisms only...\n')

  const removed = await clearDraftRolesForTargets(packs)
  for (const [slug, n] of Object.entries(removed)) {
    console.log(`  cleared ${slug}: ${n} draft roles`)
  }

  // Reserve titles from ALL other specialisms (Engineering + other IT)
  const { data: allSpecs } = await supabase.from('career_library_specialisms').select('id, slug')
  const reservedNames = new Set<string>()
  for (const sib of allSpecs ?? []) {
    if (TARGET_SLUGS.has(sib.slug)) continue
    const { data: roles } = await supabase
      .from('career_library_roles')
      .select('name')
      .eq('specialism_id', sib.id)
    for (const role of roles ?? []) reservedNames.add(role.name.trim().toLowerCase())
  }

  let totalCreated = 0
  let totalSameSkipped = 0
  let totalCrossSkipped = 0
  const createdBySpec: Record<string, number> = {}

  for (const pack of packs) {
    const result = await populateItPack(supabase, pack, stageByKey, reservedNames)
    let created = 0
    let sameSkipped = 0
    let crossSkipped = 0

    console.log(`\n--- ${result.specialism.name} (${result.specialism.slug}) ---`)
    for (const key of IT_SKILL_STAGE_KEYS) {
      const sr = result.stageResults[key]
      if (!sr) continue
      created += sr.created.length
      sameSkipped += sr.skipped.length
      crossSkipped += sr.crossSkipped.length
      if (sr.created.length || sr.crossSkipped.length) {
        console.log(`${key}: +${sr.created.length}`)
        for (const n of sr.created) console.log(`  + ${n}`)
        for (const n of sr.crossSkipped) console.log(`  - conflict: ${n}`)
      }
    }
    createdBySpec[pack.slug] = created
    totalCreated += created
    totalSameSkipped += sameSkipped
    totalCrossSkipped += crossSkipped
    console.log(
      `Created: ${created} | Draft total: ${result.draftCount} | same-skip: ${sameSkipped} | cross-skip: ${crossSkipped}`
    )
  }

  console.log('\n=== Totals ===')
  console.log(`Roles created: ${totalCreated}`)
  for (const [slug, n] of Object.entries(createdBySpec)) console.log(`  ${slug}: ${n}`)
  console.log(`Duplicates skipped (same specialism): ${totalSameSkipped}`)
  console.log(`Duplicates skipped (cross-specialism title conflict): ${totalCrossSkipped}`)
  console.log('Prior draft roles cleared (replaced for correct stage model):')
  for (const [slug, n] of Object.entries(removed)) console.log(`  ${slug}: ${n}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
