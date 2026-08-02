import { isSupabaseCoursesConfigured } from '@/lib/admin/courses/repository'
import { loadMockAdminCourses } from '@/lib/admin/courses/mockStore'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import { courseRowToAdminCourse } from '@/lib/admin/courses/mappers'
import { loadAllCourseOpportunities } from '@/lib/admin/opportunities/supabaseOpportunities'
import { enrichOpportunitiesWithPublishedCourses } from '@/lib/admin/opportunities/syncWithPublishedCourses'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import type { AdminCourse } from '@/lib/admin/courses/types'
import {
  WORK_IN_EDUCATION_OPPORTUNITY_BANK,
  resolveEducationBankRoutes,
  WORK_IN_EDUCATION_DEFAULT_GOAL_KEYS,
} from '@/lib/admin/opportunities/workInEducationBank'
import { resolveGoalsFromKeys } from '@/lib/admin/opportunities/planningTemplate'

function bankEntryToOpportunity(
  entry: (typeof WORK_IN_EDUCATION_OPPORTUNITY_BANK)[number],
  index: number
): CourseOpportunity {
  const id = `bank-${index}-${entry.courseName.toLowerCase().replace(/\s+/g, '-')}`
  const routes = resolveEducationBankRoutes(entry.routeLabels)
  const goals = resolveGoalsFromKeys([...WORK_IN_EDUCATION_DEFAULT_GOAL_KEYS])
  const now = new Date().toISOString()

  return {
    id,
    courseName: entry.courseName,
    shortLabel: '',
    coursePurpose: entry.coursePurpose,
    priority: entry.priority,
    opportunityStatus: 'Need provider',
    publishStatus: 'Not published',
    importance: 'Medium',
    notes: '',
    nextAction: 'Search affiliate providers',
    publishedCourseId: null,
    visibilityStatus: 'internal',
    educationFields: entry.educationFields,
    specialisations: entry.specialisations,
    commercialStatus: 'no_link',
    suggestedSearchKeywords: entry.suggestedSearchKeywords,
    adminNotes: entry.adminNotes,
    canBeCourseCard: true,
    recommendationType: 'course_type',
    createdAt: now,
    updatedAt: now,
    routes: routes.map((r, i) => ({
      id: `${id}-route-${i}`,
      opportunityId: id,
      routeKey: r.routeKey,
      routeLabel: r.routeLabel,
    })),
    goals: goals.map((g, i) => ({
      id: `${id}-goal-${i}`,
      opportunityId: id,
      goalKey: g.goalKey,
      goalLabel: g.goalLabel,
    })),
    providers: [],
  }
}

export async function loadServerOpportunityPool(): Promise<CourseOpportunity[]> {
  if (isSupabaseCoursesConfigured()) {
    const supabase = getAdminCoursesSupabase()
    if (supabase) {
      try {
        const rows = await loadAllCourseOpportunities(supabase)
        const courses = await loadServerPublishedCourses()
        return enrichOpportunitiesWithPublishedCourses(rows, courses)
      } catch (error) {
        console.error('[recommendations] failed to load supabase opportunities', error)
      }
    }
  }

  // Local fallback: education recommendation bank (unpublished course cards).
  // Career Coach resolver may promote title-matched internal cards for display only.
  return WORK_IN_EDUCATION_OPPORTUNITY_BANK.map(bankEntryToOpportunity)
}

export async function loadServerPublishedCourses(): Promise<AdminCourse[]> {
  if (isSupabaseCoursesConfigured()) {
    const supabase = getAdminCoursesSupabase()
    if (supabase) {
      try {
        const { data, error } = await supabase.from('courses').select('*').eq('status', 'published')
        if (error) throw error
        return (data ?? []).map(courseRowToAdminCourse)
      } catch (error) {
        console.error('[recommendations] failed to load published courses', error)
      }
    }
  }

  return loadMockAdminCourses().filter((c) => c.status === 'published')
}
