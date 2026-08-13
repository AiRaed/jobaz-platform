/**
 * Batch 5 unit tests — feature flag, public contract, tokens, clarification limit.
 *   npx tsx lib/career-engine/work-in-education/__tests__/run-batch-5-unit.ts
 */

import assert from 'node:assert/strict'
import {
  resolveWieKnowledgeEngineEnabled,
  isWieKnowledgeEngineEnvEnabled,
  WIE_KNOWLEDGE_ENGINE_FLAG,
} from '../feature-flag'
import { limitClarificationOptions } from '../clarification-limit'
import { mintWieResultToken, verifyWieResultToken } from '../result-token'
import { buildPublicWieAssessmentResult } from '../public-contract'
import type { WorkInEducationAssessmentResult } from '../assessment/types'
import { __resetWieRateLimitForTests, checkWieAssessmentRateLimit } from '../rate-limit'

console.log('\n=== Batch 5 unit tests ===\n')

// 1. Feature flag defaults and overrides
{
  const prev = process.env[WIE_KNOWLEDGE_ENGINE_FLAG]
  const prevPublic = process.env.NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1
  const prevNode = process.env.NODE_ENV
  delete process.env[WIE_KNOWLEDGE_ENGINE_FLAG]
  delete process.env.NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1

  process.env.NODE_ENV = 'production'
  assert.equal(isWieKnowledgeEngineEnvEnabled(), false, 'production unset → off')
  assert.equal(resolveWieKnowledgeEngineEnabled({}), false)

  process.env.NODE_ENV = 'development'
  assert.equal(isWieKnowledgeEngineEnvEnabled(), true, 'development unset → on')

  process.env[WIE_KNOWLEDGE_ENGINE_FLAG] = 'false'
  assert.equal(isWieKnowledgeEngineEnvEnabled(), false, 'explicit false wins in dev')
  assert.equal(
    resolveWieKnowledgeEngineEnabled({ isAdmin: true, queryOverride: '1' }),
    false,
    'explicit false blocks admin override'
  )

  process.env[WIE_KNOWLEDGE_ENGINE_FLAG] = 'true'
  assert.equal(isWieKnowledgeEngineEnvEnabled(), true)

  delete process.env[WIE_KNOWLEDGE_ENGINE_FLAG]
  process.env.NODE_ENV = 'production'
  assert.equal(
    resolveWieKnowledgeEngineEnabled({ isAdmin: false, queryOverride: '1' }),
    false,
    'public query must not enable'
  )
  assert.equal(
    resolveWieKnowledgeEngineEnabled({ isAdmin: true, queryOverride: '1' }),
    true,
    'admin query override when unset in production'
  )

  if (prev === undefined) delete process.env[WIE_KNOWLEDGE_ENGINE_FLAG]
  else process.env[WIE_KNOWLEDGE_ENGINE_FLAG] = prev
  if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1
  else process.env.NEXT_PUBLIC_CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1 = prevPublic
  if (prevNode === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = prevNode
  console.log('  ✓ feature flag defaults and admin override')
}

// 2. Clarification limiter
{
  const many = Array.from({ length: 20 }, (_, i) => ({
    specialism_id: `id-${i}`,
    name: i === 2 ? 'Commercial Law' : i === 5 ? 'Criminal Law' : `Specialty ${i}`,
    score: 0.5 - i * 0.01,
  }))
  const limited = limitClarificationOptions(many, 8)
  assert.equal(limited.length, 8)
  assert.ok(limited.some((o) => /Commercial/i.test(o.name)))
  console.log('  ✓ clarification options limited to 8')
}

// 3. Result token mint/verify + expiry shape
{
  const stub = {
    status: 'complete' as const,
    pathway: 'work_in_my_education' as const,
    headline: { text: 'Matched', key: 'k' },
    matched_direction: {
      field: 'Engineering',
      specialism: 'Civil Engineering',
      confidence_label: 'high' as const,
    },
    summary_lines: ['ok'],
    recommendations: {
      available_now: [],
      realistic_next: [],
      future_options: [],
      academic_research: [],
      requirements_needed: [],
    },
    role_counts: {
      immediate: 0,
      realistic_next: 0,
      future_progression: 0,
      academic_or_research: 0,
      blocked_or_needs_review: 0,
      candidate_roles_considered: 0,
      include_drafts: true,
    },
    clarification: { required: false, question: '', options: [], include_not_sure: false },
    next_actions: [],
    warnings: [],
  }
  const token = mintWieResultToken(stub)
  assert.ok(token.includes('.'))
  const verified = verifyWieResultToken(token)
  assert.equal(verified.ok, true)
  if (verified.ok) {
    assert.equal(verified.result.matched_direction.specialism, 'Civil Engineering')
    assert.equal(verified.result.result_token, token)
  }
  assert.equal(verifyWieResultToken('not-a-token').ok, false)
  assert.equal(verifyWieResultToken('abc.def').ok, false)
  console.log('  ✓ result token mint/verify')
}

// 4. Public contract strips internals
{
  const assessment = {
    pathway: 'work_in_my_education',
    blueprint_version: 'wie-assessment-v1.0.0',
    assessment_status: 'complete',
    profile: null,
    mapping: null,
    match: {
      recommendations: {
        immediate: [
          {
            role_id: 'secret-uuid',
            role_title: 'Graduate Civil Engineer',
            field: { id: 'f', name: 'Engineering', slug: 'engineering' },
            specialism: { id: 's', name: 'Civil Engineering', slug: 'civil' },
            stage: { id: null, key: null, label: 'Graduate' },
            stored_fit: null,
            effective_fit: 'immediate',
            eligibility: {
              status: 'eligible',
              education_match: true,
              experience_match: true,
              registration_match: true,
              licence_match: true,
              country_recognition_review_needed: false,
              qualification_scope_match: 'unknown',
              registration_scope_match: 'unknown',
            },
            gaps: [],
            match_score: 0.91,
            match_reasons: [],
            warnings: [],
            demotion_reasons: [],
            retrieval_source: 'primary_specialism',
            relation_reason: '',
            scope_gate: 'ok',
            professional_stage_gate: 'not_applicable',
          },
        ],
        realistic_next: [],
        future_progression: [],
        academic_or_research: [],
        blocked_or_needs_review: [],
      },
      resolution: {
        primary_field: { id: 'f', name: 'Engineering', slug: 'e', score: 1, reasons: [] },
        primary_specialism: { id: 's', name: 'Civil Engineering', slug: 'c', score: 1, reasons: [] },
        needs_clarification: false,
        confidence: 0.9,
        clarification_options: [],
        clarification_reason: null,
        alternative_fields: [],
        alternative_specialisms: [],
        score_margin: 0.2,
        is_broad_subject: false,
        match_reasons: [],
      },
      qualification_recognition: { review_needed: false, reason: '', country: '' },
      overall_gaps: [],
      warnings: ['Draft library roles included for integration testing — not for public publish'],
      qa_summary: {
        field_resolution: 'PASS',
        specialism_resolution: 'PASS',
        regulated_role_safety: 'PASS',
        scope_safety: 'PASS',
        seniority_safety: 'PASS',
        professional_stage_safety: 'PASS',
      },
      profile_summary: {
        education_level: 'bachelor',
        qualification_title: 'BEng',
        subject: 'Civil',
        specialisation: null,
        years_relevant_experience: 0,
        qualification_country: 'United Kingdom',
      },
      normalised_profile: {} as never,
      data_provenance: { source: 'career_knowledge_library', role_ids: [], field_ids: [], specialism_ids: [] },
      meta: {
        query_count: 1,
        elapsed_ms: 10,
        candidate_roles_considered: 1,
        include_drafts: false,
        confidence_threshold: 0.4,
        score_margin_threshold: 0.05,
      },
      pathway: 'work_in_my_education',
    },
    resolution: {
      primary_field: { id: 'f', name: 'Engineering', slug: 'e', score: 1, reasons: [] },
      primary_specialism: { id: 's', name: 'Civil Engineering', slug: 'c', score: 1, reasons: [] },
      needs_clarification: false,
      confidence: 0.9,
      clarification_options: [],
      clarification_reason: null,
      alternative_fields: [],
      alternative_specialisms: [],
      score_margin: 0.2,
      is_broad_subject: false,
      match_reasons: [],
    },
    recommendations: null,
    clarification: { required: false, reason: '', options: [] },
    summary: {
      matched_education: 'Civil Engineering',
      primary_direction: 'Civil Engineering',
      immediate_count: 1,
      realistic_next_count: 0,
      future_count: 0,
      academic_count: 0,
      blocked_count: 0,
    },
    presentation: {
      headline_key: 'assessment.headline.matched',
      headline_params: {},
      headline: 'Your qualification most closely matches Civil Engineering.',
      summary_items: [],
      next_action_items: [],
    },
    next_actions: [],
    warnings: ['Draft library roles included for integration testing — not for public publish'],
    validation_errors: [],
    visible_question_keys: [],
    trace: {
      mapping_ms: 1,
      matcher_ms: 2,
      total_ms: 3,
      query_count: 1,
      forced_specialism_id: null,
    },
  } as unknown as WorkInEducationAssessmentResult

  const pub = buildPublicWieAssessmentResult(assessment, 'tok')
  assert.equal(pub.recommendations.available_now[0].title, 'Graduate Civil Engineer')
  assert.equal(pub.recommendations.available_now[0].pathway_id, 'secret-uuid')
  assert.ok(typeof pub.recommendations.available_now[0].match_score === 'number')
  assert.equal(pub.role_counts.immediate, 1)
  assert.ok(!JSON.stringify(pub.warnings).toLowerCase().includes('draft library'))
  assert.equal(pub.matched_direction.confidence_label, 'high')
  console.log('  ✓ public contract filters IDs and draft warnings')
}

// 5. Rate limit
{
  __resetWieRateLimitForTests()
  for (let i = 0; i < 5; i++) {
    assert.equal(checkWieAssessmentRateLimit('test-key', { limit: 5, windowMs: 60_000 }).ok, true)
  }
  assert.equal(checkWieAssessmentRateLimit('test-key', { limit: 5, windowMs: 60_000 }).ok, false)
  console.log('  ✓ rate limit trips after threshold')
}

console.log('\nAll Batch 5 unit tests passed.\n')
