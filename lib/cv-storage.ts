/**
 * Shared CV storage helper
 * NOTE: localStorage persistence has been removed - this now returns empty state
 */

export interface BaseCvResult {
  hasCv: boolean
  cv?: any
}

/**
 * Get base CV from any storage scope
 * NOTE: localStorage persistence has been removed - this now returns empty state
 */
export function getBaseCvAnyScope(): BaseCvResult {
  return { hasCv: false }
}

