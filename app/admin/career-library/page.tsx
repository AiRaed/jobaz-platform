import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Work in My Education Library | JobAZ Admin',
  description:
    'UK Career Assistant — education-based career knowledge library (fields, specialisms, stages, roles)',
}

const AdminCareerLibraryPage = dynamic(
  () => import('@/components/admin/career-library/AdminCareerLibraryPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">
          Loading Work in My Education Library…
        </div>
      </AppShell>
    ),
  }
)

export default function CareerLibraryAdminRoute() {
  return <AdminCareerLibraryPage />
}
