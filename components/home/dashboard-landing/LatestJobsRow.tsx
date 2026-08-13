'use client'

import Link from 'next/link'
import { useLandingJobs } from './LandingJobsContext'
import LandingJobCard from './LandingJobCard'
import { dashboardJobsGridClass } from './layout'

function SectionHeader() {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Latest Jobs</h2>
      <Link
        href="/jobs"
        className="text-xs text-[var(--text-secondary)] hover:text-[var(--bg-primary)] transition shrink-0"
      >
        View all →
      </Link>
    </div>
  )
}

function JobCardSkeleton() {
  return (
    <div className="jobaz-card h-full min-h-[320px] rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] animate-pulse box-border dark:border-slate-700/50 dark:bg-slate-900/50" />
  )
}

export default function LatestJobsRow() {
  const { jobs, loading, error, emptyMessage } = useLandingJobs()

  if (loading) {
    return (
      <section className="w-full max-w-none min-w-0 box-border">
        <SectionHeader />
        <div className={dashboardJobsGridClass}>
          {Array.from({ length: 12 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="w-full max-w-none min-w-0 box-border">
        <SectionHeader />
        <div className="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-6 text-sm text-red-300">
          {error}
        </div>
      </section>
    )
  }

  if (!jobs.length) {
    return (
      <section className="w-full max-w-none min-w-0 box-border">
        <SectionHeader />
        <div className="jobaz-card rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-4 py-8 text-center dark:border-slate-700/60 dark:bg-slate-950/40">
          <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">
            {emptyMessage || 'No jobs found right now.'}
          </p>
          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mt-2">
            Try another keyword or browse all UK jobs.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-none min-w-0 box-border">
      <SectionHeader />
      <div className={dashboardJobsGridClass}>
        {jobs.map((job) => (
          <LandingJobCard key={job.id} job={job} />
        ))}
      </div>
    </section>
  )
}
