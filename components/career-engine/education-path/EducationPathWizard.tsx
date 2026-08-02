'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  EDUCATION_FIELD_QUESTION,
  EDUCATION_PATH_FOLLOWUP_QUESTIONS,
  EDUCATION_PATH_TOTAL_STEPS,
} from '@/lib/career-engine/education-path/questions'
import {
  getSpecialisationOptions,
  specialisationAllowsFreeText,
} from '@/lib/career-engine/education-path/educationSpecialisations'
import type { EducationFieldId, EducationPathAnswers } from '@/lib/career-engine/education-path/types'

type Props = {
  onComplete: (answers: EducationPathAnswers) => void
  loading?: boolean
}

type WizardStep =
  | { kind: 'field' }
  | { kind: 'specialisation'; fieldId: EducationFieldId }
  | { kind: 'followup'; index: number }

export default function EducationPathWizard({ onComplete, loading }: Props) {
  const [step, setStep] = useState<WizardStep>({ kind: 'field' })
  const [answers, setAnswers] = useState<Partial<EducationPathAnswers>>({})
  const [specialisationText, setSpecialisationText] = useState('')
  const [locationText, setLocationText] = useState('')

  const stepNumber = useMemo(() => {
    if (step.kind === 'field') return 1
    if (step.kind === 'specialisation') return 2
    return 3 + step.index
  }, [step])

  const fieldId = answers.education_field as EducationFieldId | undefined

  const canNext = useMemo(() => {
    if (step.kind === 'field') return Boolean(fieldId)
    if (step.kind === 'specialisation') {
      if (!answers.education_specialisation) return false
      if (
        fieldId &&
        specialisationAllowsFreeText(fieldId, answers.education_specialisation) &&
        !specialisationText.trim()
      ) {
        return false
      }
      return true
    }
    const q = EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index]
    const val = answers[q.id]
    if (q.id === 'preferred_location') return Boolean(val || locationText.trim())
    return Boolean(val)
  }, [step, fieldId, answers, specialisationText, locationText])

  const handleFieldSelect = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      education_field: value as EducationFieldId,
      education_specialisation: undefined,
      education_specialisation_other: undefined,
    }))
    setSpecialisationText('')
  }

  const handleSpecialisationSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, education_specialisation: value }))
  }

  const handleFollowupSelect = (questionId: keyof EducationPathAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (step.kind === 'field' && fieldId) {
      setStep({ kind: 'specialisation', fieldId })
      return
    }

    if (step.kind === 'specialisation' && fieldId) {
      const finalAnswers = { ...answers }
      if (
        specialisationAllowsFreeText(fieldId, answers.education_specialisation!) &&
        specialisationText.trim()
      ) {
        finalAnswers.education_specialisation_other = specialisationText.trim()
      }
      setAnswers(finalAnswers)
      setStep({ kind: 'followup', index: 0 })
      return
    }

    if (step.kind === 'followup') {
      if (step.index < EDUCATION_PATH_FOLLOWUP_QUESTIONS.length - 1) {
        setStep({ kind: 'followup', index: step.index + 1 })
        return
      }

      const finalAnswers = { ...answers } as EducationPathAnswers
      const lastQ = EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index]
      if (lastQ.id === 'preferred_location' && locationText.trim()) {
        finalAnswers.preferred_location = locationText.trim()
      }
      onComplete(finalAnswers)
    }
  }

  const handleBack = () => {
    if (step.kind === 'followup' && step.index > 0) {
      setStep({ kind: 'followup', index: step.index - 1 })
      return
    }
    if (step.kind === 'followup') {
      setStep({ kind: 'specialisation', fieldId: fieldId! })
      return
    }
    if (step.kind === 'specialisation') {
      setStep({ kind: 'field' })
    }
  }

  const title =
    step.kind === 'field'
      ? EDUCATION_FIELD_QUESTION.text
      : step.kind === 'specialisation'
        ? 'What was your specialisation?'
        : EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index].text

  const options =
    step.kind === 'field'
      ? EDUCATION_FIELD_QUESTION.options
      : step.kind === 'specialisation' && fieldId
        ? getSpecialisationOptions(fieldId).map((o) => ({ value: o.value, label: o.label }))
        : step.kind === 'followup'
          ? EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index].options
          : []

  const currentValue =
    step.kind === 'field'
      ? answers.education_field
      : step.kind === 'specialisation'
        ? answers.education_specialisation
        : step.kind === 'followup'
          ? answers[EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index].id]
          : undefined

  const showSpecFreeText =
    step.kind === 'specialisation' &&
    fieldId &&
    answers.education_specialisation &&
    specialisationAllowsFreeText(fieldId, answers.education_specialisation)

  const showLocationFreeText =
    step.kind === 'followup' && EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index].allowFreeText

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-5 h-5 text-violet-400" />
          <p className="text-xs uppercase tracking-widest text-violet-300/90 font-semibold">
            Work in my Education
          </p>
        </div>
        <p className="text-sm text-slate-400">
          {EDUCATION_PATH_TOTAL_STEPS} quick questions — your specialisation shapes a profession-specific
          UK career plan.
        </p>
        <div className="mt-4 flex gap-1">
          {Array.from({ length: EDUCATION_PATH_TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                i < stepNumber ? 'bg-violet-500' : 'bg-slate-800'
              )}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-1.5">
          Question {stepNumber} of {EDUCATION_PATH_TOTAL_STEPS}
        </p>
      </div>

      <div className="rounded-xl border border-violet-500/20 bg-slate-950/80 p-5">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">{title}</h2>
        {step.kind === 'specialisation' && fieldId && (
          <p className="text-xs text-slate-500 mb-4">
            Selected field: <span className="text-violet-300">{EDUCATION_FIELD_QUESTION.options.find((o) => o.value === fieldId)?.label}</span>
          </p>
        )}

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (step.kind === 'field') handleFieldSelect(opt.value)
                else if (step.kind === 'specialisation') handleSpecialisationSelect(opt.value)
                else if (step.kind === 'followup') {
                  handleFollowupSelect(EDUCATION_PATH_FOLLOWUP_QUESTIONS[step.index].id, opt.value)
                }
              }}
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

        {showSpecFreeText && (
          <div className="mt-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wide">
              Describe your specialisation
            </label>
            <input
              type="text"
              value={specialisationText}
              onChange={(e) => setSpecialisationText(e.target.value)}
              placeholder="e.g. Cardiac Nursing, Tax Accounting"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-900/60 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>
        )}

        {showLocationFreeText && (
          <div className="mt-3">
            <label className="text-[10px] text-slate-500 uppercase tracking-wide">Or enter a city</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => {
                setLocationText(e.target.value)
                if (e.target.value.trim()) {
                  handleFollowupSelect('preferred_location', e.target.value.trim())
                }
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
          disabled={step.kind === 'field'}
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
          {stepNumber === EDUCATION_PATH_TOTAL_STEPS ? (loading ? 'Building plan…' : 'See my plan') : 'Next'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
