const ADMIN_EMAILS_ENV = 'NEXT_PUBLIC_ADMIN_EMAILS'

/** Built-in admin allowlist (always active; env adds more admins). */
export const BUILTIN_ADMIN_EMAILS = ['raedmahfoud@hotmail.com'] as const

let missingEnvWarned = false

function parseEnvAdminEmails(): string[] {
  const raw = process.env[ADMIN_EMAILS_ENV]
  if (!raw?.trim()) {
    if (process.env.NODE_ENV === 'development' && !missingEnvWarned) {
      missingEnvWarned = true
      console.warn(
        `[admin] ${ADMIN_EMAILS_ENV} is not set. Built-in admin emails still apply.`
      )
    }
    return []
  }
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Parses admin allowlist from built-in emails + NEXT_PUBLIC_ADMIN_EMAILS (comma-separated).
 * Safe for client and server (NEXT_PUBLIC_*).
 */
export function getAdminEmails(): string[] {
  return [...new Set([...BUILTIN_ADMIN_EMAILS, ...parseEnvAdminEmails()])]
}

export function isAdminUser(userEmail: string | null | undefined): boolean {
  if (!userEmail?.trim()) return false
  return getAdminEmails().includes(userEmail.trim().toLowerCase())
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return isAdminUser(email)
}
