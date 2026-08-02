'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CA_RESULT_STORAGE_KEY } from '@/lib/uk-career-assistant/guestSession'
import type { UserPathProfile } from '@/lib/build-your-path/types'

const DEFAULT_PROFILE: UserPathProfile = {
  isLoggedIn: false,
  hasAssessment: false,
  multilingual: false,
  strongEnglish: false,
  hasUkCertification: false,
  communicationSkills: false,
  newcomer: true,
}

function parseAssessmentProfile(): Partial<UserPathProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(CA_RESULT_STORAGE_KEY)
    if (!raw) return {}
    const snapshot = JSON.parse(raw) as {
      result?: { path?: string | null; result?: Record<string, unknown> }
      aiState?: Record<string, unknown>
    }
    const result = snapshot.result?.result as Record<string, unknown> | undefined
    const aiState = snapshot.aiState ?? {}
    const answers = (result?.answers ?? aiState.answers) as Record<string, unknown> | undefined

    const multilingual =
      Boolean(answers?.languages) ||
      Boolean(answers?.multilingual) ||
      String(answers?.situation ?? '').includes('language') ||
      snapshot.result?.path === 'translator-interpreter'

    const newcomer =
      answers?.experience === 'none' ||
      answers?.experience === 'outside_uk' ||
      answers?.situation === 'no_uk_experience'

    const englishScore = Number(result?.englishScore ?? aiState.englishScore ?? 0)
    const strongEnglish = englishScore >= 55

    return {
      hasAssessment: true,
      multilingual,
      newcomer: Boolean(newcomer),
      strongEnglish: strongEnglish || englishScore === 0,
      communicationSkills: multilingual || answers?.strengths === 'communication',
      hasUkCertification: false,
    }
  } catch {
    return {}
  }
}

export function useBuildYourPathProfile(): UserPathProfile {
  const [profile, setProfile] = useState<UserPathProfile>(DEFAULT_PROFILE)

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const assessment = parseAssessmentProfile()
      setProfile({
        ...DEFAULT_PROFILE,
        ...assessment,
        isLoggedIn: Boolean(session?.user),
        strongEnglish: assessment.strongEnglish ?? DEFAULT_PROFILE.strongEnglish,
      })
    })

    return () => {
      mounted = false
    }
  }, [])

  return useMemo(() => profile, [profile])
}
