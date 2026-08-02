import { resolveRoutesFromLabels } from './planningTemplate'

/** Route labels from the education bank spec → canonical tracker labels. */
const EDUCATION_BANK_ROUTE_ALIASES: Record<string, string> = {
  engineering: 'Manufacturing & Engineering',
  manufacturing: 'Manufacturing & Engineering',
  'digital & ai-adjacent': 'IT & Technology',
  'logistics & transport': 'Warehouse & Logistics',
  electrician: 'Maintenance & Facilities',
  healthcare: 'Care & Support',
  'social care': 'Care & Support',
  legal: 'Office & Admin',
  'care & support': 'Care & Support',
  'construction & skilled trades': 'Construction & Skilled Trades',
  'office & admin': 'Office & Admin',
  'maintenance & facilities': 'Maintenance & Facilities',
  'accounting & finance': 'Accounting & Finance',
  'marketing & digital marketing': 'Marketing & Digital Marketing',
  'media & communications': 'Media & Communications',
  'creative & design': 'Creative & Design',
  'science & laboratory': 'Science & Laboratory',
  'property & real estate': 'Property & Real Estate',
  'customer service & call centre': 'Customer Service & Call Centre',
  'public sector': 'Public Sector',
  'hr & recruitment': 'HR & Recruitment',
  'self employment': 'Self Employment',
  'education & teaching': 'Education & Teaching',
  'teaching assistant': 'Teaching Assistant',
  hospitality: 'Hospitality',
  'retail & sales': 'Retail & Sales',
  'driving & transport': 'Driving & Transport',
  'it & technology': 'IT & Technology',
}

const BROAD_ROUTE_LABELS = [
  'Office & Admin',
  'Care & Support',
  'IT & Technology',
  'Manufacturing & Engineering',
  'Construction & Skilled Trades',
  'Education & Teaching',
  'Hospitality',
  'Customer Service & Call Centre',
  'Public Sector',
  'Self Employment',
]

export type WorkInEducationBankEntry = {
  courseName: string
  coursePurpose: string
  routeLabels: string[]
  educationFields: string[]
  specialisations: string[]
  priority: number
  adminNotes: string
  suggestedSearchKeywords: string
}

export const WORK_IN_EDUCATION_BANK_SEED_NOTES =
  'Core Work in my Education affiliate-friendly opportunity bank (internal planning only).'

export const WORK_IN_EDUCATION_DEFAULT_GOAL_KEYS = ['work_in_education', 'start_new_career'] as const

function edu(
  courseName: string,
  coursePurpose: string,
  routeLabels: string[],
  educationFields: string[],
  specialisations: string[],
  priority: number,
  adminNotes: string,
  suggestedSearchKeywords: string
): WorkInEducationBankEntry {
  return {
    courseName,
    coursePurpose,
    routeLabels,
    educationFields,
    specialisations,
    priority,
    adminNotes,
    suggestedSearchKeywords,
  }
}

export function resolveEducationBankRoutes(labels: string[]): ReturnType<typeof resolveRoutesFromLabels> {
  if (labels.some((l) => /^all routes$/i.test(l.trim()))) {
    return resolveRoutesFromLabels(BROAD_ROUTE_LABELS)
  }

  const canonical = labels.map((label) => {
    const key = label.trim().toLowerCase()
    return EDUCATION_BANK_ROUTE_ALIASES[key] ?? label
  })

  return resolveRoutesFromLabels(canonical)
}

/** Core affiliate-friendly Work in my Education opportunity bank (66 entries). */
export const WORK_IN_EDUCATION_OPPORTUNITY_BANK: WorkInEducationBankEntry[] = [
  // Engineering / Technical
  edu('APM Project Management', 'Career growth', ['Engineering', 'Construction & Skilled Trades', 'Manufacturing', 'Office & Admin'], ['Engineering', 'Construction', 'Manufacturing', 'Business'], ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Electronic Engineering', 'Industrial Engineering', 'Aerospace Engineering', 'Environmental Engineering', 'Mechatronics', 'Architecture', 'Quantity Surveying'], 75, 'Useful for project engineer, design engineer, construction, engineering management and graduate progression.', 'APM Project Management Foundation UK'),
  edu('PRINCE2 Foundation', 'CV booster', ['Engineering', 'Office & Admin', 'Digital & AI-Adjacent', 'Construction & Skilled Trades'], ['Engineering', 'Business', 'IT', 'Construction'], ['Project Management', 'Civil Engineering', 'Mechanical Engineering', 'Electronic Engineering', 'IT', 'Business'], 65, 'Recognised UK project management qualification useful across office, engineering and technical project roles.', 'PRINCE2 Foundation course UK'),
  edu('IOSH Managing Safely', 'CV booster', ['Engineering', 'Construction & Skilled Trades', 'Manufacturing', 'Maintenance & Facilities'], ['Engineering', 'Construction', 'Manufacturing', 'Facilities'], ['Civil Engineering', 'Mechanical Engineering', 'Industrial Engineering', 'Environmental Engineering', 'Manufacturing', 'Maintenance'], 70, 'Useful for site-based or operations roles where UK health and safety awareness is expected.', 'IOSH Managing Safely course UK'),
  edu('NEBOSH General Certificate', 'Career growth', ['Engineering', 'Construction & Skilled Trades', 'Manufacturing', 'Maintenance & Facilities'], ['Engineering', 'Construction', 'Manufacturing', 'Facilities'], ['Civil Engineering', 'Mechanical Engineering', 'Industrial Engineering', 'Environmental Engineering', 'Health and Safety'], 68, 'Stronger health and safety qualification for site, project, facilities and H&S roles.', 'NEBOSH General Certificate UK'),
  edu('AutoCAD', 'CV booster', ['Engineering', 'Construction & Skilled Trades', 'Creative & Design', 'Manufacturing'], ['Engineering', 'Construction', 'Architecture', 'Design'], ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Architecture', 'Quantity Surveying', 'Manufacturing'], 70, 'Common technical drawing skill for design, engineering and construction roles.', 'AutoCAD course UK'),
  edu('Revit / BIM', 'CV booster', ['Engineering', 'Construction & Skilled Trades', 'Creative & Design'], ['Engineering', 'Construction', 'Architecture'], ['Civil Engineering', 'Architecture', 'Quantity Surveying', 'Building Services', 'BIM'], 68, 'Useful for UK construction, architecture, BIM and building services roles.', 'Revit BIM course UK'),
  edu('SolidWorks', 'CV booster', ['Engineering', 'Manufacturing', 'Creative & Design'], ['Engineering', 'Manufacturing', 'Product Design'], ['Mechanical Engineering', 'Industrial Engineering', 'Product Design', 'Mechatronics'], 62, 'Useful for mechanical design, CAD technician and product engineering roles.', 'SolidWorks course UK'),
  edu('Lean Six Sigma', 'Career growth', ['Manufacturing', 'Engineering', 'Office & Admin', 'Logistics & Transport'], ['Engineering', 'Manufacturing', 'Business', 'Logistics'], ['Industrial Engineering', 'Manufacturing', 'Quality Assurance', 'Operations'], 60, 'Useful for manufacturing, quality, operations and process improvement roles.', 'Lean Six Sigma Yellow Belt Green Belt UK'),
  // Electrical / Electronic
  edu('18th Edition Wiring Regulations', 'Career growth', ['Electrician', 'Engineering', 'Maintenance & Facilities'], ['Engineering', 'Construction'], ['Electrical Engineering', 'Electronic Engineering', 'Electrician', 'Building Services'], 78, 'Important for electrical installation and UK electrical work pathways.', '18th Edition Wiring Regulations course UK'),
  edu('ECS Card', 'Job-entry / Licence', ['Electrician', 'Engineering', 'Construction & Skilled Trades'], ['Engineering', 'Construction'], ['Electrical Engineering', 'Electrician', 'Building Services'], 72, 'Useful for electrical workers and electrical site roles.', 'ECS Card course UK'),
  edu('PAT Testing', 'CV booster', ['Electrician', 'Maintenance & Facilities', 'Engineering'], ['Engineering', 'Facilities'], ['Electrical Engineering', 'Maintenance', 'Facilities'], 58, 'Useful for maintenance, facilities and electrical support roles.', 'PAT Testing course UK'),
  edu('Inspection and Testing 2391', 'Career growth', ['Electrician', 'Engineering', 'Maintenance & Facilities'], ['Engineering', 'Construction'], ['Electrical Engineering', 'Electrician'], 55, 'Useful for experienced electrical workers progressing into inspection and testing.', 'City and Guilds 2391 Inspection and Testing UK'),
  // IT & Technology
  edu('CompTIA A+', 'Job-entry / Licence', ['Digital & AI-Adjacent', 'Office & Admin', 'Customer Service & Call Centre'], ['IT & Technology', 'Engineering'], ['IT Support', 'Computer Science', 'Technical Support'], 80, 'Entry-level IT support certificate recognised by many employers.', 'CompTIA A+ course UK'),
  edu('CompTIA Network+', 'Career starter', ['Digital & AI-Adjacent'], ['IT & Technology'], ['Networking', 'IT Support', 'Cyber Security'], 70, 'Useful for networking, IT support and infrastructure pathways.', 'CompTIA Network+ course UK'),
  edu('CompTIA Security+', 'Career growth', ['Digital & AI-Adjacent'], ['IT & Technology'], ['Cyber Security', 'IT Support', 'Networking'], 70, 'Useful for cyber security and IT security entry routes.', 'CompTIA Security+ course UK'),
  edu('AWS Cloud Practitioner', 'CV booster', ['Digital & AI-Adjacent'], ['IT & Technology', 'Engineering'], ['Cloud', 'IT Support', 'Software', 'DevOps'], 72, 'Useful beginner cloud certificate for IT and cloud career pathways.', 'AWS Cloud Practitioner course UK'),
  edu('Microsoft Azure Fundamentals', 'CV booster', ['Digital & AI-Adjacent'], ['IT & Technology'], ['Cloud', 'IT Support', 'Microsoft technologies'], 70, 'Useful Microsoft cloud foundation for UK IT roles.', 'Microsoft Azure Fundamentals AZ-900 course UK'),
  edu('Google Cloud Digital Leader', 'CV booster', ['Digital & AI-Adjacent'], ['IT & Technology', 'Business'], ['Cloud', 'Data', 'Digital Transformation'], 55, 'Useful basic cloud awareness certificate.', 'Google Cloud Digital Leader course UK'),
  edu('Cisco CCNA', 'Career growth', ['Digital & AI-Adjacent'], ['IT & Technology'], ['Networking', 'Infrastructure', 'IT Support'], 68, 'Strong networking qualification for infrastructure and network support roles.', 'Cisco CCNA course UK'),
  edu('ISTQB Foundation', 'Career starter', ['Digital & AI-Adjacent'], ['IT & Technology', 'Engineering'], ['Software Testing', 'QA', 'Software Development'], 72, 'Useful for software testing and QA roles.', 'ISTQB Foundation course UK'),
  edu('Power BI / Data Analysis', 'CV booster', ['Digital & AI-Adjacent', 'Office & Admin', 'Accounting & Finance', 'Marketing & Digital Marketing'], ['IT & Technology', 'Business', 'Finance', 'Engineering'], ['Data Analysis', 'Business Analysis', 'Reporting', 'Finance'], 72, 'Useful across data, admin, finance, operations and analyst roles.', 'Power BI Data Analysis course UK'),
  // Business & Finance
  edu('AAT', 'Career starter', ['Accounting & Finance', 'Office & Admin'], ['Business & Finance'], ['Accounting', 'Finance', 'Bookkeeping'], 78, 'Common accounting pathway for entry-level UK finance roles.', 'AAT course UK'),
  edu('ACCA Foundation / ACCA Pathway', 'Advanced qualification', ['Accounting & Finance'], ['Business & Finance'], ['Accounting', 'Finance'], 70, 'Important route for accounting career progression.', 'ACCA Foundation course UK'),
  edu('CIMA Pathway', 'Advanced qualification', ['Accounting & Finance'], ['Business & Finance'], ['Management Accounting', 'Finance'], 62, 'Useful for management accounting and business finance careers.', 'CIMA Pathway course UK'),
  edu('Bookkeeping', 'Career starter', ['Accounting & Finance', 'Office & Admin', 'Self Employment'], ['Business & Finance'], ['Bookkeeping', 'Admin', 'Small Business'], 70, 'Useful for entry-level finance, admin and self-employed business support.', 'Bookkeeping course UK'),
  edu('Sage Accounting', 'CV booster', ['Accounting & Finance', 'Office & Admin'], ['Business & Finance'], ['Accounting Software', 'Finance Admin'], 62, 'Useful accounting software skill for UK finance admin roles.', 'Sage accounting course UK'),
  edu('Xero', 'CV booster', ['Accounting & Finance', 'Office & Admin', 'Self Employment'], ['Business & Finance'], ['Accounting Software', 'Bookkeeping', 'Small Business'], 62, 'Useful cloud accounting software for bookkeeping and small business finance.', 'Xero course UK'),
  edu('QuickBooks', 'CV booster', ['Accounting & Finance', 'Office & Admin', 'Self Employment'], ['Business & Finance'], ['Accounting Software', 'Bookkeeping'], 58, 'Useful bookkeeping and accounting software skill.', 'QuickBooks course UK'),
  edu('Excel for Finance', 'CV booster', ['Accounting & Finance', 'Office & Admin', 'Digital & AI-Adjacent'], ['Business & Finance', 'IT & Technology'], ['Finance', 'Admin', 'Data Analysis'], 70, 'Essential for finance, admin and analyst roles.', 'Excel for Finance course UK'),
  // Healthcare / Care
  edu('Care Certificate', 'Career starter', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Adult Care', 'Healthcare Support', 'Support Worker'], 85, 'Important foundation for care and healthcare support roles.', 'Care Certificate course UK'),
  edu('Level 2 Diploma in Care', 'Career starter', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Adult Care', 'Healthcare Support'], 82, 'Useful qualification for adult care and healthcare support roles.', 'Level 2 Diploma in Care course UK'),
  edu('Level 3 Health and Social Care', 'Career growth', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Adult Care', 'Healthcare Support', 'Senior Support Worker'], 72, 'Supports progression in care and healthcare support careers.', 'Level 3 Health and Social Care course UK'),
  edu('Medication Administration', 'CPD add-on', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Care Worker', 'Healthcare Support'], 68, 'Useful for care roles involving medication support.', 'Medication Administration course UK'),
  edu('Moving and Handling People', 'CPD add-on', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Care Worker', 'Healthcare Support'], 68, 'Common practical requirement in care and healthcare support roles.', 'Moving and Handling People course UK'),
  edu('Dementia Awareness', 'CV booster', ['Care & Support', 'Healthcare', 'Social Care'], ['Healthcare', 'Social Care'], ['Elderly Care', 'Adult Care', 'Support Worker'], 62, 'Useful for adult care and elderly care roles.', 'Dementia Awareness course UK'),
  edu('Mental Health Awareness', 'CV booster', ['Care & Support', 'Healthcare', 'Social Care', 'Public Sector', 'Customer Service & Call Centre'], ['Healthcare', 'Social Care', 'Public Sector'], ['Support Worker', 'Community Support', 'Customer Support'], 60, 'Useful for support, care, public-facing and wellbeing-related roles.', 'Mental Health Awareness course UK'),
  // Education & Teaching
  edu('Teaching Assistant Level 2', 'Career starter', ['Teaching Assistant', 'Education & Teaching'], ['Education & Teaching'], ['Teaching Assistant', 'School Support'], 78, 'Useful for school support and teaching assistant entry roles.', 'Teaching Assistant Level 2 course UK'),
  edu('Teaching Assistant Level 3', 'Career growth', ['Teaching Assistant', 'Education & Teaching'], ['Education & Teaching'], ['Teaching Assistant', 'School Support', 'SEN Support'], 72, 'Supports stronger applications and progression in school support roles.', 'Teaching Assistant Level 3 course UK'),
  edu('SEN / Autism Awareness', 'CPD add-on', ['Teaching Assistant', 'Education & Teaching', 'Care & Support'], ['Education & Teaching', 'Social Care'], ['SEN Support', 'Autism Support', 'Teaching Assistant'], 70, 'Useful for SEN teaching assistant and support roles.', 'SEN Autism Awareness course UK'),
  edu('Child Protection', 'CPD add-on', ['Teaching Assistant', 'Education & Teaching', 'Public Sector'], ['Education & Teaching', 'Social Care'], ['School Support', 'Childcare'], 68, 'Useful for roles working with children.', 'Child Protection course UK'),
  edu('Behaviour Management', 'CV booster', ['Teaching Assistant', 'Education & Teaching'], ['Education & Teaching'], ['Teaching Assistant', 'SEN Support', 'School Support'], 62, 'Useful for classroom support and school-based work.', 'Behaviour Management course UK'),
  edu('TEFL', 'Career starter', ['Education & Teaching', 'Self Employment', 'Digital & AI-Adjacent'], ['Education & Teaching', 'Languages'], ['English Teaching', 'Online Teaching', 'Tutoring'], 62, 'Useful for teaching English, tutoring and online teaching pathways.', 'TEFL course UK'),
  // Law / Compliance
  edu('Paralegal Studies', 'Career starter', ['Office & Admin', 'Public Sector', 'Legal'], ['Law'], ['Paralegal', 'Legal Assistant'], 65, 'Useful bridge into legal support roles without promising solicitor qualification.', 'Paralegal course UK'),
  edu('Legal Secretary', 'Career starter', ['Office & Admin', 'Legal'], ['Law', 'Business'], ['Legal Admin', 'Legal Secretary'], 62, 'Useful for legal admin and law office support roles.', 'Legal Secretary course UK'),
  edu('CILEX Pathway', 'Advanced qualification', ['Legal', 'Office & Admin'], ['Law'], ['Legal Executive', 'Paralegal'], 60, 'Recognised legal professional route — explain carefully; do not promise solicitor qualification.', 'CILEX course UK'),
  edu('Data Protection / GDPR', 'CPD add-on', ['Office & Admin', 'Public Sector', 'HR & Recruitment', 'Digital & AI-Adjacent', 'Legal'], ['Law', 'Business', 'IT', 'Public Sector'], ['Compliance', 'Admin', 'HR', 'Data Protection'], 70, 'Useful in admin, HR, public sector, compliance and data-handling roles.', 'GDPR course UK'),
  // Science & Laboratory
  edu('Laboratory Technician Skills', 'Career starter', ['Science & Laboratory', 'Healthcare', 'Manufacturing'], ['Science & Laboratory', 'Healthcare'], ['Lab Technician', 'Quality Control', 'Research Assistant'], 65, 'Useful for lab assistant and technician roles.', 'Laboratory Technician course UK'),
  edu('Good Laboratory Practice', 'CV booster', ['Science & Laboratory', 'Healthcare', 'Manufacturing'], ['Science & Laboratory'], ['Lab Technician', 'Research Assistant', 'Quality Control'], 58, 'Useful for laboratory and research-related roles.', 'Good Laboratory Practice course UK'),
  edu('Quality Assurance / ISO 9001', 'Career growth', ['Manufacturing', 'Science & Laboratory', 'Engineering'], ['Science & Laboratory', 'Manufacturing', 'Engineering'], ['Quality Assurance', 'Quality Control', 'Manufacturing', 'Lab'], 62, 'Useful for QA, QC and compliance roles.', 'ISO 9001 Quality Assurance course UK'),
  // Creative & Design
  edu('Adobe Photoshop', 'CV booster', ['Creative & Design', 'Marketing & Digital Marketing'], ['Creative & Design', 'Media & Communications'], ['Graphic Design', 'Digital Design', 'Content Creation'], 65, 'Useful core design software skill.', 'Photoshop course UK'),
  edu('Adobe Illustrator', 'CV booster', ['Creative & Design', 'Marketing & Digital Marketing'], ['Creative & Design', 'Media & Communications'], ['Graphic Design', 'Illustration', 'Branding'], 62, 'Useful for design, branding and illustration roles.', 'Illustrator course UK'),
  edu('Adobe Premiere Pro', 'CV booster', ['Creative & Design', 'Media & Communications', 'Marketing & Digital Marketing'], ['Creative & Design', 'Media & Communications'], ['Video Editing', 'Content Creation'], 62, 'Useful for video editing and media content roles.', 'Premiere Pro course UK'),
  edu('After Effects', 'CV booster', ['Creative & Design', 'Media & Communications', 'Marketing & Digital Marketing'], ['Creative & Design', 'Media & Communications'], ['Motion Graphics', 'Video', 'Animation'], 60, 'Useful for motion graphics, animation and video content roles.', 'After Effects course UK'),
  edu('UX/UI Design', 'Career starter', ['Creative & Design', 'Digital & AI-Adjacent'], ['Creative & Design', 'IT & Technology'], ['UX', 'UI', 'Product Design', 'Web Design'], 68, 'Useful for digital design and product design roles.', 'UX UI design course UK'),
  edu('Figma', 'CV booster', ['Creative & Design', 'Digital & AI-Adjacent'], ['Creative & Design', 'IT & Technology'], ['UX', 'UI', 'Web Design', 'Product Design'], 65, 'Useful for modern UI/UX and digital design workflows.', 'Figma course UK'),
  // Media / Marketing
  edu('Digital Marketing', 'Career starter', ['Marketing & Digital Marketing', 'Media & Communications', 'Self Employment'], ['Media & Communications', 'Business', 'Creative & Design'], ['Marketing', 'Content', 'Social Media'], 75, 'Useful for marketing, media and self-employment routes.', 'Digital Marketing course UK'),
  edu('Social Media Marketing', 'CV booster', ['Marketing & Digital Marketing', 'Media & Communications', 'Self Employment'], ['Media & Communications', 'Business', 'Creative & Design'], ['Social Media', 'Content Creation'], 70, 'Useful for marketing roles and small business promotion.', 'Social Media Marketing course UK'),
  edu('SEO', 'CV booster', ['Marketing & Digital Marketing', 'Media & Communications', 'Digital & AI-Adjacent'], ['Media & Communications', 'Business', 'IT & Technology'], ['SEO', 'Content', 'Digital Marketing'], 65, 'Useful for content, websites and marketing roles.', 'SEO course UK'),
  edu('Google Ads', 'CV booster', ['Marketing & Digital Marketing', 'Media & Communications', 'Self Employment'], ['Media & Communications', 'Business'], ['Paid Ads', 'Digital Marketing'], 62, 'Useful for paid marketing and small business growth.', 'Google Ads course UK'),
  edu('Copywriting', 'CV booster', ['Media & Communications', 'Marketing & Digital Marketing', 'Self Employment'], ['Media & Communications', 'Business', 'Creative & Design'], ['Content', 'Marketing', 'Writing'], 62, 'Useful for content, marketing and freelance work.', 'Copywriting course UK'),
  // Property
  edu('Estate Agent Training', 'Career starter', ['Retail & Sales', 'Customer Service & Call Centre', 'Office & Admin', 'Property & Real Estate'], ['Property & Real Estate', 'Business'], ['Estate Agency', 'Property Sales'], 62, 'Useful for property sales and estate agency entry.', 'Estate Agent course UK'),
  edu('Property Management', 'Career starter', ['Property & Real Estate', 'Office & Admin'], ['Property & Real Estate', 'Business'], ['Property Management', 'Lettings', 'Admin'], 62, 'Useful for property admin and property management roles.', 'Property Management course UK'),
  edu('Lettings Management', 'CV booster', ['Property & Real Estate', 'Office & Admin'], ['Property & Real Estate', 'Business'], ['Lettings', 'Property Admin'], 58, 'Useful for letting agency and property admin roles.', 'Lettings Management course UK'),
  // General UK bridge
  edu('English for Work', 'CV booster', ['Office & Admin', 'Care & Support', 'Hospitality', 'Customer Service & Call Centre', 'Public Sector'], ['Other', 'Business', 'Healthcare', 'Education', 'Hospitality'], ['Workplace English', 'Professional Communication'], 75, 'Useful for users with international education who need stronger workplace English.', 'English for Work course UK'),
  edu('Interview Preparation', 'CV booster', ['All routes'], ['General'], ['Employability'], 75, 'Useful across all professional routes.', 'interview preparation course UK'),
  edu('UK CV for Your Sector', 'CV booster', ['All routes'], ['General'], ['Employability', 'CV Writing'], 80, 'UK employers expect sector-specific CV structure and evidence.', 'UK CV course professional CV writing UK'),
]
