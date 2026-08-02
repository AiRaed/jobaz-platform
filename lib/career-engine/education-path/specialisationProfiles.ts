/**
 * Specialisation-level Career Brain profiles.
 * Roadmap uses education_field + education_specialisation — not generic sector advice.
 */

import type {
  CourseEntry,
  CvImprovement,
  EducationPathAnswers,
  EssentialAction,
  JobEntry,
  QualificationLevel,
} from './types'
import { getSeedKnowledge } from './knowledge/seed'
import { generateDynamicProfessionProfile, getLastRoadmapInsights } from './dynamic'
import type { ProfessionProfile } from './professionProfiles'

const CV = '/cv-builder-v2'
const ENIC = 'https://www.enic.org.uk/'
const NHS_JOBS = 'https://www.jobs.nhs.uk/'

type SpecialisationHint = {
  goalByLevel?: Partial<Record<QualificationLevel, string>>
  essentialActions?: EssentialAction[]
  coursesByLevel?: Partial<Record<QualificationLevel, CourseEntry[]>>
  jobsByLevel?: Partial<Record<QualificationLevel, JobEntry[]>>
  cvImprovements?: CvImprovement[]
  timelineByLevel?: Partial<Record<QualificationLevel, string[]>>
}

function jobs(
  entries: Array<{ title: string; keyword: string; seniority?: JobEntry['seniority']; salary?: string }>
): JobEntry[] {
  return entries.map((e) => ({
    title: e.title,
    searchKeyword: e.keyword,
    seniority: e.seniority,
    salaryRange: e.salary,
  }))
}

const REGISTERED_NURSE: ProfessionProfile = {
  goalByLevel: {
    bachelors: 'Registered Nurse (Band 5)',
    masters: 'Senior Staff Nurse',
    phd: 'Advanced Nurse Practitioner',
  },
  timelineByLevel: {
    bachelors: ['NMC Registration', 'Band 5 Staff Nurse', 'Band 6 Senior Nurse', 'Band 7 Ward Manager', 'Clinical Lead'],
    masters: ['Band 6 Staff Nurse', 'Band 7 Ward Manager', 'Clinical Lead', 'Matron', 'Director of Nursing'],
    phd: ['Research Nurse', 'Advanced Practitioner', 'Clinical Academic', 'Consultant Nurse', 'Director of Nursing'],
  },
  cvImprovements: [
    { id: 'nursing_cv', title: 'Nursing CV (NHS format)', description: 'Use NHS-style CV: NMC PIN, clinical placements, ward settings, and NMC revalidation dates.', href: CV, priority: 1 },
    { id: 'clinical_skills', title: 'Clinical Skills & Ward Experience', description: 'List medicines management, patient observations, care plans, and safeguarding competencies.', href: CV, priority: 2 },
    { id: 'nmc_pin', title: 'NMC PIN on CV', description: 'Display your NMC registration number and status prominently — NHS recruiters check this first.', href: CV, priority: 3 },
    { id: 'nhs_values', title: 'NHS Values & Interview Examples', description: 'Prepare STAR examples for compassion, respect, and teamwork — core NHS interview criteria.', href: '/interview-coach', priority: 4 },
  ],
  essentialActions: [
    { id: 'nmc', title: 'NMC Registration', description: 'Register with the Nursing and Midwifery Council — mandatory to practise as a nurse in the UK.', href: 'https://www.nmc.org.uk/registration/', priority: 'critical' },
    { id: 'cbt', title: 'CBT (Test of Competence)', description: 'Computer-based test required for internationally educated nurses before UK registration.', href: 'https://www.nmc.org.uk/registration/joining-the-register/', priority: 'critical' },
    { id: 'osce', title: 'OSCE', description: 'Objective Structured Clinical Examination — practical assessment for overseas nursing qualifications.', href: 'https://www.nmc.org.uk/registration/joining-the-register/', priority: 'critical' },
    { id: 'ielts_oet', title: 'IELTS / OET (if needed)', description: 'English language evidence required for NMC registration when trained outside the UK.', priority: 'critical' },
    { id: 'nhs_jobs', title: 'NHS Jobs Applications', description: 'Band 5 staff nurse roles are the standard entry point on the NHS Agenda for Change scale.', href: NHS_JOBS, priority: 'critical' },
  ],
  coursesByLevel: {
    bachelors: [
      { id: 'nmc_prep', title: 'NMC Registration Preparation', whyReasons: ['Required for UK nursing practice.', 'Covers CBT and OSCE pathways.'], duration: '8–16 weeks', costLabel: 'Varies' },
      { id: 'life_support', title: 'Basic Life Support (BLS)', whyReasons: ['Expected by NHS trusts at interview.', 'Strengthens Band 5 applications.'], duration: '1 day', costLabel: 'Paid' },
    ],
    masters: [
      { id: 'prescribing', title: 'Non-Medical Prescribing', whyReasons: ['Progression route for Band 6+ nurses.', 'High demand in primary and community care.'], duration: '6–12 months', costLabel: 'Employer-funded' },
    ],
    phd: [
      { id: 'anp', title: 'Advanced Nurse Practitioner Programme', whyReasons: ['Doctoral nurses often move into ANP or clinical academic roles.'], duration: '12–24 months', costLabel: 'Varies' },
    ],
  },
  jobsByLevel: {
    bachelors: jobs([
      { title: 'Band 5 Staff Nurse', keyword: 'band 5 staff nurse', seniority: 'graduate', salary: '£28k–£35k' },
      { title: 'Staff Nurse NHS', keyword: 'staff nurse NHS', seniority: 'graduate', salary: '£28k–£35k' },
      { title: 'Registered Nurse', keyword: 'registered nurse UK', seniority: 'graduate', salary: '£28k–£36k' },
      { title: 'Newly Qualified Nurse', keyword: 'newly qualified nurse', seniority: 'graduate', salary: '£27k–£34k' },
    ]),
    masters: jobs([
      { title: 'Band 6 Staff Nurse', keyword: 'band 6 nurse', seniority: 'mid', salary: '£35k–£42k' },
      { title: 'Senior Staff Nurse', keyword: 'senior staff nurse', seniority: 'mid', salary: '£35k–£45k' },
      { title: 'Ward Sister / Charge Nurse', keyword: 'ward sister nurse', seniority: 'mid', salary: '£38k–£48k' },
    ]),
    phd: jobs([
      { title: 'Research Nurse', keyword: 'research nurse', seniority: 'research', salary: '£35k–£45k' },
      { title: 'Clinical Academic Nurse', keyword: 'clinical academic nurse', seniority: 'research', salary: '£38k–£50k' },
      { title: 'Advanced Nurse Practitioner', keyword: 'advanced nurse practitioner', seniority: 'senior', salary: '£45k–£58k' },
    ]),
  },
  missionsByLevel: {
    bachelors: [
      { id: 'nmc', label: 'Review NMC registration steps', href: 'https://www.nmc.org.uk/registration/', target: 1 },
      { id: 'cv', label: 'Build Nursing CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Band 5 Nurse Roles', href: '/job-finder?query=band%205%20staff%20nurse', target: 5 },
      { id: 'nhs', label: 'Search NHS Jobs', href: NHS_JOBS, target: 1 },
    ],
    masters: [
      { id: 'nmc', label: 'Confirm NMC PIN is active', href: 'https://www.nmc.org.uk/registration/', target: 1 },
      { id: 'cv', label: 'Update Nursing CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Senior Nurse Roles', href: '/job-finder?query=band%206%20nurse', target: 5 },
      { id: 'interview', label: 'Nursing interview practice', href: '/interview-coach', target: 1 },
    ],
    phd: [
      { id: 'cv', label: 'Build Clinical Academic CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Research Nurse Roles', href: '/job-finder?query=research%20nurse', target: 5 },
      { id: 'save', label: 'Save 3 ANP Opportunities', href: '/job-finder?query=advanced%20nurse%20practitioner', target: 3 },
    ],
  },
  forbiddenJobPatterns: {
    phd: /healthcare assistant|care assistant|cleaner|warehouse|retail/i,
    masters: /healthcare assistant|care assistant|cleaner/i,
    bachelors: /warehouse|cleaner|retail assistant/i,
  },
}

const ACCOUNTING: ProfessionProfile = {
  goalByLevel: {
    bachelors: 'Qualified Accountant',
    masters: 'Management Accountant',
    phd: 'Finance Director',
  },
  timelineByLevel: {
    bachelors: ['AAT / Trainee Accountant', 'Part-Qualified Accountant', 'Qualified Accountant', 'Management Accountant', 'Finance Manager'],
    masters: ['Assistant Management Accountant', 'Management Accountant', 'Financial Controller', 'Finance Director', 'CFO'],
    phd: ['Research Analyst', 'Senior Financial Analyst', 'Finance Director', 'Partner Track', 'CFO'],
  },
  cvImprovements: [
    { id: 'accounting_cv', title: 'Accounting CV', description: 'Lead with qualification route (ACCA/CIMA/AAT), software skills (Excel, Sage, Xero), and audit or management accounts experience.', href: CV, priority: 1 },
    { id: 'excel_cv', title: 'Advanced Excel on CV', description: 'List pivot tables, VLOOKUP, financial modelling — frequently tested at finance interviews.', href: CV, priority: 2 },
    { id: 'enic_cv', title: 'UK ENIC Statement', description: 'Add ENIC evaluation if your degree was awarded outside the UK.', href: ENIC, priority: 3 },
    { id: 'finance_interview', title: 'Accounting Interview Prep', description: 'Prepare for competency and technical questions: month-end, reconciliations, IFRS/UK GAAP basics.', href: '/interview-coach', priority: 4 },
  ],
  essentialActions: [
    { id: 'enic', title: 'UK ENIC Recognition', description: 'Evaluate your overseas degree so UK employers understand your qualification level.', href: ENIC, priority: 'critical' },
    { id: 'acca', title: 'ACCA Route', description: 'Association of Chartered Certified Accountants — global route recognised by UK employers.', href: 'https://www.accaglobal.com/', priority: 'critical' },
    { id: 'cima', title: 'CIMA Route', description: 'Chartered Institute of Management Accountants — preferred for management accounting roles.', href: 'https://www.cimaglobal.com/', priority: 'recommended' },
    { id: 'icaew', title: 'ICAEW / ACA Route', description: 'Chartered Accountant route for audit and practice roles in the UK.', href: 'https://www.icaew.com/', priority: 'recommended' },
    { id: 'aat', title: 'AAT Bookkeeping', description: 'Practical entry qualification for accounts assistant and bookkeeping roles.', href: '/career-hub?route=office-admin', priority: 'critical' },
  ],
  coursesByLevel: {
    bachelors: [
      { id: 'excel', title: 'Advanced Excel for Finance', whyReasons: ['Frequently requested in finance interviews.', 'Expected for analyst and accounts roles.'], duration: '4–8 weeks', costLabel: 'Paid', pathId: 'office-admin' },
      { id: 'sage', title: 'Sage Accounting', whyReasons: ['Common in UK SME finance teams.', 'Strengthens trainee applications.'], duration: '2–4 weeks', costLabel: 'Paid' },
      { id: 'xero', title: 'Xero Certification', whyReasons: ['High demand in practice and SME roles.'], duration: '2–3 weeks', costLabel: 'Paid' },
    ],
    masters: [
      { id: 'ifrs', title: 'IFRS / UK GAAP Update', whyReasons: ['Expected for management accountant progression.'], duration: '2–4 weeks', costLabel: 'Paid' },
      { id: 'excel_adv', title: 'Financial Modelling in Excel', whyReasons: ['Differentiates mid-level finance applicants.'], duration: '4–6 weeks', costLabel: 'Paid' },
    ],
    phd: [
      { id: 'cfa', title: 'CFA / Investment Route', whyReasons: ['Aligns doctoral finance research with industry roles.'], duration: '12+ months', costLabel: 'Professional fees' },
    ],
  },
  jobsByLevel: {
    bachelors: jobs([
      { title: 'Accounts Assistant', keyword: 'accounts assistant', seniority: 'junior', salary: '£22k–£28k' },
      { title: 'Trainee Accountant', keyword: 'trainee accountant', seniority: 'graduate', salary: '£24k–£30k' },
      { title: 'Bookkeeper', keyword: 'bookkeeper', seniority: 'junior', salary: '£24k–£32k' },
      { title: 'Graduate Finance Analyst', keyword: 'graduate finance analyst', seniority: 'graduate', salary: '£26k–£35k' },
    ]),
    masters: jobs([
      { title: 'Management Accountant', keyword: 'assistant management accountant', seniority: 'mid', salary: '£32k–£42k' },
      { title: 'Financial Analyst', keyword: 'financial analyst', seniority: 'mid', salary: '£35k–£48k' },
      { title: 'Audit Senior', keyword: 'audit senior', seniority: 'mid', salary: '£36k–£48k' },
    ]),
    phd: jobs([
      { title: 'Research Analyst (Finance)', keyword: 'research analyst finance', seniority: 'research', salary: '£38k–£55k' },
      { title: 'Quantitative Analyst', keyword: 'quantitative analyst', seniority: 'research', salary: '£45k–£65k' },
    ]),
  },
  missionsByLevel: {
    bachelors: [
      { id: 'enic', label: 'Start UK ENIC evaluation', href: ENIC, target: 1 },
      { id: 'cv', label: 'Build Accounting CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Finance Jobs', href: '/job-finder?query=trainee%20accountant', target: 5 },
      { id: 'aat', label: 'Explore AAT route', href: '/career-hub?route=office-admin', target: 1 },
    ],
    masters: [
      { id: 'cv', label: 'Update Finance CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Management Accountant Roles', href: '/job-finder?query=management%20accountant', target: 5 },
      { id: 'excel', label: 'Book Advanced Excel training', href: '/career-hub?route=office-admin', target: 1 },
    ],
    phd: [
      { id: 'cv', label: 'Build Research Finance CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Senior Finance Roles', href: '/job-finder?query=senior%20financial%20analyst', target: 5 },
    ],
  },
  forbiddenJobPatterns: {
    phd: /receptionist|data entry|warehouse|retail|cleaner/i,
    masters: /receptionist|data entry|warehouse/i,
    bachelors: /receptionist|warehouse|retail assistant/i,
  },
}

const CIVIL_ENGINEERING: ProfessionProfile = {
  goalByLevel: {
    bachelors: 'Chartered Civil Engineer',
    masters: 'Senior Civil Engineer',
    phd: 'Principal Civil Engineer',
  },
  timelineByLevel: {
    bachelors: ['Graduate Civil Engineer', 'Site Engineer', 'Design Engineer', 'Senior Engineer', 'Chartered Civil Engineer'],
    masters: ['Design Engineer', 'Project Engineer', 'Senior Civil Engineer', 'Engineering Manager', 'Chartered Civil Engineer'],
    phd: ['Research Engineer', 'Senior Civil Engineer', 'Principal Engineer', 'Technical Director', 'Chartered Civil Engineer'],
  },
  cvImprovements: [
    { id: 'civil_cv', title: 'Civil Engineering CV', description: 'Highlight degree classification, design projects, AutoCAD/Revit skills, and site experience.', href: CV, priority: 1 },
    { id: 'ice_cv', title: 'ICE / EngC Membership', description: 'Show ICE student or graduate membership and EngC registration pathway on your CV.', href: 'https://www.ice.org.uk/', priority: 2 },
    { id: 'cscs_cv', title: 'CSCS Card', description: 'Required for site access on UK construction projects.', href: CV, priority: 3 },
  ],
  essentialActions: [
    { id: 'ice', title: 'ICE Membership', description: 'Institution of Civil Engineers — professional body for civil engineering chartership in the UK.', href: 'https://www.ice.org.uk/', priority: 'critical' },
    { id: 'engc', title: 'Engineering Council Registration', description: 'CEng / IEng status through ICE — expected for senior civil engineering roles.', href: 'https://www.engc.org.uk/', priority: 'critical' },
    { id: 'cscs', title: 'CSCS Card', description: 'Construction Skills Certification Scheme card for UK site work.', priority: 'critical' },
    { id: 'graduate_scheme', title: 'Graduate Engineer Route', description: 'Structured graduate programmes are the main entry route for civil engineering graduates.', href: '/job-finder?query=graduate%20civil%20engineer', priority: 'critical' },
  ],
  coursesByLevel: {
    bachelors: [
      { id: 'autocad', title: 'AutoCAD', whyReasons: ['Required by most UK design offices.', 'Expected on graduate civil applications.'], duration: '4–8 weeks', costLabel: 'Paid', pathId: 'construction-trades' },
      { id: 'cscs', title: 'CSCS Card', whyReasons: ['Unlocks site-based graduate roles.'], duration: '1 day', costLabel: 'Paid', pathId: 'construction-trades', slug: 'cscs-card' },
    ],
    masters: [
      { id: 'revit', title: 'Revit / BIM', whyReasons: ['BIM skills expected on design engineer roles.'], duration: '4–6 weeks', costLabel: 'Paid' },
    ],
    phd: [
      { id: 'chartership', title: 'CEng Chartership Route', whyReasons: ['Formal recognition for doctoral civil engineers.'], duration: '12–24 months', costLabel: 'Professional fees' },
    ],
  },
  jobsByLevel: {
    bachelors: jobs([
      { title: 'Graduate Civil Engineer', keyword: 'graduate civil engineer', seniority: 'graduate', salary: '£28k–£35k' },
      { title: 'Site Engineer Graduate', keyword: 'graduate site engineer civil', seniority: 'graduate', salary: '£27k–£34k' },
      { title: 'Junior Structural Engineer', keyword: 'junior structural engineer', seniority: 'junior', salary: '£28k–£36k' },
      { title: 'Highways Graduate Engineer', keyword: 'graduate highways engineer', seniority: 'graduate', salary: '£28k–£35k' },
    ]),
    masters: jobs([
      { title: 'Civil Design Engineer', keyword: 'civil design engineer', seniority: 'mid', salary: '£34k–£46k' },
      { title: 'Project Engineer (Civil)', keyword: 'civil project engineer', seniority: 'mid', salary: '£35k–£48k' },
      { title: 'Structural Engineer', keyword: 'structural engineer', seniority: 'mid', salary: '£34k–£46k' },
    ]),
    phd: jobs([
      { title: 'Research Civil Engineer', keyword: 'civil engineering research', seniority: 'research', salary: '£35k–£50k' },
      { title: 'Senior Civil Engineer', keyword: 'senior civil engineer', seniority: 'senior', salary: '£45k–£58k' },
    ]),
  },
  missionsByLevel: {
    bachelors: [
      { id: 'ice', label: 'Join ICE as graduate member', href: 'https://www.ice.org.uk/', target: 1 },
      { id: 'cv', label: 'Build Civil Engineering CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Graduate Civil Roles', href: '/job-finder?query=graduate%20civil%20engineer', target: 5 },
      { id: 'cscs', label: 'Get CSCS card', href: '/career-hub?route=construction-trades', target: 1 },
    ],
    masters: [
      { id: 'ice', label: 'Check ICE chartership steps', href: 'https://www.ice.org.uk/', target: 1 },
      { id: 'cv', label: 'Update Civil Engineering CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Civil Engineer Roles', href: '/job-finder?query=civil%20design%20engineer', target: 5 },
    ],
    phd: [
      { id: 'cv', label: 'Build Research Engineering CV', href: CV, target: 1 },
      { id: 'apply', label: 'Apply to 5 Senior Civil Roles', href: '/job-finder?query=senior%20civil%20engineer', target: 5 },
    ],
  },
  forbiddenJobPatterns: {
    phd: /operative|warehouse|labourer|cleaner|retail/i,
    masters: /operative|warehouse|labourer/i,
    bachelors: /production operative|warehouse operative/i,
  },
}

const FULL_PROFILES: Record<string, ProfessionProfile> = {
  'healthcare:registered_nurse': REGISTERED_NURSE,
  'business_finance:accounting': ACCOUNTING,
  'engineering:civil_engineering': CIVIL_ENGINEERING,
}

/** Lighter overrides — merged onto field profile when no full profile exists */
const SPECIALISATION_HINTS: Record<string, SpecialisationHint> = {
  software_engineering: {
    goalByLevel: { bachelors: 'Software Engineer', masters: 'Senior Software Engineer' },
    jobsByLevel: {
      bachelors: jobs([
        { title: 'Junior Software Developer', keyword: 'junior software developer', seniority: 'graduate' },
        { title: 'Graduate Software Engineer', keyword: 'graduate software engineer', seniority: 'graduate' },
      ]),
    },
    essentialActions: [
      { id: 'github', title: 'GitHub Portfolio', description: 'UK tech employers review code before interviews.', href: 'https://github.com/', priority: 'critical' },
    ],
  },
  physiotherapist: {
    goalByLevel: { bachelors: 'HCPC-Registered Physiotherapist' },
    essentialActions: [
      { id: 'hcpc', title: 'HCPC Registration', description: 'Health and Care Professions Council registration is mandatory for UK physiotherapists.', href: 'https://www.hcpc-uk.org/', priority: 'critical' },
    ],
    jobsByLevel: {
      bachelors: jobs([{ title: 'Band 5 Physiotherapist', keyword: 'band 5 physiotherapist', seniority: 'graduate' }]),
    },
  },
  pharmacist: {
    essentialActions: [
      { id: 'gphc', title: 'GPhC Registration', description: 'General Pharmaceutical Council registration required to practise as a pharmacist in the UK.', href: 'https://www.pharmacyregulation.org/', priority: 'critical' },
    ],
    jobsByLevel: {
      bachelors: jobs([{ title: 'Pharmacist NHS', keyword: 'pharmacist NHS', seniority: 'graduate' }]),
    },
  },
  doctor_physician: {
    essentialActions: [
      { id: 'gmc', title: 'GMC Registration', description: 'General Medical Council registration required for UK medical practice.', href: 'https://www.gmc-uk.org/', priority: 'critical' },
      { id: 'plab', title: 'PLAB / IMG Route', description: 'Overseas doctors typically require PLAB or approved postgraduate route.', priority: 'critical' },
    ],
  },
  chef: {
    goalByLevel: { bachelors: 'Head Chef' },
    coursesByLevel: {
      bachelors: [
        { id: 'food_hygiene', title: 'Food Hygiene Level 3', whyReasons: ['Required in UK catering kitchens.'], duration: '1–2 days', costLabel: 'Paid' },
      ],
    },
    jobsByLevel: {
      bachelors: jobs([
        { title: 'Commis Chef', keyword: 'commis chef', seniority: 'junior' },
        { title: 'Chef de Partie', keyword: 'chef de partie', seniority: 'mid' },
      ]),
    },
  },
  cyber_security: {
    essentialActions: [
      { id: 'security_plus', title: 'CompTIA Security+', description: 'Foundational cyber security certification recognised by UK employers.', priority: 'recommended' },
    ],
    jobsByLevel: {
      bachelors: jobs([{ title: 'Junior Cyber Security Analyst', keyword: 'junior cyber security analyst', seniority: 'junior' }]),
    },
  },
  solicitor: {
    essentialActions: [
      { id: 'sqe', title: 'SQE Route', description: 'Solicitors Qualifying Examination — main route to solicitor qualification in England and Wales.', href: 'https://www.sra.org.uk/', priority: 'critical' },
    ],
  },
}

function mergeProfiles(base: ProfessionProfile, hint: SpecialisationHint): ProfessionProfile {
  return {
    ...base,
    goalByLevel: { ...base.goalByLevel, ...hint.goalByLevel },
    timelineByLevel: hint.timelineByLevel
      ? ({ ...base.timelineByLevel, ...hint.timelineByLevel } as ProfessionProfile['timelineByLevel'])
      : base.timelineByLevel,
    essentialActions: hint.essentialActions?.length
      ? [...hint.essentialActions, ...base.essentialActions]
      : base.essentialActions,
    cvImprovements: hint.cvImprovements?.length ? hint.cvImprovements : base.cvImprovements,
    coursesByLevel: hint.coursesByLevel
      ? ({
          bachelors: hint.coursesByLevel.bachelors ?? base.coursesByLevel.bachelors,
          masters: hint.coursesByLevel.masters ?? base.coursesByLevel.masters,
          phd: hint.coursesByLevel.phd ?? base.coursesByLevel.phd,
        } as ProfessionProfile['coursesByLevel'])
      : base.coursesByLevel,
    jobsByLevel: hint.jobsByLevel
      ? ({
          bachelors: hint.jobsByLevel.bachelors ?? base.jobsByLevel.bachelors,
          masters: hint.jobsByLevel.masters ?? base.jobsByLevel.masters,
          phd: hint.jobsByLevel.phd ?? base.jobsByLevel.phd,
        } as ProfessionProfile['jobsByLevel'])
      : base.jobsByLevel,
    missionsByLevel: base.missionsByLevel,
    forbiddenJobPatterns: base.forbiddenJobPatterns,
  }
}

export function resolveProfessionProfile(
  answers: EducationPathAnswers,
  knowledge?: import('./types').EducationFieldKnowledge
): ProfessionProfile | null {
  const key = `${answers.education_field}:${answers.education_specialisation}`
  const full = FULL_PROFILES[key]
  if (full) return full

  const kb = knowledge ?? getSeedKnowledge(answers.education_field)
  return generateDynamicProfessionProfile(answers, kb)
}

export { getLastRoadmapInsights }
