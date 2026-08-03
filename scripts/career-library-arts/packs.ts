/**
 * Specialism definitions for Arts, Media & Creative Industries packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_creative_media',
  screenskills: 'screenskills_uk',
  creativeskillset: 'creative_uk_industry',
  aiga: 'design_council_uk_context',
  dba: 'design_business_association',
  equity: 'equity_uk',
  nuj: 'national_union_of_journalists',
  bfi: 'bfi_film_careers',
  artscouncil: 'arts_council_england',
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

export const ARTS_SPEC_DEFS: SpecDef[] = [
  d('Graphic Design', 'Graphic Design', 'Design Council / Chartered Society of Designers context', ['Design Council', 'CSD', 'DBA'], [SRC.ncs, SRC.prospects, SRC.dba], 'design_craft', { juniorTitle: 'Designer', includeAcademic: true }),
  d('UX/UI Design', 'UX/UI Design', 'Design Council / BCS interaction design context', ['Design Council', 'BCS'], [SRC.prospects, SRC.ncs], 'digital_interactive', { juniorTitle: 'Designer' }),
  d('Product Design', 'Product Design', 'Design Council / Chartered Society of Designers context', ['Design Council', 'CSD'], [SRC.prospects, SRC.ncs], 'design_craft', { juniorTitle: 'Designer', includeAcademic: true }),
  d('Industrial Design', 'Industrial Design', 'Design Council / IED context', ['Design Council', 'IED'], [SRC.prospects, SRC.ncs], 'design_craft', { juniorTitle: 'Designer' }),
  d('Animation', 'Animation', 'ScreenSkills / Animation UK', ['ScreenSkills', 'Animation UK'], [SRC.screenskills, SRC.prospects, SRC.ncs], 'animation_vfx'),
  d('Game Design', 'Game Design', 'ScreenSkills / TIGA', ['ScreenSkills', 'TIGA', 'UKIE'], [SRC.screenskills, SRC.prospects], 'digital_interactive', { juniorTitle: 'Designer' }),
  d('Game Art', 'Game Art', 'ScreenSkills / TIGA', ['ScreenSkills', 'TIGA'], [SRC.screenskills, SRC.prospects], 'animation_vfx'),
  d('Film Production', 'Film Production', 'ScreenSkills / BFI', ['ScreenSkills', 'BFI'], [SRC.screenskills, SRC.bfi, SRC.prospects], 'film_tv_video'),
  d('Television & Broadcasting', 'Television Broadcasting', 'ScreenSkills / RTS', ['ScreenSkills', 'RTS', 'BBC context'], [SRC.screenskills, SRC.prospects, SRC.ncs], 'film_tv_video'),
  d('Video Production', 'Video Production', 'ScreenSkills', ['ScreenSkills'], [SRC.screenskills, SRC.ncs, SRC.prospects], 'film_tv_video'),
  d('Photography', 'Photography', 'Association of Photographers / RPS context', ['AOP', 'RPS'], [SRC.ncs, SRC.prospects], 'photography_visual', { juniorTitle: 'Photographer', mastersUseful: true }),
  d('Fine Art', 'Fine Art', 'Arts Council England / a-n context', ['Arts Council England', 'a-n'], [SRC.artscouncil, SRC.prospects, SRC.ncs], 'fine_art_illustration', { juniorTitle: 'Artist', mastersUseful: true }),
  d('Illustration', 'Illustration', 'Association of Illustrators', ['AOI'], [SRC.prospects, SRC.ncs], 'fine_art_illustration', { juniorTitle: 'Illustrator', mastersUseful: true }),
  d('Visual Communication', 'Visual Communication', 'Design Council / Chartered Society of Designers context', ['Design Council', 'CSD'], [SRC.prospects, SRC.dba], 'design_craft', { juniorTitle: 'Designer', includeAcademic: true }),
  d('Digital Media', 'Digital Media', 'ScreenSkills / Creative UK', ['ScreenSkills', 'Creative UK'], [SRC.screenskills, SRC.prospects], 'digital_interactive', { juniorTitle: 'Producer' }),
  d('Motion Graphics', 'Motion Graphics', 'ScreenSkills', ['ScreenSkills'], [SRC.screenskills, SRC.prospects], 'animation_vfx'),
  d('3D Modelling', '3D Modelling', 'ScreenSkills', ['ScreenSkills'], [SRC.screenskills, SRC.prospects], 'animation_vfx'),
  d('VFX', 'VFX', 'ScreenSkills / UK Screen Alliance', ['ScreenSkills', 'UK Screen Alliance'], [SRC.screenskills, SRC.prospects], 'animation_vfx'),
  d('Architecture Visualization', 'Architecture Visualization', 'ScreenSkills / RIBA visualisation context', ['ScreenSkills'], [SRC.screenskills, SRC.prospects], 'animation_vfx'),
  d('Music', 'Music Performance', 'Musicians\' Union / Arts Council England', ['MU', 'Arts Council England'], [SRC.artscouncil, SRC.prospects, SRC.ncs], 'music_audio', { juniorTitle: 'Musician' }),
  d('Music Production', 'Music Production', 'Music Producers Guild / Musicians\' Union context', ['MPG', 'MU'], [SRC.prospects, SRC.ncs], 'music_audio', { juniorTitle: 'Producer' }),
  d('Performing Arts', 'Performing Arts', 'Equity / Arts Council England', ['Equity', 'Arts Council England'], [SRC.equity, SRC.artscouncil, SRC.prospects], 'performing', { juniorTitle: 'Performer', mastersUseful: true }),
  d('Theatre', 'Theatre', 'Equity / UK Theatre', ['Equity', 'UK Theatre', 'SOLT'], [SRC.equity, SRC.prospects, SRC.ncs], 'performing', { juniorTitle: 'Performer', mastersUseful: true }),
  d('Dance', 'Dance', 'Equity / One Dance UK', ['Equity', 'One Dance UK'], [SRC.equity, SRC.artscouncil, SRC.prospects], 'performing', { juniorTitle: 'Dancer', mastersUseful: true }),
  d('Fashion Design', 'Fashion Design', 'British Fashion Council / Design Council context', ['BFC', 'Design Council'], [SRC.prospects, SRC.ncs], 'fashion_textile_interior', { juniorTitle: 'Designer' }),
  d('Textile Design', 'Textile Design', 'Design Council / Crafts Council context', ['Design Council', 'Crafts Council'], [SRC.prospects, SRC.ncs], 'fashion_textile_interior', { juniorTitle: 'Designer' }),
  d('Interior Design', 'Interior Design', 'British Institute of Interior Design / Design Council', ['BIID', 'Design Council'], [SRC.prospects, SRC.ncs], 'fashion_textile_interior', { juniorTitle: 'Designer' }),
  d('Creative Writing', 'Creative Writing', 'Society of Authors / Arts Council England', ['Society of Authors', 'Arts Council England'], [SRC.prospects, SRC.artscouncil], 'writing_journalism_publishing', { juniorTitle: 'Writer', mastersUseful: true }),
  d('Journalism', 'Journalism', 'National Union of Journalists / NCTJ', ['NUJ', 'NCTJ'], [SRC.nuj, SRC.ncs, SRC.prospects], 'writing_journalism_publishing', { juniorTitle: 'Journalist' }),
  d('Publishing', 'Publishing', 'Publishers Association / Society of Young Publishers', ['PA', 'SYP'], [SRC.prospects, SRC.ncs], 'writing_journalism_publishing', { juniorTitle: 'Editor' }),
  d('Advertising Creative', 'Advertising Creative', 'IPA / Design & Art Direction (D&AD)', ['IPA', 'D&AD'], [SRC.prospects, SRC.ncs], 'advertising_direction', { juniorTitle: 'Creative' }),
  d('Creative Direction', 'Creative Direction', 'IPA / D&AD / Design Council context', ['IPA', 'D&AD', 'Design Council'], [SRC.prospects, SRC.dba], 'advertising_direction', { juniorTitle: 'Director' }),
]

const ALL_SLUGS = ARTS_SPEC_DEFS.map((x) => x.slug)

export const ARTS_PACKS: SpecialismPack[] = ARTS_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
