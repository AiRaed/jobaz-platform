'use client'

import type { ProfileSocialStats } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type Props = {
  stats: ProfileSocialStats
  profileType: 'personal' | 'business'
}

export default function ProfileStatsRow({ stats, profileType }: Props) {
  const items = [
    { label: profileType === 'business' ? 'Followers' : 'Connections', value: stats.connectionsCount },
    { label: 'Following', value: stats.followingCount },
    { label: 'Pulse posts', value: stats.pulsePostsCount },
    { label: 'Identity views (7d)', value: stats.weeklyProfileViews },
  ]

  return (
    <ProfileSection title="Identity stats" subtitle="Your connections and Pulse activity">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="text-xl font-semibold text-slate-100 mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </ProfileSection>
  )
}
