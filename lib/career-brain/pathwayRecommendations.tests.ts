/**
 * Deterministic pathway recommendation tests.
 * Run: npx tsx lib/career-brain/pathwayRecommendations.tests.ts
 */

import {
  getCareerRecommendations,
  buildPathwayProfile,
  resolvePathwayId,
} from './pathwayRecommendations'

function workNowTitles(answers: Record<string, unknown>): string[] {
  return getCareerRecommendations(answers).workNow.map((r) => r.title)
}

function allTitles(answers: Record<string, unknown>): string {
  const r = getCareerRecommendations(answers)
  return [...r.workNow, ...r.buildNext, ...r.longTerm].map((x) => x.title).join(' | ')
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function assertIncludes(titles: string[], pattern: RegExp, message: string) {
  const blob = titles.join(' ').toLowerCase()
  assert(pattern.test(blob), `${message} — got: ${titles.join(', ')}`)
}

function assertExcludes(titles: string[], pattern: RegExp, message: string) {
  const blob = titles.join(' ').toLowerCase()
  assert(!pattern.test(blob), `${message} — got: ${titles.join(', ')}`)
}

function runTests() {
  // 1. No experience + no qualifications + physical + no licence => NOT Administrator
  const t1 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'no_formal',
    cb_entry_work_preference: 'physical_practical',
    cb_physical_ability: 'light_physical',
    cb_uk_driving_licence: 'no',
    cb_cert_openness: 'yes',
  }
  const w1 = workNowTitles(t1)
  assert(resolvePathwayId(buildPathwayProfile(t1)) === 'NO_EXPERIENCE_PHYSICAL', 'Test 1 pathId')
  assertIncludes(w1, /warehouse|production|picker|packer|kitchen/i, 'Test 1 physical Work Now')
  assertExcludes(w1, /administrator|recruitment|office assistant/i, 'Test 1 no office Work Now')
  assertExcludes(workNowTitles(t1), /\b(delivery driver|hgv|courier)\b/i, 'Test 1 no driver without licence')
  console.log('✓ Test 1 — no qual + physical + no licence')

  // 2. No experience + no qualifications + customer + fluent English
  const t2 = {
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'no_formal',
    cb_entry_work_preference: 'customer_facing',
    cb_customer_comfort: 'yes',
    cb_english: 'fluent',
    cb_cert_openness: 'yes',
  }
  const w2 = workNowTitles(t2)
  assert(resolvePathwayId(buildPathwayProfile(t2)) === 'NO_EXPERIENCE_CUSTOMER', 'Test 2 pathId')
  assertIncludes(w2, /retail assistant|customer service|reception/i, 'Test 2 customer Work Now')
  console.log('✓ Test 2 — customer-facing + fluent')

  // 3. Bachelor's + Science + wants field
  const t3 = {
    cb_user_goal: 'first_job',
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'science',
    cb_field_alignment: 'yes',
    cb_cert_openness: 'yes',
  }
  const w3 = workNowTitles(t3)
  assert(resolvePathwayId(buildPathwayProfile(t3)) === 'EDUCATION_FIELD_PATH', 'Test 3 pathId')
  assertIncludes(w3, /laboratory|research|science technician/i, 'Test 3 science Work Now')
  console.log('✓ Test 3 — science degree field-aligned')

  // 4. Master's + Media & Communications + wants field
  const t4 = {
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'masters',
    cb_first_job_study_field: 'media_communications',
    cb_field_alignment: 'yes',
    cb_cert_openness: 'yes',
  }
  const w4 = workNowTitles(t4)
  assert(resolvePathwayId(buildPathwayProfile(t4)) === 'EDUCATION_FIELD_PATH', 'Test 4 pathId')
  assertIncludes(w4, /media assistant|junior designer|content assistant|video editing/i, 'Test 4 media Work Now')
  console.log('✓ Test 4 — media masters field-aligned')

  // 5. Experience retail + mostly UK + wants same field
  const t5 = {
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'retail assistant',
    cb_experience_field_intent: 'yes',
    cb_experience_country: 'mostly_uk',
    cb_experience_field_relation: 'study_related',
    cb_cert_openness: 'yes',
  }
  const r5 = getCareerRecommendations(t5)
  assert(resolvePathwayId(buildPathwayProfile(t5)) === 'EXPERIENCE_SAME_FIELD', 'Test 5 pathId')
  assertIncludes(
    r5.workNow.map((x) => x.title),
    /retail supervisor|customer service|team leader/i,
    'Test 5 UK retail progression'
  )
  console.log('✓ Test 5 — UK retail experience same field')

  // 6. Experience outside UK + same field => bridge in sector
  const t6 = {
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'retail assistant',
    cb_experience_field_intent: 'yes',
    cb_experience_country: 'mostly_international',
    cb_cert_openness: 'yes',
  }
  const w6 = workNowTitles(t6)
  assertIncludes(w6, /retail assistant|customer service/i, 'Test 6 UK bridge roles')
  assertExcludes(w6, /retail supervisor|store manager/i, 'Test 6 not senior UK-only titles as Work Now')
  console.log('✓ Test 6 — international retail bridge')

  // 7. No driving licence — no driver Work Now on any physical path
  const t7 = {
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'no_formal',
    cb_entry_work_preference: 'quick_income',
    cb_uk_driving_licence: 'no',
    cb_cert_openness: 'yes',
  }
  assertExcludes(workNowTitles(t7), /\b(delivery driver|hgv|courier|van driver)\b/i, 'Test 7 no driver Work Now')
  console.log('✓ Test 7 — no licence excludes drivers')

  // 8. Education + experience priority BOTH merges tagged roles from each source
  const t8 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_first_job_education_level: 'masters',
    cb_first_job_study_field: 'arts_design',
    cb_field_alignment: 'both',
    cb_work_experience_field: 'retail',
    cb_experience_field_intent: 'yes',
    cb_experience_country: 'mostly_uk',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }
  const r8 = getCareerRecommendations(t8)
  assert(resolvePathwayId(buildPathwayProfile(t8)) === 'EDUCATION_EXPERIENCE_BOTH', 'Test 8 pathId')
  const eduWork = r8.workNow.filter((r) => r.origin === 'education' || /\(education\)/i.test(r.why))
  const expWork = r8.workNow.filter((r) => r.origin === 'experience' || /\(experience\)/i.test(r.why))
  assert(eduWork.length >= 1, 'Test 8 education Work Now present')
  assert(expWork.length >= 1, 'Test 8 experience Work Now present')
  assertIncludes(
    r8.workNow.map((x) => x.title),
    /design|content|media|creative|assistant/i,
    'Test 8 education-aligned Work Now'
  )
  assertIncludes(
    r8.workNow.map((x) => x.title),
    /retail|customer service|supervisor/i,
    'Test 8 experience-aligned Work Now'
  )
  console.log('✓ Test 8 — both paths merge education + experience')

  // 9. Experience priority — law degree + retail experience must not default to legal Work Now
  const t9 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'law',
    cb_work_experience_field: 'retail',
    cb_experience_field_intent: 'yes',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '10_plus',
    cb_career_direction_priority: 'experience_field',
    cb_cert_openness: 'yes',
  }
  const r9 = getCareerRecommendations(t9)
  assert(resolvePathwayId(buildPathwayProfile(t9)) === 'EXPERIENCE_SAME_FIELD', 'Test 9 pathId')
  assertExcludes(
    r9.workNow.map((x) => x.title),
    /\b(legal receptionist|paralegal|legal assistant)\b/i,
    'Test 9 experience priority excludes legal Work Now'
  )
  assertIncludes(
    r9.workNow.map((x) => x.title),
    /retail|customer service|supervisor/i,
    'Test 9 experience-aligned Work Now'
  )
  console.log('✓ Test 9 — experience priority over law degree')

  // 10. Both paths — marketing experience + education degree must not jump to animation roles
  const t10 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'marketing',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'education',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }
  const r10 = getCareerRecommendations(t10)
  assert(resolvePathwayId(buildPathwayProfile(t10)) === 'EDUCATION_EXPERIENCE_BOTH', 'Test 10 pathId')
  assertExcludes(
    r10.workNow.map((x) => x.title),
    /\b(animator|motion designer|motion graphics)\b/i,
    'Test 10 both-path excludes unrelated creative Work Now'
  )
  assertIncludes(
    r10.workNow.map((x) => x.title),
    /marketing|teaching|learning support|admin/i,
    'Test 10 blended Work Now connects marketing + education'
  )
  console.log('✓ Test 10 — both paths blend marketing + education coherently')

  // 11. Law education + hospitality experience + both equally
  const t11 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'hospitality',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'law',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }
  const r11 = getCareerRecommendations(t11)
  assert(resolvePathwayId(buildPathwayProfile(t11)) === 'EDUCATION_EXPERIENCE_BOTH', 'Test 11 pathId')
  const w11 = r11.workNow.map((x) => x.title).join(' ').toLowerCase()
  assert(/hospitality|hotel|kitchen|barista|receptionist/.test(w11), `Test 11 hospitality Work Now: ${w11}`)
  assert(/legal|admin assistant/.test(w11), `Test 11 law Work Now: ${w11}`)
  assertExcludes(
    r11.workNow.map((x) => x.title),
    /\bparalegal\b/i,
    'Test 11 Work Now must not jump to paralegal'
  )
  console.log('✓ Test 11 — law + hospitality both equally balanced')

  // 12. Marketing experience + engineering education + both — Long-Term must span both fields
  const t12 = {
    cb_user_goal: 'unemployed',
    cb_experience_level: 'have_experience',
    cb_work_experience_field: 'marketing',
    cb_experience_country: 'mostly_uk',
    cb_experience_years: '3_5',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'engineering',
    cb_career_direction_priority: 'both',
    cb_cert_openness: 'yes',
  }
  const r12 = getCareerRecommendations(t12)
  assert(r12.longTerm.length >= 2, 'Test 12 needs two Long-Term roles')
  const lt12 = r12.longTerm.map((x) => x.title).join(' ').toLowerCase()
  assert(/marketing|coordinator|executive|manager/.test(lt12), `Test 12 marketing Long-Term: ${lt12}`)
  assert(/engineer|engineering|project/.test(lt12), `Test 12 engineering Long-Term: ${lt12}`)
  console.log('✓ Test 12 — marketing + engineering Long-Term balanced')

  // Consistency: same answers => same pathId
  const pathA = resolvePathwayId(buildPathwayProfile(t1))
  const pathB = resolvePathwayId(buildPathwayProfile({ ...t1 }))
  assert(pathA === pathB, 'Test consistency pathId')
  const titlesA = workNowTitles(t1).join(',')
  const titlesB = workNowTitles({ ...t1 }).join(',')
  assert(titlesA === titlesB, 'Test consistency titles')

  console.log('\nAll pathway recommendation tests passed.')
}

runTests()
