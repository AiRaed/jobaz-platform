import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'JobAZ – Pulse',
  description:
    'Pulse — career tips, opportunities and success stories from the JobAZ Career Team.',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
