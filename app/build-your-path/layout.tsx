import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Build Your Path | JobAZ',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function BuildYourPathLayout({ children }: { children: React.ReactNode }) {
  return children
}
