import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | JobAZ',
  description:
    'Privacy Policy for JobAZ — how we collect, use, and protect account, plan, CV, job, and consent data.',
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
