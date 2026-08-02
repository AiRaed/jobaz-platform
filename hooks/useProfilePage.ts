'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { initUserStorageCache } from '@/lib/user-storage'
import { getUserAiProfile } from '@/lib/jobaz-ai/profile/getUserAiProfile'
import { getRecentAiCareerEvents } from '@/lib/jobaz-ai/profile/recentEvents'
import type { CvData } from '@/app/cv-builder-v2/page'
import {
  buildProfileView,
  loadProfileExtensions,
  saveProfileExtensions,
  type ProfileExtensions,
  type ProfileViewModel,
} from '@/lib/profile'

type FetchSnapshot = {
  displayName: string
  email: string
  cvData: CvData | null
  aiProfile: Awaited<ReturnType<typeof getUserAiProfile>>
  interviewConfidence: number
  applicationsCount: number
  hasCoverLetter: boolean
  aiTimeline: { id: string; label: string; createdAt: string }[]
}

export function useProfilePage() {
  const [loading, setLoading] = useState(true)
  const [extensions, setExtensions] = useState<ProfileExtensions>(() => loadProfileExtensions())
  const [view, setView] = useState<ProfileViewModel | null>(null)
  const snapshotRef = useRef<FetchSnapshot | null>(null)

  const rebuildView = useCallback((ext: ProfileExtensions, snap: FetchSnapshot) => {
    setView(
      buildProfileView({
        displayName: snap.displayName,
        email: snap.email,
        extensions: ext,
        cvData: snap.cvData,
        aiProfile: snap.aiProfile,
        interviewConfidence: snap.interviewConfidence,
        applicationsCount: snap.applicationsCount,
        hasCoverLetter: snap.hasCoverLetter,
        aiTimeline: snap.aiTimeline,
      })
    )
  }, [])

  const refresh = useCallback(async () => {
    try {
      initUserStorageCache()
      const ext = loadProfileExtensions()
      setExtensions(ext)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      const email = user?.email ?? ''
      const fullName = user?.user_metadata?.full_name ?? ''
      const displayName = fullName || (email ? email.split('@')[0] : 'Your Profile')

      let cvData: CvData | null = null
      let hasCoverLetter = false
      try {
        const cvRes = await fetch('/api/cv/get-latest')
        if (cvRes.ok) {
          const cvJson = await cvRes.json()
          if (cvJson.ok && cvJson.hasCv && cvJson.cv?.data) {
            cvData = cvJson.cv.data as CvData
          }
        }
      } catch {
        /* ignore */
      }

      try {
        const coverRes = await fetch('/api/cover/get-latest')
        if (coverRes.ok) {
          const coverJson = await coverRes.json()
          hasCoverLetter = Boolean(coverJson.ok && coverJson.hasCover)
        }
      } catch {
        /* ignore */
      }

      let applicationsCount = 0
      try {
        const appRes = await fetch('/api/jobs/applied/list')
        if (appRes.ok) {
          const appJson = await appRes.json()
          applicationsCount = Array.isArray(appJson.jobs) ? appJson.jobs.length : 0
        }
      } catch {
        /* ignore */
      }

      const aiProfile = await getUserAiProfile()
      const aiEvents = await getRecentAiCareerEvents(6)

      let interviewConfidence = 20
      if (aiProfile?.progressionMeta?.interviewSessionsCount) {
        interviewConfidence += Math.min(50, aiProfile.progressionMeta.interviewSessionsCount * 15)
      }
      if (applicationsCount > 0) interviewConfidence += 20
      if (cvData) interviewConfidence += 15
      interviewConfidence = Math.min(100, interviewConfidence)

      const snap: FetchSnapshot = {
        displayName,
        email,
        cvData,
        aiProfile,
        interviewConfidence,
        applicationsCount,
        hasCoverLetter,
        aiTimeline: aiEvents.map((e) => ({
          id: e.id,
          label: e.label,
          createdAt: e.createdAt,
        })),
      }
      snapshotRef.current = snap
      rebuildView(ext, snap)
    } finally {
      setLoading(false)
    }
  }, [rebuildView])

  useEffect(() => {
    void refresh()
    const onCv = () => void refresh()
    const onProfile = () => void refresh()
    window.addEventListener('jobaz-cv-saved', onCv)
    window.addEventListener('jobaz-ai-profile-updated', onProfile)
    return () => {
      window.removeEventListener('jobaz-cv-saved', onCv)
      window.removeEventListener('jobaz-ai-profile-updated', onProfile)
    }
  }, [refresh])

  const updateExtensions = useCallback(
    (partial: Partial<ProfileExtensions>) => {
      const next = saveProfileExtensions(partial)
      setExtensions(next)
      const snap = snapshotRef.current
      if (snap) rebuildView(next, snap)
    },
    [rebuildView]
  )

  const saveCvData = useCallback(
    async (partial: Partial<CvData>) => {
      const snap = snapshotRef.current
      if (!snap) return

      const base: CvData =
        snap.cvData ??
        ({
          personalInfo: { fullName: snap.displayName, email: snap.email },
          summary: '',
          experience: [],
          education: [],
          skills: [],
        } satisfies CvData)

      const merged: CvData = {
        ...base,
        ...partial,
        personalInfo: { ...base.personalInfo, ...partial.personalInfo },
        experience: partial.experience ?? base.experience,
        education: partial.education ?? base.education,
        skills: partial.skills ?? base.skills,
        certifications: partial.certifications ?? base.certifications,
      }

      const res = await fetch('/api/cv/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: merged }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to save CV')

      const nextSnap = { ...snap, cvData: merged }
      snapshotRef.current = nextSnap
      const ext = loadProfileExtensions()
      rebuildView(ext, nextSnap)
      window.dispatchEvent(new Event('jobaz-cv-saved'))
    },
    [rebuildView]
  )

  return { loading, view, extensions, updateExtensions, saveCvData, refresh }
}
