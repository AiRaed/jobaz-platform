'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase } from 'lucide-react'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import type { SuggestedRole } from '@/lib/dashboard/careerOs/types'

type Props = {
  ladder: PathPlanLadder | null | undefined
  suggestedRoles?: SuggestedRole[]
  targetRole?: string
}

export default function MyPlanRecommendedJobsSection({
  ladder,
  suggestedRoles = [],
  targetRole,
}: Props) {
  const startJobs = ladder?.startNow ?? []
  const upgradeJobs = ladder?.upgradeAfter ?? []
  const fallback =
    startJobs.length === 0 && upgradeJobs.length === 0
      ? [
          ...(targetRole ? [{ title: targetRole }] : []),
          ...suggestedRoles.slice(0, 4),
        ]
      : []

  if (startJobs.length === 0 && upgradeJobs.length === 0 && fallback.length === 0) {
    return null
  }

  return (
    <section
      id="recommended-jobs"
      className="rounded-xl border border-violet-500/20 bg-violet-950/10 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-violet-300" />
        <h3 className="text-sm font-semibold text-slate-100">Recommended Jobs / Opportunities</h3>
      </div>

      {startJobs.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-300/90 font-semibold mb-1.5">
            Apply now
          </p>
          <ul className="space-y-1.5">
            {startJobs.map((job) => (
              <li key={job.title}>
                <Link
                  href={job.href ?? `/job-finder?query=${encodeURIComponent(job.title)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 hover:border-emerald-500/30 transition group"
                >
                  <span className="text-sm text-slate-100 group-hover:text-emerald-200">
                    {job.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {upgradeJobs.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-violet-300/90 font-semibold mb-1.5">
            After training
          </p>
          <ul className="space-y-1.5">
            {upgradeJobs.map((job) => (
              <li key={job.title}>
                <Link
                  href={job.href ?? `/job-finder?query=${encodeURIComponent(job.title)}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 hover:border-violet-500/30 transition group"
                >
                  <span className="text-sm text-slate-100 group-hover:text-violet-200">
                    {job.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fallback.length > 0 && (
        <ul className="space-y-1.5">
          {fallback.map((job) => (
            <li key={job.title}>
              <Link
                href={`/job-finder?query=${encodeURIComponent(job.title)}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 hover:border-violet-500/30 transition group"
              >
                <span className="text-sm text-slate-100 group-hover:text-violet-200">{job.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
