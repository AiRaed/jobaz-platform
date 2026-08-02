export {
  buildProfessionInterview,
  getProfessionArchetype,
  resolveExperienceQuestionFlow,
  SPECIALISATION_ARCHETYPE,
} from './professionInterview'
export type { ProfessionArchetype } from './professionInterview'
export {
  analyzeProfession,
  analyzeProfessionSingle,
  getConsultantInsights,
  getCareerProgression,
  getMultiPathReadiness,
  inferExperienceTier,
} from './professionConsultant'
export { resolveCareerProgression, assertJobRoleLadder, isComplianceStep } from './careerProgression'
export {
  normalizeExperienceAnswers,
  shouldAskExperienceQuestion,
  isExperienceAnswersComplete,
} from './interviewDedup'
export {
  analyzeProfessionContext,
  generateDynamicInterviewQuestions,
  mergeProfessionContexts,
  contextToSkills,
} from './dynamicProfessionAnalysis'
export type { ProfessionContext } from './dynamicProfessionAnalysis'
export {
  applyCertificationInference,
  hasQualifiedProfessionalCert,
  parseCertificationStatuses,
} from '@/lib/career-engine/shared/assessmentMultiSelect'
export {
  parseExperienceSpecialisations,
  parseMultiSelectValue,
  joinMultiSelectValue,
  isMultiSelectQuestion,
  MULTI_SELECT_HELPER,
  hasMultipleSpecialisations,
} from './multiSelect'
