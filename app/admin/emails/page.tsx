import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Email Campaigns | JobAZ Admin',
  description: 'Matched email campaigns with admin approval — AI suggests, admin sends',
}

const AdminEmailsPage = dynamic(
  () => import('@/components/admin/email-campaigns/AdminEmailsPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading email campaigns…</div>
      </AppShell>
    ),
  }
)

export default function AdminEmailsRoutePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-16 text-center text-sm text-slate-400">Loading email campaigns…</div>
        </AppShell>
      }
    >
      <AdminEmailsPage />
    </Suspense>
  )
}
