import { Suspense } from 'react'
import OpportunitiesPage from '@/components/opportunities/OpportunitiesPage'

export const metadata = {
  title: 'Local Work Opportunities | JobAZ',
  description:
    'Small practical work opportunities from people and businesses near you — reviewed local tasks and short shifts.',
}

export default function OpportunitiesRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center text-sm text-slate-400">
          Loading opportunities…
        </div>
      }
    >
      <OpportunitiesPage />
    </Suspense>
  )
}
