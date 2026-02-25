'use client'

import { cn } from '@/lib/utils'
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
  contextChip
}: QuestionCardProps) {
  const maxSelectReached = question.type === 'multi' && 
    question.max_select && 
    selectedOptions.length >= question.max_select
  const canSubmitMulti = question.type === 'multi' && selectedOptions.length > 0

  return (
    <div className="mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Question Title */}
      <div className="mb-5">
        <div className="flex items-start gap-3 mb-3">
          <h3 className="text-lg font-medium text-slate-50 flex-1 leading-snug">
            {question.text}
          </h3>
          {contextChip && (
            <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full whitespace-nowrap">
              {contextChip}
            </span>
          )}
        </div>
        {/* Subtle animated divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-4" />
        {question.type === 'multi' && question.max_select && (
          <p className="text-sm text-slate-400 mb-2">
            Select up to {question.max_select} option{question.max_select > 1 ? 's' : ''}
            {selectedOptions.length > 0 && ` (${selectedOptions.length} selected)`}
          </p>
        )}
      </div>

      {/* Options as premium buttons */}
      <div className="space-y-3 mb-5">
        {question.options.map((option) => {
          const isSelected = selectedOptions.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => onOptionClick(option.value)}
              disabled={loading || isTyping || (question.type === 'multi' && !!maxSelectReached && !isSelected)}
              className={cn(
                "w-full text-left px-5 py-3.5 rounded-xl border transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-900/20",
                question.type === 'single'
                  ? "bg-slate-800/60 border-slate-600/30 hover:bg-purple-600/20 hover:border-purple-400/40 text-slate-100"
                  : isSelected
                  ? "border-purple-500 bg-purple-600/25 text-white shadow-lg shadow-purple-900/30 ring-2 ring-purple-500/30"
                  : "bg-slate-800/60 border-slate-600/30 hover:bg-purple-600/20 hover:border-purple-400/40 text-slate-100",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {/* Multi-select: Show selected pills summary + submit button */}
      {question.type === 'multi' && selectedOptions.length > 0 && (
        <div className="space-y-3">
          {/* Selected options summary */}
          <div className="flex flex-wrap gap-2 pb-2">
            {selectedOptions.map((optValue) => {
              const option = question.options.find(o => o.value === optValue)
              return (
                <span
                  key={optValue}
                  className="px-3 py-1.5 text-xs font-medium bg-purple-600/30 text-purple-200 border border-purple-500/40 rounded-full"
                >
                  {option?.label || optValue}
                </span>
              )
            })}
          </div>
          {/* Submit button with gradient */}
          <button
            onClick={onMultiSubmit}
            disabled={!canSubmitMulti || loading || isTyping}
            className={cn(
              "w-full px-5 py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400",
              "text-white rounded-xl font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]",
              "hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
          >
            Submit {selectedOptions.length > 0 && `(${selectedOptions.length})`}
          </button>
        </div>
      )}
    </div>
  )
}

