'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import { isCourseLikeTitle } from '@/lib/career-assistant/add-to-my-plan/planIdentity'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'

type Props = {
  ladder: PathPlanLadder | null | undefined
  targetRole?: string
}

function shortReason(description?: string): string {
  if (!description?.trim()) return 'Matches your route and schedule.'
  const first = description.split(/[.|!]/)[0]?.trim() || description.trim()
  return first.length > 64 ? `${first.slice(0, 61)}…` : first
}

/** Compact green-accent job cards. Display only. */
export default function WorkYouCanStartNowSection({ ladder, targetRole }: Props) {
  const work = PLAN_SECTION_STYLES.work
  const jobs = (ladder?.startNow ?? [])
    .filter((j) => j.title?.trim() && !isCourseLikeTitle(j.title))
    .slice(0, 3)
    .map((j) => ({
      title: j.title,
      reason: shortReason(j.description),
      salary: j.salaryRange?.trim() || null,
      href: j.href ?? `/job-finder?query=${encodeURIComponent(j.title)}`,
    }))

  const fallback =
    jobs.length === 0 && targetRole && !isCourseLikeTitle(targetRole)
      ? [
          {
            title: targetRole,
            reason: 'Matched to your Career Assistant focus.',
            salary: null as string | null,
            href: `/job-finder?query=${encodeURIComponent(targetRole)}`,
          },
        ]
      : jobs

  if (fallback.length === 0) return null

  return (
    <section id="work-now" className="space-y-3">
      <PlanSectionHeader
        accent="work"
        title="Work You Can Start Now"
        subtitle="Immediate roles — start these before finishing upgrade training."
      />
      <ul className="grid gap-3 sm:grid-cols-3 items-stretch">
        {fallback.map((job) => (
          <li
            key={job.title}
            className={cn(
              'rounded-xl border p-4 flex flex-col min-h-[140px]',
              work.border,
              work.panel
            )}
          >
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-snug line-clamp-2">
              {job.title}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2 flex-1">
              {job.reason}
            </p>
            {job.salary ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-200/85 mt-2 tabular-nums font-semibold">
                {job.salary}
              </p>
            ) : (
              <p className="text-xs text-transparent mt-2 select-none">—</p>
            )}
            <Link
              href={job.href}
              onClick={() =>
                void trackJazEvent({
                  event_type: 'job_search_clicked',
                  event_source: 'my_plan_work_now',
                  route_title: ladder?.routeLabel || targetRole || null,
                  tool_name: 'my_plan',
                  metadata: { job_title: job.title },
                })
              }
              className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 transition"
            >
              View jobs <ArrowRight className="w-3 h-3" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
