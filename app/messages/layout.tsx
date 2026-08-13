import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'JobAZ – Relay',
  description:
    'Professional work inbox for opportunities, CV help, course questions, and JobAZ support.',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
