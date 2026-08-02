'use client'

import Link from 'next/link'
import { ArrowRight, Briefcase } from 'lucide-react'
import type { SuggestedRole } from '@/lib/dashboard/careerOs/types'

type Props = {
  roles: SuggestedRole[]
}

export default function SuggestedRolesSection({ roles }: Props) {
  if (!roles.length) return null

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">Suggested Roles To Apply For</h3>
        </div>
        <Link href="/job-finder" className="text-xs text-slate-400 hover:text-violet-300 inline-flex items-center gap-1">
          Open Job Finder
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role.title}
            className="inline-flex items-center rounded-full border border-slate-600/50 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-200"
          >
            {role.title}
          </span>
        ))}
      </div>
    </section>
  )
}
