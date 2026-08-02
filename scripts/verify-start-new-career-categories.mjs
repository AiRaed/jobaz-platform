import { getCareerEnginePath } from '../lib/career-engine/conversation/pathRegistry.ts'
import { resolveStartNewCareerQuestionFlow } from '../lib/career-engine/start-new-career/questions.ts'
import {
  buildStartNewCareerEngineResult,
  buildStartNewCareerResult,
} from '../lib/career-engine/start-new-career/decisionEngine.ts'

const config = getCareerEnginePath('start_new_career')

if (!config.resolveQuestionFlow) {
  throw new Error('start_new_career must have resolveQuestionFlow')
}
if (!config.hasStructuredResult) {
  throw new Error('start_new_career must have structured result')
}

const experiencedFlow = resolveStartNewCareerQuestionFlow({
  starting_situation: 'experienced_known_target',
  current_field: 'hospitality',
})
const experiencedIds = experiencedFlow.map((q) => q.id)
if (experiencedIds[1] !== 'target_field') {
  throw new Error('known target must ask target_field immediately after starting_situation')
}

const noExpKnownFlow = resolveStartNewCareerQuestionFlow({
  starting_situation: 'no_experience_known_target',
})
const noExpKnownIds = noExpKnownFlow.map((q) => q.id)
if (noExpKnownIds[1] !== 'target_field') {
  throw new Error('no_experience_known_target must ask target_field as question 2')
}
if (noExpKnownIds.includes('interest_area')) {
  throw new Error('no_experience_known_target must not ask interest_area')
}
if (noExpKnownIds.includes('current_field')) {
  throw new Error('no_experience_known_target must not ask current_field')
}
if (!experiencedIds.includes('starting_situation')) throw new Error('missing starting_situation')
if (!experiencedIds.includes('current_field')) throw new Error('experienced flow missing current_field')
if (!experiencedIds.includes('target_field')) throw new Error('experienced flow missing target_field')
if (!experiencedIds.includes('english_level')) throw new Error('missing english_level')
if (!experiencedIds.includes('urgency')) throw new Error('missing urgency')
if (experiencedIds.includes('interest_area')) throw new Error('known target should not ask interest_area')
if (experiencedIds.includes('work_environment')) throw new Error('known target should not ask work_environment')

const unknownFlow = resolveStartNewCareerQuestionFlow({
  starting_situation: 'no_experience_unknown_target',
})
const unknownIds = unknownFlow.map((q) => q.id)
if (!unknownIds.includes('interest_area')) throw new Error('unknown target flow missing interest_area')
if (!unknownIds.includes('work_environment')) throw new Error('unknown target flow missing work_environment')
if (unknownIds.includes('current_field')) throw new Error('no experience should skip current_field')
if (unknownIds.includes('target_field')) throw new Error('exploring flow must not ask target_field early')

// Situation A — known target → full roadmap immediately
const result = buildStartNewCareerResult({
  starting_situation: 'experienced_known_target',
  current_field: 'hospitality',
  experience_years: '3_5',
  target_field: 'it_technology',
  education_level: 'gcse_a_levels',
  english_level: 'intermediate',
  uk_work_experience: 'yes',
  urgency: 'balanced',
  study_willing: 'yes',
  preferred_location: 'Manchester',
})

if (result.phase !== 'roadmap') throw new Error('known target must return roadmap phase')
if (!result.triad.workNow.length) throw new Error('expected workNow recommendations')
if (!result.triad.buildNext.length) throw new Error('expected buildNext recommendations')
if (!result.triad.longTerm.length) throw new Error('expected longTerm recommendations')
if (!result.routeTypeLabel) throw new Error('missing route type')

const lowEnglish = buildStartNewCareerResult({
  starting_situation: 'no_experience_known_target',
  target_field: 'office_admin',
  education_level: 'no_formal',
  english_level: 'basic',
  uk_work_experience: 'no',
  urgency: 'immediate',
  study_willing: 'yes',
  preferred_location: 'UK-wide',
})

const workNowTitles = lowEnglish.triad.workNow.map((w) => w.title).join(' ')
if (/Office Administrator/i.test(workNowTitles)) {
  throw new Error('weak profile must NOT get Office Administrator as Work Now')
}

let threwWithoutTarget = false
try {
  buildStartNewCareerResult({
    starting_situation: 'no_experience_known_target',
    education_level: 'gcse_a_levels',
    english_level: 'intermediate',
    uk_work_experience: 'no',
    urgency: 'balanced',
    study_willing: 'yes',
    preferred_location: 'UK-wide',
  })
} catch {
  threwWithoutTarget = true
}
if (!threwWithoutTarget) {
  throw new Error('no_experience_known_target must not build roadmap without target_field')
}

const noExpHospitality = buildStartNewCareerResult({
  starting_situation: 'no_experience_known_target',
  target_field: 'hospitality',
  education_level: 'gcse_a_levels',
  english_level: 'intermediate',
  uk_work_experience: 'no',
  urgency: 'balanced',
  study_willing: 'yes',
  preferred_location: 'UK-wide',
})
if (noExpHospitality.targetField !== 'Hospitality & Front of House') {
  throw new Error(`expected user-selected Hospitality — got ${noExpHospitality.targetField}`)
}

// Situation B — exploring → recommendations only (no invented target)
const exploring = buildStartNewCareerEngineResult({
  starting_situation: 'no_experience_unknown_target',
  interest_area: 'technology,problem_solving,research_analysis',
  work_environment: 'office_desk,quiet_independent',
  education_level: 'bachelors',
  english_level: 'good',
  uk_work_experience: 'no',
  urgency: 'study_first',
  study_willing: 'yes',
  preferred_location: 'UK-wide',
})

if (exploring.phase !== 'recommendations') {
  throw new Error('exploring without confirmed target must return recommendations phase')
}
const firstRec = exploring.recommendations[0]
if (!firstRec.workNow.length) throw new Error('discovery card must include Work Now jobs')
if (!firstRec.careerProgression.length) throw new Error('discovery card must include career ladder')
if (!firstRec.readiness.score) throw new Error('discovery card must include readiness score')
if (!firstRec.scoreReasons.length) throw new Error('discovery card must explain score')
if (!firstRec.timeline.estimatedTransition) throw new Error('discovery card must include timeline')

const studyYesExploring = buildStartNewCareerEngineResult({
  starting_situation: 'experienced_unknown_target',
  current_field: 'hospitality',
  experience_years: '3_5',
  interest_area: 'people,business_management',
  work_environment: 'customer_facing,team_based',
  education_level: 'gcse_a_levels',
  english_level: 'intermediate',
  uk_work_experience: 'yes',
  urgency: 'balanced',
  study_willing: 'yes',
  preferred_location: 'UK-wide',
})
const hospRec = studyYesExploring.recommendations.find((r) => r.sectorId === 'hospitality')
if (hospRec) {
  const hasTraining = hospRec.buildNext.length > 0 || hospRec.courses.length > 0
  if (!hasTraining) throw new Error('study_willing=yes must include Build Next / courses on discovery card')
}

const immediateExploring = buildStartNewCareerEngineResult({
  starting_situation: 'experienced_unknown_target',
  current_field: 'retail_sales',
  experience_years: '1_3',
  interest_area: 'people',
  education_level: 'gcse_a_levels',
  english_level: 'intermediate',
  uk_work_experience: 'no',
  urgency: 'immediate',
  study_willing: 'yes',
  preferred_location: 'UK-wide',
})
const immRec = immediateExploring.recommendations[0]
if (!immRec.workNow.length) throw new Error('immediate income must still show bridge jobs')
if (!immRec.buildNext.length && !immRec.courses.length) {
  throw new Error('immediate income must still recommend courses alongside work')
}

if (!exploring.recommendations.length) throw new Error('expected career recommendations')
const topRec = exploring.recommendations[0]
if (topRec.matchScore < 60 || topRec.matchScore > 95) {
  throw new Error(`match score out of display range: ${topRec.matchScore}`)
}

// User confirms → Stage 3 roadmap
const confirmed = buildStartNewCareerResult({
  ...exploring.answers,
  target_field: 'it_technology',
  target_confirmed: 'yes',
})
if (confirmed.phase !== 'roadmap') throw new Error('confirmed target must return roadmap')
if (confirmed.targetField !== 'IT & Technology') {
  throw new Error(`confirmed IT target expected — got ${confirmed.targetField}`)
}
if (!confirmed.triad.buildNext.length) throw new Error('confirmed roadmap needs build next')

const weakExploring = buildStartNewCareerEngineResult({
  starting_situation: 'no_experience_unknown_target',
  interest_area: 'technology,problem_solving',
  education_level: 'no_formal',
  english_level: 'basic',
  uk_work_experience: 'no',
  urgency: 'immediate',
  study_willing: 'no',
  preferred_location: 'UK-wide',
})
if (weakExploring.phase !== 'recommendations') {
  throw new Error('weak exploring profile should show recommendations not roadmap')
}

const weakConfirmed = buildStartNewCareerResult({
  ...weakExploring.answers,
  target_field: 'it_technology',
  target_confirmed: 'yes',
})
const weakWorkNow = weakConfirmed.triad.workNow.map((w) => w.title).join(' ')
if (/IT Support|Software/i.test(weakWorkNow)) {
  throw new Error('weak profile must not get IT roles as Work Now despite tech interests')
}

console.log('OK three-stage flow: understand → decide → build')
console.log('OK Situation A: known target → roadmap without interest questions')
console.log('OK Situation B: recommendations first, roadmap after user confirms')
console.log(`  top recommendation: ${topRec.label} (${topRec.matchScore}%)`)
console.log(`  confirmed route: ${result.currentField} → ${result.targetField} (${result.routeTypeLabel})`)
