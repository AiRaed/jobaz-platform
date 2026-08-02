import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Jobs Management | JobAZ Admin',
  description: 'Manage JobAZ job listings for the unified job marketplace',
}

const AdminJobsManager = dynamic(() => import('@/components/admin/jobs/AdminJobsManager'), {
  ssr: false,
  loading: () => (
    <AppShell>
      <div className="py-16 text-center text-sm text-slate-400">Loading jobs manager…</div>
    </AppShell>
  ),
})

export default function AdminJobsPage() {
  return <AdminJobsManager />
}
