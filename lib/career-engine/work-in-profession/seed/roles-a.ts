/**
 * Work in My Profession role targets — fields 1–9.
 */

import { rolesFor } from './builders'
import type { ProfessionRole } from '../types'

export const PROFESSION_ROLES_A: ProfessionRole[] = [
  // --- Security ---
  ...rolesFor('security-facilities', 'door-security', [
    {
      title: 'Event Steward',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: null,
      progression_roles: ['Event Security Steward', 'Door Supervisor'],
      description:
        'UK event steward pathway — crowd guidance and venue support roles that often start without an SIA licence.',
    },
    {
      title: 'Event Security Steward',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: 'SIA often required for licensed venues',
      progression_roles: ['Door Supervisor', 'Venue Security Officer'],
    },
    {
      title: 'Door Supervisor Trainee',
      level: 'helper_assistant',
      realistic_start_now: false,
      licence_or_check_required: 'Working towards SIA Door Supervisor licence',
      progression_roles: ['Door Supervisor'],
    },
    {
      title: 'Door Supervisor',
      level: 'beginner',
      licence_or_check_required: 'SIA Door Supervisor licence',
      realistic_start_now: false,
      progression_roles: ['Venue Security Officer', 'Head Doorman'],
    },
    {
      title: 'Event Security Steward',
      level: 'beginner',
      licence_or_check_required: 'SIA often required for licensed venues',
    },
    {
      title: 'Retail Security Officer',
      level: 'beginner',
      licence_or_check_required: 'SIA Security Guard licence',
    },
    {
      title: 'Venue Security Officer',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA Door Supervisor licence',
    },
    {
      title: 'Door Supervisor',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA Door Supervisor licence',
    },
    {
      title: 'Retail Security Officer',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA Security Guard licence',
    },
    {
      title: 'Head Doorman',
      level: 'supervisor',
      licence_or_check_required: 'SIA licence',
    },
    {
      title: 'Self-employed Door Supervisor',
      level: 'self_employed_owner',
      licence_or_check_required: 'SIA + insurance',
    },
  ]),
  ...rolesFor('security-facilities', 'cctv-control-room', [
    {
      title: 'CCTV Operator',
      level: 'beginner',
      licence_or_check_required: 'SIA Public Space Surveillance',
    },
    {
      title: 'Control Room Operator',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA CCTV',
    },
    {
      title: 'CCTV Operator',
      level: 'specialist_technician',
      licence_or_check_required: 'SIA Public Space Surveillance',
    },
    {
      title: 'Control Room Operator',
      level: 'specialist_technician',
      licence_or_check_required: 'SIA CCTV',
    },
    {
      title: 'Control Room Supervisor',
      level: 'supervisor',
      licence_or_check_required: 'SIA CCTV',
    },
  ]),
  ...rolesFor('security-facilities', 'event-stewarding', [
    {
      title: 'Event Steward',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: null,
    },
    {
      title: 'Event Security Steward',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: 'SIA often required for licensed venues',
    },
    {
      title: 'Event Steward',
      level: 'beginner',
      realistic_start_now: true,
    },
    {
      title: 'Event Security Steward',
      level: 'beginner',
      licence_or_check_required: 'SIA often required for licensed venues',
    },
    {
      title: 'Senior Event Steward',
      level: 'experienced_worker',
    },
    {
      title: 'Event Steward Supervisor',
      level: 'supervisor',
    },
  ]),
  ...rolesFor('security-facilities', 'facilities-security', [
    {
      title: 'Event Steward',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: null,
    },
    {
      title: 'Venue Security Support',
      level: 'helper_assistant',
      realistic_start_now: true,
      licence_or_check_required: 'SIA not always required',
    },
    {
      title: 'Security Officer',
      level: 'beginner',
      licence_or_check_required: 'SIA Security Guard',
    },
    {
      title: 'Retail Security Officer',
      level: 'beginner',
      licence_or_check_required: 'SIA Security Guard licence',
    },
    {
      title: 'Facilities Security Officer',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA',
    },
    {
      title: 'Venue Security Officer',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA Door Supervisor licence',
    },
    {
      title: 'Site Security Lead',
      level: 'supervisor',
      licence_or_check_required: 'SIA',
    },
  ]),
  ...rolesFor('security-facilities', 'security-supervisor', [
    {
      title: 'Security Team Leader',
      level: 'experienced_worker',
      licence_or_check_required: 'SIA',
    },
    {
      title: 'Security Supervisor',
      level: 'supervisor',
      licence_or_check_required: 'SIA',
    },
    {
      title: 'Security Contract Manager',
      level: 'specialist_technician',
      licence_or_check_required: 'SIA + contract experience',
    },
  ]),

  // --- Care ---
  ...rolesFor('care-support', 'adult-care', [
    { title: 'Care Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS check' },
    { title: 'Care Assistant', level: 'beginner', licence_or_check_required: 'DBS check', progression_roles: ['Senior Care Worker'] },
    { title: 'Support Worker', level: 'beginner', licence_or_check_required: 'DBS check' },
    { title: 'Home Care Assistant', level: 'beginner', licence_or_check_required: 'DBS check' },
    { title: 'Senior Care Assistant', level: 'experienced_worker', licence_or_check_required: 'DBS check' },
    { title: 'Senior Care Worker', level: 'supervisor', licence_or_check_required: 'DBS check' },
  ]),
  ...rolesFor('care-support', 'support-worker', [
    { title: 'Community Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Support Worker', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Senior Support Worker', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'Support Team Leader', level: 'supervisor', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('care-support', 'home-care', [
    { title: 'Home Care Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Home Care Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Domiciliary Care Worker', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'Home Care Coordinator', level: 'supervisor', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('care-support', 'care-assistant', [
    { title: 'Care Assistant Trainee', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Care Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Experienced Care Assistant', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'Senior Care Assistant', level: 'supervisor', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('care-support', 'senior-care-worker', [
    { title: 'Acting Senior Care Worker', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'Senior Care Worker', level: 'supervisor', licence_or_check_required: 'DBS' },
    { title: 'Shift Leader (Care)', level: 'supervisor', licence_or_check_required: 'DBS' },
    { title: 'Care Team Manager', level: 'specialist_technician', licence_or_check_required: 'DBS + management experience' },
  ]),

  // --- Construction ---
  ...rolesFor('construction-trades', 'general-labourer', [
    { title: 'Site Labourer / Site Assistant', level: 'helper_assistant', licence_or_check_required: 'CSCS often required' },
    { title: 'General Labourer', level: 'beginner', licence_or_check_required: 'CSCS card' },
    { title: 'Experienced Site Labourer', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Labour Gang Lead', level: 'supervisor', licence_or_check_required: 'CSCS' },
  ]),
  ...rolesFor('construction-trades', 'bricklaying', [
    { title: 'Bricklayer Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS' },
    { title: 'Bricklayer Improver', level: 'beginner', licence_or_check_required: 'CSCS' },
    { title: 'Bricklayer', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Bricklaying Foreman', level: 'supervisor', licence_or_check_required: 'CSCS' },
    { title: 'Self-employed Bricklayer', level: 'self_employed_owner', licence_or_check_required: 'CSCS + insurance' },
  ]),
  ...rolesFor('construction-trades', 'carpentry', [
    { title: 'Carpenter Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS' },
    { title: 'Carpenter Improver', level: 'beginner', licence_or_check_required: 'CSCS' },
    { title: 'Site Carpenter', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Carpentry Supervisor', level: 'supervisor', licence_or_check_required: 'CSCS' },
    { title: 'Self-employed Carpenter', level: 'self_employed_owner' },
  ]),
  ...rolesFor('construction-trades', 'painting-decorating', [
    { title: "Painter's Mate", level: 'helper_assistant' },
    { title: 'Painter & Decorator Improver', level: 'beginner' },
    { title: 'Painter & Decorator', level: 'experienced_worker' },
    { title: 'Decorating Supervisor', level: 'supervisor' },
    { title: 'Self-employed Decorator', level: 'self_employed_owner' },
  ]),
  ...rolesFor('construction-trades', 'plastering', [
    { title: 'Plasterer Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS' },
    { title: 'Plasterer Improver', level: 'beginner', licence_or_check_required: 'CSCS' },
    { title: 'Plasterer', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Self-employed Plasterer', level: 'self_employed_owner' },
  ]),
  ...rolesFor('construction-trades', 'tiling', [
    { title: "Tiler's Mate", level: 'helper_assistant' },
    { title: 'Tiler Improver', level: 'beginner' },
    { title: 'Wall & Floor Tiler', level: 'experienced_worker' },
    { title: 'Self-employed Tiler', level: 'self_employed_owner' },
  ]),
  ...rolesFor('construction-trades', 'roofing', [
    { title: 'Roofer Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS / working at height' },
    { title: 'Roofer Improver', level: 'beginner', licence_or_check_required: 'CSCS' },
    { title: 'Roofer', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Roofing Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('construction-trades', 'groundwork', [
    { title: 'Groundworker Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS' },
    { title: 'Groundworker', level: 'beginner', licence_or_check_required: 'CSCS' },
    { title: 'Experienced Groundworker', level: 'experienced_worker', licence_or_check_required: 'CSCS' },
    { title: 'Groundworks Gang Lead', level: 'supervisor', licence_or_check_required: 'CSCS' },
  ]),

  // --- Electrical ---
  ...rolesFor('electrical-technical', 'electrician', [
    { title: 'Electrician Mate', level: 'helper_assistant', licence_or_check_required: 'CSCS often required', progression_roles: ['Electrical Improver', 'Domestic Electrician'] },
    { title: 'Electrical Labourer', level: 'helper_assistant', licence_or_check_required: 'CSCS' },
    { title: 'Electrical Improver', level: 'beginner', licence_or_check_required: 'CSCS / training pathway' },
    { title: 'PAT Testing Assistant', level: 'beginner' },
    { title: 'Domestic Electrician', level: 'experienced_worker', licence_or_check_required: 'Qualified electrician status / Part P where relevant', realistic_start_now: false },
    { title: 'Commercial Electrician', level: 'experienced_worker', licence_or_check_required: 'Qualified electrician status' },
    { title: 'Maintenance Electrician', level: 'experienced_worker', licence_or_check_required: 'Trade competence' },
    { title: 'Electrical Supervisor', level: 'supervisor' },
    { title: 'Site Electrical Lead', level: 'supervisor' },
    { title: 'Self-employed Electrician', level: 'self_employed_owner', licence_or_check_required: 'Qualifications + insurance' },
    { title: 'Electrical Contractor', level: 'self_employed_owner', licence_or_check_required: 'Qualifications + insurance' },
  ]),
  ...rolesFor('electrical-technical', 'electrical-improver', [
    { title: 'Electrical Mate', level: 'helper_assistant' },
    { title: 'Electrical Improver', level: 'beginner' },
    { title: 'Nearly Qualified Electrician', level: 'experienced_worker' },
  ]),
  ...rolesFor('electrical-technical', 'pat-testing', [
    { title: 'PAT Testing Trainee', level: 'helper_assistant' },
    { title: 'PAT Testing Assistant', level: 'beginner' },
    { title: 'PAT Tester', level: 'experienced_worker', licence_or_check_required: 'PAT competence' },
    { title: 'Self-employed PAT Tester', level: 'self_employed_owner' },
  ]),
  ...rolesFor('electrical-technical', 'fire-alarm-lv', [
    { title: 'Fire Alarm Assistant', level: 'helper_assistant' },
    { title: 'Fire Alarm Improver', level: 'beginner' },
    { title: 'Fire Alarm Technician', level: 'experienced_worker' },
    { title: 'Fire Alarm / LV Technician', level: 'specialist_technician' },
  ]),
  ...rolesFor('electrical-technical', 'maintenance-technician', [
    { title: 'Maintenance Assistant', level: 'helper_assistant' },
    { title: 'Junior Maintenance Technician', level: 'beginner' },
    { title: 'Maintenance Technician', level: 'experienced_worker' },
    { title: 'Senior Maintenance Technician', level: 'specialist_technician' },
    { title: 'Maintenance Supervisor', level: 'supervisor' },
  ]),

  // --- Plumbing ---
  ...rolesFor('plumbing-heating', 'plumbing', [
    { title: 'Plumber Mate', level: 'helper_assistant' },
    { title: 'Plumbing Improver', level: 'beginner' },
    { title: 'Plumber', level: 'experienced_worker' },
    { title: 'Plumbing Supervisor', level: 'supervisor' },
    { title: 'Self-employed Plumber', level: 'self_employed_owner' },
  ]),
  ...rolesFor('plumbing-heating', 'heating-assistant', [
    { title: 'Heating Install Assistant', level: 'helper_assistant' },
    { title: 'Heating Assistant', level: 'beginner' },
    { title: 'Heating Installer', level: 'experienced_worker', licence_or_check_required: 'Gas Safe where gas work applies' },
  ]),
  ...rolesFor('plumbing-heating', 'bathroom-fitting', [
    { title: 'Bathroom Fit Assistant', level: 'helper_assistant' },
    { title: 'Bathroom Fitter Improver', level: 'beginner' },
    { title: 'Bathroom Fitter', level: 'experienced_worker' },
    { title: 'Self-employed Bathroom Fitter', level: 'self_employed_owner' },
  ]),
  ...rolesFor('plumbing-heating', 'pipefitting', [
    { title: 'Pipefitter Mate', level: 'helper_assistant' },
    { title: 'Pipefitter Improver', level: 'beginner' },
    { title: 'Pipefitter', level: 'experienced_worker' },
    { title: 'Pipefitting Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('plumbing-heating', 'maintenance-plumbing', [
    { title: 'Plumbing Assistant', level: 'helper_assistant' },
    { title: 'Junior Maintenance Plumber', level: 'beginner' },
    { title: 'Maintenance Plumber', level: 'experienced_worker' },
    { title: 'Maintenance Plumbing Lead', level: 'supervisor' },
  ]),

  // --- Warehouse (acceptance: FLT experienced) ---
  ...rolesFor('warehouse-logistics', 'warehouse-operative', [
    { title: 'Warehouse Operative (Entry)', level: 'helper_assistant' },
    { title: 'Warehouse Operative', level: 'beginner' },
    { title: 'Experienced Warehouse Operative', level: 'experienced_worker' },
    { title: 'Warehouse Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('warehouse-logistics', 'forklift-flt', [
    { title: 'Warehouse Operative (Entry)', level: 'helper_assistant', progression_roles: ['FLT Trainee', 'Forklift Driver'] },
    { title: 'Picking & Packing Operative', level: 'helper_assistant' },
    { title: 'Goods In Assistant', level: 'helper_assistant' },
    { title: 'Warehouse Operative', level: 'beginner' },
    { title: 'FLT Trainee', level: 'beginner', licence_or_check_required: 'FLT training in progress' },
    { title: 'Stockroom Assistant', level: 'beginner' },
    { title: 'Forklift Driver', level: 'experienced_worker', licence_or_check_required: 'Valid FLT licence / certification', progression_roles: ['Warehouse Team Leader'] },
    { title: 'Goods In Operative', level: 'experienced_worker' },
    { title: 'Stock Controller', level: 'experienced_worker' },
    { title: 'Warehouse Team Leader', level: 'supervisor' },
    { title: 'Warehouse Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('warehouse-logistics', 'stock-control', [
    { title: 'Stock Assistant (Entry)', level: 'helper_assistant' },
    { title: 'Stock Assistant', level: 'beginner' },
    { title: 'Stock Controller', level: 'experienced_worker' },
    { title: 'Inventory Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('warehouse-logistics', 'goods-in-out', [
    { title: 'Goods In Assistant', level: 'helper_assistant' },
    { title: 'Goods Out Assistant', level: 'beginner' },
    { title: 'Goods In Operative', level: 'experienced_worker' },
    { title: 'Despatch Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('warehouse-logistics', 'picking-packing', [
    { title: 'Packing Operative', level: 'helper_assistant' },
    { title: 'Picker Packer', level: 'beginner' },
    { title: 'Senior Picker Packer', level: 'experienced_worker' },
    { title: 'Picking Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('warehouse-logistics', 'warehouse-supervisor', [
    { title: 'Acting Team Leader', level: 'experienced_worker' },
    { title: 'Warehouse Supervisor', level: 'supervisor' },
    { title: 'Shift Manager (Warehouse)', level: 'specialist_technician' },
  ]),

  // --- Driving ---
  ...rolesFor('driving-transport', 'delivery-driver', [
    { title: 'Delivery Driver Assistant', level: 'helper_assistant', licence_or_check_required: 'Full UK driving licence often required' },
    { title: 'Delivery Driver', level: 'beginner', licence_or_check_required: 'Full UK driving licence' },
    { title: 'Multi-drop Delivery Driver', level: 'experienced_worker', licence_or_check_required: 'Full UK driving licence' },
    { title: 'Delivery Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('driving-transport', 'courier', [
    { title: 'Courier Assistant', level: 'helper_assistant' },
    { title: 'Courier Driver', level: 'beginner', licence_or_check_required: 'Full UK driving licence' },
    { title: 'Same-day Courier', level: 'experienced_worker', licence_or_check_required: 'Full UK driving licence' },
    { title: 'Self-employed Courier', level: 'self_employed_owner', licence_or_check_required: 'Full UK driving licence + insurance' },
  ]),
  ...rolesFor('driving-transport', 'taxi-phv', [
    { title: 'PHV Applicant', level: 'helper_assistant', licence_or_check_required: 'Local PHV licence process', realistic_start_now: false },
    { title: 'Private Hire Driver', level: 'beginner', licence_or_check_required: 'PHV licence + DBS' },
    { title: 'Taxi Driver', level: 'experienced_worker', licence_or_check_required: 'Taxi / PHV licence' },
    { title: 'Self-employed Taxi / PHV Driver', level: 'self_employed_owner', licence_or_check_required: 'Licence + insurance' },
  ]),
  ...rolesFor('driving-transport', 'van-driver', [
    { title: 'Van Mate', level: 'helper_assistant' },
    { title: 'Van Driver', level: 'beginner', licence_or_check_required: 'Category B licence' },
    { title: 'Experienced Van Driver', level: 'experienced_worker', licence_or_check_required: 'Category B licence' },
  ]),
  ...rolesFor('driving-transport', 'hgv-lgv', [
    {
      title: 'HGV Mate / Shunter',
      level: 'helper_assistant',
      uk_role_keywords: ['HGV mate', 'shunter', 'goods vehicle driver', 'HGV driver'],
    },
    {
      title: 'Class 2 Driver',
      level: 'beginner',
      licence_or_check_required: 'HGV / LGV licence training (Class 2)',
      realistic_start_now: false,
      uk_role_keywords: ['Class 2 driver', 'LGV driver', 'HGV driver', 'driver CPC', 'goods vehicle driver'],
    },
    {
      title: 'LGV Driver',
      level: 'beginner',
      licence_or_check_required: 'Valid HGV / LGV licence + Driver CPC (goods)',
      uk_role_keywords: ['LGV driver', 'HGV driver', 'Class 2 driver', 'goods vehicle driver'],
    },
    {
      title: 'HGV Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'Valid HGV / LGV licence + Driver CPC (goods)',
      uk_role_keywords: ['HGV driver', 'LGV driver', 'Class 1 driver', 'Class 2 driver', 'driver CPC', 'goods vehicle driver'],
    },
    {
      title: 'Class 1 Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'Valid Class 1 HGV / LGV licence + Driver CPC (goods)',
      uk_role_keywords: ['Class 1 driver', 'HGV driver', 'articulated driver', 'goods vehicle driver'],
    },
    {
      title: 'Multi-drop HGV Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'Valid HGV / LGV licence + Driver CPC (goods)',
      uk_role_keywords: ['multi-drop HGV driver', 'HGV driver', 'goods vehicle driver'],
    },
    {
      title: 'Transport Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'Valid HGV / LGV licence',
      uk_role_keywords: ['transport driver', 'HGV driver', 'LGV driver', 'goods vehicle driver'],
    },
    {
      title: 'HIAB Driver',
      level: 'specialist_technician',
      licence_or_check_required: 'HGV / LGV licence + HIAB / lorry loader competence',
      realistic_start_now: false,
      uk_role_keywords: ['HIAB driver', 'lorry loader', 'HGV driver', 'crane vehicle'],
    },
    {
      title: 'Senior HGV Driver',
      level: 'specialist_technician',
      licence_or_check_required: 'HGV / LGV licence + Driver CPC (goods)',
      uk_role_keywords: ['senior HGV driver', 'HGV driver', 'Class 1 driver'],
    },
  ]),
  ...rolesFor('driving-transport', 'bus-pcv', [
    {
      title: 'Bus Depot Assistant',
      level: 'helper_assistant',
      uk_role_keywords: ['bus depot', 'passenger transport', 'bus driver'],
      cv_focus_points: [
        'Reliability and punctuality',
        'Customer service and working with the public',
        'Safe driving attitude and shift flexibility',
      ],
    },
    {
      title: 'Trainee Bus Driver',
      level: 'beginner',
      licence_or_check_required: 'PCV licence training; medical/eyesight checks where applicable',
      realistic_start_now: false,
      uk_role_keywords: ['trainee bus driver', 'bus driver', 'PCV driver', 'passenger transport'],
      cv_focus_points: [
        'Reliability and punctuality',
        'Customer service',
        'Safe driving attitude',
        'Route/time management',
        'Working with the public',
        'Shift flexibility',
        'Previous driving, delivery, taxi, care, or customer-facing experience if available',
      ],
    },
    {
      title: 'PCV Driver',
      level: 'beginner',
      licence_or_check_required: 'PCV licence + Driver CPC (passenger) where applicable',
      uk_role_keywords: ['PCV driver', 'bus driver', 'coach driver', 'passenger transport'],
      cv_focus_points: [
        'Reliability and punctuality',
        'Customer service',
        'Safe driving attitude',
        'Route/time management',
        'Working with the public',
        'Shift flexibility',
      ],
    },
    {
      title: 'Bus Driver',
      level: 'experienced_worker',
      licence_or_check_required:
        'PCV licence + Driver CPC (passenger); DBS may be needed for some school/community routes',
      uk_role_keywords: ['bus driver', 'PCV driver', 'passenger transport', 'trainee bus driver'],
      cv_focus_points: [
        'Reliability and punctuality',
        'Customer service',
        'Safe driving attitude',
        'Route/time management',
        'Working with the public',
        'Shift flexibility',
      ],
    },
    {
      title: 'Coach Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'PCV licence + Driver CPC (passenger) where applicable',
      uk_role_keywords: ['coach driver', 'PCV driver', 'bus driver', 'passenger transport'],
    },
    {
      title: 'Passenger Transport Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'PCV licence; DBS may be needed for some passenger routes',
      uk_role_keywords: [
        'passenger transport driver',
        'bus driver',
        'PCV driver',
        'community transport driver',
      ],
    },
    {
      title: 'Community Transport Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'PCV licence (or minibus entitlement where applicable)',
      uk_role_keywords: [
        'community transport driver',
        'passenger transport',
        'bus driver',
        'PCV driver',
      ],
    },
    {
      title: 'School Transport Driver',
      level: 'experienced_worker',
      licence_or_check_required: 'PCV licence + safeguarding / passenger support; DBS often required',
      uk_role_keywords: ['school transport driver', 'bus driver', 'passenger transport', 'PCV driver'],
    },
  ]),
  ...rolesFor('driving-transport', 'transport-admin', [
    {
      title: 'Transport Admin Assistant',
      level: 'helper_assistant',
      uk_role_keywords: ['transport admin', 'logistics admin', 'transport coordinator'],
    },
    {
      title: 'Transport Coordinator',
      level: 'beginner',
      uk_role_keywords: ['transport coordinator', 'operations coordinator', 'transport admin'],
    },
    {
      title: 'Logistics Admin Assistant',
      level: 'beginner',
      uk_role_keywords: ['logistics admin', 'transport admin', 'dispatcher admin'],
    },
    {
      title: 'Operations Coordinator',
      level: 'experienced_worker',
      uk_role_keywords: ['operations coordinator', 'transport coordinator', 'depot coordinator'],
      realistic_start_now: false,
    },
  ]),
  ...rolesFor('driving-transport', 'transport-supervisor', [
    {
      title: 'Acting Transport Lead',
      level: 'experienced_worker',
      realistic_start_now: false,
      uk_role_keywords: ['transport lead', 'transport supervisor'],
    },
    {
      title: 'Depot Supervisor',
      level: 'supervisor',
      realistic_start_now: false,
      uk_role_keywords: ['depot supervisor', 'transport supervisor', 'operations coordinator'],
    },
    {
      title: 'Transport Supervisor',
      level: 'supervisor',
      realistic_start_now: false,
      uk_role_keywords: ['transport supervisor', 'depot supervisor', 'fleet supervisor'],
    },
    {
      title: 'Operations Coordinator',
      level: 'supervisor',
      realistic_start_now: false,
      uk_role_keywords: ['operations coordinator', 'transport coordinator', 'depot supervisor'],
    },
    {
      title: 'Fleet Coordinator',
      level: 'specialist_technician',
      realistic_start_now: false,
      uk_role_keywords: ['fleet coordinator', 'transport supervisor'],
    },
  ]),
  ...rolesFor('driving-transport', 'train-driver', [
    {
      title: 'Rail Industry Awareness Role',
      level: 'helper_assistant',
      realistic_start_now: false,
      description:
        'Explore later: rail roles are competitive and usually need employer recruitment, assessment tests, and safety-critical medical checks.',
      uk_role_keywords: ['rail industry', 'train driver', 'assessment test'],
    },
    {
      title: 'Train Driver Trainee (employer scheme)',
      level: 'beginner',
      licence_or_check_required:
        'Employer recruitment, assessment tests, and safety-critical medical checks required',
      realistic_start_now: false,
      description:
        'Future / advanced route. Train driver roles are competitive and usually require employer recruitment, assessment tests, safety-critical medical checks, and structured training.',
      uk_role_keywords: [
        'train driver trainee',
        'train driver',
        'rail driver',
        'assessment test',
        'employer scheme',
      ],
    },
    {
      title: 'Train Driver',
      level: 'specialist_technician',
      licence_or_check_required:
        'Employer-sponsored training after successful recruitment and medical assessment',
      realistic_start_now: false,
      description:
        'Future / advanced route. Train driver roles are competitive and usually require employer recruitment, assessment tests, safety-critical medical checks, and structured training. This is not an easy immediate route.',
      uk_role_keywords: ['train driver', 'rail driver', 'train operator'],
    },
  ]),

  // --- Hospitality (acceptance: Kitchen Assistant beginner) ---
  ...rolesFor('hospitality', 'front-of-house', [
    { title: 'Front of House Assistant', level: 'helper_assistant' },
    { title: 'Waiting Staff', level: 'beginner' },
    { title: 'Senior Waiting Staff', level: 'experienced_worker' },
    { title: 'Restaurant Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('hospitality', 'bar-staff', [
    { title: 'Bar Runner', level: 'helper_assistant' },
    { title: 'Bar Staff', level: 'beginner', licence_or_check_required: 'Age 18+ for alcohol service' },
    { title: 'Senior Bar Staff', level: 'experienced_worker' },
    { title: 'Bar Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('hospitality', 'kitchen-assistant', [
    { title: 'Kitchen Porter', level: 'helper_assistant' },
    { title: 'Kitchen Assistant', level: 'beginner', progression_roles: ['Commis Chef', 'Catering Assistant'] },
    { title: 'Catering Assistant', level: 'beginner' },
    { title: 'Commis Chef', level: 'beginner', progression_roles: ['Chef', 'Cook'] },
    { title: 'Chef', level: 'experienced_worker' },
    { title: 'Cook', level: 'experienced_worker' },
    { title: 'Kitchen Supervisor', level: 'supervisor' },
    { title: 'Sous Chef', level: 'supervisor' },
  ]),
  ...rolesFor('hospitality', 'chef-cook', [
    { title: 'Kitchen Assistant', level: 'helper_assistant' },
    { title: 'Commis Chef', level: 'beginner' },
    { title: 'Chef de Partie', level: 'experienced_worker' },
    { title: 'Sous Chef', level: 'supervisor' },
    { title: 'Head Chef', level: 'specialist_technician' },
  ]),
  ...rolesFor('hospitality', 'housekeeping', [
    { title: 'Housekeeping Assistant', level: 'helper_assistant' },
    { title: 'Room Attendant', level: 'beginner' },
    { title: 'Housekeeper', level: 'experienced_worker' },
    { title: 'Housekeeping Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('hospitality', 'hotel-reception', [
    { title: 'Front Desk Receptionist', level: 'helper_assistant' },
    { title: 'Hotel Receptionist', level: 'beginner' },
    { title: 'Senior Receptionist', level: 'experienced_worker' },
    { title: 'Front Office Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('hospitality', 'hospitality-supervisor', [
    { title: 'Acting Shift Lead', level: 'experienced_worker' },
    { title: 'Hospitality Supervisor', level: 'supervisor' },
    { title: 'Outlet Manager', level: 'specialist_technician' },
  ]),

  // --- Cleaning ---
  ...rolesFor('cleaning-facilities', 'general-cleaning', [
    { title: 'Cleaner', level: 'helper_assistant' },
    { title: 'Cleaner', level: 'beginner' },
    { title: 'Experienced Cleaner', level: 'experienced_worker' },
    { title: 'Cleaning Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('cleaning-facilities', 'deep-cleaning', [
    { title: 'Deep Clean Operative', level: 'helper_assistant' },
    { title: 'Deep Clean Operative', level: 'beginner' },
    { title: 'Specialist Deep Cleaner', level: 'experienced_worker' },
  ]),
  ...rolesFor('cleaning-facilities', 'commercial-cleaning', [
    { title: 'Commercial Cleaner', level: 'helper_assistant' },
    { title: 'Commercial Cleaner', level: 'beginner' },
    { title: 'Mobile Commercial Cleaner', level: 'experienced_worker' },
    { title: 'Site Cleaning Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('cleaning-facilities', 'housekeeping-cleaning', [
    { title: 'Housekeeping Cleaner', level: 'helper_assistant' },
    { title: 'Housekeeping Cleaner', level: 'beginner' },
    { title: 'Senior Housekeeper', level: 'experienced_worker' },
  ]),
  ...rolesFor('cleaning-facilities', 'cleaning-supervisor', [
    { title: 'Acting Cleaning Lead', level: 'experienced_worker' },
    { title: 'Cleaning Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('cleaning-facilities', 'self-employed-cleaner', [
    { title: 'Independent Cleaner (starting)', level: 'beginner' },
    { title: 'Self-employed Cleaner', level: 'self_employed_owner' },
    { title: 'Cleaning Micro-business Owner', level: 'self_employed_owner' },
  ]),
]
