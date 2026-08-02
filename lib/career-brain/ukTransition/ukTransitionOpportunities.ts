/**
 * New to the UK — practical routes, courses, and jobs (business-first).
 */

import type { UkTransitionUnderstanding } from './ukTransitionTypes'
import { getRouteContent, NO_COURSE_FALLBACK } from './ukRouteContent'

export { getRouteContent } from './ukRouteContent'

export function buildWhatYouBring(u: UkTransitionUnderstanding): string[] {
  const items: string[] = []
  if (u.profileType === 'degree') items.push('Degree or professional qualification')
  if (u.profileType === 'work_experience') items.push('Work experience from another country')
  if (u.profileType === 'business') items.push('Business or management experience')
  if (u.profileType === 'starting_scratch') items.push('Motivation to build a UK career from the ground up')
  if (u.profession) items.push(`Focus area: ${u.profession}`)
  if (u.mainGoal === 'quick_work') items.push('Priority: find work quickly')
  if (u.mainGoal === 'long_term') items.push('Priority: long-term career growth')
  return items.slice(0, 4)
}

export function buildFastestRoute(u: UkTransitionUnderstanding): string {
  const route = getRouteContent(u)
  if (u.mainGoal === 'quick_work' && route.noCourseJobs.length) {
    return `Apply for ${route.noCourseJobs.slice(0, 2).join(' or ')} now — add ${route.courses[0] ?? 'training'} when ready.`
  }
  if (route.courses.length) {
    return `${route.courses[0]} plus targeted applications for ${route.jobs[0]?.title ?? 'roles in this sector'}.`
  }
  return route.nextStep
}

export function buildLongTermPath(u: UkTransitionUnderstanding): string {
  return getRouteContent(u).longTerm
}

export function buildQualificationPath(u: UkTransitionUnderstanding): string | undefined {
  if (u.profileType !== 'degree') return undefined
  return `Verify your ${u.profession ?? 'professional'} qualification via ENIC/NARIC and the relevant UK body while working in a related support role if helpful.`
}

export function buildCertifications(u: UkTransitionUnderstanding): string[] {
  return getRouteContent(u).courses.slice(0, 3)
}

export function buildRecommendedJobs(u: UkTransitionUnderstanding): Array<{ title: string; why: string }> {
  const route = getRouteContent(u)
  const jobs = [...route.jobs]
  if (route.courses.length === 0 || u.mainGoal === 'quick_work') {
    for (const title of route.noCourseJobs.slice(0, 2)) {
      if (!jobs.some((j) => j.title === title)) {
        jobs.push({ title, why: 'Realistic option without waiting for training.' })
      }
    }
  }
  return jobs.slice(0, 4)
}

export function buildBusinessPotential(u: UkTransitionUnderstanding): string | undefined {
  if (u.profileType !== 'business') return undefined
  return getRouteContent(u).summary
}

export function buildCourses(u: UkTransitionUnderstanding): string[] {
  return getRouteContent(u).courses.slice(0, 3)
}

export function buildNextActions(u: UkTransitionUnderstanding): string[] {
  const route = getRouteContent(u)
  const actions = [route.nextStep]
  if (route.courses.length) {
    actions.push(`Explore ${route.courses.slice(0, 2).join(' and ')} — optional but helpful.`)
  } else {
    actions.push(`Apply for roles such as ${NO_COURSE_FALLBACK.slice(0, 2).join(' or ')} while planning your next step.`)
  }
  actions.push('Save your path on JobAZ and track applications.')
  return actions.slice(0, 3)
}

export function buildTransferableSkills(u: UkTransitionUnderstanding): string[] {
  return buildWhatYouBring(u)
}

export function buildBarriers(u: UkTransitionUnderstanding): string[] {
  return ['Building your first UK references — a common step for new arrivals, and very achievable.']
}

export function buildWhyRecommended(u: UkTransitionUnderstanding): string {
  return getRouteContent(u).whyRecommended
}

export function buildTransitionSummary(u: UkTransitionUnderstanding): string {
  const route = getRouteContent(u)
  const label = u.routeLabel ?? 'Your recommended route'
  return `${route.summary} Recommended route: ${label}.`
}

export function buildBestNextStep(u: UkTransitionUnderstanding): string {
  return getRouteContent(u).nextStep
}

