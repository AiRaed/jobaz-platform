import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Email Preferences | JobAZ',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function EmailPreferencesLayout({ children }: { children: React.ReactNode }) {
  return children
}
