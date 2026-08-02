'use client'

import { Target } from 'lucide-react'
import type { RecruiterImpression } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'

type Props = { impression: RecruiterImpression }

export default function ProfileRecruiterImpression({ impression }: Props) {
  return (
    <ProfileCard
      title="How recruiters currently see you"
      subtitle="Recruiter view simulation — your shortlist potential."
      className="border-violet-500/20 shadow-[0_0_28px_rgba(88,28,135,0.1)]"
      action={<Target className="w-4 h-4 text-violet-400" />}
    >
      <div className="rounded-xl border border-violet-500/20 bg-violet-950/25 p-4 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-500">Recruiter confidence meter</p>
        <p className="text-sm text-slate-200 mt-1">{impression.shortlistMessage}</p>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-2xl font-bold text-violet-300 tabular-nums shrink-0">
            {impression.confidence}%
          </p>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${impression.confidence}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{impression.confidenceLabel}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-500/80 mb-2">Strongest traits</p>
          <ul className="space-y-1.5">
            {impression.strongestTraits.map((t) => (
              <li key={t} className="text-sm text-emerald-300/90 flex gap-2">
                <span>✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-amber-500/80 mb-2">Biggest gaps</p>
          <ul className="space-y-1.5">
            {impression.weaknesses.map((w) => (
              <li key={w} className="text-sm text-amber-300/80 flex gap-2">
                <span>!</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/40">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Improvement suggestions</p>
        <ul className="space-y-1.5">
          {impression.suggestions.map((s) => (
            <li key={s} className="text-xs text-slate-400 flex gap-2">
              <span className="text-violet-400">→</span> {s}
            </li>
          ))}
        </ul>
      </div>
    </ProfileCard>
  )
}
