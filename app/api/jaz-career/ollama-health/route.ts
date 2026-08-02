/**
 * GET /api/jaz-career/ollama-health
 * Dev/admin diagnostic: connect + short generate + structured JSON career prompt.
 */

import { NextResponse } from 'next/server'
import {
  generateWithOllama,
  getOllamaBaseUrl,
  isOllamaAvailable,
  resolveOllamaModelName,
} from '@/lib/jobaz-ai/providers/ollama'
import { classifyOllamaError, resolveJazOllamaTimeoutMs } from '@/lib/jaz-career-engine/ollamaErrors'
import { runOllamaCareerBrain } from '@/lib/jaz-career-engine/ollamaCareerClient'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 240

function isDevAllowed(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_OLLAMA_DEBUG === 'true'
}

export async function GET() {
  if (!isDevAllowed()) {
    return NextResponse.json({ ok: false, error: 'Not available in production' }, { status: 403 })
  }

  const started = Date.now()
  const base_url = getOllamaBaseUrl()
  const model = resolveOllamaModelName('local')
  const timeout_ms = resolveJazOllamaTimeoutMs()

  const tagsStarted = Date.now()
  let tags_ok = false
  let tags_ms = 0
  let models: string[] = []
  try {
    const res = await fetch(`${base_url}/api/tags`, { method: 'GET' })
    tags_ms = Date.now() - tagsStarted
    tags_ok = res.ok
    if (res.ok) {
      const payload = (await res.json()) as { models?: Array<{ name: string }> }
      models = (payload.models || []).map((m) => m.name)
    }
  } catch (err) {
    tags_ms = Date.now() - tagsStarted
    const c = classifyOllamaError(err)
    return NextResponse.json({
      ok: false,
      stage: 'connect',
      base_url,
      model,
      timeout_ms,
      tags_ok: false,
      tags_ms,
      error_kind: c.kind,
      error: c.message,
      detail: c.detail,
      total_ms: Date.now() - started,
    })
  }

  const model_available = await isOllamaAvailable(model)
  if (!model_available) {
    return NextResponse.json({
      ok: false,
      stage: 'model',
      base_url,
      model,
      timeout_ms,
      tags_ok,
      tags_ms,
      models,
      error_kind: 'model_missing',
      error: `Model "${model}" not found in Ollama`,
      hint: `Run: ollama pull ${model}`,
      total_ms: Date.now() - started,
    })
  }

  let short_generate: {
    ok: boolean
    ms: number
    text?: string
    error?: string
    error_kind?: string
  } = { ok: false, ms: 0 }

  const shortStarted = Date.now()
  try {
    const direct = await generateWithOllama({
      prompt: 'Reply with exactly: ok',
      model,
      maxTokens: 8,
      temperature: 0,
      timeoutMs: Math.min(timeout_ms, 45_000),
      feature: 'jaz-ollama-health-short',
    })
    short_generate = {
      ok: true,
      ms: Date.now() - shortStarted,
      text: direct.text.slice(0, 80),
    }
  } catch (err) {
    const c = classifyOllamaError(err)
    short_generate = {
      ok: false,
      ms: Date.now() - shortStarted,
      error: c.message,
      error_kind: c.kind,
    }
  }

  const structuredStarted = Date.now()
  const structured = await runOllamaCareerBrain({
    goal: 'extra_income',
    skills: ['English', 'teaching'],
    education: 'Degree',
    experience: 'Some tutoring',
    availability: 'Evenings',
    language_level: 'Fluent',
    has_driving_licence: false,
    work_mode_preference: 'remote',
    answers: {
      side_job_type: 'Teaching / Tutoring',
      hours_available: 'Evenings',
    },
    preferences: {},
  })

  const structured_ms = Date.now() - structuredStarted

  return NextResponse.json({
    ok: short_generate.ok && structured.ok,
    stage: structured.ok ? 'structured_json' : short_generate.ok ? 'structured_json' : 'short_generate',
    base_url,
    model,
    timeout_ms,
    tags_ok,
    tags_ms,
    models,
    model_available,
    short_generate,
    structured_json: structured.ok
      ? {
          ok: true,
          ms: structured_ms,
          latency_ms: structured.latency_ms,
          route_title: structured.reasoning.route_title,
          current_focus: structured.reasoning.current_focus,
          course_types: structured.reasoning.recommended_course_types.map((c) => c.title),
        }
      : {
          ok: false,
          ms: structured_ms,
          error: structured.error,
          error_kind: structured.error_kind,
          detail: structured.error_detail,
        },
    total_ms: Date.now() - started,
    hint:
      structured.ok
        ? 'Ollama is ready for JAZ Career Engine (plan_source should be jaz).'
        : 'If timeout: increase JAZ_OLLAMA_TIMEOUT_MS (e.g. 90000) or warm the model with a short generate first.',
  })
}
