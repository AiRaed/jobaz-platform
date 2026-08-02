'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileCard from './ProfileCard'

type Props = {
  skills: string[]
  suggestedSkills: string[]
}

function strengthLabel(index: number, total: number) {
  const ratio = (total - index) / total
  if (ratio >= 0.7) return { label: 'Strong', tone: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' }
  if (ratio >= 0.4) return { label: 'Good', tone: 'text-amber-400 border-amber-500/30 bg-amber-500/10' }
  return { label: 'Growing', tone: 'text-slate-400 border-slate-600/40 bg-slate-800/40' }
}

export default function ProfileSkillsSection({ skills, suggestedSkills }: Props) {
  return (
    <ProfileCard title="Skills" subtitle="What recruiters scan for first.">
      {skills.length === 0 ? (
        <p className="text-sm text-slate-500 mb-3">Add skills in CV Builder to build your skill profile.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, i) => {
            const strength = strengthLabel(i, skills.length)
            return (
              <span
                key={skill}
                className={cn(
                  'inline-flex flex-col px-3 py-1.5 rounded-lg border text-xs',
                  'border-violet-500/25 bg-violet-500/5 text-violet-100 shadow-[0_0_10px_rgba(139,92,246,0.08)]'
                )}
              >
                <span className="font-medium">{skill}</span>
                <span className={cn('text-[10px] mt-0.5 px-1.5 py-0.5 rounded border w-fit', strength.tone)}>
                  {strength.label} · Recruiter relevant
                </span>
              </span>
            )
          })}
        </div>
      )}

      {suggestedSkills.length > 0 && (
        <div className="rounded-xl border border-dashed border-violet-500/25 bg-violet-950/20 p-3">
          <p className="text-xs font-medium text-violet-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Suggested Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedSkills.map((s) => (
              <span key={s} className="text-[11px] px-2 py-1 rounded-md bg-slate-900/60 text-slate-400 border border-slate-700/50">
                + {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </ProfileCard>
  )
}
