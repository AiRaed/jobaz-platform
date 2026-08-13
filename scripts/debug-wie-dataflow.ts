/**
 * Compare admin match vs public assessment role counts for Civil Engineering.
 * Usage: npx tsx scripts/debug-wie-dataflow.ts
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 0) continue
      const k = t.slice(0, i).trim()
      let v = t.slice(i + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (!(k in process.env)) process.env[k] = v
    }
  } catch {
    /* optional */
  }
}
loadEnvLocal()
import { matchWorkInEducation } from '../lib/career-engine/work-in-education/match'
import { runWorkInEducationAssessment } from '../lib/career-engine/work-in-education/assessment/run-assessment'
import { buildPublicWieAssessmentResult } from '../lib/career-engine/work-in-education/public-contract'
import { mapWorkInEducationAnswersToProfile } from '../lib/career-engine/work-in-education/assessment/map-answers-to-profile'

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log('env', {
    url: Boolean(url),
    key: Boolean(key),
    WIE_PUBLIC_INCLUDE_DRAFTS: process.env.WIE_PUBLIC_INCLUDE_DRAFTS ?? '(unset)',
  })
  if (!url || !key) throw new Error('Missing Supabase env')

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: specs, error: specErr } = await supabase
    .from('career_library_specialisms')
    .select('id,name,slug,active,status')
    .ilike('name', '%civil%')
  if (specErr) throw specErr
  console.log('\n=== Civil specialisms ===')
  console.log(JSON.stringify(specs, null, 2))

  for (const s of specs ?? []) {
    const { data: roles, error } = await supabase
      .from('career_library_roles')
      .select('id,name,status,active')
      .eq('specialism_id', s.id)
    if (error) throw error
    const byStatus: Record<string, number> = {}
    for (const r of roles ?? []) {
      const k = `${r.status}|active=${r.active}`
      byStatus[k] = (byStatus[k] || 0) + 1
    }
    console.log(`roles for ${s.name} (${s.id}): total=${roles?.length ?? 0}`, byStatus)
  }

  const adminProfile = {
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    specialisation: null,
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    graduation_year: null,
    years_relevant_experience: 0,
    current_job_title: null,
    has_uk_experience: null,
    professional_registration: [],
    licences: [],
    skills: [],
    english_level: null,
    career_preferences: {},
  }

  const answers = {
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    specialisation: '',
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    years_relevant_experience: 0,
    engineering_registration: 'none',
  }

  const mapped = mapWorkInEducationAnswersToProfile(answers as never)
  console.log('\n=== Mapped profile (wizard answers) ===')
  console.log({
    subject: mapped.profile.subject,
    specialisation: mapped.profile.specialisation,
    education_level: mapped.profile.education_level,
    years: mapped.profile.years_relevant_experience,
  })

  console.log('\n=== Admin match (includeDrafts=true) ===')
  const matchDrafts = await matchWorkInEducation(supabase, adminProfile, { includeDrafts: true })
  if (!matchDrafts.ok) {
    console.log('FAIL', matchDrafts.errors)
  } else {
    const m = matchDrafts.result
    console.log({
      specialism: m.resolution.primary_specialism?.name,
      specialism_id: m.resolution.primary_specialism?.id,
      candidates: m.meta.candidate_roles_considered,
      include_drafts: m.meta.include_drafts,
      immediate: m.recommendations.immediate.length,
      realistic_next: m.recommendations.realistic_next.length,
      future: m.recommendations.future_progression.length,
      academic: m.recommendations.academic_or_research.length,
      blocked: m.recommendations.blocked_or_needs_review.length,
      sample: m.recommendations.immediate.slice(0, 5).map((r) => ({
        title: r.role_title,
        score: r.match_score,
        status: r.evaluation?.eligibilityStatus,
        experience_match: r.eligibility.experience_match,
        registration_match: r.eligibility.registration_match,
        matched: r.evaluation?.matchedReasons.slice(0, 2),
        unmet: r.evaluation?.unmetRequirements.slice(0, 2),
      })),
      future_sample: m.recommendations.future_progression.slice(0, 3).map((r) => ({
        title: r.role_title,
        score: r.match_score,
        status: r.evaluation?.eligibilityStatus,
      })),
    })
  }

  console.log('\n=== Admin match (includeDrafts=false) ===')
  const matchApproved = await matchWorkInEducation(supabase, adminProfile, { includeDrafts: false })
  if (matchApproved.ok) {
    const m = matchApproved.result
    console.log({
      candidates: m.meta.candidate_roles_considered,
      immediate: m.recommendations.immediate.length,
      future: m.recommendations.future_progression.length,
    })
  }

  console.log('\n=== Assessment run (includeDrafts=true) ===')
  const assess = await runWorkInEducationAssessment(supabase, {
    answers: answers as never,
    includeDrafts: true,
  })
  if (!assess.ok) {
    console.log('FAIL', assess.errors)
  } else {
    const a = assess.result
    console.log({
      status: a.assessment_status,
      specialism: a.resolution?.primary_specialism?.name,
      specialism_id: a.resolution?.primary_specialism?.id,
      candidates: a.match?.meta.candidate_roles_considered,
      include_drafts: a.match?.meta.include_drafts,
      immediate: a.summary.immediate_count,
      realistic_next: a.summary.realistic_next_count,
      future: a.summary.future_count,
      academic: a.summary.academic_count,
      blocked: a.summary.blocked_count,
    })

    const pub = buildPublicWieAssessmentResult(a, 'debug-token')
    console.log('\n=== Public contract buckets ===')
    console.log({
      available_now: pub.recommendations.available_now.length,
      realistic_next: pub.recommendations.realistic_next.length,
      future_options: pub.recommendations.future_options.length,
      academic_research: pub.recommendations.academic_research.length,
      requirements_needed: pub.recommendations.requirements_needed.length,
      sample_titles: pub.recommendations.available_now.slice(0, 3).map((r) => r.title),
      sample_pathway_ids: pub.recommendations.available_now.slice(0, 3).map((r) => r.pathway_id),
    })
  }

  console.log('\n=== Assessment run (includeDrafts=false) ===')
  const assessNo = await runWorkInEducationAssessment(supabase, {
    answers: answers as never,
    includeDrafts: false,
  })
  if (assessNo.ok) {
    console.log({
      candidates: assessNo.result.match?.meta.candidate_roles_considered,
      immediate: assessNo.result.summary.immediate_count,
      future: assessNo.result.summary.future_count,
    })
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
