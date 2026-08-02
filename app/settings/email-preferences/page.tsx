import { redirect } from 'next/navigation'

export default function SettingsEmailPreferencesRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (typeof value === 'string') qs.set(key, value)
    else if (Array.isArray(value) && value[0]) qs.set(key, value[0])
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  redirect(`/email-preferences${suffix}`)
}
