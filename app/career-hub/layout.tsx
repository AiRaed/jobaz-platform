import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

/** Legacy alias — canonicalize to /courses. */
export const metadata: Metadata = {
  title: 'UK Career Courses & Licences | JobAZ',
  description:
    'Browse UK career courses and licences on JobAZ — including SIA Door Supervisor, security licence, Care Certificate, CSCS, and forklift pathways.',
  alternates: { canonical: `${JOBAZ_SITE_URL}/courses` },
  robots: { index: true, follow: true },
}

export default function CareerHubLayout({ children }: { children: React.ReactNode }) {
  return children
}
