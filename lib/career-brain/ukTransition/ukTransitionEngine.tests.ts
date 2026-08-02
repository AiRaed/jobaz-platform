/**

 * JAZ UK Transition Advisor tests — business-first pathway.

 * Run: npx tsx lib/career-brain/ukTransition/ukTransitionEngine.tests.ts

 */



import {

  buildUkTransitionIntelligence,

  isUkTransitionQuestioningComplete,

  pickNextUkTransitionEngineQuestion,

} from './ukTransitionEngine'

import type { CareerBrainState, CareerProfile } from '../types'



function assert(condition: boolean, message: string) {

  if (!condition) throw new Error(message)

}



function stateWith(answers: Record<string, unknown>): CareerBrainState {

  const keys = Object.keys(answers).filter((k) => k.startsWith('ntuk_'))

  return {

    answers: { cb_user_goal: 'new_to_uk', ...answers },

    career_brain_asked: keys,

  }

}



const profile = {

  domain: 'engineering',

  constraints: ['new-to-uk'],

  transferableSkills: [],

} as unknown as CareerProfile



function runTests() {

  const cold = stateWith({})

  const first = pickNextUkTransitionEngineQuestion(cold)

  assert(first.question?.id === 'ntuk_profile_type', `First Q should be profile type, got ${first.question?.id}`)



  const engineer = stateWith({

    ntuk_profile_type: 'degree',

    ntuk_main_goal: 'field_work',

    ntuk_interest_area: 'hands_on',

    ntuk_qualification_field: 'engineering',

  })



  assert(isUkTransitionQuestioningComplete(engineer), 'Engineer profile should complete in 4 answers')

  assert(engineer.career_brain_asked!.length <= 5, 'Should stay within 5 questions')

  const intel = buildUkTransitionIntelligence(profile, engineer)

  assert(intel !== null, 'Intelligence should build')

  assert(intel!.growth.finalReport.pathLetter === 'A', `Expected path A, got ${intel!.growth.finalReport.pathLetter}`)

  assert(intel!.growth.finalReport.recommendedRouteLabel === 'Engineering', 'Expected engineering route')

  const jobs = intel!.growth.finalReport.recommendedJobs.map((j) => j.title).join(' ')

  assert(/engineer|Engineer|technician/i.test(jobs), `Expected engineering roles: ${jobs}`)



  const nurse = stateWith({

    ntuk_profile_type: 'degree',

    ntuk_main_goal: 'long_term',

    ntuk_interest_area: 'healthcare_education',

    ntuk_qualification_field: 'healthcare',

  })

  const nurseIntel = buildUkTransitionIntelligence(profile, nurse)

  assert(nurseIntel !== null, 'Nurse intelligence')

  const courses = nurseIntel!.growth.finalReport.recommendedCourses.join(' ')

  assert(/IELTS|OET|PLAB|OSCE/i.test(courses), `Healthcare courses: ${courses}`)



  const scratch = stateWith({

    ntuk_profile_type: 'starting_scratch',

    ntuk_main_goal: 'quick_work',

    ntuk_interest_area: 'hands_on',

  })

  assert(isUkTransitionQuestioningComplete(scratch), 'Starting scratch should complete in 3 answers')

  const scratchIntel = buildUkTransitionIntelligence(profile, scratch)

  assert(scratchIntel!.growth.finalReport.pathLetter === 'D', `Expected path D`)

  assert(scratchIntel!.growth.finalReport.recommendedJobs.length >= 2, 'Should include job options')



  const shopOwner = stateWith({

    ntuk_profile_type: 'business',

    ntuk_main_goal: 'start_business',

    ntuk_interest_area: 'business',

  })

  assert(isUkTransitionQuestioningComplete(shopOwner), 'Business path should complete in 3 answers')

  const bizIntel = buildUkTransitionIntelligence(profile, shopOwner)

  assert(bizIntel!.growth.finalReport.pathLetter === 'C', `Expected path C`)



  const chef = stateWith({

    ntuk_profile_type: 'work_experience',

    ntuk_main_goal: 'field_work',

    ntuk_interest_area: 'people',

    ntuk_experience_area: 'hospitality',

  })

  assert(isUkTransitionQuestioningComplete(chef), 'Chef path should complete')

  const chefIntel = buildUkTransitionIntelligence(profile, chef)

  assert(/Food Hygiene|HACCP/i.test(chefIntel!.growth.finalReport.recommendedCourses.join(' ')), 'Chef courses')

  assert(chefIntel!.growth.finalReport.whyRecommended.includes('experience'), 'Should respect experience')



  console.log('✓ UK Transition engine tests passed')

}



runTests()


