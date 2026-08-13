import type { Metadata } from 'next'
import { JOBAZ_SITE_URL, UK_COURSE_KEYWORDS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'UK Career Courses & Licences | JobAZ',
  description:
    'Browse UK career courses and licences on JobAZ — including SIA Door Supervisor, security licence, Care Certificate, health and social care, CSCS, and forklift training pathways.',
  keywords: [...UK_COURSE_KEYWORDS],
  alternates: { canonical: `${JOBAZ_SITE_URL}/courses` },
  openGraph: {
    title: 'UK Career Courses & Licences | JobAZ',
    description:
      'Discover UK courses and licence pathways. Apply via JobAZ when a partner provider link is available.',
    url: `${JOBAZ_SITE_URL}/courses`,
    siteName: 'JobAZ',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children
}
