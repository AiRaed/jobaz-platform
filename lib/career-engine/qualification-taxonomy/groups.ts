/**
 * Canonical qualification groups + contextual sub-types.
 */

import type { QualificationGroupDef, QualificationGroupId, QualificationTypeDef } from './types'

const t = (
  id: string,
  label: string,
  uk_level: QualificationTypeDef['uk_level'],
  kind: QualificationTypeDef['kind'],
  extra?: Partial<QualificationTypeDef>
): QualificationTypeDef => ({
  id,
  label,
  uk_level,
  kind,
  not_generic_masters: extra?.not_generic_masters ?? false,
  is_integrated_masters: extra?.is_integrated_masters ?? false,
  help_text: extra?.help_text,
})

export const QUALIFICATION_GROUPS: QualificationGroupDef[] = [
  {
    id: 'no_formal',
    label: 'No formal qualification',
    help_text: 'You do not currently hold a formal qualification for this pathway.',
    types: [t('none', 'No formal qualification', 'unknown', 'none')],
  },
  {
    id: 'school',
    label: 'School-level qualification',
    types: [
      t('entry_level', 'Entry Level', 'entry', 'academic'),
      t('gcse_l1_l2', 'GCSE / Level 1–2', 'level_2', 'academic'),
      t('a_level_l3', 'A level / Level 3', 'level_3', 'academic'),
      t('school_equivalent', 'Equivalent school qualification', 'unknown', 'academic'),
    ],
  },
  {
    id: 'college_vocational',
    label: 'College / vocational qualification',
    types: [
      t('certificate', 'Certificate', 'unknown', 'vocational'),
      t('diploma', 'Diploma', 'unknown', 'vocational'),
      t('nvq', 'NVQ', 'unknown', 'vocational'),
      t('btec', 'BTEC', 'unknown', 'vocational'),
      t('t_level', 'T Level', 'level_3', 'vocational'),
      t('hnc', 'HNC / Level 4', 'level_4', 'vocational'),
      t('hnd', 'HND / Level 5', 'level_5', 'vocational'),
      t('foundation_degree', 'Foundation Degree', 'level_5', 'academic'),
      t('apprenticeship', 'Apprenticeship qualification', 'unknown', 'vocational'),
      t('other_vocational', 'Other vocational qualification', 'unknown', 'vocational'),
    ],
  },
  {
    id: 'undergraduate',
    label: 'Undergraduate qualification',
    types: [
      t('bachelors', 'Bachelor’s degree', 'level_6', 'academic'),
      t('bachelors_honours', 'Bachelor’s degree with honours', 'level_6', 'academic'),
      t(
        'integrated_undergraduate',
        'Integrated undergraduate degree',
        'level_6',
        'academic',
        { help_text: 'Where the award remains undergraduate (not an integrated master’s).' }
      ),
      t('other_undergraduate', 'Other undergraduate qualification', 'level_6', 'academic'),
    ],
  },
  {
    id: 'postgraduate',
    label: 'Postgraduate qualification',
    types: [
      t('pgcert', 'Postgraduate Certificate', 'level_7', 'academic'),
      t('pgce', 'PGCE', 'level_7', 'teaching', {
        not_generic_masters: true,
        help_text: 'Teaching qualification — not treated as a generic Master’s degree.',
      }),
      t('pgdip', 'Postgraduate Diploma', 'level_7', 'academic'),
      t('masters', 'Master’s degree', 'level_7', 'academic'),
      t('integrated_masters', 'Integrated Master’s (e.g. MEng)', 'level_7', 'academic', {
        is_integrated_masters: true,
        help_text: 'e.g. MEng, MSci — distinguishable from a taught MSc.',
      }),
      t('other_postgraduate', 'Other postgraduate qualification', 'level_7', 'academic'),
    ],
  },
  {
    id: 'doctoral',
    label: 'Doctoral qualification',
    types: [
      t('phd', 'PhD / Doctorate', 'level_8', 'academic'),
      t('professional_doctorate', 'Professional doctorate', 'level_8', 'academic'),
      t('other_doctoral', 'Other doctoral qualification', 'level_8', 'academic'),
    ],
  },
  {
    id: 'professional',
    label: 'Professional qualification or licence',
    help_text: 'Separate from academic degree level — registration and licences are tracked on their own.',
    types: [
      t('professional_certificate', 'Professional certificate', 'unknown', 'professional_certificate'),
      t('professional_diploma', 'Professional diploma', 'unknown', 'professional_certificate'),
      t('professional_registration', 'Professional registration', 'unknown', 'professional_registration'),
      t('statutory_licence', 'Statutory licence', 'unknown', 'statutory_licence'),
      t('industry_accreditation', 'Industry accreditation', 'unknown', 'industry_accreditation'),
      t('other_professional', 'Other professional qualification', 'unknown', 'professional_certificate'),
    ],
  },
  {
    id: 'overseas',
    label: 'Overseas qualification',
    asks_overseas_context: true,
    help_text: 'Tell us the level overseas, then whether UK equivalence is confirmed.',
    types: [
      t('overseas_school', 'Overseas school qualification', 'unknown', 'academic'),
      t('overseas_college', 'Overseas college / vocational qualification', 'unknown', 'vocational'),
      t('overseas_undergraduate', 'Overseas undergraduate degree', 'level_6', 'academic'),
      t('overseas_postgraduate', 'Overseas postgraduate degree', 'level_7', 'academic'),
      t('overseas_doctorate', 'Overseas doctorate', 'level_8', 'academic'),
      t('overseas_professional', 'Overseas professional qualification', 'unknown', 'professional_certificate'),
    ],
  },
  {
    id: 'other_unsure',
    label: 'Other / unsure',
    types: [t('other', 'Other / unsure', 'unknown', 'other')],
  },
]

const GROUP_BY_ID = new Map(QUALIFICATION_GROUPS.map((g) => [g.id, g]))
const TYPE_BY_ID = new Map<string, QualificationTypeDef & { group_id: QualificationGroupId }>()

for (const g of QUALIFICATION_GROUPS) {
  for (const type of g.types) {
    TYPE_BY_ID.set(type.id, { ...type, group_id: g.id })
  }
}

export function getQualificationGroup(id: string | null | undefined): QualificationGroupDef | null {
  if (!id) return null
  return GROUP_BY_ID.get(id as QualificationGroupId) ?? null
}

export function getQualificationType(
  typeId: string | null | undefined
): (QualificationTypeDef & { group_id: QualificationGroupId }) | null {
  if (!typeId) return null
  return TYPE_BY_ID.get(typeId) ?? null
}

export function listQualificationGroupOptions(): { value: QualificationGroupId; label: string }[] {
  return QUALIFICATION_GROUPS.map((g) => ({ value: g.id, label: g.label }))
}

export function listQualificationTypeOptions(
  groupId: string | null | undefined
): { value: string; label: string; help_text?: string }[] {
  const g = getQualificationGroup(groupId)
  if (!g) return []
  return g.types.map((type) => ({
    value: type.id,
    label: type.label,
    help_text: type.help_text,
  }))
}
