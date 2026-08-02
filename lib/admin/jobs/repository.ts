import type { AdminJob, AdminJobInput } from './types'

export type JobsRepoResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function readApiError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error || res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

export function isSupabaseJobsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function fetchAdminJobs(): Promise<JobsRepoResult<{ jobs: AdminJob[] }>> {
  if (!isSupabaseJobsConfigured()) {
    return { ok: false, error: 'Supabase is not configured' }
  }
  try {
    const res = await fetch('/api/admin/jobs', { cache: 'no-store' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { jobs: AdminJob[] }
    return { ok: true, data: { jobs: body.jobs ?? [] } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to load jobs' }
  }
}

export async function createAdminJobRecord(input: AdminJobInput): Promise<JobsRepoResult<AdminJob>> {
  try {
    const res = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { job: AdminJob }
    return { ok: true, data: body.job }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create job' }
  }
}

export async function updateAdminJobRecord(
  id: string,
  input: AdminJobInput & { archived?: boolean }
): Promise<JobsRepoResult<AdminJob>> {
  try {
    const res = await fetch(`/api/admin/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    const body = (await res.json()) as { job: AdminJob }
    return { ok: true, data: body.job }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update job' }
  }
}

export async function deleteAdminJobRecord(id: string): Promise<JobsRepoResult<null>> {
  try {
    const res = await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' })
    if (!res.ok) return { ok: false, error: await readApiError(res) }
    return { ok: true, data: null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to delete job' }
  }
}

export async function archiveAdminJobRecord(job: AdminJob): Promise<JobsRepoResult<AdminJob>> {
  return updateAdminJobRecord(job.id, {
    ...adminJobToInput(job),
    archived: true,
    active: false,
  })
}

export function adminJobToInput(job: AdminJob): AdminJobInput {
  return {
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    salary: job.salary,
    jobType: job.jobType,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    applyUrl: job.applyUrl,
    companyWebsite: job.companyWebsite,
    featured: job.featured,
    partnerCompany: job.partnerCompany,
    active: job.active,
    expiryDate: job.expiryDate,
    routeTags: job.routeTags,
    priorityScore: job.priorityScore,
    skillsTags: job.skillsTags,
  }
}
