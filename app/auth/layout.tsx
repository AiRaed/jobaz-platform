import type { Metadata } from 'next'
import { PRIVATE_PAGE_ROBOTS } from '@/lib/seo/site'

export const metadata: Metadata = {
  title: 'Sign in | JobAZ',
  description: 'Sign in or create your JobAZ account.',
  robots: PRIVATE_PAGE_ROBOTS,
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
