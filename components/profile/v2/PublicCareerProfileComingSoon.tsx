'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import { IDENTITY_PHASE1_PUBLIC_COPY } from '@/lib/identity-profile/phase1'

type Props = {
  /** When true, offer a link back to the private identity page */
  showOwnLink?: boolean
}

export default function PublicCareerProfileComingSoon({ showOwnLink = true }: Props) {
  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Career profile"
            description="Public profiles are not available in Phase 1."
            dotColor="violet"
          />
        }
      >
        <PlatformContent withAmbient>
          <div className="max-w-lg mx-auto py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] dark:border-violet-500/30 dark:bg-violet-950/30">
              <Lock className="h-6 w-6 text-violet-600 dark:text-violet-300" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-[var(--jaz-text)] dark:text-slate-100">
              {IDENTITY_PHASE1_PUBLIC_COPY.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--jaz-muted)] dark:text-slate-400">
              {IDENTITY_PHASE1_PUBLIC_COPY.body}
            </p>
            <p className="mt-3 text-xs text-[var(--jaz-muted)] dark:text-slate-500">
              For launch, Identity is a private career workspace for you only. Email, CV, and
              sensitive details stay private.
            </p>
            {showOwnLink && (
              <Link
                href="/profile"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
              >
                Open Career Identity
              </Link>
            )}
          </div>
        </PlatformContent>
      </PlatformShell>
    </AppShell>
  )
}
