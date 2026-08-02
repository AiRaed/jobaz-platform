'use client'

import { Mic, Send, Square } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { PremiumButton, PremiumCard } from './shared'

type Props = {
  isRecording: boolean
  hasRecording: boolean
  recordingTime: number
  currentQuestion: number
  totalQuestions: number
  formatTime: (s: number) => string
  readyMessage?: string | null
  isSpeakingQuestion?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onSubmit?: () => void
  isAnalyzing?: boolean
}

export default function VoiceRecordingPanel({
  isRecording,
  hasRecording,
  recordingTime,
  currentQuestion,
  totalQuestions,
  formatTime,
  readyMessage,
  isSpeakingQuestion,
  onStartRecording,
  onStopRecording,
  onSubmit,
  isAnalyzing,
}: Props) {
  return (
    <PremiumCard className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Question</p>
          <p className="text-sm font-semibold text-violet-200">
            {currentQuestion} of {totalQuestions}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Timer</p>
          <p className="text-lg font-mono font-bold text-slate-100 tabular-nums">
            {formatTime(isRecording || hasRecording ? recordingTime : 0)}
          </p>
        </div>
      </div>

      {isSpeakingQuestion && (
        <p className="text-xs text-violet-300/90 animate-pulse">AI is reading the question…</p>
      )}
      {readyMessage && !isRecording && !hasRecording && (
        <p className="text-sm text-emerald-300/90 font-medium">{readyMessage}</p>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          {isRecording ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-xs font-medium text-rose-300">Recording</span>
            </>
          ) : (
            <span className="text-xs text-slate-500">Voice waveform</span>
          )}
        </div>
        <div className="flex items-end justify-center gap-0.5 h-16">
          {[...Array(32)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-violet-500/80 transition-all duration-150"
              style={{
                height: isRecording
                  ? `${(Math.sin(i * 0.35 + recordingTime * 0.8) * 28 + 38)}%`
                  : `${12 + (i % 5) * 4}%`,
                opacity: isRecording ? 0.9 : 0.25,
              }}
            />
          ))}
        </div>
      </div>

      {!isRecording && !hasRecording && !isSpeakingQuestion && (
        <PremiumButton onClick={onStartRecording} className="w-full" dataJazAction="ic_voice_record">
          <Mic className="w-4 h-4" />
          Start Recording
        </PremiumButton>
      )}
      {isRecording && (
        <PremiumButton variant="danger" onClick={onStopRecording} className="w-full" dataJazAction="ic_voice_stop">
          <Square className="w-4 h-4" />
          Stop Recording ({formatTime(recordingTime)})
        </PremiumButton>
      )}
      {hasRecording && !isRecording && (
        <div className="flex flex-col gap-2">
          <PremiumButton variant="secondary" onClick={onStartRecording} dataJazAction="ic_voice_record">
            <Mic className="w-4 h-4" />
            Record Again
          </PremiumButton>
          {onSubmit && (
            <PremiumButton onClick={onSubmit} disabled={isAnalyzing} dataJazAction="ic_voice_submit">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Voice Answer
                </>
              )}
            </PremiumButton>
          )}
        </div>
      )}
    </PremiumCard>
  )
}
