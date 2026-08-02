'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXPERIENCE_PATH_QUESTIONS } from '@/lib/career-engine/experience-path/questions'
import type { ExperiencePathAnswers } from '@/lib/career-engine/experience-path/types'

type Props = {
  onComplete: (answers: ExperiencePathAnswers) => void
  loading?: boolean
}

export default function ExperiencePathWizard({ onComplete, loading }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<ExperiencePathAnswers>>({})
  const [locationText, setLocationText] = useState('')

  const question = EXPERIENCE_PATH_QUESTIONS[step]
  const total = EXPERIENCE_PATH_QUESTIONS.length
  const currentValue = answers[question.id]

  const canNext = Boolean(
    currentValue ||
      (question.id === 'preferred_location' && (currentValue || locationText.trim()))
  )

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }))
  }

  const handleNext = () => {
    if (step < total - 1) {
      setStep((s) => s + 1)
      return
    }

    const finalAnswers = { ...answers } as ExperiencePathAnswers
    if (question.id === 'preferred_location' && locationText.trim()) {
      finalAnswers.preferred_location = locationText.trim()
    }
    onComplete(finalAnswers)
  }

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-violet-400" />
          <p className="text-xs uppercase tracking-widest text-violet-300/90 font-semibold">
            Work in my Experience
          </p>
        </div>
        <p className="text-sm text-slate-400">
          10 quick questions — your work history shapes a UK career plan at your level.
        </p>
        <div className="mt-4 flex gap-1">
          {EXPERIENCE_PATH_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-violet-500' : 'bg-slate-800'
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">
          Question {step + 1} of {total}
        </p>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-slate-950/80 p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">{question.text}</h2>

        <div className="space-y-2">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition',
                currentValue === opt.value
                  ? 'border-violet-500/50 bg-violet-950/40 text-violet-100'
                  : 'border-slate-700/50 bg-slate-900/40 text-slate-300 hover:border-violet-500/30'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {question.allowFreeText && (
          <div className="mt-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wide">Or enter a city</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => {
                setLocationText(e.target.value)
                if (e.target.value.trim()) handleSelect(e.target.value.trim())
              }}
              placeholder="e.g. Newcastle"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-900/60 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="inline-flex items-center gap-1 px-3 py-2 text-xs text-slate-400 disabled:opacity-30 hover:text-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40"
        >
          {step === total - 1 ? (loading ? 'Building plan…' : 'See my plan') : 'Next'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
