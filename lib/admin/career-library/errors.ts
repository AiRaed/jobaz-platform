/**
 * Map Postgres / PostgREST errors to admin-safe messages.
 * Never expose raw SQL or constraint names to the UI.
 */

type DbErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
} | null | undefined

export function friendlyCareerLibraryError(
  error: DbErrorLike,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!error) return fallback

  const code = error.code ?? ''
  const msg = (error.message ?? '').toLowerCase()

  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    if (msg.includes('slug')) return 'That slug is already in use. Choose a different one.'
    if (msg.includes('name')) return 'That name is already in use. Choose a different one.'
    if (msg.includes('stage_key') || msg.includes('model_key')) {
      return 'That key already exists. Choose a different one.'
    }
    return 'A record with these details already exists.'
  }

  if (code === '23503' || msg.includes('foreign key')) {
    return 'This record is linked to something that is missing or cannot be changed.'
  }

  if (code === '23514' || msg.includes('check constraint')) {
    return 'Some values are invalid. Check status, slug format, and required fields.'
  }

  if (code === '42501' || msg.includes('permission') || msg.includes('rls')) {
    return 'You do not have permission to change the Career Library.'
  }

  return fallback
}

export function jsonError(message: string, status: number) {
  return { error: message, status }
}
