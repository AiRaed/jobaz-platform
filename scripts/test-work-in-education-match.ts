/**
 * DB integration fixtures for Work in My Education matching.
 * Requires .env.local with service role.
 *
 *   npx tsx scripts/test-work-in-education-match.ts
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { matchWorkInEducation } from '../lib/career-engine/work-in-education'
import { FIXTURES } from '../lib/career-engine/work-in-education/__tests__/fixtures'

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

function noSeniorImmediate(result: Awaited<ReturnType<typeof matchWorkInEducation>>) {
  if (!result.ok) return
  for (const r of result.result.recommendations.immediate) {
    const title = r.role_title.toLowerCase()
    assert.ok(
      !/\b(senior|director|head of|principal|chief)\b/i.test(title) ||
        result.result.normalised_profile.years_relevant_experience >= 3,
      `Unexpected senior immediate: ${r.role_title}`
    )
  }
}

function noRegulatedUnrestrictedImmediate(
  result: Awaited<ReturnType<typeof matchWorkInEducation>>
) {
  if (!result.ok) return
  for (const r of result.result.recommendations.immediate) {
    assert.ok(
      r.eligibility.registration_match || r.effective_fit !== 'immediate',
      `Regulated/unmatched registration should not be immediate: ${r.role_title}`
    )
    // Double-check blocked/needs_review not in immediate bucket
    assert.notEqual(r.effective_fit, 'needs_review')
    assert.notEqual(r.effective_fit, 'blocked_until_requirement')
  }
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env — skip DB integration')
    process.exit(2)
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== Work in My Education DB integration fixtures ===\n')

  const cases: Array<{
    key: keyof typeof FIXTURES
    assert: (r: Awaited<ReturnType<typeof matchWorkInEducation>>) => void
  }> = [
    {
      key: 'uk_civil_beng_zero_exp',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          r.result.resolution.primary_field?.slug === 'engineering' ||
            (r.result.resolution.primary_specialism?.slug ?? '').includes('civil')
        )
        noSeniorImmediate(r)
        // run twice for determinism
        return
      },
    },
    {
      key: 'uk_animation_msc_unrelated_exp',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        const slug = r.result.resolution.primary_specialism?.slug ?? ''
        const field = r.result.resolution.primary_field?.slug ?? ''
        assert.ok(
          slug.includes('animation') ||
            field.includes('arts') ||
            field.includes('creative') ||
            (r.result.resolution.confidence > 0 && r.result.resolution.needs_clarification)
        )
      },
    },
    {
      key: 'overseas_law_no_reg',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_field?.slug ?? '').includes('law') ||
            r.result.resolution.needs_clarification
        )
        noRegulatedUnrestrictedImmediate(r)
        assert.equal(r.result.qualification_recognition.review_needed, true)
      },
    },
    {
      key: 'overseas_medicine_no_reg',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_field?.slug ?? '').includes('healthcare') ||
            (r.result.resolution.primary_specialism?.slug ?? '').includes('medicine')
        )
        noRegulatedUnrestrictedImmediate(r)
        for (const b of r.result.recommendations.blocked_or_needs_review) {
          assert.ok(
            b.effective_fit === 'needs_review' || b.effective_fit === 'blocked_until_requirement'
          )
        }
      },
    },
    {
      key: 'uk_nursing_nmc',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok((r.result.resolution.primary_specialism?.slug ?? '').includes('nursing'))
      },
    },
    {
      key: 'phd_biology_research',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_specialism?.slug ?? '').includes('biology') ||
            (r.result.resolution.primary_field?.slug ?? '').includes('natural')
        )
      },
    },
    {
      key: 'uk_business_3y',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_field?.slug ?? '').includes('business') ||
            r.result.resolution.confidence > 0.3
        )
        noSeniorImmediate(r)
      },
    },
    {
      key: 'cs_graduate_portfolio',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_field?.slug ?? '').includes('it') ||
            (r.result.resolution.primary_specialism?.slug ?? '').includes('software') ||
            (r.result.resolution.primary_specialism?.slug ?? '').includes('computer')
        )
        noSeniorImmediate(r)
      },
    },
    {
      key: 'tourism_management',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.ok(
          (r.result.resolution.primary_field?.slug ?? '').includes('hospitality') ||
            (r.result.resolution.primary_specialism?.slug ?? '').includes('tourism') ||
            r.result.resolution.needs_clarification
        )
      },
    },
    {
      key: 'ambiguous_missing_subject',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        assert.equal(r.result.resolution.needs_clarification, true)
      },
    },
    {
      key: 'regulated_registration_unknown',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        noRegulatedUnrestrictedImmediate(r)
      },
    },
    {
      key: 'overqualified_inexperienced',
      assert: (r) => {
        assert.equal(r.ok, true)
        if (!r.ok) return
        noSeniorImmediate(r)
      },
    },
  ]

  let failed = 0
  for (const c of cases) {
    const first = await matchWorkInEducation(supabase, FIXTURES[c.key], {
      includeDrafts: true,
    })
    const second = await matchWorkInEducation(supabase, FIXTURES[c.key], {
      includeDrafts: true,
    })
    try {
      c.assert(first)
      // Deterministic repeated output for resolution identity
      if (first.ok && second.ok) {
        assert.equal(first.result.resolution.primary_specialism?.id, second.result.resolution.primary_specialism?.id)
        assert.equal(first.result.resolution.confidence, second.result.resolution.confidence)
      }
      const elapsed = first.ok ? first.result.meta.elapsed_ms : 0
      const queries = first.ok ? first.result.meta.query_count : 0
      console.log(
        `  ✓ ${c.key} (${elapsed}ms, ${queries} queries, conf=${first.ok ? first.result.resolution.confidence : 'n/a'})`
      )
    } catch (err) {
      failed += 1
      console.error(`  ✗ ${c.key}`, err)
    }
  }

  if (failed) {
    console.error(`\n${failed} fixture(s) failed\n`)
    process.exit(1)
  }
  console.log('\nAll DB integration fixtures passed.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
