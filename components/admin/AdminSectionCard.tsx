import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description: string
  href: string
  comingSoon?: boolean
}

export default function AdminSectionCard({ title, description, href, comingSoon }: Props) {
  return (
    <article
      className={cn(
        'rounded-2xl border bg-slate-950/50 p-6 flex flex-col gap-4 transition-colors',
        comingSoon
          ? 'border-slate-700/50 opacity-90'
          : 'border-violet-500/25 hover:border-violet-400/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]'
      )}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {comingSoon && (
            <span className="text-[10px] uppercase tracking-widest text-slate-500 border border-slate-700/60 rounded-full px-2 py-0.5">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {comingSoon ? (
        <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-500 cursor-not-allowed">
          Not available yet
        </span>
      ) : (
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition"
        >
          Open section
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </article>
  )
}
