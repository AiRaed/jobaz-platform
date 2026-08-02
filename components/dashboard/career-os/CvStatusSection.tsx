'use client'

import Link from 'next/link'
import { ArrowRight, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CvStatusSummary } from '@/lib/dashboard/careerOs/types'

type Props = {
  cv: CvStatusSummary
  loading?: boolean
}

export default function CvStatusSection({ cv, loading }: Props) {
  const scoreColor =
    cv.score >= 75 ? 'text-emerald-400' : cv.score >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-violet-400" />
        <h3 className="text-base font-semibold text-slate-100">CV Status</h3>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-auto">Supporting tool</span>
      </div>

      {loading ? (
        <div className="h-20 rounded-xl bg-slate-900/50 animate-pulse" />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="shrink-0 text-center sm:text-left">
            <p className={cn('text-3xl font-bold', scoreColor)}>{cv.score}%</p>
            <p className="text-xs text-slate-500 mt-0.5">{cv.level}</p>
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {cv.lastUpdated && (
              <p className="text-xs text-slate-500">Last updated: {formatDate(cv.lastUpdated)}</p>
            )}
            {cv.missingSections.length > 0 ? (
              <ul className="space-y-1">
                {cv.missingSections.slice(0, 3).map((fix) => (
                  <li key={fix} className="flex items-start gap-1.5 text-xs text-slate-400">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {fix}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-emerald-400/90">Your CV covers the essentials.</p>
            )}
          </div>
          <Link
            href={cv.improveHref}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-200 hover:bg-violet-500/10 transition shrink-0"
          >
            Improve CV
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </section>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}
