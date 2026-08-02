import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – Pulse',
  description:
    'Pulse — career tips, opportunities and success stories from the JobAZ Career Team.',
}

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children
}
