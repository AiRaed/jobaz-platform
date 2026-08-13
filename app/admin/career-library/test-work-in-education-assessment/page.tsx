import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Work in My Education Assessment Preview | JobAZ Admin',
  description: 'Admin assessment blueprint → matcher preview for Work in My Education',
}

const TestWorkInEducationAssessmentPage = dynamic(
  () => import('@/components/admin/career-library/TestWorkInEducationAssessmentPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading assessment preview…</div>
      </AppShell>
    ),
  }
)

export default function TestWorkInEducationAssessmentRoute() {
  return <TestWorkInEducationAssessmentPage />
}
