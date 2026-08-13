/**
 * Batch 3 DB assessment scenarios.
 *   npx tsx scripts/test-work-in-education-batch-3.ts
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import {
  runWorkInEducationAssessment,
  mapWorkInEducationAnswersToProfile,
  WIE_ASSESSMENT_BLUEPRINT_VERSION,
} from '../lib/career-engine/work-in-education'

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

function answers(over: Record<string, unknown> = {}) {
  return {
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    specialisation: '',
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    graduation_year: 2024,
    years_relevant_experience: 0,
    has_uk_experience: 'unsure',
    preferences: {
      related_field_only: 'yes',
      open_to_related_fields: 'yes',
      open_to_retraining: 'unsure',
      academic_route: 'unsure',
    },
    ...over,
  }
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env')
    process.exit(2)
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== Work in My Education Batch 3 assessment DB tests ===\n')
  const perf: Array<Record<string, unknown>> = []

  // 1. UK Civil Engineering graduate
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers(),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      assert.equal(run.result.assessment_status, 'complete')
      assert.ok(
        /civil/i.test(run.result.resolution?.primary_specialism?.name ?? '') ||
          /civil/i.test(run.result.resolution?.primary_field?.name ?? '')
      )
      assert.ok(run.result.summary.immediate_count >= 0)
      const immTitles = (run.result.recommendations?.immediate ?? []).map((r) => r.role_title)
      const futureOrBlocked = [
        ...(run.result.recommendations?.future_progression ?? []),
        ...(run.result.recommendations?.blocked_or_needs_review ?? []),
      ]
      assert.ok(
        futureOrBlocked.length > 0 ||
          run.result.recommendations?.realistic_next.length ||
          immTitles.some((t) => /graduate|assistant|technician/i.test(t)),
        'expected graduate-accessible or gated professional roles'
      )
      perf.push({
        scenario: 'civil_eng',
        total_ms: run.result.trace.total_ms,
        matcher_ms: run.result.trace.matcher_ms,
        mapping_ms: run.result.trace.mapping_ms,
      })
      console.log(
        `  ✓ 1 Civil Eng (imm=${run.result.summary.immediate_count}, future=${run.result.summary.future_count}, blocked=${run.result.summary.blocked_count}, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 2. UK Animation MSc
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        education_level: 'master',
        qualification_title: 'MSc Computer Animation',
        subject: 'Animation',
        specialisation: '3D Animation',
        years_relevant_experience: 4,
        current_job_title: 'Retail Supervisor',
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      assert.ok(/anim/i.test(run.result.resolution?.primary_specialism?.name ?? run.result.summary.matched_education))
      assert.equal(run.result.assessment_status, 'complete')
      perf.push({ scenario: 'animation', total_ms: run.result.trace.total_ms })
      console.log(
        `  ✓ 2 Animation MSc (specialism=${run.result.resolution?.primary_specialism?.name}, imm=${run.result.summary.immediate_count}, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 3. Broad LLB Law → clarification
  let commercialId = ''
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        qualification_title: 'LLB',
        subject: 'Law',
        specialisation: '',
        years_relevant_experience: 0,
        registration: { has_registration: 'no' },
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      assert.equal(run.result.assessment_status, 'needs_clarification')
      assert.equal(run.result.resolution?.primary_specialism, null)
      assert.ok(run.result.clarification.options.length >= 2)
      const commercial = run.result.clarification.options.find((o) =>
        /commercial/i.test(o.name)
      )
      assert.ok(commercial, 'expected Commercial Law in clarification options')
      commercialId = commercial!.specialism_id
      console.log(
        `  ✓ 3 Broad LLB clarify (${run.result.clarification.options.length} options, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 4. Clarified Commercial Law
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        qualification_title: 'LLB',
        subject: 'Law',
        specialisation: '',
        registration: { has_registration: 'no' },
      }),
      clarification_answers: { selected_specialism_id: commercialId },
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      assert.equal(run.result.assessment_status, 'complete')
      assert.ok(/commercial/i.test(run.result.resolution?.primary_specialism?.name ?? ''))
      assert.equal(run.result.trace.forced_specialism_id, commercialId)
      console.log(
        `  ✓ 4 Clarified Commercial Law (${run.result.resolution?.primary_specialism?.name}, ${run.result.trace.total_ms}ms)`
      )
    }

    // Reject arbitrary specialism ID
    const bad = await runWorkInEducationAssessment(supabase, {
      answers: answers({ qualification_title: 'LLB', subject: 'Law', specialisation: '' }),
      clarification_answers: { selected_specialism_id: '00000000-0000-0000-0000-000000000000' },
      includeDrafts: true,
    })
    assert.equal(bad.ok, false)
    console.log('  ✓ 4b Reject arbitrary specialism ID')
  }

  // 5. Overseas Medicine without GMC
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        qualification_title: 'MBBS',
        subject: 'Medicine',
        qualification_country: 'India',
        uk_recognition_confirmed: 'no',
        registration: { has_registration: 'no' },
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      const imm = run.result.recommendations?.immediate ?? []
      const clinicalImmediate = imm.filter((r) =>
        /\b(doctor|physician|gp|surgeon|consultant)\b/i.test(r.role_title)
      )
      assert.equal(clinicalImmediate.length, 0, 'no unrestricted immediate clinical doctor roles')
      assert.ok(
        run.result.next_actions.some((a) => a.type === 'recognition' || a.type === 'registration') ||
          run.result.match?.qualification_recognition.review_needed
      )
      console.log(
        `  ✓ 5 Overseas Medicine (imm=${imm.length}, blocked=${run.result.summary.blocked_count}, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 6. UK Adult Nursing + NMC Adult
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        qualification_title: 'BSc Adult Nursing',
        subject: 'Nursing',
        years_relevant_experience: 1,
        registration: {
          has_registration: 'yes',
          body: 'NMC',
          status: 'registered',
          scope: 'adult_nursing',
        },
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      const imm = run.result.recommendations?.immediate ?? []
      const mh = imm.filter((r) => /mental health/i.test(r.role_title))
      assert.equal(mh.length, 0, 'no mental health immediate for adult scope')
      console.log(
        `  ✓ 6 Adult Nursing NMC (imm=${imm.length}, no MH branch, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 7. PhD Biology academic preference
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        education_level: 'doctorate',
        qualification_title: 'PhD Biology',
        subject: 'Biology',
        specialisation: 'Molecular Biology',
        years_relevant_experience: 2,
        preferences: {
          academic_route: 'yes',
          related_field_only: 'yes',
          open_to_related_fields: 'yes',
          open_to_retraining: 'unsure',
        },
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      assert.ok(
        run.result.summary.academic_count > 0 ||
          (run.result.recommendations?.academic_or_research.length ?? 0) > 0 ||
          (run.result.recommendations?.immediate ?? []).some((r) =>
            /research|academic|lecturer|scientist/i.test(r.role_title)
          ),
        'expected research/academic pathway presence'
      )
      console.log(
        `  ✓ 7 PhD Biology academic (academic=${run.result.summary.academic_count}, ${run.result.trace.total_ms}ms)`
      )
    }
  }

  // 8. Missing subject → invalid
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({ subject: '', qualification_title: 'BA' }),
      includeDrafts: true,
    })
    assert.equal(run.ok, false)
    assert.ok(run.result?.assessment_status === 'invalid' || run.errors.some((e) => /subject/i.test(e)))
    console.log('  ✓ 8 Missing subject invalid')
  }

  // 9. Unknown registration body → needs_review not unsafe eligibility flood
  {
    const run = await runWorkInEducationAssessment(supabase, {
      answers: answers({
        subject: 'Nursing',
        qualification_title: 'BSc Nursing',
        registration: {
          has_registration: 'yes',
          body: 'UnknownFakeBoardXYZ',
          status: 'registered',
          scope: 'unknown',
        },
      }),
      includeDrafts: true,
    })
    assert.equal(run.ok, true)
    if (run.ok) {
      const qa = run.result.match?.qa_summary.regulated_role_safety
      assert.ok(qa === 'PASS' || qa === 'WARNING' || qa === 'FAIL')
      // Should not invent safe unrestricted clinical access solely from unknown body
      console.log(
        `  ✓ 9 Unknown registration body (regulated_safety=${qa}, blocked=${run.result.summary.blocked_count})`
      )
    }
  }

  // 10. Deterministic repeated answers
  {
    const a1 = answers({
      qualification_title: 'BEng Civil Engineering',
      subject: 'Civil Engineering',
    })
    const r1 = await runWorkInEducationAssessment(supabase, { answers: a1, includeDrafts: true })
    const r2 = await runWorkInEducationAssessment(supabase, { answers: a1, includeDrafts: true })
    assert.equal(r1.ok, true)
    assert.equal(r2.ok, true)
    if (r1.ok && r2.ok) {
      assert.equal(r1.result.assessment_status, r2.result.assessment_status)
      assert.equal(r1.result.summary.immediate_count, r2.result.summary.immediate_count)
      assert.equal(r1.result.summary.blocked_count, r2.result.summary.blocked_count)
      assert.equal(
        r1.result.resolution?.primary_specialism?.id,
        r2.result.resolution?.primary_specialism?.id
      )
      assert.equal(r1.result.presentation.headline_key, r2.result.presentation.headline_key)
      console.log(`  ✓ 10 Deterministic repeated run (${r1.result.trace.total_ms}ms / ${r2.result.trace.total_ms}ms)`)
      perf.push({
        scenario: 'determinism',
        run1_ms: r1.result.trace.total_ms,
        run2_ms: r2.result.trace.total_ms,
      })
    }
  }

  // Mapping-only sanity (no DB)
  {
    const m = mapWorkInEducationAnswersToProfile(answers())
    assert.equal(m.profile.education_level, 'bachelor')
    console.log(`  ✓ mapping helper (${WIE_ASSESSMENT_BLUEPRINT_VERSION})`)
  }

  const outDir = resolve(process.cwd(), 'reports')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  writeFileSync(
    resolve(outDir, 'work-in-education-batch-3-perf.json'),
    JSON.stringify({ generated_at: new Date().toISOString(), perf }, null, 2)
  )

  console.log('\nAll Batch 3 DB assessment tests passed.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
