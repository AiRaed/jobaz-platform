/**
 * Match Work in My Profession library → public UK role results.
 * Fallback: exact → specialism any level → related specialisms in field.
 * Security/care: contextual experience options map to professional_level.
 * All fields use contextual Step 3 options with internal level mapping.
 */

import { DEFAULT_PROFESSION_GOAL, type ProfessionGoalValue } from './goals'
import {
  resolveExperienceSelection,
  type CareExperienceProfile,
  type ExperienceOption,
  type SecurityExperienceProfile,
} from './level-questions'
import { getProfessionalLevel, PROFESSIONAL_LEVELS } from './levels'
import {
  getProfessionFieldBySlug,
  getSpecialismBySlug,
  listRoles,
  listSpecialismsForField,
} from './lookup'
import {
  defaultCvFocusPoints,
  defaultRoleDescription,
} from './seed/builders'
import {
  WIP_COURSES_PLACEHOLDER,
  WIP_DEFAULT_RESULT_FRAMING,
  type PublicWipMatchResult,
  type PublicWipRoleCard,
  type WipMatchLabel,
} from './public-contract'
import type { ProfessionRole, ProfessionalLevelKey } from './types'
import { loadProfessionKnowledge } from './seed'

const LEVEL_ORDER = PROFESSIONAL_LEVELS.map((l) => l.key)

const LICENSED_SECURITY_TITLE_RE =
  /Door Supervisor|Retail Security Officer|Venue Security Officer|Security Officer|Facilities Security|Head Doorman|Self-employed Door/i
const ENTRY_SECURITY_TITLE_RE =
  /^Event Steward$|Event Security Steward|Venue Security Support|Door Supervisor Trainee/i

export type MatchProfessionLibraryInput = {
  field_slug: string
  specialism_slug: string
  /** Contextual Step 3 option id (preferred). */
  experience_option_id?: string
  /** Internal level — used for generic fields or as fallback. */
  professional_level?: ProfessionalLevelKey
  /** Optional; defaults to default_profession_route (goal question removed from CA). */
  selected_goal?: ProfessionGoalValue
}

function levelDistance(a: ProfessionalLevelKey, b: ProfessionalLevelKey): number {
  return Math.abs(LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b))
}

function requiresSia(role: ProfessionRole): boolean {
  const licence = role.licence_or_check_required || ''
  if (!licence.trim()) return false
  if (/not always|often required|may be|working towards/i.test(licence) && !/licence$/i.test(licence.trim())) {
    // Soft SIA mentions still count as progression for no-SIA users when title is licensed
    return /SIA Door Supervisor licence|SIA Security Guard licence|SIA CCTV|SIA Public Space/i.test(
      licence
    )
  }
  return /\bSIA\b/i.test(licence)
}

function labelForRole(
  role: ProfessionRole,
  exactLevel: boolean,
  option: ExperienceOption
): WipMatchLabel {
  if (option.security_profile === 'no_sia') {
    if (ENTRY_SECURITY_TITLE_RE.test(role.role_title) && !requiresSia(role)) {
      return role.realistic_start_now ? 'Best immediate route' : 'Good match'
    }
    if (LICENSED_SECURITY_TITLE_RE.test(role.role_title) || requiresSia(role)) {
      return 'Progression route'
    }
  }
  if (option.security_profile === 'sia_door') {
    if (/Door Supervisor|Retail Security Officer|Venue Security Officer/i.test(role.role_title)) {
      return 'Best immediate route'
    }
  }

  if (exactLevel && role.realistic_start_now) return 'Best immediate route'
  if (exactLevel) return 'Good match'
  if (
    role.professional_level === 'supervisor' ||
    role.professional_level === 'specialist_technician' ||
    role.professional_level === 'self_employed_owner'
  ) {
    return 'Progression route'
  }
  if (role.realistic_start_now) return 'Best immediate route'
  return 'Good match'
}

function securityTitleRank(
  title: string,
  profile: SecurityExperienceProfile | undefined
): number {
  if (profile === 'no_sia') {
    if (/^Event Steward$/i.test(title)) return 0
    if (/Event Security Steward/i.test(title)) return 1
    if (/Venue Security Support/i.test(title)) return 2
    if (/Door Supervisor Trainee/i.test(title)) return 3
    if (/Door Supervisor$/i.test(title)) return 20
    if (/Retail Security Officer/i.test(title)) return 21
    if (/Venue Security Officer/i.test(title)) return 22
    return 10
  }
  if (profile === 'sia_door') {
    if (/^Door Supervisor$/i.test(title)) return 0
    if (/Retail Security Officer/i.test(title)) return 1
    if (/Venue Security Officer/i.test(title)) return 2
    if (/Head Doorman|Security Supervisor|Team Leader/i.test(title)) return 8
    return 5
  }
  if (profile === 'steward_experience') {
    if (/Event Steward|Event Security Steward/i.test(title)) return 0
    if (/Door Supervisor|Retail Security|Venue Security/i.test(title)) return 5
    return 3
  }
  if (profile === 'cctv') {
    if (/CCTV Operator/i.test(title)) return 0
    if (/Control Room Operator/i.test(title)) return 1
    if (/Control Room Supervisor/i.test(title)) return 5
    return 4
  }
  if (profile === 'supervisor') {
    if (/Security Supervisor|Site Security Lead|Event Steward Supervisor/i.test(title)) return 0
    if (/Team Leader|Head Doorman/i.test(title)) return 1
    return 4
  }
  if (profile === 'self_employed') {
    if (/Self-employed/i.test(title)) return 0
    if (/Door Supervisor|Security Officer/i.test(title)) return 2
    return 5
  }
  return 5
}

function careTitleRank(title: string, profile: CareExperienceProfile | undefined): number {
  if (profile === 'informal_care') {
    if (
      /Care Support Assistant|Home Care Support Assistant|Community Support Assistant|Care Assistant Trainee/i.test(
        title
      )
    )
      return 0
    if (/Care Assistant|Home Care Assistant|Support Worker/i.test(title)) return 1
    return 5
  }
  if (profile === 'care_assistant') {
    if (/Care Assistant/i.test(title)) return 0
    if (/Home Care Assistant/i.test(title)) return 1
    if (/Support Worker/i.test(title)) return 2
    return 4
  }
  if (profile === 'support_worker') {
    if (/Support Worker/i.test(title)) return 0
    if (/Senior Support|Care Assistant/i.test(title)) return 2
    return 4
  }
  if (profile === 'home_care') {
    if (/Home Care|Domiciliary/i.test(title)) return 0
    if (/Care Assistant|Support Worker/i.test(title)) return 2
    return 4
  }
  if (profile === 'senior_care') {
    if (/Senior Care/i.test(title)) return 0
    if (/Shift Leader|Team Leader/i.test(title)) return 2
    return 4
  }
  if (profile === 'care_supervisor') {
    if (/Supervisor|Coordinator|Manager|Shift Leader/i.test(title)) return 0
    return 4
  }
  return 5
}

function toPublicCard(
  role: ProfessionRole,
  specialismName: string,
  exactLevel: boolean,
  option: ExperienceOption,
  fieldSlug: string,
  specialismSlug: string
): PublicWipRoleCard {
  const level = getProfessionalLevel(role.professional_level)
  const match_label = labelForRole(role, exactLevel, option)

  const usesLegacyDescription = /pathway within .+ — practical experience route/i.test(
    role.description
  )
  let description = role.description
  if (match_label === 'Progression route') {
    description = defaultRoleDescription(
      fieldSlug,
      specialismSlug,
      role.professional_level,
      false
    )
  } else if (usesLegacyDescription) {
    description = defaultRoleDescription(
      fieldSlug,
      specialismSlug,
      role.professional_level,
      Boolean(role.realistic_start_now)
    )
  }

  const genericCv =
    role.cv_focus_points.length === 0 ||
    role.cv_focus_points.every((p) =>
      /relevant UK workplace experience|tools, licences, and shift reliability|progression and team contribution/i.test(
        p
      )
    )

  return {
    id: role.id,
    role_title: role.role_title,
    match_label,
    start_now: Boolean(role.realistic_start_now),
    licence_or_check: role.licence_or_check_required?.trim() || null,
    description,
    cv_focus_points: (genericCv
      ? defaultCvFocusPoints(fieldSlug, specialismSlug)
      : role.cv_focus_points
    ).slice(0, 4),
    uk_role_keywords: role.uk_role_keywords.slice(0, 8),
    professional_level_label: level?.label ?? role.professional_level,
    specialism_name: specialismName,
  }
}

function sortCards(
  cards: PublicWipRoleCard[],
  option: ExperienceOption
): PublicWipRoleCard[] {
  const labelRank: Record<WipMatchLabel, number> = {
    'Best immediate route': 0,
    'Good match': 1,
    'Progression route': 2,
  }
  return [...cards].sort((a, b) => {
    const secA = securityTitleRank(a.role_title, option.security_profile)
    const secB = securityTitleRank(b.role_title, option.security_profile)
    if (option.security_profile && secA !== secB) return secA - secB

    const careA = careTitleRank(a.role_title, option.care_profile)
    const careB = careTitleRank(b.role_title, option.care_profile)
    if (option.care_profile && careA !== careB) return careA - careB

    // Default profession route: Start Now first, then progression.
    if (a.start_now !== b.start_now) return a.start_now ? -1 : 1

    const lr = labelRank[a.match_label] - labelRank[b.match_label]
    if (lr !== 0) return lr
    return a.role_title.localeCompare(b.role_title)
  })
}

function extractRequirements(roles: ProfessionRole[]): string[] {
  const found = new Set<string>()
  const patterns: Array<{ re: RegExp; label: string }> = [
    { re: /\bSIA\b/i, label: 'SIA licence' },
    { re: /\bDBS\b/i, label: 'DBS check' },
    { re: /\bCSCS\b/i, label: 'CSCS card' },
    { re: /\bFLT\b|forklift/i, label: 'Forklift / FLT certification' },
    { re: /\bPCV\b|Category\s*D|bus\s*driver|coach\s*driver/i, label: 'PCV licence' },
    { re: /\bHGV\b|\bLGV\b|Class\s*[12]|goods\s*vehicle/i, label: 'HGV / LGV licence' },
    { re: /\bPHV\b|taxi\s*licence|private\s*hire/i, label: 'Taxi / PHV licence' },
    { re: /driving licence|full (uk )?licence/i, label: 'Driving licence' },
    { re: /insurance/i, label: 'Insurance' },
    { re: /portfolio/i, label: 'Portfolio' },
    { re: /\btools\b/i, label: 'Own tools' },
    { re: /trade competence|qualified|part p|competence/i, label: 'Trade competence' },
  ]

  for (const role of roles) {
    const blob = `${role.licence_or_check_required ?? ''} ${role.typical_entry_requirement} ${role.description}`
    for (const p of patterns) {
      if (p.re.test(blob)) found.add(p.label)
    }
  }
  return Array.from(found)
}

function dedupeRoles(roles: ProfessionRole[]): ProfessionRole[] {
  const seen = new Set<string>()
  const out: ProfessionRole[] = []
  for (const role of roles) {
    const key = `${role.role_title.trim().toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(role)
  }
  return out
}

function collectSecurityPool(
  fieldSlug: string,
  specialismSlug: string,
  level: ProfessionalLevelKey,
  option: ExperienceOption
): ProfessionRole[] {
  const primary = listRoles({
    field_slug: fieldSlug,
    specialism_slug: specialismSlug,
    professional_level: level,
  })
  const relatedLevels = [level, ...(option.related_levels || [])]
  const fromSpecialism: ProfessionRole[] = []
  for (const lv of relatedLevels) {
    fromSpecialism.push(
      ...listRoles({
        field_slug: fieldSlug,
        specialism_slug: specialismSlug,
        professional_level: lv,
      })
    )
  }

  // Pull realistic entry / licensed titles from related security specialisms
  const relatedSpecs = listSpecialismsForField(fieldSlug)
  const fromField: ProfessionRole[] = []
  for (const spec of relatedSpecs) {
    for (const lv of relatedLevels) {
      fromField.push(
        ...listRoles({
          field_slug: fieldSlug,
          specialism_slug: spec.slug,
          professional_level: lv,
        })
      )
    }
  }

  if (option.security_profile === 'no_sia') {
    return dedupeRoles([...primary, ...fromSpecialism, ...fromField]).filter((r) => {
      // Prefer steward/support + allow licensed as progression later
      return (
        ENTRY_SECURITY_TITLE_RE.test(r.role_title) ||
        LICENSED_SECURITY_TITLE_RE.test(r.role_title) ||
        r.specialism_id.includes(specialismSlug)
      )
    })
  }

  if (option.security_profile === 'sia_door') {
    return dedupeRoles([...primary, ...fromSpecialism, ...fromField]).filter((r) =>
      /Door Supervisor|Retail Security Officer|Venue Security Officer|Head Doorman|Self-employed Door/i.test(
        r.role_title
      )
    )
  }

  if (option.security_profile === 'cctv') {
    return dedupeRoles(
      listRoles({ field_slug: fieldSlug, specialism_slug: 'cctv-control-room' }).concat(
        fromSpecialism
      )
    )
  }

  return dedupeRoles([...primary, ...fromSpecialism])
}

export function matchProfessionLibrary(
  input: MatchProfessionLibraryInput
): PublicWipMatchResult {
  const field = getProfessionFieldBySlug(input.field_slug)
  const specialism = getSpecialismBySlug(input.field_slug, input.specialism_slug)
  const resolved = resolveExperienceSelection(
    input.field_slug,
    input.experience_option_id,
    input.professional_level
  )
  const selected_goal: ProfessionGoalValue = DEFAULT_PROFESSION_GOAL

  if (!field || !specialism || !resolved) {
    const levelMeta = input.professional_level
      ? getProfessionalLevel(input.professional_level)
      : null
    return {
      pathway: 'work_in_my_profession',
      result_source: 'work_in_profession_library',
      headline: 'Your profession pathway',
      result_framing: WIP_DEFAULT_RESULT_FRAMING,
      profession_field: field?.name ?? input.field_slug,
      specialism: specialism?.name ?? input.specialism_slug,
      experience_result_label: 'Professional level',
      experience_display_label: levelMeta?.label ?? input.professional_level ?? '—',
      professional_level: levelMeta?.label ?? input.professional_level ?? '—',
      professional_level_key: (input.professional_level || 'beginner') as ProfessionalLevelKey,
      experience_option_id: input.experience_option_id ?? null,
      experience_mode: 'generic',
      selected_goal,
      selected_goal_label: 'Profession route',
      matched_role_count: 0,
      roles: [],
      requirements: [],
      fallback_used: true,
      fallback_message:
        'We could not find a precise match yet, but these related UK roles may be useful.',
      courses_note: WIP_COURSES_PLACEHOLDER,
    }
  }

  const { config, option } = resolved
  const professional_level = option.mapped_level
  const levelMeta = getProfessionalLevel(professional_level)

  let fallback_used = false
  let matchTier: 'exact' | 'specialism' | 'related' = 'exact'

  let matched: ProfessionRole[] =
    field.slug === 'security-facilities'
      ? collectSecurityPool(field.slug, specialism.slug, professional_level, option)
      : listRoles({
          field_slug: field.slug,
          specialism_slug: specialism.slug,
          professional_level,
        })

  const exactIds = new Set(
    listRoles({
      field_slug: field.slug,
      specialism_slug: specialism.slug,
      professional_level,
    }).map((r) => r.id)
  )

  if (matched.length === 0) {
    fallback_used = true
    matchTier = 'specialism'
    matched = listRoles({
      field_slug: field.slug,
      specialism_slug: specialism.slug,
    }).sort(
      (a, b) =>
        levelDistance(a.professional_level, professional_level) -
        levelDistance(b.professional_level, professional_level)
    )
  }

  // Soft-fill from related levels on same specialism (contextual answers often map nearby levels)
  if (field.slug !== 'security-facilities') {
    const fillLevels = [professional_level, ...(option.related_levels || [])]
    const extras: ProfessionRole[] = []
    for (const lv of fillLevels) {
      extras.push(
        ...listRoles({
          field_slug: field.slug,
          specialism_slug: specialism.slug,
          professional_level: lv,
        })
      )
    }
    matched = dedupeRoles([...matched, ...extras])

    if (matched.length < 3) {
      const more = listRoles({
        field_slug: field.slug,
        specialism_slug: specialism.slug,
      }).filter((r) => !exactIds.has(r.id))
      matched = dedupeRoles([...matched, ...more])
    }
  }

  if (matched.length === 0) {
    fallback_used = true
    matchTier = 'related'
    const relatedSpecs = listSpecialismsForField(field.slug).filter((s) => s.id !== specialism.id)
    const related: ProfessionRole[] = []
    for (const spec of relatedSpecs) {
      related.push(
        ...listRoles({
          field_slug: field.slug,
          specialism_slug: spec.slug,
          professional_level,
        })
      )
    }
    if (related.length < 3) {
      for (const spec of relatedSpecs) {
        related.push(
          ...listRoles({
            field_slug: field.slug,
            specialism_slug: spec.slug,
          })
        )
      }
    }
    matched = dedupeRoles(related).sort(
      (a, b) =>
        levelDistance(a.professional_level, professional_level) -
        levelDistance(b.professional_level, professional_level)
    )
  }

  matched = dedupeRoles(matched)

  const knowledge = loadProfessionKnowledge()
  const specNameById = new Map(knowledge.specialisms.map((s) => [s.id, s.name]))

  const cards = sortCards(
    matched.slice(0, 12).map((role) =>
      toPublicCard(
        role,
        specNameById.get(role.specialism_id) ?? specialism.name,
        matchTier === 'exact' && role.professional_level === professional_level,
        option,
        field.slug,
        specialism.slug
      )
    ),
    option
  ).slice(0, 6)

  const roles = cards.length >= 3 ? cards.slice(0, Math.min(6, cards.length)) : cards

  return {
    pathway: 'work_in_my_profession',
    result_source: 'work_in_profession_library',
    headline: 'Your profession pathway',
    result_framing: WIP_DEFAULT_RESULT_FRAMING,
    profession_field: field.name,
    specialism: specialism.name,
    experience_result_label: config.result_label,
    experience_display_label: option.display_label,
    professional_level: levelMeta?.label ?? professional_level,
    professional_level_key: professional_level,
    experience_option_id: option.id,
    experience_mode: config.mode,
    selected_goal,
    selected_goal_label: 'Profession route',
    matched_role_count: roles.length,
    roles,
    requirements: extractRequirements(matched.slice(0, 12)),
    fallback_used,
    fallback_message: fallback_used
      ? 'We could not find a precise match yet, but these related UK roles may be useful.'
      : null,
    courses_note: WIP_COURSES_PLACEHOLDER,
  }
}

/** Levels that have at least one role for this field + specialism (generic mode). */
export function listLevelsForSpecialism(
  fieldSlug: string,
  specialismSlug: string
): typeof PROFESSIONAL_LEVELS {
  const roles = listRoles({ field_slug: fieldSlug, specialism_slug: specialismSlug })
  const keys = new Set(roles.map((r) => r.professional_level))
  const filtered = PROFESSIONAL_LEVELS.filter((l) => keys.has(l.key))
  return filtered.length > 0 ? filtered : PROFESSIONAL_LEVELS
}
