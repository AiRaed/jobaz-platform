/**
 * Graceful placeholders when Career Knowledge Library fields are empty.
 */

import type { CareerPathwayKnowledge, PathwayTextBlock } from './types'

export function placeholderBlock(label: string, message: string): PathwayTextBlock {
  return {
    label,
    items: [message],
    is_placeholder: true,
  }
}

export function filledBlock(label: string, items: string[]): PathwayTextBlock {
  const clean = items
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/will be added|structured responsibilities|coming soon in the career knowledge/i.test(s))
  if (!clean.length) {
    return { label, items: [], is_placeholder: true }
  }
  return { label, items: clean, is_placeholder: false }
}

export function emptyPathwayKnowledge(
  pathwayId: string,
  opts: {
    role_title: string
    field_name: string
    specialism_name: string
    stage_label?: string | null
  }
): CareerPathwayKnowledge {
  return {
    pathway_id: pathwayId,
    role_title: opts.role_title,
    field_name: opts.field_name,
    specialism_name: opts.specialism_name,
    stage_label: opts.stage_label ?? null,
    source: 'placeholder',
    about: placeholderBlock(
      'About this role',
      'A fuller role profile will appear here once published in the Career Knowledge Library.'
    ),
    responsibilities: placeholderBlock(
      'Typical responsibilities',
      'Typical responsibilities will be added as this role is enriched in the library.'
    ),
    salary: placeholderBlock(
      'Typical UK salary',
      'UK salary guidance is not yet available for this role.'
    ),
    career_progression: placeholderBlock(
      'Career progression',
      'Progression guidance will appear once stage pathways are linked in the library.'
    ),
    required_qualifications: placeholderBlock(
      'Required qualifications',
      'Qualification requirements will be listed when available in the library.'
    ),
    professional_registrations: placeholderBlock(
      'Professional registrations',
      'Registration requirements will be listed when available in the library.'
    ),
    useful_licences: placeholderBlock(
      'Useful licences',
      'Licence guidance is not yet available for this role.'
    ),
    recommended_courses: {
      label: 'Recommended courses',
      items: [],
      is_placeholder: true,
    },
    required_skills: placeholderBlock(
      'Required skills',
      'Skill requirements will be listed when available in the library.'
    ),
    transferable_skills: placeholderBlock(
      'Transferable skills',
      'Transferable skills will be listed when available in the library.'
    ),
    typical_employers: placeholderBlock(
      'Typical employers',
      'Typical employers will be listed when available in the library.'
    ),
    next_progression_roles: {
      label: 'Next progression roles',
      items: [],
      is_placeholder: true,
    },
    library_note: null,
  }
}
