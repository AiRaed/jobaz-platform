/**
 * Audit IT & Technology Career Knowledge Library (read-only).
 *   npx tsx scripts/career-library-it/audit-it-library.ts
 */

import { createServiceClient, EXPERIENCE_STAGE_KEYS } from './shared'

async function main() {
  const supabase = createServiceClient()

  const { data: engField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .eq('slug', 'engineering')
    .maybeSingle()

  let engRoleCount = 0
  let engSpecCount = 0
  if (engField) {
    const { data: engSpecs } = await supabase
      .from('career_library_specialisms')
      .select('id')
      .eq('field_id', engField.id)
    engSpecCount = engSpecs?.length ?? 0
    if (engSpecs?.length) {
      const { count } = await supabase
        .from('career_library_roles')
        .select('id', { count: 'exact', head: true })
        .in(
          'specialism_id',
          engSpecs.map((s) => s.id)
        )
      engRoleCount = count ?? 0
    }
  }

  const { data: itField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, status, active')
    .eq('slug', 'it-technology')
    .maybeSingle()

  if (!itField) throw new Error('IT field missing')

  const { data: specs } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug, stage_model_id, professional_body, status, active')
    .eq('field_id', itField.id)
    .order('sort_order', { ascending: true })

  const { data: model } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key')
    .eq('model_key', 'experience_level')
    .maybeSingle()

  const { data: stages } = await supabase
    .from('career_library_stages')
    .select('id, stage_key, label')
    .eq('stage_model_id', model!.id)

  const stageById = new Map((stages ?? []).map((s) => [s.id, s.stage_key]))

  console.log('\n=== IT & Technology audit ===')
  console.log(`Field: ${itField.name} (${itField.slug}) status=${itField.status} active=${itField.active}`)
  console.log(`Stage model: ${model?.model_key} (${model?.id})`)
  console.log(`Specialisms: ${specs?.length ?? 0}`)
  console.log(`Engineering unchanged check: specialisms=${engSpecCount} roles=${engRoleCount}`)

  let totalRoles = 0
  let draftActive = 0
  let academicRoles = 0
  const empty: string[] = []
  const lowCoverage: string[] = []
  const wrongModel: string[] = []
  const titleMap = new Map<string, string[]>()

  for (const spec of specs ?? []) {
    if (spec.stage_model_id !== model?.id) wrongModel.push(spec.slug)

    const { data: roles } = await supabase
      .from('career_library_roles')
      .select(
        'name, status, active, stage_id, fit_classification, academic_requirement, is_research_role, is_academic_role'
      )
      .eq('specialism_id', spec.id)

    const count = roles?.length ?? 0
    totalRoles += count
    if (count === 0) empty.push(spec.slug)

    const stageCounts: Record<string, number> = {}
    for (const key of EXPERIENCE_STAGE_KEYS) stageCounts[key] = 0

    for (const role of roles ?? []) {
      if (role.status === 'draft' && role.active) draftActive += 1
      const sk = role.stage_id ? stageById.get(role.stage_id) : null
      if (sk) stageCounts[sk] = (stageCounts[sk] ?? 0) + 1
      if (sk === 'academic_research' || role.is_research_role || role.is_academic_role) {
        academicRoles += 1
      }
      const k = role.name.trim().toLowerCase()
      const list = titleMap.get(k) ?? []
      list.push(spec.slug)
      titleMap.set(k, list)
    }

    const coreStages = EXPERIENCE_STAGE_KEYS.filter((k) => k !== 'academic_research')
    const missingCore = coreStages.filter((k) => (stageCounts[k] ?? 0) === 0)
    if (missingCore.length) lowCoverage.push(`${spec.slug}: missing ${missingCore.join(',')}`)

    console.log(
      `${spec.slug}: ${count} roles | ` +
        EXPERIENCE_STAGE_KEYS.map((k) => `${k}=${stageCounts[k] ?? 0}`).join(' ')
    )
  }

  const crossDupes = [...titleMap.entries()].filter(([, slugs]) => slugs.length > 1)

  console.log('\n=== Totals ===')
  console.log(`Total IT roles: ${totalRoles}`)
  console.log(`Draft+active: ${draftActive}`)
  console.log(`Academic/research flagged: ${academicRoles}`)
  console.log(`Empty specialisms: ${empty.length ? empty.join(', ') : 'none'}`)
  console.log(`Wrong stage model: ${wrongModel.length ? wrongModel.join(', ') : 'none'}`)
  console.log(`Missing core stage coverage: ${lowCoverage.length ? lowCoverage.join(' | ') : 'none'}`)
  console.log(`Cross-specialism exact title dupes: ${crossDupes.length}`)
  if (crossDupes.length) {
    for (const [title, slugs] of crossDupes.slice(0, 20)) {
      console.log(`  ${title} -> ${slugs.join(', ')}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
