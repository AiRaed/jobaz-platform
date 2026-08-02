import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'JobAZ – AI Career Operating System',
  description: 'Your career plan, courses, job tracker, and readiness — all in one UK career dashboard.',
}

function DashboardFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
      Loading dashboard…
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<DashboardFallback />}>{children}</Suspense>
}

