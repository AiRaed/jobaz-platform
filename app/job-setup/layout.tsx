import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Job Setup | JobAZ',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function JobSetupLayout({ children }: { children: React.ReactNode }) {
  return children
}
