import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

/** Canonical to /jobs — /job-finder is an alias. */
export const metadata: Metadata = {
  title: 'UK Job Finder | JobAZ',
  description:
    'Search UK jobs with JobAZ — find roles that match your skills, location, and career plan.',
  alternates: { canonical: `${JOBAZ_SITE_URL}/jobs` },
  robots: { index: true, follow: true },
}

export default function JobFinderLayout({ children }: { children: React.ReactNode }) {
  return children
}
