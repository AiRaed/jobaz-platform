/**
 * Specialism definitions for Environment, Agriculture & Food packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_environment_agriculture_food',
  defra: 'defra_uk_careers_context',
  iema: 'iema_environment',
  ifst: 'institute_food_science_technology',
  iagre: 'institution_agricultural_engineers_context',
  rics: 'rics_rural_land',
  cieem: 'cieem_ecology_conservation',
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

export const EAF_SPEC_DEFS: SpecDef[] = [
  // Agriculture
  d('Agriculture', 'Agriculture', 'Institute of Agricultural Management / NFU context', ['IAgrM', 'NFU'], [SRC.ncs, SRC.prospects, SRC.defra], 'agriculture', { practitionerNoun: 'Officer' }),
  d('Agricultural Science', 'Agricultural Science', 'Association of Applied Biologists / IAgrE context', ['AAB', 'IAgrE'], [SRC.prospects, SRC.iagre], 'agriculture', { practitionerNoun: 'Scientist', mastersUseful: true }),
  d('Agricultural Business', 'Agricultural Business', 'Institute of Agricultural Management', ['IAgrM'], [SRC.prospects, SRC.ncs], 'agriculture', { practitionerNoun: 'Analyst' }),
  d('Agricultural Technology', 'Agricultural Technology', 'IAgrE / Agri-TechE context', ['IAgrE'], [SRC.iagre, SRC.prospects], 'agriculture', { practitionerNoun: 'Technologist' }),
  d('Crop Science', 'Crop Science', 'Association of Applied Biologists', ['AAB'], [SRC.prospects, SRC.defra], 'agriculture', { practitionerNoun: 'Agronomist', mastersUseful: true }),
  d('Plant Science', 'Plant Science', 'Association of Applied Biologists', ['AAB'], [SRC.prospects], 'agriculture', { practitionerNoun: 'Scientist', mastersUseful: true }),
  d('Soil Science', 'Soil Science', 'British Society of Soil Science', ['BSSS'], [SRC.prospects, SRC.defra], 'agriculture', { practitionerNoun: 'Scientist', mastersUseful: true }),
  d('Sustainable Agriculture', 'Sustainable Agriculture', 'Institute of Agricultural Management / Soil Association context', ['IAgrM', 'Soil Association'], [SRC.defra, SRC.prospects], 'agriculture', { practitionerNoun: 'Officer' }),
  d('Organic Farming', 'Organic Farming', 'Soil Association / Organic Farmers & Growers', ['Soil Association', 'OF&G'], [SRC.defra, SRC.ncs], 'agriculture', { practitionerNoun: 'Officer' }),

  // Animal / livestock / aquatic
  d('Animal Science', 'Animal Science', 'British Society of Animal Science', ['BSAS'], [SRC.prospects, SRC.ncs], 'animal_livestock', { practitionerNoun: 'Scientist', mastersUseful: true }),
  d('Livestock Management', 'Livestock Management', 'Institute of Agricultural Management', ['IAgrM'], [SRC.ncs, SRC.prospects], 'animal_livestock', { practitionerNoun: 'Manager' }),
  d('Dairy Science', 'Dairy Science', 'British Society of Animal Science / Dairy UK context', ['BSAS', 'Dairy UK'], [SRC.prospects, SRC.defra], 'animal_livestock', { practitionerNoun: 'Technologist' }),
  d('Poultry Science', 'Poultry Science', 'British Poultry Council / BSAS context', ['BPC', 'BSAS'], [SRC.prospects], 'animal_livestock', { practitionerNoun: 'Technologist' }),
  d('Aquaculture', 'Aquaculture', 'Institute of Fisheries Management / Seafish context', ['IFM', 'Seafish'], [SRC.prospects, SRC.defra], 'animal_livestock', { practitionerNoun: 'Officer' }),
  d('Fisheries Management', 'Fisheries Management', 'Institute of Fisheries Management', ['IFM'], [SRC.prospects, SRC.defra], 'environment_conservation', { practitionerNoun: 'Officer' }),

  // Food
  d('Food Science', 'Food Science', 'Institute of Food Science and Technology', ['IFST'], [SRC.ifst, SRC.prospects, SRC.ncs], 'food', { practitionerNoun: 'Scientist', mastersUseful: true }),
  d('Food Technology', 'Food Technology', 'Institute of Food Science and Technology', ['IFST'], [SRC.ifst, SRC.prospects], 'food', { practitionerNoun: 'Technologist' }),
  d('Food Safety', 'Food Safety', 'Chartered Institute of Environmental Health / IFST', ['CIEH', 'IFST'], [SRC.ifst, SRC.ncs, SRC.defra], 'food', { practitionerNoun: 'Officer' }),
  d('Nutrition Science', 'Nutrition Science', 'Association for Nutrition / Nutrition Society', ['AfN', 'Nutrition Society'], [SRC.prospects, SRC.ncs], 'food', { practitionerNoun: 'Scientist', mastersUseful: true }),

  // Environment / conservation
  d('Environmental Management', 'Environmental Management', 'Institute of Environmental Management and Assessment', ['IEMA'], [SRC.iema, SRC.prospects, SRC.ncs], 'environment_conservation', { practitionerNoun: 'Manager' }),
  d('Environmental Conservation', 'Environmental Conservation', 'CIEEM / IEMA', ['CIEEM', 'IEMA'], [SRC.cieem, SRC.prospects], 'environment_conservation', { practitionerNoun: 'Officer' }),
  d('Conservation Biology', 'Conservation Biology', 'CIEEM / British Ecological Society context', ['CIEEM', 'BES'], [SRC.cieem, SRC.prospects], 'environment_conservation', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Wildlife Conservation', 'Wildlife Conservation', 'CIEEM / Wildlife Trusts context', ['CIEEM'], [SRC.cieem, SRC.ncs, SRC.prospects], 'environment_conservation', { practitionerNoun: 'Officer' }),
  d('Climate Adaptation', 'Climate Adaptation', 'IEMA / Adaptation Scotland context', ['IEMA'], [SRC.iema, SRC.defra, SRC.prospects], 'policy_consultancy', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Water Resources Management', 'Water Resources Management', 'CIWEM', ['CIWEM'], [SRC.prospects, SRC.defra], 'environment_conservation', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Waste Management', 'Waste Management', 'CIWM / IEMA', ['CIWM', 'IEMA'], [SRC.ncs, SRC.prospects, SRC.defra], 'environment_conservation', { practitionerNoun: 'Officer' }),
  d('Renewable Natural Resources', 'Renewable Natural Resources', 'IEMA / CIWEM context', ['IEMA', 'CIWEM'], [SRC.iema, SRC.prospects], 'environment_conservation', { practitionerNoun: 'Officer' }),
  d('Environmental Policy', 'Environmental Policy', 'IEMA / Defra context', ['IEMA'], [SRC.defra, SRC.iema, SRC.prospects], 'policy_consultancy', { practitionerNoun: 'Officer', mastersUseful: true }),
  d('Environmental Consultancy', 'Environmental Consultancy', 'IEMA / CIEEM', ['IEMA', 'CIEEM'], [SRC.iema, SRC.cieem, SRC.prospects], 'policy_consultancy', { practitionerNoun: 'Consultant' }),

  // Forestry / horticulture / landscape
  d('Forestry', 'Forestry', 'Institute of Chartered Foresters', ['ICF'], [SRC.prospects, SRC.ncs, SRC.defra], 'forestry_horticulture', { practitionerNoun: 'Officer' }),
  d('Arboriculture', 'Arboriculture', 'Arboricultural Association', ['AA'], [SRC.ncs, SRC.prospects], 'forestry_horticulture', { practitionerNoun: 'Officer' }),
  d('Horticulture', 'Horticulture', 'Chartered Institute of Horticulture', ['CIH'], [SRC.ncs, SRC.prospects], 'forestry_horticulture', { practitionerNoun: 'Officer' }),
  d('Landscape Management', 'Landscape Management', 'Landscape Institute / CIH context', ['LI', 'CIH'], [SRC.prospects, SRC.ncs], 'forestry_horticulture', { practitionerNoun: 'Officer' }),

  // Rural land
  d('Rural Development', 'Rural Development', 'RICS / Rural Services Network context', ['RICS'], [SRC.rics, SRC.defra, SRC.prospects], 'rural_land', { practitionerNoun: 'Officer' }),
  d('Rural Land Management', 'Rural Land Management', 'RICS', ['RICS'], [SRC.rics, SRC.prospects, SRC.ncs], 'rural_land', { practitionerNoun: 'Surveyor' }),
  d('Estate Management', 'Estate Management', 'RICS / Central Association of Agricultural Valuers', ['RICS', 'CAAV'], [SRC.rics, SRC.prospects], 'rural_land', { practitionerNoun: 'Manager' }),
]

const ALL_SLUGS = EAF_SPEC_DEFS.map((x) => x.slug)

export const EAF_PACKS: SpecialismPack[] = EAF_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
