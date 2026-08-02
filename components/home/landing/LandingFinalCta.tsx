import Link from 'next/link'
import { ArrowRight, Briefcase } from 'lucide-react'

export default function LandingFinalCta() {
  return (
    <section className="py-16 md:py-24">
      <div className="relative rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-slate-950/80 to-indigo-950/40 px-8 py-14 md:px-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.15),transparent_55%)] pointer-events-none" />

        <div className="relative">
          <h2 className="text-2xl md:text-4xl font-bold text-slate-50 mb-4">
            Ready to build your UK career?
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8">
            Start with a free AI assessment or browse jobs right away — no account required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#jaz-panel"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_rgba(139,92,246,0.45)] hover:from-violet-500 hover:to-fuchsia-500 transition"
            >
              Start Free Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/job-finder"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600/60 bg-slate-900/60 px-8 py-3.5 text-sm font-semibold text-slate-200 hover:border-cyan-500/40 hover:text-cyan-100 transition"
            >
              <Briefcase className="w-4 h-4" />
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
