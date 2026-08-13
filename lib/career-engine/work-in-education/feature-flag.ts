/**
 * Feature flag: Career Knowledge Engine — Work in My Education v1
 *
 * Env: CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1
 * Optional client-readable twin: NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1
 *
 * Resolution:
 * - Explicit true  → knowledge engine ON
 * - Explicit false → knowledge engine OFF (legacy only)
 * - Unset in development (NODE_ENV=development) → ON (local Batch 5 testing)
 * - Unset in production → OFF
 *
 * Admin override (when env is not explicitly false):
 * - cookie jobaz_wie_v1=1 or ?wie_v1=1 for authenticated admins
 *
 * Rollback: set CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1=false
 * Force legacy even when ON: ?legacy=1
 */

export const WIE_KNOWLEDGE_ENGINE_FLAG = 'CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1'
export const WIE_KNOWLEDGE_ENGINE_FLAG_PUBLIC =
  'NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1'

export const WIE_ADMIN_OVERRIDE_QUERY = 'wie_v1'
export const WIE_ADMIN_OVERRIDE_COOKIE = 'jobaz_wie_v1'

function parseBool(raw: string | undefined | null): boolean | null {
  if (raw == null) return null
  const v = raw.trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true
  if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false
  return null
}

function readEnvFlagRaw(): string | undefined {
  return (
    process.env[WIE_KNOWLEDGE_ENGINE_FLAG] ??
    process.env[WIE_KNOWLEDGE_ENGINE_FLAG_PUBLIC]
  )
}

/** True when env explicitly disables the knowledge engine. */
export function isWieKnowledgeEngineExplicitlyDisabled(): boolean {
  return parseBool(readEnvFlagRaw()) === false
}

/**
 * Server-side env evaluation.
 * Development defaults ON when unset; production defaults OFF when unset.
 */
export function isWieKnowledgeEngineEnvEnabled(): boolean {
  const parsed = parseBool(readEnvFlagRaw())
  if (parsed === true) return true
  if (parsed === false) return false
  return process.env.NODE_ENV === 'development'
}

export type WieFlagContext = {
  /** Authenticated admin user */
  isAdmin?: boolean
  /** searchParams.wie_v1 */
  queryOverride?: string | null
  /** cookie jobaz_wie_v1 */
  cookieOverride?: string | null
}

/**
 * Resolve whether the knowledge-engine WIE journey is active.
 * Never enable from query alone for public (non-admin) users.
 */
export function resolveWieKnowledgeEngineEnabled(ctx: WieFlagContext = {}): boolean {
  if (isWieKnowledgeEngineEnvEnabled()) return true
  if (isWieKnowledgeEngineExplicitlyDisabled()) return false
  if (!ctx.isAdmin) return false
  const q = parseBool(ctx.queryOverride)
  if (q === true) return true
  const c = parseBool(ctx.cookieOverride)
  if (c === true) return true
  return false
}

/** Safe client-facing status (no secrets). */
export function wieFlagPublicStatus(enabled: boolean): {
  pathway: 'work_in_my_education'
  knowledge_engine_v1: boolean
  source: 'legacy' | 'knowledge_engine'
} {
  return {
    pathway: 'work_in_my_education',
    knowledge_engine_v1: enabled,
    source: enabled ? 'knowledge_engine' : 'legacy',
  }
}
