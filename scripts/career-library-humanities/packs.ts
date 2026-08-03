/**
 * Specialism definitions for Humanities & Social Sciences packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_humanities_social_sciences',
  bps: 'british_psychological_society',
  esrc: 'esrc_social_science_careers',
  museums: 'museums_association_uk',
  ucas: 'ucas_humanities_social_sciences',
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

export const HSS_SPEC_DEFS: SpecDef[] = [
  d(
    'Psychology (Academic / Non-clinical)',
    'Academic Psychology',
    'British Psychological Society (academic context)',
    ['BPS'],
    [SRC.bps, SRC.prospects, SRC.ncs],
    'psychology_academic',
    { mastersUseful: true }
  ),
  d('Sociology', 'Sociology', 'British Sociological Association', ['BSA'], [SRC.prospects, SRC.esrc, SRC.ncs], 'social_research', { practitionerNoun: 'Analyst', mastersUseful: true }),
  d('Anthropology', 'Anthropology', 'Royal Anthropological Institute', ['RAI'], [SRC.prospects, SRC.esrc], 'social_research', { practitionerNoun: 'Researcher', mastersUseful: true }),
  d('History', 'History', 'Royal Historical Society / Historical Association', ['RHS', 'HA'], [SRC.prospects, SRC.ncs, SRC.museums], 'heritage_history', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Archaeology', 'Archaeology', 'Chartered Institute for Archaeologists', ['CIfA'], [SRC.prospects, SRC.ncs, SRC.museums], 'heritage_history', { practitionerNoun: 'Archaeologist', mastersUseful: true }),
  d('Geography', 'Geography', 'Royal Geographical Society', ['RGS-IBG'], [SRC.prospects, SRC.ncs], 'geography', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Human Geography', 'Human Geography', 'Royal Geographical Society', ['RGS-IBG'], [SRC.prospects, SRC.esrc], 'geography', { practitionerNoun: 'Analyst', mastersUseful: true }),
  d('Politics', 'Politics', 'Political Studies Association', ['PSA'], [SRC.prospects, SRC.esrc, SRC.ncs], 'politics_policy', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('International Relations', 'International Relations', 'British International Studies Association', ['BISA'], [SRC.prospects, SRC.esrc], 'politics_policy', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Philosophy', 'Philosophy', 'British Philosophical Association', ['BPA'], [SRC.prospects, SRC.ucas], 'philosophy_religion', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Religious Studies', 'Religious Studies', 'British Association for the Study of Religions', ['BASR'], [SRC.prospects, SRC.ucas], 'philosophy_religion', { practitionerNoun: 'Officer' }),
  d('Theology', 'Theology', 'Society for the Study of Theology', ['SST'], [SRC.prospects, SRC.ucas], 'philosophy_religion', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Criminology', 'Criminology', 'British Society of Criminology', ['BSC'], [SRC.prospects, SRC.esrc, SRC.ncs], 'social_research', { practitionerNoun: 'Analyst', mastersUseful: true }),
  d('Social Policy', 'Social Policy', 'Social Policy Association', ['SPA'], [SRC.prospects, SRC.esrc, SRC.ncs], 'politics_policy', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Cultural Studies', 'Cultural Studies', 'MeCCSA / Cultural Studies associations context', ['MeCCSA'], [SRC.prospects, SRC.ucas], 'culture_media', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Media Studies', 'Media Studies', 'MeCCSA', ['MeCCSA'], [SRC.prospects, SRC.ucas], 'culture_media', { practitionerNoun: 'Analyst', mastersUseful: true }),
  d('Communication Studies', 'Communication Studies', 'MeCCSA', ['MeCCSA'], [SRC.prospects, SRC.ncs], 'culture_media', { practitionerNoun: 'Officer' }),
  d('Development Studies', 'Development Studies', 'Development Studies Association', ['DSA'], [SRC.prospects, SRC.esrc], 'social_research', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Gender Studies', 'Gender Studies', 'Feminist and Women\'s Studies Association context', ['FWSA'], [SRC.prospects, SRC.esrc], 'social_research', { practitionerNoun: 'Researcher', mastersUseful: true }),
  d('Classical Studies', 'Classical Studies', 'Classical Association', ['Classical Association'], [SRC.prospects, SRC.ucas], 'heritage_history', { practitionerNoun: 'Officer', mastersUseful: true }),
]

const ALL_SLUGS = HSS_SPEC_DEFS.map((x) => x.slug)

export const HSS_PACKS: SpecialismPack[] = HSS_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
