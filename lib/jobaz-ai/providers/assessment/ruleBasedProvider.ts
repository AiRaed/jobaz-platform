import { runCareerAssessmentEngine } from '../../engines/careerAssessmentEngine'
import type { CareerAssessmentProvider } from '../../types'

/**
 * Default JobAZ AI provider — local rule-based logic structured like an AI backend.
 */
export const ruleBasedCareerAssessmentProvider: CareerAssessmentProvider = {
  id: 'rule-based',
  async generateCareerAssessment(input) {
    return runCareerAssessmentEngine(input)
  },
}
