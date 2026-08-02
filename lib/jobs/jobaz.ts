import { getAdminJobsSupabase } from '@/lib/admin/jobs/supabaseServer'
import { resolveRouteTagsFromKeyword } from '@/lib/admin/jobs/routeTags'
import type { JobSearchParams, UnifiedJob } from './types'

export type JobazJobRow = {
  id: string
  title: string
  company_name: string
  location: string | null
  salary: string | null
  job_type: string | null
  description: string
  requirements: string | null
  benefits: string | null
  apply_url: string | null
  company_website: string | null
  source: string
  featured: boolean
  partner_company: boolean
  active: boolean
  archived: boolean
  expiry_date: string | null
  route_tags: string[] | null
  priority_score: number | null
  skills_tags: string[] | null
  created_at: string
  updated_at: string
}

export function jobazRowToUnified(row: JobazJobRow): UnifiedJob {
  return {
    id: `jobaz_${row.id}`,
    title: row.title,
    company: row.company_name,
    location: row.location ?? 'UK',
    description: row.description,
    salary: row.salary ?? undefined,
    url: row.apply_url ?? `/job-details/jobaz_${row.id}`,
    source: 'jobaz',
    jobType: row.job_type ?? 'Full-time',
    requirements: row.requirements ?? undefined,
    benefits: row.benefits ?? undefined,
    companyWebsite: row.company_website ?? undefined,
    featured: row.featured,
    partnerCompany: row.partner_company,
    routeTags: row.route_tags ?? [],
    priorityScore: row.priority_score ?? 50,
    skillsTags: row.skills_tags ?? [],
  }
}

/** Escape values used inside PostgREST filter strings */
function escapePostgrestValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '""')
}

function sortJobazRows(rows: JobazJobRow[]): JobazJobRow[] {
  return [...rows].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (a.partner_company !== b.partner_company) return a.partner_company ? -1 : 1
    return (b.priority_score ?? 50) - (a.priority_score ?? 50)
  })
}

function dedupeJobazRows(rows: JobazJobRow[]): JobazJobRow[] {
  const seen = new Set<string>()
  const unique: JobazJobRow[] = []
  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    unique.push(row)
  }
  return unique
}

export async function searchJobazJobs(params: JobSearchParams): Promise<UnifiedJob[]> {
  const supabase = getAdminJobsSupabase()
  if (!supabase) {
    console.warn('[JobAZ jobs] Supabase service role is not configured — skipping managed job search')
    return []
  }

  const keyword = params.keyword.trim()
  if (!keyword) return []

  const kw = keyword.replace(/[%_,."']/g, ' ').replace(/\s+/g, ' ').trim()
  const pattern = escapePostgrestValue(`%${kw}%`)
  const now = escapePostgrestValue(new Date().toISOString())
  const location = params.location?.trim()

  const routeTags = [
    ...new Set([...(params.routeTags ?? []), ...resolveRouteTagsFromKeyword(keyword)]),
  ]

  const baseQuery = () =>
    supabase
      .from('jobs')
      .select('*')
      .eq('source', 'jobaz')
      .eq('active', true)
      .eq('archived', false)
      .or(`expiry_date.is.null,expiry_date.gt."${now}"`)

  const applyLocationFilter = <T extends ReturnType<typeof baseQuery>>(query: T) => {
    if (location && location !== 'UK' && !/anywhere/i.test(location)) {
      const locPattern = escapePostgrestValue(`%${location}%`)
      return query.ilike('location', locPattern)
    }
    return query
  }

  const textOr = `title.ilike."${pattern}",company_name.ilike."${pattern}",description.ilike."${pattern}",location.ilike."${pattern}"`

  const textQuery = applyLocationFilter(baseQuery().or(textOr).limit(30))
  const routeQuery =
    routeTags.length > 0
      ? applyLocationFilter(baseQuery().overlaps('route_tags', routeTags).limit(30))
      : null

  const [textResult, routeResult] = await Promise.all([
    textQuery,
    routeQuery ?? Promise.resolve({ data: [] as JobazJobRow[], error: null }),
  ])

  const rows: JobazJobRow[] = []

  for (const { data, error } of [textResult, routeResult]) {
    if (error) {
      console.error('[JobAZ jobs] search error:', error.message)
      continue
    }
    if (data?.length) rows.push(...(data as JobazJobRow[]))
  }

  return sortJobazRows(dedupeJobazRows(rows))
    .slice(0, 30)
    .map(jobazRowToUnified)
}

export async function fetchJobazJobById(rawId: string): Promise<UnifiedJob | null> {
  const supabase = getAdminJobsSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', rawId)
    .eq('source', 'jobaz')
    .maybeSingle()

  if (error || !data) return null
  return jobazRowToUnified(data as JobazJobRow)
}
