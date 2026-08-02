'use client'

import { Upload, Sparkles } from 'lucide-react'

type Props = {
  variant: 'no_project' | 'no_analysis'
}

export default function AnalysisEmptyState({ variant }: Props) {
  if (variant === 'no_project') {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-[240px]">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-4">
          <Upload className="w-6 h-6 text-violet-300" />
        </div>
        <p className="text-sm font-medium text-slate-200 mb-2">Upload a document or start writing</p>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          JobAZ will analyse your text for grammar, clarity, professional tone, structure, and vocabulary — then guide
          your next step in the JobAZ journey.
        </p>
        <ul className="mt-4 text-left text-xs text-slate-400 space-y-1">
          {['Grammar', 'Clarity', 'Professional tone', 'Academic quality', 'Structure', 'Vocabulary'].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-emerald-400">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center text-center px-4 py-10">
      <Sparkles className="w-8 h-8 text-violet-400/60 mb-3" />
      <p className="text-sm text-slate-300 mb-1">Ready for intelligent review</p>
      <p className="text-xs text-slate-500">Run analysis to see your score, strengths, and suggested improvements.</p>
    </div>
  )
}
