'use client'

import { Sparkles } from 'lucide-react'
import {
  getUkCareerAuthUrls,
  loadCaResultSnapshot,
  preserveAssessmentBeforeAuth,
} from '@/lib/uk-career-assistant/guestSession'
import { openAppLevelAuth } from '@/lib/uk-career-assistant/pendingCareerPlan'

const BENEFITS = [
  'Save your career plan',
  'Build your AI CV',
  'Track your progress',
  'Apply for jobs',
  'Access AI Career Coach',
]

export default function UkCareerConversionCard() {
  const { signupUrl, loginUrl } = getUkCareerAuthUrls()

  const preserveBeforeAuth = () => {
    const snapshot = loadCaResultSnapshot()
    if (snapshot) preserveAssessmentBeforeAuth(snapshot)
  }

  const goAuth = (url: string) => {
    preserveBeforeAuth()
    openAppLevelAuth(url)
  }

  return (
    <div className="uk-ca-panel p-6 rounded-2xl border border-violet-500/35 bg-gradient-to-br from-purple-900/40 via-[#111827]/80 to-cyan-900/25 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.2)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-violet-300" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-50">
            Your personalised career roadmap is ready.
          </h3>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            Create a free account to save your career plan.
          </p>
        </div>
      </div>

      <ul className="space-y-2 mb-6">
        {BENEFITS.map((item) => (
          <li key={item} className="text-sm text-slate-300 flex items-start gap-2">
            <span className="text-violet-400 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => goAuth(signupUrl)}
          className="flex-1 inline-flex justify-center items-center px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white text-sm font-semibold transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.45)]"
        >
          Create Free Account
        </button>
        <button
          type="button"
          onClick={() => goAuth(loginUrl)}
          className="flex-1 inline-flex justify-center items-center px-6 py-3 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 text-sm font-medium transition"
        >
          Log In
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-slate-500">
        Sign in to save this plan and continue your journey.
      </p>
    </div>
  )
}
