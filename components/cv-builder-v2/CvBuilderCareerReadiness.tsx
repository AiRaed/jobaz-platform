'use client'

import { cn } from '@/lib/utils'
import type { CvCareerReadinessReport } from '@/lib/cv-builder/cvCareerReadiness'
import { Activity, TrendingUp } from 'lucide-react'
import CvHealthPanel from './CvHealthPanel'
import type { CvHealthMetric } from '@/lib/cv-optimization'

type Props = {
  readiness: CvCareerReadinessReport
  atsMetrics: CvHealthMetric[]
  scoreDelta?: number | null
  showAtsDetails?: boolean
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'amber' | 'rose' | 'violet'
}) {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-400'
        : tone === 'violet'
          ? 'text-violet-300'
          : 'text-rose-400'

  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/30 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('text-lg font-bold tabular-nums leading-tight mt-0.5', toneClass)}>{value}%</p>
    </div>
  )
}

function toneForScore(score: number): 'emerald' | 'amber' | 'rose' {
  if (score >= 70) return 'emerald'
  if (score >= 45) return 'amber'
  return 'rose'
}

export default function CvBuilderCareerReadiness({
  readiness,
  atsMetrics,
  scoreDelta,
  showAtsDetails = true,
}: Props) {
  const pct = readiness.overallPercent
  const pctTone = toneForScore(pct)

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-violet-500/25 bg-slate-950/70 shadow-[0_12px_32px_rgba(15,23,42,0.7)] overflow-hidden">
        <div className="px-3 py-2.5 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-400" />
            <div>
              <h3 className="text-xs font-semibold text-slate-200">Career Readiness</h3>
              <p className="text-[10px] text-slate-500">Connected to your training journey</p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-2xl font-bold tabular-nums leading-none',
                pctTone === 'emerald' ? 'text-emerald-400' : pctTone === 'amber' ? 'text-amber-400' : 'text-rose-400'
              )}
            >
              {pct}%
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Overall</p>
          </div>
        </div>

        <div className="p-3 grid grid-cols-2 gap-2">
          <MetricCard label="CV Strength" value={readiness.cvStrength} tone={toneForScore(readiness.cvStrength)} />
          <MetricCard
            label="Interview Readiness"
            value={readiness.interviewReadiness}
            tone={toneForScore(readiness.interviewReadiness)}
          />
          <MetricCard label="ATS Score" value={readiness.atsMatch} tone={toneForScore(readiness.atsMatch)} />
          <MetricCard
            label="Career Readiness"
            value={readiness.careerReadiness}
            tone="violet"
          />
        </div>

        {readiness.recentBoost && readiness.recentBoost.delta > 0 && (
          <div className="mx-3 mb-3 rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-100/90">
              Completed <span className="font-semibold">{readiness.recentBoost.label}</span>
              <span className="text-emerald-300 font-semibold ml-1">+{readiness.recentBoost.delta}% CV Strength</span>
              <span className="block text-emerald-200/70 mt-0.5">Interview readiness and ATS score updated.</span>
            </div>
          </div>
        )}

        <div className="px-3 pb-3">
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {showAtsDetails && (
        <CvHealthPanel
          overallScore={readiness.cvQualityScore}
          metrics={atsMetrics}
          scoreDelta={scoreDelta}
        />
      )}
    </div>
  )
}
