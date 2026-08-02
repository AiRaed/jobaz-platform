'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ApplicationAnalysis, ScoreDelta } from '@/lib/job-application'
import JazEyeIcon from '@/components/ui/JazEyeIcon'

type Props = {
  analysis: ApplicationAnalysis
  deltas: ScoreDelta[]
  analyzing?: boolean
  onPrimaryAction: () => void
  onSecondaryAction?: () => void
}

export default function ApplicationIntelligenceSections({
  analysis,
  deltas,
  analyzing,
  onPrimaryAction,
  onSecondaryAction,
}: Props) {
  const [whyOpen, setWhyOpen] = useState(false)
  const { recruiterInsight, smartNextStep, skillGaps, scoreExplanation } = analysis

  return (
    <div className="space-y-4">
      {analyzing && (
        <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center gap-3 animate-pulse">
          <JazEyeIcon variant="inline" ariaLabel="" />
          <div>
            <p className="text-xs font-semibold text-violet-300">JAZ analyzing…</p>
            <p className="text-[10px] text-slate-500">Refreshing recruiter insight</p>
          </div>
        </div>
      )}

      {deltas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {deltas.map((d) => (
            <span
              key={d.label}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold border',
                d.delta > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              )}
            >
              <TrendingUp className={cn('w-3 h-3', d.delta < 0 && 'rotate-180')} />
              {d.delta > 0 ? '+' : ''}
              {d.delta} {d.label}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/50 to-slate-900/50 p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Recommended next step</p>
        <h3 className="text-base font-semibold text-white leading-snug">{smartNextStep.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{smartNextStep.description}</p>
        <div className="rounded-lg bg-slate-950/60 border border-slate-700/50 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Why this matters</p>
          <p className="text-xs text-slate-300">{smartNextStep.reason}</p>
          {smartNextStep.roleRequirements.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 mt-2 mb-1">This role requires:</p>
              <ul className="text-xs text-slate-400 space-y-0.5">
                {smartNextStep.roleRequirements.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
          {smartNextStep.cvGaps.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 mt-2 mb-1">Your CV currently lacks:</p>
              <ul className="text-xs text-amber-200/80 space-y-0.5">
                {smartNextStep.cvGaps.map((g) => (
                  <li key={g}>• {g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onPrimaryAction}
          className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-violet-900/30"
        >
          {smartNextStep.ctaLabel}
        </button>
        {onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="w-full px-4 py-2 text-xs text-slate-400 hover:text-violet-300 transition"
          >
            Open full AI assistant
          </button>
        )}
      </div>

      <div className="rounded-xl border border-violet-700/40 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <JazEyeIcon variant="inline" ariaLabel="" />
            <h4 className="text-sm font-semibold text-violet-300">JAZ Recruiter Insight</h4>
          </div>
          <span className="text-xs text-slate-500">Confidence {recruiterInsight.confidenceScore}%</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tabular-nums">{recruiterInsight.applicationStrength}%</span>
          <span className="text-xs text-slate-400">Application Strength</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Hiring risk:</span>
          <span
            className={cn(
              'font-semibold',
              recruiterInsight.hiringRisk === 'Low' && 'text-emerald-400',
              recruiterInsight.hiringRisk === 'Medium' && 'text-amber-400',
              recruiterInsight.hiringRisk === 'High' && 'text-red-400'
            )}
          >
            {recruiterInsight.hiringRisk}
          </span>
        </div>
        {recruiterInsight.strengths.length > 0 && (
          <InsightList title="Strengths" items={recruiterInsight.strengths} variant="positive" />
        )}
        {recruiterInsight.weaknesses.length > 0 && (
          <InsightList title="Weaknesses" items={recruiterInsight.weaknesses} variant="negative" />
        )}
        {recruiterInsight.missingKeywords.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">ATS keywords missing</p>
            <div className="flex flex-wrap gap-1.5">
              {recruiterInsight.missingKeywords.slice(0, 6).map((k) => (
                <span
                  key={k}
                  className="rounded-full px-2 py-0.5 text-[10px] bg-amber-500/10 border border-amber-500/25 text-amber-200/90"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setWhyOpen(!whyOpen)}
        className="w-full flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3 text-left hover:border-violet-500/30 transition"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <HelpCircle className="w-4 h-4 text-violet-400" />
          Why this score?
        </span>
        {whyOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {whyOpen && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/50 p-4 text-xs text-slate-300 space-y-2">
          <p>{scoreExplanation.summary}</p>
          {scoreExplanation.gaps.map((g) => (
            <p key={g} className="text-amber-200/80">• {g}</p>
          ))}
        </div>
      )}

      {skillGaps.length > 0 && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-950/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Skill gap → learning path
          </p>
          {skillGaps.slice(0, 2).map((gap) => (
            <div key={gap.skill} className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 space-y-1.5">
              <p className="text-xs font-medium text-violet-200">Missing: {gap.skill}</p>
              <p className="text-[10px] text-slate-400">{gap.learnHint}</p>
              <p className="text-[10px] text-slate-500">CV: {gap.cvTip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InsightList({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'positive' | 'negative'
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              'text-xs flex gap-1.5',
              variant === 'positive' ? 'text-emerald-300/90' : 'text-red-300/80'
            )}
          >
            <span>{variant === 'positive' ? '✓' : '✗'}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
