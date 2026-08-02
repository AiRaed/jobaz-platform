import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import RelayInboxPage from '@/components/relay/RelayInboxPage'

type Props = { params: { conversationId: string } }

/** Phase 1: conversation deep-links open the professional inbox (legacy messenger IDs ignored). */
export default function MessageConversationPage(_props: Props) {
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
