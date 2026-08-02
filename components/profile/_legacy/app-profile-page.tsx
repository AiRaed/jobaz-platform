'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import ProfilePageContent from './ProfilePageContent'

/** Same entry pattern as app/feed/page.tsx (Pulse). */
export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            Loading profile…
          </div>
        </AppShell>
      }
    >
      <ProfilePageContent />
    </Suspense>
  )
}
