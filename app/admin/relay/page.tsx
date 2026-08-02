import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Relay Inbox | JobAZ Admin',
  description: 'Phase 1 professional inbox — support, CV help, courses, opportunities',
}

const AdminRelayPage = dynamic(() => import('@/components/admin/relay/AdminRelayPage'), {
  ssr: false,
  loading: () => (
    <AppShell>
      <div className="py-16 text-center text-sm text-slate-400">Loading Relay admin…</div>
    </AppShell>
  ),
})

export default function AdminRelayRoutePage() {
  return <AdminRelayPage />
}
