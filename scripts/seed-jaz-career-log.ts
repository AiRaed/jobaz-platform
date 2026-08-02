/**
 * Seed one test jaz_career_engine_logs row via service role.
 * Run after applying the migration:
 *   npx tsx scripts/seed-jaz-career-log.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const id = randomUUID()
  const row = {
    id,
    created_at: new Date().toISOString(),
    user_id: null,
    anonymous_id: 'script-seed',
    session_id: null,
    goal_path: 'side_job',
    route_title: 'Teaching / Tutoring extra income (script seed)',
    route_category: 'teaching',
    current_focus: 'Online Tutor',
    next_upgrade: 'TEFL / Teaching English Online',
    plan_source: 'jaz_fallback',
    ai_provider: 'fallback',
    engine_version: 'jaz-career-engine-v1',
    readiness: 60,
    recommended_course_types: [
      { title: 'TEFL / Teaching English Online', priority: 'primary' },
    ],
    matched_jobaz_courses: [],
    missing_affiliate_opportunities: [
      {
        course_type: 'TEFL / Teaching English Online',
        reason: 'Script seed — no matched affiliate',
        suggested_category: 'teaching',
        priority: 'high',
      },
    ],
    safety_warnings: ['Seeded via scripts/seed-jaz-career-log.ts'],
    request_payload: { seed: true },
    response_payload: { seed: true },
    response_time_ms: 42,
    error_message: null,
  }

  const { error } = await supabase.from('jaz_career_engine_logs').insert(row)
  if (error) {
    console.error('Insert failed:', error.message)
    console.error(
      '\nIf the table is missing, run this SQL in Supabase SQL Editor:\n  supabase/migrations/20250801120000_jaz_career_engine_logs.sql\n'
    )
    process.exit(1)
  }

  console.log('✓ Seeded jaz_career_engine_logs row:', id)
  console.log('Open /admin/jaz-career-engine and refresh.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
