'use client'

import Link from 'next/link'
import { ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerJourneySnapshot } from '@/lib/career-journey/types'

type Props = {
  snapshot: CareerJourneySnapshot | null
  loading?: boolean
}

export default function CareerJourneyCommand({ snapshot, loading }: Props) {
  if (loading || !snapshot) {
    return (
      <section className="mb-8 rounded-2xl border border-violet-500/20 bg-slate-950/50 p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="h-4 w-full max-w-xl bg-slate-800/60 rounded" />
      </section>
    )
  }

  const primary = snapshot.nextActions.find((a) => a.priority === 'primary') ?? snapshot.nextActions[0]
  const secondary = snapshot.nextActions.filter((a) => a !== primary).slice(0, 2)

  return (
    <section className="mb-8 rounded-2xl border border-violet-500/25 bg-slate-950/50 shadow-[0_0_50px_rgba(88,28,135,0.15)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-slate-950/30 to-cyan-950/20 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h2 className="text-lg md:text-xl font-semibold text-slate-50">Career Operating System</h2>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              JAZ guides your next step — dashboard, tools, and community adapt to where you are.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <MapPin className="h-3 w-3" />
            {snapshot.stateLabel}
          </span>
        </div>
      </div>

      <div className="p-5 md:p-6 space-y-4">
        {primary && (
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-slate-900/50 px-4 py-4 md:px-5 md:py-5">
            <p className="text-xs uppercase tracking-wide text-violet-300/90 mb-1">Do this today</p>
            <h3 className="text-base font-semibold text-slate-50">{primary.title}</h3>
            <Link
              href={primary.href}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition',
                'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
                'shadow-[0_0_18px_rgba(139,92,246,0.5)]'
              )}
            >
              {primary.toolLabel ?? 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {secondary.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {secondary.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="group rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 hover:border-violet-500/40 transition"
              >
                <p className="text-sm font-medium text-slate-200 group-hover:text-violet-200">
                  {action.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">{action.description}</p>
              </Link>
            ))}
          </div>
        )}

        {!snapshot.hasCompletedAssessment && (
          <Link
            href="/uk-career-assistant"
            className="flex items-center gap-3 rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4 hover:border-cyan-400/40 transition"
          >
            <Compass className="h-8 w-8 text-cyan-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Start with the UK Career Assistant</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Your main entry point — Work Now, Build Next, and long-term direction in one conversation.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-cyan-400 ml-auto shrink-0" />
          </Link>
        )}

      </div>
    </section>
  )
}
