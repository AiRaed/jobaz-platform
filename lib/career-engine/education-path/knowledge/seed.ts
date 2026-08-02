/**
 * Structured knowledge base for education fields.
 * Seed data — production loads from `career_education_fields` table when available.
 */

import type { EducationFieldId, EducationFieldKnowledge } from '../types'

function field(partial: EducationFieldKnowledge): EducationFieldKnowledge {
  return partial
}

export const EDUCATION_FIELD_KNOWLEDGE: Record<EducationFieldId, EducationFieldKnowledge> = {
  engineering: field({
    id: 'engineering',
    label: 'Engineering',
    goalRole: 'Professional Engineer',
    careerHubPathId: 'construction-trades',
    typicalJobs: [
      { title: 'Graduate Engineer', seniority: 'graduate', searchKeyword: 'graduate engineer', salaryRange: '£28k–£35k' },
      { title: 'CAD Technician', seniority: 'junior', searchKeyword: 'CAD technician', salaryRange: '£24k–£32k' },
      { title: 'Site Coordinator', seniority: 'junior', searchKeyword: 'site coordinator construction', salaryRange: '£26k–£34k' },
      { title: 'Design Engineer', seniority: 'mid', searchKeyword: 'design engineer', salaryRange: '£32k–£45k' },
      { title: 'Senior Engineer', seniority: 'senior', searchKeyword: 'senior engineer', salaryRange: '£45k–£60k' },
      { title: 'Research Engineer', seniority: 'research', searchKeyword: 'research engineer', salaryRange: '£35k–£50k' },
    ],
    graduateJobs: [
      { title: 'Graduate Civil Engineer', seniority: 'graduate', searchKeyword: 'graduate civil engineer', salaryRange: '£28k–£35k' },
      { title: 'Graduate Mechanical Engineer', seniority: 'graduate', searchKeyword: 'graduate mechanical engineer', salaryRange: '£28k–£36k' },
      { title: 'Engineering Technician', seniority: 'junior', searchKeyword: 'engineering technician', salaryRange: '£24k–£30k' },
    ],
    professionalRegistration: [
      {
        id: 'engc',
        title: 'Engineering Council registration (CEng / IEng)',
        description: 'Chartered or Incorporated Engineer status through a professional body (IMechE, ICE, IET).',
        priority: 'recommended',
      },
      {
        id: 'graduate_scheme',
        title: 'Graduate Scheme Applications',
        description: 'Structured employer programmes are the fastest route for UK engineering graduates.',
        href: '/job-finder?query=graduate%20engineering%20scheme',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas engineering degrees typically need UK ENIC statement and professional body evaluation before chartered routes.',
      bodies: ['UK ENIC', 'Engineering Council', 'IMechE / ICE / IET'],
    },
    careerProgression: [
      'Graduate Engineer',
      'Project Engineer',
      'Senior Engineer',
      'Engineering Manager',
      'Chartered Engineer',
    ],
    recommendedCourses: [
      {
        id: 'autocad',
        title: 'AutoCAD',
        whyReasons: [
          'Frequently required by UK employers.',
          'Improves interview opportunities.',
          'Strengthens your CV.',
        ],
        duration: '4–8 weeks',
        costLabel: 'Paid',
        qualification: 'Certificate',
        pathId: 'construction-trades',
      },
      {
        id: 'cscs',
        title: 'CSCS Card',
        whyReasons: [
          'Required for many construction and site roles.',
          'Helps access more vacancies.',
        ],
        duration: '1 Day',
        costLabel: 'Paid',
        qualification: 'CSCS Card',
        pathId: 'construction-trades',
        slug: 'cscs-card',
      },
    ],
    professionalCertifications: [
      {
        id: 'hse',
        title: 'Health & Safety (NEBOSH / IOSH)',
        whyReasons: ['Expected on site-based engineering roles.', 'Demonstrates UK workplace awareness.'],
        duration: '2–5 days',
        costLabel: 'Paid',
      },
    ],
    essentialSkills: ['Technical drawing', 'Project documentation', 'Health & safety', 'Team collaboration', 'Problem solving'],
    commonEmployers: ['Balfour Beatty', 'Arup', 'Atkins', 'Network Rail', 'Local authorities'],
    transferableRoles: [
      { title: 'Technical Sales Engineer', searchKeyword: 'technical sales engineer' },
      { title: 'Quality Assurance Technician', searchKeyword: 'QA technician' },
    ],
    temporaryEntryRoles: [
      { title: 'Warehouse Operative', searchKeyword: 'warehouse operative', salaryRange: '£24k–£28k' },
      { title: 'Production Operative', searchKeyword: 'production operative', salaryRange: '£23k–£27k' },
    ],
  }),

  healthcare: field({
    id: 'healthcare',
    label: 'Healthcare',
    goalRole: 'Registered Healthcare Professional',
    careerHubPathId: 'care-support',
    typicalJobs: [
      { title: 'Healthcare Assistant', seniority: 'junior', searchKeyword: 'healthcare assistant', salaryRange: '£22k–£26k' },
      { title: 'Support Worker', seniority: 'junior', searchKeyword: 'support worker', salaryRange: '£22k–£25k' },
      { title: 'Clinical Support Worker', seniority: 'mid', searchKeyword: 'clinical support worker', salaryRange: '£24k–£30k' },
      { title: 'Senior Healthcare Assistant', seniority: 'senior', searchKeyword: 'senior healthcare assistant', salaryRange: '£26k–£32k' },
      { title: 'Research Assistant (Clinical)', seniority: 'research', searchKeyword: 'clinical research assistant', salaryRange: '£28k–£35k' },
    ],
    graduateJobs: [
      { title: 'Graduate Healthcare Assistant', seniority: 'graduate', searchKeyword: 'healthcare assistant graduate', salaryRange: '£22k–£26k' },
      { title: 'Nursing Associate', seniority: 'graduate', searchKeyword: 'nursing associate', salaryRange: '£25k–£30k' },
      { title: 'Physiotherapy Support Worker', seniority: 'junior', searchKeyword: 'physiotherapy assistant', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [
      {
        id: 'nmc',
        title: 'NMC / HCPC Professional Registration',
        description: 'Nursing and allied health roles require UK regulator registration before practising.',
        priority: 'critical',
      },
      {
        id: 'dbs',
        title: 'Enhanced DBS Check',
        description: 'Mandatory for all patient-facing healthcare roles in the UK.',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas healthcare qualifications require NMC, HCPC, or GMC recognition — often with OSCE, CBT, or adaptation programmes.',
      bodies: ['NMC', 'HCPC', 'GMC', 'UK ENIC'],
    },
    careerProgression: [
      'Healthcare Assistant',
      'Senior Healthcare Assistant',
      'Nursing Associate',
      'Registered Nurse',
      'Clinical Team Leader',
    ],
    recommendedCourses: [
      {
        id: 'care_cert',
        title: 'Care Certificate',
        whyReasons: [
          'Standard UK entry requirement for care roles.',
          'Opens more NHS and private vacancies.',
        ],
        duration: '4–8 weeks',
        costLabel: 'Funded',
        qualification: 'Care Certificate',
        pathId: 'care-support',
        slug: 'care-certificate',
      },
    ],
    professionalCertifications: [
      {
        id: 'moving_handling',
        title: 'Moving & Handling / Manual Handling',
        whyReasons: ['Required by most care employers.', 'Speeds up onboarding.'],
        duration: '1 Day',
        costLabel: 'Low cost',
      },
    ],
    essentialSkills: ['Patient care', 'Communication', 'Safeguarding', 'Record keeping', 'Teamwork'],
    commonEmployers: ['NHS Trusts', 'Care homes', 'Bupa', 'Spire Healthcare', 'Local councils'],
    transferableRoles: [
      { title: 'Medical Receptionist', searchKeyword: 'medical receptionist' },
      { title: 'Pharmacy Assistant', searchKeyword: 'pharmacy assistant' },
    ],
    temporaryEntryRoles: [
      { title: 'Domestic Assistant (Hospital)', searchKeyword: 'hospital domestic', salaryRange: '£21k–£24k' },
      { title: 'Porter', searchKeyword: 'hospital porter', salaryRange: '£22k–£25k' },
    ],
  }),

  business_finance: field({
    id: 'business_finance',
    label: 'Business & Finance',
    goalRole: 'Finance or Business Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Finance Assistant', seniority: 'junior', searchKeyword: 'finance assistant', salaryRange: '£24k–£30k' },
      { title: 'Accounts Assistant', seniority: 'junior', searchKeyword: 'accounts assistant', salaryRange: '£24k–£32k' },
      { title: 'Business Analyst', seniority: 'mid', searchKeyword: 'junior business analyst', salaryRange: '£30k–£40k' },
      { title: 'Management Accountant', seniority: 'senior', searchKeyword: 'management accountant', salaryRange: '£38k–£50k' },
      { title: 'Research Analyst', seniority: 'research', searchKeyword: 'research analyst finance', salaryRange: '£32k–£42k' },
    ],
    graduateJobs: [
      { title: 'Graduate Finance Analyst', seniority: 'graduate', searchKeyword: 'graduate finance analyst', salaryRange: '£26k–£35k' },
      { title: 'Graduate Trainee Accountant', seniority: 'graduate', searchKeyword: 'graduate trainee accountant', salaryRange: '£25k–£32k' },
      { title: 'Admin Assistant (Finance)', seniority: 'junior', searchKeyword: 'finance admin assistant', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [
      {
        id: 'acca',
        title: 'Professional Membership (ACCA / CIMA / ICAEW)',
        description: 'Chartered accountancy routes require UK-recognised professional body progression.',
        priority: 'recommended',
      },
      {
        id: 'graduate_scheme',
        title: 'Graduate Scheme Applications',
        description: 'Big Four and corporate finance graduate programmes are key entry routes.',
        href: '/job-finder?query=graduate%20finance%20scheme',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas accounting degrees may need UK ENIC evaluation and ACCA/CIMA exemptions assessment.',
      bodies: ['UK ENIC', 'ACCA', 'CIMA', 'ICAEW'],
    },
    careerProgression: [
      'Graduate Analyst',
      'Assistant Accountant',
      'Management Accountant',
      'Finance Manager',
      'Finance Director',
    ],
    recommendedCourses: [
      {
        id: 'excel',
        title: 'Advanced Excel for Finance',
        whyReasons: ['Expected in most finance interviews.', 'Demonstrates practical UK workplace skills.'],
        duration: '2–4 weeks',
        costLabel: 'Paid',
        pathId: 'office-admin',
      },
      {
        id: 'bookkeeping',
        title: 'AAT Bookkeeping',
        whyReasons: ['Recognised UK entry qualification.', 'Bridges overseas finance experience.'],
        duration: '8–12 weeks',
        costLabel: 'Paid',
        qualification: 'AAT Certificate',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Excel', 'Financial reporting', 'Attention to detail', 'Communication', 'Analysis'],
    commonEmployers: ['Big Four firms', 'Banks', 'SMEs', 'Local government', 'Retail head offices'],
    transferableRoles: [
      { title: 'Office Administrator', searchKeyword: 'office administrator' },
      { title: 'Customer Service Advisor', searchKeyword: 'customer service advisor' },
    ],
    temporaryEntryRoles: [
      { title: 'Retail Assistant', searchKeyword: 'retail assistant', salaryRange: '£22k–£25k' },
      { title: 'Data Entry Clerk', searchKeyword: 'data entry', salaryRange: '£22k–£26k' },
    ],
  }),

  it: field({
    id: 'it',
    label: 'IT',
    goalRole: 'IT Professional',
    careerHubPathId: 'digital-ai-beginner',
    typicalJobs: [
      { title: 'IT Support Technician', seniority: 'junior', searchKeyword: 'IT support technician', salaryRange: '£24k–£32k' },
      { title: 'Junior Developer', seniority: 'junior', searchKeyword: 'junior developer', salaryRange: '£28k–£38k' },
      { title: 'Systems Administrator', seniority: 'mid', searchKeyword: 'systems administrator', salaryRange: '£32k–£45k' },
      { title: 'Senior Developer', seniority: 'senior', searchKeyword: 'senior software developer', salaryRange: '£50k–£70k' },
      { title: 'Research Software Engineer', seniority: 'research', searchKeyword: 'research software engineer', salaryRange: '£38k–£55k' },
    ],
    graduateJobs: [
      { title: 'Graduate Software Developer', seniority: 'graduate', searchKeyword: 'graduate software developer', salaryRange: '£28k–£38k' },
      { title: 'Graduate IT Support', seniority: 'graduate', searchKeyword: 'graduate IT support', salaryRange: '£24k–£30k' },
      { title: 'Junior QA Tester', seniority: 'junior', searchKeyword: 'junior QA tester', salaryRange: '£25k–£32k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'IT degrees are often recognised via portfolio and technical assessment; UK ENIC helps for visa-sponsored roles.',
      bodies: ['UK ENIC'],
    },
    careerProgression: [
      'Junior Developer',
      'Software Engineer',
      'Senior Engineer',
      'Tech Lead',
      'Engineering Manager',
    ],
    recommendedCourses: [
      {
        id: 'cloud',
        title: 'Cloud Fundamentals (AWS / Azure)',
        whyReasons: ['Highly valued by UK employers.', 'Improves employability for support and dev roles.'],
        duration: '4–8 weeks',
        costLabel: 'Paid',
        pathId: 'digital-ai-beginner',
      },
    ],
    professionalCertifications: [
      {
        id: 'comptia',
        title: 'CompTIA A+ / Security+',
        whyReasons: ['Industry-standard entry certifications.', 'Helps overseas graduates prove UK-ready skills.'],
        duration: '4–12 weeks',
        costLabel: 'Paid',
      },
    ],
    essentialSkills: ['Programming', 'Troubleshooting', 'Cloud basics', 'Agile teamwork', 'Documentation'],
    commonEmployers: ['Tech startups', 'Banks', 'Consultancies', 'NHS Digital', 'Retail IT'],
    transferableRoles: [
      { title: 'Digital Marketing Assistant', searchKeyword: 'digital marketing assistant' },
      { title: 'Data Entry / Admin', searchKeyword: 'data administrator' },
    ],
    temporaryEntryRoles: [
      { title: 'Warehouse IT Asset Handler', searchKeyword: 'warehouse operative', salaryRange: '£24k–£28k' },
    ],
  }),

  education: field({
    id: 'education',
    label: 'Education',
    goalRole: 'Education Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Teaching Assistant', seniority: 'junior', searchKeyword: 'teaching assistant', salaryRange: '£20k–£24k' },
      { title: 'Learning Support Assistant', seniority: 'junior', searchKeyword: 'learning support assistant', salaryRange: '£20k–£25k' },
      { title: 'Cover Supervisor', seniority: 'mid', searchKeyword: 'cover supervisor', salaryRange: '£22k–£28k' },
      { title: 'HLTA', seniority: 'senior', searchKeyword: 'HLTA', salaryRange: '£24k–£30k' },
      { title: 'Education Research Assistant', seniority: 'research', searchKeyword: 'education research assistant', salaryRange: '£26k–£32k' },
    ],
    graduateJobs: [
      { title: 'Graduate Teaching Assistant', seniority: 'graduate', searchKeyword: 'graduate teaching assistant', salaryRange: '£20k–£24k' },
      { title: 'SEN Teaching Assistant', seniority: 'graduate', searchKeyword: 'SEN teaching assistant', salaryRange: '£22k–£26k' },
      { title: 'Trainee Teacher (PGCE route)', seniority: 'graduate', searchKeyword: 'trainee teacher', salaryRange: '£25k–£30k' },
    ],
    professionalRegistration: [
      {
        id: 'qts',
        title: 'QTS / Teaching Registration',
        description: 'Qualified Teacher Status is required for classroom teaching in England.',
        priority: 'critical',
      },
      {
        id: 'dbs_edu',
        title: 'Enhanced DBS Check',
        description: 'Mandatory for all school-based roles.',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas teaching qualifications need UK ENIC evaluation and DfE QTS assessment or iQTS route.',
      bodies: ['UK ENIC', 'DfE', 'TRN'],
    },
    careerProgression: [
      'Teaching Assistant',
      'HLTA',
      'Qualified Teacher',
      'Head of Department',
      'Assistant Headteacher',
    ],
    recommendedCourses: [
      {
        id: 'level3_ta',
        title: 'Level 3 Teaching Assistant',
        whyReasons: ['Required for progression to HLTA.', 'Strengthens school applications.'],
        duration: '6–12 months',
        costLabel: 'Funded',
        qualification: 'Level 3 TA',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Safeguarding', 'Behaviour management', 'Lesson support', 'SEN awareness', 'Communication'],
    commonEmployers: ['Academies', 'Local authority schools', 'SEN schools', 'Supply agencies'],
    transferableRoles: [
      { title: 'After School Club Leader', searchKeyword: 'after school club' },
      { title: 'Youth Worker', searchKeyword: 'youth worker' },
    ],
    temporaryEntryRoles: [
      { title: 'School Administrator', searchKeyword: 'school administrator', salaryRange: '£20k–£24k' },
    ],
  }),

  law: field({
    id: 'law',
    label: 'Law',
    goalRole: 'Legal Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Legal Assistant', seniority: 'junior', searchKeyword: 'legal assistant', salaryRange: '£22k–£28k' },
      { title: 'Paralegal', seniority: 'mid', searchKeyword: 'paralegal', salaryRange: '£24k–£35k' },
      { title: 'Compliance Officer', seniority: 'mid', searchKeyword: 'compliance officer', salaryRange: '£30k–£42k' },
      { title: 'Senior Paralegal', seniority: 'senior', searchKeyword: 'senior paralegal', salaryRange: '£32k–£45k' },
      { title: 'Legal Researcher', seniority: 'research', searchKeyword: 'legal researcher', salaryRange: '£28k–£38k' },
    ],
    graduateJobs: [
      { title: 'Graduate Paralegal', seniority: 'graduate', searchKeyword: 'graduate paralegal', salaryRange: '£24k–£30k' },
      { title: 'Legal Secretary', seniority: 'junior', searchKeyword: 'legal secretary', salaryRange: '£22k–£28k' },
      { title: 'Trainee Solicitor', seniority: 'graduate', searchKeyword: 'trainee solicitor', salaryRange: '£28k–£38k' },
    ],
    professionalRegistration: [
      {
        id: 'sqe',
        title: 'SRA / SQE Route',
        description: 'Solicitor qualification in England & Wales requires SQE exams and qualifying work experience.',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas law degrees need SRA assessment; direct solicitor practice requires UK qualification route.',
      bodies: ['SRA', 'UK ENIC', 'Bar Standards Board'],
    },
    careerProgression: [
      'Legal Assistant',
      'Paralegal',
      'Trainee Solicitor',
      'Solicitor',
      'Senior Associate',
    ],
    recommendedCourses: [
      {
        id: 'legal_secrets',
        title: 'Legal Secretaries Diploma',
        whyReasons: ['Practical UK legal admin skills.', 'Common entry route for law graduates.'],
        duration: '8–12 weeks',
        costLabel: 'Paid',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Legal research', 'Drafting', 'Case management', 'Attention to detail', 'Client communication'],
    commonEmployers: ['Law firms', 'In-house legal teams', 'Councils', 'Banks', 'Insurance'],
    transferableRoles: [
      { title: 'Compliance Administrator', searchKeyword: 'compliance administrator' },
      { title: 'HR Administrator', searchKeyword: 'HR administrator' },
    ],
    temporaryEntryRoles: [
      { title: 'Receptionist (Legal)', searchKeyword: 'legal receptionist', salaryRange: '£21k–£25k' },
    ],
  }),

  science: field({
    id: 'science',
    label: 'Science',
    goalRole: 'Science Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Laboratory Technician', seniority: 'junior', searchKeyword: 'laboratory technician', salaryRange: '£22k–£28k' },
      { title: 'Research Assistant', seniority: 'junior', searchKeyword: 'research assistant science', salaryRange: '£24k–£30k' },
      { title: 'Quality Control Analyst', seniority: 'mid', searchKeyword: 'quality control analyst', salaryRange: '£28k–£36k' },
      { title: 'Senior Scientist', seniority: 'senior', searchKeyword: 'senior scientist', salaryRange: '£38k–£50k' },
      { title: 'Postdoctoral Researcher', seniority: 'research', searchKeyword: 'postdoctoral researcher', salaryRange: '£35k–£45k' },
    ],
    graduateJobs: [
      { title: 'Graduate Laboratory Technician', seniority: 'graduate', searchKeyword: 'graduate laboratory technician', salaryRange: '£22k–£28k' },
      { title: 'Graduate Research Assistant', seniority: 'graduate', searchKeyword: 'graduate research assistant', salaryRange: '£24k–£30k' },
      { title: 'Science Technician (Schools)', seniority: 'junior', searchKeyword: 'science technician school', salaryRange: '£20k–£26k' },
    ],
    professionalRegistration: [
      {
        id: 'grad_scheme_sci',
        title: 'Graduate Scheme Applications',
        description: 'Pharma, biotech, and research councils run structured graduate programmes.',
        href: '/job-finder?query=graduate%20science',
        priority: 'recommended',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'UK ENIC statement helps employers verify overseas science degrees; regulated lab roles may need additional checks.',
      bodies: ['UK ENIC', 'HCPC (for clinical science)'],
    },
    careerProgression: [
      'Laboratory Technician',
      'Research Assistant',
      'Scientist',
      'Senior Scientist',
      'Laboratory Manager',
    ],
    recommendedCourses: [
      {
        id: 'glp',
        title: 'GLP / GMP Awareness',
        whyReasons: ['Required in pharma and regulated labs.', 'Improves job applications.'],
        duration: '1–2 days',
        costLabel: 'Paid',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Lab techniques', 'Data analysis', 'Report writing', 'Health & safety', 'Quality systems'],
    commonEmployers: ['Universities', 'NHS labs', 'Pharma', 'Food testing', 'Environmental agencies'],
    transferableRoles: [
      { title: 'Quality Assurance Assistant', searchKeyword: 'quality assurance assistant' },
      { title: 'Technical Writer', searchKeyword: 'technical writer' },
    ],
    temporaryEntryRoles: [
      { title: 'Production Operative (Pharma)', searchKeyword: 'production operative', salaryRange: '£23k–£27k' },
    ],
  }),

  creative_arts: field({
    id: 'creative_arts',
    label: 'Creative Arts',
    goalRole: 'Creative Professional',
    careerHubPathId: 'digital-ai-beginner',
    typicalJobs: [
      { title: 'Junior Graphic Designer', seniority: 'junior', searchKeyword: 'junior graphic designer', salaryRange: '£22k–£28k' },
      { title: 'Content Creator', seniority: 'junior', searchKeyword: 'content creator', salaryRange: '£22k–£30k' },
      { title: 'UX Designer', seniority: 'mid', searchKeyword: 'junior UX designer', salaryRange: '£30k–£40k' },
      { title: 'Senior Designer', seniority: 'senior', searchKeyword: 'senior designer', salaryRange: '£38k–£50k' },
      { title: 'Creative Researcher', seniority: 'research', searchKeyword: 'creative researcher', salaryRange: '£28k–£35k' },
    ],
    graduateJobs: [
      { title: 'Graduate Designer', seniority: 'graduate', searchKeyword: 'graduate designer', salaryRange: '£22k–£28k' },
      { title: 'Junior Video Editor', seniority: 'junior', searchKeyword: 'junior video editor', salaryRange: '£22k–£28k' },
      { title: 'Design Intern', seniority: 'graduate', searchKeyword: 'design intern', salaryRange: '£20k–£24k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: {
      requiredForOutsideUk: false,
      summary: 'Creative roles prioritise portfolio over formal recognition; UK ENIC helps for graduate schemes.',
      bodies: ['UK ENIC'],
    },
    careerProgression: [
      'Junior Designer',
      'Designer',
      'Senior Designer',
      'Art Director',
      'Creative Director',
    ],
    recommendedCourses: [
      {
        id: 'adobe',
        title: 'Adobe Creative Suite',
        whyReasons: ['Industry standard for UK design roles.', 'Portfolio quality improves with professional tools.'],
        duration: '4–8 weeks',
        costLabel: 'Paid',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Portfolio', 'Adobe / Figma', 'Branding', 'Client communication', 'Project delivery'],
    commonEmployers: ['Agencies', 'In-house marketing', 'Media companies', 'Freelance clients'],
    transferableRoles: [
      { title: 'Marketing Assistant', searchKeyword: 'marketing assistant' },
      { title: 'Social Media Assistant', searchKeyword: 'social media assistant' },
    ],
    temporaryEntryRoles: [
      { title: 'Retail Assistant', searchKeyword: 'retail assistant', salaryRange: '£22k–£25k' },
    ],
  }),

  construction: field({
    id: 'construction',
    label: 'Construction',
    goalRole: 'Construction Professional',
    careerHubPathId: 'construction-trades',
    typicalJobs: [
      { title: 'Site Labourer', seniority: 'junior', searchKeyword: 'construction labourer', salaryRange: '£22k–£28k' },
      { title: 'Trainee Estimator', seniority: 'junior', searchKeyword: 'trainee estimator', salaryRange: '£24k–£30k' },
      { title: 'Site Manager', seniority: 'mid', searchKeyword: 'assistant site manager', salaryRange: '£32k–£42k' },
      { title: 'Senior Site Manager', seniority: 'senior', searchKeyword: 'site manager', salaryRange: '£45k–£60k' },
      { title: 'Construction Researcher', seniority: 'research', searchKeyword: 'construction graduate', salaryRange: '£28k–£35k' },
    ],
    graduateJobs: [
      { title: 'Graduate Site Engineer', seniority: 'graduate', searchKeyword: 'graduate site engineer', salaryRange: '£28k–£35k' },
      { title: 'Trainee Quantity Surveyor', seniority: 'graduate', searchKeyword: 'trainee quantity surveyor', salaryRange: '£26k–£32k' },
      { title: 'Construction Graduate', seniority: 'graduate', searchKeyword: 'construction graduate', salaryRange: '£26k–£34k' },
    ],
    professionalRegistration: [
      {
        id: 'cscs_reg',
        title: 'CSCS Card (Mandatory for sites)',
        description: 'Required to work on most UK construction sites.',
        priority: 'critical',
      },
    ],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'Overseas construction qualifications may need CSCS, NVQ mapping, and UK ENIC for graduate roles.',
      bodies: ['CSCS', 'CITB', 'UK ENIC'],
    },
    careerProgression: [
      'Site Labourer',
      'Skilled Tradesperson',
      'Site Supervisor',
      'Site Manager',
      'Project Director',
    ],
    recommendedCourses: [
      {
        id: 'cscs_con',
        title: 'CSCS Card',
        whyReasons: ['Required for many construction roles.', 'Helps access more vacancies.'],
        duration: '1 Day',
        costLabel: 'Paid',
        qualification: 'CSCS Card',
        pathId: 'construction-trades',
        slug: 'cscs-card',
      },
    ],
    professionalCertifications: [
      {
        id: 'smsts',
        title: 'SMSTS / SSSTS',
        whyReasons: ['Required for site supervision roles.', 'Career progression enabler.'],
        duration: '5 days',
        costLabel: 'Paid',
      },
    ],
    essentialSkills: ['Health & safety', 'Site documentation', 'Team leadership', 'Blueprint reading', 'Problem solving'],
    commonEmployers: ['Major contractors', 'House builders', 'Civil engineering firms', 'Local councils'],
    transferableRoles: [
      { title: 'Facilities Maintenance', searchKeyword: 'facilities maintenance' },
      { title: 'Warehouse Supervisor', searchKeyword: 'warehouse supervisor' },
    ],
    temporaryEntryRoles: [
      { title: 'General Labourer', searchKeyword: 'general labourer', salaryRange: '£22k–£26k' },
    ],
  }),

  hospitality: field({
    id: 'hospitality',
    label: 'Hospitality',
    goalRole: 'Hospitality Manager',
    careerHubPathId: 'hospitality-front',
    typicalJobs: [
      { title: 'Front of House', seniority: 'junior', searchKeyword: 'front of house', salaryRange: '£22k–£26k' },
      { title: 'Hotel Receptionist', seniority: 'junior', searchKeyword: 'hotel receptionist', salaryRange: '£22k–£28k' },
      { title: 'Duty Manager', seniority: 'mid', searchKeyword: 'duty manager hotel', salaryRange: '£28k–£35k' },
      { title: 'Operations Manager', seniority: 'senior', searchKeyword: 'hospitality operations manager', salaryRange: '£35k–£48k' },
      { title: 'Hospitality Graduate Trainee', seniority: 'graduate', searchKeyword: 'hospitality graduate', salaryRange: '£24k–£30k' },
    ],
    graduateJobs: [
      { title: 'Hospitality Graduate Scheme', seniority: 'graduate', searchKeyword: 'hospitality graduate scheme', salaryRange: '£24k–£30k' },
      { title: 'Trainee Manager', seniority: 'graduate', searchKeyword: 'trainee hospitality manager', salaryRange: '£24k–£28k' },
      { title: 'Events Coordinator', seniority: 'junior', searchKeyword: 'events coordinator', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: {
      requiredForOutsideUk: false,
      summary: 'Hospitality experience transfers well; food hygiene and UK service standards are the main gaps.',
      bodies: ['UK ENIC'],
    },
    careerProgression: [
      'Front of House',
      'Supervisor',
      'Assistant Manager',
      'General Manager',
      'Area Manager',
    ],
    recommendedCourses: [
      {
        id: 'food_hygiene',
        title: 'Food Hygiene Level 2',
        whyReasons: ['Mandatory for food-handling roles.', 'Quick win for more job options.'],
        duration: '1 Day',
        costLabel: 'Low cost',
        pathId: 'hospitality-front',
        slug: 'food-hygiene',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Customer service', 'Team leadership', 'Cash handling', 'Events', 'Communication'],
    commonEmployers: ['Hotel chains', 'Restaurants', 'Event venues', 'Catering companies'],
    transferableRoles: [
      { title: 'Retail Supervisor', searchKeyword: 'retail supervisor' },
      { title: 'Customer Service Manager', searchKeyword: 'customer service manager' },
    ],
    temporaryEntryRoles: [
      { title: 'Barista', searchKeyword: 'barista', salaryRange: '£21k–£24k' },
    ],
  }),

  social_care: field({
    id: 'social_care',
    label: 'Social Care',
    goalRole: 'Social Care Professional',
    careerHubPathId: 'care-support',
    typicalJobs: [
      { title: 'Social Worker', seniority: 'graduate', searchKeyword: 'social worker', salaryRange: '£28k–£36k' },
      { title: 'Support Worker', seniority: 'junior', searchKeyword: 'support worker', salaryRange: '£22k–£26k' },
      { title: 'Care Coordinator', seniority: 'mid', searchKeyword: 'care coordinator', salaryRange: '£26k–£32k' },
    ],
    graduateJobs: [
      { title: 'Social Work Graduate', seniority: 'graduate', searchKeyword: 'social work graduate', salaryRange: '£28k–£34k' },
      { title: 'Care Assistant', seniority: 'junior', searchKeyword: 'care assistant', salaryRange: '£22k–£26k' },
    ],
    professionalRegistration: [
      { id: 'swte', title: 'Social Work England Registration', description: 'Mandatory for practising social workers in England.', href: 'https://www.socialworkengland.org.uk/', priority: 'critical' },
      { id: 'dbs', title: 'Enhanced DBS Check', description: 'Required for all social care roles.', priority: 'critical' },
    ],
    qualificationRecognition: { requiredForOutsideUk: true, summary: 'Overseas social work qualifications need UK recognition via Social Work England.', bodies: ['Social Work England', 'UK ENIC'] },
    careerProgression: ['Care Assistant', 'Support Worker', 'Qualified Social Worker', 'Senior Practitioner', 'Team Manager'],
    recommendedCourses: [{ id: 'care_cert', title: 'Care Certificate', whyReasons: ['Expected by CQC-registered providers.', 'Fast entry into care roles.'], duration: '12 weeks', costLabel: 'Employer-funded' }],
    professionalCertifications: [],
    essentialSkills: ['Safeguarding', 'Communication', 'Empathy', 'Record keeping', 'Multi-agency working'],
    commonEmployers: ['Local authorities', 'NHS trusts', 'Charities', 'Private care providers'],
    transferableRoles: [{ title: 'Healthcare Assistant', searchKeyword: 'healthcare assistant' }],
    temporaryEntryRoles: [{ title: 'Care Assistant', searchKeyword: 'care assistant', salaryRange: '£22k–£26k' }],
  }),

  logistics_transport: field({
    id: 'logistics_transport',
    label: 'Logistics & Transport',
    goalRole: 'Logistics Professional',
    careerHubPathId: 'warehouse-logistics',
    typicalJobs: [
      { title: 'Warehouse Supervisor', seniority: 'mid', searchKeyword: 'warehouse supervisor', salaryRange: '£26k–£32k' },
      { title: 'HGV Driver', seniority: 'mid', searchKeyword: 'HGV driver', salaryRange: '£30k–£40k' },
      { title: 'Supply Chain Analyst', seniority: 'graduate', searchKeyword: 'supply chain analyst', salaryRange: '£26k–£34k' },
    ],
    graduateJobs: [
      { title: 'Logistics Graduate', seniority: 'graduate', searchKeyword: 'logistics graduate', salaryRange: '£24k–£30k' },
      { title: 'Warehouse Operative', seniority: 'junior', searchKeyword: 'warehouse operative', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [
      { id: 'driver_cpc', title: 'Driver CPC', description: 'Required for professional HGV/LGV drivers.', priority: 'critical' },
    ],
    qualificationRecognition: { requiredForOutsideUk: false, summary: 'Driving licences must be exchanged or obtained in the UK.', bodies: ['DVLA'] },
    careerProgression: ['Warehouse Operative', 'Team Leader', 'Supervisor', 'Operations Manager', 'Head of Logistics'],
    recommendedCourses: [{ id: 'forklift', title: 'Forklift Licence (FLT)', whyReasons: ['Unlocks higher-paying warehouse roles.', 'Expected by major UK distributors.'], duration: '3–5 days', costLabel: 'Paid' }],
    professionalCertifications: [],
    essentialSkills: ['Inventory management', 'Health & safety', 'Time management', 'Route planning', 'WMS systems'],
    commonEmployers: ['Amazon', 'DHL', 'Royal Mail', 'Tesco', 'XPO Logistics'],
    transferableRoles: [{ title: 'Delivery Driver', searchKeyword: 'delivery driver' }],
    temporaryEntryRoles: [{ title: 'Warehouse Operative', searchKeyword: 'warehouse operative', salaryRange: '£22k–£28k' }],
  }),

  media_communications: field({
    id: 'media_communications',
    label: 'Media & Communications',
    goalRole: 'Media Professional',
    careerHubPathId: 'digital-ai-beginner',
    typicalJobs: [
      { title: 'PR Account Executive', seniority: 'graduate', searchKeyword: 'PR account executive', salaryRange: '£24k–£30k' },
      { title: 'Journalist', seniority: 'graduate', searchKeyword: 'journalist', salaryRange: '£22k–£28k' },
      { title: 'Content Writer', seniority: 'junior', searchKeyword: 'content writer', salaryRange: '£22k–£28k' },
    ],
    graduateJobs: [
      { title: 'Junior Journalist', seniority: 'graduate', searchKeyword: 'junior journalist', salaryRange: '£22k–£26k' },
      { title: 'Social Media Executive', seniority: 'junior', searchKeyword: 'social media executive', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: { requiredForOutsideUk: true, summary: 'ENIC helps employers understand overseas journalism or media degrees.', bodies: ['UK ENIC', 'NCTJ'] },
    careerProgression: ['Junior / Trainee', 'Professional', 'Senior', 'Editor / Manager', 'Director'],
    recommendedCourses: [{ id: 'nctj', title: 'NCTJ Journalism Diploma', whyReasons: ['Expected by UK newsrooms.', 'Opens trainee journalist roles.'], duration: '6–12 months', costLabel: 'Paid' }],
    professionalCertifications: [],
    essentialSkills: ['Writing', 'Storytelling', 'Digital content', 'Media law awareness', 'Interview technique'],
    commonEmployers: ['BBC', 'ITV', 'News UK', 'PR agencies', 'In-house comms teams'],
    transferableRoles: [{ title: 'Marketing Assistant', searchKeyword: 'marketing assistant' }],
    temporaryEntryRoles: [{ title: 'Content Writer', searchKeyword: 'content writer freelance', salaryRange: '£20k–£26k' }],
  }),

  public_sector: field({
    id: 'public_sector',
    label: 'Public Sector',
    goalRole: 'Public Sector Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Civil Service Executive Officer', seniority: 'graduate', searchKeyword: 'civil service executive officer', salaryRange: '£28k–£35k' },
      { title: 'Local Government Officer', seniority: 'graduate', searchKeyword: 'local government officer', salaryRange: '£26k–£34k' },
      { title: 'Policy Officer', seniority: 'mid', searchKeyword: 'policy officer', salaryRange: '£30k–£40k' },
    ],
    graduateJobs: [
      { title: 'Civil Service Fast Stream', seniority: 'graduate', searchKeyword: 'civil service fast stream', salaryRange: '£30k–£38k' },
      { title: 'Council Graduate Trainee', seniority: 'graduate', searchKeyword: 'council graduate trainee', salaryRange: '£26k–£32k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: { requiredForOutsideUk: true, summary: 'ENIC statement supports civil service and council applications.', bodies: ['UK ENIC'] },
    careerProgression: ['Administrative Officer', 'Executive Officer', 'Higher Executive Officer', 'Grade 7', 'Senior Civil Servant'],
    recommendedCourses: [],
    professionalCertifications: [],
    essentialSkills: ['Policy analysis', 'Stakeholder management', 'Written communication', 'Public service values', 'Data literacy'],
    commonEmployers: ['Cabinet Office', 'HMRC', 'Local councils', 'NHS England', 'Department for Work and Pensions'],
    transferableRoles: [{ title: 'Charity Programme Officer', searchKeyword: 'charity programme officer' }],
    temporaryEntryRoles: [{ title: 'Administrative Officer', searchKeyword: 'administrative officer government', salaryRange: '£22k–£26k' }],
  }),

  manufacturing: field({
    id: 'manufacturing',
    label: 'Manufacturing',
    goalRole: 'Manufacturing Professional',
    careerHubPathId: 'construction-trades',
    typicalJobs: [
      { title: 'Production Engineer', seniority: 'graduate', searchKeyword: 'production engineer', salaryRange: '£28k–£38k' },
      { title: 'QA Technician', seniority: 'junior', searchKeyword: 'QA technician', salaryRange: '£24k–£30k' },
      { title: 'Process Engineer', seniority: 'mid', searchKeyword: 'process engineer', salaryRange: '£32k–£42k' },
    ],
    graduateJobs: [
      { title: 'Manufacturing Graduate', seniority: 'graduate', searchKeyword: 'manufacturing graduate', salaryRange: '£26k–£32k' },
      { title: 'Production Operative', seniority: 'junior', searchKeyword: 'production operative', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: { requiredForOutsideUk: true, summary: 'ENIC supports overseas engineering and science degrees for UK manufacturing roles.', bodies: ['UK ENIC'] },
    careerProgression: ['Production Operative', 'Technician', 'Engineer', 'Senior Engineer', 'Plant Manager'],
    recommendedCourses: [{ id: 'six_sigma', title: 'Six Sigma / Lean Manufacturing', whyReasons: ['Valued in UK FMCG and automotive.', 'Supports progression to engineer roles.'], duration: '2–4 weeks', costLabel: 'Paid' }],
    professionalCertifications: [],
    essentialSkills: ['Lean manufacturing', 'Quality control', 'Health & safety', 'Continuous improvement', 'Technical documentation'],
    commonEmployers: ['Jaguar Land Rover', 'Rolls-Royce', 'Unilever', 'GSK', 'BAE Systems'],
    transferableRoles: [{ title: 'Warehouse Supervisor', searchKeyword: 'warehouse supervisor' }],
    temporaryEntryRoles: [{ title: 'Production Operative', searchKeyword: 'production operative', salaryRange: '£22k–£28k' }],
  }),

  property_real_estate: field({
    id: 'property_real_estate',
    label: 'Property & Real Estate',
    goalRole: 'Property Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Trainee Estate Agent', seniority: 'junior', searchKeyword: 'trainee estate agent', salaryRange: '£20k–£28k + commission' },
      { title: 'Graduate Surveyor', seniority: 'graduate', searchKeyword: 'graduate surveyor', salaryRange: '£28k–£35k' },
      { title: 'Property Manager', seniority: 'mid', searchKeyword: 'property manager', salaryRange: '£30k–£42k' },
    ],
    graduateJobs: [
      { title: 'Graduate Building Surveyor', seniority: 'graduate', searchKeyword: 'graduate building surveyor', salaryRange: '£28k–£34k' },
      { title: 'Lettings Negotiator', seniority: 'junior', searchKeyword: 'lettings negotiator', salaryRange: '£20k–£26k' },
    ],
    professionalRegistration: [
      { id: 'rics', title: 'RICS Membership', description: 'Royal Institution of Chartered Surveyors — expected for surveyor career paths.', href: 'https://www.rics.org/', priority: 'recommended' },
    ],
    qualificationRecognition: { requiredForOutsideUk: true, summary: 'Overseas property or surveying degrees need RICS and ENIC evaluation.', bodies: ['RICS', 'UK ENIC'] },
    careerProgression: ['Trainee', 'Negotiator / Assistant Surveyor', 'Chartered Surveyor', 'Senior Surveyor', 'Partner / Director'],
    recommendedCourses: [{ id: 'naea', title: 'NAEA Propertymark', whyReasons: ['Recognised by UK estate agency employers.', 'Supports estate agent career progression.'], duration: '4–8 weeks', costLabel: 'Paid' }],
    professionalCertifications: [],
    essentialSkills: ['Negotiation', 'Market analysis', 'Client service', 'RICS standards', 'Commercial awareness'],
    commonEmployers: ['Savills', 'Knight Frank', 'Foxtons', 'Countrywide', 'JLL'],
    transferableRoles: [{ title: 'Facilities Coordinator', searchKeyword: 'facilities coordinator' }],
    temporaryEntryRoles: [{ title: 'Lettings Administrator', searchKeyword: 'lettings administrator', salaryRange: '£20k–£24k' }],
  }),

  other: field({
    id: 'other',
    label: 'Other',
    goalRole: 'UK Professional',
    careerHubPathId: 'office-admin',
    typicalJobs: [
      { title: 'Administrative Assistant', seniority: 'junior', searchKeyword: 'administrative assistant', salaryRange: '£22k–£28k' },
      { title: 'Customer Service Advisor', seniority: 'junior', searchKeyword: 'customer service advisor', salaryRange: '£22k–£26k' },
      { title: 'Operations Coordinator', seniority: 'mid', searchKeyword: 'operations coordinator', salaryRange: '£26k–£34k' },
      { title: 'Team Leader', seniority: 'senior', searchKeyword: 'team leader', salaryRange: '£28k–£38k' },
      { title: 'Research Assistant', seniority: 'research', searchKeyword: 'research assistant', salaryRange: '£24k–£30k' },
    ],
    graduateJobs: [
      { title: 'Graduate Administrator', seniority: 'graduate', searchKeyword: 'graduate administrator', salaryRange: '£24k–£28k' },
      { title: 'Graduate Trainee', seniority: 'graduate', searchKeyword: 'graduate trainee', salaryRange: '£24k–£30k' },
      { title: 'Junior Coordinator', seniority: 'junior', searchKeyword: 'junior coordinator', salaryRange: '£22k–£28k' },
    ],
    professionalRegistration: [],
    qualificationRecognition: {
      requiredForOutsideUk: true,
      summary: 'UK ENIC statement helps employers understand your overseas qualification level.',
      bodies: ['UK ENIC'],
    },
    careerProgression: [
      'Administrator',
      'Coordinator',
      'Team Leader',
      'Manager',
      'Head of Department',
    ],
    recommendedCourses: [
      {
        id: 'esol',
        title: 'English for Work (ESOL)',
        whyReasons: ['Improves interview confidence.', 'Opens more UK job options.'],
        duration: '6–12 weeks',
        costLabel: 'Free',
        pathId: 'office-admin',
      },
    ],
    professionalCertifications: [],
    essentialSkills: ['Communication', 'Organisation', 'IT literacy', 'Teamwork', 'Problem solving'],
    commonEmployers: ['SMEs', 'Public sector', 'Retail', 'Logistics', 'Professional services'],
    transferableRoles: [
      { title: 'Receptionist', searchKeyword: 'receptionist' },
      { title: 'Data Entry Clerk', searchKeyword: 'data entry' },
    ],
    temporaryEntryRoles: [
      { title: 'Warehouse Operative', searchKeyword: 'warehouse operative', salaryRange: '£24k–£28k' },
      { title: 'Retail Assistant', searchKeyword: 'retail assistant', salaryRange: '£22k–£25k' },
    ],
  }),
}

export function getSeedKnowledge(fieldId: EducationFieldId): EducationFieldKnowledge {
  return EDUCATION_FIELD_KNOWLEDGE[fieldId] ?? EDUCATION_FIELD_KNOWLEDGE.other
}

export function listSeedFieldIds(): EducationFieldId[] {
  return Object.keys(EDUCATION_FIELD_KNOWLEDGE) as EducationFieldId[]
}
