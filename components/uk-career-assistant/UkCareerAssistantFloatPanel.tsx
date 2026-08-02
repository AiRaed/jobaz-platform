'use client'

import { useEffect } from 'react'
import { Brain, Minus, Maximize2, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import JazEyeIcon from '@/components/ui/JazEyeIcon'
import JazBrainTransition, { prefersReducedMotion } from '@/components/ui/JazBrainTransition'
import { useUkCareerAssistantFloat } from '@/contexts/UkCareerAssistantFloatContext'
import { useState } from 'react'

const EMBED_SRC = '/uk-career-assistant?embed=1'

/**
 * Floating UK Career Assistant — AI brain overlay over the current page.
 * Embeds the main conversation via iframe so question flow stays intact.
 */
export default function UkCareerAssistantFloatPanel() {
  const {
    isOpen,
    isMinimized,
    isEntryTransitioning,
    closeAssistant,
    minimizeAssistant,
    restoreAssistant,
  } = useUkCareerAssistantFloat()
  const [reducedMotion, setReducedMotion] = useState(false)
  /** Keep iframe mounted after first reveal so reopen is instant without re-transition spam mid-session */
  const [iframeReady, setIframeReady] = useState(false)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
  }, [])

  useEffect(() => {
    if (!isEntryTransitioning && isOpen && !isMinimized) {
      setIframeReady(true)
    }
  }, [isEntryTransitioning, isOpen, isMinimized])

  useEffect(() => {
    if (!isOpen) setIframeReady(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isMinimized) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAssistant()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, isMinimized, closeAssistant])

  useEffect(() => {
    if (!isOpen || isMinimized) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen, isMinimized])

  if (!isOpen && !isMinimized) return null

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={restoreAssistant}
        className={cn(
          'uk-ca-float-minimized fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-full',
          'border border-violet-500/40 bg-slate-950/95 px-4 py-2.5 text-sm font-semibold text-slate-100',
          'shadow-[0_8px_32px_rgba(139,92,246,0.35)] backdrop-blur-xl',
          'hover:border-violet-400/60 hover:bg-slate-900 transition'
        )}
        aria-label="Restore UK Career Assistant"
      >
        <JazEyeIcon variant="header" />
        Career Assistant
        <Maximize2 className="h-3.5 w-3.5 text-violet-300" />
      </button>
    )
  }

  const showConversation = iframeReady && !isEntryTransitioning

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
      <button
        type="button"
        aria-label="Close assistant backdrop"
        className="uk-ca-float-backdrop absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        onClick={closeAssistant}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="UK Career Assistant"
        className={cn(
          'uk-ca-float-shell relative z-10 flex w-full flex-col overflow-hidden',
          'h-[100dvh] sm:h-[min(92vh,880px)] sm:max-w-5xl sm:rounded-2xl',
          'border border-violet-500/30 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.65)]'
        )}
      >
        <header className="uk-ca-float-header flex shrink-0 items-center justify-between gap-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-slate-950 to-cyan-950/30 px-3.5 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <JazEyeIcon variant="header" className="shrink-0" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-50">
                <Brain className="h-3.5 w-3.5 text-violet-300" />
                UK Career Assistant
              </p>
              <p className="text-[10px] text-emerald-400/90 flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                {isEntryTransitioning ? 'JAZ preparing…' : 'JAZ AI brain · conversation mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/uk-career-assistant"
              onClick={closeAssistant}
              className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/5"
              title="Open full page"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Full page
            </Link>
            <button
              type="button"
              onClick={minimizeAssistant}
              className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5"
              aria-label="Minimize assistant"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={closeAssistant}
              className="rounded-lg p-2 text-slate-400 hover:text-slate-100 hover:bg-white/5"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="uk-ca-float-body relative min-h-0 flex-1 bg-slate-950">
          {/* Prefetch iframe during transition so questions appear immediately after */}
          {(isEntryTransitioning || showConversation) && (
            <iframe
              title="UK Career Assistant conversation"
              src={EMBED_SRC}
              className={cn(
                'h-full w-full border-0 bg-transparent',
                showConversation ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
              )}
              allow="clipboard-write"
            />
          )}
          <JazBrainTransition
            active={isEntryTransitioning}
            variant="contained"
            reducedMotion={reducedMotion}
          />
        </div>
      </div>
    </div>
  )
}
