/**
 * Ollama-only client for JAZ Career Engine.
 * Uses generateWithOllama + format:json directly (no OpenAI).
 */

import {
  generateWithOllama,
  getOllamaBaseUrl,
  isOllamaAvailable,
  resolveOllamaModelName,
} from '@/lib/jobaz-ai/providers/ollama'
import {
  buildJazCareerBrainSystemPrompt,
  buildJazCareerBrainUserPrompt,
} from './careerBrainPrompt'
import { classifyOllamaError, resolveJazOllamaTimeoutMs } from './ollamaErrors'
import type { JazAnalyseInput, JazBrainReasoning } from './types'
import { JAZ_CAREER_ANALYSE_FEATURE } from './types'

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence?.[1]?.trim() ?? trimmed
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object in Ollama response')
  }
  return JSON.parse(candidate.slice(start, end + 1))
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v.trim() : fallback
}

function asNumber(v: unknown, fallback = 50): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(100, Math.round(n)))
}

function normalizeBrain(raw: Record<string, unknown>): JazBrainReasoning {
  const workNow = Array.isArray(raw.work_now_roles) ? raw.work_now_roles : []
  const courses = Array.isArray(raw.recommended_course_types) ? raw.recommended_course_types : []
  const actions = Array.isArray(raw.first_action_plan) ? raw.first_action_plan : []

  return {
    route_title: asString(raw.route_title, 'UK work route'),
    route_category: asString(raw.route_category, 'general').toLowerCase(),
    user_goal: asString(raw.user_goal, 'Find practical UK work options'),
    why_this_route_fits: asString(raw.why_this_route_fits, 'Based on your answers and skills.'),
    current_focus: asString(raw.current_focus, 'Entry role'),
    next_upgrade: asString(raw.next_upgrade, 'Relevant short course'),
    readiness: asNumber(raw.readiness, 55),
    work_now_roles: workNow.slice(0, 3).map((r) => {
      if (typeof r === 'string') {
        return {
          title: r.trim() || 'Entry role',
          why: 'Realistic UK entry option.',
          pay_range: 'Varies by employer',
          job_search_terms: [r.trim() || 'jobs UK'],
        }
      }
      const row = (r && typeof r === 'object' ? r : {}) as Record<string, unknown>
      const terms = Array.isArray(row.job_search_terms)
        ? row.job_search_terms.map((t) => String(t)).filter(Boolean)
        : []
      return {
        title: asString(row.title, 'Entry role'),
        why: asString(row.why, 'Realistic UK entry option.'),
        pay_range: asString(row.pay_range, 'Varies by employer'),
        job_search_terms: terms.length ? terms : [asString(row.title, 'jobs UK')],
      }
    }),
    recommended_course_types: courses.slice(0, 5).map((c) => {
      if (typeof c === 'string') {
        return {
          title: c.trim() || 'Skills course',
          priority: 'secondary' as const,
          reason: 'Supports your next step.',
          related_roles: [] as string[],
          related_skills: [] as string[],
          pathway_stage: 'upgrade' as const,
        }
      }
      const row = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>
      const priorityRaw = asString(row.priority, 'secondary').toLowerCase()
      const priority =
        priorityRaw === 'primary' || priorityRaw === 'optional' ? priorityRaw : 'secondary'
      const stageRaw = asString(row.pathway_stage, 'upgrade').toLowerCase()
      const pathway_stage = (
        ['start', 'upgrade', 'licence', 'optional', 'growth'].includes(stageRaw)
          ? stageRaw
          : 'upgrade'
      ) as JazBrainReasoning['recommended_course_types'][0]['pathway_stage']
      return {
        title: asString(row.title, 'Skills course'),
        priority,
        reason: asString(row.reason, 'Supports your next step.'),
        related_roles: Array.isArray(row.related_roles)
          ? row.related_roles.map((x) => String(x)).filter(Boolean)
          : [],
        related_skills: Array.isArray(row.related_skills)
          ? row.related_skills.map((x) => String(x)).filter(Boolean)
          : [],
        pathway_stage,
      }
    }),
    cv_focus: asString(raw.cv_focus, 'reliability, right to work, and transferable skills'),
    first_action_plan: actions.slice(0, 5).map((a) => {
      const row = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>
      const typeRaw = asString(row.action_type, 'research').toLowerCase()
      const action_type = (
        ['job_search', 'course', 'cv', 'profile', 'research'].includes(typeRaw)
          ? typeRaw
          : 'research'
      ) as JazBrainReasoning['first_action_plan'][0]['action_type']
      return {
        step: asString(row.step, 'Take one practical next step'),
        why: asString(row.why, 'Keeps momentum.'),
        action_type,
      }
    }),
    confidence:
      typeof raw.confidence === 'number'
        ? Math.max(0, Math.min(1, raw.confidence))
        : asNumber(raw.confidence, 60) / 100,
  }
}

export type OllamaCareerResult =
  | {
      ok: true
      reasoning: JazBrainReasoning
      latency_ms: number
      model: string
    }
  | {
      ok: false
      error: string
      error_kind: string
      error_detail: string
      latency_ms: number
      model: string
      base_url: string
    }

export async function runOllamaCareerBrain(
  input: JazAnalyseInput
): Promise<OllamaCareerResult> {
  const started = Date.now()
  const baseUrl = getOllamaBaseUrl()
  const model = resolveOllamaModelName('local')
  const timeoutMs = resolveJazOllamaTimeoutMs()

  if (!baseUrl) {
    return {
      ok: false,
      error: 'Ollama not configured',
      error_kind: 'not_configured',
      error_detail: 'OLLAMA_BASE_URL missing',
      latency_ms: Date.now() - started,
      model,
      base_url: baseUrl,
    }
  }

  const available = await isOllamaAvailable(model).catch(() => false)
  if (!available) {
    return {
      ok: false,
      error: `Ollama unavailable or model "${model}" not found`,
      error_kind: 'model_missing',
      error_detail: `Check ${baseUrl}/api/tags and: ollama pull ${model}`,
      latency_ms: Date.now() - started,
      model,
      base_url: baseUrl,
    }
  }

  const system = buildJazCareerBrainSystemPrompt()
  const user = buildJazCareerBrainUserPrompt({
    goal: String(input.goal || 'unknown'),
    skills: input.skills ?? [],
    education: input.education ?? '',
    experience: input.experience ?? '',
    availability: input.availability ?? '',
    language_level: input.language_level ?? '',
    has_driving_licence: input.has_driving_licence ?? null,
    work_mode_preference: String(input.work_mode_preference || 'unknown'),
    answers: input.answers ?? {},
    preferences: input.preferences ?? {},
  })

  const prompt = `System:\n${system}\n\nUser:\n${user}\n\nAssistant:`

  try {
    const result = await generateWithOllama({
      prompt,
      model,
      temperature: 0.2,
      maxTokens: 550,
      timeoutMs,
      feature: JAZ_CAREER_ANALYSE_FEATURE,
      format: 'json',
    })

    let parsed: unknown
    try {
      parsed = extractJsonObject(result.text)
    } catch (parseErr) {
      const classified = classifyOllamaError(parseErr)
      return {
        ok: false,
        error: classified.message,
        error_kind: 'invalid_json',
        error_detail: `${classified.detail} | raw_preview=${result.text.slice(0, 180)}`,
        latency_ms: Date.now() - started,
        model: result.model || model,
        base_url: baseUrl,
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        ok: false,
        error: 'Invalid Ollama JSON',
        error_kind: 'invalid_json',
        error_detail: 'Parsed value was not an object',
        latency_ms: Date.now() - started,
        model: result.model || model,
        base_url: baseUrl,
      }
    }

    return {
      ok: true,
      reasoning: normalizeBrain(parsed as Record<string, unknown>),
      latency_ms: Date.now() - started,
      model: result.model || model,
    }
  } catch (err) {
    const classified = classifyOllamaError(err)
    return {
      ok: false,
      error: classified.message,
      error_kind: classified.kind,
      error_detail: classified.detail,
      latency_ms: Date.now() - started,
      model,
      base_url: baseUrl,
    }
  }
}
