/**
 * Identity Phase 1 — private Career Identity only.
 * Public social profiles, follow/friends/connections stay behind this flag.
 */

/** When true, public profile routes and social CTAs are disabled. */
export const IDENTITY_PHASE1_PRIVATE_ONLY = true

export const IDENTITY_PHASE1_PUBLIC_COPY = {
  title: 'Public career profile — coming later',
  body: 'You’ll be able to share your career profile when Pulse and Relay open fully.',
} as const

export function isIdentityPublicSocialEnabled(): boolean {
  return !IDENTITY_PHASE1_PRIVATE_ONLY
}
