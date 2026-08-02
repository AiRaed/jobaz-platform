/**
 * @deprecated Import from `@/lib/jobaz-ai` instead.
 * Re-exports for backward compatibility during migration.
 */
import {
  generateCareerAssessment,
  getCareerAssessmentProvider,
  setCareerAssessmentProvider,
  resetCareerAssessmentProvider,
  type AssessmentAnswers,
  type CareerAssessmentResult,
  type CareerAssessmentProvider,
} from '@/lib/jobaz-ai'

export type CareerPathProvider = (
  answers: AssessmentAnswers
) => Promise<CareerAssessmentResult>

export type { CareerAssessmentProvider }

export const setCareerPathProvider = setCareerAssessmentProvider
export const getCareerPathProvider = getCareerAssessmentProvider
export const resetCareerPathProvider = resetCareerAssessmentProvider

export async function getCareerPathResult(
  answers: AssessmentAnswers
): Promise<CareerAssessmentResult> {
  return generateCareerAssessment(answers)
}
