import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JobAZ – Relay',
  description:
    'Professional work inbox for opportunities, CV help, course questions, and JobAZ support.',
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
