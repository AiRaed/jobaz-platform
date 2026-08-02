import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import RelayInboxPage from '@/components/relay/RelayInboxPage'

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <AppShell wide platform>
          <div className="py-16 text-center text-sm text-slate-400">Loading Relay…</div>
        </AppShell>
      }
    >
      <RelayInboxPage />
    </Suspense>
  )
}
