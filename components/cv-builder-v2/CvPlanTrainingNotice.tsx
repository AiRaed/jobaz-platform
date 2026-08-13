'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import type { CvTrainingQualification } from '@/lib/cv-builder/trainingQualifications'
import {
  loadWieTrainingCvHandoff,
  type WieTrainingCvHandoff,
} from '@/lib/career-engine/work-in-education/wizard/training-handoff'

type Props = {
  qualifications: CvTrainingQualification[]
}

/** Compact plan training notice — no course cards; Apply Now lives on My Plan. */
export default function CvPlanTrainingNotice({ qualifications }: Props) {
  const [wieHandoff, setWieHandoff] = useState<WieTrainingCvHandoff | null>(null)

  useEffect(() => {
    setWieHandoff(loadWieTrainingCvHandoff())
  }, [])

  const planNames = qualifications
    .map((q) => q.name?.trim())
    .filter(Boolean)
    .slice(0, 6)

  const completed = (wieHandoff?.completed_course_types ?? []).filter(Boolean).slice(0, 6)

  if (planNames.length === 0 && completed.length === 0) return null

  return (
    <aside className="rounded-lg border border-slate-700/50 bg-slate-950/50 px-3.5 py-3 space-y-2">
      {completed.length > 0 ? (
        <div className="flex items-start gap-2.5 min-w-0">
          <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-slate-300 leading-relaxed">
              From Work in My Education, you may include:{' '}
              <span className="text-slate-100 font-medium">{completed.join(', ')}</span>.
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Self-reported only — add these if they match certificates or training you completed.
            </p>
          </div>
        </div>
      ) : null}

      {planNames.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <GraduationCap className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-300 leading-relaxed">
                Your plan recommends:{' '}
                <span className="text-slate-100 font-medium">{planNames.join(', ')}</span>.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Completed qualifications can improve CV strength.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard#recommended-training"
            className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-500/40 hover:text-violet-100 transition"
          >
            View training in My Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : null}
    </aside>
  )
}
