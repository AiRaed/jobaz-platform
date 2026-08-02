import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'

export default function CourseNotFound() {
  return (
    <AppShell className="max-w-lg text-center py-20">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">Course not found</h1>
      <p className="text-sm text-slate-400 mb-6">
        This course may have been removed or is not yet published.
      </p>
      <Link
        href="/career-hub"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-600/60 text-slate-200 hover:border-violet-500/40 hover:bg-violet-500/10 transition"
      >
        Browse Career Hub
      </Link>
    </AppShell>
  )
}
