/**
 * Specialism definitions for Law, Legal & Justice packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_law_careers',
  sra: 'solicitors_regulation_authority',
  bsb: 'bar_standards_board',
  cilex: 'cilex_regulation',
  moj: 'ministry_of_justice',
  hmcts: 'hmcts_careers',
  cps: 'crown_prosecution_service',
  jac: 'judicial_appointments_commission',
  gov: 'gov_uk_legal_careers',
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

export const LAW_SPEC_DEFS: SpecDef[] = [
  // General
  d('General Legal Practice', 'General Practice', 'Solicitors Regulation Authority / Bar Standards Board', ['SRA', 'BSB', 'Law Society'], [SRC.ncs, SRC.prospects, SRC.sra], 'practice_area'),
  d('Solicitor Practice', 'Solicitor', 'Solicitors Regulation Authority', ['SRA', 'Law Society'], [SRC.sra, SRC.prospects, SRC.ncs], 'solicitor_core'),
  d('Barrister Practice', 'Barrister', 'Bar Standards Board', ['BSB', 'Bar Council'], [SRC.bsb, SRC.prospects, SRC.ncs], 'barrister_core'),
  d('Legal Executive', 'Legal Executive', 'CILEx Regulation', ['CILEx', 'CILEx Regulation'], [SRC.cilex, SRC.prospects, SRC.ncs], 'cilex_core'),
  d('Paralegal', 'Paralegal', 'CILEx / NALP context', ['CILEx', 'NALP'], [SRC.ncs, SRC.prospects, SRC.cilex], 'legal_support'),
  d('Legal Secretary', 'Legal Secretary', 'Institute of Legal Secretaries / CILEx context', ['ILSPA', 'CILEx'], [SRC.ncs, SRC.prospects], 'legal_support'),

  // Civil
  d('Contract Law', 'Contract Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area'),
  d('Commercial Law', 'Commercial Law', 'SRA / BSB', ['SRA', 'BSB', 'Law Society'], [SRC.prospects, SRC.sra], 'practice_area', { mastersUseful: true }),
  d('Company Law', 'Company Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area', { mastersUseful: true }),
  d('Employment Law', 'Employment Law', 'SRA / BSB / Employment Lawyers Association', ['SRA', 'BSB', 'ELA'], [SRC.prospects, SRC.ncs], 'practice_area', { includeJudicial: true }),
  d('Property Law', 'Property Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area'),
  d('Land Law', 'Land Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area'),
  d('Housing Law', 'Housing Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.ncs, SRC.prospects], 'practice_area', { includeJudicial: true }),
  d('Consumer Law', 'Consumer Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.gov], 'practice_area'),

  // Criminal
  d('Criminal Law', 'Criminal Law', 'SRA / BSB / CPS context', ['SRA', 'BSB', 'CPS'], [SRC.prospects, SRC.ncs, SRC.cps], 'practice_area', { includeJudicial: true }),
  d('Criminal Defence', 'Criminal Defence', 'SRA / BSB', ['SRA', 'BSB', 'Law Society'], [SRC.prospects, SRC.sra], 'practice_area'),
  d('Prosecution', 'Prosecution', 'Crown Prosecution Service / BSB / SRA', ['CPS', 'BSB', 'SRA'], [SRC.cps, SRC.prospects], 'court_justice'),

  // Family
  d('Family Law', 'Family Law', 'SRA / BSB', ['SRA', 'BSB', 'Resolution'], [SRC.prospects, SRC.ncs], 'practice_area', { includeJudicial: true }),
  d('Child Law', 'Child Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.ncs], 'practice_area', { includeJudicial: true }),
  d('Divorce', 'Divorce Law', 'SRA / BSB / Resolution', ['SRA', 'BSB', 'Resolution'], [SRC.prospects, SRC.ncs], 'practice_area'),

  // Public
  d('Constitutional Law', 'Constitutional Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true, includeExecutive: false }),
  d('Administrative Law', 'Administrative Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true, includeJudicial: true }),
  d('Human Rights', 'Human Rights Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Immigration Law', 'Immigration Law', 'SRA / BSB / OISC context', ['SRA', 'BSB', 'OISC'], [SRC.ncs, SRC.prospects], 'practice_area', { includeJudicial: true }),
  d('Asylum Law', 'Asylum Law', 'SRA / BSB / OISC context', ['SRA', 'BSB', 'OISC'], [SRC.prospects, SRC.gov], 'practice_area', { includeJudicial: true }),

  // Corporate
  d('Corporate Law', 'Corporate Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area', { mastersUseful: true }),
  d('Banking Law', 'Banking Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area', { mastersUseful: true }),
  d('Financial Regulation', 'Financial Regulation Law', 'SRA / BSB', ['SRA', 'BSB', 'FCA context'], [SRC.prospects, SRC.sra], 'practice_area', { mastersUseful: true }),
  d('Competition Law', 'Competition Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Insolvency Law', 'Insolvency Law', 'SRA / BSB / IPA context', ['SRA', 'BSB'], [SRC.prospects, SRC.sra], 'practice_area'),

  // International
  d('International Law', 'International Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true, includeExecutive: false }),
  d('International Commercial Law', 'International Commercial Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Maritime Law', 'Maritime Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Aviation Law', 'Aviation Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),

  // IP
  d('Intellectual Property', 'Intellectual Property', 'SRA / BSB / CITMA context', ['SRA', 'BSB', 'CITMA'], [SRC.prospects, SRC.ncs], 'practice_area', { mastersUseful: true }),
  d('Copyright', 'Copyright Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area'),
  d('Trademark', 'Trademark Law', 'SRA / BSB / CITMA', ['SRA', 'BSB', 'CITMA'], [SRC.prospects], 'practice_area'),
  d('Patent Law', 'Patent Law', 'SRA / BSB / CIPA context', ['SRA', 'BSB', 'CIPA'], [SRC.prospects], 'practice_area', { mastersUseful: true }),

  // Technology
  d('Technology Law', 'Technology Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Data Protection', 'Data Protection Law', 'SRA / BSB / ICO context', ['SRA', 'BSB', 'ICO'], [SRC.prospects, SRC.gov], 'practice_area', { mastersUseful: true }),
  d('Cyber Law', 'Cyber Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('AI Regulation', 'AI Regulation Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.gov], 'practice_area', { mastersUseful: true }),

  // Environment
  d('Environmental Law', 'Environmental Law', 'SRA / BSB / UKELA', ['SRA', 'BSB', 'UKELA'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Planning Law', 'Planning Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects, SRC.ncs], 'practice_area', { includeJudicial: true }),
  d('Energy Law', 'Energy Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),

  // Healthcare legal
  d('Medical Law', 'Medical Law', 'SRA / BSB', ['SRA', 'BSB'], [SRC.prospects], 'practice_area', { mastersUseful: true }),
  d('Clinical Negligence', 'Clinical Negligence', 'SRA / BSB', ['SRA', 'BSB', 'AvMA context'], [SRC.prospects, SRC.ncs], 'practice_area'),

  // Court services
  d('Court Administration', 'Court Administration', 'HMCTS / Ministry of Justice', ['HMCTS', 'MoJ'], [SRC.hmcts, SRC.moj, SRC.ncs], 'court_justice'),
  d('Tribunal Services', 'Tribunal Services', 'HMCTS / Ministry of Justice', ['HMCTS', 'MoJ'], [SRC.hmcts, SRC.moj], 'court_justice', { includeJudicial: true }),
  d('Judicial Support', 'Judicial Support', 'HMCTS / Judicial Office / JAC', ['HMCTS', 'JAC', 'MoJ'], [SRC.hmcts, SRC.jac, SRC.moj], 'court_justice', { namedJudiciary: true }),

  // Justice
  d('Crown Prosecution', 'Crown Prosecution', 'Crown Prosecution Service', ['CPS', 'SRA', 'BSB'], [SRC.cps, SRC.prospects], 'court_justice'),
  d('Probation Legal Support', 'Probation Legal Support', 'HM Prison and Probation Service / MoJ', ['HMPPS', 'MoJ'], [SRC.moj, SRC.ncs], 'court_justice'),
  d('Prison Legal Services', 'Prison Legal Services', 'MoJ / SRA context', ['MoJ', 'SRA'], [SRC.moj, SRC.prospects], 'court_justice'),

  // Academic
  d('Legal Research', 'Law', 'Society of Legal Scholars / BA context', ['SLS'], [SRC.prospects], 'academic'),
  d('Legal Education', 'Legal Education', 'Society of Legal Scholars / ALT', ['SLS', 'ALT'], [SRC.prospects], 'academic'),
  d('Law Policy Research', 'Law Policy', 'Society of Legal Scholars', ['SLS'], [SRC.prospects, SRC.moj], 'academic'),
]

const ALL_SLUGS = LAW_SPEC_DEFS.map((x) => x.slug)

export const LAW_PACKS: SpecialismPack[] = LAW_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
