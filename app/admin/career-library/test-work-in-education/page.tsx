import dynamic from 'next/dynamic'
import AppShell from '@/components/layout/AppShell'

export const metadata = {
  title: 'Work in My Education Match Test | JobAZ Admin',
  description: 'Admin diagnostic harness for Career Knowledge Library matching',
}

const TestWorkInEducationPage = dynamic(
  () => import('@/components/admin/career-library/TestWorkInEducationPage'),
  {
    ssr: false,
    loading: () => (
      <AppShell>
        <div className="py-16 text-center text-sm text-slate-400">Loading match harness…</div>
      </AppShell>
    ),
  }
)

export default function TestWorkInEducationRoute() {
  return <TestWorkInEducationPage />
}
