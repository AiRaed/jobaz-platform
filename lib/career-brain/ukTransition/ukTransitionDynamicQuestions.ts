/**

 * New to the UK — 3 core questions + optional follow-up (max 5 total).

 */



import type { CareerBrainQuestion } from '../types'

import { MAX_UK_TRANSITION_QUESTIONS } from './ukTransitionUnderstanding'

import type { UkTransitionUnderstanding } from './ukTransitionTypes'



type DynDef = {

  id: string

  priority: number

  when: (u: UkTransitionUnderstanding) => boolean

  build: () => CareerBrainQuestion

}



function q(

  id: string,

  text: string,

  options: Array<{ value: string; label: string }>

): CareerBrainQuestion {

  return { id, text, type: 'single', options, allow_free_text: false }

}



function answered(u: UkTransitionUnderstanding, id: string): boolean {

  return u.askedIds.includes(id)

}



const CORE: DynDef[] = [

  {

    id: 'ntuk_profile_type',

    priority: 100,

    when: (u) => !u.profileType,

    build: () =>

      q('ntuk_profile_type', 'What best describes you?', [

        { value: 'degree', label: 'I have a degree or professional qualification' },

        { value: 'work_experience', label: 'I have work experience from another country' },

        { value: 'business', label: 'I owned or managed a business' },

        { value: 'starting_scratch', label: 'I am starting from scratch' },

      ]),

  },

  {

    id: 'ntuk_main_goal',

    priority: 99,

    when: (u) => Boolean(u.profileType) && !u.mainGoal,

    build: () =>

      q('ntuk_main_goal', 'What is your main goal?', [

        { value: 'quick_work', label: 'Find work quickly' },

        { value: 'field_work', label: 'Work in my field' },

        { value: 'long_term', label: 'Build a long-term career' },

        { value: 'start_business', label: 'Start a business' },

      ]),

  },

  {

    id: 'ntuk_interest_area',

    priority: 98,

    when: (u) => Boolean(u.profileType && u.mainGoal) && !u.interestArea,

    build: () =>

      q('ntuk_interest_area', 'Which area interests you most?', [

        { value: 'people', label: 'Working with people' },

        { value: 'hands_on', label: 'Practical / hands-on work' },

        { value: 'driving', label: 'Driving & transport' },

        { value: 'office', label: 'Office & administration' },

        { value: 'healthcare_education', label: 'Healthcare & education' },

        { value: 'business', label: 'Business & self-employment' },

      ]),

  },

]



const FOLLOW_UP: DynDef[] = [

  {

    id: 'ntuk_qualification_field',

    priority: 90,

    when: (u) => u.profileType === 'degree' && !u.qualificationField && !answered(u, 'ntuk_qualification_field'),

    build: () =>

      q('ntuk_qualification_field', 'Which field is closest to your qualification?', [

        { value: 'healthcare', label: 'Healthcare' },

        { value: 'education', label: 'Education' },

        { value: 'engineering', label: 'Engineering' },

        { value: 'accounting', label: 'Accounting & Finance' },

        { value: 'it', label: 'IT & Technology' },

        { value: 'business', label: 'Business & Management' },

        { value: 'other', label: 'Other' },

      ]),

  },

  {

    id: 'ntuk_experience_area',

    priority: 90,

    when: (u) =>

      u.profileType === 'work_experience' && !u.experienceArea && !answered(u, 'ntuk_experience_area'),

    build: () =>

      q('ntuk_experience_area', 'Which area best matches your experience?', [

        { value: 'hospitality', label: 'Hospitality' },

        { value: 'construction', label: 'Construction' },

        { value: 'driving', label: 'Driving' },

        { value: 'trades', label: 'Trades' },

        { value: 'admin', label: 'Administration' },

        { value: 'healthcare', label: 'Healthcare' },

        { value: 'other', label: 'Other' },

      ]),

  },

]



export function pickNextUkTransitionQuestion(

  u: UkTransitionUnderstanding

): { question: CareerBrainQuestion; id: string; reason: string } | null {

  if (u.questionCount >= MAX_UK_TRANSITION_QUESTIONS) return null



  const answeredSet = new Set(u.askedIds)

  const pool = [...CORE, ...FOLLOW_UP].filter((d) => !answeredSet.has(d.id) && d.when(u))



  if (!pool.length) return null



  pool.sort((a, b) => b.priority - a.priority)

  const def = pool[0]!

  return {

    question: def.build(),

    id: def.id,

    reason: 'New to the UK — practical career path discovery',

  }

}


