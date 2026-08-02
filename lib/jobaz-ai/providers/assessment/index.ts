import type { AssessmentAnswers, CareerAssessmentProvider, CareerAssessmentResult } from '../../types'
import { ruleBasedCareerAssessmentProvider } from './ruleBasedProvider'

let activeProvider: CareerAssessmentProvider = ruleBasedCareerAssessmentProvider

/**
 * Career assessment entry — delegates to the active assessment provider.
 *
 * Frontend → generateCareerAssessment → Provider → Engine → Result
 */
export async function generateCareerAssessment(
  input: AssessmentAnswers
): Promise<CareerAssessmentResult> {
  return activeProvider.generateCareerAssessment(input)
}

export function getCareerAssessmentProvider(): CareerAssessmentProvider {
  return activeProvider
}

export function setCareerAssessmentProvider(provider: CareerAssessmentProvider): void {
  activeProvider = provider
}

export function resetCareerAssessmentProvider(): void {
  activeProvider = ruleBasedCareerAssessmentProvider
}

export { ruleBasedCareerAssessmentProvider } from './ruleBasedProvider'
export { createOllamaCareerAssessmentProvider } from './ollamaProvider'
export { createLocalLLMCareerAssessmentProvider } from './localLLMProvider'
export { createVLLMCareerAssessmentProvider } from './vllmProvider'
