/**
 * JAZ — dynamically selected question bank (not a fixed sequence).
 */

import type { CareerBrainQuestion } from '../types'
import type { JazProfessionTrack, JazUnderstanding } from './jazTypes'

type JazQuestionDef = {
  id: string
  tracks: JazProfessionTrack[] | 'all'
  priority: number
  when: (u: JazUnderstanding) => boolean
  build: () => CareerBrainQuestion
}

function q(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  multi = false
): CareerBrainQuestion {
  return { id, text, type: multi ? 'multi' : 'single', options, allow_free_text: false }
}

function qFree(id: string, text: string, placeholder?: string): CareerBrainQuestion {
  return {
    id,
    text: placeholder ? `${text}\n\n(e.g. ${placeholder})` : text,
    type: 'single',
    options: [],
    allow_free_text: true,
  }
}

const BANK: JazQuestionDef[] = [
  {
    id: 'jaz_goal',
    tracks: 'all',
    priority: 100,
    when: (u) => !u.careerGoal,
    build: () =>
      q('jaz_goal', 'What is your main career goal right now?', [
        { value: 'promotion', label: 'Promotion in my current profession' },
        { value: 'salary', label: 'Higher salary' },
        { value: 'leadership', label: 'Move into leadership' },
        { value: 'specialist', label: 'Become a deeper specialist' },
        { value: 'change_company', label: 'Same role, better employer' },
        { value: 'work_life_balance', label: 'Better work-life balance' },
      ]),
  },
  {
    id: 'jaz_job_title',
    tracks: 'all',
    priority: 99,
    when: (u) => !u.jobTitle,
    build: () =>
      qFree('jaz_job_title', 'What is your current job title or role?', 'Teaching Assistant, Software Developer, Nurse'),
  },
  {
    id: 'jaz_edu_qualification',
    tracks: ['education'],
    priority: 92,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_edu_qualification,
    build: () =>
      q('jaz_edu_qualification', 'What is your highest relevant qualification for this education role?', [
        { value: 'none', label: 'No formal teaching qualification yet' },
        { value: 'level2', label: 'Level 2 / GCSE equivalent support' },
        { value: 'level3_ta', label: 'Level 3 Teaching Assistant' },
        { value: 'hlta', label: 'HLTA or equivalent' },
        { value: 'degree', label: 'Degree (not QTS)' },
        { value: 'qts', label: 'QTS / qualified teacher' },
      ]),
  },
  {
    id: 'jaz_edu_responsibilities',
    tracks: ['education'],
    priority: 88,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_edu_responsibilities,
    build: () =>
      q('jaz_edu_responsibilities', 'Which classroom responsibilities do you already handle?', [
        { value: '1to1', label: '1:1 pupil support' },
        { value: 'small_group', label: 'Small group interventions' },
        { value: 'sen', label: 'SEN / EHCP support' },
        { value: 'cover', label: 'Cover lessons / behaviour support' },
        { value: 'planning', label: 'Planning or delivering learning activities' },
      ], true),
  },
  {
    id: 'jaz_edu_progression',
    tracks: ['education'],
    priority: 86,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_edu_progression,
    build: () =>
      q('jaz_edu_progression', 'What is your main progression ambition in education?', [
        { value: 'hlta', label: 'HLTA / senior support role' },
        { value: 'teacher', label: 'Train to become a teacher' },
        { value: 'senior_teacher', label: 'Senior teacher / subject lead' },
        { value: 'leadership', label: 'School leadership (HOD, pastoral, SLT)' },
        { value: 'specialist', label: 'SEN / inclusion specialist' },
      ]),
  },
  {
    id: 'jaz_tech_stack',
    tracks: ['software'],
    priority: 92,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_tech_stack,
    build: () =>
      q('jaz_tech_stack', 'Which stack do you work with most?', [
        { value: 'javascript', label: 'JavaScript / TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java / Kotlin' },
        { value: 'csharp', label: 'C# / .NET' },
        { value: 'php', label: 'PHP' },
        { value: 'mobile', label: 'Mobile (iOS / Android)' },
        { value: 'data', label: 'Data / SQL / analytics' },
        { value: 'other', label: 'Other stack' },
      ]),
  },
  {
    id: 'jaz_tech_architecture',
    tracks: ['software'],
    priority: 88,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_tech_architecture,
    build: () =>
      q('jaz_tech_architecture', 'How much architecture or system design exposure do you have?', [
        { value: 'none', label: 'Mostly feature tickets / bug fixes' },
        { value: 'some', label: 'Some design input on modules or services' },
        { value: 'regular', label: 'Regular ownership of components' },
        { value: 'lead', label: 'Lead designs / technical decisions' },
      ]),
  },
  {
    id: 'jaz_tech_progression',
    tracks: ['software'],
    priority: 86,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_tech_progression,
    build: () =>
      q('jaz_tech_progression', 'What progression are you aiming for?', [
        { value: 'senior_ic', label: 'Senior / staff engineer (individual contributor)' },
        { value: 'tech_lead', label: 'Tech lead' },
        { value: 'engineering_manager', label: 'Engineering manager' },
        { value: 'specialist', label: 'Deep specialist (security, data, platform)' },
        { value: 'product', label: 'Product / technical product direction' },
      ]),
  },
  {
    id: 'jaz_health_registration',
    tracks: ['healthcare'],
    priority: 92,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_health_registration,
    build: () =>
      q('jaz_health_registration', 'What is your registration or mandatory training status?', [
        { value: 'unregistered', label: 'Unregistered support role' },
        { value: 'care_cert', label: 'Care Certificate / NVQ in progress' },
        { value: 'nmc', label: 'NMC registered (nurse / midwife)' },
        { value: 'hcpc', label: 'HCPC registered (AHP)' },
        { value: 'other_reg', label: 'Other professional registration' },
      ]),
  },
  {
    id: 'jaz_health_specialty',
    tracks: ['healthcare'],
    priority: 88,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_health_specialty,
    build: () =>
      q('jaz_health_specialty', 'Which clinical area or specialty do you work in?', [
        { value: 'general', label: 'General / ward' },
        { value: 'community', label: 'Community / primary care' },
        { value: 'mental_health', label: 'Mental health' },
        { value: 'theatre', label: 'Theatre / critical care' },
        { value: 'paeds', label: 'Paediatrics' },
        { value: 'elderly', label: 'Elderly / dementia care' },
        { value: 'other', label: 'Other specialty' },
      ]),
  },
  {
    id: 'jaz_health_sector',
    tracks: ['healthcare'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_health_sector,
    build: () =>
      q('jaz_health_sector', 'Are you in NHS, private, or agency work?', [
        { value: 'nhs', label: 'NHS' },
        { value: 'private', label: 'Private healthcare' },
        { value: 'agency', label: 'Agency / bank' },
        { value: 'care_home', label: 'Care home / domiciliary' },
        { value: 'mixed', label: 'Mixed' },
      ]),
  },
  {
    id: 'jaz_creative_tools',
    tracks: ['creative'],
    priority: 90,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_creative_tools,
    build: () =>
      q('jaz_creative_tools', 'Which tools define your day-to-day work?', [
        { value: 'adobe', label: 'Adobe Creative Cloud' },
        { value: 'figma', label: 'Figma / UI design' },
        { value: 'after_effects', label: 'After Effects / motion' },
        { value: 'blender', label: 'Blender / 3D' },
        { value: 'video', label: 'Premiere / DaVinci' },
        { value: 'other', label: 'Other tools' },
      ], true),
  },
  {
    id: 'jaz_creative_portfolio',
    tracks: ['creative'],
    priority: 88,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_creative_portfolio,
    build: () =>
      q('jaz_creative_portfolio', 'How strong is your portfolio for the next level?', [
        { value: 'none', label: 'No portfolio yet' },
        { value: 'basic', label: 'Basic samples — not promotion-ready' },
        { value: 'solid', label: 'Solid portfolio for current level' },
        { value: 'strong', label: 'Strong — ready to show senior/lead work' },
      ]),
  },
  {
    id: 'jaz_creative_progression',
    tracks: ['creative'],
    priority: 86,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_creative_progression,
    build: () =>
      q('jaz_creative_progression', 'What creative progression do you want?', [
        { value: 'senior_craft', label: 'Senior craft specialist' },
        { value: 'lead', label: 'Lead / principal designer' },
        { value: 'art_direction', label: 'Art direction' },
        { value: 'creative_direction', label: 'Creative direction' },
        { value: 'freelance', label: 'Higher-rate freelance / own clients' },
      ]),
  },
  {
    id: 'jaz_eng_qualification',
    tracks: ['engineering'],
    priority: 90,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_eng_qualification,
    build: () =>
      q('jaz_eng_qualification', 'What engineering qualification level do you hold?', [
        { value: 'apprentice', label: 'Apprenticeship / NVQ' },
        { value: 'hnc', label: 'HNC / HND' },
        { value: 'degree', label: 'BEng / MEng' },
        { value: 'chartered', label: 'Chartered (CEng / IEng)' },
        { value: 'working_towards', label: 'Working towards accreditation' },
      ]),
  },
  {
    id: 'jaz_eng_specialism',
    tracks: ['engineering'],
    priority: 86,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_eng_specialism,
    build: () =>
      q('jaz_eng_specialism', 'Which engineering specialism is your focus?', [
        { value: 'design', label: 'Design / CAD' },
        { value: 'manufacturing', label: 'Manufacturing / production' },
        { value: 'project', label: 'Project / site engineering' },
        { value: 'maintenance', label: 'Maintenance / reliability' },
        { value: 'rd', label: 'R&D / innovation' },
      ]),
  },
  {
    id: 'jaz_eng_progression',
    tracks: ['engineering'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_eng_progression,
    build: () =>
      q('jaz_eng_progression', 'What engineering progression are you targeting?', [
        { value: 'senior_engineer', label: 'Senior engineer' },
        { value: 'lead_engineer', label: 'Lead / principal engineer' },
        { value: 'project_manager', label: 'Project manager' },
        { value: 'engineering_manager', label: 'Engineering manager' },
        { value: 'chartered', label: 'Chartered engineer pathway' },
      ]),
  },
  {
    id: 'jaz_fin_qualification',
    tracks: ['finance'],
    priority: 90,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_fin_qualification,
    build: () =>
      q('jaz_fin_qualification', 'Which finance qualification best describes you?', [
        { value: 'none', label: 'No formal qualification yet' },
        { value: 'aats', label: 'AAT started / Level 2–3' },
        { value: 'aati', label: 'AAT qualified' },
        { value: 'acca', label: 'ACCA / CIMA in progress or qualified' },
        { value: 'degree', label: 'Finance degree' },
      ]),
  },
  {
    id: 'jaz_fin_specialism',
    tracks: ['finance'],
    priority: 86,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_fin_specialism,
    build: () =>
      q('jaz_fin_specialism', 'Which finance area do you specialise in?', [
        { value: 'accounts', label: 'Accounts payable / receivable' },
        { value: 'payroll', label: 'Payroll' },
        { value: 'management', label: 'Management accounts' },
        { value: 'audit', label: 'Audit / assurance' },
        { value: 'tax', label: 'Tax' },
      ]),
  },
  {
    id: 'jaz_fin_progression',
    tracks: ['finance'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_fin_progression,
    build: () =>
      q('jaz_fin_progression', 'What finance progression are you aiming for?', [
        { value: 'senior', label: 'Senior accountant / analyst' },
        { value: 'manager', label: 'Finance manager' },
        { value: 'controller', label: 'Financial controller' },
        { value: 'specialist', label: 'Technical specialist (tax, audit)' },
      ]),
  },
  {
    id: 'jaz_role_responsibilities',
    tracks: ['general'],
    priority: 85,
    when: (u) => !!u.jobTitle && u.professionTrack === 'general' && !u.professionSpecific.jaz_role_responsibilities,
    build: () =>
      qFree('jaz_role_responsibilities', 'What are your main day-to-day responsibilities in this role?'),
  },
  {
    id: 'jaz_progression_target',
    tracks: ['general'],
    priority: 83,
    when: (u) => !!u.jobTitle && u.professionTrack === 'general' && !u.professionSpecific.jaz_progression_target,
    build: () =>
      qFree('jaz_progression_target', 'What specific next role or title are you working towards?'),
  },
  {
    id: 'jaz_edu_seniority',
    tracks: ['education'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_edu_seniority && !u.currentLevel,
    build: () =>
      q('jaz_edu_seniority', 'Which level best describes your current education role?', [
        { value: 'ta', label: 'Teaching Assistant' },
        { value: 'level3_ta', label: 'Level 3 Teaching Assistant' },
        { value: 'hlta', label: 'HLTA' },
        { value: 'unqualified_teacher', label: 'Unqualified teacher / instructor' },
        { value: 'teacher', label: 'Qualified teacher' },
        { value: 'subject_lead', label: 'Subject lead / senior teacher' },
        { value: 'leadership', label: 'Assistant head / leadership team' },
      ]),
  },
  {
    id: 'jaz_tech_seniority',
    tracks: ['software'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_tech_seniority && !u.currentLevel,
    build: () =>
      q('jaz_tech_seniority', 'Which level best describes your current software role?', [
        { value: 'graduate', label: 'Graduate / junior developer' },
        { value: 'mid', label: 'Mid-level developer' },
        { value: 'senior', label: 'Senior developer' },
        { value: 'staff', label: 'Staff / principal engineer' },
        { value: 'lead', label: 'Tech lead' },
        { value: 'manager', label: 'Engineering manager' },
      ]),
  },
  {
    id: 'jaz_health_band',
    tracks: ['healthcare'],
    priority: 84,
    when: (u) => !!u.jobTitle && !u.professionSpecific.jaz_health_band && !u.currentLevel,
    build: () =>
      q('jaz_health_band', 'Which band or level best describes your current healthcare role?', [
        { value: 'support', label: 'Healthcare support / HCA (unregistered)' },
        { value: 'band3', label: 'Band 3–4 clinical support' },
        { value: 'band5', label: 'Band 5 registered nurse' },
        { value: 'band6', label: 'Band 6 nurse / specialist' },
        { value: 'band7', label: 'Band 7 ward manager / advanced' },
        { value: 'band8', label: 'Band 8+ leadership' },
      ]),
  },
  {
    id: 'jaz_years',
    tracks: 'all',
    priority: 78,
    when: (u) => !!u.jobTitle && !u.yearsExperience,
    build: () =>
      q('jaz_years', 'How many years have you worked in this profession?', [
        { value: '0_1', label: 'Less than 1 year' },
        { value: '1_3', label: '1–3 years' },
        { value: '3_5', label: '3–5 years' },
        { value: '5_10', label: '5–10 years' },
        { value: '10_plus', label: '10+ years' },
      ]),
  },
  {
    id: 'jaz_level',
    tracks: ['general'],
    priority: 76,
    when: (u) => !!u.jobTitle && u.professionTrack === 'general' && !u.currentLevel,
    build: () =>
      q('jaz_level', 'Which best describes your current level in this profession?', [
        { value: 'entry', label: 'Entry level' },
        { value: 'junior', label: 'Junior' },
        { value: 'mid', label: 'Mid-level' },
        { value: 'senior', label: 'Senior' },
        { value: 'team_leader', label: 'Team leader / lead' },
        { value: 'manager', label: 'Manager' },
      ]),
  },
  {
    id: 'jaz_blockers',
    tracks: 'all',
    priority: 72,
    when: (u) => !!u.jobTitle && u.blockers.length === 0,
    build: () =>
      q('jaz_blockers', 'What is currently holding back your progression?', [
        { value: 'qualification', label: 'Missing qualifications' },
        { value: 'uk_exp', label: 'Limited UK experience' },
        { value: 'technical_skills', label: 'Technical depth gap' },
        { value: 'leadership_exp', label: 'Limited leadership evidence' },
        { value: 'confidence', label: 'Confidence / self-advocacy' },
        { value: 'limited_opportunities', label: 'Limited opportunities in current company' },
        { value: 'weak_cv', label: 'CV / LinkedIn not strong enough' },
      ], true),
  },
  {
    id: 'jaz_strengths',
    tracks: 'all',
    priority: 70,
    when: (u) => !!u.jobTitle && u.strengths.length === 0,
    build: () =>
      q('jaz_strengths', 'Which strengths do you use most in your role?', [
        { value: 'communication', label: 'Communication' },
        { value: 'leadership', label: 'Leadership' },
        { value: 'project_management', label: 'Project management' },
        { value: 'problem_solving', label: 'Problem solving' },
        { value: 'technical_skills', label: 'Technical skills' },
        { value: 'design', label: 'Design' },
        { value: 'coding', label: 'Coding' },
        { value: 'analysis', label: 'Analysis' },
      ], true),
  },
  {
    id: 'jaz_study',
    tracks: 'all',
    priority: 68,
    when: (u) => !!u.jobTitle && !u.studyWilling,
    build: () =>
      q('jaz_study', 'Are you willing to invest in learning or qualifications?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No — prefer on-the-job growth only' },
      ]),
  },
  {
    id: 'jaz_dev_time',
    tracks: 'all',
    priority: 66,
    when: (u) => !!u.jobTitle && !u.devTime,
    build: () =>
      q('jaz_dev_time', 'How much time can you invest in career development?', [
        { value: 'under_3_months', label: 'Less than 3 months focused effort' },
        { value: '3_12_months', label: '3–12 months' },
        { value: '1_2_years', label: '1–2 years' },
        { value: '2_plus_years', label: '2+ years' },
      ]),
  },
  {
    id: 'jaz_leadership',
    tracks: 'all',
    priority: 64,
    when: (u) => !!u.jobTitle && !u.leadershipReady,
    build: () =>
      q('jaz_leadership', 'Would you take on more responsibility if the opportunity arose?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No — prefer individual contribution' },
        { value: 'not_sure', label: 'Not sure yet' },
      ]),
  },
  {
    id: 'jaz_employer',
    tracks: 'all',
    priority: 62,
    when: (u) => !!u.jobTitle && !u.employerMobility,
    build: () =>
      q('jaz_employer', 'Would you change employer to accelerate growth?', [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No — prefer to grow internally' },
        { value: 'maybe', label: 'Maybe, for the right role' },
      ]),
  },
]

function appliesToTrack(def: JazQuestionDef, track: JazProfessionTrack | null): boolean {
  if (def.tracks === 'all') return true
  const resolved = track ?? 'general'
  return def.tracks.includes(resolved)
}

export function pickBestJazQuestion(u: JazUnderstanding): { def: JazQuestionDef; question: CareerBrainQuestion } | null {
  const asked = new Set(u.askedIds)
  const track = u.professionTrack ?? 'general'

  const candidates = BANK.filter(
    (def) => !asked.has(def.id) && appliesToTrack(def, track) && def.when(u)
  ).sort((a, b) => b.priority - a.priority)

  const best = candidates[0]
  if (!best) return null
  return { def: best, question: best.build() }
}

export function describeJazQuestionReason(defId: string, u: JazUnderstanding): string {
  return `JAZ — confidence ${u.confidence}% — next gap: ${defId.replace(/^jaz_/, '').replace(/_/g, ' ')} (${u.professionTrack ?? 'profession TBD'})`
}
