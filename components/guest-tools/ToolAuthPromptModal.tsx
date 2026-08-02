'use client'

import Link from 'next/link'
import { X } from 'lucide-react'
import { buildAuthLoginUrl, buildAuthSignupUrl } from '@/lib/auth/redirect'
import { cn } from '@/lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  redirectTo: string
  title: string
  description?: string
  continueGuestLabel?: string
}

export default function ToolAuthPromptModal({
  isOpen,
  onClose,
  redirectTo,
  title,
  description,
  continueGuestLabel = 'Continue editing as guest',
}: Props) {
  if (!isOpen) return null

  const loginUrl = buildAuthLoginUrl(redirectTo)
  const signupUrl = buildAuthSignupUrl(redirectTo)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[rgba(64,135,255,0.3)] bg-slate-950/95 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(30,144,255,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-50 mb-2 pr-8">{title}</h2>
        {description && (
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>
        )}

        <div className="space-y-3">
          <Link
            href={loginUrl}
            className="block w-full text-center rounded-xl border border-[rgba(64,135,255,0.4)] bg-[rgba(30,144,255,0.1)] px-4 py-3 text-sm font-semibold text-[#8ec8ff] hover:bg-[rgba(30,144,255,0.18)] transition"
          >
            Log in
          </Link>
          <Link
            href={signupUrl}
            className="block w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_25px_rgba(139,92,246,0.35)]"
          >
            Create free account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-full rounded-xl border border-slate-700/60 bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-400',
              'hover:border-slate-600 hover:text-slate-200 transition'
            )}
          >
            {continueGuestLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
