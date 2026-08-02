'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buildAuthLoginUrl, buildAuthSignupUrl } from '@/lib/auth/redirect'
import { SITE_URL } from '@/lib/site-url'
import { cn } from '@/lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string | null
  title?: string
  description?: string
  bullets?: string[]
}

export default function CareerAuthWallModal({
  isOpen,
  onClose,
  redirectTo,
  title = 'Create a free account to continue your career journey',
  description = 'Save jobs, tailor your CV, track applications, and unlock your full career plan.',
  bullets,
}: Props) {
  const [googleLoading, setGoogleLoading] = useState(false)

  if (!isOpen) return null

  const signupUrl = buildAuthSignupUrl(redirectTo)
  const loginUrl = buildAuthLoginUrl(redirectTo)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    try {
      const callback = new URL('/auth/callback', typeof window !== 'undefined' ? window.location.origin : SITE_URL)
      if (redirectTo) callback.searchParams.set('redirectTo', redirectTo)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback.toString() },
      })
    } catch {
      setGoogleLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-violet-500/30 bg-slate-950/95 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(139,92,246,0.25)]"
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

        <h2 className="text-xl md:text-2xl font-semibold text-slate-50 mb-2 pr-8">
          {title}
        </h2>
        <p className="text-sm text-slate-400 mb-4 leading-relaxed">
          {description}
        </p>
        {bullets && bullets.length > 0 && (
          <ul className="text-sm text-slate-400 mb-6 space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-violet-400">•</span>
                {b}
              </li>
            ))}
          </ul>
        )}
        {!bullets?.length && <div className="mb-2" />}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={googleLoading}
            className={cn(
              'w-full flex items-center justify-center gap-3 rounded-xl border border-slate-600/70',
              'bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-100',
              'hover:border-violet-400/50 hover:bg-slate-800/80 transition disabled:opacity-50'
            )}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <Link
            href={signupUrl}
            className="block w-full text-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_25px_rgba(139,92,246,0.45)]"
          >
            Create free account
          </Link>

          <Link
            href={loginUrl}
            className="block w-full text-center rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-200 hover:bg-violet-500/20 transition"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
