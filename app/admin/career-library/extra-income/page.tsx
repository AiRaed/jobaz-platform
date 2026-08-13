import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Extra Income Library | JobAZ Admin',
  description:
    'UK Career Assistant Extra Income library — admin editing tools coming next',
}

const AdminExtraIncomeLibraryPage = dynamic(
  () => import('@/components/admin/career-library/AdminExtraIncomeLibraryPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">
          Loading Extra Income Library…
        </div>
      </AppShell>
    ),
  }
)

export default function ExtraIncomeLibraryAdminRoute() {
  return <AdminExtraIncomeLibraryPage />
}
