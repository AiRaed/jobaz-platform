'use client'

import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import type { CvSectionExperience } from '@/app/cv-builder-v2/page'
import ProfileCard from './ProfileCard'

type Props = {
  experience: CvSectionExperience[]
}

function formatYears(exp: CvSectionExperience) {
  const start = exp.startDate?.trim()
  const end = exp.isCurrent ? 'Present' : exp.endDate?.trim()
  if (start && end) return `${start} – ${end}`
  if (start) return start
  return ''
}

export default function ProfileExperienceSection({ experience }: Props) {
  return (
    <ProfileCard
      title="Experience"
      subtitle="Your professional track record."
      action={
        <Link
          href="/cv-builder-v2"
          className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 hover:text-violet-300"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Experience
        </Link>
      }
    >
      {experience.length === 0 ? (
        <p className="text-sm text-slate-500">Add roles in CV Builder to populate your experience.</p>
      ) : (
        <div className="space-y-3">
          {experience.map((exp) => (
            <article
              key={exp.id}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 hover:border-violet-500/25 transition"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-violet-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-100">{exp.jobTitle || 'Role title'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {exp.company}
                    {exp.location ? ` · ${exp.location}` : ''}
                    {formatYears(exp) ? ` · ${formatYears(exp)}` : ''}
                  </p>
                  {(exp.bullets ?? []).filter(Boolean).length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {exp.bullets.filter(Boolean).slice(0, 3).map((b, i) => (
                        <li key={i} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-violet-400/80">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </ProfileCard>
  )
}
