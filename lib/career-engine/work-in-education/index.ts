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
export { QUALITY_GATE_THRESHOLDS, BROAD_SUBJECT_KEYS } from './thresholds'
