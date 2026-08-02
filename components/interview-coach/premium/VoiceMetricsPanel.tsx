'use client'

import { MetricRow, PremiumCard, CircularProgress } from './shared'

type VoiceScores = {
  clarity: number
  confidence: number
  speed: number
  filler_words: number
  professional_tone: number
  structure: number
}

type Props = {
  scores: VoiceScores
  overallScore?: number
}

export default function VoiceMetricsPanel({ scores, overallScore }: Props) {
  const overall =
    overallScore ??
    Math.round(
      ((scores.clarity +
        scores.confidence +
        scores.speed +
        scores.filler_words +
        scores.professional_tone +
        scores.structure) /
        6) *
        10
    ) / 10

  const pausesScore = Math.max(1, Math.min(10, 10 - Math.max(0, 10 - scores.filler_words)))
  const energyScore = scores.structure

  return (
    <PremiumCard glow className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Voice Analysis</h3>
        <CircularProgress value={overall} label="Overall" size={72} />
      </div>

      <div className="space-y-3">
        <MetricRow label="Confidence" value={scores.confidence} />
        <MetricRow label="Speaking Speed" value={scores.speed} />
        <MetricRow label="Clarity" value={scores.clarity} />
        <MetricRow label="Professional Tone" value={scores.professional_tone} />
        <MetricRow label="Fillers" value={scores.filler_words} />
        <MetricRow label="Energy" value={energyScore} />
        <MetricRow label="Pauses" value={pausesScore} />
      </div>
    </PremiumCard>
  )
}
