'use client'

import { AlertTriangle, Brain, Mic, Square } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { PremiumButton, PremiumCard } from './shared'

type Props = {
  questionNumber: number
  totalQuestions: number
  questionText: string
  countdown: number | null
  isRecording: boolean
  recordingTime: string
  hasRecording: boolean
  isEvaluating: boolean
  showTargetAnswer?: boolean
  targetAnswer?: string
  convertedAnswer?: string
  onStartAnswer: () => void
  onStopRecording: () => void
  onRecordAgain: () => void
  onSubmit: () => void
  onNext: () => void
  showNext: boolean
  nextLabel?: string
}

export default function HardModeChallengePanel({
  questionNumber,
  totalQuestions,
  questionText,
  countdown,
  isRecording,
  recordingTime,
  hasRecording,
  isEvaluating,
  showTargetAnswer,
  targetAnswer,
  convertedAnswer,
  onStartAnswer,
  onStopRecording,
  onRecordAgain,
  onSubmit,
  onNext,
  showNext,
  nextLabel = 'Next Hard Question',
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-200">
          <Brain className="w-3.5 h-3.5" />
          Memory Challenge
        </span>
        <span className="text-xs text-slate-400">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      <PremiumCard glow className="p-5 border-amber-500/20">
        <div className="flex items-start gap-2 mb-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-100/90">
            Answer naturally without looking at previous notes.
          </p>
        </div>

        <p className="text-base text-slate-100 leading-relaxed mb-4">{questionText}</p>

        {countdown !== null && (
          <div className="text-center py-6">
            <div className="text-7xl font-bold text-violet-400 tabular-nums animate-pulse">
              {countdown}
            </div>
            <p className="text-sm text-slate-400 mt-2">Recording will start in…</p>
          </div>
        )}

        {!countdown && !isRecording && !hasRecording && !showTargetAnswer && (
          <PremiumButton onClick={onStartAnswer} dataJazAction="ic_hard_record">
            <Mic className="w-4 h-4" />
            Start Answer
          </PremiumButton>
        )}

        {isRecording && (
          <div className="space-y-3">
            <PremiumButton variant="danger" onClick={onStopRecording} className="w-full" dataJazAction="ic_hard_stop">
              <Square className="w-4 h-4" />
              Stop Recording ({recordingTime})
            </PremiumButton>
            <div className="flex items-end justify-center gap-0.5 h-14 rounded-xl bg-slate-900/50 p-3">
              {[...Array(28)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-violet-500/70"
                  style={{ height: `${(Math.sin(i * 0.4) * 30 + 45)}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {hasRecording && !isRecording && !showTargetAnswer && (
          <div className="flex flex-col gap-2">
            <PremiumButton variant="secondary" onClick={onRecordAgain} dataJazAction="ic_hard_record">
              Record Again
            </PremiumButton>
            <PremiumButton onClick={onSubmit} disabled={isEvaluating} dataJazAction="ic_hard_submit">
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Evaluating…
                </>
              ) : (
                'Submit Hard Mode Answer'
              )}
            </PremiumButton>
          </div>
        )}
      </PremiumCard>

      {convertedAnswer && (
        <PremiumCard className="p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Your Answer</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{convertedAnswer}</p>
        </PremiumCard>
      )}

      {showTargetAnswer && targetAnswer && (
        <PremiumCard className="p-4 border-emerald-500/20">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2">
            Target Answer (after evaluation)
          </p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{targetAnswer}</p>
        </PremiumCard>
      )}

      {showNext && (
        <PremiumButton onClick={onNext} className="w-full" dataJazAction="ic_hard_next">
          {nextLabel}
        </PremiumButton>
      )}
    </div>
  )
}
