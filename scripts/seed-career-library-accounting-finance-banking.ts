/**
 * Seed Accounting, Finance & Banking field + specialisms.
 *   npx tsx scripts/seed-career-library-accounting-finance-banking.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureAfbStageModel,
  FIELD_SLUG,
} from './career-library-accounting-finance/shared'

type Spec = { name: string; description: string; professionalBody: string }

const SPECIALISMS: Spec[] = [
  // Accounting
  {
    name: 'Financial Accounting',
    description: 'External financial reporting, statutory accounts and IFRS/UK GAAP preparation.',
    professionalBody: 'ICAEW / ACCA',
  },
  {
    name: 'Management Accounting',
    description: 'Internal management accounts, costing, variance analysis and decision support.',
    professionalBody: 'CIMA / ACCA',
  },
  {
    name: 'Chartered Accountancy',
    description: 'Chartered accountant training and practice pathways (ACA/ACCA and equivalents).',
    professionalBody: 'ICAEW / ACCA / ICAS',
  },
  {
    name: 'Public Practice Accounting',
    description: 'Accountancy practice serving external clients across audit, accounts and advisory.',
    professionalBody: 'ICAEW / ACCA',
  },
  {
    name: 'Corporate Accounting',
    description: 'In-house corporate accounting for group reporting, consolidations and ledgers.',
    professionalBody: 'ICAEW / ACCA / CIMA',
  },
  {
    name: 'Cost Accounting',
    description: 'Product costing, cost allocation and manufacturing/service cost analysis.',
    professionalBody: 'CIMA / ACCA',
  },
  {
    name: 'Forensic Accounting',
    description: 'Investigation of financial irregularities, disputes and forensic analysis.',
    professionalBody: 'ICAEW / ACCA (forensic)',
  },
  {
    name: 'Government and Public Sector Accounting',
    description: 'Public sector financial reporting, CIPFA frameworks and government accounting.',
    professionalBody: 'CIPFA',
  },
  {
    name: 'Charity and Not-for-Profit Accounting',
    description: 'Charity SORP accounting, fund accounting and not-for-profit financial stewardship.',
    professionalBody: 'ICAEW / ACCA / Charity Finance Group',
  },
  {
    name: 'Accounting Technician',
    description: 'AAT and technician-level bookkeeping, accounts preparation and finance support.',
    professionalBody: 'AAT',
  },
  // Audit & Assurance
  {
    name: 'External Audit',
    description: 'Statutory external audit of financial statements under UK auditing standards.',
    professionalBody: 'ICAEW / ACCA / FRC',
  },
  {
    name: 'Internal Audit',
    description: 'Independent internal assurance on governance, risk and control.',
    professionalBody: 'Institute of Internal Auditors UK',
  },
  {
    name: 'Risk Assurance',
    description: 'Assurance over risk frameworks, controls and enterprise risk processes.',
    professionalBody: 'IIA UK / ICAEW',
  },
  {
    name: 'Financial Controls',
    description: 'Design, testing and improvement of financial internal controls.',
    professionalBody: 'ICAEW / IIA UK',
  },
  {
    name: 'Compliance Audit',
    description: 'Audit of compliance with policies, regulations and control frameworks.',
    professionalBody: 'IIA UK / ICAEW',
  },
  {
    name: 'IT Audit',
    description: 'Assurance over IT general controls, systems and cyber-related financial risk (finance-led).',
    professionalBody: 'IIA UK / ISACA (UK context)',
  },
  {
    name: 'Fraud Investigation',
    description: 'Investigation of suspected fraud, misconduct and financial crime incidents.',
    professionalBody: 'ICAEW / ACFE UK context',
  },
  // Tax
  {
    name: 'Personal Tax',
    description: 'UK personal tax compliance and advice for individuals and sole traders.',
    professionalBody: 'Chartered Institute of Taxation / ATT',
  },
  {
    name: 'Corporate Tax',
    description: 'Corporation tax compliance, planning and corporate tax advisory.',
    professionalBody: 'Chartered Institute of Taxation / ATT',
  },
  {
    name: 'VAT and Indirect Tax',
    description: 'VAT, GST-equivalent and other UK indirect tax compliance and advisory.',
    professionalBody: 'Chartered Institute of Taxation / ATT',
  },
  {
    name: 'International Tax',
    description: 'Cross-border tax, transfer pricing and international tax structuring.',
    professionalBody: 'Chartered Institute of Taxation',
  },
  {
    name: 'Tax Compliance',
    description: 'Preparation and filing of UK tax returns and compliance processes.',
    professionalBody: 'Association of Taxation Technicians / CIOT',
  },
  {
    name: 'Tax Advisory',
    description: 'Tax planning and advisory services beyond routine compliance.',
    professionalBody: 'Chartered Institute of Taxation',
  },
  {
    name: 'Employment Tax',
    description: 'PAYE, NIC, benefits-in-kind and employment tax advisory.',
    professionalBody: 'CIOT / ATT',
  },
  {
    name: 'Customs and Trade Tax',
    description: 'Customs duties, trade compliance and international trade tax.',
    professionalBody: 'CIOT / Institute of Export context',
  },
  // Payroll & Credit
  {
    name: 'Payroll',
    description: 'UK payroll processing, PAYE administration and payroll systems operation.',
    professionalBody: 'CIPP / AAT',
  },
  {
    name: 'Pensions Administration',
    description: 'Occupational and workplace pensions scheme administration and member services.',
    professionalBody: 'Pensions Management Institute',
  },
  {
    name: 'Credit Control',
    description: 'Customer credit management, collections and overdue account control.',
    professionalBody: 'CICM / AAT',
  },
  {
    name: 'Accounts Receivable',
    description: 'Sales ledger, invoicing support and receivables processing.',
    professionalBody: 'AAT / ACCA',
  },
  {
    name: 'Accounts Payable',
    description: 'Purchase ledger, supplier payments and AP processing.',
    professionalBody: 'AAT / ACCA',
  },
  {
    name: 'Billing and Revenue Operations',
    description: 'Billing cycles, revenue operations and invoice-to-cash processes.',
    professionalBody: 'AAT / CIMA context',
  },
  {
    name: 'Debt Recovery',
    description: 'Commercial debt recovery, enforcement liaison and recovery strategy.',
    professionalBody: 'CICM',
  },
  // Banking
  {
    name: 'Retail Banking',
    description: 'Personal banking products, branches/digital retail and customer banking services.',
    professionalBody: 'Chartered Banker Institute / LIBF',
  },
  {
    name: 'Commercial Banking',
    description: 'Banking services for SMEs and mid-market commercial clients.',
    professionalBody: 'Chartered Banker Institute',
  },
  {
    name: 'Corporate Banking',
    description: 'Banking relationships and facilities for large corporates.',
    professionalBody: 'Chartered Banker Institute',
  },
  {
    name: 'Business Banking',
    description: 'Day-to-day business current accounts, payments and SME banking support.',
    professionalBody: 'Chartered Banker Institute / LIBF',
  },
  {
    name: 'Private Banking',
    description: 'Banking and wealth services for high-net-worth private clients.',
    professionalBody: 'Chartered Banker Institute / CISI',
  },
  {
    name: 'Investment Banking',
    description: 'M&A, ECM/DCM and investment banking advisory and execution support.',
    professionalBody: 'CISI / Chartered Banker Institute',
  },
  {
    name: 'Digital Banking',
    description: 'Digital banking product operations, channels and customer digital journeys (finance-led).',
    professionalBody: 'LIBF / Chartered Banker Institute',
  },
  {
    name: 'Banking Operations',
    description: 'Payments, settlements, account servicing and banking back-office operations.',
    professionalBody: 'LIBF / Chartered Banker Institute',
  },
  {
    name: 'Credit Analysis',
    description: 'Credit assessment, borrower analysis and credit recommendation for lending.',
    professionalBody: 'Chartered Banker Institute / LIBF',
  },
  {
    name: 'Lending and Underwriting',
    description: 'Loan underwriting, credit decisions and lending process ownership.',
    professionalBody: 'Chartered Banker Institute',
  },
  {
    name: 'Treasury Operations',
    description: 'Bank treasury operations, funding desks support and ALM operations.',
    professionalBody: 'Association of Corporate Treasurers / Chartered Banker Institute',
  },
  // Finance
  {
    name: 'Corporate Finance',
    description: 'Corporate finance transactions, valuations and deal support.',
    professionalBody: 'ICAEW / CISI',
  },
  {
    name: 'Financial Planning and Analysis',
    description: 'FP&A including management reporting, analysis and performance insight.',
    professionalBody: 'CIMA / ACCA',
  },
  {
    name: 'Treasury',
    description: 'Corporate treasury including cash, funding, FX and liquidity management.',
    professionalBody: 'Association of Corporate Treasurers',
  },
  {
    name: 'Financial Control',
    description: 'Financial control, month-end close, reporting integrity and control environment.',
    professionalBody: 'ICAEW / ACCA / CIMA',
  },
  {
    name: 'Budgeting and Forecasting',
    description: 'Budget cycles, forecasts and rolling outlook processes.',
    professionalBody: 'CIMA / ACCA',
  },
  {
    name: 'Finance Business Partnering',
    description: 'Embedded finance business partners supporting commercial decision-making.',
    professionalBody: 'CIMA / ACCA',
  },
  {
    name: 'Project Finance',
    description: 'Limited-recourse project finance structuring and monitoring.',
    professionalBody: 'ACT / CISI',
  },
  {
    name: 'Infrastructure Finance',
    description: 'Financing of infrastructure assets and PPP/PFI-related structures.',
    professionalBody: 'ACT / CISI',
  },
  {
    name: 'Trade Finance',
    description: 'Letters of credit, trade instruments and working-capital trade finance.',
    professionalBody: 'LIBF / Chartered Banker Institute',
  },
  {
    name: 'Structured Finance',
    description: 'Structured products, securitisation and complex financing structures.',
    professionalBody: 'CISI / ACT',
  },
  // Investment & Markets
  {
    name: 'Investment Management',
    description: 'Managing investment portfolios and investment decision processes.',
    professionalBody: 'CFA Institute (UK context) / CISI',
  },
  {
    name: 'Asset Management',
    description: 'Institutional asset management across funds and mandates.',
    professionalBody: 'CFA Institute (UK context) / CISI',
  },
  {
    name: 'Wealth Management',
    description: 'Wealth management for private clients including portfolio and planning coordination.',
    professionalBody: 'CISI / Personal Finance Society',
  },
  {
    name: 'Equity Research',
    description: 'Sell-side or buy-side equity research and company analysis.',
    professionalBody: 'CFA Institute (UK context) / CISI',
  },
  {
    name: 'Fixed Income',
    description: 'Fixed income analysis, credit markets and bond portfolio support.',
    professionalBody: 'CFA Institute (UK context) / CISI',
  },
  {
    name: 'Capital Markets',
    description: 'Equity and debt capital markets origination and execution support.',
    professionalBody: 'CISI',
  },
  {
    name: 'Trading',
    description: 'Trading desks, execution and market-making support in financial markets.',
    professionalBody: 'CISI',
  },
  {
    name: 'Securities Operations',
    description: 'Securities settlement, custody and middle/back-office securities ops.',
    professionalBody: 'CISI / LIBF',
  },
  {
    name: 'Fund Administration',
    description: 'Fund accounting, NAV production and fund administration services.',
    professionalBody: 'CISI / ACCA context',
  },
  {
    name: 'Portfolio Analysis',
    description: 'Portfolio performance attribution, risk analytics and investment reporting.',
    professionalBody: 'CFA Institute (UK context) / CISI',
  },
  {
    name: 'Investment Operations',
    description: 'Investment middle-office and operations supporting asset managers.',
    professionalBody: 'CISI / LIBF',
  },
  // Insurance
  {
    name: 'Insurance Operations',
    description: 'Policy administration, insurance operations and servicing.',
    professionalBody: 'Chartered Insurance Institute',
  },
  {
    name: 'Underwriting',
    description: 'Insurance underwriting, risk selection and pricing decisions.',
    professionalBody: 'Chartered Insurance Institute',
  },
  {
    name: 'Claims',
    description: 'Insurance claims handling, assessment and settlement.',
    professionalBody: 'Chartered Insurance Institute',
  },
  {
    name: 'Insurance Broking',
    description: 'Insurance broking, client placement and intermediary advice.',
    professionalBody: 'Chartered Insurance Institute / BIBA',
  },
  {
    name: 'Actuarial Support',
    description: 'Support to actuarial teams on pricing, reserving and modelling (not full actuary track alone).',
    professionalBody: 'Institute and Faculty of Actuaries',
  },
  {
    name: 'Risk Pricing',
    description: 'Insurance and financial risk pricing analytics and tariff development.',
    professionalBody: 'IFoA / CII',
  },
  {
    name: 'Reinsurance',
    description: 'Reinsurance placement, treaty management and reinsurer relationships.',
    professionalBody: 'Chartered Insurance Institute',
  },
  {
    name: 'Insurance Compliance',
    description: 'Insurance regulatory compliance, conduct and governance support.',
    professionalBody: 'CII / FCA context',
  },
  // Financial Advice & Planning
  {
    name: 'Financial Advice',
    description: 'FCA-regulated financial advice for retail clients.',
    professionalBody: 'Personal Finance Society / CISI',
  },
  {
    name: 'Mortgage Advice',
    description: 'FCA-regulated mortgage advice and intermediary activity.',
    professionalBody: 'LIBF / PFS / CeMAP pathways',
  },
  {
    name: 'Pensions Advice',
    description: 'Regulated pensions advice including retirement options and transfers where authorised.',
    professionalBody: 'Personal Finance Society',
  },
  {
    name: 'Wealth Planning',
    description: 'Holistic wealth planning coordinating investments, tax wrappers and protection.',
    professionalBody: 'Personal Finance Society / CISI',
  },
  {
    name: 'Financial Planning',
    description: 'Cashflow-based financial planning and goal-based planning processes.',
    professionalBody: 'Personal Finance Society / CISI',
  },
  {
    name: 'Paraplanning',
    description: 'Technical research and report preparation supporting regulated advisers.',
    professionalBody: 'Personal Finance Society / LIBF',
  },
  // Risk & Compliance
  {
    name: 'Financial Risk',
    description: 'Enterprise and financial risk identification, measurement and reporting.',
    professionalBody: 'PRMIA / GARP (UK context) / ICAEW',
  },
  {
    name: 'Credit Risk',
    description: 'Credit risk frameworks, models oversight and portfolio credit risk.',
    professionalBody: 'Chartered Banker Institute / GARP context',
  },
  {
    name: 'Market Risk',
    description: 'Market risk measurement, limits and trading book risk oversight.',
    professionalBody: 'GARP (UK context) / CISI',
  },
  {
    name: 'Operational Risk',
    description: 'Operational risk events, RCSA and control effectiveness in financial services.',
    professionalBody: 'IOR / IIA UK',
  },
  {
    name: 'Financial Crime',
    description: 'Financial crime prevention frameworks covering fraud, bribery and related risks.',
    professionalBody: 'ICAEW / ICAEW FS / ICA context',
  },
  {
    name: 'Anti-Money Laundering',
    description: 'AML frameworks, suspicious activity handling and MLRO support.',
    professionalBody: 'ICA / FCA context',
  },
  {
    name: 'Know Your Customer',
    description: 'KYC/CDD processes, onboarding due diligence and periodic reviews.',
    professionalBody: 'ICA / LIBF',
  },
  {
    name: 'Regulatory Compliance',
    description: 'FCA/PRA regulatory compliance monitoring and advisory within firms.',
    professionalBody: 'ICAEW / CISI / ICA',
  },
  {
    name: 'Fraud Prevention',
    description: 'Fraud detection, prevention controls and fraud strategy in finance environments.',
    professionalBody: 'Cifas context / ICAEW',
  },
  // Quantitative & Specialist
  {
    name: 'Quantitative Finance',
    description: 'Quantitative modelling for pricing, risk and investment decisions.',
    professionalBody: 'CFA Institute / IFoA / CISI',
  },
  {
    name: 'Financial Modelling',
    description: 'Build and review of financial models for transactions, FP&A and valuation.',
    professionalBody: 'ICAEW / CIMA / ACT',
  },
  {
    name: 'Financial Data Analysis',
    description: 'Analysis of financial datasets for reporting, risk and performance insight.',
    professionalBody: 'CIMA / ACCA / RSS context',
  },
  {
    name: 'FinTech Finance',
    description: 'Finance roles within FinTech covering payments, lending platforms and digital finance ops.',
    professionalBody: 'LIBF / ACCA / CIMA',
  },
  {
    name: 'Climate and Sustainable Finance',
    description: 'Climate risk, green finance and sustainable investment finance roles.',
    professionalBody: 'CISI / CFA Institute / ICAEW',
  },
  {
    name: 'ESG Finance',
    description: 'ESG metrics in finance, reporting and investment integration (finance-led).',
    professionalBody: 'CISI / CFA Institute / ICAEW',
  },
  {
    name: 'Islamic Finance',
    description: 'Sharia-compliant banking, finance products and Islamic treasury structures.',
    professionalBody: 'CISI / Chartered Banker Institute',
  },
  // Academic & Research
  {
    name: 'Accounting Research',
    description: 'Academic and applied research in accounting theory, reporting and accountability.',
    professionalBody: 'British Accounting and Finance Association',
  },
  {
    name: 'Finance Research',
    description: 'Academic research in corporate finance, asset pricing and financial markets.',
    professionalBody: 'British Accounting and Finance Association',
  },
  {
    name: 'Banking Research',
    description: 'Academic research on banking systems, financial intermediation and regulation.',
    professionalBody: 'British Accounting and Finance Association',
  },
  {
    name: 'Investment Research',
    description: 'Academic research on investments, portfolio theory and market microstructure.',
    professionalBody: 'BAFA / CFA research context',
  },
  {
    name: 'Financial Economics Research',
    description:
      'Research at the finance–economics boundary (distinct from general Economics field policy/theory tracks).',
    professionalBody: 'BAFA / Royal Economic Society (finance context)',
  },
]

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureAfbStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Accounting, Finance & Banking') || FIELD_SLUG
  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .eq('slug', fieldSlug)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Accounting, Finance & Banking',
        slug: fieldSlug,
        description:
          'UK accounting, finance, banking, tax, audit, insurance, investment and regulated advice careers. Progression combines apprenticeships, technician routes, graduate schemes, professional exams, experience and regulatory status. Degrees and Master\'s are not automatic seniority. Distinct from Business & Management, IT, Law, Economics and HR.',
        status: 'draft',
        active: true,
        sort_order: 60,
      })
      .select('id, name, slug')
      .single()
    if (error || !created) throw new Error(error?.message ?? 'Failed to create field')
    fieldId = created.id
    fieldCreated = true
    console.log(`Created field: ${created.name} (${created.slug})`)
  }

  const { data: existingSpecialisms } = await supabase
    .from('career_library_specialisms')
    .select('id, name, slug')
    .eq('field_id', fieldId)

  const existingBySlug = new Set((existingSpecialisms ?? []).map((s) => s.slug))
  const existingByName = new Set(
    (existingSpecialisms ?? []).map((s) => s.name.trim().toLowerCase())
  )

  let createdCount = 0
  let skipped = 0

  for (let i = 0; i < SPECIALISMS.length; i++) {
    const item = SPECIALISMS[i]
    const slug = normalizeSlug(undefined, item.name)
    if (!slug) {
      skipped += 1
      continue
    }
    if (existingBySlug.has(slug) || existingByName.has(item.name.trim().toLowerCase())) {
      await supabase
        .from('career_library_specialisms')
        .update({
          stage_model_id: modelId,
          professional_body: item.professionalBody,
          regulated_profession: /advice|mortgage|pensions advice/i.test(item.name),
          status: 'draft',
        })
        .eq('field_id', fieldId)
        .eq('slug', slug)
      skipped += 1
      continue
    }

    const { error } = await supabase.from('career_library_specialisms').insert({
      field_id: fieldId,
      name: item.name,
      slug,
      description: item.description,
      stage_model_id: modelId,
      regulated_profession: /advice|mortgage|pensions advice/i.test(item.name),
      professional_body: item.professionalBody,
      status: 'draft',
      active: true,
      sort_order: (i + 1) * 10,
    })

    if (error) {
      if (error.code === '23505') {
        skipped += 1
        continue
      }
      throw new Error(`${item.name}: ${error.message}`)
    }
    createdCount += 1
    existingBySlug.add(slug)
  }

  console.log('\n=== Accounting, Finance & Banking foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: accounting_finance_banking_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${SPECIALISMS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
