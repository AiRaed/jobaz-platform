/**
 * Specialism definitions for Logistics, Supply Chain & Transport Management.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_logistics_supply_chain',
  cilt: 'cilt_uk',
  cips: 'cips_procurement',
  logistics_uk: 'logistics_uk',
  ukwa: 'uk_warehousing_association',
  ioex: 'institute_of_export_international_trade',
  govuk: 'gov_uk_transport_operator_licensing',
}

function d(
  label: string,
  short: string,
  professionalBody: string,
  relatedBodies: string[],
  sources: string[],
  profile: SpecDef['profile'],
  domainTag: string,
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
    domainTag,
    ...extra,
  }
}

export const LSCT_SPEC_DEFS: SpecDef[] = [
  d('Supply Chain Management', 'Supply Chain Management', 'CILT(UK)', ['CILT', 'CIPS'], [SRC.cilt, SRC.prospects, SRC.ncs], 'supply_chain', 'supply_chain', { includeCsco: true, mastersUseful: true, professionalQualification: 'CILT / APICS-CSCP context useful' }),
  d('Logistics Management', 'Logistics Management', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk, SRC.ncs], 'supply_chain', 'supply_chain', { includeCsco: true }),
  d('Global Supply Chain', 'Global Supply Chain', 'CILT(UK)', ['CILT', 'IOE&IT'], [SRC.cilt, SRC.ioex, SRC.prospects], 'supply_chain', 'supply_chain', { mastersUseful: true, includeCsco: true }),

  d('Procurement', 'Procurement', 'CIPS', ['CIPS', 'CILT'], [SRC.cips, SRC.prospects, SRC.ncs], 'procurement', 'procurement', { professionalQualification: 'CIPS membership / study pathway useful' }),
  d('Strategic Procurement', 'Strategic Procurement', 'CIPS', ['CIPS'], [SRC.cips, SRC.prospects], 'procurement', 'procurement', { mastersUseful: true, professionalQualification: 'CIPS' }),
  d('Purchasing', 'Purchasing', 'CIPS', ['CIPS'], [SRC.cips, SRC.ncs], 'procurement', 'procurement', { professionalQualification: 'CIPS useful' }),
  d('Category Management', 'Category Management', 'CIPS', ['CIPS'], [SRC.cips, SRC.prospects], 'procurement', 'procurement', { professionalQualification: 'CIPS' }),

  d('Contract Logistics', 'Contract Logistics', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk, SRC.prospects], 'sector_logistics', 'sector_logistics'),
  d('Warehouse Management', 'Warehouse Management', 'UK Warehousing Association / CILT', ['UKWA', 'CILT'], [SRC.ukwa, SRC.cilt, SRC.ncs], 'warehouse_inventory', 'warehouse_inventory'),
  d('Inventory Management', 'Inventory Management', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'warehouse_inventory', 'warehouse_inventory'),

  d('Demand Planning', 'Demand Planning', 'CILT(UK) / IBF context', ['CILT'], [SRC.cilt, SRC.prospects], 'planning', 'planning', { mastersUseful: true }),
  d('Production Planning', 'Production Planning', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'planning', 'planning'),
  d('Operations Planning', 'Operations Planning (Logistics)', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects, SRC.ncs], 'planning', 'planning'),

  d('Distribution Management', 'Distribution Management', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk, SRC.ncs], 'transport_distribution', 'transport_distribution'),
  d('Transport Planning', 'Transport Planning (Freight)', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects, SRC.govuk], 'transport_distribution', 'transport_distribution', { mastersUseful: true }),
  d('Freight Management', 'Freight Management', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk], 'transport_distribution', 'transport_distribution'),
  d('Road Transport Management', 'Road Transport Management', 'Logistics UK / CILT', ['Logistics UK', 'CILT'], [SRC.logistics_uk, SRC.cilt, SRC.govuk], 'fleet_road', 'fleet_road', {
    licenceHints: [{ name: 'Transport Manager CPC', level: 'useful', note: 'Often required for O-licence Transport Manager posts' }],
  }),
  d('Rail Transport Management', 'Rail Transport Management (Freight)', 'CILT(UK) / rail freight context', ['CILT'], [SRC.cilt, SRC.prospects], 'transport_distribution', 'transport_distribution'),

  d('Maritime Logistics', 'Maritime Logistics', 'CILT(UK) / ICS context', ['CILT', 'ICS'], [SRC.cilt, SRC.prospects], 'maritime_port', 'maritime_port', { mastersUseful: true }),
  d('Port Management', 'Port Management', 'CILT(UK) / BPA context', ['CILT', 'BPA'], [SRC.cilt, SRC.prospects, SRC.ncs], 'maritime_port', 'maritime_port'),
  d('Shipping Management', 'Shipping Management', 'Institute of Chartered Shipbrokers / CILT', ['ICS', 'CILT'], [SRC.cilt, SRC.prospects], 'maritime_port', 'maritime_port', { mastersUseful: true }),

  d('Aviation Management', 'Aviation Management (Logistics)', 'CILT(UK) / aviation management context', ['CILT'], [SRC.cilt, SRC.prospects], 'aviation', 'aviation', { mastersUseful: true }),
  d('Airport Operations Management', 'Airport Operations Management', 'CILT(UK) / ACI Europe context', ['CILT'], [SRC.cilt, SRC.prospects, SRC.ncs], 'aviation', 'aviation'),
  d('Air Cargo Management', 'Air Cargo Management', 'CILT(UK) / IATA cargo context', ['CILT'], [SRC.cilt, SRC.prospects], 'aviation', 'aviation'),

  d('Fleet Management', 'Fleet Management', 'Logistics UK / CILT', ['Logistics UK', 'CILT'], [SRC.logistics_uk, SRC.cilt, SRC.govuk], 'fleet_road', 'fleet_road', {
    licenceHints: [{ name: 'Transport Manager CPC awareness', level: 'useful' }],
  }),
  d('Cold Chain Logistics', 'Cold Chain Logistics', 'CILT(UK) / cold-chain operators', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk], 'sector_logistics', 'sector_logistics'),

  d('International Trade Logistics', 'International Trade Logistics', 'Institute of Export & International Trade / CILT', ['IOE&IT', 'CILT'], [SRC.ioex, SRC.cilt, SRC.prospects], 'trade_compliance', 'trade_compliance', { mastersUseful: true, professionalQualification: 'IOE&IT / CILT useful' }),
  d('Import & Export Management', 'Import Export Management', 'Institute of Export & International Trade', ['IOE&IT', 'CILT'], [SRC.ioex, SRC.cilt, SRC.ncs], 'trade_compliance', 'trade_compliance', { professionalQualification: 'IOE&IT useful' }),
  d('Customs and Trade Compliance', 'Customs Trade Compliance', 'Institute of Export & International Trade', ['IOE&IT'], [SRC.ioex, SRC.govuk, SRC.prospects], 'trade_compliance', 'trade_compliance', { professionalQualification: 'Customs practitioner training useful' }),

  d('E-commerce Logistics', 'E-commerce Logistics', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk, SRC.prospects], 'sector_logistics', 'sector_logistics'),
  d('Retail Logistics', 'Retail Logistics', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'sector_logistics', 'sector_logistics'),
  d('Manufacturing Logistics', 'Manufacturing Logistics', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'sector_logistics', 'sector_logistics'),
  d('Humanitarian Logistics', 'Humanitarian Logistics', 'CILT(UK) / humanitarian logistics networks', ['CILT'], [SRC.cilt, SRC.prospects], 'sector_logistics', 'sector_logistics', { mastersUseful: true }),
  d('Defence Logistics', 'Defence Logistics (Management)', 'CILT(UK) / defence logistics context', ['CILT'], [SRC.cilt, SRC.prospects], 'sector_logistics', 'sector_logistics', {
    mastersUseful: true,
    licenceHints: [{ name: 'Security clearance (selected posts)', level: 'employer_commonly_expects', note: 'SC/DV may apply to defence posts — vacancy-specific' }],
  }),

  d('Logistics Analytics', 'Logistics Analytics', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'analytics', 'analytics', { mastersUseful: true }),
  d('Supply Chain Data Analytics', 'Supply Chain Data Analytics', 'CILT(UK)', ['CILT'], [SRC.cilt, SRC.prospects], 'analytics', 'analytics', { mastersUseful: true }),
  d('Operations Research', 'Logistics Operations Research', 'CILT(UK) / OR Society context', ['CILT', 'OR Society'], [SRC.cilt, SRC.prospects], 'analytics', 'analytics', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected' }),

  d('Sustainable Logistics', 'Sustainable Logistics', 'CILT(UK) / Logistics UK', ['CILT', 'Logistics UK'], [SRC.cilt, SRC.logistics_uk, SRC.prospects], 'sustainability', 'sustainability', { mastersUseful: true }),

  d('Academic & Research', 'Logistics Supply Chain Research', 'CILT(UK) / university logistics research', ['CILT'], [SRC.cilt, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
]

const ALL_SLUGS = LSCT_SPEC_DEFS.map((x) => x.slug)

export const LSCT_PACKS: SpecialismPack[] = LSCT_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
