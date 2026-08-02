import type { CareerAssessmentProvider } from '../../types'

/**
 * Placeholder for generic local LLM backends (e.g. llama.cpp, custom endpoints).
 */
export function createLocalLLMCareerAssessmentProvider(): CareerAssessmentProvider {
  return {
    id: 'local-llm',
    async generateCareerAssessment() {
      throw new Error(
        'LocalLLMProvider is not configured. Use ruleBasedCareerAssessmentProvider until a local model is enabled.'
      )
    },
  }
}
