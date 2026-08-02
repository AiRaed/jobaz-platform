import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AVAILABILITY_OPTIONS,
  BARRIERS,
  CAREER_STATUSES,
  CURRENT_SITUATIONS,
  EXPERIENCE_LEVELS,
  INTEREST_CATEGORIES,
  JOB_TYPES,
  MAIN_GOALS,
  REMOTE_PREFERENCES,
} from './constants'
import { emptyCareerIdentity, type UserCareerIdentity } from './types'

export async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  return !/does not exist|relation|schema cache/i.test(error.message || '')
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x).trim()).filter(Boolean)
}

function pickEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  const s = typeof v === 'string' ? v.trim() : ''
  if (!s) return null
  return (allowed as readonly string[]).includes(s) ? (s as T) : null
}

export function mapCareerIdentityRow(row: Record<string, unknown>): UserCareerIdentity {
  return {
    id: row.id ? String(row.id) : undefined,
    user_id: String(row.user_id),
    current_situation: pickEnum(row.current_situation, CURRENT_SITUATIONS),
    main_goal: pickEnum(row.main_goal, MAIN_GOALS),
    preferred_route: row.preferred_route ? String(row.preferred_route) : null,
    target_role: row.target_role ? String(row.target_role) : null,
    career_status: pickEnum(row.career_status, CAREER_STATUSES) ?? 'exploring',
    preferred_location: row.preferred_location ? String(row.preferred_location) : null,
    remote_preference: pickEnum(row.remote_preference, REMOTE_PREFERENCES),
    job_type: asStringArray(row.job_type).filter((t) =>
      (JOB_TYPES as readonly string[]).includes(t)
    ) as UserCareerIdentity['job_type'],
    availability: pickEnum(row.availability, AVAILABILITY_OPTIONS),
    has_driving_licence: Boolean(row.has_driving_licence),
    has_own_car: Boolean(row.has_own_car),
    willing_to_train: row.willing_to_train !== false,
    preferred_salary: row.preferred_salary ? String(row.preferred_salary) : null,
    skills: asStringArray(row.skills),
    industries_experience: asStringArray(row.industries_experience),
    experience_level: pickEnum(row.experience_level, EXPERIENCE_LEVELS),
    languages: asStringArray(row.languages),
    education_summary: row.education_summary ? String(row.education_summary) : null,
    qualifications: asStringArray(row.qualifications),
    licences: asStringArray(row.licences),
    interested_in_courses: row.interested_in_courses !== false,
    interested_in_jobs: row.interested_in_jobs !== false,
    interested_in_local_opportunities: row.interested_in_local_opportunities !== false,
    interested_in_side_income: Boolean(row.interested_in_side_income),
    interested_in_business_ideas: Boolean(row.interested_in_business_ideas),
    interested_categories: asStringArray(row.interested_categories).filter((c) =>
      (INTEREST_CATEGORIES as readonly string[]).includes(c)
    ),
    short_bio: row.short_bio ? String(row.short_bio) : null,
    looking_for: row.looking_for ? String(row.looking_for) : null,
    barriers: asStringArray(row.barriers).filter((b) =>
      (BARRIERS as readonly string[]).includes(b)
    ) as UserCareerIdentity['barriers'],
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  }
}

export function sanitizeCareerIdentityPatch(
  body: Record<string, unknown>,
  userId: string
): UserCareerIdentity {
  const base = emptyCareerIdentity(userId)
  const merged = { ...base, ...mapCareerIdentityRow({ ...base, ...body, user_id: userId }) }
  return {
    ...merged,
    preferred_route: merged.preferred_route?.slice(0, 160) || null,
    target_role: merged.target_role?.slice(0, 160) || null,
    preferred_location: merged.preferred_location?.slice(0, 120) || null,
    preferred_salary: merged.preferred_salary?.slice(0, 80) || null,
    education_summary: merged.education_summary?.slice(0, 800) || null,
    short_bio: merged.short_bio?.slice(0, 1200) || null,
    looking_for: merged.looking_for?.slice(0, 800) || null,
    skills: merged.skills.slice(0, 40),
    industries_experience: merged.industries_experience.slice(0, 20),
    languages: merged.languages.slice(0, 20),
    qualifications: merged.qualifications.slice(0, 30),
    licences: merged.licences.slice(0, 30),
    interested_categories: merged.interested_categories.slice(0, 20),
    barriers: merged.barriers.slice(0, 20),
    job_type: merged.job_type.slice(0, 10),
  }
}

export function toDbPayload(identity: UserCareerIdentity) {
  return {
    user_id: identity.user_id,
    current_situation: identity.current_situation,
    main_goal: identity.main_goal,
    preferred_route: identity.preferred_route,
    target_role: identity.target_role,
    career_status: identity.career_status,
    preferred_location: identity.preferred_location,
    remote_preference: identity.remote_preference,
    job_type: identity.job_type,
    availability: identity.availability,
    has_driving_licence: identity.has_driving_licence,
    has_own_car: identity.has_own_car,
    willing_to_train: identity.willing_to_train,
    preferred_salary: identity.preferred_salary,
    skills: identity.skills,
    industries_experience: identity.industries_experience,
    experience_level: identity.experience_level,
    languages: identity.languages,
    education_summary: identity.education_summary,
    qualifications: identity.qualifications,
    licences: identity.licences,
    interested_in_courses: identity.interested_in_courses,
    interested_in_jobs: identity.interested_in_jobs,
    interested_in_local_opportunities: identity.interested_in_local_opportunities,
    interested_in_side_income: identity.interested_in_side_income,
    interested_in_business_ideas: identity.interested_in_business_ideas,
    interested_categories: identity.interested_categories,
    short_bio: identity.short_bio,
    looking_for: identity.looking_for,
    barriers: identity.barriers,
    updated_at: new Date().toISOString(),
  }
}

export async function loadCareerIdentity(
  supabase: SupabaseClient,
  userId: string
): Promise<{ identity: UserCareerIdentity; tableMissing: boolean }> {
  if (!(await tableExists(supabase, 'user_career_identity'))) {
    return { identity: emptyCareerIdentity(userId), tableMissing: true }
  }
  const { data, error } = await supabase
    .from('user_career_identity')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) {
    return { identity: emptyCareerIdentity(userId), tableMissing: false }
  }
  return { identity: mapCareerIdentityRow(data as Record<string, unknown>), tableMissing: false }
}

export async function upsertCareerIdentity(
  supabase: SupabaseClient,
  identity: UserCareerIdentity
): Promise<UserCareerIdentity> {
  const payload = toDbPayload(identity)
  const { data, error } = await supabase
    .from('user_career_identity')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error || !data) throw new Error(error?.message || 'Could not save career identity')
  return mapCareerIdentityRow(data as Record<string, unknown>)
}
