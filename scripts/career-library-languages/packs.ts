/**
 * Specialism definitions for Languages & Literature packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_languages_literature',
  britishcouncil: 'british_council_english_languages',
  ciol: 'chartered_institute_of_linguists',
  iti: 'institute_of_translation_interpreting',
  cambridge: 'cambridge_english_celta_delta',
  ucas: 'ucas_languages_literature',
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

export const LANG_SPEC_DEFS: SpecDef[] = [
  d('English Language', 'English Language', 'British Council / English UK context', ['British Council', 'English UK'], [SRC.britishcouncil, SRC.prospects, SRC.ncs], 'english_studies', { practitionerNoun: 'Specialist', mastersUseful: true }),
  d('English Literature', 'English Literature', 'English Association / University English', ['English Association'], [SRC.prospects, SRC.ucas, SRC.ncs], 'english_studies', { practitionerNoun: 'Specialist', mastersUseful: true }),
  d('Creative Writing', 'Creative Writing', 'National Association of Writers in Education / Society of Authors context', ['NAWE', 'Society of Authors'], [SRC.prospects, SRC.ncs], 'creative_writing_literary', { mastersUseful: true }),
  d('Linguistics', 'Linguistics', 'Linguistics Association of Great Britain', ['LAGB'], [SRC.prospects, SRC.ucas], 'linguistics', { mastersUseful: true }),
  d('Applied Linguistics', 'Applied Linguistics', 'British Association for Applied Linguistics', ['BAAL'], [SRC.prospects, SRC.britishcouncil], 'linguistics', { mastersUseful: true }),
  d('Translation', 'Translation', 'Chartered Institute of Linguists / ITI', ['CIOL', 'ITI'], [SRC.ciol, SRC.iti, SRC.prospects], 'translation_interpreting', { mastersUseful: true }),
  d('Interpreting', 'Interpreting', 'Chartered Institute of Linguists / ITI', ['CIOL', 'ITI'], [SRC.ciol, SRC.iti, SRC.ncs], 'translation_interpreting', { mastersUseful: true }),
  d('TESOL', 'TESOL', 'British Council / Cambridge English / English UK', ['British Council', 'Cambridge English', 'English UK'], [SRC.britishcouncil, SRC.cambridge, SRC.prospects], 'tesol_tefl', { mastersUseful: true }),
  d('TEFL', 'TEFL', 'British Council / Cambridge English / English UK', ['British Council', 'Cambridge English', 'English UK'], [SRC.britishcouncil, SRC.cambridge, SRC.ncs], 'tesol_tefl', { mastersUseful: true }),
  d('Arabic', 'Arabic', 'Chartered Institute of Linguists / British Council context', ['CIOL', 'British Council'], [SRC.ciol, SRC.prospects, SRC.britishcouncil], 'modern_language'),
  d('French', 'French', 'Chartered Institute of Linguists / Alliance Française context', ['CIOL', 'Institut français'], [SRC.ciol, SRC.prospects, SRC.ncs], 'modern_language'),
  d('German', 'German', 'Chartered Institute of Linguists / Goethe-Institut context', ['CIOL', 'Goethe-Institut'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Spanish', 'Spanish', 'Chartered Institute of Linguists / Instituto Cervantes context', ['CIOL', 'Instituto Cervantes'], [SRC.ciol, SRC.prospects, SRC.ncs], 'modern_language'),
  d('Italian', 'Italian', 'Chartered Institute of Linguists / Italian Cultural Institute context', ['CIOL'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Portuguese', 'Portuguese', 'Chartered Institute of Linguists / Camões context', ['CIOL'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Chinese', 'Chinese', 'Chartered Institute of Linguists / British Council context', ['CIOL', 'British Council'], [SRC.ciol, SRC.britishcouncil, SRC.prospects], 'modern_language'),
  d('Japanese', 'Japanese', 'Chartered Institute of Linguists / Japan Foundation context', ['CIOL', 'Japan Foundation'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Korean', 'Korean', 'Chartered Institute of Linguists / Korean Cultural Centre context', ['CIOL'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Russian', 'Russian', 'Chartered Institute of Linguists / Pushkin House context', ['CIOL'], [SRC.ciol, SRC.prospects], 'modern_language'),
  d('Classics', 'Classics', 'Classical Association / CUCD', ['Classical Association', 'CUCD'], [SRC.prospects, SRC.ucas, SRC.ncs], 'classics_comparative', { mastersUseful: true }),
  d('Comparative Literature', 'Comparative Literature', 'British Comparative Literature Association', ['BCLA'], [SRC.prospects, SRC.ucas], 'classics_comparative', { mastersUseful: true }),
]

const ALL_SLUGS = LANG_SPEC_DEFS.map((x) => x.slug)

export const LANG_PACKS: SpecialismPack[] = LANG_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
