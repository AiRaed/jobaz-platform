/**
 * Safe Work in My Education course-type catalog for gap generation.
 * Titles only — no providers, referral URLs, or published courses.
 */

export const WIE_GENERATED_SOURCE = 'generated_from_work_in_education_course_gap' as const

export type WieGapPurpose =
  | 'career_bridge'
  | 'uk_workplace_bridge'
  | 'technical_skill_booster'
  | 'professional_pathway'
  | 'cpd_add_on'

export type WieGapCourseType = {
  title: string
  purpose: WieGapPurpose
  /** Admin coursePurpose label */
  coursePurpose: string
  specialisations: string[]
  priority: number
  stageHints?: string[]
  notes?: string
}

export type WieGapCatalogPack = {
  id: string
  /** Match Career Knowledge Library field names */
  fieldMatch: RegExp
  educationFieldLabels: string[]
  routeLabels: string[]
  courses: WieGapCourseType[]
}

function c(
  title: string,
  purpose: WieGapPurpose,
  coursePurpose: string,
  specialisations: string[],
  priority: number,
  notes?: string,
  stageHints?: string[]
): WieGapCourseType {
  return { title, purpose, coursePurpose, specialisations, priority, notes, stageHints }
}

/** Field-family packs for missing WIE course types. Contamination defaults excluded. */
export const WIE_GAP_COURSE_CATALOG: WieGapCatalogPack[] = [
  {
    id: 'engineering',
    fieldMatch: /engineer|manufactur|mechatron|aerospace|chemical|civil|electrical|electronic|mechanical|industrial|nuclear|petroleum|mining|railway|marine|naval|renewable|building\s*services|quantity\s*survey|structural|geotechnical/i,
    educationFieldLabels: ['Engineering', 'Construction'],
    routeLabels: ['Manufacturing & Engineering', 'Construction & Skilled Trades'],
    courses: [
      c('AutoCAD', 'technical_skill_booster', 'CV booster', ['Civil Engineering', 'Mechanical Engineering', 'Architecture'], 75),
      c('Revit', 'technical_skill_booster', 'CV booster', ['Civil Engineering', 'Architecture', 'BIM'], 72),
      c('Civil 3D', 'technical_skill_booster', 'CV booster', ['Civil Engineering'], 68),
      c('SolidWorks', 'technical_skill_booster', 'CV booster', ['Mechanical Engineering', 'Mechatronics', 'Product Design'], 70),
      c('BIM Fundamentals', 'technical_skill_booster', 'CV booster', ['Civil Engineering', 'Architecture', 'BIM'], 70),
      c('CAD Technician Skills', 'career_bridge', 'Career starter', ['Civil Engineering', 'Mechanical Engineering'], 72),
      c('Project Management Fundamentals', 'professional_pathway', 'Career growth', ['Civil Engineering', 'Project Management'], 70),
      c('Health & Safety for Engineering', 'cpd_add_on', 'CPD add-on', ['Civil Engineering', 'Mechanical Engineering', 'Industrial Engineering'], 65),
      c('IOSH Managing Safely', 'cpd_add_on', 'CV booster', ['Civil Engineering', 'Industrial Engineering', 'Manufacturing'], 70),
      c('Lean Six Sigma Yellow Belt', 'professional_pathway', 'Career growth', ['Industrial Engineering', 'Manufacturing', 'Quality Assurance'], 62),
      c('Structural Design Basics', 'technical_skill_booster', 'CV booster', ['Civil Engineering', 'Structural Engineering'], 65),
      c('Site Engineering Basics', 'career_bridge', 'Career starter', ['Civil Engineering'], 68, 'Site pathway — not a licence shortcut'),
      c('Engineering Portfolio / Project Evidence', 'career_bridge', 'CV booster', ['Civil Engineering', 'Mechanical Engineering'], 72),
    ],
  },
  {
    id: 'it',
    fieldMatch: /\bit\b|technology|computer|software|cyber|data|digital|information\s*system|computing/i,
    educationFieldLabels: ['IT & Technology'],
    routeLabels: ['IT & Technology'],
    courses: [
      c('CompTIA A+', 'career_bridge', 'Career starter', ['IT Support', 'Computer Science'], 80),
      c('CompTIA Network+', 'career_bridge', 'Career starter', ['Networking', 'IT Support'], 72),
      c('CompTIA Security+', 'career_bridge', 'Career growth', ['Cyber Security', 'IT Support'], 72),
      c('AWS Cloud Practitioner', 'career_bridge', 'CV booster', ['Cloud', 'Software Development', 'DevOps'], 74),
      c('Microsoft Azure Fundamentals', 'career_bridge', 'CV booster', ['Cloud', 'IT Support'], 72),
      c('Data Analysis', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Business Analysis'], 74),
      c('Cyber Security Fundamentals', 'career_bridge', 'Career starter', ['Cyber Security'], 72),
      c('ISTQB Foundation', 'career_bridge', 'Career starter', ['Software Testing', 'QA', 'Software Development'], 74),
      c('Web Development Fundamentals', 'career_bridge', 'Career starter', ['Software Development', 'Web Development'], 72),
      c('GitHub Portfolio Projects', 'career_bridge', 'CV booster', ['Software Development'], 76),
      c('Frontend Development', 'technical_skill_booster', 'Career starter', ['Software Development', 'Web Development'], 70),
      c('Backend Development Basics', 'technical_skill_booster', 'Career starter', ['Software Development'], 68),
      c('Software Testing', 'career_bridge', 'Career starter', ['Software Testing', 'QA'], 70),
      c('SQL Fundamentals', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Software Development'], 72),
      c('Python for Data Analysis', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Data Science'], 70),
    ],
  },
  {
    id: 'healthcare',
    fieldMatch: /health\s*care|healthcare|medicine|nurs|midwif|care\s*&|social\s*care|allied\s*health|paramedic/i,
    educationFieldLabels: ['Healthcare', 'Social Care'],
    routeLabels: ['Care & Support'],
    courses: [
      c('Care Certificate', 'career_bridge', 'Career starter', ['Adult Care', 'Healthcare Support'], 85),
      c('Health and Social Care Level 2', 'career_bridge', 'Career starter', ['Adult Care', 'Healthcare Support'], 82),
      c('Health and Social Care Level 3', 'professional_pathway', 'Career growth', ['Adult Care', 'Senior Support Worker'], 74),
      c('Safeguarding Adults', 'cpd_add_on', 'CPD add-on', ['Care Worker', 'Healthcare Support'], 72),
      c('Safeguarding Children', 'cpd_add_on', 'CPD add-on', ['Care Worker', 'Healthcare Support'], 70),
      c('Medication Administration', 'cpd_add_on', 'CPD add-on', ['Care Worker', 'Healthcare Support'], 70),
      c('Moving & Handling', 'cpd_add_on', 'CPD add-on', ['Care Worker', 'Healthcare Support'], 70),
      c('Infection Control', 'cpd_add_on', 'CPD add-on', ['Care Worker', 'Healthcare Support'], 68),
      c('Mental Health Awareness', 'cpd_add_on', 'CV booster', ['Support Worker', 'Mental Health'], 68),
      c('Dementia Awareness', 'cpd_add_on', 'CV booster', ['Elderly Care', 'Adult Care'], 65),
      c('Clinical Skills Refresher', 'technical_skill_booster', 'CV booster', ['Healthcare Support', 'Nursing'], 60, 'Not a substitute for UK professional registration'),
      c('UK Healthcare Workplace Introduction', 'uk_workplace_bridge', 'CV booster', ['Healthcare Support'], 75),
      c('NHS Job Application Support', 'uk_workplace_bridge', 'CV booster', ['Healthcare Support', 'Nursing'], 70),
    ],
  },
  {
    id: 'natural_sciences',
    fieldMatch: /natural\s*science|biology|chemistry|physics|bioscience|biomed|life\s*science|research|laboratory|geology|geography|environment.*science/i,
    educationFieldLabels: ['Science & Laboratory', 'Natural Sciences'],
    routeLabels: ['Science & Laboratory'],
    courses: [
      c('Laboratory Skills', 'career_bridge', 'Career starter', ['Lab Technician', 'Research Assistant'], 78),
      c('Research Methods', 'technical_skill_booster', 'CV booster', ['Research Assistant', 'Academic'], 74),
      c('Data Analysis for Research', 'technical_skill_booster', 'CV booster', ['Research Assistant', 'Data Analysis'], 72),
      c('Health & Safety in Laboratory', 'cpd_add_on', 'CPD add-on', ['Lab Technician'], 70),
      c('Good Clinical Practice', 'professional_pathway', 'Career growth', ['Clinical Research', 'Lab Technician'], 65),
      c('Scientific Writing', 'technical_skill_booster', 'CV booster', ['Research Assistant', 'Academic'], 68),
      c('Research Assistant Skills', 'career_bridge', 'Career starter', ['Research Assistant'], 74),
      c('Excel for Research', 'technical_skill_booster', 'CV booster', ['Research Assistant', 'Data Analysis'], 70),
      c('Statistics Fundamentals', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Research Assistant'], 70),
      c('Bioinformatics Basics', 'technical_skill_booster', 'CV booster', ['Biology', 'Bioinformatics', 'Data Science'], 60),
    ],
  },
  {
    id: 'business',
    fieldMatch: /business|management|commerce|operations|entrepreneur|mba/i,
    educationFieldLabels: ['Business', 'Business & Management'],
    routeLabels: ['Office & Admin'],
    courses: [
      c('Business Administration', 'career_bridge', 'Career starter', ['Business Administration', 'Admin'], 74),
      c('Project Management Fundamentals', 'professional_pathway', 'Career growth', ['Project Management'], 76),
      c('APM Project Management', 'professional_pathway', 'Career growth', ['Project Management'], 74),
      c('Excel for Business', 'technical_skill_booster', 'CV booster', ['Admin', 'Business Analysis'], 78),
      c('Customer Service', 'career_bridge', 'Career starter', ['Customer Service', 'Admin'], 72),
      c('Operations Management', 'professional_pathway', 'Career growth', ['Operations', 'Management'], 70),
      c('HR Basics for Managers', 'cpd_add_on', 'CV booster', ['HR', 'Management'], 68),
      c('Finance Basics for Non-Finance Managers', 'cpd_add_on', 'CV booster', ['Finance', 'Management'], 66),
      c('Digital Workplace Tools', 'technical_skill_booster', 'CV booster', ['Admin', 'Digital'], 70),
      c('Agile / Scrum Fundamentals', 'technical_skill_booster', 'CV booster', ['Project Management', 'IT'], 68),
      c('Leadership Basics', 'cpd_add_on', 'CV booster', ['Management'], 60),
      c('Business Analysis Fundamentals', 'career_bridge', 'Career starter', ['Business Analysis'], 70),
      c('Entrepreneurship Basics', 'career_bridge', 'Career starter', ['Entrepreneurship', 'Small Business'], 62),
    ],
  },
  {
    id: 'accounting',
    fieldMatch: /account|finance|banking|bookkeep|actuar|fintech/i,
    educationFieldLabels: ['Business & Finance', 'Accounting', 'Finance'],
    routeLabels: ['Accounting & Finance'],
    courses: [
      c('AAT Foundation', 'career_bridge', 'Career starter', ['Accounting', 'Bookkeeping'], 80),
      c('AAT Pathway', 'professional_pathway', 'Career growth', ['Accounting', 'Finance'], 76),
      c('Excel for Finance', 'technical_skill_booster', 'CV booster', ['Finance', 'Accounting'], 78),
      c('Xero', 'technical_skill_booster', 'CV booster', ['Bookkeeping', 'Accounting Software'], 72),
      c('QuickBooks', 'technical_skill_booster', 'CV booster', ['Bookkeeping', 'Accounting Software'], 68),
      c('Bookkeeping', 'career_bridge', 'Career starter', ['Bookkeeping', 'Accounting'], 76),
      c('Payroll', 'technical_skill_booster', 'CV booster', ['Payroll', 'HR Admin', 'Accounting'], 70),
      c('ACCA Foundation', 'professional_pathway', 'Advanced qualification', ['Accounting', 'Finance'], 72),
      c('Financial Accounting Basics', 'career_bridge', 'Career starter', ['Financial Accounting', 'Accounting'], 74),
      c('Management Accounting Basics', 'career_bridge', 'Career starter', ['Management Accounting', 'Finance'], 70),
      c('Banking Operations Basics', 'career_bridge', 'Career starter', ['Banking', 'Finance'], 65),
    ],
  },
  {
    id: 'law',
    fieldMatch: /\blaw\b|legal|justice|criminolog|paralegal/i,
    educationFieldLabels: ['Law'],
    routeLabels: ['Office & Admin', 'Public Sector'],
    courses: [
      c('Paralegal Studies', 'career_bridge', 'Career starter', ['Paralegal', 'Legal Assistant'], 78),
      c('Legal Secretary', 'career_bridge', 'Career starter', ['Legal Secretary', 'Legal Admin'], 74),
      c('UK Legal System Introduction', 'uk_workplace_bridge', 'CV booster', ['Paralegal', 'Legal Assistant'], 72),
      c('Legal Research Skills', 'technical_skill_booster', 'CV booster', ['Paralegal', 'Legal Assistant'], 68),
      c('Contract Law Basics', 'technical_skill_booster', 'CV booster', ['Paralegal', 'Compliance'], 65),
      c('Compliance Fundamentals', 'cpd_add_on', 'CPD add-on', ['Compliance', 'Legal Admin'], 68),
      c('GDPR Basics', 'cpd_add_on', 'CPD add-on', ['Compliance', 'Data Protection'], 70),
      c('Legal Administration', 'career_bridge', 'Career starter', ['Legal Admin', 'Legal Secretary'], 72),
    ],
  },
  {
    id: 'education',
    fieldMatch: /educat|teach|pgce|school|tutoring|pedagog/i,
    educationFieldLabels: ['Education & Teaching'],
    routeLabels: ['Education & Teaching', 'Teaching Assistant'],
    courses: [
      c('Teaching Assistant Level 2', 'career_bridge', 'Career starter', ['Teaching Assistant', 'School Support'], 80),
      c('Teaching Assistant Level 3', 'professional_pathway', 'Career growth', ['Teaching Assistant', 'SEN Support'], 74),
      c('SEN / Autism Awareness', 'cpd_add_on', 'CPD add-on', ['SEN Support', 'Teaching Assistant'], 74),
      c('Safeguarding Children', 'cpd_add_on', 'CPD add-on', ['School Support', 'Teaching Assistant'], 76),
      c('Child Protection', 'cpd_add_on', 'CPD add-on', ['School Support', 'Childcare'], 72),
      c('Classroom Support', 'career_bridge', 'Career starter', ['Teaching Assistant', 'School Support'], 72),
      c('Behaviour Management in Schools', 'cpd_add_on', 'CV booster', ['Teaching Assistant', 'SEN Support'], 68),
      c('TEFL', 'career_bridge', 'Career starter', ['English Teaching', 'Online Teaching'], 70),
      c('Teaching English Online', 'career_bridge', 'Career starter', ['Online Teaching', 'Tutoring'], 68),
      c('Lesson Planning Basics', 'technical_skill_booster', 'CV booster', ['Teaching Assistant', 'Tutoring'], 65),
    ],
  },
  {
    id: 'arts_media',
    fieldMatch: /art|media|creative|design|animation|film|game|music|photography|broadcast|journalism/i,
    educationFieldLabels: ['Creative & Design', 'Media & Communications'],
    routeLabels: ['Creative & Design', 'Media & Communications', 'Marketing & Digital Marketing'],
    courses: [
      c('Portfolio Building', 'career_bridge', 'CV booster', ['Graphic Design', 'Animation', 'UX'], 80),
      c('Adobe Photoshop', 'technical_skill_booster', 'CV booster', ['Graphic Design', 'Digital Design'], 74),
      c('Adobe Illustrator', 'technical_skill_booster', 'CV booster', ['Graphic Design', 'Illustration'], 72),
      c('Adobe Premiere Pro', 'technical_skill_booster', 'CV booster', ['Video Editing', 'Content Creation'], 72),
      c('After Effects', 'technical_skill_booster', 'CV booster', ['Motion Graphics', 'Animation'], 70),
      c('Motion Graphics', 'technical_skill_booster', 'CV booster', ['Motion Graphics', 'Animation'], 70),
      c('UX/UI Design', 'career_bridge', 'Career starter', ['UX', 'UI', 'Product Design'], 74),
      c('Web Design Basics', 'career_bridge', 'Career starter', ['Web Design', 'UX'], 70),
      c('Content Creation', 'career_bridge', 'CV booster', ['Content Creation', 'Social Media'], 68),
      c('Digital Marketing for Creatives', 'technical_skill_booster', 'CV booster', ['Marketing', 'Content Creation'], 65),
      c('Freelance Creative Business Basics', 'cpd_add_on', 'CV booster', ['Freelance', 'Creative'], 62),
      c('Animation Showreel', 'career_bridge', 'CV booster', ['Animation'], 72),
      c('3D Modelling Portfolio', 'career_bridge', 'CV booster', ['3D Modelling', 'Game Art'], 68),
      c('Game Art Portfolio', 'career_bridge', 'CV booster', ['Game Art', 'Animation'], 68),
    ],
  },
  {
    id: 'languages',
    fieldMatch: /language|linguist|literature|translation|interpret|modern\s*language|english\s*language/i,
    educationFieldLabels: ['Languages', 'Education & Teaching'],
    routeLabels: ['Education & Teaching', 'Customer Service & Call Centre'],
    courses: [
      c('TEFL', 'career_bridge', 'Career starter', ['English Teaching', 'Online Teaching'], 76),
      c('Teaching English Online', 'career_bridge', 'Career starter', ['Online Teaching', 'Tutoring'], 72),
      c('Translation Skills', 'career_bridge', 'Career starter', ['Translation'], 70),
      c('Interpreting Skills', 'career_bridge', 'Career starter', ['Interpreting'], 68),
      c('Community Interpreting', 'career_bridge', 'Career starter', ['Interpreting', 'Community Support'], 66),
      c('English for Work', 'uk_workplace_bridge', 'CV booster', ['Workplace English'], 78),
      c('Proofreading and Editing', 'technical_skill_booster', 'CV booster', ['Editing', 'Writing'], 68),
      c('Academic Writing Support', 'technical_skill_booster', 'CV booster', ['Academic Writing'], 65),
      c('Customer Service for Bilingual Roles', 'career_bridge', 'Career starter', ['Customer Service', 'Languages'], 68),
    ],
  },
  {
    id: 'humanities',
    fieldMatch: /humanities|social\s*science|sociolog|anthropolog|politic|history|philosoph|international\s*relation|theology|criminolog|social\s*policy|cultural\s*studies|media\s*studies|development\s*studies|gender\s*studies|archaeolog|geography|classical\s*studies/i,
    educationFieldLabels: ['Humanities', 'Social Sciences'],
    // Do not attach Care & Support — that pulls counselling / support-worker courses into HSS results.
    routeLabels: ['Public Sector', 'Office & Admin'],
    courses: [
      c('Policy Research Basics', 'career_bridge', 'CV booster', ['Policy', 'Public Sector'], 96),
      c('Public Sector Applications', 'uk_workplace_bridge', 'CV booster', ['Public Sector'], 94),
      c('Charity / NGO Administration', 'career_bridge', 'Career starter', ['Charity', 'Admin', 'NGO'], 92),
      c('Project Coordination', 'career_bridge', 'CV booster', ['Project', 'Coordinator'], 90),
      c('Data Analysis for Social Research', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Research'], 88),
      c('Research Methods', 'technical_skill_booster', 'CV booster', ['Research', 'Policy'], 86),
      c('Community Engagement', 'career_bridge', 'Career starter', ['Community', 'Public Sector'], 84),
      c('Grant Writing / Funding Applications', 'technical_skill_booster', 'CV booster', ['Grant Writing', 'NGO', 'Charity'], 82),
      c('Monitoring & Evaluation Basics', 'technical_skill_booster', 'CV booster', ['M&E', 'Policy', 'NGO'], 80),
      c('UK CV / Interview Preparation', 'uk_workplace_bridge', 'CV booster', ['CV', 'Interview'], 78),
      c('Excel / Data Analysis', 'technical_skill_booster', 'CV booster', ['Excel', 'Data Analysis'], 76),
      c('Safeguarding', 'cpd_add_on', 'CPD add-on', ['Community Support', 'Safeguarding'], 35, 'Optional booster only for community-facing roles — not a default HSS recommendation'),
    ],
  },
  {
    id: 'environment',
    fieldMatch: /environment|agricultur|food\s*science|nutrition|sustainab|ecology|forestry|marine\s*biology/i,
    educationFieldLabels: ['Environment', 'Agriculture', 'Food'],
    routeLabels: ['Science & Laboratory', 'Hospitality'],
    courses: [
      c('Environmental Management Basics', 'career_bridge', 'Career starter', ['Environmental Management'], 74),
      c('Sustainability Fundamentals', 'career_bridge', 'CV booster', ['Sustainability', 'Environment'], 72),
      c('GIS Basics', 'technical_skill_booster', 'CV booster', ['GIS', 'Geography', 'Environment'], 70),
      c('Agriculture Technology Basics', 'career_bridge', 'Career starter', ['Agriculture'], 68),
      c('Food Safety Level 2', 'career_bridge', 'Career starter', ['Food', 'Nutrition', 'Catering'], 70, 'Food/agriculture/nutrition routes only'),
      c('HACCP Basics', 'cpd_add_on', 'CPD add-on', ['Food', 'Catering'], 65, 'Food route only'),
      c('Laboratory / Field Research Skills', 'career_bridge', 'Career starter', ['Field Research', 'Lab Technician'], 72),
      c('Health & Safety for Field Work', 'cpd_add_on', 'CPD add-on', ['Environment', 'Agriculture'], 68),
      c('Environmental Data Analysis', 'technical_skill_booster', 'CV booster', ['Environment', 'Data Analysis'], 68),
    ],
  },
  {
    id: 'government',
    fieldMatch: /government|public\s*policy|public\s*admin|international\s*development|ngo|civil\s*service/i,
    educationFieldLabels: ['Public Sector', 'Government', 'International Development'],
    routeLabels: ['Public Sector'],
    courses: [
      c('Public Administration', 'career_bridge', 'Career starter', ['Public Administration'], 74),
      c('Policy Analysis Basics', 'career_bridge', 'CV booster', ['Policy Analysis'], 72),
      c('Project Management for Public Sector', 'professional_pathway', 'Career growth', ['Project Management', 'Public Sector'], 72),
      c('Monitoring and Evaluation', 'technical_skill_booster', 'CV booster', ['M&E', 'International Development'], 70),
      c('Data Analysis for Policy', 'technical_skill_booster', 'CV booster', ['Policy', 'Data Analysis'], 70),
      c('Grant Writing', 'technical_skill_booster', 'CV booster', ['Charity', 'NGO'], 68),
      c('Charity / NGO Project Coordination', 'career_bridge', 'Career starter', ['NGO', 'Charity'], 70),
      c('International Development Fundamentals', 'career_bridge', 'Career starter', ['International Development'], 68),
    ],
  },
  {
    id: 'hospitality',
    fieldMatch: /hospitality|tourism|events|hotel|catering|culinary/i,
    educationFieldLabels: ['Hospitality', 'Tourism', 'Events'],
    routeLabels: ['Hospitality'],
    courses: [
      c('Hospitality Management', 'career_bridge', 'Career starter', ['Hospitality Management'], 74),
      c('Event Management', 'career_bridge', 'Career starter', ['Event Management'], 74),
      c('Customer Service', 'career_bridge', 'Career starter', ['Customer Service', 'Hospitality'], 72),
      c('Food Safety Level 2', 'career_bridge', 'Career starter', ['Food', 'Hospitality', 'Catering'], 76),
      c('Allergy Awareness', 'cpd_add_on', 'CPD add-on', ['Hospitality', 'Catering'], 70),
      c('Health & Safety in Hospitality', 'cpd_add_on', 'CPD add-on', ['Hospitality'], 68),
      c('Hotel Operations Basics', 'career_bridge', 'Career starter', ['Hotel Operations'], 70),
      c('Tourism Management Basics', 'career_bridge', 'Career starter', ['Tourism'], 68),
      c('Event Planning Portfolio', 'career_bridge', 'CV booster', ['Event Management'], 70),
    ],
  },
  {
    id: 'architecture',
    fieldMatch: /architect|built\s*environment|urban\s*design|interior\s*design|town\s*planning/i,
    educationFieldLabels: ['Architecture', 'Built Environment', 'Construction'],
    routeLabels: ['Construction & Skilled Trades', 'Creative & Design'],
    courses: [
      c('AutoCAD', 'technical_skill_booster', 'CV booster', ['Architecture', 'Civil Engineering'], 78),
      c('Revit', 'technical_skill_booster', 'CV booster', ['Architecture', 'BIM'], 76),
      c('BIM Fundamentals', 'technical_skill_booster', 'CV booster', ['Architecture', 'BIM'], 74),
      c('Portfolio Building', 'career_bridge', 'CV booster', ['Architecture'], 80),
      c('Construction Project Management', 'professional_pathway', 'Career growth', ['Project Management', 'Construction'], 70),
      c('Building Regulations Basics', 'technical_skill_booster', 'CV booster', ['Architecture', 'Construction'], 68),
      c('SketchUp', 'technical_skill_booster', 'CV booster', ['Architecture', 'Interior Design'], 68),
      c('Planning Application Basics', 'technical_skill_booster', 'CV booster', ['Town Planning', 'Architecture'], 65),
      c('CSCS Green Card Pathway', 'career_bridge', 'Job-entry / Licence', ['Construction', 'Architecture'], 62, 'Only when site pathway is relevant'),
    ],
  },
  {
    id: 'psychology',
    fieldMatch: /psycholog|counsell|behavioural|behavioral/i,
    educationFieldLabels: ['Psychology', 'Social Care'],
    routeLabels: ['Care & Support', 'Public Sector'],
    courses: [
      c('Mental Health Awareness', 'cpd_add_on', 'CV booster', ['Mental Health', 'Support Worker'], 78),
      c('Counselling Skills Introduction', 'career_bridge', 'Career starter', ['Counselling', 'Support Worker'], 76),
      c('Safeguarding', 'cpd_add_on', 'CPD add-on', ['Support Worker'], 74),
      c('Behaviour Support Basics', 'cpd_add_on', 'CV booster', ['Behaviour Support', 'SEN Support'], 70),
      c('Research Methods', 'technical_skill_booster', 'CV booster', ['Research', 'Psychology'], 72),
      c('Data Analysis', 'technical_skill_booster', 'CV booster', ['Data Analysis', 'Psychology'], 70),
      c('Support Worker Bridge', 'career_bridge', 'Career starter', ['Support Worker'], 76),
      c('Assistant Psychologist Application Support', 'uk_workplace_bridge', 'CV booster', ['Assistant Psychologist', 'Psychology'], 68, 'Clinical psychologist routes need HCPC review'),
    ],
  },
  {
    id: 'public_health',
    fieldMatch: /public\s*health|epidemiolog|community\s*health|health\s*promotion/i,
    educationFieldLabels: ['Public Health', 'Healthcare'],
    routeLabels: ['Care & Support', 'Public Sector'],
    courses: [
      c('Public Health Fundamentals', 'career_bridge', 'Career starter', ['Public Health'], 78),
      c('Health Promotion', 'career_bridge', 'Career starter', ['Health Promotion', 'Public Health'], 76),
      c('Epidemiology Basics', 'technical_skill_booster', 'CV booster', ['Epidemiology', 'Public Health'], 70),
      c('Data Analysis for Public Health', 'technical_skill_booster', 'CV booster', ['Public Health', 'Data Analysis'], 74),
      c('Safeguarding', 'cpd_add_on', 'CPD add-on', ['Public Health', 'Community Health'], 72),
      c('Community Health Support', 'career_bridge', 'Career starter', ['Community Health', 'Support Worker'], 74),
      c('Mental Health Awareness', 'cpd_add_on', 'CV booster', ['Mental Health', 'Public Health'], 70),
      c('Monitoring and Evaluation', 'technical_skill_booster', 'CV booster', ['M&E', 'Public Health'], 68),
      c('NHS Job Application Support', 'uk_workplace_bridge', 'CV booster', ['Public Health', 'Healthcare Support'], 70),
    ],
  },
  {
    id: 'logistics',
    fieldMatch: /logistics|supply\s*chain|procurement|warehouse|transport\s*management/i,
    educationFieldLabels: ['Logistics', 'Supply Chain'],
    routeLabels: ['Warehouse & Logistics'],
    courses: [
      c('Supply Chain Management', 'career_bridge', 'Career starter', ['Supply Chain'], 78),
      c('Procurement Fundamentals', 'career_bridge', 'Career starter', ['Procurement'], 74),
      c('Inventory Management', 'technical_skill_booster', 'CV booster', ['Inventory', 'Supply Chain'], 72),
      c('Warehouse Management Systems', 'technical_skill_booster', 'CV booster', ['Warehouse', 'Logistics'], 70),
      c('Excel for Supply Chain', 'technical_skill_booster', 'CV booster', ['Supply Chain', 'Logistics'], 74),
      c('Logistics Coordination', 'career_bridge', 'Career starter', ['Logistics'], 74),
      c('Project Management', 'professional_pathway', 'Career growth', ['Project Management', 'Supply Chain'], 70),
    ],
  },
  {
    id: 'hr',
    fieldMatch: /\bhr\b|human\s*resource|people\s*management|recruitment/i,
    educationFieldLabels: ['HR', 'Business'],
    routeLabels: ['HR & Recruitment', 'Office & Admin'],
    courses: [
      c('CIPD Foundation', 'professional_pathway', 'Advanced qualification', ['HR', 'People Management'], 78),
      c('Recruitment Essentials', 'career_bridge', 'Career starter', ['Recruitment', 'HR'], 74),
      c('Employment Law Basics', 'cpd_add_on', 'CPD add-on', ['HR', 'Employment Law'], 72),
      c('HR Administration', 'career_bridge', 'Career starter', ['HR Administration'], 74),
    ],
  },
  {
    id: 'marketing',
    fieldMatch: /market|advertis|brand|digital\s*market|pr\b|communication/i,
    educationFieldLabels: ['Media & Communications', 'Business', 'Marketing'],
    routeLabels: ['Marketing & Digital Marketing'],
    courses: [
      c('Digital Marketing', 'career_bridge', 'Career starter', ['Digital Marketing', 'Marketing'], 78),
      c('Social Media Marketing', 'technical_skill_booster', 'CV booster', ['Social Media', 'Marketing'], 74),
      c('SEO', 'technical_skill_booster', 'CV booster', ['SEO', 'Digital Marketing'], 72),
      c('Google Ads', 'technical_skill_booster', 'CV booster', ['Paid Ads', 'Digital Marketing'], 70),
      c('Analytics', 'technical_skill_booster', 'CV booster', ['Analytics', 'Digital Marketing'], 72),
      c('Content Marketing', 'technical_skill_booster', 'CV booster', ['Content', 'Marketing'], 70),
      c('Copywriting', 'technical_skill_booster', 'CV booster', ['Copywriting', 'Content'], 68),
    ],
  },
]

export function findCatalogPacksForFieldName(
  fieldName: string,
  specialismName?: string | null
): WieGapCatalogPack[] {
  const hay = `${fieldName} ${specialismName ?? ''}`.trim()
  const packs = WIE_GAP_COURSE_CATALOG.filter(
    (pack) => pack.fieldMatch.test(fieldName) || (hay && pack.fieldMatch.test(hay))
  )
  // Prefer humanities pack over psychology/care packs when HSS specialism is non-clinical.
  if (
    /humanities|social\s*science|anthropolog|sociolog|history|politic|international\s*relation/i.test(
      hay
    ) &&
    !/\b(psycholog|counsell|mental\s*health|social\s*care)\b/i.test(specialismName ?? '')
  ) {
    return packs.filter((p) => p.id === 'humanities' || p.id === 'government')
  }
  return packs
}

export function allCatalogCourseTitles(): string[] {
  const titles: string[] = []
  for (const pack of WIE_GAP_COURSE_CATALOG) {
    for (const course of pack.courses) titles.push(course.title)
  }
  return titles
}
