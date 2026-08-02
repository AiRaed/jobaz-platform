/**
 * UK experience specialisation intelligence — one unique roadmap per profession.
 */

import type { ExperienceSpecialisationBlueprint, ExperienceRequirement } from './types'
import {
  NEW_EXPERIENCE_BLUEPRINTS,
  NEW_INDUSTRY_CAREER_HUB,
  NEW_PATTERN_BLUEPRINTS,
} from '../industries/newExperienceSectors'

const CV = '/cv-builder-v2'
const JOB = (q: string) => `/job-finder?query=${encodeURIComponent(q)}`

function req(
  id: string,
  title: string,
  description: string,
  opts: Partial<ExperienceRequirement> = {}
): ExperienceRequirement {
  return { id, title, description, tier: 'mandatory', ...opts }
}

function cert(id: string, title: string, description: string, opts: Partial<ExperienceRequirement> = {}): ExperienceRequirement {
  return { id, title, description, tier: 'recommended', ...opts }
}

export const EXPERIENCE_SPECIALISATION_BLUEPRINTS: Record<string, ExperienceSpecialisationBlueprint> = {
  // ── Driving & Transport ─────────────────────────────────────────────
  taxi_driver: {
    match: 'taxi_driver',
    regulated: true,
    careerHubPathId: 'driving-transport',
    goals: { skilled: 'Licensed Taxi Driver', senior: 'Senior Taxi Driver', supervisor: 'Fleet Supervisor', manager: 'Transport Manager' },
    requirements: [
      req('phv', 'PHV (Private Hire Vehicle) Licence', 'Required to drive passengers for hire in most UK councils.', { href: 'https://www.gov.uk/taxi-driver-licence' }),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for passenger transport roles.'),
      req('medical', 'Driver Medical Certificate', 'Required for taxi and PHV licensing.'),
      req('council_licence', 'Local Authority Taxi/PHV Licence', 'Apply through your local council licensing department.'),
      cert('platform', 'Uber / Bolt Onboarding', 'Complete platform compliance and vehicle standards for app-based work.'),
    ],
    jobs: [
      { title: 'Taxi Driver', keyword: 'taxi driver', seniority: 'mid', salary: '£25k–£38k' },
      { title: 'Private Hire Driver', keyword: 'private hire driver', seniority: 'mid', salary: '£24k–£36k' },
    ],
    courses: [{ id: 'phv_prep', title: 'PHV Licence Preparation', whyReasons: ['Covers council knowledge test and compliance.'], duration: '1–2 weeks', costLabel: 'Paid', pathId: 'driving-transport' }],
    skillsExpected: ['Route knowledge', 'Customer service', 'Safe driving record', 'Vehicle maintenance awareness'],
    fastestRoute: 'PHV licence → DBS → medical → council approval → Uber/Bolt or local operator',
    alternativeRoles: ['Delivery Driver', 'Chauffeur', 'Courier Driver'],
    ukAdvice: ['Each UK council has different PHV rules — apply in the borough where you plan to work.'],
  },
  private_hire_driver: {
    match: 'private_hire_driver',
    regulated: true,
    requirements: [
      req('phv', 'PHV Driver Licence', 'Private hire drivers need council PHV licensing.'),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for passenger transport.'),
      req('medical', 'Driver Medical', 'Required for PHV licensing.'),
    ],
    jobs: [{ title: 'Private Hire Driver', keyword: 'private hire driver', salary: '£24k–£36k' }],
    fastestRoute: 'PHV licence → platform or operator onboarding',
  },
  hgv_driver: {
    match: 'hgv_driver',
    regulated: true,
    careerHubPathId: 'driving-transport',
    goals: { skilled: 'HGV Class C Driver', senior: 'Class CE Driver', supervisor: 'Transport Supervisor', manager: 'Fleet Manager' },
    requirements: [
      req('cat_c', 'Category C HGV Licence', 'Legal requirement for rigid HGV vehicles over 7.5 tonnes.'),
      req('cpc', 'Driver CPC', 'Certificate of Professional Competence — mandatory for commercial HGV driving.'),
      cert('cat_ce', 'Category C+E (Artic)', 'Unlocks higher-paying artic lorry roles.'),
      cert('adr', 'ADR Certificate', 'Optional — required for hazardous goods transport, increases pay.'),
    ],
    jobs: [
      { title: 'HGV Class 2 Driver', keyword: 'HGV class 2 driver', seniority: 'mid', salary: '£32k–£42k' },
      { title: 'Lorry Driver', keyword: 'lorry driver UK', seniority: 'mid', salary: '£30k–£40k' },
    ],
    fastestRoute: 'Car licence → Cat C training → Driver CPC → agency or direct logistics hire',
    skillsExpected: ['Tachograph compliance', 'Route planning', 'Vehicle checks', 'Manual handling awareness'],
    ukAdvice: ['Driver CPC requires 35 hours periodic training every 5 years to stay qualified.'],
  },
  delivery_driver: {
    match: 'delivery_driver',
    requirements: [
      req('uk_licence', 'UK Driving Licence', 'Category B minimum for van and car delivery roles.'),
      cert('dbs', 'DBS Check', 'Often required for in-home deliveries and care parcels.'),
    ],
    jobs: [{ title: 'Delivery Driver', keyword: 'delivery driver', seniority: 'mid', salary: '£24k–£32k' }],
    fastestRoute: 'UK licence → delivery platform or courier company application',
  },
  bus_driver: {
    match: 'bus_driver',
    regulated: true,
    requirements: [
      req('pcv', 'PCV Category D Licence', 'Required for bus and coach driving.'),
      req('cpc', 'Driver CPC', 'Mandatory for passenger-carrying commercial drivers.'),
      req('dbs', 'Enhanced DBS Check', 'Required for passenger transport.'),
    ],
    jobs: [{ title: 'Bus Driver', keyword: 'bus driver', seniority: 'mid', salary: '£28k–£36k' }],
  },
  forklift_operator: {
    match: 'forklift_operator',
    requirements: [req('flt', 'Forklift Licence (FLT)', 'RTITB or ITSSAR accredited forklift training required on most UK sites.')],
    jobs: [{ title: 'Forklift Operator', keyword: 'forklift operator', seniority: 'mid', salary: '£24k–£30k' }],
    careerHubPathId: 'warehouse-logistics',
  },

  // ── Healthcare & Care ───────────────────────────────────────────────
  dentist: {
    match: 'dentist',
    regulated: true,
    careerHubPathId: 'care-support',
    goals: { skilled: 'Associate Dentist', senior: 'Senior Dentist', supervisor: 'Practice Lead', manager: 'Practice Principal' },
    requirements: [
      req('gdc', 'GDC Registration', 'General Dental Council registration mandatory for UK dental practice.', { href: 'https://www.gdc-uk.org/' }),
      req('ielts_oet', 'IELTS / OET', 'English evidence for GDC when trained outside the UK.', { overseasOnly: true }),
      req('performer_list', 'NHS Performer List', 'Required to treat NHS patients in England and Wales.'),
      cert('indemnity', 'Dental Indemnity Insurance', 'Professional indemnity required to practise.'),
    ],
    jobs: [
      { title: 'Associate Dentist', keyword: 'associate dentist UK', seniority: 'mid', salary: '£45k–£75k' },
      { title: 'Dentist NHS', keyword: 'dentist NHS', seniority: 'mid', salary: '£45k–£70k' },
    ],
    fastestRoute: 'GDC registration → NHS performer number → associate dentist role',
    skillsExpected: ['Clinical dentistry', 'Patient communication', 'Radiography', 'CQC compliance'],
  },
  nurse: {
    match: 'nurse',
    regulated: true,
    requirements: [
      req('nmc', 'NMC Registration', 'Nursing and Midwifery Council PIN required.', { href: 'https://www.nmc.org.uk/' }),
      req('cbt_osce', 'CBT / OSCE (if overseas)', 'Test of competence for internationally educated nurses.', { overseasOnly: true }),
    ],
    jobs: [{ title: 'Staff Nurse', keyword: 'staff nurse NHS', seniority: 'mid', salary: '£28k–£38k' }],
    careerHubPathId: 'care-support',
  },
  care_assistant: {
    match: 'care_assistant',
    requirements: [
      req('dbs', 'Enhanced DBS Check', 'Mandatory for all care roles.'),
      cert('care_cert', 'Care Certificate', '15 standards expected by CQC-registered care providers.'),
    ],
    jobs: [{ title: 'Care Assistant', keyword: 'care assistant', seniority: 'junior', salary: '£22k–£26k' }],
    fastestRoute: 'Care Certificate → care agency or CQC-registered employer',
  },
  physiotherapist: {
    match: 'physiotherapist',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Registration', 'Mandatory for UK physiotherapists.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: [{ title: 'Physiotherapist', keyword: 'physiotherapist NHS', seniority: 'mid', salary: '£32k–£42k' }],
  },
  pharmacist: {
    match: 'pharmacist',
    regulated: true,
    requirements: [req('gphc', 'GPhC Registration', 'General Pharmaceutical Council registration.', { href: 'https://www.pharmacyregulation.org/' })],
    jobs: [{ title: 'Pharmacist', keyword: 'pharmacist UK', seniority: 'mid', salary: '£35k–£48k' }],
  },
  social_worker: {
    match: 'social_worker',
    regulated: true,
    requirements: [
      req('swte', 'Social Work England Registration', 'Mandatory in England.', { href: 'https://www.socialworkengland.org.uk/' }),
      req('dbs', 'Enhanced DBS Check', 'Required for all social work.'),
    ],
    jobs: [{ title: 'Social Worker', keyword: 'social worker', seniority: 'mid', salary: '£32k–£40k' }],
  },
  dental_nurse: {
    match: 'dental_nurse',
    regulated: true,
    requirements: [
      req('gdc', 'GDC Dental Nurse Registration', 'Dental nurses must be registered with the GDC.'),
      cert('nEBDN', 'National Diploma in Dental Nursing', 'Standard UK qualification route.'),
    ],
    jobs: [{ title: 'Dental Nurse', keyword: 'dental nurse', seniority: 'junior', salary: '£22k–£28k' }],
  },

  // ── Software / IT ───────────────────────────────────────────────────
  qa_engineer: {
    match: 'qa_engineer',
    portfolioRequired: true,
    careerHubPathId: 'digital-ai-beginner',
    goals: { skilled: 'QA Engineer', senior: 'Senior QA Engineer', supervisor: 'QA Lead', manager: 'QA Manager' },
    requirements: [
      req('github', 'GitHub / Test Portfolio', 'Show test cases, automation scripts, and bug reports.'),
      cert('istqb', 'ISTQB Foundation', 'Most recognised UK QA certification for test professionals.'),
      cert('automation', 'Test Automation (Selenium/Cypress)', 'Automation skills significantly increase UK employability.'),
    ],
    jobs: [
      { title: 'QA Engineer', keyword: 'QA engineer', seniority: 'mid', salary: '£32k–£45k' },
      { title: 'Junior QA Tester', keyword: 'junior QA tester', seniority: 'junior', salary: '£26k–£34k' },
    ],
    courses: [{ id: 'istqb', title: 'ISTQB Foundation', whyReasons: ['UK employers recognise ISTQB on QA CVs.'], duration: '2–4 weeks', costLabel: 'Paid' }],
    fastestRoute: 'ISTQB → automation portfolio → junior QA applications',
    skillsExpected: ['Manual testing', 'Test cases', 'JIRA', 'Regression testing', 'API testing basics'],
  },
  test_automation_engineer: {
    match: 'test_automation_engineer',
    portfolioRequired: true,
    requirements: [
      req('portfolio', 'Automation Portfolio (GitHub)', 'Demonstrate Selenium, Cypress, or Playwright projects.'),
      cert('istqb', 'ISTQB + Automation Tools', 'Combine certification with live automation repos.'),
    ],
    jobs: [{ title: 'Test Automation Engineer', keyword: 'test automation engineer', seniority: 'mid', salary: '£38k–£52k' }],
  },
  frontend_developer: {
    match: 'frontend_developer',
    portfolioRequired: true,
    requirements: [req('portfolio', 'Live Frontend Portfolio', 'Deploy React/Next.js projects — UK employers hire on evidence.', { href: 'https://github.com/' })],
    jobs: [{ title: 'Frontend Developer', keyword: 'frontend developer', seniority: 'mid', salary: '£35k–£55k' }],
    skillsExpected: ['React/Next.js', 'TypeScript', 'Responsive design', 'Git', 'Accessibility'],
  },
  backend_developer: {
    match: 'backend_developer',
    portfolioRequired: true,
    requirements: [req('portfolio', 'API / Backend Portfolio', 'Show REST/GraphQL APIs with tests and documentation.')],
    jobs: [{ title: 'Backend Developer', keyword: 'backend developer', seniority: 'mid', salary: '£38k–£58k' }],
  },
  full_stack_developer: {
    match: 'full_stack_developer',
    portfolioRequired: true,
    requirements: [req('github', 'Full Stack GitHub Portfolio', 'End-to-end projects with deployed frontend and API.')],
    jobs: [{ title: 'Full Stack Developer', keyword: 'full stack developer', seniority: 'mid', salary: '£40k–£60k' }],
  },
  devops_engineer: {
    match: 'devops_engineer',
    requirements: [
      cert('aws', 'AWS / Azure Certification', 'Cloud platform cert expected for DevOps roles.'),
      cert('k8s', 'Kubernetes (CKA)', 'Container orchestration in high demand.'),
    ],
    jobs: [{ title: 'DevOps Engineer', keyword: 'devops engineer', seniority: 'mid', salary: '£45k–£65k' }],
  },
  cyber_security: {
    match: 'cyber_security',
    requirements: [
      cert('security_plus', 'CompTIA Security+', 'Foundational UK cyber security certification.'),
      cert('cissp', 'CISSP / CISM', 'For senior security roles after experience.'),
    ],
    jobs: [{ title: 'Cyber Security Analyst', keyword: 'cyber security analyst', seniority: 'mid', salary: '£35k–£50k' }],
  },
  it_support: {
    match: 'it_support',
    requirements: [cert('comptia_a', 'CompTIA A+', 'Entry IT support certification recognised UK-wide.')],
    jobs: [{ title: 'IT Support Technician', keyword: 'IT support technician', seniority: 'junior', salary: '£24k–£32k' }],
  },

  // ── Construction & Trades ─────────────────────────────────────────
  electrician: {
    match: 'electrician',
    regulated: true,
    careerHubPathId: 'construction-trades',
    goals: { skilled: 'Approved Electrician', senior: 'Senior Electrician', supervisor: 'Electrical Supervisor', manager: 'Electrical Contracts Manager' },
    requirements: [
      req('ecs', 'ECS Card', 'Electrotechnical Certification Scheme — site access standard.', { href: 'https://www.ecscard.org.uk/' }),
      req('18th', '18th Edition Wiring Regulations', 'Required for most UK electrician roles.'),
      req('nvq', 'NVQ Level 3 Electrical', 'Formal UK competency for approved electrician status.'),
      cert('niceic', 'NICEIC Registration', 'Optional — enables self-certification of electrical work.'),
    ],
    jobs: [
      { title: 'Electrician', keyword: 'electrician', seniority: 'mid', salary: '£32k–£48k' },
      { title: 'Maintenance Electrician', keyword: 'maintenance electrician', seniority: 'mid', salary: '£30k–£42k' },
    ],
    fastestRoute: 'NVQ recognition → 18th Edition → ECS Gold → AM2 if needed → approved electrician roles',
    skillsExpected: ['BS 7671 wiring', 'Safe isolation', 'Testing & inspection', 'Commercial/domestic installs'],
  },
  maintenance_electrician: {
    match: 'maintenance_electrician',
    regulated: true,
    requirements: [
      req('ecs', 'ECS Card', 'Required for site electrical work.'),
      req('18th', '18th Edition', 'Expected by UK maintenance employers.'),
    ],
    jobs: [{ title: 'Maintenance Electrician', keyword: 'maintenance electrician', salary: '£30k–£42k' }],
  },
  plumber: {
    match: 'plumber',
    regulated: true,
    requirements: [
      req('gas_safe', 'Gas Safe Register', 'Mandatory for gas installation work.', { href: 'https://www.gassaferegister.co.uk/' }),
      req('cscs', 'CSCS Card', 'Site access for construction plumbing.'),
      cert('nvq_plumbing', 'NVQ Level 2/3 Plumbing', 'Expected trade qualification.'),
    ],
    jobs: [{ title: 'Plumber', keyword: 'plumber', seniority: 'mid', salary: '£30k–£45k' }],
    careerHubPathId: 'construction-trades',
  },
  carpenter: {
    match: 'carpenter',
    requirements: [req('cscs', 'CSCS Card', 'Site access.'), cert('nvq_carpentry', 'NVQ Carpentry', 'Trade qualification.')],
    jobs: [{ title: 'Carpenter', keyword: 'carpenter', seniority: 'mid', salary: '£28k–£40k' }],
  },
  labourer: {
    match: 'labourer',
    requirements: [req('cscs', 'CSCS Green Card', 'Required on UK construction sites.')],
    jobs: [{ title: 'Construction Labourer', keyword: 'construction labourer', seniority: 'junior', salary: '£22k–£28k' }],
  },
  site_manager: {
    match: 'site_manager',
    requirements: [
      req('smsts', 'SMSTS', 'Site Management Safety Training Scheme — expected for site managers.'),
      req('cscs', 'CSCS Black Card', 'Manager-level CSCS card.'),
    ],
    jobs: [{ title: 'Site Manager', keyword: 'site manager construction', seniority: 'senior', salary: '£45k–£65k' }],
  },
  quantity_surveyor: {
    match: 'quantity_surveyor',
    requirements: [req('rics', 'RICS Membership Route', 'Chartered quantity surveyor pathway.', { href: 'https://www.rics.org/' })],
    jobs: [{ title: 'Quantity Surveyor', keyword: 'quantity surveyor', seniority: 'mid', salary: '£35k–£50k' }],
  },

  // ── Warehouse & Logistics ───────────────────────────────────────────
  warehouse_operative: {
    match: 'warehouse_operative',
    requirements: [cert('forklift', 'Forklift Licence', 'Increases pay and role options in UK warehouses.')],
    jobs: [{ title: 'Warehouse Operative', keyword: 'warehouse operative', seniority: 'junior', salary: '£22k–£28k' }],
    careerHubPathId: 'warehouse-logistics',
  },
  forklift_driver: {
    match: 'forklift_driver',
    requirements: [req('flt', 'Forklift Licence (RTITB/ITSSAR)', 'Mandatory for FLT roles on UK sites.')],
    jobs: [{ title: 'Forklift Driver', keyword: 'forklift driver', seniority: 'mid', salary: '£24k–£30k' }],
  },

  // ── Security ────────────────────────────────────────────────────────
  door_supervisor: {
    match: 'door_supervisor',
    regulated: true,
    requirements: [
      req('sia_ds', 'SIA Door Supervisor Licence', 'Security Industry Authority licence mandatory.', { href: 'https://www.sia.homeoffice.gov.uk/' }),
      req('dbs', 'DBS Check', 'Required for licensed security work.'),
    ],
    jobs: [{ title: 'Door Supervisor', keyword: 'door supervisor', seniority: 'mid', salary: '£22k–£30k' }],
    careerHubPathId: 'security-facilities',
  },
  security_guard: {
    match: 'security_guard',
    regulated: true,
    requirements: [req('sia_sg', 'SIA Security Guard Licence', 'Mandatory for static guarding.', { href: 'https://www.sia.homeoffice.gov.uk/' })],
    jobs: [{ title: 'Security Guard', keyword: 'security guard', seniority: 'junior', salary: '£22k–£28k' }],
  },
  cctv_operator: {
    match: 'cctv_operator',
    regulated: true,
    requirements: [req('sia_cctv', 'SIA Public Space Surveillance (CCTV) Licence', 'Required for CCTV operator roles.')],
    jobs: [{ title: 'CCTV Operator', keyword: 'CCTV operator', seniority: 'junior', salary: '£22k–£28k' }],
  },
  close_protection: {
    match: 'close_protection',
    regulated: true,
    requirements: [req('sia_cp', 'SIA Close Protection Licence', 'Mandatory for close protection work.')],
    jobs: [{ title: 'Close Protection Officer', keyword: 'close protection officer', seniority: 'senior', salary: '£35k–£60k' }],
  },

  // ── Hospitality Kitchen ─────────────────────────────────────────────
  commis_chef: {
    match: 'commis_chef',
    requirements: [
      cert('food_hygiene', 'Food Hygiene Level 2', 'Mandatory for UK kitchen roles.'),
      cert('allergy', 'Food Allergen Awareness', 'Expected by UK hospitality employers.'),
    ],
    jobs: [{ title: 'Commis Chef', keyword: 'commis chef', seniority: 'junior', salary: '£22k–£26k' }],
    careerHubPathId: 'hospitality-front',
  },
  head_chef: {
    match: 'head_chef',
    requirements: [
      req('food_hygiene_3', 'Food Hygiene Level 3', 'Required for kitchen management and HACCP.'),
      cert('haccp', 'HACCP Training', 'Expected for head chef and kitchen manager roles.'),
    ],
    jobs: [{ title: 'Head Chef', keyword: 'head chef', seniority: 'senior', salary: '£32k–£45k' }],
  },

  // ── Hospitality Front of House ──────────────────────────────────────
  bartender: {
    match: 'bartender',
    requirements: [cert('personal_licence', 'Personal Licence (optional)', 'Required to authorise alcohol sales in some venues.')],
    jobs: [{ title: 'Bartender', keyword: 'bartender', seniority: 'junior', salary: '£22k–£28k' }],
    careerHubPathId: 'hospitality-front',
  },
  hotel_duty_manager: {
    match: 'hotel_duty_manager',
    requirements: [cert('hospitality_supervision', 'Hospitality Supervision & Leadership', 'Supports duty manager progression.')],
    jobs: [{ title: 'Hotel Duty Manager', keyword: 'hotel duty manager', seniority: 'senior', salary: '£28k–£38k' }],
  },

  // ── Sales ───────────────────────────────────────────────────────────
  account_manager: {
    match: 'account_manager',
    goals: { skilled: 'Account Manager', senior: 'Senior Account Manager', supervisor: 'Sales Team Lead', manager: 'Sales Manager' },
    jobs: [{ title: 'Account Manager', keyword: 'account manager', seniority: 'mid', salary: '£30k–£45k + commission' }],
    skillsExpected: ['CRM (Salesforce/HubSpot)', 'Negotiation', 'Pipeline management', 'Client retention'],
    fastestRoute: 'Tailor CV with revenue metrics → B2B account manager applications',
  },
  recruitment_consultant: {
    match: 'recruitment_consultant',
    requirements: [cert('rec_cert', 'REC / IRP Membership', 'Professional recruitment body — valued by UK agencies.')],
    jobs: [{ title: 'Recruitment Consultant', keyword: 'recruitment consultant', seniority: 'mid', salary: '£25k–£40k + commission' }],
  },

  // ── Office & Admin ──────────────────────────────────────────────────
  administrator: {
    match: 'administrator',
    jobs: [{ title: 'Administrator', keyword: 'administrator', seniority: 'junior', salary: '£22k–£28k' }],
    skillsExpected: ['Microsoft Office', 'Data entry', 'Scheduling', 'Customer communication'],
    careerHubPathId: 'office-admin',
  },
  payroll_administrator: {
    match: 'payroll_administrator',
    requirements: [cert('cpp', 'CIPP Payroll Qualification', 'Chartered Institute of Payroll Professionals — UK standard.')],
    jobs: [{ title: 'Payroll Administrator', keyword: 'payroll administrator', seniority: 'mid', salary: '£26k–£34k' }],
  },

  // ── Accounting & Finance ────────────────────────────────────────────
  accounts_assistant: {
    match: 'accounts_assistant',
    requirements: [
      cert('sage_xero', 'Sage / Xero Proficiency', 'UK SMEs require hands-on accounting software experience.'),
      cert('aat', 'AAT Foundation (optional)', 'Supports progression to assistant accountant roles.'),
    ],
    jobs: [{ title: 'Accounts Assistant', keyword: 'accounts assistant', seniority: 'junior', salary: '£22k–£28k' }],
    skillsExpected: ['Purchase ledger', 'Sales ledger', 'Reconciliation', 'Sage / Xero'],
  },
  payroll_officer: {
    match: 'payroll_officer',
    requirements: [
      cert('cpp', 'CIPP Payroll Qualification', 'Chartered Institute of Payroll Professionals — UK standard.'),
      cert('sage_xero', 'Payroll Software', 'Demonstrate experience with Sage Payroll, Xero, or BrightPay.'),
    ],
    jobs: [{ title: 'Payroll Officer', keyword: 'payroll officer', seniority: 'mid', salary: '£26k–£34k' }],
    skillsExpected: ['RTI submissions', 'PAYE', 'Pension auto-enrolment', 'Statutory payments'],
  },
  bookkeeper: {
    match: 'bookkeeper',
    requirements: [
      cert('aat', 'AAT Bookkeeping', 'Practical UK bookkeeping qualification.'),
      cert('sage_xero', 'Sage / Xero Certification', 'UK SMEs require hands-on software evidence.'),
    ],
    jobs: [{ title: 'Bookkeeper', keyword: 'bookkeeper', seniority: 'mid', salary: '£24k–£32k' }],
    skillsExpected: ['Sage', 'Xero', 'Reconciliation', 'VAT returns', 'Payroll basics'],
  },
  accounts_payable: {
    match: 'accounts_payable',
    requirements: [
      cert('sage_xero', 'Sage / Xero AP Module', 'UK employers expect AP processing in mainstream accounting software.'),
    ],
    jobs: [
      { title: 'Accounts Payable Clerk', keyword: 'accounts payable clerk', seniority: 'junior', salary: '£22k–£28k' },
      { title: 'AP Administrator', keyword: 'accounts payable administrator', seniority: 'mid', salary: '£24k–£30k' },
    ],
    skillsExpected: ['Invoice processing', 'Supplier reconciliation', 'Purchase ledger', '3-way matching'],
  },
  accounts_receivable: {
    match: 'accounts_receivable',
    requirements: [
      cert('sage_xero', 'Sage / Xero AR Module', 'Sales ledger and debtor management in UK accounting systems.'),
    ],
    jobs: [
      { title: 'Accounts Receivable Clerk', keyword: 'accounts receivable clerk', seniority: 'junior', salary: '£22k–£28k' },
      { title: 'AR Administrator', keyword: 'accounts receivable administrator', seniority: 'mid', salary: '£24k–£30k' },
    ],
    skillsExpected: ['Sales ledger', 'Debtor chasing', 'Cash allocation', 'Customer account management'],
  },
  assistant_accountant: {
    match: 'assistant_accountant',
    requirements: [
      cert('aat', 'AAT Qualification', 'Standard UK route for assistant accountant roles.'),
      cert('sage_xero', 'Sage / Xero Proficiency', 'Hands-on month-end and reporting experience.'),
    ],
    jobs: [{ title: 'Assistant Accountant', keyword: 'assistant accountant', seniority: 'mid', salary: '£28k–£36k' }],
    skillsExpected: ['Month-end journals', 'Reconciliations', 'Management accounts prep', 'VAT returns'],
  },
  accountant: {
    match: 'accountant',
    requirements: [
      cert('acca', 'ACCA / CIMA / ICAEW', 'UK employers expect professional accounting body progress.'),
      cert('aat', 'AAT (if pre-qualified)', 'Bridge route for overseas accountants.'),
    ],
    jobs: [{ title: 'Accountant', keyword: 'accountant', seniority: 'mid', salary: '£32k–£45k' }],
    fastestRoute: 'ENIC (if overseas) → AAT/ACCA exemptions → accountant role',
  },
  senior_accountant: {
    match: 'senior_accountant',
    requirements: [
      cert('acca', 'ACCA / CIMA / ICAEW', 'Professional qualification expected at senior accountant level.'),
      cert('ifrs', 'UK GAAP / IFRS', 'UK reporting standards knowledge required.'),
    ],
    jobs: [{ title: 'Senior Accountant', keyword: 'senior accountant', seniority: 'senior', salary: '£38k–£50k' }],
    skillsExpected: ['Month-end close', 'Statutory accounts', 'Team mentoring', 'UK GAAP / IFRS'],
  },
  management_accountant: {
    match: 'management_accountant',
    requirements: [cert('cima', 'CIMA Qualification', 'Standard for UK management accounting roles.')],
    jobs: [{ title: 'Management Accountant', keyword: 'management accountant', seniority: 'mid', salary: '£38k–£52k' }],
    skillsExpected: ['Budgeting', 'Forecasting', 'Variance analysis', 'Management reporting'],
  },
  financial_accountant: {
    match: 'financial_accountant',
    requirements: [
      cert('acca', 'ACCA / ICAEW', 'Financial reporting roles expect chartered progress or qualification.'),
      cert('ifrs', 'UK GAAP / IFRS', 'Statutory and group reporting standards.'),
    ],
    jobs: [{ title: 'Financial Accountant', keyword: 'financial accountant', seniority: 'mid', salary: '£36k–£48k' }],
    skillsExpected: ['Statutory accounts', 'Group reporting', 'UK GAAP / IFRS', 'Audit liaison'],
  },
  financial_analyst: {
    match: 'financial_analyst',
    requirements: [
      cert('cima', 'CIMA / CFA (optional)', 'Analyst roles value management accounting or CFA progress.'),
      cert('excel', 'Advanced Excel / BI', 'Modelling and dashboard skills expected by UK employers.'),
    ],
    jobs: [{ title: 'Financial Analyst', keyword: 'financial analyst', seniority: 'mid', salary: '£35k–£48k' }],
    skillsExpected: ['Financial modelling', 'Variance analysis', 'Excel / Power BI', 'Business partnering'],
  },
  finance_business_partner: {
    match: 'finance_business_partner',
    requirements: [
      cert('cima', 'CIMA Qualification', 'FP&A and business partnering roles strongly prefer CIMA.'),
      cert('excel', 'Advanced Excel / FP&A', 'Budgeting, forecasting, and stakeholder reporting.'),
    ],
    jobs: [{ title: 'Finance Business Partner', keyword: 'finance business partner', seniority: 'senior', salary: '£42k–£58k' }],
    skillsExpected: ['Stakeholder management', 'Budgeting & forecasting', 'Commercial insight', 'FP&A'],
  },
  finance_manager: {
    match: 'finance_manager',
    requirements: [
      cert('acca', 'ACCA / CIMA / ICAEW', 'Finance manager roles expect full professional qualification.'),
    ],
    jobs: [{ title: 'Finance Manager', keyword: 'finance manager', seniority: 'senior', salary: '£42k–£58k' }],
    skillsExpected: ['Team leadership', 'Management accounts', 'Budget ownership', 'Regulatory compliance'],
  },
  auditor: {
    match: 'auditor',
    requirements: [
      cert('acca', 'ACCA / ICAEW Audit Qualification', 'Audit roles require recognised professional body membership.'),
    ],
    jobs: [{ title: 'Auditor', keyword: 'auditor', seniority: 'mid', salary: '£32k–£45k' }],
    skillsExpected: ['Audit planning', 'ISA / UK auditing standards', 'Client liaison', 'Working papers'],
  },
  tax_accountant: {
    match: 'tax_accountant',
    requirements: [
      cert('cta', 'CTA / ATT Qualification', 'UK tax roles value Chartered Tax Adviser or ATT progress.'),
      cert('acca', 'ACCA Tax Module', 'Professional tax compliance and advisory skills.'),
    ],
    jobs: [{ title: 'Tax Accountant', keyword: 'tax accountant', seniority: 'mid', salary: '£34k–£48k' }],
    skillsExpected: ['Corporation tax', 'Personal tax', 'VAT', 'HMRC compliance'],
  },
  credit_controller: {
    match: 'credit_controller',
    requirements: [
      cert('cicm', 'CICM Credit Management (optional)', 'Chartered Institute of Credit Management — UK standard.'),
      cert('sage_xero', 'Debtor Ledger Systems', 'Credit control in Sage, Xero, or ERP systems.'),
    ],
    jobs: [{ title: 'Credit Controller', keyword: 'credit controller', seniority: 'mid', salary: '£26k–£34k' }],
    skillsExpected: ['Debt collection', 'Credit risk assessment', 'Customer negotiation', 'Aged debt analysis'],
  },
  ...NEW_EXPERIENCE_BLUEPRINTS,
}

export const EXPERIENCE_PATTERN_BLUEPRINTS: Array<{ pattern: RegExp; blueprint: Partial<ExperienceSpecialisationBlueprint> }> = [
  { pattern: /driver|driving|courier|chauffeur|transport/i, blueprint: { requirements: [req('uk_licence', 'UK Driving Licence', 'Valid UK licence for commercial driving roles.')] } },
  { pattern: /nurse|healthcare|care|dental|physio|pharmac|radiograph|social_worker/i, blueprint: { regulated: true, requirements: [req('dbs', 'Enhanced DBS Check', 'Mandatory for healthcare and care roles.')] } },
  { pattern: /developer|software|qa_engineer|test_automation|devops|cyber|it_support|system_admin|data_analyst|data_engineer|frontend|backend|full_stack|mobile_developer|cloud_engineer|network_engineer/i, blueprint: { portfolioRequired: true, requirements: [req('portfolio', 'Technical Portfolio / GitHub', 'UK tech employers hire on demonstrated skills.')] } },
  { pattern: /chef|kitchen|catering|porter/i, blueprint: { requirements: [cert('food_hygiene', 'Food Hygiene Level 2', 'Mandatory for UK food handling roles.')] } },
  { pattern: /security|cctv|door_supervisor|protection/i, blueprint: { regulated: true, requirements: [req('sia', 'SIA Licence', 'Security Industry Authority licence for regulated security work.', { href: 'https://www.sia.homeoffice.gov.uk/' })] } },
  { pattern: /electric|plumb|carpent|brick|construct|labourer|painter|roofer|surveyor/i, blueprint: { requirements: [req('cscs', 'CSCS Card', 'Required for UK construction site access.')] } },
  { pattern: /warehouse|forklift|logistics|picker|dispatch|inventory/i, blueprint: { careerHubPathId: 'warehouse-logistics' } },
  { pattern: /account|bookkeep|finance|payroll|audit|tax|credit|payable|receivable/i, blueprint: { requirements: [cert('software', 'Sage / Xero Skills', 'UK finance roles require accounting software proficiency.')] } },
  ...NEW_PATTERN_BLUEPRINTS,
]

export function lookupExperienceBlueprint(
  specialisationId: string,
  label: string
): ExperienceSpecialisationBlueprint | null {
  const exact = EXPERIENCE_SPECIALISATION_BLUEPRINTS[specialisationId]
  if (exact) return exact

  const text = `${specialisationId} ${label}`.toLowerCase()
  for (const { pattern, blueprint } of EXPERIENCE_PATTERN_BLUEPRINTS) {
    if (pattern.test(text)) {
      return { match: pattern, label, ...blueprint } as ExperienceSpecialisationBlueprint
    }
  }
  return null
}

export const INDUSTRY_CAREER_HUB: Record<string, string> = {
  driving_transport: 'driving-transport',
  healthcare: 'care-support',
  software_developer: 'digital-ai-beginner',
  construction: 'construction-trades',
  electrician: 'construction-trades',
  warehouse_logistics: 'warehouse-logistics',
  security: 'security-facilities',
  chef: 'hospitality-front',
  hospitality: 'hospitality-front',
  sales: 'office-admin',
  office_admin: 'office-admin',
  accountant: 'office-admin',
  ...NEW_INDUSTRY_CAREER_HUB,
  other: 'office-admin',
}

export { CV, JOB }
