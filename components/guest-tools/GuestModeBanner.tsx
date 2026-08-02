'use client'

import Link from 'next/link'
import { buildAuthLoginUrl, buildAuthSignupUrl } from '@/lib/auth/redirect'
import { GUEST_BANNER_MESSAGE, GUEST_TOOL_TAGLINE } from '@/lib/guest-tools/constants'
import { cn } from '@/lib/utils'

type Props = {
  visible: boolean
  redirectTo: string
  onDismiss: () => void
  className?: string
}

export default function GuestModeBanner({ visible, redirectTo, onDismiss, className }: Props) {
  if (!visible) return null

  const loginUrl = buildAuthLoginUrl(redirectTo)
  const signupUrl = buildAuthSignupUrl(redirectTo)

  return (
    <div
      className={cn(
        'jobaz-card relative mb-4 rounded-xl border border-[var(--border-subtle)]',
        'bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-soft)]',
        className
      )}
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:pr-4">
          <p className="text-sm font-medium text-[var(--text-primary)]">{GUEST_BANNER_MESSAGE}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{GUEST_TOOL_TAGLINE}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="jobaz-btn-secondary !px-3 !py-1.5 !text-xs"
          >
            Continue as guest
          </button>
          <Link href={loginUrl} className="jobaz-btn-secondary !px-3 !py-1.5 !text-xs">
            Log in
          </Link>
          <Link href={signupUrl} className="jobaz-btn-primary jobaz-btn-primary-sm">
            Create free account
          </Link>
        </div>
      </div>
    </div>
  )
}
