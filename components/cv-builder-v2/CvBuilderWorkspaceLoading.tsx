'use client'

import { Loader2 } from 'lucide-react'

type Props = {
  /** When true, mention plan context in the secondary line */
  loadingPlanContext?: boolean
}

/**
 * Clean full-workspace loading state — never empty outlined form boxes.
 */
export default function CvBuilderWorkspaceLoading({ loadingPlanContext = false }: Props) {
  return (
    <div
      className="rounded-2xl border border-slate-700/50 bg-slate-950/60 px-6 py-14 sm:px-10 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20">
        <Loader2 className="h-6 w-6 text-violet-300 animate-spin" aria-hidden />
      </div>
      <p className="mt-5 text-base font-medium text-slate-100">Preparing your CV workspace…</p>
      <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
        {loadingPlanContext
          ? 'Loading your saved CV and plan context…'
          : 'Loading your saved CV…'}
      </p>
      <div className="mt-8 mx-auto max-w-sm space-y-2.5" aria-hidden>
        <div className="h-2.5 rounded-full bg-slate-800/80 animate-pulse" />
        <div className="h-2.5 w-4/5 mx-auto rounded-full bg-slate-800/50 animate-pulse" />
        <div className="h-2.5 w-3/5 mx-auto rounded-full bg-slate-800/40 animate-pulse" />
      </div>
    </div>
  )
}
