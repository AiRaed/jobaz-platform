'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CareerEnginePathConfig } from '@/lib/career-engine/conversation/types'
import { CAREER_ENGINE_GOAL_REDIRECTS } from '@/lib/career-engine/conversation/pathRegistry'
import RouteBadge from '@/components/plan-ui/RouteBadge'
import { PLAN_SECTION_STYLES, resolvePlanRouteVisual } from '@/lib/plan-ui/planVisualSystem'
import { cn } from '@/lib/utils'

type Props = {
  config: CareerEnginePathConfig
  answers: Record<string, string>
}

export default function CareerEngineBridgeResult({ config, answers }: Props) {
  const assistantUrl = `/uk-career-assistant?goal=${config.id}`
  const routeVisual = resolvePlanRouteVisual(config.id, config.title)
  const RouteIcon = routeVisual.Icon
  const route = PLAN_SECTION_STYLES.route

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `jobaz_career_engine_answers_${config.id}`,
        JSON.stringify({ answers, savedAt: Date.now() })
      )
    } catch {
      // ignore
    }
  }, [answers, config.id])

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={cn('relative overflow-hidden rounded-xl border p-5', route.border, route.panel)}>
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70',
            routeVisual.accentClass
          )}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn('flex h-8 w-8 items-center justify-center rounded-lg border', route.iconWrap)}
            >
              <RouteIcon className={cn('h-4 w-4', route.icon)} />
            </span>
            <RouteBadge pathId={config.id} routeLabel={config.title} />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 font-semibold mb-2">
            Your profile is ready
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            JAZ has captured everything you shared. Your full {config.title.toLowerCase()} roadmap will
            continue in the Career Assistant — same intelligence, now with your answers pre-loaded.
          </p>
          <Link
            href={assistantUrl}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
          >
            Continue to your roadmap
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {Object.values(CAREER_ENGINE_GOAL_REDIRECTS)
          .filter((href) => !href.includes(config.slug))
          .slice(0, 3)
          .map((href) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-full border border-slate-700/50 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30"
            >
              Other paths
            </Link>
          ))}
      </div>
    </div>
  )
}
