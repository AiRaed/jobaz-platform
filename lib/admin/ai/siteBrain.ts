import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { DEFAULT_SITE_BRAIN, type SiteBrainRules } from './types'

export type SiteBrainEditable = Omit<
  SiteBrainRules,
  'id' | 'version' | 'createdAt' | 'updatedAt' | 'isActive'
>

function pickText(row: Record<string, unknown>, snake: string, fallback = ''): string {
  const v = row[snake]
  if (v == null) return fallback
  return String(v)
}

/** Fill blank fields from defaults so old rows / missing columns still show useful memory. */
export function mergeSiteBrainDefaults(
  partial: Partial<SiteBrainRules> & { version?: number; isActive?: boolean }
): SiteBrainRules {
  const d = DEFAULT_SITE_BRAIN
  const orDefault = (value: string | undefined, def: string) =>
    value != null && String(value).trim() ? String(value) : def

  return {
    id: partial.id,
    version: partial.version ?? d.version,
    mission: orDefault(partial.mission, d.mission),
    userValueProposition: orDefault(partial.userValueProposition, d.userValueProposition),
    businessModel: orDefault(partial.businessModel, d.businessModel),
    coreUserJourney: orDefault(partial.coreUserJourney, d.coreUserJourney),
    founderAdminContext: orDefault(partial.founderAdminContext, d.founderAdminContext),
    currentLaunchStage: orDefault(partial.currentLaunchStage, d.currentLaunchStage),
    recommendationRules: orDefault(partial.recommendationRules, d.recommendationRules),
    courseStrategy: orDefault(partial.courseStrategy, d.courseStrategy),
    affiliateRules: orDefault(partial.affiliateRules, d.affiliateRules),
    successMetrics: orDefault(partial.successMetrics, d.successMetrics),
    knownRisks: orDefault(partial.knownRisks, d.knownRisks),
    toneOfVoice: orDefault(partial.toneOfVoice, d.toneOfVoice),
    mustNotDo: orDefault(partial.mustNotDo, d.mustNotDo),
    adminPriorities: orDefault(partial.adminPriorities, d.adminPriorities),
    isActive: partial.isActive ?? d.isActive,
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt,
  }
}

function rowToBrain(row: Record<string, unknown>): SiteBrainRules {
  return mergeSiteBrainDefaults({
    id: String(row.id || ''),
    version: Number(row.version || 1),
    mission: pickText(row, 'mission'),
    userValueProposition: pickText(row, 'user_value_proposition'),
    businessModel: pickText(row, 'business_model'),
    coreUserJourney: pickText(row, 'core_user_journey'),
    founderAdminContext: pickText(row, 'founder_admin_context'),
    currentLaunchStage: pickText(row, 'current_launch_stage'),
    recommendationRules: pickText(row, 'recommendation_rules'),
    courseStrategy: pickText(row, 'course_strategy'),
    affiliateRules: pickText(row, 'affiliate_rules'),
    successMetrics: pickText(row, 'success_metrics'),
    knownRisks: pickText(row, 'known_risks'),
    toneOfVoice: pickText(row, 'tone_of_voice'),
    mustNotDo: pickText(row, 'must_not_do'),
    adminPriorities: pickText(row, 'admin_priorities'),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  })
}

export async function getActiveSiteBrain(): Promise<{
  brain: SiteBrainRules
  source: 'database' | 'defaults'
  history: SiteBrainRules[]
  message?: string
}> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return {
      brain: { ...DEFAULT_SITE_BRAIN },
      source: 'defaults',
      history: [],
      message: 'Using built-in defaults — Supabase service role not configured',
    }
  }

  const { data: active, error } = await supabase
    .from('site_brain_rules')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    return {
      brain: { ...DEFAULT_SITE_BRAIN },
      source: 'defaults',
      history: [],
      message: error.message.includes('does not exist')
        ? 'Run migration 20250717120000_admin_ai_tables.sql — using built-in defaults'
        : error.message,
    }
  }

  const { data: historyRows } = await supabase
    .from('site_brain_rules')
    .select('*')
    .order('version', { ascending: false })
    .limit(10)

  const history = (historyRows || []).map((r) => rowToBrain(r as Record<string, unknown>))

  if (active) {
    return {
      brain: rowToBrain(active as Record<string, unknown>),
      source: 'database',
      history,
      message:
        'Site Brain is saved and active. Admin AI tools load this version for strategic guidance. Career Assistant should only be marked as connected when the code actually loads Site Brain.',
    }
  }

  // Prefer active row; otherwise use latest saved version
  if (history.length > 0) {
    const latest = history[0]
    return {
      brain: latest,
      source: 'database',
      history,
      message:
        'No is_active Site Brain row — using latest saved version. Save Site Brain to mark an active version.',
    }
  }

  return {
    brain: { ...DEFAULT_SITE_BRAIN },
    source: 'defaults',
    history,
    message: 'No active Site Brain row yet — edit and save to create version 1',
  }
}

function buildInsertPayload(
  input: SiteBrainEditable & { isActive?: boolean },
  nextVersion: number,
  includeExtended: boolean
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    version: nextVersion,
    mission: input.mission,
    business_model: input.businessModel,
    recommendation_rules: input.recommendationRules,
    course_strategy: input.courseStrategy,
    affiliate_rules: input.affiliateRules,
    tone_of_voice: input.toneOfVoice,
    must_not_do: input.mustNotDo,
    admin_priorities: input.adminPriorities,
    is_active: input.isActive !== false,
    updated_at: new Date().toISOString(),
  }
  if (includeExtended) {
    base.user_value_proposition = input.userValueProposition
    base.core_user_journey = input.coreUserJourney
    base.founder_admin_context = input.founderAdminContext
    base.current_launch_stage = input.currentLaunchStage
    base.success_metrics = input.successMetrics
    base.known_risks = input.knownRisks
  }
  return base
}

export async function saveSiteBrain(
  input: SiteBrainEditable & { isActive?: boolean }
): Promise<{ ok: true; brain: SiteBrainRules } | { ok: false; error: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const { data: latest, error: latestError } = await supabase
    .from('site_brain_rules')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestError) {
    return {
      ok: false,
      error: latestError.message.includes('does not exist')
        ? 'Table site_brain_rules missing — run migration 20250717120000_admin_ai_tables.sql'
        : latestError.message,
    }
  }

  const nextVersion = Number(latest?.version || 0) + 1

  const { error: deactivateError } = await supabase
    .from('site_brain_rules')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('is_active', true)

  if (deactivateError) {
    return { ok: false, error: deactivateError.message }
  }

  const tryInsert = async (includeExtended: boolean) =>
    supabase
      .from('site_brain_rules')
      .insert(buildInsertPayload(input, nextVersion, includeExtended))
      .select('*')
      .single()

  let { data, error } = await tryInsert(true)

  // Fallback if strategic-memory migration not applied yet
  if (error && /user_value_proposition|core_user_journey|founder_admin|current_launch|success_metrics|known_risks|column/i.test(error.message)) {
    const retry = await tryInsert(false)
    data = retry.data
    error = retry.error
    if (!error && data) {
      return {
        ok: true,
        brain: mergeSiteBrainDefaults({
          ...rowToBrain(data as Record<string, unknown>),
          ...input,
          version: nextVersion,
          isActive: true,
        }),
      }
    }
  }

  if (error) {
    return {
      ok: false,
      error: /column|does not exist/i.test(error.message)
        ? `${error.message} — run migration 20250718120000_site_brain_strategic_memory.sql`
        : error.message,
    }
  }

  return { ok: true, brain: rowToBrain(data as Record<string, unknown>) }
}

export function formatSiteBrainForPrompt(brain: SiteBrainRules): string {
  const b = mergeSiteBrainDefaults(brain)
  return [
    `## Product mission\n${b.mission}`,
    `## User value proposition\n${b.userValueProposition}`,
    `## Business model\n${b.businessModel}`,
    `## Core user journey\n${b.coreUserJourney}`,
    `## Founder / admin context\n${b.founderAdminContext}`,
    `## Current launch stage\n${b.currentLaunchStage}`,
    `## Recommendation rules\n${b.recommendationRules}`,
    `## Course strategy\n${b.courseStrategy}`,
    `## Affiliate strategy\n${b.affiliateRules}`,
    `## Success metrics\n${b.successMetrics}`,
    `## Known risks\n${b.knownRisks}`,
    `## Tone of voice\n${b.toneOfVoice}`,
    `## AI must not do\n${b.mustNotDo}`,
    `## Admin priorities\n${b.adminPriorities}`,
  ].join('\n\n')
}

/** Standard block required in every Admin AI prompt */
export function buildActiveSiteBrainContextBlock(
  brain: SiteBrainRules,
  source: 'database' | 'defaults' = 'database'
): string {
  const formatted = formatSiteBrainForPrompt(brain)
  return `ACTIVE SITE BRAIN CONTEXT:
(version v${brain.version}, source=${source}${brain.updatedAt ? `, updated ${brain.updatedAt}` : ''})

${formatted}

Use this as strategic guidance.
Do not contradict it.
Do not invent metrics, providers, revenue, users, prices or results.
Clearly separate known facts from suggestions.
AI suggests; founder decides.`
}

export type SiteBrainLoadMeta = {
  version: number
  source: 'database' | 'defaults'
  updatedAt: string | null
  isActive: boolean
}

export function toSiteBrainLoadMeta(
  brain: SiteBrainRules,
  source: 'database' | 'defaults'
): SiteBrainLoadMeta {
  return {
    version: brain.version,
    source,
    updatedAt: brain.updatedAt || brain.createdAt || null,
    isActive: Boolean(brain.isActive),
  }
}

/** Dev-only log when Site Brain is loaded for an Admin AI tool */
export function logSiteBrainLoaded(
  toolLabel: string,
  meta: { version: number; source: string }
): void {
  if (process.env.NODE_ENV !== 'development') return
  console.log(
    `[SiteBrain] Loaded active Site Brain v${meta.version} (${meta.source}) for ${toolLabel}`
  )
}
