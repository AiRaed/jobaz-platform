import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import { redirect } from 'next/navigation'

/** Public login entry — forwards to auth login tab, preserving redirectTo when present. */
function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string | string[] }
}) {
  redirect(buildAuthLoginUrl(firstQueryValue(searchParams.redirectTo)))
}
