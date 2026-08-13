export {
  fitLabel,
  fitSectionTitle,
  eligibilityBadge,
  confidenceLabel,
  nextActionTypeLabel,
} from './labels'
export { buildRoleWhyItems, buildFitLeadIn } from './explain-why'
export type { WhyItem } from './explain-why'
export {
  WIZARD_STEP_DEFS,
  shouldShowRegistrationStep,
  registrationContext,
  getVisibleAnswerSteps,
  validateWizardStep,
  emptyWizardAnswers,
} from './steps'
export type { WizardStepId, WizardStepDef } from './steps'
export {
  WIZARD_SESSION_KEY,
  PUBLIC_RESULT_SESSION_KEY,
  createEmptyWizardSession,
  loadWizardSession,
  saveWizardSession,
  clearWizardSession,
  savePublicResultHandoff,
  loadPublicResultHandoff,
  clearPublicResultHandoff,
} from './session'
export type { WizardSessionState } from './session'
export {
  WIE_TRAINING_CV_HANDOFF_KEY,
  WIE_TRAINING_PLAN_HANDOFF_KEY,
  saveWieTrainingHandoffs,
  loadWieTrainingCvHandoff,
  loadWieTrainingPlanHandoff,
} from './training-handoff'
export type { WieTrainingCvHandoff, WieTrainingPlanHandoff } from './training-handoff'
