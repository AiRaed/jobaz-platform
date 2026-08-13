import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Profession & Start New Career Library | JobAZ Admin',
  description:
    'Shared practical profession library for Work in My Profession and Start a New Career',
}

const AdminWorkInProfessionLibraryPage = dynamic(
  () => import('@/components/admin/career-library/AdminWorkInProfessionLibraryPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">
          Loading Profession & Start New Career Library…
        </div>
      </AppShell>
    ),
  }
)

export default function WorkInProfessionLibraryRoute() {
  return <AdminWorkInProfessionLibraryPage />
}
