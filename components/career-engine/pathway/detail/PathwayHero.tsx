'use client'

import { cn } from '@/lib/utils'
import type {
  PathwayDetailMatchExplanation,
  PathwayDetailRole,
} from '@/lib/career-engine/pathway-knowledge'

type Props = {
  role: PathwayDetailRole
  match: PathwayDetailMatchExplanation | null
}

function statusTone(status: string) {
  if (status === 'Eligible now') return 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30'
  if (status === 'Conditionally eligible') return 'bg-sky-500/20 text-sky-100 border-sky-500/30'
  if (status === 'Future career option') return 'bg-violet-500/20 text-violet-100 border-violet-500/30'
  if (status === 'Academic / research option')
    return 'bg-indigo-500/20 text-indigo-100 border-indigo-500/30'
  if (status === 'Requirements still needed')
    return 'bg-amber-500/20 text-amber-100 border-amber-500/30'
  if (status === 'Needs review') return 'bg-orange-500/20 text-orange-100 border-orange-500/30'
  return 'bg-slate-500/20 text-slate-100 border-slate-500/30'
}

export function PathwayHero({ role, match }: Props) {
  const status = match?.match_status ?? 'Match'
  const scoreRaw = match?.score
  const score =
    scoreRaw != null && scoreRaw > 0
      ? scoreRaw <= 1
        ? Math.round(scoreRaw * 100)
        : Math.round(Math.min(100, scoreRaw))
      : null

  return (
    <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 sm:p-7">
      <p className="text-[11px] font-medium uppercase tracking-wider text-cyan-300/90">
        Career pathway
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {role.title}
      </h1>
      <p className="mt-2 text-sm text-slate-300">
        {role.field}
        <span className="mx-1.5 text-slate-600">·</span>
        {role.specialism}
        {role.professional_stage ? (
          <>
            <span className="mx-1.5 text-slate-600">·</span>
            {role.professional_stage}
          </>
        ) : null}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
            statusTone(status)
          )}
        >
          {status}
        </span>
        {score != null ? (
          <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
            Match strength {score}%
          </span>
        ) : null}
        {role.is_regulated ? (
          <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            Regulated pathway
          </span>
        ) : null}
      </div>

      {match?.lead_in ? (
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{match.lead_in}</p>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Guidance for this role comes from the JobAZ Career Knowledge Library.
        </p>
      )}
    </header>
  )
}
