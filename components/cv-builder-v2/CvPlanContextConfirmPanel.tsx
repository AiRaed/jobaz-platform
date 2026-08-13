'use client'

import { FileText, Route } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  roleLabel: string
  routeLabel?: string | null
  upgradeLabel?: string | null
  mismatch?: boolean
  onTailor: () => void
  onKeep: () => void
  onUseNormally: () => void
}

/**
 * Persistent plan-context confirmation — stays until the user chooses an action.
 */
export default function CvPlanContextConfirmPanel({
  roleLabel,
  routeLabel,
  upgradeLabel,
  mismatch = false,
  onTailor,
  onKeep,
  onUseNormally,
}: Props) {
  return (
    <section
      className="mb-3 rounded-2xl border border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-slate-950/80 to-violet-950/30 px-4 py-4 sm:px-5 shadow-[0_12px_32px_rgba(15,23,42,0.45)]"
      role="dialog"
      aria-labelledby="cv-plan-confirm-title"
      aria-describedby="cv-plan-confirm-desc"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          {mismatch ? (
            <Route className="h-4 w-4 text-amber-300" aria-hidden />
          ) : (
            <FileText className="h-4 w-4 text-violet-300" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="cv-plan-confirm-title" className="text-sm font-semibold text-slate-100">
            {mismatch
              ? 'This CV was started for another route. Do you want to tailor it for your current plan?'
              : `You're opening CV Builder for: ${roleLabel}`}
          </h2>
          <p id="cv-plan-confirm-desc" className="mt-1.5 text-[12px] text-slate-400 leading-relaxed">
            {mismatch
              ? 'Your saved CV content will stay as-is until you choose. You can tailor tools for this plan, keep editing the current CV, or use CV Builder without plan mode.'
              : 'You can update your saved CV for this plan. We will not overwrite your summary or fields unless you choose to tailor.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span>
              <span className="text-slate-600">Focus:</span>{' '}
              <span className="text-violet-200/90 font-medium">{roleLabel}</span>
            </span>
            {routeLabel ? (
              <span>
                <span className="text-slate-600">Route:</span>{' '}
                <span className="text-slate-300">{routeLabel}</span>
              </span>
            ) : null}
            {upgradeLabel ? (
              <span>
                <span className="text-slate-600">Training:</span>{' '}
                <span className="text-slate-300">{upgradeLabel}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              type="button"
              onClick={onTailor}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition',
                'bg-violet-600 text-white hover:bg-violet-500 border border-violet-400/40'
              )}
            >
              Tailor CV for this plan
            </button>
            <button
              type="button"
              onClick={onKeep}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition',
                'border border-slate-600/80 bg-slate-900/70 text-slate-200 hover:border-slate-500 hover:bg-slate-800/80'
              )}
            >
              Keep current CV
            </button>
            <button
              type="button"
              onClick={onUseNormally}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-3.5 py-2.5 text-xs font-semibold transition',
                'border border-amber-500/35 bg-amber-950/25 text-amber-100 hover:bg-amber-950/45'
              )}
            >
              Use CV Builder normally
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
