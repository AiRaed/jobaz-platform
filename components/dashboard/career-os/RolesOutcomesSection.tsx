'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase, TrendingUp } from 'lucide-react'
import type { CareerDestination, SuggestedRole } from '@/lib/dashboard/careerOs/types'

type Props = {
  roles: SuggestedRole[]
  destination: CareerDestination
}

export default function RolesOutcomesSection({ roles, destination }: Props) {
  if (!roles.length && !destination.salarySteps.length) return null

  return (
    <section className="grid gap-3 md:grid-cols-2">
      {roles.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-100">Suggested Roles</h3>
            </div>
            <Link
              href="/job-finder"
              className="text-[10px] text-slate-400 hover:text-violet-300 inline-flex items-center gap-0.5"
            >
              Job Finder
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {roles.slice(0, 6).map((role) => (
              <span
                key={role.title}
                className="inline-flex items-center rounded-md border border-slate-600/40 bg-slate-900/50 px-2 py-1 text-xs text-slate-200"
              >
                {role.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">Salary Outlook</h3>
        </div>
        <div className="space-y-2">
          {destination.salarySteps.map((step) => (
            <div key={step.label} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-slate-500">{step.label}</span>
              <span className="text-emerald-300 font-semibold tabular-nums">{step.amount}</span>
            </div>
          ))}
        </div>
        {destination.timeHorizons.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
            Target role: <span className="text-slate-400">{destination.targetRole}</span>
          </p>
        )}
      </div>
    </section>
  )
}
