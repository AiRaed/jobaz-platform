import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'JAZ Career Engine | JobAZ Admin',
  description: 'Monitor Career Assistant engine health, plans, and affiliate matching',
}

const AdminJazCareerEnginePage = dynamic(
  () => import('@/components/admin/jaz-career-engine/AdminJazCareerEnginePage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading JAZ Career Engine…</div>
      </AppShell>
    ),
  }
)

export default function AdminJazCareerEngineRoutePage() {
  return <AdminJazCareerEnginePage />
}
