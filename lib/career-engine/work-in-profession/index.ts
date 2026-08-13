/**
 * Work in My Profession knowledge library (v1).
 * Separate from Work in My Education. Includes course/licence alignment for results.
 */

export type {
  ProfessionalLevelKey,
  ProfessionSeniority,
  ProfessionalLevel,
  ProfessionField,
  ProfessionSpecialism,
  ProfessionRole,
  ProfessionKnowledgeBundle,
  ProfessionLookupSelection,
} from './types'
export { WIP_LIBRARY_VERSION, WIP_STATUS } from './types'
export { PROFESSIONAL_LEVELS, getProfessionalLevel } from './levels'
export { loadProfessionKnowledge, getProfessionLibraryCounts } from './seed'
export {
  dedupeProfessionRoles,
  professionRoleDedupeKey,
  normalizeLicence,
  normalizeRoleTitle,
} from './dedupe'
export {
  PROFESSION_GOAL_OPTIONS,
  DEFAULT_PROFESSION_GOAL,
  getProfessionGoalLabel,
  isProfessionGoalValue,
} from './goals'
export type { ProfessionGoalValue } from './goals'
export {
  matchProfessionLibrary,
  listLevelsForSpecialism,
} from './match-library-path'
export type { MatchProfessionLibraryInput } from './match-library-path'
export type {
  PublicWipMatchResult,
  PublicWipRoleCard,
  WipMatchLabel,
} from './public-contract'
export { WIP_COURSES_PLACEHOLDER, WIP_DEFAULT_RESULT_FRAMING } from './public-contract'
export {
  buildWipTrainingRecommendations,
  findWipCatalogPack,
  allWipCatalogCourseTitles,
  isTitleSafeForWorkInProfession,
  WIP_GOAL,
  WIP_GENERATED_SOURCE,
  WIP_GAP_COURSE_CATALOG,
} from './course-alignment'
export type {
  WipTrainingRecommendations,
  WipTrainingCard,
  WipTrainingCategory,
  WipGapCourseType,
  WipGapCatalogPack,
} from './course-alignment'
export {
  getExperienceQuestionForField,
  getExperienceOption,
  resolveExperienceSelection,
  filterDrivingExperienceOptions,
} from './level-questions'
export type {
  ExperienceQuestionConfig,
  ExperienceOption,
  ExperienceQuestionMode,
  SecurityExperienceProfile,
  CareExperienceProfile,
} from './level-questions'
export {
  listProfessionFields,
  listProfessionalLevels,
  listSpecialismsForField,
  listRoles,
  getProfessionFieldBySlug,
  getProfessionFieldById,
  getSpecialismBySlug,
  lookupProfessionRoles,
} from './lookup'
