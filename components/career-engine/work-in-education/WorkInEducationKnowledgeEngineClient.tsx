'use client'

/**
 * Knowledge-engine Work in My Education journey (feature-flagged).
 * Reuses Batch 4 AssessmentWizard in career_assistant mode.
 * Legacy conversation remains at ?legacy=1 or when flag is off.
 */

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import { LibraryPathWizard } from '@/components/career-engine/work-in-education/wizard/LibraryPathWizard'

type Props = {
  showAdminBanner?: boolean
}

export default function WorkInEducationKnowledgeEngineClient({ showAdminBanner }: Props) {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-100">
      <UkCareerBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/uk-career-assistant"
            className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Career Assistant
          </Link>
          <Link
            href="/career-engine/work-in-education?legacy=1"
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Use classic flow
          </Link>
        </div>

        {showAdminBanner ? (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Admin / local test mode — knowledge engine Work in My Education is active for this
            session.
          </p>
        ) : null}

        <p className="mb-4 text-[11px] uppercase tracking-wider text-violet-300/80">
          Career Engine · Work in My Education
        </p>

        <LibraryPathWizard
          adminMode={Boolean(showAdminBanner)}
          sessionKey="jobaz.wie.library_path.ca.v1"
          resultHref="/career-assistant/work-in-my-education/result"
        />
      </div>
    </div>
  )
}
