'use client'

import { TrendingUp } from 'lucide-react'
import type { SalaryInfo } from '@/lib/build-your-path/types'

type Props = { salary: SalaryInfo }

export default function SalaryProgressionCard({ salary }: Props) {
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-slate-950/60 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h2 className="text-lg font-bold text-slate-200">Salary Progression</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Starting salary</p>
          <p className="text-xl font-bold text-cyan-300">{salary.starting}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Experienced</p>
          <p className="text-xl font-bold text-emerald-300">{salary.experienced}</p>
        </div>
      </div>
      {salary.note && <p className="text-xs text-slate-400 mb-4">{salary.note}</p>}
      {salary.levels && (
        <div className="flex flex-wrap gap-2">
          {salary.levels.map((level) => (
            <span
              key={level.label}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-950/30 text-violet-200"
            >
              <span className="text-slate-500">{level.label}</span>
              <span className="font-medium">{level.range}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}



