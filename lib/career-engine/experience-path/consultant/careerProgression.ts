/**
 * UK career ladders — job roles only. Never licences, certs, or compliance steps.
 */

import type { ExperienceIndustryId, ExperiencePathAnswers, ExperienceTier, YearsExperience } from '../types'
import { getProfessionArchetype, type ProfessionArchetype } from './professionInterview'
import { parseExperienceSpecialisations } from './multiSelect'
import { resolveExperienceSpecialisationLabel } from '../experienceSpecialisations'
import {
  NEW_ARCHETYPE_CAREER_LADDERS,
  NEW_INDUSTRY_CAREER_LADDERS,
  NEW_SPECIALISATION_CAREER_LADDERS,
} from '../industries/newExperienceSectors'

const COMPLIANCE_PATTERN =
  /\b(licen[cs]e|licence|certificate|certification|registration|DBS|medical|CPC|ECS|CSCS|SIA|GDC|NMC|HCPC|GPhC|NVQ|ISTQB|18th|edition|onboarding|clearance|indemnity|performer|ENIC|hygiene|HACCP|compliance|training|qualification)\b/i

export function isComplianceStep(step: string): boolean {
  return COMPLIANCE_PATTERN.test(step)
}

export function filterJobRolesOnly(steps: string[]): string[] {
  return steps.filter((s) => s.trim() && !isComplianceStep(s))
}

/** Per-specialisation UK career ladders (job titles only). */
export const SPECIALISATION_CAREER_LADDERS: Record<string, string[]> = {
  // Driving & Transport
  taxi_driver: ['Taxi Driver', 'Executive Chauffeur', 'Airport Transfer Specialist', 'Senior Driver', 'Fleet Supervisor', 'Transport Manager'],
  private_hire_driver: ['Private Hire Driver', 'Executive Chauffeur', 'Airport Transfer Specialist', 'Senior PHV Driver', 'Fleet Supervisor', 'Transport Manager'],
  delivery_driver: ['Delivery Driver', 'Courier Driver', 'Route Driver', 'Delivery Team Leader', 'Transport Coordinator', 'Last-Mile Operations Manager'],
  van_driver: ['Van Driver', 'Multi-Drop Driver', 'Route Driver', 'Delivery Team Leader', 'Transport Coordinator', 'Fleet Supervisor'],
  hgv_driver: ['HGV Class 2 Driver', 'Class CE Artic Driver', 'Trunking Driver', 'Transport Supervisor', 'Fleet Manager', 'Logistics Operations Manager'],
  bus_driver: ['Bus Driver', 'Senior Bus Driver', 'Relief Supervisor', 'Bus Service Controller', 'Depot Supervisor', 'Passenger Transport Manager'],
  coach_driver: ['Coach Driver', 'Tour Coach Driver', 'Senior Coach Driver', 'Relief Supervisor', 'Operations Supervisor', 'Passenger Transport Manager'],
  chauffeur: ['Chauffeur', 'Executive Chauffeur', 'VIP Driver', 'Senior Chauffeur', 'Fleet Supervisor', 'Transport Manager'],
  courier_driver: ['Courier Driver', 'Same-Day Courier', 'Route Courier', 'Courier Team Leader', 'Dispatch Coordinator', 'Logistics Supervisor'],
  logistics_driver: ['Logistics Driver', 'Distribution Driver', 'Class 2 Driver', 'Transport Supervisor', 'Fleet Supervisor', 'Logistics Manager'],
  recovery_driver: ['Recovery Driver', 'Heavy Recovery Operator', 'Senior Recovery Driver', 'Depot Supervisor', 'Fleet Supervisor', 'Transport Manager'],
  transport_planner: ['Transport Planner', 'Route Planner', 'Senior Transport Planner', 'Planning Team Leader', 'Transport Manager', 'Head of Transport'],
  fleet_coordinator: ['Fleet Coordinator', 'Fleet Administrator', 'Fleet Supervisor', 'Fleet Manager', 'Head of Fleet', 'Transport Director'],
  forklift_operator: ['Forklift Operator', 'Warehouse Operative', 'Senior FLT Operator', 'Warehouse Team Leader', 'Warehouse Supervisor', 'Operations Manager'],

  // Healthcare & Care
  care_assistant: ['Care Assistant', 'Senior Care Assistant', 'Team Leader', 'Deputy Care Manager', 'Registered Care Manager', 'Area Care Manager'],
  senior_care_worker: ['Senior Care Worker', 'Lead Care Worker', 'Team Leader', 'Deputy Care Manager', 'Care Home Manager', 'Regional Care Manager'],
  support_worker: ['Support Worker', 'Senior Support Worker', 'Team Leader', 'Service Coordinator', 'Service Manager', 'Operations Manager'],
  healthcare_assistant: ['Healthcare Assistant', 'Senior HCA', 'Clinical Support Worker', 'Ward Team Leader', 'Ward Manager', 'Clinical Services Manager'],
  nurse: ['Staff Nurse', 'Band 6 Nurse', 'Senior Staff Nurse', 'Ward Sister / Charge Nurse', 'Ward Manager', 'Matron / Director of Nursing'],
  dentist: ['Associate Dentist', 'Experienced Associate', 'Senior Dentist', 'Clinical Lead', 'Practice Principal', 'Dental Group Clinical Director'],
  dental_nurse: ['Dental Nurse', 'Senior Dental Nurse', 'Lead Dental Nurse', 'Practice Coordinator', 'Practice Manager', 'Regional Practice Manager'],
  dental_hygienist: ['Dental Hygienist', 'Senior Hygienist', 'Lead Hygienist', 'Clinical Coordinator', 'Practice Manager', 'Clinical Director'],
  physiotherapist: ['Physiotherapist', 'Band 6 Physiotherapist', 'Senior Physiotherapist', 'Team Lead Physiotherapist', 'Advanced Practice Physiotherapist', 'Head of Physiotherapy'],
  occupational_therapist: ['Occupational Therapist', 'Senior OT', 'Specialist OT', 'Team Lead OT', 'Advanced Practitioner', 'Head of Occupational Therapy'],
  pharmacist: ['Pharmacist', 'Clinical Pharmacist', 'Senior Pharmacist', 'Pharmacy Manager', 'Regional Pharmacy Manager', 'Director of Pharmacy'],
  radiographer: ['Radiographer', 'Senior Radiographer', 'Specialist Radiographer', 'Team Lead Radiographer', 'Superintendent Radiographer', 'Head of Imaging'],
  social_worker: ['Social Worker', 'Experienced Social Worker', 'Senior Social Worker', 'Team Manager', 'Service Manager', 'Head of Service'],

  // Software / IT
  frontend_developer: ['Junior Frontend Developer', 'Frontend Developer', 'Mid-Level Frontend Developer', 'Senior Frontend Developer', 'Technical Lead', 'Engineering Manager'],
  backend_developer: ['Junior Backend Developer', 'Backend Developer', 'Mid-Level Backend Developer', 'Senior Backend Developer', 'Technical Lead', 'Engineering Manager'],
  full_stack_developer: ['Junior Full Stack Developer', 'Full Stack Developer', 'Mid-Level Developer', 'Senior Full Stack Developer', 'Technical Lead', 'Engineering Manager'],
  mobile_developer: ['Junior Mobile Developer', 'Mobile Developer', 'Senior Mobile Developer', 'Lead Mobile Developer', 'Mobile Engineering Lead', 'Engineering Manager'],
  qa_engineer: ['Junior QA Engineer', 'QA Engineer', 'Senior QA Engineer', 'QA Lead', 'Test Manager', 'Head of Quality Engineering'],
  test_automation_engineer: ['Test Automation Engineer', 'Senior Automation Engineer', 'Lead Automation Engineer', 'QA Lead', 'Test Manager', 'Head of Quality Engineering'],
  devops_engineer: ['Junior DevOps Engineer', 'DevOps Engineer', 'Senior DevOps Engineer', 'Lead DevOps Engineer', 'Platform Engineering Lead', 'Head of Platform Engineering'],
  cloud_engineer: ['Cloud Engineer', 'Senior Cloud Engineer', 'Cloud Architect', 'Lead Cloud Engineer', 'Principal Cloud Architect', 'Head of Cloud Engineering'],
  data_analyst: ['Junior Data Analyst', 'Data Analyst', 'Senior Data Analyst', 'Lead Data Analyst', 'Analytics Manager', 'Head of Data & Analytics'],
  data_engineer: ['Junior Data Engineer', 'Data Engineer', 'Senior Data Engineer', 'Lead Data Engineer', 'Data Engineering Manager', 'Head of Data Engineering'],
  cyber_security: ['Junior Security Analyst', 'Cyber Security Analyst', 'Senior Security Analyst', 'Security Engineer', 'Security Manager', 'Head of Cyber Security'],
  network_engineer: ['Network Engineer', 'Senior Network Engineer', 'Lead Network Engineer', 'Network Architect', 'Infrastructure Manager', 'Head of IT Infrastructure'],
  it_support: ['IT Support Technician', 'IT Support Specialist', 'Senior IT Support', 'IT Team Lead', 'IT Manager', 'Head of IT'],
  system_administrator: ['Systems Administrator', 'Senior Systems Administrator', 'Lead Sysadmin', 'Infrastructure Engineer', 'IT Operations Manager', 'Head of IT Operations'],

  // Construction
  labourer: ['Construction Labourer', 'Skilled Labourer', 'Trade Assistant', 'Site Operative', 'Site Supervisor', 'Site Manager'],
  carpenter: ['Carpenter', 'Skilled Carpenter', 'Bench Joiner', 'Site Carpenter', 'Foreman Carpenter', 'Site Manager'],
  electrician: ['Electrician', 'Approved Electrician', 'Senior Electrician', 'Electrical Supervisor', 'Site Supervisor', 'Electrical Contracts Manager'],
  plumber: ['Plumber', 'Skilled Plumber', 'Senior Plumber', 'Site Plumber', 'Foreman Plumber', 'Contracts Manager'],
  bricklayer: ['Bricklayer', 'Skilled Bricklayer', 'Senior Bricklayer', 'Gang Leader', 'Site Supervisor', 'Site Manager'],
  painter: ['Painter & Decorator', 'Skilled Decorator', 'Senior Decorator', 'Team Leader', 'Site Supervisor', 'Contracts Manager'],
  roofer: ['Roofer', 'Skilled Roofer', 'Senior Roofer', 'Gang Leader', 'Site Supervisor', 'Roofing Contracts Manager'],
  groundworker: ['Groundworker', 'Skilled Groundworker', 'Senior Groundworker', 'Gang Leader', 'Site Supervisor', 'Site Manager'],
  site_supervisor: ['Site Supervisor', 'Senior Site Supervisor', 'Assistant Site Manager', 'Site Manager', 'Project Manager', 'Construction Director'],
  site_manager: ['Site Manager', 'Senior Site Manager', 'Project Manager', 'Construction Manager', 'Regional Construction Manager', 'Construction Director'],
  quantity_surveyor: ['Assistant Quantity Surveyor', 'Quantity Surveyor', 'Senior Quantity Surveyor', 'Commercial Manager', 'Project Commercial Lead', 'Commercial Director'],

  // Electrical / Trades
  maintenance_electrician: ['Maintenance Electrician', 'Senior Maintenance Electrician', 'Electrical Technician', 'Electrical Supervisor', 'Maintenance Manager', 'Facilities Manager'],
  industrial_electrician: ['Industrial Electrician', 'Senior Industrial Electrician', 'Electrical Technician', 'Electrical Supervisor', 'Maintenance Manager', 'Engineering Manager'],
  electrical_technician: ['Electrical Technician', 'Senior Electrical Technician', 'Maintenance Electrician', 'Electrical Supervisor', 'Maintenance Manager', 'Engineering Manager'],
  electronics_technician: ['Electronics Technician', 'Senior Electronics Technician', 'Test Engineer', 'Team Leader', 'Engineering Supervisor', 'Engineering Manager'],
  solar_installer: ['Solar Installer', 'Senior Solar Installer', 'Solar Technician', 'Installation Team Leader', 'Installation Manager', 'Renewable Energy Manager'],
  hvac_technician: ['HVAC Technician', 'Senior HVAC Engineer', 'Service Engineer', 'Team Leader', 'HVAC Supervisor', 'Facilities Manager'],
  appliance_engineer: ['Appliance Engineer', 'Senior Service Engineer', 'Field Engineer', 'Team Leader', 'Service Manager', 'Operations Manager'],

  // Warehouse & Logistics
  warehouse_operative: ['Warehouse Operative', 'Senior Operative', 'Team Leader', 'Warehouse Supervisor', 'Warehouse Manager', 'Operations Manager'],
  picker_packer: ['Picker Packer', 'Senior Picker Packer', 'Team Leader', 'Warehouse Supervisor', 'Warehouse Manager', 'Operations Manager'],
  forklift_driver: ['Forklift Driver', 'Senior FLT Driver', 'Warehouse Operative', 'Team Leader', 'Warehouse Supervisor', 'Operations Manager'],
  inventory_controller: ['Inventory Controller', 'Senior Inventory Controller', 'Stock Controller', 'Team Leader', 'Warehouse Supervisor', 'Supply Chain Manager'],
  warehouse_supervisor: ['Warehouse Supervisor', 'Senior Warehouse Supervisor', 'Shift Manager', 'Warehouse Manager', 'Operations Manager', 'Regional Operations Manager'],
  logistics_coordinator: ['Logistics Coordinator', 'Senior Logistics Coordinator', 'Transport Coordinator', 'Logistics Supervisor', 'Logistics Manager', 'Head of Logistics'],
  dispatch_clerk: ['Dispatch Clerk', 'Senior Dispatch Clerk', 'Transport Coordinator', 'Dispatch Supervisor', 'Logistics Manager', 'Operations Manager'],
  supply_chain_assistant: ['Supply Chain Assistant', 'Supply Chain Coordinator', 'Supply Chain Analyst', 'Team Leader', 'Supply Chain Manager', 'Head of Supply Chain'],

  // Security
  door_supervisor: ['Door Supervisor', 'Senior Door Supervisor', 'Head Door Supervisor', 'Security Supervisor', 'Security Manager', 'Regional Security Manager'],
  security_guard: ['Security Guard', 'Senior Security Officer', 'Mobile Patrol Officer', 'Security Supervisor', 'Security Manager', 'Regional Security Manager'],
  cctv_operator: ['CCTV Operator', 'Senior CCTV Operator', 'Control Room Operator', 'Control Room Supervisor', 'Security Manager', 'Control Room Manager'],
  event_security: ['Event Security Steward', 'Event Security Officer', 'Senior Event Steward', 'Event Security Supervisor', 'Event Security Manager', 'Operations Manager'],
  close_protection: ['Close Protection Officer', 'Senior CPO', 'Team Leader CPO', 'Close Protection Team Leader', 'Security Operations Manager', 'Director of Security'],
  security_supervisor: ['Security Supervisor', 'Senior Security Supervisor', 'Site Security Manager', 'Regional Security Manager', 'Security Operations Manager', 'Director of Security'],
  control_room_operator: ['Control Room Operator', 'Senior Control Room Operator', 'Control Room Supervisor', 'Security Manager', 'Control Room Manager', 'Director of Security Operations'],

  // Hospitality Kitchen
  kitchen_porter: ['Kitchen Porter', 'Senior Kitchen Porter', 'Commis Chef', 'Chef de Partie', 'Sous Chef', 'Head Chef'],
  commis_chef: ['Commis Chef', 'Chef de Partie', 'Senior Chef de Partie', 'Sous Chef', 'Head Chef', 'Kitchen Manager'],
  chef_de_partie: ['Chef de Partie', 'Senior Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Kitchen Manager'],
  sous_chef: ['Sous Chef', 'Senior Sous Chef', 'Head Chef', 'Executive Chef', 'Kitchen Manager', 'Group Head Chef'],
  head_chef: ['Head Chef', 'Executive Chef', 'Group Head Chef', 'Area Head Chef', 'Director of Food', 'Food & Beverage Director'],
  pastry_chef: ['Pastry Chef', 'Senior Pastry Chef', 'Head Pastry Chef', 'Executive Pastry Chef', 'Kitchen Manager', 'Head of Pastry'],
  catering_assistant: ['Catering Assistant', 'Catering Team Member', 'Senior Catering Assistant', 'Catering Supervisor', 'Catering Manager', 'Operations Manager'],

  // Hospitality FOH
  waiter: ['Waiter', 'Senior Waiter', 'Head Waiter', 'Restaurant Supervisor', 'Restaurant Manager', 'Area Restaurant Manager'],
  bartender: ['Bartender', 'Senior Bartender', 'Head Bartender', 'Bar Supervisor', 'Bar Manager', 'Venue Manager'],
  receptionist: ['Receptionist', 'Senior Receptionist', 'Front Desk Supervisor', 'Front Office Manager', 'Hotel Manager', 'Regional Hotel Manager'],
  hotel_receptionist: ['Hotel Receptionist', 'Senior Receptionist', 'Front Desk Supervisor', 'Front Office Manager', 'Hotel Manager', 'Regional Hotel Manager'],
  barista: ['Barista', 'Senior Barista', 'Head Barista', 'Café Supervisor', 'Café Manager', 'Area Manager'],
  restaurant_supervisor: ['Restaurant Supervisor', 'Assistant Restaurant Manager', 'Restaurant Manager', 'Area Restaurant Manager', 'Operations Manager', 'Regional Director'],
  hotel_duty_manager: ['Hotel Duty Manager', 'Assistant Hotel Manager', 'Hotel Manager', 'Area Hotel Manager', 'Regional Hotel Manager', 'Director of Operations'],
  concierge: ['Concierge', 'Senior Concierge', 'Head Concierge', 'Guest Services Manager', 'Front Office Manager', 'Hotel Manager'],

  // Sales & Business
  sales_assistant: ['Sales Assistant', 'Senior Sales Assistant', 'Team Leader', 'Assistant Manager', 'Store Manager', 'Area Manager'],
  retail_sales: ['Retail Sales Associate', 'Senior Sales Associate', 'Team Leader', 'Assistant Manager', 'Store Manager', 'Area Manager'],
  account_manager: ['Account Manager', 'Senior Account Manager', 'Key Account Manager', 'Sales Team Lead', 'Sales Manager', 'Head of Sales'],
  business_development_executive: ['Business Development Executive', 'Senior BDE', 'Business Development Manager', 'Sales Manager', 'Head of Business Development', 'Commercial Director'],
  sales_manager: ['Sales Manager', 'Senior Sales Manager', 'Regional Sales Manager', 'Head of Sales', 'Commercial Director', 'Managing Director'],
  recruitment_consultant: ['Recruitment Consultant', 'Senior Recruitment Consultant', 'Team Leader', 'Branch Manager', 'Regional Manager', 'Director'],
  customer_success: ['Customer Success Associate', 'Customer Success Manager', 'Senior Customer Success Manager', 'Team Lead', 'Head of Customer Success', 'Director of Customer Experience'],

  // Office & Admin
  administrator: ['Administrator', 'Senior Administrator', 'Team Coordinator', 'Office Supervisor', 'Office Manager', 'Operations Manager'],
  personal_assistant: ['Personal Assistant', 'Senior PA', 'Executive Assistant', 'Team Coordinator', 'Office Manager', 'Chief of Staff'],
  executive_assistant: ['Executive Assistant', 'Senior Executive Assistant', 'PA to Director', 'Office Manager', 'Chief of Staff', 'Head of Business Support'],
  office_manager: ['Office Manager', 'Senior Office Manager', 'Business Support Manager', 'Operations Manager', 'Head of Operations', 'Director of Business Services'],
  hr_administrator: ['HR Administrator', 'Senior HR Administrator', 'HR Advisor', 'HR Manager', 'Head of HR', 'HR Director'],
  payroll_administrator: ['Payroll Administrator', 'Senior Payroll Administrator', 'Payroll Officer', 'Payroll Manager', 'Head of Payroll', 'Finance Manager'],
  data_entry_clerk: ['Data Entry Clerk', 'Senior Administrator', 'Team Coordinator', 'Office Supervisor', 'Office Manager', 'Operations Manager'],

  // Accounting & Finance
  bookkeeper: ['Bookkeeper', 'Senior Bookkeeper', 'Accounts Technician', 'Assistant Accountant', 'Finance Manager', 'Financial Controller'],
  accounts_assistant: ['Accounts Assistant', 'Senior Accounts Assistant', 'Assistant Accountant', 'Management Accountant', 'Finance Manager', 'Financial Controller'],
  payroll_officer: ['Payroll Officer', 'Senior Payroll Officer', 'Payroll Manager', 'HR & Payroll Manager', 'Head of Payroll', 'Finance Manager'],
  accounts_payable: ['Accounts Payable Clerk', 'AP Administrator', 'Senior AP Specialist', 'AP Team Leader', 'Finance Supervisor', 'Finance Manager'],
  accounts_receivable: ['Accounts Receivable Clerk', 'AR Administrator', 'Senior AR Specialist', 'Credit Controller', 'Finance Supervisor', 'Finance Manager'],
  assistant_accountant: ['Assistant Accountant', 'Accountant', 'Senior Accountant', 'Management Accountant', 'Finance Manager', 'Financial Controller'],
  accountant: ['Assistant Accountant', 'Accountant', 'Senior Accountant', 'Management Accountant', 'Finance Manager', 'Financial Controller'],
  senior_accountant: ['Senior Accountant', 'Lead Accountant', 'Financial Accountant', 'Management Accountant', 'Finance Manager', 'Financial Controller'],
  management_accountant: ['Management Accountant', 'Senior Management Accountant', 'Financial Analyst', 'Finance Manager', 'Financial Controller', 'Finance Director'],
  financial_accountant: ['Financial Accountant', 'Senior Financial Accountant', 'Group Accountant', 'Financial Controller', 'Head of Finance', 'Finance Director'],
  financial_analyst: ['Financial Analyst', 'Senior Financial Analyst', 'Finance Business Partner', 'Finance Manager', 'Head of Finance', 'Finance Director'],
  finance_business_partner: ['Finance Business Partner', 'Senior FP&A Analyst', 'Head of FP&A', 'Finance Manager', 'Head of Finance', 'Finance Director'],
  finance_manager: ['Finance Manager', 'Senior Finance Manager', 'Financial Controller', 'Head of Finance', 'Finance Director', 'CFO'],
  auditor: ['Junior Auditor', 'Auditor', 'Senior Auditor', 'Audit Manager', 'Head of Audit', 'Partner / Director'],
  tax_accountant: ['Tax Assistant', 'Tax Accountant', 'Senior Tax Accountant', 'Tax Manager', 'Head of Tax', 'Tax Director'],
  credit_controller: ['Credit Controller', 'Senior Credit Controller', 'Credit Manager', 'Head of Credit', 'Finance Manager', 'Financial Controller'],
  ...NEW_SPECIALISATION_CAREER_LADDERS,
}

const ARCHETYPE_CAREER_LADDERS: Record<ProfessionArchetype, string[]> = {
  passenger_transport: ['Driver', 'Senior Driver', 'Specialist Driver', 'Fleet Supervisor', 'Transport Manager', 'Head of Transport'],
  hgv_commercial: ['HGV Driver', 'Class CE Driver', 'Trunking Driver', 'Transport Supervisor', 'Fleet Manager', 'Logistics Operations Manager'],
  delivery_driver: ['Delivery Driver', 'Route Driver', 'Senior Driver', 'Team Leader', 'Transport Coordinator', 'Operations Manager'],
  dental: ['Associate Dentist', 'Experienced Associate', 'Senior Dentist', 'Clinical Lead', 'Practice Principal', 'Clinical Director'],
  nursing: ['Staff Nurse', 'Band 6 Nurse', 'Senior Staff Nurse', 'Charge Nurse', 'Ward Manager', 'Matron'],
  regulated_health: ['Healthcare Professional', 'Senior Practitioner', 'Specialist Practitioner', 'Team Lead', 'Service Manager', 'Head of Service'],
  software_engineering: ['Junior Developer', 'Developer', 'Mid-Level Developer', 'Senior Developer', 'Technical Lead', 'Engineering Manager'],
  qa_testing: ['Junior QA Engineer', 'QA Engineer', 'Senior QA Engineer', 'QA Lead', 'Test Manager', 'Head of Quality'],
  data_tech: ['Junior Analyst', 'Analyst / Engineer', 'Senior Specialist', 'Lead Specialist', 'Manager', 'Head of Function'],
  trades_electrical: ['Electrician', 'Approved Electrician', 'Senior Electrician', 'Site Supervisor', 'Contracts Supervisor', 'Contracts Manager'],
  trades_construction: ['Trade Operative', 'Skilled Tradesperson', 'Senior Tradesperson', 'Site Supervisor', 'Site Manager', 'Construction Manager'],
  warehouse_logistics: ['Warehouse Operative', 'Senior Operative', 'Team Leader', 'Warehouse Supervisor', 'Warehouse Manager', 'Operations Manager'],
  security_sia: ['Security Officer', 'Senior Security Officer', 'Security Supervisor', 'Security Manager', 'Regional Security Manager', 'Director of Security'],
  care_support: ['Care Assistant', 'Senior Care Assistant', 'Team Leader', 'Deputy Manager', 'Care Manager', 'Area Manager'],
  hospitality_kitchen: ['Commis Chef', 'Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Kitchen Manager'],
  hospitality_foh: ['Front of House Staff', 'Senior Team Member', 'Supervisor', 'Assistant Manager', 'Venue Manager', 'Operations Manager'],
  finance_accounting: ['Finance Assistant', 'Accountant', 'Senior Accountant', 'Finance Manager', 'Financial Controller', 'Finance Director'],
  sales_business: ['Sales Executive', 'Account Executive', 'Senior Account Manager', 'Sales Team Lead', 'Sales Manager', 'Head of Sales'],
  office_admin: ['Administrator', 'Senior Administrator', 'Team Coordinator', 'Office Supervisor', 'Office Manager', 'Operations Manager'],
  ...NEW_ARCHETYPE_CAREER_LADDERS,
  general: ['Skilled Professional', 'Experienced Specialist', 'Senior Specialist', 'Team Leader', 'Manager', 'Director'],
}

const INDUSTRY_CAREER_LADDERS: Record<ExperienceIndustryId, string[]> = {
  driving_transport: ['Driver', 'Senior Driver', 'Specialist Driver', 'Team Leader', 'Supervisor', 'Transport Manager'],
  healthcare: ['Care / Clinical Role', 'Senior Practitioner', 'Team Leader', 'Deputy Manager', 'Manager', 'Head of Service'],
  software_developer: ['Junior Developer', 'Developer', 'Senior Developer', 'Technical Lead', 'Engineering Manager', 'Head of Engineering'],
  construction: ['Site Operative', 'Skilled Tradesperson', 'Senior Tradesperson', 'Site Supervisor', 'Site Manager', 'Construction Director'],
  electrician: ['Electrician', 'Approved Electrician', 'Senior Electrician', 'Site Supervisor', 'Contracts Manager', 'Electrical Director'],
  warehouse_logistics: ['Warehouse Operative', 'Senior Operative', 'Team Leader', 'Supervisor', 'Manager', 'Operations Director'],
  security: ['Security Officer', 'Senior Officer', 'Supervisor', 'Security Manager', 'Regional Manager', 'Director of Security'],
  chef: ['Commis Chef', 'Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Kitchen Director'],
  hospitality: ['Front of House', 'Senior Team Member', 'Supervisor', 'Assistant Manager', 'Venue Manager', 'Operations Director'],
  sales: ['Sales Executive', 'Account Manager', 'Senior Account Manager', 'Sales Team Lead', 'Sales Manager', 'Commercial Director'],
  office_admin: ['Administrator', 'Senior Administrator', 'Coordinator', 'Supervisor', 'Office Manager', 'Operations Director'],
  accountant: ['Finance Assistant', 'Accountant', 'Senior Accountant', 'Finance Manager', 'Financial Controller', 'Finance Director'],
  ...NEW_INDUSTRY_CAREER_LADDERS,
  other: ['Skilled Professional', 'Experienced Specialist', 'Senior Specialist', 'Team Leader', 'Manager', 'Director'],
}

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function personalizeLadder(base: string[], label: string): string[] {
  const ladder = filterJobRolesOnly([...base])
  if (ladder.length === 0) return [label]

  const normLabel = normalizeForMatch(label)
  const matchIdx = ladder.findIndex((step) => {
    const norm = normalizeForMatch(step)
    return norm === normLabel || norm.includes(normLabel) || normLabel.includes(norm)
  })

  if (matchIdx <= 0) {
    if (matchIdx === 0) return ladder
    return [label, ...ladder.filter((s) => normalizeForMatch(s) !== normLabel)].slice(0, 6)
  }

  return [label, ...ladder.slice(matchIdx + 1)].slice(0, 6)
}

function mergeCareerLadders(ladders: string[][], combinedLabel: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const add = (step: string) => {
    const norm = normalizeForMatch(step)
    if (!norm || seen.has(norm)) return
    seen.add(norm)
    out.push(step)
  }

  add(combinedLabel)

  for (let level = 1; level < 6; level += 1) {
    for (const ladder of ladders) {
      if (ladder[level]) add(ladder[level])
    }
  }

  return out.slice(0, 6)
}

export function resolveBaseCareerLadder(
  specId: string,
  label: string,
  industryId: ExperienceIndustryId
): string[] {
  const exact = SPECIALISATION_CAREER_LADDERS[specId]
  if (exact?.length) return personalizeLadder(exact, label)

  const archetype = getProfessionArchetype(specId, industryId)
  const archetypeLadder = ARCHETYPE_CAREER_LADDERS[archetype]
  if (archetypeLadder?.length) return personalizeLadder(archetypeLadder, label)

  const industryLadder = INDUSTRY_CAREER_LADDERS[industryId]
  if (industryLadder?.length) return personalizeLadder(industryLadder, label)

  return personalizeLadder(
    ['Skilled Professional', 'Experienced Specialist', 'Senior Specialist', 'Team Leader', 'Manager', 'Director'],
    label
  )
}

const TIER_BASE_INDEX: Record<ExperienceTier, number> = {
  skilled: 0,
  senior: 1,
  supervisor: 3,
  manager: 4,
}

const YEARS_INDEX_BOOST: Record<YearsExperience, number> = {
  '1_2': 0,
  '3_5': 0,
  '6_10': 1,
  '10_plus': 2,
}

export function resolveCurrentCareerIndex(
  ladder: string[],
  label: string,
  tier: ExperienceTier,
  years: YearsExperience
): number {
  const normLabel = normalizeForMatch(label)
  const labelIdx = ladder.findIndex((step) => {
    const norm = normalizeForMatch(step)
    return norm === normLabel || norm.includes(normLabel) || normLabel.includes(norm)
  })

  let idx = labelIdx >= 0 ? labelIdx : TIER_BASE_INDEX[tier]
  idx = Math.min(idx + YEARS_INDEX_BOOST[years], ladder.length - 2)
  return Math.max(0, Math.min(idx, ladder.length - 1))
}

export function resolveNextCareerIndex(ladder: string[], currentIndex: number): number {
  return Math.min(currentIndex + 1, ladder.length - 1)
}

export type CareerProgression = {
  ladder: string[]
  currentIndex: number
  nextIndex: number
  currentRole: string
  nextRole: string
  ultimateRole: string
  goals: Record<ExperienceTier, string>
  timelines: Record<ExperienceTier, string[]>
}

export function resolveCareerProgression(
  answers: Pick<ExperiencePathAnswers, 'experience_specialisation' | 'experience_specialisation_other' | 'industry' | 'years_experience'>,
  label: string,
  tier: ExperienceTier
): CareerProgression {
  const specIds = parseExperienceSpecialisations(answers as Record<string, string>)
  const industryId = answers.industry

  let ladder: string[]
  if (specIds.length > 1) {
    const ladders = specIds.map((specId) => {
      const specLabel = resolveExperienceSpecialisationLabel(
        industryId,
        specId,
        answers.experience_specialisation_other
      )
      return resolveBaseCareerLadder(specId, specLabel, industryId)
    })
    ladder = mergeCareerLadders(ladders, label)
  } else {
    const specId = specIds[0] || answers.experience_specialisation || answers.industry
    ladder = resolveBaseCareerLadder(specId, label, industryId)
  }

  const currentIndex = resolveCurrentCareerIndex(ladder, label, tier, answers.years_experience)
  const nextIndex = resolveNextCareerIndex(ladder, currentIndex)

  const pick = (offset: number) => ladder[Math.min(currentIndex + offset, ladder.length - 1)]

  const goals: Record<ExperienceTier, string> = {
    skilled: pick(1),
    senior: pick(2),
    supervisor: pick(3),
    manager: pick(4),
  }

  const timelines: Record<ExperienceTier, string[]> = {
    skilled: ladder,
    senior: ladder,
    supervisor: ladder,
    manager: ladder,
  }

  return {
    ladder,
    currentIndex,
    nextIndex,
    currentRole: ladder[currentIndex],
    nextRole: ladder[nextIndex],
    ultimateRole: ladder[ladder.length - 1],
    goals,
    timelines,
  }
}

export function assertJobRoleLadder(ladder: string[]): void {
  const bad = ladder.filter(isComplianceStep)
  if (bad.length > 0) {
    throw new Error(`Career ladder contains compliance steps: ${bad.join(', ')}`)
  }
}
