/**
 * JAZ Plan Engine — generate personalized action plan.
 * Fallback-first for public launch. Ollama optional and non-blocking.
 */

import { buildFallbackPlanActions } from './fallbackPlan'
import { applyPlanSafety } from './planSafetyRules'
import { isJazPlanOllamaEnabled } from './planPrompt'
import {
  applySignalStatuses,
  buildProgressSummary,
  recommendNextBestAction,
} from './updatePlanProgress'
import type {
  JazActionPlanResult,
  JazPlanAction,
  JazPlanGenerateInput,
} from './types'
import { JAZ_PLAN_ENGINE_VERSION } from './types'

function splitBuckets(actions: JazPlanAction[]) {
  return {
    today_actions: actions.filter((a) => a.priority === 'required').slice(0, 2),
    this_week_actions: actions.slice(0, 5),
    next_14_days: actions.filter((a) => a.category === 'follow_up' || a.priority === 'optional').slice(0, 3),
    next_30_days: actions.filter((a) => a.category === 'course').slice(0, 2),
    cv_actions: actions.filter((a) => a.category === 'cv'),
    job_actions: actions.filter((a) => a.category === 'jobs'),
    course_actions: actions.filter((a) => a.category === 'course'),
    follow_up_actions: actions.filter((a) => a.category === 'follow_up'),
  }
}

function blockedBy(input: JazPlanGenerateInput, actions: JazPlanAction[]): string[] {
  const out: string[] = []
  const signals = input.signals || {}
  if (!signals.has_base_cv && !signals.cv_saved) out.push('No CV saved yet')
  if ((signals.applied_jobs_count || 0) === 0 && actions.some((a) => a.category === 'jobs')) {
    out.push('No job applications marked yet')
  }
  if (
    (input.missing_affiliate_opportunities?.length || 0) > 0 &&
    !input.matched_jobaz_courses?.some((c) => c.referral_url)
  ) {
    out.push('Recommended course has no active affiliate yet')
  }
  return out.slice(0, 5)
}

/**
 * Generate plan. Always returns a usable fallback plan.
 * Ollama improvement is optional and skipped unless JAZ_PLAN_OLLAMA_ENABLED=true.
 */
export async function generateJazActionPlan(
  input: JazPlanGenerateInput
): Promise<JazActionPlanResult> {
  const safety_notes: string[] = []
  let plan_source: JazActionPlanResult['plan_source'] = 'jaz_plan_fallback'
  let ai_provider: JazActionPlanResult['ai_provider'] = 'fallback'

  let actions = buildFallbackPlanActions(input)
  actions = applySignalStatuses(actions, input.signals)

  // Phase 3 hook: Ollama can refine when explicitly enabled (never blocks launch).
  if (isJazPlanOllamaEnabled()) {
    try {
      const { generateWithOllama, isOllamaAvailable } = await import(
        '@/lib/jobaz-ai/providers/ollama'
      )
      const available = await isOllamaAvailable().catch(() => false)
      if (available) {
        const { buildJazPlanSystemPrompt, buildJazPlanUserPrompt } = await import('./planPrompt')
        const timeoutMs = Math.min(
          Number(process.env.JAZ_PLAN_OLLAMA_TIMEOUT_MS || 20_000),
          30_000
        )
        const prompt = `System:\n${buildJazPlanSystemPrompt()}\n\nUser:\n${buildJazPlanUserPrompt({
          route_title: input.route_title,
          current_focus: input.current_focus,
          next_upgrade: input.next_upgrade,
          actions: actions.map((a) => ({
            id: a.id,
            title: a.title,
            category: a.category,
            priority: a.priority,
            cta_label: a.cta_label,
          })),
          signals: input.signals || {},
        })}\n\nAssistant:`
        const result = await generateWithOllama({
          prompt,
          format: 'json',
          maxTokens: 700,
          temperature: 0.2,
          timeoutMs,
          feature: 'jaz-plan-generate',
        })
        const start = result.text.indexOf('{')
        const end = result.text.lastIndexOf('}')
        if (start >= 0 && end > start) {
          const parsed = JSON.parse(result.text.slice(start, end + 1)) as {
            this_week_actions?: JazPlanAction[]
            next_best_action?: JazPlanAction
          }
          if (Array.isArray(parsed.this_week_actions) && parsed.this_week_actions.length > 0) {
            actions = parsed.this_week_actions.slice(0, 5).map((a, i) => ({
              ...actions[i],
              ...a,
              id: a.id || actions[i]?.id || `jaz-ollama-${i + 1}`,
              status: a.status || actions[i]?.status || 'not_started',
            }))
            plan_source = 'jaz_plan'
            ai_provider = 'ollama'
          }
        }
      } else {
        safety_notes.push('Ollama unavailable for Plan Engine — using jaz_plan_fallback.')
      }
    } catch (err) {
      safety_notes.push(
        `Ollama plan improve skipped: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const buckets = splitBuckets(actions)
  const next_best_action = recommendNextBestAction(actions, input.signals)
  const progress_summary = buildProgressSummary(actions, input.signals)

  const plan: JazActionPlanResult = {
    plan_source,
    ai_provider,
    engine_version: JAZ_PLAN_ENGINE_VERSION,
    career_plan_id: input.career_plan_id || null,
    goal_path: input.goal_path || 'unknown',
    route_title: input.route_title || 'Your career route',
    current_focus: input.current_focus || 'Entry role',
    next_upgrade: input.next_upgrade || 'Relevant training',
    readiness: typeof input.readiness === 'number' ? input.readiness : 55,
    ...buckets,
    this_week_actions: actions.slice(0, 5),
    blocked_by: blockedBy(input, actions),
    next_best_action,
    progress_summary,
    safety_notes,
  }

  return applyPlanSafety(plan)
}
