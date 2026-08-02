/**
 * Bridge Role Intelligence — career-connected entry roles before generic employability.
 */

import type { CareerBrainQuestion, CareerBrainState, CareerProfile } from './types'
import { rec } from './resultBuilder'
import type { CareerBrainRecommendation } from './types'
import {
  getFieldAlignment,
  isFieldAlignmentBoth,
  isFieldAlignmentNo,
  isFieldAlignmentYes,
} from './fieldAlignment'
import { getSpecialisationRecommendations } from './fieldSpecialisation'
import { getStudentStudyField, getStudentWorkIntent } from './studentPath'

export type BridgeField =
  | 'medicine'
  | 'nursing'
  | 'psychology'
  | 'law'
  | 'animation'
  | 'business'
  | 'marketing'
  | 'computer_science'
  | 'engineering'
  | 'education'
  | 'media'
  | 'construction'
  | 'finance'
  | 'healthcare'
  | 'social_care'
  | 'hospitality'
  | 'general'

export type BridgeRoleResult = {
  recommendations: CareerBrainRecommendation[]
  reason: string
  bridgeReasoning: string[]
  field: BridgeField
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false,
  maxSelect?: number
): CareerBrainQuestion {
  return {
    id,
    text,
    type: multi ? 'multi' : 'single',
    options,
    max_select: maxSelect,
    allow_free_text: true,
  }
}

export function inferBridgeField(studyField?: string | null, targetField?: string | null): BridgeField {
  const t = `${studyField ?? ''} ${targetField ?? ''}`.toLowerCase()
  if (/medicine|medical\s*student|mbbs|doctor\b|physician/.test(t)) return 'medicine'
  if (/nursing|nurse\b|midwif/.test(t)) return 'nursing'
  if (/psychology|psychotherapist|counsell/.test(t)) return 'psychology'
  if (/law\b|legal|solicitor|barrister|llb/.test(t)) return 'law'
  if (/animat|motion\s*design|3d\s*artist/.test(t)) return 'animation'
  if (/marketing|advertising|brand\b/.test(t)) return 'marketing'
  if (/business|management|mba\b|entrepreneur/.test(t)) return 'business'
  if (/computer|computing|software|developer|programming|it\b|tech\b|data science/.test(t)) {
    return 'computer_science'
  }
  if (/engineer|mechanical|electrical|civil\b/.test(t)) return 'engineering'
  if (/education|teaching|teacher|pgce/.test(t)) return 'education'
  if (/media|journalism|film|broadcast|content/.test(t)) return 'media'
  if (/construct|building|trade|plumb|electric/.test(t)) return 'construction'
  if (/account|finance|banking|economics|aat/.test(t)) return 'finance'
  if (/health|care\s*assistant|hospital|clinical/.test(t)) return 'healthcare'
  if (/social\s*care|support\s*worker|carer\b/.test(t)) return 'social_care'
  if (/hospitality|hotel|chef|catering/.test(t)) return 'hospitality'
  return 'general'
}

export function wantsBridgeRoleDiscovery(profile: CareerProfile, state?: CareerBrainState): boolean {
  if (allowsGenericEmployabilityOnly(profile, state)) return false

  if (profile.constraints.includes('bridge-role-mode')) return true

  if (state) {
    const alignment = getFieldAlignment(state)
    if (alignment === 'yes' || alignment === 'both') return true
  }

  return false
}

/** True only when user wants survival jobs with no professional path (no study direction). */
export function allowsGenericEmployabilityOnly(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  const target = (profile.targetField ?? '').toLowerCase()
  const hasStudy = !!profile.studyField?.trim()
  const hasRealTarget = !!target && target !== 'quick_income' && target !== 'any'
  if (hasStudy || hasRealTarget) return false
  if (profile.constraints.includes('field-only-mode')) return false
  if (profile.constraints.includes('career-track-locked') && !profile.constraints.includes('any-job-ok')) {
    return false
  }
  if (profile.urgencyLevel === 'high' && profile.constraints.includes('any-job-ok')) return true
  if (state) {
    if (profile.constraints.includes('dual-path-mode') || profile.constraints.includes('education-income-balance')) {
      return false
    }
    if (isFieldAlignmentNo(state)) return false
    if (String(state.answers?.cb_entry_work_preference) === 'quick_income') return true
    if (String(state.answers?.cb_graduate_urgency) === 'urgent') return true
  }
  if (profile.targetField === 'quick_income' || profile.targetField === 'any') return true
  return false
}

export function getBridgeProfessionalTracks(
  field: BridgeField,
  profile: CareerProfile
): { buildNext: CareerBrainRecommendation[]; longTerm: CareerBrainRecommendation[] } {
  const pack = bridgePack(field)
  return {
    buildNext: pack.filter((r) => r.track === 'build_next').slice(0, 3),
    longTerm: pack.filter((r) => r.track === 'long_term').slice(0, 2),
  }
}

function bridgePack(field: BridgeField): CareerBrainRecommendation[] {
  const packs: Record<BridgeField, CareerBrainRecommendation[]> = {
    medicine: [
      rec('Healthcare Assistant', 'Bridge — care exposure while studying medicine; no licence required yet', 'work_now', 'care_support'),
      rec('Care Support Worker', 'Bridge — patient-facing experience in UK care settings', 'work_now', 'care_support'),
      rec('Medical Receptionist', 'Bridge — clinic/GP admin exposure to healthcare environments', 'work_now', 'healthcare'),
      rec('NHS Admin (entry)', 'Build Next — NHS pathway after care/reception experience', 'build_next', 'healthcare'),
      rec('Pharmacy Assistant', 'Build Next — regulated environment adjacent to medicine', 'build_next', 'healthcare'),
      rec('Clinical Support Worker', 'Build Next — step toward clinical NHS roles', 'build_next', 'healthcare'),
      rec('Medical career pathway (UK)', 'Long-term — progression toward clinical medicine with UK experience', 'long_term', 'healthcare'),
    ],
    nursing: [
      rec('Healthcare Assistant', 'Bridge — standard entry before registered nursing', 'work_now', 'care_support'),
      rec('Care Support Worker', 'Bridge — hands-on care hours for nursing applications', 'work_now', 'care_support'),
      rec('NHS Bank Care Worker', 'Bridge — flexible shifts while studying', 'work_now', 'care_support'),
      rec('Senior Healthcare Assistant', 'Build Next — progression with experience', 'build_next', 'healthcare'),
      rec('Nursing Associate', 'Build Next — apprenticeship-style bridge role', 'build_next', 'healthcare'),
      rec('Registered Nurse (pathway)', 'Long-term — target qualification route', 'long_term', 'healthcare'),
    ],
    psychology: [
      rec('Support Worker', 'Bridge — vulnerable-adults exposure aligned with psychology', 'work_now', 'care_support'),
      rec('Mental Health Support Worker', 'Bridge — relevant sector experience', 'work_now', 'care_support'),
      rec('Education Support Assistant', 'Bridge — child/young person support settings', 'work_now', 'education_training'),
      rec('Assistant Psychologist (trainee routes)', 'Build Next — after UK experience and study progress', 'build_next', 'care_support'),
      rec('Wellbeing Coordinator', 'Build Next — workplace/education wellbeing', 'build_next', 'care_support'),
      rec('Psychology career pathway', 'Long-term — HCPC/chartered routes with experience', 'long_term', 'care_support'),
    ],
    law: [
      rec('Legal Receptionist', 'Bridge — law firm / chambers exposure', 'work_now', 'admin_business'),
      rec('Office Administrator (legal sector)', 'Bridge — documentation and professional environment', 'work_now', 'admin_business'),
      rec('Legal Admin Assistant', 'Build Next — casework support', 'build_next', 'admin_business'),
      rec('Casework Assistant', 'Build Next — paralegal-style duties', 'build_next', 'admin_business'),
      rec('Paralegal', 'Long-term — solicitor pathway bridge', 'long_term', 'admin_business'),
    ],
    animation: [
      rec('Social Media Content Assistant', 'Bridge — creative output while building portfolio', 'work_now', 'creative_media'),
      rec('Junior Video Editor', 'Bridge — editing experience for showreel', 'work_now', 'creative_media'),
      rec('Production Assistant (part-time)', 'Bridge — studio/agency exposure', 'work_now', 'creative_media'),
      rec('Motion Graphics Assistant', 'Build Next — motion design progression', 'build_next', 'animation_design'),
      rec('Creative Marketing Assistant', 'Build Next — client creative briefs', 'build_next', 'creative_media'),
      rec('Animator / Motion Designer', 'Long-term — target creative career', 'long_term', 'animation_design'),
    ],
    business: [
      rec('Office Admin Assistant', 'Bridge — professional office exposure', 'work_now', 'admin_business'),
      rec('Customer Service Advisor', 'Bridge — communication and CRM-style skills', 'work_now', 'retail_customer_service'),
      rec('Sales Support Administrator', 'Bridge — commercial business environment', 'work_now', 'admin_business'),
      rec('Junior Marketing Assistant', 'Build Next — marketing pathway from business study', 'build_next', 'IT_digital'),
      rec('HR Administrator', 'Build Next — people operations exposure', 'build_next', 'admin_business'),
      rec('Business Analyst Trainee', 'Long-term — business degree progression', 'long_term', 'admin_business'),
    ],
    marketing: [
      rec('Social Media Assistant', 'Bridge — digital marketing hands-on', 'work_now', 'creative_media'),
      rec('Marketing Admin Assistant', 'Bridge — campaigns and office tools', 'work_now', 'admin_business'),
      rec('Content Creator (part-time)', 'Bridge — portfolio of marketing work', 'work_now', 'creative_media'),
      rec('Digital Marketing Assistant', 'Build Next — paid/organic marketing', 'build_next', 'IT_digital'),
      rec('Brand Assistant', 'Build Next — agency/brand exposure', 'build_next', 'creative_media'),
      rec('Marketing Manager pathway', 'Long-term — marketing career ladder', 'long_term', 'IT_digital'),
    ],
    computer_science: [
      rec('IT Support Assistant', 'Bridge — tickets, users, systems exposure', 'work_now', 'IT_digital'),
      rec('QA Tester (junior)', 'Bridge — testing mindset for development careers', 'work_now', 'IT_digital'),
      rec('Digital Support Advisor', 'Bridge — helpdesk / remote support', 'work_now', 'IT_digital'),
      rec('Junior Web Developer', 'Build Next — after portfolio/projects', 'build_next', 'IT_digital'),
      rec('Software Developer (graduate route)', 'Build Next — junior dev with mentorship', 'build_next', 'IT_digital'),
      rec('Software Engineer pathway', 'Long-term — tech career progression', 'long_term', 'IT_digital'),
    ],
    engineering: [
      rec('Engineering Technician Assistant', 'Bridge — site/office technician support', 'work_now', 'construction_trades'),
      rec('CAD / Design Office Assistant', 'Bridge — technical drawings exposure', 'work_now', 'construction_trades'),
      rec('Quality Inspector (junior)', 'Bridge — manufacturing/engineering QA', 'work_now', 'construction_trades'),
      rec('Graduate Engineer (trainee)', 'Build Next — structured engineering grad scheme', 'build_next', 'construction_trades'),
      rec('Engineer (incorporated pathway)', 'Long-term — professional engineering route', 'long_term', 'construction_trades'),
    ],
    education: [
      rec('Teaching Assistant', 'Bridge — classroom exposure while studying education', 'work_now', 'education_training'),
      rec('Learning Support Assistant', 'Bridge — SEN/general LSA roles', 'work_now', 'education_training'),
      rec('Tutor (part-time)', 'Bridge — flexible subject tutoring', 'work_now', 'education_training'),
      rec('Cover Supervisor', 'Build Next — school experience progression', 'build_next', 'education_training'),
      rec('Qualified Teacher pathway', 'Long-term — PGCE/teaching career', 'long_term', 'education_training'),
    ],
    media: [
      rec('Social Media Content Assistant', 'Bridge — content pipeline experience', 'work_now', 'creative_media'),
      rec('Production Runner / Assistant', 'Bridge — film/TV/studio exposure', 'work_now', 'creative_media'),
      rec('Junior Researcher (media)', 'Bridge — broadcast/digital research', 'work_now', 'creative_media'),
      rec('Junior Producer Assistant', 'Build Next — production career ladder', 'build_next', 'creative_media'),
      rec('Content Producer', 'Long-term — media career target', 'long_term', 'creative_media'),
    ],
    construction: [
      rec('Site Labourer / Assistant', 'Bridge — site exposure (CSCS when ready)', 'work_now', 'construction_trades'),
      rec('Trade Mate (electric/plumbing)', 'Bridge — assistant to qualified trade', 'work_now', 'construction_trades'),
      rec('Quantity Surveying Admin', 'Bridge — office-side construction', 'work_now', 'admin_business'),
      rec('Trainee tradesperson', 'Build Next — apprenticeship route', 'build_next', 'construction_trades'),
      rec('Site Supervisor pathway', 'Long-term — construction management', 'long_term', 'construction_trades'),
    ],
    finance: [
      rec('Finance Admin Assistant', 'Bridge — invoices, spreadsheets, office finance', 'work_now', 'finance_accounting'),
      rec('Accounts Payable Clerk', 'Bridge — entry finance processing', 'work_now', 'finance_accounting'),
      rec('Bookkeeping Assistant', 'Build Next — AAT-friendly route', 'build_next', 'finance_accounting'),
      rec('Accounts Assistant', 'Build Next — broader finance team exposure', 'build_next', 'finance_accounting'),
      rec('Accountant pathway', 'Long-term — chartered/AAT progression', 'long_term', 'finance_accounting'),
    ],
    healthcare: [
      rec('Healthcare Assistant', 'Bridge — patient care exposure', 'work_now', 'care_support'),
      rec('Medical Receptionist', 'Bridge — clinic admin', 'work_now', 'healthcare'),
      rec('Pharmacy Counter Assistant', 'Build Next — pharmacy sector', 'build_next', 'healthcare'),
      rec('Clinical Support Worker', 'Build Next — NHS clinical support', 'build_next', 'healthcare'),
      rec('Healthcare professional pathway', 'Long-term — sector progression', 'long_term', 'healthcare'),
    ],
    social_care: [
      rec('Support Worker', 'Bridge — core care experience', 'work_now', 'care_support'),
      rec('Residential Support Worker', 'Bridge — housing/care settings', 'work_now', 'care_support'),
      rec('Senior Support Worker', 'Build Next — progression with training', 'build_next', 'care_support'),
      rec('Team Leader (care)', 'Build Next — supervision route', 'build_next', 'care_support'),
      rec('Registered Manager pathway', 'Long-term — care leadership', 'long_term', 'care_support'),
    ],
    hospitality: [
      rec('Front of House / Host', 'Bridge — customer service in hospitality', 'work_now', 'hospitality'),
      rec('Barista / Waiting Staff', 'Bridge — flexible hospitality shifts', 'work_now', 'hospitality'),
      rec('Hotel Receptionist', 'Build Next — hotel operations', 'build_next', 'hospitality'),
      rec('Events Assistant', 'Build Next — events/hospitality crossover', 'build_next', 'hospitality'),
      rec('Hospitality Manager pathway', 'Long-term — management route', 'long_term', 'hospitality'),
    ],
    general: [
      rec('Office Admin Assistant', 'Bridge — general professional exposure', 'work_now', 'admin_business'),
      rec('Customer Service Advisor', 'Bridge — UK work history and communication', 'work_now', 'retail_customer_service'),
      rec('Sector Assistant (entry)', 'Build Next — move toward study-related sector', 'build_next', 'admin_business'),
      rec('Specialist pathway', 'Long-term — refine after more study/experience', 'long_term', 'admin_business'),
    ],
  }
  return packs[field] ?? packs.general
}

/** Entry-level paid roles inside a career family — used when Work Now would otherwise be empty. */
export function getBridgeFieldWorkNowRoles(
  field: BridgeField,
  limit = 3,
  state?: CareerBrainState,
  profile?: CareerProfile
): CareerBrainRecommendation[] {
  const spec = getSpecialisationRecommendations(state, profile)
  if (spec) {
    return spec.filter((r) => r.track === 'work_now').slice(0, limit)
  }
  return bridgePack(field).filter((r) => r.track === 'work_now').slice(0, limit)
}

/** Field-aligned courses, certs, and progression steps for Build Next. */
export function getBridgeFieldDevelopmentRoles(
  field: BridgeField,
  limit = 4,
  state?: CareerBrainState,
  profile?: CareerProfile
): CareerBrainRecommendation[] {
  const spec = getSpecialisationRecommendations(state, profile)
  if (spec) {
    return spec.filter((r) => r.track === 'build_next').slice(0, limit)
  }
  return bridgePack(field).filter((r) => r.track === 'build_next').slice(0, limit)
}

/** Long-term destinations for the chosen career family. */
export function getBridgeFieldLongTermRoles(
  field: BridgeField,
  limit = 3,
  state?: CareerBrainState,
  profile?: CareerProfile
): CareerBrainRecommendation[] {
  const spec = getSpecialisationRecommendations(state, profile)
  if (spec) {
    return spec.filter((r) => r.track === 'long_term').slice(0, limit)
  }
  return bridgePack(field).filter((r) => r.track === 'long_term').slice(0, limit)
}

export function resolveCommittedBridgeField(profile: CareerProfile, state?: CareerBrainState): BridgeField {
  const study = profile.studyField ?? (state ? getStudentStudyField(state) : '') ?? ''
  return inferBridgeField(study, profile.targetField ?? profile.workExperienceField)
}

export function buildBridgeRoleReasoning(
  profile: CareerProfile,
  field: BridgeField,
  state?: CareerBrainState
): string[] {
  const lines: string[] = []
  lines.push(`Bridge Role Discovery: ${field.replace(/_/g, ' ')} field detected`)
  if (profile.studyField) lines.push(`Study signal: ${profile.studyField}`)
  if (profile.workExperienceField) lines.push(`Experience bridge: ${profile.workExperienceField}`)
  if (profile.hasPortfolio === false) lines.push('Barrier: no portfolio yet — bridge roles build evidence')
  if (profile.englishLevel === 'basic') lines.push('Barrier: basic English — prioritising roles with lighter communication')
  if (profile.yearsOfExperience === 0) lines.push('Limitation: not graduated / limited UK experience — entry bridge roles only')
  if (profile.constraints.includes('part-time')) lines.push('Schedule: part-time / student availability considered')
  lines.push('Prioritised career-connected bridge roles over generic retail/café unless user accepts any job')
  if (state?.answers?.cb_student_work_intent) {
    lines.push(`Intent: ${String(state.answers.cb_student_work_intent)}`)
  }
  return lines
}

export function buildBridgeRoleRecommendations(
  profile: CareerProfile,
  state?: CareerBrainState
): BridgeRoleResult | null {
  if (!wantsBridgeRoleDiscovery(profile, state)) return null

  const study = profile.studyField ?? (state ? getStudentStudyField(state) : '') ?? ''
  const field = inferBridgeField(study, profile.targetField)
  const specialisationPack = getSpecialisationRecommendations(state, profile)
  let recommendations = specialisationPack ?? bridgePack(field)

  if (profile.englishLevel === 'basic') {
    recommendations = recommendations.filter(
      (r) => !/customer service|receptionist|legal receptionist/i.test(r.title) || r.track !== 'work_now'
    )
  }

  if (profile.hasPortfolio === false && field === 'animation') {
    recommendations = recommendations.map((r) =>
      r.track === 'work_now' && /junior video|social media|production/i.test(r.title)
        ? { ...r, why: `${r.why} — builds portfolio while studying` }
        : r
    )
  }

  const bridgeReasoning = buildBridgeRoleReasoning(profile, field, state)

  return {
    recommendations,
    reason: `Bridge Role Intelligence: ${field} — career-connected entry path`,
    bridgeReasoning,
    field,
  }
}

type BridgeQuestionDef = { id: string; when?: (p: CareerProfile, s: CareerBrainState) => boolean; question: CareerBrainQuestion }

const BRIDGE_QUESTIONS: Record<BridgeField, BridgeQuestionDef[]> = {
  medicine: [
    {
      id: 'cb_bridge_care_comfort',
      question: q('cb_bridge_care_comfort', 'Are you comfortable in care environments supporting patients?', [
        { value: 'yes', label: 'Yes' },
        { value: 'with_training', label: 'Yes with training' },
        { value: 'no', label: 'Prefer non-care settings' },
      ]),
    },
    {
      id: 'cb_bridge_nhs_interest',
      question: q('cb_bridge_nhs_interest', 'Are you interested in NHS or clinic exposure while studying?', [
        { value: 'nhs', label: 'NHS' },
        { value: 'clinic', label: 'Clinic / GP' },
        { value: 'care_home', label: 'Care home' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'open', label: 'Open to any healthcare setting' },
      ], true, 2),
    },
    {
      id: 'cb_bridge_first_aid',
      question: q('cb_bridge_first_aid', 'Do you have any volunteering or first aid training?', [
        { value: 'yes', label: 'Yes' },
        { value: 'planned', label: 'Planning to get it' },
        { value: 'no', label: 'Not yet' },
      ]),
    },
  ],
  law: [
    {
      id: 'cb_bridge_legal_admin',
      question: q('cb_bridge_legal_admin', 'Are you interested in legal admin or documentation work?', [
        { value: 'yes', label: 'Yes' },
        { value: 'maybe', label: 'Maybe' },
        { value: 'no', label: 'No' },
      ]),
    },
    {
      id: 'cb_bridge_office_legal',
      question: q('cb_bridge_office_legal', 'Are you comfortable with paperwork in a professional office?', [
        { value: 'yes', label: 'Yes' },
        { value: 'basic', label: 'Basic — willing to learn' },
        { value: 'no', label: 'Not really' },
      ]),
    },
  ],
  animation: [
    {
      id: 'cb_creative_portfolio',
      question: q('cb_creative_portfolio', 'Do you have a portfolio or showreel?', [
        { value: 'yes_strong', label: 'Yes — strong' },
        { value: 'yes_basic', label: 'Yes — student work' },
        { value: 'building', label: 'Building now' },
        { value: 'no', label: 'Not yet' },
      ]),
    },
    {
      id: 'cb_bridge_creative_software',
      question: q('cb_bridge_creative_software', 'Do you use editing or design software?', [
        { value: 'yes', label: 'Yes' },
        { value: 'learning', label: 'Learning now' },
        { value: 'no', label: 'Not yet' },
      ]),
    },
    {
      id: 'cb_bridge_freelance_interest',
      question: q('cb_bridge_freelance_interest', 'Interested in freelance, agency, or studio assistant work?', [
        { value: 'freelance', label: 'Freelance' },
        { value: 'agency', label: 'Agency' },
        { value: 'studio', label: 'Studio assistant' },
        { value: 'social', label: 'Social media content' },
      ], true, 2),
    },
  ],
  business: [
    {
      id: 'cb_bridge_business_track',
      question: q(
        'cb_bridge_business_track',
        'Interested in admin, customer service, marketing, HR, or office support?',
        [
          { value: 'admin', label: 'Admin' },
          { value: 'customer', label: 'Customer service' },
          { value: 'marketing', label: 'Marketing' },
          { value: 'hr', label: 'HR' },
          { value: 'office', label: 'Office support' },
        ],
        true,
        2
      ),
    },
    {
      id: 'cb_office_computer_level',
      question: q('cb_office_computer_level', 'Comfortable using email and office tools?', [
        { value: 'yes', label: 'Yes' },
        { value: 'basic', label: 'Basic' },
        { value: 'learning', label: 'Learning' },
      ]),
    },
  ],
  computer_science: [
    {
      id: 'cb_graduate_it_projects',
      question: q('cb_graduate_it_projects', 'Do you have coding projects or GitHub?', [
        { value: 'yes_github', label: 'Yes — GitHub/projects' },
        { value: 'yes_basic', label: 'Coursework only' },
        { value: 'building', label: 'Building now' },
        { value: 'no', label: 'Not yet' },
      ]),
    },
    {
      id: 'cb_bridge_it_route',
      question: q(
        'cb_bridge_it_route',
        'Interested in IT support, QA, web, AI tools, or digital support?',
        [
          { value: 'support', label: 'IT support' },
          { value: 'qa', label: 'QA / testing' },
          { value: 'web', label: 'Websites' },
          { value: 'digital', label: 'Digital support' },
        ],
        true,
        2
      ),
    },
  ],
  psychology: [
    {
      id: 'cb_bridge_vulnerable_comfort',
      question: q('cb_bridge_vulnerable_comfort', 'Comfortable working with vulnerable people?', [
        { value: 'yes', label: 'Yes' },
        { value: 'with_support', label: 'With supervision' },
        { value: 'no', label: 'Prefer other settings' },
      ]),
    },
    {
      id: 'cb_bridge_support_setting',
      question: q('cb_bridge_support_setting', 'Interested in support work or education support roles?', [
        { value: 'care', label: 'Care / support worker' },
        { value: 'mental_health', label: 'Mental health support' },
        { value: 'education', label: 'Education support' },
      ], true, 2),
    },
  ],
  nursing: [
    {
      id: 'cb_bridge_care_comfort',
      question: q('cb_bridge_care_comfort', 'Comfortable with hands-on patient care while training?', [
        { value: 'yes', label: 'Yes' },
        { value: 'with_training', label: 'With training' },
        { value: 'no', label: 'Prefer admin-only' },
      ]),
    },
    {
      id: 'cb_bridge_nhs_interest',
      question: q('cb_bridge_nhs_interest', 'Interested in NHS bank or care home shifts?', [
        { value: 'nhs', label: 'NHS' },
        { value: 'care_home', label: 'Care home' },
        { value: 'both', label: 'Both' },
      ]),
    },
  ],
  marketing: [
    {
      id: 'cb_bridge_business_track',
      question: q(
        'cb_bridge_business_track',
        'Interested in social media, digital marketing, or brand assistant work?',
        [
          { value: 'social', label: 'Social media' },
          { value: 'digital', label: 'Digital marketing' },
          { value: 'brand', label: 'Brand / agency' },
          { value: 'content', label: 'Content creation' },
        ],
        true,
        2
      ),
    },
    {
      id: 'cb_bridge_creative_software',
      question: q('cb_bridge_creative_software', 'Do you create content or use design tools?', [
        { value: 'yes', label: 'Yes' },
        { value: 'learning', label: 'Learning' },
        { value: 'no', label: 'No' },
      ]),
    },
  ],
  engineering: [
    {
      id: 'cb_bridge_technical_interest',
      question: q('cb_bridge_technical_interest', 'Interested in technician, CAD, or site assistant roles?', [
        { value: 'site', label: 'Site assistant' },
        { value: 'cad', label: 'CAD / office' },
        { value: 'qa', label: 'Quality / inspection' },
      ], true, 2),
    },
  ],
  education: [
    {
      id: 'cb_bridge_education_setting',
      question: q('cb_bridge_education_setting', 'Interested in schools, tutoring, or learning support?', [
        { value: 'school', label: 'School TA/LSA' },
        { value: 'tutor', label: 'Tutoring' },
        { value: 'sen', label: 'SEN support' },
      ], true, 2),
    },
  ],
  media: [
    {
      id: 'cb_bridge_creative_software',
      question: q('cb_bridge_creative_software', 'Experience with editing or content tools?', [
        { value: 'yes', label: 'Yes' },
        { value: 'learning', label: 'Learning' },
        { value: 'no', label: 'No' },
      ]),
    },
    {
      id: 'cb_bridge_media_format',
      question: q('cb_bridge_media_format', 'Interested in video, social content, or production assistant work?', [
        { value: 'video', label: 'Video' },
        { value: 'social', label: 'Social content' },
        { value: 'production', label: 'Production' },
      ], true, 2),
    },
  ],
  construction: [
    {
      id: 'cb_bridge_site_comfort',
      question: q('cb_bridge_site_comfort', 'Comfortable with site or trade assistant work?', [
        { value: 'yes', label: 'Yes' },
        { value: 'office_only', label: 'Office/construction admin only' },
        { value: 'no', label: 'No' },
      ]),
    },
  ],
  finance: [
    {
      id: 'cb_bridge_finance_track',
      question: q('cb_bridge_finance_track', 'Interested in finance admin, bookkeeping, or accounts assistant routes?', [
        { value: 'admin', label: 'Finance admin' },
        { value: 'bookkeeping', label: 'Bookkeeping' },
        { value: 'accounts', label: 'Accounts assistant' },
      ], true, 2),
    },
  ],
  healthcare: [
    {
      id: 'cb_bridge_care_comfort',
      question: q('cb_bridge_care_comfort', 'Comfortable in healthcare or care support settings?', [
        { value: 'yes', label: 'Yes' },
        { value: 'with_training', label: 'With training' },
        { value: 'no', label: 'No' },
      ]),
    },
  ],
  social_care: [
    {
      id: 'cb_bridge_vulnerable_comfort',
      question: q('cb_bridge_vulnerable_comfort', 'Comfortable supporting vulnerable adults?', [
        { value: 'yes', label: 'Yes' },
        { value: 'with_support', label: 'With supervision' },
        { value: 'no', label: 'No' },
      ]),
    },
  ],
  hospitality: [
    {
      id: 'cb_bridge_hospitality_role',
      question: q('cb_bridge_hospitality_role', 'Interested in front of house, barista, or hotel roles?', [
        { value: 'foh', label: 'Front of house' },
        { value: 'barista', label: 'Barista / waiting' },
        { value: 'hotel', label: 'Hotel' },
      ], true, 2),
    },
  ],
  general: [
    {
      id: 'cb_bridge_sector_interest',
      question: q('cb_bridge_sector_interest', 'Which sector would you like bridge experience in?', [
        { value: 'office', label: 'Office / admin' },
        { value: 'customer', label: 'Customer service' },
        { value: 'care', label: 'Care / support' },
        { value: 'creative', label: 'Creative / digital' },
        { value: 'unsure', label: 'Not sure' },
      ]),
    },
  ],
}

function answers(state: CareerBrainState): Record<string, unknown> {
  return state.answers ?? {}
}

function hasAnswer(state: CareerBrainState, id: string): boolean {
  const a = answers(state)[id]
  if (a === undefined || a === null) return false
  if (typeof a === 'string' && !a.trim()) return false
  return true
}

export function getBridgeFieldFromProfile(
  profile: CareerProfile,
  state?: CareerBrainState
): BridgeField {
  const study = profile.studyField ?? (state ? getStudentStudyField(state) : '') ?? ''
  return inferBridgeField(study, profile.targetField)
}

export function isBridgeDiscoveryComplete(
  profile: CareerProfile,
  state: CareerBrainState
): boolean {
  if (!wantsBridgeRoleDiscovery(profile, state)) return true
  const field = getBridgeFieldFromProfile(profile, state)
  const bank = BRIDGE_QUESTIONS[field] ?? BRIDGE_QUESTIONS.general
  return bank.every((def) => hasAnswer(state, def.id))
}

export function pickBridgeDiscoveryQuestion(
  profile: CareerProfile,
  state: CareerBrainState
): { question: CareerBrainQuestion | null; reason: string } {
  if (!wantsBridgeRoleDiscovery(profile, state)) {
    return { question: null, reason: 'Not in bridge role discovery mode' }
  }

  const field = getBridgeFieldFromProfile(profile, state)
  const bank = BRIDGE_QUESTIONS[field] ?? BRIDGE_QUESTIONS.general

  for (const def of bank) {
    if (def.when && !def.when(profile, state)) continue
    if (!hasAnswer(state, def.id)) {
      return {
        question: def.question,
        reason: `Bridge Role Discovery (${field}): ${def.id}`,
      }
    }
  }

  return { question: null, reason: 'Bridge sector questions complete' }
}

export function applyBridgeModeToProfile(
  profile: CareerProfile,
  state?: CareerBrainState
): CareerProfile {
  if (!wantsBridgeRoleDiscovery(profile, state)) return profile
  const field = inferBridgeField(profile.studyField, profile.targetField)
  return {
    ...profile,
    constraints: [...new Set([...profile.constraints, 'bridge-role-mode', `bridge-field-${field}`])],
    wantsSameField: profile.wantsSameField ?? true,
  }
}