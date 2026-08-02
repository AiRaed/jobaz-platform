import type { CareerAssessmentProvider } from '../../types'

/**
 * Placeholder for Ollama-backed career assessment.
 * Wire when JobAZ connects assessment flows to the centralized text provider.
 */
export function createOllamaCareerAssessmentProvider(): CareerAssessmentProvider {
  return {
    id: 'ollama',
    async generateCareerAssessment() {
      throw new Error(
        'OllamaCareerAssessmentProvider is not configured. Use ruleBasedCareerAssessmentProvider until Ollama assessment is enabled.'
      )
    },
  }
}
