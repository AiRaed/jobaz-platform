'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import JazEyeIcon from '@/components/ui/JazEyeIcon'
import type { LiveIntelligence } from '@/lib/uk-career-assistant/liveIntelligence'

type Props = {
  started: boolean
  intelligence: LiveIntelligence
  /** @deprecated Intro CTA removed — session auto-starts */
  onStart?: () => void
  loading?: boolean
  /** Compact chrome for floating embed */
  embed?: boolean
}

export default function UkCareerHero({
  started,
  intelligence,
  loading,
  embed = false,
  showStatusChips = false,
}: Props & { showStatusChips?: boolean }) {
  return (
    <header className={cn('relative', embed ? 'mb-4' : 'mb-6 md:mb-8')}>
      {!embed && (
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-300 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>
      )}

      <div
        className={cn(
          'uk-ca-hero jobaz-keep-light relative overflow-hidden rounded-2xl border border-violet-500/20',
          'bg-gradient-to-br from-slate-950/90 via-violet-950/25 to-cyan-950/20 backdrop-blur-xl',
          'shadow-[0_0_60px_rgba(139,92,246,0.12)]',
          embed ? 'p-4 md:p-5' : 'p-5 md:p-6'
        )}
      >
        <div
          className={cn(
            'absolute -top-8 -right-4 pointer-events-none',
            embed ? 'w-24 h-24' : 'w-28 h-28 md:w-36 md:h-36'
          )}
        >
          <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-2xl animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center uk-jaz-breathe">
            <JazEyeIcon variant="header" size={embed ? 28 : 32} />
          </div>
        </div>

        <div className="relative max-w-2xl pr-16">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[10px] uppercase tracking-widest text-emerald-300 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {loading && !started ? 'Starting session…' : 'JAZ AI brain · live'}
          </div>

          <h1
            className={cn(
              'font-bold tracking-tight mb-1.5 bg-gradient-to-r from-white via-violet-100 to-cyan-200 bg-clip-text text-transparent',
              embed ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
            )}
          >
            UK Career Assistant
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
            Answer a few questions — JAZ maps your fastest practical route to work and training in the UK.
          </p>

          {showStatusChips && started && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {intelligence.statusIndicators.slice(0, 4).map((ind) => (
                <span
                  key={ind.label}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border transition-all duration-500',
                    ind.active
                      ? 'border-violet-500/35 bg-violet-500/10 text-violet-200'
                      : 'border-slate-700/50 bg-slate-900/40 text-slate-600'
                  )}
                >
                  {ind.pulse && ind.active && (
                    <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                  )}
                  {ind.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes uk-jaz-breathe {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(139, 92, 246, 0.45);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 55px rgba(6, 182, 212, 0.35);
          }
        }
        .uk-jaz-breathe {
          animation: uk-jaz-breathe 3.5s ease-in-out infinite;
        }
      `}</style>
    </header>
  )
}
