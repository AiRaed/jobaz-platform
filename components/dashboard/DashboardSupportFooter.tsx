'use client'

import Link from 'next/link'
import ManagePlanDataControls from '@/components/dashboard/ManagePlanDataControls'

type Props = {
  onDeleteAccount?: () => void
  onCvCleared?: () => void
  onPlanCleared?: () => void
}

export default function DashboardSupportFooter({
  onDeleteAccount,
  onCvCleared,
  onPlanCleared,
}: Props) {
  return (
    <footer className="mt-12 pt-8 border-t border-slate-800/80">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 px-5 py-5 md:px-6 md:py-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-1">
            Community
          </p>
          <h3 className="text-base font-semibold text-slate-100">Support JobAZ</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md">
            If JobAZ helped your career journey, your support keeps professional tools free for people who
            need them most.
          </p>
          <ManagePlanDataControls onCvCleared={onCvCleared} onPlanCleared={onPlanCleared} />
        </div>
        <a
          href="https://buymeacoffee.com/jobaz.support"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 hover:border-violet-400/50 transition shrink-0"
        >
          <span>☕</span>
          Support JobAZ
        </a>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6">
          <Link href="/privacy" className="hover:text-violet-300 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-violet-300 transition-colors">
            Terms & Conditions
          </Link>
          {onDeleteAccount && (
            <button
              type="button"
              onClick={onDeleteAccount}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Delete Account
            </button>
          )}
        </div>
        <p className="text-slate-500">© {new Date().getFullYear()} JobAZ</p>
      </div>
    </footer>
  )
}
