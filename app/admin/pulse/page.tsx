import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Pulse | JobAZ Admin',
  description: 'Admin-seeded Pulse posts for JobAZ Phase 1 launch',
}

const AdminPulsePage = dynamic(() => import('@/components/admin/pulse/AdminPulsePage'), {
  ssr: false,
  loading: () => (
    <AppShell>
      <div className="py-16 text-center text-sm text-slate-400">Loading Pulse admin…</div>
    </AppShell>
  ),
})

export default function AdminPulseRoutePage() {
  return <AdminPulsePage />
}
