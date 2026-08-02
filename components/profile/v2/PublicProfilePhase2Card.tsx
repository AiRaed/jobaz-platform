'use client'

import { Lock } from 'lucide-react'
import { IDENTITY_PHASE1_PUBLIC_COPY } from '@/lib/identity-profile/phase1'
import ProfileSection from './ProfileSection'

/** Disabled Phase 2 teaser — public social profile not available yet. */
export default function PublicProfilePhase2Card() {
  return (
    <ProfileSection title="Sharing" subtitle="Phase 2">
      <div className="rounded-xl border border-dashed border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40">
        <div className="flex items-start gap-2.5">
          <Lock
            className="h-4 w-4 mt-0.5 text-[var(--jaz-muted)] dark:text-slate-500 shrink-0"
            aria-hidden
          />
          <div>
            <p className="text-sm font-medium text-[var(--jaz-text)] dark:text-slate-200">
              {IDENTITY_PHASE1_PUBLIC_COPY.title}
            </p>
            <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mt-1">
              {IDENTITY_PHASE1_PUBLIC_COPY.body}
            </p>
            <p className="text-[11px] text-[var(--jaz-muted)] dark:text-slate-600 mt-2">
              Your profile stays private. Email and CV are never shown publicly in Phase 1.
            </p>
          </div>
        </div>
      </div>
    </ProfileSection>
  )
}
