/**
 * Dynamic UK profession analysis — reasons like a career adviser, not a form template.
 * Interview questions and roadmap inputs are derived from genuine employer expectations
 * for the selected role(s), not generic industry blocks.
 */

import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import { resolveExperienceSpecialisationLabel } from '../experienceSpecialisations'
import { lookupExperienceBlueprint } from '../dynamic/ukExperienceRegistry'
import type { ExperienceIndustryId } from '../types'
import { getProfessionArchetype, type ProfessionArchetype } from './professionInterview'
import { ARCHETYPE_FACTS, employerExpectations, type UkFact } from './ukProfessionFacts'
import { getSpecProfileFacts, SPEC_SKILLS } from './specFollowUps'
import { resolveBaseCareerLadder } from './careerProgression'
import { shouldAskExperienceQuestion } from './interviewDedup'
import {
  isMultiSelectQuestion,
  MULTI_SELECT_HELPER,
  PROFESSIONAL_CERTIFICATION_OPTIONS,
  buildCertificationStatusQuestions,
} from '@/lib/career-engine/shared/assessmentMultiSelect'
import { parseMultiSelectValue } from './multiSelect'
import {
  NEW_ARCHETYPE_UK_EXPECTATIONS,
  NEW_FACT_QUESTION_DEFS,
} from '../industries/newExperienceSectors'
import { resolvePortfolioEvidence } from './portfolioQuestions'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export type ProfessionContext = {
  specId: string
  label: string
  industryId: ExperienceIndustryId
  archetype: ProfessionArchetype
  dailyResponsibilities: string[]
  technicalSkills: string[]
  customerFacingSkills: string[]
  leadershipResponsibilities: string[]
  systemsAndTools: string[]
  licences: UkFact[]
  certifications: UkFact[]
  healthAndSafety: UkFact[]
  regulatory: UkFact[]
  employerPreferences: string[]
  careerProgression: string[]
  facts: UkFact[]
}

type ArchetypeExpectations = {
  daily: (label: string) => string[]
  technical: (label: string) => string[]
  customerFacing?: (label: string) => string[]
  leadership?: (label: string) => string[]
  systems?: (label: string) => string[]
  healthAndSafety?: (label: string) => string[]
}

const ARCHETYPE_UK_EXPECTATIONS: Record<ProfessionArchetype, ArchetypeExpectations> = {
  passenger_transport: {
    daily: (l) => [`Safe passenger transport as a ${l}`, 'Route planning and navigation', 'Vehicle checks and compliance'],
    technical: () => ['UK Highway Code', 'Tachograph awareness (if commercial)', 'Defensive driving'],
    customerFacing: () => ['Professional communication', 'Conflict de-escalation', 'Accessibility awareness'],
    systems: () => ['Dispatch / booking apps', 'Sat-nav and route tools'],
  },
  hgv_commercial: {
    daily: (l) => [`Commercial HGV driving as a ${l}`, 'Vehicle walk-around checks', 'Load securing and delivery documentation'],
    technical: () => ['Tachograph compliance', 'Manual handling', 'Vehicle defect reporting'],
    systems: () => ['Fleet telematics', 'Digital tachograph', 'Warehouse / depot systems'],
  },
  delivery_driver: {
    daily: (l) => [`Multi-drop deliveries as a ${l}`, 'Proof of delivery', 'Time-critical routing'],
    technical: () => ['Van load safety', 'UK driving licence compliance'],
    customerFacing: () => ['Customer doorstep communication', 'Problem resolution on route'],
    systems: () => ['Courier handheld devices', 'Route optimisation apps'],
  },
  dental: {
    daily: (l) => [`Clinical dentistry as a ${l}`, 'Patient assessment and treatment planning', 'Radiography and record keeping'],
    technical: () => ['UK dental clinical standards', 'Infection control', 'CQC compliance'],
    customerFacing: () => ['Patient communication', 'Treatment consent', 'Anxiety management'],
    leadership: () => ['Clinical mentoring', 'Practice protocol adherence'],
    systems: () => ['Dental practice management software', 'Digital radiography'],
  },
  nursing: {
    daily: (l) => [`Registered nursing as a ${l}`, 'Patient assessment and care planning', 'Medication administration and documentation'],
    technical: () => ['NMC standards of proficiency', 'Clinical governance', 'Safeguarding'],
    customerFacing: () => ['Compassionate communication', 'Family liaison', 'Multidisciplinary teamwork'],
    leadership: () => ['Shift coordination', 'Mentoring HCAs and students'],
    systems: () => ['Electronic patient records', 'NHS digital systems'],
  },
  regulated_health: {
    daily: (l) => [`Regulated healthcare practice as a ${l}`, 'Patient-centred assessment', 'Evidence-based intervention'],
    technical: () => ['UK regulator standards', 'Clinical documentation', 'Safeguarding'],
    customerFacing: () => ['Professional communication', 'Consent and capacity'],
    systems: () => ['NHS / clinical IT systems'],
  },
  software_engineering: {
    daily: (l) => [`Software development as a ${l}`, 'Feature delivery and code review', 'Debugging and production support'],
    technical: (l) => [`Production-grade ${l.toLowerCase()} skills`, 'Version control', 'Testing and CI/CD'],
    systems: () => ['Git / GitHub', 'Cloud platforms (AWS, Azure, GCP)', 'Agile tooling (Jira, etc.)'],
  },
  qa_testing: {
    daily: (l) => [`Quality assurance as a ${l}`, 'Test planning and execution', 'Defect reporting and regression'],
    technical: () => ['Test case design', 'API and UI automation', 'Defect lifecycle management'],
    systems: () => ['Selenium / Cypress / Playwright', 'Postman', 'Test management tools'],
  },
  data_tech: {
    daily: (l) => [`Data work as a ${l}`, 'Data extraction and analysis', 'Reporting and stakeholder insight'],
    technical: () => ['SQL proficiency', 'Data modelling', 'Python or BI tooling'],
    systems: () => ['SQL databases', 'Power BI / Tableau', 'Cloud data warehouses'],
  },
  trades_electrical: {
    daily: (l) => [`Electrical installation and maintenance as a ${l}`, 'Safe isolation and testing', 'Fault finding and repair'],
    technical: () => ['BS 7671 (18th Edition)', 'Safe isolation', 'Inspection and testing'],
    healthAndSafety: () => ['Electrical safety', 'PPE and risk assessment', 'Working at height awareness'],
    systems: () => ['Test equipment (multifunction testers)', 'Job management apps'],
  },
  trades_construction: {
    daily: (l) => [`On-site construction work as a ${l}`, 'Trade-specific installation', 'Quality checks and snagging'],
    technical: () => ['Trade NVQ competency', 'Blueprint / method statement reading'],
    healthAndSafety: () => ['CSCS site safety', 'PPE compliance', 'Manual handling'],
    leadership: () => ['Gang leadership', 'Toolbox talk delivery'],
  },
  warehouse_logistics: {
    daily: (l) => [`Warehouse operations as a ${l}`, 'Pick, pack, and dispatch', 'Stock accuracy and housekeeping'],
    technical: () => ['FLT operation (if applicable)', 'Load handling', 'PPE compliance'],
    systems: () => ['WMS warehouse systems', 'Handheld scanners', 'Inventory control software'],
  },
  security_sia: {
    daily: (l) => [`Licensed security work as a ${l}`, 'Access control and patrols', 'Incident reporting and escalation'],
    technical: () => ['SIA licence compliance', 'Conflict management', 'Surveillance and monitoring'],
    customerFacing: () => ['Professional public-facing conduct', 'De-escalation'],
    healthAndSafety: () => ['Lone working procedures', 'Emergency response'],
    systems: () => ['CCTV systems', 'Control room software', 'Radio communications'],
  },
  care_support: {
    daily: (l) => [`Direct care as a ${l}`, 'Personal care and daily living support', 'Care plan documentation'],
    technical: () => ['Care Certificate standards', 'Medication awareness', 'Safeguarding'],
    customerFacing: () => ['Person-centred communication', 'Dignity and respect'],
    healthAndSafety: () => ['Manual handling', 'Infection control'],
  },
  hospitality_kitchen: {
    daily: (l) => [`Kitchen operations as a ${l}`, 'Food prep and cooking to spec', 'Kitchen hygiene and stock rotation'],
    technical: () => ['Food hygiene compliance', 'HACCP awareness', 'Allergen control (Natasha\'s Law)'],
    healthAndSafety: () => ['Kitchen safety', 'Knife safety', 'Burns and slips prevention'],
    systems: () => ['Kitchen management systems', 'Ordering and stock systems'],
  },
  hospitality_foh: {
    daily: (l) => [`Front-of-house service as a ${l}`, 'Guest service and order taking', 'Upselling and complaint handling'],
    technical: () => ['POS systems', 'Cash handling', 'Reservation systems'],
    customerFacing: () => ['Customer service excellence', 'Complaint resolution', 'Team coordination'],
    leadership: () => ['Shift supervision', 'Training new staff'],
  },
  finance_accounting: {
    daily: (l) => [`Finance and accounting as a ${l}`, 'Month-end processes', 'Reconciliation and reporting'],
    technical: () => ['UK GAAP / IFRS awareness', 'Management accounts', 'VAT and payroll basics'],
    systems: () => ['Sage', 'Xero', 'QuickBooks', 'Excel advanced'],
  },
  sales_business: {
    daily: (l) => [`Sales as a ${l}`, 'Pipeline management', 'Client meetings and proposals'],
    technical: () => ['CRM proficiency', 'Revenue forecasting', 'Negotiation'],
    customerFacing: () => ['Consultative selling', 'Relationship management'],
    systems: () => ['Salesforce', 'HubSpot', 'LinkedIn Sales Navigator'],
  },
  office_admin: {
    daily: (l) => [`Office administration as a ${l}`, 'Diary and inbox management', 'Document preparation'],
    technical: () => ['Microsoft Office / Google Workspace', 'Data entry accuracy'],
    customerFacing: () => ['Professional phone manner', 'Visitor reception'],
    systems: () => ['MS Office', 'SharePoint', 'Booking systems'],
  },
  ...NEW_ARCHETYPE_UK_EXPECTATIONS,
  general: {
    daily: (l) => [`Day-to-day duties as a ${l}`, 'Role-specific tasks at your experience level'],
    technical: (l) => [`Core ${l.toLowerCase()} competency for UK employers`],
  },
}

type FactQuestionDef = {
  id: string
  text: string | ((label: string) => string)
  options: Array<{ value: string; label: string }>
  allowMultiple?: boolean
  archetypes?: ProfessionArchetype[]
  specIds?: string[]
  factIds: string[]
  priority: number
  when?: (answers: Record<string, string>) => boolean
}

/** Advisor-style questions tied to UK facts — only asked when genuinely relevant */
const FACT_QUESTION_REGISTRY: FactQuestionDef[] = [
  // Passenger transport
  { id: 'phv_or_taxi', text: 'Are you targeting PHV (private hire) or Hackney taxi (black cab)?', options: [{ value: 'phv', label: 'PHV / Private Hire' }, { value: 'hackney', label: 'Hackney Carriage (black cab)' }, { value: 'both', label: 'Open to both' }], archetypes: ['passenger_transport'], factIds: ['phv'], priority: 2 },
  { id: 'employment_model', text: 'Self-employed or employed driver?', options: [{ value: 'self_employed', label: 'Self-employed' }, { value: 'employed', label: 'Employed by operator' }, { value: 'both', label: 'Either' }], archetypes: ['passenger_transport'], factIds: ['platform'], priority: 3 },
  { id: 'uk_driving_licence', text: 'Do you hold a valid UK driving licence?', options: YES_NO, archetypes: ['passenger_transport', 'hgv_commercial', 'delivery_driver'], factIds: ['uk_licence'], priority: 1 },
  { id: 'council_licence', text: 'Do you already have a local authority taxi/PHV licence?', options: YES_NO, archetypes: ['passenger_transport'], specIds: ['taxi_driver', 'private_hire_driver'], factIds: ['phv'], priority: 1 },
  { id: 'own_vehicle', text: 'Do you have your own vehicle (or access to one)?', options: YES_NO, archetypes: ['passenger_transport', 'delivery_driver'], factIds: ['uk_licence'], priority: 4 },
  // HGV
  { id: 'hgv_category', text: 'Which HGV categories do you hold or need?', options: [{ value: 'cat_c', label: 'Category C (rigid)' }, { value: 'cat_ce', label: 'Category C+E (artic)' }, { value: 'none', label: 'Not yet — need training' }], archetypes: ['hgv_commercial'], factIds: ['cat_c', 'cat_ce'], priority: 1, allowMultiple: true },
  { id: 'driver_cpc', text: 'Do you have a valid Driver CPC?', options: YES_NO, archetypes: ['hgv_commercial'], factIds: ['cpc'], priority: 1 },
  { id: 'adr_required', text: 'Do you need ADR (hazardous goods)?', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'not_sure', label: 'Not sure' }], archetypes: ['hgv_commercial'], factIds: ['adr'], priority: 5 },
  // Healthcare
  { id: 'nmc_registered', text: 'Do you have an active NMC PIN?', options: YES_NO, specIds: ['nurse'], factIds: ['nmc'], priority: 1 },
  { id: 'gdc_registered', text: 'Are you registered with the GDC (General Dental Council)?', options: YES_NO, archetypes: ['dental'], factIds: ['gdc'], priority: 1 },
  { id: 'nhs_experience', text: 'Do you have NHS experience in this role?', options: YES_NO, archetypes: ['dental', 'nursing', 'regulated_health'], factIds: ['nmc', 'performer', 'regulator'], priority: 3, when: (a) => shouldAskExperienceQuestion('nhs_experience', a) },
  { id: 'private_practice', text: 'Have you worked in private dental practice?', options: YES_NO, archetypes: ['dental'], factIds: ['performer'], priority: 4 },
  { id: 'performer_number', text: 'Do you have an NHS Performer Number?', options: YES_NO, archetypes: ['dental'], factIds: ['performer'], priority: 2 },
  { id: 'overseas_nursing', text: 'Was your nursing qualification obtained outside the UK?', options: YES_NO, specIds: ['nurse'], factIds: ['cbt_osce'], priority: 4, when: (a) => shouldAskExperienceQuestion('overseas_nursing', a) },
  { id: 'overseas_dental_qual', text: 'Was your dental qualification obtained outside the UK?', options: YES_NO, archetypes: ['dental'], factIds: ['oet'], priority: 4, when: (a) => shouldAskExperienceQuestion('overseas_dental_qual', a) },
  { id: 'uk_regulator_registered', text: 'Are you registered with the relevant UK regulator (HCPC, GPhC, etc.)?', options: YES_NO, archetypes: ['regulated_health'], factIds: ['regulator'], priority: 1 },
  { id: 'overseas_qualification', text: 'Was your professional qualification obtained outside the UK?', options: YES_NO, archetypes: ['regulated_health'], factIds: ['enic'], priority: 4, when: (a) => shouldAskExperienceQuestion('overseas_qualification', a) },
  // Software / QA / Data — portfolio questions injected via resolvePortfolioEvidence()
  { id: 'commercial_experience', text: 'Have you shipped code in a commercial/production environment?', options: YES_NO, archetypes: ['software_engineering'], factIds: ['commercial'], priority: 2 },
  { id: 'cloud_platforms', text: 'Which cloud platforms have you worked with commercially?', options: [{ value: 'aws', label: 'AWS' }, { value: 'azure', label: 'Microsoft Azure' }, { value: 'gcp', label: 'Google Cloud' }, { value: 'other', label: 'Other' }], archetypes: ['software_engineering', 'data_tech'], factIds: ['cloud', 'cloud_data'], priority: 3, allowMultiple: true },
  { id: 'testing_type', text: 'Which types of testing do you have experience in?', options: [{ value: 'manual', label: 'Manual QA' }, { value: 'automation', label: 'Test automation' }, { value: 'performance', label: 'Performance testing' }, { value: 'api', label: 'API testing' }], archetypes: ['qa_testing'], factIds: ['automation'], priority: 2, allowMultiple: true },
  { id: 'istqb', text: 'Do you hold ISTQB or similar certification?', options: YES_NO, archetypes: ['qa_testing'], factIds: ['istqb'], priority: 3 },
  { id: 'tools_used', text: 'Which testing tools have you used?', options: [{ value: 'selenium', label: 'Selenium / Cypress' }, { value: 'postman', label: 'Postman / API testing' }, { value: 'jmeter', label: 'JMeter / performance' }, { value: 'playwright', label: 'Playwright' }, { value: 'other', label: 'Other' }], archetypes: ['qa_testing'], factIds: ['automation'], priority: 3, allowMultiple: true },
  { id: 'primary_languages', text: 'Which languages do you use professionally?', options: [{ value: 'javascript_ts', label: 'JavaScript / TypeScript' }, { value: 'python', label: 'Python' }, { value: 'java_csharp', label: 'Java / C#' }, { value: 'go_rust', label: 'Go / Rust' }, { value: 'other', label: 'Other' }], archetypes: ['software_engineering'], factIds: ['github'], priority: 2, allowMultiple: true },
  // Trades — consolidated multi-selects (individual yes/no cards removed)
  { id: 'overseas_electrical', text: 'Was your electrical training completed outside the UK?', options: YES_NO, archetypes: ['trades_electrical'], factIds: ['enic_elec'], priority: 5, when: (a) => shouldAskExperienceQuestion('overseas_electrical', a) },
  { id: 'trade_qualification', text: 'Do you hold a UK trade NVQ or equivalent?', options: YES_NO, archetypes: ['trades_construction'], factIds: ['nvq_trade'], priority: 2 },
  { id: 'site_experience', text: 'Have you worked on UK construction sites?', options: YES_NO, archetypes: ['trades_construction'], factIds: ['cscs'], priority: 3, when: (a) => shouldAskExperienceQuestion('site_experience', a) },
  { id: 'gas_safe', text: 'Do you need Gas Safe registration (for gas work)?', options: YES_NO, specIds: ['plumber'], factIds: ['gas_safe'], priority: 4 },
  // Warehouse
  { id: 'forklift_licence', text: 'Do you hold a forklift licence (FLT)?', options: YES_NO, archetypes: ['warehouse_logistics'], specIds: ['forklift_driver', 'forklift_operator', 'warehouse_operative'], factIds: ['flt', 'flt_cb', 'flt_reach'], priority: 1 },
  { id: 'forklift_type', text: 'Which forklift types can you operate?', options: [{ value: 'counterbalance', label: 'Counterbalance' }, { value: 'reach', label: 'Reach truck' }, { value: 'both', label: 'Both' }, { value: 'none', label: 'None yet' }], archetypes: ['warehouse_logistics'], specIds: ['forklift_driver', 'forklift_operator'], factIds: ['reach', 'flt_cb'], priority: 2, allowMultiple: true },
  { id: 'picker_packer_exp', text: 'Experience as picker/packer?', options: YES_NO, archetypes: ['warehouse_logistics'], specIds: ['warehouse_operative', 'picker_packer'], factIds: ['wms'], priority: 3 },
  { id: 'wms_systems', text: 'Have you used WMS warehouse systems?', options: YES_NO, archetypes: ['warehouse_logistics'], factIds: ['wms'], priority: 4 },
  // Security — multi-select licences; spec-specific experience questions remain separate
  { id: 'sia_licences_held', text: 'Which SIA licences do you hold or need?', options: [{ value: 'door_supervisor', label: 'Door Supervisor' }, { value: 'security_guard', label: 'Security Guard' }, { value: 'cctv', label: 'CCTV (Public Space Surveillance)' }, { value: 'close_protection', label: 'Close Protection' }, { value: 'none', label: 'Not yet' }], archetypes: ['security_sia'], factIds: ['sia', 'sia_ds', 'sia_cctv', 'sia_sg'], priority: 1, allowMultiple: true },
  { id: 'conflict_management', text: 'Do you have conflict management training for licensed premises?', options: YES_NO, specIds: ['door_supervisor', 'event_security'], factIds: ['conflict_mgmt'], priority: 2 },
  { id: 'control_room_exp', text: 'Have you worked in a control room or used CCTV monitoring systems?', options: YES_NO, specIds: ['cctv_operator', 'control_room_operator'], factIds: ['control_room'], priority: 2 },
  { id: 'dbs_clear', text: 'Do you have an enhanced DBS check?', options: YES_NO, archetypes: ['security_sia', 'care_support', 'regulated_health'], factIds: ['dbs'], priority: 2 },
  // Care
  { id: 'care_certificate', text: 'Have you completed the Care Certificate?', options: YES_NO, archetypes: ['care_support'], factIds: ['care_cert'], priority: 1 },
  { id: 'direct_care', text: 'Experience providing hands-on personal care?', options: YES_NO, archetypes: ['care_support'], factIds: ['care_cert'], priority: 3 },
  // Hospitality — only when archetype matches
  { id: 'food_hygiene', text: 'Do you hold Food Hygiene Level 2 or above?', options: YES_NO, archetypes: ['hospitality_kitchen'], factIds: ['food_hygiene'], priority: 1 },
  { id: 'kitchen_level', text: 'Highest kitchen role held?', options: [{ value: 'porter_commis', label: 'Porter / Commis' }, { value: 'cdp', label: 'Chef de Partie' }, { value: 'sous_head', label: 'Sous / Head Chef' }], archetypes: ['hospitality_kitchen'], factIds: ['food_hygiene'], priority: 2 },
  { id: 'personal_licence', text: 'Do you hold a personal licence (alcohol sales)?', options: YES_NO, archetypes: ['hospitality_foh'], specIds: ['bartender', 'restaurant_supervisor'], factIds: ['personal_licence'], priority: 3 },
  { id: 'customer_service_years', text: 'Years of front-of-house customer service?', options: [{ value: 'under_2', label: 'Under 2 years' }, { value: '2_5', label: '2–5 years' }, { value: '5_plus', label: '5+ years' }], archetypes: ['hospitality_foh'], factIds: ['customer_service'], priority: 2 },
  // Finance / Sales / Admin
  {
    id: 'professional_certifications',
    text: 'Which professional memberships or certifications do you hold or are working towards?',
    options: PROFESSIONAL_CERTIFICATION_OPTIONS,
    archetypes: ['finance_accounting'],
    factIds: ['body'],
    priority: 1,
    allowMultiple: true,
  },
  {
    id: 'accounting_software',
    text: 'Which accounting software are you proficient with?',
    options: [
      { value: 'sage', label: 'Sage' },
      { value: 'xero', label: 'Xero' },
      { value: 'quickbooks', label: 'QuickBooks' },
      { value: 'sap', label: 'SAP' },
      { value: 'oracle', label: 'Oracle Financials' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['finance_accounting'],
    factIds: ['sage_xero'],
    priority: 2,
    allowMultiple: true,
  },
  { id: 'overseas_accounting', text: 'Was your accounting qualification obtained outside the UK?', options: YES_NO, archetypes: ['finance_accounting'], factIds: ['enic_fin'], priority: 4, when: (a) => shouldAskExperienceQuestion('overseas_accounting', a) },
  { id: 'b2b_b2c', text: 'Which sales environments have you worked in?', options: [{ value: 'b2b', label: 'B2B' }, { value: 'b2c', label: 'B2C / Retail' }, { value: 'public_sector', label: 'Public sector' }], archetypes: ['sales_business'], factIds: ['crm'], priority: 2, allowMultiple: true },
  {
    id: 'crm_systems',
    text: 'Which CRM systems have you used?',
    options: [
      { value: 'salesforce', label: 'Salesforce' },
      { value: 'hubspot', label: 'HubSpot' },
      { value: 'dynamics', label: 'Microsoft Dynamics' },
      { value: 'zoho', label: 'Zoho CRM' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['sales_business'],
    factIds: ['crm'],
    priority: 3,
    allowMultiple: true,
  },
  {
    id: 'office_software',
    text: 'Which office software are you proficient with?',
    options: [
      { value: 'ms_office', label: 'Microsoft Office' },
      { value: 'google_workspace', label: 'Google Workspace' },
      { value: 'sharepoint', label: 'SharePoint' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['office_admin'],
    factIds: ['ms_office'],
    priority: 1,
    allowMultiple: true,
  },
  {
    id: 'construction_cards',
    text: 'Which construction cards or site safety qualifications do you hold?',
    options: [
      { value: 'cscs', label: 'CSCS Card' },
      { value: 'sssts', label: 'SSSTS' },
      { value: 'smsts', label: 'SMSTS' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['trades_construction'],
    factIds: ['cscs'],
    priority: 1,
    allowMultiple: true,
  },
  {
    id: 'electrical_qualifications',
    text: 'Which electrical qualifications do you hold?',
    options: [
      { value: 'ecs', label: 'ECS Card' },
      { value: '18th_edition', label: '18th Edition' },
      { value: 'nvq3', label: 'NVQ Level 3 Electrical' },
      { value: 'niceic', label: 'NICEIC / NAPIT' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['trades_electrical'],
    factIds: ['ecs', '18th', 'nvq3', 'niceic'],
    priority: 1,
    allowMultiple: true,
  },
  {
    id: 'warehouse_equipment',
    text: 'Which warehouse equipment can you operate?',
    options: [
      { value: 'counterbalance', label: 'Counterbalance forklift' },
      { value: 'reach', label: 'Reach truck' },
      { value: 'pallet_truck', label: 'Powered pallet truck' },
      { value: 'cherry_picker', label: 'Order picker / cherry picker' },
      { value: 'none', label: 'None yet' },
    ],
    archetypes: ['warehouse_logistics'],
    factIds: ['flt', 'reach', 'flt_cb'],
    priority: 2,
    allowMultiple: true,
  },
  {
    id: 'tech_certifications',
    text: 'Which IT certifications do you hold?',
    options: [
      { value: 'aws', label: 'AWS' },
      { value: 'azure', label: 'Azure' },
      { value: 'comptia', label: 'CompTIA' },
      { value: 'cisco', label: 'CISCO' },
      { value: 'microsoft', label: 'Microsoft' },
      { value: 'istqb', label: 'ISTQB' },
      { value: 'other', label: 'Other' },
    ],
    archetypes: ['software_engineering', 'qa_testing', 'data_tech'],
    factIds: ['cloud', 'istqb'],
    priority: 4,
    allowMultiple: true,
  },
  // General fallback
  { id: 'role_seniority', text: 'What level are you targeting in the UK?', options: [{ value: 'same_level', label: 'Same level as my experience' }, { value: 'step_up', label: 'One step up' }, { value: 'entry', label: 'Entry / restart' }], archetypes: ['general'], factIds: ['cv_uk'], priority: 9 },
  ...NEW_FACT_QUESTION_DEFS,
]

function blueprintToFacts(blueprint: ReturnType<typeof lookupExperienceBlueprint>): UkFact[] {
  if (!blueprint?.requirements?.length) return []
  return blueprint.requirements.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    href: r.href,
    kind: r.tier === 'mandatory' ? ('licence' as const) : ('certification' as const),
    priority: r.tier === 'mandatory' ? ('mandatory' as const) : ('recommended' as const),
  }))
}

function dedupeFacts(facts: UkFact[]): UkFact[] {
  const seen = new Set<string>()
  return facts.filter((f) => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  })
}

function collectFactsForProfession(
  specId: string,
  archetype: ProfessionArchetype,
  label: string
): UkFact[] {
  const archetypeFacts = ARCHETYPE_FACTS[archetype] ?? ARCHETYPE_FACTS.general
  const specFacts = getSpecProfileFacts(specId)
  const blueprintFacts = blueprintToFacts(lookupExperienceBlueprint(specId, label))
  return dedupeFacts([...archetypeFacts, ...specFacts, ...blueprintFacts])
}

function categorizeFacts(facts: UkFact[]): Pick<
  ProfessionContext,
  'licences' | 'certifications' | 'healthAndSafety' | 'regulatory'
> {
  const licences = facts.filter((f) => f.kind === 'licence')
  const certifications = facts.filter((f) => f.kind === 'certification' || f.kind === 'course')
  const regulatory = facts.filter((f) => f.kind === 'registration' || f.kind === 'compliance')
  const healthAndSafety = facts.filter(
    (f) =>
      /safety|hygiene|haccp|ppe|manual handling|isolation/i.test(f.title + f.description) &&
      !regulatory.includes(f)
  )
  return { licences, certifications, healthAndSafety, regulatory }
}

export function analyzeProfessionContext(
  specId: string,
  industryId: ExperienceIndustryId,
  answers: Record<string, string>
): ProfessionContext {
  const label = resolveExperienceSpecialisationLabel(
    industryId,
    specId,
    answers.experience_specialisation_other
  )
  const archetype = getProfessionArchetype(specId, industryId)
  const expectations = ARCHETYPE_UK_EXPECTATIONS[archetype] ?? ARCHETYPE_UK_EXPECTATIONS.general
  const facts = collectFactsForProfession(specId, archetype, label)
  const blueprint = lookupExperienceBlueprint(specId, label)
  const categorized = categorizeFacts(facts)

  return {
    specId,
    label,
    industryId,
    archetype,
    dailyResponsibilities: expectations.daily(label),
    technicalSkills: [
      ...(expectations.technical?.(label) ?? []),
      ...(blueprint?.skillsExpected ?? []),
      ...(SPEC_SKILLS[specId] ?? []),
    ].filter((s, i, arr) => arr.indexOf(s) === i),
    customerFacingSkills: expectations.customerFacing?.(label) ?? [],
    leadershipResponsibilities: expectations.leadership?.(label) ?? [],
    systemsAndTools: expectations.systems?.(label) ?? [],
    employerPreferences: employerExpectations(archetype, label),
    careerProgression: resolveBaseCareerLadder(specId, label, industryId),
    facts,
    ...categorized,
    healthAndSafety: [
      ...categorized.healthAndSafety,
      ...(expectations.healthAndSafety?.(label) ?? []).map((title) => ({
        id: `hs_${title.toLowerCase().replace(/\s+/g, '_').slice(0, 24)}`,
        title,
        description: title,
        kind: 'compliance' as const,
        priority: 'recommended' as const,
      })),
    ],
  }
}

function questionMatchesContext(
  def: FactQuestionDef,
  archetypes: Set<ProfessionArchetype>,
  specIds: Set<string>,
  factIds: Set<string>
): boolean {
  if (def.specIds?.some((s) => specIds.has(s))) return true
  if (def.archetypes?.some((a) => archetypes.has(a))) return true
  if (def.factIds.some((id) => factIds.has(id))) return true
  return false
}

function resolveQuestionText(def: FactQuestionDef, label: string): string {
  return typeof def.text === 'function' ? def.text(label) : def.text
}

function defaultQuestionForFact(fact: UkFact, label: string): FactQuestionDef | null {
  if (!fact.satisfiedWhen) return null
  return {
    id: `${fact.id}_held`,
    text: `Do you already hold or meet the requirement for ${fact.title}?`,
    options: YES_NO,
    factIds: [fact.id],
    priority: fact.priority === 'mandatory' ? 2 : 5,
  }
}

export function generateDynamicInterviewQuestions(
  specIds: string[],
  industryId: ExperienceIndustryId,
  answers: Record<string, string>
): CareerEngineQuestion[] {
  if (specIds.length === 0) return []

  const contexts = specIds.map((id) => analyzeProfessionContext(id, industryId, answers))
  const archetypes = new Set(contexts.map((c) => c.archetype))
  const specSet = new Set(specIds)
  const factIds = new Set(contexts.flatMap((c) => c.facts.map((f) => f.id)))
  const primaryLabel = contexts.map((c) => c.label).join(' / ')

  const candidates: FactQuestionDef[] = []

  for (const def of FACT_QUESTION_REGISTRY) {
    if (!questionMatchesContext(def, archetypes, specSet, factIds)) continue
    candidates.push(def)
  }

  for (const ctx of contexts) {
    for (const fact of ctx.facts) {
      if (!fact.satisfiedWhen) continue
      if (fact.appliesWhen && !fact.appliesWhen(answers)) continue
      const hasRegistry = candidates.some((c) => c.factIds.includes(fact.id))
      if (hasRegistry) continue
      const fallback = defaultQuestionForFact(fact, ctx.label)
      if (fallback) candidates.push(fallback)
    }
  }

  if (candidates.length === 0 && archetypes.has('general')) {
    candidates.push(
      FACT_QUESTION_REGISTRY.find((d) => d.id === 'role_seniority')!
    )
  }

  const seen = new Set<string>()
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority)

  const out: CareerEngineQuestion[] = []
  for (const def of sorted) {
    if (seen.has(def.id)) continue
    if (!shouldAskExperienceQuestion(def.id, answers)) continue
    if (def.when && !def.when(answers)) continue
    seen.add(def.id)

    out.push({
      id: def.id,
      text: resolveQuestionText(def, primaryLabel),
      options: def.options,
      allowMultiple: def.allowMultiple ?? isMultiSelectQuestion(def.id),
      helperText:
        def.allowMultiple || isMultiSelectQuestion(def.id) ? MULTI_SELECT_HELPER : undefined,
    })
  }

  for (const certQ of buildCertificationStatusQuestions(answers)) {
    if (seen.has(certQ.id)) continue
    out.push(certQ)
  }

  const primaryCtx = contexts[0]
  if (primaryCtx) {
    const portfolio = resolvePortfolioEvidence(
      industryId,
      primaryCtx.archetype,
      primaryCtx.specId,
      primaryCtx.label
    )
    if (
      portfolio &&
      !seen.has(portfolio.questionId) &&
      shouldAskExperienceQuestion(portfolio.questionId, answers)
    ) {
      out.push({
        id: portfolio.questionId,
        text: portfolio.questionText,
        options: YES_NO,
        allowMultiple: false,
      })
    }
  }

  return out
}

export function mergeProfessionContexts(contexts: ProfessionContext[]): ProfessionContext | null {
  if (contexts.length === 0) return null
  if (contexts.length === 1) return contexts[0]

  const primary = contexts[0]
  const mergeUnique = (arrays: string[][]) => [...new Set(arrays.flat())]

  return {
    ...primary,
    label: contexts.map((c) => c.label).join(' / '),
    specId: contexts.map((c) => c.specId).join(','),
    dailyResponsibilities: mergeUnique(contexts.map((c) => c.dailyResponsibilities)),
    technicalSkills: mergeUnique(contexts.map((c) => c.technicalSkills)),
    customerFacingSkills: mergeUnique(contexts.map((c) => c.customerFacingSkills)),
    leadershipResponsibilities: mergeUnique(contexts.map((c) => c.leadershipResponsibilities)),
    systemsAndTools: mergeUnique(contexts.map((c) => c.systemsAndTools)),
    employerPreferences: mergeUnique(contexts.map((c) => c.employerPreferences)),
    careerProgression: primary.careerProgression,
    facts: dedupeFacts(contexts.flatMap((c) => c.facts)),
    licences: dedupeFacts(contexts.flatMap((c) => c.licences)),
    certifications: dedupeFacts(contexts.flatMap((c) => c.certifications)),
    healthAndSafety: dedupeFacts(contexts.flatMap((c) => c.healthAndSafety)),
    regulatory: dedupeFacts(contexts.flatMap((c) => c.regulatory)),
  }
}

export function contextToSkills(context: ProfessionContext): string[] {
  return [
    ...context.technicalSkills,
    ...context.customerFacingSkills,
    ...context.leadershipResponsibilities,
    ...context.systemsAndTools,
    ...context.employerPreferences,
  ].filter((s, i, arr) => arr.indexOf(s) === i)
}
