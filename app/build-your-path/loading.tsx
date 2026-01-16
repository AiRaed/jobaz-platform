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

        {/* Career Path Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6"
            >
              <div className="h-8 w-32 bg-slate-800/50 rounded-lg mb-3 animate-pulse" />
              <div className="h-20 bg-slate-800/40 rounded-lg mb-3 animate-pulse" />
              <div className="h-4 w-full bg-slate-800/30 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

