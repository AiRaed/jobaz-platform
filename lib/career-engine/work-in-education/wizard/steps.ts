/**
 * Wizard step model — visibility & per-step validation (no matcher).
 */

import {
  answerSuggestsEngineering,
  answerSuggestsLaw,
  answerSuggestsMedicine,
  answerSuggestsNursing,
  answerSuggestsTeaching,
  isNonUkCountry,
} from '../assessment/conditions'
import type { WorkInEducationAssessmentAnswers } from '../assessment/types'

export type WizardStepId =
  | 'education'
  | 'qualification'
  | 'experience'
  | 'registration'
  | 'preferences'
  | 'clarification'
  | 'results'

export type WizardStepDef = {
  id: WizardStepId
  label: string
  shortLabel: string
  /** Included in progress for answer-gathering (not clarification/results). */
  isAnswerStep: boolean
}

export const WIZARD_STEP_DEFS: WizardStepDef[] = [
  { id: 'education', label: 'Education', shortLabel: 'Education', isAnswerStep: true },
  { id: 'qualification', label: 'Qualification', shortLabel: 'Qualification', isAnswerStep: true },
  { id: 'experience', label: 'Experience', shortLabel: 'Experience', isAnswerStep: true },
  {
    id: 'registration',
    label: 'Professional registration',
    shortLabel: 'Registration',
    isAnswerStep: true,
  },
  { id: 'preferences', label: 'Career preferences', shortLabel: 'Preferences', isAnswerStep: true },
  {
    id: 'clarification',
    label: 'One more detail',
    shortLabel: 'Clarify',
    isAnswerStep: false,
  },
  { id: 'results', label: 'Your results', shortLabel: 'Results', isAnswerStep: false },
]

export function shouldShowRegistrationStep(answers: WorkInEducationAssessmentAnswers): boolean {
  if (
    answerSuggestsLaw(answers) &&
    !answerSuggestsNursing(answers) &&
    !answerSuggestsMedicine(answers)
  ) {
    return false
  }
  return (
    answerSuggestsNursing(answers) ||
    answerSuggestsMedicine(answers) ||
    answerSuggestsEngineering(answers) ||
    answerSuggestsTeaching(answers) ||
    isNonUkCountry(answers.qualification_country)
  )
}

export function registrationContext(answers: WorkInEducationAssessmentAnswers) {
  return {
    nursing: answerSuggestsNursing(answers),
    medicine: answerSuggestsMedicine(answers),
    engineering: answerSuggestsEngineering(answers),
    teaching: answerSuggestsTeaching(answers),
    overseas: isNonUkCountry(answers.qualification_country),
    law: answerSuggestsLaw(answers),
  }
}

export function getVisibleAnswerSteps(
  answers: WorkInEducationAssessmentAnswers
): WizardStepId[] {
  const steps: WizardStepId[] = ['education', 'qualification', 'experience']
  if (shouldShowRegistrationStep(answers)) steps.push('registration')
  steps.push('preferences')
  return steps
}

export function validateWizardStep(
  stepId: WizardStepId,
  answers: WorkInEducationAssessmentAnswers
): string[] {
  const errors: string[] = []
  const blank = (v: unknown) => v == null || String(v).trim() === ''

  switch (stepId) {
    case 'education': {
      const hasTaxonomy =
        !blank(answers.qualification_group) && !blank(answers.qualification_type)
      const hasLegacy = !blank(answers.education_level)
      if (!hasTaxonomy && !hasLegacy) {
        errors.push('Please select what type of qualification you have.')
      }
      if (hasTaxonomy === false && blank(answers.education_level)) {
        // already covered
      } else if (!blank(answers.qualification_group) && blank(answers.qualification_type)) {
        errors.push('Please choose the option that best describes your qualification.')
      }
      if (
        answers.qualification_group === 'overseas' &&
        blank(answers.equivalence_status) &&
        blank(answers.uk_recognition_confirmed)
      ) {
        errors.push('Please tell us whether UK equivalence has been confirmed.')
      }
      if (blank(answers.graduation_status)) errors.push('Please select your graduation status.')
      if (answers.graduation_year != null && answers.graduation_year !== undefined) {
        const y = Number(answers.graduation_year)
        if (!Number.isFinite(y) || y < 1950 || y > 2040) {
          errors.push('Enter a valid graduation year.')
        }
      }
      break
    }
    case 'qualification': {
      if (blank(answers.qualification_title)) errors.push('Please enter your qualification title.')
      if (blank(answers.subject)) errors.push('Please enter your main subject.')
      if (blank(answers.qualification_country)) {
        errors.push('Please enter the country where you gained this qualification.')
      }
      break
    }
    case 'experience': {
      const y = Number(answers.years_relevant_experience)
      if (!Number.isFinite(y) || y < 0 || y > 60) {
        errors.push('Enter years of relevant experience (0–60).')
      }
      break
    }
    case 'registration': {
      const ctx = registrationContext(answers)
      if (ctx.nursing || ctx.medicine) {
        if (blank(answers.registration?.has_registration)) {
          errors.push('Please tell us whether you hold professional registration.')
        }
      }
      if (answers.registration?.has_registration === 'yes') {
        if (blank(answers.registration.body) && (ctx.nursing || ctx.medicine)) {
          errors.push(
            ctx.medicine
              ? 'Please enter your registration body (e.g. GMC).'
              : 'Please enter your registration body (e.g. NMC).'
          )
        }
        if (blank(answers.registration.status)) {
          errors.push('Please select your registration status.')
        }
        if (ctx.nursing && blank(answers.registration.scope)) {
          errors.push('Please select your nursing registration branch.')
        }
      }
      if (ctx.overseas && blank(answers.uk_recognition_confirmed)) {
        errors.push('Please tell us whether UK recognition has been confirmed.')
      }
      break
    }
    case 'preferences':
      break
    default:
      break
  }
  return errors
}

export function emptyWizardAnswers(): WorkInEducationAssessmentAnswers {
  return {
    education_level: null,
    qualification_group: null,
    qualification_type: null,
    equivalence_status: null,
    qualification_title: null,
    subject: null,
    specialisation: null,
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    graduation_year: null,
    years_relevant_experience: 0,
    current_job_title: null,
    has_uk_experience: 'unsure',
    registration: {
      has_registration: null,
      body: null,
      status: null,
      scope: null,
    },
    engineering_registration: null,
    qts_status: null,
    uk_recognition_confirmed: null,
    licences: [],
    skills: [],
    english_level: null,
    preferences: {
      related_field_only: 'yes',
      open_to_related_fields: 'yes',
      open_to_retraining: 'unsure',
      academic_route: 'unsure',
    },
  }
}
