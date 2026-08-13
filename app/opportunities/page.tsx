import type { Metadata } from 'next'
import { Suspense } from 'react'
import OpportunitiesPage from '@/components/opportunities/OpportunitiesPage'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Local Work Opportunities | JobAZ',
  description:
    'Small practical work opportunities from people and businesses near you — reviewed local tasks and short shifts.',
  alternates: { canonical: `${JOBAZ_SITE_URL}/opportunities` },
  openGraph: {
    title: 'Local Work Opportunities | JobAZ',
    description:
      'Small practical work opportunities from people and businesses near you.',
    url: `${JOBAZ_SITE_URL}/opportunities`,
    siteName: 'JobAZ',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
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
