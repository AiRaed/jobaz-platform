'use client'

import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { Question } from '@/app/uk-career-assistant/page'

interface QuestionCardProps {
  question: Question
  selectedOptions: string[]
  onOptionClick: (value: string) => void
  onMultiSubmit?: () => void
  loading?: boolean
  isTyping?: boolean
  contextChip?: string
}

export default function QuestionCard({
  question,
  selectedOptions,
  onOptionClick,
  onMultiSubmit,
  loading = false,
  isTyping = false,
  contextChip,
}: QuestionCardProps) {
  const maxSelectReached =
    question.type === 'multi' && question.max_select && selectedOptions.length >= question.max_select
  const canSubmitMulti = question.type === 'multi' && selectedOptions.length > 0

  return (
    <div className="uk-ca-question mb-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-950/80 via-violet-950/20 to-slate-900/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.12)] p-5 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-3 mb-4">
        <div className="uk-ca-icon w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-violet-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="uk-ca-label text-[10px] uppercase tracking-wider text-violet-400/80 mb-1">JAZ asks</p>
          <h3 className="uk-ca-title text-base md:text-lg font-medium text-slate-50 leading-snug">{question.text}</h3>
        </div>
        {contextChip && (
          <span className="px-2.5 py-1 text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-full whitespace-nowrap">
            {contextChip}
          </span>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent mb-4" />

      {question.type === 'multi' && question.max_select && (
        <p className="text-xs text-slate-500 mb-3">
          Select up to {question.max_select}
          {selectedOptions.length > 0 && ` · ${selectedOptions.length} selected`}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {question.id === 'cb_user_goal' ? (
          <div className="w-full space-y-2">
            {(question.options ?? []).map((option) => {
              const isSelected = selectedOptions.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onOptionClick(option.value)}
                  disabled={loading || isTyping}
                  className={cn(
                    'uk-ca-option w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]',
                    isSelected
                      ? 'uk-ca-option--selected bg-gradient-to-r from-violet-600/40 to-cyan-600/30 border-violet-400/50 text-white shadow-[0_0_16px_rgba(139,92,246,0.25)] ring-1 ring-violet-400/30'
                      : 'bg-slate-900/60 border-slate-600/40 text-slate-200 hover:border-violet-500/40 hover:bg-violet-950/30',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
                  )}
                >
                  <span className="font-semibold block">{option.label}</span>
                  {option.description && (
                    <span className="uk-ca-option-desc block text-xs text-slate-400 mt-1 font-normal leading-snug">
                      {option.description}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          (question.options ?? []).map((option) => {
            const isSelected = selectedOptions.includes(option.value)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onOptionClick(option.value)}
                disabled={loading || isTyping || (question.type === 'multi' && !!maxSelectReached && !isSelected)}
                className={cn(
                  'uk-ca-option px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
                  'hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]',
                  isSelected
                    ? 'uk-ca-option--selected bg-gradient-to-r from-violet-600/40 to-cyan-600/30 border-violet-400/50 text-white shadow-[0_0_16px_rgba(139,92,246,0.25)] ring-1 ring-violet-400/30'
                    : 'bg-slate-900/60 border-slate-600/40 text-slate-200 hover:border-violet-500/40 hover:bg-violet-950/30',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none'
                )}
              >
                {option.label}
              </button>
            )
          })
        )}
      </div>

      {question.type === 'multi' && selectedOptions.length > 0 && (
        <button
          type="button"
          onClick={onMultiSubmit}
          disabled={!canSubmitMulti || loading || isTyping}
          className={cn(
            'w-full px-5 py-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400',
            'text-white rounded-xl font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.35)]',
            'hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
          )}
        >
          Continue · {selectedOptions.length} selected
        </button>
      )}
    </div>
  )
}
