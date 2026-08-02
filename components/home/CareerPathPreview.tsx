'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import JazEyeIcon from '@/components/ui/JazEyeIcon'
import { cn } from '@/lib/utils'

type Line =
  | { kind: 'assistant'; text: string }
  | { kind: 'chips'; options: string[]; highlight?: number }
  | { kind: 'typing' }

const SCRIPT: Line[] = [
  { kind: 'assistant', text: 'Hi — I’ll help you find a realistic UK career direction.' },
  { kind: 'assistant', text: 'What kind of work interests you most?' },
  { kind: 'chips', options: ['Warehouse', 'Office', 'Creative', 'Driving'], highlight: 0 },
  { kind: 'typing' },
  { kind: 'assistant', text: 'Would you prefer short training or immediate work?' },
  { kind: 'chips', options: ['Immediate work', 'Short training', 'Not sure yet'], highlight: 1 },
  { kind: 'typing' },
  { kind: 'assistant', text: 'Perfect — I’ll map Work Now, Build Next, and long-term paths for you.' },
]

type Props = {
  variant?: 'hero' | 'section'
}

export default function CareerPathPreview({ variant = 'section' }: Props) {
  const [lineCount, setLineCount] = useState(1)
  const isHero = variant === 'hero'

  useEffect(() => {
    const id = setInterval(() => {
      setLineCount((c) => (c >= SCRIPT.length ? 1 : c + 1))
    }, 2200)
    return () => clearInterval(id)
  }, [])

  const progress = Math.round((lineCount / SCRIPT.length) * 100)

  const panel = (
    <div
      id={isHero ? 'career-path-panel' : undefined}
      className={cn(
        'rounded-2xl border border-violet-500/25 bg-slate-950/60 backdrop-blur-xl shadow-[0_0_50px_rgba(88,28,135,0.2)] overflow-hidden flex flex-col',
        isHero && 'h-full min-h-[360px] max-w-full border-violet-500/15 shadow-[0_12px_32px_rgba(88,28,135,0.12)]'
      )}
    >
      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isHero && (
            <div className="shrink-0 min-w-0">
              <h2 className="text-xs font-semibold text-slate-200">Guided career path</h2>
              <p className="text-[10px] text-slate-500">Personalised UK direction</p>
            </div>
          )}
          {!isHero && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Guided journey
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isHero && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
          <div className="w-16 lg:w-20 h-1 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'flex-1 overflow-y-auto',
          isHero ? 'min-h-0 max-h-[200px] lg:max-h-[220px] p-2.5 space-y-2' : 'min-h-[260px] max-h-[340px] p-3 md:p-4 space-y-3'
        )}
      >
        {SCRIPT.slice(0, lineCount).map((line, i) => (
          <PreviewLine key={`${lineCount}-${i}`} line={line} compact={isHero} />
        ))}
      </div>

      <PreviewFooter compact={isHero} />
    </div>
  )

  if (isHero) {
    return panel
  }

  return (
    <section id="career-path" className="max-w-5xl mx-auto px-4 py-16 md:py-20">
      <SectionHeader />
      {panel}
    </section>
  )
}

function SectionHeader() {
  return (
    <div className="text-center mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">Your guided career path</h2>
      <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
        A short conversation — not a boring form. Get personalised direction for the UK job market.
      </p>
    </div>
  )
}

function PreviewFooter({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'px-4 border-t border-slate-700/50 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-2',
        compact ? 'py-2 px-3' : 'py-4'
      )}
    >
      <p className="text-[10px] sm:text-xs text-slate-500">Free to start · No account required</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/career-engine/work-in-education"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 text-violet-200 hover:bg-violet-950/40 font-medium transition',
            compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'
          )}
        >
          Work in my education
        </Link>
        <Link
          href="/career-engine/work-in-experience"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 text-violet-200 hover:bg-violet-950/40 font-medium transition',
            compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-xs'
          )}
        >
          Work in my experience
        </Link>
        <Link
          href="/uk-career-assistant"
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_20px_rgba(139,92,246,0.5)]',
            compact ? 'px-3 py-1.5 text-[10px]' : 'px-5 py-2.5 text-sm'
          )}
        >
          Start career journey
          <ArrowRight className={cn(compact ? 'h-3 w-3' : 'h-4 w-4')} />
        </Link>
      </div>
    </div>
  )
}

function PreviewLine({ line, compact }: { line: Line; compact?: boolean }) {
  if (line.kind === 'typing') {
    return (
      <div className="flex justify-start items-center gap-2">
        <AssistantAvatar compact={compact} />
        <div className="rounded-xl px-3 py-2 bg-slate-800/80 border border-slate-700/50">
          <span className="flex gap-1">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-violet-400/80 animate-bounce"
                style={{ animationDelay: `${d * 0.15}s` }}
              />
            ))}
          </span>
        </div>
      </div>
    )
  }
  if (line.kind === 'chips') {
    return (
      <div className={cn('flex flex-wrap gap-1.5 justify-end', compact ? 'pl-8' : 'pl-10 md:pl-12')}>
        {line.options.map((opt, idx) => (
          <span
            key={opt}
            className={cn(
              'rounded-full font-medium border transition',
              compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
              idx === line.highlight
                ? 'border-violet-400 bg-violet-500/25 text-violet-100'
                : 'border-slate-600/60 bg-slate-800/50 text-slate-300'
            )}
          >
            {opt}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="flex justify-start items-start gap-2">
      <AssistantAvatar compact={compact} />
      <div
        className={cn(
          'max-w-[85%] rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-500/15 border border-purple-500/30 text-slate-100 leading-relaxed',
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
        )}
      >
        {line.text}
      </div>
    </div>
  )
}

function AssistantAvatar({ compact }: { compact?: boolean }) {
  return (
      <JazEyeIcon
      variant="header"
      size={compact ? 28 : 32}
      className="flex-shrink-0"
      ariaLabel="Career guide"
    />
  )
}
