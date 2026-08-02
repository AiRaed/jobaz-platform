'use client'

import { useEffect, useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import AssistantBubble from '@/components/uk-career-assistant/AssistantBubble'

type Props = {
  checklist: string[]
  onComplete: () => void
  durationMs?: number
}

export default function CareerEngineAnalysisStage({
  checklist,
  onComplete,
  durationMs = 3600,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const interval = durationMs / (checklist.length + 2)
    let count = 0
    const id = setInterval(() => {
      count += 1
      setVisibleCount(count)
      if (count >= checklist.length) {
        clearInterval(id)
        setTimeout(() => {
          setDone(true)
          setTimeout(onComplete, 600)
        }, 800)
      }
    }, interval)
    return () => clearInterval(id)
  }, [checklist.length, durationMs, onComplete])

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
      <AssistantBubble content={"Perfect.\n\nI'm analysing:"} />

      <div className="ml-12 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/30 via-slate-950/80 to-indigo-950/20 p-5 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
          <p className="text-xs font-semibold text-violet-200">Analysing your UK career profile</p>
        </div>

        <ul className="space-y-2.5 mb-5">
          {checklist.map((item, index) => {
            const visible = index < visibleCount
            const checked = index < visibleCount - 1 || (index === checklist.length - 1 && done)
            return (
              <li
                key={item}
                className={cn(
                  'flex items-center gap-2.5 text-sm transition-all duration-500',
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                    checked
                      ? 'border-emerald-500/50 bg-emerald-500/20'
                      : visible
                        ? 'border-violet-500/40 bg-violet-500/10 animate-pulse'
                        : 'border-slate-700'
                  )}
                >
                  {checked ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400/60" />
                  )}
                </span>
                <span className={checked ? 'text-slate-300' : 'text-slate-400'}>{item}</span>
              </li>
            )
          })}
        </ul>

        <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-slate-950/60 px-4 py-3">
          <p className="text-xs text-violet-200/90 font-medium relative z-10">
            {done ? 'Roadmap ready ✓' : 'Building your personalised roadmap…'}
          </p>
          {!done && (
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-violet-400/20 to-transparent animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}
