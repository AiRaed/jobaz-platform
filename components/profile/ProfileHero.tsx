'use client'

import { useRef } from 'react'
import { Camera, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProfileMetric, AvailabilityStatus } from '@/lib/profile/types'

const TONE_BAR: Record<ProfileMetric['tone'], string> = {
  violet: 'from-violet-500 to-purple-400',
  emerald: 'from-emerald-500 to-emerald-400',
  blue: 'from-blue-500 to-cyan-400',
  cyan: 'from-cyan-500 to-teal-400',
  amber: 'from-amber-500 to-orange-400',
  rose: 'from-rose-500 to-pink-400',
}

type Props = {
  displayName: string
  careerDirection: string
  careerLevel: string
  location: string
  availabilityStatus: AvailabilityStatus
  avatarUrl: string | null
  metrics: ProfileMetric[]
  isRecruiterVisible: boolean
  onAvatarChange: (url: string | null) => void
}

function scoreTone(score: number) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-slate-300'
}

function availabilityStyle(status: AvailabilityStatus) {
  if (status === 'Open to opportunities') return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
  if (status === 'Interviewing') return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  if (status === 'Recruiter visible') return 'bg-violet-500/10 text-violet-300 border-violet-500/30'
  return 'bg-slate-700/40 text-slate-400 border-slate-600/50'
}

export default function ProfileHero({
  displayName,
  careerDirection,
  careerLevel,
  location,
  availabilityStatus,
  avatarUrl,
  metrics,
  isRecruiterVisible,
  onAvatarChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 512_000) {
      alert('Please choose an image under 500KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onAvatarChange(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(file)
  }

  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-slate-950/90 via-violet-950/20 to-slate-950/90 shadow-[0_0_40px_rgba(88,28,135,0.15)] backdrop-blur p-5 md:p-7">
      <div className="grid gap-6 xl:grid-cols-[auto_1fr_auto] xl:items-start">
        <div className="flex flex-col items-center sm:items-start">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-md animate-pulse" />
            <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-violet-400/60 shadow-[0_0_24px_rgba(139,92,246,0.35)] overflow-hidden bg-slate-900 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-violet-300">{initials || '?'}</span>
              )}
            </div>
            <span
              className={cn(
                'absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950',
                isRecruiterVisible ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-500'
              )}
              title={isRecruiterVisible ? 'Recruiter visible' : 'Private'}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-violet-600 border border-violet-400/60 flex items-center justify-center text-white hover:bg-violet-500 hover:scale-105 transition-all"
              aria-label="Change profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Upload professional photo</p>
        </div>

        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 tracking-tight">{displayName}</h1>
            {careerDirection.trim() ? (
              <p className="mt-1 text-sm text-violet-300/90 font-medium">{careerDirection}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-500 italic">Add a professional headline in Professional Links</p>
            )}
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {location}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/25">
              {careerLevel}
            </span>
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full border',
                availabilityStyle(availabilityStatus)
              )}
            >
              {availabilityStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2 min-w-0 xl:max-w-[280px]">
          {metrics.map((m) => (
            <div
              key={m.id}
              title={`${m.tooltip}\n\nHow to improve: ${m.improveHint}`}
              className="group rounded-xl border border-slate-700/50 bg-slate-900/60 px-2.5 py-2 shadow-[0_0_12px_rgba(139,92,246,0.06)] hover:border-violet-500/30 hover:shadow-[0_0_16px_rgba(139,92,246,0.12)] transition-all duration-300"
            >
              <p className="text-[9px] uppercase tracking-wider text-slate-500 truncate">{m.label}</p>
              <p className={cn('text-base font-bold tabular-nums', scoreTone(m.value))}>
                {m.value}
                <span className="text-[10px] font-normal text-slate-500">/100</span>
              </p>
              <div className="mt-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={cn('h-full bg-gradient-to-r transition-all duration-700 ease-out', TONE_BAR[m.tone])}
                  style={{ width: `${Math.min(m.value, 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                {m.improveHint}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
