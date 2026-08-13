import type { Metadata } from 'next'
import { JOBAZ_SITE_URL } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'About JobAZ | UK Career Platform',
  description:
    'JobAZ helps people in the UK find work, explore courses and licences, build CVs, and get guided career recommendations.',
  alternates: { canonical: `${JOBAZ_SITE_URL}/about` },
  robots: { index: true, follow: true },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
