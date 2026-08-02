import AuthPageClient from './AuthPageClient'
import { parseAuthModeParam } from '@/lib/auth/mode'
import { sanitizeRedirectPath } from '@/lib/auth/redirect'

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value[0]
  return undefined
}

export default function AuthPage({
  searchParams,
}: {
  searchParams: { mode?: string | string[]; redirectTo?: string | string[] }
}) {
  const initialMode = parseAuthModeParam(firstQueryValue(searchParams.mode))
  const redirectTo = sanitizeRedirectPath(firstQueryValue(searchParams.redirectTo))

  return <AuthPageClient initialMode={initialMode} redirectTo={redirectTo} />
}
