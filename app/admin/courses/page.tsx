import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Courses Manager | JobAZ Admin',
  description: 'Manage Career Hub course listings, providers, and referral links',
}

const AdminCoursesManager = dynamic(
  () => import('@/components/admin/courses/AdminCoursesManager'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading courses manager…</div>
      </AppShell>
    ),
  }
)

export default function AdminCoursesPage() {
  return <AdminCoursesManager />
}
