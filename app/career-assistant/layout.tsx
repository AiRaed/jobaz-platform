import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'UK Career Assistant | JobAZ',
  description:
    'Get guided UK career recommendations with JobAZ Career Assistant — explore roles, courses, licences, and next steps for your path.',
  keywords: [
    'UK career assistant',
    'UK career advice',
    'career guidance UK',
    'JobAZ Career Assistant',
    'UK courses and licences',
  ],
  alternates: { canonical: `${JOBAZ_SITE_URL}/career-assistant` },
  openGraph: {
    title: 'UK Career Assistant | JobAZ',
    description:
      'Guided UK career recommendations — roles, courses, licences, and practical next steps.',
    url: `${JOBAZ_SITE_URL}/career-assistant`,
    siteName: 'JobAZ',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
}

export default function CareerAssistantLayout({ children }: { children: React.ReactNode }) {
  return children
}
