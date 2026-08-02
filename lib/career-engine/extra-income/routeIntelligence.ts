/**
 * Route-first career reasoning for Extra Income.
 * Career logic first; affiliate availability is applied later by the plan/resolver layer.
 */

export type CourseTypeRec = {
  /** Stable id — prefer catalog qualification ids when they exist */
  id: string
  title: string
  why: string
  /** Titles/aliases used to match published affiliate courses */
  course_type_keywords: string[]
}

export type CareerRouteLogic = {
  route_id: string
  route_title: string
  /** side_skills values that activate this route (highest priority wins) */
  skill_keys: string[]
  priority: number
  user_goal: string
  /** Preferred opportunity catalog ids, ordered */
  work_now_opportunity_ids: string[]
  /** Display titles for work-now (also used as ranking hints) */
  work_now_roles: string[]
  primary_next_upgrades: CourseTypeRec[]
  optional_addons: CourseTypeRec[]
  after_training_roles: string[]
  cv_focus: string
  job_search_terms: string[]
  allow_sia: boolean
  /** First Aid may be primary only when true */
  allow_first_aid_as_primary: boolean
}

const ROUTES: CareerRouteLogic[] = [
  {
    route_id: 'security',
    route_title: 'Security extra income',
    skill_keys: ['security'],
    priority: 100,
    user_goal: 'Earn extra income through event and security roles, then unlock licensed security work.',
    work_now_opportunity_ids: ['matchday_steward', 'event_staff'],
    work_now_roles: ['Matchday Steward', 'Event Steward', 'Event Staff'],
    primary_next_upgrades: [
      {
        id: 'sia_door',
        title: 'SIA Door Supervisor',
        why: 'Unlocks Door Supervisor and better-paid licensed security roles.',
        course_type_keywords: ['SIA Door Supervisor', 'Door Supervisor'],
      },
    ],
    optional_addons: [
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Common employer preference for events and venue security.',
        course_type_keywords: ['First Aid at Work', 'Emergency First Aid'],
      },
      {
        id: 'cctv',
        title: 'CCTV Licence (SIA)',
        why: 'Opens control-room and monitoring roles alongside door work.',
        course_type_keywords: ['CCTV', 'Public Space Surveillance'],
      },
    ],
    after_training_roles: ['Door Supervisor', 'Security Guard', 'Event Security'],
    cv_focus: 'reliability, availability, customer service and right to work for events/security',
    job_search_terms: ['Matchday Steward', 'Event Steward', 'Door Supervisor'],
    allow_sia: true,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'retail',
    route_title: 'Retail extra income',
    skill_keys: ['retail'],
    priority: 90,
    user_goal: 'Earn extra income in retail and sales, then progress with customer-facing skills.',
    work_now_opportunity_ids: ['retail_assistant', 'seasonal_jobs', 'mystery_shopper', 'customer_service_remote'],
    work_now_roles: [
      'Retail Assistant',
      'Sales Assistant',
      'Stock Assistant',
      'Customer Service Assistant',
    ],
    primary_next_upgrades: [
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Directly improves retail, sales and customer-facing applications.',
        course_type_keywords: ['Customer Service', 'Retail Skills', 'Sales Assistant'],
      },
    ],
    optional_addons: [
      {
        id: 'food_hygiene',
        title: 'Food Hygiene Certificate (Level 2)',
        why: 'Useful for supermarket, food retail and hospitality overlap roles.',
        course_type_keywords: ['Food Hygiene', 'Food Safety Level 2'],
      },
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Optional for public-facing retail roles — not required to start.',
        course_type_keywords: ['First Aid at Work'],
      },
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Optional if you want to progress into retail admin or office pathways.',
        course_type_keywords: ['Microsoft Office'],
      },
    ],
    after_training_roles: ['Customer Service Assistant', 'Sales Assistant', 'Retail Supervisor'],
    cv_focus: 'customer service, reliability, till/stock experience and availability',
    job_search_terms: ['Retail Assistant', 'Sales Assistant', 'Customer Service'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'customer_service',
    route_title: 'Customer Service extra income',
    skill_keys: ['customer_service', 'sales'],
    priority: 88,
    user_goal: 'Earn through customer support and remote/admin-friendly roles.',
    work_now_opportunity_ids: ['customer_service_remote', 'freelance_admin'],
    work_now_roles: [
      'Customer Service Remote',
      'Call Handler',
      'Live Chat Support',
      'Admin Support',
    ],
    primary_next_upgrades: [
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Core training for remote and phone/chat support roles.',
        course_type_keywords: ['Customer Service', 'Communication Skills'],
      },
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Supports remote admin, CRM and digital support work.',
        course_type_keywords: ['Microsoft Office', 'Remote Work'],
      },
    ],
    optional_addons: [
      {
        id: 'digital_skills',
        title: 'Digital Skills Course',
        why: 'Helps with chat tools, CRMs and remote work systems.',
        course_type_keywords: ['Digital Skills'],
      },
      {
        id: 'english_for_work',
        title: 'English for Work',
        why: 'Optional if you want stronger workplace communication.',
        course_type_keywords: ['English for Work', 'Business English'],
      },
    ],
    after_training_roles: ['Customer Service Advisor', 'Remote Support Agent', 'Admin Assistant'],
    cv_focus: 'communication, reliability, remote tools and customer handling',
    job_search_terms: ['Customer Service Remote', 'Call Centre', 'Live Chat Support'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'languages',
    route_title: 'Languages / Translation extra income',
    skill_keys: ['languages'],
    priority: 87,
    user_goal: 'Use language skills for bilingual support, tutoring or translation-related side income.',
    work_now_opportunity_ids: ['customer_service_remote', 'online_tutoring', 'exam_invigilator'],
    work_now_roles: [
      'Bilingual Customer Support',
      'Online Tutor',
      'Exam Invigilator',
      'Study Support Assistant',
      'Language Tutor',
    ],
    primary_next_upgrades: [
      {
        id: 'tefl',
        title: 'TEFL / Teaching English Online',
        why: 'Strong upgrade for language tutoring and online English teaching.',
        course_type_keywords: ['TEFL', 'Teaching English Online', 'TESOL'],
      },
      {
        id: 'english_for_work',
        title: 'English for Work',
        why: 'Strengthens workplace English for bilingual and support roles.',
        course_type_keywords: ['English for Work', 'Business English'],
      },
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Opens bilingual customer support and community-facing roles.',
        course_type_keywords: ['Customer Service'],
      },
    ],
    optional_addons: [
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Supporting skill for remote language-related admin — not the main upgrade.',
        course_type_keywords: ['Microsoft Office', 'Digital Admin'],
      },
      {
        id: 'digital_skills',
        title: 'Digital Skills Course',
        why: 'Useful for remote tutoring and translation support tools.',
        course_type_keywords: ['Digital Skills'],
      },
      {
        id: 'safeguarding_children',
        title: 'Safeguarding for working with children',
        why: 'Useful if tutoring under-18s or education support.',
        course_type_keywords: ['Safeguarding', 'Safeguarding Children'],
      },
    ],
    after_training_roles: [
      'Online English Tutor',
      'Bilingual Customer Support',
      'Translation Support Assistant',
    ],
    cv_focus: 'language skills, communication, reliability and remote availability',
    job_search_terms: ['Bilingual Customer Service', 'Online Tutor', 'Interpreter'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'tech',
    route_title: 'IT / Tech extra income',
    skill_keys: ['tech'],
    priority: 86,
    user_goal: 'Earn through digital, tutoring or junior tech-adjacent side work, then upskill.',
    work_now_opportunity_ids: ['online_tutoring', 'freelance_admin', 'customer_service_remote'],
    work_now_roles: [
      'Online Tutoring',
      'Digital Assistant',
      'IT Support Trainee',
      'Junior Admin / Digital Support',
    ],
    primary_next_upgrades: [
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Foundation for digital assistant, admin and junior IT side work.',
        course_type_keywords: ['Microsoft Office'],
      },
      {
        id: 'digital_skills',
        title: 'Digital Skills Course',
        why: 'Practical digital skills for tutoring, admin and junior tech roles.',
        course_type_keywords: ['Digital Skills', 'IT Support', 'CompTIA'],
      },
    ],
    optional_addons: [
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Helps IT support and client-facing digital roles.',
        course_type_keywords: ['Customer Service'],
      },
    ],
    after_training_roles: ['Digital Assistant', 'IT Support Trainee', 'Junior Admin'],
    cv_focus: 'digital tools, problem-solving, reliability and remote availability',
    job_search_terms: ['Digital Assistant', 'IT Support', 'Online Tutor'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'care',
    route_title: 'Care extra income',
    skill_keys: ['care'],
    priority: 85,
    user_goal: 'Earn through care and support roles with recognised care training.',
    work_now_opportunity_ids: ['care_assistant', 'dog_walking', 'pet_sitting'],
    work_now_roles: ['Care Assistant', 'Support Worker'],
    primary_next_upgrades: [
      {
        id: 'care_certificate',
        title: 'Care Certificate',
        why: 'Standard entry foundation for care and support roles in the UK.',
        course_type_keywords: ['Care Certificate'],
      },
      {
        id: 'safeguarding',
        title: 'Safeguarding Adults',
        why: 'Expected by most care employers alongside the Care Certificate.',
        course_type_keywords: ['Safeguarding'],
      },
    ],
    optional_addons: [
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Useful optional add-on for care employers.',
        course_type_keywords: ['First Aid at Work'],
      },
      {
        id: 'manual_handling',
        title: 'Moving & Handling',
        why: 'Common care requirement for safe physical support work.',
        course_type_keywords: ['Moving and Handling', 'Manual Handling'],
      },
    ],
    after_training_roles: ['Care Assistant', 'Support Worker', 'Healthcare Assistant'],
    cv_focus: 'compassion, reliability, right to work and care-related training',
    job_search_terms: ['Care Assistant', 'Support Worker'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'warehouse',
    route_title: 'Warehouse extra income',
    skill_keys: ['warehouse'],
    priority: 84,
    user_goal: 'Earn through warehouse and logistics shifts, then unlock higher-paid equipment roles.',
    work_now_opportunity_ids: ['warehouse_weekend', 'amazon_flex', 'delivery_driver'],
    work_now_roles: ['Warehouse Operative', 'Picker/Packer'],
    primary_next_upgrades: [
      {
        id: 'forklift',
        title: 'Forklift Licence',
        why: 'Opens higher-paid warehouse and logistics operative roles.',
        course_type_keywords: ['Forklift'],
      },
      {
        id: 'manual_handling',
        title: 'Manual Handling Awareness',
        why: 'Common baseline for warehouse and goods-handling jobs.',
        course_type_keywords: ['Manual Handling', 'Warehouse Safety'],
      },
    ],
    optional_addons: [
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Optional add-on for site and warehouse employers.',
        course_type_keywords: ['First Aid at Work'],
      },
    ],
    after_training_roles: ['Forklift Operator', 'Warehouse Operative'],
    cv_focus: 'reliability, physical readiness, shift flexibility and safety awareness',
    job_search_terms: ['Warehouse Operative', 'Picker Packer', 'Forklift'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'construction',
    route_title: 'Construction extra income',
    skill_keys: ['trades'],
    priority: 83,
    user_goal: 'Enter site work with recognised construction safety credentials.',
    work_now_opportunity_ids: ['warehouse_weekend'],
    work_now_roles: ['Labourer', 'Site Assistant'],
    primary_next_upgrades: [
      {
        id: 'cscs',
        title: 'CSCS Card',
        why: 'Common site entry requirement for construction labour roles.',
        course_type_keywords: ['CSCS', 'Health & Safety in Construction'],
      },
    ],
    optional_addons: [
      {
        id: 'manual_handling',
        title: 'Manual Handling Awareness',
        why: 'Supports safer site and materials handling work.',
        course_type_keywords: ['Manual Handling'],
      },
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Optional for construction sites.',
        course_type_keywords: ['First Aid at Work'],
      },
    ],
    after_training_roles: ['Construction Labourer', 'Site Operative'],
    cv_focus: 'reliability, physical readiness, CSCS pathway and site safety',
    job_search_terms: ['Construction Labourer', 'CSCS', 'Site Operative'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'hospitality',
    route_title: 'Hospitality extra income',
    skill_keys: ['hospitality'],
    priority: 82,
    user_goal: 'Earn through hospitality shifts, then unlock food and front-of-house progression.',
    work_now_opportunity_ids: ['hospitality_weekend', 'bar_staff', 'event_staff'],
    work_now_roles: ['Front of House', 'Kitchen Assistant', 'Bar Staff'],
    primary_next_upgrades: [
      {
        id: 'food_hygiene',
        title: 'Food Hygiene Certificate (Level 2)',
        why: 'Required or strongly preferred for most food-handling roles.',
        course_type_keywords: ['Food Hygiene', 'Food Safety Level 2'],
      },
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Helps front-of-house and supervisor progression.',
        course_type_keywords: ['Customer Service', 'Hospitality Skills'],
      },
    ],
    optional_addons: [
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Useful optional add-on for venues and events.',
        course_type_keywords: ['First Aid at Work'],
      },
      {
        id: 'personal_licence',
        title: 'Personal Licence (Alcohol)',
        why: 'Optional for bar and venue progression.',
        course_type_keywords: ['Personal Licence'],
      },
    ],
    after_training_roles: ['Kitchen Assistant', 'Front of House', 'Bar Supervisor'],
    cv_focus: 'customer service, food hygiene readiness and flexible availability',
    job_search_terms: ['Kitchen Assistant', 'Front of House', 'Bar Staff'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'driving',
    route_title: 'Driving / Delivery extra income',
    skill_keys: ['driving'],
    priority: 80,
    user_goal: 'Earn through delivery and driving side work.',
    work_now_opportunity_ids: ['delivery_driver', 'uber_eats', 'amazon_flex'],
    work_now_roles: ['Delivery Driver', 'Courier'],
    primary_next_upgrades: [
      {
        id: 'taxi_phv',
        title: 'Taxi / Private Hire Licence',
        why: 'Unlocks higher-paid private hire and taxi income where suitable.',
        course_type_keywords: ['Taxi', 'Private Hire'],
      },
    ],
    optional_addons: [
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Optional for passenger or community transport work.',
        course_type_keywords: ['First Aid at Work'],
      },
    ],
    after_training_roles: ['Private Hire Driver', 'Delivery Driver'],
    cv_focus: 'clean driving record, reliability and flexible availability',
    job_search_terms: ['Delivery Driver', 'Courier', 'Private Hire'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'teaching',
    route_title: 'Teaching / Tutoring extra income',
    skill_keys: ['teaching'],
    priority: 79,
    user_goal: 'Earn through tutoring and education support side work.',
    work_now_opportunity_ids: ['online_tutoring', 'exam_invigilator'],
    work_now_roles: [
      'Online Tutor',
      'Exam Invigilator',
      'Study Support Assistant',
      'Language Tutor',
    ],
    primary_next_upgrades: [
      {
        id: 'tefl',
        title: 'TEFL / Teaching English Online',
        why: 'Unlocks online English tutoring and teaching platforms.',
        course_type_keywords: ['TEFL', 'Teaching English Online', 'TESOL'],
      },
      {
        id: 'safeguarding_children',
        title: 'Safeguarding for working with children',
        why: 'Often expected for tutoring and education support roles.',
        course_type_keywords: ['Safeguarding', 'Safeguarding Children'],
      },
      {
        id: 'teaching_assistant',
        title: 'Teaching Assistant basics',
        why: 'Supports school, study support and tutoring progression.',
        course_type_keywords: ['Teaching Assistant', 'TA Course'],
      },
    ],
    optional_addons: [
      {
        id: 'english_for_work',
        title: 'English for Work',
        why: 'Useful when supporting learners or bilingual tutoring.',
        course_type_keywords: ['English for Work', 'Business English'],
      },
      {
        id: 'digital_skills',
        title: 'Digital Skills Course',
        why: 'Helps with online tutoring platforms and remote delivery.',
        course_type_keywords: ['Digital Skills', 'Digital tutoring'],
      },
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Supporting skill for lesson prep and tutoring admin — not the main upgrade.',
        course_type_keywords: ['Microsoft Office'],
      },
    ],
    after_training_roles: ['Teaching Assistant', 'Online English Tutor', 'Study Support Lead'],
    cv_focus: 'subject knowledge, communication, safeguarding awareness and reliability',
    job_search_terms: [
      'Online Tutor',
      'Exam Invigilator',
      'Study Support Assistant',
      'Language Tutor',
      'Teaching Assistant',
    ],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'admin',
    route_title: 'Admin / Office extra income',
    skill_keys: ['administration', 'writing'],
    priority: 78,
    user_goal: 'Earn through admin, VA and office-friendly side work.',
    work_now_opportunity_ids: ['freelance_admin', 'customer_service_remote', 'exam_invigilator'],
    work_now_roles: ['Admin Assistant', 'Virtual Assistant', 'Digital Support'],
    primary_next_upgrades: [
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Core requirement for most UK admin and VA roles.',
        course_type_keywords: ['Microsoft Office'],
      },
      {
        id: 'digital_skills',
        title: 'Digital Skills Course',
        why: 'Supports remote admin tools and digital workflows.',
        course_type_keywords: ['Digital Skills'],
      },
    ],
    optional_addons: [
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Helps reception and client-facing admin applications.',
        course_type_keywords: ['Customer Service'],
      },
    ],
    after_training_roles: ['Admin Assistant', 'Virtual Assistant', 'Office Administrator'],
    cv_focus: 'organisation, Microsoft Office and reliable remote communication',
    job_search_terms: ['Admin Assistant', 'Virtual Assistant', 'Office Administrator'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
  {
    route_id: 'general',
    route_title: 'Flexible extra income',
    skill_keys: ['general', 'cleaning', 'creative', 'photography', 'marketing'],
    priority: 10,
    user_goal: 'Earn flexible side income with practical UK starter roles and broadly useful training.',
    work_now_opportunity_ids: ['delivery_driver', 'cleaner_evenings', 'retail_assistant', 'warehouse_weekend'],
    work_now_roles: ['Delivery Driver', 'Retail Assistant', 'Warehouse Operative', 'Cleaner'],
    primary_next_upgrades: [
      {
        id: 'customer_service',
        title: 'Customer Service Skills',
        why: 'Useful across many UK starter and customer-facing roles.',
        course_type_keywords: ['Customer Service'],
      },
      {
        id: 'ms_office',
        title: 'Microsoft Office Certification',
        why: 'Supports admin and many entry-level applications.',
        course_type_keywords: ['Microsoft Office'],
      },
    ],
    optional_addons: [
      {
        id: 'food_hygiene',
        title: 'Food Hygiene Certificate (Level 2)',
        why: 'Optional if you take hospitality or food retail shifts.',
        course_type_keywords: ['Food Hygiene', 'Food Safety'],
      },
      {
        id: 'first_aid',
        title: 'First Aid at Work',
        why: 'Optional broadly useful add-on — not the main upgrade by default.',
        course_type_keywords: ['First Aid at Work'],
      },
      {
        id: 'sia_door',
        title: 'SIA Door Supervisor',
        why: 'Security path option only if you want event/door work later.',
        course_type_keywords: ['SIA Door Supervisor'],
      },
    ],
    after_training_roles: ['Customer Service Assistant', 'Admin Assistant'],
    cv_focus: 'reliability, availability and transferable customer service skills',
    job_search_terms: ['Delivery Driver', 'Retail Assistant', 'Warehouse Operative'],
    allow_sia: false,
    allow_first_aid_as_primary: false,
  },
]

/** Resolve the best Extra Income route from selected skills. */
export function resolveExtraIncomeRoute(skills: Iterable<string>): CareerRouteLogic {
  const set = new Set([...skills].map((s) => s.trim().toLowerCase()).filter(Boolean))
  if (set.size === 0) set.add('general')

  // Explicit security always wins
  if (set.has('security')) {
    return ROUTES.find((r) => r.route_id === 'security')!
  }

  const matches = ROUTES.filter(
    (r) => r.route_id !== 'general' && r.skill_keys.some((k) => set.has(k))
  ).sort((a, b) => b.priority - a.priority)

  return matches[0] ?? ROUTES.find((r) => r.route_id === 'general')!
}

export function isFirstAidCourseType(titleOrId: string): boolean {
  return /first\s*aid/i.test(titleOrId)
}

export function isSiaCourseType(titleOrId: string): boolean {
  return /sia|door\s*supervisor/i.test(titleOrId)
}

/**
 * Relevance guard: can this training be the primary next upgrade for the route?
 */
export function canBePrimaryUpgrade(route: CareerRouteLogic, course: CourseTypeRec): boolean {
  if (isSiaCourseType(course.id) || isSiaCourseType(course.title)) {
    return route.allow_sia
  }
  if (isFirstAidCourseType(course.id) || isFirstAidCourseType(course.title)) {
    return route.allow_first_aid_as_primary
  }
  return route.primary_next_upgrades.some((p) => p.id === course.id || p.title === course.title)
}

/** Ordered primary + optional course types for the route (primaries first). */
export function orderedRouteCourseTypes(route: CareerRouteLogic): {
  primary: CourseTypeRec[]
  optional: CourseTypeRec[]
} {
  const primary = route.primary_next_upgrades.filter((c) => canBePrimaryUpgrade(route, c))
  const optional = [
    ...route.primary_next_upgrades.filter((c) => !primary.some((p) => p.id === c.id)),
    ...route.optional_addons.filter((c) => {
      // On non-security routes, keep SIA out of optional unless general "security path option"
      if ((isSiaCourseType(c.id) || isSiaCourseType(c.title)) && !route.allow_sia) {
        return route.route_id === 'general'
      }
      return true
    }),
  ]
  return { primary, optional }
}

export function trainingHelpsRouteProgress(
  route: CareerRouteLogic,
  trainingTitle: string
): boolean {
  const blob = trainingTitle.toLowerCase()
  const all = [...route.primary_next_upgrades, ...route.optional_addons]
  return all.some(
    (c) =>
      c.title.toLowerCase() === blob ||
      c.course_type_keywords.some((k) => blob.includes(k.toLowerCase()) || k.toLowerCase().includes(blob))
  )
}

export { ROUTES as EXTRA_INCOME_ROUTE_LOGIC }
