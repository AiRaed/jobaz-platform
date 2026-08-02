import { getCareerPathById, type CareerPath } from '@/lib/career-paths'
import type { CareerHubCourseListing, CourseDemandLevel, CourseEntryLevel } from './types'
import { slugifyCourseName } from './slug'

const PLACEHOLDER_LOCATIONS = ['Newcastle', 'Manchester', 'Birmingham', 'Leeds', 'London', 'Online / UK-wide']

function hashPick(seed: string, list: string[]): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % list.length
  return list[h]!
}

function inferEntryLevel(course: CareerPath['courses'][number]): CourseEntryLevel {
  const t = `${course.name} ${course.type}`.toLowerCase()
  if (/introduction|starter|level 2|entry|basic|commis|green card/.test(t)) return 'entry'
  if (/level 3|diploma|advanced|professional|degree|nvq level 3/.test(t)) return 'advanced'
  return 'intermediate'
}

function entryLabel(level: CourseEntryLevel): string {
  if (level === 'entry') return 'Entry Level Friendly'
  if (level === 'advanced') return 'Advanced Route'
  return 'Some Experience Helpful'
}

function inferDemand(pathId: string, name: string): { demand: CourseDemandLevel; label: string } {
  const n = name.toLowerCase()
  if (/sia|care certificate|cscs|forklift|food hygiene|warehouse|hgv/.test(n)) {
    return { demand: 'high', label: 'High Demand' }
  }
  if (/warehouse|logistics|security|care|driving/.test(pathId)) {
    return { demand: 'high', label: 'High Demand' }
  }
  return { demand: 'steady', label: 'Growing Demand' }
}

export function enrichCourseListing(pathId: string, course: CareerPath['courses'][number]): CareerHubCourseListing {
  const path = getCareerPathById(pathId)
  const entryLevel = inferEntryLevel(course)
  const { demand, label: demandLabel } = inferDemand(pathId, course.name)
  const slug = slugifyCourseName(course.name)

  return {
    slug,
    name: course.name,
    pathId,
    description: `${course.name} for ${path?.title ?? 'your route'}. ${course.funding ?? ''}`.trim(),
    location: hashPick(slug, PLACEHOLDER_LOCATIONS),
    duration: course.duration,
    entryLevel,
    entryLevelLabel: entryLabel(entryLevel),
    demand,
    demandLabel,
    type: course.type,
    funding: course.funding,
    isExternalOfficial: true,
    officialSearchUrl: 'https://nationalcareers.service.gov.uk/find-a-course',
    providerPlaceholder: 'Training providers coming soon — use official UK search for now',
    providerUrl: undefined,
    affiliateUrl: undefined,
    referralPartner: undefined,
    commissionType: 'none',
    providers: [],
    comparisonEnabled: false,
    reviewsEnabled: false,
    referralEnabled: false,
  }
}

export function getCourseListing(pathId: string, courseSlug: string): CareerHubCourseListing | null {
  const path = getCareerPathById(pathId)
  if (!path) return null
  const course = path.courses.find((c) => slugifyCourseName(c.name) === courseSlug)
  if (!course) return null
  return enrichCourseListing(pathId, course)
}

export function listPathCourses(pathId: string): CareerHubCourseListing[] {
  /** Legacy placeholder catalogue — used by build-your-path only. Career Hub uses Supabase via /api/career-hub/courses. */
  const path = getCareerPathById(pathId)
  if (!path) return []
  return path.courses.map((c) => enrichCourseListing(pathId, c))
}
