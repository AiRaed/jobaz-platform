/**
 * UK regulatory & employability intelligence keyed by specialisation.
 * Reasoned like a UK career advisor — mandatory registrations before optional courses.
 */

import type { SpecialisationBlueprint, UkRequirement } from './types'

const NHS = 'https://www.jobs.nhs.uk/'
const ENIC = 'https://www.enic.org.uk/'
const CV = '/cv-builder-v2'
const INTERVIEW = '/interview-coach'

function req(
  id: string,
  title: string,
  description: string,
  opts: Partial<UkRequirement> = {}
): UkRequirement {
  return { id, title, description, kind: 'registration', tier: 'mandatory', ...opts }
}

function cert(
  id: string,
  title: string,
  description: string,
  opts: Partial<UkRequirement> = {}
): UkRequirement {
  return { id, title, description, kind: 'certificate', tier: 'recommended', ...opts }
}

/** Exact specialisation-id blueprints (highest priority). */
export const SPECIALISATION_BLUEPRINTS: Record<string, SpecialisationBlueprint> = {
  // ── Healthcare (regulated) ──────────────────────────────────────────
  registered_nurse: {
    match: 'registered_nurse',
    regulated: true,
    goal: { bachelors: 'Registered Nurse (Band 5)', masters: 'Senior Staff Nurse', phd: 'Advanced Nurse Practitioner' },
    promotionPath: ['NMC Registration', 'Band 5 Staff Nurse', 'Band 6 Senior Nurse', 'Band 7 Ward Manager', 'Clinical Lead'],
    requirements: [
      req('nmc', 'NMC Registration', 'Mandatory to practise as a nurse in the UK.', { href: 'https://www.nmc.org.uk/registration/' }),
      req('cbt', 'CBT (Test of Competence)', 'Required for internationally educated nurses.', { href: 'https://www.nmc.org.uk/registration/joining-the-register/', overseasOnly: true }),
      req('osce', 'OSCE', 'Practical assessment for overseas nursing qualifications.', { overseasOnly: true }),
      req('ielts_oet', 'IELTS / OET', 'English evidence for NMC when trained outside the UK.', { overseasOnly: true, whenEnglishLow: true }),
      req('nhs_jobs', 'NHS Jobs Applications', 'Band 5 is the standard NHS entry point.', { href: NHS }),
    ],
    jobs: {
      bachelors: [
        { title: 'Band 5 Staff Nurse', keyword: 'band 5 staff nurse', seniority: 'graduate', salary: '£28k–£35k' },
        { title: 'Newly Qualified Nurse', keyword: 'newly qualified nurse', seniority: 'graduate', salary: '£27k–£34k' },
      ],
    },
    interviewTips: ['Prepare NHS Values STAR examples (compassion, respect, teamwork).', 'Know your NMC PIN status and revalidation date.'],
    fastestRoute: 'NMC registration → Band 5 NHS application → trust induction',
    alternativeRoles: ['Healthcare Assistant (while awaiting NMC)', 'Nursing Associate', 'Care Home Nurse'],
  },
  doctor_physician: {
    match: 'doctor_physician',
    regulated: true,
    goal: { bachelors: 'Foundation Year Doctor', masters: 'Specialist Registrar', phd: 'Consultant / Clinical Academic' },
    requirements: [
      req('gmc', 'GMC Registration', 'General Medical Council registration required for UK practice.', { href: 'https://www.gmc-uk.org/' }),
      req('plab', 'PLAB / IMG Route', 'Overseas doctors typically need PLAB or approved postgraduate route.', { overseasOnly: true }),
      req('ielts', 'IELTS / OET for GMC', 'English language requirement for GMC registration.', { overseasOnly: true, whenEnglishLow: true }),
    ],
    jobs: {
      bachelors: [
        { title: 'Foundation Year 1 Doctor', keyword: 'FY1 doctor', seniority: 'graduate', salary: '£32k–£38k' },
        { title: 'Junior Doctor NHS', keyword: 'junior doctor NHS', seniority: 'graduate', salary: '£32k–£40k' },
      ],
    },
    fastestRoute: 'GMC registration → Foundation Programme / CESR pathway → specialty training',
    alternativeRoles: ['Clinical Fellow', 'Trust Doctor (locum)', 'Medical Writer'],
  },
  pharmacist: {
    match: 'pharmacist',
    regulated: true,
    requirements: [
      req('gphc', 'GPhC Registration', 'General Pharmaceutical Council registration mandatory.', { href: 'https://www.pharmacyregulation.org/' }),
      req('enic', 'UK ENIC + GPhC Assessment', 'Overseas pharmacy degrees need recognition before registration.', { overseasOnly: true, href: ENIC }),
    ],
    jobs: { bachelors: [{ title: 'Pharmacist NHS', keyword: 'pharmacist NHS', seniority: 'graduate', salary: '£35k–£42k' }] },
    fastestRoute: 'GPhC registration → community or hospital pharmacist role',
    alternativeRoles: ['Pharmacy Technician (interim)', 'Industrial Pharmacist', 'Regulatory Affairs Associate'],
  },
  physiotherapist: {
    match: 'physiotherapist',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Registration', 'Mandatory for UK physiotherapists.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Band 5 Physiotherapist', keyword: 'band 5 physiotherapist', seniority: 'graduate', salary: '£28k–£35k' }] },
    fastestRoute: 'HCPC registration → Band 5 NHS physio post',
    alternativeRoles: ['Physiotherapy Assistant', 'Sports Rehab Therapist (unregulated — check scope)'],
  },
  dentist: {
    match: 'dentist',
    regulated: true,
    requirements: [req('gdc', 'GDC Registration', 'General Dental Council registration required.', { href: 'https://www.gdc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Associate Dentist', keyword: 'associate dentist UK', seniority: 'graduate', salary: '£45k–£70k' }] },
    fastestRoute: 'GDC registration → associate dentist position in NHS or private practice',
  },
  midwife: {
    match: 'midwife',
    regulated: true,
    requirements: [req('nmc', 'NMC Midwife Registration', 'Midwives register with the NMC on the midwives part of the register.', { href: 'https://www.nmc.org.uk/' })],
    jobs: { bachelors: [{ title: 'Band 5 Midwife', keyword: 'band 5 midwife', seniority: 'graduate', salary: '£28k–£35k' }] },
  },
  radiographer: {
    match: 'radiographer',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Registration', 'Diagnostic and therapeutic radiographers must be HCPC-registered.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Band 5 Radiographer', keyword: 'band 5 radiographer', seniority: 'graduate', salary: '£28k–£35k' }] },
  },
  occupational_therapist: {
    match: 'occupational_therapist',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Registration', 'Mandatory for occupational therapists in the UK.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Band 5 Occupational Therapist', keyword: 'band 5 occupational therapist', seniority: 'graduate' }] },
  },
  biomedical_scientist: {
    match: 'biomedical_scientist',
    regulated: true,
    requirements: [
      req('hcpc', 'HCPC Registration', 'Required for protected title Biomedical Scientist.', { href: 'https://www.hcpc-uk.org/' }),
      req('ibms', 'IBMS Portfolio / Registration', 'Institute of Biomedical Science route for NHS pathology labs.', { href: 'https://www.ibms.org/' }),
    ],
    jobs: { bachelors: [{ title: 'Biomedical Scientist NHS', keyword: 'biomedical scientist NHS', seniority: 'graduate', salary: '£28k–£35k' }] },
    fastestRoute: 'HCPC + IBMS portfolio → NHS pathology band 5',
    alternativeRoles: ['Laboratory Technician', 'Research Technician', 'Clinical Trials Assistant'],
  },
  laboratory_scientist: {
    match: 'laboratory_scientist',
    regulated: true,
    requirements: [
      req('ibms', 'IBMS Registration', 'Preferred for NHS laboratory scientist roles.', { href: 'https://www.ibms.org/' }),
      cert('glp', 'GLP / GMP Awareness', 'Expected in pharmaceutical and diagnostic labs.'),
    ],
    jobs: { bachelors: [{ title: 'Laboratory Scientist', keyword: 'laboratory scientist UK', seniority: 'graduate', salary: '£24k–£32k' }] },
    alternativeRoles: ['Lab Technician', 'Quality Control Analyst', 'Research Assistant'],
  },
  paramedic: {
    match: 'paramedic',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Paramedic Registration', 'Mandatory to use the title paramedic in the UK.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Paramedic NHS', keyword: 'paramedic NHS', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  nutrition_dietetics: {
    match: 'nutrition_dietetics',
    regulated: true,
    requirements: [req('hcpc', 'HCPC Dietitian Registration', 'Dietitian is a protected title requiring HCPC registration.', { href: 'https://www.hcpc-uk.org/' })],
    jobs: { bachelors: [{ title: 'Band 5 Dietitian', keyword: 'band 5 dietitian', seniority: 'graduate' }] },
  },

  // ── Teaching ──────────────────────────────────────────────────────
  primary_education: {
    match: 'primary_education',
    regulated: true,
    requirements: [
      req('qts', 'Qualified Teacher Status (QTS)', 'Required to teach in most English state schools.', { href: 'https://www.gov.uk/guidance/qualified-teacher-status-qts' }),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for all UK teaching roles involving children.', { href: 'https://www.gov.uk/dbs-check-applicant-criminal-record' }),
      req('iqts', 'iQTS (overseas teachers)', 'International Qualified Teacher Status route for overseas-trained teachers.', { overseasOnly: true, href: 'https://www.gov.uk/guidance/international-qualified-teacher-status-iqts' }),
    ],
    jobs: { bachelors: [{ title: 'Primary School Teacher', keyword: 'primary school teacher', seniority: 'graduate', salary: '£28k–£36k' }] },
    fastestRoute: 'QTS (or iQTS) → ECT induction year → classroom teacher post',
    alternativeRoles: ['Teaching Assistant', 'Cover Supervisor', 'Tutor'],
  },
  secondary_education: {
    match: 'secondary_education',
    regulated: true,
    requirements: [
      req('qts', 'Qualified Teacher Status (QTS)', 'Required for state secondary schools in England.', { href: 'https://www.gov.uk/guidance/qualified-teacher-status-qts' }),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for roles with children and young people.'),
    ],
    jobs: { bachelors: [{ title: 'Secondary School Teacher', keyword: 'secondary school teacher', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  mathematics_teacher: {
    match: 'mathematics_teacher',
    regulated: true,
    requirements: [
      req('qts', 'QTS + Maths Specialism', 'Maths teachers are in high demand — QTS with maths on your ITT is essential.'),
      req('dbs', 'Enhanced DBS Check', 'Required for all teaching posts.'),
    ],
    jobs: { bachelors: [{ title: 'Maths Teacher', keyword: 'maths teacher UK', seniority: 'graduate', salary: '£30k–£40k' }] },
    fastestRoute: 'QTS with maths → ECT → maths teacher vacancy (bursaries often available)',
  },
  english_teacher: {
    match: 'english_teacher',
    regulated: true,
    requirements: [req('qts', 'QTS', 'Qualified Teacher Status for UK state schools.'), req('dbs', 'Enhanced DBS Check', 'Mandatory.')],
    jobs: { bachelors: [{ title: 'English Teacher', keyword: 'english teacher UK', seniority: 'graduate' }] },
  },
  science_teacher: {
    match: 'science_teacher',
    regulated: true,
    requirements: [req('qts', 'QTS (Science)', 'Science teachers need QTS with biology, chemistry, or physics specialism.'), req('dbs', 'Enhanced DBS Check', 'Mandatory.')],
    jobs: { bachelors: [{ title: 'Science Teacher', keyword: 'science teacher UK', seniority: 'graduate', salary: '£30k–£40k' }] },
  },
  early_years: {
    match: 'early_years',
    requirements: [
      req('eyfs', 'Early Years Practitioner (L3)', 'Level 3 Early Years Educator qualification expected for practitioner roles.'),
      req('dbs', 'Enhanced DBS Check', 'Mandatory for childcare settings.'),
    ],
    jobs: { bachelors: [{ title: 'Early Years Teacher', keyword: 'early years teacher', seniority: 'graduate' }, { title: 'Nursery Practitioner', keyword: 'nursery practitioner', seniority: 'junior' }] },
  },
  special_education: {
    match: 'special_education',
    regulated: true,
    requirements: [req('qts', 'QTS (SEND)', 'SEND teachers need QTS plus SEND experience.'), req('dbs', 'Enhanced DBS Check', 'Enhanced DBS essential for SEND settings.')],
    jobs: { bachelors: [{ title: 'SEND Teacher', keyword: 'SEND teacher', seniority: 'graduate' }] },
  },
  tesol_esl: {
    match: 'tesol_esl',
    requirements: [
      cert('celta', 'CELTA / Trinity CertTESOL', 'Gold-standard UK TEFL qualification for language teaching.'),
      cert('dbs', 'DBS Check', 'Required when teaching in UK schools or colleges.'),
    ],
    jobs: { bachelors: [{ title: 'ESL Teacher UK', keyword: 'ESL teacher UK', seniority: 'junior' }, { title: 'EFL Teacher', keyword: 'EFL teacher', seniority: 'junior' }] },
    fastestRoute: 'CELTA → language school or college ESL role',
    alternativeRoles: ['Private Tutor', 'Online English Teacher', 'Teaching Assistant'],
  },

  // ── Law ───────────────────────────────────────────────────────────
  solicitor: {
    match: 'solicitor',
    regulated: true,
    requirements: [
      req('sqe', 'SQE Qualification', 'Solicitors Qualifying Examination — main England & Wales route.', { href: 'https://www.sra.org.uk/' }),
      req('lpc_legacy', 'LPC / Training Contract (legacy)', 'Pre-SQE route may still apply if you started before Sept 2021.', { ukOnly: true }),
    ],
    jobs: { bachelors: [{ title: 'Paralegal', keyword: 'paralegal', seniority: 'junior', salary: '£22k–£28k' }, { title: 'Trainee Solicitor', keyword: 'trainee solicitor', seniority: 'graduate', salary: '£28k–£40k' }] },
    fastestRoute: 'Degree → SQE1 & SQE2 → qualifying work experience → admission',
    alternativeRoles: ['Paralegal', 'Legal Executive (CILEX)', 'Compliance Officer'],
  },
  barrister: {
    match: 'barrister',
    regulated: true,
    requirements: [
      req('btc', 'Bar Training Course (BTC)', 'Required academic stage before pupillage.', { href: 'https://www.barstandardsboard.org.uk/' }),
      req('pupillage', 'Pupillage', 'One-year practical training in chambers.'),
    ],
    jobs: { bachelors: [{ title: 'Pupil Barrister', keyword: 'pupil barrister', seniority: 'graduate' }] },
    fastestRoute: 'BTC → pupillage → tenancy',
  },
  legal_assistant: {
    match: 'legal_assistant',
    requirements: [cert('cilex', 'CILEX Paralegal Certificate', 'Recognised paralegal qualification in England & Wales.', { href: 'https://www.cilex.org.uk/' })],
    jobs: { bachelors: [{ title: 'Legal Assistant', keyword: 'legal assistant', seniority: 'junior', salary: '£22k–£28k' }, { title: 'Paralegal', keyword: 'paralegal', seniority: 'junior' }] },
    fastestRoute: 'Paralegal role → CILEX → legal executive pathway',
  },

  // ── Finance ─────────────────────────────────────────────────────────
  accounting: {
    match: 'accounting',
    regulated: false,
    requirements: [
      req('enic', 'UK ENIC Statement', 'Overseas accounting degrees need UK equivalence for ACCA exemptions.', { overseasOnly: true, href: ENIC }),
      cert('acca', 'ACCA / CIMA / ICAEW', 'UK employers expect a recognised professional accounting body.'),
      cert('aat', 'AAT', 'Practical route if you lack full degree exemptions.'),
    ],
    jobs: {
      bachelors: [
        { title: 'Graduate Accountant', keyword: 'graduate accountant', seniority: 'graduate', salary: '£26k–£32k' },
        { title: 'Accounts Assistant', keyword: 'accounts assistant', seniority: 'junior', salary: '£22k–£28k' },
      ],
    },
    fastestRoute: 'ENIC (if overseas) → AAT or ACCA foundations → accounts assistant → qualified accountant',
  },
  finance: {
    match: 'finance',
    requirements: [cert('cfa', 'CFA / CISI', 'Investment roles favour CFA or CISI qualifications.')],
    jobs: { bachelors: [{ title: 'Finance Analyst Graduate', keyword: 'graduate finance analyst', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  banking: {
    match: 'banking',
    requirements: [cert('cisi', 'CISI / IOC', 'Retail and investment banking roles value CISI certificates.')],
    jobs: { bachelors: [{ title: 'Banking Graduate Scheme', keyword: 'banking graduate scheme', seniority: 'graduate', salary: '£28k–£40k' }] },
  },

  // ── Technology ──────────────────────────────────────────────────────
  software_engineering: {
    match: 'software_engineering',
    portfolioRequired: true,
    requirements: [
      req('github', 'GitHub Portfolio', 'UK tech employers review code before interviews — projects matter more than degree title.', { href: 'https://github.com/', kind: 'portfolio' }),
      cert('cloud', 'AWS / Azure Certification', 'Cloud certs differentiate junior developers.', { whenOpenToCourses: true }),
    ],
    jobs: {
      bachelors: [
        { title: 'Junior Software Developer', keyword: 'junior software developer', seniority: 'graduate', salary: '£28k–£38k' },
        { title: 'Graduate Software Engineer', keyword: 'graduate software engineer', seniority: 'graduate', salary: '£30k–£40k' },
      ],
    },
    fastestRoute: 'Portfolio (3 projects) → junior dev applications → mid-level within 2–3 years',
    alternativeRoles: ['QA Tester', 'IT Support (entry)', 'Junior DevOps Engineer'],
    interviewTips: ['Prepare to walk through a GitHub project live.', 'Practice coding tests on HackerRank or LeetCode.'],
  },
  web_development: {
    match: 'web_development',
    portfolioRequired: true,
    requirements: [req('portfolio', 'Live Project Portfolio', 'Deploy 2–3 sites (React, Next.js) — UK agencies hire on evidence.', { kind: 'portfolio' })],
    jobs: { bachelors: [{ title: 'Junior Web Developer', keyword: 'junior web developer', seniority: 'graduate', salary: '£24k–£32k' }] },
  },
  cyber_security: {
    match: 'cyber_security',
    requirements: [
      cert('security_plus', 'CompTIA Security+', 'Foundational cert recognised by UK cyber employers.'),
      cert('cissp', 'CISSP / CISM', 'For mid-level security roles after experience.'),
    ],
    jobs: { bachelors: [{ title: 'Junior Cyber Security Analyst', keyword: 'junior cyber security analyst', seniority: 'junior', salary: '£28k–£38k' }] },
    fastestRoute: 'Security+ → SOC analyst role → specialist certs',
  },
  data_science: {
    match: 'data_science',
    portfolioRequired: true,
    requirements: [
      req('portfolio', 'Kaggle / GitHub Projects', 'Show end-to-end ML projects with business outcomes.', { kind: 'portfolio' }),
      cert('sql', 'SQL + Python Evidence', 'Technical tests focus on pandas, SQL, and statistics.'),
    ],
    jobs: { bachelors: [{ title: 'Junior Data Analyst', keyword: 'junior data analyst', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  artificial_intelligence: {
    match: 'artificial_intelligence',
    portfolioRequired: true,
    requirements: [req('portfolio', 'AI Project Portfolio', 'Demonstrate LLM, CV, or NLP projects with reproducible code.', { kind: 'portfolio' })],
    jobs: { bachelors: [{ title: 'Junior ML Engineer', keyword: 'junior machine learning engineer', seniority: 'graduate', salary: '£32k–£45k' }] },
  },
  devops: {
    match: 'devops',
    requirements: [cert('aws', 'AWS / Azure DevOps', 'Cloud platform certification expected.'), cert('k8s', 'Kubernetes (CKA)', 'Container orchestration skills in high demand.')],
    jobs: { bachelors: [{ title: 'Junior DevOps Engineer', keyword: 'junior devops engineer', seniority: 'junior', salary: '£32k–£42k' }] },
  },

  // ── Engineering ─────────────────────────────────────────────────────
  civil_engineering: {
    match: 'civil_engineering',
    regulated: true,
    requirements: [
      req('ice', 'ICE Graduate Membership', 'Institution of Civil Engineers — chartership pathway.', { href: 'https://www.ice.org.uk/' }),
      req('cscs', 'CSCS Card', 'Required for site visits and site-based roles.', { href: '/career-hub?route=construction-trades' }),
      req('engc', 'Engineering Council (CEng route)', 'Chartered Engineer status through ICE.', { href: 'https://www.engc.org.uk/' }),
    ],
    jobs: { bachelors: [{ title: 'Graduate Civil Engineer', keyword: 'graduate civil engineer', seniority: 'graduate', salary: '£28k–£35k' }] },
    promotionPath: ['Graduate Engineer', 'Site Engineer', 'Project Engineer', 'Chartered Engineer', 'Project Director'],
  },
  mechanical_engineering: {
    match: 'mechanical_engineering',
    requirements: [
      req('imeche', 'IMechE Membership', 'Chartered engineer pathway via IMechE.', { href: 'https://www.imeche.org/' }),
      cert('cscs', 'CSCS Card', 'Needed for site and manufacturing plant roles.'),
    ],
    jobs: { bachelors: [{ title: 'Graduate Mechanical Engineer', keyword: 'graduate mechanical engineer', seniority: 'graduate', salary: '£28k–£36k' }] },
  },
  electrical_engineering: {
    match: 'electrical_engineering',
    requirements: [
      req('iet', 'IET Membership', 'Institution of Engineering and Technology — CEng route.'),
      cert('ecs', 'ECS Gold Card', 'Electrotechnical Certification Scheme for site electrical work.'),
    ],
    jobs: { bachelors: [{ title: 'Graduate Electrical Engineer', keyword: 'graduate electrical engineer', seniority: 'graduate' }] },
  },
  architecture: {
    match: 'architecture',
    regulated: true,
    requirements: [
      req('arb', 'ARB Registration', 'Architects Registration Board — required to use title Architect.', { href: 'https://www.arb.org.uk/' }),
      req('riba', 'RIBA Part 3', 'Complete RIBA chartership for full architect status.', { href: 'https://www.architecture.com/' }),
    ],
    jobs: { bachelors: [{ title: 'Part 1 Architectural Assistant', keyword: 'part 1 architectural assistant', seniority: 'graduate', salary: '£24k–£30k' }] },
    portfolioRequired: true,
  },

  // ── Trades & Construction ───────────────────────────────────────────
  plumbing: {
    match: 'plumbing',
    requirements: [
      req('gas_safe', 'Gas Safe Register', 'Mandatory for gas installation work.', { href: 'https://www.gassaferegister.co.uk/' }),
      req('cscs', 'CSCS Card', 'Required on most UK construction sites.'),
      cert('nvq_plumbing', 'NVQ Level 2/3 Plumbing', 'Employers expect formal plumbing NVQ for skilled roles.'),
    ],
    jobs: { bachelors: [{ title: 'Plumber', keyword: 'plumber', seniority: 'mid', salary: '£30k–£45k' }, { title: 'Plumber Mate', keyword: 'plumber mate', seniority: 'junior' }] },
    fastestRoute: 'NVQ plumbing → CSCS → Gas Safe (if gas) → employed or self-employed plumber',
    alternativeRoles: ['Maintenance Operative', 'Heating Engineer'],
  },
  electrical_installation: {
    match: 'electrical_installation',
    requirements: [
      req('niceic', 'NICEIC / NAPIT Registration', 'Required for self-certification of electrical work.', { href: 'https://www.niceic.com/' }),
      req('ecs', 'ECS Gold Card', 'Electrotechnical Certification Scheme card for site work.'),
      cert('nvq_electrical', 'NVQ Level 3 Electrical', 'Expected qualification for electrician roles.'),
    ],
    jobs: { bachelors: [{ title: 'Electrician', keyword: 'electrician', seniority: 'mid', salary: '£32k–£48k' }] },
    fastestRoute: 'Apprenticeship or NVQ → ECS → AM2 assessment → NICEIC registered electrician',
  },
  carpentry: {
    match: 'carpentry',
    requirements: [req('cscs', 'CSCS Card', 'Site access requirement.'), cert('nvq_carpentry', 'NVQ Level 2 Carpentry', 'Standard trade qualification.')],
    jobs: { bachelors: [{ title: 'Carpenter', keyword: 'carpenter', seniority: 'mid', salary: '£28k–£40k' }] },
  },
  bricklaying: {
    match: 'bricklaying',
    requirements: [req('cscs', 'CSCS Card', 'Mandatory for construction sites.'), cert('nvq_bricklaying', 'NVQ Level 2 Bricklaying', 'Trade qualification.')],
    jobs: { bachelors: [{ title: 'Bricklayer', keyword: 'bricklayer', seniority: 'mid', salary: '£28k–£38k' }] },
  },
  quantity_surveying: {
    match: 'quantity_surveying',
    requirements: [req('rics', 'RICS Membership (MRICS route)', 'Royal Institution of Chartered Surveyors.', { href: 'https://www.rics.org/' })],
    jobs: { bachelors: [{ title: 'Graduate Quantity Surveyor', keyword: 'graduate quantity surveyor', seniority: 'graduate', salary: '£28k–£35k' }] },
  },
  quantity_surveying_construction: {
    match: 'quantity_surveying_construction',
    requirements: [req('rics', 'RICS APC Route', 'Assessment of Professional Competence for chartered QS.')],
    jobs: { bachelors: [{ title: 'Assistant Quantity Surveyor', keyword: 'assistant quantity surveyor', seniority: 'graduate' }] },
  },
  building_surveying: {
    match: 'building_surveying',
    requirements: [req('rics', 'RICS Building Surveying APC', 'Chartered building surveyor route.')],
    jobs: { bachelors: [{ title: 'Graduate Building Surveyor', keyword: 'graduate building surveyor', seniority: 'graduate' }] },
  },

  // ── Science & Laboratory ────────────────────────────────────────────
  biology: {
    match: 'biology',
    requirements: [cert('rsci', 'Registered Scientist (RSci)', 'Science Council professional registration.', { href: 'https://sciencecouncil.org/' })],
    jobs: { bachelors: [{ title: 'Research Technician', keyword: 'biology research technician', seniority: 'graduate', salary: '£24k–£30k' }, { title: 'Laboratory Technician', keyword: 'laboratory technician', seniority: 'junior' }] },
    alternativeRoles: ['Science Communicator', 'Pharmaceutical QA Technician', 'Ecology Field Assistant'],
  },
  chemistry: {
    match: 'chemistry',
    requirements: [cert('rsci', 'RSci Registration', 'Professional registration for scientists.'), cert('gmp', 'GMP / Laboratory Safety', 'Required in pharma manufacturing.')],
    jobs: { bachelors: [{ title: 'Analytical Chemist', keyword: 'analytical chemist', seniority: 'graduate', salary: '£26k–£35k' }] },
  },
  microbiology: {
    match: 'microbiology',
    requirements: [req('ibms', 'IBMS / HCPC (if clinical)', 'Clinical microbiology requires HCPC registration.'), cert('gmp', 'GLP/GMP Training', 'Lab compliance in pharma and NHS.')],
    jobs: { bachelors: [{ title: 'Microbiology Laboratory Technician', keyword: 'microbiology laboratory', seniority: 'graduate' }] },
  },
  biotechnology: {
    match: 'biotechnology',
    requirements: [cert('gxp', 'GxP Compliance Training', 'Expected in biotech and pharma manufacturing.')],
    jobs: { bachelors: [{ title: 'Biotech Research Associate', keyword: 'biotechnology research', seniority: 'graduate', salary: '£26k–£34k' }] },
  },

  // ── Creative & Media ──────────────────────────────────────────────────
  graphic_design: {
    match: 'graphic_design',
    portfolioRequired: true,
    requirements: [req('portfolio', 'Design Portfolio (Behance / website)', 'UK agencies hire on portfolio quality, not degree alone.', { kind: 'portfolio', href: 'https://www.behance.net/' })],
    jobs: { bachelors: [{ title: 'Junior Graphic Designer', keyword: 'junior graphic designer', seniority: 'graduate', salary: '£22k–£28k' }] },
    fastestRoute: 'Portfolio (5–8 pieces) → junior designer → agency or in-house',
  },
  ux_ui_design: {
    match: 'ux_ui_design',
    portfolioRequired: true,
    requirements: [req('portfolio', 'UX Case Studies', 'Show research, wireframes, and usability outcomes — not just visuals.', { kind: 'portfolio' })],
    jobs: { bachelors: [{ title: 'Junior UX Designer', keyword: 'junior UX designer', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  film_video: {
    match: 'film_video',
    portfolioRequired: true,
    requirements: [req('showreel', 'Showreel / Vimeo Portfolio', 'Editors and producers hire on demonstrated work.', { kind: 'portfolio' })],
    jobs: { bachelors: [{ title: 'Video Editor', keyword: 'video editor', seniority: 'junior', salary: '£22k–£30k' }, { title: 'Production Runner', keyword: 'production runner', seniority: 'junior' }] },
  },
  animation: {
    match: 'animation',
    portfolioRequired: true,
    requirements: [req('showreel', 'Animation Showreel', 'Demo reel is essential for UK animation studios.')],
    jobs: { bachelors: [{ title: 'Junior Animator', keyword: 'junior animator', seniority: 'graduate', salary: '£24k–£32k' }] },
  },
  journalism: {
    match: 'journalism',
    portfolioRequired: true,
    requirements: [req('nctj', 'NCTJ Diploma', 'National Council for the Training of Journalists — expected by UK newsrooms.', { href: 'https://www.nctj.com/' })],
    jobs: { bachelors: [{ title: 'Junior Journalist', keyword: 'junior journalist', seniority: 'graduate', salary: '£22k–£28k' }, { title: 'Content Writer', keyword: 'content writer', seniority: 'junior' }] },
    fastestRoute: 'NCTJ → local newsroom trainee → staff journalist',
  },
  public_relations: {
    match: 'public_relations',
    requirements: [cert('cipr', 'CIPR Foundation', 'Chartered Institute of PR — valued by UK agencies.', { href: 'https://www.cipr.co.uk/' })],
    jobs: { bachelors: [{ title: 'PR Account Executive', keyword: 'PR account executive', seniority: 'graduate', salary: '£24k–£30k' }] },
  },
  broadcasting: {
    match: 'broadcasting',
    portfolioRequired: true,
    requirements: [req('showreel', 'Broadcast Showreel', 'Demo tape or produced segments for TV/radio applications.')],
    jobs: { bachelors: [{ title: 'Broadcast Assistant', keyword: 'broadcast assistant', seniority: 'junior' }, { title: 'Researcher TV', keyword: 'TV researcher', seniority: 'junior' }] },
  },

  // ── Hospitality ─────────────────────────────────────────────────────
  chef: {
    match: 'chef',
    requirements: [
      cert('food_hygiene', 'Food Hygiene Level 3', 'Required in UK catering kitchens.'),
      cert('allergy', 'Food Allergen Awareness', 'Expected by UK hospitality employers.'),
    ],
    jobs: { bachelors: [{ title: 'Commis Chef', keyword: 'commis chef', seniority: 'junior', salary: '£22k–£26k' }, { title: 'Chef de Partie', keyword: 'chef de partie', seniority: 'mid', salary: '£26k–£32k' }] },
    fastestRoute: 'Food hygiene → commis chef → chef de partie → sous chef',
  },
  hotel_management: {
    match: 'hotel_management',
    requirements: [cert('ioh', 'Institute of Hospitality Membership', 'Professional body for hotel managers.')],
    jobs: { bachelors: [{ title: 'Hotel Management Trainee', keyword: 'hotel management trainee', seniority: 'graduate', salary: '£24k–£30k' }] },
  },

  // ── Social Care ─────────────────────────────────────────────────────
  social_worker: {
    match: 'social_worker',
    regulated: true,
    requirements: [
      req('swte', 'Social Work England Registration', 'Mandatory for practising social workers in England.', { href: 'https://www.socialworkengland.org.uk/' }),
      req('dbs', 'Enhanced DBS Check', 'Required for all social work roles.'),
    ],
    jobs: { bachelors: [{ title: 'Social Worker', keyword: 'social worker', seniority: 'graduate', salary: '£28k–£36k' }] },
    fastestRoute: 'Social Work England registration → ASYE → qualified social worker post',
  },
  care_assistant: {
    match: 'care_assistant',
    requirements: [
      req('dbs', 'Enhanced DBS Check', 'Mandatory for care roles.'),
      cert('care_cert', 'Care Certificate', '15 standards expected by CQC-registered providers.'),
    ],
    jobs: { bachelors: [{ title: 'Care Assistant', keyword: 'care assistant', seniority: 'junior', salary: '£22k–£26k' }, { title: 'Support Worker', keyword: 'support worker', seniority: 'junior' }] },
    fastestRoute: 'Care Certificate → care assistant → senior support worker',
  },

  // ── Logistics ───────────────────────────────────────────────────────
  hgv_driver: {
    match: 'hgv_driver',
    requirements: [
      req('hgv_licence', 'HGV / LGV Licence (Cat C/C+E)', 'Legal requirement for professional HGV driving.'),
      cert('driver_cpc', 'Driver CPC', 'Certificate of Professional Competence for commercial drivers.'),
    ],
    jobs: { bachelors: [{ title: 'HGV Driver', keyword: 'HGV driver', seniority: 'mid', salary: '£30k–£40k' }] },
    fastestRoute: 'Car licence → Cat C training → Driver CPC → agency or direct hire',
  },
  warehouse_operations: {
    match: 'warehouse_operations',
    requirements: [cert('forklift', 'Forklift Licence (FLT)', 'Increases warehouse employability significantly.')],
    jobs: { bachelors: [{ title: 'Warehouse Supervisor', keyword: 'warehouse supervisor', seniority: 'mid', salary: '£26k–£32k' }, { title: 'Warehouse Operative', keyword: 'warehouse operative', seniority: 'junior' }] },
  },

  // ── Property ────────────────────────────────────────────────────────
  estate_agent: {
    match: 'estate_agent',
    requirements: [cert('naea', 'NAEA Propertymark', 'National Association of Estate Agents qualification.')],
    jobs: { bachelors: [{ title: 'Trainee Estate Agent', keyword: 'trainee estate agent', seniority: 'junior', salary: '£20k–£28k + commission' }] },
  },
  surveyor_property: {
    match: 'surveyor_property',
    requirements: [req('rics', 'RICS APC (Residential/Commercial)', 'Chartered surveyor qualification.')],
    jobs: { bachelors: [{ title: 'Graduate Surveyor', keyword: 'graduate surveyor property', seniority: 'graduate' }] },
  },

  // ── Public Sector ───────────────────────────────────────────────────
  civil_service: {
    match: 'civil_service',
    requirements: [req('civil_service_test', 'Civil Service Online Tests', 'Sift stage for Fast Stream and EO roles.', { href: 'https://www.civil-service-careers.gov.uk/' })],
    jobs: { bachelors: [{ title: 'Civil Service Executive Officer', keyword: 'civil service executive officer', seniority: 'graduate', salary: '£28k–£35k' }, { title: 'Fast Stream Graduate', keyword: 'civil service fast stream', seniority: 'graduate', salary: '£30k–£38k' }] },
    fastestRoute: 'Civil Service jobs portal → online tests → assessment centre → offer',
  },
  local_government: {
    match: 'local_government',
    jobs: { bachelors: [{ title: 'Local Government Officer', keyword: 'local government officer', seniority: 'graduate', salary: '£26k–£34k' }] },
    fastestRoute: 'Council direct applications → structured interview → role',
  },

  // ── Manufacturing ───────────────────────────────────────────────────
  production_engineer: {
    match: 'production_engineer',
    requirements: [cert('six_sigma', 'Six Sigma / Lean Manufacturing', 'Valued in UK manufacturing and FMCG.')],
    jobs: { bachelors: [{ title: 'Production Engineer', keyword: 'production engineer', seniority: 'graduate', salary: '£28k–£38k' }] },
  },
  quality_assurance: {
    match: 'quality_assurance',
    requirements: [cert('iso9001', 'ISO 9001 Internal Auditor', 'QA roles in manufacturing expect ISO knowledge.')],
    jobs: { bachelors: [{ title: 'QA Technician', keyword: 'QA technician', seniority: 'junior', salary: '£24k–£30k' }] },
  },
}

/** Pattern fallbacks when no exact specialisation match exists. */
export const PATTERN_BLUEPRINTS: Array<{ pattern: RegExp; blueprint: Partial<SpecialisationBlueprint> }> = [
  {
    pattern: /teacher|teaching|education$/i,
    blueprint: {
      regulated: true,
      requirements: [
        req('qts', 'Qualified Teacher Status (QTS)', 'Required for most UK state school teaching.'),
        req('dbs', 'Enhanced DBS Check', 'Mandatory for education roles with children.'),
      ],
    },
  },
  {
    pattern: /nurse|nursing/i,
    blueprint: {
      regulated: true,
      requirements: [req('nmc', 'NMC Registration', 'Mandatory for nursing practice in the UK.', { href: 'https://www.nmc.org.uk/' })],
    },
  },
  {
    pattern: /engineer/i,
    blueprint: {
      requirements: [
        req('graduate_scheme', 'Graduate Scheme Applications', 'Structured programmes are the fastest UK engineering entry route.'),
        cert('cscs', 'CSCS Card', 'Needed for site-based engineering roles.'),
      ],
    },
  },
  {
    pattern: /laboratory|lab_/i,
    blueprint: {
      requirements: [
        cert('ibms', 'IBMS / Lab Competency', 'NHS and pharma labs expect formal competency standards.'),
        cert('glp', 'GLP / GMP Awareness', 'Good laboratory and manufacturing practice.'),
      ],
      jobs: {
        bachelors: [{ title: 'Laboratory Technician', keyword: 'laboratory technician', seniority: 'graduate', salary: '£22k–£28k' }],
      },
    },
  },
  {
    pattern: /design|creative|artist|film|photo|music/i,
    blueprint: { portfolioRequired: true, requirements: [req('portfolio', 'Professional Portfolio', 'UK creative employers hire on demonstrated work.', { kind: 'portfolio' })] },
  },
  {
    pattern: /developer|software|programming|devops|data_/i,
    blueprint: {
      portfolioRequired: true,
      requirements: [req('github', 'GitHub / Project Portfolio', 'Evidence of working code is essential for UK tech hiring.', { kind: 'portfolio', href: 'https://github.com/' })],
    },
  },
  {
    pattern: /plumb|electric|carpent|brick|roof|paint/i,
    blueprint: {
      requirements: [
        req('cscs', 'CSCS Card', 'Required for UK construction site access.'),
        cert('nvq', 'NVQ Trade Qualification', 'Employers expect NVQ Level 2/3 for skilled trade roles.'),
      ],
    },
  },
]

export function lookupBlueprint(
  specialisationId: string,
  label: string
): SpecialisationBlueprint | null {
  const exact = SPECIALISATION_BLUEPRINTS[specialisationId]
  if (exact) return exact

  const text = `${specialisationId} ${label}`.toLowerCase()
  for (const { pattern, blueprint } of PATTERN_BLUEPRINTS) {
    if (pattern.test(text)) {
      return { match: pattern, ...blueprint } as SpecialisationBlueprint
    }
  }

  return null
}
