'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import type { CareerIntelligenceProfile } from '@/lib/career-journey/types'

type Props = {
  profile: CareerIntelligenceProfile
  compact?: boolean
}

export default function SmartProfilePanel({ profile, compact }: Props) {
  const incomplete = profile.sections.filter((s) => !s.complete)

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-4 md:p-5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Smart career profile</p>

      {!compact && (
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          <ProfileChip label="Situation" value={profile.currentSituation} />
          <ProfileChip label="Work style" value={profile.workStyle} />
          <ProfileChip label="English" value={profile.englishConfidence} />
          <ProfileChip label="UK readiness" value={profile.ukReadiness} />
        </div>
      )}

      {profile.strengths.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-2">Strengths</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.strengths.slice(0, compact ? 2 : 4).map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {profile.sections.slice(0, compact ? 3 : 6).map((section) => (
          <div key={section.id} className="flex items-start gap-2 text-xs">
            {section.complete ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-amber-400/80 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-slate-500">{section.label}: </span>
              <span className="text-slate-300">{section.value}</span>
              {!section.complete && section.improveHref && (
                <Link
                  href={section.improveHref}
                  className="ml-2 text-violet-400 hover:text-violet-300"
                >
                  Improve
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {incomplete.length > 0 && !compact && (
        <p className="text-[10px] text-slate-500 mt-3 italic">
          {incomplete.length} section{incomplete.length !== 1 ? 's' : ''} to strengthen — JAZ will guide you step by step.
        </p>
      )}
    </div>
  )
}

function ProfileChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-950/40 px-3 py-2">
      <p className="text-[9px] uppercase text-slate-500">{label}</p>
      <p className="text-xs text-slate-300 mt-0.5 leading-snug">{value}</p>
    </div>
  )
}
