import {
  EDUCATION_CONVERSATION_QUESTIONS,
  resolveEducationConversationQuestion,
} from '../lib/career-engine/conversation/pathQuestions.ts'
import { resolveEducationQuestionFlow } from '../lib/career-engine/education-path/educationDynamicInterview.ts'
import { EDUCATION_SPECIALISATIONS } from '../lib/career-engine/education-path/educationSpecialisations.ts'
import { buildEducationPathResult } from '../lib/career-engine/education-path/decisionEngine.ts'
import { getSeedKnowledge, listSeedFieldIds } from '../lib/career-engine/education-path/knowledge/seed.ts'

const scenarios = [
  { field: 'healthcare', spec: 'registered_nurse', must: /NMC|CBT|OSCE/i },
  { field: 'education', spec: 'primary_education', must: /QTS|DBS/i },
  { field: 'it', spec: 'software_engineering', must: /GitHub|portfolio/i },
  { field: 'construction', spec: 'plumbing', must: /Gas Safe|CSCS|NVQ/i },
  { field: 'law', spec: 'solicitor', must: /SQE|SRA/i },
  { field: 'science', spec: 'laboratory_scientist', must: /IBMS|laboratory/i },
  { field: 'media_communications', spec: 'journalism', must: /NCTJ|journalist/i },
  { field: 'social_care', spec: 'social_worker', must: /Social Work England|DBS/i },
  { field: 'logistics_transport', spec: 'hgv_driver', must: /HGV|CPC/i },
  { field: 'manufacturing', spec: 'production_engineer', must: /production engineer/i },
]

const baseAnswers = {
  qualification_origin: 'outside_uk',
  qualification_level: 'bachelors',
  english_level: 'good',
  open_to_courses: 'yes',
  preferred_location: 'London',
}

// Field coverage
const fieldIds = listSeedFieldIds()
console.log(`Industries: ${fieldIds.length} (${fieldIds.join(', ')})`)
if (fieldIds.length < 17) throw new Error(`Expected 17+ industries, got ${fieldIds.length}`)

let specCount = 0
for (const field of Object.keys(EDUCATION_SPECIALISATIONS)) {
  specCount += EDUCATION_SPECIALISATIONS[field].length
}
console.log(`Specialisations: ${specCount}`)

// Question flow
const ids = EDUCATION_CONVERSATION_QUESTIONS.map((q) => q.id)
if (ids[1] !== 'education_specialisation') throw new Error('Missing specialisation step')

const flowFieldQ = resolveEducationQuestionFlow({})[0]
if (!flowFieldQ?.options?.length || flowFieldQ.options.length < 10) {
  throw new Error('Education field question must show full specialty/pathway list')
}
if (!flowFieldQ.options.find((o) => o.value === 'healthcare')) {
  throw new Error('Education field question missing Healthcare option')
}

const specQ = resolveEducationConversationQuestion(EDUCATION_CONVERSATION_QUESTIONS[1], {
  education_field: 'healthcare',
})
if (!specQ.options.find((o) => o.value === 'registered_nurse')) {
  throw new Error('Healthcare missing Registered Nurse')
}

// Scenario tests
for (const s of scenarios) {
  const answers = {
    ...baseAnswers,
    education_field: s.field,
    education_specialisation: s.spec,
  }
  const result = buildEducationPathResult(answers, getSeedKnowledge(s.field))
  const actions = result.essentialActions.map((a) => a.title).join(' ')
  const insights = result.careerInsights
  const actionTitles = result.essentialActions.map((a) => a.title)
  const enicLike = actionTitles.filter((t) => /enic|qualification recognition|overseas qualification assessment/i.test(t))
  if (enicLike.length > 1) {
    throw new Error(`${s.field}/${s.spec}: duplicate ENIC steps — ${enicLike.join(' | ')}`)
  }

  if (!insights?.fastestEntryRoute) throw new Error(`${s.field}/${s.spec}: missing fastest route`)
  if (result.essentialActions.length < 2) throw new Error(`${s.field}/${s.spec}: too few essential actions`)
  if (!s.must.test(actions + ' ' + (insights.complianceNotes?.join(' ') ?? ''))) {
    throw new Error(`${s.field}/${s.spec}: expected ${s.must} in roadmap`)
  }
  console.log(`OK ${s.field} → ${s.spec} (${result.essentialActions.length} actions, insights ✓)`)
}

console.log(`\nAll ${scenarios.length} scenario checks passed.`)
