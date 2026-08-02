'use client'

import { Lock } from 'lucide-react'
import {
  getUkCareerAuthUrls,
  loadCaResultSnapshot,
  preserveAssessmentBeforeAuth,
} from '@/lib/uk-career-assistant/guestSession'
import { openAppLevelAuth } from '@/lib/uk-career-assistant/pendingCareerPlan'

type Props = {
  isGuest: boolean
  onFindJobs?: () => void
  onViewPath?: () => void
  findJobsDisabled?: boolean
  viewPathDisabled?: boolean
  findJobsFirst?: boolean
}

export default function UkCareerGatedActions({
  isGuest,
  onFindJobs,
  onViewPath,
  findJobsDisabled = false,
  viewPathDisabled = false,
  findJobsFirst = true,
}: Props) {
  const { signupUrl } = getUkCareerAuthUrls()

  const goSignup = () => {
    const snapshot = loadCaResultSnapshot()
    if (snapshot) preserveAssessmentBeforeAuth(snapshot)
    openAppLevelAuth(signupUrl)
  }

  const findJobsBtn = isGuest ? (
    <button
      type="button"
      onClick={goSignup}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]"
    >
      <Lock className="h-3.5 w-3.5" />
      Register to Find Jobs
    </button>
  ) : (
    <button
      type="button"
      onClick={onFindJobs}
      disabled={findJobsDisabled}
      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Find jobs
    </button>
  )

  const viewPathBtn = isGuest ? (
    <button
      type="button"
      onClick={goSignup}
      className="uk-ca-secondary-btn inline-flex items-center gap-1.5 px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-200 rounded-xl text-sm font-medium transition"
    >
      <Lock className="h-3.5 w-3.5" />
      Register to View Path
    </button>
  ) : (
    <button
      type="button"
      onClick={onViewPath}
      disabled={viewPathDisabled}
      className="uk-ca-secondary-btn px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      View path
    </button>
  )

  return (
    <div className="flex gap-2 flex-wrap">
      {findJobsFirst ? (
        <>
          {findJobsBtn}
          {viewPathBtn}
        </>
      ) : (
        <>
          {viewPathBtn}
          {findJobsBtn}
        </>
      )}
    </div>
  )
}
