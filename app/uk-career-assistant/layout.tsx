import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

/** Canonical points to /career-assistant to avoid duplicate indexing. */
export const metadata: Metadata = {
  title: 'UK Career Assistant | JobAZ',
  description:
    'Get guided UK career recommendations with JobAZ Career Assistant — explore roles, courses, licences, and next steps for your path.',
  alternates: { canonical: `${JOBAZ_SITE_URL}/career-assistant` },
  robots: { index: true, follow: true },
}

export default function UkCareerAssistantLayout({ children }: { children: React.ReactNode }) {
  return children
}
