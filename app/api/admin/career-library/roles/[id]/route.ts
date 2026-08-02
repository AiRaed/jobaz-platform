import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import {
  countRoleLearningLinks,
  normalizeSlug,
} from '@/lib/admin/career-library/guards'
import { mapRoleRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import {
  CAREER_LIBRARY_ACADEMIC_REQUIREMENTS,
  CAREER_LIBRARY_FIT_CLASSIFICATIONS,
  CAREER_LIBRARY_REGISTRATION_REQUIREMENTS,
  CAREER_LIBRARY_ROLE_CATEGORIES,
  CAREER_LIBRARY_SENIORITY_LEVELS,
  type CareerLibraryRoleStatus,
} from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

const ROLE_SELECT =
  '*, career_library_specialisms(name, field_id, career_library_fields(name)), career_library_stages(stage_key, label)'

type PatchBody = {
  specialismId?: string
  stageId?: string | null
  name?: string
  slug?: string
  description?: string
  roleCategory?: string
  seniorityLevel?: string
  minimumExperienceYears?: number
  experienceRequirementLabel?: string
  professionalRegistrationRequirement?: string
  professionalMembershipRequirement?: string
  academicRequirement?: string
  isResearchRole?: boolean
  isAcademicRole?: boolean
  isRegulatedOrRestricted?: boolean
  eligibilityNote?: string
  fitClassification?: string
  priority?: number
  status?: CareerLibraryRoleStatus
  active?: boolean
  sortOrder?: number
  metadata?: Record<string, unknown>
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing role id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}

  if (typeof body.specialismId === 'string' && body.specialismId.trim()) {
    patch.specialism_id = body.specialismId.trim()
  }
  if (body.stageId === null) patch.stage_id = null
  else if (typeof body.stageId === 'string') {
    patch.stage_id = body.stageId.trim() || null
  }
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Role title cannot be empty.' }, { status: 400 })
    }
    patch.name = name
  }
  if (typeof body.slug === 'string') {
    const slug = normalizeSlug(body.slug, body.name ?? body.slug)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is invalid.' }, { status: 400 })
    }
    patch.slug = slug
  }
  if (typeof body.description === 'string') patch.description = body.description.trim()

  if (isOneOf(body.roleCategory, CAREER_LIBRARY_ROLE_CATEGORIES)) {
    patch.role_category = body.roleCategory
  } else if (body.roleCategory !== undefined) {
    return NextResponse.json({ error: 'Role category is invalid.' }, { status: 400 })
  }

  if (isOneOf(body.seniorityLevel, CAREER_LIBRARY_SENIORITY_LEVELS)) {
    patch.seniority_level = body.seniorityLevel
  } else if (body.seniorityLevel !== undefined) {
    return NextResponse.json({ error: 'Seniority level is invalid.' }, { status: 400 })
  }

  if (typeof body.minimumExperienceYears === 'number' && Number.isFinite(body.minimumExperienceYears)) {
    const years = Math.trunc(body.minimumExperienceYears)
    if (years < 0 || years > 50) {
      return NextResponse.json(
        { error: 'Minimum experience must be between 0 and 50 years.' },
        { status: 400 }
      )
    }
    patch.minimum_experience_years = years
  }

  if (typeof body.experienceRequirementLabel === 'string') {
    patch.experience_requirement_label = body.experienceRequirementLabel.trim()
  }

  if (isOneOf(body.professionalRegistrationRequirement, CAREER_LIBRARY_REGISTRATION_REQUIREMENTS)) {
    patch.professional_registration_requirement = body.professionalRegistrationRequirement
  } else if (body.professionalRegistrationRequirement !== undefined) {
    return NextResponse.json(
      { error: 'Professional registration requirement is invalid.' },
      { status: 400 }
    )
  }

  if (isOneOf(body.professionalMembershipRequirement, CAREER_LIBRARY_REGISTRATION_REQUIREMENTS)) {
    patch.professional_membership_requirement = body.professionalMembershipRequirement
  } else if (body.professionalMembershipRequirement !== undefined) {
    return NextResponse.json(
      { error: 'Professional membership requirement is invalid.' },
      { status: 400 }
    )
  }

  if (isOneOf(body.academicRequirement, CAREER_LIBRARY_ACADEMIC_REQUIREMENTS)) {
    patch.academic_requirement = body.academicRequirement
  } else if (body.academicRequirement !== undefined) {
    return NextResponse.json({ error: 'Academic requirement is invalid.' }, { status: 400 })
  }

  if (typeof body.isResearchRole === 'boolean') patch.is_research_role = body.isResearchRole
  if (typeof body.isAcademicRole === 'boolean') patch.is_academic_role = body.isAcademicRole
  if (typeof body.isRegulatedOrRestricted === 'boolean') {
    patch.is_regulated_or_restricted = body.isRegulatedOrRestricted
  }
  if (typeof body.eligibilityNote === 'string') {
    patch.eligibility_note = body.eligibilityNote.trim()
  }

  if (isOneOf(body.fitClassification, CAREER_LIBRARY_FIT_CLASSIFICATIONS)) {
    patch.fit_classification = body.fitClassification
  } else if (body.fitClassification !== undefined) {
    return NextResponse.json({ error: 'Fit classification is invalid.' }, { status: 400 })
  }

  if (typeof body.priority === 'number' && Number.isFinite(body.priority)) {
    const priority = Math.trunc(body.priority)
    patch.priority = priority
    patch.sort_order = priority
  } else if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
    const priority = Math.trunc(body.sortOrder)
    patch.priority = priority
    patch.sort_order = priority
  }

  if (body.status === 'draft' || body.status === 'approved' || body.status === 'disabled') {
    patch.status = body.status
    if (body.active === undefined) patch.active = body.status !== 'disabled'
  }
  if (typeof body.active === 'boolean') patch.active = body.active

  if (body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)) {
    patch.metadata = body.metadata
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_roles')
    .update(patch)
    .eq('id', id)
    .select(ROLE_SELECT)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this career role.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ role: mapRoleRow(data) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing role id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const links = await countRoleLearningLinks(supabase, id)
  if (links < 0) {
    return NextResponse.json(
      { error: 'Could not check role dependencies. Please try again.' },
      { status: 500 }
    )
  }

  const { error } = await supabase.from('career_library_roles').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this career role.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, unlinkedLearningOptions: links })
}
