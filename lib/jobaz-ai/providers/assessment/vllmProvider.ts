import type { CareerAssessmentProvider } from '../../types'

/**
 * Placeholder for vLLM integration (high-throughput local inference).
 */
export function createVLLMCareerAssessmentProvider(): CareerAssessmentProvider {
  return {
    id: 'vllm',
    async generateCareerAssessment() {
      throw new Error(
        'VLLMProvider is not configured. Use ruleBasedCareerAssessmentProvider until vLLM is enabled.'
      )
    },
  }
}
