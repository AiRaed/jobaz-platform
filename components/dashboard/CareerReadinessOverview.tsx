'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, FileText, MessageSquare, Send, Target } from 'lucide-react'
import { getUserAiProfile } from '@/lib/jobaz-ai/profile/getUserAiProfile'

export type ReadinessMetric = {
  id: string
  label: string
  value: number | string
  sublabel?: string
  icon: React.ReactNode
  tone: 'violet' | 'emerald' | 'amber' | 'blue' | 'cyan'
  showProgress?: boolean
}

type Props = {
  cvQualityScore: number
  interviewConfidence: number
  applicationsSent: number
  jobMatchStrength: number
  loadingCv?: boolean
}

const TONE_BAR: Record<ReadinessMetric['tone'], string> = {
  violet: 'from-violet-500 to-purple-400',
  emerald: 'from-emerald-500 to-emerald-400',
  amber: 'from-amber-500 to-amber-400',
  blue: 'from-blue-500 to-cyan-400',
  cyan: 'from-cyan-500 to-teal-400',
}

function scoreTone(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function MetricCard({ metric }: { metric: ReadinessMetric }) {
  const isScore = typeof metric.value === 'number' && metric.showProgress !== false
  const isCount = typeof metric.value === 'number' && metric.showProgress === false
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-violet-400/90">{metric.icon}</span>
        <p className="text-xs uppercase tracking-wide text-slate-500 truncate">{metric.label}</p>
      </div>
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          isScore && scoreTone(metric.value as number),
          isCount && 'text-slate-100'
        )}
      >
        {metric.value}
        {isScore && <span className="text-sm font-normal text-slate-500">/100</span>}
      </p>
      {metric.sublabel && <p className="text-xs text-slate-500 mt-1">{metric.sublabel}</p>}
      {isScore && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r', TONE_BAR[metric.tone])}
            style={{ width: `${Math.min(metric.value as number, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function CareerReadinessOverview({
  cvQualityScore,
  interviewConfidence,
  applicationsSent,
  jobMatchStrength,
  loadingCv,
}: Props) {
  const [aiCareerScore, setAiCareerScore] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void getUserAiProfile().then((profile) => {
      if (!cancelled) setAiCareerScore(profile?.readinessScore ?? null)
    })
    const onUpdate = () => {
      void getUserAiProfile().then((profile) => {
        if (!cancelled) setAiCareerScore(profile?.readinessScore ?? null)
      })
    }
    window.addEventListener('jobaz-ai-profile-updated', onUpdate)
    return () => {
      cancelled = true
      window.removeEventListener('jobaz-ai-profile-updated', onUpdate)
    }
  }, [])

  const metrics: ReadinessMetric[] = [
    {
      id: 'ai-career',
      label: 'AI Career Score',
      value: aiCareerScore ?? '—',
      sublabel: aiCareerScore == null ? 'Complete UK Career Assistant' : 'From your AI assessment',
      icon: <Sparkles className="h-4 w-4" />,
      tone: 'violet',
    },
    {
      id: 'cv-quality',
      label: 'CV Quality Score',
      value: loadingCv ? '…' : cvQualityScore,
      sublabel: 'Application readiness',
      icon: <FileText className="h-4 w-4" />,
      tone: 'emerald',
    },
    {
      id: 'interview',
      label: 'Interview Confidence',
      value: interviewConfidence,
      sublabel: 'Based on practice & applications',
      icon: <MessageSquare className="h-4 w-4" />,
      tone: 'blue',
    },
    {
      id: 'applications',
      label: 'Applications Sent',
      value: applicationsSent,
      sublabel: applicationsSent === 1 ? 'job tracked' : 'jobs tracked',
      icon: <Send className="h-4 w-4" />,
      tone: 'cyan',
      showProgress: false,
    },
    {
      id: 'job-match',
      label: 'Job Match Strength',
      value: jobMatchStrength,
      sublabel: 'Avg. match on recommendations',
      icon: <Target className="h-4 w-4" />,
      tone: 'amber',
    },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <MetricCard key={m.id} metric={m} />
        ))}
      </div>
    </div>
  )
}
