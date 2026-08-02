'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import CareerEngineBridgeResult from './CareerEngineBridgeResult'
import CareerEngineConversation from './CareerEngineConversation'
import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import {
  clearCareerEngineConversationCaches,
  getCareerEnginePath,
} from '@/lib/career-engine/conversation/pathRegistry'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'
import { persistCareerEngineStructuredResult } from '@/lib/uk-career-assistant/persistCareerEngineCompletion'

type Props = {
  goalId: StrategicGoalId
  buildStructuredResult?: (answers: Record<string, string>) => Promise<unknown>
  renderStructuredResult: (result: unknown, isGuest: boolean) => ReactNode
  /** When false, result is shown but not written to localStorage (e.g. career recommendations). */
  shouldPersistResult?: (result: unknown) => boolean
}

function resultDebugKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return []
  return Object.keys(value as Record<string, unknown>)
}

export default function CareerEnginePathPage({
  goalId,
  buildStructuredResult,
  renderStructuredResult,
  shouldPersistResult,
}: Props) {
  const config = getCareerEnginePath(goalId)
  const [conversationKey, setConversationKey] = useState(0)
  const [restoredResult, setRestoredResult] = useState<unknown>(null)
  const [structuredResult, setStructuredResult] = useState<unknown>(null)
  const [bridgeAnswers, setBridgeAnswers] = useState<Record<string, string> | null>(null)
  const [building, setBuilding] = useState(false)
  const [isGuest, setIsGuest] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      // After Restart, ignore any leftover storage until a new result is saved.
      if (conversationKey > 0) {
        setRestoredResult(null)
      } else {
        const raw = localStorage.getItem(config.storageKey)
        if (raw && config.hasStructuredResult) {
          setRestoredResult(JSON.parse(raw))
        } else {
          setRestoredResult(null)
        }
      }
    } catch {
      setRestoredResult(null)
    } finally {
      setHydrated(true)
    }

    void import('@/lib/supabase').then(({ supabase }) => {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        setIsGuest(!session?.user)
      })
    })
  }, [config.hasStructuredResult, config.storageKey, conversationKey])

  const applyStructuredResult = useCallback(
    (result: unknown, answers: Record<string, string>) => {
      if (!result) return
      console.info('[CareerEnginePathPage] result_applied', {
        goalId: config.id,
        keys: resultDebugKeys(result),
        hasJazPlan: Boolean((result as { jaz_jobaz_plan?: unknown }).jaz_jobaz_plan),
        planSource: (result as { plan_source?: string }).plan_source,
      })
      if (shouldPersistResult?.(result) ?? true) {
        localStorage.setItem(config.storageKey, JSON.stringify(result))
      }
      setStructuredResult(result)
      void persistCareerEngineStructuredResult({
        goalId: config.id,
        answers,
        structuredResult: result as CareerEnginePlanResult,
        source: `career_engine_${config.id}`,
      })
    },
    [config.id, config.storageKey, shouldPersistResult]
  )

  const buildResult = useCallback(
    async (answers: Record<string, string>) => {
      console.info('[CareerEnginePathPage] submitted', {
        goalId: config.id,
        answers,
        hasStructuredResult: config.hasStructuredResult,
      })

      if (!config.hasStructuredResult || !buildStructuredResult) {
        setBridgeAnswers(answers)
        console.info('[CareerEnginePathPage] bridge_ready', { goalId: config.id })
        return
      }

      setBuilding(true)
      setStructuredResult(null)
      try {
        const result = await buildStructuredResult(answers)
        console.info('[CareerEnginePathPage] api_payload', {
          goalId: config.id,
          hasResult: Boolean(result),
          keys: resultDebugKeys(result),
          topLevelShape: result && typeof result === 'object'
            ? {
                result: 'result' in (result as object),
                recommendations: 'recommendations' in (result as object),
                finalResult: 'finalResult' in (result as object),
                plan: 'plan' in (result as object),
                message: 'message' in (result as object),
                content: 'content' in (result as object),
                jaz_jobaz_plan: 'jaz_jobaz_plan' in (result as object),
              }
            : null,
        })
        // Always apply late results — never discard after a UI soft-timeout.
        applyStructuredResult(result, answers)
      } catch (err) {
        console.error('[CareerEnginePathPage] build_failed', err)
      } finally {
        setBuilding(false)
        console.info('[CareerEnginePathPage] building_done', { goalId: config.id })
      }
    },
    [applyStructuredResult, buildStructuredResult, config.hasStructuredResult, config.id]
  )

  const handleRestart = () => {
    clearCareerEngineConversationCaches(config.id)
    setRestoredResult(null)
    setStructuredResult(null)
    setBridgeAnswers(null)
    setBuilding(false)
    setHydrated(true)
    setConversationKey((k) => k + 1)
  }

  // Only mark ready when we actually have content to render (not bare "API finished").
  const resultReady = Boolean(structuredResult || bridgeAnswers)

  const resultContent = useMemo(() => {
    if (config.hasStructuredResult && (structuredResult || restoredResult)) {
      return renderStructuredResult(structuredResult ?? restoredResult, isGuest)
    }
    if (bridgeAnswers) {
      return <CareerEngineBridgeResult config={config} answers={bridgeAnswers} />
    }
    return null
  }, [
    bridgeAnswers,
    config,
    isGuest,
    renderStructuredResult,
    restoredResult,
    structuredResult,
  ])

  useEffect(() => {
    console.info('[CareerEnginePathPage] render_state', {
      goalId: config.id,
      building,
      resultReady,
      hasResultContent: Boolean(resultContent),
      structuredKeys: resultDebugKeys(structuredResult),
    })
  }, [building, config.id, resultContent, resultReady, structuredResult])

  const otherPaths = [
    { href: '/career-engine/work-in-education', label: 'Work in my education' },
    { href: '/career-engine/work-in-experience', label: 'Work in my experience' },
    { href: '/career-engine/start-new-career', label: 'Start a new career' },
    { href: '/career-engine/grow-career', label: 'Grow in my career' },
    { href: '/career-engine/extra-income', label: 'Extra income' },
    { href: '/career-engine/start-business', label: 'Start a business' },
  ].filter((p) => !p.href.endsWith(config.slug))

  if (!hydrated) {
    return (
      <main className="relative min-h-screen text-slate-100 overflow-x-hidden">
        <UkCareerBackground />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-2xl border border-violet-500/15 bg-slate-950/40 backdrop-blur-xl p-6">
            <p className="text-sm text-slate-400">Getting your first question ready…</p>
          </div>
        </div>
      </main>
    )
  }

  if (restoredResult && config.hasStructuredResult && !structuredResult && conversationKey === 0) {
    return (
      <main className="relative min-h-screen text-slate-100 overflow-x-hidden">
        <UkCareerBackground />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-16">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
                Career Engine · Path {config.pathNumber}
              </p>
              <h1 className="text-2xl font-bold text-slate-50 mt-1">{config.title}</h1>
              <p className="text-sm text-slate-400 mt-1">{config.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-slate-700/50 text-slate-300 hover:border-violet-500/40 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          </div>
          <div className="rounded-2xl border border-violet-500/15 bg-slate-950/40 backdrop-blur-xl p-4 sm:p-6">
            {renderStructuredResult(restoredResult, isGuest)}
          </div>
          <footer className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
            {otherPaths.slice(0, 3).map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-violet-300">
                {p.label}
              </Link>
            ))}
            <Link href="/uk-career-assistant" className="hover:text-violet-300">
              Career Assistant
            </Link>
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen text-slate-100 overflow-x-hidden">
      <UkCareerBackground />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 pb-16">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
              Career Engine · Path {config.pathNumber}
            </p>
            <h1 className="text-2xl font-bold text-slate-50 mt-1">{config.title}</h1>
            <p className="text-sm text-slate-400 mt-1">{config.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border border-slate-700/50 text-slate-300 hover:border-violet-500/40 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
        </div>

        <div className="rounded-2xl border border-violet-500/15 bg-slate-950/40 backdrop-blur-xl p-4 sm:p-6 shadow-[0_0_60px_rgba(139,92,246,0.08)]">
          <CareerEngineConversation
            key={`${config.id}-${conversationKey}`}
            config={config}
            onComplete={() => {
              console.info('[CareerEnginePathPage] conversation_complete', {
                goalId: config.id,
                hasResultContent: Boolean(resultContent),
              })
            }}
            onAnalyzing={buildResult}
            resultContent={resultContent}
            disabled={building}
            resultReady={resultReady}
          />
        </div>

        <footer className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          {otherPaths.slice(0, 3).map((p) => (
            <Link key={p.href} href={p.href} className="hover:text-violet-300">
              {p.label}
            </Link>
          ))}
          <Link href="/uk-career-assistant" className="hover:text-violet-300">
            Career Assistant
          </Link>
          <Link href="/job-finder" className="hover:text-emerald-300">
            Job Finder
          </Link>
          <Link href="/career-hub" className="hover:text-cyan-300">
            Courses & Licences
          </Link>
        </footer>
      </div>
    </main>
  )
}
