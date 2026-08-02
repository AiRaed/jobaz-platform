/**
 * JAZ Side Income — dynamic question bank (priority-based, not fixed sequence).
 */

import type { CareerBrainQuestion } from '../types'
import type { SideIncomeUnderstanding } from './sideIncomeTypes'

type SideIncomeQuestionDef = {
  id: string
  priority: number
  when: (u: SideIncomeUnderstanding) => boolean
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

const BANK: SideIncomeQuestionDef[] = [
  {
    id: 'si_employment',
    priority: 100,
    when: (u) => !u.employment,
    build: () =>
      q('si_employment', 'What is your current employment situation?', [
        { value: 'employed_full', label: 'Employed full-time' },
        { value: 'employed_part', label: 'Employed part-time' },
        { value: 'unemployed', label: 'Not currently employed' },
        { value: 'student', label: 'Student' },
        { value: 'self_employed', label: 'Self-employed / freelancer already' },
      ]),
  },
  {
    id: 'si_monthly_goal',
    priority: 98,
    when: (u) => !!u.employment && !u.monthlyGoal,
    build: () =>
      q('si_monthly_goal', 'How much extra income do you want to earn per month (roughly)?', [
        { value: 'under_200', label: 'Under £200' },
        { value: '200_500', label: '£200–£500' },
        { value: '500_1000', label: '£500–£1,000' },
        { value: '1000_plus', label: '£1,000+' },
        { value: 'not_sure', label: 'Not sure yet' },
      ]),
  },
  {
    id: 'si_income_timeline',
    priority: 96,
    when: (u) => !!u.employment && !u.incomeTimeline,
    build: () =>
      q('si_income_timeline', 'How quickly do you need this extra income to start?', [
        { value: 'this_week', label: 'This week / urgently' },
        { value: '2_4_weeks', label: 'Within 2–4 weeks' },
        { value: '1_3_months', label: '1–3 months is fine' },
        { value: 'no_rush', label: 'No rush — building steadily' },
      ]),
  },
  {
    id: 'si_hours_week',
    priority: 94,
    when: (u) => !!u.employment && !u.hoursPerWeek,
    build: () =>
      q('si_hours_week', 'How many hours per week can you realistically give to extra income?', [
        { value: 'under_5', label: 'Under 5 hours' },
        { value: '5_10', label: '5–10 hours' },
        { value: '10_20', label: '10–20 hours' },
        { value: '20_plus', label: '20+ hours' },
      ]),
  },
  {
    id: 'si_schedule',
    priority: 92,
    when: (u) => !!u.employment && !u.schedule,
    build: () =>
      q('si_schedule', 'When are you usually available for extra work?', [
        { value: 'evenings', label: 'Evenings' },
        { value: 'weekends', label: 'Weekends' },
        { value: 'weekdays_day', label: 'Weekdays (daytime)' },
        { value: 'online_anytime', label: 'Online / anytime from home' },
        { value: 'flexible', label: 'Flexible — varies week to week' },
      ]),
  },
  {
    id: 'si_main_field',
    priority: 90,
    when: (u) => !!u.employment && !u.mainField,
    build: () =>
      qFree(
        'si_main_field',
        'What is your main job, study field, or strongest work background?',
        'Retail supervisor, Graphic designer, Nurse, Warehouse operative, Business student'
      ),
  },
  {
    id: 'si_skills',
    priority: 88,
    when: (u) => !!u.mainField && u.skills.length === 0,
    build: () =>
      q(
        'si_skills',
        'Which skills could you use for extra income? (Select all that apply)',
        [
          { value: 'customer_service', label: 'Customer service / sales' },
          { value: 'admin', label: 'Admin / data entry' },
          { value: 'writing', label: 'Writing / content' },
          { value: 'design', label: 'Design / creative' },
          { value: 'tech', label: 'IT / web / software' },
          { value: 'teaching', label: 'Teaching / training / tutoring' },
          { value: 'care', label: 'Care / support work' },
          { value: 'driving', label: 'Driving / delivery' },
          { value: 'manual', label: 'Manual / physical work' },
          { value: 'languages', label: 'Languages / interpreting' },
          { value: 'trades', label: 'Trades / handyman skills' },
          { value: 'none_specialist', label: 'No specialist skills — general work only' },
        ],
        true
      ),
  },
  {
    id: 'si_assets',
    priority: 86,
    when: (u) => !!u.mainField && u.assets.length === 0,
    build: () =>
      q(
        'si_assets',
        'What assets or resources do you have available? (Select all that apply)',
        [
          { value: 'car', label: 'Car' },
          { value: 'driving_licence', label: 'UK driving licence' },
          { value: 'van', label: 'Van or large vehicle' },
          { value: 'computer', label: 'Computer / laptop' },
          { value: 'home_workspace', label: 'Quiet home workspace' },
          { value: 'smartphone', label: 'Smartphone for apps / gigs' },
          { value: 'capital', label: 'Money to invest (£500+)' },
          { value: 'professional_tools', label: 'Professional tools or equipment' },
          { value: 'none', label: 'None of these' },
        ],
        true
      ),
  },
  {
    id: 'si_work_physical',
    priority: 82,
    when: (u) => !!u.mainField && !u.workStyle.physicalVsDesk,
    build: () =>
      q('si_work_physical', 'For extra income, would you prefer physical work or desk-based work?', [
        { value: 'desk', label: 'Desk-based / remote' },
        { value: 'light_physical', label: 'Light physical work is fine' },
        { value: 'physical', label: 'Happy with physical work' },
        { value: 'avoid_physical', label: 'Prefer to avoid physical work' },
      ]),
  },
  {
    id: 'si_work_location',
    priority: 80,
    when: (u) => !!u.mainField && !u.workStyle.homeVsOutside,
    build: () =>
      q('si_work_location', 'Would you rather work from home or outside the home?', [
        { value: 'home', label: 'Home-based' },
        { value: 'outside', label: 'Outside / on-site' },
        { value: 'mix', label: 'Mix of both' },
        { value: 'no_preference', label: 'No strong preference' },
      ]),
  },
  {
    id: 'si_work_people',
    priority: 78,
    when: (u) => !!u.mainField && !u.workStyle.peopleVsIndependent,
    build: () =>
      q('si_work_people', 'For side income, do you prefer people-facing work or independent work?', [
        { value: 'people', label: 'People-facing (customers, pupils, clients)' },
        { value: 'independent', label: 'Independent / minimal contact' },
        { value: 'mix', label: 'Mix is fine' },
        { value: 'avoid_people', label: 'Prefer minimal people contact' },
      ]),
  },
  {
    id: 'si_risk_tolerance',
    priority: 76,
    when: (u) => !!u.mainField && !u.riskTolerance,
    build: () =>
      q('si_risk_tolerance', 'How much risk are you comfortable with for extra income?', [
        { value: 'low', label: 'Low — steady, predictable gigs' },
        { value: 'medium', label: 'Medium — some variability is OK' },
        { value: 'high', label: 'Higher — willing to invest time/money for upside' },
      ]),
  },
  {
    id: 'si_schedule_flex',
    priority: 72,
    when: (u) =>
      u.confidence < 80 &&
      !!u.schedule &&
      !u.workStyle.scheduleFlex &&
      (u.schedule === 'flexible' || u.hoursPerWeek === 'under_5'),
    build: () =>
      q('si_schedule_flex', 'How fixed does your main job schedule need to stay?', [
        { value: 'very_fixed', label: 'Very fixed — side work must fit around shifts' },
        { value: 'somewhat_flex', label: 'Somewhat flexible' },
        { value: 'very_flex', label: 'Very flexible main schedule' },
      ]),
  },
  {
    id: 'si_professional_field',
    priority: 70,
    when: (u) =>
      u.confidence < 85 &&
      !!u.mainField &&
      (u.skills.includes('tech') || u.skills.includes('design') || u.skills.includes('admin')) &&
      !u.professionalField,
    build: () =>
      qFree(
        'si_professional_field',
        'If you have a professional skill, what specific service could you offer?',
        'Logo design, bookkeeping, web development, social media posts, CV writing'
      ),
  },
]

export function pickBestSideIncomeQuestion(
  u: SideIncomeUnderstanding
): { def: SideIncomeQuestionDef; question: CareerBrainQuestion } | null {
  const answered = new Set(u.askedIds)
  const candidates = BANK.filter((def) => !answered.has(def.id) && def.when(u))
  if (!candidates.length) return null
  candidates.sort((a, b) => b.priority - a.priority)
  const def = candidates[0]!
  return { def, question: def.build() }
}

export function describeSideIncomeQuestionReason(defId: string, u: SideIncomeUnderstanding): string {
  const gaps: string[] = []
  if (!u.employment) gaps.push('employment situation')
  if (!u.monthlyGoal) gaps.push('income target')
  if (!u.hoursPerWeek) gaps.push('available hours')
  if (!u.schedule) gaps.push('schedule')
  if (!u.mainField) gaps.push('skills background')
  if (!u.skills.length) gaps.push('transferable skills')
  if (!u.assets.length) gaps.push('available assets')
  if (!u.riskTolerance) gaps.push('risk tolerance')
  if (!u.incomeTimeline) gaps.push('income timeline')
  return `Need ${gaps.slice(0, 2).join(' and ') || 'specialist detail'} before recommending side income — asking ${defId}`
}
