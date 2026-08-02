'use client'

import Link from 'next/link'
import CareerHubCourseCard from '@/components/career-hub/CareerHubCourseCard'
import { useLandingCourses } from './LandingCoursesContext'
import { dashboardCoursesGridClass } from './layout'

function SectionHeader() {
  return (
    <div className="flex items-center justify-between mb-4 md:mb-5">
      <h2 className="text-sm font-semibold text-[var(--text-primary)]">Popular Courses & Licences</h2>
      <Link
        href="/career-hub"
        className="text-xs text-[var(--text-secondary)] hover:text-[var(--bg-primary)] transition shrink-0"
      >
        View all →
      </Link>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="jobaz-card h-full min-h-[420px] rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] animate-pulse box-border overflow-hidden dark:border-slate-700/50 dark:bg-slate-900/50">
      <div className="h-[170px] bg-[var(--jaz-surface-soft)] dark:bg-slate-800/60" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700/60" />
        <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700/60" />
        <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  )
}

export default function PopularCoursesRow() {
  const { courses, loading, error, emptyMessage } = useLandingCourses()

  if (loading) {
    return (
      <section className="w-full max-w-none min-w-0 box-border">
        <SectionHeader />
        <div className={dashboardCoursesGridClass}>
          {Array.from({ length: 12 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
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

  if (!courses.length) {
    return (
      <section className="w-full max-w-none min-w-0 box-border">
        <SectionHeader />
        <div className="jobaz-card rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-4 py-8 text-center dark:border-slate-700/60 dark:bg-slate-950/40">
          <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400">
            {emptyMessage || 'No courses found right now.'}
          </p>
          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mt-2">
            Try SIA, CSCS, Care or another training keyword.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full max-w-none min-w-0 box-border">
      <SectionHeader />
      <div className={dashboardCoursesGridClass}>
        {courses.map((course) => (
          <CareerHubCourseCard
            key={course.adminCourseId ?? course.slug}
            course={course}
            featured={course.isFeatured}
            compact
            applySource="courses_marketplace"
            saveLabel="Save to Plan"
          />
        ))}
      </div>
    </section>
  )
}
