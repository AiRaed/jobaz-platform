import { ArrowDown } from 'lucide-react'

const STEPS = [
  'Tell JAZ about yourself',
  'Get your personalised career roadmap',
  'Find matching UK jobs',
  'Complete recommended courses',
  'Start your new career',
]

export default function LandingHowItWorks() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-3">How JobAZ works</h2>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          From conversation to career — a clear path designed for the UK job market.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        {STEPS.map((step, index) => (
          <div key={step} className="flex flex-col items-center">
            <div className="w-full rounded-2xl border border-violet-500/20 bg-slate-950/60 px-6 py-4 text-center">
              <span className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold">
                Step {index + 1}
              </span>
              <p className="text-base font-medium text-slate-100 mt-1">{step}</p>
            </div>
            {index < STEPS.length - 1 && (
              <ArrowDown className="w-5 h-5 text-violet-500/50 my-2 shrink-0" aria-hidden />
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
