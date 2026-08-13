/**
 * Start New Career — broad work-type categories → beginner WIP routes.
 * Reuses Work in My Profession fields/specialisms; does not modify WIP.
 */

export type SncWorkTypeId =
  | 'practical_hands_on'
  | 'care_support_education'
  | 'office_admin_cs'
  | 'driving_warehouse_logistics'
  | 'security_licensed'
  | 'digital_it_creative'
  | 'hospitality_retail_local'
  | 'not_sure'

export type SncWorkType = {
  id: SncWorkTypeId
  label: string
  short_description: string
  sort_order: number
  /** WIP field slugs this category maps to (for analytics / admin). */
  mapped_field_slugs: string[]
}

export type SncRouteKind = 'starter' | 'progression' | 'future_progression'

export type SncCareerRoute = {
  id: string
  label: string
  short_description: string
  work_type_id: SncWorkTypeId
  /** Mapped WIP profession field slug. */
  field_slug: string
  /** Mapped WIP specialism slug. */
  specialism_slug: string
  /** Beginner WIP experience option id. */
  experience_option_id: string
  /** Preferred entry course/licence titles (order matters). */
  entry_course_titles: string[]
  /** Next upgrade course titles. */
  upgrade_course_titles: string[]
  /** Match WIP role titles for "first jobs after first step". */
  first_job_title_hints: string[]
  /** Match WIP role titles for future/progression roles. */
  later_job_title_hints: string[]
  /** starter (default) | progression | future_progression */
  route_kind?: SncRouteKind
  /** Optional public aliases for search / display. */
  aliases?: string[]
  /** Honest start status when user has no licence yet. */
  start_status_without_licence?: string
  /** Honest start status when user already holds the key licence. */
  start_status_with_licence?: string
}

export const SNC_WORK_TYPES: SncWorkType[] = [
  {
    id: 'practical_hands_on',
    label: 'Practical hands-on work',
    short_description:
      'Building, trades, maintenance, cleaning, and local practical work.',
    sort_order: 10,
    mapped_field_slugs: [
      'construction-trades',
      'electrical-technical',
      'plumbing-heating',
      'cleaning-facilities',
      'self-employment-local',
    ],
  },
  {
    id: 'care_support_education',
    label: 'Care, support & education',
    short_description:
      'Care, support work, childcare, teaching assistant, and people support routes.',
    sort_order: 20,
    mapped_field_slugs: ['care-support', 'childcare-education-support'],
  },
  {
    id: 'office_admin_cs',
    label: 'Office, admin & customer service',
    short_description:
      'Admin, reception, call centre, customer service, and office routes.',
    sort_order: 30,
    mapped_field_slugs: ['office-admin', 'customer-service', 'retail-sales'],
  },
  {
    id: 'driving_warehouse_logistics',
    label: 'Driving, warehouse & logistics',
    short_description:
      'Warehouse, delivery, forklift, Bus / PCV, HGV / LGV, transport admin, and future rail routes.',
    sort_order: 40,
    mapped_field_slugs: [
      'warehouse-logistics',
      'driving-transport',
      'manufacturing-engineering',
    ],
  },
  {
    id: 'security_licensed',
    label: 'Security & licensed work',
    short_description:
      'Security, events, CCTV, door supervisor, and licence-based routes.',
    sort_order: 50,
    mapped_field_slugs: ['security-facilities'],
  },
  {
    id: 'digital_it_creative',
    label: 'Digital, IT & creative work',
    short_description:
      'IT support, digital assistant, web support, design, content, and creative routes.',
    sort_order: 60,
    mapped_field_slugs: ['digital-it-support', 'creative-design'],
  },
  {
    id: 'hospitality_retail_local',
    label: 'Hospitality, retail & local services',
    short_description:
      'Kitchen, front of house, hotel, retail, beauty, and customer-facing local work.',
    sort_order: 70,
    mapped_field_slugs: [
      'hospitality',
      'retail-sales',
      'beauty-personal',
      'cleaning-facilities',
    ],
  },
  {
    id: 'not_sure',
    label: 'Not sure — show realistic starter options',
    short_description: 'Show beginner-friendly routes across multiple fields.',
    sort_order: 80,
    mapped_field_slugs: [],
  },
]

function route(partial: SncCareerRoute): SncCareerRoute {
  return partial
}

/** All starter routes (including those shown under Not sure). */
export const SNC_CAREER_ROUTES: SncCareerRoute[] = [
  // --- Practical hands-on ---
  route({
    id: 'construction-labourer',
    label: 'Construction Labourer',
    short_description: 'Site labouring with CSCS and basic site safety first.',
    work_type_id: 'practical_hands_on',
    field_slug: 'construction-trades',
    specialism_slug: 'general-labourer',
    experience_option_id: 'con_labourer',
    entry_course_titles: [
      'CSCS Green Card / Level 1 Health & Safety in Construction',
      'Manual Handling',
      'Asbestos Awareness',
    ],
    upgrade_course_titles: [
      'Working at Height',
      'Emergency First Aid at Work',
    ],
    first_job_title_hints: ['Labourer', 'Site Assistant', 'Construction Operative', 'General Labourer'],
    later_job_title_hints: ['Supervisor', 'Groundwork', 'Skilled'],
  }),
  route({
    id: 'electrician-mate',
    label: 'Electrician Mate / Electrical Assistant',
    short_description: 'Electrical support work — not a fully qualified electrician shortcut.',
    work_type_id: 'practical_hands_on',
    field_slug: 'electrical-technical',
    specialism_slug: 'electrical-improver',
    experience_option_id: 'elec_assisted',
    entry_course_titles: ['Electrical Safety', 'PAT Testing'],
    upgrade_course_titles: [
      '18th Edition Wiring Regulations',
      'CSCS / ECS Card',
      'Fire Alarm / Low Voltage Training',
    ],
    first_job_title_hints: ['Electrical', 'Mate', 'Improver', 'Assistant'],
    later_job_title_hints: ['Electrician', 'Technician'],
  }),
  route({
    id: 'plumbing-assistant',
    label: 'Plumbing Assistant',
    short_description: 'Plumbing support roles — Gas Safe is a longer regulated pathway.',
    work_type_id: 'practical_hands_on',
    field_slug: 'plumbing-heating',
    specialism_slug: 'plumbing',
    experience_option_id: 'plumb_assisted',
    entry_course_titles: ['Plumbing Basics / Maintenance Plumbing'],
    upgrade_course_titles: ['Water Regulations', 'CSCS Card'],
    first_job_title_hints: ['Plumbing', 'Assistant', 'Mate'],
    later_job_title_hints: ['Plumber', 'Heating'],
  }),
  route({
    id: 'maintenance-assistant',
    label: 'Maintenance Assistant',
    short_description: 'Building and facilities maintenance support.',
    work_type_id: 'practical_hands_on',
    field_slug: 'manufacturing-engineering',
    specialism_slug: 'maintenance-assistant',
    experience_option_id: 'mfg_production',
    entry_course_titles: ['Health & Safety at Work', 'Manual Handling'],
    upgrade_course_titles: ['COSHH', 'Quality Control Basics'],
    first_job_title_hints: ['Maintenance', 'Assistant'],
    later_job_title_hints: ['Technician', 'Supervisor'],
  }),
  route({
    id: 'painter-decorator',
    label: 'Painter / Decorator',
    short_description: 'Painting and decorating starter route.',
    work_type_id: 'practical_hands_on',
    field_slug: 'construction-trades',
    specialism_slug: 'painting-decorating',
    experience_option_id: 'con_labourer',
    entry_course_titles: [
      'CSCS Green Card / Level 1 Health & Safety in Construction',
      'Manual Handling',
    ],
    upgrade_course_titles: ['Working at Height', 'Asbestos Awareness'],
    first_job_title_hints: ['Painter', 'Decorator'],
    later_job_title_hints: ['Supervisor', 'Self-employed'],
  }),
  route({
    id: 'cleaning-facilities-route',
    label: 'Cleaning / Facilities Route',
    short_description: 'Cleaning and facilities starter work.',
    work_type_id: 'practical_hands_on',
    field_slug: 'cleaning-facilities',
    specialism_slug: 'general-cleaning',
    experience_option_id: 'clean_domestic',
    entry_course_titles: ['COSHH', 'Health & Safety at Work', 'Cleaning Safety'],
    upgrade_course_titles: ['Manual Handling', 'Infection Control'],
    first_job_title_hints: ['Cleaner', 'Cleaning', 'Facilities'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'handyman-local',
    label: 'Handyman / Local Services Assistant',
    short_description: 'Local handyman and small services — stay within safe, unregulated jobs.',
    work_type_id: 'practical_hands_on',
    field_slug: 'self-employment-local',
    specialism_slug: 'handyman',
    experience_option_id: 'self_small_jobs',
    entry_course_titles: ['Self-employed Basics', 'Health & Safety at Work'],
    upgrade_course_titles: [
      'Insurance / Invoicing / Tax Basics',
      'Customer Service',
      'Marketing for Local Services',
    ],
    first_job_title_hints: ['Handyman', 'Local', 'Maintenance'],
    later_job_title_hints: ['Business', 'Self-employed'],
  }),

  // --- Care / education ---
  route({
    id: 'care-assistant',
    label: 'Care Assistant',
    short_description: 'Enter care with Care Certificate and core safety training.',
    work_type_id: 'care_support_education',
    field_slug: 'care-support',
    specialism_slug: 'care-assistant',
    experience_option_id: 'care_informal',
    entry_course_titles: [
      'Care Certificate',
      'Safeguarding Adults',
      'Moving & Handling',
    ],
    upgrade_course_titles: [
      'Medication Handling',
      'Dementia Awareness',
      'Emergency First Aid at Work',
    ],
    first_job_title_hints: ['Care Assistant', 'Support Worker', 'Home Care'],
    later_job_title_hints: ['Senior Care', 'Supervisor', 'Specialist'],
  }),
  route({
    id: 'support-worker',
    label: 'Support Worker',
    short_description: 'Community and supported living support roles.',
    work_type_id: 'care_support_education',
    field_slug: 'care-support',
    specialism_slug: 'support-worker',
    experience_option_id: 'care_informal',
    entry_course_titles: [
      'Care Certificate',
      'Safeguarding Adults',
      'Moving & Handling',
    ],
    upgrade_course_titles: [
      'Medication Handling',
      'Autism / Learning Disability Support',
      'Dementia Awareness',
    ],
    first_job_title_hints: ['Support Worker', 'Care Assistant'],
    later_job_title_hints: ['Senior', 'Specialist', 'Supervisor'],
  }),
  route({
    id: 'home-care-assistant',
    label: 'Home Care Assistant',
    short_description: 'Domiciliary / home care visits.',
    work_type_id: 'care_support_education',
    field_slug: 'care-support',
    specialism_slug: 'home-care',
    experience_option_id: 'care_informal',
    entry_course_titles: [
      'Care Certificate',
      'Safeguarding Adults',
      'Moving & Handling',
    ],
    upgrade_course_titles: ['Medication Handling', 'Dementia Awareness'],
    first_job_title_hints: ['Home Care', 'Care Assistant', 'Domiciliary'],
    later_job_title_hints: ['Senior', 'Supervisor'],
  }),
  route({
    id: 'teaching-assistant',
    label: 'Teaching Assistant',
    short_description: 'School TA route with safeguarding and DBS checks.',
    work_type_id: 'care_support_education',
    field_slug: 'childcare-education-support',
    specialism_slug: 'teaching-assistant',
    experience_option_id: 'child_informal',
    entry_course_titles: [
      'Safeguarding Children',
      'Teaching Assistant Level 2',
      'Paediatric First Aid',
    ],
    upgrade_course_titles: [
      'Teaching Assistant Level 3',
      'SEN / Autism Awareness',
    ],
    first_job_title_hints: ['Teaching Assistant', 'TA', 'Classroom'],
    later_job_title_hints: ['Higher Level', 'SEN', 'Level 3'],
  }),
  route({
    id: 'sen-support',
    label: 'SEN Support Assistant',
    short_description: 'SEN classroom and pupil support.',
    work_type_id: 'care_support_education',
    field_slug: 'childcare-education-support',
    specialism_slug: 'sen-support',
    experience_option_id: 'child_informal',
    entry_course_titles: [
      'Safeguarding Children',
      'SEN / Autism Awareness',
      'Paediatric First Aid',
    ],
    upgrade_course_titles: ['Teaching Assistant Level 2', 'Teaching Assistant Level 3'],
    first_job_title_hints: ['SEN', 'Support', 'Teaching Assistant'],
    later_job_title_hints: ['Specialist', 'Higher Level'],
  }),
  route({
    id: 'nursery-assistant',
    label: 'Nursery Assistant / Early Years Route',
    short_description: 'Nursery and early years support.',
    work_type_id: 'care_support_education',
    field_slug: 'childcare-education-support',
    specialism_slug: 'nursery-assistant',
    experience_option_id: 'child_informal',
    entry_course_titles: [
      'Safeguarding Children',
      'Early Years / Childcare',
      'Paediatric First Aid',
    ],
    upgrade_course_titles: ['SEN / Autism Awareness', 'Teaching Assistant Level 2'],
    first_job_title_hints: ['Nursery', 'Early Years', 'Childcare'],
    later_job_title_hints: ['Room Lead', 'Supervisor'],
  }),

  // --- Office / CS ---
  route({
    id: 'admin-assistant',
    label: 'Admin Assistant',
    short_description: 'Office admin starter with Microsoft Office and admin skills.',
    work_type_id: 'office_admin_cs',
    field_slug: 'office-admin',
    specialism_slug: 'admin-assistant',
    experience_option_id: 'office_basic',
    entry_course_titles: ['Microsoft Office', 'Excel', 'Admin Skills'],
    upgrade_course_titles: [
      'Customer Service',
      'Business Communication',
      'Bookkeeping Basics',
    ],
    first_job_title_hints: ['Admin Assistant', 'Office Assistant', 'Receptionist', 'Data Entry'],
    later_job_title_hints: ['Coordinator', 'Supervisor', 'Senior Admin', 'PA'],
  }),
  route({
    id: 'receptionist',
    label: 'Receptionist',
    short_description: 'Front desk and reception starter route.',
    work_type_id: 'office_admin_cs',
    field_slug: 'office-admin',
    specialism_slug: 'receptionist',
    experience_option_id: 'office_basic',
    entry_course_titles: ['Microsoft Office', 'Admin Skills', 'Customer Service'],
    upgrade_course_titles: ['Business Communication', 'Excel'],
    first_job_title_hints: ['Receptionist', 'Front Desk', 'Admin'],
    later_job_title_hints: ['Coordinator', 'Supervisor'],
  }),
  route({
    id: 'customer-service-advisor',
    label: 'Customer Service Advisor',
    short_description: 'Customer service and advisor roles.',
    work_type_id: 'office_admin_cs',
    field_slug: 'customer-service',
    specialism_slug: 'customer-service-advisor',
    experience_option_id: 'cs_face_to_face',
    entry_course_titles: ['Customer Service', 'Complaint Handling', 'Business Communication'],
    upgrade_course_titles: ['Call Centre Skills', 'Digital Communication'],
    first_job_title_hints: ['Customer Service', 'Advisor'],
    later_job_title_hints: ['Team Leader', 'Supervisor'],
  }),
  route({
    id: 'call-centre-agent',
    label: 'Call Centre Agent',
    short_description: 'Inbound call handling and contact centre work.',
    work_type_id: 'office_admin_cs',
    field_slug: 'customer-service',
    specialism_slug: 'call-handler',
    experience_option_id: 'cs_face_to_face',
    entry_course_titles: ['Customer Service', 'Call Centre Skills'],
    upgrade_course_titles: ['Complaint Handling', 'Digital Communication'],
    first_job_title_hints: ['Call', 'Contact Centre', 'Customer Service'],
    later_job_title_hints: ['Team Leader'],
  }),
  route({
    id: 'data-entry-assistant',
    label: 'Data Entry Assistant',
    short_description: 'Data entry and records support.',
    work_type_id: 'office_admin_cs',
    field_slug: 'office-admin',
    specialism_slug: 'data-entry',
    experience_option_id: 'office_basic',
    entry_course_titles: ['Microsoft Office', 'Excel', 'Admin Skills'],
    upgrade_course_titles: ['Business Communication', 'Customer Service'],
    first_job_title_hints: ['Data Entry', 'Admin', 'Records'],
    later_job_title_hints: ['Coordinator', 'Senior'],
  }),
  route({
    id: 'retail-customer-advisor',
    label: 'Retail Customer Advisor',
    short_description: 'Shop-floor retail and in-store customer service.',
    work_type_id: 'office_admin_cs',
    field_slug: 'retail-sales',
    specialism_slug: 'customer-service-retail',
    experience_option_id: 'retail_shop_floor',
    entry_course_titles: ['Customer Service', 'Retail Skills'],
    upgrade_course_titles: ['Sales & Communication'],
    first_job_title_hints: ['Retail', 'Customer Service', 'Sales Assistant'],
    later_job_title_hints: ['Supervisor'],
  }),

  // --- Driving / warehouse ---
  route({
    id: 'warehouse-operative',
    label: 'Warehouse Operative',
    short_description: 'General warehouse ops with safety training first.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'warehouse-logistics',
    specialism_slug: 'warehouse-operative',
    experience_option_id: 'wh_picking',
    entry_course_titles: [
      'Manual Handling',
      'Warehouse Safety',
      'Health & Safety at Work',
    ],
    upgrade_course_titles: [
      'Forklift Counterbalance',
      'Stock Control',
      'Emergency First Aid at Work',
    ],
    first_job_title_hints: ['Warehouse Operative', 'Picker', 'Packer', 'Goods'],
    later_job_title_hints: ['Forklift', 'Stock', 'Supervisor', 'Team Leader'],
  }),
  route({
    id: 'forklift-driver-route',
    label: 'Forklift Driver Route',
    short_description: 'FLT training first, then warehouse forklift roles.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'warehouse-logistics',
    specialism_slug: 'forklift-flt',
    experience_option_id: 'wh_picking',
    entry_course_titles: [
      'Forklift Counterbalance',
      'Forklift Reach Truck',
      'Manual Handling',
    ],
    upgrade_course_titles: [
      'Stock Control',
      'Warehouse Supervisor basics',
      'Health & Safety at Work',
    ],
    first_job_title_hints: ['Forklift', 'FLT', 'Goods In'],
    later_job_title_hints: ['Stock', 'Supervisor', 'Team Leader'],
  }),
  route({
    id: 'stock-control-assistant',
    label: 'Stock Control Assistant',
    short_description: 'Inventory and stock control support.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'warehouse-logistics',
    specialism_slug: 'stock-control',
    experience_option_id: 'wh_picking',
    entry_course_titles: ['Manual Handling', 'Warehouse Safety', 'Health & Safety at Work'],
    upgrade_course_titles: ['Stock Control', 'Forklift Counterbalance'],
    first_job_title_hints: ['Stock', 'Inventory', 'Warehouse'],
    later_job_title_hints: ['Controller', 'Supervisor'],
  }),
  route({
    id: 'delivery-driver-route',
    label: 'Delivery Driver Route',
    short_description: 'Parcel and goods delivery — valid licence required.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'delivery-driver',
    experience_option_id: 'drive_delivery',
    entry_course_titles: ['Delivery Driver Safety', 'Customer Service for Drivers'],
    upgrade_course_titles: ['PHV / Taxi licensing support'],
    first_job_title_hints: ['Delivery', 'Courier', 'Driver'],
    later_job_title_hints: ['Supervisor', 'HGV', 'Van'],
  }),
  route({
    id: 'van-driver-route',
    label: 'Van Driver Route',
    short_description: 'Light goods / van driving.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'van-driver',
    experience_option_id: 'drive_delivery',
    entry_course_titles: ['Delivery Driver Safety', 'Customer Service for Drivers'],
    upgrade_course_titles: ['HGV / LGV licence training'],
    first_job_title_hints: ['Van', 'Driver', 'Delivery'],
    later_job_title_hints: ['HGV', 'Supervisor'],
  }),
  route({
    id: 'bus-pcv-route',
    label: 'Bus Driver / PCV Driver',
    short_description:
      'Passenger transport route. You usually need a PCV licence and Driver CPC. Some UK employers may offer trainee bus driver programmes.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'bus-pcv',
    experience_option_id: 'drive_delivery',
    route_kind: 'starter',
    aliases: [
      'Bus Driver',
      'PCV Driver',
      'Trainee Bus Driver',
      'Coach Driver',
      'Passenger Transport Driver',
    ],
    start_status_without_licence: 'Start preparing now',
    start_status_with_licence: 'Can apply now',
    entry_course_titles: [
      'PCV licence training',
      'Driver CPC (passenger transport)',
      'Customer Service for Drivers',
    ],
    upgrade_course_titles: [
      'Safeguarding / passenger support',
      'Emergency First Aid at Work',
      'Tachograph / driver hours awareness',
      'English for Work',
    ],
    first_job_title_hints: [
      'Trainee Bus',
      'Bus Driver',
      'PCV Driver',
      'Passenger Transport',
      'Coach Driver',
    ],
    later_job_title_hints: [
      'Community Transport',
      'School Transport',
      'Transport Supervisor',
      'Depot Supervisor',
    ],
  }),
  route({
    id: 'hgv-lgv-route',
    label: 'HGV / LGV Route',
    short_description:
      'Goods vehicle driving. You usually need an HGV / LGV licence and Driver CPC for goods transport.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'hgv-lgv',
    experience_option_id: 'drive_delivery',
    route_kind: 'starter',
    aliases: ['HGV Driver', 'LGV Driver', 'Class 1 Driver', 'Class 2 Driver'],
    start_status_without_licence: 'Start preparing now',
    start_status_with_licence: 'Can apply now',
    entry_course_titles: [
      'HGV / LGV licence training',
      'Driver CPC (goods transport)',
      'Tachograph / driver hours awareness',
    ],
    upgrade_course_titles: [
      'ADR dangerous goods (optional)',
      'HIAB / lorry loader (optional)',
      'Emergency First Aid at Work',
    ],
    first_job_title_hints: ['HGV Driver', 'LGV Driver', 'Class 2', 'Class 1', 'Transport Driver'],
    later_job_title_hints: ['HIAB', 'Senior HGV', 'Multi-drop', 'Supervisor'],
  }),
  route({
    id: 'transport-admin-route',
    label: 'Transport Admin / Coordinator',
    short_description:
      'Office-side transport and logistics coordination — useful if you prefer planning to driving.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'transport-admin',
    experience_option_id: 'drive_dispatch',
    route_kind: 'starter',
    entry_course_titles: ['Transport Admin Basics', 'Microsoft Office', 'Customer Service for Drivers'],
    upgrade_course_titles: ['Tachograph / driver hours awareness'],
    first_job_title_hints: ['Transport Admin', 'Logistics Admin', 'Transport Coordinator'],
    later_job_title_hints: ['Operations Coordinator', 'Supervisor'],
  }),
  route({
    id: 'transport-supervisor-route',
    label: 'Transport Supervisor',
    short_description:
      'Progression route after driving or logistics experience — depot and operations supervision.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'transport-supervisor',
    experience_option_id: 'drive_dispatch',
    route_kind: 'progression',
    aliases: ['Depot Supervisor', 'Operations Coordinator'],
    entry_course_titles: ['Tachograph / driver hours awareness', 'Customer Service for Drivers'],
    upgrade_course_titles: ['Emergency First Aid at Work'],
    first_job_title_hints: [],
    later_job_title_hints: [
      'Transport Supervisor',
      'Depot Supervisor',
      'Operations Coordinator',
      'Fleet Coordinator',
      'Acting Transport',
    ],
  }),
  route({
    id: 'train-driver-route',
    label: 'Train Driver',
    short_description:
      'Future transport route. Competitive employer recruitment, assessment tests, and safety-critical medical checks — not an easy immediate starter.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'driving-transport',
    specialism_slug: 'train-driver',
    experience_option_id: 'drive_delivery',
    route_kind: 'future_progression',
    aliases: ['Train Driver Trainee', 'Rail Driver'],
    entry_course_titles: [
      'Rail industry awareness',
      'Mechanical comprehension basics',
      'Safety-critical awareness',
      'Assessment test preparation',
    ],
    upgrade_course_titles: [
      'Attention / concentration practice',
      'Customer Service for Drivers',
    ],
    first_job_title_hints: [],
    later_job_title_hints: ['Train Driver', 'Trainee', 'Rail'],
  }),
  route({
    id: 'production-factory',
    label: 'Production / Factory Operative',
    short_description: 'Factory and production line starter roles.',
    work_type_id: 'driving_warehouse_logistics',
    field_slug: 'manufacturing-engineering',
    specialism_slug: 'production-operative',
    experience_option_id: 'mfg_production',
    entry_course_titles: ['Health & Safety at Work', 'Manual Handling', 'COSHH'],
    upgrade_course_titles: ['Quality Control Basics'],
    first_job_title_hints: ['Production', 'Factory', 'Assembly', 'Operative'],
    later_job_title_hints: ['Machine', 'Technician', 'Supervisor'],
  }),

  // --- Security ---
  route({
    id: 'event-steward',
    label: 'Event Steward',
    short_description: 'Event and matchday stewarding — often before an SIA licence.',
    work_type_id: 'security_licensed',
    field_slug: 'security-facilities',
    specialism_slug: 'event-stewarding',
    experience_option_id: 'sec_no_sia',
    entry_course_titles: [
      'Event Stewarding / Matchday Stewarding',
      'Emergency First Aid at Work',
    ],
    upgrade_course_titles: [
      'SIA Door Supervisor',
      'Fire Marshal',
      'Conflict Management',
    ],
    first_job_title_hints: ['Event Steward', 'Matchday', 'Steward'],
    later_job_title_hints: ['Door Supervisor', 'Security Officer', 'Supervisor'],
  }),
  route({
    id: 'sia-door-supervisor-route',
    label: 'SIA Door Supervisor Route',
    short_description: 'SIA Door Supervisor training first, then licensed security roles.',
    work_type_id: 'security_licensed',
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_no_sia',
    entry_course_titles: [
      'SIA Door Supervisor',
      'Emergency First Aid at Work',
    ],
    upgrade_course_titles: [
      'SIA CCTV Operator',
      'Fire Marshal',
      'Conflict Management',
    ],
    first_job_title_hints: [
      'Door Supervisor',
      'Retail Security',
      'Venue Security',
    ],
    later_job_title_hints: ['CCTV', 'Control Room', 'Supervisor'],
  }),
  route({
    id: 'retail-security-route',
    label: 'Retail Security Officer Route',
    short_description: 'Retail security after SIA licence training.',
    work_type_id: 'security_licensed',
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_no_sia',
    entry_course_titles: ['SIA Door Supervisor', 'SIA Security Guard', 'Emergency First Aid at Work'],
    upgrade_course_titles: ['Fire Marshal', 'Conflict Management', 'SIA CCTV Operator'],
    first_job_title_hints: ['Retail Security', 'Door Supervisor', 'Security Officer'],
    later_job_title_hints: ['Supervisor', 'CCTV'],
  }),
  route({
    id: 'cctv-operator-route',
    label: 'CCTV Operator Route',
    short_description: 'SIA CCTV / control room pathway.',
    work_type_id: 'security_licensed',
    field_slug: 'security-facilities',
    specialism_slug: 'cctv-control-room',
    experience_option_id: 'sec_no_sia',
    entry_course_titles: [
      'SIA CCTV Operator',
      'SIA Public Space Surveillance (CCTV)',
      'Emergency First Aid at Work',
    ],
    upgrade_course_titles: ['Fire Marshal', 'Conflict Management'],
    first_job_title_hints: ['CCTV', 'Control Room'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'venue-security-route',
    label: 'Venue Security Officer Route',
    short_description: 'Venue security after SIA training.',
    work_type_id: 'security_licensed',
    field_slug: 'security-facilities',
    specialism_slug: 'door-security',
    experience_option_id: 'sec_no_sia',
    entry_course_titles: ['SIA Door Supervisor', 'Emergency First Aid at Work'],
    upgrade_course_titles: ['Fire Marshal', 'Conflict Management', 'SIA CCTV Operator'],
    first_job_title_hints: ['Venue Security', 'Door Supervisor', 'Security Officer'],
    later_job_title_hints: ['Supervisor', 'CCTV'],
  }),

  // --- Digital / creative ---
  route({
    id: 'it-support-assistant',
    label: 'IT Support Assistant',
    short_description: 'First-line IT support with digital skills first.',
    work_type_id: 'digital_it_creative',
    field_slug: 'digital-it-support',
    specialism_slug: 'it-support',
    experience_option_id: 'digital_basic',
    entry_course_titles: [
      'IT Support Basics',
      'Microsoft Office',
      'Digital Skills',
    ],
    upgrade_course_titles: [
      'CompTIA A+ style IT Support',
      'Cyber Security Basics',
      'Cloud Basics',
    ],
    first_job_title_hints: ['IT Support', 'Helpdesk', 'Help Desk'],
    later_job_title_hints: ['Junior Developer', 'Cyber', 'Cloud', 'Engineer'],
  }),
  route({
    id: 'digital-assistant',
    label: 'Digital Assistant',
    short_description: 'Digital ops and content support.',
    work_type_id: 'digital_it_creative',
    field_slug: 'digital-it-support',
    specialism_slug: 'digital-assistant',
    experience_option_id: 'digital_basic',
    entry_course_titles: ['IT Support Basics', 'Microsoft Office', 'Digital Skills'],
    upgrade_course_titles: ['Cyber Security Basics', 'Social Media Content'],
    first_job_title_hints: ['Digital Assistant', 'Admin', 'Content'],
    later_job_title_hints: ['Coordinator', 'Marketing'],
  }),
  route({
    id: 'wordpress-support',
    label: 'Website / WordPress Support',
    short_description: 'Website and WordPress support starter route.',
    work_type_id: 'digital_it_creative',
    field_slug: 'digital-it-support',
    specialism_slug: 'web-wordpress-support',
    experience_option_id: 'digital_basic',
    entry_course_titles: ['IT Support Basics', 'Digital Skills'],
    upgrade_course_titles: [
      'Portfolio / GitHub for Junior Developers',
      'CompTIA A+ style IT Support',
    ],
    first_job_title_hints: ['WordPress', 'Web', 'Website'],
    later_job_title_hints: ['Developer', 'Junior'],
  }),
  route({
    id: 'junior-qa',
    label: 'Junior QA Tester',
    short_description: 'Software QA and testing starter route.',
    work_type_id: 'digital_it_creative',
    field_slug: 'digital-it-support',
    specialism_slug: 'qa-tester',
    experience_option_id: 'digital_basic',
    entry_course_titles: ['IT Support Basics', 'QA Testing Basics'],
    upgrade_course_titles: [
      'Portfolio / GitHub for Junior Developers',
      'Cyber Security Basics',
    ],
    first_job_title_hints: ['QA', 'Tester', 'Test'],
    later_job_title_hints: ['Automation', 'Senior'],
  }),
  route({
    id: 'social-media-assistant',
    label: 'Social Media Content Assistant',
    short_description: 'Social content creation support.',
    work_type_id: 'digital_it_creative',
    field_slug: 'creative-design',
    specialism_slug: 'social-media-content',
    experience_option_id: 'creative_graphics',
    entry_course_titles: ['Portfolio Building', 'Social Media Content'],
    upgrade_course_titles: ['Digital Marketing', 'Adobe Photoshop'],
    first_job_title_hints: ['Social Media', 'Content', 'Creative Assistant'],
    later_job_title_hints: ['Manager', 'Designer'],
  }),
  route({
    id: 'graphic-design-assistant',
    label: 'Graphic Design Assistant',
    short_description: 'Practical graphic design with a portfolio first.',
    work_type_id: 'digital_it_creative',
    field_slug: 'creative-design',
    specialism_slug: 'graphic-design',
    experience_option_id: 'creative_graphics',
    entry_course_titles: ['Portfolio Building', 'Adobe Photoshop'],
    upgrade_course_titles: ['UX/UI Basics', 'Digital Marketing'],
    first_job_title_hints: ['Graphic', 'Design', 'Creative Assistant'],
    later_job_title_hints: ['Designer', 'Senior'],
  }),
  route({
    id: 'video-editing-assistant',
    label: 'Video Editing Assistant',
    short_description: 'Video editing and post-production support.',
    work_type_id: 'digital_it_creative',
    field_slug: 'creative-design',
    specialism_slug: 'video-editing',
    experience_option_id: 'creative_graphics',
    entry_course_titles: ['Portfolio Building', 'Adobe Premiere / Video Editing'],
    upgrade_course_titles: ['Social Media Content', 'Digital Marketing'],
    first_job_title_hints: ['Video', 'Editor', 'Creative'],
    later_job_title_hints: ['Senior', 'Producer'],
  }),

  // --- Hospitality / retail / local ---
  route({
    id: 'kitchen-assistant',
    label: 'Kitchen Assistant',
    short_description: 'Kitchen support with Food Safety Level 2 first.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'hospitality',
    specialism_slug: 'kitchen-assistant',
    experience_option_id: 'hosp_kitchen',
    entry_course_titles: ['Food Safety Level 2', 'Allergy Awareness'],
    upgrade_course_titles: [
      'Customer Service',
      'Emergency First Aid at Work',
      'Fire Marshal',
    ],
    first_job_title_hints: ['Kitchen Assistant', 'Kitchen Porter', 'Catering'],
    later_job_title_hints: ['Chef', 'Cook', 'Supervisor'],
  }),
  route({
    id: 'front-of-house',
    label: 'Front of House',
    short_description: 'Waiting and FOH hospitality.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'hospitality',
    specialism_slug: 'front-of-house',
    experience_option_id: 'hosp_kitchen',
    entry_course_titles: ['Customer Service', 'Allergy Awareness'],
    upgrade_course_titles: ['Food Safety Level 2', 'Emergency First Aid at Work'],
    first_job_title_hints: ['Front of House', 'Waiter', 'Waitress', 'Host'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'hotel-reception',
    label: 'Hotel Reception',
    short_description: 'Hotel front desk starter route.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'hospitality',
    specialism_slug: 'hotel-reception',
    experience_option_id: 'hosp_kitchen',
    entry_course_titles: ['Customer Service', 'Microsoft Office'],
    upgrade_course_titles: ['Business Communication', 'Emergency First Aid at Work'],
    first_job_title_hints: ['Hotel', 'Reception'],
    later_job_title_hints: ['Supervisor', 'Manager'],
  }),
  route({
    id: 'bar-staff',
    label: 'Bar Staff',
    short_description: 'Bar and drinks service.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'hospitality',
    specialism_slug: 'bar-staff',
    experience_option_id: 'hosp_kitchen',
    entry_course_titles: ['Food Safety Level 2', 'Customer Service'],
    upgrade_course_titles: ['Allergy Awareness', 'Emergency First Aid at Work'],
    first_job_title_hints: ['Bar', 'Bartender'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'retail-assistant',
    label: 'Retail Assistant',
    short_description: 'Shop-floor retail starter roles.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'retail-sales',
    specialism_slug: 'retail-assistant',
    experience_option_id: 'retail_shop_floor',
    entry_course_titles: ['Customer Service', 'Retail Skills'],
    upgrade_course_titles: ['Sales & Communication'],
    first_job_title_hints: ['Retail Assistant', 'Sales Assistant', 'Shop'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'cleaning-jobs',
    label: 'Cleaning Jobs',
    short_description: 'Cleaning roles — often flexible hours.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'cleaning-facilities',
    specialism_slug: 'general-cleaning',
    experience_option_id: 'clean_domestic',
    entry_course_titles: ['COSHH', 'Health & Safety at Work'],
    upgrade_course_titles: ['Cleaning Safety', 'Manual Handling'],
    first_job_title_hints: ['Cleaner', 'Cleaning', 'Housekeeping'],
    later_job_title_hints: ['Supervisor'],
  }),
  route({
    id: 'beauty-barber-starter',
    label: 'Beauty / Barber Starter Route',
    short_description: 'Barbering or beauty starter training — not instant qualification.',
    work_type_id: 'hospitality_retail_local',
    field_slug: 'beauty-personal',
    specialism_slug: 'barber',
    experience_option_id: 'beauty_salon_assist',
    entry_course_titles: ['Barbering', 'Hygiene for Beauty Professionals'],
    upgrade_course_titles: [
      'Self-employed Basics for Beauty',
      'Customer Service',
    ],
    first_job_title_hints: ['Barber', 'Salon', 'Beauty', 'Assistant'],
    later_job_title_hints: ['Therapist', 'Self-employed', 'Senior'],
  }),
]

/** Balanced starter list for "Not sure". */
export const SNC_NOT_SURE_ROUTE_IDS: string[] = [
  'admin-assistant',
  'warehouse-operative',
  'care-assistant',
  'event-steward',
  'customer-service-advisor',
  'kitchen-assistant',
  'retail-assistant',
  'it-support-assistant',
  'cleaning-jobs',
]

export function listSncWorkTypes(): SncWorkType[] {
  return [...SNC_WORK_TYPES].sort((a, b) => a.sort_order - b.sort_order)
}

export function getSncWorkType(id: string): SncWorkType | null {
  return SNC_WORK_TYPES.find((w) => w.id === id) ?? null
}

export function getSncCareerRoute(id: string): SncCareerRoute | null {
  return SNC_CAREER_ROUTES.find((r) => r.id === id) ?? null
}

export function listSncRoutesForWorkType(workTypeId: string): SncCareerRoute[] {
  if (workTypeId === 'not_sure') {
    return SNC_NOT_SURE_ROUTE_IDS.map((id) => getSncCareerRoute(id)).filter(
      (r): r is SncCareerRoute => Boolean(r)
    )
  }
  return SNC_CAREER_ROUTES.filter((r) => r.work_type_id === workTypeId)
}
