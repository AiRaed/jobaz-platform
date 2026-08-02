export type CareerPlanDebugTrace = {
  userId?: string | null
  localFound?: boolean
  supabaseFound?: boolean
  lastSave?: {
    ok: boolean
    assessmentId?: string
    error?: string
    table: string
    at: string
    source?: string
  }
  lastLoad?: {
    source: 'supabase' | 'local' | 'journey' | 'none'
    assessmentId?: string
    error?: string
    emptyReason?: string
    at: string
  }
}

export type CareerPlanDebugDisplay = {
  supabaseFound: boolean
  localFound: boolean
  lastSaveLabel: string
  lastLoadLabel: string
}

const STORAGE_KEY = 'jobaz_career_plan_debug_v1'

export function clearCareerPlanDebugTrace(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // best-effort
  }
}

export function readCareerPlanDebugTrace(): CareerPlanDebugTrace | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CareerPlanDebugTrace) : null
  } catch {
    return null
  }
}

function isSupabaseHydratedLoad(
  patch: Partial<CareerPlanDebugTrace> & { lastLoad: CareerPlanDebugTrace['lastLoad'] }
): boolean {
  return patch.supabaseFound === true && patch.lastLoad.source === 'supabase'
}

export function recordCareerPlanSaveDebug(
  patch: Partial<CareerPlanDebugTrace> & { lastSave: CareerPlanDebugTrace['lastSave'] }
): void {
  if (typeof window === 'undefined') return
  try {
    const prev = readCareerPlanDebugTrace() ?? {}
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...prev,
        userId: patch.userId ?? prev.userId,
        lastSave: patch.lastSave,
      } satisfies CareerPlanDebugTrace)
    )
  } catch {
    // best-effort
  }
}

export function recordCareerPlanLoadDebug(
  patch: Partial<CareerPlanDebugTrace> & { lastLoad: CareerPlanDebugTrace['lastLoad'] }
): void {
  if (typeof window === 'undefined') return
  try {
    const prev = readCareerPlanDebugTrace() ?? {}
    const hydrated = isSupabaseHydratedLoad(patch)

    const lastLoad: CareerPlanDebugTrace['lastLoad'] = {
      source: patch.lastLoad.source,
      at: patch.lastLoad.at,
      ...(patch.lastLoad.assessmentId ? { assessmentId: patch.lastLoad.assessmentId } : {}),
    }

    if (!hydrated) {
      if (patch.lastLoad.emptyReason) lastLoad.emptyReason = patch.lastLoad.emptyReason
      if (patch.lastLoad.error) lastLoad.error = patch.lastLoad.error
    }

    const next: CareerPlanDebugTrace = {
      userId: patch.userId ?? prev.userId,
      localFound: patch.localFound ?? prev.localFound,
      supabaseFound: hydrated ? true : patch.supabaseFound ?? prev.supabaseFound,
      lastLoad,
    }

    if (hydrated) {
      if (prev.lastSave?.ok) {
        next.lastSave = prev.lastSave
      } else if (patch.lastLoad.assessmentId) {
        next.lastSave = {
          ok: true,
          assessmentId: patch.lastLoad.assessmentId,
          table: 'ai_career_assessments',
          at: patch.lastLoad.at,
          source: 'supabase_hydrated',
        }
      }
    } else if (prev.lastSave) {
      next.lastSave = prev.lastSave
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // best-effort
  }
}

/** Prefer live dashboard hydration over stale localStorage trace errors. */
export function getCareerPlanDebugDisplay(
  trace: CareerPlanDebugTrace | null,
  live?: {
    planHydrated?: boolean
    assessmentId?: string | null
  }
): CareerPlanDebugDisplay {
  const liveSupabase =
    live?.planHydrated === true && Boolean(live.assessmentId)
  const traceSupabase =
    trace?.supabaseFound === true || trace?.lastLoad?.source === 'supabase'
  const supabaseFound = liveSupabase || traceSupabase

  const assessmentId =
    live?.assessmentId ??
    trace?.lastLoad?.assessmentId ??
    (trace?.lastSave?.ok ? trace.lastSave.assessmentId : undefined)

  const localFound = Boolean(trace?.localFound)

  if (supabaseFound) {
    return {
      supabaseFound: true,
      localFound,
      lastLoadLabel: assessmentId
        ? `supabase (${assessmentId})`
        : 'supabase (hydrated)',
      lastSaveLabel: trace?.lastSave?.ok
        ? `ok (${trace.lastSave.table}) ${trace.lastSave.assessmentId ?? ''}`.trim()
        : assessmentId
          ? `ok (ai_career_assessments) ${assessmentId}`
          : 'ok (supabase row loaded)',
    }
  }

  const lastSave = trace?.lastSave
  const lastLoad = trace?.lastLoad

  return {
    supabaseFound: false,
    localFound,
    lastSaveLabel: lastSave
      ? `${lastSave.ok ? 'ok' : 'failed'} (${lastSave.table}) ${lastSave.error ?? lastSave.assessmentId ?? ''}`.trim()
      : 'none',
    lastLoadLabel: lastLoad
      ? `${lastLoad.source}${lastLoad.emptyReason ? ` — ${lastLoad.emptyReason}` : ''}${lastLoad.error ? ` — ${lastLoad.error}` : ''}`
      : 'none',
  }
}
