/**
 * Work in My Profession role targets — fields 10–18.
 */

import { rolesFor } from './builders'
import type { ProfessionRole } from '../types'

export const PROFESSION_ROLES_B: ProfessionRole[] = [
  // --- Retail ---
  ...rolesFor('retail-sales', 'retail-assistant', [
    { title: 'Shop Floor Assistant', level: 'helper_assistant' },
    { title: 'Retail Assistant', level: 'beginner' },
    { title: 'Senior Retail Assistant', level: 'experienced_worker' },
    { title: 'Retail Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('retail-sales', 'cashier', [
    { title: 'Cashier Assistant', level: 'helper_assistant' },
    { title: 'Cashier', level: 'beginner' },
    { title: 'Senior Cashier', level: 'experienced_worker' },
    { title: 'Checkout Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('retail-sales', 'stockroom', [
    { title: 'Stockroom Trainee', level: 'helper_assistant' },
    { title: 'Stockroom Assistant', level: 'beginner' },
    { title: 'Stockroom Operative', level: 'experienced_worker' },
    { title: 'Stockroom Lead', level: 'supervisor' },
  ]),
  ...rolesFor('retail-sales', 'sales-assistant', [
    { title: 'Sales Floor Assistant', level: 'helper_assistant' },
    { title: 'Sales Assistant', level: 'beginner' },
    { title: 'Senior Sales Assistant', level: 'experienced_worker' },
    { title: 'Sales Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('retail-sales', 'customer-service-retail', [
    { title: 'Customer Service Advisor', level: 'helper_assistant' },
    { title: 'Customer Service Retail Assistant', level: 'beginner' },
    { title: 'Customer Experience Advisor', level: 'experienced_worker' },
  ]),
  ...rolesFor('retail-sales', 'retail-supervisor', [
    { title: 'Acting Supervisor', level: 'experienced_worker' },
    { title: 'Retail Supervisor', level: 'supervisor' },
    { title: 'Assistant Store Manager', level: 'specialist_technician' },
  ]),

  // --- Office ---
  ...rolesFor('office-admin', 'admin-assistant', [
    { title: 'Office Assistant', level: 'helper_assistant' },
    { title: 'Admin Assistant', level: 'beginner' },
    { title: 'Senior Admin Assistant', level: 'experienced_worker' },
    { title: 'Admin Supervisor', level: 'supervisor' },
  ]),
  ...rolesFor('office-admin', 'receptionist', [
    { title: 'Receptionist', level: 'helper_assistant' },
    { title: 'Front Desk Receptionist', level: 'helper_assistant' },
    { title: 'Office Receptionist', level: 'beginner' },
    { title: 'Admin Assistant', level: 'beginner' },
    { title: 'Senior Receptionist', level: 'experienced_worker' },
    { title: 'Front of House Coordinator', level: 'supervisor' },
  ]),
  ...rolesFor('office-admin', 'data-entry', [
    { title: 'Data Entry Assistant', level: 'helper_assistant' },
    { title: 'Data Entry Clerk', level: 'beginner' },
    { title: 'Data Entry Operator', level: 'experienced_worker' },
  ]),
  ...rolesFor('office-admin', 'office-coordinator', [
    { title: 'Junior Office Coordinator', level: 'beginner' },
    { title: 'Office Coordinator', level: 'experienced_worker' },
    { title: 'Office Manager', level: 'supervisor' },
  ]),
  ...rolesFor('office-admin', 'personal-assistant', [
    { title: 'Junior PA', level: 'beginner' },
    { title: 'Personal Assistant', level: 'experienced_worker' },
    { title: 'Executive Assistant', level: 'specialist_technician' },
  ]),
  ...rolesFor('office-admin', 'admin-supervisor', [
    { title: 'Acting Admin Lead', level: 'experienced_worker' },
    { title: 'Admin Supervisor', level: 'supervisor' },
  ]),

  // --- Customer service ---
  ...rolesFor('customer-service', 'call-handler', [
    { title: 'Call Centre Advisor', level: 'helper_assistant' },
    { title: 'Call Handler', level: 'beginner' },
    { title: 'Senior Call Handler', level: 'experienced_worker' },
  ]),
  ...rolesFor('customer-service', 'customer-service-advisor', [
    { title: 'Customer Service Trainee', level: 'helper_assistant' },
    { title: 'Customer Service Advisor', level: 'beginner' },
    { title: 'Senior Customer Service Advisor', level: 'experienced_worker' },
    { title: 'Customer Service Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('customer-service', 'live-chat-support', [
    { title: 'Chat Support Trainee', level: 'helper_assistant' },
    { title: 'Live Chat Advisor', level: 'beginner' },
    { title: 'Senior Live Chat Advisor', level: 'experienced_worker' },
  ]),
  ...rolesFor('customer-service', 'complaint-handling', [
    { title: 'Complaints Assistant', level: 'beginner' },
    { title: 'Complaints Advisor', level: 'experienced_worker' },
    { title: 'Complaints Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('customer-service', 'team-leader', [
    { title: 'Acting Team Leader', level: 'experienced_worker' },
    { title: 'Team Leader', level: 'supervisor' },
    { title: 'Contact Centre Supervisor', level: 'specialist_technician' },
  ]),

  // --- Manufacturing ---
  ...rolesFor('manufacturing-engineering', 'production-operative', [
    { title: 'Production Operative (Entry)', level: 'helper_assistant' },
    { title: 'Production Operative', level: 'beginner' },
    { title: 'Experienced Production Operative', level: 'experienced_worker' },
    { title: 'Production Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('manufacturing-engineering', 'assembly-operative', [
    { title: 'Assembly Operative (Entry)', level: 'helper_assistant' },
    { title: 'Assembly Operative', level: 'beginner' },
    { title: 'Senior Assembly Operative', level: 'experienced_worker' },
  ]),
  ...rolesFor('manufacturing-engineering', 'machine-operator', [
    { title: 'Machine Operative Assistant', level: 'helper_assistant' },
    { title: 'Trainee Machine Operator', level: 'beginner' },
    { title: 'Machine Operator', level: 'experienced_worker' },
    { title: 'Senior Machine Operator', level: 'specialist_technician' },
  ]),
  ...rolesFor('manufacturing-engineering', 'quality-control', [
    { title: 'Quality Control Assistant', level: 'helper_assistant' },
    { title: 'Quality Inspector Trainee', level: 'beginner' },
    { title: 'Quality Control Inspector', level: 'experienced_worker' },
    { title: 'QC Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('manufacturing-engineering', 'maintenance-assistant', [
    { title: 'Maintenance Mate', level: 'helper_assistant' },
    { title: 'Maintenance Assistant', level: 'beginner' },
    { title: 'Maintenance Operative', level: 'experienced_worker' },
  ]),
  ...rolesFor('manufacturing-engineering', 'engineering-technician', [
    { title: 'Engineering Assistant', level: 'helper_assistant' },
    { title: 'Junior Engineering Technician', level: 'beginner' },
    { title: 'Engineering Technician', level: 'experienced_worker' },
    { title: 'Senior Engineering Technician', level: 'specialist_technician' },
  ]),

  // --- Digital / IT (acceptance: IT Support beginner) ---
  ...rolesFor('digital-it-support', 'it-support', [
    { title: 'IT Support Trainee', level: 'helper_assistant' },
    { title: 'IT Support Assistant', level: 'beginner', progression_roles: ['IT Support Analyst'] },
    { title: 'Helpdesk Assistant', level: 'beginner' },
    { title: 'IT Support Analyst', level: 'experienced_worker' },
    { title: 'IT Support Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('digital-it-support', 'helpdesk', [
    { title: 'Helpdesk Trainee', level: 'helper_assistant' },
    { title: 'Helpdesk Assistant', level: 'beginner' },
    { title: 'Helpdesk Analyst', level: 'experienced_worker' },
    { title: 'Helpdesk Team Leader', level: 'supervisor' },
  ]),
  ...rolesFor('digital-it-support', 'web-wordpress-support', [
    { title: 'Web Support Assistant', level: 'helper_assistant' },
    { title: 'WordPress Support Assistant', level: 'beginner' },
    { title: 'Web Support Technician', level: 'experienced_worker' },
    { title: 'Self-employed Web Support', level: 'self_employed_owner' },
  ]),
  ...rolesFor('digital-it-support', 'junior-developer', [
    { title: 'Junior Coding Support', level: 'helper_assistant' },
    { title: 'Junior Developer', level: 'beginner' },
    { title: 'Software Developer', level: 'experienced_worker' },
  ]),
  ...rolesFor('digital-it-support', 'digital-assistant', [
    { title: 'Digital Operations Assistant', level: 'helper_assistant' },
    { title: 'Digital Assistant', level: 'beginner' },
    { title: 'Digital Coordinator', level: 'experienced_worker' },
  ]),
  ...rolesFor('digital-it-support', 'qa-tester', [
    { title: 'QA Assistant', level: 'helper_assistant' },
    { title: 'Junior QA Tester', level: 'beginner' },
    { title: 'QA Tester', level: 'experienced_worker' },
    { title: 'QA Lead', level: 'supervisor' },
  ]),

  // --- Creative ---
  ...rolesFor('creative-design', 'graphic-design', [
    { title: 'Design Assistant', level: 'helper_assistant' },
    { title: 'Junior Graphic Designer', level: 'beginner' },
    { title: 'Graphic Designer', level: 'experienced_worker' },
    { title: 'Self-employed Graphic Designer', level: 'self_employed_owner' },
  ]),
  ...rolesFor('creative-design', 'video-editing', [
    { title: 'Video Editing Assistant', level: 'helper_assistant' },
    { title: 'Junior Video Editor', level: 'beginner' },
    { title: 'Video Editor', level: 'experienced_worker' },
    { title: 'Self-employed Video Editor', level: 'self_employed_owner' },
  ]),
  ...rolesFor('creative-design', '3d-animation', [
    { title: '3D Assistant', level: 'helper_assistant' },
    { title: 'Junior 3D Artist', level: 'beginner' },
    { title: '3D / Animation Artist', level: 'experienced_worker' },
  ]),
  ...rolesFor('creative-design', 'social-media-content', [
    { title: 'Content Assistant', level: 'helper_assistant' },
    { title: 'Social Media Assistant', level: 'beginner' },
    { title: 'Social Media Content Creator', level: 'experienced_worker' },
    { title: 'Self-employed Content Creator', level: 'self_employed_owner' },
  ]),
  ...rolesFor('creative-design', 'photographer-videographer', [
    { title: 'Photo / Video Assistant', level: 'helper_assistant' },
    { title: 'Junior Photographer', level: 'beginner' },
    { title: 'Photographer / Videographer', level: 'experienced_worker' },
    { title: 'Self-employed Photographer', level: 'self_employed_owner' },
  ]),
  ...rolesFor('creative-design', 'creative-assistant', [
    { title: 'Studio Runner', level: 'helper_assistant' },
    { title: 'Creative Assistant', level: 'beginner' },
    { title: 'Senior Creative Assistant', level: 'experienced_worker' },
  ]),

  // --- Beauty ---
  ...rolesFor('beauty-personal', 'barber', [
    { title: 'Barber Assistant', level: 'helper_assistant' },
    { title: 'Junior Barber', level: 'beginner' },
    { title: 'Barber', level: 'experienced_worker' },
    { title: 'Self-employed Barber', level: 'self_employed_owner' },
  ]),
  ...rolesFor('beauty-personal', 'hairdresser', [
    { title: 'Salon Assistant', level: 'helper_assistant' },
    { title: 'Junior Hairdresser', level: 'beginner' },
    { title: 'Hairdresser', level: 'experienced_worker' },
    { title: 'Self-employed Hairdresser', level: 'self_employed_owner' },
  ]),
  ...rolesFor('beauty-personal', 'beauty-therapist', [
    { title: 'Beauty Salon Assistant', level: 'helper_assistant' },
    { title: 'Junior Beauty Therapist', level: 'beginner' },
    { title: 'Beauty Therapist', level: 'experienced_worker' },
    { title: 'Self-employed Beauty Therapist', level: 'self_employed_owner' },
  ]),
  ...rolesFor('beauty-personal', 'nail-technician', [
    { title: 'Nail Assistant', level: 'helper_assistant' },
    { title: 'Junior Nail Technician', level: 'beginner' },
    { title: 'Nail Technician', level: 'experienced_worker' },
    { title: 'Self-employed Nail Technician', level: 'self_employed_owner' },
  ]),
  ...rolesFor('beauty-personal', 'makeup-artist', [
    { title: 'Makeup Assistant', level: 'helper_assistant' },
    { title: 'Junior Makeup Artist', level: 'beginner' },
    { title: 'Makeup Artist', level: 'experienced_worker' },
    { title: 'Self-employed Makeup Artist', level: 'self_employed_owner' },
  ]),

  // --- Childcare ---
  ...rolesFor('childcare-education-support', 'teaching-assistant', [
    { title: 'Classroom Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Teaching Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Senior Teaching Assistant', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'HLTA / Lead TA', level: 'supervisor', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('childcare-education-support', 'nursery-assistant', [
    { title: 'Nursery Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Nursery Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Nursery Practitioner', level: 'experienced_worker', licence_or_check_required: 'DBS' },
    { title: 'Room Leader', level: 'supervisor', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('childcare-education-support', 'sen-support', [
    { title: 'SEN Classroom Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'SEN Support Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'SEN Support Worker', level: 'experienced_worker', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('childcare-education-support', 'childcare-assistant', [
    { title: 'Childcare Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS' },
    { title: 'Childcare Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Childcare Practitioner', level: 'experienced_worker', licence_or_check_required: 'DBS' },
  ]),
  ...rolesFor('childcare-education-support', 'tutor-assistant', [
    { title: 'Learning Support Assistant', level: 'helper_assistant', licence_or_check_required: 'DBS often required' },
    { title: 'Tutor Assistant', level: 'beginner', licence_or_check_required: 'DBS' },
    { title: 'Learning Support Tutor', level: 'experienced_worker', licence_or_check_required: 'DBS' },
  ]),

  // --- Self-employment ---
  ...rolesFor('self-employment-local', 'handyman', [
    { title: 'Handyman Assistant', level: 'helper_assistant' },
    { title: 'Junior Handyman', level: 'beginner' },
    { title: 'Handyman', level: 'experienced_worker' },
    { title: 'Self-employed Handyman', level: 'self_employed_owner' },
  ]),
  ...rolesFor('self-employment-local', 'mobile-cleaner', [
    { title: 'Mobile Cleaning Assistant', level: 'helper_assistant' },
    { title: 'Mobile Cleaner', level: 'beginner' },
    { title: 'Self-employed Mobile Cleaner', level: 'self_employed_owner' },
  ]),
  ...rolesFor('self-employment-local', 'mobile-barber', [
    { title: 'Mobile Barber Assistant', level: 'helper_assistant' },
    { title: 'Mobile Barber', level: 'beginner' },
    { title: 'Self-employed Mobile Barber', level: 'self_employed_owner' },
  ]),
  ...rolesFor('self-employment-local', 'courier-delivery', [
    { title: 'Courier Assistant', level: 'helper_assistant' },
    { title: 'Independent Courier', level: 'beginner', licence_or_check_required: 'Driving licence' },
    { title: 'Self-employed Courier / Delivery', level: 'self_employed_owner', licence_or_check_required: 'Driving licence + insurance' },
  ]),
  ...rolesFor('self-employment-local', 'home-services', [
    { title: 'Home Services Assistant', level: 'helper_assistant' },
    { title: 'Home Services Operative', level: 'beginner' },
    { title: 'Self-employed Home Services', level: 'self_employed_owner' },
  ]),
  ...rolesFor('self-employment-local', 'small-local-business', [
    { title: 'Local Business Assistant', level: 'helper_assistant' },
    { title: 'Small Business Operator', level: 'experienced_worker' },
    { title: 'Small Local Business Owner', level: 'self_employed_owner' },
  ]),
]
