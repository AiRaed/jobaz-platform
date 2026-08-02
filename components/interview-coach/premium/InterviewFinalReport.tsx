'use client'

import { CircularProgress, MetricRow, PremiumCard } from './shared'

export type InterviewReportScores = {
  overall: number
  readiness?: number
  communication: number
  confidence: number
  professionalTone: number
  examples: number
  starMethod: number
  voiceQuality: number
  memory: number
  employerImpression: number
}

type Props = {
  scores: InterviewReportScores
  title?: string
}

export default function InterviewFinalReport({
  scores,
  title = 'Interview Report',
}: Props) {
  const readiness = scores.readiness ?? Math.round((scores.overall / 10) * 100)

  return (
    <PremiumCard glow className="overflow-hidden">
      <div className="px-4 py-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-slate-950/80">
        <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
          Final Report
        </p>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        <CircularProgress
          value={scores.overall}
          label="Overall Score"
          tone="violet"
          size={96}
        />
        <CircularProgress
          value={readiness}
          max={100}
          label="Interview Readiness"
          sublabel="%"
          tone="emerald"
          size={96}
        />
      </div>

      <div className="px-4 pb-4 space-y-2.5">
        <MetricRow label="Communication" value={scores.communication} />
        <MetricRow label="Confidence" value={scores.confidence} />
        <MetricRow label="Professional Tone" value={scores.professionalTone} />
        <MetricRow label="Examples" value={scores.examples} />
        <MetricRow label="STAR Method" value={scores.starMethod} />
        <MetricRow label="Voice Quality" value={scores.voiceQuality} />
        <MetricRow label="Memory" value={scores.memory} />
        <MetricRow label="Employer Impression" value={scores.employerImpression} />
      </div>
    </PremiumCard>
  )
}
