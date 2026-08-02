'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import JazEyeIcon from '@/components/ui/JazEyeIcon'

const STATUS_LINES = [
  'Reading your goal',
  'Mapping work-now options',
  'Preparing your plan',
] as const

export const JAZ_BRAIN_TRANSITION_MS = 1500
export const JAZ_BRAIN_TRANSITION_REDUCED_MS = 300

type Props = {
  /** When false, unmount after fade-out completes */
  active: boolean
  /** Contain inside a parent (float panel) vs full viewport */
  variant?: 'fullscreen' | 'contained'
  className?: string
  /** Called after fade-out when active becomes false */
  onExited?: () => void
  reducedMotion?: boolean
}

/**
 * Lightweight AI-brain entry overlay for UK Career Assistant.
 * CSS-only pulse / fades — no animation libraries.
 */
export default function JazBrainTransition({
  active,
  variant = 'fullscreen',
  className,
  onExited,
  reducedMotion = false,
}: Props) {
  const [mounted, setMounted] = useState(active)
  const [visible, setVisible] = useState(active)
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    if (active) {
      setMounted(true)
      const id = requestAnimationFrame(() => setVisible(true))
      setStatusIndex(0)
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const t = setTimeout(() => {
      setMounted(false)
      onExited?.()
    }, reducedMotion ? 0 : 280)
    return () => clearTimeout(t)
  }, [active, onExited, reducedMotion])

  useEffect(() => {
    if (!active || reducedMotion) return
    const step = Math.floor(JAZ_BRAIN_TRANSITION_MS / STATUS_LINES.length)
    const timers = STATUS_LINES.map((_, i) =>
      setTimeout(() => setStatusIndex(i), i * step)
    )
    return () => timers.forEach(clearTimeout)
  }, [active, reducedMotion])

  if (!mounted) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={visible}
      className={cn(
        'z-[90] flex flex-col items-center justify-center px-6 text-center',
        'transition-opacity duration-300 ease-out',
        visible ? 'opacity-100' : 'opacity-0',
        variant === 'fullscreen' ? 'fixed inset-0' : 'absolute inset-0 rounded-[inherit]',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0',
          'bg-slate-950/80 dark:bg-slate-950/85',
          'backdrop-blur-sm'
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-950/30 via-transparent to-cyan-950/20"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-sm flex-col items-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
          {!reducedMotion && (
            <>
              <span
                className="jaz-brain-entry-pulse absolute inset-0 rounded-full bg-violet-500/25 blur-xl"
                aria-hidden
              />
              <span
                className="jaz-brain-entry-ring absolute -inset-2 rounded-full border border-violet-400/25"
                aria-hidden
              />
            </>
          )}
          <JazEyeIcon variant="header" size={40} className="relative" />
        </div>

        <p className="text-base font-semibold tracking-tight text-slate-50 md:text-lg">
          JAZ is preparing your career route…
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400 md:text-sm">
          Analysing your answers, routes, training and jobs
        </p>

        <ul className="mt-5 w-full max-w-[220px] space-y-1.5 text-left">
          {STATUS_LINES.map((line, i) => {
            const isActive = reducedMotion ? true : i <= statusIndex
            const isCurrent = !reducedMotion && i === statusIndex
            return (
              <li
                key={line}
                className={cn(
                  'flex items-center gap-2 text-[11px] transition-opacity duration-300',
                  isActive ? 'opacity-100' : 'opacity-30'
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    isCurrent
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                      : isActive
                        ? 'bg-violet-400/80'
                        : 'bg-slate-600'
                  )}
                />
                <span
                  className={cn(
                    isCurrent ? 'text-slate-200' : isActive ? 'text-slate-400' : 'text-slate-600'
                  )}
                >
                  {line}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export function getAssistantTransitionDuration(reducedMotion: boolean): number {
  return reducedMotion ? JAZ_BRAIN_TRANSITION_REDUCED_MS : JAZ_BRAIN_TRANSITION_MS
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
