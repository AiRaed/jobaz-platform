'use client'

import { useRef } from 'react'
import { Plus } from 'lucide-react'
import ProfileGlassCard from './ProfileGlassCard'
import type { DbProfileMedia } from '@/lib/identity-profile/types'

type Props = {
  media: DbProfileMedia[]
  saving?: boolean
  onUpload: (file: File) => void
}

export default function IdentityBusinessGallery({ media, saving, onUpload }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  return (
    <ProfileGlassCard title="Gallery" subtitle="Photos and videos for customers — stored in Supabase.">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {media.map((m) => (
          <div
            key={m.id}
            className="aspect-square rounded-xl border border-slate-700/50 overflow-hidden bg-slate-900/50"
          >
            {m.media_type === 'video' ? (
              <video src={m.media_url} className="w-full h-full object-cover" controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.media_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={saving}
          className="aspect-square rounded-xl border border-dashed border-violet-500/30 flex flex-col items-center justify-center text-violet-300/80 hover:bg-violet-500/5 transition"
        >
          <Plus className="w-6 h-6 mb-1" />
          <span className="text-xs">Add media</span>
        </button>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f)
        }}
      />
    </ProfileGlassCard>
  )
}
