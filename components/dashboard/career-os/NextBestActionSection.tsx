'use client'

import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlanNextAction } from '@/lib/dashboard/careerOs/types'

type Props = {
  action: PlanNextAction
  compact?: boolean
}

export default function NextBestActionSection({ action, compact }: Props) {
  if (compact) {
    return (
      <section className="rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-950/15 to-slate-950/60 p-4 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">Next Best Action</h3>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-amber-400/70 mb-1">Do this now</p>
          <p className="text-lg font-bold text-slate-50 leading-tight">{action.priority}</p>
        </div>
        <Link
          href={action.href}
          className={cn(
            'mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition w-full',
            'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
          )}
        >
          {action.buttonLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/20 via-slate-950/80 to-slate-900/50 p-6 md:p-8">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <h3 className="text-lg font-semibold text-slate-100">Next Best Action</h3>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-amber-400/80 mb-2">What should I do right now?</p>
      <h4 className="text-2xl font-bold text-slate-50 mb-6">{action.priority}</h4>
      <Link
        href={action.href}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold text-white transition',
          'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
          'shadow-[0_0_20px_rgba(139,92,246,0.4)]'
        )}
      >
        {action.buttonLabel}
        <ArrowRight className="w-5 h-5" />
      </Link>
    </section>
  )
}
