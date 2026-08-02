/**
 * Experience-driven industry profiles — Work in my Experience (Path 2).
 * JobAZ rules: transfer overseas experience into equivalent UK careers.
 */

import type {
  CourseEntry,
  CvImprovement,
  EssentialAction,
  JobEntry,
} from '@/lib/career-engine/shared/planTypes'
import type { ExperienceIndustryId, ExperienceTier } from './types'
import { NEW_EXPERIENCE_INDUSTRY_LABELS, NEW_INDUSTRY_CAREER_HUB } from './industries/newExperienceSectors'

const CV = '/cv-builder-v2'

function sectorProfile(
  id: keyof typeof NEW_EXPERIENCE_INDUSTRY_LABELS,
  opts: {
    skilledJob: { title: string; keyword: string; salary: string }
    seniorJob: { title: string; keyword: string; salary: string }
    essentialActions: EssentialAction[]
    skillsCv: string
    recognitionSummary: string
    regulated?: boolean
  }
): IndustryProfile {
  const label = NEW_EXPERIENCE_INDUSTRY_LABELS[id]
  const hub = NEW_INDUSTRY_CAREER_HUB[id]
  const job = (title: string, keyword: string, seniority: JobEntry['seniority'], salary: string): JobEntry => ({
    title,
    searchKeyword: keyword,
    seniority,
    salaryRange: salary,
  })
  return {
    id,
    label,
    careerHubPathId: hub,
    goals: {
      skilled: opts.skilledJob.title,
      senior: opts.seniorJob.title,
      supervisor: `Senior ${opts.skilledJob.title}`,
      manager: opts.seniorJob.title.replace(/^Senior /, ''),
    },
    timelines: {
      skilled: [opts.skilledJob.title, `Senior ${opts.skilledJob.title}`, 'Team Leader', 'Supervisor', 'Manager', 'Director'],
      senior: [opts.seniorJob.title, 'Team Leader', 'Supervisor', 'Manager', 'Senior Manager', 'Director'],
      supervisor: ['Team Leader', 'Supervisor', 'Manager', 'Senior Manager', 'Director', 'Head of Function'],
      manager: ['Manager', 'Senior Manager', 'Head of Function', 'Director', 'VP', 'Executive'],
    },
    jobs: {
      skilled: [job(opts.skilledJob.title, opts.skilledJob.keyword, 'mid', opts.skilledJob.salary)],
      senior: [job(opts.seniorJob.title, opts.seniorJob.keyword, 'senior', opts.seniorJob.salary)],
      supervisor: [job(`${opts.skilledJob.title} Team Leader`, `${opts.skilledJob.keyword} team leader`, 'senior', opts.seniorJob.salary)],
      manager: [job(`${label} Manager`, `${opts.skilledJob.keyword} manager`, 'senior', opts.seniorJob.salary)],
    },
    essentialActions: opts.essentialActions,
    outsideUkActions: [
      {
        id: 'experience_mapping',
        title: 'Experience Mapping',
        description: `Translate your overseas ${label.toLowerCase()} experience into UK job titles and employer-recognised skills.`,
        href: CV,
        priority: 'critical',
      },
    ],
    courses: [],
    cvImprovements: [
      { id: 'exp', title: 'UK Experience Section', description: opts.skillsCv, href: CV, priority: 1 },
      { id: 'metrics', title: 'Measurable Achievements', description: 'Quantify outcomes UK employers expect: KPIs, team size, budgets, or caseload.', href: CV, priority: 2 },
    ],
    missions: [
      { id: 'cv', label: `Update ${label} CV`, href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 matching UK jobs', href: `/job-finder?query=${encodeURIComponent(opts.skilledJob.keyword)}`, target: 5 },
      { id: 'certs', label: 'Complete priority certification', href: `/career-hub?route=${hub}`, target: 1 },
      { id: 'interview', label: 'Interview practice', href: '/interview-coach', target: 1 },
    ],
    recognitionSummary: opts.recognitionSummary,
  }
}

export type IndustryProfile = {
  id: ExperienceIndustryId
  label: string
  careerHubPathId: string
  goals: Record<ExperienceTier, string>
  timelines: Record<ExperienceTier, string[]>
  jobs: Record<ExperienceTier, JobEntry[]>
  essentialActions: EssentialAction[]
  outsideUkActions: EssentialAction[]
  courses: CourseEntry[]
  cvImprovements: CvImprovement[]
  missions: Array<{ id: string; label: string; href: string; target?: number }>
  recognitionSummary: string
}

function p(partial: IndustryProfile): IndustryProfile {
  return partial
}

export const INDUSTRY_PROFILES: Record<ExperienceIndustryId, IndustryProfile> = {
  electrician: p({
    id: 'electrician',
    label: 'Electrical / Trades',
    careerHubPathId: 'construction-trades',
    goals: {
      skilled: 'Approved Electrician',
      senior: 'Approved Electrician',
      supervisor: 'Electrical Supervisor',
      manager: 'Electrical Contracts Manager',
    },
    timelines: {
      skilled: ['Electrician', 'Approved Electrician', 'Senior Electrician', 'Electrical Supervisor', 'Contracts Manager'],
      senior: ['Electrician', 'Senior Electrician', 'Approved Electrician', 'Electrical Supervisor', 'Contracts Manager'],
      supervisor: ['Electrician', 'Senior Electrician', 'Electrical Supervisor', 'Contracts Manager', 'Operations Manager'],
      manager: ['Senior Electrician', 'Electrical Supervisor', 'Contracts Manager', 'Operations Manager', 'Director of Maintenance'],
    },
    jobs: {
      skilled: [
        { title: 'Electrician', seniority: 'mid', searchKeyword: 'electrician', salaryRange: '£32k–£42k' },
        { title: 'Maintenance Electrician', seniority: 'mid', searchKeyword: 'maintenance electrician', salaryRange: '£30k–£40k' },
        { title: 'Electrical Improver', seniority: 'junior', searchKeyword: 'electrical improver', salaryRange: '£26k–£34k' },
        { title: 'Site Electrician', seniority: 'mid', searchKeyword: 'site electrician', salaryRange: '£32k–£44k' },
      ],
      senior: [
        { title: 'Electrician', seniority: 'mid', searchKeyword: 'electrician', salaryRange: '£34k–£44k' },
        { title: 'Senior Electrician', seniority: 'senior', searchKeyword: 'senior electrician', salaryRange: '£38k–£48k' },
        { title: 'Maintenance Electrician', seniority: 'mid', searchKeyword: 'maintenance electrician', salaryRange: '£32k–£42k' },
        { title: 'Approved Electrician', seniority: 'senior', searchKeyword: 'approved electrician', salaryRange: '£38k–£50k' },
      ],
      supervisor: [
        { title: 'Senior Electrician', seniority: 'senior', searchKeyword: 'senior electrician', salaryRange: '£38k–£48k' },
        { title: 'Electrical Supervisor', seniority: 'senior', searchKeyword: 'electrical supervisor', salaryRange: '£40k–£52k' },
        { title: 'Maintenance Team Leader', seniority: 'senior', searchKeyword: 'maintenance team leader electrical', salaryRange: '£38k–£48k' },
      ],
      manager: [
        { title: 'Electrical Supervisor', seniority: 'senior', searchKeyword: 'electrical supervisor', salaryRange: '£42k–£55k' },
        { title: 'Electrical Contracts Manager', seniority: 'senior', searchKeyword: 'electrical contracts manager', salaryRange: '£48k–£62k' },
        { title: 'Maintenance Manager', seniority: 'senior', searchKeyword: 'maintenance manager', salaryRange: '£45k–£58k' },
      ],
    },
    essentialActions: [
      { id: '18th', title: '18th Edition Wiring Regulations', description: 'Required for most UK electrician roles and ECS Gold Card applications.', priority: 'critical' },
      { id: 'ecs', title: 'ECS Card', description: 'Industry-standard ID and competency card for UK construction electrical work.', priority: 'critical' },
      { id: 'nvq', title: 'NVQ Level 3 Electrical Assessment', description: 'Formal UK competency route — often required for approved electrician status.', priority: 'critical' },
      { id: 'am2', title: 'AM2 Assessment', description: 'Practical assessment for experienced electricians proving UK installation competence.', priority: 'recommended' },
    ],
    outsideUkActions: [
      { id: 'experience_mapping', title: 'Experience Mapping', description: 'Document overseas electrical qualifications for UK employers and awarding bodies.', href: CV, priority: 'critical' },
    ],
    courses: [
      { id: '18th_course', title: '18th Edition', whyReasons: ['Mandatory for ECS Gold Card.', 'Expected by every UK electrical employer.'], duration: '3–5 days', costLabel: 'Paid', pathId: 'construction-trades' },
      { id: 'ecs_course', title: 'ECS Card Application', whyReasons: ['Required to work on UK construction sites.', 'Proves electrical competency.'], duration: '1–2 days', costLabel: 'Paid', pathId: 'construction-trades' },
      { id: 'am2_course', title: 'AM2 Assessment Prep', whyReasons: ['Validates practical UK wiring skills for experienced electricians.'], duration: '2–3 days', costLabel: 'Paid' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Experience Section', description: 'List installations completed, voltage systems, commercial vs domestic, and years as lead electrician.', href: CV, priority: 1 },
      { id: 'certs', title: 'Certifications & Cards', description: '18th Edition, ECS, NVQ Level 3, AM2 — UK employers scan for these first.', href: CV, priority: 2 },
      { id: 'safety', title: 'Health & Safety', description: 'Include IOSH, CSCS, risk assessments, and safe isolation procedures.', href: CV, priority: 3 },
      { id: 'projects', title: 'Projects & Sites', description: 'Name project types: rewires, commercial fit-outs, industrial maintenance contracts.', href: CV, priority: 4 },
    ],
    missions: [
      { id: 'cv', label: 'Update experience section on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 matching electrician jobs', href: '/job-finder?query=electrician', target: 5 },
      { id: 'ecs', label: 'Check ECS card requirements', href: 'https://www.ecscard.org.uk/', target: 1 },
      { id: 'cert', label: 'Book 18th Edition training', href: '/career-hub?route=construction-trades', target: 1 },
    ],
    recognitionSummary: 'Overseas electricians typically need 18th Edition, ECS, and NVQ/AM2 assessment to work as approved electricians in the UK.',
  }),

  accountant: p({
    id: 'accountant',
    label: 'Accounting & Finance',
    careerHubPathId: 'office-admin',
    goals: {
      skilled: 'Qualified Accountant',
      senior: 'Senior Accountant',
      supervisor: 'Finance Manager',
      manager: 'Senior Finance Manager',
    },
    timelines: {
      skilled: ['Accounts Assistant', 'Assistant Accountant', 'Management Accountant', 'Finance Manager', 'Finance Director'],
      senior: ['Assistant Accountant', 'Management Accountant', 'Senior Accountant', 'Finance Manager', 'Finance Director'],
      supervisor: ['Management Accountant', 'Senior Accountant', 'Finance Manager', 'Head of Finance', 'Finance Director'],
      manager: ['Senior Accountant', 'Finance Manager', 'Head of Finance', 'Finance Director', 'CFO'],
    },
    jobs: {
      skilled: [
        { title: 'Accounts Assistant', seniority: 'junior', searchKeyword: 'accounts assistant', salaryRange: '£24k–£32k' },
        { title: 'Assistant Accountant', seniority: 'mid', searchKeyword: 'assistant accountant', salaryRange: '£28k–£36k' },
        { title: 'Finance Officer', seniority: 'mid', searchKeyword: 'finance officer', salaryRange: '£26k–£34k' },
      ],
      senior: [
        { title: 'Senior Accountant', seniority: 'senior', searchKeyword: 'senior accountant', salaryRange: '£38k–£50k' },
        { title: 'Management Accountant', seniority: 'mid', searchKeyword: 'management accountant', salaryRange: '£36k–£48k' },
        { title: 'Financial Analyst', seniority: 'mid', searchKeyword: 'financial analyst', salaryRange: '£35k–£48k' },
        { title: 'Payroll Manager', seniority: 'senior', searchKeyword: 'payroll manager', salaryRange: '£34k–£44k' },
      ],
      supervisor: [
        { title: 'Finance Manager', seniority: 'senior', searchKeyword: 'finance manager', salaryRange: '£42k–£58k' },
        { title: 'Management Accountant', seniority: 'mid', searchKeyword: 'senior management accountant', salaryRange: '£40k–£52k' },
        { title: 'Financial Controller', seniority: 'senior', searchKeyword: 'assistant financial controller', salaryRange: '£45k–£60k' },
      ],
      manager: [
        { title: 'Finance Manager', seniority: 'senior', searchKeyword: 'finance manager', salaryRange: '£48k–£65k' },
        { title: 'Head of Finance', seniority: 'senior', searchKeyword: 'head of finance', salaryRange: '£55k–£75k' },
        { title: 'Financial Controller', seniority: 'senior', searchKeyword: 'financial controller', salaryRange: '£50k–£70k' },
      ],
    },
    essentialActions: [
      { id: 'acca', title: 'ACCA Exemptions / Registration', description: 'Check qualification exemptions and register with ACCA for UK chartered status.', href: 'https://www.accaglobal.com/', priority: 'recommended' },
      { id: 'sage', title: 'Sage / Xero Proficiency', description: 'UK SMEs overwhelmingly use Sage or Xero — demonstrate hands-on experience.', priority: 'critical' },
      { id: 'ifrs', title: 'UK GAAP / IFRS Awareness', description: 'UK reporting standards differ from many countries — show IFRS/UK GAAP knowledge.', priority: 'recommended' },
    ],
    outsideUkActions: [
      { id: 'experience_mapping', title: 'Experience Mapping', description: 'Translate your overseas accounting role and qualifications into UK job titles and professional body routes.', href: CV, priority: 'critical' },
      { id: 'acca_exempt', title: 'ACCA Exemption Assessment', description: 'Apply for exemptions based on overseas qualifications before starting UK exams.', href: 'https://www.accaglobal.com/', priority: 'critical' },
    ],
    courses: [
      { id: 'sage', title: 'Sage Accounting', whyReasons: ['Used by most UK SMEs.', 'Often tested at interview.'], duration: '2–4 weeks', costLabel: 'Paid', pathId: 'office-admin' },
      { id: 'xero', title: 'Xero Certification', whyReasons: ['Growing UK cloud accounting standard.', 'Demonstrates modern UK finance skills.'], duration: '2–3 weeks', costLabel: 'Paid', pathId: 'office-admin' },
      { id: 'ifrs', title: 'IFRS / UK GAAP Update', whyReasons: ['Bridges overseas accounting standards to UK reporting.'], duration: '1–2 weeks', costLabel: 'Paid' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Experience & Achievements', description: 'Quantify: budgets managed, reconciliations, month-end close, audit support, team size.', href: CV, priority: 1 },
      { id: 'software', title: 'Accounting Software', description: 'List Sage, Xero, QuickBooks, SAP — with modules used (payroll, VAT, management accounts).', href: CV, priority: 2 },
      { id: 'certs', title: 'Professional Membership', description: 'ACCA, CIMA, ICAEW progress — UK employers expect chartered route visibility.', href: CV, priority: 3 },
      { id: 'budget', title: 'Budget & Reporting', description: 'Highlight P&L ownership, forecasting, and variance analysis with figures.', href: CV, priority: 4 },
    ],
    missions: [
      { id: 'cv', label: 'Update finance experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 matching finance roles', href: '/job-finder?query=accountant', target: 5 },
      { id: 'acca', label: 'Check ACCA exemption eligibility', href: 'https://www.accaglobal.com/', target: 1 },
      { id: 'sage', label: 'Complete Sage or Xero module', href: '/career-hub?route=office-admin', target: 1 },
    ],
    recognitionSummary: 'Overseas accountants should obtain UK ENIC evaluation and ACCA/CIMA exemption assessment before applying to senior UK roles.',
  }),

  chef: p({
    id: 'chef',
    label: 'Chef / Hospitality Kitchen',
    careerHubPathId: 'hospitality-front',
    goals: {
      skilled: 'Head Chef',
      senior: 'Head Chef',
      supervisor: 'Head Chef',
      manager: 'Executive Chef',
    },
    timelines: {
      skilled: ['Commis Chef', 'Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef'],
      senior: ['Chef de Partie', 'Sous Chef', 'Head Chef', 'Executive Chef', 'Director of Food'],
      supervisor: ['Sous Chef', 'Head Chef', 'Executive Chef', 'Director of Food', 'Group Chef'],
      manager: ['Head Chef', 'Executive Chef', 'Director of Food', 'Group Chef', 'F&B Director'],
    },
    jobs: {
      skilled: [
        { title: 'Chef de Partie', seniority: 'mid', searchKeyword: 'chef de partie', salaryRange: '£24k–£30k' },
        { title: 'Sous Chef', seniority: 'mid', searchKeyword: 'sous chef', salaryRange: '£28k–£36k' },
        { title: 'Head Chef', seniority: 'senior', searchKeyword: 'head chef', salaryRange: '£32k–£42k' },
      ],
      senior: [
        { title: 'Sous Chef', seniority: 'mid', searchKeyword: 'sous chef', salaryRange: '£28k–£36k' },
        { title: 'Head Chef', seniority: 'senior', searchKeyword: 'head chef', salaryRange: '£32k–£45k' },
        { title: 'Senior Sous Chef', seniority: 'senior', searchKeyword: 'senior sous chef', salaryRange: '£30k–£38k' },
        { title: 'Kitchen Manager', seniority: 'senior', searchKeyword: 'kitchen manager', salaryRange: '£30k–£40k' },
      ],
      supervisor: [
        { title: 'Head Chef', seniority: 'senior', searchKeyword: 'head chef', salaryRange: '£35k–£48k' },
        { title: 'Executive Chef', seniority: 'senior', searchKeyword: 'executive chef', salaryRange: '£40k–£55k' },
        { title: 'Kitchen Manager', seniority: 'senior', searchKeyword: 'kitchen manager', salaryRange: '£32k–£42k' },
      ],
      manager: [
        { title: 'Executive Chef', seniority: 'senior', searchKeyword: 'executive chef', salaryRange: '£45k–£60k' },
        { title: 'Head Chef', seniority: 'senior', searchKeyword: 'head chef fine dining', salaryRange: '£38k–£50k' },
        { title: 'F&B Manager', seniority: 'senior', searchKeyword: 'food and beverage manager', salaryRange: '£38k–£52k' },
      ],
    },
    essentialActions: [
      { id: 'food_hygiene', title: 'Food Hygiene Level 3', description: 'Required for supervisory kitchen roles in the UK.', priority: 'critical' },
      { id: 'haccp', title: 'HACCP Training', description: 'Expected for head chef and kitchen management positions.', priority: 'critical' },
      { id: 'allergen', title: 'Allergen Awareness', description: 'Mandatory UK requirement — Natasha\'s Law compliance.', priority: 'critical' },
    ],
    outsideUkActions: [
      { id: 'uk_certs', title: 'UK Food Safety Certificates', description: 'Overseas hygiene certificates are not always accepted — obtain UK-accredited Level 2/3.', priority: 'critical' },
    ],
    courses: [
      { id: 'hygiene', title: 'Food Hygiene Level 3', whyReasons: ['Required for supervisory kitchen roles.', 'Standard UK employer expectation.'], duration: '1–2 days', costLabel: 'Low cost', pathId: 'hospitality-front' },
      { id: 'haccp', title: 'HACCP for Catering', whyReasons: ['Expected for head chef applications.', 'Demonstrates UK compliance knowledge.'], duration: '1 day', costLabel: 'Low cost', pathId: 'hospitality-front' },
      { id: 'allergen', title: 'Allergen Awareness', whyReasons: ['Legal requirement in UK food businesses.'], duration: 'Half day', costLabel: 'Low cost' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Kitchen Experience', description: 'List cuisines, covers per service, brigade size, and sections managed (grill, pastry, etc.).', href: CV, priority: 1 },
      { id: 'achievements', title: 'Achievements & Standards', description: 'Michelin/rosette venues, menu development, food cost savings, hygiene rating improvements.', href: CV, priority: 2 },
      { id: 'safety', title: 'Food Safety & HACCP', description: 'Level 2/3 hygiene, HACCP, allergen training — non-negotiable for UK kitchens.', href: CV, priority: 3 },
      { id: 'leadership', title: 'Leadership', description: 'Team size managed, training junior chefs, roster and stock control.', href: CV, priority: 4 },
    ],
    missions: [
      { id: 'cv', label: 'Update kitchen experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 chef roles', href: '/job-finder?query=head%20chef', target: 5 },
      { id: 'hygiene', label: 'Book Food Hygiene Level 3', href: '/career-hub?route=hospitality-front', target: 1 },
      { id: 'haccp', label: 'Complete HACCP training', href: '/career-hub?route=hospitality-front', target: 1 },
    ],
    recognitionSummary: 'Overseas chefs should obtain UK-accredited food hygiene and HACCP certificates — overseas kitchen experience transfers well once compliance is met.',
  }),

  sales: p({
    id: 'sales',
    label: 'Sales & Business Development',
    careerHubPathId: 'office-admin',
    goals: {
      skilled: 'Sales Executive',
      senior: 'Senior Sales Manager',
      supervisor: 'Sales Team Leader',
      manager: 'Sales Director',
    },
    timelines: {
      skilled: ['Sales Executive', 'Account Executive', 'Senior Sales Executive', 'Sales Manager', 'Sales Director'],
      senior: ['Account Executive', 'Senior Sales Executive', 'Sales Manager', 'Head of Sales', 'Sales Director'],
      supervisor: ['Senior Sales Executive', 'Sales Team Leader', 'Sales Manager', 'Head of Sales', 'Commercial Director'],
      manager: ['Sales Manager', 'Head of Sales', 'Sales Director', 'Commercial Director', 'VP Sales'],
    },
    jobs: {
      skilled: [
        { title: 'Sales Executive', seniority: 'mid', searchKeyword: 'sales executive', salaryRange: '£24k–£35k + commission' },
        { title: 'Business Development Executive', seniority: 'mid', searchKeyword: 'business development executive', salaryRange: '£26k–£38k' },
        { title: 'Account Executive', seniority: 'mid', searchKeyword: 'account executive', salaryRange: '£28k–£40k' },
      ],
      senior: [
        { title: 'Senior Sales Executive', seniority: 'senior', searchKeyword: 'senior sales executive', salaryRange: '£32k–£45k' },
        { title: 'Key Account Manager', seniority: 'senior', searchKeyword: 'key account manager', salaryRange: '£35k–£50k' },
        { title: 'Business Development Manager', seniority: 'senior', searchKeyword: 'business development manager', salaryRange: '£38k–£52k' },
      ],
      supervisor: [
        { title: 'Sales Team Leader', seniority: 'senior', searchKeyword: 'sales team leader', salaryRange: '£35k–£48k' },
        { title: 'Sales Manager', seniority: 'senior', searchKeyword: 'sales manager', salaryRange: '£40k–£55k' },
        { title: 'Regional Sales Manager', seniority: 'senior', searchKeyword: 'regional sales manager', salaryRange: '£42k–£58k' },
      ],
      manager: [
        { title: 'Sales Manager', seniority: 'senior', searchKeyword: 'sales manager', salaryRange: '£45k–£65k' },
        { title: 'Head of Sales', seniority: 'senior', searchKeyword: 'head of sales', salaryRange: '£55k–£75k' },
        { title: 'Commercial Director', seniority: 'senior', searchKeyword: 'commercial director', salaryRange: '£60k–£85k' },
      ],
    },
    essentialActions: [
      { id: 'crm', title: 'CRM Proficiency (Salesforce / HubSpot)', description: 'UK B2B sales teams expect CRM experience — document your platform skills.', priority: 'critical' },
      { id: 'b2b', title: 'B2B Sales Evidence', description: 'Prepare case studies: pipeline built, deals closed, revenue targets exceeded.', priority: 'recommended' },
    ],
    outsideUkActions: [
      { id: 'uk_market', title: 'UK Market Knowledge', description: 'Research UK buyer behaviour, sectors, and compliance for your sales vertical.', priority: 'recommended' },
    ],
    courses: [
      { id: 'salesforce', title: 'Salesforce Administrator Basics', whyReasons: ['Most UK B2B teams use Salesforce or similar CRM.', 'Strengthens senior sales applications.'], duration: '4–6 weeks', costLabel: 'Paid' },
      { id: 'negotiation', title: 'B2B Negotiation Skills', whyReasons: ['Senior sales roles test negotiation at interview.', 'Transfers overseas deal experience to UK context.'], duration: '2–3 days', costLabel: 'Paid' },
    ],
    cvImprovements: [
      { id: 'results', title: 'Client Results & Revenue', description: 'Lead with quota attainment %, pipeline value, deals closed, and new accounts won.', href: CV, priority: 1 },
      { id: 'crm', title: 'CRM & Tools', description: 'Salesforce, HubSpot, Pipedrive — include pipeline management and forecasting.', href: CV, priority: 2 },
      { id: 'leadership', title: 'Leadership & Targets', description: 'Team size, coaching, territory planning, and budget responsibility.', href: CV, priority: 3 },
      { id: 'b2b', title: 'B2B Sector Keywords', description: 'SaaS, FMCG, manufacturing, professional services — match UK job descriptions.', href: CV, priority: 4 },
    ],
    missions: [
      { id: 'cv', label: 'Add revenue achievements to CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 sales roles', href: '/job-finder?query=sales%20manager', target: 5 },
      { id: 'crm', label: 'Update CRM skills on LinkedIn', href: CV, target: 1 },
      { id: 'save', label: 'Save 3 target accounts jobs', href: '/job-finder?query=business%20development%20manager', target: 3 },
    ],
    recognitionSummary: 'Sales experience transfers directly — focus on UK CRM tools, B2B evidence, and quantified results on your CV.',
  }),

  software_developer: p({
    id: 'software_developer',
    label: 'Software / IT Development',
    careerHubPathId: 'digital-ai-beginner',
    goals: {
      skilled: 'Software Engineer',
      senior: 'Senior Software Engineer',
      supervisor: 'Tech Lead',
      manager: 'Engineering Manager',
    },
    timelines: {
      skilled: ['Junior Developer', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager'],
      senior: ['Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Principal Engineer', 'Engineering Manager'],
      supervisor: ['Senior Software Engineer', 'Tech Lead', 'Principal Engineer', 'Engineering Manager', 'Director of Engineering'],
      manager: ['Tech Lead', 'Engineering Manager', 'Director of Engineering', 'VP Engineering', 'CTO'],
    },
    jobs: {
      skilled: [
        { title: 'Software Developer', seniority: 'mid', searchKeyword: 'software developer', salaryRange: '£35k–£50k' },
        { title: 'Software Engineer', seniority: 'mid', searchKeyword: 'software engineer', salaryRange: '£38k–£55k' },
        { title: 'Full Stack Developer', seniority: 'mid', searchKeyword: 'full stack developer', salaryRange: '£38k–£52k' },
      ],
      senior: [
        { title: 'Senior Software Engineer', seniority: 'senior', searchKeyword: 'senior software engineer', salaryRange: '£55k–£75k' },
        { title: 'Senior Developer', seniority: 'senior', searchKeyword: 'senior developer', salaryRange: '£50k–£70k' },
        { title: 'Backend Engineer', seniority: 'senior', searchKeyword: 'senior backend engineer', salaryRange: '£52k–£72k' },
        { title: 'Lead Developer', seniority: 'senior', searchKeyword: 'lead developer', salaryRange: '£55k–£78k' },
      ],
      supervisor: [
        { title: 'Tech Lead', seniority: 'senior', searchKeyword: 'tech lead', salaryRange: '£60k–£85k' },
        { title: 'Senior Software Engineer', seniority: 'senior', searchKeyword: 'senior software engineer', salaryRange: '£55k–£75k' },
        { title: 'Principal Engineer', seniority: 'senior', searchKeyword: 'principal engineer', salaryRange: '£65k–£90k' },
      ],
      manager: [
        { title: 'Engineering Manager', seniority: 'senior', searchKeyword: 'engineering manager', salaryRange: '£70k–£95k' },
        { title: 'Head of Engineering', seniority: 'senior', searchKeyword: 'head of engineering', salaryRange: '£80k–£110k' },
        { title: 'Tech Lead', seniority: 'senior', searchKeyword: 'tech lead', salaryRange: '£65k–£90k' },
      ],
    },
    essentialActions: [
      { id: 'github', title: 'GitHub Portfolio', description: 'Public repos with README files — UK tech hiring is evidence-based.', href: 'https://github.com/', priority: 'critical' },
      { id: 'portfolio', title: 'Technical Portfolio', description: 'Live deployed projects demonstrating your stack and problem-solving.', priority: 'critical' },
      { id: 'cloud', title: 'Cloud Certification', description: 'AWS or Azure fundamentals — expected for senior UK developer roles.', priority: 'recommended' },
    ],
    outsideUkActions: [
      { id: 'experience_mapping', title: 'Experience Mapping', description: 'Map overseas engineering titles and project experience to UK employer expectations.', href: CV, priority: 'recommended' },
    ],
    courses: [
      { id: 'aws', title: 'AWS Cloud Practitioner', whyReasons: ['Standard for UK cloud-ready engineering teams.', 'Differentiates senior applicants.'], duration: '4–6 weeks', costLabel: 'Paid', pathId: 'digital-ai-beginner' },
      { id: 'system_design', title: 'System Design Fundamentals', whyReasons: ['Required for senior and tech lead interviews.', 'Validates architecture experience.'], duration: '4–8 weeks', costLabel: 'Paid' },
    ],
    cvImprovements: [
      { id: 'portfolio', title: 'Technical Portfolio', description: 'Link GitHub, live demos, and architecture diagrams — UK hiring managers review these first.', href: CV, priority: 1 },
      { id: 'projects', title: 'Projects & Impact', description: 'Users served, performance improvements, systems scaled, and tech stack per project.', href: CV, priority: 2 },
      { id: 'skills', title: 'Technical Skills', description: 'Languages, frameworks, cloud, CI/CD, databases — match UK job spec keywords.', href: CV, priority: 3 },
      { id: 'leadership', title: 'Leadership & Mentoring', description: 'Code reviews, mentoring juniors, sprint leadership, and technical decisions.', href: CV, priority: 4 },
    ],
    missions: [
      { id: 'github', label: 'Publish 1 repo on GitHub', href: 'https://github.com/new', target: 1 },
      { id: 'cv', label: 'Update technical experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 developer roles', href: '/job-finder?query=senior%20software%20engineer', target: 5 },
      { id: 'cloud', label: 'Start cloud certification', href: '/career-hub?route=digital-ai-beginner', target: 1 },
    ],
    recognitionSummary: 'Developer experience transfers on portfolio and technical interview — UK employers hire on evidence, not credentials alone.',
  }),

  healthcare: p({
    id: 'healthcare',
    label: 'Healthcare & Care',
    careerHubPathId: 'care-support',
    goals: { skilled: 'Healthcare Professional', senior: 'Senior Healthcare Professional', supervisor: 'Care Team Leader', manager: 'Care Home Manager' },
    timelines: {
      skilled: ['Healthcare Assistant', 'Senior HCA', 'Clinical Support Worker', 'Team Leader', 'Care Manager'],
      senior: ['Senior Healthcare Assistant', 'Clinical Support Worker', 'Team Leader', 'Care Manager', 'Registered Manager'],
      supervisor: ['Team Leader', 'Senior Carer', 'Care Coordinator', 'Care Manager', 'Registered Manager'],
      manager: ['Care Manager', 'Registered Manager', 'Service Manager', 'Regional Manager', 'Director of Care'],
    },
    jobs: {
      skilled: [
        { title: 'Healthcare Assistant', seniority: 'mid', searchKeyword: 'healthcare assistant', salaryRange: '£22k–£26k' },
        { title: 'Support Worker', seniority: 'mid', searchKeyword: 'support worker', salaryRange: '£22k–£25k' },
        { title: 'Senior Healthcare Assistant', seniority: 'senior', searchKeyword: 'senior healthcare assistant', salaryRange: '£24k–£30k' },
      ],
      senior: [
        { title: 'Senior Healthcare Assistant', seniority: 'senior', searchKeyword: 'senior healthcare assistant', salaryRange: '£24k–£30k' },
        { title: 'Clinical Support Worker', seniority: 'mid', searchKeyword: 'clinical support worker', salaryRange: '£24k–£30k' },
        { title: 'Care Coordinator', seniority: 'senior', searchKeyword: 'care coordinator', salaryRange: '£26k–£32k' },
      ],
      supervisor: [
        { title: 'Team Leader', seniority: 'senior', searchKeyword: 'care team leader', salaryRange: '£26k–£34k' },
        { title: 'Senior Carer', seniority: 'senior', searchKeyword: 'senior carer', salaryRange: '£24k–£30k' },
        { title: 'Care Coordinator', seniority: 'senior', searchKeyword: 'care coordinator', salaryRange: '£28k–£34k' },
      ],
      manager: [
        { title: 'Care Manager', seniority: 'senior', searchKeyword: 'care manager', salaryRange: '£32k–£42k' },
        { title: 'Registered Manager', seniority: 'senior', searchKeyword: 'registered care manager', salaryRange: '£35k–£48k' },
        { title: 'Deputy Manager', seniority: 'senior', searchKeyword: 'deputy care home manager', salaryRange: '£30k–£38k' },
      ],
    },
    essentialActions: [
      { id: 'dbs', title: 'Enhanced DBS Check', description: 'Mandatory for all UK care and healthcare roles.', priority: 'critical' },
      { id: 'care_cert', title: 'Care Certificate', description: 'Standard UK care competency — often required by NHS and private providers.', priority: 'critical' },
    ],
    outsideUkActions: [
      { id: 'nmc_hcpc', title: 'NMC / HCPC Registration', description: 'Clinical roles require UK regulator registration — check your overseas qualification route.', priority: 'critical' },
    ],
    courses: [
      { id: 'care_cert', title: 'Care Certificate', whyReasons: ['Standard UK entry for care roles.', 'Required by most employers.'], duration: '4–8 weeks', costLabel: 'Funded', pathId: 'care-support' },
      { id: 'moving', title: 'Moving & Handling', whyReasons: ['Required for patient-facing care roles.'], duration: '1 day', costLabel: 'Low cost', pathId: 'care-support' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Care Experience', description: 'Patient groups, settings (hospital, care home, community), and daily care tasks.', href: CV, priority: 1 },
      { id: 'safeguarding', title: 'Safeguarding & DBS', description: 'DBS status, safeguarding training, and medication administration if applicable.', href: CV, priority: 2 },
      { id: 'leadership', title: 'Team Leadership', description: 'Shift leadership, handovers, and supervising care workers.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update care experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 healthcare roles', href: '/job-finder?query=healthcare%20assistant', target: 5 },
      { id: 'dbs', label: 'Apply for Enhanced DBS', href: 'https://www.gov.uk/disclosure-barring-service-check', target: 1 },
      { id: 'cert', label: 'Start Care Certificate', href: '/career-hub?route=care-support', target: 1 },
    ],
    recognitionSummary: 'Overseas healthcare experience transfers to HCA and support roles; clinical roles need NMC/HCPC registration.',
  }),

  warehouse_logistics: p({
    id: 'warehouse_logistics',
    label: 'Warehouse & Logistics',
    careerHubPathId: 'warehouse-logistics',
    goals: { skilled: 'Warehouse Supervisor', senior: 'Warehouse Manager', supervisor: 'Operations Supervisor', manager: 'Logistics Manager' },
    timelines: {
      skilled: ['Warehouse Operative', 'Team Leader', 'Warehouse Supervisor', 'Warehouse Manager', 'Operations Manager'],
      senior: ['Team Leader', 'Warehouse Supervisor', 'Warehouse Manager', 'Operations Manager', 'Logistics Director'],
      supervisor: ['Warehouse Supervisor', 'Shift Manager', 'Warehouse Manager', 'Operations Manager', 'Logistics Director'],
      manager: ['Warehouse Manager', 'Operations Manager', 'Logistics Manager', 'Supply Chain Director', 'Head of Logistics'],
    },
    jobs: {
      skilled: [
        { title: 'Warehouse Operative', seniority: 'mid', searchKeyword: 'warehouse operative', salaryRange: '£24k–£28k' },
        { title: 'Forklift Driver', seniority: 'mid', searchKeyword: 'forklift driver', salaryRange: '£25k–£30k' },
        { title: 'Warehouse Team Leader', seniority: 'senior', searchKeyword: 'warehouse team leader', salaryRange: '£26k–£32k' },
      ],
      senior: [
        { title: 'Warehouse Supervisor', seniority: 'senior', searchKeyword: 'warehouse supervisor', salaryRange: '£28k–£36k' },
        { title: 'Shift Manager', seniority: 'senior', searchKeyword: 'warehouse shift manager', salaryRange: '£30k–£38k' },
        { title: 'Forklift Driver', seniority: 'mid', searchKeyword: 'forklift driver', salaryRange: '£25k–£30k' },
      ],
      supervisor: [
        { title: 'Warehouse Supervisor', seniority: 'senior', searchKeyword: 'warehouse supervisor', salaryRange: '£30k–£38k' },
        { title: 'Warehouse Manager', seniority: 'senior', searchKeyword: 'warehouse manager', salaryRange: '£35k–£45k' },
      ],
      manager: [
        { title: 'Warehouse Manager', seniority: 'senior', searchKeyword: 'warehouse manager', salaryRange: '£38k–£50k' },
        { title: 'Operations Manager', seniority: 'senior', searchKeyword: 'logistics operations manager', salaryRange: '£40k–£55k' },
        { title: 'Logistics Manager', seniority: 'senior', searchKeyword: 'logistics manager', salaryRange: '£42k–£58k' },
      ],
    },
    essentialActions: [
      { id: 'flt', title: 'Forklift Licence (FLT)', description: 'Counterbalance or reach — essential for most UK warehouse supervisor roles.', priority: 'recommended' },
      { id: 'manual', title: 'Manual Handling Certificate', description: 'Standard UK warehouse health & safety requirement.', priority: 'recommended' },
    ],
    outsideUkActions: [],
    courses: [
      { id: 'flt', title: 'Forklift Training', whyReasons: ['Unlocks higher-paid warehouse roles.', 'Often required for supervisor positions.'], duration: '2–3 days', costLabel: 'Paid', pathId: 'warehouse-logistics' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Warehouse Experience', description: 'WMS systems, pick rates, team size, and shift volumes managed.', href: CV, priority: 1 },
      { id: 'licences', title: 'Licences & Certs', description: 'FLT, manual handling, IOSH — list expiry dates.', href: CV, priority: 2 },
      { id: 'leadership', title: 'Supervisory Experience', description: 'Shift handovers, KPIs, and health & safety leadership.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update warehouse experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 warehouse roles', href: '/job-finder?query=warehouse%20supervisor', target: 5 },
      { id: 'flt', label: 'Book forklift refresher if needed', href: '/career-hub?route=warehouse-logistics', target: 1 },
      { id: 'save', label: 'Save 3 logistics jobs', href: '/job-finder?query=warehouse%20manager', target: 3 },
    ],
    recognitionSummary: 'Warehouse experience transfers directly — UK FLT licence and WMS familiarity accelerate progression.',
  }),

  security: p({
    id: 'security',
    label: 'Security',
    careerHubPathId: 'security-facilities',
    goals: { skilled: 'Security Officer', senior: 'Senior Security Officer', supervisor: 'Security Supervisor', manager: 'Security Manager' },
    timelines: {
      skilled: ['Security Officer', 'Senior Officer', 'Security Supervisor', 'Security Manager', 'Regional Manager'],
      senior: ['Senior Security Officer', 'Security Supervisor', 'Security Manager', 'Regional Manager', 'Head of Security'],
      supervisor: ['Security Supervisor', 'Site Security Manager', 'Security Manager', 'Regional Manager', 'Head of Security'],
      manager: ['Security Manager', 'Regional Security Manager', 'Head of Security', 'Director of Security', 'CSO'],
    },
    jobs: {
      skilled: [
        { title: 'Security Officer', seniority: 'mid', searchKeyword: 'security officer', salaryRange: '£22k–£28k' },
        { title: 'Door Supervisor', seniority: 'mid', searchKeyword: 'door supervisor', salaryRange: '£22k–£28k' },
        { title: 'CCTV Operator', seniority: 'mid', searchKeyword: 'CCTV operator', salaryRange: '£22k–£26k' },
      ],
      senior: [
        { title: 'Senior Security Officer', seniority: 'senior', searchKeyword: 'senior security officer', salaryRange: '£24k–£30k' },
        { title: 'Security Supervisor', seniority: 'senior', searchKeyword: 'security supervisor', salaryRange: '£26k–£34k' },
        { title: 'Mobile Patrol Officer', seniority: 'mid', searchKeyword: 'mobile patrol security', salaryRange: '£24k–£30k' },
      ],
      supervisor: [
        { title: 'Security Supervisor', seniority: 'senior', searchKeyword: 'security supervisor', salaryRange: '£28k–£36k' },
        { title: 'Site Security Manager', seniority: 'senior', searchKeyword: 'site security manager', salaryRange: '£30k–£40k' },
      ],
      manager: [
        { title: 'Security Manager', seniority: 'senior', searchKeyword: 'security manager', salaryRange: '£35k–£48k' },
        { title: 'Regional Security Manager', seniority: 'senior', searchKeyword: 'regional security manager', salaryRange: '£40k–£55k' },
      ],
    },
    essentialActions: [
      { id: 'sia', title: 'SIA Licence', description: 'Mandatory for door supervision and most UK security roles.', priority: 'critical' },
    ],
    outsideUkActions: [
      { id: 'sia_new', title: 'Apply for UK SIA Licence', description: 'Overseas security licences are not valid — obtain UK SIA before applying.', priority: 'critical' },
    ],
    courses: [
      { id: 'sia', title: 'SIA Door Supervisor', whyReasons: ['Legal requirement for UK security work.', 'Unlocks most security vacancies.'], duration: '4 days', costLabel: 'Paid', pathId: 'security-facilities' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Security Experience', description: 'Venue types, incident management, patrol routes, and team size.', href: CV, priority: 1 },
      { id: 'sia', title: 'SIA & Licences', description: 'SIA badge number, door supervisor, CCTV, first aid.', href: CV, priority: 2 },
      { id: 'leadership', title: 'Supervisory Record', description: 'Shift reports, training new officers, and conflict de-escalation.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update security experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 security roles', href: '/job-finder?query=security%20officer', target: 5 },
      { id: 'sia', label: 'Check SIA licence status', href: 'https://www.sia.homeoffice.gov.uk/', target: 1 },
      { id: 'save', label: 'Save 3 security jobs', href: '/job-finder?query=security%20supervisor', target: 3 },
    ],
    recognitionSummary: 'Overseas security experience transfers after obtaining a UK SIA licence.',
  }),

  driving_transport: p({
    id: 'driving_transport',
    label: 'Driving & Transport',
    careerHubPathId: 'driving-transport',
    goals: { skilled: 'Professional Driver', senior: 'Senior Driver', supervisor: 'Transport Supervisor', manager: 'Transport Manager' },
    timelines: {
      skilled: ['Delivery Driver', 'HGV Driver', 'Senior Driver', 'Transport Supervisor', 'Transport Manager'],
      senior: ['HGV Driver', 'Class 1 Driver', 'Transport Supervisor', 'Transport Manager', 'Fleet Manager'],
      supervisor: ['Transport Supervisor', 'Fleet Supervisor', 'Transport Manager', 'Fleet Manager', 'Logistics Director'],
      manager: ['Transport Manager', 'Fleet Manager', 'Logistics Manager', 'Operations Director', 'Head of Transport'],
    },
    jobs: {
      skilled: [
        { title: 'Delivery Driver', seniority: 'mid', searchKeyword: 'delivery driver', salaryRange: '£24k–£30k' },
        { title: 'HGV Driver', seniority: 'mid', searchKeyword: 'HGV driver', salaryRange: '£30k–£38k' },
        { title: 'Van Driver', seniority: 'mid', searchKeyword: 'van driver', salaryRange: '£24k–£28k' },
      ],
      senior: [
        { title: 'HGV Class 1 Driver', seniority: 'senior', searchKeyword: 'class 1 HGV driver', salaryRange: '£32k–£42k' },
        { title: 'HGV Driver', seniority: 'mid', searchKeyword: 'HGV driver', salaryRange: '£30k–£38k' },
        { title: 'ADR Driver', seniority: 'senior', searchKeyword: 'ADR driver', salaryRange: '£34k–£44k' },
      ],
      supervisor: [
        { title: 'Transport Supervisor', seniority: 'senior', searchKeyword: 'transport supervisor', salaryRange: '£30k–£38k' },
        { title: 'Fleet Supervisor', seniority: 'senior', searchKeyword: 'fleet supervisor', salaryRange: '£32k–£40k' },
      ],
      manager: [
        { title: 'Transport Manager', seniority: 'senior', searchKeyword: 'transport manager', salaryRange: '£38k–£52k' },
        { title: 'Fleet Manager', seniority: 'senior', searchKeyword: 'fleet manager', salaryRange: '£40k–£55k' },
      ],
    },
    essentialActions: [
      { id: 'cpc', title: 'Driver CPC', description: 'Certificate of Professional Competence — required for professional HGV drivers in UK.', priority: 'critical' },
      { id: 'licence', title: 'UK Driving Licence', description: 'Valid UK licence with correct categories for your vehicle class.', priority: 'critical' },
    ],
    outsideUkActions: [
      { id: 'licence_exchange', title: 'UK Licence Exchange', description: 'Exchange overseas licence within 12 months of UK residency if applicable.', href: 'https://www.gov.uk/exchange-foreign-driving-licence', priority: 'critical' },
    ],
    courses: [
      { id: 'cpc', title: 'Driver CPC Training', whyReasons: ['Legal requirement for HGV professional drivers.', 'Maintains employability.'], duration: '35 hours / 5 years', costLabel: 'Paid', pathId: 'driving-transport' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Driving Experience', description: 'Vehicle classes, mileage, routes, and goods/types transported.', href: CV, priority: 1 },
      { id: 'licences', title: 'Licences & CPC', description: 'Category C, C+E, CPC hours, ADR if applicable.', href: CV, priority: 2 },
      { id: 'safety', title: 'Safety Record', description: 'Accident-free years, defect reporting, and compliance record.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update driving experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 driver roles', href: '/job-finder?query=HGV%20driver', target: 5 },
      { id: 'cpc', label: 'Check CPC hours status', href: 'https://www.gov.uk/driver-cpc-training', target: 1 },
      { id: 'save', label: 'Save 3 transport jobs', href: '/job-finder?query=transport%20manager', target: 3 },
    ],
    recognitionSummary: 'Driving experience transfers with UK licence exchange and CPC compliance.',
  }),

  construction: p({
    id: 'construction',
    label: 'Construction',
    careerHubPathId: 'construction-trades',
    goals: { skilled: 'Skilled Tradesperson', senior: 'Senior Tradesperson', supervisor: 'Site Supervisor', manager: 'Site Manager' },
    timelines: {
      skilled: ['Labourer', 'Skilled Tradesperson', 'Senior Tradesperson', 'Site Supervisor', 'Site Manager'],
      senior: ['Skilled Tradesperson', 'Senior Tradesperson', 'Site Supervisor', 'Site Manager', 'Project Manager'],
      supervisor: ['Site Supervisor', 'Foreman', 'Site Manager', 'Project Manager', 'Construction Director'],
      manager: ['Site Manager', 'Project Manager', 'Construction Manager', 'Director', 'Managing Director'],
    },
    jobs: {
      skilled: [
        { title: 'Skilled Labourer', seniority: 'mid', searchKeyword: 'skilled labourer construction', salaryRange: '£26k–£32k' },
        { title: 'Carpenter', seniority: 'mid', searchKeyword: 'carpenter', salaryRange: '£28k–£38k' },
        { title: 'Plumber', seniority: 'mid', searchKeyword: 'plumber', salaryRange: '£30k–£40k' },
      ],
      senior: [
        { title: 'Senior Tradesperson', seniority: 'senior', searchKeyword: 'senior carpenter', salaryRange: '£32k–£42k' },
        { title: 'Site Supervisor', seniority: 'senior', searchKeyword: 'construction site supervisor', salaryRange: '£32k–£42k' },
        { title: 'Bricklayer', seniority: 'mid', searchKeyword: 'bricklayer', salaryRange: '£28k–£38k' },
      ],
      supervisor: [
        { title: 'Site Supervisor', seniority: 'senior', searchKeyword: 'site supervisor', salaryRange: '£34k–£44k' },
        { title: 'Foreman', seniority: 'senior', searchKeyword: 'construction foreman', salaryRange: '£32k–£42k' },
      ],
      manager: [
        { title: 'Site Manager', seniority: 'senior', searchKeyword: 'site manager', salaryRange: '£45k–£60k' },
        { title: 'Project Manager', seniority: 'senior', searchKeyword: 'construction project manager', salaryRange: '£48k–£65k' },
      ],
    },
    essentialActions: [
      { id: 'cscs', title: 'CSCS Card', description: 'Required to work on UK construction sites.', priority: 'critical' },
      { id: 'nvq', title: 'NVQ Trade Qualification', description: 'Formal UK trade competency for skilled roles.', priority: 'recommended' },
    ],
    outsideUkActions: [
      { id: 'skills_assess', title: 'UK Skills Assessment', description: 'Map overseas trade qualifications to UK NVQ/CSCS routes.', priority: 'critical' },
    ],
    courses: [
      { id: 'cscs', title: 'CSCS Card', whyReasons: ['Mandatory for UK construction sites.'], duration: '1 day', costLabel: 'Paid', pathId: 'construction-trades' },
      { id: 'smsts', title: 'SMSTS', whyReasons: ['Required for site supervisor and manager roles.'], duration: '5 days', costLabel: 'Paid' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Trade Experience', description: 'Trades mastered, project types, and years on UK/overseas sites.', href: CV, priority: 1 },
      { id: 'certs', title: 'CSCS & NVQ', description: 'CSCS card colour, NVQ level, and specialist tickets.', href: CV, priority: 2 },
      { id: 'safety', title: 'Health & Safety', description: 'SMSTS, SSSTS, risk assessments, and toolbox talks led.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update construction experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 construction roles', href: '/job-finder?query=site%20supervisor', target: 5 },
      { id: 'cscs', label: 'Apply for CSCS card', href: '/career-hub?route=construction-trades', target: 1 },
      { id: 'save', label: 'Save 3 site jobs', href: '/job-finder?query=site%20manager', target: 3 },
    ],
    recognitionSummary: 'Overseas construction experience transfers with CSCS and NVQ mapping.',
  }),

  hospitality: p({
    id: 'hospitality',
    label: 'Hospitality (Front of House)',
    careerHubPathId: 'hospitality-front',
    goals: { skilled: 'Hospitality Supervisor', senior: 'Front of House Manager', supervisor: 'Restaurant Manager', manager: 'General Manager' },
    timelines: {
      skilled: ['Waiter / Server', 'Senior Server', 'Supervisor', 'Assistant Manager', 'General Manager'],
      senior: ['Senior Server', 'Supervisor', 'Assistant Manager', 'General Manager', 'Area Manager'],
      supervisor: ['Supervisor', 'Assistant Manager', 'Restaurant Manager', 'General Manager', 'Area Manager'],
      manager: ['Restaurant Manager', 'General Manager', 'Area Manager', 'Operations Director', 'Regional Director'],
    },
    jobs: {
      skilled: [
        { title: 'Waiter / Server', seniority: 'mid', searchKeyword: 'waiter', salaryRange: '£22k–£26k' },
        { title: 'Hotel Receptionist', seniority: 'mid', searchKeyword: 'hotel receptionist', salaryRange: '£22k–£28k' },
        { title: 'Front of House', seniority: 'mid', searchKeyword: 'front of house', salaryRange: '£22k–£28k' },
      ],
      senior: [
        { title: 'Senior Server', seniority: 'senior', searchKeyword: 'senior waiter', salaryRange: '£24k–£30k' },
        { title: 'Restaurant Supervisor', seniority: 'senior', searchKeyword: 'restaurant supervisor', salaryRange: '£26k–£34k' },
        { title: 'Duty Manager', seniority: 'senior', searchKeyword: 'duty manager hotel', salaryRange: '£28k–£36k' },
      ],
      supervisor: [
        { title: 'Restaurant Manager', seniority: 'senior', searchKeyword: 'restaurant manager', salaryRange: '£30k–£40k' },
        { title: 'Assistant Manager', seniority: 'senior', searchKeyword: 'assistant restaurant manager', salaryRange: '£28k–£36k' },
      ],
      manager: [
        { title: 'General Manager', seniority: 'senior', searchKeyword: 'general manager hotel', salaryRange: '£35k–£48k' },
        { title: 'Operations Manager', seniority: 'senior', searchKeyword: 'hospitality operations manager', salaryRange: '£38k–£52k' },
      ],
    },
    essentialActions: [
      { id: 'food_hygiene', title: 'Food Hygiene Level 2', description: 'Required for food-handling hospitality roles.', priority: 'critical' },
    ],
    outsideUkActions: [],
    courses: [
      { id: 'hygiene', title: 'Food Hygiene Level 2', whyReasons: ['UK legal requirement for food service.'], duration: '1 day', costLabel: 'Low cost', pathId: 'hospitality-front' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Hospitality Experience', description: 'Venue type, covers, team size, and customer service standards.', href: CV, priority: 1 },
      { id: 'leadership', title: 'Team Leadership', description: 'Rota management, training, and complaint resolution.', href: CV, priority: 2 },
    ],
    missions: [
      { id: 'cv', label: 'Update hospitality experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 hospitality roles', href: '/job-finder?query=restaurant%20manager', target: 5 },
      { id: 'hygiene', label: 'Complete Food Hygiene Level 2', href: '/career-hub?route=hospitality-front', target: 1 },
      { id: 'save', label: 'Save 3 FOH jobs', href: '/job-finder?query=front%20of%20house', target: 3 },
    ],
    recognitionSummary: 'Hospitality experience transfers directly — UK food hygiene cert is the main gap.',
  }),

  office_admin: p({
    id: 'office_admin',
    label: 'Office & Administration',
    careerHubPathId: 'office-admin',
    goals: { skilled: 'Office Administrator', senior: 'Senior Administrator', supervisor: 'Office Manager', manager: 'Operations Manager' },
    timelines: {
      skilled: ['Administrator', 'Senior Administrator', 'Office Manager', 'Operations Manager', 'Head of Operations'],
      senior: ['Senior Administrator', 'Office Coordinator', 'Office Manager', 'Operations Manager', 'Head of Operations'],
      supervisor: ['Office Manager', 'Team Leader', 'Operations Manager', 'Head of Operations', 'Director'],
      manager: ['Operations Manager', 'Head of Operations', 'Director of Operations', 'COO', 'Managing Director'],
    },
    jobs: {
      skilled: [
        { title: 'Office Administrator', seniority: 'mid', searchKeyword: 'office administrator', salaryRange: '£22k–£28k' },
        { title: 'Administrative Assistant', seniority: 'mid', searchKeyword: 'administrative assistant', salaryRange: '£22k–£28k' },
        { title: 'Office Coordinator', seniority: 'mid', searchKeyword: 'office coordinator', salaryRange: '£24k–£30k' },
      ],
      senior: [
        { title: 'Senior Administrator', seniority: 'senior', searchKeyword: 'senior administrator', salaryRange: '£26k–£34k' },
        { title: 'Office Manager', seniority: 'senior', searchKeyword: 'office manager', salaryRange: '£30k–£40k' },
        { title: 'Executive Assistant', seniority: 'senior', searchKeyword: 'executive assistant', salaryRange: '£32k–£42k' },
      ],
      supervisor: [
        { title: 'Office Manager', seniority: 'senior', searchKeyword: 'office manager', salaryRange: '£32k–£42k' },
        { title: 'Team Leader', seniority: 'senior', searchKeyword: 'admin team leader', salaryRange: '£28k–£36k' },
      ],
      manager: [
        { title: 'Operations Manager', seniority: 'senior', searchKeyword: 'operations manager', salaryRange: '£38k–£52k' },
        { title: 'Head of Operations', seniority: 'senior', searchKeyword: 'head of operations', salaryRange: '£45k–£60k' },
      ],
    },
    essentialActions: [
      { id: 'ms_office', title: 'Microsoft Office Proficiency', description: 'Excel, Outlook, and Teams — tested at most UK admin interviews.', priority: 'recommended' },
    ],
    outsideUkActions: [],
    courses: [
      { id: 'excel', title: 'Advanced Excel', whyReasons: ['Expected for senior admin and office manager roles.'], duration: '2–4 weeks', costLabel: 'Paid', pathId: 'office-admin' },
    ],
    cvImprovements: [
      { id: 'exp', title: 'Admin Experience', description: 'Systems used, team size, processes managed, and executive support level.', href: CV, priority: 1 },
      { id: 'software', title: 'Software Skills', description: 'MS Office, CRM, ERP, booking systems.', href: CV, priority: 2 },
      { id: 'leadership', title: 'Leadership', description: 'Budget managed, suppliers, and office relocation/project coordination.', href: CV, priority: 3 },
    ],
    missions: [
      { id: 'cv', label: 'Update admin experience on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 admin roles', href: '/job-finder?query=office%20manager', target: 5 },
      { id: 'excel', label: 'Refresh Excel skills', href: '/career-hub?route=office-admin', target: 1 },
      { id: 'save', label: 'Save 3 office jobs', href: '/job-finder?query=senior%20administrator', target: 3 },
    ],
    recognitionSummary: 'Admin experience transfers directly — emphasise UK software and process skills.',
  }),

  manufacturing_engineering: sectorProfile('manufacturing_engineering', {
    skilledJob: { title: 'Production Operative', keyword: 'production operative', salary: '£22k–£28k' },
    seniorJob: { title: 'Manufacturing Technician', keyword: 'manufacturing technician', salary: '£26k–£34k' },
    essentialActions: [
      { id: 'iosh', title: 'IOSH Working Safely', description: 'Health & safety standard expected on UK factory floors.', priority: 'critical' },
      { id: 'manual_handling', title: 'Manual Handling Certificate', description: 'Required for production and maintenance roles.', priority: 'critical' },
    ],
    skillsCv: 'List production output, OEE, downtime reduction, lean improvements, and machinery operated.',
    recognitionSummary: 'Manufacturing experience transfers well — UK employers prioritise safety tickets and measurable production KPIs.',
  }),

  customer_service: sectorProfile('customer_service', {
    skilledJob: { title: 'Customer Service Advisor', keyword: 'customer service advisor', salary: '£22k–£28k' },
    seniorJob: { title: 'Senior Customer Service Advisor', keyword: 'senior customer service advisor', salary: '£24k–£32k' },
    essentialActions: [
      { id: 'crm', title: 'CRM / Contact Centre Systems', description: 'Zendesk, Salesforce Service Cloud, or Avaya experience expected.', priority: 'critical' },
      { id: 'complaints', title: 'Complaints Handling', description: 'FCA-regulated sectors require formal complaints procedure knowledge.', priority: 'recommended' },
    ],
    skillsCv: 'Include CSAT, NPS, AHT, FCR metrics and CRM systems used.',
    recognitionSummary: 'Customer service skills transfer directly — evidence multi-channel support and CRM proficiency for UK employers.',
  }),

  marketing_digital: sectorProfile('marketing_digital', {
    skilledJob: { title: 'Digital Marketing Executive', keyword: 'digital marketing executive', salary: '£26k–£36k' },
    seniorJob: { title: 'Marketing Manager', keyword: 'marketing manager', salary: '£35k–£48k' },
    essentialActions: [
      { id: 'portfolio', title: 'Campaign Portfolio', description: 'UK marketing hires on demonstrated ROI — build case studies with metrics.', priority: 'critical' },
      { id: 'google', title: 'Google Ads & GA4', description: 'Paid search and analytics competency expected for digital roles.', priority: 'critical' },
    ],
    skillsCv: 'Show campaign ROI, channel mix, budget managed, and tools: Google Ads, GA4, HubSpot, SEO tools.',
    recognitionSummary: 'Marketing experience transfers when you show UK-relevant campaign metrics and platform certifications.',
  }),

  education_teaching: sectorProfile('education_teaching', {
    skilledJob: { title: 'Teaching Assistant', keyword: 'teaching assistant', salary: '£20k–£26k' },
    seniorJob: { title: 'Primary Teacher', keyword: 'primary teacher', salary: '£30k–£42k' },
    essentialActions: [
      { id: 'dbs', title: 'Enhanced DBS Check', description: 'Mandatory for all UK education roles working with children.', priority: 'critical' },
      { id: 'safeguarding', title: 'Safeguarding Training', description: 'Keeping Children Safe in Education compliance required.', priority: 'critical' },
      { id: 'qts', title: 'QTS (for teacher roles)', description: 'Qualified Teacher Status required for maintained school teaching posts.', priority: 'critical' },
    ],
    skillsCv: 'Highlight curriculum experience, behaviour strategies, SEN support, and safeguarding training dates.',
    recognitionSummary: 'Teaching experience transfers with DBS, safeguarding, and QTS or equivalent UK teaching qualification.',
    regulated: true,
  }),

  hr_recruitment: sectorProfile('hr_recruitment', {
    skilledJob: { title: 'HR Advisor', keyword: 'HR advisor', salary: '£28k–£38k' },
    seniorJob: { title: 'HR Business Partner', keyword: 'HR business partner', salary: '£38k–£52k' },
    essentialActions: [
      { id: 'cipd', title: 'CIPD Qualification', description: 'Chartered Institute of Personnel and Development — UK HR standard.', priority: 'critical' },
      { id: 'hris', title: 'HRIS Experience', description: 'Workday, CIPHR, or SAP SuccessFactors proficiency expected.', priority: 'critical' },
    ],
    skillsCv: 'Document employee relations cases, HRIS systems, recruitment volumes, and policy rollouts.',
    recognitionSummary: 'HR experience transfers with CIPD progress and evidence of UK employment law application.',
  }),

  cleaning_facilities: sectorProfile('cleaning_facilities', {
    skilledJob: { title: 'Commercial Cleaner', keyword: 'commercial cleaner', salary: '£20k–£24k' },
    seniorJob: { title: 'Facilities Coordinator', keyword: 'facilities coordinator', salary: '£24k–£32k' },
    essentialActions: [
      { id: 'coshh', title: 'COSHH Training', description: 'Mandatory for commercial cleaning with chemicals.', priority: 'critical' },
      { id: 'manual_handling', title: 'Manual Handling Certificate', description: 'Required for waste handling and equipment movement.', priority: 'critical' },
      { id: 'bics', title: 'BICSc Cleaning Qualification', description: 'UK industry standard for contract cleaning roles.', priority: 'recommended' },
    ],
    skillsCv: 'Include contract sites managed, COSHH compliance, team size, and quality audit scores.',
    recognitionSummary: 'Cleaning and facilities experience transfers with COSHH, manual handling, and BICSc or IWFM qualifications.',
  }),

  other: p({
    id: 'other',
    label: 'Professional Experience',
    careerHubPathId: 'office-admin',
    goals: { skilled: 'UK Professional', senior: 'Senior Professional', supervisor: 'Team Leader', manager: 'Manager' },
    timelines: {
      skilled: ['Skilled Worker', 'Senior Specialist', 'Team Leader', 'Manager', 'Director'],
      senior: ['Senior Specialist', 'Team Leader', 'Manager', 'Director', 'Head of Department'],
      supervisor: ['Team Leader', 'Supervisor', 'Manager', 'Director', 'Head of Department'],
      manager: ['Manager', 'Senior Manager', 'Director', 'Head of Department', 'Executive'],
    },
    jobs: {
      skilled: [
        { title: 'Specialist (Your Field)', seniority: 'mid', searchKeyword: 'specialist', salaryRange: '£26k–£36k' },
        { title: 'Senior Operative', seniority: 'mid', searchKeyword: 'senior operative', salaryRange: '£26k–£34k' },
        { title: 'Team Member', seniority: 'mid', searchKeyword: 'experienced operative', salaryRange: '£24k–£32k' },
      ],
      senior: [
        { title: 'Senior Specialist', seniority: 'senior', searchKeyword: 'senior specialist', salaryRange: '£32k–£42k' },
        { title: 'Team Leader', seniority: 'senior', searchKeyword: 'team leader', salaryRange: '£30k–£40k' },
      ],
      supervisor: [
        { title: 'Supervisor', seniority: 'senior', searchKeyword: 'supervisor', salaryRange: '£32k–£42k' },
        { title: 'Team Leader', seniority: 'senior', searchKeyword: 'team leader', salaryRange: '£30k–£40k' },
      ],
      manager: [
        { title: 'Manager', seniority: 'senior', searchKeyword: 'manager', salaryRange: '£38k–£52k' },
        { title: 'Operations Manager', seniority: 'senior', searchKeyword: 'operations manager', salaryRange: '£40k–£55k' },
      ],
    },
    essentialActions: [
      { id: 'cv_uk', title: 'UK-Format CV', description: 'Translate your experience into UK job titles and keywords employers recognise.', priority: 'critical' },
    ],
    outsideUkActions: [
      { id: 'experience_mapping', title: 'Experience Mapping', description: 'Translate overseas job titles and achievements into UK equivalents employers will recognise.', href: CV, priority: 'recommended' },
    ],
    courses: [],
    cvImprovements: [
      { id: 'exp', title: 'Experience Translation', description: 'Map overseas job titles to UK equivalents with measurable achievements.', href: CV, priority: 1 },
      { id: 'skills', title: 'Transferable Skills', description: 'Leadership, safety, client management, and technical competencies.', href: CV, priority: 2 },
    ],
    missions: [
      { id: 'cv', label: 'Update experience section on CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 matching jobs', href: '/job-finder?query=experienced', target: 5 },
      { id: 'save', label: 'Save 3 relevant jobs', href: '/job-finder', target: 3 },
      { id: 'research', label: 'Research UK job titles in your field', href: CV, target: 1 },
    ],
    recognitionSummary: 'Focus on translating your experience into UK-recognised job titles and certifications.',
  }),
}

export function getIndustryProfile(id: ExperienceIndustryId): IndustryProfile {
  return INDUSTRY_PROFILES[id] ?? INDUSTRY_PROFILES.other
}
