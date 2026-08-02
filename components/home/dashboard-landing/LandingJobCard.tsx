'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bookmark } from 'lucide-react'
import type { JobSearchResult } from '@/lib/jobs/types'
import {
  displayCompany,
  displayLocation,
  sanitizeJobDescription,
} from '@/lib/jobs/job-display'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Props = {
  job: JobSearchResult
}

function SourceBadge({ source }: { source: JobSearchResult['source'] }) {
  if (source !== 'reed' && source !== 'adzuna') return null

  return (
    <span className="inline-flex text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 dark:border-[#3db8ff]/35 dark:bg-[#1E90FF]/12 dark:text-[#5ec8ff]">
      {source === 'reed' ? 'Reed' : 'Adzuna'}
    </span>
  )
}

export default function LandingJobCard({ job }: Props) {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user))
    })
  }, [])

  const description = sanitizeJobDescription(job.description)
  const salary = job.salary?.trim() || 'Salary not disclosed'
  const employmentType = job.type?.trim() && job.type !== 'Not specified' ? job.type : null
  const detailsHref = `/job-details/${encodeURIComponent(job.id)}`
  const postedLabel = job.postedLabel || 'Recently posted'

  const handleSave = () => {
    if (isLoggedIn) {
      router.push(`${detailsHref}?action=save`)
      return
    }
    setAuthOpen(true)
  }

  return (
    <>
      <article
        className={cn(
          'jobaz-card group relative h-full min-h-[320px] rounded-2xl px-4 py-4 flex flex-col box-border gap-0',
          'bg-[var(--jaz-surface)] border border-[var(--jaz-border)]',
          'shadow-[var(--shadow-soft)]',
          'transition-all duration-300 ease-out',
          'hover:-translate-y-[3px] hover:border-blue-300',
          'hover:shadow-[0_8px_28px_rgba(15,23,42,0.09)]',
          'dark:bg-slate-900/80 dark:border-[rgba(64,135,255,0.24)]',
          'dark:shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)]',
          'dark:hover:border-[rgba(64,135,255,0.48)]',
          'dark:hover:shadow-[0_14px_36px_rgba(0,0,0,0.35),0_0_28px_rgba(30,144,255,0.14)]'
        )}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <SourceBadge source={job.source} />
          <span className="text-[10px] text-[var(--text-muted)] dark:text-[#6b85ad] truncate">
            {postedLabel}
          </span>
        </div>

        <h3 className="text-[15px] font-semibold text-[#0F172A] dark:text-white line-clamp-2 leading-snug mb-1.5">
          {job.title}
        </h3>

        <p className="text-xs text-[#475569] dark:text-[#c5d8f5] truncate mb-0.5">
          {displayCompany(job.company)}
        </p>
        <p className="text-xs text-[#64748B] dark:text-[#7f97bc] truncate mb-3">
          {displayLocation(job.location)}
        </p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mb-3 pb-3 border-b border-[var(--jaz-border)] dark:border-[rgba(64,135,255,0.12)]">
          <span className="font-medium text-[#2563EB] dark:text-[#a8c8ee]">{salary}</span>
          {employmentType && (
            <>
              <span className="text-slate-300 dark:text-[#4a6080]" aria-hidden>
                ·
              </span>
              <span className="text-[#64748B] dark:text-[#8ba8cc]">{employmentType}</span>
            </>
          )}
        </div>

        {description ? (
          <p className="text-xs text-[#64748B] dark:text-[#6d86ad] line-clamp-3 leading-[1.55] flex-1 mb-4">
            {description}
          </p>
        ) : (
          <div className="flex-1 mb-4" />
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            className="jobaz-btn-ghost inline-flex items-center gap-1 !px-2.5 !py-1.5 text-[11px]"
            aria-label="Save job"
          >
            <Bookmark className="w-3 h-3" />
            Save
          </button>
          <Link
            href={detailsHref}
            className="jobaz-btn-primary jobaz-btn-primary-sm ml-auto !px-3.5 !py-1.5 text-[11px]"
          >
            View Job
          </Link>
        </div>
      </article>

      <CareerAuthWallModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={detailsHref}
        title="Sign in to save jobs"
        description="Create a free account to save roles and track your applications."
      />
    </>
  )
}
