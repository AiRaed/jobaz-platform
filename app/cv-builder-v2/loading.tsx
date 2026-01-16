export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* Main container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Skeleton Header */}
        <div className="mb-6">
          <div className="h-8 w-56 bg-slate-800/50 rounded-lg mb-2 animate-pulse" />
          <div className="h-4 w-72 bg-slate-800/30 rounded-lg animate-pulse" />
        </div>

        {/* Two-column skeleton layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-start">
          {/* Left: Editor skeleton */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6">
              {/* Tabs skeleton */}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-24 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
              {/* Content skeleton */}
              <div className="space-y-4">
                <div className="h-32 bg-slate-800/40 rounded-lg animate-pulse" />
                <div className="h-20 bg-slate-800/30 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right: Preview skeleton */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6">
              <div className="h-96 bg-slate-800/30 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

