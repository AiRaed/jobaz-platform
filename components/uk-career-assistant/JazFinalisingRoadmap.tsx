'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import JazEyeIcon from '@/components/ui/JazEyeIcon'

const STATUS_LINES = [
  'Understanding your answers…',
  'Matching practical UK work routes…',
  'Checking training and licence options…',
  'Building your action plan…',
  'Preparing your roadmap…',
]

type Props = {
  /** Called once minimum display time + optional external ready */
  onReady?: () => void
  /** When true, finish after minMs (external API done) */
  complete?: boolean
  /** Minimum time to show for a smooth transition */
  minMs?: number
  className?: string
  title?: string
}

/**
 * Polished “building roadmap” state for Career Assistant / Career Engine.
 */
export default function JazFinalisingRoadmap({
  onReady,
  complete = false,
  minMs = 800,
  className,
  title = 'Finalising your roadmap',
}: Props) {
  const [lineIndex, setLineIndex] = useState(0)
  const [progress, setProgress] = useState(8)
  const [startedAt] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const lineTimer = setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length)
    }, 1400)
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (complete) return Math.min(96, p + 8)
        return p >= 88 ? 88 : p + Math.random() * 4 + 1
      })
    }, 400)
    return () => {
      clearInterval(lineTimer)
      clearInterval(progressTimer)
    }
  }, [complete])

  useEffect(() => {
    if (!complete || finished) return
    const elapsed = Date.now() - startedAt
    const wait = Math.max(0, minMs - elapsed)
    const t = window.setTimeout(() => {
      setProgress(100)
      setFinished(true)
      onReady?.()
    }, wait)
    return () => window.clearTimeout(t)
  }, [complete, finished, minMs, onReady, startedAt])

  return (
    <div
      className={cn(
        'rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/35 via-slate-950/80 to-cyan-950/20 p-5 sm:p-6',
        'shadow-[0_0_40px_rgba(139,92,246,0.12)] animate-in fade-in slide-in-from-bottom-3 duration-500',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={!finished}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex h-11 w-11 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-violet-500/25 blur-md animate-pulse" />
          <span className="absolute inset-1 rounded-full border border-violet-400/30 animate-ping opacity-40" />
          <div className="relative">
            <JazEyeIcon variant="header" size={28} />
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-violet-300/80 mb-0.5">JAZ</p>
          <p className="text-sm font-semibold text-slate-100">{title}</p>
        </div>
        <div className="ml-auto flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-violet-400/80"
              style={{
                animation: 'jaz-finalise-dot 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-3 min-h-[1.25rem] transition-opacity duration-300">
        {finished ? 'Your roadmap is ready' : STATUS_LINES[lineIndex]}
      </p>

      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden border border-slate-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <ol className="mt-4 grid grid-cols-5 gap-1.5">
        {STATUS_LINES.map((_, i) => (
          <li
            key={STATUS_LINES[i]}
            className={cn(
              'h-1 rounded-full transition-colors duration-300',
              i <= lineIndex || finished ? 'bg-violet-400/70' : 'bg-slate-800'
            )}
          />
        ))}
      </ol>

      <style jsx>{`
        @keyframes jaz-finalise-dot {
          0%,
          100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  )
}
