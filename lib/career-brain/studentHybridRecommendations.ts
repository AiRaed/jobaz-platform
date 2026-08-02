/**
 * Student hybrid recommendations — studies + experience + intent combined.
 */

import { isFieldAlignmentNo } from './fieldAlignment'
import type { CareerBrainRecommendation, CareerProfile } from './types'
import { inferStudentStudyDomain } from './studentPath'
import { inferExperienceCategory } from './studentExperience'
import { rec } from './resultBuilder'

const ANIM_RETAIL_BRIDGE: CareerBrainRecommendation[] = [
  rec(
    'Retail assistant (part-time)',
    'Work Now — your retail experience gives quick part-time income while studying',
    'work_now',
    'retail_customer_service'
  ),
  rec(
    'Social media content assistant',
    'Build Next — bridge retail communication skills into media/creative work',
    'build_next',
    'creative_media'
  ),
  rec(
    'Video editing assistant',
    'Build Next — grow creative portfolio alongside study',
    'build_next',
    'creative_media'
  ),
  rec('Motion graphics intern', 'Long-term — creative career after portfolio', 'long_term', 'animation_design'),
]

const BUSINESS_RETAIL_CONTINUE: CareerBrainRecommendation[] = [
  rec(
    'Sales assistant / senior retail',
    'Work Now — continue momentum in customer-facing retail',
    'work_now',
    'retail_customer_service'
  ),
  rec(
    'Customer success associate',
    'Build Next — progression from retail into business customer roles',
    'build_next',
    'retail_customer_service'
  ),
  rec('Team supervisor (retail)', 'Build Next — leadership path in retail operations', 'build_next', 'retail_customer_service'),
  rec('Operations coordinator', 'Long-term — retail into operations', 'long_term', 'admin_business'),
]

const BUSINESS_RETAIL_PIVOT: CareerBrainRecommendation[] = [
  rec(
    'Admin assistant (part-time)',
    'Work Now — pivot retail skills into office/admin support',
    'work_now',
    'admin_business'
  ),
  rec(
    'Junior marketing assistant',
    'Build Next — business study + customer exposure suits marketing entry',
    'build_next',
    'IT_digital'
  ),
  rec('Operations support', 'Build Next — behind-the-scenes business operations', 'build_next', 'admin_business'),
  rec('Business analyst trainee', 'Long-term — business degree progression', 'long_term', 'admin_business'),
]

const MEDIA_HOSPITALITY_BRIDGE: CareerBrainRecommendation[] = [
  rec('Barista / hospitality (part-time)', 'Work Now — continue hospitality for flexible income', 'work_now', 'hospitality'),
  rec('Events assistant', 'Build Next — hospitality + media study fit events/social', 'build_next', 'creative_media'),
  rec('Social media coordinator', 'Build Next — customer engagement + content', 'build_next', 'creative_media'),
  rec('Content producer', 'Long-term — media career growth', 'long_term', 'creative_media'),
]

const BUSINESS_CS_CONTINUE: CareerBrainRecommendation[] = [
  rec('Customer service advisor (part-time)', 'Work Now — build on service experience', 'work_now', 'retail_customer_service'),
  rec('Customer support (digital)', 'Build Next — remote-friendly student role', 'build_next', 'retail_customer_service'),
  rec('Junior operations assistant', 'Build Next — operations pathway', 'build_next', 'admin_business'),
  rec('Team leader (customer service)', 'Long-term — supervision route', 'long_term', 'retail_customer_service'),
]

export function buildStudentHybridRecommendations(
  profile: CareerProfile,
  state?: import('./types').CareerBrainState
): { recommendations: CareerBrainRecommendation[]; reason: string } | null {
  if (!profile.constraints.includes('student')) return null
  if (profile.constraints.includes('flexible-employment-mode')) return null
  if (profile.constraints.includes('deprioritise-study-alignment')) return null
  if (isFieldAlignmentNo(state ?? { answers: {} })) return null

  const studyDomain = inferStudentStudyDomain(profile.studyField ?? '')
  const expCat = inferExperienceCategory(profile.workExperienceField ?? '')
  const continueExp = profile.constraints.includes('student-continue-exp')
  const pivotExp = profile.constraints.includes('student-pivot-exp')

  if (studyDomain === 'creative' && expCat === 'retail') {
    return {
      recommendations: ANIM_RETAIL_BRIDGE,
      reason: 'Student hybrid: animation study + retail experience → income + creative bridge',
    }
  }

  if (studyDomain === 'business' && expCat === 'retail' && continueExp) {
    return {
      recommendations: BUSINESS_RETAIL_CONTINUE,
      reason: 'Student hybrid: business study + retail + continue → customer/retail progression',
    }
  }

  if (studyDomain === 'business' && expCat === 'retail' && pivotExp) {
    return {
      recommendations: BUSINESS_RETAIL_PIVOT,
      reason: 'Student hybrid: business study + retail + pivot → admin/marketing/operations',
    }
  }

  if (studyDomain === 'media' && expCat === 'hospitality') {
    return {
      recommendations: MEDIA_HOSPITALITY_BRIDGE,
      reason: 'Student hybrid: media study + hospitality → events/social/content',
    }
  }

  if (studyDomain === 'business' && expCat === 'customer_service' && continueExp) {
    return {
      recommendations: BUSINESS_CS_CONTINUE,
      reason: 'Student hybrid: business + customer service experience',
    }
  }

  return null
}
