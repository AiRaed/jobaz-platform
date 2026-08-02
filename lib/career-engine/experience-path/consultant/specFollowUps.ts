/**
 * Per-specialisation follow-up questions for multi-select interview flows.
 */

import type { CareerEngineQuestion } from '@/lib/career-engine/conversation/types'
import type { UkFact } from './ukProfessionFacts'
import type { ProfessionInterviewQuestion } from './professionInterview'
import { shouldAskExperienceQuestion } from './interviewDedup'
import { isMultiSelectQuestion, parseMultiSelectValue } from './multiSelect'
import {
  NEW_SHARED_INDUSTRY_QUESTIONS,
  NEW_SPEC_FOLLOW_UP_QUESTIONS,
  NEW_SPEC_SKILLS,
} from '../industries/newExperienceSectors'

const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

function fq(
  id: string,
  text: string,
  options: Array<{ value: string; label: string }>,
  extra?: Partial<ProfessionInterviewQuestion>
): ProfessionInterviewQuestion {
  return { id, text, options, ...extra }
}

/** Shared across all specs in an industry group — asked once */
export const SHARED_INDUSTRY_QUESTIONS: Record<string, ProfessionInterviewQuestion[]> = {
  security: [fq('dbs_clear', 'Do you have an enhanced DBS check?', YES_NO)],
  warehouse_logistics: [fq('wms_systems', 'Have you used WMS warehouse systems?', YES_NO)],
  ...Object.fromEntries(
    Object.entries(NEW_SHARED_INDUSTRY_QUESTIONS).map(([key, questions]) => [
      key,
      questions.map((q) => fq(q.id, q.text, q.options)),
    ])
  ),
}

/** Targeted follow-ups per specialisation id */
export const SPEC_FOLLOW_UP_QUESTIONS: Record<string, ProfessionInterviewQuestion[]> = {
  door_supervisor: [
    fq('sia_ds_licence', 'Do you hold a valid SIA Door Supervisor licence?', YES_NO),
    fq('conflict_management', 'Do you have conflict management training for licensed premises?', YES_NO),
  ],
  security_guard: [fq('sia_sg_licence', 'Do you hold a valid SIA Security Guard licence?', YES_NO)],
  cctv_operator: [
    fq('sia_cctv_licence', 'Do you hold a valid SIA CCTV (Public Space Surveillance) licence?', YES_NO),
    fq('control_room_exp', 'Have you worked in a control room or used CCTV monitoring systems?', YES_NO),
  ],
  close_protection: [fq('sia_cp_licence', 'Do you hold a valid SIA Close Protection licence?', YES_NO)],
  event_security: [fq('sia_ds_licence', 'Do you hold a valid SIA Door Supervisor licence?', YES_NO)],
  control_room_operator: [
    fq('sia_cctv_licence', 'Do you hold a valid SIA CCTV licence?', YES_NO),
    fq('control_room_exp', 'Have you worked in a control room or monitoring centre?', YES_NO),
  ],
  forklift_driver: [
    fq('forklift_licence', 'Do you hold a forklift licence (FLT)?', YES_NO),
    fq('forklift_type', 'Which forklift types can you operate?', [
      { value: 'counterbalance', label: 'Counterbalance' },
      { value: 'reach', label: 'Reach truck' },
      { value: 'both', label: 'Both' },
      { value: 'none', label: 'None yet' },
    ], { allowMultiple: true }),
  ],
  forklift_operator: [
    fq('forklift_licence', 'Do you hold a forklift licence (FLT)?', YES_NO),
    fq('forklift_type', 'Which forklift types can you operate?', [
      { value: 'counterbalance', label: 'Counterbalance' },
      { value: 'reach', label: 'Reach truck' },
      { value: 'both', label: 'Both' },
      { value: 'none', label: 'None yet' },
    ], { allowMultiple: true }),
  ],
  warehouse_operative: [
    fq('forklift_licence', 'Do you hold a forklift licence (FLT)?', YES_NO),
    fq('picker_packer_exp', 'Experience as picker/packer?', YES_NO),
  ],
  picker_packer: [fq('picker_packer_exp', 'Experience as picker/packer?', YES_NO)],
  qa_engineer: [
    fq('testing_type', 'Primary testing experience?', [
      { value: 'manual', label: 'Manual QA' },
      { value: 'automation', label: 'Test automation' },
      { value: 'both', label: 'Both' },
    ]),
    fq('github_portfolio', 'Do you have test automation examples on GitHub?', YES_NO),
    fq('istqb', 'Do you hold ISTQB or similar certification?', YES_NO),
    fq('tools_used', 'Which testing tools have you used?', [
      { value: 'selenium', label: 'Selenium / Cypress' },
      { value: 'postman', label: 'Postman / API testing' },
      { value: 'jmeter', label: 'JMeter / performance' },
      { value: 'playwright', label: 'Playwright' },
      { value: 'other', label: 'Other' },
    ], { allowMultiple: true }),
  ],
  frontend_developer: [
    fq('primary_languages', 'Which languages do you use professionally?', [
      { value: 'javascript_ts', label: 'JavaScript / TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java_csharp', label: 'Java / C#' },
      { value: 'other', label: 'Other' },
    ], { allowMultiple: true }),
    fq('github_portfolio', 'Do you have a GitHub or live project portfolio?', YES_NO),
  ],
  backend_developer: [
    fq('primary_languages', 'Which languages do you use professionally?', [
      { value: 'javascript_ts', label: 'JavaScript / TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java_csharp', label: 'Java / C#' },
      { value: 'go_rust', label: 'Go / Rust' },
      { value: 'other', label: 'Other' },
    ], { allowMultiple: true }),
    fq('github_portfolio', 'Do you have a GitHub or API portfolio?', YES_NO),
    fq('cloud_experience', 'Commercial cloud experience (AWS, Azure, GCP)?', [
      { value: 'yes', label: 'Yes' },
      { value: 'some', label: 'Some exposure' },
      { value: 'no', label: 'No' },
    ]),
  ],
  full_stack_developer: [
    fq('primary_languages', 'Which languages do you use professionally?', [
      { value: 'javascript_ts', label: 'JavaScript / TypeScript' },
      { value: 'python', label: 'Python' },
      { value: 'java_csharp', label: 'Java / C#' },
      { value: 'other', label: 'Other' },
    ], { allowMultiple: true }),
    fq('github_portfolio', 'Do you have a GitHub or live project portfolio?', YES_NO),
    fq('cloud_experience', 'Commercial cloud experience (AWS, Azure, GCP)?', [
      { value: 'yes', label: 'Yes' },
      { value: 'some', label: 'Some exposure' },
      { value: 'no', label: 'No' },
    ]),
  ],
  nurse: [
    fq('nmc_registered', 'Do you have an active NMC PIN?', YES_NO),
    fq('nhs_experience', 'Do you have NHS nursing experience?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('nhs_experience', a),
    }),
    fq('overseas_nursing', 'Was your nursing qualification obtained outside the UK?', YES_NO, {
      when: (a) => shouldAskExperienceQuestion('overseas_nursing', a),
    }),
  ],
  care_assistant: [
    fq('care_certificate', 'Have you completed the Care Certificate?', YES_NO),
    fq('direct_care', 'Experience providing hands-on personal care?', YES_NO),
  ],
  electrician: [
    fq('ecs_card', 'Do you hold an ECS card?', YES_NO),
    fq('edition_18', 'Have you passed 18th Edition Wiring Regulations?', YES_NO),
    fq('nvq_level3', 'Do you hold NVQ Level 3 Electrical (or equivalent)?', YES_NO),
  ],
  hgv_driver: [
    fq('hgv_category', 'Which HGV categories do you hold or need?', [
      { value: 'cat_c', label: 'Category C (rigid)' },
      { value: 'cat_ce', label: 'Category C+E (artic)' },
      { value: 'none', label: 'Not yet — need training' },
    ], { allowMultiple: true }),
    fq('driver_cpc', 'Do you have a valid Driver CPC?', YES_NO),
    fq('uk_driving_licence', 'Do you hold a UK driving licence?', YES_NO),
  ],
  taxi_driver: [
    fq('phv_or_taxi', 'Are you targeting PHV (private hire) or Hackney taxi (black cab)?', [
      { value: 'phv', label: 'PHV / Private Hire' },
      { value: 'hackney', label: 'Hackney Carriage (black cab)' },
      { value: 'both', label: 'Open to both' },
    ]),
    fq('council_licence', 'Do you already have a local authority taxi/PHV licence?', YES_NO),
    fq('uk_driving_licence', 'Do you hold a valid UK driving licence?', YES_NO),
  ],
  ...Object.fromEntries(
    Object.entries(NEW_SPEC_FOLLOW_UP_QUESTIONS).map(([specId, questions]) => [
      specId,
      questions.map((q) => fq(q.id, q.text, q.options)),
    ])
  ),
}

const yes = (k: string) => (a: Record<string, string>) => a[k] === 'yes'

export const SPEC_PROFILE_FACTS: Record<string, UkFact[]> = {
  door_supervisor: [
    {
      id: 'sia_ds',
      title: 'SIA Door Supervisor Licence',
      description: 'Mandatory for door supervision and licensed premises work in the UK.',
      href: 'https://www.sia.homeoffice.gov.uk/',
      kind: 'licence',
      priority: 'mandatory',
      satisfiedWhen: yes('sia_ds_licence'),
      course: {
        id: 'sia_ds_course',
        title: 'SIA Door Supervisor Course',
        whyReasons: ['Required for Door Supervisor roles in the UK.'],
        duration: '6 days',
        costLabel: 'Paid',
      },
    },
    {
      id: 'conflict_mgmt',
      title: 'Conflict Management Training',
      description: 'Expected for Door Supervisor and licensed premises roles.',
      kind: 'certification',
      priority: 'recommended',
      satisfiedWhen: yes('conflict_management'),
    },
  ],
  cctv_operator: [
    {
      id: 'sia_cctv',
      title: 'SIA CCTV (Public Space Surveillance) Licence',
      description: 'Mandatory for CCTV operator and public space surveillance roles.',
      href: 'https://www.sia.homeoffice.gov.uk/',
      kind: 'licence',
      priority: 'mandatory',
      satisfiedWhen: yes('sia_cctv_licence'),
      course: {
        id: 'sia_cctv_course',
        title: 'SIA CCTV Operator Course',
        whyReasons: ['Required for CCTV and control room security roles.'],
        duration: '3–4 days',
        costLabel: 'Paid',
      },
    },
    {
      id: 'control_room',
      title: 'Control Room / CCTV Monitoring Experience',
      description: 'UK CCTV employers expect evidence of monitoring systems experience.',
      kind: 'skill',
      priority: 'recommended',
      satisfiedWhen: yes('control_room_exp'),
    },
  ],
  control_room_operator: [
    {
      id: 'sia_cctv',
      title: 'SIA CCTV Licence',
      description: 'Mandatory for control room and CCTV monitoring roles.',
      href: 'https://www.sia.homeoffice.gov.uk/',
      kind: 'licence',
      priority: 'mandatory',
      satisfiedWhen: yes('sia_cctv_licence'),
    },
  ],
  security_guard: [
    {
      id: 'sia_sg',
      title: 'SIA Security Guard Licence',
      description: 'Mandatory for static guarding roles.',
      href: 'https://www.sia.homeoffice.gov.uk/',
      kind: 'licence',
      priority: 'mandatory',
      satisfiedWhen: yes('sia_sg_licence'),
    },
  ],
  forklift_driver: [
    {
      id: 'flt_reach',
      title: 'Reach Truck Licence',
      description: 'Required for reach truck operations in UK warehouses.',
      kind: 'licence',
      priority: 'mandatory',
      appliesWhen: (a) => parseMultiSelectValue(a.forklift_type).includes('reach') || a.forklift_type === 'reach',
      satisfiedWhen: yes('forklift_licence'),
      course: {
        id: 'reach_truck',
        title: 'Reach Truck Training (RTITB/ITSSAR)',
        whyReasons: ['Unlocks higher-paying warehouse FLT roles.'],
        duration: '2–3 days',
        costLabel: 'Paid',
      },
    },
    {
      id: 'flt_cb',
      title: 'Counterbalance Forklift Licence',
      description: 'Standard FLT accreditation for UK warehouse sites.',
      kind: 'licence',
      priority: 'mandatory',
      appliesWhen: (a) => {
        const types = parseMultiSelectValue(a.forklift_type)
        return types.includes('counterbalance') || types.includes('both') || a.forklift_type === 'counterbalance'
      },
      satisfiedWhen: yes('forklift_licence'),
      course: {
        id: 'counterbalance_flt',
        title: 'Counterbalance Forklift Training',
        whyReasons: ['Required for most UK warehouse FLT roles.'],
        duration: '2–3 days',
        costLabel: 'Paid',
      },
    },
  ],
}

const INDUSTRY_SHARED_KEY: Record<string, string> = {
  security: 'security',
  warehouse_logistics: 'warehouse_logistics',
  education_teaching: 'education_teaching',
  cleaning_facilities: 'cleaning_facilities',
}

export function getIndustrySharedKey(industryId: string): string | null {
  return INDUSTRY_SHARED_KEY[industryId] ?? null
}

export function buildSpecFollowUpQuestions(
  specIds: string[],
  industryId: string,
  answers: Record<string, string>
): CareerEngineQuestion[] {
  const seen = new Set<string>()
  const out: CareerEngineQuestion[] = []

  const sharedKey = getIndustrySharedKey(industryId)
  if (sharedKey && SHARED_INDUSTRY_QUESTIONS[sharedKey]) {
    for (const question of SHARED_INDUSTRY_QUESTIONS[sharedKey]) {
      if (seen.has(question.id)) continue
      if (!shouldAskExperienceQuestion(question.id, answers)) continue
      if (question.when && !question.when(answers)) continue
      seen.add(question.id)
      const { when: _w, archetypes: _a, ...rest } = question
      out.push({
        ...rest,
        allowMultiple: question.allowMultiple ?? isMultiSelectQuestion(question.id),
        helperText:
          question.allowMultiple || isMultiSelectQuestion(question.id) ? 'Select all that apply.' : undefined,
      })
    }
  }

  for (const specId of specIds) {
    const block = SPEC_FOLLOW_UP_QUESTIONS[specId]
    if (!block) continue
    for (const question of block) {
      if (seen.has(question.id)) continue
      if (!shouldAskExperienceQuestion(question.id, answers)) continue
      if (question.when && !question.when(answers)) continue
      seen.add(question.id)
      const { when: _w, archetypes: _a, ...rest } = question
      out.push({
        ...rest,
        allowMultiple: question.allowMultiple ?? isMultiSelectQuestion(question.id),
        helperText:
          question.allowMultiple || isMultiSelectQuestion(question.id) ? 'Select all that apply.' : undefined,
      })
    }
  }

  return out
}

export function getSpecProfileFacts(specId: string): UkFact[] {
  return SPEC_PROFILE_FACTS[specId] ?? []
}

export const SPEC_SKILLS: Record<string, string[]> = {
  door_supervisor: ['Conflict management', 'Incident reporting', 'Licensed premises safety', 'Customer safety'],
  cctv_operator: ['CCTV monitoring', 'Surveillance systems', 'Incident reporting', 'Access control'],
  control_room_operator: ['Control room operations', 'CCTV monitoring', 'Radio communication', 'Incident escalation'],
  forklift_driver: ['FLT operation', 'Warehouse safety', 'Load handling', 'PPE compliance'],
  qa_engineer: ['Test case design', 'Regression testing', 'Defect reporting', 'API testing'],
  ...NEW_SPEC_SKILLS,
}
