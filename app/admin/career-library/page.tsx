import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Career Knowledge Library | JobAZ Admin',
  description: 'JobAZ-owned career knowledge foundation for the next Career Assistant',
}

const AdminCareerLibraryPage = dynamic(
  () => import('@/components/admin/career-library/AdminCareerLibraryPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading Career Library…</div>
      </AppShell>
    ),
  }
)

export default function CareerLibraryAdminRoute() {
  return <AdminCareerLibraryPage />
}
