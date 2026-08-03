/**
 * Specialism definitions for Government, Public Policy & International Development.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_government_policy_development',
  cs: 'civil_service_careers_uk',
  fast: 'civil_service_fast_stream',
  govuk: 'gov_uk_careers_context',
  parliament: 'uk_parliament_careers',
  lga: 'local_government_association',
  fcdo: 'fcdo_careers',
  gaf: 'government_analysis_function',
  gsr: 'government_social_research',
  ges: 'government_economic_service',
  gss: 'government_statistical_service',
  gors: 'government_operational_research_service',
  bond: 'bond_uk_international_development',
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

export const GOV_SPEC_DEFS: SpecDef[] = [
  // —— Government and Public Administration ——
  d('Public Administration', 'Public Administration', 'Civil Service / LGA context', ['Civil Service', 'LGA'], [SRC.cs, SRC.lga, SRC.ncs], 'public_admin', 'public_admin', { includeExecutive: true }),
  d('Central Government', 'Central Government', 'Civil Service Careers', ['Civil Service'], [SRC.cs, SRC.govuk, SRC.fast], 'public_admin', 'public_admin', { includeExecutive: true, clearanceHint: 'sc_commonly_required' }),
  d('Local Government', 'Local Government', 'Local Government Association', ['LGA'], [SRC.lga, SRC.ncs, SRC.prospects], 'public_admin', 'public_admin', { includeExecutive: true }),
  d('Civil Service', 'Civil Service Practice', 'Civil Service Careers', ['Civil Service'], [SRC.cs, SRC.fast, SRC.govuk], 'public_admin', 'public_admin', { includeExecutive: true, clearanceHint: 'sc_commonly_required' }),
  d('Parliamentary Services', 'Parliamentary Services', 'UK Parliament Careers', ['UK Parliament'], [SRC.parliament, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Devolved Government', 'Devolved Government', 'Civil Service / Devolved administrations context', ['Civil Service', 'Scottish Government', 'Welsh Government', 'NICS'], [SRC.cs, SRC.govuk, SRC.prospects], 'public_admin', 'public_admin', { includeExecutive: true }),
  d('Public-Sector Operations', 'Public-Sector Operations', 'Civil Service / LGA', ['Civil Service', 'LGA'], [SRC.cs, SRC.lga], 'public_admin', 'public_admin'),
  d('Public-Service Management', 'Public-Service Management', 'Civil Service / Solace context', ['Civil Service', 'Solace'], [SRC.cs, SRC.lga, SRC.prospects], 'public_admin', 'public_admin', { includeExecutive: true }),
  d('Government Corporate Services', 'Government Corporate Services', 'Civil Service', ['Civil Service'], [SRC.cs, SRC.govuk], 'public_admin', 'public_admin'),
  d('Government Digital and Service Transformation', 'Gov Digital Transformation', 'Government Digital Service / CDDO context', ['GDS', 'CDDO'], [SRC.cs, SRC.govuk], 'public_admin', 'public_admin', { mastersUseful: true }),

  // —— Policy and Analysis ——
  d('Public Policy', 'Public Policy', 'Civil Service Policy Profession', ['Policy Profession'], [SRC.cs, SRC.prospects, SRC.govuk], 'policy', 'policy', { mastersUseful: true, includeExecutive: true }),
  d('Policy Analysis', 'Policy Analysis', 'Civil Service Policy Profession', ['Policy Profession'], [SRC.cs, SRC.gaf, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Policy Research', 'Policy Research', 'Civil Service Policy Profession / GSR context', ['Policy Profession', 'GSR'], [SRC.cs, SRC.gsr, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Social Policy', 'Government Social Policy', 'Civil Service / Social Policy Association practitioner context', ['Policy Profession', 'SPA'], [SRC.cs, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Economic Policy', 'Economic Policy', 'Government Economic Service / HMT context', ['GES', 'HMT'], [SRC.ges, SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Economic Service' }),
  d('Health Policy', 'Health Policy (Government)', 'DHSC / Civil Service Policy Profession', ['DHSC', 'Policy Profession'], [SRC.cs, SRC.govuk, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Education Policy', 'Education Policy (Government)', 'DfE / Civil Service Policy Profession', ['DfE', 'Policy Profession'], [SRC.cs, SRC.govuk, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Environmental and Climate Policy', 'Environmental Climate Policy (Gov)', 'DESNZ / Defra policy context', ['DESNZ', 'Defra', 'Policy Profession'], [SRC.cs, SRC.govuk, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Housing Policy', 'Housing Policy', 'MHCLG / Policy Profession', ['MHCLG', 'Policy Profession'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true }),
  d('Transport Policy', 'Transport Policy', 'DfT / Policy Profession', ['DfT', 'Policy Profession'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true }),
  d('Justice and Crime Policy', 'Justice Crime Policy', 'MoJ / Home Office policy context', ['MoJ', 'Home Office'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true, clearanceHint: 'sc_commonly_required' }),
  d('Science and Technology Policy', 'Science Technology Policy (Gov)', 'DSIT / Government Office for Science context', ['DSIT', 'GO-Science'], [SRC.cs, SRC.govuk, SRC.prospects], 'policy', 'policy', { mastersUseful: true }),
  d('Digital and AI Policy', 'Digital AI Policy', 'DSIT / CDDO policy context', ['DSIT', 'CDDO'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true }),
  d('Regulatory Policy', 'Regulatory Policy', 'Better Regulation / Policy Profession', ['BRF', 'Policy Profession'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true }),
  d('Equality and Inclusion Policy', 'Equality Inclusion Policy', 'Cabinet Office / EHRC context', ['Cabinet Office', 'EHRC'], [SRC.cs, SRC.govuk], 'policy', 'policy', { mastersUseful: true }),

  // —— Politics and Parliamentary Work ——
  d('Political Research', 'Political Research Practice', 'UK Parliament / political offices context', ['UK Parliament'], [SRC.parliament, SRC.prospects, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Parliamentary Research', 'Parliamentary Research Practice', 'House of Commons Library / Parliamentary careers', ['UK Parliament'], [SRC.parliament, SRC.prospects], 'politics_parliamentary', 'politics_parliamentary', { mastersUseful: true }),
  d('Constituency Casework', 'Constituency Casework', 'MP office / parliamentary staffing context', ['UK Parliament'], [SRC.parliament, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Political Advising', 'Political Advising Practice', 'Special adviser / political office context', ['Cabinet Office context'], [SRC.prospects, SRC.parliament], 'politics_parliamentary', 'politics_parliamentary'),
  d('Legislative Affairs', 'Legislative Affairs', 'UK Parliament / Bill teams context', ['UK Parliament', 'Civil Service'], [SRC.parliament, SRC.cs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Democratic Services', 'Democratic Services', 'Local Government Association / monitoring officers context', ['LGA'], [SRC.lga, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Electoral Services', 'Electoral Services', 'Electoral Commission / local electoral services', ['Electoral Commission', 'LGA'], [SRC.lga, SRC.govuk, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),
  d('Political Campaign Management', 'Political Campaign Management', 'Political parties / campaign organisations context', ['Electoral Commission context'], [SRC.prospects, SRC.ncs], 'politics_parliamentary', 'politics_parliamentary'),

  // —— Diplomacy and International Affairs ——
  d('Diplomacy', 'Diplomacy', 'FCDO Diplomatic Service', ['FCDO'], [SRC.fcdo, SRC.cs, SRC.prospects], 'diplomacy', 'diplomacy', { includeExecutive: true, clearanceHint: 'sc_commonly_required', mastersUseful: true }),
  d('Foreign Policy', 'Foreign Policy', 'FCDO', ['FCDO'], [SRC.fcdo, SRC.cs, SRC.govuk], 'diplomacy', 'diplomacy', { includeExecutive: true, mastersUseful: true, clearanceHint: 'sc_commonly_required' }),
  d('International Relations Practice', 'IR Practice (Government)', 'FCDO / Civil Service international', ['FCDO'], [SRC.fcdo, SRC.prospects, SRC.cs], 'diplomacy', 'diplomacy', { mastersUseful: true, clearanceHint: 'sc_commonly_required' }),
  d('Consular Services', 'Consular Services', 'FCDO Consular', ['FCDO'], [SRC.fcdo, SRC.cs, SRC.ncs], 'diplomacy', 'diplomacy', { clearanceHint: 'sc_commonly_required' }),
  d('International Trade Policy', 'International Trade Policy', 'DBT / FCDO trade context', ['DBT', 'FCDO'], [SRC.govuk, SRC.cs, SRC.prospects], 'diplomacy', 'diplomacy', { mastersUseful: true }),
  d('Security and Defence Policy', 'Security Defence Policy', 'MOD / Cabinet Office / FCDO security context', ['MOD', 'Cabinet Office', 'FCDO'], [SRC.cs, SRC.govuk], 'diplomacy', 'diplomacy', { mastersUseful: true, clearanceHint: 'dv_selected_posts', includeExecutive: true }),
  d('International Negotiation', 'International Negotiation', 'FCDO / HMG negotiation context', ['FCDO'], [SRC.fcdo, SRC.cs], 'diplomacy', 'diplomacy', { mastersUseful: true, clearanceHint: 'sc_commonly_required' }),
  d('Multilateral Affairs', 'Multilateral Affairs', 'FCDO multilateral', ['FCDO'], [SRC.fcdo, SRC.cs, SRC.prospects], 'diplomacy', 'diplomacy', { mastersUseful: true }),
  d('European Affairs', 'European Affairs', 'FCDO / Cabinet Office European context', ['FCDO', 'Cabinet Office'], [SRC.fcdo, SRC.cs, SRC.govuk], 'diplomacy', 'diplomacy', { mastersUseful: true }),
  d('Commonwealth Affairs', 'Commonwealth Affairs', 'FCDO / Commonwealth context', ['FCDO'], [SRC.fcdo, SRC.cs], 'diplomacy', 'diplomacy', { mastersUseful: true }),

  // —— International Development ——
  d('International Development', 'International Development', 'FCDO / Bond', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond, SRC.prospects], 'international_development', 'international_development', { includeExecutive: true, mastersUseful: true }),
  d('Development Policy', 'Development Policy', 'FCDO', ['FCDO'], [SRC.fcdo, SRC.bond, SRC.cs], 'international_development', 'international_development', { mastersUseful: true }),
  d('Development Programme Management', 'Development Programme Mgmt', 'FCDO / Bond / consultancy', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond, SRC.prospects], 'international_development', 'international_development', { mastersUseful: true }),
  d('Humanitarian Assistance', 'Humanitarian Assistance', 'FCDO / humanitarian NGOs', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond, SRC.ncs], 'international_development', 'international_development', { mastersUseful: true }),
  d('Humanitarian Policy', 'Humanitarian Policy', 'FCDO / humanitarian policy units', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond], 'international_development', 'international_development', { mastersUseful: true }),
  d('Global Health Development', 'Global Health Development', 'FCDO / WHO partnership context', ['FCDO'], [SRC.fcdo, SRC.bond, SRC.prospects], 'international_development', 'international_development', { mastersUseful: true }),
  d('Education Development', 'Education Development', 'FCDO education programmes', ['FCDO'], [SRC.fcdo, SRC.bond], 'international_development', 'international_development', { mastersUseful: true }),
  d('Economic Development', 'Economic Development (Intl)', 'FCDO / development banks context', ['FCDO'], [SRC.fcdo, SRC.bond, SRC.ges], 'international_development', 'international_development', { mastersUseful: true }),
  d('Sustainable Development', 'Sustainable Development (Intl)', 'FCDO / SDG programme context', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond, SRC.prospects], 'international_development', 'international_development', { mastersUseful: true }),
  d('Monitoring, Evaluation and Learning', 'MEL (Development)', 'FCDO / Bond MEL community', ['FCDO', 'Bond'], [SRC.fcdo, SRC.bond, SRC.gaf], 'international_development', 'international_development', { mastersUseful: true }),
  d('Aid Effectiveness', 'Aid Effectiveness', 'FCDO', ['FCDO'], [SRC.fcdo, SRC.bond], 'international_development', 'international_development', { mastersUseful: true }),
  d('Governance and Institutional Development', 'Governance Institutional Dev', 'FCDO governance programmes', ['FCDO'], [SRC.fcdo, SRC.bond], 'international_development', 'international_development', { mastersUseful: true }),
  d('Conflict, Peacebuilding and Stabilisation', 'Conflict Peacebuilding', 'FCDO / CSSF context', ['FCDO'], [SRC.fcdo, SRC.cs], 'international_development', 'international_development', { mastersUseful: true, clearanceHint: 'sc_commonly_required' }),
  d('Migration and Refugee Policy', 'Migration Refugee Policy', 'Home Office / FCDO / UNHCR partnership context', ['Home Office', 'FCDO'], [SRC.cs, SRC.fcdo, SRC.govuk], 'international_development', 'international_development', { mastersUseful: true, clearanceHint: 'sc_commonly_required' }),

  // —— Public Affairs and Stakeholder Relations ——
  d('Public Affairs', 'Public Affairs Practice', 'PRCA Public Affairs / CIPR context', ['PRCA', 'CIPR'], [SRC.prospects, SRC.ncs, SRC.parliament], 'public_affairs', 'public_affairs'),
  d('Government Relations', 'Government Relations', 'PRCA / in-house public affairs', ['PRCA'], [SRC.prospects, SRC.parliament], 'public_affairs', 'public_affairs'),
  d('Stakeholder Engagement', 'Stakeholder Engagement (Public Sector)', 'Civil Service / LGA engagement context', ['Civil Service', 'LGA'], [SRC.cs, SRC.lga, SRC.prospects], 'public_affairs', 'public_affairs'),
  d('Public Consultation', 'Public Consultation', 'Civil Service / LGA consultation practice', ['Civil Service', 'LGA'], [SRC.cs, SRC.lga], 'public_affairs', 'public_affairs'),
  d('Community Engagement', 'Community Engagement (Public Sector)', 'LGA / public-sector engagement', ['LGA'], [SRC.lga, SRC.ncs], 'public_affairs', 'public_affairs'),
  d('Policy Communications', 'Policy Communications', 'GCS / Civil Service communications', ['GCS'], [SRC.cs, SRC.govuk], 'public_affairs', 'public_affairs'),
  d('Parliamentary Affairs', 'Parliamentary Affairs Practice', 'PRCA / parliamentary affairs', ['PRCA', 'UK Parliament'], [SRC.parliament, SRC.prospects], 'public_affairs', 'public_affairs'),

  // —— Regulation, Governance and Integrity ——
  d('Public Governance', 'Public Governance', 'CIPFA / Solace / Civil Service governance', ['CIPFA', 'Solace'], [SRC.cs, SRC.lga, SRC.prospects], 'regulation_governance', 'regulation_governance', { mastersUseful: true }),
  d('Regulatory Affairs', 'Regulatory Affairs (Government)', 'UK regulators / Better Regulation', ['BRF'], [SRC.govuk, SRC.cs, SRC.prospects], 'regulation_governance', 'regulation_governance', { mastersUseful: true }),
  d('Government Compliance', 'Government Compliance', 'Civil Service / Government Internal Audit context', ['GIAA', 'Civil Service'], [SRC.cs, SRC.govuk], 'regulation_governance', 'regulation_governance'),
  d('Public-Sector Risk', 'Public-Sector Risk', 'Orange Book / GIAA context', ['GIAA'], [SRC.cs, SRC.govuk], 'regulation_governance', 'regulation_governance'),
  d('Ethics and Standards', 'Ethics and Standards', 'Civil Service Commission / standards bodies', ['Civil Service Commission'], [SRC.cs, SRC.govuk], 'regulation_governance', 'regulation_governance'),
  d('Freedom of Information', 'Freedom of Information', 'ICO / FOI practitioner context', ['ICO'], [SRC.govuk, SRC.ncs, SRC.cs], 'regulation_governance', 'regulation_governance'),
  d('Information Governance', 'Information Governance (Public Sector)', 'ICO / NHS & public-sector IG context', ['ICO'], [SRC.govuk, SRC.cs, SRC.ncs], 'regulation_governance', 'regulation_governance'),
  d('Public Appointments', 'Public Appointments', 'Commissioner for Public Appointments', ['CPA'], [SRC.govuk, SRC.cs], 'regulation_governance', 'regulation_governance'),
  d('Scrutiny and Audit Support', 'Scrutiny Audit Support', 'LGA overview and scrutiny / NAO context', ['LGA', 'NAO'], [SRC.lga, SRC.govuk], 'regulation_governance', 'regulation_governance'),

  // —— Public Finance and Commissioning ——
  d('Public Finance Policy', 'Public Finance Policy', 'HMT / CIPFA policy context', ['HMT', 'CIPFA'], [SRC.govuk, SRC.cs, SRC.prospects], 'public_finance', 'public_finance', { mastersUseful: true }),
  d('Public-Sector Commissioning', 'Public-Sector Commissioning', 'LGA / Civil Service commissioning', ['LGA', 'Civil Service'], [SRC.lga, SRC.cs, SRC.ncs], 'public_finance', 'public_finance'),
  d('Grants Management', 'Grants Management (Public Sector)', 'Government grants / Cabinet Office grants standards', ['Cabinet Office'], [SRC.govuk, SRC.cs, SRC.bond], 'public_finance', 'public_finance'),
  d('Public Procurement Policy', 'Public Procurement Policy', 'Cabinet Office commercial / CCS context', ['CCS', 'Cabinet Office'], [SRC.govuk, SRC.cs], 'public_finance', 'public_finance', { mastersUseful: true }),
  d('Contract and Supplier Governance', 'Contract Supplier Governance', 'Cabinet Office commercial function', ['CCS'], [SRC.govuk, SRC.cs], 'public_finance', 'public_finance'),
  d('Funding Programme Management', 'Funding Programme Management', 'Civil Service / LGA funding programmes', ['Civil Service', 'LGA'], [SRC.cs, SRC.lga], 'public_finance', 'public_finance'),

  // —— Research and Evidence ——
  d('Government Social Research', 'Government Social Research', 'Government Social Research', ['GSR'], [SRC.gsr, SRC.gaf, SRC.cs], 'government_analytical', 'government_analytical', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Social Research' }),
  d('Government Economic Service-related analysis', 'GES Analysis', 'Government Economic Service', ['GES'], [SRC.ges, SRC.gaf, SRC.cs], 'government_analytical', 'government_analytical', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Economic Service' }),
  d('Government Statistical Analysis', 'Government Statistical Analysis', 'Government Statistical Service', ['GSS'], [SRC.gss, SRC.gaf, SRC.cs], 'government_analytical', 'government_analytical', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Statistical Service' }),
  d('Operational Research in Government', 'Gov Operational Research', 'Government Operational Research Service', ['GORS'], [SRC.gors, SRC.gaf, SRC.cs], 'government_analytical', 'government_analytical', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Operational Research Service' }),
  d('Public Opinion Research', 'Public Opinion Research (Gov)', 'GSR / polling & insight units', ['GSR'], [SRC.gsr, SRC.gaf, SRC.prospects], 'government_analytical', 'government_analytical', { mastersUseful: true, governmentProfession: 'Government Social Research' }),
  d('Evaluation Research', 'Evaluation Research (Gov)', 'Magenta Book / GSR evaluation', ['GSR'], [SRC.gsr, SRC.gaf, SRC.govuk], 'government_analytical', 'government_analytical', { mastersUseful: true, governmentProfession: 'Government Social Research' }),
  d('Behavioural Insights', 'Behavioural Insights (Gov)', 'BIT / behavioural science in government', ['BIT', 'GSR'], [SRC.gaf, SRC.gsr, SRC.govuk], 'government_analytical', 'government_analytical', { mastersUseful: true, mastersExpectationDefault: 'commonly_expected', governmentProfession: 'Government Analysis Function' }),
  d('Parliamentary and Legislative Research', 'Parliamentary Legislative Research', 'House of Commons Library / POST', ['UK Parliament'], [SRC.parliament, SRC.prospects], 'government_analytical', 'government_analytical', { mastersUseful: true, governmentProfession: null }),

  // —— Academic and Research ——
  d('Public Policy Research', 'Public Policy Research', 'Political Studies Association / university research', ['PSA'], [SRC.prospects, SRC.cs], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Political Science Research', 'Political Science Research', 'Political Studies Association', ['PSA'], [SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Public Administration Research', 'Public Administration Research', 'Public Administration Committee / academic networks', ['PACAC context'], [SRC.prospects, SRC.cs], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('International Development Research', 'International Development Research', 'Development Studies Association / research institutes', ['DSA'], [SRC.bond, SRC.prospects], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('International Relations Research', 'International Relations Research', 'BISA / university IR research', ['BISA'], [SRC.prospects, SRC.fcdo], 'academic_focus', 'academic_research', { mastersUseful: true }),
  d('Governance Research', 'Governance Research', 'University governance research networks', ['PSA'], [SRC.prospects, SRC.cs], 'academic_focus', 'academic_research', { mastersUseful: true }),
]

const ALL_SLUGS = GOV_SPEC_DEFS.map((x) => x.slug)

export const GOV_PACKS: SpecialismPack[] = GOV_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
