import { Brain, Briefcase, GraduationCap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Career Planning',
    description:
      'JAZ learns about your background and builds a personalised UK roadmap — not generic advice.',
    accent: 'violet',
  },
  {
    icon: Briefcase,
    title: 'UK Jobs',
    description:
      'Search real openings across the UK and see roles matched to your career plan.',
    accent: 'cyan',
  },
  {
    icon: GraduationCap,
    title: 'Professional Courses',
    description:
      'Discover certifications and training paths that unlock better jobs and higher pay.',
    accent: 'amber',
  },
  {
    icon: TrendingUp,
    title: 'Career Growth',
    description:
      'From first role to senior level — track progress, missions, and your next move.',
    accent: 'emerald',
  },
] as const

export default function LandingWhyJobaz() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-3">Why JobAZ</h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          One platform combining AI guidance, UK jobs, and professional training — built for real career
          outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, description, accent }) => (
          <div
            key={title}
            className={cn(
              'rounded-2xl border bg-slate-950/50 p-6 transition hover:-translate-y-0.5 duration-300',
              accent === 'violet' && 'border-violet-500/20 hover:border-violet-500/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]',
              accent === 'cyan' && 'border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(6,182,212,0.08)]',
              accent === 'amber' && 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-[0_0_30px_rgba(245,158,11,0.08)]',
              accent === 'emerald' && 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)]'
            )}
          >
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center mb-4 border',
                accent === 'violet' && 'bg-violet-600/20 border-violet-500/30 text-violet-300',
                accent === 'cyan' && 'bg-cyan-600/15 border-cyan-500/25 text-cyan-300',
                accent === 'amber' && 'bg-amber-600/15 border-amber-500/25 text-amber-300',
                accent === 'emerald' && 'bg-emerald-600/15 border-emerald-500/25 text-emerald-300'
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-50 mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
