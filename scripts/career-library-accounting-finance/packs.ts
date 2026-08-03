/**
 * Specialism definitions for Accounting, Finance & Banking packs.
 */

import { normalizeSlug } from '../../lib/admin/career-library/guards'
import { buildPack, type SpecDef } from './roleFactory'
import type { SpecialismPack } from './shared'

const SRC = {
  ncs: 'national_careers_service_uk',
  prospects: 'prospects_uk_finance_careers',
  gov: 'gov_uk_apprenticeships_finance',
  fca: 'fca_regulated_activities',
  icaew: 'icaew_careers',
  acca: 'acca_careers',
  cima: 'cima_careers',
  cipfa: 'cipfa_careers',
  aat: 'aat_careers',
  ciot: 'ciot_att_careers',
  iia: 'iia_uk_careers',
  cbi: 'chartered_banker_institute',
  libf: 'libf_careers',
  cii: 'cii_careers',
  pfs: 'personal_finance_society',
  cfa: 'cfa_institute_uk_context',
  cisi: 'cisi_careers',
  act: 'association_corporate_treasurers',
  ifoa: 'institute_faculty_actuaries',
  frc: 'frc_audit_uk',
  pra: 'pra_uk_context',
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
  const slug = normalizeSlug(undefined, label)!
  return {
    slug,
    label,
    short,
    professionalBody,
    relatedBodies,
    sources,
    profile,
    ...extra,
  }
}

export const AFB_SPEC_DEFS: SpecDef[] = [
  // Accounting
  d('Financial Accounting', 'Financial Accounting', 'ICAEW / ACCA', ['ICAEW', 'ACCA', 'FRC'], [SRC.ncs, SRC.prospects, SRC.icaew, SRC.acca], 'accounting_professional'),
  d('Management Accounting', 'Management Accounting', 'CIMA / ACCA', ['CIMA', 'ACCA'], [SRC.ncs, SRC.cima, SRC.acca], 'accounting_professional'),
  d('Chartered Accountancy', 'Chartered', 'ICAEW / ACCA / ICAS', ['ICAEW', 'ACCA', 'ICAS'], [SRC.icaew, SRC.acca, SRC.prospects], 'accounting_professional'),
  d('Public Practice Accounting', 'Public Practice', 'ICAEW / ACCA', ['ICAEW', 'ACCA'], [SRC.icaew, SRC.acca, SRC.ncs], 'accounting_professional'),
  d('Corporate Accounting', 'Corporate Accounting', 'ICAEW / ACCA / CIMA', ['ICAEW', 'ACCA', 'CIMA'], [SRC.icaew, SRC.acca, SRC.cima], 'accounting_professional'),
  d('Cost Accounting', 'Cost Accounting', 'CIMA / ACCA', ['CIMA', 'ACCA'], [SRC.cima, SRC.acca], 'accounting_professional'),
  d('Forensic Accounting', 'Forensic Accounting', 'ICAEW / ACCA (forensic)', ['ICAEW', 'ACCA'], [SRC.icaew, SRC.acca, SRC.prospects], 'accounting_professional'),
  d('Government and Public Sector Accounting', 'Public Sector Accounting', 'CIPFA', ['CIPFA'], [SRC.cipfa, SRC.ncs, SRC.prospects], 'accounting_professional'),
  d('Charity and Not-for-Profit Accounting', 'Charity Accounting', 'ICAEW / ACCA / Charity Finance Group', ['ICAEW', 'ACCA', 'CFG'], [SRC.icaew, SRC.acca, SRC.ncs], 'accounting_professional'),
  d('Accounting Technician', 'Accounts Technician', 'AAT', ['AAT', 'ACCA'], [SRC.aat, SRC.gov, SRC.ncs], 'technician_heavy'),

  // Audit
  d('External Audit', 'External Audit', 'ICAEW / ACCA / FRC', ['ICAEW', 'ACCA', 'FRC'], [SRC.frc, SRC.icaew, SRC.acca], 'audit'),
  d('Internal Audit', 'Internal Audit', 'Institute of Internal Auditors UK', ['IIA UK'], [SRC.iia, SRC.prospects], 'audit'),
  d('Risk Assurance', 'Risk Assurance', 'IIA UK / ICAEW', ['IIA UK', 'ICAEW'], [SRC.iia, SRC.icaew], 'audit'),
  d('Financial Controls', 'Financial Controls', 'ICAEW / IIA UK', ['ICAEW', 'IIA UK'], [SRC.icaew, SRC.iia], 'audit'),
  d('Compliance Audit', 'Compliance Audit', 'IIA UK / ICAEW', ['IIA UK', 'ICAEW'], [SRC.iia, SRC.icaew], 'audit'),
  d('IT Audit', 'IT Audit', 'IIA UK / ISACA (UK context)', ['IIA UK', 'ISACA'], [SRC.iia, SRC.prospects], 'audit'),
  d('Fraud Investigation', 'Fraud Investigation', 'ICAEW / ACFE UK context', ['ICAEW'], [SRC.icaew, SRC.prospects], 'audit'),

  // Tax
  d('Personal Tax', 'Personal Tax', 'Chartered Institute of Taxation / ATT', ['CIOT', 'ATT'], [SRC.ciot, SRC.ncs], 'tax'),
  d('Corporate Tax', 'Corporate Tax', 'Chartered Institute of Taxation / ATT', ['CIOT', 'ATT'], [SRC.ciot, SRC.prospects], 'tax'),
  d('VAT and Indirect Tax', 'VAT', 'Chartered Institute of Taxation / ATT', ['CIOT', 'ATT'], [SRC.ciot, SRC.gov], 'tax'),
  d('International Tax', 'International Tax', 'Chartered Institute of Taxation', ['CIOT'], [SRC.ciot, SRC.prospects], 'tax'),
  d('Tax Compliance', 'Tax Compliance', 'Association of Taxation Technicians / CIOT', ['ATT', 'CIOT'], [SRC.ciot, SRC.ncs], 'tax'),
  d('Tax Advisory', 'Tax Advisory', 'Chartered Institute of Taxation', ['CIOT'], [SRC.ciot, SRC.prospects], 'tax'),
  d('Employment Tax', 'Employment Tax', 'CIOT / ATT', ['CIOT', 'ATT'], [SRC.ciot, SRC.gov], 'tax'),
  d('Customs and Trade Tax', 'Customs Tax', 'CIOT / Institute of Export context', ['CIOT'], [SRC.ciot, SRC.gov], 'tax'),

  // Payroll & Credit
  d('Payroll', 'Payroll', 'CIPP / AAT', ['CIPP', 'AAT'], [SRC.ncs, SRC.aat, SRC.gov], 'payroll_credit'),
  d('Pensions Administration', 'Pensions Administration', 'Pensions Management Institute', ['PMI'], [SRC.ncs, SRC.prospects], 'payroll_credit'),
  d('Credit Control', 'Credit Control', 'CICM / AAT', ['CICM', 'AAT'], [SRC.ncs, SRC.aat], 'payroll_credit'),
  d('Accounts Receivable', 'Accounts Receivable', 'AAT / ACCA', ['AAT', 'ACCA'], [SRC.aat, SRC.ncs], 'payroll_credit'),
  d('Accounts Payable', 'Accounts Payable', 'AAT / ACCA', ['AAT', 'ACCA'], [SRC.aat, SRC.ncs], 'payroll_credit'),
  d('Billing and Revenue Operations', 'Billing Operations', 'AAT / CIMA context', ['AAT', 'CIMA'], [SRC.aat, SRC.cima], 'payroll_credit'),
  d('Debt Recovery', 'Debt Recovery', 'CICM', ['CICM'], [SRC.ncs, SRC.prospects], 'payroll_credit'),

  // Banking
  d('Retail Banking', 'Retail Banking', 'Chartered Banker Institute / LIBF', ['CBI', 'LIBF'], [SRC.cbi, SRC.libf, SRC.ncs], 'banking_retail'),
  d('Commercial Banking', 'Commercial Banking', 'Chartered Banker Institute', ['CBI'], [SRC.cbi, SRC.prospects], 'banking_retail'),
  d('Corporate Banking', 'Corporate Banking', 'Chartered Banker Institute', ['CBI'], [SRC.cbi, SRC.prospects], 'banking_markets'),
  d('Business Banking', 'Business Banking', 'Chartered Banker Institute / LIBF', ['CBI', 'LIBF'], [SRC.cbi, SRC.libf, SRC.ncs], 'banking_retail'),
  d('Private Banking', 'Private Banking', 'Chartered Banker Institute / CISI', ['CBI', 'CISI'], [SRC.cbi, SRC.cisi], 'banking_markets', { includeRegulated: true }),
  d('Investment Banking', 'Investment Banking', 'CISI / Chartered Banker Institute', ['CISI', 'CBI'], [SRC.cisi, SRC.cbi, SRC.prospects], 'banking_markets'),
  d('Digital Banking', 'Digital Banking', 'LIBF / Chartered Banker Institute', ['LIBF', 'CBI'], [SRC.libf, SRC.cbi], 'banking_retail'),
  d('Banking Operations', 'Banking Operations', 'LIBF / Chartered Banker Institute', ['LIBF', 'CBI'], [SRC.libf, SRC.cbi, SRC.ncs], 'banking_retail'),
  d('Credit Analysis', 'Credit Analysis', 'Chartered Banker Institute / LIBF', ['CBI', 'LIBF'], [SRC.cbi, SRC.libf], 'banking_markets'),
  d('Lending and Underwriting', 'Lending Underwriting', 'Chartered Banker Institute', ['CBI'], [SRC.cbi, SRC.prospects], 'banking_markets'),
  d('Treasury Operations', 'Treasury Operations', 'Association of Corporate Treasurers / Chartered Banker Institute', ['ACT', 'CBI'], [SRC.act, SRC.cbi], 'banking_markets'),

  // Finance
  d('Corporate Finance', 'Corporate Finance', 'ICAEW / CISI', ['ICAEW', 'CISI'], [SRC.icaew, SRC.cisi, SRC.prospects], 'banking_markets'),
  d('Financial Planning and Analysis', 'FP&A', 'CIMA / ACCA', ['CIMA', 'ACCA'], [SRC.cima, SRC.acca, SRC.ncs], 'corporate_finance'),
  d('Treasury', 'Corporate Treasury', 'Association of Corporate Treasurers', ['ACT'], [SRC.act, SRC.prospects], 'corporate_finance'),
  d('Financial Control', 'Financial Control', 'ICAEW / ACCA / CIMA', ['ICAEW', 'ACCA', 'CIMA'], [SRC.icaew, SRC.acca, SRC.cima], 'corporate_finance'),
  d('Budgeting and Forecasting', 'Budgeting', 'CIMA / ACCA', ['CIMA', 'ACCA'], [SRC.cima, SRC.acca], 'corporate_finance'),
  d('Finance Business Partnering', 'Finance Business Partnering', 'CIMA / ACCA', ['CIMA', 'ACCA'], [SRC.cima, SRC.acca], 'corporate_finance'),
  d('Project Finance', 'Project Finance', 'ACT / CISI', ['ACT', 'CISI'], [SRC.act, SRC.cisi], 'banking_markets'),
  d('Infrastructure Finance', 'Infrastructure Finance', 'ACT / CISI', ['ACT', 'CISI'], [SRC.act, SRC.cisi], 'banking_markets'),
  d('Trade Finance', 'Trade Finance', 'LIBF / Chartered Banker Institute', ['LIBF', 'CBI'], [SRC.libf, SRC.cbi], 'banking_markets'),
  d('Structured Finance', 'Structured Finance', 'CISI / ACT', ['CISI', 'ACT'], [SRC.cisi, SRC.act], 'banking_markets'),

  // Investment
  d('Investment Management', 'Investment Management', 'CFA Institute (UK context) / CISI', ['CFA', 'CISI'], [SRC.cfa, SRC.cisi, SRC.prospects], 'investment', { includeRegulated: true, mastersRelevantPractitioner: true }),
  d('Asset Management', 'Asset Management', 'CFA Institute (UK context) / CISI', ['CFA', 'CISI'], [SRC.cfa, SRC.cisi], 'investment', { mastersRelevantPractitioner: true }),
  d('Wealth Management', 'Wealth Management', 'CISI / Personal Finance Society', ['CISI', 'PFS'], [SRC.cisi, SRC.pfs, SRC.fca], 'investment', { includeRegulated: true }),
  d('Equity Research', 'Equity Research', 'CFA Institute (UK context) / CISI', ['CFA', 'CISI'], [SRC.cfa, SRC.cisi], 'investment', { mastersRelevantPractitioner: true }),
  d('Fixed Income', 'Fixed Income', 'CFA Institute (UK context) / CISI', ['CFA', 'CISI'], [SRC.cfa, SRC.cisi], 'investment', { mastersRelevantPractitioner: true }),
  d('Capital Markets', 'Capital Markets', 'CISI', ['CISI'], [SRC.cisi, SRC.prospects], 'banking_markets'),
  d('Trading', 'Trading', 'CISI', ['CISI'], [SRC.cisi, SRC.prospects], 'banking_markets'),
  d('Securities Operations', 'Securities Operations', 'CISI / LIBF', ['CISI', 'LIBF'], [SRC.cisi, SRC.libf], 'investment'),
  d('Fund Administration', 'Fund Administration', 'CISI / ACCA context', ['CISI', 'ACCA'], [SRC.cisi, SRC.acca], 'investment'),
  d('Portfolio Analysis', 'Portfolio Analysis', 'CFA Institute (UK context) / CISI', ['CFA', 'CISI'], [SRC.cfa, SRC.cisi], 'investment', { mastersRelevantPractitioner: true }),
  d('Investment Operations', 'Investment Operations', 'CISI / LIBF', ['CISI', 'LIBF'], [SRC.cisi, SRC.libf], 'investment'),

  // Insurance
  d('Insurance Operations', 'Insurance Operations', 'Chartered Insurance Institute', ['CII'], [SRC.cii, SRC.ncs], 'insurance'),
  d('Underwriting', 'Insurance Underwriting', 'Chartered Insurance Institute', ['CII'], [SRC.cii, SRC.prospects], 'insurance'),
  d('Claims', 'Insurance Claims', 'Chartered Insurance Institute', ['CII'], [SRC.cii, SRC.ncs], 'insurance'),
  d('Insurance Broking', 'Insurance Broking', 'Chartered Insurance Institute / BIBA', ['CII', 'BIBA'], [SRC.cii, SRC.fca], 'insurance'),
  d('Actuarial Support', 'Actuarial Support', 'Institute and Faculty of Actuaries', ['IFoA'], [SRC.ifoa, SRC.prospects], 'quantitative', { mastersRelevantPractitioner: true }),
  d('Risk Pricing', 'Risk Pricing', 'IFoA / CII', ['IFoA', 'CII'], [SRC.ifoa, SRC.cii], 'quantitative', { mastersRelevantPractitioner: true }),
  d('Reinsurance', 'Reinsurance', 'Chartered Insurance Institute', ['CII'], [SRC.cii, SRC.prospects], 'insurance'),
  d('Insurance Compliance', 'Insurance Compliance', 'CII / FCA context', ['CII', 'FCA'], [SRC.cii, SRC.fca], 'risk_compliance', { includeRegulated: true }),

  // Financial Advice
  d('Financial Advice', 'Financial Advice', 'Personal Finance Society / CISI', ['PFS', 'CISI', 'FCA'], [SRC.pfs, SRC.fca, SRC.cisi], 'regulated_advice'),
  d('Mortgage Advice', 'Mortgage Advice', 'LIBF / PFS / CeMAP pathways', ['LIBF', 'PFS', 'FCA'], [SRC.libf, SRC.pfs, SRC.fca], 'regulated_advice'),
  d('Pensions Advice', 'Pensions Advice', 'Personal Finance Society', ['PFS', 'FCA'], [SRC.pfs, SRC.fca], 'regulated_advice'),
  d('Wealth Planning', 'Wealth Planning', 'Personal Finance Society / CISI', ['PFS', 'CISI'], [SRC.pfs, SRC.cisi, SRC.fca], 'regulated_advice'),
  d('Financial Planning', 'Financial Planning', 'Personal Finance Society / CISI', ['PFS', 'CISI'], [SRC.pfs, SRC.cisi], 'regulated_advice'),
  d('Paraplanning', 'Paraplanner', 'Personal Finance Society / LIBF', ['PFS', 'LIBF'], [SRC.pfs, SRC.libf], 'regulated_advice'),

  // Risk & Compliance
  d('Financial Risk', 'Financial Risk', 'PRMIA / GARP (UK context) / ICAEW', ['PRMIA', 'GARP', 'ICAEW'], [SRC.icaew, SRC.prospects], 'risk_compliance', { mastersRelevantPractitioner: true }),
  d('Credit Risk', 'Credit Risk', 'Chartered Banker Institute / GARP context', ['CBI', 'GARP'], [SRC.cbi, SRC.prospects], 'risk_compliance', { mastersRelevantPractitioner: true }),
  d('Market Risk', 'Market Risk', 'GARP (UK context) / CISI', ['GARP', 'CISI'], [SRC.cisi, SRC.prospects], 'risk_compliance', { mastersRelevantPractitioner: true }),
  d('Operational Risk', 'Operational Risk', 'IOR / IIA UK', ['IOR', 'IIA UK'], [SRC.iia, SRC.prospects], 'risk_compliance'),
  d('Financial Crime', 'Financial Crime', 'ICAEW / ICA context', ['ICAEW', 'ICA'], [SRC.icaew, SRC.fca], 'risk_compliance', { includeRegulated: true }),
  d('Anti-Money Laundering', 'AML', 'ICA / FCA context', ['ICA', 'FCA'], [SRC.fca, SRC.ncs], 'risk_compliance', { includeRegulated: true }),
  d('Know Your Customer', 'KYC', 'ICA / LIBF', ['ICA', 'LIBF'], [SRC.libf, SRC.fca], 'risk_compliance'),
  d('Regulatory Compliance', 'Regulatory Compliance', 'ICAEW / CISI / ICA', ['ICAEW', 'CISI', 'ICA', 'FCA', 'PRA'], [SRC.fca, SRC.pra, SRC.icaew], 'risk_compliance', { includeRegulated: true }),
  d('Fraud Prevention', 'Fraud Prevention', 'Cifas context / ICAEW', ['ICAEW'], [SRC.icaew, SRC.ncs], 'risk_compliance'),

  // Quantitative
  d('Quantitative Finance', 'Quantitative Finance', 'CFA Institute / IFoA / CISI', ['CFA', 'IFoA', 'CISI'], [SRC.cfa, SRC.ifoa, SRC.cisi], 'quantitative', { mastersRelevantPractitioner: true, phdTrack: true }),
  d('Financial Modelling', 'Financial Modelling', 'ICAEW / CIMA / ACT', ['ICAEW', 'CIMA', 'ACT'], [SRC.icaew, SRC.cima, SRC.act], 'quantitative'),
  d('Financial Data Analysis', 'Financial Data Analysis', 'CIMA / ACCA / RSS context', ['CIMA', 'ACCA'], [SRC.cima, SRC.acca], 'quantitative'),
  d('FinTech Finance', 'FinTech Finance', 'LIBF / ACCA / CIMA', ['LIBF', 'ACCA', 'CIMA'], [SRC.libf, SRC.acca, SRC.cima], 'corporate_finance'),
  d('Climate and Sustainable Finance', 'Sustainable Finance', 'CISI / CFA Institute / ICAEW', ['CISI', 'CFA', 'ICAEW'], [SRC.cisi, SRC.cfa, SRC.icaew], 'investment', { mastersRelevantPractitioner: true }),
  d('ESG Finance', 'ESG Finance', 'CISI / CFA Institute / ICAEW', ['CISI', 'CFA', 'ICAEW'], [SRC.cisi, SRC.cfa, SRC.icaew], 'investment'),
  d('Islamic Finance', 'Islamic Finance', 'CISI / Chartered Banker Institute', ['CISI', 'CBI'], [SRC.cisi, SRC.cbi], 'banking_markets'),

  // Academic
  d('Accounting Research', 'Accounting', 'British Accounting and Finance Association', ['BAFA'], [SRC.prospects, SRC.icaew], 'academic'),
  d('Finance Research', 'Finance', 'British Accounting and Finance Association', ['BAFA'], [SRC.prospects, SRC.cfa], 'academic'),
  d('Banking Research', 'Banking', 'British Accounting and Finance Association', ['BAFA'], [SRC.prospects, SRC.cbi], 'academic'),
  d('Investment Research', 'Investments', 'BAFA / CFA research context', ['BAFA', 'CFA'], [SRC.prospects, SRC.cfa], 'academic'),
  d('Financial Economics Research', 'Financial Economics', 'BAFA / Royal Economic Society (finance context)', ['BAFA', 'RES'], [SRC.prospects], 'academic'),
]

const ALL_SLUGS = AFB_SPEC_DEFS.map((x) => x.slug)

export const AFB_PACKS: SpecialismPack[] = AFB_SPEC_DEFS.map((def) => buildPack(def, ALL_SLUGS))
