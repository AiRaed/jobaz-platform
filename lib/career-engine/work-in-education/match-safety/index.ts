export {
  classifyStageBand,
  STAGE_BAND_RANK,
  stageBandAllowsImmediate,
  type StageBand,
} from './stage-bands'

export {
  detectRoleBlockers,
  type BlockerKind,
  type DetectedBlocker,
  type BlockerInput,
} from './blockers'

export {
  classifyRoleSafety,
  safetyTypeToEffectiveFit,
  type SafetyMatchType,
  type SafetyClassification,
  type ClassifyContext,
} from './classify-role'

export {
  friendlyRewrite,
  blockerToFriendly,
  matchTypeLabel,
  matchTypeBucketCopy,
} from './friendly-copy'

export { applyMatchSafety, type SafetyApplyOptions } from './apply-safety'

export {
  classifyWieFieldFamily,
  fieldFamilyAllowsProfessionalRegistrationLanguage,
  isHardRegulatedRoleTitle,
  softRequirementWarning,
  type WieFieldFamily,
} from './field-families'

export {
  polishHumanitiesRoleTitle,
  shouldDeprioritiseCareCourseForHss,
  isHumanitiesSocialSciencesRoute,
  isHumanitiesLeadOrSeniorTitle,
} from './humanities-polish'

export { polishWieRoleTitle, isLeadOrSeniorTitle } from './role-title-polish'

export { shouldDeprioritiseCareCourseForRoute } from './course-field-gates'

export {
  runWieSanityAudit,
  formatWieSanityAuditMarkdown,
  WIE_SANITY_PERSONAS,
} from './audit-sanity'

export {
  dedupePublicLines,
  polishPublicRoleCopy,
  demoteImmediateMatchType,
  FUTURE_ROUTE_SOFT_LINE,
  textBlocksBestImmediate,
} from './public-card-polish'
