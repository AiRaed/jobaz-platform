'use client'

import { Briefcase, FileText, Sparkles } from 'lucide-react'
import type { InterviewSource } from '@/lib/interview-coach/briefConfig'
import { interviewSourceLabel } from '@/lib/interview-coach/briefConfig'
import { cn } from '@/lib/utils'

type Props = {
  source: InterviewSource
  className?: string
}

export default function InterviewSourceBanner({ source, className }: Props) {
  const Icon = source === 'tailor-cv' ? FileText : source === 'job-finder' ? Briefcase : Sparkles
  const tone =
    source === 'tailor-cv'
      ? 'border-cyan-500/25 bg-cyan-950/20 text-cyan-100'
      : source === 'job-finder'
        ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-100'
        : 'border-violet-500/25 bg-violet-950/20 text-violet-100'

  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-2.5 flex items-center gap-2 text-sm mb-4',
        tone,
        className
      )}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-80" />
      <span>{interviewSourceLabel(source)}</span>
    </div>
  )
}
