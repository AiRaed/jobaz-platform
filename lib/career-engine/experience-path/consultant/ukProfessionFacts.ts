/**
 * UK profession facts — regulatory knowledge the consultant reasons from.
 * Not full roadmaps: atomic facts composed dynamically per user.
 */

import type { CourseEntry } from '@/lib/career-engine/shared/planTypes'
import type { ProfessionArchetype } from './professionInterview'
import {
  NEW_ARCHETYPE_EMPLOYER_EXPECTATIONS,
  NEW_ARCHETYPE_FACTS,
} from '../industries/newExperienceSectors'

export type UkFact = {
  id: string
  title: string
  description: string
  href?: string
  kind: 'licence' | 'registration' | 'certification' | 'course' | 'compliance' | 'skill'
  priority: 'mandatory' | 'recommended' | 'optional'
  /** When this fact applies based on user answers */
  appliesWhen?: (answers: Record<string, string>) => boolean
  /** When user already has this (skip) */
  satisfiedWhen?: (answers: Record<string, string>) => boolean
  course?: CourseEntry
}

const yes = (k: string) => (a: Record<string, string>) => a[k] === 'yes'
const no = (k: string) => (a: Record<string, string>) => a[k] === 'no'

export const ARCHETYPE_FACTS: Record<ProfessionArchetype, UkFact[]> = {
  passenger_transport: [
    { id: 'phv', title: 'PHV / Taxi Licence', description: 'Local authority private hire or hackney licence — legally required to carry paying passengers.', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('council_licence') },
    { id: 'dbs', title: 'Enhanced DBS Check', description: 'Required for passenger transport licensing in most UK councils.', kind: 'compliance', priority: 'mandatory' },
    { id: 'medical', title: 'Driver Medical Certificate', description: 'DVLA medical required for taxi/PHV licensing.', kind: 'compliance', priority: 'mandatory' },
    { id: 'uk_licence', title: 'UK Driving Licence', description: 'Valid UK driving licence required.', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('uk_driving_licence') },
    { id: 'platform', title: 'Platform Onboarding', description: 'Uber, Bolt, or local operator compliance for app-based work.', kind: 'course', priority: 'recommended', appliesWhen: (a) => a.employment_model === 'self_employed' || a.employment_model === 'both' },
  ],
  hgv_commercial: [
    { id: 'cat_c', title: 'Category C HGV Licence', description: 'Legal requirement for rigid lorries over 7.5 tonnes.', kind: 'licence', priority: 'mandatory', satisfiedWhen: (a) => a.hgv_category === 'cat_c' || a.hgv_category === 'cat_ce' },
    { id: 'cpc', title: 'Driver CPC', description: 'Certificate of Professional Competence — mandatory for commercial HGV driving.', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('driver_cpc') },
    { id: 'cat_ce', title: 'Category C+E (Artic)', description: 'Unlocks artic lorry roles and higher pay.', kind: 'licence', priority: 'recommended', appliesWhen: (a) => a.hgv_category === 'cat_c' },
    { id: 'adr', title: 'ADR Certificate', description: 'Required for hazardous goods transport.', kind: 'certification', priority: 'optional', appliesWhen: (a) => a.adr_required === 'yes' },
  ],
  delivery_driver: [
    { id: 'uk_licence', title: 'UK Driving Licence', description: 'Category B minimum for delivery driving.', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('uk_driving_licence') },
    { id: 'dbs', title: 'DBS Check', description: 'Often required for in-home and care parcel delivery.', kind: 'compliance', priority: 'recommended' },
  ],
  dental: [
    { id: 'gdc', title: 'GDC Registration', description: 'General Dental Council registration — mandatory to practise dentistry in the UK.', href: 'https://www.gdc-uk.org/', kind: 'registration', priority: 'mandatory', satisfiedWhen: yes('gdc_registered') },
    { id: 'performer', title: 'NHS Performer Number', description: 'Required to treat NHS patients in England and Wales.', kind: 'registration', priority: 'mandatory', appliesWhen: (a) => yes('nhs_experience')(a) || a.private_practice === 'no', satisfiedWhen: yes('performer_number') },
    { id: 'oet', title: 'IELTS / OET', description: 'English evidence for GDC when trained overseas.', kind: 'certification', priority: 'mandatory', appliesWhen: yes('overseas_dental_qual') },
    { id: 'indemnity', title: 'Dental Indemnity', description: 'Professional indemnity insurance required to practise.', kind: 'compliance', priority: 'mandatory' },
  ],
  nursing: [
    { id: 'nmc', title: 'NMC Registration', description: 'Nursing and Midwifery Council PIN — mandatory.', href: 'https://www.nmc.org.uk/', kind: 'registration', priority: 'mandatory', satisfiedWhen: yes('nmc_registered') },
    { id: 'cbt_osce', title: 'CBT / OSCE', description: 'Test of competence for internationally educated nurses.', kind: 'certification', priority: 'mandatory', appliesWhen: yes('overseas_nursing') },
  ],
  regulated_health: [
    { id: 'regulator', title: 'UK Professional Regulator Registration', description: 'HCPC, GPhC, or relevant body — mandatory for protected titles.', kind: 'registration', priority: 'mandatory', satisfiedWhen: yes('uk_regulator_registered') },
    { id: 'dbs', title: 'Enhanced DBS Check', description: 'Required for healthcare and care roles.', kind: 'compliance', priority: 'mandatory' },
    { id: 'enic', title: 'UK Qualification Recognition', description: 'ENIC or regulator assessment for overseas qualifications.', kind: 'registration', priority: 'mandatory', appliesWhen: yes('overseas_qualification') },
  ],
  software_engineering: [
    { id: 'github', title: 'GitHub / Portfolio', description: 'UK tech employers hire on demonstrated code — not degree title alone.', href: 'https://github.com/', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('github_portfolio') },
    { id: 'commercial', title: 'Commercial Production Experience', description: 'Evidence of shipping code in real environments.', kind: 'skill', priority: 'recommended', satisfiedWhen: yes('commercial_experience') },
    { id: 'cloud', title: 'Cloud Certification (AWS/Azure)', description: 'Differentiates mid-level developers in UK market.', kind: 'certification', priority: 'recommended', appliesWhen: (a) => a.cloud_experience === 'no', course: { id: 'aws', title: 'AWS Cloud Practitioner', whyReasons: ['Recognised by UK tech employers.'], duration: '4–8 weeks', costLabel: 'Paid' } },
  ],
  qa_testing: [
    { id: 'portfolio', title: 'Test Automation Portfolio', description: 'GitHub repos with Selenium, Cypress, or API test suites.', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('github_portfolio') },
    { id: 'istqb', title: 'ISTQB Foundation', description: 'Most recognised UK QA certification.', kind: 'certification', priority: 'recommended', satisfiedWhen: yes('istqb'), course: { id: 'istqb', title: 'ISTQB Foundation', whyReasons: ['Expected on QA CVs in UK market.'], duration: '2–4 weeks', costLabel: 'Paid' } },
    { id: 'automation', title: 'Test Automation Skills', description: 'Selenium, Cypress, or Playwright — essential for higher-paid QA roles.', kind: 'skill', priority: 'mandatory', appliesWhen: (a) => a.testing_type === 'automation' || a.testing_type === 'both' },
  ],
  data_tech: [
    { id: 'portfolio', title: 'Data Portfolio', description: 'GitHub projects, dashboards, or SQL portfolios.', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('portfolio_projects') },
    { id: 'sql', title: 'SQL Proficiency', description: 'Core skill for UK data analyst and engineer roles.', kind: 'skill', priority: 'mandatory' },
    { id: 'cloud_data', title: 'Cloud Data Platform', description: 'AWS, Snowflake, or BigQuery experience valued by UK employers.', kind: 'certification', priority: 'recommended', satisfiedWhen: yes('cloud_experience') },
  ],
  trades_electrical: [
    { id: 'ecs', title: 'ECS Card', description: 'Electrotechnical Certification Scheme — site access standard.', href: 'https://www.ecscard.org.uk/', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('ecs_card') },
    { id: '18th', title: '18th Edition Wiring Regulations', description: 'Required for most UK electrician roles.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('edition_18') },
    { id: 'nvq3', title: 'NVQ Level 3 Electrical', description: 'Formal UK competency for approved electrician status.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('nvq_level3') },
    { id: 'niceic', title: 'NICEIC / NAPIT Registration', description: 'Enables self-certification of electrical installations.', kind: 'registration', priority: 'recommended', satisfiedWhen: yes('niceic_registered') },
    { id: 'enic_elec', title: 'Overseas Qualification Assessment', description: 'AM2 / ECS route for overseas-trained electricians.', kind: 'registration', priority: 'mandatory', appliesWhen: yes('overseas_electrical') },
  ],
  trades_construction: [
    { id: 'cscs', title: 'CSCS Card', description: 'Required for UK construction site access.', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('cscs_card') },
    { id: 'nvq_trade', title: 'NVQ Trade Qualification', description: 'Level 2/3 NVQ expected for skilled trade roles.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('trade_qualification') },
    { id: 'gas_safe', title: 'Gas Safe Register', description: 'Mandatory for gas installation work.', href: 'https://www.gassaferegister.co.uk/', kind: 'licence', priority: 'mandatory', appliesWhen: yes('gas_safe') },
  ],
  warehouse_logistics: [
    { id: 'flt', title: 'Forklift Licence (FLT)', description: 'RTITB/ITSSAR accreditation — unlocks higher-paying warehouse roles.', kind: 'licence', priority: 'recommended', satisfiedWhen: yes('forklift_licence') },
    { id: 'reach', title: 'Reach Truck Licence', description: 'Required for reach truck operations in UK warehouses.', kind: 'licence', priority: 'recommended', appliesWhen: (a) => a.forklift_type === 'reach' || a.forklift_type === 'both' },
    { id: 'wms', title: 'WMS Systems Experience', description: 'Warehouse management systems knowledge valued by UK distributors.', kind: 'skill', priority: 'recommended', satisfiedWhen: yes('wms_systems') },
  ],
  security_sia: [
    { id: 'sia', title: 'SIA Licence', description: 'Security Industry Authority licence — mandatory for regulated security work.', href: 'https://www.sia.homeoffice.gov.uk/', kind: 'licence', priority: 'mandatory', satisfiedWhen: yes('sia_licence') },
    { id: 'dbs', title: 'Enhanced DBS Check', description: 'Required for all licensed security roles.', kind: 'compliance', priority: 'mandatory', satisfiedWhen: yes('dbs_clear') },
  ],
  care_support: [
    { id: 'dbs', title: 'Enhanced DBS Check', description: 'Mandatory for all care and support roles.', kind: 'compliance', priority: 'mandatory', satisfiedWhen: yes('dbs_clear') },
    { id: 'care_cert', title: 'Care Certificate', description: '15 standards expected by CQC-registered providers.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('care_certificate'), course: { id: 'care_cert', title: 'Care Certificate', whyReasons: ['Expected by UK care employers.', 'Often employer-funded.'], duration: '12 weeks', costLabel: 'Free–Paid' } },
  ],
  hospitality_kitchen: [
    { id: 'food_hygiene', title: 'Food Hygiene Level 2+', description: 'Mandatory for UK food-handling roles.', kind: 'certification', priority: 'mandatory', satisfiedWhen: yes('food_hygiene') },
    { id: 'allergen', title: 'Food Allergen Awareness', description: 'Expected by UK hospitality employers (Natasha\'s Law).', kind: 'certification', priority: 'recommended' },
  ],
  hospitality_foh: [
    { id: 'personal_licence', title: 'Personal Licence', description: 'Required to authorise alcohol sales in licensed premises.', kind: 'licence', priority: 'recommended', appliesWhen: no('personal_licence') },
    { id: 'customer_service', title: 'Customer Service Evidence', description: 'UK FOH roles require demonstrable customer service on CV.', kind: 'skill', priority: 'mandatory' },
  ],
  finance_accounting: [
    { id: 'body', title: 'Professional Accounting Body', description: 'ACCA, CIMA, ICAEW, or AAT — UK employers expect recognised qualifications.', kind: 'registration', priority: 'mandatory', satisfiedWhen: (a) => {
      const certs = (a.professional_certifications ?? '').split(',').filter(Boolean)
      if (certs.length > 0 && !certs.every((c) => c === 'other')) return true
      return a.accounting_body !== 'none' && Boolean(a.accounting_body)
    } },
    { id: 'sage_xero', title: 'Sage / Xero Proficiency', description: 'UK SMEs overwhelmingly use Sage or Xero.', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('sage_xero') },
    { id: 'enic_fin', title: 'UK Qualification Recognition', description: 'ENIC for overseas accounting degree exemptions.', kind: 'registration', priority: 'mandatory', appliesWhen: yes('overseas_accounting') },
  ],
  sales_business: [
    { id: 'crm', title: 'CRM Experience', description: 'Salesforce or HubSpot experience expected for B2B sales roles.', kind: 'skill', priority: 'recommended', satisfiedWhen: yes('crm_experience') },
    { id: 'metrics', title: 'Revenue Metrics on CV', description: 'Quota attainment, pipeline value, and conversion rates.', kind: 'skill', priority: 'mandatory' },
  ],
  office_admin: [
    { id: 'ms_office', title: 'Microsoft Office / Google Workspace', description: 'Core competency for UK admin roles.', kind: 'skill', priority: 'mandatory', satisfiedWhen: yes('ms_office') },
    { id: 'typing_speed', title: 'Professional Communication', description: 'Email, diary management, and document formatting.', kind: 'skill', priority: 'recommended' },
  ],
  manufacturing_engineering: NEW_ARCHETYPE_FACTS.manufacturing_engineering,
  customer_service: NEW_ARCHETYPE_FACTS.customer_service,
  marketing_digital: NEW_ARCHETYPE_FACTS.marketing_digital,
  education_teaching: NEW_ARCHETYPE_FACTS.education_teaching,
  hr_recruitment: NEW_ARCHETYPE_FACTS.hr_recruitment,
  cleaning_facilities: NEW_ARCHETYPE_FACTS.cleaning_facilities,
  general: [
    { id: 'cv_uk', title: 'UK-Format CV', description: 'Translate experience into UK job titles and keywords.', kind: 'skill', priority: 'mandatory' },
  ],
}

/** Job search keywords by specialisation — minimal, not full job definitions */
export function jobKeywordsForSpecialisation(specId: string, label: string): string[] {
  const kw = label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return [kw, `${kw} UK`, `senior ${kw}`]
}

export function employerExpectations(archetype: ProfessionArchetype, label: string): string[] {
  const base = [`UK-format CV tailored to ${label} roles`, 'Evidence of relevant UK compliance where required']
  const extra: Partial<Record<ProfessionArchetype, string[]>> = {
    software_engineering: ['GitHub or live project portfolio', 'Commercial production experience', 'Technical interview readiness'],
    qa_testing: ['Test case documentation', 'Automation framework examples', 'ISTQB or equivalent'],
    dental: ['GDC registration status on CV', 'NHS performer number if applicable', 'Clinical indemnity'],
    passenger_transport: ['Clean driving licence', 'Local council licensing compliance', 'DBS clearance'],
    hgv_commercial: ['Valid Driver CPC', 'Tachograph compliance', 'CPC periodic training up to date'],
    trades_electrical: ['ECS card', '18th Edition', 'Safe isolation competency'],
    security_sia: ['Valid SIA badge', 'Conflict management training'],
    care_support: ['Care Certificate or equivalent', 'Enhanced DBS', 'Safeguarding awareness'],
    ...NEW_ARCHETYPE_EMPLOYER_EXPECTATIONS,
  }
  return [...base, ...(extra[archetype] ?? [])]
}
