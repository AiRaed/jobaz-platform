import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { normalizeSlug } from '@/lib/admin/career-library/guards'
import { mapRoleRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import {
  CAREER_LIBRARY_ACADEMIC_REQUIREMENTS,
  CAREER_LIBRARY_FIT_CLASSIFICATIONS,
  CAREER_LIBRARY_REGISTRATION_REQUIREMENTS,
  CAREER_LIBRARY_ROLE_CATEGORIES,
  CAREER_LIBRARY_SENIORITY_LEVELS,
  type CareerLibraryRoleInput,
  type CareerLibraryRoleStatus,
} from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

const ROLE_SELECT =
  '*, career_library_specialisms(name, field_id, career_library_fields(name)), career_library_stages(stage_key, label)'

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

/** GET /api/admin/career-library/roles — list/filter career roles */
export async function GET(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(req.url)
  const fieldId = searchParams.get('field_id')?.trim() || ''
  const specialismId = searchParams.get('specialism_id')?.trim() || ''
  const stageId = searchParams.get('stage_id')?.trim() || ''
  const stageKey = searchParams.get('stage_key')?.trim() || ''
  const status = searchParams.get('status')?.trim() || ''

  let specialismIdsForField: string[] | null = null
  if (fieldId && !specialismId) {
    const { data: specs, error: specErr } = await supabase
      .from('career_library_specialisms')
      .select('id')
      .eq('field_id', fieldId)
    if (specErr) {
      return NextResponse.json(
        { error: friendlyCareerLibraryError(specErr, 'Could not load career roles.') },
        { status: 500 }
      )
    }
    specialismIdsForField = (specs ?? []).map((s) => s.id)
    if (specialismIdsForField.length === 0) {
      return NextResponse.json({ roles: [] })
    }
  }

  let query = supabase
    .from('career_library_roles')
    .select(ROLE_SELECT)
    .order('priority', { ascending: true })
    .order('name', { ascending: true })

  if (specialismId) query = query.eq('specialism_id', specialismId)
  else if (specialismIdsForField) query = query.in('specialism_id', specialismIdsForField)
  if (stageId) query = query.eq('stage_id', stageId)
  if (status === 'draft' || status === 'approved' || status === 'disabled') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not load career roles.') },
      { status: 500 }
    )
  }

  let roles = (data ?? []).map(mapRoleRow)
  if (stageKey) {
    roles = roles.filter((r) => r.stageKey === stageKey)
  }

  return NextResponse.json({ roles })
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let input: CareerLibraryRoleInput
  try {
    input = (await req.json()) as CareerLibraryRoleInput
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const name = input.name?.trim()
  const specialismId = input.specialismId?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Role title is required.' }, { status: 400 })
  }
  if (!specialismId) {
    return NextResponse.json({ error: 'Choose a specialism.' }, { status: 400 })
  }

  const slug = normalizeSlug(input.slug, name)
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not create a valid slug. Use letters and numbers.' },
      { status: 400 }
    )
  }

  const roleCategory = isOneOf(input.roleCategory, CAREER_LIBRARY_ROLE_CATEGORIES)
    ? input.roleCategory
    : 'professional_practice'
  const seniorityLevel = isOneOf(input.seniorityLevel, CAREER_LIBRARY_SENIORITY_LEVELS)
    ? input.seniorityLevel
    : 'entry'
  const registration = isOneOf(
    input.professionalRegistrationRequirement,
    CAREER_LIBRARY_REGISTRATION_REQUIREMENTS
  )
    ? input.professionalRegistrationRequirement
    : 'none'
  const membership = isOneOf(
    input.professionalMembershipRequirement,
    CAREER_LIBRARY_REGISTRATION_REQUIREMENTS
  )
    ? input.professionalMembershipRequirement
    : 'none'
  const academicRequirement = isOneOf(
    input.academicRequirement,
    CAREER_LIBRARY_ACADEMIC_REQUIREMENTS
  )
    ? input.academicRequirement
    : 'degree_relevant'
  const fitClassification = isOneOf(input.fitClassification, CAREER_LIBRARY_FIT_CLASSIFICATIONS)
    ? input.fitClassification
    : 'realistic_next'

  let status: CareerLibraryRoleStatus = 'draft'
  if (input.status === 'approved' || input.status === 'disabled' || input.status === 'draft') {
    status = input.status
  }

  const priority =
    typeof input.priority === 'number' && Number.isFinite(input.priority)
      ? Math.trunc(input.priority)
      : typeof input.sortOrder === 'number' && Number.isFinite(input.sortOrder)
        ? Math.trunc(input.sortOrder)
        : 0

  const minYears =
    typeof input.minimumExperienceYears === 'number' && Number.isFinite(input.minimumExperienceYears)
      ? Math.max(0, Math.min(50, Math.trunc(input.minimumExperienceYears)))
      : 0

  const { data, error } = await supabase
    .from('career_library_roles')
    .insert({
      specialism_id: specialismId,
      stage_id: input.stageId?.trim() || null,
      name,
      slug,
      description: input.description?.trim() ?? '',
      role_category: roleCategory,
      seniority_level: seniorityLevel,
      minimum_experience_years: minYears,
      experience_requirement_label:
        input.experienceRequirementLabel?.trim() || 'Experience requirements to be confirmed',
      professional_registration_requirement: registration,
      professional_membership_requirement: membership,
      academic_requirement: academicRequirement,
      is_research_role: input.isResearchRole ?? false,
      is_academic_role: input.isAcademicRole ?? false,
      is_regulated_or_restricted: input.isRegulatedOrRestricted ?? false,
      eligibility_note: input.eligibilityNote?.trim() ?? '',
      fit_classification: fitClassification,
      priority,
      sort_order: priority,
      status,
      active: input.active ?? status !== 'disabled',
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    })
    .select(ROLE_SELECT)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this career role.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ role: mapRoleRow(data) }, { status: 201 })
}
