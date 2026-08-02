/**
 * Provider-level default referral URLs when a course has no course-specific referral_url.
 */

const PROVIDER_DEFAULT_REFERRAL_URLS: Record<string, string> = {
  'Get Licensed': 'https://www.get-licensed.co.uk',
  'UK Professional Development Academy': 'https://ukpda.org.uk',
}

export function getProviderDefaultReferralUrl(providerName: string): string | undefined {
  const trimmed = providerName.trim()
  if (!trimmed) return undefined
  return PROVIDER_DEFAULT_REFERRAL_URLS[trimmed]
}
