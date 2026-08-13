import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description: string
  href: string
  comingSoon?: boolean
  /** Visual accent for grouped sections (e.g. UK Career Assistant). */
  tone?: 'violet' | 'cyan'
}

export default function AdminSectionCard({
  title,
  description,
  href,
  comingSoon,
  tone = 'violet',
}: Props) {
  const readyBorder =
    tone === 'cyan'
      ? 'border-cyan-500/25 hover:border-cyan-400/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.10)]'
      : 'border-violet-500/25 hover:border-violet-400/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]'

  const readyButton =
    tone === 'cyan'
      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500'
      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'

  return (
    <article
      className={cn(
        'flex flex-col gap-4 rounded-2xl border bg-slate-950/50 p-6 transition-colors',
        comingSoon ? 'border-slate-700/50 opacity-90' : readyBorder
      )}
    >
      <div className="flex-1">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {comingSoon ? (
            <span className="rounded-full border border-slate-700/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-slate-500">
              Coming soon
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {comingSoon ? (
        <span className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm font-medium text-slate-500">
          Not available yet
        </span>
      ) : (
        <Link
          href={href}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition',
            readyButton
          )}
        >
          Open section
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </article>
  )
}
