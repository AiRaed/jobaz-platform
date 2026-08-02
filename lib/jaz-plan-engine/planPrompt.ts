/**
 * Optional Ollama prompt for Plan Engine (Phase 3 path).
 * Phase 1–2 default to fallback; Ollama only when explicitly enabled and fast.
 */

export function buildJazPlanSystemPrompt(): string {
  return `You are JAZ Plan Engine for JobAZ. Return ONE JSON object only.
Improve a practical UK career action plan. Max 5 this_week_actions.
Never invent providers, referral URLs, or guaranteed jobs/pay.
Apply Now only if a real referral_url is provided in input.
Keys: this_week_actions[{id,title,description,category,priority,cta_label,cta_target,why_it_matters,estimated_time}], next_best_action, blocked_by[].
Categories: cv|jobs|course|profile|research|follow_up. Priorities: required|recommended|optional.`
}

export function buildJazPlanUserPrompt(input: Record<string, unknown>): string {
  return `Improve this UK action plan JSON (short strings):\n${JSON.stringify(input).slice(0, 2500)}`
}

/** Feature flag — Ollama plan improvement off by default for public launch. */
export function isJazPlanOllamaEnabled(): boolean {
  const raw = (process.env.JAZ_PLAN_OLLAMA_ENABLED || '').trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}
