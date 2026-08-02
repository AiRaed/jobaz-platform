import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type ProofreadingSupabaseClient = ReturnType<typeof createServerClient>

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}

export function proofreadingProjectsJsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      ok: false,
      projects: [],
      error: message,
      message,
      ...extra,
    },
    { status }
  )
}

export function proofreadingProjectsJsonSuccess(
  projects: unknown[],
  extra?: Record<string, unknown>
) {
  return NextResponse.json({
    ok: true,
    projects,
    ...extra,
  })
}

export function createProofreadingServerClient(): ProofreadingSupabaseClient | null {
  if (!isSupabaseConfigured()) return null

  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in route handler
          }
        },
      },
    }
  )
}
