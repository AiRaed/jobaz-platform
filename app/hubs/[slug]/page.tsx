'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import HubPage from '@/components/hubs/HubPage'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { supabase } from '@/lib/supabase'
import { ensureFeedProfile, getUserFeedProfile, mapProfileToCurrentUser } from '@/lib/feed/feedService'
import { guestProfilePreview } from '@/lib/feed/mappers'
import type { CurrentUserFeedProfile } from '@/lib/feed/types'

export default function HubSlugPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          Loading…
        </div>
      }
    >
      <HubSlugPageContent />
    </Suspense>
  )
}

function HubSlugPageContent() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const [user, setUser] = useState<CurrentUserFeedProfile>(guestProfilePreview())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      setIsAuthenticated(Boolean(uid))
      if (uid) {
        await ensureFeedProfile()
        const profile = await getUserFeedProfile(uid)
        if (profile) setUser(mapProfileToCurrentUser(profile))
      }
    })()
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  if (!slug) {
    return null
  }

  return (
    <>
      <HubPage
        slug={slug}
        currentUser={user}
        isAuthenticated={isAuthenticated}
        onRequireAuth={() => setAuthOpen(true)}
        onToast={showToast}
      />
      <CareerAuthWallModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={`/hubs/${slug}`}
        title="Sign in to join this circle"
        description="Create a free account to join circles, share on Pulse, and connect professionally."
        bullets={['Join career circles', 'Share on Pulse', 'Build your identity']}
      />
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl border border-violet-500/40 bg-slate-950/95 text-sm text-violet-200 shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}
