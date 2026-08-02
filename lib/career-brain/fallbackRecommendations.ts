/**
 * Domain-aware fallback — never random generic jobs for specialists.
 */

import type { CareerBrainRecommendation, CareerProfile } from './types'
import { isFieldFirstMode } from './domains'
import { isFieldOnlyLock } from './careerTrackLock'
import { rec, filterFieldFirstRecs } from './resultBuilder'
import { getDeterministicCareerRecommendations } from './pathwayRecommendations'
import { buildBridgeRoleRecommendations, wantsBridgeRoleDiscovery } from './bridgeRoleIntelligence'
import { buildDualPathRecommendations, wantsDualPathMode } from './dualPathMode'
import {
  buildFlexibleEmploymentRecommendations,
  wantsFlexibleEmploymentMode,
} from './flexibleEmploymentMode'
import { isFieldAlignmentNo } from './fieldAlignment'
import { buildStudentHybridRecommendations } from './studentHybridRecommendations'
import { buildItExperienceRecommendations, hasItTechnologyExperience } from './itExperiencePath'
import { getCareerChangeDeterministicResult } from './careerChangeIntelligence'
import { isCareerChangePath, isCareerChangePathComplete } from './careerChangePath'
import { getGrowCareerDeterministicResult } from './growCareerIntelligence'
import { isGrowCareerPath, isGrowCareerPathComplete } from './growCareerPath'
import type { CareerBrainState } from './types'

const ANIMATION_PACK: CareerBrainRecommendation[] = [
  rec('Junior Animator', 'Matches animation tools and creative background', 'work_now', 'animation_design'),
  rec('Motion Designer', 'Uses After Effects / motion graphics skills', 'work_now', 'animation_design'),
  rec('Video Editor', 'Adjacent creative hire with faster onboarding', 'work_now', 'creative_media'),
  rec('3D Artist Assistant', 'Builds on Maya / Blender experience', 'build_next', 'animation_design'),
  rec('Content Designer', 'Digital teams need motion + static content', 'build_next', 'creative_media'),
  rec('Creative Studio Assistant', 'Studio route while growing showreel', 'build_next', 'creative_media'),
  rec('Lead Motion Designer', 'Long-term target with strong portfolio', 'long_term', 'animation_design'),
  rec('Warehouse operative', 'Backup income only — not your main path', 'backup_income', 'retail_customer_service'),
]

const DRIVING_PACK: CareerBrainRecommendation[] = [
  rec('Delivery driver', 'Direct use of driving experience in the UK', 'work_now', 'driving_logistics'),
  rec('Courier / parcel driver', 'High demand; short onboarding', 'work_now', 'driving_logistics'),
  rec('Private hire driver', 'Builds on taxi / passenger experience', 'work_now', 'driving_logistics'),
  rec('Customer service advisor', 'Transferable people skills from driving', 'build_next', 'retail_customer_service'),
  rec('Logistics coordinator', 'Progression from driving roles', 'long_term', 'driving_logistics'),
]

const ACCOUNTING_CHANGE_PACK: CareerBrainRecommendation[] = [
  rec('Accounts payable assistant', 'Uses accounting study while you pivot', 'work_now', 'finance_accounting'),
  rec('Bookkeeping assistant', 'Short-term finance role during transition', 'work_now', 'finance_accounting'),
  rec('Digital marketing assistant', 'Common pivot with short UK courses', 'build_next', 'IT_digital'),
  rec('Business support administrator', 'Office skills bridge during change', 'build_next', 'admin_business'),
  rec('Junior data analyst', 'Long-term pivot with Excel/SQL training', 'long_term', 'IT_digital'),
]

const OFFICE_CHANGE_PACK: CareerBrainRecommendation[] = [
  rec('Admin assistant', 'Office admin entry — matches pivot from driving/service work', 'work_now', 'admin_business'),
  rec('Receptionist', 'Front-desk office role with customer contact', 'work_now', 'admin_business'),
  rec('Customer support advisor', 'Phone/email support using people skills from driving', 'build_next', 'retail_customer_service'),
  rec('Data entry clerk', 'Structured office work when computer skills are basic', 'build_next', 'admin_business'),
  rec('Business support administrator', 'Longer-term office progression', 'long_term', 'admin_business'),
]

const ENTRY_PACK: CareerBrainRecommendation[] = [
  rec('Retail assistant', 'Common first UK job; flexible hours', 'work_now', 'retail_customer_service'),
  rec('Warehouse operative', 'High-volume hiring for new starters', 'work_now', 'retail_customer_service'),
  rec('Kitchen porter', 'Hospitality entry with quick starts', 'work_now', 'hospitality'),
  rec('Customer service advisor', 'Builds communication and UK work history', 'build_next', 'retail_customer_service'),
  rec('Team supervisor', 'Progression after reliable track record', 'long_term', 'retail_customer_service'),
]

const WAREHOUSE_GROWTH_PACK: CareerBrainRecommendation[] = [
  rec('Warehouse operative', 'Matches your warehouse experience — realistic Work Now', 'work_now', 'retail_customer_service'),
  rec('Picker/packer', 'Common next step in distribution centres', 'work_now', 'retail_customer_service'),
  rec('Forklift operator', 'Build Next — FLT licence opens higher pay', 'build_next', 'driving_logistics'),
  rec('Team leader (warehouse)', 'Supervisor path after reliability and training', 'build_next', 'retail_customer_service'),
  rec('Logistics coordinator', 'Long-term office/logistics progression', 'long_term', 'driving_logistics'),
]

const NO_EXP_PHYSICAL_PACK: CareerBrainRecommendation[] = [
  rec('Warehouse operative', 'Physical work; weak English less of a barrier', 'work_now', 'retail_customer_service'),
  rec('Cleaner (commercial)', 'Often hires quickly; practical tasks', 'work_now', 'retail_customer_service'),
  rec('Kitchen porter', 'Back-of-house entry role', 'work_now', 'hospitality'),
  rec('Forklift trainee', 'Build Next — short FLT course if willing to train', 'build_next', 'driving_logistics'),
  rec('Team supervisor', 'Long-term after UK work history', 'long_term', 'retail_customer_service'),
]

const NO_EXP_DRIVING_PACK: CareerBrainRecommendation[] = [
  rec('Delivery driver', 'Licence + urgent income fit', 'work_now', 'driving_logistics'),
  rec('Courier / parcel driver', 'High demand; quick onboarding', 'work_now', 'driving_logistics'),
  rec('Warehouse operative', 'Backup if delivery roles are competitive', 'backup_income', 'retail_customer_service'),
  rec('Customer service advisor', 'Build Next — less physical', 'build_next', 'retail_customer_service'),
]

const URGENT_PACK: CareerBrainRecommendation[] = [
  rec('Warehouse operative', 'Fast hiring when income is urgent', 'work_now', 'retail_customer_service'),
  rec('Delivery driver', 'Quick start if you have a licence', 'work_now', 'driving_logistics'),
  rec('Cleaner (commercial)', 'Often hires within days', 'work_now', 'retail_customer_service'),
]

const STUDENT_CREATIVE_PART_TIME: CareerBrainRecommendation[] = [
  rec('Video editing assistant', 'Part-time creative work aligned with media/animation study', 'work_now', 'creative_media'),
  rec('Social media content assistant', 'Flexible digital work for students', 'work_now', 'creative_media'),
  rec('Production assistant (part-time)', 'Studio support while building portfolio', 'work_now', 'creative_media'),
  rec('Motion graphics intern', 'Build Next — junior creative route', 'build_next', 'animation_design'),
  rec('Junior motion designer', 'Long-term after portfolio grows', 'long_term', 'animation_design'),
]

const STUDENT_IT_PART_TIME: CareerBrainRecommendation[] = [
  rec('IT support assistant (part-time)', 'Entry tech role while studying computing', 'work_now', 'IT_digital'),
  rec('QA tester (part-time)', 'Common student-friendly tech route', 'work_now', 'IT_digital'),
  rec('Digital support assistant', 'Helpdesk-style part-time work', 'build_next', 'IT_digital'),
]

const GENERIC_BACKUP: CareerBrainRecommendation[] = [
  rec('Retail assistant', 'Backup income — only when no bridge path or user accepts any job', 'backup_income', 'retail_customer_service'),
  rec('Warehouse operative', 'Backup — urgent/generic fallback only', 'backup_income', 'retail_customer_service'),
]

export function buildFallbackRecommendations(
  profile: CareerProfile,
  state?: CareerBrainState
): { recommendations: CareerBrainRecommendation[]; reason: string } {
  const answers = state?.answers ?? {}

  if (state && isCareerChangePath(state) && isCareerChangePathComplete(state)) {
    const careerChange = getCareerChangeDeterministicResult(profile, state)
    if (careerChange) {
      return {
        recommendations: careerChange.recommendations,
        reason: 'Career change transition plan',
      }
    }
  }

  if (state && isGrowCareerPath(state) && isGrowCareerPathComplete(state)) {
    const growCareer = getGrowCareerDeterministicResult(profile, state)
    if (growCareer) {
      return {
        recommendations: growCareer.recommendations,
        reason: 'Grow career progression plan',
      }
    }
  }

  const deterministic = getDeterministicCareerRecommendations(answers, profile, state)
  if (deterministic) {
    return {
      recommendations: deterministic.recommendations,
      reason: deterministic.reason,
    }
  }

  const domain = profile.domain
  const isStudent = profile.constraints.includes('student')
  const anyJobIntent = isFieldAlignmentNo(state ?? { answers: {} })

  const flexible = buildFlexibleEmploymentRecommendations(profile, state)
  if (flexible) {
    return {
      recommendations: flexible.recommendations,
      reason: flexible.reason,
    }
  }

  const dual = buildDualPathRecommendations(profile, state)
  if (dual) {
    return {
      recommendations: dual.recommendations,
      reason: dual.reason,
    }
  }

  const bridge = buildBridgeRoleRecommendations(profile, state)
  if (bridge) {
    const itExperience = buildItExperienceRecommendations(profile, state)
    if (itExperience && bridge.field === 'general' && hasItTechnologyExperience(profile, state)) {
      return itExperience
    }

    let recs = bridge.recommendations
    if (profile.urgencyLevel === 'high' && !isFieldOnlyLock(state ?? { answers: {} }, profile)) {
      recs = [...recs, ...GENERIC_BACKUP.slice(0, 1)]
    }
    return {
      recommendations: recs,
      reason: bridge.reason,
    }
  }

  const itExperience = buildItExperienceRecommendations(profile, state)
  if (itExperience) {
    return itExperience
  }

  if (
    isStudent &&
    !anyJobIntent &&
    !wantsBridgeRoleDiscovery(profile, state) &&
    !wantsDualPathMode(profile, state) &&
    !wantsFlexibleEmploymentMode(profile, state)
  ) {
    const hybrid = buildStudentHybridRecommendations(profile, state)
    if (hybrid) return hybrid
  }

  if (
    isStudent &&
    profile.wantsSameField &&
    !wantsBridgeRoleDiscovery(profile, state) &&
    !wantsFlexibleEmploymentMode(profile, state) &&
    !wantsDualPathMode(profile, state) &&
    (domain === 'animation_design' || domain === 'creative_media')
  ) {
    return {
      recommendations: STUDENT_CREATIVE_PART_TIME,
      reason: 'Fallback: student part-time — creative study path',
    }
  }

  if (isStudent && profile.wantsSameField && !wantsBridgeRoleDiscovery(profile, state) && domain === 'IT_digital') {
    return {
      recommendations: STUDENT_IT_PART_TIME,
      reason: 'Fallback: student part-time — computing study path',
    }
  }

  const targetBlob = (profile.targetField ?? '').toLowerCase()
  if (
    profile.wantsCareerChange &&
    /office|admin|reception|customer\s*service|data\s*entry|clerical/.test(targetBlob)
  ) {
    let pack = [...OFFICE_CHANGE_PACK]
    if (profile.englishLevel === 'basic') {
      pack = [
        ...pack.filter((r) => !/customer support|receptionist/i.test(r.title)),
        ...pack.filter((r) => /customer support|receptionist/i.test(r.title)),
      ]
    }
    const avoidCustomer =
      profile.constraints.includes('no-customer-facing') || profile.englishLevel === 'basic'
    if (avoidCustomer) {
      pack = pack.filter(
        (r) => r.track !== 'work_now' || !/customer support|receptionist/i.test(r.title)
      )
    }
    return {
      recommendations: pack,
      reason: 'Fallback: career change into office/admin',
    }
  }

  if (profile.wantsCareerChange && domain === 'finance_accounting') {
    return {
      recommendations: ACCOUNTING_CHANGE_PACK,
      reason: 'Fallback: finance/accounting study + career change',
    }
  }

  if (
    (domain === 'animation_design' || domain === 'creative_media') &&
    !wantsFlexibleEmploymentMode(profile, state) &&
    !wantsDualPathMode(profile, state)
  ) {
    let pack = [...ANIMATION_PACK]
    if (!profile.urgencyLevel || profile.urgencyLevel === 'low') {
      pack = pack.filter((r) => r.track !== 'backup_income')
    }
    return {
      recommendations: filterFieldFirstRecs(profile, pack),
      reason: `Fallback: ${domain} field-first pack`,
    }
  }

  const workBlob = (profile.workExperienceField ?? '').toLowerCase()
  if (/warehouse|picker|packer|logistics/i.test(workBlob) && profile.wantsSameField !== false) {
    return {
      recommendations: WAREHOUSE_GROWTH_PACK,
      reason: 'Fallback: warehouse worker growth path',
    }
  }

  if (domain === 'driving_logistics' && !profile.wantsCareerChange) {
    return {
      recommendations: DRIVING_PACK,
      reason: 'Fallback: driving / logistics experience',
    }
  }

  const pref = (profile.targetField ?? '').toLowerCase()
  if (profile.yearsOfExperience === 0 || domain === 'no_experience_general') {
    if (pref.includes('driving') || (profile.licences.length > 0 && profile.urgencyLevel === 'high')) {
      return { recommendations: NO_EXP_DRIVING_PACK, reason: 'Fallback: no experience + driving/urgent' }
    }
    if (
      profile.englishLevel === 'basic' ||
      pref.includes('physical') ||
      pref.includes('quick_income')
    ) {
      return { recommendations: NO_EXP_PHYSICAL_PACK, reason: 'Fallback: no experience + physical/basic English' }
    }
  }

  if (profile.urgencyLevel === 'high' && !isFieldFirstMode(profile)) {
    return {
      recommendations: [...URGENT_PACK, ...ENTRY_PACK].slice(0, 8),
      reason: 'Fallback: urgent income, general entry',
    }
  }

  if (
    (domain === 'no_experience_general' || profile.yearsOfExperience === 0) &&
    !wantsBridgeRoleDiscovery(profile, state)
  ) {
    let pack = [...ENTRY_PACK]
    if (profile.englishLevel === 'basic') {
      pack = [
        ...pack.filter((r) => !/customer service/i.test(r.title)),
        ...pack.filter((r) => /customer service/i.test(r.title)),
      ]
    }
    return {
      recommendations: pack,
      reason: 'Fallback: no experience / general entry',
    }
  }

  if (profile.detectedRoles.length >= 2) {
    const custom = profile.detectedRoles.slice(0, 4).map((title, i) =>
      rec(
        title,
        `Matches your ${domainLabelShort(domain)} background`,
        i === 0 ? 'work_now' : i < 3 ? 'build_next' : 'long_term',
        domain
      )
    )
    return {
      recommendations: filterFieldFirstRecs(profile, custom),
      reason: `Fallback: detected roles for ${domain}`,
    }
  }

  return {
    recommendations: ENTRY_PACK,
    reason: 'Fallback: default beginner-friendly UK roles',
  }
}

function domainLabelShort(domain: CareerProfile['domain']): string {
  return domain.replace(/_/g, ' ')
}
