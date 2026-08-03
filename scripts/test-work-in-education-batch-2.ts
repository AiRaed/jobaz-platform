/**
 * Batch 2 DB regression scenarios.
 *   npx tsx scripts/test-work-in-education-batch-2.ts
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { matchWorkInEducation } from '../lib/career-engine/work-in-education'

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env')
    process.exit(2)
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n=== Work in My Education Batch 2 DB regressions ===\n')
  const conflicts: Array<Record<string, unknown>> = []

  // A. Broad Law
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'LLB',
        subject: 'Law',
        qualification_country: 'Nigeria',
        years_relevant_experience: 0,
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.ok(r.result.resolution.primary_field?.slug.includes('law'))
      assert.equal(r.result.resolution.needs_clarification, true)
      assert.equal(r.result.resolution.primary_specialism, null)
      assert.ok(r.result.recommendations.immediate.length === 0)
      assert.equal(r.result.qualification_recognition.review_needed, true)
      console.log(
        `  ✓ A broad Law clarify (field=${r.result.resolution.primary_field?.slug}, ${r.result.meta.elapsed_ms}ms)`
      )
    }
  }

  // B. Commercial Law
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'LLB Commercial Law',
        subject: 'Law',
        specialisation: 'Commercial Law',
        qualification_country: 'Nigeria',
        years_relevant_experience: 1,
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      const slug = r.result.resolution.primary_specialism?.slug ?? ''
      const name = r.result.resolution.primary_specialism?.name ?? ''
      assert.equal(r.result.resolution.needs_clarification, false)
      assert.ok(
        /commercial/i.test(slug + name),
        `Expected commercial law specialism, got ${name} (${slug}) conf=${r.result.resolution.confidence}`
      )
      assert.equal(r.result.qualification_recognition.review_needed, true)
      console.log(`  ✓ B Commercial Law resolved (${slug})`)
    }
  }

  // C. Adult Nursing + NMC adult
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'BSc Adult Nursing',
        subject: 'Nursing',
        qualification_country: 'United Kingdom',
        years_relevant_experience: 1,
        professional_registration: [
          { body: 'NMC', status: 'registered', registration_scope: 'adult_nursing' },
        ],
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      for (const role of r.result.recommendations.immediate) {
        assert.ok(
          !/mental health|children'?s|paediatric|midwif|nursing associate/i.test(role.role_title),
          `Immediate should not include branch mismatch: ${role.role_title}`
        )
      }
      const blockedTitles = [
        ...r.result.recommendations.blocked_or_needs_review,
        ...r.result.recommendations.future_progression,
      ].map((x) => x.role_title)
      console.log(
        `  ✓ C Adult Nursing scope (immediate=${r.result.recommendations.immediate.length}, blocked_or_review=${r.result.recommendations.blocked_or_needs_review.length})`
      )
      void blockedTitles
    }
  }

  // E. Generic nursing unknown scope
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'BSc Nursing',
        subject: 'Nursing',
        qualification_country: 'United Kingdom',
        years_relevant_experience: 0,
        professional_registration: [
          { body: 'NMC', status: 'registered', registration_scope: 'unknown' },
        ],
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      for (const role of r.result.recommendations.immediate) {
        assert.ok(
          !/mental health staff nurse|children|midwif/i.test(role.role_title),
          `No branch-specific immediate with unknown scope: ${role.role_title}`
        )
      }
      console.log('  ✓ E unknown NMC scope safety')
    }
  }

  // F. Civil graduate
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'BEng Civil Engineering',
        subject: 'Civil Engineering',
        qualification_country: 'United Kingdom',
        years_relevant_experience: 0,
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.ok(r.result.resolution.primary_specialism?.slug.includes('civil'))
      for (const role of r.result.recommendations.immediate) {
        assert.ok(
          !/\b(senior|director|chartered|ceng)\b/i.test(role.role_title),
          `No senior/chartered immediate: ${role.role_title}`
        )
      }
      for (const role of [
        ...r.result.recommendations.immediate,
        ...r.result.recommendations.realistic_next,
      ]) {
        if (
          role.stage.key === 'chartered_professional_engineer' &&
          /\bchartered\b|\bceng\b/i.test(role.role_title)
        ) {
          assert.fail(`Chartered title should not be immediate/realistic: ${role.role_title}`)
        }
        if (
          role.stage.key === 'chartered_professional_engineer' &&
          role.effective_fit === 'realistic_next' &&
          !/\b(graduate|assistant|trainee|technician)/i.test(role.role_title)
        ) {
          conflicts.push({
            role_id: role.role_id,
            field: role.field.slug,
            specialism: role.specialism.slug,
            title: role.role_title,
            stored_stage: role.stage.key,
            stored_fit: role.stored_fit,
            detected_conflict: 'chartered_stage_with_low_experience_still_realistic',
            suggested_later_data_fix:
              'Review stage assignment or raise minimum_experience / registration requirement',
          })
        }
      }
      console.log(
        `  ✓ F Civil graduate (immediate=${r.result.recommendations.immediate.length}, qa=${JSON.stringify(r.result.qa_summary)})`
      )
    }
  }

  // H. Overseas medicine
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'MBBS',
        subject: 'Medicine',
        qualification_country: 'India',
        years_relevant_experience: 0,
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.equal(r.result.recommendations.immediate.every(() => false) || r.result.recommendations.immediate.length === 0 || r.result.qa_summary.regulated_role_safety !== 'FAIL', true)
      assert.ok(r.result.qa_summary.regulated_role_safety === 'PASS')
      console.log('  ✓ H Overseas medicine safety preserved')
    }
  }

  // I. Animation
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'master',
        qualification_title: 'MSc Computer Animation',
        subject: 'Animation',
        specialisation: '3D Animation',
        qualification_country: 'United Kingdom',
        years_relevant_experience: 4,
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.ok(r.result.resolution.primary_field)
      console.log(
        `  ✓ I Animation (field=${r.result.resolution.primary_field?.slug}, spec=${r.result.resolution.primary_specialism?.slug})`
      )
    }
  }

  // J. PhD Biology
  {
    const r = await matchWorkInEducation(
      supabase,
      {
        education_level: 'doctorate',
        qualification_title: 'PhD Biology',
        subject: 'Biology',
        qualification_country: 'United Kingdom',
        years_relevant_experience: 2,
        career_preferences: { wants_academic_route: true },
      },
      { includeDrafts: true }
    )
    assert.equal(r.ok, true)
    if (r.ok) {
      assert.ok(
        r.result.recommendations.academic_or_research.length > 0 ||
          r.result.resolution.primary_specialism
      )
      console.log(
        `  ✓ J PhD Biology (academic_or_research=${r.result.recommendations.academic_or_research.length})`
      )
    }
  }

  // Determinism
  {
    const a = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'LLB',
        subject: 'Law',
        qualification_country: 'United Kingdom',
      },
      { includeDrafts: true }
    )
    const b = await matchWorkInEducation(
      supabase,
      {
        education_level: 'bachelor',
        qualification_title: 'LLB',
        subject: 'Law',
        qualification_country: 'United Kingdom',
      },
      { includeDrafts: true }
    )
    assert.equal(a.ok && b.ok, true)
    if (a.ok && b.ok) {
      assert.equal(a.result.resolution.needs_clarification, b.result.resolution.needs_clarification)
      assert.equal(a.result.resolution.confidence, b.result.resolution.confidence)
      console.log('  ✓ Deterministic repeated Law clarification')
    }
  }

  // Scan conflicts: engineering roles on chartered stage with min years <= 1
  {
    const { data: engField } = await supabase
      .from('career_library_fields')
      .select('id')
      .eq('slug', 'engineering')
      .single()
    if (engField) {
      const { data: specs } = await supabase
        .from('career_library_specialisms')
        .select('id, name, slug')
        .eq('field_id', engField.id)
      const { data: model } = await supabase
        .from('career_library_stage_models')
        .select('id')
        .eq('model_key', 'engineering_professional_route')
        .single()
      const { data: chartered } = await supabase
        .from('career_library_stages')
        .select('id')
        .eq('stage_model_id', model!.id)
        .eq('stage_key', 'chartered_professional_engineer')
        .maybeSingle()
      if (chartered) {
        for (const sp of specs ?? []) {
          const { data: roles } = await supabase
            .from('career_library_roles')
            .select(
              'id, name, minimum_experience_years, fit_classification, professional_registration_requirement, is_regulated_or_restricted'
            )
            .eq('specialism_id', sp.id)
            .eq('stage_id', chartered.id)
            .eq('active', true)
            .lte('minimum_experience_years', 1)
            .limit(40)
          for (const role of roles ?? []) {
            if (/\b(graduate|assistant|trainee|technician)/i.test(role.name)) {
              conflicts.push({
                role_id: role.id,
                field: 'engineering',
                specialism: sp.slug,
                title: role.name,
                stored_stage: 'chartered_professional_engineer',
                stored_fit: role.fit_classification,
                detected_conflict: 'entryish_title_on_chartered_stage',
                suggested_later_data_fix:
                  'Remap to graduate_engineer or apprentice_technician stage',
              })
            } else if (!/\bchartered\b|\bceng\b|\bieng\b/i.test(role.name)) {
              conflicts.push({
                role_id: role.id,
                field: 'engineering',
                specialism: sp.slug,
                title: role.name,
                stored_stage: 'chartered_professional_engineer',
                stored_fit: role.fit_classification,
                detected_conflict: 'general_title_on_chartered_stage_low_min_experience',
                suggested_later_data_fix:
                  'Review stage vs title; raise min experience or move to experienced_engineer',
              })
            }
          }
        }
      }
    }
  }

  const reportsDir = resolve(process.cwd(), 'reports')
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true })
  const conflictPath = resolve(reportsDir, 'work-in-education-quality-gate-conflicts.json')
  writeFileSync(
    conflictPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        count: conflicts.length,
        conflicts: conflicts.slice(0, 200),
      },
      null,
      2
    ),
    'utf8'
  )
  console.log(`\nWrote ${conflictPath} (${conflicts.length} conflicts)\n`)
  console.log('All Batch 2 DB regressions passed.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
