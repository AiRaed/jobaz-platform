import type { AssessmentAnswers, CareerAssessmentResult } from './careerAssessment'

/**
 * Contract for any JobAZ AI backend (rule-based today, LLM later).
 */
export interface CareerAssessmentProvider {
  readonly id: string
  generateCareerAssessment(input: AssessmentAnswers): Promise<CareerAssessmentResult>
}

export interface JobAZAIProviderRegistry {
  getActiveCareerAssessmentProvider(): CareerAssessmentProvider
  setCareerAssessmentProvider(provider: CareerAssessmentProvider): void
  resetCareerAssessmentProvider(): void
}
