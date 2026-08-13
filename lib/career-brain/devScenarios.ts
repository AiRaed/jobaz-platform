/**
 * Dev-only scenario checks for Career Brain entry + discovery logic.
 * Run: npx tsx lib/career-brain/devScenarios.ts
 */

import { enrichCareerProfile } from './enrichProfile'
import { buildFallbackRecommendations } from './fallbackRecommendations'
import { buildCareerBrainOutput } from './resultBuilder'
import { buildPersonalizedJourneySummary } from './journeyPersonalization'
import { isTrainingOrLicence, validateCareerProgression, findCrossColumnDuplicates } from './careerProgressionValidation'
import { isFieldFirstMode } from './domains'
import { pickNextDiscoveryQuestion } from './discoveryEngine'
import { pickStructuredEntryQuestion, isStructuredEntryComplete } from './entryClassification'
import { syncLegacySituationAnswer, GOAL_QUESTION } from './userGoal'

function stateWith(answers: Record<string, unknown>, story = '') {
  return {
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      ...answers,
    },
    path_story: story,
  }
}

/** Flow-order tests — no default cert/training answers. */
function flowState(answers: Record<string, unknown>, story = '') {
  return { answers: { ...answers }, path_story: story }
}

function runEntryFlowChecks() {
  const cold = { answers: {} as Record<string, unknown>, path_story: '' }
  const q1 = pickStructuredEntryQuestion(cold)
  if (q1.question?.id !== 'cb_user_goal') {
    throw new Error(`First question must be user goal, got ${q1.question?.id}`)
  }

  const goalOptions = GOAL_QUESTION.options?.map((o) => o.value) ?? []
  if (goalOptions.length !== 6) {
    throw new Error(`Expected 6 strategic pathway options, got ${goalOptions.length}`)
  }
  for (const removed of [
    'work_in_experience',
    'first_job',
    'unemployed',
    'career_change',
    'new_to_uk',
    'have_experience',
    'exploring',
    'urgent_work',
    'small_business',
  ]) {
    if (goalOptions.includes(removed)) {
      throw new Error(`Removed pathway option still on selector: ${removed}`)
    }
  }
  for (const active of [
    'work_in_education',
    'work_in_profession',
    'start_new_career',
    'side_job',
  ]) {
    if (!goalOptions.includes(active)) {
      throw new Error(`Launch pathway missing from selector: ${active}`)
    }
  }
  for (const comingSoon of ['grow_career', 'start_business']) {
    const opt = GOAL_QUESTION.options?.find((o) => o.value === comingSoon)
    if (!opt?.disabled) {
      throw new Error(`Expected ${comingSoon} to be Coming Soon (disabled) on selector`)
    }
  }
  // Coming Soon routes stay at the bottom
  if (goalOptions[goalOptions.length - 2] !== 'grow_career' || goalOptions[goalOptions.length - 1] !== 'start_business') {
    throw new Error('Coming Soon routes must be at the bottom of the goal selector')
  }

  const afterStartNewCareer = { answers: { cb_user_goal: 'start_new_career' }, path_story: '' }
  const qStartNew = pickStructuredEntryQuestion(afterStartNewCareer)
  if (qStartNew.question?.id !== 'cb_change_current_field') {
    throw new Error(`Start new career route should ask current field first, got ${qStartNew.question?.id}`)
  }

  const afterUnemployed = { answers: { cb_user_goal: 'unemployed' }, path_story: '' }
  const qUnemployed = pickStructuredEntryQuestion(afterUnemployed)
  if (qUnemployed.question?.id !== 'cb_experience_level') {
    throw new Error(`Unemployed route should ask work experience first, got ${qUnemployed.question?.id}`)
  }

  const afterUnemployedNoExp = {
    answers: { cb_user_goal: 'unemployed', cb_experience_level: 'no_experience' },
    path_story: '',
  }
  const qUnemployedEdu = pickStructuredEntryQuestion(afterUnemployedNoExp)
  if (qUnemployedEdu.question?.id !== 'cb_first_job_education_level') {
    throw new Error(`Unemployed route should ask education after experience, got ${qUnemployedEdu.question?.id}`)
  }

  const afterUnemployedNoExpEdu = {
    answers: {
      cb_user_goal: 'unemployed',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'education',
    },
    path_story: '',
  }
  const qUnemployedNoExpPriority = pickStructuredEntryQuestion(afterUnemployedNoExpEdu)
  if (qUnemployedNoExpPriority.question?.id !== 'cb_career_direction_priority') {
    throw new Error(
      `Unemployed no-experience should ask priority after education, got ${qUnemployedNoExpPriority.question?.id}`
    )
  }

  const afterUnemployedHaveExp = {
    answers: { cb_user_goal: 'unemployed', cb_experience_level: 'have_experience' },
    path_story: '',
  }
  const qUnemployedExpField = pickStructuredEntryQuestion(afterUnemployedHaveExp)
  if (qUnemployedExpField.question?.id !== 'cb_work_experience_field') {
    throw new Error(
      `Unemployed with experience should ask work field first, got ${qUnemployedExpField.question?.id}`
    )
  }

  const afterUnemployedExpBlock = {
    answers: {
      cb_user_goal: 'unemployed',
      cb_experience_level: 'have_experience',
      cb_work_experience_field: 'retail',
      cb_experience_country: 'mostly_uk',
      cb_experience_years: '5_10',
    },
    path_story: '',
  }
  const qUnemployedExpEdu = pickStructuredEntryQuestion(afterUnemployedExpBlock)
  if (qUnemployedExpEdu.question?.id !== 'cb_first_job_education_level') {
    throw new Error(
      `Unemployed with experience block complete should ask education, got ${qUnemployedExpEdu.question?.id}`
    )
  }

  const afterUnemployedEduComplete = {
    answers: {
      ...afterUnemployedExpBlock.answers,
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'law',
    },
    path_story: '',
  }
  const qUnemployedPriority = pickStructuredEntryQuestion(afterUnemployedEduComplete)
  if (qUnemployedPriority.question?.id !== 'cb_career_direction_priority') {
    throw new Error(
      `Unemployed with education + experience should ask path priority, got ${qUnemployedPriority.question?.id}`
    )
  }
  const priorityOptions = qUnemployedPriority.question?.options?.map((o) => o.value) ?? []
  if (
    !priorityOptions.includes('both') ||
    !priorityOptions.includes('fast_employment') ||
    !priorityOptions.includes('experience_field')
  ) {
    throw new Error(`Expected unemployed priority options, got ${priorityOptions.join(', ')}`)
  }

  const afterStartBusiness = { answers: { cb_user_goal: 'start_business' }, path_story: '' }
  const qStartBiz = pickStructuredEntryQuestion(afterStartBusiness)
  if (!qStartBiz.question?.id?.startsWith('biz_')) {
    throw new Error(`Start business route should ask JAZ business discovery first, got ${qStartBiz.question?.id}`)
  }

  const businessComplete = {
    answers: {
      cb_user_goal: 'start_business',
      biz_intent: 'has_idea',
      biz_idea: 'Barber shop',
      biz_experience_level: '1_3_years',
      biz_skills: ['trade_craft'],
      biz_capital: '1k_5k',
      biz_time: '20_40',
      biz_income_expectation: '2k_4k',
      biz_risk_tolerance: 'medium',
      biz_network: 'limited',
      biz_assets: ['tools'],
      biz_barber_experience: 'shop_exp',
      biz_barber_model: 'chair_rental',
      biz_barber_customers: 'occasional',
      biz_barber_obstacle: 'customers',
      biz_barber_equipment: 'yes',
      biz_barber_start_small: 'yes',
      biz_barber_uk_shop: 'yes_past',
      biz_barber_assets: ['tools', 'qualification'],
      biz_demand_evidence: 'research',
      biz_competition_awareness: 'some',
      biz_first_revenue_timeline: '3_months',
    },
    path_story: '',
    career_brain_asked: [
      'biz_intent',
      'biz_idea',
      'biz_experience_level',
      'biz_skills',
      'biz_capital',
      'biz_time',
      'biz_income_expectation',
      'biz_risk_tolerance',
      'biz_network',
      'biz_assets',
      'biz_barber_experience',
      'biz_barber_model',
      'biz_barber_customers',
      'biz_barber_obstacle',
      'biz_barber_equipment',
      'biz_barber_start_small',
      'biz_demand_evidence',
      'biz_competition_awareness',
      'biz_first_revenue_timeline',
    ],
  }
  const qBizDone = pickStructuredEntryQuestion(businessComplete)
  if (qBizDone.question !== null) {
    const blockedIds = ['cb_rtw_simple', 'cb_english', 'cb_location', 'cb_creative_uk_location']
    if (blockedIds.includes(qBizDone.question.id)) {
      throw new Error(`Business path must not ask employment question: ${qBizDone.question.id}`)
    }
    throw new Error(
      `Business path complete should not ask further questions, got ${qBizDone.question.id}: ${qBizDone.question.text}`
    )
  }

  const afterGoal = {
    answers: { cb_user_goal: 'first_job' },
    path_story: '',
  }
  const qEdu = pickStructuredEntryQuestion(afterGoal)
  if (qEdu.question?.id !== 'cb_first_job_education_level') {
    throw new Error(`After first job goal should ask education level, got ${qEdu.question?.id}`)
  }

  const careerChangeMid = {
    answers: {
      cb_user_goal: 'career_change',
      cb_change_current_field: 'hospitality',
      cb_change_experience_years: '3_5',
      cb_change_reason: 'opportunities',
      cb_change_target_field: 'marketing',
      cb_change_study_willing: 'yes',
      cb_change_retrain_time: '3_12_months',
    },
    path_story: '',
  }
  const qChange = pickStructuredEntryQuestion(careerChangeMid)
  if (qChange.question?.id !== 'cb_change_salary_reduction') {
    throw new Error(`Career change route should ask salary flexibility last, got ${qChange.question?.id}`)
  }
  const careerChangeComplete = {
    answers: {
      ...careerChangeMid.answers,
      cb_change_salary_reduction: 'yes',
    },
    path_story: '',
  }
  const qChangeDone = pickStructuredEntryQuestion(careerChangeComplete)
  if (qChangeDone.question !== null) {
    throw new Error(`Career change route should complete after 7 questions, got ${qChangeDone.question?.id}`)
  }

  const growCareerMid = {
    answers: {
      cb_user_goal: 'grow_career',
      cb_grow_field: 'engineering',
      currentJobTitle: 'Mechanical Engineer',
      cb_grow_years: '3_5',
      cb_grow_level: 'mid',
      cb_grow_goal: 'promotion',
      cb_grow_blocker: ['qualification'],
      cb_grow_study_willing: 'yes',
      cb_grow_dev_time: '3_12_months',
      cb_grow_leadership_ready: 'yes',
      cb_grow_employer_change: 'maybe',
    },
    path_story: '',
  }
  const qGrow = pickStructuredEntryQuestion(growCareerMid)
  if (
    qGrow.question?.id !== 'coreSkills' &&
    !qGrow.question?.id?.startsWith('jaz_')
  ) {
    throw new Error(`Grow career route should ask next JAZ or legacy gap question, got ${qGrow.question?.id}`)
  }
  const growCareerComplete = {
    answers: {
      ...growCareerMid.answers,
      coreSkills: ['technical_skills', 'problem_solving', 'analysis'],
    },
    path_story: '',
  }
  const qGrowDone = pickStructuredEntryQuestion(growCareerComplete)
  if (qGrowDone.question !== null) {
    throw new Error(`Grow career route should complete after 11 questions, got ${qGrowDone.question?.id}`)
  }

  const afterLegacyStudent = {
    answers: { cb_entry_situation: 'student_part_time' },
    path_story: '',
  }
  const profileQ = pickStructuredEntryQuestion(afterLegacyStudent)
  if (profileQ.question?.id !== 'cb_side_job_profile') {
    throw new Error(`Legacy student should map to side job profile question, got ${profileQ.question?.id}`)
  }

  const afterExp = {
    answers: {
      cb_user_goal: 'side_job',
      cb_side_job_profile: 'student',
    },
    path_story: '',
  }
  const speedQ = pickStructuredEntryQuestion(afterExp)
  if (!speedQ.question?.id?.startsWith('si_')) {
    throw new Error(`After student profile should ask JAZ side income question, got ${speedQ.question?.id}`)
  }

  const studentPartial = stateWith({
    cb_user_goal: 'side_job',
    cb_side_job_profile: 'student',
    si_monthly_goal: '200_500',
    si_income_timeline: '2_4_weeks',
    si_hours_week: '5_10',
    si_schedule: 'weekends',
  })
  const studentPartialQ = pickStructuredEntryQuestion(studentPartial)
  if (!studentPartialQ.question?.id?.startsWith('si_')) {
    throw new Error(`Student side income should continue JAZ questions, got ${studentPartialQ.question?.id}`)
  }

  const studentComplete = stateWith({
    cb_user_goal: 'side_job',
    cb_side_job_profile: 'student',
    si_employment: 'student',
    si_monthly_goal: '200_500',
    si_income_timeline: '2_4_weeks',
    si_hours_week: '5_10',
    si_schedule: 'weekends',
    si_main_field: 'Animation student',
    si_skills: ['design'],
    si_assets: ['computer', 'home_workspace'],
    si_work_physical: 'desk',
    si_work_location: 'home',
    si_work_people: 'independent',
    si_risk_tolerance: 'medium',
  })
  const studentDoneQ = pickStructuredEntryQuestion(studentComplete)
  if (studentDoneQ.question !== null && !studentDoneQ.question.id.startsWith('cb_english')) {
    throw new Error(`Student side income with full JAZ evidence should finish or ask English only, got ${studentDoneQ.question?.id}`)
  }

  const noExpAfterEdu = stateWith({
    cb_user_goal: 'first_job',
    cb_first_job_education_level: 'bachelors',
  })
  const qStudy = pickStructuredEntryQuestion(noExpAfterEdu)
  if (qStudy.question?.id !== 'cb_first_job_study_field') {
    throw new Error(`First job bachelors should ask study field, got ${qStudy.question?.id}`)
  }

  const noExpAfterEng = stateWith({
    cb_user_goal: 'first_job',
    cb_first_job_education_level: 'phd',
    cb_first_job_study_field: 'engineering',
  })
  const qEngSpec = pickStructuredEntryQuestion(noExpAfterEng)
  if (qEngSpec.question?.id !== 'cb_field_specialisation') {
    throw new Error(
      `Broad engineering field should ask specialisation, got ${qEngSpec.question?.id}`
    )
  }

  const noExpMid = {
    answers: {
      cb_user_goal: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'it_computing',
      cb_field_alignment: 'no',
    },
    path_story: '',
  }
  const qAfterAlign = pickStructuredEntryQuestion(noExpMid)
  if (qAfterAlign.question?.id !== 'cb_english') {
    throw new Error(`After first job education should ask English confidence separately, got ${qAfterAlign.question?.id}`)
  }

  const degreeNeedsEnglish = flowState({
    cb_user_goal: 'first_job',
    cb_first_job_education_level: 'bachelors',
    cb_first_job_study_field: 'law',
    cb_field_alignment: 'yes',
  })
  const qDegreeEng = pickStructuredEntryQuestion(degreeNeedsEnglish)
  if (qDegreeEng.question?.id !== 'cb_english') {
    throw new Error(`Degree first job must ask English separately (not inferred from education), got ${qDegreeEng.question?.id}`)
  }

  const gcseAfterEdu = flowState({
    cb_user_goal: 'first_job',
    cb_first_job_education_level: 'gcse_a_levels',
  })
  const qGcseEng = pickStructuredEntryQuestion(gcseAfterEdu)
  if (qGcseEng.question?.id !== 'cb_english') {
    throw new Error(`GCSE first job should ask English after education, got ${qGcseEng.question?.id}`)
  }

  const noExpEmploy = stateWith({
    cb_user_goal: 'first_job',
    cb_experience_level: 'no_experience',
    cb_first_job_education_level: 'gcse_a_levels',
    cb_work_speed: 'urgent',
    cb_english: 'good',
    cb_entry_work_preference: 'office_computer',
  })
  const qEmp = pickStructuredEntryQuestion(noExpEmploy)
  if (qEmp.question?.id === 'cb_field_intent') {
    throw new Error('No experience path must not ask same field')
  }

  const taxiOffice = stateWith({
    cb_user_goal: 'career_change',
    cb_change_current_field: 'other',
    cb_change_current_field_other: 'taxi driving',
    cb_change_experience_years: '5_10',
    cb_change_reason: 'salary',
    cb_change_target_field: 'business_administration',
    cb_change_study_willing: 'yes',
    cb_change_retrain_time: 'under_3_months',
    cb_change_salary_reduction: 'yes',
    cb_field_income_strategy: 'field_only',
    cb_english: 'good',
    cb_global_education_level: 'gcse_a_levels',
    cb_experience_country: 'mostly_uk',
    cb_rtw_simple: 'yes',
    cb_work_speed: 'within_1_2_months',
    cb_cert_openness: 'yes',
  })
  if (!isStructuredEntryComplete(taxiOffice)) {
    throw new Error('Taxi office structured entry should be complete')
  }
  const taxiQ = pickNextDiscoveryQuestion(
    enrichCareerProfile(taxiOffice),
    Object.keys(taxiOffice.answers!),
    taxiOffice
  )
  if (taxiQ.question !== null) {
    throw new Error(`Complete career change path should skip discovery questions, got ${taxiQ.question?.id}`)
  }

  const newUkCold = stateWith({ cb_user_goal: 'new_to_uk' })
  const qNew1 = pickStructuredEntryQuestion(newUkCold)
  if (qNew1.question?.id !== 'ntuk_profile_type') {
    throw new Error(`New to UK should ask profile type first, got ${qNew1.question?.id}`)
  }

  const engineerPartial = stateWith({
    cb_user_goal: 'new_to_uk',
    ntuk_profile_type: 'degree',
    ntuk_main_goal: 'field_work',
    ntuk_interest_area: 'hands_on',
    ntuk_qualification_field: 'engineering',
  })
  const { isUkTransitionPathComplete } = require('./ukTransitionPath') as typeof import('./ukTransitionPath')
  if (!isUkTransitionPathComplete(engineerPartial)) {
    const qMid = pickStructuredEntryQuestion(engineerPartial)
    throw new Error(`Engineer UK transition should be complete, still asking ${qMid.question?.id}`)
  }
  const syncedEngineer = syncLegacySituationAnswer(engineerPartial)
  if (syncedEngineer.answers?.cb_entry_situation !== 'new_to_uk') {
    throw new Error('New to UK should set cb_entry_situation to new_to_uk')
  }

  console.log('✓ Structured entry flow (goal → route → first job without UK status)')
}

import type { CareerBrainOutput } from './types'
import { titlesOverlapProgression } from './careerProgressionValidation'

const SCENARIOS: Array<{
  name: string
  story: string
  answers?: Record<string, unknown>
  assert: (
    titles: string[],
    tracks: { workNow: string[]; buildNext: string[]; longTerm: string[]; backupIncome?: string[] },
    output?: CareerBrainOutput
  ) => void
}> = [
  {
    name: 'Medicine student bridge',
    story: 'medicine student part time',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'medicine',
      cb_field_alignment: 'yes',
      cb_bridge_care_comfort: 'yes',
      cb_bridge_nhs_interest: 'nhs',
      cb_bridge_first_aid: 'planned',
      cb_student_availability: 'weekends',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/healthcare|care|medical|clinical|pharmacy/i.test(t)) {
        throw new Error(`Expected medicine bridge roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Law student any job flexible',
    story: 'law student any job evenings people',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'no',
      cb_student_work_style: 'people',
      cb_student_availability: 'evenings',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/barista|waiter|hospitality|retail|café|cafe|customer/i.test(t)) {
        throw new Error(`Expected flexible WORK NOW: ${titles.join(', ')}`)
      }
      if (/paralegal|legal admin|legal reception|casework|solicitor/i.test(t)) {
        throw new Error(`Must NOT suggest study-aligned legal roles for any_job: ${titles.join(', ')}`)
      }
      if (!/supervisor|team leader|shift|hospitality manager|operations/i.test(t)) {
        throw new Error(`Expected flexible-sector progression: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Law student hybrid open both',
    story: 'law student open to both',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'both',
      cb_student_work_style: 'people',
      cb_student_availability: 'evenings',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/barista|retail|café|cafe|customer|hospitality/i.test(t)) {
        throw new Error(`Expected hybrid WORK NOW: ${titles.join(', ')}`)
      }
      if (!/legal|paralegal|admin|casework/i.test(t)) {
        throw new Error(`Expected law BUILD NEXT for open_both: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Law student bridge',
    story: 'law student',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'yes',
      cb_bridge_legal_admin: 'yes',
      cb_bridge_office_legal: 'yes',
      cb_student_availability: 'evenings',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/legal|admin|paralegal|casework/i.test(t)) {
        throw new Error(`Expected law bridge roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Student business retail pivot',
    story: 'business student retail wants different',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_work_experience_field: 'part-time work', cb_experience_country: 'mostly_uk',
      cb_student_experience_type: 'retail',
      cb_student_continue_experience: 'no_different',
      cb_student_study_field: 'business',
      cb_field_alignment: 'both',
      cb_student_availability: 'weekends',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/admin|marketing|hr|business/i.test(t)) {
        throw new Error(`Expected business BUILD NEXT paths: ${titles.join(', ')}`)
      }
      if (!/retail|customer|café|cafe|hospitality|barista|marketing|assistant|admin/i.test(t)) {
        throw new Error(`Expected field Work Now or backup income options: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Student animation retail hybrid',
    story: 'animation student retail experience',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_work_experience_field: 'part-time work', cb_experience_country: 'mostly_uk',
      cb_student_experience_type: 'retail',
      cb_student_continue_experience: 'maybe_partly',
      cb_student_study_field: 'animation',
      cb_field_alignment: 'no',
      cb_student_work_style: 'creative_digital',
      cb_student_availability: 'evenings',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/retail|café|cafe|hospitality|barista|customer/i.test(t)) {
        throw new Error(`Expected flexible WORK NOW for any_job: ${titles.join(', ')}`)
      }
      if (/motion|animator|paralegal|legal admin/i.test(t)) {
        throw new Error(`Must NOT use study-aligned roles for any_job: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Student animation part-time',
    story: 'student studying animation part time',
    answers: {
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'animation',
      cb_field_alignment: 'yes',
      cb_student_availability: 'weekends',
      cb_creative_portfolio: 'building',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/video|social|creative|production|motion/i.test(t)) {
        throw new Error(`Expected student creative roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'No experience weak English',
    story: 'no job basic english',
    answers: {
      cb_work_speed: 'urgent',
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_english: 'basic',
      cb_physical_ability: 'yes',
      cb_entry_work_preference: 'quick_income',
      cb_cert_openness: 'yes',
    },
    assert: (titles, tracks) => {
      const t = titles.join(' ').toLowerCase()
      if (!/warehouse|cleaner|kitchen|porter|factory|labourer/i.test(t)) {
        throw new Error(`Expected physical entry roles: ${titles.join(', ')}`)
      }
      if (/customer service|receptionist|office assistant|office admin/i.test(tracks.workNow.join(' '))) {
        throw new Error('Customer-facing and office roles should not appear in Work Now with basic English')
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/english|forklift|cscs/i.test(build)) {
        throw new Error(`Basic English Build Next should include English classes or licences: ${tracks.buildNext.join(', ')}`)
      }
    },
  },
  {
    name: 'Intermediate English logistics entry',
    story: 'intermediate english retail logistics',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_english: 'intermediate',
      cb_physical_ability: 'light_physical',
      cb_entry_work_preference: 'physical_practical',
      cb_cert_openness: 'yes',
    },
    assert: (titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      if (!/retail|warehouse|delivery|logistics|care assistant|care support/i.test(work)) {
        throw new Error(`Intermediate English should prioritise everyday communication roles: ${tracks.workNow.join(', ')}`)
      }
      if (/receptionist|office administrator|recruitment assistant|sales executive/i.test(work)) {
        throw new Error(`Intermediate English should avoid heavy office roles: ${tracks.workNow.join(', ')}`)
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/forklift|cpc|team leader/i.test(build)) {
        throw new Error(`Intermediate Build Next should include licences/training: ${tracks.buildNext.join(', ')}`)
      }
    },
  },
  {
    name: 'Good English customer admin entry',
    story: 'good english office customer roles',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_english: 'good',
      cb_physical_ability: 'non_physical',
      cb_entry_work_preference: 'office_computer',
      cb_cert_openness: 'yes',
    },
    assert: (titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      if (!/customer service|retail assistant|receptionist|office assistant|sales assistant|admin assistant|data entry|administrator/i.test(work)) {
        throw new Error(`Good English should prioritise customer-facing and admin roles: ${tracks.workNow.join(', ')}`)
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/supervisor|administration|team leader/i.test(build)) {
        throw new Error(`Good English Build Next should include supervisor/admin progression: ${tracks.buildNext.join(', ')}`)
      }
      void titles
    },
  },
  {
    name: 'Science degree field-aligned ladder',
    story: 'science graduate wants lab career',
    answers: {
      cb_user_goal: 'first_job',
      cb_entry_situation: 'first_job',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'science',
      cb_field_alignment: 'yes',
      cb_english: 'good',
      cb_cert_openness: 'yes',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      if (!/laboratory|lab|research|quality|science/i.test(work)) {
        throw new Error(`Science field alignment should start with lab/research entry: ${tracks.workNow.join(', ')}`)
      }
      if (/office manager|retail manager|store manager/i.test(long)) {
        throw new Error(`Science long-term must not jump to unrelated office/retail management: ${tracks.longTerm.join(', ')}`)
      }
      if (!/laboratory|lab|research|quality|science/i.test(long)) {
        throw new Error(`Science long-term should stay in science/lab progression: ${tracks.longTerm.join(', ')}`)
      }
      if (tracks.buildNext.length === 0 || tracks.longTerm.length === 0) {
        throw new Error('Science path must include Build Next and Long-Term progression steps')
      }
      const why = (output?.whyThisPath ?? '').toLowerCase()
      if (!/field alignment|career-aligned|science|laboratory/i.test(why)) {
        throw new Error(`Output should explain field-aligned reasoning: ${output?.whyThisPath}`)
      }
    },
  },
  {
    name: 'Fluent English office pathway',
    story: 'fluent english professional entry',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_english: 'fluent',
      cb_physical_ability: 'non_physical',
      cb_entry_work_preference: 'office_computer',
      cb_cert_openness: 'yes',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      if (!/office assistant|administrator|admin assistant|customer service|receptionist|recruitment|coordinator|data entry/i.test(work)) {
        throw new Error(`Fluent English should weight office and professional entry roles: ${tracks.workNow.join(', ')}`)
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/management|professional|specialist/i.test(build)) {
        throw new Error(`Fluent Build Next should include management/professional training: ${tracks.buildNext.join(', ')}`)
      }
      if (output?.englishDevelopmentPlan) {
        throw new Error('Fluent users should not receive an English development plan')
      }
    },
  },
  {
    name: 'Warehouse growth',
    story: 'warehouse worker',
    answers: { cb_experience_level: 'have_experience', cb_experience_field_relation: 'different_field', cb_work_experience_field: 'warehouse operative', cb_experience_country: 'mostly_uk', cb_basic_experience_text: 'warehouse operative', cb_continue_in_field: 'yes' },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/warehouse|forklift|logistics/i.test(t)) {
        throw new Error(`Expected warehouse growth path: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Taxi to office',
    story: 'taxi driver office work',
    answers: {
      cb_entry_situation: 'career_change',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_experience_country: 'mostly_uk',
      cb_professional_field: 'taxi',
      cb_professional_experience: 'uber driver',
      cb_professional_field_intent: 'change_field',
      cb_change_target_field: 'office work',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/admin|reception|customer|data entry/i.test(t)) {
        throw new Error(`Expected office roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Career change hospitality to marketing',
    story: 'employed hospitality worker pivoting to marketing',
    answers: {
      cb_user_goal: 'career_change',
      cb_change_current_field: 'hospitality',
      cb_change_experience_years: '3_5',
      cb_change_reason: 'opportunities',
      cb_change_target_field: 'marketing',
      cb_change_study_willing: 'yes',
      cb_change_retrain_time: '3_12_months',
      cb_change_salary_reduction: 'yes',
    },
    assert: (_titles, tracks, output) => {
      if (!output?.careerChangeTransition) {
        throw new Error('Expected career change transition output')
      }
      if (output.careerChangeTransition.transferableSkills.length < 4) {
        throw new Error('Expected 4+ transferable skills')
      }
      if (output.careerChangeTransition.transitionReadinessScore < 40) {
        throw new Error('Expected transition readiness score')
      }
      if (!/marketing/i.test(tracks.workNow.join(' '))) {
        throw new Error(`Work Now should be marketing bridge roles: ${tracks.workNow.join(', ')}`)
      }
      if (/warehouse|retail assistant|kitchen porter|barista/i.test(tracks.workNow.join(' '))) {
        throw new Error(`Career change must not recommend unrelated fallback jobs: ${tracks.workNow.join(', ')}`)
      }
      const why = output?.whyThisPath ?? ''
      if (!/Summary/i.test(why) || !/Transferable Skills/i.test(why)) {
        throw new Error('whyThisPath should include Summary and Transferable Skills')
      }
      if (!output?.careerChangeTransition?.realityCheck) {
        throw new Error('Expected career change reality check')
      }
    },
  },
  {
    name: 'Grow career engineering mid-level',
    story: 'engineering technician seeking promotion',
    answers: {
      cb_user_goal: 'grow_career',
      cb_grow_field: 'engineering',
      currentJobTitle: 'Mechanical Engineer',
      cb_grow_years: '3_5',
      cb_grow_level: 'mid',
      cb_grow_goal: 'promotion',
      cb_grow_blocker: ['qualification', 'technical_skills'],
      cb_grow_study_willing: 'yes',
      cb_grow_dev_time: '3_12_months',
      cb_grow_leadership_ready: 'yes',
      cb_grow_employer_change: 'maybe',
      coreSkills: ['technical_skills', 'problem_solving', 'analysis'],
    },
    assert: (_titles, tracks, output) => {
      if (!output?.growCareerGrowth) {
        throw new Error('Expected grow career growth output')
      }
      if (output.growCareerGrowth.careerGrowthScore < 40) {
        throw new Error('Expected career growth score')
      }
      if (!/mechanical engineer/i.test(output.growCareerGrowth.currentJobTitle)) {
        throw new Error(`Expected mechanical engineer title: ${output.growCareerGrowth.currentJobTitle}`)
      }
      if (!/senior mechanical engineer|lead mechanical engineer|chartered mechanical engineer/i.test(tracks.longTerm.join(' '))) {
        throw new Error(`Long term should stay in profession: ${tracks.longTerm.join(', ')}`)
      }
      if (/warehouse|retail assistant|kitchen porter/i.test(tracks.workNow.join(' '))) {
        throw new Error(`Must not show unrelated fallback jobs: ${tracks.workNow.join(', ')}`)
      }
      if (output.growCareerGrowth.immediateActions.length < 3) {
        throw new Error('Expected three immediate actions')
      }
      if (!output.growCareerGrowth.growthScoreLabel) {
        throw new Error('Expected growth score label')
      }
    },
  },
  {
    name: 'Animation graduate no portfolio',
    story: 'animation graduate no portfolio',
    answers: {
      cb_entry_situation: 'graduate_little_exp',
      cb_experience_level: 'no_experience',
      cb_graduate_study_field: 'animation',
      cb_field_alignment: 'yes',
      cb_creative_portfolio: 'no',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/animator|motion|video|3d|creative/i.test(t)) {
        throw new Error(`Expected creative roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Foreign accountant no UK exp',
    story: 'accountant abroad no uk experience',
    answers: {
      cb_entry_situation: 'career_change',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_experience_country: 'mostly_uk',
      cb_professional_field: 'accounting',
      cb_professional_experience: 'accountant in home country',
      cb_professional_field_intent: 'related_field',
    },
    assert: (titles) => {
      if (titles.length < 3) throw new Error('Expected finance bridge roles')
    },
  },
  {
    name: 'Stable long-term',
    story: 'stable career growth',
    answers: {
      cb_work_speed: 'invest_time',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'exploring',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'different_field', cb_work_experience_field: 'warehouse operative', cb_experience_country: 'mostly_uk',
      cb_basic_experience_text: 'retail',
      cb_continue_in_field: 'unsure',
      cb_discovery_income_goal: 'stable_long_term',
    },
    assert: (titles) => {
      if (titles.length < 2) throw new Error('Expected progression roles')
    },
  },
  {
    name: 'Skill unlock no experience cert yes',
    story: 'no experience flexible work open to training',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'exploring',
      cb_experience_level: 'no_experience',
    },
    assert: (titles, tracks, output) => {
      const t = titles.join(' ').toLowerCase()
      if (!/retail|warehouse|barista|café|cafe|hospitality|customer/i.test(t)) {
        throw new Error(`Expected flexible WORK NOW: ${titles.join(', ')}`)
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      const buildBlob = `${build} ${training}`
      if (!/team leader|coordinator|supervisor|administrator|operative/i.test(build)) {
        throw new Error(`Expected role-based BUILD NEXT steps: ${tracks.buildNext.join(', ')}`)
      }
      if (!/sia|forklift|cscs|care assistant|digital support|hospitality supervisor|first aid/i.test(buildBlob)) {
        throw new Error(`Expected skill-unlock training support: ${buildBlob}`)
      }
      if (!/security officer|support worker|forklift operator|digital support|logistics coordinator/i.test(t)) {
        throw new Error(`Expected professional LONG-TERM path from training: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Law student bridge cert open',
    story: 'law student open to training',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'yes',
      cb_bridge_legal_admin: 'yes',
      cb_student_availability: 'evenings',
    },
    assert: (titles, tracks, output) => {
      const t = titles.join(' ').toLowerCase()
      if (!/legal reception|legal admin|office admin/i.test(t)) {
        throw new Error(`Expected law WORK NOW bridge roles: ${titles.join(', ')}`)
      }
      const build = tracks.buildNext.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      if (!/legal|casework|administrator|assistant|officer/i.test(build)) {
        throw new Error(`Expected law BUILD NEXT roles: ${tracks.buildNext.join(', ')}`)
      }
      if (!/legal administration|legal research|office administration/i.test(`${build} ${training}`)) {
        throw new Error(`Expected law training support: ${training || tracks.buildNext.join(', ')}`)
      }
      if (!/paralegal|solicitor|legal researcher|legal assistant/i.test(t)) {
        throw new Error(`Expected law LONG-TERM path: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Physical work style skill unlock',
    story: 'physical work open to training',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'exploring',
      cb_experience_level: 'no_experience',
      cb_student_work_style: 'physical',
      cb_physical_ability: 'yes',
    },
    assert: (_titles, tracks, output) => {
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      const buildBlob = `${build} ${training}`
      if (!/team leader|coordinator|administrator|warehouse|shift/i.test(build)) {
        throw new Error(`Expected physical BUILD NEXT role steps: ${tracks.buildNext.join(', ')}`)
      }
      if (!/forklift|cscs|sia|first aid/i.test(buildBlob)) {
        throw new Error(`Expected physical training support: ${buildBlob}`)
      }
      if (/excel|office administrator|business support officer/i.test(buildBlob)) {
        throw new Error(`Physical style must not get office courses in BUILD NEXT: ${buildBlob}`)
      }
      if (!/forklift|logistics|operations|security officer|warehouse supervisor/i.test(long)) {
        throw new Error(`Expected physical LONG-TERM roles: ${tracks.longTerm.join(', ')}`)
      }
      if (/paralegal|office administrator|business development/i.test(long)) {
        throw new Error(`Physical LONG-TERM must not be office-heavy: ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'Law hybrid open both cert yes',
    story: 'law open both training',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'both',
      cb_student_work_style: 'people',
      cb_student_availability: 'evenings',
    },
    assert: (_titles, tracks, output) => {
      const work = [...tracks.workNow, ...(tracks.backupIncome ?? [])].join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      if (!/barista|retail|café|cafe|hospitality|customer|legal reception|legal admin|office admin/i.test(work)) {
        throw new Error(`Dual path WORK NOW / backup: ${[...tracks.workNow, ...(tracks.backupIncome ?? [])].join(', ')}`)
      }
      if (!/legal|casework|administrator|assistant|officer/i.test(build)) {
        throw new Error(`Dual path BUILD NEXT should use law progression roles: ${tracks.buildNext.join(', ')}`)
      }
      if (!/legal administration|legal research|office administration/i.test(`${build} ${training}`)) {
        throw new Error(`Dual path BUILD NEXT should include law training support: ${training || build}`)
      }
      if (/sia licence|forklift licence|cscs construction/i.test(`${build} ${training}`)) {
        throw new Error(`Law path must not include unrelated licences in Build Next: ${build}`)
      }
      if (!/paralegal|solicitor|legal researcher|legal assistant|legal administrator|operations coordinator/i.test(long)) {
        throw new Error(`Dual path LONG-TERM law careers: ${tracks.longTerm.join(', ')}`)
      }
      if (/legal administration training|excel for business/i.test(long)) {
        throw new Error(`LONG-TERM must not repeat BUILD NEXT training: ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'Law open both physical career split',
    story: 'law student physical open both training',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'no_experience',
      cb_student_study_field: 'law',
      cb_field_alignment: 'both',
      cb_student_work_style: 'physical',
      cb_physical_ability: 'yes',
      cb_student_availability: 'evenings',
    },
    assert: (_titles, tracks, output) => {
      const work = [...tracks.workNow, ...(tracks.backupIncome ?? [])].join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      const buildBlob = `${build} ${training}`
      if (!/retail|warehouse|picker|packer|legal reception|legal admin|office admin/i.test(work)) {
        throw new Error(`Physical WORK NOW / backup: ${[...tracks.workNow, ...(tracks.backupIncome ?? [])].join(', ')}`)
      }
      if (!/legal|casework|administrator|assistant|officer/i.test(build)) {
        throw new Error(`Expected law BUILD NEXT roles: ${tracks.buildNext.join(', ')}`)
      }
      if (!/legal research|legal administration|office administration/i.test(buildBlob)) {
        throw new Error(`Expected field-aligned training support: ${buildBlob}`)
      }
      if (/sia licence|forklift licence|cscs construction/i.test(buildBlob)) {
        throw new Error(`Law path must not include unrelated licences: ${buildBlob}`)
      }
      if (/sia licence|forklift licence|legal research skills/i.test(long)) {
        throw new Error(`LONG-TERM must not repeat training: ${tracks.longTerm.join(', ')}`)
      }
      if (!/legal assistant|paralegal|legal administrator|legal researcher|solicitor|operations coordinator/i.test(long)) {
        throw new Error(`LONG-TERM must be law career destinations: ${tracks.longTerm.join(', ')}`)
      }
      if (/warehouse supervisor|forklift operator|security officer/i.test(long)) {
        throw new Error(`LONG-TERM must be career direction not work-style: ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'Student IT experience general studies',
    story: 'student with IT background general studies',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_work_experience_field: 'part-time work', cb_experience_country: 'mostly_uk',
      cb_student_study_field: 'general studies',
      cb_field_alignment: 'yes',
      cb_student_experience_type: ['it_technology'],
      cb_student_continue_experience: 'yes_continue',
      cb_student_work_style: 'office',
      cb_student_availability: 'evenings',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      const training = (output?.recommendedPaths.buildNext ?? [])
        .flatMap((r) => r.recommendedTraining ?? [])
        .join(' ')
        .toLowerCase()
      const buildBlob = `${build} ${training}`
      if (!/it support|junior it|technical support|helpdesk/i.test(work)) {
        throw new Error(`IT WORK NOW: ${tracks.workNow.join(', ')}`)
      }
      if (!/systems|support|helpdesk|administrator|specialist|coordinator/i.test(build)) {
        throw new Error(`IT BUILD NEXT roles: ${tracks.buildNext.join(', ')}`)
      }
      if (!/comptia|google it support|excel|networking/i.test(buildBlob)) {
        throw new Error(`IT BUILD NEXT training support: ${buildBlob}`)
      }
      if (!/it support specialist|systems administrator|cybersecurity|software development|data analyst/i.test(long)) {
        throw new Error(`IT LONG-TERM: ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'Student IT experience open both office',
    story: 'business student IT exp dual path',
    answers: {
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_entry_situation: 'student_part_time',
      cb_experience_level: 'have_experience', cb_experience_field_relation: 'study_related', cb_work_experience_field: 'part-time work', cb_experience_country: 'mostly_uk',
      cb_student_study_field: 'business administration',
      cb_field_alignment: 'both',
      cb_student_experience_type: ['it_technology'],
      cb_student_continue_experience: 'yes_continue',
      cb_student_work_style: 'office',
      cb_student_availability: 'evenings',
    },
    assert: (_titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      if (!/it support|technical support|helpdesk/i.test(work)) {
        throw new Error(`Dual path should prefer IT WORK NOW with IT experience: ${tracks.workNow.join(', ')}`)
      }
      if (!/business administrator|operations coordinator|sales executive|assistant manager/i.test(long)) {
        throw new Error(`Dual path LONG-TERM business careers: ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'First job IT degree open to any',
    story: 'first job computing graduate needs income',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'it_computing',
      cb_field_alignment: 'no',
      cb_work_speed: 'urgent',
      cb_cert_openness: 'yes',
      cb_english: 'good',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'light_physical',
      cb_customer_comfort: 'sometimes',
      cb_shift_flexibility: 'flexible',
      cb_entry_work_preference: 'quick_income',
    },
    assert: (titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      if (!/warehouse|retail|delivery|kitchen|operative|café|barista/i.test(work)) {
        throw new Error(`Open-any first job should prioritise quick income Work Now: ${tracks.workNow.join(', ')}`)
      }
      if (/it support|developer|comp tia|google it/i.test(build + long)) {
        throw new Error(`Open-any should not lock to field Build/Long-Term: build=${tracks.buildNext.join(', ')} long=${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'First job law degree field only',
    story: 'first job law graduate wants legal roles',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'law',
      cb_field_alignment: 'yes',
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_english: 'fluent',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'non_physical',
      cb_customer_comfort: 'yes',
      cb_shift_flexibility: 'day_only',
      cb_entry_work_preference: 'office_computer',
    },
    assert: (titles, tracks, output) => {
      const all = titles.join(' ').toLowerCase()
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/legal|paralegal|law|admin|reception|casework/i.test(all)) {
        throw new Error(`Field-only first job law should stay legal-aligned: ${titles.join(', ')}`)
      }
      if (tracks.workNow.length < 1) {
        throw new Error('Work Now must not be empty for committed law path')
      }
      if (/certif|licen[cs]e|course|training/i.test(work) && !/assistant|receptionist|clerk|admin/i.test(work)) {
        throw new Error(`Work Now must be jobs not courses: ${tracks.workNow.join(', ')}`)
      }
      if (/sia|forklift|warehouse|retail assistant|barista/i.test(work)) {
        throw new Error(`Committed law path must not use unrelated Work Now roles: ${tracks.workNow.join(', ')}`)
      }
      if (/sia licence|forklift/i.test(build)) {
        throw new Error(`Build Next must stay law-aligned: ${tracks.buildNext.join(', ')}`)
      }
    },
  },
  {
    name: 'Engineering PhD mechanical field-only',
    story: 'first job mechanical engineering phd no uk experience',
    answers: {
      cb_user_goal: 'first_job',
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'phd',
      cb_first_job_study_field: 'engineering',
      cb_field_specialisation: 'engineering:mechanical',
      cb_field_alignment: 'yes',
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_english: 'good',
      cb_experience_country: 'mostly_international',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'non_physical',
      cb_customer_comfort: 'sometimes',
      cb_shift_flexibility: 'flexible',
      cb_entry_work_preference: 'office_computer',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      if (!/mechanical|manufacturing|cad|graduate|junior design|r&d|engineering project/i.test(work)) {
        throw new Error(`Mechanical WORK NOW expected: ${tracks.workNow.join(', ')}`)
      }
      if (/software tester|graduate software|cloud fundamentals/i.test(work + build + long)) {
        throw new Error(`Mechanical path must not use software engineering pack: ${work} | ${build} | ${long}`)
      }
      if (/hnc|btec/i.test(build)) {
        throw new Error(`PhD mechanical should not get HNC/BTEC build steps: ${tracks.buildNext.join(', ')}`)
      }
      if (!/graduate mechanical|junior design|r&d|project assistant|cad|fea|ceng|mechanical design/i.test(work + build + long)) {
        throw new Error(`Mechanical PhD BUILD/LONG expected: ${tracks.buildNext.join(', ')} | ${tracks.longTerm.join(', ')}`)
      }
      if (output) {
        const why = `${output.whyThisPath} ${output.personalizedSummary}`.toLowerCase()
        if (/retail|customer service|hospitality/i.test(why)) {
          throw new Error(`Explanations must not reference unrelated sectors: ${output.whyThisPath}`)
        }
        if (!/mechanical/i.test(why)) {
          throw new Error(`Explanations should reference mechanical engineering: ${output.whyThisPath}`)
        }
        for (const n of output.notRecommended) {
          if (/delivery driver|forklift|security|skilled trades|heavy physical/i.test(n.title)) {
            throw new Error(`Should not list unrelated rejected careers: ${n.title}`)
          }
        }
        const civil = output.notRecommended.find((n) => /civil engineering/i.test(n.title))
        if (!civil) {
          throw new Error(
            `Expected civil engineering in paths-not-selected: ${output.notRecommended.map((n) => n.title).join(', ')}`
          )
        }
      }
    },
  },
  {
    name: 'Engineering PhD software field-only',
    story: 'first job software engineering phd no uk experience',
    answers: {
      cb_user_goal: 'first_job',
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'phd',
      cb_first_job_study_field: 'engineering',
      cb_field_specialisation: 'engineering:software',
      cb_field_alignment: 'yes',
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_english: 'good',
      cb_experience_country: 'mostly_international',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'non_physical',
      cb_customer_comfort: 'sometimes',
      cb_shift_flexibility: 'flexible',
      cb_entry_work_preference: 'office_computer',
    },
    assert: (_titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      const long = tracks.longTerm.join(' ').toLowerCase()
      if (!/software|tester|it support|technical support/i.test(work)) {
        throw new Error(`Software engineering WORK NOW expected: ${tracks.workNow.join(', ')}`)
      }
      if (/mechanical engineering technician|manufacturing engineering trainee/i.test(work)) {
        throw new Error(`Software path must not use mechanical pack: ${tracks.workNow.join(', ')}`)
      }
      if (!/cloud|graduate|senior software|software developer/i.test(build + long)) {
        throw new Error(`Software BUILD/LONG expected: ${tracks.buildNext.join(', ')} | ${tracks.longTerm.join(', ')}`)
      }
    },
  },
  {
    name: 'First job degree no longer in field',
    story: 'first job changed mind on studies',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'bachelors',
      cb_first_job_study_field: 'business_management',
      cb_field_alignment: 'no',
      cb_work_speed: 'urgent',
      cb_cert_openness: 'yes',
      cb_english: 'good',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'light_physical',
      cb_customer_comfort: 'yes',
      cb_shift_flexibility: 'flexible',
      cb_entry_work_preference: 'quick_income',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (/paralegal|junior marketing assistant|business analyst trainee/i.test(t) && !/retail|warehouse|customer service|hospitality/i.test(t)) {
        throw new Error(`No-longer preference should not force degree roles: ${titles.join(', ')}`)
      }
    },
  },
  {
    name: 'Non-physical preference global',
    story: 'office preference no warehouse',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'gcse_a_levels',
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_english: 'good',
      cb_uk_driving_licence: 'no',
      cb_physical_ability: 'non_physical',
      cb_customer_comfort: 'sometimes',
      cb_shift_flexibility: 'day_only',
      cb_entry_work_preference: 'office_computer',
    },
    assert: (_titles, tracks) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (/warehouse operative|kitchen porter|forklift operator|picker|packer/i.test(work) && !/admin|data entry|reception|dispatch|office/i.test(work)) {
        throw new Error(`Non-physical preference should boost office Work Now: ${tracks.workNow.join(', ')}`)
      }
      if (/data entry|office admin|reception|dispatch/i.test(work) && /forklift|hgv|cpc/i.test(build)) {
        throw new Error(`Build Next must match office Work Now: ${tracks.buildNext.join(', ')}`)
      }
    },
  },
  {
    name: 'First job non-physical explanation consistency',
    story: 'first job office preference fluent english licence',
    answers: {
      cb_entry_situation: 'first_job',
      cb_experience_level: 'no_experience',
      cb_first_job_education_level: 'gcse_a_levels',
      cb_work_speed: 'within_1_2_months',
      cb_cert_openness: 'yes',
      cb_english: 'fluent',
      cb_uk_driving_licence: 'yes',
      cb_physical_ability: 'non_physical',
      cb_customer_comfort: 'sometimes',
      cb_shift_flexibility: 'day_only',
      cb_entry_work_preference: 'office_computer',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/admin|data entry|reception|dispatch|office/i.test(work)) {
        throw new Error(`Expected office Work Now: ${tracks.workNow.join(', ')}`)
      }
      if (/forklift|hgv|comptia|it support fundamentals/i.test(build)) {
        throw new Error(`Office path must not get logistics/IT Build Next: ${tracks.buildNext.join(', ')}`)
      }
      const why = output?.whyThisPath ?? ''
      if (/driving & logistics/i.test(why) && !/logistics|warehouse|delivery/i.test(work)) {
        throw new Error(`Explanation must match recommendations: ${why}`)
      }
      if (!/first job|english|office|non-physical|driving licence/i.test(why)) {
        throw new Error(`Explanation should reference user answers: ${why}`)
      }
      const score = output?.employabilityScore ?? 0
      if (score < 45 || score > 72) {
        throw new Error(`Employability score should be 45–72 for this profile, got ${score}`)
      }
    },
  },
  {
    name: 'Direct employment cert no',
    story: 'not open to courses — jobs first',
    answers: {
      cb_cert_openness: 'no',
      cb_entry_situation: 'exploring',
      cb_experience_level: 'no_experience',
      cb_entry_work_preference: 'physical_practical',
      cb_english: 'functional',
    },
    assert: (_titles, tracks, output) => {
      const work = tracks.workNow.join(' ').toLowerCase()
      const build = tracks.buildNext.join(' ').toLowerCase()
      if (!/warehouse|retail|kitchen|operative|cleaner/i.test(work)) {
        throw new Error(`Expected immediate Work Now roles: ${tracks.workNow.join(', ')}`)
      }
      if (/sia security|forklift licence|cscs construction card|care assistant certification|hgv training|cpc qualification/i.test(build)) {
        throw new Error(`Cert-heavy Build Next must be omitted when cert=no: ${tracks.buildNext.join(', ')}`)
      }
      const profile = enrichCareerProfile({
        path_story: 'cert no',
        answers: {
          cb_cert_openness: 'no',
          cb_entry_situation: 'exploring',
          cb_experience_level: 'no_experience',
          cb_entry_work_preference: 'physical_practical',
        },
      })
      if (!profile.constraints.includes('direct-employment-focus')) {
        throw new Error('Profile should include direct-employment-focus when cert=no')
      }
      if (profile.constraints.includes('skill-unlock-mode')) {
        throw new Error('skill-unlock-mode should be off when cert=no')
      }
      const why = (output?.whyThisPath ?? '').toLowerCase()
      if (why && !/direct|current profile|without training|not courses|work now/i.test(why)) {
        // reasoning optional — constraints are the source of truth
      }
    },
  },
  {
    name: 'Quick income only',
    story: 'need money urgently',
    answers: {
      cb_work_speed: 'urgent',
      cb_entry_situation: 'unemployed_urgent',
      cb_experience_level: 'no_experience',
      cb_entry_work_preference: 'quick_income',
      cb_uk_driving_licence: 'yes',
    },
    assert: (titles) => {
      const t = titles.join(' ').toLowerCase()
      if (!/warehouse|delivery|driver|cleaner/i.test(t)) {
        throw new Error(`Expected quick-income roles: ${titles.join(', ')}`)
      }
    },
  },
]

function runJourneyPersonalizationChecks() {
  const urgentDriving = stateWith({
    cb_entry_situation: 'unemployed_urgent',
    cb_experience_level: 'no_experience',
    cb_work_speed: 'urgent',
    cb_cert_openness: 'yes',
    cb_uk_driving_licence: 'yes',
    cb_entry_work_preference: 'physical',
  })
  const profile = enrichCareerProfile(urgentDriving)
  const { recommendations } = buildFallbackRecommendations(profile, urgentDriving)
  const output = buildCareerBrainOutput(profile, recommendations, ['dev'], 'fallback', urgentDriving)

  const summary = buildPersonalizedJourneySummary(profile, urgentDriving, output.recommendedPaths.workNow)
  if (!summary.startsWith('Based on your profile')) {
    throw new Error(`Expected answer-based summary, got: ${summary}`)
  }
  if (!/urgently|driving licence|physical|training/i.test(summary)) {
    throw new Error(`Summary should reference user answers: ${summary}`)
  }
  if (!output.whyThisPath.startsWith('Based on your profile')) {
    throw new Error(`whyThisPath should reference user profile: ${output.whyThisPath}`)
  }
  if (/I recommended Driving & Logistics/i.test(output.whyThisPath) && !/delivery|warehouse|logistics/i.test(output.recommendedPaths.workNow.map((r) => r.title).join(' ').toLowerCase())) {
    throw new Error(`Explanation must match Work Now roles: ${output.whyThisPath}`)
  }
  if (!output.careerLadderSummary.includes('→')) {
    throw new Error(`careerLadderSummary should show a ladder: ${output.careerLadderSummary}`)
  }
  if (!output.practicalNextSteps.length) {
    throw new Error('Expected at least one practical next step')
  }
  const firstWhy = output.recommendedPaths.workNow[0]?.why ?? ''
  if (!/why this fits:|next step:|readiness:/i.test(firstWhy)) {
    throw new Error(`Recommendations should include readable journey context: ${firstWhy}`)
  }
  const workScores = output.pathConfidence.filter((p) => p.track === 'work_now')
  for (let i = 1; i < workScores.length; i++) {
    if (workScores[i].score >= workScores[i - 1].score) {
      throw new Error(`Path confidence must be ranked: ${workScores.map((p) => `${p.title} ${p.score}`).join(', ')}`)
    }
  }
    for (const w of output.recommendedPaths.workNow) {
      for (const l of output.recommendedPaths.longTerm) {
        if (titlesOverlapProgression(w.title, l.title)) {
          throw new Error(`Work Now and Long-Term must not duplicate: ${w.title} / ${l.title}`)
        }
      }
    }
  for (const n of output.notRecommended) {
    const recTitles = [
      ...output.recommendedPaths.workNow,
      ...output.recommendedPaths.buildNext,
      ...output.recommendedPaths.longTerm,
    ].map((r) => r.title)
    if (recTitles.some((t) => /office admin/i.test(t) && /office admin/i.test(n.title))) {
      throw new Error(`Not recommended contradicts recommendation: ${n.title}`)
    }
  }
  const build = output.recommendedPaths.buildNext.map((r) => r.title.toLowerCase()).join(' ')
  const long = output.recommendedPaths.longTerm.map((r) => r.title.toLowerCase()).join(' ')
  if (/forklift/i.test(build) && /forklift/i.test(long) && !/supervisor|coordinator|manager|operator/i.test(long)) {
    throw new Error('Build Next and Long-Term must not repeat the same training title without progression')
  }

  const progression = validateCareerProgression(
    output.recommendedPaths.workNow.map((r) => ({
      ...r,
      track: 'work_now' as const,
      field_tag: r.domain,
    })),
    output.recommendedPaths.buildNext.map((r) => ({
      ...r,
      track: 'build_next' as const,
      field_tag: r.domain,
    })),
    output.recommendedPaths.longTerm.map((r) => ({
      ...r,
      track: 'long_term' as const,
      field_tag: r.domain,
    }))
  )
  if (!progression.valid) {
    throw new Error(`Career ladder validation failed: ${progression.issues.join('; ')}`)
  }
  for (const title of output.recommendedPaths.longTerm.map((r) => r.title)) {
    if (isTrainingOrLicence(title)) {
      throw new Error(`Long-Term must not contain training/licence: ${title}`)
    }
  }
  const crossDupes = findCrossColumnDuplicates(
    output.recommendedPaths.workNow.map((r) => ({
      ...r,
      track: 'work_now' as const,
      field_tag: r.domain,
    })),
    output.recommendedPaths.buildNext.map((r) => ({
      ...r,
      track: 'build_next' as const,
      field_tag: r.domain,
    })),
    output.recommendedPaths.longTerm.map((r) => ({
      ...r,
      track: 'long_term' as const,
      field_tag: r.domain,
    }))
  )
  if (crossDupes.length) {
    throw new Error(`Cross-column duplicates: ${crossDupes.join('; ')}`)
  }
  console.log('✓ Journey personalization (summary, next steps, why/now/next, career ladder)')
}

function isFirstJobScenario(s: { name: string; story: string; answers?: Record<string, unknown> }): boolean {
  const a = s.answers ?? {}
  return (
    a.cb_user_goal === 'first_job' ||
    a.cb_entry_situation === 'first_job' ||
    /first job/i.test(s.name) ||
    /first job/i.test(s.story)
  )
}

function run() {
  runEntryFlowChecks()
  runJourneyPersonalizationChecks()
  let passed = 0
  let firstJobPassed = 0
  let firstJobTotal = 0
  const firstJobFailures: string[] = []
  for (const s of SCENARIOS) {
    const isFirstJob = isFirstJobScenario(s)
    if (isFirstJob) firstJobTotal++
    try {
      const state = { path_story: s.story, answers: s.answers ?? {} }
      const profile = enrichCareerProfile(state)
      const { recommendations } = buildFallbackRecommendations(profile, state)
      const output = buildCareerBrainOutput(profile, recommendations, ['dev'], 'fallback', state)
      const workNow = output.recommendedPaths.workNow.map((r) => r.title)
      const buildNext = output.recommendedPaths.buildNext.map((r) => r.title)
      const longTerm = output.recommendedPaths.longTerm.map((r) => r.title)
      const backupIncome = output.recommendedPaths.backupIncome?.map((r) => r.title) ?? []
      const titles = [...workNow, ...buildNext, ...longTerm, ...backupIncome]
      const tracks = { workNow, buildNext, longTerm, backupIncome }
      s.assert(titles, tracks, output)

      const crossDupes =
        profile.constraints.includes('career-change-path') ||
        profile.constraints.includes('grow-career-path')
          ? []
          : findCrossColumnDuplicates(
            output.recommendedPaths.workNow.map((r) => ({ ...r, track: 'work_now' as const, field_tag: r.domain })),
            output.recommendedPaths.buildNext.map((r) => ({ ...r, track: 'build_next' as const, field_tag: r.domain })),
            output.recommendedPaths.longTerm.map((r) => ({ ...r, track: 'long_term' as const, field_tag: r.domain }))
          )
      if (crossDupes.length) {
        throw new Error(`cross-column duplicates — ${crossDupes.join('; ')}`)
      }
      console.log(`✓ ${s.name}`)
      console.log(`  domain=${profile.domain} fieldFirst=${isFieldFirstMode(profile)} skillUnlock=${profile.constraints.includes('skill-unlock-mode')}`)
      console.log(`  workNow=${workNow.join(' | ')}`)
      console.log(`  buildNext=${buildNext.join(' | ')}`)
      console.log(`  longTerm=${longTerm.join(' | ')}`)
      passed++
      if (isFirstJob) firstJobPassed++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (isFirstJob) firstJobFailures.push(`${s.name}: ${msg}`)
      throw err
    }
  }
  console.log(`\n${passed}/${SCENARIOS.length} recommendation scenarios passed`)
  console.log(`\nFirst job scenarios: ${firstJobPassed}/${firstJobTotal} passed`)
  if (firstJobFailures.length) {
    console.log('First job failures:')
    for (const f of firstJobFailures) console.log(`  ✗ ${f}`)
  }
}

run()
