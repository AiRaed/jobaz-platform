/**
 * READ-ONLY comprehensive audit of the Career Knowledge Library
 * for the Work in My Education pathway.
 *
 * Does NOT insert, update, delete, migrate or reseed any data.
 *
 *   npx tsx scripts/audit-career-library.ts
 *
 * Outputs:
 *   reports/career-library-audit.json
 *   reports/career-library-audit.md
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  CAREER_LIBRARY_ACADEMIC_REQUIREMENTS,
  CAREER_LIBRARY_FIT_CLASSIFICATIONS,
  CAREER_LIBRARY_REGISTRATION_REQUIREMENTS,
  CAREER_LIBRARY_SENIORITY_LEVELS,
} from '../lib/admin/career-library/types'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

function client(): SupabaseClient {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const EXPECTED_FIELDS: Array<{ slug: string; name: string }> = [
  { slug: 'engineering', name: 'Engineering' },
  { slug: 'it-technology', name: 'IT & Technology' },
  { slug: 'healthcare-medicine', name: 'Healthcare & Medicine' },
  { slug: 'natural-sciences-research', name: 'Natural Sciences & Research' },
  { slug: 'business-management', name: 'Business & Management' },
  { slug: 'accounting-finance-banking', name: 'Accounting, Finance & Banking' },
  { slug: 'law-legal-justice', name: 'Law, Legal & Justice' },
  { slug: 'education-teaching', name: 'Education & Teaching' },
  { slug: 'arts-media-creative-industries', name: 'Arts, Media & Creative Industries' },
  { slug: 'languages-literature', name: 'Languages & Literature' },
  { slug: 'humanities-social-sciences', name: 'Humanities & Social Sciences' },
  { slug: 'environment-agriculture-food', name: 'Environment, Agriculture & Food' },
  {
    slug: 'government-public-policy-international-development',
    name: 'Government, Public Policy & International Development',
  },
  { slug: 'hospitality-tourism-events', name: 'Hospitality, Tourism & Events' },
  {
    slug: 'logistics-supply-chain-transport-management',
    name: 'Logistics, Supply Chain & Transport Management',
  },
]

type Severity = 'critical' | 'high' | 'medium' | 'low'

type Finding = {
  severity: Severity
  category: string
  field: string
  specialism: string
  role_id: string
  role_title: string
  stage: string
  description: string
  evidence: Record<string, unknown>
  recommended_action: string
  auto_fix_safe: false
}

type FieldCoverage = {
  slug: string
  name: string
  status: string | null
  active: boolean | null
  specialism_count: number
  role_count: number
  stage_model_keys: string[]
  stages: Array<{ key: string; label: string; sort_order: number; role_count: number }>
  empty_specialisms: string[]
  single_stage_specialisms: string[]
  academic_stage_keys_present: string[]
}

const findings: Finding[] = []
const MAX_PER_CATEGORY = 40

function addFinding(f: Omit<Finding, 'auto_fix_safe'>) {
  const count = findings.filter((x) => x.category === f.category).length
  if (count >= MAX_PER_CATEGORY) return
  findings.push({ ...f, auto_fix_safe: false })
}

function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function singularish(t: string): string {
  return normTitle(t).replace(/\b(managers|engineers|officers|analysts|assistants|specialists)\b/g, (m) =>
    m.replace(/s$/, '')
  )
}

const ACADEMIC_STAGE_KEYS = new Set(['degree', 'masters', 'phd', 'bachelor', 'bachelors'])

const US_TERMS =
  /\b(attorney|counselor|realtor|sophomore|freshman|sophomore|GPA|associate'?s degree|bar exam only|SOC code)\b/i

const LOW_BARRIER =
  /\b(waiter|waitress|bar staff|kitchen porter|room attendant|housekeeping assistant|forklift|warehouse operative|courier|delivery driver|taxi driver|bus driver|truck driver|hgv driver|cleaner)\b/i

const ENTRY_TITLE =
  /\b(apprentice|trainee|graduate|assistant|junior|newly qualified|entry[- ]level)\b/i

const SENIOR_TITLE =
  /\b(director|head of|chief |partner|vp |vice president|executive|principal |senior |cto|cfo|ceo|permanent secretary)\b/i

const MANAGER_TITLE = /\b(manager|lead |head |director|partner|consultant)\b/i

async function loadAll(supabase: SupabaseClient) {
  const { data: fields, error: fErr } = await supabase
    .from('career_library_fields')
    .select('id, name, slug, status, active, sort_order')
    .order('sort_order', { ascending: true })
  if (fErr) throw new Error(fErr.message)

  const { data: models, error: mErr } = await supabase
    .from('career_library_stage_models')
    .select('id, model_key, name, active, sort_order')
  if (mErr) throw new Error(mErr.message)

  const { data: stages, error: sErr } = await supabase
    .from('career_library_stages')
    .select('id, stage_model_id, stage_key, label, sort_order, active')
    .order('sort_order', { ascending: true })
  if (sErr) throw new Error(sErr.message)

  const { data: specialisms, error: spErr } = await supabase
    .from('career_library_specialisms')
    .select(
      'id, field_id, name, slug, status, active, stage_model_id, professional_body, regulated_profession, sort_order'
    )
    .order('sort_order', { ascending: true })
  if (spErr) throw new Error(spErr.message)

  type RoleRow = {
    id: string
    specialism_id: string
    stage_id: string | null
    name: string
    slug: string
    status: string | null
    active: boolean | null
    role_category: string | null
    seniority_level: string | null
    minimum_experience_years: number | null
    academic_requirement: string | null
    professional_registration_requirement: string | null
    professional_membership_requirement: string | null
    is_research_role: boolean | null
    is_academic_role: boolean | null
    is_regulated_or_restricted: boolean | null
    fit_classification: string | null
    eligibility_note: string | null
    metadata: Record<string, unknown> | null
  }

  const roles: RoleRow[] = []
  // Paginate roles — Supabase default limit is 1000
  let from = 0
  const page = 1000
  for (;;) {
    const { data, error } = await supabase
      .from('career_library_roles')
      .select(
        'id, specialism_id, stage_id, name, slug, status, active, role_category, seniority_level, minimum_experience_years, academic_requirement, professional_registration_requirement, professional_membership_requirement, is_research_role, is_academic_role, is_regulated_or_restricted, fit_classification, eligibility_note, metadata'
      )
      .range(from, from + page - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    roles.push(...(data as RoleRow[]))
    if (data.length < page) break
    from += page
  }

  return {
    fields: fields ?? [],
    models: models ?? [],
    stages: stages ?? [],
    specialisms: specialisms ?? [],
    roles,
  }
}

function scanCodebaseForEngineeringAcademicSeeds(): {
  files_with_degree_masters_phd_stages: string[]
  remap_script_present: boolean
  professional_migration_present: boolean
} {
  const root = process.cwd()
  const hits: string[] = []
  const scriptsDir = join(root, 'scripts')
  const files = readdirSync(scriptsDir).filter(
    (f) =>
      f.endsWith('.ts') &&
      (f.includes('engineering') ||
        f.includes('civil') ||
        f.includes('mechanical') ||
        f.includes('chemical') ||
        f.includes('electrical') ||
        f.includes('aerospace') ||
        f.includes('petroleum') ||
        f.includes('architecture') ||
        f.includes('quantity-surveying') ||
        f.includes('marine-naval') ||
        f.includes('materials-biomedical') ||
        f.includes('mining-railway') ||
        f.includes('building-services') ||
        f.includes('structural-geotechnical'))
  )
  for (const f of files) {
    const path = join(scriptsDir, f)
    try {
      const text = readFileSync(path, 'utf8')
      // Ignore retirement stubs that refuse to run and only document the old model
      if (/refuseLegacyEngineeringAcademicPopulate|RETIRED — Do not use/.test(text)) {
        continue
      }
      if (
        /type StageKey = 'degree' \| 'masters' \| 'phd'/.test(text) ||
        /model_key',\s*'academic_level'/.test(text) ||
        /\.eq\('model_key',\s*'academic_level'\)/.test(text) ||
        /DEGREE_ROLES|MASTERS_ROLES|PHD_ROLES/.test(text)
      ) {
        hits.push(`scripts/${f}`)
      }
    } catch {
      /* ignore */
    }
  }
  return {
    files_with_degree_masters_phd_stages: hits,
    remap_script_present: existsSync(join(scriptsDir, 'remap-engineering-professional-stages.ts')),
    professional_migration_present: existsSync(
      join(root, 'supabase/migrations/20250803380000_career_library_engineering_professional_stage_model.sql')
    ),
  }
}

async function main() {
  const supabase = client()
  const generatedAt = new Date().toISOString()
  console.log('Loading Career Knowledge Library (read-only)...')
  const data = await loadAll(supabase)
  console.log(
    `Loaded fields=${data.fields.length} models=${data.models.length} stages=${data.stages.length} specialisms=${data.specialisms.length} roles=${data.roles.length}`
  )

  const fieldById = new Map(data.fields.map((f) => [f.id, f]))
  const fieldBySlug = new Map(data.fields.map((f) => [f.slug, f]))
  const modelById = new Map(data.models.map((m) => [m.id, m]))
  const stageById = new Map(data.stages.map((s) => [s.id, s]))
  const specsByField = new Map<string, typeof data.specialisms>()
  for (const sp of data.specialisms) {
    const list = specsByField.get(sp.field_id) ?? []
    list.push(sp)
    specsByField.set(sp.field_id, list)
  }
  const rolesBySpec = new Map<string, typeof data.roles>()
  for (const r of data.roles) {
    const list = rolesBySpec.get(r.specialism_id) ?? []
    list.push(r)
    rolesBySpec.set(r.specialism_id, list)
  }
  const specById = new Map(data.specialisms.map((s) => [s.id, s]))

  // ---------- 1. STRUCTURE ----------
  for (const expected of EXPECTED_FIELDS) {
    if (!fieldBySlug.has(expected.slug)) {
      addFinding({
        severity: 'critical',
        category: 'structure.missing_field',
        field: expected.slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: `Expected Career Field missing: ${expected.name} (${expected.slug})`,
        evidence: { expected },
        recommended_action: 'Investigate whether field was never seeded or slug changed',
      })
    }
  }

  const slugCounts = new Map<string, number>()
  for (const f of data.fields) slugCounts.set(f.slug, (slugCounts.get(f.slug) ?? 0) + 1)
  for (const [slug, n] of slugCounts) {
    if (n > 1) {
      addFinding({
        severity: 'critical',
        category: 'structure.duplicate_field',
        field: slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: `Duplicate Career Field slug appears ${n} times`,
        evidence: {
          field_ids: data.fields.filter((f) => f.slug === slug).map((f) => f.id),
        },
        recommended_action: 'Consolidate duplicate field records',
      })
    }
  }

  for (const f of data.fields) {
    const specs = specsByField.get(f.id) ?? []
    const modelKeys = new Set<string>()
    for (const sp of specs) {
      const m = sp.stage_model_id ? modelById.get(sp.stage_model_id) : null
      if (!sp.stage_model_id || !m) {
        addFinding({
          severity: 'critical',
          category: 'structure.specialism_missing_stage_model',
          field: f.slug,
          specialism: sp.slug,
          role_id: '',
          role_title: '',
          stage: '',
          description: `Specialism has no valid stage_model_id`,
          evidence: { specialism_id: sp.id, stage_model_id: sp.stage_model_id },
          recommended_action: 'Assign correct field-specific stage model',
        })
      } else {
        modelKeys.add(m.model_key)
      }
    }
    if (specs.length && modelKeys.size === 0) {
      addFinding({
        severity: 'critical',
        category: 'structure.field_without_stage_model',
        field: f.slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Field has specialisms but none linked to a stage model',
        evidence: { specialism_count: specs.length },
        recommended_action: 'Assign stage model to all specialisms',
      })
    }
    if (modelKeys.size > 1) {
      addFinding({
        severity: 'high',
        category: 'structure.field_conflicting_stage_models',
        field: f.slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: `Field specialisms use multiple stage models: ${[...modelKeys].join(', ')}`,
        evidence: { model_keys: [...modelKeys] },
        recommended_action: 'Unify specialisms onto one field-specific stage model',
      })
    }

    // Duplicate specialisms in field
    const bySlug = new Map<string, string[]>()
    const byName = new Map<string, string[]>()
    for (const sp of specs) {
      bySlug.set(sp.slug, [...(bySlug.get(sp.slug) ?? []), sp.id])
      const nk = sp.name.trim().toLowerCase()
      byName.set(nk, [...(byName.get(nk) ?? []), sp.id])
    }
    for (const [slug, ids] of bySlug) {
      if (ids.length > 1) {
        addFinding({
          severity: 'high',
          category: 'structure.duplicate_specialism_slug',
          field: f.slug,
          specialism: slug,
          role_id: '',
          role_title: '',
          stage: '',
          description: `Duplicate specialism slug within field`,
          evidence: { specialism_ids: ids },
          recommended_action: 'Merge or rename duplicate specialisms',
        })
      }
    }
    for (const [name, ids] of byName) {
      if (ids.length > 1) {
        addFinding({
          severity: 'medium',
          category: 'structure.duplicate_specialism_name',
          field: f.slug,
          specialism: name,
          role_id: '',
          role_title: '',
          stage: '',
          description: `Duplicate specialism name within field`,
          evidence: { specialism_ids: ids },
          recommended_action: 'Review and merge variant specialisms',
        })
      }
    }

    // Status inconsistencies
    if (f.status === 'draft' && f.active === false) {
      addFinding({
        severity: 'low',
        category: 'structure.status_inconsistency',
        field: f.slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Field is draft but active=false',
        evidence: { status: f.status, active: f.active, field_id: f.id },
        recommended_action: 'Confirm intentional inactive draft',
      })
    }
    if (!f.slug) {
      addFinding({
        severity: 'critical',
        category: 'structure.missing_slug',
        field: f.id,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Field missing slug',
        evidence: { field_id: f.id, name: f.name },
        recommended_action: 'Add valid slug',
      })
    }
  }

  // Orphan specialisms / roles
  for (const sp of data.specialisms) {
    if (!fieldById.has(sp.field_id)) {
      addFinding({
        severity: 'critical',
        category: 'structure.orphan_specialism',
        field: '',
        specialism: sp.slug,
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Specialism references missing field_id',
        evidence: { specialism_id: sp.id, field_id: sp.field_id },
        recommended_action: 'Relink or remove orphan specialism',
      })
    }
    if (!sp.slug) {
      addFinding({
        severity: 'high',
        category: 'structure.missing_specialism_slug',
        field: fieldById.get(sp.field_id)?.slug ?? '',
        specialism: sp.id,
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Specialism missing slug',
        evidence: { specialism_id: sp.id, name: sp.name },
        recommended_action: 'Add slug',
      })
    }
  }

  for (const role of data.roles) {
    const sp = specById.get(role.specialism_id)
    if (!sp) {
      addFinding({
        severity: 'critical',
        category: 'structure.orphan_role',
        field: '',
        specialism: '',
        role_id: role.id,
        role_title: role.name,
        stage: '',
        description: 'Role references missing specialism_id',
        evidence: { specialism_id: role.specialism_id },
        recommended_action: 'Relink or remove orphan role',
      })
      continue
    }
    const field = fieldById.get(sp.field_id)
    if (!role.stage_id) {
      addFinding({
        severity: 'high',
        category: 'structure.role_missing_stage',
        field: field?.slug ?? '',
        specialism: sp.slug,
        role_id: role.id,
        role_title: role.name,
        stage: '',
        description: 'Role has null stage_id',
        evidence: { role_slug: role.slug },
        recommended_action: 'Assign valid stage_id from specialism stage model',
      })
    } else {
      const stage = stageById.get(role.stage_id)
      if (!stage) {
        addFinding({
          severity: 'critical',
          category: 'structure.orphaned_stage_assignment',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_id: role.id,
          role_title: role.name,
          stage: role.stage_id,
          description: 'Role stage_id does not resolve to a stage row',
          evidence: { stage_id: role.stage_id },
          recommended_action: 'Fix stage_id FK',
        })
      } else if (sp.stage_model_id && stage.stage_model_id !== sp.stage_model_id) {
        addFinding({
          severity: 'high',
          category: 'structure.stage_model_mismatch',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_id: role.id,
          role_title: role.name,
          stage: stage.stage_key,
          description: 'Role stage belongs to a different stage model than its specialism',
          evidence: {
            role_stage_model_id: stage.stage_model_id,
            specialism_stage_model_id: sp.stage_model_id,
            specialism_model: modelById.get(sp.stage_model_id)?.model_key,
            role_model: modelById.get(stage.stage_model_id)?.model_key,
          },
          recommended_action: 'Remap role to a stage in the specialism stage model',
        })
      }
    }
    if (!role.slug) {
      addFinding({
        severity: 'medium',
        category: 'structure.missing_role_slug',
        field: field?.slug ?? '',
        specialism: sp.slug,
        role_id: role.id,
        role_title: role.name,
        stage: '',
        description: 'Role missing slug',
        evidence: {},
        recommended_action: 'Generate slug',
      })
    }
    if (!role.name?.trim()) {
      addFinding({
        severity: 'critical',
        category: 'structure.missing_role_title',
        field: field?.slug ?? '',
        specialism: sp.slug,
        role_id: role.id,
        role_title: '',
        stage: '',
        description: 'Role missing title',
        evidence: {},
        recommended_action: 'Set role name',
      })
    }
  }

  // Empty specialisms
  for (const sp of data.specialisms) {
    const roles = rolesBySpec.get(sp.id) ?? []
    if (roles.length === 0) {
      const field = fieldById.get(sp.field_id)
      addFinding({
        severity: 'high',
        category: 'structure.empty_specialism',
        field: field?.slug ?? '',
        specialism: sp.slug,
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Specialism has zero roles',
        evidence: { specialism_id: sp.id, name: sp.name },
        recommended_action: 'Populate roles or deactivate specialism',
      })
    }
  }

  // Stage ordering within models
  for (const model of data.models) {
    const stages = data.stages
      .filter((s) => s.stage_model_id === model.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    const orders = stages.map((s) => s.sort_order)
    const uniq = new Set(orders)
    if (uniq.size !== orders.length) {
      addFinding({
        severity: 'medium',
        category: 'structure.invalid_stage_ordering',
        field: '',
        specialism: '',
        role_id: '',
        role_title: '',
        stage: model.model_key,
        description: 'Stage model has duplicate sort_order values',
        evidence: { model_id: model.id, stages: stages.map((s) => ({ key: s.stage_key, sort_order: s.sort_order })) },
        recommended_action: 'Make sort_order unique and ascending',
      })
    }
  }

  // ---------- 2. STAGE MODEL ----------
  const coverage: FieldCoverage[] = []
  let engineeringClean = true
  let engineeringAcademicStageRoles = 0

  for (const expected of EXPECTED_FIELDS) {
    const f = fieldBySlug.get(expected.slug)
    if (!f) continue
    const specs = specsByField.get(f.id) ?? []
    const modelKeys = new Set<string>()
    const stageCounts = new Map<string, { label: string; sort_order: number; count: number }>()
    let roleCount = 0
    const empty: string[] = []
    const singleStage: string[] = []
    const academicKeysPresent = new Set<string>()

    for (const sp of specs) {
      const m = sp.stage_model_id ? modelById.get(sp.stage_model_id) : null
      if (m) modelKeys.add(m.model_key)
      const roles = rolesBySpec.get(sp.id) ?? []
      roleCount += roles.length
      if (!roles.length) empty.push(sp.slug)
      const stageKeysUsed = new Set<string>()
      for (const r of roles) {
        const st = r.stage_id ? stageById.get(r.stage_id) : null
        if (st) {
          stageKeysUsed.add(st.stage_key)
          const cur = stageCounts.get(st.stage_key) ?? {
            label: st.label,
            sort_order: st.sort_order,
            count: 0,
          }
          cur.count += 1
          stageCounts.set(st.stage_key, cur)
          if (ACADEMIC_STAGE_KEYS.has(st.stage_key)) {
            academicKeysPresent.add(st.stage_key)
            if (f.slug === 'engineering') {
              engineeringClean = false
              engineeringAcademicStageRoles += 1
              addFinding({
                severity: 'critical',
                category: 'stage.engineering_academic_stage_still_in_use',
                field: 'engineering',
                specialism: sp.slug,
                role_id: r.id,
                role_title: r.name,
                stage: st.stage_key,
                description: 'Engineering role still assigned to Degree/Master\'s/PhD academic stage',
                evidence: { stage_id: st.id, stage_label: st.label },
                recommended_action: 'Remap to engineering_professional_route stage',
              })
            } else {
              addFinding({
                severity: 'high',
                category: 'stage.academic_qualification_used_as_stage',
                field: f.slug,
                specialism: sp.slug,
                role_id: r.id,
                role_title: r.name,
                stage: st.stage_key,
                description: 'Stage key is an education level rather than professional progression',
                evidence: { stage_label: st.label, model: m?.model_key },
                recommended_action: 'Replace academic-level stages with professional progression model',
              })
            }
          }
        }
      }
      if (roles.length > 0 && stageKeysUsed.size === 1) singleStage.push(sp.slug)
    }

    // Engineering model check
    if (f.slug === 'engineering') {
      if (![...modelKeys].includes('engineering_professional_route')) {
        engineeringClean = false
        addFinding({
          severity: 'critical',
          category: 'stage.engineering_not_on_professional_model',
          field: 'engineering',
          specialism: '',
          role_id: '',
          role_title: '',
          stage: [...modelKeys].join(','),
          description: 'Engineering specialisms are not on engineering_professional_route',
          evidence: { model_keys: [...modelKeys] },
          recommended_action: 'Assign engineering_professional_route to all Engineering specialisms',
        })
      }
      if ([...modelKeys].includes('academic_level')) {
        engineeringClean = false
        addFinding({
          severity: 'critical',
          category: 'stage.engineering_still_on_academic_level',
          field: 'engineering',
          specialism: '',
          role_id: '',
          role_title: '',
          stage: 'academic_level',
          description: 'Some Engineering specialisms still linked to academic_level model',
          evidence: { model_keys: [...modelKeys] },
          recommended_action: 'Complete remapping off academic_level',
        })
      }
    }

    // Implausible stage mappings (sample)
    for (const sp of specs) {
      const fieldSlug = f.slug
      for (const r of rolesBySpec.get(sp.id) ?? []) {
        const st = r.stage_id ? stageById.get(r.stage_id) : null
        if (!st) continue
        const sk = st.stage_key.toLowerCase()
        const years = r.minimum_experience_years ?? 0
        const fit = r.fit_classification ?? ''
        const title = r.name

        if (
          ENTRY_TITLE.test(title) &&
          (/director|executive|head_|senior_civil|leadership|manager_principal/i.test(sk) ||
            /director|executive|head of/i.test(st.label))
        ) {
          addFinding({
            severity: 'high',
            category: 'stage.entry_title_on_leadership_stage',
            field: fieldSlug,
            specialism: sp.slug,
            role_id: r.id,
            role_title: title,
            stage: st.stage_key,
            description: 'Apprentice/assistant/graduate/trainee title mapped to leadership stage',
            evidence: { stage_label: st.label, years, fit },
            recommended_action: 'Remap to foundation/graduate/practitioner stage',
          })
        }

        if (
          SENIOR_TITLE.test(title) &&
          (/foundation|entry|trainee|apprentice|graduate_entry|graduate_engineer|junior/i.test(sk) ||
            /foundation|entry|trainee|graduate/i.test(st.label)) &&
          !/graduate/i.test(title)
        ) {
          addFinding({
            severity: 'high',
            category: 'stage.senior_title_on_entry_stage',
            field: fieldSlug,
            specialism: sp.slug,
            role_id: r.id,
            role_title: title,
            stage: st.stage_key,
            description: 'Senior/director title mapped to entry/foundation stage',
            evidence: { stage_label: st.label, years, fit },
            recommended_action: 'Remap to senior/management/executive stage',
          })
        }

        if (
          (r.is_academic_role || /professor|lecturer|doctoral|research fellow/i.test(title)) &&
          !/academic|research/i.test(sk) &&
          !/academic|research/i.test(st.label)
        ) {
          addFinding({
            severity: 'medium',
            category: 'stage.academic_role_not_on_academic_stage',
            field: fieldSlug,
            specialism: sp.slug,
            role_id: r.id,
            role_title: title,
            stage: st.stage_key,
            description: 'Academic/research role not on Academic/Research stage',
            evidence: {
              is_academic_role: r.is_academic_role,
              is_research_role: r.is_research_role,
              academic_requirement: r.academic_requirement,
            },
            recommended_action: 'Move to academic_research stage or justify industry research placement',
          })
        }
      }
    }

    coverage.push({
      slug: f.slug,
      name: f.name,
      status: f.status,
      active: f.active,
      specialism_count: specs.length,
      role_count: roleCount,
      stage_model_keys: [...modelKeys],
      stages: [...stageCounts.entries()]
        .map(([key, v]) => ({ key, label: v.label, sort_order: v.sort_order, role_count: v.count }))
        .sort((a, b) => a.sort_order - b.sort_order),
      empty_specialisms: empty,
      single_stage_specialisms: singleStage,
      academic_stage_keys_present: [...academicKeysPresent],
    })
  }

  // ---------- 3. DUPLICATES ----------
  type DupClass = 'confirmed_duplicate' | 'probable_duplicate' | 'legitimate_overlap' | 'manual_review'
  const duplicateFindings: Array<{
    classification: DupClass
    field: string
    specialism: string
    role_ids: string[]
    titles: string[]
    reason: string
  }> = []

  for (const sp of data.specialisms) {
    const field = fieldById.get(sp.field_id)
    const roles = rolesBySpec.get(sp.id) ?? []
    const byExact = new Map<string, typeof roles>()
    const byNorm = new Map<string, typeof roles>()
    const bySing = new Map<string, typeof roles>()
    for (const r of roles) {
      const e = r.name.trim().toLowerCase()
      const n = normTitle(r.name)
      const s = singularish(r.name)
      byExact.set(e, [...(byExact.get(e) ?? []), r])
      byNorm.set(n, [...(byNorm.get(n) ?? []), r])
      bySing.set(s, [...(bySing.get(s) ?? []), r])
    }
    for (const [, group] of byExact) {
      if (group.length > 1) {
        duplicateFindings.push({
          classification: 'confirmed_duplicate',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_ids: group.map((r) => r.id),
          titles: group.map((r) => r.name),
          reason: 'exact_case_insensitive_title_within_specialism',
        })
        addFinding({
          severity: 'high',
          category: 'duplicate.exact_within_specialism',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_id: group[0].id,
          role_title: group[0].name,
          stage: '',
          description: `Confirmed duplicate titles within specialism (${group.length})`,
          evidence: {
            classification: 'confirmed_duplicate',
            role_ids: group.map((r) => r.id),
            titles: group.map((r) => r.name),
          },
          recommended_action: 'Deduplicate keeping one canonical role',
        })
      }
    }
    for (const [key, group] of byNorm) {
      if (group.length > 1) {
        const exactKeys = new Set(group.map((r) => r.name.trim().toLowerCase()))
        if (exactKeys.size === 1) continue // already reported
        duplicateFindings.push({
          classification: 'probable_duplicate',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_ids: group.map((r) => r.id),
          titles: group.map((r) => r.name),
          reason: 'punctuation_or_spacing_normalized_match',
        })
        addFinding({
          severity: 'medium',
          category: 'duplicate.normalized_within_specialism',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_id: group[0].id,
          role_title: group[0].name,
          stage: '',
          description: `Probable punctuation/spacing duplicate: ${key}`,
          evidence: {
            classification: 'probable_duplicate',
            role_ids: group.map((r) => r.id),
            titles: group.map((r) => r.name),
          },
          recommended_action: 'Manual review and merge if same role',
        })
      }
    }
    for (const [key, group] of bySing) {
      if (group.length > 1) {
        const norms = new Set(group.map((r) => normTitle(r.name)))
        if (norms.size <= 1) continue
        duplicateFindings.push({
          classification: 'manual_review',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_ids: group.map((r) => r.id),
          titles: group.map((r) => r.name),
          reason: 'singular_plural_near_duplicate',
        })
        addFinding({
          severity: 'low',
          category: 'duplicate.singular_plural_near',
          field: field?.slug ?? '',
          specialism: sp.slug,
          role_id: group[0].id,
          role_title: group[0].name,
          stage: '',
          description: `Singular/plural near-duplicate candidates`,
          evidence: {
            classification: 'manual_review',
            key,
            role_ids: group.map((r) => r.id),
            titles: group.map((r) => r.name),
          },
          recommended_action: 'Manual review',
        })
      }
    }
  }

  // Cross-specialism same title within field = legitimate_overlap note (sample)
  for (const f of data.fields) {
    const specs = specsByField.get(f.id) ?? []
    const titleMap = new Map<string, Array<{ spec: string; id: string; name: string }>>()
    for (const sp of specs) {
      for (const r of rolesBySpec.get(sp.id) ?? []) {
        const k = r.name.trim().toLowerCase()
        const list = titleMap.get(k) ?? []
        list.push({ spec: sp.slug, id: r.id, name: r.name })
        titleMap.set(k, list)
      }
    }
    let overlapSamples = 0
    for (const [, list] of titleMap) {
      const specsHit = new Set(list.map((x) => x.spec))
      if (specsHit.size > 1) {
        duplicateFindings.push({
          classification: 'legitimate_overlap',
          field: f.slug,
          specialism: [...specsHit].join(','),
          role_ids: list.map((x) => x.id),
          titles: list.map((x) => x.name),
          reason: 'same_title_across_specialisms_in_field',
        })
        if (overlapSamples < 5) {
          addFinding({
            severity: 'low',
            category: 'duplicate.cross_specialism_overlap',
            field: f.slug,
            specialism: [...specsHit].join(' | '),
            role_id: list[0].id,
            role_title: list[0].name,
            stage: '',
            description: 'Same title appears across multiple specialisms (may be legitimate)',
            evidence: {
              classification: 'legitimate_overlap',
              role_ids: list.map((x) => x.id),
              specialisms: [...specsHit],
            },
            recommended_action: 'Confirm intentional shared title or differentiate',
          })
          overlapSamples += 1
        }
      }
    }
  }

  // ---------- 4–7 ROLE QUALITY / QUAL / FIT / REG ----------
  let lowBarrierInEducationFields = 0
  for (const role of data.roles) {
    const sp = specById.get(role.specialism_id)
    if (!sp) continue
    const field = fieldById.get(sp.field_id)
    if (!field) continue
    const st = role.stage_id ? stageById.get(role.stage_id) : null
    const years = role.minimum_experience_years ?? 0
    const fit = role.fit_classification ?? ''
    const acad = role.academic_requirement ?? ''
    const reg = role.professional_registration_requirement ?? ''
    const title = role.name

    if (US_TERMS.test(title)) {
      addFinding({
        severity: 'medium',
        category: 'quality.us_terminology',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Possible US-only terminology in UK library title',
        evidence: {},
        recommended_action: 'Review UK naming',
      })
    }

    if (LOW_BARRIER.test(title)) {
      lowBarrierInEducationFields += 1
      addFinding({
        severity: 'medium',
        category: 'quality.low_barrier_operational_in_education_field',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Low-barrier operational title in Work in My Education library',
        evidence: {
          work_in_my_education_priority: role.metadata?.work_in_my_education_priority,
          low_barrier_operational: role.metadata?.low_barrier_operational,
        },
        recommended_action: 'Tag limited_context or defer to Experience/Quick Work pathways',
      })
    }

    if (MANAGER_TITLE.test(title) && years <= 0 && !ENTRY_TITLE.test(title)) {
      addFinding({
        severity: 'high',
        category: 'quality.manager_zero_experience',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Manager/Head/Director/Consultant-style title with 0 years minimum experience',
        evidence: { minimum_experience_years: years, seniority: role.seniority_level, fit },
        recommended_action: 'Raise minimum experience or retitle if graduate/entry',
      })
    }

    if (ENTRY_TITLE.test(title) && years >= 5) {
      addFinding({
        severity: 'high',
        category: 'quality.entry_title_high_experience',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Apprentice/Assistant/Trainee/Graduate title requiring 5+ years',
        evidence: { minimum_experience_years: years, fit },
        recommended_action: 'Lower experience requirement or retitle',
      })
    }

    if (SENIOR_TITLE.test(title) && fit === 'immediate' && !ENTRY_TITLE.test(title)) {
      addFinding({
        severity: 'high',
        category: 'fit.senior_marked_immediate',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Senior/director-style role marked fit=immediate',
        evidence: { fit, years, seniority: role.seniority_level },
        recommended_action: 'Set fit to future_progression or realistic_next',
      })
    }

    if (ENTRY_TITLE.test(title) && fit === 'future_progression') {
      addFinding({
        severity: 'medium',
        category: 'fit.entry_marked_future_progression',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Entry-style title marked future_progression',
        evidence: { fit, years },
        recommended_action: 'Usually immediate or realistic_next unless justified',
      })
    }

    if (
      (role.is_academic_role || /professor|lecturer|doctoral researcher|research fellow/i.test(title)) &&
      fit !== 'academic_or_research'
    ) {
      addFinding({
        severity: 'medium',
        category: 'fit.academic_not_academic_or_research',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Academic role fit is not academic_or_research',
        evidence: { fit, academic_requirement: acad, is_academic_role: role.is_academic_role },
        recommended_action: 'Set fit_classification to academic_or_research',
      })
    }

    if (
      (role.is_academic_role || /professor|lecturer|research fellow|doctoral/i.test(title)) &&
      acad !== 'phd_relevant' &&
      acad !== 'masters_relevant'
    ) {
      addFinding({
        severity: 'high',
        category: 'qualification.academic_missing_phd_metadata',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Academic/research title without suitable postgraduate academic_requirement',
        evidence: {
          academic_requirement: acad,
          current: acad,
          suspected_correction: 'phd_relevant',
        },
        recommended_action: 'Set academic_requirement to phd_relevant (or justify)',
      })
    }

    if (acad === 'phd_relevant' && !role.is_research_role && !role.is_academic_role && !/research|lecturer|professor|doctoral|fellow/i.test(title)) {
      addFinding({
        severity: 'medium',
        category: 'qualification.phd_on_non_research_role',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'PhD-relevant requirement on role that does not look academic/research',
        evidence: {
          academic_requirement: acad,
          is_research_role: role.is_research_role,
          is_academic_role: role.is_academic_role,
          suspected_correction: 'degree_relevant or masters_relevant',
        },
        recommended_action: 'Confirm whether PhD is genuinely required',
      })
    }

    if (acad === 'masters_relevant' && SENIOR_TITLE.test(title) && years <= 2 && fit === 'immediate') {
      addFinding({
        severity: 'medium',
        category: 'qualification.masters_as_automatic_seniority',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Master\'s + senior title + immediate/low experience suggests Master\'s treated as seniority',
        evidence: { academic_requirement: acad, years, fit },
        recommended_action: 'Decouple Master\'s from seniority; raise experience / change fit',
      })
    }

    // Enum consistency
    if (fit && !CAREER_LIBRARY_FIT_CLASSIFICATIONS.includes(fit as never)) {
      addFinding({
        severity: 'high',
        category: 'consistency.invalid_fit_enum',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: `Invalid fit_classification value: ${fit}`,
        evidence: { fit },
        recommended_action: 'Correct to allowed enum',
      })
    }
    if (
      role.seniority_level &&
      !CAREER_LIBRARY_SENIORITY_LEVELS.includes(role.seniority_level as never)
    ) {
      addFinding({
        severity: 'high',
        category: 'consistency.invalid_seniority_enum',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: `Invalid seniority_level: ${role.seniority_level}`,
        evidence: { seniority_level: role.seniority_level },
        recommended_action: 'Correct to allowed enum',
      })
    }
    if (acad && !CAREER_LIBRARY_ACADEMIC_REQUIREMENTS.includes(acad as never)) {
      addFinding({
        severity: 'high',
        category: 'consistency.invalid_academic_enum',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: `Invalid academic_requirement: ${acad}`,
        evidence: { academic_requirement: acad },
        recommended_action: 'Correct to allowed enum',
      })
    }
    if (reg && !CAREER_LIBRARY_REGISTRATION_REQUIREMENTS.includes(reg as never)) {
      addFinding({
        severity: 'high',
        category: 'consistency.invalid_registration_enum',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: `Invalid professional_registration_requirement: ${reg}`,
        evidence: { professional_registration_requirement: reg },
        recommended_action: 'Correct to allowed enum',
      })
    }

    // Registration / regulation
    if (reg === 'required' && !sp.professional_body && !role.eligibility_note) {
      addFinding({
        severity: 'high',
        category: 'registration.required_without_regulator_or_note',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Registration required but no professional_body and empty eligibility_note',
        evidence: { registration: reg, professional_body: sp.professional_body },
        recommended_action: 'Add regulator/body and eligibility pathway note',
      })
    }

    if (
      role.is_regulated_or_restricted &&
      reg === 'none' &&
      !role.eligibility_note
    ) {
      addFinding({
        severity: 'medium',
        category: 'registration.regulated_flag_without_requirement',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'is_regulated_or_restricted=true but registration=none and no eligibility note',
        evidence: {
          is_regulated_or_restricted: true,
          registration: reg,
          metadata_security: role.metadata?.security_clearance,
        },
        recommended_action: 'Clarify restriction basis (licence, clearance, nationality) in notes',
      })
    }

    if (
      ['healthcare-medicine', 'law-legal-justice', 'education-teaching'].includes(field.slug) &&
      reg === 'required' &&
      fit === 'immediate' &&
      ENTRY_TITLE.test(title) === false &&
      years < 1
    ) {
      addFinding({
        severity: 'critical',
        category: 'registration.regulated_immediate_without_pathway_clarity',
        field: field.slug,
        specialism: sp.slug,
        role_id: role.id,
        role_title: title,
        stage: st?.stage_key ?? '',
        description: 'Regulated field role marked immediate with registration required and little experience — verify pathway',
        evidence: { registration: reg, fit, years, eligibility_note: role.eligibility_note },
        recommended_action: 'Ensure eligibility notes describe legal/professional pathway; adjust fit if needed',
      })
    }
  }

  // ---------- 8. CROSS-FIELD BOUNDARIES (heuristic) ----------
  const boundaryRules: Array<{
    fieldSlug: string
    pattern: RegExp
    wrongIfIn: string[]
    category: string
  }> = [
    {
      fieldSlug: 'it-technology',
      pattern: /\b(software engineer|devops|frontend|backend|full[- ]stack|cybersecurity analyst)\b/i,
      wrongIfIn: ['engineering', 'business-management', 'arts-media-creative-industries'],
      category: 'boundary.software_outside_it',
    },
    {
      fieldSlug: 'law-legal-justice',
      pattern: /\b(solicitor|barrister|pupil barrister|trainee solicitor|legal counsel)\b/i,
      wrongIfIn: ['business-management', 'government-public-policy-international-development', 'humanities-social-sciences'],
      category: 'boundary.legal_practice_outside_law',
    },
    {
      fieldSlug: 'accounting-finance-banking',
      pattern: /\b(chartered accountant|acca|cima|audit senior|financial controller)\b/i,
      wrongIfIn: ['business-management', 'government-public-policy-international-development'],
      category: 'boundary.accountancy_outside_finance',
    },
    {
      fieldSlug: 'healthcare-medicine',
      pattern: /\b(gp |staff nurse|midwife|physiotherapist|pharmacist|consultant surgeon)\b/i,
      wrongIfIn: ['natural-sciences-research', 'education-teaching', 'business-management'],
      category: 'boundary.clinical_outside_healthcare',
    },
  ]

  for (const role of data.roles) {
    const sp = specById.get(role.specialism_id)
    if (!sp) continue
    const field = fieldById.get(sp.field_id)
    if (!field) continue
    for (const rule of boundaryRules) {
      if (rule.pattern.test(role.name) && rule.wrongIfIn.includes(field.slug)) {
        addFinding({
          severity: 'medium',
          category: rule.category,
          field: field.slug,
          specialism: sp.slug,
          role_id: role.id,
          role_title: role.name,
          stage: role.stage_id ? stageById.get(role.stage_id)?.stage_key ?? '' : '',
          description: `Probable wrong primary field; expected nearer ${rule.fieldSlug}`,
          evidence: {
            classification: 'probable_wrong_field',
            expected_primary: rule.fieldSlug,
            current_field: field.slug,
          },
          recommended_action: 'Manual review; move or cross-link later — do not auto-move',
        })
      }
    }
  }

  // ---------- 9. COVERAGE aggregates already in coverage[] ----------
  for (const c of coverage) {
    if (c.role_count > 0) {
      const maxStage = Math.max(...c.stages.map((s) => s.role_count), 0)
      if (maxStage / c.role_count >= 0.7 && c.stages.length > 2) {
        const dom = c.stages.find((s) => s.role_count === maxStage)
        addFinding({
          severity: 'medium',
          category: 'coverage.stage_dominance',
          field: c.slug,
          specialism: '',
          role_id: '',
          role_title: '',
          stage: dom?.key ?? '',
          description: `Field dominated by one stage (${dom?.key}: ${dom?.role_count}/${c.role_count})`,
          evidence: { stages: c.stages },
          recommended_action: 'Review whether progression stages are under-populated',
        })
      }
    }
    if (c.role_count > 1200) {
      addFinding({
        severity: 'low',
        category: 'coverage.unusually_high_role_count',
        field: c.slug,
        specialism: '',
        role_id: '',
        role_title: '',
        stage: '',
        description: `Unusually high role count (${c.role_count}) — check for artificial inflation`,
        evidence: { role_count: c.role_count, specialism_count: c.specialism_count },
        recommended_action: 'Spot-check for templated duplication',
      })
    }
    for (const slug of c.single_stage_specialisms.slice(0, 15)) {
      addFinding({
        severity: 'medium',
        category: 'coverage.specialism_single_stage_only',
        field: c.slug,
        specialism: slug,
        role_id: '',
        role_title: '',
        stage: '',
        description: 'Specialism roles only occupy a single stage',
        evidence: {},
        recommended_action: 'Add progression roles if appropriate',
      })
    }
  }

  // ---------- 10. CODEBASE / IDEMPOTENCY ----------
  const codeScan = scanCodebaseForEngineeringAcademicSeeds()
  if (codeScan.files_with_degree_masters_phd_stages.length) {
    addFinding({
      severity: 'high',
      category: 'consistency.engineering_legacy_seed_scripts_present',
      field: 'engineering',
      specialism: '',
      role_id: '',
      role_title: '',
      stage: 'degree|masters|phd',
      description: 'Legacy Engineering populate scripts still encode Degree/Master\'s/PhD as stages',
      evidence: {
        files: codeScan.files_with_degree_masters_phd_stages,
        risk: 'Re-running these scripts can reattach academic stage_ids for new inserts',
      },
      recommended_action: 'Rewrite populate scripts to engineering_professional_route before further seeding',
    })
  }
  if (!codeScan.remap_script_present || !codeScan.professional_migration_present) {
    addFinding({
      severity: 'medium',
      category: 'consistency.engineering_remap_assets_missing',
      field: 'engineering',
      specialism: '',
      role_id: '',
      role_title: '',
      stage: '',
      description: 'Expected Engineering professional remap/migration assets missing from codebase',
      evidence: codeScan,
      recommended_action: 'Restore migration and remap script',
    })
  }

  // Summary counts
  const summary = {
    fields: data.fields.length,
    specialisms: data.specialisms.length,
    roles: data.roles.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    high: findings.filter((f) => f.severity === 'high').length,
    medium: findings.filter((f) => f.severity === 'medium').length,
    low: findings.filter((f) => f.severity === 'low').length,
  }

  const expectedPresent = EXPECTED_FIELDS.filter((e) => fieldBySlug.has(e.slug)).length
  const integrationSafe =
    summary.critical === 0 &&
    engineeringClean &&
    engineeringAcademicStageRoles === 0 &&
    expectedPresent === EXPECTED_FIELDS.length

  const report = {
    generated_at: generatedAt,
    scope: 'work_in_my_education',
    read_only: true,
    summary,
    expected_fields: {
      expected: EXPECTED_FIELDS.length,
      present: expectedPresent,
      missing: EXPECTED_FIELDS.filter((e) => !fieldBySlug.has(e.slug)).map((e) => e.slug),
    },
    engineering_refactor: {
      fully_clean: engineeringClean && engineeringAcademicStageRoles === 0,
      academic_stage_roles_remaining: engineeringAcademicStageRoles,
      on_professional_model: coverage.find((c) => c.slug === 'engineering')?.stage_model_keys.includes(
        'engineering_professional_route'
      ),
      legacy_seed_scripts: codeScan.files_with_degree_masters_phd_stages,
      remap_script_present: codeScan.remap_script_present,
      professional_migration_present: codeScan.professional_migration_present,
    },
    coverage,
    duplicate_summary: {
      confirmed: duplicateFindings.filter((d) => d.classification === 'confirmed_duplicate').length,
      probable: duplicateFindings.filter((d) => d.classification === 'probable_duplicate').length,
      legitimate_overlap_samples: duplicateFindings.filter((d) => d.classification === 'legitimate_overlap')
        .length,
      manual_review: duplicateFindings.filter((d) => d.classification === 'manual_review').length,
    },
    low_barrier_operational_hits: lowBarrierInEducationFields,
    integration_readiness: {
      safe_to_proceed: integrationSafe,
      blockers: [
        ...(summary.critical ? [`${summary.critical} critical findings`] : []),
        ...(!engineeringClean || engineeringAcademicStageRoles
          ? ['Engineering academic-stage cleanup incomplete or legacy risks']
          : []),
        ...(expectedPresent < EXPECTED_FIELDS.length ? ['Missing expected career fields'] : []),
        ...(codeScan.files_with_degree_masters_phd_stages.length
          ? ['Legacy Engineering Degree/Master\'s/PhD seed scripts remain in codebase']
          : []),
      ],
      recommended_fix_order: [
        '1. Resolve all critical structure/FK/orphan findings',
        '2. Clear remaining Engineering academic-stage mismatches (if any) and rewrite legacy populate scripts',
        '3. Fix high: senior-immediate fit, manager-zero-experience, registration gaps, confirmed duplicates',
        '4. Address medium: stage coverage gaps, probable duplicates, cross-field boundary reviews',
        '5. Low: naming/terminology polish before publish',
      ],
    },
    findings,
  }

  const outDir = resolve(process.cwd(), 'reports')
  mkdirSync(outDir, { recursive: true })
  const jsonPath = join(outDir, 'career-library-audit.json')
  const mdPath = join(outDir, 'career-library-audit.md')
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')

  const top20 = [...findings]
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 }
      return rank[a.severity] - rank[b.severity]
    })
    .slice(0, 20)

  const md: string[] = []
  md.push('# Career Knowledge Library — Work in My Education Audit')
  md.push('')
  md.push(`Generated: ${generatedAt}`)
  md.push('')
  md.push('**Mode: READ-ONLY — no data was modified.**')
  md.push('')
  md.push('## Summary')
  md.push('')
  md.push(`| Metric | Count |`)
  md.push(`|--------|------:|`)
  md.push(`| Fields | ${summary.fields} |`)
  md.push(`| Specialisms | ${summary.specialisms} |`)
  md.push(`| Roles | ${summary.roles} |`)
  md.push(`| Critical | ${summary.critical} |`)
  md.push(`| High | ${summary.high} |`)
  md.push(`| Medium | ${summary.medium} |`)
  md.push(`| Low | ${summary.low} |`)
  md.push('')
  md.push('## Expected fields')
  md.push('')
  md.push(`Present ${expectedPresent}/${EXPECTED_FIELDS.length}`)
  if (report.expected_fields.missing.length) {
    md.push(`Missing: ${report.expected_fields.missing.join(', ')}`)
  }
  md.push('')
  md.push('## Engineering stage refactor')
  md.push('')
  md.push(`- Fully clean in DB: **${report.engineering_refactor.fully_clean}**`)
  md.push(`- Academic stage roles remaining: ${report.engineering_refactor.academic_stage_roles_remaining}`)
  md.push(`- On professional model: ${report.engineering_refactor.on_professional_model}`)
  md.push(`- Legacy seed scripts still in codebase: ${codeScan.files_with_degree_masters_phd_stages.length}`)
  if (codeScan.files_with_degree_masters_phd_stages.length) {
    md.push('')
    md.push('Legacy files:')
    for (const f of codeScan.files_with_degree_masters_phd_stages) md.push(`- \`${f}\``)
  }
  md.push('')
  md.push('## Field coverage')
  md.push('')
  for (const c of coverage) {
    md.push(`### ${c.name} (\`${c.slug}\`)`)
    md.push(`- Status: ${c.status} / active=${c.active}`)
    md.push(`- Specialisms: ${c.specialism_count} | Roles: ${c.role_count}`)
    md.push(`- Stage model(s): ${c.stage_model_keys.join(', ') || 'none'}`)
    md.push(`- Empty specialisms: ${c.empty_specialisms.length ? c.empty_specialisms.join(', ') : 'none'}`)
    md.push('- Stages:')
    for (const st of c.stages) {
      md.push(`  - ${st.sort_order}. ${st.key} (${st.label}): ${st.role_count}`)
    }
    md.push('')
  }
  md.push('## Top 20 priority findings')
  md.push('')
  top20.forEach((f, i) => {
    md.push(
      `${i + 1}. **[${f.severity}]** \`${f.category}\` — ${f.field}/${f.specialism} — ${f.role_title || '(n/a)'} — ${f.description}`
    )
    if (f.role_id) md.push(`   - role_id: \`${f.role_id}\``)
  })
  md.push('')
  md.push('## Findings by category (counts)')
  md.push('')
  const byCat = new Map<string, number>()
  for (const f of findings) byCat.set(f.category, (byCat.get(f.category) ?? 0) + 1)
  for (const [cat, n] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
    md.push(`- ${cat}: ${n}`)
  }
  md.push('')
  md.push('## Integration readiness')
  md.push('')
  md.push(`Safe to proceed: **${report.integration_readiness.safe_to_proceed}**`)
  md.push('')
  md.push('Blockers:')
  for (const b of report.integration_readiness.blockers.length
    ? report.integration_readiness.blockers
    : ['None flagged as hard blockers by automated rules']) {
    md.push(`- ${b}`)
  }
  md.push('')
  md.push('Recommended fix order:')
  for (const step of report.integration_readiness.recommended_fix_order) md.push(`- ${step}`)
  md.push('')
  md.push('## Full findings')
  md.push('')
  md.push('See `reports/career-library-audit.json` for complete machine-readable findings with evidence IDs.')
  md.push('')
  md.push(`Total findings listed (capped per category at ${MAX_PER_CATEGORY}): ${findings.length}`)

  writeFileSync(mdPath, md.join('\n'), 'utf8')

  console.log('\n=== CAREER LIBRARY AUDIT SUMMARY (READ-ONLY) ===')
  console.log(`Generated: ${generatedAt}`)
  console.log(`Fields: ${summary.fields} | Specialisms: ${summary.specialisms} | Roles: ${summary.roles}`)
  console.log(
    `Findings — critical: ${summary.critical} | high: ${summary.high} | medium: ${summary.medium} | low: ${summary.low}`
  )
  console.log(`Expected fields present: ${expectedPresent}/${EXPECTED_FIELDS.length}`)
  console.log(
    `Engineering refactor clean: ${report.engineering_refactor.fully_clean} (academic-stage roles: ${engineeringAcademicStageRoles})`
  )
  console.log(
    `Legacy Engineering Degree/Master's/PhD seed scripts: ${codeScan.files_with_degree_masters_phd_stages.length}`
  )
  console.log(`Integration safe to proceed (auto rule): ${report.integration_readiness.safe_to_proceed}`)
  console.log('\nTop 20:')
  top20.forEach((f, i) => {
    console.log(
      `  ${i + 1}. [${f.severity}] ${f.category} | ${f.field}/${f.specialism} | ${f.role_title || '-'} | ${f.description}`
    )
  })
  console.log(`\nWrote ${jsonPath}`)
  console.log(`Wrote ${mdPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
