/**
 * User-scoped localStorage utilities
 * All storage keys are scoped by user ID to ensure data isolation between accounts
 */

import { supabase } from './supabase'

// Cache for current user ID (updated on auth state changes)
let cachedUserId: string | null = null

/**
 * Initialize user ID cache by listening to auth state changes
 * Call this once in your app (e.g., in a root component or layout)
 */
export function initUserStorageCache() {
  if (typeof window === 'undefined') return
  
  // Get initial user ID
  supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUserId = user?.id || null
  })
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id || null
  })
}

/**
 * Get the current user ID from cache (synchronous)
 * Returns null if no user is logged in
 */
export function getCurrentUserIdSync(): string | null {
  return cachedUserId
}

/**
 * Get the current user ID from Supabase auth (async)
 * Returns null if no user is logged in
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    cachedUserId = user?.id || null
    return cachedUserId
  } catch (error) {
    console.error('Error getting current user ID:', error)
    return null
  }
}

/**
 * Get a user-scoped storage key
 * Format: jobaz_${baseKey}_${userId}
 * If no user is logged in, returns the base key (for backward compatibility during migration)
 */
export async function getUserScopedKey(baseKey: string): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    // No user logged in - return base key for backward compatibility
    // This should only happen during migration or if user is not logged in
    return baseKey
  }
  return `jobaz_${baseKey}_${userId}`
}

/**
 * Get a user-scoped storage key synchronously (for cases where user ID is already known)
 * Format: jobaz_${baseKey}_${userId}
 * 
 * IMPORTANT: For protected pages, always check userId exists before calling this.
 * Fallback to baseKey is only for backward compatibility during migration.
 */
export function getUserScopedKeySync(baseKey: string, userId: string | null): string {
  if (!userId) {
    // Fallback to baseKey for backward compatibility (should not happen in protected pages)
    console.warn(`getUserScopedKeySync: No userId provided for key '${baseKey}'. Using fallback key. This should not happen in protected pages.`)
    return baseKey
  }
  return `jobaz_${baseKey}_${userId}`
}

/**
 * Get all localStorage keys for a specific user
 * NOTE: localStorage persistence has been removed - this now returns empty array
 */
export function getUserStorageKeys(userId: string): string[] {
  return []
}

/**
 * Clear all localStorage keys for a specific user
 * NOTE: localStorage persistence has been removed - this is now a no-op
 */
export async function clearUserStorage(userId: string | null): Promise<void> {
  // No-op: localStorage persistence has been removed
}

/**
 * Clear all user storage for the current logged-in user
 */
export async function clearCurrentUserStorage(): Promise<void> {
  const userId = await getCurrentUserId()
  await clearUserStorage(userId)
}

/**
 * Get all storage keys that match a pattern (for a specific user)
 * NOTE: localStorage persistence has been removed - this now returns empty array
 */
export function getUserStorageKeysByPattern(pattern: string, userId: string | null): string[] {
  return []
}

