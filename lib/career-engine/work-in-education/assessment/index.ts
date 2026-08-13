/**
 * Work in My Education assessment layer (Batch 3).
 */

export { WIE_ASSESSMENT_BLUEPRINT_VERSION } from './types'
export type {
  AssessmentBlueprint,
  AssessmentQuestion,
  AssessmentQuestionType,
  AssessmentRequest,
  AssessmentStatus,
  ClarificationAnswers,
  WorkInEducationAssessmentAnswers,
  WorkInEducationAssessmentResult,
  ProfileMappingResult,
  AssessmentPresentation,
} from './types'

export {
  WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT,
  getWorkInEducationAssessmentBlueprint,
  listVisibleQuestions,
} from './blueprint'

export {
  evaluateShowWhen,
  answerSuggestsNursing,
  answerSuggestsMedicine,
  answerSuggestsLaw,
  answerSuggestsEngineering,
  answerSuggestsTeaching,
  isNonUkCountry,
} from './conditions'

export { validateWorkInEducationAnswers } from './validate-answers'
export { mapWorkInEducationAnswersToProfile } from './map-answers-to-profile'
export { buildAssessmentPresentation } from './build-assessment-result'
export { runWorkInEducationAssessment } from './run-assessment'
export type { AssessmentRunResult } from './run-assessment'
