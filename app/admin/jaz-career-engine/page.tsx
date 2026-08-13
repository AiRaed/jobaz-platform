import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Career Assistant Engine | JobAZ Admin',
  description:
    'UK Career Assistant — JAZ engine status, logs, behaviour analytics, course matching, and test tools',
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
