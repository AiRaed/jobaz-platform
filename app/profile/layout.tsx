import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Career Identity | JobAZ',
  description:
    'Build your private UK career profile, track readiness, and prepare for jobs, courses, and opportunities.',
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children
}
