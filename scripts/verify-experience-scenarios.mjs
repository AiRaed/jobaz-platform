import { buildExperiencePathResult } from '../lib/career-engine/experience-path/decisionEngine.ts'
import { isComplianceStep } from '../lib/career-engine/experience-path/consultant/careerProgression.ts'
import {
  buildProfessionInterview,
} from '../lib/career-engine/experience-path/consultant/professionInterview.ts'
import {
  normalizeExperienceAnswers,
  shouldAskExperienceQuestion,
} from '../lib/career-engine/experience-path/consultant/interviewDedup.ts'

const universal = {
  years_experience: '6_10',
  english_level: 'good',
  open_to_certifications: 'yes',
  preferred_location: 'UK-wide',
}

// ── Interview deduplication ─────────────────────────────────────────────
const nurseOutsidePartial = {
  industry: 'healthcare',
  experience_specialisation: 'nurse',
  experience_country: 'outside_uk',
  nmc_registered: 'no',
}

const nurseOutsideFlow = buildProfessionInterview(nurseOutsidePartial)
const nurseOutsideIds = nurseOutsideFlow.map((q) => q.id)

if (nurseOutsideIds.includes('overseas_nursing')) {
  throw new Error('Nurse outside UK: should skip overseas_nursing (inferred from experience_country)')
}
if (!shouldAskExperienceQuestion('overseas_nursing', nurseOutsidePartial)) {
  console.log('OK Nurse outside UK skips overseas_nursing')
}
if (!shouldAskExperienceQuestion('uk_work_experience', { experience_country: 'uk' })) {
  console.log('OK Nurse UK experience skips uk_work_experience')
}

const nurseOutsideFull = {
  ...nurseOutsidePartial,
  ...universal,
  uk_work_experience: 'no',
}
const nurseOutsideFullFlow = buildProfessionInterview({
  ...nurseOutsideFull,
  experience_country: 'outside_uk',
})
const fullIds = nurseOutsideFullFlow.map((q) => q.id)
if (fullIds.includes('overseas_nursing')) {
  throw new Error('Nurse outside UK full: should skip overseas_nursing')
}
if (!fullIds.includes('uk_work_experience')) {
  throw new Error('Nurse outside UK full: should ask uk_work follow-up')
}
if (fullIds.includes('nhs_experience')) {
  throw new Error('Nurse outside UK without UK work: should skip nhs_experience')
}
console.log('OK Nurse outside UK interview shortened:', fullIds.join(', '))

const nurseOutsideWithUkWork = {
  ...nurseOutsideFull,
  uk_work_experience: 'yes',
}
const withUkIds = buildProfessionInterview(nurseOutsideWithUkWork).map((q) => q.id)
if (!withUkIds.includes('nhs_experience')) {
  throw new Error('Nurse with overseas + UK work: should ask NHS experience')
}
console.log('OK Nurse with UK work keeps nhs_experience')

const nurseUk = {
  industry: 'healthcare',
  experience_specialisation: 'nurse',
  ...universal,
  experience_country: 'uk',
  nmc_registered: 'yes',
  nhs_experience: 'yes',
  overseas_nursing: 'yes',
}
const nurseUkIds = buildProfessionInterview(nurseUk).map((q) => q.id)
if (nurseUkIds.includes('uk_work_experience')) {
  throw new Error('Nurse UK experience: should skip uk_work_experience')
}
if (!nurseUkIds.includes('overseas_nursing')) {
  throw new Error('Nurse UK experience: should still ask overseas_nursing (qual may differ)')
}
console.log('OK Nurse UK experience skips uk_work, keeps overseas_nursing')

const normalized = normalizeExperienceAnswers({
  industry: 'healthcare',
  experience_specialisation: 'nurse',
  ...universal,
  experience_country: 'uk',
})
if (normalized.uk_work_experience !== 'yes' || normalized.overseas_nursing !== 'no') {
  throw new Error('Normalize UK: expected uk_work=yes, overseas_nursing=no')
}
console.log('OK normalizeExperienceAnswers infers UK defaults')

// ── Dynamic profession analysis (no cross-industry template leakage) ─────
// Electrician — trade-specific multi-select (replaces individual ECS/18th questions)
const electricianOutsidePartial = {
  industry: 'electrician',
  experience_specialisation: 'electrician',
  experience_country: 'outside_uk',
}
const electricianIds = buildProfessionInterview(electricianOutsidePartial).map((q) => q.id)
if (electricianIds.includes('food_hygiene') || electricianIds.includes('personal_licence')) {
  throw new Error('Electrician: must not receive hospitality template questions')
}
if (!electricianIds.includes('electrical_qualifications')) {
  throw new Error(`Electrician: expected electrical_qualifications multi-select — got: ${electricianIds.join(', ')}`)
}
console.log('OK Electrician gets trade-specific questions only:', electricianIds.join(', '))

const waiterFlow = buildProfessionInterview({
  industry: 'hospitality',
  experience_specialisation: 'waiter',
  experience_country: 'uk',
})
const waiterIds = waiterFlow.map((q) => q.id)
if (waiterIds.includes('ecs_card') || waiterIds.includes('sia_ds_licence')) {
  throw new Error('Waiter: must not receive trades/security questions')
}
if (!waiterIds.includes('customer_service_years')) {
  throw new Error('Waiter: expected FOH-specific questions')
}
console.log('OK Waiter gets hospitality FOH questions only:', waiterIds.join(', '))

const accountantInterview = buildProfessionInterview({
  industry: 'accountant',
  experience_specialisation: 'accountant',
  experience_country: 'uk',
  professional_certifications: 'acca,cima',
})
const accountantInterviewIds = accountantInterview.map((q) => q.id)
if (!accountantInterviewIds.includes('professional_certifications')) {
  throw new Error('Accountant: expected professional_certifications multi-select')
}
if (!accountantInterviewIds.includes('cert_status_acca') || !accountantInterviewIds.includes('cert_status_cima')) {
  throw new Error('Accountant: expected per-cert status follow-up questions')
}
console.log('OK Accountant certifications + status follow-ups')

const maintenanceFlow = buildProfessionInterview({
  industry: 'manufacturing_engineering',
  experience_specialisation: 'maintenance_engineer',
  experience_country: 'uk',
})
const maintenanceText = maintenanceFlow.map((q) => q.text).join(' ')
if (/GitHub/i.test(maintenanceText)) {
  throw new Error('Maintenance engineer: must not receive GitHub portfolio question')
}
if (!/engineering projects|maintenance work|CMMS/i.test(maintenanceText)) {
  throw new Error(`Maintenance engineer: expected engineering portfolio question — got: ${maintenanceFlow.map((q) => q.id).join(', ')}`)
}
console.log('OK Maintenance engineer gets contextual portfolio question (no GitHub)')

const qaFlow = buildProfessionInterview({
  industry: 'software_developer',
  experience_specialisation: 'qa_engineer',
  experience_country: 'uk',
})
const qaText = qaFlow.map((q) => q.text).join(' ')
if (!/GitHub|test automation|QA portfolio/i.test(qaText)) {
  throw new Error('QA engineer: expected technical portfolio question')
}
console.log('OK QA engineer gets technical portfolio question')

// ── Roadmap scenarios (unchanged behaviour) ─────────────────────────────
const scenarios = [
  {
    name: 'Taxi Driver (10yr)',
    a: {
      ...universal,
      industry: 'driving_transport',
      experience_specialisation: 'taxi_driver',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      phv_or_taxi: 'phv',
      employment_model: 'self_employed',
      uk_driving_licence: 'yes',
      council_licence: 'no',
      own_vehicle: 'yes',
    },
    must: /PHV|DBS|medical|licence/i,
  },
  {
    name: 'HGV Driver',
    a: {
      ...universal,
      industry: 'driving_transport',
      experience_specialisation: 'hgv_driver',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      hgv_category: 'cat_c',
      driver_cpc: 'no',
      uk_driving_licence: 'yes',
      adr_required: 'no',
    },
    must: /Category C|CPC|HGV/i,
  },
  {
    name: 'Dentist',
    a: {
      ...universal,
      industry: 'healthcare',
      experience_specialisation: 'dentist',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      gdc_registered: 'no',
      nhs_experience: 'yes',
      private_practice: 'yes',
      performer_number: 'no',
    },
    must: /GDC|performer|OET|indemnity/i,
  },
  {
    name: 'QA Engineer',
    a: {
      ...universal,
      industry: 'software_developer',
      experience_specialisation: 'qa_engineer',
      experience_country: 'uk',
      testing_type: 'automation',
      github_portfolio: 'no',
      istqb: 'no',
      tools_used: 'selenium',
    },
    must: /ISTQB|portfolio|GitHub|automation/i,
  },
  {
    name: 'Electrician (trades)',
    a: {
      ...universal,
      industry: 'electrician',
      experience_specialisation: 'electrician',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      ecs_card: 'no',
      edition_18: 'no',
      nvq_level3: 'yes',
      niceic_registered: 'no',
      years_experience: '10_plus',
    },
    must: /ECS|18th|NVQ/i,
  },
  {
    name: 'Door Supervisor',
    a: {
      ...universal,
      industry: 'security',
      experience_specialisation: 'door_supervisor',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      sia_licence: 'no',
      sia_licence_type: 'door_supervisor',
      dbs_clear: 'no',
    },
    must: /SIA|DBS/i,
  },
  {
    name: 'Accountant',
    a: {
      ...universal,
      industry: 'accountant',
      experience_specialisation: 'accountant',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      professional_certifications: 'acca,aat',
      cert_status_acca: 'part_qualified',
      cert_status_aat: 'qualified',
      accounting_software: 'sage,xero',
      years_experience: '10_plus',
    },
    must: /ACCA|Sage|Xero|accountant/i,
  },
  {
    name: 'Nurse (outside UK, no UK work)',
    a: {
      ...universal,
      industry: 'healthcare',
      experience_specialisation: 'nurse',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      nmc_registered: 'no',
      nhs_experience: 'no',
    },
    must: /NMC|CBT|OSCE/i,
  },
  {
    name: 'Door Supervisor + CCTV (multi)',
    a: {
      ...universal,
      industry: 'security',
      experience_specialisation: 'door_supervisor,cctv_operator',
      experience_country: 'outside_uk',
      uk_work_experience: 'no',
      sia_ds_licence: 'no',
      sia_cctv_licence: 'yes',
      conflict_management: 'no',
      control_room_exp: 'yes',
      dbs_clear: 'yes',
    },
    must: /SIA|CCTV|Door Supervisor/i,
    multi: true,
  },
  {
    name: 'Mechanical Engineer (manufacturing)',
    a: {
      ...universal,
      industry: 'manufacturing_engineering',
      experience_specialisation: 'mechanical_engineer',
      experience_country: 'uk',
      uk_work_experience: 'yes',
      iosh_working_safely: 'yes',
      manual_handling: 'yes',
      years_experience: '6_10',
    },
    must: /IOSH|manual handling|engineer/i,
  },
  {
    name: 'Call Centre Agent',
    a: {
      ...universal,
      industry: 'customer_service',
      experience_specialisation: 'call_centre_agent',
      experience_country: 'uk',
      uk_work_experience: 'yes',
      contact_centre_systems: 'zendesk,genesys',
      years_experience: '3_5',
    },
    must: /CRM|contact centre|call centre/i,
  },
  {
    name: 'Primary Teacher',
    a: {
      ...universal,
      industry: 'education_teaching',
      experience_specialisation: 'primary_teacher',
      experience_country: 'uk',
      uk_work_experience: 'yes',
      dbs_clear: 'yes',
      safeguarding_training: 'yes',
      qts_held: 'no',
      trn_held: 'yes',
    },
    must: /QTS|DBS|safeguarding/i,
  },
  {
    name: 'HR Advisor',
    a: {
      ...universal,
      industry: 'hr_recruitment',
      experience_specialisation: 'hr_advisor',
      experience_country: 'uk',
      uk_work_experience: 'yes',
      hr_professional_certifications: 'cipd',
      hris_systems: 'workday,ciphr',
      rtw_checks: 'yes',
      years_experience: '6_10',
    },
    must: /CIPD|HRIS|HR/i,
  },
  {
    name: 'Facilities Manager',
    a: {
      ...universal,
      industry: 'cleaning_facilities',
      experience_specialisation: 'facilities_manager',
      experience_country: 'uk',
      uk_work_experience: 'yes',
      coshh_training: 'yes',
      manual_handling: 'yes',
      iwfm_qualification: 'yes',
      years_experience: '10_plus',
    },
    must: /IWFM|COSHH|facilities/i,
  },
]

for (const s of scenarios) {
  const r = buildExperiencePathResult(s.a)
  const actions = r.essentialActions.map((a) => a.title).join(' ')
  const actionTitles = r.essentialActions.map((a) => a.title)
  const enicLike = actionTitles.filter((t) => /enic|qualification recognition|overseas qualification assessment/i.test(t))
  if (enicLike.length > 1) {
    throw new Error(`${s.name}: duplicate ENIC/qualification recognition in essential actions — ${enicLike.join(' | ')}`)
  }
  const experienceMapping = actionTitles.filter((t) => /experience mapping/i.test(t))
  if (experienceMapping.length > 1) {
    throw new Error(`${s.name}: duplicate Experience Mapping steps`)
  }
  const insights = r.careerInsights
  const compliance = (insights?.complianceNotes ?? []).join(' ')
  const skills = (insights?.skillsEmployersExpect ?? []).join(' ')

  if (!r.specialisationLabel) throw new Error(`${s.name}: missing specialisation label`)
  if (s.multi && !r.specialisationLabel.includes('/')) {
    throw new Error(`${s.name}: expected combined specialisation label`)
  }
  if (s.multi && (!r.careerReadiness.pathReadiness || r.careerReadiness.pathReadiness.length < 2)) {
    throw new Error(`${s.name}: expected pathReadiness for multi-select`)
  }
  if (!insights?.fastestEntryRoute) throw new Error(`${s.name}: missing insights`)
  if (!s.must.test(actions + ' ' + compliance + ' ' + skills)) {
    throw new Error(`${s.name}: expected ${s.must} in roadmap — got actions: ${actions}`)
  }

  const badTimeline = r.careerTimeline.filter(isComplianceStep)
  if (badTimeline.length > 0) {
    throw new Error(`${s.name}: career timeline must be job roles only — found: ${badTimeline.join(', ')}`)
  }
  if (!r.careerTimeline.length) throw new Error(`${s.name}: empty career timeline`)
  if (r.careerTimelineCurrentIndex == null) throw new Error(`${s.name}: missing current career index`)

  console.log(`OK ${s.name}`)
  console.log('  Role:', r.specialisationLabel)
  console.log('  Goal:', r.goal)
  console.log('  Ladder:', r.careerTimeline.join(' → '))
  console.log('  Readiness:', `${r.careerReadiness.score}%`)
  console.log('')
}

console.log(`All ${scenarios.length} experience scenarios + interview dedup checks passed.`)
