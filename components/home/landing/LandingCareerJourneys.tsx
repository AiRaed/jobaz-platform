import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type JourneyStep = { label: string; highlight?: boolean }

type Journey = {
  title: string
  steps: JourneyStep[]
}

const JOURNEYS: Journey[] = [
  {
    title: 'Overseas Accountant',
    steps: [
      { label: 'Overseas Accountant' },
      { label: 'Qualification Recognition' },
      { label: 'Excel Course' },
      { label: 'Accounts Assistant' },
      { label: 'ACCA' },
      { label: 'Finance Manager', highlight: true },
    ],
  },
  {
    title: 'Care Assistant',
    steps: [
      { label: 'Care Assistant' },
      { label: 'Care Certificate' },
      { label: 'NHS Jobs' },
      { label: 'Senior Carer' },
      { label: 'Nursing Pathway', highlight: true },
    ],
  },
  {
    title: 'Electrician',
    steps: [
      { label: 'Electrician' },
      { label: '18th Edition' },
      { label: 'ECS Card' },
      { label: 'Electrician' },
      { label: 'Site Supervisor', highlight: true },
    ],
  },
]

export default function LandingCareerJourneys() {
  return (
    <section className="py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-3">Example career journeys</h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          See how JobAZ connects qualifications, training, and jobs into a realistic UK career path.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {JOURNEYS.map((journey) => (
          <JourneyCard key={journey.title} journey={journey} />
        ))}
      </div>
    </section>
  )
}

function JourneyCard({ journey }: { journey: Journey }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/50 p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold mb-4">
        {journey.title}
      </p>
      <div className="space-y-0">
        {journey.steps.map((step, index) => (
          <div key={`${step.label}-${index}`}>
            <div
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-medium border transition',
                step.highlight
                  ? 'border-violet-500/40 bg-violet-950/40 text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                  : 'border-slate-700/40 bg-slate-900/40 text-slate-300'
              )}
            >
              {step.label}
            </div>
            {index < journey.steps.length - 1 && (
              <div className="flex justify-center py-1.5">
                <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" aria-hidden />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
