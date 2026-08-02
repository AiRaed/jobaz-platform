/**
 * One-shot analyse test: npx tsx scripts/test-jaz-analyse.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  loadEnvLocal()
  const { analyseCareerGoal } = await import('../lib/jaz-career-engine/analyseCareerGoal')
  const result = await analyseCareerGoal(
    {
      goal: 'extra_income',
      skills: ['English', 'teaching'],
      education: 'Degree',
      experience: 'Tutoring',
      availability: 'Evenings',
      language_level: 'Fluent',
      has_driving_licence: false,
      work_mode_preference: 'remote',
      answers: { side_job_type: 'Teaching / Tutoring' },
      preferences: {},
    },
    { goalPath: 'extra_income' }
  )

  console.log({
    ai_provider: result.ai_provider,
    plan_source: result.ai_provider === 'ollama' ? 'jaz' : 'jaz_fallback',
    route_title: result.route_title,
    current_focus: result.current_focus,
    next_upgrade: result.next_upgrade,
    matched_from: result.debug?.matched_from,
    ollama_error: result.debug?.ollama_error || null,
    ollama_latency_ms: result.debug?.ollama_latency_ms || null,
    courses: result.recommended_course_types.map((c) => c.title),
  })
  process.exit(result.ai_provider === 'ollama' ? 0 : 2)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
