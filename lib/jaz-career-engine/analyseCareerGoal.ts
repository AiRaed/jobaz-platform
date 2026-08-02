/**
 * JAZ Career Engine — main analyse pipeline.
 * Ollama (or fallback) → safety → inventory match → commercial rank → safety.
 */

import { loadJazCourseInventory } from './courseInventoryAdapter'
import {
  assertNoFakeApplyNow,
  rankRelevantCourses,
  resolveCommercialPresentation,
} from './commercialMatcher'
import { matchCourseTypesToInventory, toMatchedJobazCourse } from './courseMatcher'
import { buildFallbackBrainReasoning } from './fallbackPlan'
import { logJazCareerAnalyse, logJazCareerFailure } from './logging'
import {
  recordOllamaFailure,
  recordOllamaSuccess,
} from './logging/memoryStore'
import { runOllamaCareerBrain } from './ollamaCareerClient'
import { applySafetyToReasoning, finalizeSafetyOnResult } from './safetyRules'
import type { JazAnalyseInput, JazAnalyseResult } from './types'
import { JAZ_ENGINE_VERSION } from './types'

function normalizeInput(raw: JazAnalyseInput): JazAnalyseInput {
  return {
    goal: (raw.goal as JazAnalyseInput['goal']) || 'unknown',
    answers: raw.answers && typeof raw.answers === 'object' ? raw.answers : {},
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    education: String(raw.education ?? ''),
    experience: String(raw.experience ?? ''),
    availability: String(raw.availability ?? ''),
    preferences: raw.preferences && typeof raw.preferences === 'object' ? raw.preferences : {},
    language_level: String(raw.language_level ?? ''),
    has_driving_licence:
      typeof raw.has_driving_licence === 'boolean' ? raw.has_driving_licence : null,
    work_mode_preference: String(raw.work_mode_preference || 'unknown'),
    session_id: raw.session_id,
    user_id: raw.user_id ?? null,
  }
}

export async function analyseCareerGoal(
  rawInput: JazAnalyseInput,
  opts?: { goalPath?: string }
): Promise<JazAnalyseResult> {
  const started = Date.now()
  const input = normalizeInput(rawInput)
  const goalPath = opts?.goalPath || String(input.goal || 'unknown')
  const safetyNotes: string[] = []

  try {
    const ollama = await runOllamaCareerBrain(input)
    let aiProvider: 'ollama' | 'fallback' = 'fallback'
    let reasoning = buildFallbackBrainReasoning(input)
    let matchedFrom: 'ollama' | 'fallback_templates' = 'fallback_templates'
    let ollamaError: string | undefined
    let ollamaErrorKind: string | undefined
    let ollamaErrorDetail: string | undefined
    let ollamaLatencyMs: number | undefined
    let ollamaModel: string | undefined

    if (ollama.ok) {
      aiProvider = 'ollama'
      reasoning = ollama.reasoning
      matchedFrom = 'ollama'
      ollamaLatencyMs = ollama.latency_ms
      ollamaModel = ollama.model
      recordOllamaSuccess({ latencyMs: ollama.latency_ms, model: ollama.model })
    } else {
      ollamaError = ollama.error
      ollamaErrorKind = ollama.error_kind
      ollamaErrorDetail = ollama.error_detail
      ollamaLatencyMs = ollama.latency_ms
      ollamaModel = ollama.model
      recordOllamaFailure({
        error: ollama.error,
        kind: ollama.error_kind,
        detail: ollama.error_detail,
        model: ollama.model,
      })
      safetyNotes.push(
        `Ollama unavailable — using safe rules fallback [${ollama.error_kind}]: ${ollama.error}.`
      )
    }

    const safe = applySafetyToReasoning(reasoning)
    reasoning = safe.reasoning
    safetyNotes.push(...safe.notes)

    let inventory: Awaited<ReturnType<typeof loadJazCourseInventory>> = []
    try {
      inventory = await loadJazCourseInventory()
    } catch (err) {
      safetyNotes.push(
        `Course inventory load failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    const { matched, missing } = matchCourseTypesToInventory(reasoning, inventory, {
      minScore: 40,
      maxMatches: 6,
    })

    const ranked = rankRelevantCourses(
      matched.map((m) => ({ course: m.course, score: m.score }))
    ).slice(0, 3)

    const matchedCourses = assertNoFakeApplyNow(
      ranked.map((r) => {
        const pair = matched.find((m) => m.course.course_id === r.course.course_id)!
        const commercial = resolveCommercialPresentation(r.course)
        return toMatchedJobazCourse(r.course, pair.type, commercial)
      })
    )

    const result: JazAnalyseResult = {
      engine_version: JAZ_ENGINE_VERSION,
      ai_provider: aiProvider,
      route_title: reasoning.route_title,
      route_category: reasoning.route_category,
      user_goal: reasoning.user_goal,
      why_this_route_fits: reasoning.why_this_route_fits,
      current_focus: reasoning.current_focus,
      next_upgrade: reasoning.next_upgrade,
      readiness: reasoning.readiness,
      work_now_roles: reasoning.work_now_roles,
      recommended_course_types: reasoning.recommended_course_types.slice(0, 5),
      matched_jobaz_courses: matchedCourses,
      missing_affiliate_opportunities: missing,
      cv_focus: reasoning.cv_focus,
      first_action_plan: reasoning.first_action_plan,
      safety_notes: safetyNotes,
      debug: {
        ollama_error: ollamaError,
        ollama_error_kind: ollamaErrorKind,
        ollama_error_detail: ollamaErrorDetail,
        ollama_latency_ms: ollamaLatencyMs,
        ollama_model: ollamaModel,
        route_id: reasoning.route_category,
        matched_from: matchedFrom,
        fallback_reason:
          aiProvider === 'fallback'
            ? `${ollamaErrorKind || 'unknown'}: ${ollamaError || 'Ollama failed'}`
            : undefined,
      },
    }

    const finalized = finalizeSafetyOnResult(result)

    void logJazCareerAnalyse({
      goalPath,
      input,
      result: finalized,
      durationMs: Date.now() - started,
    })

    return finalized
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    void logJazCareerFailure({
      goalPath,
      input,
      error: message,
      durationMs: Date.now() - started,
    })
    throw err
  }
}
