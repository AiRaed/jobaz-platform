/**
 * Profession-specific intelligence for Career Engine Path 1.
 * JobAZ defines rules here — not generic templates.
 */

import type {
  CourseEntry,
  CvImprovement,
  EducationFieldId,
  EducationPathAnswers,
  EssentialAction,
  JobEntry,
  QualificationLevel,
} from './types'

export type MissionTemplate = {
  id: string
  label: string
  href: string
  target?: number
}

type LevelCourses = Record<QualificationLevel, CourseEntry[]>

export type ProfessionProfile = {
  goalByLevel: Partial<Record<QualificationLevel, string>>
  timelineByLevel: Record<QualificationLevel, string[]>
  cvImprovements: CvImprovement[]
  cvImprovementsPhd?: CvImprovement[]
  essentialActions: EssentialAction[]
  coursesByLevel: LevelCourses
  missionsByLevel: Record<QualificationLevel, MissionTemplate[]>
  /** Primary job pool per qualification level — no cross-level bleed */
  jobsByLevel: Record<QualificationLevel, JobEntry[]>
  /** Job title keywords forbidden at this level */
  forbiddenJobPatterns: Partial<Record<QualificationLevel, RegExp>>
}

const CV_BUILDER = '/cv-builder-v2'

export const PROFESSION_PROFILES: Partial<Record<EducationFieldId, ProfessionProfile>> = {
  engineering: {
    goalByLevel: {
      bachelors: 'Chartered Engineer',
      masters: 'Senior Engineer',
      phd: 'Chartered Engineer',
    },
    timelineByLevel: {
      bachelors: ['Graduate Engineer', 'Project Engineer', 'Senior Engineer', 'Engineering Manager', 'Chartered Engineer'],
      masters: ['Design Engineer', 'Project Engineer', 'Senior Engineer', 'Engineering Manager', 'Chartered Engineer'],
      phd: ['Research Engineer', 'Senior Engineer', 'Principal Engineer', 'Engineering Manager', 'Chartered Engineer'],
    },
    cvImprovements: [
      { id: 'eng_cv', title: 'Engineering CV', description: 'Lead with degree classification, design projects, and technical modules — UK employers expect a 2-page technical CV.', href: CV_BUILDER, priority: 1 },
      { id: 'cad', title: 'CAD & Technical Projects', description: 'List AutoCAD, SolidWorks, or Revit experience with measurable project outcomes (e.g. cost saved, load calculated).', href: CV_BUILDER, priority: 2 },
      { id: 'hse_cv', title: 'Health & Safety Awareness', description: 'Mention IOSH, CSCS, or site safety training — expected on UK engineering applications.', href: CV_BUILDER, priority: 3 },
      { id: 'grad_scheme', title: 'Graduate Scheme Keywords', description: 'Target keywords: graduate engineer, IMechE, ICE, structured training programme.', href: CV_BUILDER, priority: 4 },
    ],
    essentialActions: [
      { id: 'imeche', title: 'IMechE / ICE / IET Membership', description: 'Join the professional body for your discipline — required for chartered engineer progression in the UK.', href: 'https://www.engc.org.uk/', priority: 'critical' },
      { id: 'graduate_scheme', title: 'Graduate Scheme Applications', description: 'Structured employer programmes are the main entry route for UK engineering graduates.', href: '/job-finder?query=graduate%20engineering%20scheme', priority: 'critical' },
    ],
    coursesByLevel: {
      bachelors: [
        { id: 'autocad', title: 'AutoCAD', whyReasons: ['Required by most UK design offices.', 'Strengthens graduate applications.', 'Demonstrates practical CAD ability.'], duration: '4–8 weeks', costLabel: 'Paid', pathId: 'construction-trades' },
        { id: 'cscs', title: 'CSCS Card', whyReasons: ['Needed for site visits and site-based graduate roles.', 'Unlocks construction-sector vacancies.'], duration: '1 Day', costLabel: 'Paid', pathId: 'construction-trades', slug: 'cscs-card' },
      ],
      masters: [
        { id: 'project_mgmt', title: 'APM Project Management', whyReasons: ['Expected for project engineer progression.', 'Differentiates mid-level applicants.'], duration: '2–4 weeks', costLabel: 'Paid' },
        { id: 'nebosh', title: 'NEBOSH / IOSH', whyReasons: ['Site and project roles expect formal H&S credentials.'], duration: '3–5 days', costLabel: 'Paid' },
      ],
      phd: [
        { id: 'chartership', title: 'Chartered Engineer (CEng) Route', whyReasons: ['Formal recognition of doctoral-level engineering competence.', 'Opens senior consultancy and research leadership roles.'], duration: '12–24 months', costLabel: 'Professional fees' },
      ],
    },
    missionsByLevel: {
      bachelors: [
        { id: 'imeche', label: 'Open IMechE graduate membership page', href: 'https://www.engc.org.uk/', target: 1 },
        { id: 'cv', label: 'Build Engineering CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Graduate Schemes', href: '/job-finder?query=graduate%20engineering%20scheme', target: 5 },
        { id: 'save', label: 'Save 3 Engineering Jobs', href: '/job-finder?query=graduate%20engineer', target: 3 },
      ],
      masters: [
        { id: 'imeche', label: 'Check IMechE / ICE membership steps', href: 'https://www.engc.org.uk/', target: 1 },
        { id: 'cv', label: 'Update Engineering CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Engineer Roles', href: '/job-finder?query=design%20engineer', target: 5 },
        { id: 'course', label: 'Book project management training', href: '/career-hub?route=construction-trades', target: 1 },
      ],
      phd: [
        { id: 'charter', label: 'Review CEng chartership requirements', href: 'https://www.engc.org.uk/', target: 1 },
        { id: 'cv', label: 'Build Research Engineering CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Research Engineer Roles', href: '/job-finder?query=research%20engineer', target: 5 },
        { id: 'save', label: 'Save 3 Senior Engineering Jobs', href: '/job-finder?query=senior%20engineer', target: 3 },
      ],
    },
    jobsByLevel: {
      bachelors: [
        { title: 'Graduate Civil Engineer', seniority: 'graduate', searchKeyword: 'graduate civil engineer', salaryRange: '£28k–£35k' },
        { title: 'Graduate Mechanical Engineer', seniority: 'graduate', searchKeyword: 'graduate mechanical engineer', salaryRange: '£28k–£36k' },
        { title: 'CAD Technician', seniority: 'junior', searchKeyword: 'CAD technician', salaryRange: '£24k–£32k' },
        { title: 'Site Engineer Graduate', seniority: 'graduate', searchKeyword: 'graduate site engineer', salaryRange: '£27k–£34k' },
      ],
      masters: [
        { title: 'Design Engineer', seniority: 'mid', searchKeyword: 'design engineer', salaryRange: '£32k–£45k' },
        { title: 'Project Engineer', seniority: 'mid', searchKeyword: 'project engineer', salaryRange: '£35k–£48k' },
        { title: 'Structural Engineer', seniority: 'mid', searchKeyword: 'structural engineer', salaryRange: '£34k–£46k' },
        { title: 'Engineering Consultant', seniority: 'mid', searchKeyword: 'engineering consultant', salaryRange: '£36k–£50k' },
      ],
      phd: [
        { title: 'Research Engineer', seniority: 'research', searchKeyword: 'research engineer', salaryRange: '£35k–£50k' },
        { title: 'R&D Engineer', seniority: 'research', searchKeyword: 'R&D engineer', salaryRange: '£38k–£52k' },
        { title: 'Senior Design Engineer', seniority: 'senior', searchKeyword: 'senior design engineer', salaryRange: '£45k–£58k' },
        { title: 'University Research Fellow', seniority: 'research', searchKeyword: 'engineering research fellow', salaryRange: '£36k–£48k' },
      ],
    },
    forbiddenJobPatterns: {
      phd: /operative|warehouse|labourer|cleaner|retail|barista|production operative/i,
      masters: /operative|warehouse|labourer|cleaner|barista/i,
      bachelors: /production operative|warehouse operative/i,
    },
  },

  education: {
    goalByLevel: {
      bachelors: 'Qualified Teacher',
      masters: 'Senior Education Professional',
      phd: 'Education Academic',
    },
    timelineByLevel: {
      bachelors: ['Teaching Assistant', 'HLTA', 'Qualified Teacher', 'Head of Department', 'Assistant Headteacher'],
      masters: ['HLTA', 'Cover Supervisor', 'Qualified Teacher', 'Head of Department', 'Assistant Headteacher'],
      phd: ['Lecturer in Education', 'Senior Lecturer', 'Reader', 'Head of Department', 'Professor of Education'],
    },
    cvImprovements: [
      { id: 'edu_cv', title: 'Education CV', description: 'School-focused CV: placements, age groups taught, curriculum areas, and safeguarding training.', href: CV_BUILDER, priority: 1 },
      { id: 'safeguarding', title: 'Safeguarding', description: 'List safeguarding training, DBS status, and child protection awareness — non-negotiable for UK schools.', href: CV_BUILDER, priority: 2 },
      { id: 'behaviour', title: 'Behaviour Management', description: 'Give examples of managing classroom behaviour, SEN support, or pastoral care.', href: CV_BUILDER, priority: 3 },
      { id: 'lesson_planning', title: 'Lesson Planning', description: 'Describe lesson planning, differentiation, and assessment — schools scan for these explicitly.', href: CV_BUILDER, priority: 4 },
    ],
    essentialActions: [
      { id: 'qts', title: 'QTS (Qualified Teacher Status)', description: 'Required for classroom teaching in England — via PGCE, School Direct, or assessment only route.', priority: 'critical' },
      { id: 'dbs', title: 'Enhanced DBS Check', description: 'Mandatory for all school-based roles. Apply before you start applying to schools.', priority: 'critical' },
      { id: 'trn', title: 'Teacher Reference Number (TRN)', description: 'Register with the DfE when pursuing QTS or supply teaching.', href: 'https://www.gov.uk/guidance/apply-for-qualified-teacher-status-qts', priority: 'critical' },
    ],
    coursesByLevel: {
      bachelors: [
        { id: 'level3_ta', title: 'Level 3 Teaching Assistant', whyReasons: ['Standard qualification for TA roles.', 'Required before HLTA progression.'], duration: '6–12 months', costLabel: 'Funded', qualification: 'Level 3 TA' },
      ],
      masters: [
        { id: 'hlta', title: 'HLTA Preparation', whyReasons: ['Recognised step toward greater classroom responsibility.', 'Valued by academies and local authorities.'], duration: '3–6 months', costLabel: 'School-funded' },
        { id: 'sen', title: 'SEN Support Training', whyReasons: ['High demand for SEN-aware TAs and cover supervisors.'], duration: '4–8 weeks', costLabel: 'Varies' },
      ],
      phd: [
        { id: 'pgce_alt', title: 'Academic Teaching Qualification', whyReasons: ['HE teaching routes for doctoral graduates.', 'Prepares for lecturer applications.'], duration: '6–12 months', costLabel: 'Varies' },
      ],
    },
    missionsByLevel: {
      bachelors: [
        { id: 'dbs', label: 'Start Enhanced DBS application', href: 'https://www.gov.uk/disclosure-barring-service-check', target: 1 },
        { id: 'cv', label: 'Build Education CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Teaching Assistant Roles', href: '/job-finder?query=teaching%20assistant', target: 5 },
        { id: 'qts', label: 'Read QTS application guide', href: 'https://www.gov.uk/guidance/apply-for-qualified-teacher-status-qts', target: 1 },
      ],
      masters: [
        { id: 'dbs', label: 'Confirm DBS is valid', href: 'https://www.gov.uk/disclosure-barring-service-check', target: 1 },
        { id: 'cv', label: 'Update Education CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 HLTA Roles', href: '/job-finder?query=HLTA', target: 5 },
        { id: 'qts', label: 'Check QTS eligibility', href: 'https://www.gov.uk/guidance/apply-for-qualified-teacher-status-qts', target: 1 },
      ],
      phd: [
        { id: 'orcid', label: 'Create ORCID profile', href: 'https://orcid.org/', target: 1 },
        { id: 'cv', label: 'Build Academic Education CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Lecturer Roles', href: '/job-finder?query=lecturer%20education', target: 5 },
        { id: 'save', label: 'Save 3 University Jobs', href: '/job-finder?query=university%20lecturer', target: 3 },
      ],
    },
    jobsByLevel: {
      bachelors: [
        { title: 'Teaching Assistant', seniority: 'junior', searchKeyword: 'teaching assistant', salaryRange: '£20k–£24k' },
        { title: 'Learning Support Assistant', seniority: 'junior', searchKeyword: 'learning support assistant', salaryRange: '£20k–£25k' },
        { title: 'SEN Teaching Assistant', seniority: 'graduate', searchKeyword: 'SEN teaching assistant', salaryRange: '£22k–£26k' },
        { title: 'Cover Supervisor', seniority: 'junior', searchKeyword: 'cover supervisor', salaryRange: '£22k–£28k' },
      ],
      masters: [
        { title: 'HLTA', seniority: 'mid', searchKeyword: 'HLTA', salaryRange: '£24k–£30k' },
        { title: 'Cover Supervisor', seniority: 'mid', searchKeyword: 'cover supervisor', salaryRange: '£22k–£28k' },
        { title: 'Pastoral Support Lead', seniority: 'mid', searchKeyword: 'pastoral support school', salaryRange: '£24k–£32k' },
        { title: 'Trainee Teacher', seniority: 'graduate', searchKeyword: 'trainee teacher', salaryRange: '£25k–£30k' },
      ],
      phd: [
        { title: 'Lecturer in Education', seniority: 'research', searchKeyword: 'lecturer education', salaryRange: '£35k–£45k' },
        { title: 'Research Fellow (Education)', seniority: 'research', searchKeyword: 'education research fellow', salaryRange: '£34k–£42k' },
        { title: 'Senior Lecturer', seniority: 'senior', searchKeyword: 'senior lecturer education', salaryRange: '£42k–£52k' },
        { title: 'Education Researcher', seniority: 'research', searchKeyword: 'education researcher', salaryRange: '£32k–£40k' },
      ],
    },
    forbiddenJobPatterns: {
      phd: /operative|warehouse|cleaner|retail|barista|domestic/i,
      masters: /warehouse|cleaner|barista/i,
    },
  },

  it: {
    goalByLevel: {
      bachelors: 'Software Engineer',
      masters: 'Cloud Engineer',
      phd: 'Tech Lead',
    },
    timelineByLevel: {
      bachelors: ['Junior Developer', 'Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager'],
      masters: ['Software Engineer', 'Senior Developer', 'Tech Lead', 'Principal Engineer', 'Engineering Manager'],
      phd: ['Research Software Engineer', 'Senior Engineer', 'Principal Engineer', 'Tech Lead', 'Engineering Manager'],
    },
    cvImprovements: [
      { id: 'it_cv', title: 'Developer CV', description: 'Skills-first format: languages, frameworks, and 2–3 shipped projects above employment history.', href: CV_BUILDER, priority: 1 },
      { id: 'github', title: 'GitHub Profile', description: 'Active GitHub with README, pinned repos, and contribution history — UK tech recruiters check this first.', href: 'https://github.com/', priority: 2 },
      { id: 'portfolio', title: 'Project Portfolio', description: 'Deploy 2–3 projects (web app, API, or tool) with live links and clear tech stack.', href: CV_BUILDER, priority: 3 },
      { id: 'projects', title: 'Technical Projects Section', description: 'Describe problem, stack, and outcome for each project — not just a list of technologies.', href: CV_BUILDER, priority: 4 },
    ],
    essentialActions: [
      { id: 'github', title: 'GitHub Portfolio', description: 'Publish documented code with README files — UK tech recruiters review GitHub before interviews.', href: 'https://github.com/', priority: 'critical' },
      { id: 'portfolio', title: 'Live Project Portfolio', description: 'Deploy 2–3 projects with live URLs. Evidence matters more than degree title alone.', priority: 'critical' },
      { id: 'cloud_cert', title: 'Cloud Certification (AWS / Azure)', description: 'Foundational cloud cert signals UK-ready skills for developer and cloud roles.', priority: 'recommended' },
    ],
    coursesByLevel: {
      bachelors: [
        { id: 'dev_bootcamp', title: 'Full-Stack Development', whyReasons: ['Builds portfolio projects employers expect.', 'Covers React, Node, and deployment.'], duration: '8–12 weeks', costLabel: 'Paid', pathId: 'digital-ai-beginner' },
        { id: 'qa', title: 'QA / Test Automation', whyReasons: ['Strong graduate entry route into tech.', 'ISTQB foundation opens junior QA roles.'], duration: '4–6 weeks', costLabel: 'Paid' },
      ],
      masters: [
        { id: 'aws', title: 'AWS Solutions Architect', whyReasons: ['High demand for cloud-skilled developers.', 'Differentiates mid-level applications.'], duration: '6–10 weeks', costLabel: 'Paid', pathId: 'digital-ai-beginner' },
        { id: 'cyber', title: 'Cyber Security Fundamentals', whyReasons: ['Growing UK sector with skills shortage.', 'Complements development background.'], duration: '8–12 weeks', costLabel: 'Paid' },
      ],
      phd: [
        { id: 'data_ml', title: 'Machine Learning Engineering', whyReasons: ['Aligns doctoral research with industry ML roles.', 'Expected for research engineer positions.'], duration: '8–12 weeks', costLabel: 'Paid' },
        { id: 'cloud_arch', title: 'Cloud Architecture (Advanced)', whyReasons: ['Senior and research engineering roles expect cloud at scale.'], duration: '6–8 weeks', costLabel: 'Paid' },
      ],
    },
    missionsByLevel: {
      bachelors: [
        { id: 'github', label: 'Publish 1 project on GitHub', href: 'https://github.com/new', target: 1 },
        { id: 'cv', label: 'Build Developer CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Junior Developer Jobs', href: '/job-finder?query=junior%20developer', target: 5 },
        { id: 'portfolio', label: 'Deploy 1 live project', href: CV_BUILDER, target: 1 },
      ],
      masters: [
        { id: 'cloud', label: 'Start AWS or Azure fundamentals', href: '/career-hub?route=digital-ai-beginner', target: 1 },
        { id: 'cv', label: 'Update Developer CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Software Engineer Roles', href: '/job-finder?query=software%20engineer', target: 5 },
        { id: 'save', label: 'Save 3 Tech Jobs', href: '/job-finder?query=developer', target: 3 },
      ],
      phd: [
        { id: 'github', label: 'Publish research code on GitHub', href: 'https://github.com/new', target: 1 },
        { id: 'cv', label: 'Build Research Engineer CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Research Engineer Roles', href: '/job-finder?query=research%20software%20engineer', target: 5 },
        { id: 'save', label: 'Save 3 Senior Tech Jobs', href: '/job-finder?query=principal%20engineer', target: 3 },
      ],
    },
    jobsByLevel: {
      bachelors: [
        { title: 'Junior Developer', seniority: 'junior', searchKeyword: 'junior developer', salaryRange: '£28k–£38k' },
        { title: 'Graduate Software Developer', seniority: 'graduate', searchKeyword: 'graduate software developer', salaryRange: '£28k–£38k' },
        { title: 'Junior QA Engineer', seniority: 'junior', searchKeyword: 'junior QA tester', salaryRange: '£25k–£32k' },
        { title: 'Junior Data Analyst', seniority: 'junior', searchKeyword: 'junior data analyst', salaryRange: '£26k–£34k' },
      ],
      masters: [
        { title: 'Software Engineer', seniority: 'mid', searchKeyword: 'software engineer', salaryRange: '£40k–£55k' },
        { title: 'Cloud Engineer', seniority: 'mid', searchKeyword: 'cloud engineer', salaryRange: '£42k–£58k' },
        { title: 'Data Engineer', seniority: 'mid', searchKeyword: 'junior data engineer', salaryRange: '£38k–£52k' },
        { title: 'Cyber Security Analyst', seniority: 'mid', searchKeyword: 'cyber security analyst', salaryRange: '£35k–£48k' },
      ],
      phd: [
        { title: 'Research Software Engineer', seniority: 'research', searchKeyword: 'research software engineer', salaryRange: '£38k–£55k' },
        { title: 'ML Engineer', seniority: 'research', searchKeyword: 'machine learning engineer', salaryRange: '£45k–£65k' },
        { title: 'Senior Developer', seniority: 'senior', searchKeyword: 'senior software developer', salaryRange: '£50k–£70k' },
        { title: 'Principal Engineer', seniority: 'senior', searchKeyword: 'principal engineer software', salaryRange: '£60k–£80k' },
      ],
    },
    forbiddenJobPatterns: {
      phd: /operative|warehouse|data entry|receptionist|cleaner|retail/i,
      masters: /warehouse|data entry clerk|receptionist/i,
      bachelors: /warehouse operative/i,
    },
  },

  science: {
    goalByLevel: {
      bachelors: 'BUILD:Career in Scientific Research',
      masters: 'Senior Scientist',
      phd: 'Principal Scientist',
    },
    timelineByLevel: {
      bachelors: ['Laboratory Technician', 'Research Assistant', 'Research Scientist', 'Senior Scientist', 'Laboratory Manager'],
      masters: ['Research Scientist', 'Senior Scientist', 'Team Lead Scientist', 'Laboratory Manager', 'R&D Director'],
      phd: ['Postdoctoral Researcher', 'Research Scientist', 'Principal Scientist', 'Research Lead', 'Professor / Head of Research'],
    },
    cvImprovements: [
      { id: 'science_cv', title: 'Academic Science CV', description: 'Research-focused CV: thesis title, techniques, publications, and conference presentations.', href: CV_BUILDER, priority: 1 },
      { id: 'research', title: 'Research Experience', description: 'Detail methodologies, instruments used (HPLC, PCR, microscopy), and reproducibility practices.', href: CV_BUILDER, priority: 2 },
      { id: 'publications', title: 'Publications & Preprints', description: 'List papers, preprints, and posters — link to ORCID or Google Scholar.', href: CV_BUILDER, priority: 3 },
      { id: 'lab_skills', title: 'Lab Skills & Techniques', description: 'Explicitly list lab competencies: GLP, GMP, statistical analysis (R, Python).', href: CV_BUILDER, priority: 4 },
    ],
    cvImprovementsPhd: [
      { id: 'orcid', title: 'ORCID & Research Profile', description: 'Register ORCID and maintain Google Scholar — standard for UK academic and R&D hiring.', href: 'https://orcid.org/', priority: 1 },
      { id: 'grants', title: 'Grants & Funding', description: 'List funding secured, collaborations, and PI experience on your academic CV.', href: CV_BUILDER, priority: 2 },
    ],
    essentialActions: [
      { id: 'research_profile', title: 'Research Profile (ORCID)', description: 'Create ORCID and Google Scholar profiles — standard for UK research hiring.', href: 'https://orcid.org/', priority: 'critical' },
      { id: 'hcpc', title: 'HCPC (Clinical Science only)', description: 'Required only if you are entering regulated clinical science roles.', priority: 'recommended' },
    ],
    coursesByLevel: {
      bachelors: [
        { id: 'glp', title: 'GLP / GMP Awareness', whyReasons: ['Required in pharma and regulated labs.', 'Standard for laboratory technician roles.'], duration: '1–2 days', costLabel: 'Paid' },
      ],
      masters: [
        { id: 'stats_r', title: 'R / Python for Research', whyReasons: ['Expected for research scientist roles.', 'Strengthens data analysis credibility.'], duration: '4–8 weeks', costLabel: 'Paid' },
        { id: 'project_mgmt_sci', title: 'Research Project Management', whyReasons: ['Prepares for team lead scientist progression.'], duration: '2–4 weeks', costLabel: 'Paid' },
      ],
      phd: [
        { id: 'grant_writing', title: 'Grant Writing & Funding', whyReasons: ['Essential for postdoc and principal scientist roles.', 'UKRI and Wellcome funding requires strong proposals.'], duration: '4–6 weeks', costLabel: 'Paid' },
        { id: 'leadership', title: 'Research Leadership Programme', whyReasons: ['Prepares for research lead and professor track.'], duration: '8–12 weeks', costLabel: 'Varies' },
      ],
    },
    missionsByLevel: {
      bachelors: [
        { id: 'cv', label: 'Build Science CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Lab Technician Roles', href: '/job-finder?query=laboratory%20technician', target: 5 },
        { id: 'glp', label: 'Complete GLP awareness training', href: '/career-hub', target: 1 },
        { id: 'save', label: 'Save 3 Research Jobs', href: '/job-finder?query=research%20assistant%20science', target: 3 },
      ],
      masters: [
        { id: 'orcid', label: 'Create ORCID profile', href: 'https://orcid.org/', target: 1 },
        { id: 'cv', label: 'Update Research CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Research Scientist Roles', href: '/job-finder?query=research%20scientist', target: 5 },
        { id: 'save', label: 'Save 3 R&D Jobs', href: '/job-finder?query=R%26D%20scientist', target: 3 },
      ],
      phd: [
        { id: 'orcid', label: 'Update ORCID publications', href: 'https://orcid.org/', target: 1 },
        { id: 'cv', label: 'Build Academic CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Postdoc Roles', href: '/job-finder?query=postdoctoral%20researcher', target: 5 },
        { id: 'grants', label: 'Draft fellowship outline', href: CV_BUILDER, target: 1 },
      ],
    },
    jobsByLevel: {
      bachelors: [
        { title: 'Laboratory Technician', seniority: 'junior', searchKeyword: 'laboratory technician', salaryRange: '£22k–£28k' },
        { title: 'Research Assistant', seniority: 'junior', searchKeyword: 'research assistant science', salaryRange: '£24k–£30k' },
        { title: 'Science Technician (Schools)', seniority: 'junior', searchKeyword: 'science technician school', salaryRange: '£20k–£26k' },
        { title: 'QC Analyst', seniority: 'junior', searchKeyword: 'quality control analyst', salaryRange: '£24k–£30k' },
      ],
      masters: [
        { title: 'Research Scientist', seniority: 'mid', searchKeyword: 'research scientist', salaryRange: '£32k–£42k' },
        { title: 'Analytical Chemist', seniority: 'mid', searchKeyword: 'analytical chemist', salaryRange: '£30k–£40k' },
        { title: 'Clinical Research Associate', seniority: 'mid', searchKeyword: 'clinical research associate', salaryRange: '£32k–£42k' },
        { title: 'Bioinformatics Analyst', seniority: 'mid', searchKeyword: 'bioinformatics analyst', salaryRange: '£35k–£48k' },
      ],
      phd: [
        { title: 'Postdoctoral Researcher', seniority: 'research', searchKeyword: 'postdoctoral researcher', salaryRange: '£35k–£45k' },
        { title: 'Research Scientist (PhD)', seniority: 'research', searchKeyword: 'research scientist PhD', salaryRange: '£38k–£50k' },
        { title: 'Principal Scientist', seniority: 'senior', searchKeyword: 'principal scientist', salaryRange: '£45k–£60k' },
        { title: 'University Research Fellow', seniority: 'research', searchKeyword: 'research fellow university', salaryRange: '£36k–£48k' },
      ],
    },
    forbiddenJobPatterns: {
      phd: /operative|warehouse|production operative|cleaner|retail|barista|porter|domestic/i,
      masters: /production operative|warehouse|cleaner/i,
      bachelors: /production operative/i,
    },
  },

  business_finance: {
    goalByLevel: {
      bachelors: 'Finance Professional',
      masters: 'Management Accountant',
      phd: 'Senior Finance Analyst',
    },
    timelineByLevel: {
      bachelors: ['Graduate Analyst', 'Assistant Accountant', 'Management Accountant', 'Finance Manager', 'Finance Director'],
      masters: ['Finance Analyst', 'Management Accountant', 'Finance Manager', 'Head of Finance', 'Finance Director'],
      phd: ['Research Analyst', 'Senior Analyst', 'Finance Manager', 'Head of Finance', 'Finance Director'],
    },
    cvImprovements: [
      { id: 'finance_cv', title: 'Finance CV', description: 'Quantify achievements: reconciliations managed, budgets overseen, and accuracy metrics.', href: CV_BUILDER, priority: 1 },
      { id: 'excel', title: 'Excel & Financial Modelling', description: 'List advanced Excel, pivot tables, VLOOKUP, and financial modelling — tested at interview.', href: CV_BUILDER, priority: 2 },
      { id: 'reporting', title: 'Financial Reporting', description: 'Mention IFRS, management accounts, P&L, and balance sheet experience.', href: CV_BUILDER, priority: 3 },
      { id: 'software', title: 'Accounting Software', description: 'Include Sage, Xero, QuickBooks, or SAP experience where applicable.', href: CV_BUILDER, priority: 4 },
    ],
    essentialActions: [
      { id: 'acca', title: 'ACCA Route', description: 'Chartered Certified Accountant — widely recognised by UK employers and accountancy firms.', href: 'https://www.accaglobal.com/', priority: 'recommended' },
      { id: 'cima', title: 'CIMA Route', description: 'Chartered Management Accountant — best for business and management accounting careers.', href: 'https://www.cimaglobal.com/', priority: 'recommended' },
      { id: 'icaew', title: 'ICAEW (ACA)', description: 'Chartered Accountant route — preferred by Big Four and corporate finance teams.', href: 'https://www.icaew.com/', priority: 'recommended' },
    ],
    coursesByLevel: {
      bachelors: [
        { id: 'excel', title: 'Advanced Excel for Finance', whyReasons: ['Tested in almost every finance interview.', 'Expected from day one in accounts roles.'], duration: '2–4 weeks', costLabel: 'Paid', pathId: 'office-admin' },
        { id: 'aat', title: 'AAT Bookkeeping', whyReasons: ['Recognised UK entry qualification.', 'Bridges overseas finance degrees.'], duration: '8–12 weeks', costLabel: 'Paid', qualification: 'AAT Certificate' },
      ],
      masters: [
        { id: 'cima_cert', title: 'CIMA Certificate Level', whyReasons: ['Accelerates management accounting career path.', 'Expected for analyst-to-manager progression.'], duration: '6–12 months', costLabel: 'Paid' },
        { id: 'fm', title: 'Financial Modelling', whyReasons: ['Required for analyst and corporate finance roles.'], duration: '4–6 weeks', costLabel: 'Paid' },
      ],
      phd: [
        { id: 'cfa', title: 'CFA / Investment Analysis', whyReasons: ['Aligns doctoral quantitative skills with finance research roles.'], duration: '12–18 months', costLabel: 'Paid' },
      ],
    },
    missionsByLevel: {
      bachelors: [
        { id: 'excel', label: 'Complete Excel for Finance module', href: '/career-hub?route=office-admin', target: 1 },
        { id: 'cv', label: 'Build Finance CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Finance Roles', href: '/job-finder?query=accounts%20assistant', target: 5 },
        { id: 'acca', label: 'Check ACCA entry requirements', href: 'https://www.accaglobal.com/', target: 1 },
      ],
      masters: [
        { id: 'cima', label: 'Review CIMA registration steps', href: 'https://www.cimaglobal.com/', target: 1 },
        { id: 'cv', label: 'Update Finance CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Analyst Roles', href: '/job-finder?query=finance%20analyst', target: 5 },
        { id: 'save', label: 'Save 3 Finance Jobs', href: '/job-finder?query=management%20accountant', target: 3 },
      ],
      phd: [
        { id: 'cv', label: 'Build Research Finance CV', href: CV_BUILDER, target: 1 },
        { id: 'apply', label: 'Apply to 5 Research Analyst Roles', href: '/job-finder?query=research%20analyst%20finance', target: 5 },
        { id: 'cfa', label: 'Review CFA entry requirements', href: 'https://www.cfainstitute.org/', target: 1 },
        { id: 'save', label: 'Save 3 Senior Finance Jobs', href: '/job-finder?query=senior%20financial%20analyst', target: 3 },
      ],
    },
    jobsByLevel: {
      bachelors: [
        { title: 'Accounts Assistant', seniority: 'junior', searchKeyword: 'accounts assistant', salaryRange: '£24k–£32k' },
        { title: 'Finance Officer', seniority: 'junior', searchKeyword: 'finance officer', salaryRange: '£25k–£32k' },
        { title: 'Payroll Assistant', seniority: 'junior', searchKeyword: 'payroll assistant', salaryRange: '£24k–£30k' },
        { title: 'Graduate Finance Analyst', seniority: 'graduate', searchKeyword: 'graduate finance analyst', salaryRange: '£26k–£35k' },
      ],
      masters: [
        { title: 'Management Accountant', seniority: 'mid', searchKeyword: 'assistant management accountant', salaryRange: '£32k–£42k' },
        { title: 'Financial Analyst', seniority: 'mid', searchKeyword: 'financial analyst', salaryRange: '£35k–£48k' },
        { title: 'Finance Business Partner', seniority: 'mid', searchKeyword: 'finance business partner', salaryRange: '£38k–£52k' },
        { title: 'Audit Senior', seniority: 'mid', searchKeyword: 'audit senior', salaryRange: '£36k–£48k' },
      ],
      phd: [
        { title: 'Research Analyst (Finance)', seniority: 'research', searchKeyword: 'research analyst finance', salaryRange: '£38k–£55k' },
        { title: 'Quantitative Analyst', seniority: 'research', searchKeyword: 'quantitative analyst', salaryRange: '£45k–£65k' },
        { title: 'Senior Financial Analyst', seniority: 'senior', searchKeyword: 'senior financial analyst', salaryRange: '£48k–£65k' },
        { title: 'Economist', seniority: 'research', searchKeyword: 'economist', salaryRange: '£40k–£55k' },
      ],
    },
    forbiddenJobPatterns: {
      phd: /admin assistant|receptionist|data entry|warehouse|retail|operative|cleaner/i,
      masters: /admin assistant|receptionist|data entry|warehouse|retail/i,
      bachelors: /receptionist|data entry clerk|warehouse|retail assistant/i,
    },
  },
}

export function getProfessionProfile(fieldId: EducationFieldId): ProfessionProfile | null {
  return PROFESSION_PROFILES[fieldId] ?? null
}
