/** Placeholder stats — replace with dynamic API data when available. */
export const LANDING_STATS = [
  { label: 'UK Jobs', value: '10,000+' },
  { label: 'Career Paths', value: '50+' },
  { label: 'Industries Covered', value: '15+' },
  { label: 'Professional Courses', value: '100+' },
  { label: 'Users Helped', value: '5,000+' },
] as const

export default function LandingStats() {
  return (
    <section className="py-14 md:py-20">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm px-6 py-10 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6">
          {LANDING_STATS.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text text-transparent tabular-nums">
                {value}
              </p>
              <p className="text-xs md:text-sm text-slate-400 mt-1.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
