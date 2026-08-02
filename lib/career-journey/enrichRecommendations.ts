import type { CareerBrainOutput, CareerPathRole } from '@/lib/career-brain/types'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { getActionUrls } from '@/lib/uk-career-assistant/action-map'
import { listPathCourses } from '@/lib/career-hub/courseCatalog'
import { slugifyCourseName } from '@/lib/career-hub/slug'
import { careerHubPathHref, courseDetailHref } from '@/lib/career-hub/myPlan'
import type {
  CareerTimelineStep,
  CourseRecommendation,
  JobRecommendation,
} from './actionPlanTypes'

function jobHref(title: string, directionId?: string): string {
  if (directionId) return getActionUrls(directionId, title).jobFinderUrl
  return `/job-finder?keyword=${encodeURIComponent(title)}`
}

function normalizeDifficulty(
  value?: string | 'Low' | 'Medium' | 'High'
): JobRecommendation['entryDifficulty'] {
  const v = (value ?? '').toLowerCase()
  if (v === 'low' || v === 'easy') return 'Easy'
  if (v === 'high' || v === 'hard' || v === 'advanced') return 'Advanced'
  if (v === 'medium') return 'Medium'
  return 'Medium'
}

function inferJobMeta(title: string, role?: Partial<CareerPathRole>): Omit<JobRecommendation, 'id' | 'title' | 'href' | 'searchKeyword'> {
  const t = title.toLowerCase()
  const salary =
    role?.expectedSalary ??
    (t.includes('cleaner')
      ? '£22k–£28k'
      : t.includes('warehouse')
        ? '£24k–£30k'
        : t.includes('security') || t.includes('sia')
          ? '£23k–£28k'
          : t.includes('care') || t.includes('support worker')
            ? '£22k–£26k'
            : t.includes('driver') || t.includes('hgv')
              ? '£28k–£38k'
              : '£22k–£32k')

  const demand: JobRecommendation['demandLevel'] =
    /security|care|warehouse|cleaner|driver|hospitality|retail/.test(t) ? 'High' : 'Medium'

  const hiringSpeed =
    demand === 'High' ? '1–3 weeks' : demand === 'Medium' ? '2–6 weeks' : '4–8 weeks'

  const badges: string[] = []
  if (/cleaner|warehouse|retail|hospitality/.test(t)) badges.push('No experience')
  if (/security|sia|door supervisor/.test(t)) badges.push('Licence required')
  if (/care|support/.test(t)) badges.push('Customer service')
  if (/driver|hgv|cpc/.test(t)) badges.push('Driving licence')
  if (/construction|cscs|labourer/.test(t)) badges.push('CSCS helpful')
  if (role?.stepType === 'training') badges.push('Training route')

  return {
    subtitle: role?.domain ? role.domain.replace(/_/g, ' ') : undefined,
    salaryRange: salary,
    entryDifficulty: normalizeDifficulty(role?.entryDifficulty),
    demandLevel: demand,
    hiringSpeed,
    badges: badges.slice(0, 3),
  }
}

function roleToJob(
  title: string,
  role: Partial<CareerPathRole> | undefined,
  directionId: string | undefined,
  index: number
): JobRecommendation {
  const meta = inferJobMeta(title, role)
  return {
    id: `job-${index}-${slugifyCourseName(title)}`,
    title,
    href: jobHref(title, directionId),
    searchKeyword: title,
    ...meta,
  }
}

export function buildJobRecommendations(
  brain: CareerBrainOutput | null,
  result: UkCareerRuleResult,
  limit = 3
): JobRecommendation[] {
  const jobs: JobRecommendation[] = []
  const seen = new Set<string>()

  const push = (title: string, role?: Partial<CareerPathRole>, directionId?: string) => {
    const key = title.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    jobs.push(roleToJob(title, role, directionId, jobs.length))
  }

  for (const role of brain?.recommendedPaths.workNow ?? []) {
    push(role.title, role)
  }
  for (const job of brain?.ukTransitionGrowth?.finalReport?.recommendedJobs ?? []) {
    push(job.title)
  }
  for (const dir of result.work_now?.directions ?? []) {
    push(dir.direction_title, undefined, dir.direction_id)
  }

  return jobs.slice(0, limit)
}

type CourseMeta = {
  duration?: string
  costLabel?: string
  qualification?: string
  careerImpact?: string
  salaryImprovement?: string
  pathId?: string
}

function inferCourseMeta(name: string, pathId?: string): CourseMeta {
  const n = name.toLowerCase()

  const fromCatalog = pathId
    ? listPathCourses(pathId).find(
        (c) =>
          c.name.toLowerCase().includes(n) ||
          n.includes(c.name.toLowerCase().slice(0, 8))
      )
    : undefined

  if (fromCatalog) {
    const free = /free|funded|fully funded/i.test(fromCatalog.funding ?? '')
    return {
      duration: fromCatalog.duration?.replace(/^duration:\s*/i, '') || undefined,
      costLabel: free ? 'Free' : 'Paid',
      qualification: fromCatalog.type || 'Certificate',
      careerImpact: fromCatalog.demandLabel || 'High impact',
      salaryImprovement: free ? 'Unlocks entry-level roles' : 'Improves employability',
      pathId,
    }
  }

  if (/cscs/i.test(n)) {
    return {
      duration: '1 Day',
      costLabel: 'Paid',
      qualification: 'CSCS Card',
      careerImpact: 'Required for construction sites',
      salaryImprovement: '+£2k–£4k typical',
      pathId: pathId ?? 'construction-trades',
    }
  }
  if (/sia|door supervisor/i.test(n)) {
    return {
      duration: '4 Days',
      costLabel: 'Paid',
      qualification: 'SIA Licence',
      careerImpact: 'Unlocks security roles',
      salaryImprovement: '+£3k–£5k typical',
      pathId: pathId ?? 'security-facilities',
    }
  }
  if (/english|esol|ielts/i.test(n)) {
    return {
      duration: '6 Weeks',
      costLabel: 'Free',
      qualification: 'Language certificate',
      careerImpact: 'Improves interview confidence',
      salaryImprovement: 'Broader job options',
      pathId: pathId ?? 'office-admin',
    }
  }
  if (/forklift/i.test(n)) {
    return {
      duration: '2 Days',
      costLabel: 'Paid',
      qualification: 'Forklift certificate',
      careerImpact: 'Warehouse progression',
      salaryImprovement: '+£2k–£3k typical',
      pathId: pathId ?? 'warehouse-logistics',
    }
  }
  if (/care certificate|nvq care/i.test(n)) {
    return {
      duration: '4–8 Weeks',
      costLabel: 'Funded',
      qualification: 'Care Certificate',
      careerImpact: 'Required for care roles',
      salaryImprovement: '+£2k–£4k typical',
      pathId: pathId ?? 'care-support',
    }
  }
  if (/food hygiene/i.test(n)) {
    return {
      duration: '1 Day',
      costLabel: 'Low cost',
      qualification: 'Food Hygiene',
      careerImpact: 'Hospitality entry',
      pathId: pathId ?? 'hospitality-front',
    }
  }

  return {
    duration: '2–8 Weeks',
    costLabel: 'Varies',
    qualification: 'Certificate',
    careerImpact: 'Builds route readiness',
    pathId,
  }
}

function courseHref(name: string, pathId?: string): string {
  if (pathId) {
    const slug = slugifyCourseName(name)
    const listing = listPathCourses(pathId).find((c) => c.slug === slug)
    if (listing) return courseDetailHref(pathId, listing.slug)
    return careerHubPathHref(pathId)
  }
  return '/career-hub'
}

export function buildCourseRecommendations(
  brain: CareerBrainOutput | null,
  pathId: string | undefined,
  limit = 3
): CourseRecommendation[] {
  const courses: CourseRecommendation[] = []
  const seen = new Set<string>()

  const push = (raw: string, pathHint?: string) => {
    const title = raw.trim()
    const key = title.toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    const meta = inferCourseMeta(title, pathHint ?? pathId)
    courses.push({
      id: `course-${courses.length}-${slugifyCourseName(title)}`,
      title,
      href: courseHref(title, meta.pathId ?? pathId),
      searchKeyword: title,
      duration: meta.duration,
      costLabel: meta.costLabel,
      qualification: meta.qualification,
      careerImpact: meta.careerImpact,
      salaryImprovement: meta.salaryImprovement,
      pathId: meta.pathId ?? pathId,
    })
  }

  for (const role of brain?.recommendedPaths.buildNext ?? []) {
    if (role.stepType === 'training' || role.recommendedTraining?.length) {
      push(role.title, undefined)
    }
    for (const t of role.recommendedTraining ?? []) push(t)
  }
  for (const c of brain?.recommendedCourses ?? []) push(c)
  for (const t of brain?.careerChangeTransition?.recommendedTraining ?? []) push(t)
  for (const t of brain?.ukTransitionGrowth?.finalReport?.recommendedCertifications ?? []) push(t)
  for (const t of brain?.growCareerGrowth?.recommendedCertifications ?? []) push(t)

  if (courses.length === 0 && pathId) {
    for (const c of listPathCourses(pathId).slice(0, limit)) {
      push(c.name, pathId)
    }
  }

  return courses.slice(0, limit)
}

export function buildCareerTimeline(
  brain: CareerBrainOutput | null,
  result: UkCareerRuleResult,
  jobs: JobRecommendation[],
  courses: CourseRecommendation[]
): CareerTimelineStep[] {
  const steps: CareerTimelineStep[] = [{ id: 'today', label: 'Today', kind: 'today' }]
  const seen = new Set<string>(['today'])

  const add = (id: string, label: string, kind: CareerTimelineStep['kind']) => {
    const key = label.trim().toLowerCase()
    if (!key || seen.has(key)) return
    seen.add(key)
    steps.push({ id, label, kind })
  }

  if (jobs[0]) add(jobs[0].id, jobs[0].title, 'role')
  if (jobs[1]) add(jobs[1].id, jobs[1].title, 'role')

  const ladderRoles = brain?.recommendedPaths.longTerm ?? []
  for (const role of ladderRoles.slice(0, 3)) {
    add(`lt-${slugifyCourseName(role.title)}`, role.title, 'role')
  }

  for (const course of courses.slice(0, 2)) {
    add(course.id, course.title, 'qualification')
  }

  const goal =
    ladderRoles[ladderRoles.length - 1]?.title ??
    brain?.growCareerGrowth?.promotionRoadmap?.longTerm ??
    brain?.ukTransitionGrowth?.finalReport?.targetRole ??
    result.improve_later?.directions?.[0]?.direction_title

  if (goal) {
    add('goal', goal, 'goal')
  } else if (jobs[2]) {
    add(jobs[2].id, jobs[2].title, 'goal')
  }

  return steps.slice(0, 6)
}

export function countCatalogCourses(name: string, pathId?: string): number {
  const n = name.toLowerCase()
  if (pathId) {
    return listPathCourses(pathId).filter((c) => c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase().slice(0, 6))).length
  }
  return 0
}
