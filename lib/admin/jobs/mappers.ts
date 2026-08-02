import type { AdminJob, AdminJobInput } from './types'
import type { JobazJobRow } from '@/lib/jobs/jobaz'

export type JobRow = JobazJobRow

export function jobRowToAdminJob(row: JobRow): AdminJob {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    location: row.location ?? '',
    salary: row.salary ?? '',
    jobType: row.job_type ?? 'Full-time',
    description: row.description,
    requirements: row.requirements ?? '',
    benefits: row.benefits ?? '',
    applyUrl: row.apply_url ?? '',
    companyWebsite: row.company_website ?? '',
    featured: row.featured,
    partnerCompany: row.partner_company,
    active: row.active,
    archived: row.archived,
    expiryDate: row.expiry_date,
    routeTags: row.route_tags ?? [],
    priorityScore: row.priority_score ?? 50,
    skillsTags: row.skills_tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function adminJobInputToInsertRow(input: AdminJobInput) {
  return {
    title: input.title.trim(),
    company_name: input.companyName.trim(),
    location: input.location.trim() || null,
    salary: input.salary.trim() || null,
    job_type: input.jobType || 'Full-time',
    description: input.description.trim(),
    requirements: input.requirements.trim() || null,
    benefits: input.benefits.trim() || null,
    apply_url: input.applyUrl.trim() || null,
    company_website: input.companyWebsite.trim() || null,
    source: 'jobaz' as const,
    featured: input.featured,
    partner_company: input.partnerCompany,
    active: input.active,
    archived: false,
    expiry_date: input.expiryDate || null,
    route_tags: input.routeTags,
    priority_score: input.priorityScore,
    skills_tags: input.skillsTags,
  }
}

export function adminJobInputToUpdateRow(input: AdminJobInput & { archived?: boolean }) {
  return {
    ...adminJobInputToInsertRow(input),
    archived: input.archived ?? false,
  }
}
