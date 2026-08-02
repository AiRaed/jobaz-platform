'use client'

import { Lightbulb, Target, TrendingUp, Zap } from 'lucide-react'
import { PremiumCard } from './shared'

type Props = {
  strengths?: string[]
  areasToImprove?: string[]
  topPriority?: string
  quickTips?: string[]
  nextGoal?: string
  recommendedPractice?: string
  emptyMessage?: string
}

function CoachCard({
  title,
  items,
  icon,
  tone,
}: {
  title: string
  items: string[]
  icon: React.ReactNode
  tone: 'emerald' | 'amber' | 'violet' | 'cyan'
}) {
  if (items.length === 0) return null
  const styles = {
    emerald: 'border-emerald-500/25 bg-emerald-950/20',
    amber: 'border-amber-500/25 bg-amber-950/20',
    violet: 'border-violet-500/25 bg-violet-950/20',
    cyan: 'border-cyan-500/25 bg-cyan-950/20',
  }
  const titleColors = {
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    violet: 'text-violet-300',
    cyan: 'text-cyan-300',
  }

  return (
    <div className={`rounded-lg border p-3 ${styles[tone]}`}>
      <div className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${titleColors[tone]}`}>
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-300 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function InterviewCoachNotesPanel({
  strengths = [],
  areasToImprove = [],
  topPriority,
  quickTips = [],
  nextGoal,
  recommendedPractice,
  emptyMessage = 'Complete a step to see coaching notes.',
}: Props) {
  const hasContent =
    strengths.length > 0 ||
    areasToImprove.length > 0 ||
    topPriority ||
    quickTips.length > 0 ||
    nextGoal ||
    recommendedPractice

  return (
    <PremiumCard className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-100">AI Coach Notes</h3>

      {!hasContent ? (
        <p className="text-xs text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          <CoachCard
            title="Strengths"
            items={strengths}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            tone="emerald"
          />
          <CoachCard
            title="Areas to Improve"
            items={areasToImprove}
            icon={<Target className="w-3.5 h-3.5" />}
            tone="amber"
          />
          {topPriority && (
            <div className="rounded-lg border border-rose-500/25 bg-rose-950/20 p-3">
              <p className="text-xs font-semibold text-rose-300 mb-1">Top Priority</p>
              <p className="text-xs text-slate-300">{topPriority}</p>
            </div>
          )}
          <CoachCard
            title="Quick Tips"
            items={quickTips}
            icon={<Lightbulb className="w-3.5 h-3.5" />}
            tone="cyan"
          />
          {nextGoal && (
            <div className="rounded-lg border border-violet-500/25 bg-violet-950/20 p-3">
              <p className="text-xs font-semibold text-violet-300 mb-1">Next Goal</p>
              <p className="text-xs text-slate-300">{nextGoal}</p>
            </div>
          )}
          {recommendedPractice && (
            <div className="rounded-lg border border-slate-600/40 bg-slate-900/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                Recommended Practice
              </div>
              <p className="text-xs text-slate-400">{recommendedPractice}</p>
            </div>
          )}
        </div>
      )}
    </PremiumCard>
  )
}
