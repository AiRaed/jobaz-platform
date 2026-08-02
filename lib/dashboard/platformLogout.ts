import { supabase } from '@/lib/supabase'
import { clearCurrentUserStorage } from '@/lib/user-storage'
import { clearCachesOnLogout } from '@/lib/career-engine/clearSharedCareerCache'
import { resetAssessmentLoaderUserCache } from '@/lib/dashboard/careerOs/assessmentLoader'

/** Sign out and clear scoped storage — shared across platform pages. */
export async function platformLogout(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? null
  await supabase.auth.signOut()
  if (typeof window !== 'undefined') {
    clearCachesOnLogout()
    resetAssessmentLoaderUserCache()
    if (userId) {
      await clearCurrentUserStorage()
    }
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}
