'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileGlassCard from './ProfileGlassCard'
import { runProfileAi, type ProfileAiTask } from '@/lib/identity-profile/profileAi'
import type { IdentityProfileBundle } from '@/lib/identity-profile/types'
import { BUSINESS_CATEGORIES } from '@/lib/identity-profile/types'

type Props = {
  bundle: IdentityProfileBundle
  saving?: boolean
  onSaveProfile: (patch: {
    username?: string
    headline?: string
    bio?: string
    location?: string
  }) => Promise<void>
  onSaveBusiness?: (patch: {
    business_name?: string
    category?: string
    business_description?: string
    services?: string[]
    business_phone?: string
    business_email?: string
    website?: string
  }) => Promise<void>
  onSaveSkills?: (skills: string[]) => Promise<void>
}

function AiButton({
  label,
  loading,
  onClick,
}: {
  label: string
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="text-[11px] px-2.5 py-1 rounded-full border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition flex items-center gap-1 disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
      {label}
    </button>
  )
}

export default function IdentityProfileEditor({
  bundle,
  saving,
  onSaveProfile,
  onSaveBusiness,
  onSaveSkills,
}: Props) {
  const p = bundle.profile
  const isBusiness = p.profile_type === 'business'
  const [headline, setHeadline] = useState(p.headline ?? '')
  const [bio, setBio] = useState(p.bio ?? '')
  const [location, setLocation] = useState(p.location ?? '')
  const [username, setUsername] = useState(p.username ?? '')
  const [businessName, setBusinessName] = useState(bundle.business?.business_name ?? '')
  const [category, setCategory] = useState(bundle.business?.category ?? '')
  const [description, setDescription] = useState(bundle.business?.business_description ?? '')
  const [servicesText, setServicesText] = useState((bundle.business?.services ?? []).join('\n'))
  const [skillsText, setSkillsText] = useState(
    bundle.profileSkills.map((s) => s.skill_name).join(', ') || (p.skills ?? []).join(', ')
  )
  const [aiLoading, setAiLoading] = useState<ProfileAiTask | null>(null)

  const ctx = {
    profileType: p.profile_type,
    headline,
    bio,
    businessName,
    category,
    services: servicesText.split('\n').filter(Boolean),
    skills: skillsText.split(',').map((s) => s.trim()).filter(Boolean),
    location,
  }

  const runAi = async (task: ProfileAiTask, apply: (text: string) => void) => {
    setAiLoading(task)
    try {
      const res = await runProfileAi(task, ctx)
      apply(res.text)
    } finally {
      setAiLoading(null)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30'

  return (
    <div id="profile-editor" className="space-y-6 scroll-mt-24">
      <ProfileGlassCard title="Core identity" subtitle="Visible on Pulse, opportunities, and Relay.">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Username</label>
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Headline</label>
              <AiButton
                label="Improve headline"
                loading={aiLoading === 'improve-headline'}
                onClick={() => runAi('improve-headline', setHeadline)}
              />
            </div>
            <input className={inputClass} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Location</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-500">Bio / About</label>
              <AiButton
                label={isBusiness ? 'Generate description' : 'Generate About Me'}
                loading={
                  aiLoading === 'generate-about' || aiLoading === 'generate-business-description'
                }
                onClick={() =>
                  runAi(
                    isBusiness ? 'generate-business-description' : 'generate-about',
                    isBusiness ? setDescription : setBio
                  )
                }
              />
            </div>
            <textarea
              className={cn(inputClass, 'min-h-[100px] resize-y')}
              value={isBusiness ? description : bio}
              onChange={(e) => (isBusiness ? setDescription(e.target.value) : setBio(e.target.value))}
            />
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSaveProfile({
                username: username.trim() || undefined,
                headline: headline.trim() || undefined,
                bio: isBusiness ? (p.bio ?? undefined) : bio.trim() || undefined,
                location: location.trim() || undefined,
              }).then(() => {
                if (isBusiness && onSaveBusiness) {
                  return onSaveBusiness({
                    business_description: description.trim() || undefined,
                  })
                }
              })
            }
            className="rounded-full px-5 py-2 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save identity'}
          </button>
        </div>
      </ProfileGlassCard>

      {isBusiness && onSaveBusiness && (
        <ProfileGlassCard title="Business details" subtitle="Services, category, and contact for local customers.">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Business name</label>
              <input
                className={inputClass}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Category</label>
              <select
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-slate-500">Services (one per line)</label>
                <AiButton
                  label="Improve services"
                  loading={aiLoading === 'improve-services'}
                  onClick={() => runAi('improve-services', setServicesText)}
                />
              </div>
              <textarea
                className={cn(inputClass, 'min-h-[80px]')}
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <AiButton
                label="Growth suggestions"
                loading={aiLoading === 'business-growth-suggestions'}
                onClick={() => runAi('business-growth-suggestions', (t) => alert(t))}
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onSaveBusiness({
                  business_name: businessName.trim() || undefined,
                  category: category || undefined,
                  business_description: description.trim() || undefined,
                  services: servicesText
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="rounded-full px-5 py-2 text-sm font-medium border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/10 transition disabled:opacity-50"
            >
              Save business
            </button>
          </div>
        </ProfileGlassCard>
      )}

      {!isBusiness && onSaveSkills && (
        <ProfileGlassCard title="Skills" subtitle="Comma-separated — synced to your identity and Pulse badge.">
          <div className="flex justify-end mb-2">
            <AiButton
              label="Suggest skills"
              loading={aiLoading === 'suggest-skills'}
              onClick={() => runAi('suggest-skills', setSkillsText)}
            />
          </div>
          <textarea
            className={cn(inputClass, 'min-h-[72px]')}
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              onSaveSkills(
                skillsText
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            className="mt-3 rounded-full px-5 py-2 text-sm font-medium border border-violet-500/40 text-violet-200 hover:bg-violet-500/10 transition disabled:opacity-50"
          >
            Save skills
          </button>
          <button
            type="button"
            className="ml-2 mt-3 rounded-full px-4 py-2 text-xs text-slate-400 border border-slate-700/50 hover:text-slate-200"
            onClick={() => runAi('career-suggestions', (t) => alert(t))}
          >
            AI career tips
          </button>
        </ProfileGlassCard>
      )}
    </div>
  )
}
