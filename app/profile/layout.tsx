import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Career Identity | JobAZ',
  description:
    'Build your private UK career profile, track readiness, and prepare for jobs, courses, and opportunities.',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
