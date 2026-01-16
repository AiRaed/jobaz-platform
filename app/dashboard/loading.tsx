export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* Main container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Skeleton Header */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
          <div className="h-5 w-96 bg-slate-800/30 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6"
            >
              <div className="h-5 w-24 bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
              <div className="h-8 w-16 bg-slate-800/40 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Skeleton Content Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-6"
            >
              <div className="h-6 w-40 bg-slate-800/50 rounded-lg mb-4 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-20 bg-slate-800/40 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

