/**
 * Contextual Step 3 experience questions for Work in My Profession.
 * Every profession field has natural, field-specific options.
 * Maps user-facing answers → internal professional_level for matching.
 */

import { PROFESSIONAL_LEVELS } from './levels'
import type { ProfessionalLevelKey } from './types'

export type ExperienceQuestionMode =
  | 'security'
  | 'care'
  | 'office'
  | 'customer_service'
  | 'retail'
  | 'warehouse'
  | 'driving'
  | 'construction'
  | 'electrical'
  | 'plumbing'
  | 'hospitality'
  | 'cleaning'
  | 'manufacturing'
  | 'digital'
  | 'creative'
  | 'beauty'
  | 'childcare'
  | 'self_employment'
  | 'generic'

export type SecurityExperienceProfile =
  | 'no_sia'
  | 'steward_experience'
  | 'sia_door'
  | 'cctv'
  | 'supervisor'
  | 'self_employed'

export type CareExperienceProfile =
  | 'informal_care'
  | 'care_assistant'
  | 'support_worker'
  | 'home_care'
  | 'senior_care'
  | 'care_supervisor'

export type ExperienceOption = {
  id: string
  label: string
  /** Short label for result header (public-facing). */
  display_label: string
  description?: string
  mapped_level: ProfessionalLevelKey
  /** Nearby levels used when soft-filling role cards. */
  related_levels?: ProfessionalLevelKey[]
  security_profile?: SecurityExperienceProfile
  care_profile?: CareExperienceProfile
}

export type ExperienceQuestionConfig = {
  mode: ExperienceQuestionMode
  question: string
  description?: string
  /** Public result row label — "Experience" when contextual. */
  result_label: string
  options: ExperienceOption[]
}

function opt(
  id: string,
  label: string,
  display_label: string,
  mapped_level: ProfessionalLevelKey,
  extra?: Partial<ExperienceOption>
): ExperienceOption {
  return { id, label, display_label, mapped_level, ...extra }
}

/** Fallback only — unknown fields. Prefer field-specific configs. */
const GENERIC_OPTIONS: ExperienceOption[] = PROFESSIONAL_LEVELS.map((l) => ({
  id: l.key,
  label: l.label,
  display_label: l.label,
  description: l.description,
  mapped_level: l.key,
}))

const GENERIC_QUESTION: ExperienceQuestionConfig = {
  mode: 'generic',
  question: 'What best describes your experience in this profession?',
  description: 'Choose the option closest to your practical work experience.',
  result_label: 'Experience',
  options: GENERIC_OPTIONS,
}

const SECURITY_QUESTION: ExperienceQuestionConfig = {
  mode: 'security',
  question: 'What best describes your current security position?',
  description: 'This helps us prioritise realistic UK security roles and SIA pathways.',
  result_label: 'Experience',
  options: [
    opt(
      'sec_no_sia',
      'I do not have an SIA licence yet, but I want to start in security',
      'No SIA licence yet — want to start in security',
      'helper_assistant',
      { related_levels: ['beginner'], security_profile: 'no_sia' }
    ),
    opt(
      'sec_steward_exp',
      'I have event stewarding or security experience',
      'Event stewarding or security experience',
      'beginner',
      { related_levels: ['experienced_worker'], security_profile: 'steward_experience' }
    ),
    opt(
      'sec_sia_door',
      'I already have an SIA Door Supervisor licence',
      'SIA Door Supervisor licence',
      'experienced_worker',
      { related_levels: ['beginner', 'supervisor'], security_profile: 'sia_door' }
    ),
    opt(
      'sec_cctv',
      'I have CCTV / Control Room experience',
      'CCTV / Control Room experience',
      'specialist_technician',
      { related_levels: ['experienced_worker', 'beginner'], security_profile: 'cctv' }
    ),
    opt(
      'sec_supervisor',
      'I supervise security staff',
      'Supervise security staff',
      'supervisor',
      { related_levels: ['experienced_worker'], security_profile: 'supervisor' }
    ),
    opt(
      'sec_self_employed',
      'I want contractor or self-employed security work',
      'Contractor or self-employed security',
      'self_employed_owner',
      { related_levels: ['experienced_worker'], security_profile: 'self_employed' }
    ),
  ],
}

const CARE_QUESTION: ExperienceQuestionConfig = {
  mode: 'care',
  question: 'What best describes your care/support experience?',
  description: 'Choose the option closest to the care or support work you have already done.',
  result_label: 'Experience',
  options: [
    opt(
      'care_informal',
      'I have informal care/support experience',
      'Informal care/support experience',
      'helper_assistant',
      { related_levels: ['beginner'], care_profile: 'informal_care' }
    ),
    opt(
      'care_assistant',
      'I worked as a Care Assistant',
      'Worked as a Care Assistant',
      'beginner',
      { related_levels: ['experienced_worker'], care_profile: 'care_assistant' }
    ),
    opt(
      'care_support_worker',
      'I worked as a Support Worker',
      'Worked as a Support Worker',
      'experienced_worker',
      { related_levels: ['beginner'], care_profile: 'support_worker' }
    ),
    opt(
      'care_home_care',
      'I have home care experience',
      'Home care experience',
      'experienced_worker',
      { related_levels: ['beginner'], care_profile: 'home_care' }
    ),
    opt(
      'care_senior',
      'I have senior care experience',
      'Senior care experience',
      'experienced_worker',
      { related_levels: ['supervisor'], care_profile: 'senior_care' }
    ),
    opt(
      'care_supervisor',
      'I supervised care/support staff',
      'Supervised care/support staff',
      'supervisor',
      { related_levels: ['experienced_worker'], care_profile: 'care_supervisor' }
    ),
  ],
}

const OFFICE_QUESTION: ExperienceQuestionConfig = {
  mode: 'office',
  question: 'What best describes your office/admin experience?',
  description: 'Choose the closest match to your office, reception, or admin work.',
  result_label: 'Experience',
  options: [
    opt(
      'office_basic',
      'I have basic admin or reception experience',
      'Basic admin or reception experience',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt(
      'office_receptionist',
      'I worked as a Receptionist',
      'Worked as a Receptionist',
      'beginner',
      { related_levels: ['experienced_worker', 'helper_assistant'] }
    ),
    opt(
      'office_admin_assistant',
      'I worked as an Admin Assistant',
      'Worked as an Admin Assistant',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'office_data_entry',
      'I have data entry or document experience',
      'Data entry or document experience',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'office_coordinator',
      'I coordinated office tasks or schedules',
      'Coordinated office tasks or schedules',
      'experienced_worker',
      { related_levels: ['supervisor'] }
    ),
    opt(
      'office_supervisor',
      'I supervised admin/reception staff',
      'Supervised admin/reception staff',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const CUSTOMER_SERVICE_QUESTION: ExperienceQuestionConfig = {
  mode: 'customer_service',
  question: 'What best describes your customer service experience?',
  result_label: 'Experience',
  options: [
    opt('cs_face_to_face', 'I helped customers face-to-face', 'Helped customers face-to-face', 'helper_assistant', {
      related_levels: ['beginner'],
    }),
    opt('cs_phone', 'I worked on phone or call handling', 'Phone or call handling', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt('cs_chat_email', 'I handled live chat or email support', 'Live chat or email support', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt('cs_complaints', 'I handled complaints', 'Handled complaints', 'experienced_worker', {
      related_levels: ['beginner'],
    }),
    opt(
      'cs_language',
      'I supported customers in another language',
      'Supported customers in another language',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('cs_supervisor', 'I supervised customer service staff', 'Supervised customer service staff', 'supervisor', {
      related_levels: ['experienced_worker'],
    }),
  ],
}

const RETAIL_QUESTION: ExperienceQuestionConfig = {
  mode: 'retail',
  question: 'What best describes your retail/sales experience?',
  result_label: 'Experience',
  options: [
    opt(
      'retail_shop_floor',
      'I worked on shop floor or customer service',
      'Shop floor or customer service',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('retail_cashier', 'I worked as a Cashier', 'Worked as a Cashier', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'retail_stockroom',
      'I worked in stockroom or merchandising',
      'Stockroom or merchandising',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'retail_sales',
      'I worked in sales/customer advisor roles',
      'Sales / customer advisor roles',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('retail_supervisor', 'I supervised retail staff', 'Supervised retail staff', 'supervisor', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'retail_manager',
      'I managed a small shop or sales team',
      'Managed a small shop or sales team',
      'specialist_technician',
      { related_levels: ['supervisor'] }
    ),
  ],
}

const WAREHOUSE_QUESTION: ExperienceQuestionConfig = {
  mode: 'warehouse',
  question: 'What best describes your warehouse/logistics experience?',
  result_label: 'Experience',
  options: [
    opt(
      'wh_picking',
      'I worked in picking, packing, or loading',
      'Picking, packing, or loading',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('wh_goods', 'I worked in goods-in/goods-out', 'Goods-in / goods-out', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt('wh_forklift', 'I used forklift/FLT before', 'Used forklift / FLT before', 'experienced_worker', {
      related_levels: ['beginner', 'specialist_technician'],
    }),
    opt(
      'wh_stock',
      'I worked in stock control or inventory',
      'Stock control or inventory',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('wh_supervisor', 'I supervised warehouse staff', 'Supervised warehouse staff', 'supervisor', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'wh_dispatch',
      'I coordinated logistics or dispatch',
      'Coordinated logistics or dispatch',
      'specialist_technician',
      { related_levels: ['supervisor'] }
    ),
  ],
}

const DRIVING_QUESTION: ExperienceQuestionConfig = {
  mode: 'driving',
  question: 'What best describes your driving/transport experience?',
  result_label: 'Experience',
  options: [
    opt(
      'drive_delivery',
      'I worked as a delivery driver or courier',
      'Delivery driver or courier',
      'beginner',
      { related_levels: ['helper_assistant', 'experienced_worker'] }
    ),
    opt('drive_taxi', 'I drove taxi/PHV or private hire', 'Taxi / PHV or private hire', 'experienced_worker', {
      related_levels: ['beginner'],
    }),
    opt('drive_van', 'I drove vans or multi-drop routes', 'Vans or multi-drop routes', 'experienced_worker', {
      related_levels: ['beginner'],
    }),
    opt(
      'drive_hgv',
      'I have HGV / LGV goods vehicle driving experience',
      'HGV / LGV goods vehicle driving experience',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'drive_bus',
      'I have bus / coach / PCV driving experience',
      'Bus / coach / PCV driving experience',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'drive_dispatch',
      'I coordinated dispatch or transport schedules',
      'Coordinated dispatch or transport schedules',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'drive_self_employed',
      'I worked self-employed as a driver',
      'Self-employed as a driver',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

/**
 * Keep Bus / PCV and HGV / LGV experience options separate when the user
 * already chose one of those specialisms. Broader transport specialisms
 * still see both options as distinct choices (never mixed in one label).
 */
export function filterDrivingExperienceOptions(
  options: ExperienceOption[],
  specialismSlug?: string | null
): ExperienceOption[] {
  const slug = (specialismSlug ?? '').trim().toLowerCase()
  if (!slug) return options

  if (slug === 'bus-pcv' || slug.includes('bus') || slug.includes('pcv')) {
    return options.filter((o) => o.id !== 'drive_hgv')
  }
  if (slug === 'hgv-lgv' || (slug.includes('hgv') && !slug.includes('bus'))) {
    return options.filter((o) => o.id !== 'drive_bus')
  }
  // Taxi / PHV, van, delivery, courier, supervisor: keep both separate options
  return options
}

const CONSTRUCTION_QUESTION: ExperienceQuestionConfig = {
  mode: 'construction',
  question: 'What best describes your construction/trade experience?',
  result_label: 'Experience',
  options: [
    opt(
      'con_labourer',
      'I worked as a labourer or site assistant',
      'Labourer or site assistant',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('con_hands_on', 'I have hands-on trade experience', 'Hands-on trade experience', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'con_independent',
      'I worked independently on trade jobs',
      'Worked independently on trade jobs',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('con_supervisor', 'I supervised site/trade workers', 'Supervised site/trade workers', 'supervisor', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'con_self_employed',
      'I worked self-employed or took private jobs',
      'Self-employed or private jobs',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const ELECTRICAL_QUESTION: ExperienceQuestionConfig = {
  mode: 'electrical',
  question: 'What best describes your electrical/technical experience?',
  result_label: 'Experience',
  options: [
    opt(
      'elec_assisted',
      'I assisted electricians or technical workers',
      'Assisted electricians or technical workers',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('elec_improver', 'I worked as an electrical improver', 'Worked as an electrical improver', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'elec_domestic',
      'I did domestic or commercial electrical work',
      'Domestic or commercial electrical work',
      'experienced_worker',
      { related_levels: ['beginner', 'specialist_technician'] }
    ),
    opt(
      'elec_pat_lv',
      'I worked with PAT testing, alarms, CCTV, or low voltage',
      'PAT testing, alarms, CCTV, or low voltage',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'elec_supervisor',
      'I supervised electrical/technical work',
      'Supervised electrical/technical work',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'elec_self_employed',
      'I worked self-employed or as a contractor',
      'Self-employed or contractor',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const PLUMBING_QUESTION: ExperienceQuestionConfig = {
  mode: 'plumbing',
  question: 'What best describes your plumbing/heating experience?',
  result_label: 'Experience',
  options: [
    opt(
      'plumb_assisted',
      'I assisted with plumbing or heating work',
      'Assisted with plumbing or heating work',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('plumb_basic', 'I did basic plumbing maintenance', 'Basic plumbing maintenance', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt('plumb_bathroom', 'I worked on bathrooms or pipework', 'Bathrooms or pipework', 'experienced_worker', {
      related_levels: ['beginner'],
    }),
    opt(
      'plumb_heating',
      'I worked on heating/boiler-related tasks',
      'Heating / boiler-related tasks',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'plumb_supervisor',
      'I supervised plumbing/heating work',
      'Supervised plumbing/heating work',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'plumb_self_employed',
      'I worked self-employed or took private jobs',
      'Self-employed or private jobs',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const HOSPITALITY_QUESTION: ExperienceQuestionConfig = {
  mode: 'hospitality',
  question: 'What best describes your hospitality experience?',
  result_label: 'Experience',
  options: [
    opt(
      'hosp_kitchen',
      'I worked in kitchen or food preparation',
      'Kitchen or food preparation',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt(
      'hosp_foh',
      'I worked front of house or waiting tables',
      'Front of house or waiting tables',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt('hosp_bar', 'I worked in bar service', 'Bar service', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'hosp_hotel',
      'I worked in hotel reception or housekeeping',
      'Hotel reception or housekeeping',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('hosp_chef', 'I worked as a chef/cook', 'Worked as a chef/cook', 'experienced_worker', {
      related_levels: ['specialist_technician'],
    }),
    opt('hosp_supervisor', 'I supervised hospitality staff', 'Supervised hospitality staff', 'supervisor', {
      related_levels: ['experienced_worker'],
    }),
  ],
}

const CLEANING_QUESTION: ExperienceQuestionConfig = {
  mode: 'cleaning',
  question: 'What best describes your cleaning/facilities experience?',
  result_label: 'Experience',
  options: [
    opt(
      'clean_domestic',
      'I did domestic or commercial cleaning',
      'Domestic or commercial cleaning',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt(
      'clean_hotel',
      'I did hotel or housekeeping cleaning',
      'Hotel or housekeeping cleaning',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'clean_deep',
      'I did deep cleaning or end-of-tenancy cleaning',
      'Deep cleaning or end-of-tenancy',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'clean_facilities',
      'I worked in facilities/caretaking',
      'Facilities / caretaking',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'clean_supervisor',
      'I supervised cleaning/facilities staff',
      'Supervised cleaning/facilities staff',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'clean_self_employed',
      'I worked self-employed as a cleaner/facilities worker',
      'Self-employed cleaner / facilities',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const MANUFACTURING_QUESTION: ExperienceQuestionConfig = {
  mode: 'manufacturing',
  question: 'What best describes your manufacturing/technical support experience?',
  result_label: 'Experience',
  options: [
    opt(
      'mfg_production',
      'I worked on production or assembly',
      'Production or assembly',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('mfg_machines', 'I operated machines', 'Operated machines', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'mfg_packing',
      'I worked in packing or factory handling',
      'Packing or factory handling',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt('mfg_qc', 'I worked in quality control', 'Quality control', 'experienced_worker', {
      related_levels: ['beginner'],
    }),
    opt(
      'mfg_maintenance',
      'I worked as a maintenance or engineering assistant',
      'Maintenance or engineering assistant',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'mfg_supervisor',
      'I supervised production/factory staff',
      'Supervised production/factory staff',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const DIGITAL_QUESTION: ExperienceQuestionConfig = {
  mode: 'digital',
  question: 'What best describes your IT/digital experience?',
  result_label: 'Experience',
  options: [
    opt(
      'digital_basic',
      'I helped with computers or basic IT support',
      'Computers or basic IT support',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt(
      'digital_helpdesk',
      'I worked in helpdesk or technical support',
      'Helpdesk or technical support',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'digital_web',
      'I managed websites or digital content',
      'Websites or digital content',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'digital_coding',
      'I did junior coding, QA, or testing',
      'Junior coding, QA, or testing',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'digital_networks',
      'I worked with networks, systems, or cyber basics',
      'Networks, systems, or cyber basics',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'digital_ops',
      'I supported digital operations for a business',
      'Supported digital operations for a business',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
  ],
}

const CREATIVE_QUESTION: ExperienceQuestionConfig = {
  mode: 'creative',
  question: 'What best describes your creative/design experience?',
  result_label: 'Experience',
  options: [
    opt(
      'creative_graphics',
      'I created graphics or visual content',
      'Graphics or visual content',
      'beginner',
      { related_levels: ['helper_assistant', 'experienced_worker'] }
    ),
    opt(
      'creative_video',
      'I edited videos or social media content',
      'Video or social media content',
      'beginner',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'creative_photo',
      'I worked with photography or videography',
      'Photography or videography',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'creative_3d',
      'I worked with animation, 3D, or motion graphics',
      'Animation, 3D, or motion graphics',
      'specialist_technician',
      { related_levels: ['experienced_worker'] }
    ),
    opt(
      'creative_print',
      'I prepared print/signage/production artwork',
      'Print / signage / production artwork',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'creative_projects',
      'I managed creative projects or clients',
      'Managed creative projects or clients',
      'supervisor',
      { related_levels: ['experienced_worker', 'self_employed_owner'] }
    ),
  ],
}

const BEAUTY_QUESTION: ExperienceQuestionConfig = {
  mode: 'beauty',
  question: 'What best describes your beauty/personal services experience?',
  result_label: 'Experience',
  options: [
    opt('beauty_hair', 'I worked in barbering or hair', 'Barbering or hair', 'beginner', {
      related_levels: ['helper_assistant', 'experienced_worker'],
    }),
    opt('beauty_nails', 'I worked in nails or beauty therapy', 'Nails or beauty therapy', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'beauty_makeup',
      'I worked in makeup or personal services',
      'Makeup or personal services',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt('beauty_salon_assist', 'I assisted in a salon', 'Assisted in a salon', 'helper_assistant', {
      related_levels: ['beginner'],
    }),
    opt(
      'beauty_mobile',
      'I served private/mobile clients',
      'Private / mobile clients',
      'experienced_worker',
      { related_levels: ['self_employed_owner'] }
    ),
    opt(
      'beauty_owner',
      'I managed or owned a salon/service business',
      'Managed or owned a salon/service business',
      'self_employed_owner',
      { related_levels: ['supervisor'] }
    ),
  ],
}

const CHILDCARE_QUESTION: ExperienceQuestionConfig = {
  mode: 'childcare',
  question: 'What best describes your childcare/education support experience?',
  result_label: 'Experience',
  options: [
    opt(
      'child_informal',
      'I supported children informally or in community settings',
      'Informal or community childcare support',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('child_ta', 'I worked as a Teaching Assistant', 'Worked as a Teaching Assistant', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt('child_nursery', 'I worked in nursery or early years', 'Nursery or early years', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'child_sen',
      'I supported SEN/autism/learning needs',
      'SEN / autism / learning needs support',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'child_tutor',
      'I worked as a tutor or learning support',
      'Tutor or learning support',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'child_supervisor',
      'I supervised childcare/education support staff',
      'Supervised childcare/education support staff',
      'supervisor',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const SELF_EMPLOYMENT_QUESTION: ExperienceQuestionConfig = {
  mode: 'self_employment',
  question: 'What best describes your self-employed/local service experience?',
  result_label: 'Experience',
  options: [
    opt(
      'self_small_jobs',
      'I did small paid jobs for clients',
      'Small paid jobs for clients',
      'helper_assistant',
      { related_levels: ['beginner'] }
    ),
    opt('self_handyman', 'I worked as handyman or home services', 'Handyman or home services', 'beginner', {
      related_levels: ['experienced_worker'],
    }),
    opt(
      'self_mobile',
      'I worked as mobile cleaner/beauty/barber/driver',
      'Mobile cleaner / beauty / barber / driver',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'self_bookings',
      'I managed bookings, pricing, or customer service',
      'Managed bookings, pricing, or customer service',
      'experienced_worker',
      { related_levels: ['beginner'] }
    ),
    opt(
      'self_regular',
      'I want to turn my service into regular work',
      'Want to turn service into regular work',
      'beginner',
      { related_levels: ['self_employed_owner'] }
    ),
    opt(
      'self_business',
      'I already run a small local business',
      'Already run a small local business',
      'self_employed_owner',
      { related_levels: ['experienced_worker'] }
    ),
  ],
}

const BY_FIELD: Record<string, ExperienceQuestionConfig> = {
  'security-facilities': SECURITY_QUESTION,
  'care-support': CARE_QUESTION,
  'office-admin': OFFICE_QUESTION,
  'customer-service': CUSTOMER_SERVICE_QUESTION,
  'retail-sales': RETAIL_QUESTION,
  'warehouse-logistics': WAREHOUSE_QUESTION,
  'driving-transport': DRIVING_QUESTION,
  'construction-trades': CONSTRUCTION_QUESTION,
  'electrical-technical': ELECTRICAL_QUESTION,
  'plumbing-heating': PLUMBING_QUESTION,
  hospitality: HOSPITALITY_QUESTION,
  'cleaning-facilities': CLEANING_QUESTION,
  'manufacturing-engineering': MANUFACTURING_QUESTION,
  'digital-it-support': DIGITAL_QUESTION,
  'creative-design': CREATIVE_QUESTION,
  'beauty-personal': BEAUTY_QUESTION,
  'childcare-education-support': CHILDCARE_QUESTION,
  'self-employment-local': SELF_EMPLOYMENT_QUESTION,
}

export function getExperienceQuestionForField(
  fieldSlug: string,
  specialismSlug?: string | null
): ExperienceQuestionConfig {
  if (!fieldSlug) return GENERIC_QUESTION
  const config = BY_FIELD[fieldSlug] ?? GENERIC_QUESTION
  if (config.mode === 'driving') {
    return {
      ...config,
      options: filterDrivingExperienceOptions(config.options, specialismSlug),
    }
  }
  return config
}

/** Full unfiltered config — used when resolving a saved option id. */
function getExperienceQuestionConfigRaw(fieldSlug: string): ExperienceQuestionConfig {
  if (!fieldSlug) return GENERIC_QUESTION
  return BY_FIELD[fieldSlug] ?? GENERIC_QUESTION
}

export function getExperienceOption(
  fieldSlug: string,
  optionId: string
): ExperienceOption | null {
  const config = getExperienceQuestionConfigRaw(fieldSlug)
  return config.options.find((o) => o.id === optionId) ?? null
}

/** Resolve option id or raw professional level key → option for matching. */
export function resolveExperienceSelection(
  fieldSlug: string,
  experienceOptionId?: string | null,
  professionalLevel?: ProfessionalLevelKey | string | null
): {
  config: ExperienceQuestionConfig
  option: ExperienceOption
} | null {
  const config = getExperienceQuestionConfigRaw(fieldSlug)

  if (experienceOptionId) {
    const option = config.options.find((o) => o.id === experienceOptionId)
    if (option) return { config, option }
  }

  if (professionalLevel) {
    const byLevel = config.options.find(
      (o) => o.id === professionalLevel || o.mapped_level === professionalLevel
    )
    if (byLevel) return { config, option: byLevel }

    const generic = GENERIC_OPTIONS.find((o) => o.mapped_level === professionalLevel)
    if (generic) {
      return {
        config: GENERIC_QUESTION,
        option: generic,
      }
    }
  }

  return null
}

export function listGenericProfessionalLevels() {
  return PROFESSIONAL_LEVELS
}
