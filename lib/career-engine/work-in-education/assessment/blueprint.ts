/**
 * Work in My Education assessment blueprint v1 (typed config).
 * Ready for later Career Library → Assessment Blueprint Admin CRUD.
 */

import type { AssessmentBlueprint, AssessmentQuestion, WorkInEducationAssessmentAnswers } from './types'
import { WIE_ASSESSMENT_BLUEPRINT_VERSION } from './types'
import { evaluateShowWhen } from './conditions'

const q = (
  partial: Omit<AssessmentQuestion, 'help_text'> & { help_text?: string }
): AssessmentQuestion => ({
  help_text: partial.help_text ?? '',
  ...partial,
})

export const WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT: AssessmentBlueprint = {
  version: WIE_ASSESSMENT_BLUEPRINT_VERSION,
  pathway: 'work_in_my_education',
  name: 'Work in My Education — Assessment v1',
  active: true,
  created_at: '2026-08-03T00:00:00.000Z',
  readiness_notes: [
    'Typed config blueprint — not yet Admin CRUD.',
    'Separate from career_library_questions report-rule blueprint seed.',
    'Stable question IDs allow future DB migration without remapping answers.',
    'Public Career Assistant not connected.',
  ],
  questions: [
    q({
      id: 'wie_q_education_level',
      key: 'education_level',
      label: 'Qualification level (legacy / derived)',
      help_text:
        'Derived from the canonical qualification taxonomy. Legacy values still accepted.',
      type: 'single_select',
      required: false,
      sort_order: 10,
      maps_to: 'education_level',
      options: [
        { value: 'college_or_diploma', label: 'College / diploma (legacy)' },
        { value: 'bachelor', label: 'Bachelor’s degree' },
        { value: 'master', label: 'Master’s degree' },
        { value: 'doctorate', label: 'Doctorate / PhD' },
        { value: 'professional_qualification', label: 'Professional qualification (legacy)' },
        { value: 'other', label: 'Other' },
        { value: 'college', label: 'College (canonical)' },
        { value: 'professional', label: 'Professional (canonical)' },
      ],
    }),
    q({
      id: 'wie_q_qualification_group',
      key: 'qualification_group',
      label: 'What type of qualification do you have?',
      help_text: 'Canonical taxonomy group — wizard shows contextual sub-types.',
      type: 'single_select',
      required: false,
      sort_order: 11,
      maps_to: 'qualification_group',
      options: [
        { value: 'no_formal', label: 'No formal qualification' },
        { value: 'school', label: 'School-level qualification' },
        { value: 'college_vocational', label: 'College / vocational qualification' },
        { value: 'undergraduate', label: 'Undergraduate qualification' },
        { value: 'postgraduate', label: 'Postgraduate qualification' },
        { value: 'doctoral', label: 'Doctoral qualification' },
        { value: 'professional', label: 'Professional qualification or licence' },
        { value: 'overseas', label: 'Overseas qualification' },
        { value: 'other_unsure', label: 'Other / unsure' },
      ],
    }),
    q({
      id: 'wie_q_qualification_type',
      key: 'qualification_type',
      label: 'Qualification sub-type',
      help_text: 'Contextual type within the selected group (e.g. HNC, PGCE, Bachelor’s).',
      type: 'text',
      required: false,
      sort_order: 12,
      maps_to: 'qualification_type',
    }),
    q({
      id: 'wie_q_qualification_title',
      key: 'qualification_title',
      label: 'Qualification title',
      help_text: 'e.g. BEng Civil Engineering, MSc Animation, MBBS, LLB, BSc Adult Nursing',
      type: 'text',
      required: true,
      sort_order: 20,
      maps_to: 'qualification_title',
      validation: { max_length: 240 },
    }),
    q({
      id: 'wie_q_subject',
      key: 'subject',
      label: 'Main subject',
      help_text: 'The main subject of your qualification (e.g. Civil Engineering, Law, Nursing).',
      type: 'text',
      required: true,
      sort_order: 30,
      maps_to: 'subject',
      validation: { max_length: 240 },
    }),
    q({
      id: 'wie_q_specialisation',
      key: 'specialisation',
      label: 'Specialisation (optional)',
      help_text: 'Add a specialisation if you have one (e.g. Commercial Law, 3D Animation).',
      type: 'text',
      required: false,
      sort_order: 40,
      maps_to: 'specialisation',
      validation: { max_length: 240 },
    }),
    q({
      id: 'wie_q_qualification_country',
      key: 'qualification_country',
      label: 'Country where you gained this qualification',
      type: 'country',
      required: true,
      sort_order: 50,
      maps_to: 'qualification_country',
    }),
    q({
      id: 'wie_q_graduation_status',
      key: 'graduation_status',
      label: 'Graduation status',
      type: 'single_select',
      required: true,
      sort_order: 60,
      maps_to: 'graduation_status',
      options: [
        { value: 'completed', label: 'Completed' },
        { value: 'studying', label: 'Currently studying' },
        { value: 'incomplete', label: 'Incomplete / did not finish' },
      ],
    }),
    q({
      id: 'wie_q_graduation_year',
      key: 'graduation_year',
      label: 'Graduation year (or expected)',
      type: 'year',
      required: false,
      sort_order: 70,
      maps_to: 'graduation_year',
      validation: { min: 1950, max: 2040 },
      show_when: {
        logic: 'or',
        conditions: [
          { answer_key: 'graduation_status', operator: 'equals', expected_value: 'completed' },
          { answer_key: 'graduation_status', operator: 'equals', expected_value: 'studying' },
        ],
      },
    }),
    q({
      id: 'wie_q_years_experience',
      key: 'years_relevant_experience',
      label: 'Years of relevant experience',
      help_text: 'Experience related to this qualification or target career.',
      type: 'number',
      required: true,
      sort_order: 80,
      maps_to: 'years_relevant_experience',
      validation: { min: 0, max: 60 },
    }),
    q({
      id: 'wie_q_job_title',
      key: 'current_job_title',
      label: 'Current or most recent related job title (optional)',
      type: 'text',
      required: false,
      sort_order: 90,
      maps_to: 'current_job_title',
      validation: { max_length: 160 },
    }),
    q({
      id: 'wie_q_uk_experience',
      key: 'has_uk_experience',
      label: 'Do you have UK work experience?',
      type: 'single_select',
      required: false,
      sort_order: 100,
      maps_to: 'has_uk_experience',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
    }),
    q({
      id: 'wie_q_has_registration',
      key: 'registration.has_registration',
      label: 'Do you hold a professional registration relevant to this pathway?',
      type: 'single_select',
      required: false,
      sort_order: 110,
      maps_to: 'registration.has_registration',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
      show_when: {
        logic: 'or',
        conditions: [
          { answer_key: 'subject', operator: 'contains', expected_value: 'nurs' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'nurs' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'medicine' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'mbbs' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'law' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'llb' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'engineer' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'beng' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'teach' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'midwif' },
        ],
      },
    }),
    q({
      id: 'wie_q_registration_body',
      key: 'registration.body',
      label: 'Registration body',
      help_text: 'e.g. NMC, GMC, SRA, Engineering Council / ICE',
      type: 'text',
      required: false,
      sort_order: 120,
      maps_to: 'registration.body',
      show_when: {
        logic: 'and',
        conditions: [
          { answer_key: 'registration.has_registration', operator: 'equals', expected_value: 'yes' },
        ],
      },
    }),
    q({
      id: 'wie_q_registration_status',
      key: 'registration.status',
      label: 'Registration status',
      type: 'single_select',
      required: false,
      sort_order: 130,
      maps_to: 'registration.status',
      options: [
        { value: 'registered', label: 'Registered / active' },
        { value: 'pending', label: 'Pending / in progress' },
        { value: 'expired', label: 'Expired' },
        { value: 'none', label: 'None' },
      ],
      show_when: {
        logic: 'and',
        conditions: [
          { answer_key: 'registration.has_registration', operator: 'equals', expected_value: 'yes' },
        ],
      },
    }),
    q({
      id: 'wie_q_nursing_scope',
      key: 'registration.scope',
      label: 'NMC registration part / nursing branch',
      type: 'single_select',
      required: false,
      sort_order: 140,
      maps_to: 'registration.scope',
      options: [
        { value: 'adult_nursing', label: 'Adult nursing' },
        { value: 'mental_health_nursing', label: 'Mental health nursing' },
        { value: 'childrens_nursing', label: 'Children’s nursing' },
        { value: 'learning_disability_nursing', label: 'Learning disability nursing' },
        { value: 'midwifery', label: 'Midwifery' },
        { value: 'nursing_associate', label: 'Nursing associate' },
        { value: 'unknown', label: 'Not sure / unknown' },
      ],
      show_when: {
        logic: 'and',
        conditions: [
          { answer_key: 'registration.has_registration', operator: 'equals', expected_value: 'yes' },
          {
            answer_key: 'subject',
            operator: 'contains',
            expected_value: 'nurs',
          },
        ],
      },
    }),
    q({
      id: 'wie_q_engineering_registration',
      key: 'engineering_registration',
      label: 'Engineering professional registration (if any)',
      type: 'single_select',
      required: false,
      sort_order: 150,
      maps_to: 'engineering_registration',
      options: [
        { value: 'ceng', label: 'CEng' },
        { value: 'ieng', label: 'IEng' },
        { value: 'engtech', label: 'EngTech' },
        { value: 'none', label: 'None' },
        { value: 'unknown', label: 'Unknown' },
      ],
      show_when: {
        logic: 'or',
        conditions: [
          { answer_key: 'subject', operator: 'contains', expected_value: 'engineer' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'beng' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'meng' },
        ],
      },
    }),
    q({
      id: 'wie_q_qts',
      key: 'qts_status',
      label: 'Do you hold QTS (Qualified Teacher Status)?',
      type: 'single_select',
      required: false,
      sort_order: 160,
      maps_to: 'qts_status',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'working_towards', label: 'Working towards' },
        { value: 'unknown', label: 'Unsure' },
      ],
      show_when: {
        logic: 'or',
        conditions: [
          { answer_key: 'subject', operator: 'contains', expected_value: 'teach' },
          { answer_key: 'subject', operator: 'contains', expected_value: 'education' },
          { answer_key: 'qualification_title', operator: 'contains', expected_value: 'pgce' },
        ],
      },
    }),
    q({
      id: 'wie_q_uk_recognition',
      key: 'uk_recognition_confirmed',
      label: 'Has UK recognition of this overseas qualification been confirmed?',
      type: 'single_select',
      required: false,
      sort_order: 170,
      maps_to: 'uk_recognition_confirmed',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
      show_when: {
        logic: 'and',
        conditions: [
          { answer_key: 'qualification_country', operator: 'not_in', expected_value: ['United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland'] },
        ],
      },
    }),
    q({
      id: 'wie_q_licences',
      key: 'licences',
      label: 'Relevant licences (optional)',
      help_text: 'Comma-separated if entering as text later; multi values supported.',
      type: 'skill_list',
      required: false,
      sort_order: 180,
      maps_to: 'licences',
    }),
    q({
      id: 'wie_q_skills',
      key: 'skills',
      label: 'Key skills (optional)',
      type: 'skill_list',
      required: false,
      sort_order: 190,
      maps_to: 'skills',
    }),
    q({
      id: 'wie_q_english',
      key: 'english_level',
      label: 'English level (optional)',
      type: 'single_select',
      required: false,
      sort_order: 200,
      maps_to: 'english_level',
      options: [
        { value: 'native', label: 'Native / bilingual' },
        { value: 'fluent', label: 'Fluent' },
        { value: 'professional', label: 'Professional working' },
        { value: 'conversational', label: 'Conversational' },
        { value: 'basic', label: 'Basic' },
      ],
    }),
    q({
      id: 'wie_q_pref_related',
      key: 'preferences.related_field_only',
      label: 'Prefer roles closely related to your qualification?',
      type: 'single_select',
      required: false,
      sort_order: 210,
      maps_to: 'preferences.related_field_only',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
    }),
    q({
      id: 'wie_q_pref_open_related',
      key: 'preferences.open_to_related_fields',
      label: 'Open to related fields?',
      type: 'single_select',
      required: false,
      sort_order: 220,
      maps_to: 'preferences.open_to_related_fields',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
    }),
    q({
      id: 'wie_q_pref_retrain',
      key: 'preferences.open_to_retraining',
      label: 'Open to retraining?',
      type: 'single_select',
      required: false,
      sort_order: 230,
      maps_to: 'preferences.open_to_retraining',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
    }),
    q({
      id: 'wie_q_pref_academic',
      key: 'preferences.academic_route',
      label: 'Interested in academic / research routes?',
      type: 'single_select',
      required: false,
      sort_order: 240,
      maps_to: 'preferences.academic_route',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
        { value: 'unsure', label: 'Unsure' },
      ],
      show_when: {
        logic: 'or',
        conditions: [
          { answer_key: 'education_level', operator: 'equals', expected_value: 'doctorate' },
          { answer_key: 'education_level', operator: 'equals', expected_value: 'master' },
          { answer_key: 'preferences.academic_route', operator: 'equals', expected_value: 'yes' },
        ],
      },
    }),
  ],
}

export function getWorkInEducationAssessmentBlueprint(
  version?: string
): AssessmentBlueprint | null {
  if (!version || version === WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.version) {
    return WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT
  }
  return null
}

export function listVisibleQuestions(
  answers: WorkInEducationAssessmentAnswers,
  blueprint: AssessmentBlueprint = WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT
): AssessmentQuestion[] {
  return blueprint.questions
    .filter((question) => evaluateShowWhen(question.show_when, answers))
    .sort((a, b) => a.sort_order - b.sort_order)
}
