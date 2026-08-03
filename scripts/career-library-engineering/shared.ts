/**
 * Shared helpers for Engineering professional stage model.
 * Model key: engineering_professional_route
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type EngStageKey =
  | 'foundation_engineering_support'
  | 'apprentice_technician'
  | 'graduate_engineer'
  | 'chartered_professional_engineer'
  | 'experienced_engineer'
  | 'engineering_management'
  | 'executive_leadership'
  | 'academic_research'

export const ENG_STAGE_KEYS: EngStageKey[] = [
  'foundation_engineering_support',
  'apprentice_technician',
  'graduate_engineer',
  'chartered_professional_engineer',
  'experienced_engineer',
  'engineering_management',
  'executive_leadership',
  'academic_research',
]

export const FIELD_SLUG = 'engineering'
export const MODEL_KEY = 'engineering_professional_route'
export const LEGACY_MODEL_KEY = 'academic_level'

const STAGES_DEF: Array<{
  stage_key: EngStageKey
  label: string
  description: string
  sort_order: number
}> = [
  {
    stage_key: 'foundation_engineering_support',
    label: 'Foundation / Engineering Support',
    description: 'Technical, CAD, workshop and junior site support.',
    sort_order: 10,
  },
  {
    stage_key: 'apprentice_technician',
    label: 'Apprentice / Technician',
    description: 'Apprentices and technicians across engineering disciplines.',
    sort_order: 20,
  },
  {
    stage_key: 'graduate_engineer',
    label: 'Graduate Engineer',
    description: 'Graduate, junior and newly qualified engineers.',
    sort_order: 30,
  },
  {
    stage_key: 'chartered_professional_engineer',
    label: 'Chartered / Professional Engineer',
    description: 'Practising professional and chartered-track engineers.',
    sort_order: 40,
  },
  {
    stage_key: 'experienced_engineer',
    label: 'Experienced Engineer',
    description: 'Senior, lead, principal and specialist engineers.',
    sort_order: 50,
  },
  {
    stage_key: 'engineering_management',
    label: 'Engineering Management',
    description: 'Engineering and technical managers.',
    sort_order: 60,
  },
  {
    stage_key: 'executive_leadership',
    label: 'Executive Leadership',
    description: 'Heads, directors and chief engineers.',
    sort_order: 70,
  },
  {
    stage_key: 'academic_research',
    label: 'Academic / Research',
    description: 'University teaching and research careers.',
    sort_order: 80,
  },
]

export function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
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

export function createServiceClient(): SupabaseClient {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function ensureEngineeringProfessionalStageModel(
  supabase: SupabaseClient
): Promise<{
  modelId: string
  stageByKey: Map<string, { id: string; stage_key: string; label: string }>
}> {
  let modelId: string
  const { data: existing } = await supabase
    .from('career_library_stage_models')
    .select('id')
    .eq('model_key', MODEL_KEY)
    .maybeSingle()

  if (existing?.id) {
    modelId = existing.id
    await supabase
      .from('career_library_stage_models')
      .update({
        name: 'Engineering professional route',
        description:
          'UK engineering progression by responsibility and experience. Bachelor\'s, Master\'s, PhD and chartership are role attributes — not stage keys.',
        active: true,
        is_system: true,
        sort_order: 40,
      })
      .eq('id', modelId)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_stage_models')
      .insert({
        model_key: MODEL_KEY,
        name: 'Engineering professional route',
        description:
          'UK engineering progression by responsibility and experience. Qualifications are role attributes, not stages.',
        active: true,
        sort_order: 40,
        is_system: true,
      })
      .select('id')
      .single()
    if (error || !created) {
      throw new Error(`Failed to create ${MODEL_KEY}: ${error?.message ?? 'unknown'}`)
    }
    modelId = created.id
  }

  for (const s of STAGES_DEF) {
    const { data: stageRow } = await supabase
      .from('career_library_stages')
      .select('id')
      .eq('stage_model_id', modelId)
      .eq('stage_key', s.stage_key)
      .maybeSingle()

    if (stageRow?.id) {
      await supabase
        .from('career_library_stages')
        .update({
          label: s.label,
          description: s.description,
          sort_order: s.sort_order,
          active: true,
        })
        .eq('id', stageRow.id)
    } else {
      const { error } = await supabase.from('career_library_stages').insert({
        stage_model_id: modelId,
        stage_key: s.stage_key,
        label: s.label,
        description: s.description,
        sort_order: s.sort_order,
        active: true,
      })
      if (error && error.code !== '23505') {
        throw new Error(`Failed to create stage ${s.stage_key}: ${error.message}`)
      }
    }
  }

  const { data: stages, error: stagesErr } = await supabase
    .from('career_library_stages')
    .select('id, stage_key, label, sort_order')
    .eq('stage_model_id', modelId)
    .order('sort_order', { ascending: true })

  if (stagesErr || !stages?.length) {
    throw new Error(`${MODEL_KEY} stages missing: ${stagesErr?.message ?? 'empty'}`)
  }

  const stageByKey = new Map(stages.map((s) => [s.stage_key, s]))
  for (const key of ENG_STAGE_KEYS) {
    if (!stageByKey.has(key)) throw new Error(`Missing stage: ${key}`)
  }
  return { modelId, stageByKey }
}

export type RoleForMap = {
  id: string
  name: string
  slug: string
  seniority_level: string | null
  minimum_experience_years: number | null
  academic_requirement: string | null
  is_academic_role: boolean | null
  is_research_role: boolean | null
  role_category: string | null
  fit_classification: string | null
  eligibility_note: string | null
  metadata: Record<string, unknown> | null
}

/**
 * Map an existing Engineering role onto the professional progression ladder.
 * Qualifications stay as academic_requirement / metadata — never as the stage.
 */
export function mapEngineeringRoleToProfessionalStage(role: RoleForMap): {
  stageKey: EngStageKey
  reason: string
  preferredQualification: string
  requiredQualificationHint: string
} {
  const name = role.name.trim()
  const n = name.toLowerCase()
  const years = role.minimum_experience_years ?? 0
  const seniority = (role.seniority_level ?? '').toLowerCase()
  const category = (role.role_category ?? '').toLowerCase()
  const acad = (role.academic_requirement ?? '').toLowerCase()
  const legacyStage = String(
    role.metadata?.stage_key ?? role.metadata?.academic_level ?? ''
  ).toLowerCase()
  const isAcademic = Boolean(role.is_academic_role) || category === 'academic'
  const isResearch = Boolean(role.is_research_role) || category === 'research'

  const preferredFromLegacy =
    legacyStage === 'phd'
      ? 'phd_typically_for_academic_research'
      : legacyStage === 'masters'
        ? 'masters_may_be_desirable_or_useful'
        : legacyStage === 'degree'
          ? 'bachelors_commonly_expected_for_graduate_routes'
          : acad === 'phd_relevant'
            ? 'phd_typically_for_academic_research'
            : acad === 'masters_relevant'
              ? 'masters_may_be_desirable_or_useful'
              : acad === 'none'
                ? 'degree_not_required'
                : 'relevant_engineering_degree_commonly_expected'

  const requiredHint =
    acad === 'phd_relevant'
      ? 'phd_relevant'
      : acad === 'masters_relevant'
        ? 'masters_relevant'
        : acad === 'accredited_degree_preferred'
          ? 'accredited_degree_preferred'
          : acad === 'none'
            ? 'none'
            : 'degree_relevant'

  // 8. Academic / Research
  if (
    isAcademic ||
    /professor|senior lecturer|lecturer|reader\b|postdoctoral|postdoc|doctoral researcher|phd researcher|research fellow|research associate/i.test(
      n
    ) ||
    (isResearch &&
      (legacyStage === 'phd' ||
        acad === 'phd_relevant' ||
        /research engineer|research scientist/i.test(n)))
  ) {
    return {
      stageKey: 'academic_research',
      reason: 'Academic/research title or PhD-track research role',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 7. Executive Leadership
  if (
    /\b(head of engineering|engineering director|technical director|chief engineer|chief technology officer|\bcto\b|vp engineering|vice president.*engineering|group engineering director)\b/i.test(
      n
    ) ||
    (seniority === 'leadership' && years >= 10) ||
    (category === 'leadership' && years >= 10 && /director|chief|head of/i.test(n))
  ) {
    return {
      stageKey: 'executive_leadership',
      reason: 'Executive / director / chief engineer leadership',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 6. Engineering Management
  if (
    /\b(engineering manager|technical manager|project manager|programme manager|operations engineering manager|department manager|engineering team lead|engineering team leader)\b/i.test(
      n
    ) ||
    (category === 'leadership' && years >= 5 && !/director|chief|head of engineering|cto/i.test(n)) ||
    (seniority === 'principal' && /manager/i.test(n))
  ) {
    return {
      stageKey: 'engineering_management',
      reason: 'People/delivery management responsibility',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 1. Foundation / Engineering Support
  if (
    (acad === 'none' &&
      !/engineer|architect|surveyor/i.test(n) &&
      (seniority === 'entry' || years <= 1)) ||
    /\b(cad assistant|engineering support|workshop support|junior site support|technical assistant|draftsperson|draughtsperson|office assistant)\b/i.test(
      n
    ) ||
    (/assistant/i.test(n) &&
      !/graduate|research associate|teaching assistant|assistant professor|engineer|architect|surveyor/i.test(
        n
      ) &&
      years <= 1 &&
      seniority === 'entry')
  ) {
    return {
      stageKey: 'foundation_engineering_support',
      reason: 'Foundation/support role — degree not the driver',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 2. Apprentice / Technician
  if (
    /\b(apprentice|technician|engtech|laboratory technician|manufacturing technician|electrical technician|mechanical technician|civil technician|engineering technician)\b/i.test(
      n
    ) &&
    !/graduate/i.test(n)
  ) {
    return {
      stageKey: 'apprentice_technician',
      reason: 'Apprentice or technician pathway',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 3. Graduate Engineer
  if (
    /\b(graduate engineer|graduate design|junior engineer|newly qualified|graduate .* engineer|engineering graduate)\b/i.test(
      n
    ) ||
    (/^graduate\b/i.test(n) && /engineer|architect|surveyor/i.test(n)) ||
    (legacyStage === 'degree' &&
      seniority === 'entry' &&
      years <= 0 &&
      (role.fit_classification === 'immediate' || category === 'graduate_entry'))
  ) {
    return {
      stageKey: 'graduate_engineer',
      reason: 'Graduate / junior / newly qualified entry',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 5. Experienced Engineer (senior / lead / principal / specialist)
  if (
    /\b(principal engineer|lead engineer|senior .* engineer|specialist engineer|senior design|senior structural|senior process|consulting engineer|chartered .* senior)\b/i.test(
      n
    ) ||
    seniority === 'senior' ||
    seniority === 'principal' ||
    years >= 5 ||
    (legacyStage === 'masters' && years >= 3) ||
    (legacyStage === 'phd' && !isAcademic && years >= 3)
  ) {
    return {
      stageKey: 'experienced_engineer',
      reason: 'Significant experience / senior-lead-principal practice',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // 4. Chartered / Professional Engineer (default mid-career practice)
  if (
    /\b(chartered|professional engineer|design engineer|project engineer|site engineer|production engineer|process engineer|structural engineer|mechanical engineer|electrical engineer|civil engineer|quantity surveyor|architect)\b/i.test(
      n
    ) ||
    legacyStage === 'degree' ||
    legacyStage === 'masters' ||
    seniority === 'early_career' ||
    seniority === 'mid_level' ||
    years >= 1
  ) {
    return {
      stageKey: 'chartered_professional_engineer',
      reason: 'Professional practice / chartered-track competency',
      preferredQualification: preferredFromLegacy,
      requiredQualificationHint: requiredHint,
    }
  }

  // Fallback
  return {
    stageKey: 'chartered_professional_engineer',
    reason: 'Default professional practice mapping',
    preferredQualification: preferredFromLegacy,
    requiredQualificationHint: requiredHint,
  }
}
