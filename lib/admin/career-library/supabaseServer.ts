import { createServerSupabaseClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export function isCareerLibrarySupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(url && serviceKey)
}

export function getCareerLibrarySupabase(): SupabaseClient | null {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}
