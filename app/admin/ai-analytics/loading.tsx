export default function AiAnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 md:p-10">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="h-10 w-72 rounded-lg bg-gray-800/80" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#1a1a1a]/80 border border-gray-800" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-[#0D0D0D]/80 border border-gray-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-48 rounded-2xl bg-[#0D0D0D]/80 border border-gray-800" />
          <div className="h-48 rounded-2xl bg-[#0D0D0D]/80 border border-gray-800" />
        </div>
      </div>
    </div>
  )
}
