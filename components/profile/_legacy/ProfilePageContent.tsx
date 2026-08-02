'use client'

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Logo from '@/components/Logo'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import ProfileExperienceTimeline from '@/components/profile/ProfileExperienceTimeline'
import ProfileEducationSection from '@/components/profile/ProfileEducationSection'
import ProfileSkillsIntelligence from '@/components/profile/ProfileSkillsIntelligence'
import ProfileDocumentsSection from '@/components/profile/ProfileDocumentsSection'
import ProfileRecruiterImpression from '@/components/profile/ProfileRecruiterImpression'
import ProfilePublicProfileSystem from '@/components/profile/ProfilePublicProfileSystem'
import {
  IdentityProfileHero,
  ProfileTypeSelector,
  ProfileCompletionCard,
  ProfileMigrationBanner,
  IdentityProfileEditor,
  IdentityPersonalPanel,
  IdentityBusinessGallery,
  ProfileGlassCard,
  SuggestedConnectionsSection,
} from '@/components/identity-profile'
import { useToast } from '@/components/ui/toast'
import { useProfilePage } from '@/hooks/useProfilePage'
import { useIdentityProfile } from '@/hooks/useIdentityProfile'
import { useProfileActions } from '@/hooks/useProfileActions'

/**
 * Profile UI — same shell pattern as PulsePageContent (app/feed/page.tsx).
 * No extra z-index wrappers, motion layers, or split Suspense boundaries.
 */
export default function ProfilePageContent() {
  const searchParams = useSearchParams()
  const viewUid = searchParams.get('uid')
  const { addToast } = useToast()
  const { loading: legacyLoading, view, updateExtensions, saveCvData } = useProfilePage()
  const hasCv = Boolean(view?.cvData)
  const identity = useIdentityProfile(hasCv, viewUid)
  const [editOpen, setEditOpen] = useState(false)

  const profileUserId = identity.bundle?.profile.user_id
  const isOwnProfile = Boolean(identity.userId && profileUserId && identity.userId === profileUserId)

  const onToast = useCallback(
    (t: { variant: 'success' | 'error' | 'default'; title: string; description?: string }) => {
      addToast({ variant: t.variant, title: t.title, description: t.description })
    },
    [addToast]
  )

  const actions = useProfileActions({
    profileUserId: profileUserId ?? '',
    profileId: identity.bundle?.profile.id ?? '',
    profileType: identity.bundle?.profile.profile_type ?? 'personal',
    isOwnProfile,
    onToast,
  })

  const openEditor = useCallback(() => {
    setEditOpen(true)
  }, [])

  const loading = legacyLoading || identity.loading
  const displayName =
    view?.displayName ??
    (identity.bundle?.profile.username ? `@${identity.bundle.profile.username}` : 'Member')

  const heroActions = useMemo(
    () => ({
      isOwnProfile,
      isBusinessProfile: actions.isBusinessProfile,
      connectionStatus: actions.connectionStatus,
      businessFollowing: actions.businessFollow.following,
      networkLoading: actions.networkLoading,
      shareLoading: actions.share.loading,
      editLoading: actions.editLoading,
      canNetwork: actions.canNetwork,
      networkLabel: actions.networkLabel,
      onNetworkAction: () => void actions.handleNetworkAction(),
      onShare: () => void actions.handleShare(),
      onPulse: actions.handlePulse,
      onMessage: actions.handleMessage,
      onEdit: () => actions.handleEdit(openEditor),
    }),
    [isOwnProfile, actions, openEditor]
  )

  const pulseHref = isOwnProfile ? '/feed' : profileUserId ? `/feed?author=${profileUserId}` : '/feed'

  return (
    <AppShell>
      <div className="relative">
        <div className="pointer-events-none absolute -top-20 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-0 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />

        <header className="mb-6 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Link href="/dashboard" className="inline-block mb-3">
                <Logo />
              </Link>
              <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">
                Professional identity
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Career profile or small business — one ecosystem for Pulse, opportunities, and AI growth.
              </p>
            </div>
            <Link
              href={pulseHref}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-cyan-200 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/15 transition cursor-pointer"
            >
              Open Pulse
            </Link>
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </header>

        <DashboardTabs />

        {!isOwnProfile && viewUid && (
          <p className="mb-4 text-sm text-slate-400">Viewing another member&apos;s profile</p>
        )}

        {identity.tableMissing && (
          <div className="mb-6">
            <ProfileMigrationBanner />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            Loading profile…
          </div>
        ) : identity.bundle ? (
          <div className="space-y-6 pb-10">
            <div className="relative isolate z-10">
              <IdentityProfileHero
                bundle={identity.bundle}
                displayName={displayName}
                saving={identity.saving}
                avatarUploading={identity.avatarUploading}
                onAvatarUpload={(f) => void identity.uploadAvatar(f)}
                onBannerUpload={(f) => void identity.uploadBanner(f)}
                actions={heroActions}
              />
            </div>

            <div className="relative z-0 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1 space-y-6">
                {isOwnProfile && (
                  <>
                    <ProfileGlassCard title="Identity mode" subtitle="Switch anytime — same account, two identities.">
                      <ProfileTypeSelector
                        value={identity.bundle.profile.profile_type}
                        disabled={identity.saving}
                        onChange={(t) => void identity.switchType(t)}
                      />
                    </ProfileGlassCard>
                    <ProfileCompletionCard completion={identity.bundle.completion} />
                    {view && (
                      <ProfilePublicProfileSystem
                        visibility={view.extensions.visibility}
                        username={identity.bundle.profile.username ?? view.extensions.username}
                        privacy={view.extensions.privacy}
                        previewData={view}
                        onVisibilityChange={(visibility) => {
                          updateExtensions({ visibility })
                          const v =
                            visibility === 'public'
                              ? 'public'
                              : visibility === 'recruiter'
                                ? 'recruiter'
                                : 'private'
                          void identity.setVisibility(v)
                        }}
                        onPrivacyChange={(privacy) =>
                          updateExtensions({ privacy: { ...view.extensions.privacy, ...privacy } })
                        }
                        onUsernameChange={(username) => {
                          updateExtensions({ username })
                          void identity
                            .updateProfile({ username })
                            .then(() => onToast({ variant: 'success', title: 'Identity updated' }))
                            .catch((e) =>
                              onToast({
                                variant: 'error',
                                title: 'Could not update username',
                                description: e instanceof Error ? e.message : undefined,
                              })
                            )
                        }}
                      />
                    )}
                  </>
                )}
                {!isOwnProfile && <ProfileCompletionCard completion={identity.bundle.completion} />}
                {isOwnProfile && <SuggestedConnectionsSection onToast={onToast} />}
              </div>

              <div className="lg:col-span-2 space-y-6">
                {isOwnProfile && editOpen && (
                  <IdentityProfileEditor
                    bundle={identity.bundle}
                    saving={identity.saving}
                    onSaveProfile={async (patch) => {
                      try {
                        await identity.updateProfile(patch)
                        onToast({ variant: 'success', title: 'Identity updated' })
                      } catch (e) {
                        onToast({
                          variant: 'error',
                          title: 'Save failed',
                          description: e instanceof Error ? e.message : undefined,
                        })
                        throw e
                      }
                    }}
                    onSaveBusiness={(patch) => identity.updateBusiness(patch)}
                    onSaveSkills={(skills) => identity.saveSkills(skills)}
                  />
                )}

                {isOwnProfile && identity.bundle.profile.profile_type === 'business' ? (
                  <IdentityBusinessGallery
                    media={identity.bundle.media}
                    saving={identity.saving}
                    onUpload={(f) => void identity.uploadBusinessMedia(f)}
                  />
                ) : isOwnProfile ? (
                  <IdentityPersonalPanel
                    bundle={identity.bundle}
                    hasCv={hasCv}
                    onToggleRecruiter={(visible) =>
                      void identity.updatePersonal({ recruiter_visible: visible })
                    }
                  />
                ) : null}

                {view && isOwnProfile && identity.bundle.profile.profile_type === 'personal' && (
                  <>
                    <ProfileExperienceTimeline
                      experience={view.cvData?.experience ?? []}
                      insights={view.experienceInsights}
                      onSave={async (experience) => {
                        const filtered = experience.filter((e) => e.jobTitle.trim() || e.company.trim())
                        await saveCvData({ experience: filtered })
                      }}
                    />
                    <ProfileEducationSection
                      education={view.cvData?.education ?? []}
                      certifications={(view.cvData?.certifications ?? []).map((c) =>
                        typeof c === 'string' ? c : (c?.title || '')
                      )}
                      suggestedCertifications={view.suggestedCertifications}
                      onSave={async ({ education, certifications }) =>
                        saveCvData({ education, certifications })
                      }
                    />
                    <ProfileSkillsIntelligence
                      skills={view.cvData?.skills ?? []}
                      intelligence={view.skillsIntelligence}
                      onSaveSkills={async (skills) => saveCvData({ skills })}
                    />
                    <ProfileRecruiterImpression impression={view.recruiterImpression} />
                    <ProfileDocumentsSection documents={view.documents} />
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-sm">
            {viewUid
              ? 'Identity not found or is private.'
              : 'Sign in to manage your JobAZ identity, or run the profile migration in Supabase.'}
          </div>
        )}

      </div>
    </AppShell>
  )
}
