import { specialism } from './builders'
import type { ProfessionSpecialism } from '../types'

export const PROFESSION_SPECIALISMS: ProfessionSpecialism[] = [
  // 1 Security
  specialism('security-facilities', 'door-security', 'Door Security', 'Door supervision and venue security.', 10),
  specialism('security-facilities', 'cctv-control-room', 'CCTV / Control Room', 'CCTV monitoring and control room ops.', 20),
  specialism('security-facilities', 'event-stewarding', 'Event Stewarding', 'Event and crowd stewarding.', 30),
  specialism('security-facilities', 'facilities-security', 'Facilities Security', 'Site and facilities guarding.', 40),
  specialism('security-facilities', 'security-supervisor', 'Security Supervisor', 'Team lead and site security supervision.', 50),

  // 2 Care
  specialism('care-support', 'adult-care', 'Adult Care', 'Adult residential and care home support.', 10),
  specialism('care-support', 'support-worker', 'Support Worker', 'Community and supported living.', 20),
  specialism('care-support', 'home-care', 'Home Care', 'Domiciliary / home care visits.', 30),
  specialism('care-support', 'care-assistant', 'Care Assistant', 'Hands-on care assistant pathways.', 40),
  specialism('care-support', 'senior-care-worker', 'Senior Care Worker', 'Senior care and shift lead routes.', 50),

  // 3 Construction
  specialism('construction-trades', 'general-labourer', 'General Labourer', 'Site labouring and general construction support.', 10),
  specialism('construction-trades', 'bricklaying', 'Bricklaying', 'Brick and block work.', 20),
  specialism('construction-trades', 'carpentry', 'Carpentry', 'Carpentry and joinery.', 30),
  specialism('construction-trades', 'painting-decorating', 'Painting & Decorating', 'Painting and decorating.', 40),
  specialism('construction-trades', 'plastering', 'Plastering', 'Plastering and dry lining.', 50),
  specialism('construction-trades', 'tiling', 'Tiling', 'Wall and floor tiling.', 60),
  specialism('construction-trades', 'roofing', 'Roofing', 'Roofing and weatherproofing.', 70),
  specialism('construction-trades', 'groundwork', 'Groundwork', 'Groundworks and foundations support.', 80),

  // 4 Electrical
  specialism('electrical-technical', 'electrician', 'Electrician', 'Domestic and commercial electrical work.', 10),
  specialism('electrical-technical', 'electrical-improver', 'Electrical Improver', 'Improver pathway toward electrician.', 20),
  specialism('electrical-technical', 'pat-testing', 'PAT Testing', 'Portable appliance testing.', 30),
  specialism('electrical-technical', 'fire-alarm-lv', 'Fire Alarm / Low Voltage', 'Fire alarm and low voltage systems.', 40),
  specialism('electrical-technical', 'maintenance-technician', 'Maintenance Technician', 'Building and plant electrical maintenance.', 50),

  // 5 Plumbing
  specialism('plumbing-heating', 'plumbing', 'Plumbing', 'General plumbing installation and repair.', 10),
  specialism('plumbing-heating', 'heating-assistant', 'Heating Assistant', 'Heating install support.', 20),
  specialism('plumbing-heating', 'bathroom-fitting', 'Bathroom Fitting', 'Bathroom fit-out.', 30),
  specialism('plumbing-heating', 'pipefitting', 'Pipefitting', 'Industrial / commercial pipefitting.', 40),
  specialism('plumbing-heating', 'maintenance-plumbing', 'Maintenance Plumbing', 'Reactive and planned plumbing maintenance.', 50),

  // 6 Warehouse
  specialism('warehouse-logistics', 'warehouse-operative', 'Warehouse Operative', 'General warehouse operations.', 10),
  specialism('warehouse-logistics', 'forklift-flt', 'Forklift / FLT', 'Forklift and materials handling.', 20),
  specialism('warehouse-logistics', 'stock-control', 'Stock Control', 'Stock and inventory control.', 30),
  specialism('warehouse-logistics', 'goods-in-out', 'Goods In / Goods Out', 'Inbound and outbound goods handling.', 40),
  specialism('warehouse-logistics', 'picking-packing', 'Picking & Packing', 'Order picking and packing.', 50),
  specialism('warehouse-logistics', 'warehouse-supervisor', 'Warehouse Supervisor', 'Warehouse team leadership.', 60),

  // 7 Driving
  specialism('driving-transport', 'delivery-driver', 'Delivery Driver', 'Parcel and goods delivery.', 10),
  specialism('driving-transport', 'courier', 'Courier', 'Same-day and courier routes.', 20),
  specialism('driving-transport', 'taxi-phv', 'Taxi / PHV', 'Taxi and private hire driving.', 30),
  specialism('driving-transport', 'van-driver', 'Van Driver', 'Light goods / van driving.', 40),
  specialism('driving-transport', 'hgv-lgv', 'HGV / LGV', 'Heavy goods vehicle driving.', 50),
  specialism('driving-transport', 'bus-pcv', 'Bus / PCV', 'Passenger carrying vehicle driving.', 60),
  specialism(
    'driving-transport',
    'transport-admin',
    'Transport Admin / Coordinator',
    'Transport office admin, planning, and coordination support.',
    65
  ),
  specialism(
    'driving-transport',
    'transport-supervisor',
    'Transport Supervisor',
    'Fleet and transport supervision.',
    70
  ),
  specialism(
    'driving-transport',
    'train-driver',
    'Train Driver',
    'Rail train driving — competitive employer recruitment pathways only.',
    80
  ),

  // 8 Hospitality
  specialism('hospitality', 'front-of-house', 'Front of House', 'FOH and waiting roles.', 10),
  specialism('hospitality', 'bar-staff', 'Bar Staff', 'Bar and drinks service.', 20),
  specialism('hospitality', 'kitchen-assistant', 'Kitchen Assistant', 'Kitchen support and prep.', 30),
  specialism('hospitality', 'chef-cook', 'Chef / Cook', 'Cooking and chef pathways.', 40),
  specialism('hospitality', 'housekeeping', 'Housekeeping', 'Hotel and venue housekeeping.', 50),
  specialism('hospitality', 'hotel-reception', 'Hotel Reception', 'Front desk and reception.', 60),
  specialism('hospitality', 'hospitality-supervisor', 'Hospitality Supervisor', 'Shift and outlet supervision.', 70),

  // 9 Cleaning
  specialism('cleaning-facilities', 'general-cleaning', 'General Cleaning', 'General cleaning roles.', 10),
  specialism('cleaning-facilities', 'deep-cleaning', 'Deep Cleaning', 'Deep and specialist cleans.', 20),
  specialism('cleaning-facilities', 'commercial-cleaning', 'Commercial Cleaning', 'Office and commercial sites.', 30),
  specialism('cleaning-facilities', 'housekeeping-cleaning', 'Housekeeping', 'Residential / hotel housekeeping cleaning.', 40),
  specialism('cleaning-facilities', 'cleaning-supervisor', 'Cleaning Supervisor', 'Cleaning team leadership.', 50),
  specialism('cleaning-facilities', 'self-employed-cleaner', 'Self-employed Cleaner', 'Independent cleaning business.', 60),

  // 10 Retail
  specialism('retail-sales', 'retail-assistant', 'Retail Assistant', 'Shop floor retail.', 10),
  specialism('retail-sales', 'cashier', 'Cashier', 'Till and checkout.', 20),
  specialism('retail-sales', 'stockroom', 'Stockroom', 'Back of house stock.', 30),
  specialism('retail-sales', 'sales-assistant', 'Sales Assistant', 'Sales-focused retail.', 40),
  specialism('retail-sales', 'customer-service-retail', 'Customer Service Retail', 'In-store customer service.', 50),
  specialism('retail-sales', 'retail-supervisor', 'Retail Supervisor', 'Retail team leadership.', 60),

  // 11 Office
  specialism('office-admin', 'admin-assistant', 'Admin Assistant', 'General office admin.', 10),
  specialism('office-admin', 'receptionist', 'Receptionist', 'Front desk reception.', 20),
  specialism('office-admin', 'data-entry', 'Data Entry', 'Data entry and records.', 30),
  specialism('office-admin', 'office-coordinator', 'Office Coordinator', 'Office coordination.', 40),
  specialism('office-admin', 'personal-assistant', 'Personal Assistant', 'PA support.', 50),
  specialism('office-admin', 'admin-supervisor', 'Admin Supervisor', 'Admin team leadership.', 60),

  // 12 Customer service
  specialism('customer-service', 'call-handler', 'Call Handler', 'Inbound call handling.', 10),
  specialism('customer-service', 'customer-service-advisor', 'Customer Service Advisor', 'Advisor-level support.', 20),
  specialism('customer-service', 'live-chat-support', 'Live Chat Support', 'Live chat / messaging support.', 30),
  specialism('customer-service', 'complaint-handling', 'Complaint Handling', 'Complaints and escalation.', 40),
  specialism('customer-service', 'team-leader', 'Team Leader', 'Contact centre team leadership.', 50),

  // 13 Manufacturing
  specialism('manufacturing-engineering', 'production-operative', 'Production Operative', 'Production line ops.', 10),
  specialism('manufacturing-engineering', 'assembly-operative', 'Assembly Operative', 'Assembly and build.', 20),
  specialism('manufacturing-engineering', 'machine-operator', 'Machine Operator', 'Machine operation.', 30),
  specialism('manufacturing-engineering', 'quality-control', 'Quality Control', 'QC and inspection.', 40),
  specialism('manufacturing-engineering', 'maintenance-assistant', 'Maintenance Assistant', 'Maintenance support.', 50),
  specialism('manufacturing-engineering', 'engineering-technician', 'Engineering Technician', 'Engineering technician support.', 60),

  // 14 Digital
  specialism('digital-it-support', 'it-support', 'IT Support', 'IT support and first-line help.', 10),
  specialism('digital-it-support', 'helpdesk', 'Helpdesk', 'Helpdesk and ticket handling.', 20),
  specialism('digital-it-support', 'web-wordpress-support', 'Web / WordPress Support', 'Website and WordPress support.', 30),
  specialism('digital-it-support', 'junior-developer', 'Junior Developer', 'Junior software / web development.', 40),
  specialism('digital-it-support', 'digital-assistant', 'Digital Assistant', 'Digital ops and content support.', 50),
  specialism('digital-it-support', 'qa-tester', 'QA Tester', 'Software QA and testing.', 60),

  // 15 Creative
  specialism('creative-design', 'graphic-design', 'Graphic Design', 'Practical graphic design.', 10),
  specialism('creative-design', 'video-editing', 'Video Editing', 'Video editing and post.', 20),
  specialism('creative-design', '3d-animation', '3D / Animation', '3D and animation support.', 30),
  specialism('creative-design', 'social-media-content', 'Social Media Content', 'Social content creation.', 40),
  specialism('creative-design', 'photographer-videographer', 'Photographer / Videographer', 'Photo and video capture.', 50),
  specialism('creative-design', 'creative-assistant', 'Creative Assistant', 'Creative studio assistance.', 60),

  // 16 Beauty
  specialism('beauty-personal', 'barber', 'Barber', 'Barbering services.', 10),
  specialism('beauty-personal', 'hairdresser', 'Hairdresser', 'Hairdressing.', 20),
  specialism('beauty-personal', 'beauty-therapist', 'Beauty Therapist', 'Beauty therapy treatments.', 30),
  specialism('beauty-personal', 'nail-technician', 'Nail Technician', 'Nail services.', 40),
  specialism('beauty-personal', 'makeup-artist', 'Makeup Artist', 'Makeup artistry.', 50),

  // 17 Childcare
  specialism('childcare-education-support', 'teaching-assistant', 'Teaching Assistant', 'School teaching assistant.', 10),
  specialism('childcare-education-support', 'nursery-assistant', 'Nursery Assistant', 'Nursery and early years support.', 20),
  specialism('childcare-education-support', 'sen-support', 'SEN Support', 'SEN classroom and pupil support.', 30),
  specialism('childcare-education-support', 'childcare-assistant', 'Childcare Assistant', 'Childcare setting support.', 40),
  specialism('childcare-education-support', 'tutor-assistant', 'Tutor Assistant', 'Tutoring support roles.', 50),

  // 18 Self-employment
  specialism('self-employment-local', 'handyman', 'Handyman', 'General handyman services.', 10),
  specialism('self-employment-local', 'mobile-cleaner', 'Mobile Cleaner', 'Mobile cleaning business.', 20),
  specialism('self-employment-local', 'mobile-barber', 'Mobile Barber', 'Mobile barbering.', 30),
  specialism('self-employment-local', 'courier-delivery', 'Courier / Delivery', 'Independent courier work.', 40),
  specialism('self-employment-local', 'home-services', 'Home Services', 'Local home service jobs.', 50),
  specialism('self-employment-local', 'small-local-business', 'Small Local Business', 'Small local service business.', 60),
]
