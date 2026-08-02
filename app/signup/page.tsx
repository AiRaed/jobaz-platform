import { redirect } from 'next/navigation'
import { sanitizeRedirectPath } from '@/lib/auth/redirect'

type Props = {
  searchParams?: { redirectTo?: string }
}

/** Public signup entry — forwards to auth signup tab (preserves post-signup redirect). */
export default function SignupPage({ searchParams }: Props) {
  const params = new URLSearchParams({ mode: 'signup' })
  const safe = sanitizeRedirectPath(searchParams?.redirectTo)
  if (safe) params.set('redirectTo', safe)
  redirect(`/auth?${params.toString()}`)
}
