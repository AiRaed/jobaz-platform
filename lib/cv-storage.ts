/**
 * Shared CV storage helper
 * Provides a unified way to check for base CV across all storage keys
 * Handles both user-scoped and legacy non-scoped keys
 */

import { getCurrentUserIdSync, getUserScopedKeySync } from './user-storage'

export interface BaseCvResult {
  hasCv: boolean
  cv?: any
}

/**
 * Get base CV from any storage scope
 * Tries in order:
 * 1. user-scoped V2 cvs array (key getUserScopedKeySync('cvs', userId)), pick latest by savedAt
 * 2. non-scoped V2 cvs
 * 3. user-scoped legacy hasCV + baseCv
 * 4. non-scoped legacy hasCV + baseCv
 * 
 * Returns { hasCv: boolean, cv?: any }
 * Works even if userId isn't ready (falls back to non-scoped keys)
 */
export function getBaseCvAnyScope(): BaseCvResult {
  if (typeof window === 'undefined') {
    return { hasCv: false }
  }

  try {
    // 1. Try user-scoped V2 cvs array
    const userId = getCurrentUserIdSync()
    if (userId) {
      const userScopedCvsKey = getUserScopedKeySync('cvs', userId)
      const rawCvs = localStorage.getItem(userScopedCvsKey)
      if (rawCvs) {
        try {
          const cvs = JSON.parse(rawCvs)
          if (Array.isArray(cvs) && cvs.length > 0) {
            // Get the latest CV by savedAt
            const latestCv = cvs.reduce((latest, current) => {
              const latestTime = latest?.savedAt ? new Date(latest.savedAt).getTime() : 0
              const currentTime = current?.savedAt ? new Date(current.savedAt).getTime() : 0
              return currentTime > latestTime ? current : latest
            }, cvs[cvs.length - 1])
            
            if (latestCv && (latestCv.summary || latestCv.personalInfo?.fullName)) {
              return { hasCv: true, cv: latestCv }
            }
          }
        } catch (error) {
          console.error('Error parsing user-scoped V2 CVs:', error)
        }
      }
    }

    // 2. Try non-scoped V2 cvs
    const nonScopedCvsKey = 'jobaz-cvs'
    const rawCvs = localStorage.getItem(nonScopedCvsKey)
    if (rawCvs) {
      try {
        const cvs = JSON.parse(rawCvs)
        if (Array.isArray(cvs) && cvs.length > 0) {
          // Get the latest CV by savedAt
          const latestCv = cvs.reduce((latest, current) => {
            const latestTime = latest?.savedAt ? new Date(latest.savedAt).getTime() : 0
            const currentTime = current?.savedAt ? new Date(current.savedAt).getTime() : 0
            return currentTime > latestTime ? current : latest
          }, cvs[cvs.length - 1])
          
          if (latestCv && (latestCv.summary || latestCv.personalInfo?.fullName)) {
            return { hasCv: true, cv: latestCv }
          }
        }
      } catch (error) {
        console.error('Error parsing non-scoped V2 CVs:', error)
      }
    }

    // 3. Try user-scoped legacy hasCV + baseCv
    if (userId) {
      const userScopedHasCvKey = getUserScopedKeySync('hasCV', userId)
      const userScopedBaseCvKey = getUserScopedKeySync('baseCv', userId)
      const hasCV = localStorage.getItem(userScopedHasCvKey) === 'true'
      const rawCv = localStorage.getItem(userScopedBaseCvKey)
      
      if (hasCV && rawCv) {
        try {
          const baseCv = JSON.parse(rawCv)
          if (baseCv.summary || baseCv.fullName) {
            return { hasCv: true, cv: baseCv }
          }
        } catch (error) {
          console.error('Error parsing user-scoped legacy CV:', error)
        }
      }
    }

    // 4. Try non-scoped legacy hasCV + baseCv
    const nonScopedHasCvKey = 'jobaz_hasCV'
    const nonScopedBaseCvKey = 'jobaz_baseCv'
    const hasCV = localStorage.getItem(nonScopedHasCvKey) === 'true'
    const rawCv = localStorage.getItem(nonScopedBaseCvKey)
    
    if (hasCV && rawCv) {
      try {
        const baseCv = JSON.parse(rawCv)
        if (baseCv.summary || baseCv.fullName) {
          return { hasCv: true, cv: baseCv }
        }
      } catch (error) {
        console.error('Error parsing non-scoped legacy CV:', error)
      }
    }

    return { hasCv: false }
  } catch (error) {
    console.error('Error in getBaseCvAnyScope:', error)
    return { hasCv: false }
  }
}

