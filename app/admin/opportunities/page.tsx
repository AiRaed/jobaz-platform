import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Local Opportunities | JobAZ Admin',
  description: 'Review and moderate local work opportunity submissions',
}

const AdminLocalOpportunitiesManager = dynamic(
  () => import('@/components/admin/local-opportunities/AdminLocalOpportunitiesManager'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading opportunities…</div>
      </AppShell>
    ),
  }
)

export default function AdminOpportunitiesPage() {
  return <AdminLocalOpportunitiesManager />
}
