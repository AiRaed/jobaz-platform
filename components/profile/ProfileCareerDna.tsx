'use client'

import { Dna, Sparkles } from 'lucide-react'
import ProfileCard from './ProfileCard'

type Props = { tags: string[] }

export default function ProfileCareerDna({ tags }: Props) {
  return (
    <ProfileCard
      title="Career DNA"
      subtitle="AI personality traits inferred from your journey."
      glow="violet"
      action={
        <div className="flex items-center gap-1.5 text-violet-400">
          <Dna className="w-4 h-4" />
          <Sparkles className="w-3 h-3 animate-pulse" />
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <span
            key={tag}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-violet-500/35 bg-violet-500/10 text-violet-100 shadow-[0_0_14px_rgba(139,92,246,0.15)] hover:border-violet-400/50 hover:bg-violet-500/15 hover:scale-[1.02] transition-all duration-200"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {tag}
          </span>
        ))}
      </div>
    </ProfileCard>
  )
}
