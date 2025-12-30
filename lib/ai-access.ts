'use client'

/**
 * Helper functions and hooks for 24h AI access management
 * Uses localStorage with ai_unlock_until (replaces aiPaid/aiUnlockUntil)
 * This is a legacy wrapper - use utils/access.ts for new code
 */

const AI_UNLOCK_UNTIL_KEY = 'ai_unlock_until'

export interface AiAccessInfo {
  valid: boolean
  expiresAt?: number
  remainingMs?: number
  source?: string
  trialAvailable?: boolean
  trialUsed?: boolean
}

/**
 * Get AI access status from localStorage
 * Returns: { valid: boolean, expiresAt?: number, remainingMs?: number, source?: string, trialAvailable?: boolean, trialUsed?: boolean }
 */
export function getAiAccess(): AiAccessInfo {
  if (typeof window === 'undefined') {
    return { valid: false, trialAvailable: false, trialUsed: false }
  }

  try {
    // Check if user has active paid access
    const untilStr = localStorage.getItem(AI_UNLOCK_UNTIL_KEY)
    if (untilStr) {
      const expiresAt = Number.parseInt(untilStr, 10)
      if (!Number.isNaN(expiresAt)) {
        const now = Date.now()
        const remainingMs = expiresAt - now

        // Check if expired (account for clock skew: if less than 1 minute left, consider expired)
        if (remainingMs >= 60 * 1000) {
          return {
            valid: true,
            expiresAt,
            remainingMs,
            source: 'donation',
            trialAvailable: false,
            trialUsed: undefined,
          }
        } else {
          // Expired, clean up
          localStorage.removeItem(AI_UNLOCK_UNTIL_KEY)
        }
      } else {
        // Invalid format, clean up
        localStorage.removeItem(AI_UNLOCK_UNTIL_KEY)
      }
    }

    // No active paid access
    return {
      valid: false,
      trialAvailable: false,
      trialUsed: false,
    }
  } catch (error) {
    console.error('[AI Access] Error reading from localStorage:', error)
    // If localStorage is blocked (private mode, etc.), return invalid
    return { valid: false, trialAvailable: false, trialUsed: false }
  }
}

/**
 * Set AI access for 24 hours from now
 */
export function setAiAccess(source: string = 'donation'): void {
  if (typeof window === 'undefined') return

  try {
    const now = Date.now()
    const expiresAt = now + 24 * 60 * 60 * 1000 // 24 hours

    localStorage.setItem(AI_UNLOCK_UNTIL_KEY, expiresAt.toString())
    
    // Clear preview_end_at (and legacy preview keys for cleanup)
    localStorage.removeItem('preview_end_at')
    localStorage.removeItem('aiPreviewStartAt')

    // Trigger custom event for same-tab updates (storage event only fires cross-tab)
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: AI_UNLOCK_UNTIL_KEY, newValue: expiresAt.toString() }
    }))
    window.dispatchEvent(new CustomEvent('localStorageChange', {
      detail: { key: 'preview_end_at', newValue: null }
    }))
  } catch (error) {
    console.error('[AI Access] Error writing to localStorage:', error)
    throw new Error('Could not save 24h pass. Please disable strict privacy mode.')
  }
}

/**
 * Clear AI access (but keep preview state if active)
 */
export function clearAiAccess(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(AI_UNLOCK_UNTIL_KEY)

  // Trigger custom event for same-tab updates
  window.dispatchEvent(new CustomEvent('localStorageChange', {
    detail: { key: AI_UNLOCK_UNTIL_KEY, newValue: null }
  }))
}

/**
 * Check if trial is available (not used yet)
 * Always returns false since we don't use trials anymore - only 90s preview
 */
export function isTrialAvailable(): boolean {
  return false
}

/**
 * Mark trial as used
 * No-op since we don't use trials anymore
 */
export function markTrialUsed(): void {
  // No-op
}

/**
 * Format remaining time as "HH:MM" or null if expired
 */
export function formatTimeRemaining(remainingMs?: number): string | null {
  if (!remainingMs || remainingMs < 0) return null

  const hours = Math.floor(remainingMs / (1000 * 60 * 60))
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

