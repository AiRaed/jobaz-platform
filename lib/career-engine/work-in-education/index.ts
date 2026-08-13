/**
 * Work in My Education — public module exports.
 */

export type {
  WorkInEducationProfile,
  WorkInEducationMatchResult,
  NormalisedWorkInEducationProfile,
  RoleEligibilityResult,
  FieldSpecialismResolution,
  MatchOptions,
  EffectiveFit,
  EligibilityStatus,
} from './types'
export { DEFAULT_MATCH_LIMITS } from './types'
export { validateWorkInEducationProfile } from './validate'
export { normaliseWorkInEducationProfile } from './normalise'
export { SEED_ALIASES, buildAliasIndex, resolveAlias, aliasKey } from './aliases'
export {
  resolveFieldAndSpecialism,
  DEFAULT_CONFIDENCE_THRESHOLD,
  isBroadSubject,
  hasDiscriminatingSpecialisation,
} from './resolve-field'
export { evaluateRoleEligibility } from './evaluate-eligibility'
export { evaluateQualificationScope, resolveProfileNursingScope } from './qualification-scope'
export { evaluateProfessionalStageGate } from './professional-stage-gate'
export { rankAndBucketRoles, scoreRoleMatch } from './rank-roles'
export { matchWorkInEducation } from './match'
export { matchLibraryPath } from './match-library-path'
export {
  loadLibraryFields,
  loadLibrarySpecialismsForField,
  loadLibraryStagesForSpecialism,
} from './library-browse'
export { QUALITY_GATE_THRESHOLDS, BROAD_SUBJECT_KEYS } from './thresholds'

/** Canonical qualification taxonomy (shared with wizard / eligibility) */
export {
  QUALIFICATION_GROUPS,
  resolveNormalizedQualification,
  mapLegacyEducationLevel,
  formatUkLevelLabel,
  listQualificationGroupOptions,
  listQualificationTypeOptions,
} from '@/lib/career-engine/qualification-taxonomy'
export type {
  NormalizedQualification,
  QualificationGroupId,
  UkQualificationLevel,
} from '@/lib/career-engine/qualification-taxonomy'

export {
  runWorkInEducationAssessment,
  mapWorkInEducationAnswersToProfile,
  validateWorkInEducationAnswers,
  WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT,
  WIE_ASSESSMENT_BLUEPRINT_VERSION,
  listVisibleQuestions,
  getWorkInEducationAssessmentBlueprint,
} from './assessment'
export type {
  AssessmentRequest,
  WorkInEducationAssessmentAnswers,
  WorkInEducationAssessmentResult,
  ClarificationAnswers,
} from './assessment'

export {
  getVisibleAnswerSteps,
  shouldShowRegistrationStep,
  validateWizardStep,
  emptyWizardAnswers,
  confidenceLabel,
  fitLabel,
  fitSectionTitle,
  buildRoleWhyItems,
} from './wizard'
export type { WizardStepId, WizardSessionState } from './wizard'

export {
  WIE_KNOWLEDGE_ENGINE_FLAG,
  isWieKnowledgeEngineEnvEnabled,
  resolveWieKnowledgeEngineEnabled,
} from './feature-flag'
export { buildPublicWieAssessmentResult } from './public-contract'
export type { PublicWieAssessmentResult, PublicRoleCard } from './public-contract'
export { mintWieResultToken, verifyWieResultToken } from './result-token'
export { limitClarificationOptions } from './clarification-limit'
