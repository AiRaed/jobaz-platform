/**
 * Looking for Extra Income — small route library (MVP).
 * Category → option → result. Not a deep profession tree.
 */

export type ExtraIncomeCategoryId =
  | 'start_without_licence'
  | 'quick_shifts_short_training'
  | 'licence_based'
  | 'online_from_home'

export type ExtraIncomeStartSpeed =
  | 'fastest'
  | 'short_training'
  | 'licence_required'
  | 'portfolio_needed'

export type ExtraIncomeCategory = {
  id: ExtraIncomeCategoryId
  label: string
  short_description: string
  sort_order: number
}

export type ExtraIncomeOption = {
  id: string
  option_title: string
  category: ExtraIncomeCategoryId
  short_description: string
  time_fit: string
  start_speed: ExtraIncomeStartSpeed
  needs_licence: boolean
  needs_short_training: boolean
  recommended_courses_or_licences: string[]
  possible_job_titles: string[]
  job_search_keywords: string[]
  first_steps: string[]
  warning_note?: string | null
  /** Online / from home: skills or portfolio prep bullets. */
  skills_or_portfolio?: string[]
  /** Optional boosters for no-licence / online routes. */
  optional_boosters?: string[]
  /** DBS-style checks — shown as checks, not course products. */
  required_checks?: string[]
}

export const EXTRA_INCOME_CATEGORIES: ExtraIncomeCategory[] = [
  {
    id: 'start_without_licence',
    label: 'Start without licence',
    short_description: 'Jobs and options that usually do not need a formal licence before applying.',
    sort_order: 10,
  },
  {
    id: 'quick_shifts_short_training',
    label: 'Quick shifts with short training',
    short_description: 'Short courses that can improve chances for part-time or shift work quickly.',
    sort_order: 20,
  },
  {
    id: 'licence_based',
    label: 'Licence-based extra income',
    short_description: 'Routes where a licence, check, or formal training is central.',
    sort_order: 30,
  },
  {
    id: 'online_from_home',
    label: 'Online / from home',
    short_description: 'Flexible online or home-based options you can build around other work.',
    sort_order: 40,
  },
]

function opt(
  partial: ExtraIncomeOption
): ExtraIncomeOption {
  return {
    warning_note: null,
    optional_boosters: [],
    skills_or_portfolio: [],
    required_checks: [],
    ...partial,
  }
}

export const EXTRA_INCOME_OPTIONS: ExtraIncomeOption[] = [
  // --- Start without licence ---
  opt({
    id: 'retail-weekend-assistant',
    option_title: 'Retail Weekend Assistant',
    category: 'start_without_licence',
    short_description: 'Shop-floor help on weekends or evenings — customer service and till support.',
    time_fit: 'Evenings / weekends',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Retail Assistant', 'Weekend Retail Assistant', 'Sales Assistant', 'Shop Floor Assistant'],
    job_search_keywords: ['retail assistant weekend', 'part time retail', 'shop assistant evenings'],
    first_steps: [
      'Update your CV with customer service and availability',
      'Search weekend and evening retail roles near you',
      'Apply to 5–10 shops this week',
    ],
    optional_boosters: ['Customer Service', 'Food Safety Level 2'],
  }),
  opt({
    id: 'hospitality-foh',
    option_title: 'Hospitality Front of House',
    category: 'start_without_licence',
    short_description: 'Waiting, bar support, or hotel front of house for extra shifts.',
    time_fit: 'Evenings / weekends',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Waiter / Waitress', 'Front of House Assistant', 'Bar Staff', 'Restaurant Host'],
    job_search_keywords: ['front of house part time', 'waiter weekend', 'hospitality evenings'],
    first_steps: [
      'List hospitality or customer-facing experience on your CV',
      'Apply to local pubs, cafes, and restaurants for evening shifts',
    ],
    optional_boosters: ['Food Safety Level 2', 'Customer Service', 'First Aid'],
  }),
  opt({
    id: 'kitchen-porter',
    option_title: 'Kitchen Porter',
    category: 'start_without_licence',
    short_description: 'Kitchen support and cleaning — often flexible evening shifts.',
    time_fit: 'Evenings / weekends',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Kitchen Porter', 'Kitchen Assistant', 'Catering Assistant'],
    job_search_keywords: ['kitchen porter', 'KP part time', 'kitchen assistant evenings'],
    first_steps: [
      'Highlight reliability and shift availability',
      'Apply to hotels, restaurants, and catering kitchens',
    ],
    optional_boosters: ['Food Safety Level 2', 'Manual Handling'],
  }),
  opt({
    id: 'cleaning-jobs',
    option_title: 'Cleaning Jobs',
    category: 'start_without_licence',
    short_description: 'Domestic or commercial cleaning — often early mornings or evenings.',
    time_fit: 'Flexible / early mornings / evenings',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Cleaner', 'Commercial Cleaner', 'Office Cleaner', 'Domestic Cleaner'],
    job_search_keywords: ['cleaner part time', 'office cleaner', 'domestic cleaner evenings'],
    first_steps: [
      'Note transport and preferred hours on applications',
      'Search local cleaning agencies and direct employer ads',
    ],
    optional_boosters: ['COSHH', 'Health & Safety at Work', 'Manual Handling'],
  }),
  opt({
    id: 'warehouse-shifts',
    option_title: 'Warehouse Shifts',
    category: 'start_without_licence',
    short_description: 'Picking, packing, or goods-in roles — nights and weekends common.',
    time_fit: 'Shifts / nights / weekends',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Warehouse Operative', 'Picker Packer', 'Goods In Assistant', 'Packing Operative'],
    job_search_keywords: ['warehouse operative part time', 'picker packer nights', 'goods in'],
    first_steps: [
      'Confirm you can do standing/physical work and shift hours',
      'Apply via agencies and large warehouse employers',
    ],
    optional_boosters: ['Manual Handling', 'Health & Safety at Work'],
  }),
  opt({
    id: 'event-steward',
    option_title: 'Event Steward / Matchday Steward',
    category: 'start_without_licence',
    short_description: 'Crowd guidance and event support — often no SIA for stewarding roles.',
    time_fit: 'Weekends / events',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Event Steward', 'Matchday Steward', 'Event Security Steward', 'Venue Steward'],
    job_search_keywords: ['event steward', 'matchday steward', 'stadium steward'],
    first_steps: [
      'Register with event stewarding agencies',
      'Keep evenings/weekends free around fixtures and events',
    ],
    warning_note: 'Some licensed venue security roles need an SIA licence — stewarding often starts without one.',
    optional_boosters: ['First Aid', 'Customer Service'],
  }),
  opt({
    id: 'admin-data-entry-pt',
    option_title: 'Admin / Data Entry Part-time',
    category: 'start_without_licence',
    short_description: 'Office support, filing, and data entry for a few hours a week.',
    time_fit: 'Flexible / weekdays',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Admin Assistant', 'Data Entry Clerk', 'Office Assistant', 'Reception Cover'],
    job_search_keywords: ['admin assistant part time', 'data entry part time', 'office assistant'],
    first_steps: [
      'List Microsoft Office / Google Workspace skills on your CV',
      'Apply to local offices and remote admin listings',
    ],
    optional_boosters: ['Microsoft Office', 'Excel', 'Customer Service'],
  }),
  opt({
    id: 'customer-service-pt',
    option_title: 'Customer Service Part-time',
    category: 'start_without_licence',
    short_description: 'Phone, chat, or face-to-face customer support for extra hours.',
    time_fit: 'Flexible / evenings',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Customer Service Advisor', 'Call Handler', 'Live Chat Advisor', 'Contact Centre Advisor'],
    job_search_keywords: ['customer service part time', 'call centre evenings', 'live chat advisor'],
    first_steps: [
      'Highlight communication and problem-solving examples',
      'Search contact centres and retail customer service roles',
    ],
    optional_boosters: ['Customer Service', 'Complaint Handling'],
  }),
  opt({
    id: 'delivery-helper',
    option_title: 'Delivery Helper / Courier Helper',
    category: 'start_without_licence',
    short_description: 'Helping with multi-drop routes or parcel support (not always solo driving).',
    time_fit: 'Flexible / peaks',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Delivery Driver Mate', 'Courier Assistant', 'Parcel Sorter', 'Van Mate'],
    job_search_keywords: ['delivery driver mate', 'courier assistant', 'van mate'],
    first_steps: [
      'Check if a driving licence is required for the specific role',
      'Apply to courier firms and local delivery ads',
    ],
    warning_note: 'Solo driver/courier roles usually need a full UK driving licence.',
    optional_boosters: ['Customer Service'],
  }),
  opt({
    id: 'house-help-pet-sitting',
    option_title: 'House Help / Pet Sitting',
    category: 'start_without_licence',
    short_description: 'Local house help, pet sitting, or light domestic support.',
    time_fit: 'Flexible',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Pet Sitter', 'House Sitter', 'Domestic Helper', 'Home Help'],
    job_search_keywords: ['pet sitting', 'house sitting', 'home help local'],
    first_steps: [
      'Use trusted local platforms or word of mouth',
      'Set clear rates and availability',
    ],
  }),
  opt({
    id: 'gardening-helper',
    option_title: 'Gardening Helper',
    category: 'start_without_licence',
    short_description: 'Garden clear-ups and basic outdoor help for local clients.',
    time_fit: 'Weekends / daylight hours',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Gardening Assistant', 'Garden Clearance Helper', 'Grounds Maintenance Assistant'],
    job_search_keywords: ['gardening assistant', 'garden clearance', 'grounds maintenance part time'],
    first_steps: [
      'Offer weekend slots to neighbours and local groups',
      'List tools you can use safely',
    ],
  }),
  opt({
    id: 'handyman-helper',
    option_title: 'Local Handyman Helper',
    category: 'start_without_licence',
    short_description: 'Assisting with small practical jobs — not regulated gas/electrical work.',
    time_fit: 'Flexible / weekends',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Handyman Assistant', 'Odd Job Helper', 'Maintenance Helper'],
    job_search_keywords: ['handyman assistant', 'odd jobs local', 'maintenance helper'],
    first_steps: [
      'Stick to non-regulated tasks only',
      'Build local reviews from small paid jobs',
    ],
    warning_note: 'Do not take gas, electrical, or other regulated work without the right qualifications.',
  }),

  // --- Quick shifts with short training (work routes; courses in result) ---
  opt({
    id: 'kitchen-food-shifts',
    option_title: 'Kitchen / Food Assistant Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Kitchen and food retail shift work — short food safety training helps applications.',
    time_fit: 'Evenings / weekends',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Food Safety Level 2',
      'Food Hygiene',
      'Allergy Awareness',
    ],
    possible_job_titles: [
      'Kitchen Assistant',
      'Kitchen Porter',
      'Catering Assistant',
      'Food Retail Assistant',
    ],
    job_search_keywords: [
      'kitchen assistant',
      'kitchen porter',
      'catering assistant',
      'food retail',
    ],
    first_steps: [
      'Complete Food Safety Level 2 / Food Hygiene if you can',
      'Add availability for evenings and weekends to your CV',
      'Apply to kitchens, cafes, and food retail shifts',
    ],
  }),
  opt({
    id: 'hospitality-bar-foh-shifts',
    option_title: 'Hospitality Bar / Front of House Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Bar and front-of-house shifts — short training can strengthen applications.',
    time_fit: 'Evenings / weekends',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Food Safety Level 2',
      'Customer Service',
      'Allergy Awareness',
    ],
    possible_job_titles: [
      'Bar Staff',
      'Front of House Assistant',
      'Waiter / Waitress',
      'Restaurant Host',
    ],
    job_search_keywords: [
      'bar staff part time',
      'front of house evenings',
      'waiter weekend',
    ],
    first_steps: [
      'Complete Food Safety Level 2 where useful for bar/kitchen-adjacent roles',
      'Highlight customer service and evening availability',
      'Apply to pubs, restaurants, and hotels',
    ],
  }),
  opt({
    id: 'warehouse-factory-shifts',
    option_title: 'Warehouse / Factory Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Warehouse and factory shift work — short safety training can help you start faster.',
    time_fit: 'Shifts / nights / weekends',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Manual Handling',
      'Health & Safety at Work',
      'Warehouse Safety',
    ],
    possible_job_titles: [
      'Warehouse Operative',
      'Picker/Packer',
      'Factory Operative',
      'Goods In Assistant',
    ],
    job_search_keywords: [
      'warehouse operative',
      'picker packer',
      'factory operative',
      'goods in',
    ],
    first_steps: [
      'Complete Manual Handling and basic H&S if possible',
      'Apply to warehouses and factories hiring shift workers',
    ],
  }),
  opt({
    id: 'cleaning-facilities-shifts',
    option_title: 'Cleaning / Facilities Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Cleaning and facilities shifts — COSHH and H&S short training support applications.',
    time_fit: 'Early mornings / evenings / flexible',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'COSHH',
      'Health & Safety at Work',
      'Manual Handling',
    ],
    possible_job_titles: [
      'Cleaner',
      'Commercial Cleaner',
      'Housekeeping Assistant',
      'Facilities Assistant',
    ],
    job_search_keywords: [
      'cleaner part time',
      'commercial cleaner',
      'housekeeping assistant',
      'facilities assistant',
    ],
    first_steps: [
      'Complete COSHH awareness if you can',
      'Apply to cleaning contractors and facilities employers',
    ],
  }),
  opt({
    id: 'event-stewarding-shifts',
    option_title: 'Event / Stewarding Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Event and matchday stewarding — First Aid and customer service help applications.',
    time_fit: 'Weekends / evenings / events',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'First Aid',
      'Emergency First Aid at Work',
      'Customer Service',
      'Event Stewarding / Matchday Stewarding',
    ],
    possible_job_titles: [
      'Event Steward',
      'Matchday Steward',
      'Venue Assistant',
      'Crowd Support Steward',
    ],
    job_search_keywords: [
      'event steward',
      'matchday steward',
      'venue assistant',
      'crowd steward',
    ],
    first_steps: [
      'Complete First Aid if possible',
      'Apply to event agencies and stadium stewarding roles',
    ],
  }),
  opt({
    id: 'retail-cs-shifts',
    option_title: 'Retail / Customer Service Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Retail and customer service shifts — short CS training can improve chances.',
    time_fit: 'Evenings / weekends / flexible',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Customer Service',
      'Complaint Handling',
      'Business Communication',
    ],
    possible_job_titles: [
      'Retail Assistant',
      'Customer Service Assistant',
      'Call Centre Assistant',
      'Shop Floor Assistant',
    ],
    job_search_keywords: [
      'retail assistant part time',
      'customer service evening',
      'call centre part time',
      'shop floor assistant',
    ],
    first_steps: [
      'Complete a Customer Service short course if useful',
      'Update your CV with availability and customer-facing examples',
      'Apply to shops and contact centres',
    ],
  }),
  opt({
    id: 'care-support-shifts',
    option_title: 'Care Support Shifts',
    category: 'quick_shifts_short_training',
    short_description: 'Care and support shifts — entry training and DBS checks are usually required.',
    time_fit: 'Shifts / evenings / weekends',
    start_speed: 'short_training',
    needs_licence: false,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Care Certificate',
      'Safeguarding Adults',
      'Moving & Handling',
    ],
    required_checks: ['DBS check'],
    possible_job_titles: [
      'Care Assistant',
      'Support Worker',
      'Home Care Assistant',
    ],
    job_search_keywords: [
      'care assistant part time',
      'support worker shifts',
      'home care assistant',
    ],
    first_steps: [
      'Start Care Certificate / employer induction pathway',
      'Complete DBS via employer where required',
      'Apply to care agencies and home care providers',
    ],
    warning_note:
      'Most care roles need DBS and employer checks. Treat checks as required, not optional.',
  }),

  // --- Licence-based (work routes; licences in result) ---
  opt({
    id: 'security-shifts',
    option_title: 'Security Shifts',
    category: 'licence_based',
    short_description: 'Door, retail, and venue security — SIA licence comes first.',
    time_fit: 'Nights / weekends / events',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'SIA Door Supervisor',
      'Emergency First Aid at Work',
    ],
    possible_job_titles: [
      'Door Supervisor',
      'Retail Security Officer',
      'Venue Security Officer',
      'Event Security',
    ],
    job_search_keywords: [
      'door supervisor SIA',
      'retail security officer',
      'venue security',
      'event security',
    ],
    first_steps: [
      'Book an SIA Door Supervisor course with a real provider',
      'Apply for your SIA licence after training',
      'Then apply to door, retail, and event security roles',
    ],
    warning_note:
      'You cannot legally work as a licensed Door Supervisor without a valid SIA licence. This is not an immediate start route.',
  }),
  opt({
    id: 'cctv-control-room',
    option_title: 'CCTV / Control Room Work',
    category: 'licence_based',
    short_description: 'CCTV and control room work — SIA CCTV licence comes first.',
    time_fit: 'Shifts / nights',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'SIA CCTV Operator',
      'SIA Public Space Surveillance (CCTV)',
    ],
    possible_job_titles: [
      'CCTV Operator',
      'Control Room Operator',
      'Security Control Room Assistant',
    ],
    job_search_keywords: [
      'CCTV operator SIA',
      'control room operator',
      'PSS CCTV',
    ],
    first_steps: [
      'Complete SIA CCTV / PSS training',
      'Obtain your SIA licence',
      'Apply to CCTV and control room roles',
    ],
    warning_note: 'Licensed CCTV operator roles require a valid SIA licence — not an immediate start.',
  }),
  opt({
    id: 'forklift-flt-warehouse',
    option_title: 'Forklift / FLT Warehouse Shifts',
    category: 'licence_based',
    short_description: 'Warehouse FLT shifts — forklift certification comes first.',
    time_fit: 'Shifts / nights',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Forklift Counterbalance',
      'Forklift Reach Truck',
      'Manual Handling',
    ],
    possible_job_titles: [
      'Forklift Driver',
      'FLT Warehouse Operative',
      'Goods In Operative',
    ],
    job_search_keywords: [
      'forklift driver',
      'FLT warehouse',
      'goods in operative',
    ],
    first_steps: [
      'Complete counterbalance or reach truck training',
      'Get certified before applying to FLT roles',
      'Apply to warehouses hiring licensed FLT drivers',
    ],
    warning_note:
      'Most FLT driving roles require valid forklift certification — do not claim you can start without it.',
  }),
  opt({
    id: 'taxi-phv-driving',
    option_title: 'Taxi / Private Hire Driving',
    category: 'licence_based',
    short_description: 'Taxi / PHV driving — local authority licence and checks come first.',
    time_fit: 'Flexible / evenings',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: ['PHV / Taxi licensing support'],
    required_checks: ['Local authority PHV / taxi checks'],
    possible_job_titles: [
      'Private Hire Driver',
      'Taxi Driver',
      'Airport Transfer Driver',
    ],
    job_search_keywords: [
      'private hire driver',
      'PHV licence',
      'taxi driver',
      'airport transfer driver',
    ],
    first_steps: [
      'Check your local council PHV/taxi requirements',
      'Complete required checks and any approved training',
      'Apply for your licence before taking paid jobs',
    ],
    warning_note:
      'You must hold the correct local authority licence before working as a taxi/PHV driver.',
  }),
  opt({
    id: 'hgv-lgv-driving',
    option_title: 'HGV / LGV Driving Route',
    category: 'licence_based',
    short_description: 'HGV/LGV driving — a longer licence pathway, not a quick weekend start.',
    time_fit: 'Full days / nights once qualified',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: ['HGV / LGV training', 'Driver CPC'],
    possible_job_titles: ['HGV Driver', 'LGV Driver', 'Delivery Driver'],
    job_search_keywords: ['HGV driver', 'LGV driver', 'Driver CPC'],
    first_steps: [
      'Plan medical, theory, and practical training costs/time',
      'Complete Driver CPC where required',
      'Apply to haulage firms after you are licensed',
    ],
    warning_note: 'This is a longer pathway — not immediate extra income.',
  }),
  opt({
    id: 'care-support-licence',
    option_title: 'Care / Support Shifts',
    category: 'licence_based',
    short_description: 'Care and support shifts — training and DBS checks come first.',
    time_fit: 'Shifts / evenings / weekends',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'Care Certificate',
      'Safeguarding Adults',
      'Moving & Handling',
    ],
    required_checks: ['DBS check'],
    possible_job_titles: [
      'Care Assistant',
      'Support Worker',
      'Home Care Assistant',
    ],
    job_search_keywords: [
      'care assistant',
      'support worker DBS',
      'home care',
    ],
    first_steps: [
      'Start Care Certificate / employer induction pathway',
      'Complete required DBS/checks via employer where needed',
      'Apply to care agencies and home care providers',
    ],
    warning_note:
      'DBS and employer checks are required for most care roles — treat checks seriously, not as optional.',
  }),
  opt({
    id: 'construction-labouring',
    option_title: 'Construction Labouring / Site Work',
    category: 'licence_based',
    short_description: 'Site labouring — CSCS / construction H&S comes before most site work.',
    time_fit: 'Weekday site hours / overtime',
    start_speed: 'licence_required',
    needs_licence: true,
    needs_short_training: true,
    recommended_courses_or_licences: [
      'CSCS Green Card / Level 1 Health & Safety in Construction',
      'Manual Handling',
      'Asbestos Awareness',
    ],
    possible_job_titles: [
      'Labourer',
      'Site Assistant',
      'Construction Operative',
    ],
    job_search_keywords: [
      'labourer CSCS',
      'site assistant',
      'construction operative',
    ],
    first_steps: [
      'Complete Level 1 Health & Safety in Construction / CSCS route',
      'Apply for your CSCS card',
      'Then apply to site labouring roles',
    ],
    warning_note:
      'Many sites require a CSCS card before you can start — not an immediate walk-on for all sites.',
  }),

  // --- Online / from home ---
  opt({
    id: 'online-tutoring',
    option_title: 'Online Tutoring',
    category: 'online_from_home',
    short_description: 'Teach subjects you know online — evenings and weekends work well.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Online Tutor', 'Subject Tutor', 'Homework Support Tutor'],
    job_search_keywords: ['online tutor', 'private tutor UK', 'GCSE tutor online'],
    first_steps: [
      'List subjects and levels you can teach',
      'Create a short profile and sample lesson outline',
      'Join tutoring platforms or advertise locally online',
    ],
    skills_or_portfolio: [
      'Subject knowledge examples',
      'Clear availability and rates',
      'Short intro video or lesson sample (optional)',
    ],
    optional_boosters: ['Safeguarding Children'],
  }),
  opt({
    id: 'language-interpreting',
    option_title: 'Language Support / Interpreting',
    category: 'online_from_home',
    short_description: 'Help with language support, community interpreting, or bilingual customer work.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Language Support Assistant', 'Community Interpreter', 'Bilingual Customer Advisor', 'Remote Interpreter'],
    job_search_keywords: ['community interpreter', 'bilingual customer service', 'language support remote'],
    first_steps: [
      'List languages and fluency levels clearly',
      'Gather examples of helping people across languages',
      'Apply to remote language support and community roles',
    ],
    skills_or_portfolio: [
      'Language pairs and fluency',
      'Any interpreting or community support experience',
      'Professional communication samples',
    ],
    optional_boosters: ['Customer Service', 'Business Communication'],
  }),
  opt({
    id: 'data-entry-admin-remote',
    option_title: 'Data Entry / Admin Support',
    category: 'online_from_home',
    short_description: 'Remote data entry and virtual admin support.',
    time_fit: 'Online / flexible',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Remote Data Entry Clerk', 'Virtual Admin Assistant', 'Online Admin Support'],
    job_search_keywords: ['remote data entry', 'virtual assistant admin', 'online admin UK'],
    first_steps: [
      'Show accuracy and software skills on your CV',
      'Apply to remote admin and data entry listings',
    ],
    skills_or_portfolio: ['Typing accuracy', 'Spreadsheets / Office tools', 'Reliable home workspace'],
    optional_boosters: ['Microsoft Office', 'Excel'],
  }),
  opt({
    id: 'social-media-content',
    option_title: 'Social Media Content Help',
    category: 'online_from_home',
    short_description: 'Help small businesses with posts, captions, and simple content.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Social Media Assistant', 'Content Creator', 'Social Media Coordinator'],
    job_search_keywords: ['social media assistant freelance', 'content creator part time', 'Instagram assistant'],
    first_steps: [
      'Build 3–5 sample posts for a fictional or real local brand',
      'Offer a small package to one local business',
    ],
    skills_or_portfolio: ['Sample posts', 'Canva or similar basics', 'Clear content calendar example'],
    optional_boosters: ['Social Media Content', 'Digital Marketing'],
  }),
  opt({
    id: 'graphic-video-freelance',
    option_title: 'Graphic Design / Video Editing Freelance',
    category: 'online_from_home',
    short_description: 'Freelance design or short-form video editing for local clients.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Freelance Graphic Designer', 'Video Editor', 'Motion Graphics Freelancer'],
    job_search_keywords: ['freelance graphic designer', 'video editor freelance UK', 'short form video editor'],
    first_steps: [
      'Prepare a small portfolio (3–6 pieces)',
      'List services and turnaround times',
    ],
    skills_or_portfolio: ['Portfolio samples', 'Software list (e.g. Premiere, Photoshop)', 'Before/after or process notes'],
    optional_boosters: ['Adobe Photoshop', 'Adobe Premiere / Video Editing', 'Portfolio Building'],
  }),
  opt({
    id: 'wordpress-support',
    option_title: 'Website / WordPress Support',
    category: 'online_from_home',
    short_description: 'Help clients update WordPress sites and fix simple content issues.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['WordPress Support Assistant', 'Web Support Freelancer', 'Website Content Editor'],
    job_search_keywords: ['WordPress support freelance', 'website content editor', 'web support remote'],
    first_steps: [
      'Document 2–3 sites you can show (or rebuild a demo)',
      'Offer monthly update packages',
    ],
    skills_or_portfolio: ['Demo site or screenshots', 'Plugin/theme familiarity', 'Clear support scope'],
    optional_boosters: ['IT Support Basics'],
  }),
  opt({
    id: 'cv-translation-docs',
    option_title: 'CV / Translation / Document Help',
    category: 'online_from_home',
    short_description: 'Help others with CVs, translations, or document formatting.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['CV Writer Assistant', 'Document Formatter', 'Freelance Translator'],
    job_search_keywords: ['CV writing freelance', 'document formatting', 'freelance translator UK'],
    first_steps: [
      'Create before/after CV samples (anonymised)',
      'Set per-document pricing',
    ],
    skills_or_portfolio: ['Sample CV edits', 'Language pairs if translating', 'Formatting quality examples'],
    optional_boosters: ['Business Communication', 'Microsoft Office'],
  }),
  opt({
    id: 'reselling-online',
    option_title: 'Reselling / Small Online Sales',
    category: 'online_from_home',
    short_description: 'Buy/sell or list small items online as a flexible side stream.',
    time_fit: 'Online / flexible',
    start_speed: 'fastest',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Online Reseller', 'Marketplace Seller', 'E-commerce Side Hustle Operator'],
    job_search_keywords: ['online reseller', 'eBay seller', 'Vinted seller'],
    first_steps: [
      'Choose one marketplace and list 10 items carefully',
      'Track fees, postage, and profit honestly',
    ],
    skills_or_portfolio: ['Product photos', 'Honest listings', 'Basic bookkeeping of sales'],
    warning_note: 'Income varies — do not treat reselling as guaranteed earnings.',
  }),
  opt({
    id: 'virtual-assistant',
    option_title: 'Virtual Assistant',
    category: 'online_from_home',
    short_description: 'Remote admin, inbox, and scheduling support for small businesses.',
    time_fit: 'Online / flexible',
    start_speed: 'portfolio_needed',
    needs_licence: false,
    needs_short_training: false,
    recommended_courses_or_licences: [],
    possible_job_titles: ['Virtual Assistant', 'Remote Executive Assistant', 'Online Business Support'],
    job_search_keywords: ['virtual assistant UK', 'remote VA', 'online admin support'],
    first_steps: [
      'Define services (email, calendar, research)',
      'Offer a trial week to one client',
    ],
    skills_or_portfolio: ['Service list', 'Tools you use', 'Sample task checklist'],
    optional_boosters: ['Microsoft Office', 'Customer Service', 'Admin Skills'],
  }),
]

export function listExtraIncomeCategories(): ExtraIncomeCategory[] {
  return [...EXTRA_INCOME_CATEGORIES].sort((a, b) => a.sort_order - b.sort_order)
}

export function getExtraIncomeCategory(id: string): ExtraIncomeCategory | null {
  return EXTRA_INCOME_CATEGORIES.find((c) => c.id === id) ?? null
}

export function listExtraIncomeOptions(categoryId?: string | null): ExtraIncomeOption[] {
  if (!categoryId) return EXTRA_INCOME_OPTIONS
  return EXTRA_INCOME_OPTIONS.filter((o) => o.category === categoryId)
}

export function getExtraIncomeOption(optionId: string): ExtraIncomeOption | null {
  return EXTRA_INCOME_OPTIONS.find((o) => o.id === optionId) ?? null
}

export function getExtraIncomeOptionByTitle(
  categoryId: ExtraIncomeCategoryId,
  title: string
): ExtraIncomeOption | null {
  const needle = title.trim().toLowerCase()
  return (
    EXTRA_INCOME_OPTIONS.find(
      (o) => o.category === categoryId && o.option_title.toLowerCase() === needle
    ) ?? null
  )
}
