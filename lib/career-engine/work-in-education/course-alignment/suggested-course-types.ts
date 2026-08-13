/**
 * Suggested course *types* for Work in My Education fields/specialisms
 * that lack Course Library coverage. Suggestions only — no fake providers.
 */

export type SuggestedCourseType = {
  title: string
  purpose:
    | 'career_bridge'
    | 'uk_workplace_bridge'
    | 'technical_skill_booster'
    | 'professional_pathway'
    | 'cpd_add_on'
  priority: 'high' | 'medium' | 'low'
  note?: string
}

type SuggestionRule = {
  fieldRe: RegExp
  specialismRe?: RegExp
  suggestions: SuggestedCourseType[]
}

const RULES: SuggestionRule[] = [
  {
    fieldRe: /account|finance|banking|bookkeep|payroll/i,
    suggestions: [
      { title: 'Excel for Finance', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Bookkeeping', purpose: 'career_bridge', priority: 'high' },
      { title: 'AAT Foundation', purpose: 'career_bridge', priority: 'high' },
      { title: 'Xero', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'QuickBooks', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Payroll', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Financial Accounting Basics', purpose: 'career_bridge', priority: 'medium' },
    ],
  },
  {
    fieldRe: /\bit\b|technology|computer|software|cyber|information\s*tech|computing|digital\s*tech/i,
    suggestions: [
      { title: 'GitHub Portfolio Projects', purpose: 'career_bridge', priority: 'high' },
      { title: 'CompTIA A+', purpose: 'career_bridge', priority: 'high' },
      { title: 'SQL Fundamentals', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'AWS Cloud Practitioner', purpose: 'career_bridge', priority: 'high' },
      { title: 'Web Development Fundamentals', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Software Testing', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Cyber Security Fundamentals', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Data Analysis', purpose: 'technical_skill_booster', priority: 'medium' },
    ],
  },
  {
    fieldRe: /engineer|civil|mechanical|electrical|structural|manufactur|mechatron/i,
    suggestions: [
      { title: 'AutoCAD', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Revit', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'BIM Fundamentals', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Civil 3D', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Engineering Portfolio / Project Evidence', purpose: 'career_bridge', priority: 'high' },
      { title: 'Site Engineering Basics', purpose: 'career_bridge', priority: 'medium' },
      { title: 'IOSH Managing Safely', purpose: 'cpd_add_on', priority: 'medium' },
    ],
  },
  {
    fieldRe: /educat|teach|pgce|school|early\s*year|tutoring|pedagog/i,
    suggestions: [
      { title: 'Teaching Assistant Level 2', purpose: 'career_bridge', priority: 'high' },
      { title: 'Teaching Assistant Level 3', purpose: 'professional_pathway', priority: 'high' },
      { title: 'SEN / Autism Awareness', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Safeguarding Children', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Classroom Support', purpose: 'career_bridge', priority: 'medium' },
      { title: 'TEFL', purpose: 'career_bridge', priority: 'medium', note: 'When English teaching / language routes are relevant' },
    ],
  },
  {
    fieldRe: /psycholog|counsell|mental\s*health|behavioural/i,
    suggestions: [
      { title: 'Mental Health Awareness', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Counselling Skills', purpose: 'career_bridge', priority: 'high' },
      { title: 'Safeguarding Adults / Children', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Research Methods', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Support Worker bridge training', purpose: 'career_bridge', priority: 'medium' },
    ],
  },
  {
    fieldRe: /biology|life\s*science|biomed|bioscience|molecular/i,
    suggestions: [
      { title: 'Laboratory Skills', purpose: 'career_bridge', priority: 'high' },
      { title: 'Good Laboratory Practice / Health & Safety', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Data Analysis for Science', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Research Assistant bridge', purpose: 'career_bridge', priority: 'medium' },
    ],
  },
  {
    fieldRe: /architect|built\s*environment|urban\s*design/i,
    suggestions: [
      { title: 'AutoCAD', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Revit / BIM', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Portfolio building for architecture', purpose: 'career_bridge', priority: 'high' },
      {
        title: 'CSCS Green Card',
        purpose: 'career_bridge',
        priority: 'medium',
        note: 'Only if site pathway is relevant',
      },
    ],
  },
  {
    fieldRe: /media|animation|film|broadcast|journalism/i,
    suggestions: [
      { title: 'Portfolio / Showreel essentials', purpose: 'career_bridge', priority: 'high' },
      { title: 'Adobe Creative Suite (Photoshop / Premiere / After Effects)', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Motion Graphics', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'UX/UI basics', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Freelance / creative business basics', purpose: 'cpd_add_on', priority: 'low' },
    ],
  },
  {
    fieldRe: /business|management|commerce|mba|operations/i,
    suggestions: [
      { title: 'Project Management Fundamentals', purpose: 'professional_pathway', priority: 'high' },
      { title: 'Excel for Business', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Business Administration', purpose: 'career_bridge', priority: 'high' },
      { title: 'Customer Service', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Operations Management', purpose: 'professional_pathway', priority: 'medium' },
      { title: 'HR Basics for Managers', purpose: 'cpd_add_on', priority: 'medium' },
      { title: 'Finance Basics for Non-Finance Managers', purpose: 'cpd_add_on', priority: 'medium' },
      { title: 'Digital Workplace Tools', purpose: 'technical_skill_booster', priority: 'medium' },
    ],
  },
  {
    fieldRe: /\bhr\b|human\s*resource|people\s*management|recruitment/i,
    suggestions: [
      { title: 'CIPD Foundation', purpose: 'professional_pathway', priority: 'high' },
      { title: 'Recruitment essentials', purpose: 'career_bridge', priority: 'high' },
      { title: 'Employment Law basics', purpose: 'cpd_add_on', priority: 'medium' },
      { title: 'HR Administration', purpose: 'career_bridge', priority: 'medium' },
    ],
  },
  {
    fieldRe: /\blaw\b|legal|justice|criminology/i,
    suggestions: [
      { title: 'Paralegal Studies', purpose: 'career_bridge', priority: 'high' },
      { title: 'Legal Secretary / Legal Admin', purpose: 'career_bridge', priority: 'high' },
      { title: 'UK Legal System introduction', purpose: 'uk_workplace_bridge', priority: 'medium' },
      { title: 'Compliance / GDPR basics', purpose: 'cpd_add_on', priority: 'medium' },
    ],
  },
  {
    fieldRe: /public\s*health|epidemiolog|community\s*health/i,
    suggestions: [
      { title: 'Health Promotion', purpose: 'career_bridge', priority: 'high' },
      { title: 'Safeguarding', purpose: 'cpd_add_on', priority: 'high' },
      { title: 'Data Analysis for public health', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Care / Community Health bridge', purpose: 'career_bridge', priority: 'medium' },
    ],
  },
  {
    fieldRe: /chemistr|physics|natural\s*science|environment|geography|geology/i,
    suggestions: [
      { title: 'Laboratory / Field Skills', purpose: 'career_bridge', priority: 'high' },
      { title: 'Health & Safety for technical roles', purpose: 'cpd_add_on', priority: 'medium' },
      { title: 'Data Analysis / GIS basics', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Research Methods', purpose: 'technical_skill_booster', priority: 'medium' },
    ],
  },
  {
    fieldRe: /sociolog|anthropolog|politic|international\s*relation|humanities|social\s*science|history|philosoph|public\s*policy|criminolog|social\s*policy|cultural\s*studies|media\s*studies|development\s*studies|gender\s*studies|archaeolog|geography|classical\s*studies|theology|religious\s*studies/i,
    suggestions: [
      { title: 'Policy Research Basics', purpose: 'career_bridge', priority: 'high' },
      { title: 'Public Sector Applications', purpose: 'uk_workplace_bridge', priority: 'high' },
      { title: 'Charity / NGO Administration', purpose: 'career_bridge', priority: 'high' },
      { title: 'Project Coordination', purpose: 'career_bridge', priority: 'high' },
      { title: 'Data Analysis for Social Research', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Research Methods', purpose: 'technical_skill_booster', priority: 'high' },
      { title: 'Community Engagement', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Grant Writing / Funding Applications', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'Monitoring & Evaluation Basics', purpose: 'technical_skill_booster', priority: 'medium' },
      { title: 'UK CV / Interview Preparation', purpose: 'uk_workplace_bridge', priority: 'medium' },
      { title: 'Excel / Data Analysis', purpose: 'technical_skill_booster', priority: 'medium' },
    ],
  },
  {
    fieldRe: /language|linguist|translation|modern\s*language/i,
    suggestions: [
      { title: 'TEFL / Teaching English', purpose: 'career_bridge', priority: 'high' },
      { title: 'Translation / Interpreting fundamentals', purpose: 'career_bridge', priority: 'medium' },
      { title: 'English for Work', purpose: 'uk_workplace_bridge', priority: 'high' },
      { title: 'Customer Service / Communication skills', purpose: 'cpd_add_on', priority: 'low' },
    ],
  },
  {
    fieldRe: /nurs|midwif|allied\s*health|physiotherap|occupational\s*therap/i,
    suggestions: [
      {
        title: 'UK registration / recognition pathway guidance',
        purpose: 'professional_pathway',
        priority: 'high',
        note: 'Regulated — needs review, not an affiliate shortcut',
      },
      { title: 'Care Certificate / HCA bridge (if support route)', purpose: 'career_bridge', priority: 'medium' },
      { title: 'Safeguarding / Infection Control CPD', purpose: 'cpd_add_on', priority: 'medium' },
    ],
  },
]

const DEFAULT_SUGGESTIONS: SuggestedCourseType[] = [
  { title: 'UK CV for Your Sector', purpose: 'uk_workplace_bridge', priority: 'high' },
  { title: 'Interview Preparation', purpose: 'uk_workplace_bridge', priority: 'high' },
  { title: 'English for Work', purpose: 'uk_workplace_bridge', priority: 'medium' },
  { title: 'Sector skills / portfolio evidence', purpose: 'career_bridge', priority: 'medium' },
]

/**
 * Suggest course types for a library field/specialism with weak or missing coverage.
 */
export function suggestCourseTypesForWieRoute(input: {
  fieldName: string
  specialismName?: string | null
  limit?: number
}): SuggestedCourseType[] {
  const field = input.fieldName ?? ''
  const spec = input.specialismName ?? ''
  const blob = `${field} ${spec}`
  const limit = input.limit ?? 5

  for (const rule of RULES) {
    if (!rule.fieldRe.test(blob) && !rule.fieldRe.test(field)) continue
    if (rule.specialismRe && spec && !rule.specialismRe.test(spec) && !rule.specialismRe.test(blob)) {
      // optional specialism filter — if provided and fails, skip this rule
      // For business rule we use negative lookahead loosely; if it fails oddly, still allow
    }
    return rule.suggestions.slice(0, limit)
  }

  // Try specialism alone against field patterns
  for (const rule of RULES) {
    if (rule.fieldRe.test(spec)) return rule.suggestions.slice(0, limit)
  }

  return DEFAULT_SUGGESTIONS.slice(0, limit)
}
