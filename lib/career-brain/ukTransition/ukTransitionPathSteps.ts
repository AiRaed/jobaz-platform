/**

 * New to the UK — practical 3-step path (not immigration/legal steps).

 */



import type { UkPathStep, UkTransitionUnderstanding } from './ukTransitionTypes'

import { buildBestNextStep, getRouteContent } from './ukTransitionOpportunities'



export function buildTargetRole(u: UkTransitionUnderstanding): string {

  const route = getRouteContent(u)

  const primary = route.jobs[0]?.title ?? u.routeLabel ?? 'Stable UK employment'

  if (u.mainGoal === 'long_term') return route.longTerm.split('.')[0] ?? primary

  return primary

}



export function buildUkPathSteps(u: UkTransitionUnderstanding): UkPathStep[] {

  const route = getRouteContent(u)

  const steps: UkPathStep[] = [

    {

      step: 1,

      title: 'Understand your route',

      description: `${u.routeLabel ?? 'Your path'} — ${route.whyRecommended}`,

    },

  ]



  if (route.courses.length) {

    steps.push({

      step: 2,

      title: 'Optional training (1–3 courses)',

      description: `Consider ${route.courses.slice(0, 3).join(', ')} — helpful but not always required before your first application.`,

    })

  } else {

    steps.push({

      step: 2,

      title: 'Apply without waiting for courses',

      description: `Realistic roles now: ${route.noCourseJobs.slice(0, 3).join(', ')}.`,

    })

  }



  steps.push({

    step: steps.length + 1,

    title: 'Target roles',

    description: route.jobs.map((j) => j.title).slice(0, 3).join(' · ') || 'Roles matched to your background.',

  })



  steps.push({

    step: steps.length + 1,

    title: 'Next step this week',

    description: buildBestNextStep(u),

  })



  return steps.map((s, i) => ({ ...s, step: i + 1 }))

}



export function buildBestNextAction(u: UkTransitionUnderstanding, _steps: UkPathStep[]): string {

  return buildBestNextStep(u)

}


