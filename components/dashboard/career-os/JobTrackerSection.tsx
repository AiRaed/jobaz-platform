'use client'

import Link from 'next/link'
import { Briefcase, Send, Users, Trophy, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobTrackerStats } from '@/lib/dashboard/careerOs/types'

type Props = {
  stats: JobTrackerStats
}

const METRICS: {
  key: keyof JobTrackerStats
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}[] = [
  { key: 'savedJobs', label: 'Saved Jobs', icon: Briefcase, color: 'text-cyan-400' },
  { key: 'applicationsSent', label: 'Applications Sent', icon: Send, color: 'text-violet-400' },
  { key: 'interviews', label: 'Interviews', icon: Users, color: 'text-amber-400' },
  { key: 'offers', label: 'Offers', icon: Trophy, color: 'text-emerald-400' },
  { key: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-400' },
  { key: 'pending', label: 'Pending', icon: Clock, color: 'text-slate-400' },
]

export default function JobTrackerSection({ stats }: Props) {
  const max = Math.max(...METRICS.map((m) => stats[m.key]), 1)

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">Job Tracker</h3>
        </div>
        <Link
          href="/dashboard?tab=jobs"
          className="text-xs text-slate-400 hover:text-violet-300 transition"
        >
          View all jobs →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {METRICS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-center"
          >
            <Icon className={cn('w-4 h-4 mx-auto mb-1', color)} />
            <p className="text-2xl font-bold text-slate-100">{stats[key]}</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {METRICS.filter((m) => stats[m.key] > 0).map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-28 shrink-0">{label}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r from-violet-500/80 to-cyan-500/80')}
                style={{ width: `${Math.round((stats[key] / max) * 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-6 text-right">{stats[key]}</span>
          </div>
        ))}
        {METRICS.every((m) => stats[m.key] === 0) && (
          <p className="text-sm text-slate-500 text-center py-4">
            Save jobs and track applications to see your progress here.
          </p>
        )}
      </div>
    </section>
  )
}
