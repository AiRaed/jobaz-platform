import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Work in My Education Wizard | JobAZ Admin',
  description: 'Admin preview of the Work in My Education assessment wizard experience',
}

const TestWorkInEducationWizardPage = dynamic(
  () => import('@/components/admin/career-library/TestWorkInEducationWizardPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading assessment wizard…</div>
      </AppShell>
    ),
  }
)

export default function TestWorkInEducationWizardRoute() {
  return <TestWorkInEducationWizardPage />
}
