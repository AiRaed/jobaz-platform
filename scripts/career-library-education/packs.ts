/**
 * Specialism definitions for Education & Teaching packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_teaching_education',
  dfe: 'department_for_education_uk',
  tra: 'teaching_regulation_agency',
  getintoteaching: 'get_into_teaching_dfe',
  etf: 'education_and_training_foundation',
  advancehe: 'advance_he',
  hcpc: 'hcpc_educational_psychologists',
  nasen: 'nasen_sen_uk',
  ofsted: 'ofsted_education_uk',
}

function d(
  label: string,
  short: string,
  professionalBody: string,
  relatedBodies: string[],
  sources: string[],
  profile: SpecDef['profile'],
  extra: Partial<SpecDef> = {}
): SpecDef {
  return {
    slug: normalizeSlug(undefined, label)!,
    label,
    short,
    professionalBody,
    relatedBodies,
    sources,
    profile,
    ...extra,
  }
}

export const EDU_SPEC_DEFS: SpecDef[] = [
  d(
    'Primary Education',
    'Primary',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'Ofsted'],
    [SRC.ncs, SRC.prospects, SRC.getintoteaching, SRC.tra],
    'school_phase',
    { qtsRequired: true }
  ),
  d(
    'Secondary Education',
    'Secondary',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'Ofsted'],
    [SRC.ncs, SRC.prospects, SRC.getintoteaching, SRC.tra],
    'school_phase',
    { qtsRequired: true }
  ),
  d(
    'Early Years Education',
    'Early Years',
    'Teaching Regulation Agency / Department for Education (EYTS)',
    ['TRA', 'DfE', 'Ofsted'],
    [SRC.ncs, SRC.prospects, SRC.dfe, SRC.tra],
    'school_phase',
    { eytsRoute: true, qtsRequired: true }
  ),
  d(
    'Further Education',
    'Further Education',
    'Education and Training Foundation / QTLS',
    ['ETF', 'QTLS', 'Ofsted'],
    [SRC.ncs, SRC.prospects, SRC.etf],
    'fe_adult',
    { feRoute: true }
  ),
  d(
    'Higher Education',
    'Higher Education',
    'Advance HE',
    ['Advance HE', 'OfS'],
    [SRC.prospects, SRC.advancehe, SRC.ncs],
    'higher_education'
  ),
  d(
    'Special Educational Needs (SEN)',
    'SEN',
    'Teaching Regulation Agency / NASEN',
    ['TRA', 'NASEN', 'DfE'],
    [SRC.ncs, SRC.prospects, SRC.nasen, SRC.tra],
    'sen_support',
    { qtsRequired: true, mastersUseful: true }
  ),
  d(
    'Educational Psychology',
    'Educational Psychology',
    'Health and Care Professions Council',
    ['HCPC', 'AEP'],
    [SRC.hcpc, SRC.prospects, SRC.ncs],
    'ed_psych',
    { hcpcRequired: true }
  ),
  d(
    'Teaching English',
    'English',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Mathematics Education',
    'Mathematics',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'NCETM context'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Science Education',
    'Science',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Computing Education',
    'Computing',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'NCCE context'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Physical Education',
    'Physical Education',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'afPE'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Arts Education',
    'Arts',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Music Education',
    'Music',
    'Teaching Regulation Agency / Department for Education',
    ['TRA', 'DfE', 'Music Mark'],
    [SRC.getintoteaching, SRC.prospects, SRC.tra],
    'subject_teaching',
    { qtsRequired: true }
  ),
  d(
    'Educational Leadership',
    'Educational Leadership',
    'Department for Education / National Professional Qualifications',
    ['DfE', 'NPQ', 'TRA'],
    [SRC.dfe, SRC.prospects, SRC.ncs],
    'leadership_management',
    { qtsRequired: true }
  ),
  d(
    'Curriculum Development',
    'Curriculum Development',
    'Department for Education / Ofsted context',
    ['DfE', 'Ofsted'],
    [SRC.dfe, SRC.prospects, SRC.ofsted],
    'curriculum_training',
    { mastersUseful: true }
  ),
  d(
    'Teacher Training',
    'Teacher Training',
    'Department for Education / Teaching Regulation Agency',
    ['DfE', 'TRA'],
    [SRC.getintoteaching, SRC.dfe, SRC.tra],
    'curriculum_training',
    { qtsRequired: true }
  ),
  d(
    'Adult Education',
    'Adult Education',
    'Education and Training Foundation',
    ['ETF', 'QTLS'],
    [SRC.etf, SRC.ncs, SRC.prospects],
    'fe_adult',
    { feRoute: true, includeExecutive: false }
  ),
  d(
    'Learning Support',
    'Learning Support',
    'Department for Education / HLTA context',
    ['DfE', 'HLTA'],
    [SRC.ncs, SRC.prospects, SRC.dfe],
    'learning_support'
  ),
  d(
    'Education Management',
    'Education Management',
    'Department for Education / Confederation of School Trusts context',
    ['DfE', 'CST'],
    [SRC.dfe, SRC.prospects, SRC.ncs],
    'curriculum_training'
  ),
]

const ALL_SLUGS = EDU_SPEC_DEFS.map((x) => x.slug)

export const EDU_PACKS: SpecialismPack[] = EDU_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
