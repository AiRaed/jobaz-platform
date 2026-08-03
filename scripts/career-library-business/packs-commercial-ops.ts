import { r, type SpecialismPack } from './shared'

const COMMERCIAL_OPS_SIBLINGS = [
  'commercial-management',
  'procurement',
  'purchasing',
  'contract-management',
  'supplier-management',
  'category-management',
  'bid-and-proposal-management',
  'tender-management',
  'service-management',
  'facilities-and-workplace-management',
  'quality-management',
  'customer-operations',
  'shared-services',
  'business-support',
  'office-management',
  'executive-support',
]

function siblings(except: string) {
  return COMMERCIAL_OPS_SIBLINGS.filter((s) => s !== except)
}

const CIPS = 'Chartered Institute of Procurement & Supply (CIPS)'
const CIPS_SOURCES = [
  'cips_careers',
  'prospects_buyer_purchasing',
  'national_careers_service_procurement',
  'govuk_commercial_profession',
]

const COMMERCIAL_MANAGEMENT: SpecialismPack = {
  slug: 'commercial-management',
  label: 'Commercial Management',
  professionalBody: 'CIPS / Institute of Commercial Management',
  relatedBodies: ['CIPS', 'ICM', 'WorldCC'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('commercial-management'),
  roles: [
    r(
      'Commercial Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship route into commercial support, pricing records and contract administration under qualified commercial staff.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Commercial admin apprenticeship — not Procurement Apprentice, Purchasing Clerk or Quantity Surveying technician routes.',
      }
    ),
    r(
      'Commercial Support Assistant',
      'foundation_business_support',
      'Provides administrative support to commercial teams including pricing files, bid folders and contract correspondence.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Commercial support assistant — not Business Support Administrator or Office Administrator general admin roles.',
      }
    ),
    r(
      'Graduate Commercial Analyst',
      'graduate_entry',
      'Graduate entry analysing commercial performance, margin data and contract KPIs for business units or projects.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate commercial analyst — not Graduate Management Consultant or Finance Analyst reporting roles.',
      }
    ),
    r(
      'Junior Commercial Officer',
      'junior_practitioner',
      'Early-career commercial role supporting pricing, risk registers and commercial documentation on projects or accounts.',
      {
        priority: 40,
        eligibilityNote:
          'Junior commercial officer — not Junior Procurement Officer or Junior Contract Administrator titles.',
      }
    ),
    r(
      'Commercial Officer',
      'junior_practitioner',
      'Delivers day-to-day commercial activities including cost tracking, variation support and stakeholder commercial queries.',
      {
        priority: 50,
        eligibilityNote:
          'Commercial officer — distinct from Procurement Officer (sourcing) and Purchasing Officer (transactional buying).',
      }
    ),
    r(
      'Commercial Manager (Project)',
      'practitioner',
      'Owns commercial delivery on projects or programmes including margin, risk and client/supplier commercial interfaces.',
      {
        priority: 60,
        eligibilityNote:
          'Project commercial manager — not Construction Commercial Manager (QS) unless dual remit in built environment.',
      }
    ),
    r(
      'Commercial Manager (Business Unit)',
      'practitioner',
      'Manages commercial performance for a business unit covering pricing strategy, revenue protection and deal governance.',
      {
        priority: 70,
        eligibilityNote:
          'Business unit commercial manager — not Sales Manager or Account Manager customer-facing sales leadership.',
      }
    ),
    r(
      'Senior Commercial Manager',
      'experienced_manager',
      'Experienced commercial lead overseeing multiple workstreams, commercial policy application and team coaching.',
      {
        priority: 80,
        eligibilityNote:
          'Senior commercial manager — not Senior Procurement Manager or Senior Category Manager spend-category roles.',
      }
    ),
    r(
      'Commercial Lead (Portfolio)',
      'experienced_manager',
      'Leads commercial practice across a portfolio of contracts or accounts with accountability for commercial outcomes.',
      {
        priority: 90,
        eligibilityNote:
          'Portfolio commercial lead — not Programme Manager delivery-only or Bid Manager proposal-only roles.',
      }
    ),
    r(
      'Head of Commercial',
      'senior_manager_specialist',
      'Senior leader setting commercial standards, governance and capability for an organisation or division.',
      {
        priority: 100,
        eligibilityNote:
          'Head of commercial function — not Head of Procurement or Head of Finance executive titles.',
      }
    ),
    r(
      'Commercial Director',
      'director_executive',
      'Executive ownership of commercial strategy, major deal governance and enterprise commercial risk appetite.',
      {
        priority: 110,
        eligibilityNote:
          'Commercial director — not Finance Director or Operations Director without explicit commercial remit.',
      }
    ),
    r(
      'Independent Commercial Consultant',
      'consultant_independent',
      'Self-employed or consulting-firm advisor on commercial strategy, contract models and pricing frameworks.',
      {
        priority: 120,
        eligibilityNote:
          'Commercial consulting — not Management Consulting generalist or Legal commercial law advisory.',
      }
    ),
    r(
      'Lecturer in Commercial Management',
      'academic_research',
      'Teaches and researches commercial management, contract economics and organisational commercial practice in HE.',
      {
        priority: 130,
        eligibilityNote:
          'Academic commercial management — not CIPS trainer-only or professional body course delivery without academic contract.',
        isResearchRole: true,
      }
    ),
    r(
      'Research Fellow (Commercial and Contract Practice)',
      'academic_research',
      'Conducts applied research on commercial models, procurement outcomes and contract performance in UK contexts.',
      {
        priority: 140,
        eligibilityNote:
          'Commercial practice research — not Construction Commercial Research in QS-only built-environment specialisms.',
        isResearchRole: true,
        fitClassification: 'realistic_next',
        academicRequirement: 'phd_relevant',
      }
    ),
  ],
}

const PROCUREMENT: SpecialismPack = {
  slug: 'procurement',
  label: 'Procurement',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'WorldCC', 'Government Commercial Function'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('procurement'),
  roles: [
    r(
      'Procurement Apprentice',
      'foundation_business_support',
      'Apprenticeship learning sourcing basics, purchase order processing and supplier communication under CIPS-aligned supervision.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Procurement apprenticeship — not Purchasing Clerk (transactional) or Supply Chain Warehouse operative routes.',
      }
    ),
    r(
      'Procurement Administrator',
      'foundation_business_support',
      'Maintains procurement records, tender registers and supplier documentation for a procurement team.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Procurement administrator — not Purchasing Administrator (PO-focused) or Office Administrator.',
      }
    ),
    r(
      'Graduate Procurement Trainee',
      'graduate_entry',
      'Graduate scheme or trainee route building strategic sourcing, category awareness and CIPS qualification pathways.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate procurement trainee — not Graduate Buyer in retail merchandising or Graduate Logistics roles.',
      }
    ),
    r(
      'Junior Procurement Officer',
      'junior_practitioner',
      'Supports sourcing events, supplier onboarding and contract requisitions with growing independence.',
      {
        priority: 40,
        eligibilityNote:
          'Junior procurement officer — not Junior Purchasing Officer (transactional PO processing emphasis).',
      }
    ),
    r(
      'Procurement Officer',
      'junior_practitioner',
      'Runs sourcing activities, evaluates supplier quotes and manages procurement compliance for assigned categories.',
      {
        priority: 50,
        eligibilityNote:
          'Procurement officer (strategic sourcing) — distinct from Purchasing Officer (tactical buying) and Buyer (retail/merchandising).',
      }
    ),
    r(
      'Procurement Specialist',
      'practitioner',
      'Owns end-to-end procurement for defined spend areas including market analysis and negotiation support.',
      {
        priority: 60,
        eligibilityNote:
          'Procurement specialist — not Category Manager (category strategy lead) unless dual title in same organisation.',
      }
    ),
    r(
      'Procurement Manager',
      'practitioner',
      'Manages procurement delivery, team workload and supplier relationship governance for a function or site.',
      {
        priority: 70,
        eligibilityNote:
          'Procurement manager — not Purchasing Manager (transactional buying team) or Supply Chain Manager (logistics).',
      }
    ),
    r(
      'Senior Procurement Officer',
      'experienced_manager',
      'Experienced procurement professional leading complex sourcing, framework usage and stakeholder engagement.',
      {
        priority: 80,
        eligibilityNote:
          'Senior procurement officer — not Senior Purchasing Officer or Senior Buyer retail titles.',
      }
    ),
    r(
      'Senior Procurement Manager',
      'experienced_manager',
      'Leads procurement teams and policies for significant spend portfolios with CIPS professional development accountability.',
      {
        priority: 90,
        eligibilityNote:
          'Senior procurement manager — not Head of Category Management or Head of Supply Chain.',
      }
    ),
    r(
      'Head of Procurement',
      'senior_manager_specialist',
      'Function head owning procurement strategy, governance, CIPS capability and enterprise sourcing standards.',
      {
        priority: 100,
        eligibilityNote:
          'Head of procurement — not Head of Purchasing (tactical) or Director of Commercial (broader commercial remit).',
      }
    ),
    r(
      'Director of Procurement',
      'director_executive',
      'Executive leader for enterprise procurement, supplier strategy and public/commercial procurement compliance.',
      {
        priority: 110,
        eligibilityNote:
          'Director of procurement — not Chief Procurement Officer in global matrix unless UK enterprise remit stated.',
      }
    ),
    r(
      'Procurement Consultant (CIPS)',
      'consultant_independent',
      'Independent advisor on sourcing transformation, CIPS maturity and procurement operating models.',
      {
        priority: 120,
        eligibilityNote:
          'Procurement consulting — not IT procurement software vendor sales or Legal procurement law advisory.',
      }
    ),
    r(
      'Public Sector Procurement Officer',
      'practitioner',
      'Delivers compliant public procurement including framework calls-offs and transparency publication requirements.',
      {
        priority: 130,
        eligibilityNote:
          'Public sector procurement — not Contract Manager (post-award performance) or Tender Coordinator (process admin only).',
      }
    ),
    r(
      'Procurement Business Partner',
      'experienced_manager',
      'Partners with internal stakeholders to shape sourcing strategies and embed procurement early in business planning.',
      {
        priority: 140,
        eligibilityNote:
          'Procurement business partner — not HR Business Partner or Finance Business Partner roles.',
      }
    ),
  ],
}

const PURCHASING: SpecialismPack = {
  slug: 'purchasing',
  label: 'Purchasing',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'Institute of Supply Chain Management'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('purchasing'),
  roles: [
    r(
      'Purchasing Apprentice',
      'foundation_business_support',
      'Apprenticeship into purchase order processing, goods receipt coordination and supplier query handling.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Purchasing apprenticeship — not Procurement Apprentice (strategic sourcing) or Warehouse operative routes.',
      }
    ),
    r(
      'Purchasing Clerk',
      'foundation_business_support',
      'Processes purchase requisitions, raises orders and tracks deliveries for operational purchasing teams.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Purchasing clerk — not Procurement Administrator (sourcing/tender support) or Accounts Payable Clerk.',
      }
    ),
    r(
      'Purchasing Administrator',
      'foundation_business_support',
      'Administers purchasing systems, vendor master data and order status reporting for buyers and managers.',
      {
        priority: 30,
        academicRequirement: 'none',
        eligibilityNote:
          'Purchasing administrator — not Office Administrator or Business Support Coordinator general roles.',
      }
    ),
    r(
      'Junior Purchasing Officer',
      'junior_practitioner',
      'Handles routine purchasing requests, supplier follow-up and invoice matching under purchasing team supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Junior purchasing officer — not Junior Procurement Officer (sourcing events and tender support).',
      }
    ),
    r(
      'Purchasing Officer',
      'junior_practitioner',
      'Manages tactical buying, expediting orders and resolving supply issues for assigned operational spend.',
      {
        priority: 50,
        eligibilityNote:
          'Purchasing officer (tactical buying) — distinct from Procurement Officer (strategic sourcing) and Category Manager.',
      }
    ),
    r(
      'Buyer (Operational Purchasing)',
      'practitioner',
      'Places and negotiates routine purchase orders, monitors lead times and maintains supplier performance records.',
      {
        priority: 60,
        eligibilityNote:
          'Operational buyer in purchasing — not Retail Buyer (merchandising) or Media Buyer (advertising).',
      }
    ),
    r(
      'Purchasing Coordinator',
      'practitioner',
      'Coordinates purchasing workflows across sites or departments ensuring order accuracy and delivery alignment.',
      {
        priority: 70,
        eligibilityNote:
          'Purchasing coordinator — not Bid Coordinator (proposals) or Project Coordinator delivery roles.',
      }
    ),
    r(
      'Purchasing Manager',
      'experienced_manager',
      'Manages purchasing teams, order governance and tactical supplier relationships for operational spend.',
      {
        priority: 80,
        eligibilityNote:
          'Purchasing manager — not Procurement Manager (strategic sourcing) or Supply Chain Manager (end-to-end logistics).',
      }
    ),
    r(
      'Senior Purchasing Officer',
      'experienced_manager',
      'Senior tactical buyer handling complex orders, contract call-offs and supplier escalation for purchasing operations.',
      {
        priority: 90,
        eligibilityNote:
          'Senior purchasing officer — not Senior Procurement Officer or Senior Category Manager.',
      }
    ),
    r(
      'Head of Purchasing',
      'senior_manager_specialist',
      'Leads purchasing operations, systems and team standards distinct from enterprise procurement strategy functions.',
      {
        priority: 100,
        eligibilityNote:
          'Head of purchasing — not Head of Procurement (strategic) or Head of Supply Chain.',
      }
    ),
    r(
      'Purchasing Team Lead',
      'experienced_manager',
      'First-line lead for purchasing administrators and buyers overseeing workload and quality of order processing.',
      {
        priority: 110,
        eligibilityNote:
          'Purchasing team lead — not Customer Service Team Lead or Shared Services Team Lead.',
      }
    ),
    r(
      'MRO Purchasing Specialist',
      'practitioner',
      'Specialises in maintenance, repair and operations purchasing for facilities, plant and engineering consumables.',
      {
        priority: 120,
        eligibilityNote:
          'MRO purchasing — not Facilities Manager (workplace services) or Engineering Procurement in capital projects only.',
      }
    ),
    r(
      'Purchasing Systems Administrator',
      'practitioner',
      'Maintains ERP purchasing modules, approval workflows and catalogue management for buying teams.',
      {
        priority: 130,
        eligibilityNote:
          'Purchasing systems admin — not IT ERP Developer or Business Systems Analyst implementation roles.',
      }
    ),
    r(
      'Director of Purchasing Operations',
      'director_executive',
      'Executive oversight of enterprise purchasing operations, cost control and tactical supplier performance at scale.',
      {
        priority: 140,
        eligibilityNote:
          'Director purchasing operations — not Director of Procurement (strategic sourcing executive).',
      }
    ),
  ],
}

const CONTRACT_MANAGEMENT: SpecialismPack = {
  slug: 'contract-management',
  label: 'Contract Management',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'WorldCC', 'NEC Contracts'],
  sources: [...CIPS_SOURCES, 'worldcc_contract_management'],
  siblingSlugs: siblings('contract-management'),
  roles: [
    r(
      'Contract Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting contract filing, milestone tracking and correspondence under contract managers.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Contract admin apprenticeship — not Legal Paralegal or Procurement Administrator routes.',
      }
    ),
    r(
      'Contract Support Assistant',
      'foundation_business_support',
      'Maintains contract registers, renewal diaries and document control for live agreements.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Contract support assistant — not Business Support Assistant or Office Manager general admin.',
      }
    ),
    r(
      'Graduate Contract Analyst',
      'graduate_entry',
      'Graduate entry reviewing contract data, obligation matrices and performance reporting for contract teams.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate contract analyst — not Graduate Lawyer or Graduate Commercial Analyst pricing-focused roles.',
      }
    ),
    r(
      'Junior Contract Administrator',
      'junior_practitioner',
      'Administers contract lifecycle tasks including variations logging, notices and stakeholder updates.',
      {
        priority: 40,
        eligibilityNote:
          'Junior contract administrator — not Junior Procurement Officer (pre-award sourcing).',
      }
    ),
    r(
      'Contract Administrator',
      'junior_practitioner',
      'Manages contract documentation, compliance checks and routine supplier/customer contract correspondence.',
      {
        priority: 50,
        eligibilityNote:
          'Contract administrator — not Solicitor (legal advice) or Purchasing Officer (order placement).',
      }
    ),
    r(
      'Contract Manager',
      'practitioner',
      'Owns post-award contract performance, KPI monitoring, variations and relationship management with counterparties.',
      {
        priority: 60,
        eligibilityNote:
          'Contract manager (commercial) — not IT Service Delivery Manager (ITIL) or Project Manager delivery-only.',
      }
    ),
    r(
      'Commercial Contract Manager',
      'practitioner',
      'Manages commercial terms, pricing mechanisms and risk allocation throughout contract lifecycles.',
      {
        priority: 70,
        eligibilityNote:
          'Commercial contract manager — not Construction Contract Manager (QS/NEC site commercial) unless dual remit.',
      }
    ),
    r(
      'Senior Contract Manager',
      'experienced_manager',
      'Leads complex contract portfolios, dispute avoidance and senior stakeholder contract governance.',
      {
        priority: 80,
        eligibilityNote:
          'Senior contract manager — not Senior Procurement Manager (pre-award sourcing lead).',
      }
    ),
    r(
      'Contract Manager (Framework Agreements)',
      'experienced_manager',
      'Manages framework contracts, call-off governance and supplier performance across multi-supplier arrangements.',
      {
        priority: 90,
        eligibilityNote:
          'Framework contract manager — not Tender Manager (competitive process) or Category Manager (strategy).',
      }
    ),
    r(
      'Head of Contract Management',
      'senior_manager_specialist',
      'Leads contract management capability, templates, training and enterprise contract risk oversight.',
      {
        priority: 100,
        eligibilityNote:
          'Head of contract management — not General Counsel or Head of Legal.',
      }
    ),
    r(
      'Director of Contract Management',
      'director_executive',
      'Executive ownership of contract governance, major dispute escalation and enterprise contract policy.',
      {
        priority: 110,
        eligibilityNote:
          'Director contract management — not Director of Procurement or Director of Legal.',
      }
    ),
    r(
      'Contract Management Consultant',
      'consultant_independent',
      'Advises organisations on contract operating models, WorldCC practices and post-award performance improvement.',
      {
        priority: 120,
        eligibilityNote:
          'Contract management consulting — not Legal consultant or IT contract software sales.',
      }
    ),
    r(
      'Public Sector Contract Manager',
      'practitioner',
      'Manages public sector contracts with transparency, social value and compliance obligations.',
      {
        priority: 130,
        eligibilityNote:
          'Public sector contract manager — not Procurement Officer (pre-award) or Policy Officer (non-contract).',
      }
    ),
    r(
      'Contract Performance Analyst',
      'junior_practitioner',
      'Tracks contract KPIs, SLA breaches and savings realisation for contract management teams.',
      {
        priority: 140,
        eligibilityNote:
          'Contract performance analyst — not Data Analyst (general BI) or Finance Analyst (ledger reporting).',
      }
    ),
  ],
}

const SUPPLIER_MANAGEMENT: SpecialismPack = {
  slug: 'supplier-management',
  label: 'Supplier Management',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'WorldCC', 'Sustainable Procurement'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('supplier-management'),
  roles: [
    r(
      'Supplier Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship learning supplier onboarding forms, accreditation checks and database maintenance.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Supplier admin apprenticeship — not Customer Service Apprentice or Warehouse operative routes.',
      }
    ),
    r(
      'Supplier Records Coordinator',
      'foundation_business_support',
      'Maintains supplier master data, insurance certificates and compliance documentation in supplier systems.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Supplier records coordinator — not Purchasing Clerk or HR Records Administrator.',
      }
    ),
    r(
      'Graduate Supplier Analyst',
      'graduate_entry',
      'Graduate role analysing supplier performance scorecards, risk indicators and spend concentration.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate supplier analyst — not Graduate Procurement Trainee (sourcing events) or Supply Chain Analyst (logistics).',
      }
    ),
    r(
      'Junior Supplier Relationship Coordinator',
      'junior_practitioner',
      'Coordinates supplier meetings, action logs and performance review preparation for relationship managers.',
      {
        priority: 40,
        eligibilityNote:
          'Junior supplier coordinator — not Account Manager (customer-facing sales) or Vendor Manager (IT software).',
      }
    ),
    r(
      'Supplier Relationship Officer',
      'junior_practitioner',
      'Manages day-to-day supplier communications, issue resolution and performance tracking for assigned suppliers.',
      {
        priority: 50,
        eligibilityNote:
          'Supplier relationship officer — not Procurement Officer (sourcing) or Customer Operations Advisor.',
      }
    ),
    r(
      'Supplier Manager',
      'practitioner',
      'Owns supplier performance, improvement plans and contractual relationship health for a supplier portfolio.',
      {
        priority: 60,
        eligibilityNote:
          'Supplier manager — not Category Manager (category strategy) or Account Manager (customer revenue).',
      }
    ),
    r(
      'Strategic Supplier Manager',
      'practitioner',
      'Manages critical tier-one suppliers with joint business planning, innovation forums and risk mitigation.',
      {
        priority: 70,
        eligibilityNote:
          'Strategic supplier manager — not Key Account Manager (sales) or Vendor Manager (IT SaaS).',
      }
    ),
    r(
      'Senior Supplier Manager',
      'experienced_manager',
      'Leads complex supplier relationships, executive governance and cross-functional supplier issue resolution.',
      {
        priority: 80,
        eligibilityNote:
          'Senior supplier manager — not Senior Procurement Manager or Senior Contract Manager unless dual remit.',
      }
    ),
    r(
      'Supplier Performance Manager',
      'experienced_manager',
      'Owns supplier scorecard programmes, corrective actions and continuous improvement with supply base.',
      {
        priority: 90,
        eligibilityNote:
          'Supplier performance manager — not Quality Manager (internal QMS) or Customer Experience Manager.',
      }
    ),
    r(
      'Head of Supplier Management',
      'senior_manager_specialist',
      'Function lead for supplier relationship standards, governance and enterprise supplier risk oversight.',
      {
        priority: 100,
        eligibilityNote:
          'Head of supplier management — not Head of Procurement or Head of Supply Chain.',
      }
    ),
    r(
      'Director of Supplier Management',
      'director_executive',
      'Executive leadership for strategic supplier partnerships, supply risk and supplier diversity programmes.',
      {
        priority: 110,
        eligibilityNote:
          'Director supplier management — not Chief Supply Chain Officer unless supplier remit explicit.',
      }
    ),
    r(
      'Supplier Management Consultant',
      'consultant_independent',
      'Consults on supplier segmentation, SRM operating models and supplier collaboration programmes.',
      {
        priority: 120,
        eligibilityNote:
          'Supplier management consulting — not Management Consulting generalist or Legal supplier compliance advisory.',
      }
    ),
    r(
      'Supplier Onboarding Specialist',
      'junior_practitioner',
      'Runs supplier due diligence, accreditation and system setup for new suppliers joining approved lists.',
      {
        priority: 130,
        eligibilityNote:
          'Supplier onboarding — not Procurement Officer (sourcing selection) or HR Onboarding Specialist.',
      }
    ),
    r(
      'Supplier Risk Analyst',
      'practitioner',
      'Monitors supplier financial, ESG and operational risk signals with escalation to relationship leads.',
      {
        priority: 140,
        eligibilityNote:
          'Supplier risk analyst — not Enterprise Risk Manager (ERM) or Credit Analyst (banking).',
      }
    ),
  ],
}

const CATEGORY_MANAGEMENT: SpecialismPack = {
  slug: 'category-management',
  label: 'Category Management',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'Kearney', 'Procurement Leaders'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('category-management'),
  roles: [
    r(
      'Category Support Apprentice',
      'foundation_business_support',
      'Apprenticeship assisting category leads with spend analysis, market scans and supplier shortlists.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Category support apprenticeship — not Retail Category Assistant (merchandising) or Marketing assistant.',
      }
    ),
    r(
      'Category Data Assistant',
      'foundation_business_support',
      'Prepares spend reports, contract summaries and market intelligence packs for category managers.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Category data assistant — not Purchasing Clerk or Business Intelligence Analyst graduate roles.',
      }
    ),
    r(
      'Graduate Category Analyst',
      'graduate_entry',
      'Graduate analyst supporting category strategies, should-cost models and sourcing option appraisals.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate category analyst — not Graduate Retail Category Manager (merchandising) or Product Manager.',
      }
    ),
    r(
      'Junior Category Buyer',
      'junior_practitioner',
      'Supports category sourcing plans and supplier negotiations under a category manager for defined spend.',
      {
        priority: 40,
        eligibilityNote:
          'Junior category buyer — not Junior Purchasing Officer (tactical POs) or Retail Junior Buyer.',
      }
    ),
    r(
      'Category Specialist',
      'junior_practitioner',
      'Develops category insights, supplier market maps and sourcing recommendations for a spend area.',
      {
        priority: 50,
        eligibilityNote:
          'Category specialist — not Procurement Officer without category strategy remit or Merchandising Specialist.',
      }
    ),
    r(
      'Category Manager',
      'practitioner',
      'Owns category strategy, sourcing roadmaps and supplier portfolio decisions for a major spend category.',
      {
        priority: 60,
        eligibilityNote:
          'Category manager (procurement) — distinct from Purchasing Officer (tactical), Procurement Officer (operational sourcing) and Retail Category Manager.',
      }
    ),
    r(
      'Senior Category Manager',
      'experienced_manager',
      'Leads high-value or complex categories with cross-functional stakeholders and measurable savings accountability.',
      {
        priority: 70,
        eligibilityNote:
          'Senior category manager — not Senior Procurement Manager (function-wide) or Product Category Manager (product marketing).',
      }
    ),
    r(
      'Category Lead (Indirect Spend)',
      'practitioner',
      'Category manager focus on indirect spend such as professional services, marketing or IT services sourcing.',
      {
        priority: 80,
        eligibilityNote:
          'Indirect category lead — not IT Category Manager in software engineering job families.',
      }
    ),
    r(
      'Category Lead (Direct Materials)',
      'practitioner',
      'Category manager for direct materials and production inputs with supply continuity and cost objectives.',
      {
        priority: 90,
        eligibilityNote:
          'Direct materials category — not Manufacturing Production Planner or Supply Chain Planner.',
      }
    ),
    r(
      'Head of Category Management',
      'senior_manager_specialist',
      'Leads category management methodology, talent and governance across procurement categories.',
      {
        priority: 100,
        eligibilityNote:
          'Head of category management — not Head of Procurement or Head of Merchandising (retail).',
      }
    ),
    r(
      'Director of Category Management',
      'director_executive',
      'Executive owner of category management capability and enterprise spend category strategies.',
      {
        priority: 110,
        eligibilityNote:
          'Director category management — not Commercial Director or CPO without category-specific remit.',
      }
    ),
    r(
      'Category Management Consultant',
      'consultant_independent',
      'Advises on category management operating models, spend diagnostics and sourcing transformation.',
      {
        priority: 120,
        eligibilityNote:
          'Category consulting — not Strategy Consulting generalist or Retail consulting merchandising-only.',
      }
    ),
    r(
      'Category Strategy Analyst',
      'junior_practitioner',
      'Analyses category performance, contract coverage and market trends to inform category plans.',
      {
        priority: 130,
        eligibilityNote:
          'Category strategy analyst — not Financial Analyst or Marketing Analyst.',
      }
    ),
    r(
      'Global Category Manager',
      'senior_manager_specialist',
      'Leads multinational category strategies harmonising suppliers, terms and governance across regions.',
      {
        priority: 140,
        eligibilityNote:
          'Global category manager — not Global Product Manager or International Sales Director.',
      }
    ),
  ],
}

const BID_AND_PROPOSAL_MANAGEMENT: SpecialismPack = {
  slug: 'bid-and-proposal-management',
  label: 'Bid and Proposal Management',
  professionalBody: 'CIPS / Association of Proposal Management Professionals (APMP)',
  relatedBodies: ['APMP', 'CIPS', 'Bid Solutions'],
  sources: [...CIPS_SOURCES, 'apmp_careers', 'prospects_bid_writer'],
  siblingSlugs: siblings('bid-and-proposal-management'),
  roles: [
    r(
      'Bid Support Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting bid libraries, document formatting and submission logistics for proposal teams.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Bid support apprenticeship — not Marketing Apprentice or Business Administration apprentice only.',
      }
    ),
    r(
      'Proposal Administrator',
      'foundation_business_support',
      'Maintains proposal templates, compliance matrices and version control for active bids.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Proposal administrator — not Contract Administrator or Purchasing Administrator.',
      }
    ),
    r(
      'Graduate Bid Analyst',
      'graduate_entry',
      'Graduate supporting capture plans, win themes and competitive analysis for bid opportunities.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate bid analyst — not Graduate Management Consultant or Sales Graduate schemes.',
      }
    ),
    r(
      'Junior Bid Coordinator',
      'junior_practitioner',
      'Coordinates bid timelines, contributor tasks and document assembly for proposal submissions.',
      {
        priority: 40,
        eligibilityNote:
          'Junior bid coordinator — not Tender Coordinator (buyer-side) or Project Coordinator.',
      }
    ),
    r(
      'Bid Writer',
      'junior_practitioner',
      'Drafts persuasive bid responses, case studies and method statements to evaluation criteria.',
      {
        priority: 50,
        eligibilityNote:
          'Bid writer — not Copywriter (marketing creative) or Technical Author (product documentation).',
      }
    ),
    r(
      'Proposal Manager',
      'practitioner',
      'Leads end-to-end proposal development including storyboarding, reviews and submission quality.',
      {
        priority: 60,
        eligibilityNote:
          'Proposal manager — not Project Manager (delivery post-win) or Sales Manager (pipeline ownership).',
      }
    ),
    r(
      'Bid Manager',
      'practitioner',
      'Owns bid strategy, resource planning and win probability for competitive tender responses.',
      {
        priority: 70,
        eligibilityNote:
          'Bid manager — not Tender Manager (buyer-side procurement) or Account Manager (customer relationship).',
      }
    ),
    r(
      'Senior Bid Manager',
      'experienced_manager',
      'Leads major or complex bids with executive steering, pricing coordination and orals preparation.',
      {
        priority: 80,
        eligibilityNote:
          'Senior bid manager — not Senior Procurement Manager or Senior Commercial Manager unless bid-only remit.',
      }
    ),
    r(
      'Capture Manager',
      'experienced_manager',
      'Shapes early opportunity capture, customer insight and bid/no-bid decisions before formal proposal work.',
      {
        priority: 90,
        eligibilityNote:
          'Capture manager — not Business Development Manager (broader pipeline) or Pre-Sales Engineer (IT).',
      }
    ),
    r(
      'Head of Bid Management',
      'senior_manager_specialist',
      'Leads bid management function, methodology, tools and win-rate performance for an organisation.',
      {
        priority: 100,
        eligibilityNote:
          'Head of bid management — not Head of Sales or Head of Business Development.',
      }
    ),
    r(
      'Director of Proposals and Bids',
      'director_executive',
      'Executive ownership of proposal capability, major bid investment and enterprise capture strategy.',
      {
        priority: 110,
        eligibilityNote:
          'Director proposals/bids — not Commercial Director or Marketing Director.',
      }
    ),
    r(
      'Bid and Proposal Consultant',
      'consultant_independent',
      'Independent advisor on bid processes, APMP-aligned practices and proposal team development.',
      {
        priority: 120,
        eligibilityNote:
          'Bid consulting — not Management Consulting or Legal tender compliance advisory alone.',
      }
    ),
    r(
      'Proposal Designer',
      'practitioner',
      'Designs bid document layouts, infographics and submission packs for professional proposal quality.',
      {
        priority: 130,
        eligibilityNote:
          'Proposal designer — not Graphic Designer (brand/marketing) or UX Designer (product).',
      }
    ),
    r(
      'Orals and Presentation Coach (Bids)',
      'consultant_independent',
      'Coaches bid teams for client presentations, orals and evaluation interviews.',
      {
        priority: 140,
        eligibilityNote:
          'Bid orals coach — not Sales Trainer or Public Speaking coach without bid/proposal context.',
      }
    ),
  ],
}

const TENDER_MANAGEMENT: SpecialismPack = {
  slug: 'tender-management',
  label: 'Tender Management',
  professionalBody: CIPS,
  relatedBodies: ['CIPS', 'APMP', 'Public Contracts Regulations'],
  sources: CIPS_SOURCES,
  siblingSlugs: siblings('tender-management'),
  roles: [
    r(
      'Tender Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting tender publication, document distribution and bidder query logs.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Tender admin apprenticeship — not Bid Support Apprentice (supplier-side responses).',
      }
    ),
    r(
      'Tender Coordinator',
      'foundation_business_support',
      'Coordinates tender timelines, evaluation panel logistics and compliance documentation for buyers.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Tender coordinator (buyer-side) — not Bid Coordinator (supplier-side proposal assembly).',
      }
    ),
    r(
      'Graduate Procurement and Tender Analyst',
      'graduate_entry',
      'Graduate supporting tender evaluation criteria, scoring and procurement law compliance checks.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate tender analyst — not Graduate Bid Analyst (supplier-side) or Legal Graduate (law firm).',
      }
    ),
    r(
      'Junior Tender Officer',
      'junior_practitioner',
      'Supports tender documentation, supplier communications and audit trails for procurement teams.',
      {
        priority: 40,
        eligibilityNote:
          'Junior tender officer — not Junior Procurement Officer without tender process emphasis.',
      }
    ),
    r(
      'Tender Officer',
      'junior_practitioner',
      'Manages tender processes including ITT/RFP issuance, clarifications and submission receipt.',
      {
        priority: 50,
        eligibilityNote:
          'Tender officer (buyer-side process) — not Bid Manager (supplier-side response leadership).',
      }
    ),
    r(
      'Tender Manager',
      'practitioner',
      'Leads end-to-end tender events ensuring evaluation fairness, transparency and regulatory compliance.',
      {
        priority: 60,
        eligibilityNote:
          'Tender manager (procurement) — not Proposal Manager (supplier-side) or Project Manager.',
      }
    ),
    r(
      'Public Sector Tender Manager',
      'practitioner',
      'Manages public sector tenders under PCR/framework rules with publication and standstill requirements.',
      {
        priority: 70,
        eligibilityNote:
          'Public sector tender manager — not Policy Officer or Grants Administrator.',
      }
    ),
    r(
      'Senior Tender Manager',
      'experienced_manager',
      'Leads complex multi-lot tenders, negotiation stages and contract award recommendations.',
      {
        priority: 80,
        eligibilityNote:
          'Senior tender manager — not Senior Bid Manager (supplier-side) or Senior Contract Manager (post-award).',
      }
    ),
    r(
      'Tender Evaluation Lead',
      'experienced_manager',
      'Facilitates evaluation panels, moderation and defensible scoring for high-value tenders.',
      {
        priority: 90,
        eligibilityNote:
          'Tender evaluation lead — not HR Assessment Centre facilitator or Academic examiner roles.',
      }
    ),
    r(
      'Head of Tender Management',
      'senior_manager_specialist',
      'Owns tender management standards, templates and capability for a procurement or commercial function.',
      {
        priority: 100,
        eligibilityNote:
          'Head of tender management — not Head of Bid Management (supplier-side).',
      }
    ),
    r(
      'Director of Tendering and Sourcing Events',
      'director_executive',
      'Executive oversight of major sourcing events, tender governance and procurement compliance programmes.',
      {
        priority: 110,
        eligibilityNote:
          'Director tendering — not Director of Procurement without tender-specific remit or Sales Director.',
      }
    ),
    r(
      'Tender Management Consultant',
      'consultant_independent',
      'Advises buyers on tender process design, evaluation frameworks and procurement compliance.',
      {
        priority: 120,
        eligibilityNote:
          'Tender consulting (buyer-side) — not Bid Consultant (supplier-side win strategy).',
      }
    ),
    r(
      'Framework Tender Specialist',
      'practitioner',
      'Specialises in framework establishment, re-opening competitions and call-off tender management.',
      {
        priority: 130,
        eligibilityNote:
          'Framework tender specialist — not Category Manager (strategy) or Contract Manager (performance).',
      }
    ),
    r(
      'E-Tendering Systems Administrator',
      'practitioner',
      'Administers e-sourcing portals, tender workflows and user access for procurement organisations.',
      {
        priority: 140,
        eligibilityNote:
          'E-tendering admin — not IT Systems Administrator or ERP Developer.',
      }
    ),
  ],
}

const SERVICE_MANAGEMENT: SpecialismPack = {
  slug: 'service-management',
  label: 'Service Management',
  professionalBody: 'CMI / Institute of Customer Service (business service context)',
  relatedBodies: ['CMI', 'ICS', 'Service Design Network'],
  sources: [
    'prospects_operations_manager',
    'national_careers_service_customer_service',
    'cmi_management_careers',
  ],
  siblingSlugs: siblings('service-management'),
  roles: [
    r(
      'Business Service Support Apprentice',
      'foundation_business_support',
      'Apprenticeship into internal business service desks, request logging and service coordination.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Business service apprenticeship — not IT Service Desk Apprentice or ITIL Service Management trainee routes.',
      }
    ),
    r(
      'Service Operations Assistant',
      'foundation_business_support',
      'Supports business service teams with scheduling, ticket triage and customer/internal stakeholder updates.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Service operations assistant — not IT Support Analyst or Software Engineer service roles.',
      }
    ),
    r(
      'Graduate Service Operations Trainee',
      'graduate_entry',
      'Graduate entry into business service delivery, SLA monitoring and process improvement for internal services.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate service operations — not Graduate Software Developer or IT Graduate scheme.',
      }
    ),
    r(
      'Junior Service Coordinator',
      'junior_practitioner',
      'Coordinates business service requests, escalations and reporting for HR, finance or facilities shared services.',
      {
        priority: 40,
        eligibilityNote:
          'Junior service coordinator — not IT Service Coordinator or Project Coordinator.',
      }
    ),
    r(
      'Business Service Advisor',
      'junior_practitioner',
      'First-line advisor resolving routine business service queries for employees or internal customers.',
      {
        priority: 50,
        eligibilityNote:
          'Business service advisor — not Customer Service Advisor (external B2C) unless internal service desk remit.',
      }
    ),
    r(
      'Service Delivery Manager (Business Services)',
      'practitioner',
      'Manages delivery of non-IT business services such as workplace, travel or employee services against SLAs.',
      {
        priority: 60,
        eligibilityNote:
          'Business service delivery manager — not IT Service Delivery Manager (ITIL/infrastructure/software).',
      }
    ),
    r(
      'Service Manager (Internal Operations)',
      'practitioner',
      'Owns internal service catalogues, demand management and continuous improvement for business operations.',
      {
        priority: 70,
        eligibilityNote:
          'Internal service manager — not IT Service Manager or Product Manager (software product).',
      }
    ),
    r(
      'Senior Service Manager (Business Operations)',
      'experienced_manager',
      'Leads multiple business service lines with budget, staffing and stakeholder satisfaction accountability.',
      {
        priority: 80,
        eligibilityNote:
          'Senior business service manager — not Senior IT Operations Manager or Engineering Manager.',
      }
    ),
    r(
      'Business Service Operations Improvement Manager',
      'experienced_manager',
      'Drives service design and performance improvement across business service functions using CI methods.',
      {
        priority: 90,
        eligibilityNote:
          'Service improvement (business) — not ITIL Continual Service Improvement Manager or UX Service Designer only.',
      }
    ),
    r(
      'Head of Business Services',
      'senior_manager_specialist',
      'Leads internal business service portfolio spanning multiple support functions and service standards.',
      {
        priority: 100,
        eligibilityNote:
          'Head of business services — not Head of IT Services or Head of Shared Services (SSC-specific).',
      }
    ),
    r(
      'Director of Service Operations',
      'director_executive',
      'Executive ownership of enterprise business service strategy, cost-to-serve and service experience.',
      {
        priority: 110,
        eligibilityNote:
          'Director service operations (business) — not CIO, CTO or Director of IT Operations.',
      }
    ),
    r(
      'Service Management Consultant (Business Operations)',
      'consultant_independent',
      'Advises on business service operating models, SLAs and internal customer experience — not ITIL tool implementation.',
      {
        priority: 120,
        eligibilityNote:
          'Business service consulting — not IT Service Management consultant (ITIL) or Software implementation consultant.',
      }
    ),
    r(
      'Service Catalogue Manager (Business)',
      'practitioner',
      'Maintains internal business service catalogues, entitlements and request fulfilment pathways.',
      {
        priority: 130,
        eligibilityNote:
          'Business service catalogue — not IT Service Catalogue Manager or Product Owner (software backlog).',
      }
    ),
    r(
      'Workplace Services Manager',
      'practitioner',
      'Manages integrated workplace services including mailroom, reception services and employee-facing business support.',
      {
        priority: 140,
        eligibilityNote:
          'Workplace services manager — overlaps facilities but service-management focus; not Facilities Manager (hard FM) unless dual.',
      }
    ),
  ],
}

const FACILITIES_AND_WORKPLACE: SpecialismPack = {
  slug: 'facilities-and-workplace-management',
  label: 'Facilities and Workplace Management',
  professionalBody: 'Institute of Workplace and Facilities Management (IWFM)',
  relatedBodies: ['IWFM', 'BIFM legacy', 'RICS (facilities context)'],
  sources: [
    'iwfm_careers',
    'prospects_facilities_manager',
    'national_careers_service_facilities',
  ],
  siblingSlugs: siblings('facilities-and-workplace-management'),
  roles: [
    r(
      'Facilities Apprentice',
      'foundation_business_support',
      'Apprenticeship into building services support, maintenance coordination and workplace safety basics.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Facilities apprenticeship — not Electrical Installation apprentice or Construction site operative.',
      }
    ),
    r(
      'Workplace Support Assistant',
      'foundation_business_support',
      'Supports workplace moves, room bookings and facilities helpdesk queries for office occupants.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Workplace support assistant — not Office Administrator (general admin) or Receptionist-only roles.',
      }
    ),
    r(
      'Graduate Facilities Trainee',
      'graduate_entry',
      'Graduate trainee in facilities management learning hard/soft FM, contracts and workplace projects.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate facilities trainee — not Graduate Surveyor (RICS building surveying) unless FM-focused scheme.',
      }
    ),
    r(
      'Junior Facilities Coordinator',
      'junior_practitioner',
      'Coordinates maintenance requests, contractor visits and compliance checks for a site or portfolio.',
      {
        priority: 40,
        eligibilityNote:
          'Junior facilities coordinator — not Property Manager (real estate investment) or Building Surveyor.',
      }
    ),
    r(
      'Facilities Officer',
      'junior_practitioner',
      'Day-to-day facilities operations including access control support, inspections and supplier liaison.',
      {
        priority: 50,
        eligibilityNote:
          'Facilities officer — not Health and Safety Officer (H&S specialist) or Security Officer.',
      }
    ),
    r(
      'Facilities Manager',
      'practitioner',
      'Manages facilities services, budgets and contractor performance for buildings or campuses.',
      {
        priority: 60,
        eligibilityNote:
          'Facilities manager (IWFM) — not IT Infrastructure Manager or HR Office Manager titles.',
      }
    ),
    r(
      'Workplace Experience Manager',
      'practitioner',
      'Shapes workplace environment, occupancy planning and employee experience in office settings.',
      {
        priority: 70,
        eligibilityNote:
          'Workplace experience — not Internal Communications Manager or HR Employee Experience lead.',
      }
    ),
    r(
      'Senior Facilities Manager',
      'experienced_manager',
      'Leads facilities for multi-site portfolios with major projects, sustainability and service integration.',
      {
        priority: 80,
        eligibilityNote:
          'Senior facilities manager — not Senior Property Asset Manager (investment) or Construction Site Manager.',
      }
    ),
    r(
      'Soft Services Manager',
      'experienced_manager',
      'Manages cleaning, catering, security and reception contracts as part of integrated FM delivery.',
      {
        priority: 90,
        eligibilityNote:
          'Soft services manager — not Hospitality General Manager or Catering Chef roles.',
      }
    ),
    r(
      'Head of Facilities',
      'senior_manager_specialist',
      'Function head for facilities strategy, IWFM professional standards and workplace service governance.',
      {
        priority: 100,
        eligibilityNote:
          'Head of facilities — not Head of Real Estate (corporate property investment) unless FM remit included.',
      }
    ),
    r(
      'Director of Workplace and Facilities',
      'director_executive',
      'Executive leadership for workplace strategy, FM outsourcing and estate operational performance.',
      {
        priority: 110,
        eligibilityNote:
          'Director workplace/facilities — not Facilities Director in NHS clinical estates without business FM context.',
      }
    ),
    r(
      'Facilities Management Consultant (IWFM)',
      'consultant_independent',
      'Advises on FM operating models, tendering FM contracts and workplace transformation.',
      {
        priority: 120,
        eligibilityNote:
          'FM consulting — not Management Consulting generalist or Architecture workplace design-only.',
      }
    ),
    r(
      'Space and Move Manager',
      'practitioner',
      'Plans office space utilisation, relocations and churn projects for workplace portfolios.',
      {
        priority: 130,
        eligibilityNote:
          'Space and move manager — not Interior Designer or Project Manager (construction fit-out) unless workplace remit.',
      }
    ),
    r(
      'Hard FM Manager',
      'practitioner',
      'Manages building engineering maintenance, M&E contractors and statutory compliance for facilities.',
      {
        priority: 140,
        eligibilityNote:
          'Hard FM manager — not Maintenance Engineer (hands-on) or Building Services Design Engineer.',
      }
    ),
  ],
}

const QUALITY_MANAGEMENT: SpecialismPack = {
  slug: 'quality-management',
  label: 'Quality Management',
  professionalBody: 'Chartered Quality Institute (CQI)',
  relatedBodies: ['CQI', 'ISO', 'IRCA (audit context)'],
  sources: [
    'cqi_careers',
    'prospects_quality_manager',
    'national_careers_service_quality_control',
  ],
  siblingSlugs: siblings('quality-management'),
  roles: [
    r(
      'Quality Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting document control, audit scheduling and quality records maintenance.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Quality admin apprenticeship — not Laboratory Science apprentice or Manufacturing operator-only routes.',
      }
    ),
    r(
      'Quality Records Coordinator',
      'foundation_business_support',
      'Maintains QMS documentation, change logs and training records for quality teams.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Quality records coordinator — not HR Records or Document Controller in engineering-only contexts without QMS.',
      }
    ),
    r(
      'Graduate Quality Analyst',
      'graduate_entry',
      'Graduate entry analysing quality metrics, non-conformance trends and corrective action data.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate quality analyst — not Graduate Data Scientist or Biomedical Quality roles in NHS pathology packs.',
      }
    ),
    r(
      'Junior Quality Officer',
      'junior_practitioner',
      'Supports audits, inspection routines and CAPA tracking under quality manager supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Junior quality officer — not Junior Health and Safety Advisor or Production Quality Inspector-only on line.',
      }
    ),
    r(
      'Quality Officer',
      'junior_practitioner',
      'Implements QMS procedures, internal audit support and supplier quality queries for business operations.',
      {
        priority: 50,
        eligibilityNote:
          'Quality officer (business QMS) — not Software QA Engineer (testing code) or Clinical Quality roles in healthcare packs.',
      }
    ),
    r(
      'Quality Manager',
      'practitioner',
      'Owns quality management system performance, audit programmes and continual improvement for a function or site.',
      {
        priority: 60,
        eligibilityNote:
          'Quality manager (CQI) — not IT Quality Assurance Manager (software testing) or Hospital Quality Manager (clinical).',
      }
    ),
    r(
      'Business Quality Manager',
      'practitioner',
      'Quality manager focus on business processes, shared services and corporate QMS — not manufacturing line QC.',
      {
        priority: 70,
        eligibilityNote:
          'Business quality manager — not Manufacturing Quality Engineer or Pharmaceutical QP roles.',
      }
    ),
    r(
      'Senior Quality Manager',
      'experienced_manager',
      'Leads quality across multiple sites or programmes with regulatory or ISO certification accountability.',
      {
        priority: 80,
        eligibilityNote:
          'Senior quality manager — not Senior Regulatory Affairs Manager (product licensing) unless QMS remit.',
      }
    ),
    r(
      'Quality Assurance Manager (Business Operations)',
      'experienced_manager',
      'Assures quality of business operations and service delivery processes — distinct from software QA.',
      {
        priority: 90,
        eligibilityNote:
          'Business QA manager — not Software QA Manager, Test Manager (IT) or Clinical QA in hospitals.',
      }
    ),
    r(
      'Head of Quality',
      'senior_manager_specialist',
      'Function head for quality strategy, CQI professional development and enterprise QMS governance.',
      {
        priority: 100,
        eligibilityNote:
          'Head of quality — not Head of Compliance (legal/regulatory) or Head of HSE.',
      }
    ),
    r(
      'Director of Quality',
      'director_executive',
      'Executive ownership of quality culture, certification strategy and major audit/regulatory interfaces.',
      {
        priority: 110,
        eligibilityNote:
          'Director of quality — not CTO or Engineering Director without explicit quality remit.',
      }
    ),
    r(
      'Quality Management Consultant (CQI)',
      'consultant_independent',
      'Consults on ISO systems, audit readiness and quality operating models for organisations.',
      {
        priority: 120,
        eligibilityNote:
          'Quality consulting — not Six Sigma Black Belt consultant-only without QMS remit or IT testing consultant.',
      }
    ),
    r(
      'Internal Quality Auditor',
      'practitioner',
      'Conducts internal QMS audits, findings reporting and follow-up verification.',
      {
        priority: 130,
        eligibilityNote:
          'Internal quality auditor — not External Financial Auditor or IT Security Auditor.',
      }
    ),
    r(
      'Lecturer in Quality Management',
      'academic_research',
      'Teaches and researches quality management, standards and organisational improvement in HE.',
      {
        priority: 140,
        eligibilityNote:
          'Academic quality management — not CQI trainer-only without academic employment.',
        isResearchRole: true,
      }
    ),
  ],
}

const CUSTOMER_OPERATIONS: SpecialismPack = {
  slug: 'customer-operations',
  label: 'Customer Operations',
  professionalBody: 'Institute of Customer Service / CMI',
  relatedBodies: ['ICS', 'CMI', 'CCMA'],
  sources: [
    'prospects_customer_service',
    'national_careers_service_call_centre',
    'ics_careers',
  ],
  siblingSlugs: siblings('customer-operations'),
  roles: [
    r(
      'Customer Operations Apprentice',
      'foundation_business_support',
      'Apprenticeship into contact handling, CRM basics and customer journey support for operations teams.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Customer operations apprenticeship — not Digital Marketing Apprentice or Sales Apprentice.',
      }
    ),
    r(
      'Contact Centre Administrator',
      'foundation_business_support',
      'Supports rota planning, queue monitoring and operational reporting for customer contact teams.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Contact centre administrator — not Office Administrator or IT Service Desk Administrator.',
      }
    ),
    r(
      'Graduate Customer Operations Trainee',
      'graduate_entry',
      'Graduate trainee in customer operations analytics, process design and service level management.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate customer operations — not Graduate Marketing or UX Research graduate schemes.',
      }
    ),
    r(
      'Customer Operations Advisor',
      'junior_practitioner',
      'Handles customer enquiries across channels with adherence to operational procedures and quality standards.',
      {
        priority: 40,
        eligibilityNote:
          'Customer operations advisor — not Business Service Advisor (internal employee services).',
      }
    ),
    r(
      'Customer Service Team Leader',
      'junior_practitioner',
      'First-line lead for advisors coaching quality, attendance and daily operational targets.',
      {
        priority: 50,
        eligibilityNote:
          'Customer service team leader — not HR Team Leader or IT Support Team Lead.',
      }
    ),
    r(
      'Customer Operations Specialist',
      'practitioner',
      'Owns operational workflows for customer journeys such as onboarding, billing queries or case management.',
      {
        priority: 60,
        eligibilityNote:
          'Customer operations specialist — not CRM Developer or Product Manager (software product).',
      }
    ),
    r(
      'Contact Centre Operations Manager',
      'practitioner',
      'Manages contact centre performance, workforce planning and vendor BPO relationships if outsourced.',
      {
        priority: 70,
        eligibilityNote:
          'Contact centre operations manager — not Marketing Manager or Sales Operations Manager.',
      }
    ),
    r(
      'Senior Customer Operations Manager',
      'experienced_manager',
      'Leads multi-site or multi-channel customer operations with budget and transformation accountability.',
      {
        priority: 80,
        eligibilityNote:
          'Senior customer operations manager — not Head of Customer Experience (CX design) unless ops remit.',
      }
    ),
    r(
      'Customer Operations Analyst',
      'practitioner',
      'Analyses contact volumes, AHT, CSAT and operational dashboards to drive performance improvements.',
      {
        priority: 90,
        eligibilityNote:
          'Customer operations analyst — not Data Scientist or Marketing Analyst.',
      }
    ),
    r(
      'Head of Customer Operations',
      'senior_manager_specialist',
      'Function head for customer operations strategy, tooling and service level governance.',
      {
        priority: 100,
        eligibilityNote:
          'Head of customer operations — not Head of Customer Service (small-team) or Chief Customer Officer (exec brand).',
      }
    ),
    r(
      'Director of Customer Operations',
      'director_executive',
      'Executive ownership of customer operations cost-to-serve, outsourcing strategy and operational CX delivery.',
      {
        priority: 110,
        eligibilityNote:
          'Director customer operations — not CMO or Sales Director.',
      }
    ),
    r(
      'Workforce Management Specialist (Customer Operations)',
      'practitioner',
      'Forecasts contact demand, schedules advisors and optimises capacity for customer operations.',
      {
        priority: 120,
        eligibilityNote:
          'WFM specialist (customer ops) — not HR Workforce Planning or Retail staffing planner only.',
      }
    ),
    r(
      'Customer Complaints Operations Manager',
      'experienced_manager',
      'Manages complaints handling operations, root-cause feedback loops and regulatory response timelines.',
      {
        priority: 130,
        eligibilityNote:
          'Complaints operations — not Legal Complaints Handler (ombudsman/legal) or PR Crisis Manager.',
      }
    ),
    r(
      'Customer Operations Consultant',
      'consultant_independent',
      'Advises on contact centre transformation, operating models and customer ops technology selection (business-led).',
      {
        priority: 140,
        eligibilityNote:
          'Customer ops consulting — not IT CRM implementation consultant-only or Marketing agency.',
      }
    ),
  ],
}

const SHARED_SERVICES: SpecialismPack = {
  slug: 'shared-services',
  label: 'Shared Services',
  professionalBody: 'SSON / CMI',
  relatedBodies: ['SSON', 'CMI', 'Hackett Group context'],
  sources: [
    'sson_shared_services',
    'prospects_business_services',
    'cmi_management_careers',
  ],
  siblingSlugs: siblings('shared-services'),
  roles: [
    r(
      'Shared Services Apprentice',
      'foundation_business_support',
      'Apprenticeship into SSC transaction processing, ticketing and standard operating procedures.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Shared services apprenticeship — not Finance Apprentice (accounting) or HR Apprentice.',
      }
    ),
    r(
      'Shared Services Administrator',
      'foundation_business_support',
      'Processes standardised transactions and requests for a shared service centre function.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'SSC administrator — not Purchasing Administrator or Payroll Clerk-only without SSC context.',
      }
    ),
    r(
      'Graduate Shared Services Analyst',
      'graduate_entry',
      'Graduate supporting SSC metrics, process documentation and continuous improvement initiatives.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate SSC analyst — not Graduate Accountant or Graduate HR generalist.',
      }
    ),
    r(
      'Shared Services Coordinator',
      'junior_practitioner',
      'Coordinates work allocation, quality checks and escalations within a shared service team.',
      {
        priority: 40,
        eligibilityNote:
          'SSC coordinator — not Project Coordinator or Office Coordinator.',
      }
    ),
    r(
      'Shared Services Specialist',
      'junior_practitioner',
      'Delivers specialist SSC processes such as employee services transactions or vendor invoice processing.',
      {
        priority: 50,
        eligibilityNote:
          'SSC specialist — not HR Advisor or Accounts Payable Specialist unless explicitly SSC model.',
      }
    ),
    r(
      'Shared Services Team Leader',
      'practitioner',
      'Leads an SSC team segment with productivity, quality and SLA targets.',
      {
        priority: 60,
        eligibilityNote:
          'SSC team leader — not Customer Service Team Leader (external) or IT Team Lead.',
      }
    ),
    r(
      'Shared Services Manager',
      'practitioner',
      'Manages an SSC tower or country hub covering multiple business support processes.',
      {
        priority: 70,
        eligibilityNote:
          'Shared services manager — not Finance Manager or HR Manager in embedded functions.',
      }
    ),
    r(
      'Senior Shared Services Manager',
      'experienced_manager',
      'Leads large SSC operations with transformation, automation and governance responsibilities.',
      {
        priority: 80,
        eligibilityNote:
          'Senior SSC manager — not Senior Operations Manager (line manufacturing) or IT Service Manager.',
      }
    ),
    r(
      'Global Business Services Manager',
      'experienced_manager',
      'Manages global business services scope spanning finance, HR and procurement transactions in SSC model.',
      {
        priority: 90,
        eligibilityNote:
          'Global business services — not CFO or CHRO; SSC operations leadership.',
      }
    ),
    r(
      'Head of Shared Services',
      'senior_manager_specialist',
      'Function head for SSC strategy, location strategy and service catalogue across the enterprise.',
      {
        priority: 100,
        eligibilityNote:
          'Head of shared services — not Head of Business Support (single-site admin).',
      }
    ),
    r(
      'Director of Global Business Services',
      'director_executive',
      'Executive owner of GBS/SSC operating model, vendor partnerships and cost transformation.',
      {
        priority: 110,
        eligibilityNote:
          'Director GBS — not Finance Director or HR Director unless SSC executive remit explicit.',
      }
    ),
    r(
      'Shared Services Transformation Consultant',
      'consultant_independent',
      'Advises on SSC design, process migration and robotics/automation in business services.',
      {
        priority: 120,
        eligibilityNote:
          'SSC consulting — not IT RPA Developer or Management Consulting without SSC focus.',
      }
    ),
    r(
      'Process Excellence Lead (Shared Services)',
      'practitioner',
      'Leads Lean/Six Sigma or operational excellence within shared service centres.',
      {
        priority: 130,
        eligibilityNote:
          'Process excellence in SSC — not Quality Manager (enterprise QMS) or Software Process Engineer.',
      }
    ),
    r(
      'SSC Transition Manager',
      'experienced_manager',
      'Manages migration of processes into shared services including knowledge transfer and stabilisation.',
      {
        priority: 140,
        eligibilityNote:
          'SSC transition manager — not Change Manager (organisational change) without migration remit.',
      }
    ),
  ],
}

const BUSINESS_SUPPORT: SpecialismPack = {
  slug: 'business-support',
  label: 'Business Support',
  professionalBody: 'CMI',
  relatedBodies: ['CMI', 'IoD context'],
  sources: [
    'prospects_administrator',
    'national_careers_service_administrator',
    'cmi_management_careers',
  ],
  siblingSlugs: siblings('business-support'),
  roles: [
    r(
      'Business Support Apprentice',
      'foundation_business_support',
      'Apprenticeship providing general business support, diary coordination and document preparation.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Business support apprenticeship — not Executive PA Apprentice (executive-support specialism) or HR Apprentice.',
      }
    ),
    r(
      'Business Support Administrator',
      'foundation_business_support',
      'Delivers administrative support to teams including correspondence, filing and meeting logistics.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Business support administrator — not Office Manager (team lead) or Receptionist-only.',
      }
    ),
    r(
      'Business Support Coordinator',
      'foundation_business_support',
      'Coordinates cross-team activities, action trackers and internal communications for business units.',
      {
        priority: 30,
        academicRequirement: 'none',
        eligibilityNote:
          'Business support coordinator — not Project Coordinator (formal project delivery) or Marketing Coordinator.',
      }
    ),
    r(
      'Graduate Business Support Officer',
      'graduate_entry',
      'Graduate providing analytical support, reporting and project assistance to business leadership teams.',
      {
        priority: 40,
        eligibilityNote:
          'Graduate business support — not Graduate Management Consultant or Business Analyst (IT change).',
      }
    ),
    r(
      'Business Support Officer',
      'junior_practitioner',
      'Trusted support partner for managers handling prioritisation, stakeholder liaison and operational tasks.',
      {
        priority: 50,
        eligibilityNote:
          'Business support officer — not Personal Assistant to executives (executive-support specialism).',
      }
    ),
    r(
      'Senior Business Support Officer',
      'practitioner',
      'Senior administrator supporting senior managers with complex scheduling, reporting and team coordination.',
      {
        priority: 60,
        eligibilityNote:
          'Senior business support officer — not Executive Assistant (executive-support) or Office Manager.',
      }
    ),
    r(
      'Business Support Manager',
      'experienced_manager',
      'Manages business support teams, service standards and workload planning for a department.',
      {
        priority: 70,
        eligibilityNote:
          'Business support manager — not HR Manager or Operations Manager (production/service delivery).',
      }
    ),
    r(
      'Team Administrator (Business Support)',
      'junior_practitioner',
      'Provides dedicated admin support to a specific team including expenses, travel and document control.',
      {
        priority: 80,
        eligibilityNote:
          'Team administrator — not Department Secretary (executive-support) or Legal Secretary.',
      }
    ),
    r(
      'Business Operations Support Specialist',
      'practitioner',
      'Specialist support for business operations including MI preparation, workshop facilitation and process admin.',
      {
        priority: 90,
        eligibilityNote:
          'Business operations support — not Business Analyst (requirements/change) or Data Analyst.',
      }
    ),
    r(
      'Head of Business Support',
      'senior_manager_specialist',
      'Leads business support services for a division including standards, training and resource planning.',
      {
        priority: 100,
        eligibilityNote:
          'Head of business support — not Head of Shared Services (SSC) or Head of HR.',
      }
    ),
    r(
      'Director of Business Support Services',
      'director_executive',
      'Executive oversight of business support capability across the organisation.',
      {
        priority: 110,
        eligibilityNote:
          'Director business support — not COO unless explicit business support remit.',
      }
    ),
    r(
      'Virtual Business Support Specialist',
      'consultant_independent',
      'Self-employed remote business support for SMEs including admin, coordination and reporting.',
      {
        priority: 120,
        eligibilityNote:
          'Virtual business support — not Virtual Assistant marketing/social-only or Bookkeeper.',
      }
    ),
    r(
      'Departmental Services Manager',
      'experienced_manager',
      'Manages integrated admin and coordination services for a large department or faculty.',
      {
        priority: 130,
        eligibilityNote:
          'Departmental services manager — not Academic Department Head or Facilities Manager.',
      }
    ),
    r(
      'Business Support Quality Lead',
      'practitioner',
      'Owns quality and consistency of business support services, templates and knowledge bases.',
      {
        priority: 140,
        eligibilityNote:
          'Business support quality lead — not Quality Manager (enterprise QMS) or ISO auditor.',
      }
    ),
  ],
}

const OFFICE_MANAGEMENT: SpecialismPack = {
  slug: 'office-management',
  label: 'Office Management',
  professionalBody: 'IWFM / CMI',
  relatedBodies: ['IWFM', 'CMI', 'Office Management Association context'],
  sources: [
    'prospects_office_manager',
    'national_careers_service_administrator',
    'iwfm_careers',
  ],
  siblingSlugs: siblings('office-management'),
  roles: [
    r(
      'Office Administration Apprentice',
      'foundation_business_support',
      'Apprenticeship learning front-of-house, post, supplies and basic office systems.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Office admin apprenticeship — not Facilities Apprentice (building services) or Legal Secretary apprentice.',
      }
    ),
    r(
      'Office Assistant',
      'foundation_business_support',
      'General office assistance including reception cover, meeting room setup and stationery management.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Office assistant — not Warehouse Assistant or Retail Sales Assistant.',
      }
    ),
    r(
      'Graduate Office Coordinator',
      'graduate_entry',
      'Graduate coordinating office projects, health-and-safety liaison and supplier relationships for workplace running.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate office coordinator — not Graduate Facilities Manager scheme unless office-focused.',
      }
    ),
    r(
      'Junior Office Manager',
      'junior_practitioner',
      'Supports office manager with vendor invoices, staff onboarding logistics and office procedures.',
      {
        priority: 40,
        eligibilityNote:
          'Junior office manager — not Office Administrator (non-management) or Facilities Officer.',
      }
    ),
    r(
      'Office Administrator',
      'junior_practitioner',
      'Runs day-to-day office processes including post, archives and equipment requests.',
      {
        priority: 50,
        eligibilityNote:
          'Office administrator — not Business Support Administrator (team-focused) or Purchasing Administrator.',
      }
    ),
    r(
      'Office Manager',
      'practitioner',
      'Manages office operations, admin staff, budgets and workplace policies for a site.',
      {
        priority: 60,
        eligibilityNote:
          'Office manager — not Facilities Manager (hard/soft FM contracts) unless small-office dual role.',
      }
    ),
    r(
      'Regional Office Manager',
      'practitioner',
      'Oversees multiple office locations ensuring consistent standards and local office team leadership.',
      {
        priority: 70,
        eligibilityNote:
          'Regional office manager — not Regional Sales Manager or Area Manager (retail).',
      }
    ),
    r(
      'Senior Office Manager',
      'experienced_manager',
      'Senior lead for large or HQ offices with significant vendor spend and executive workplace liaison.',
      {
        priority: 80,
        eligibilityNote:
          'Senior office manager — not Workplace Experience Manager (employee experience focus) unless dual.',
      }
    ),
    r(
      'Office Services Manager',
      'experienced_manager',
      'Manages mailroom, print room, reception and office services teams.',
      {
        priority: 90,
        eligibilityNote:
          'Office services manager — not Hospitality Manager or Front-of-House Manager (events venue).',
      }
    ),
    r(
      'Head of Office Operations',
      'senior_manager_specialist',
      'Leads office management standards and admin team capability across a business unit or region.',
      {
        priority: 100,
        eligibilityNote:
          'Head of office operations — not Head of Facilities (IWFM building portfolio).',
      }
    ),
    r(
      'Director of Workplace Administration',
      'director_executive',
      'Executive ownership of office administration strategy for large corporate estates.',
      {
        priority: 110,
        eligibilityNote:
          'Director workplace administration — not Director of Facilities or HR Director.',
      }
    ),
    r(
      'Reception and Office Supervisor',
      'junior_practitioner',
      'Supervises reception and office assistants ensuring visitor management and front-of-house standards.',
      {
        priority: 120,
        eligibilityNote:
          'Reception supervisor — not Hotel Front Office Manager or Security Supervisor.',
      }
    ),
    r(
      'Office Move Project Manager',
      'practitioner',
      'Plans and delivers office relocations and refurbishments from an office management perspective.',
      {
        priority: 130,
        eligibilityNote:
          'Office move PM — not Construction Project Manager (fit-out contractor) unless client-side office remit.',
      }
    ),
    r(
      'Office Manager (Professional Services Firm)',
      'practitioner',
      'Office manager in law/accounting/consulting firms supporting partners, conflict checks and client hospitality.',
      {
        priority: 140,
        eligibilityNote:
          'Professional services office manager — not Practice Manager (clinical) or Legal Practice Manager (fee-earner HR).',
      }
    ),
  ],
}

const EXECUTIVE_SUPPORT: SpecialismPack = {
  slug: 'executive-support',
  label: 'Executive Support',
  professionalBody: 'Executive Support Magazine / CMI',
  relatedBodies: ['Executive Support', 'CMI', 'PA industry bodies'],
  sources: [
    'prospects_personal_assistant',
    'national_careers_service_secretary',
    'executive_support_careers',
  ],
  siblingSlugs: siblings('executive-support'),
  roles: [
    r(
      'Executive Support Apprentice',
      'foundation_business_support',
      'Apprenticeship building diary management, travel booking and confidential correspondence skills for executive teams.',
      {
        priority: 10,
        academicRequirement: 'none',
        eligibilityNote:
          'Executive support apprenticeship — not HR Apprentice or Business Administration apprentice without PA focus.',
      }
    ),
    r(
      'Junior Personal Assistant',
      'foundation_business_support',
      'Entry PA supporting a manager with scheduling, inbox triage and meeting preparation.',
      {
        priority: 20,
        academicRequirement: 'none',
        eligibilityNote:
          'Junior PA — not Receptionist, Office Assistant or HR Administrator.',
      }
    ),
    r(
      'Graduate Executive Assistant Trainee',
      'graduate_entry',
      'Graduate trainee PA/EA pathway supporting senior leaders with board papers and stakeholder coordination.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate EA trainee — not Graduate HR Business Partner or Management Consultant.',
      }
    ),
    r(
      'Personal Assistant (PA)',
      'junior_practitioner',
      'Provides high-trust support to a director or senior manager including travel, expenses and confidential matters.',
      {
        priority: 40,
        eligibilityNote:
          'Personal assistant (business) — not HR Advisor, People Partner or Talent Coordinator.',
      }
    ),
    r(
      'Team Personal Assistant',
      'junior_practitioner',
      'Supports a leadership team or partner group with coordinated diaries and shared inbox management.',
      {
        priority: 50,
        eligibilityNote:
          'Team PA — not Team Administrator (general admin) or Executive Secretary legal-only.',
      }
    ),
    r(
      'Executive Assistant (EA)',
      'practitioner',
      'Senior assistant partnering with C-suite or board members on strategic scheduling, communications and projects.',
      {
        priority: 60,
        eligibilityNote:
          'Executive assistant — not Chief of Staff (strategy/operations) or HR Business Partner.',
      }
    ),
    r(
      'Executive Assistant to CEO',
      'practitioner',
      'EA supporting a CEO with board governance logistics, investor relations scheduling and confidential initiatives.',
      {
        priority: 70,
        eligibilityNote:
          'EA to CEO — not Company Secretary (legal governance) or COO.',
      }
    ),
    r(
      'Senior Executive Assistant',
      'experienced_manager',
      'Highly experienced EA supporting multiple executives or complex international travel and stakeholder networks.',
      {
        priority: 80,
        eligibilityNote:
          'Senior EA — not Office Manager (site operations) or Executive PA in HR/people directorates.',
      }
    ),
    r(
      'Executive Business Partner (Assistant Track)',
      'experienced_manager',
      'Hybrid EA role with project support and leadership team coordination — still executive support, not HR BP.',
      {
        priority: 90,
        eligibilityNote:
          'Executive business partner (assistant track) — not HR Business Partner or Finance Business Partner.',
      }
    ),
    r(
      'Head of Executive Support',
      'senior_manager_specialist',
      'Leads PA/EA community, standards, development and allocation across an organisation.',
      {
        priority: 100,
        eligibilityNote:
          'Head of executive support — not Head of HR or Head of Office Operations.',
      }
    ),
    r(
      'Director of Executive Office',
      'director_executive',
      'Executive owner of the executive office function supporting board and C-suite operations.',
      {
        priority: 110,
        eligibilityNote:
          'Director executive office — not General Counsel or Company Secretary unless explicit EA function remit.',
      }
    ),
    r(
      'Board and Governance Assistant',
      'practitioner',
      'Supports board meeting logistics, papers distribution and governance calendars — PA pathway, not legal counsel.',
      {
        priority: 120,
        eligibilityNote:
          'Board assistant (executive support) — not Company Secretary (qualified governance) or Paralegal.',
      }
    ),
    r(
      'Executive Support Consultant',
      'consultant_independent',
      'Consults on EA operating models, PA competency frameworks and executive office design.',
      {
        priority: 130,
        eligibilityNote:
          'Executive support consulting — not HR consulting or Interim HR Director.',
      }
    ),
    r(
      'Private Personal Assistant',
      'consultant_independent',
      'Self-employed PA supporting high-net-worth individuals or family offices — business executive support adjacent.',
      {
        priority: 140,
        eligibilityNote:
          'Private PA — not Household Manager (domestic estate) or Nanny/Housekeeper roles.',
      }
    ),
  ],
}

export const COMMERCIAL_OPS_PACKS: SpecialismPack[] = [
  COMMERCIAL_MANAGEMENT,
  PROCUREMENT,
  PURCHASING,
  CONTRACT_MANAGEMENT,
  SUPPLIER_MANAGEMENT,
  CATEGORY_MANAGEMENT,
  BID_AND_PROPOSAL_MANAGEMENT,
  TENDER_MANAGEMENT,
  SERVICE_MANAGEMENT,
  FACILITIES_AND_WORKPLACE,
  QUALITY_MANAGEMENT,
  CUSTOMER_OPERATIONS,
  SHARED_SERVICES,
  BUSINESS_SUPPORT,
  OFFICE_MANAGEMENT,
  EXECUTIVE_SUPPORT,
]
