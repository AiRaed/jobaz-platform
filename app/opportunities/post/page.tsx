'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import PostOpportunityForm from '@/components/opportunities/PostOpportunityForm'
import { supabase } from '@/lib/supabase'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'

export default function PostOpportunityPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (!session?.user) {
        router.replace(buildAuthLoginUrl('/opportunities/post'))
        return
      }
      setChecking(false)
    })
    return () => {
      cancelled = true
    }
  }, [router])

  if (checking) {
    return (
      <AppShell wide platform>
        <PlatformToolShell>
          <div className="py-16 text-center text-sm text-[var(--jaz-muted)] dark:text-slate-400">
            Checking sign-in…
          </div>
        </PlatformToolShell>
      </AppShell>
    )
  }

  return (
    <AppShell wide platform>
      <PlatformToolShell>
        <PageHeader
          title="Post an Opportunity"
          subtitle="Describe a real local task or short shift. Submissions are reviewed before they go live."
          showBackToDashboard={false}
        />
        <PostOpportunityForm />
      </PlatformToolShell>
    </AppShell>
  )
}
