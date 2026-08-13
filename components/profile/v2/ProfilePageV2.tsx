'use client'

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import { useToast } from '@/components/ui/toast'
import { useProfileV2 } from '@/hooks/useProfileV2'
import type { ProfileViewTarget } from '@/hooks/profileViewTarget'
import { IDENTITY_PHASE1_PRIVATE_ONLY } from '@/lib/identity-profile/phase1'
import PublicCareerProfileComingSoon from './PublicCareerProfileComingSoon'
import PublicProfilePhase2Card from './PublicProfilePhase2Card'
import ProfileSection from './ProfileSection'
import CareerIdentityWorkspace from '@/components/profile/career-identity/CareerIdentityWorkspace'

type Props = {
  target?: ProfileViewTarget
}

export default function ProfilePageV2({ target = { mode: 'self' } }: Props) {
  const isPublicView = target.mode !== 'self'

  if (IDENTITY_PHASE1_PRIVATE_ONLY && isPublicView) {
    return <PublicCareerProfileComingSoon />
  }

  return <CareerIdentityPrivatePage target={target} />
}

function CareerIdentityPrivatePage({ target }: { target: ProfileViewTarget }) {
  const { addToast } = useToast()
  const profile = useProfileV2(target)

  const onToast = useMemo(
    () => (t: { variant: 'success' | 'error' | 'default'; title: string; description?: string }) => {
      addToast({ variant: t.variant, title: t.title, description: t.description })
    },
    [addToast]
  )

  const needsSignIn = target.mode === 'self' && !profile.viewerUserId
  const displayName =
    profile.bundle?.profile.username?.replace(/^@/, '') ||
    profile.bundle?.profile.headline ||
    'Career Identity'

  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Career Identity"
            description="Private to you — used to improve job, course, opportunity and email matching."
            dotColor="violet"
            badges={
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-200">
                Private · Phase 1
              </span>
            }
          />
        }
      >
        <PlatformContent withAmbient>
          {profile.loading ? (
            <div className="flex items-center justify-center py-24 text-[var(--jaz-muted)] dark:text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              Loading identity…
            </div>
          ) : profile.tableMissing ? (
            <ProfileSection
              title="Database setup required"
              subtitle="Run the identity profiles migration in Supabase"
            >
              <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400">
                Apply{' '}
                <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">
                  supabase/migrations/20250529000000_create_identity_profiles.sql
                </code>{' '}
                and{' '}
                <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">
                  20250729120000_user_career_identity.sql
                </code>{' '}
                and{' '}
                <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-200">
                  20250812120000_career_identity_mobile_reminders.sql
                </code>
                .
              </p>
            </ProfileSection>
          ) : needsSignIn ? (
            <p className="py-16 text-center text-[var(--jaz-muted)] dark:text-slate-400 text-sm">
              Sign in to manage your career identity.
            </p>
          ) : (
            <>
              <CareerIdentityWorkspace
                displayName={displayName}
                email={null}
                avatarUrl={profile.bundle?.profile.avatar_url}
                locationHint={profile.bundle?.profile.location}
                onToast={onToast}
              />
              <div className="max-w-4xl mt-4">
                <PublicProfilePhase2Card />
              </div>
            </>
          )}
        </PlatformContent>
      </PlatformShell>
    </AppShell>
  )
}
