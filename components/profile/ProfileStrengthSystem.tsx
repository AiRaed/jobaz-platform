'use client'

import { cn } from '@/lib/utils'
import { TrendingUp, Zap } from 'lucide-react'
import type { ProfileStrength } from '@/lib/profile/types'

const STAGES = ['Beginner', 'Growing', 'Competitive', 'Recruiter Ready', 'Top Candidate'] as const

type Props = { strength: ProfileStrength }

export default function ProfileStrengthSystem({ strength }: Props) {
  const stageIndex = STAGES.indexOf(strength.stage)

  return (
    <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-slate-950/80 to-cyan-950/30 shadow-[0_0_32px_rgba(139,92,246,0.12)] backdrop-blur p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-slate-100">Identity strength</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">{strength.recommendation}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-violet-300 tabular-nums">{strength.percentage}%</p>
          <p className="text-xs text-emerald-400 font-medium mt-0.5">{strength.stage}</p>
          {strength.nextStage && (
            <p className="text-[10px] text-slate-500">Next: {strength.nextStage}</p>
          )}
        </div>
      </div>

      {/* Stage track */}
      <div className="flex gap-1 mb-4">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex-1 min-w-0">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                i <= stageIndex
                  ? 'bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(139,92,246,0.4)]'
                  : 'bg-slate-800'
              )}
            />
            <p
              className={cn(
                'text-[9px] mt-1 truncate text-center',
                i === stageIndex ? 'text-violet-300 font-medium' : 'text-slate-600'
              )}
            >
              {stage}
            </p>
          </div>
        ))}
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-700 ease-out"
          style={{ width: `${strength.percentage}%` }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Completed ({strength.sectionsComplete}/{strength.sectionsTotal})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {strength.completedSections.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
              >
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Missing to unlock next level</p>
          <div className="flex flex-wrap gap-1.5">
            {strength.missingSections.slice(0, 5).map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300/90 border border-amber-500/25"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
