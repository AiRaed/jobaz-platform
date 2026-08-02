'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CvTrainingQualification } from '@/lib/cv-builder/trainingQualifications'

type Props = {
  qualification: CvTrainingQualification
}

/** Compact next-qualification nudge — no Apply Now; training actions live on My Plan. */
export default function CvQualificationReminder({ qualification }: Props) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <p className="text-xs text-slate-400">
        Next qualification for your CV:{' '}
        <span className="text-slate-200 font-medium">{qualification.name}</span>
      </p>
      <Link
        href="/dashboard#recommended-training"
        className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-violet-300 hover:text-violet-200"
      >
        View in My Plan
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
