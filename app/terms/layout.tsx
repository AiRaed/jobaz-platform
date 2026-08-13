import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | JobAZ',
  description:
    'Terms & Conditions for JobAZ — AI career plans, CV Builder, Jobs For You, courses, and UK career tools.',
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
