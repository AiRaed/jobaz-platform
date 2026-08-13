/**
 * Canonical qualification taxonomy — Career Knowledge Engine.
 */

export type {
  QualificationGroupId,
  UkQualificationLevel,
  EquivalenceStatus,
  QualificationSemanticKind,
  QualificationTypeId,
  QualificationTypeDef,
  QualificationGroupDef,
  NormalizedQualification,
  ResolveQualificationInput,
} from './types'

export {
  QUALIFICATION_GROUPS,
  getQualificationGroup,
  getQualificationType,
  listQualificationGroupOptions,
  listQualificationTypeOptions,
} from './groups'

export {
  ukLevelRank,
  ukLevelAtLeast,
  formatUkLevelLabel,
  ukLevelToAcademicRank,
} from './uk-level'

export {
  mapLegacyEducationLevel,
  listLegacyEducationLevelKeys,
  resolveNormalizedQualification,
  LEGACY_TO_TAXONOMY,
} from './legacy-adapter'

export {
  academicRequirementToUkLevel,
  academicRequirementToRank,
  type RoleAcademicRequirement,
} from './academic-requirement'

export {
  academicRankFromQualification,
  qualificationSatisfiesAcademicRequirement,
  type QualificationEligibilityResult,
} from './eligibility'

export { isUkCountryHint } from './country'
