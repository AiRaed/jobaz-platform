import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'UK Job Finder | JobAZ',
  description:
    'Search UK jobs with JobAZ — find roles that match your skills, location, and career plan.',
  keywords: ['UK jobs', 'job finder UK', 'JobAZ jobs', 'find work UK'],
  alternates: { canonical: `${JOBAZ_SITE_URL}/jobs` },
  openGraph: {
    title: 'UK Job Finder | JobAZ',
    description: 'Search UK jobs and roles that fit your career path on JobAZ.',
    url: `${JOBAZ_SITE_URL}/jobs`,
    siteName: 'JobAZ',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
}

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children
}
