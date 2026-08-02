'use client'

import ProfileGlassCard from './ProfileGlassCard'
import type { IdentityProfileBundle } from '@/lib/identity-profile/types'
import Link from 'next/link'

type Props = {
  bundle: IdentityProfileBundle
  hasCv: boolean
  onToggleRecruiter: (visible: boolean) => void
}

export default function IdentityPersonalPanel({ bundle, hasCv, onToggleRecruiter }: Props) {
  const personal = bundle.personal

  return (
    <div className="space-y-4">
      <ProfileGlassCard title="Career readiness" subtitle="Scores evolve with CV, interviews, and Pulse.">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Career', value: personal?.career_score ?? 0 },
            { label: 'ATS', value: personal?.ats_score ?? 0 },
            { label: 'Interview', value: personal?.interview_score ?? 0 },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase">{m.label}</p>
              <p className="text-xl font-bold text-violet-200">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full border border-slate-600/50 text-slate-400">
            CV: {hasCv ? personal?.cv_status ?? 'Ready' : 'Not uploaded'}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-slate-600/50 text-slate-400">
            Interview: {personal?.interview_readiness ?? 'Building'}
          </span>
        </div>
        <Link
          href="/cv-builder-v2"
          className="inline-block mt-4 text-xs text-violet-300 hover:text-violet-200"
        >
          Open CV Builder →
        </Link>
      </ProfileGlassCard>

      <ProfileGlassCard title="Recruiter visibility">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={personal?.recruiter_visible ?? false}
            onChange={(e) => onToggleRecruiter(e.target.checked)}
            className="rounded border-slate-600 text-violet-500 focus:ring-violet-500/30"
          />
          <span className="text-sm text-slate-300">
            Allow recruiters to discover this profile when visibility is set to recruiter mode.
          </span>
        </label>
      </ProfileGlassCard>
    </div>
  )
}
