/**
 * CLI: test JAZ Ollama connectivity + structured career JSON.
 * Usage: npx tsx scripts/test-jaz-ollama.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))

async function main() {
  const base = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const model = process.env.OLLAMA_MODEL || 'llama3'
  const timeoutMs = Number(
    process.env.JAZ_OLLAMA_TIMEOUT_MS || process.env.OLLAMA_TIMEOUT_MS || 60_000
  )

  console.log('JAZ Ollama test')
  console.log({ base, model, timeoutMs })

  const tagsStarted = Date.now()
  const tagsRes = await fetch(`${base.replace(/\/$/, '')}/api/tags`)
  console.log('tags', tagsRes.status, `${Date.now() - tagsStarted}ms`)
  if (!tagsRes.ok) {
    console.error('Cannot reach Ollama /api/tags')
    process.exit(1)
  }
  const tags = (await tagsRes.json()) as { models?: Array<{ name: string }> }
  console.log(
    'models',
    (tags.models || []).map((m) => m.name)
  )

  const { runOllamaCareerBrain } = await import('../lib/jaz-career-engine/ollamaCareerClient')
  const started = Date.now()
  const result = await runOllamaCareerBrain({
    goal: 'extra_income',
    skills: ['English', 'teaching'],
    education: 'Degree',
    experience: 'Some tutoring',
    availability: 'Evenings',
    language_level: 'Fluent',
    has_driving_licence: false,
    work_mode_preference: 'remote',
    answers: { side_job_type: 'Teaching / Tutoring' },
    preferences: {},
  })
  console.log('structured', {
    ok: result.ok,
    ms: Date.now() - started,
    ...(result.ok
      ? {
          model: result.model,
          latency_ms: result.latency_ms,
          route_title: result.reasoning.route_title,
          current_focus: result.reasoning.current_focus,
        }
      : {
          error: result.error,
          kind: result.error_kind,
          detail: result.error_detail,
        }),
  })
  process.exit(result.ok ? 0 : 2)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
