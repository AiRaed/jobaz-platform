/**
 * Global Career Assistant → My Plan role priority guardrail.
 * Shared across WIE / WIP / SNC / Extra Income — never let progression
 * roles become current focus / plan title unless explicitly future-labelled.
 */

import type { PlanPickItem } from './types'

export type RoleRouteTiming = 'start_now' | 'future_progression'

export type RolePrioritySignals = {
  title: string
  start_now?: boolean | null
  match_type?: string | null
  match_label?: string | null
  badge?: string | null
  level?: string | null
  stage_label?: string | null
  professional_level_label?: string | null
  timing_label?: string | null
  reason?: string | null
  description?: string | null
  /** Pathway labels — if title equals these, treat as future unless start_now */
  field?: string | null
  specialism?: string | null
  route_title?: string | null
  /** Pathway bucket hint */
  bucket?:
    | 'available_now'
    | 'realistic_next'
    | 'future_options'
    | 'first_jobs'
    | 'better_roles_later'
    | 'extra_income'
    | null
}

const ENTRY_LEVEL_RE =
  /\b(entry|assistant|helper|trainee|foundation|support\s*worker|junior|beginner|apprentice|steward|operative|care\s*assistant|healthcare\s*assistant|maternity\s*support|accounts?\s*assistant|finance\s*assistant|it\s*support\s*(trainee|assistant)|support\s*trainee)\b/i

const PROGRESSION_TITLE_RE =
  /\b(research\s*fellow|fellow|consultant|specialist|principal|director|head\s+of|head\b|manager|lead\b|senior|chief|professor|lecturer|registrar|consultant|partner)\b/i

const PROGRESSION_BADGE_RE =
  /progression|future\s*route|future\s*career|work\s*toward\s*later|long[- ]?term|after\s+more\s+experience|upgrade\s*later|better\s+roles?\s+later/i

const PROGRESSION_MATCH_RE =
  /progression|future_career|future_option|not_recommended|needs_review_regulated|target_level/i

const EXPERIENCE_GATE_RE =
  /(\d+\+?\s*years?)|(postgraduate\s*research)|(after\s+more\s+experience)|(registration\s+not\s+yet)|(not\s+yet\s+achieved)|(requires?\s+(significant|extensive)\s+experience)/i

const IMMEDIATE_MATCH_RE =
  /best_immediate|immediate_route|practical_start|developing_match|good\s*match|start\s*now|extra\s*income/i

const IMMEDIATE_LEVEL_RE =
  /\b(entry|assistant|helper|trainee|foundation|support|junior|beginner|apprentice)\b/i

export function isProgressionRoleTitle(title: string): boolean {
  const t = title.trim()
  if (!t) return false
  // Entry-framed titles win even if they contain "support"
  if (ENTRY_LEVEL_RE.test(t) && !/\b(senior|manager|director|head|principal|fellow)\b/i.test(t)) {
    return false
  }
  return PROGRESSION_TITLE_RE.test(t)
}

export function classifyRoleRouteTiming(signals: RolePrioritySignals): RoleRouteTiming {
  const title = signals.title || ''
  const titleNorm = title.trim().toLowerCase()
  const pathwayLabels = [signals.specialism, signals.field, signals.route_title]
    .map((s) => String(s || '').trim().toLowerCase())
    .filter(Boolean)
  const matchesPathwayLabel =
    Boolean(titleNorm) &&
    pathwayLabels.includes(titleNorm) &&
    !ENTRY_LEVEL_RE.test(title)

  // Explicit pathway specialism/field titles are progression/context, not start-now jobs
  if (
    matchesPathwayLabel &&
    signals.start_now !== true &&
    signals.match_type !== 'best_immediate_route'
  ) {
    return 'future_progression'
  }

  const blob = [
    signals.match_type,
    signals.match_label,
    signals.badge,
    signals.level,
    signals.stage_label,
    signals.professional_level_label,
    signals.timing_label,
    signals.reason,
    signals.description,
    signals.bucket,
  ]
    .filter(Boolean)
    .join(' ')

  // Explicit start_now flag (WIP)
  if (signals.start_now === true) {
    if (isProgressionRoleTitle(title) && !IMMEDIATE_MATCH_RE.test(blob)) {
      return 'future_progression'
    }
    return 'start_now'
  }
  if (signals.start_now === false) return 'future_progression'

  // Explicit buckets
  if (signals.bucket === 'future_options' || signals.bucket === 'better_roles_later') {
    return 'future_progression'
  }
  if (signals.bucket === 'available_now' || signals.bucket === 'first_jobs') {
    if (isProgressionRoleTitle(title) && PROGRESSION_MATCH_RE.test(blob)) {
      return 'future_progression'
    }
    return 'start_now'
  }

  // Timing / match type
  if (signals.timing_label === 'future_progression') return 'future_progression'
  if (signals.timing_label === 'after_first_step') return 'start_now'

  const match = String(signals.match_type || '').toLowerCase()
  if (PROGRESSION_MATCH_RE.test(match) || match === 'future_career_option') {
    return 'future_progression'
  }
  if (
    match === 'best_immediate_route' ||
    match === 'immediate_route' ||
    match === 'practical_start' ||
    match === 'developing_match'
  ) {
    if (isProgressionRoleTitle(title) && match !== 'best_immediate_route') {
      // developing_match + Research Fellow → still future
      return 'future_progression'
    }
    return 'start_now'
  }

  if (PROGRESSION_BADGE_RE.test(blob) || PROGRESSION_MATCH_RE.test(blob)) {
    return 'future_progression'
  }

  if (EXPERIENCE_GATE_RE.test(blob) || EXPERIENCE_GATE_RE.test(title)) {
    return 'future_progression'
  }

  if (isProgressionRoleTitle(title)) return 'future_progression'

  const levelBlob = [signals.level, signals.stage_label, signals.professional_level_label]
    .filter(Boolean)
    .join(' ')
  if (levelBlob && IMMEDIATE_LEVEL_RE.test(levelBlob) && !PROGRESSION_TITLE_RE.test(levelBlob)) {
    return 'start_now'
  }
  if (/\b(senior|manager|director|head|lead|principal|fellow|consultant|specialist)\b/i.test(levelBlob)) {
    return 'future_progression'
  }

  if (IMMEDIATE_MATCH_RE.test(blob) || ENTRY_LEVEL_RE.test(title)) return 'start_now'

  if (signals.bucket === 'realistic_next') {
    return isProgressionRoleTitle(title) ? 'future_progression' : 'start_now'
  }

  if (signals.bucket === 'extra_income') return 'start_now'

  // Conservative default: unknown senior-ish titles → future; otherwise start_now
  return isProgressionRoleTitle(title) ? 'future_progression' : 'start_now'
}

export function routeTimingBadge(timing: RoleRouteTiming, preferred?: string | null): string {
  if (timing === 'future_progression') {
    if (preferred && PROGRESSION_BADGE_RE.test(preferred)) return preferred
    return 'Progression route'
  }
  if (preferred && /best\s*immediate|start\s*now|practical|good\s*match|extra\s*income/i.test(preferred)) {
    return preferred
  }
  return preferred?.trim() || 'Start now'
}

export function splitRolesByTiming(items: PlanPickItem[]): {
  startNow: PlanPickItem[]
  future: PlanPickItem[]
} {
  const startNow: PlanPickItem[] = []
  const future: PlanPickItem[] = []
  for (const item of items) {
    if (item.group !== 'roles') continue
    const timing =
      item.route_timing ||
      classifyRoleRouteTiming({
        title: item.title,
        badge: item.badge,
        match_type: item.metadata?.match_type,
        match_label: item.badge,
        start_now: item.metadata?.start_now,
        level: item.metadata?.level,
        stage_label: item.metadata?.stage_label,
        timing_label: item.metadata?.timing_label,
        reason: item.reason,
      })
    if (timing === 'future_progression') future.push(item)
    else startNow.push(item)
  }
  return { startNow, future }
}

/** Prefer best-immediate / start_now selected roles for current focus. */
export function pickPrimaryImmediateRole(
  selected: PlanPickItem[],
  catalogRoles?: PlanPickItem[]
): PlanPickItem | null {
  const { startNow: selectedStart } = splitRolesByTiming(selected)
  if (selectedStart.length) {
    const best = selectedStart.find(
      (r) =>
        /best\s*immediate/i.test(r.badge || '') ||
        r.metadata?.match_type === 'best_immediate_route' ||
        r.metadata?.start_now === true
    )
    return best || selectedStart[0]
  }
  if (catalogRoles?.length) {
    const { startNow } = splitRolesByTiming(catalogRoles)
    return startNow[0] || null
  }
  return null
}

/** Ensure progression items are never default-selected. */
export function applyRoleDefaultSelection(roles: PlanPickItem[]): PlanPickItem[] {
  let pickedImmediate = false
  return roles.map((role) => {
    const timing =
      role.route_timing ||
      classifyRoleRouteTiming({
        title: role.title,
        badge: role.badge,
        match_type: role.metadata?.match_type,
        start_now: role.metadata?.start_now,
      })
    if (timing === 'future_progression') {
      return { ...role, route_timing: 'future_progression', default_selected: false }
    }
    const defaultSelected = !pickedImmediate
    if (defaultSelected) pickedImmediate = true
    return {
      ...role,
      route_timing: 'start_now',
      default_selected: defaultSelected,
    }
  })
}
