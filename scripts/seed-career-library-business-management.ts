/**
 * Seed Business & Management field + specialisms.
 *   npx tsx scripts/seed-career-library-business-management.ts
 */

import { normalizeSlug } from '../lib/admin/career-library/guards'
import {
  createServiceClient,
  ensureBusinessStageModel,
  FIELD_SLUG,
} from './career-library-business/shared'

type Spec = { name: string; description: string; professionalBody: string }

const SPECIALISMS: Spec[] = [
  // General Business
  {
    name: 'Business Management',
    description: 'General business management across planning, coordination and organisational delivery.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Business Administration',
    description: 'Business administration covering organisational administration, coordination and office systems.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Business Operations',
    description: 'Day-to-day business operations, process ownership and operational performance.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Business Development',
    description: 'Identifying and winning new business opportunities, partnerships and growth initiatives.',
    professionalBody: 'Institute of Sales Professionals / CMI',
  },
  {
    name: 'Entrepreneurship and Start-ups',
    description: 'Founding, growing and advising early-stage ventures and entrepreneurial ventures.',
    professionalBody: 'Enterprise Nation / Institute of Enterprise and Entrepreneurs',
  },
  {
    name: 'Small Business Management',
    description: 'Managing and growing small and medium-sized enterprises across UK sectors.',
    professionalBody: 'Federation of Small Businesses / CMI',
  },
  {
    name: 'Family Business',
    description: 'Governance, succession and management of family-owned enterprises.',
    professionalBody: 'Institute for Family Business / CMI',
  },
  {
    name: 'International Business',
    description: 'Cross-border trade, market entry and international commercial operations.',
    professionalBody: 'Institute of Export & International Trade',
  },
  // Management & Leadership
  {
    name: 'General Management',
    description: 'Cross-functional general management of teams, budgets and business units.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Operational Management',
    description: 'Managing operational delivery, capacity, service levels and continuous performance.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Strategic Management',
    description: 'Strategy formulation, competitive positioning and strategic planning.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  {
    name: 'Change Management',
    description: 'Planning and delivering organisational change, adoption and transition.',
    professionalBody: 'CMI / APM Change Management',
  },
  {
    name: 'Organisational Development',
    description: 'OD interventions improving culture, capability and organisational effectiveness.',
    professionalBody: 'CIPD (OD context) / CMI',
  },
  {
    name: 'Leadership and People Management',
    description: 'Line management, people leadership and team performance (distinct from HR specialist roles).',
    professionalBody: 'Institute of Leadership / CMI',
  },
  {
    name: 'Executive Management',
    description: 'Executive-level leadership of organisations, portfolios and enterprise direction.',
    professionalBody: 'Chartered Management Institute (CMI)',
  },
  // Projects & Delivery
  {
    name: 'Project Management',
    description: 'Planning and delivering projects to time, cost and quality outcomes.',
    professionalBody: 'Association for Project Management (APM)',
  },
  {
    name: 'Programme Management',
    description: 'Coordinating related projects to achieve strategic programme outcomes.',
    professionalBody: 'Association for Project Management (APM)',
  },
  {
    name: 'Portfolio Management',
    description: 'Prioritising and governing portfolios of projects and programmes.',
    professionalBody: 'Association for Project Management (APM)',
  },
  {
    name: 'PMO',
    description: 'Project/programme management office standards, assurance and delivery support.',
    professionalBody: 'Association for Project Management (APM)',
  },
  {
    name: 'Agile Delivery',
    description: 'Agile product and project delivery using iterative delivery frameworks.',
    professionalBody: 'APM / Agile Business Consortium',
  },
  {
    name: 'Business Transformation',
    description: 'Large-scale transformation of operating models, processes and capabilities.',
    professionalBody: 'CMI / APM',
  },
  {
    name: 'Implementation Management',
    description: 'Implementing systems, processes and change initiatives into business-as-usual.',
    professionalBody: 'APM / CMI',
  },
  // Analysis & Consulting
  {
    name: 'Business Analysis',
    description: 'Eliciting requirements, analysing processes and enabling business change.',
    professionalBody: 'BCS (Business Analysis) / IIBA UK',
  },
  {
    name: 'Management Consulting',
    description: 'Advisory consulting on management, operations and organisational problems.',
    professionalBody: 'Institute of Consulting / MCA',
  },
  {
    name: 'Strategy Consulting',
    description: 'Strategy advisory on markets, competitive strategy and corporate direction.',
    professionalBody: 'Institute of Consulting / MCA',
  },
  {
    name: 'Process Improvement',
    description: 'Improving business processes for efficiency, quality and customer outcomes.',
    professionalBody: 'Lean Competency System / CQI context',
  },
  {
    name: 'Continuous Improvement',
    description: 'CI methods including Lean/Six Sigma to sustain operational improvement.',
    professionalBody: 'Lean Competency System / CQI',
  },
  {
    name: 'Service Improvement',
    description: 'Improving service design and service delivery performance.',
    professionalBody: 'CMI / Customer service professional bodies',
  },
  {
    name: 'Business Process Management',
    description: 'BPM modelling, ownership and optimisation of end-to-end processes.',
    professionalBody: 'ABPMP / BCS',
  },
  // Commercial & Procurement
  {
    name: 'Commercial Management',
    description: 'Commercial strategy, contracts, pricing and commercial risk management.',
    professionalBody: 'CIPS / Institute of Commercial Management',
  },
  {
    name: 'Procurement',
    description: 'Sourcing and purchasing goods and services to meet organisational need.',
    professionalBody: 'Chartered Institute of Procurement & Supply (CIPS)',
  },
  {
    name: 'Purchasing',
    description: 'Transactional and tactical purchasing supporting procurement operations.',
    professionalBody: 'Chartered Institute of Procurement & Supply (CIPS)',
  },
  {
    name: 'Contract Management',
    description: 'Managing contract performance, variations and supplier obligations.',
    professionalBody: 'CIPS / WorldCC',
  },
  {
    name: 'Supplier Management',
    description: 'Managing supplier relationships, performance and risk.',
    professionalBody: 'Chartered Institute of Procurement & Supply (CIPS)',
  },
  {
    name: 'Category Management',
    description: 'Category strategies for spend areas to optimise value and risk.',
    professionalBody: 'Chartered Institute of Procurement & Supply (CIPS)',
  },
  {
    name: 'Bid and Proposal Management',
    description: 'Leading bids and proposals for competitive tenders and opportunities.',
    professionalBody: 'APMP / CIPS',
  },
  {
    name: 'Tender Management',
    description: 'Managing tender processes from buyer or supplier perspectives.',
    professionalBody: 'CIPS / APMP',
  },
  // Operations & Services
  {
    name: 'Service Management',
    description: 'Managing service delivery operations and customer-facing service performance.',
    professionalBody: 'itSMF / CMI (business service context)',
  },
  {
    name: 'Facilities and Workplace Management',
    description: 'Facilities, workplace and soft/hard FM services for organisations.',
    professionalBody: 'Institute of Workplace and Facilities Management (IWFM)',
  },
  {
    name: 'Quality Management',
    description: 'Quality systems, assurance and continual improvement of products and services.',
    professionalBody: 'Chartered Quality Institute (CQI)',
  },
  {
    name: 'Customer Operations',
    description: 'Customer operations, contact centres and customer journey operations.',
    professionalBody: 'Institute of Customer Service / CMI',
  },
  {
    name: 'Shared Services',
    description: 'Shared service centres delivering multi-function business support at scale.',
    professionalBody: 'SSON / CMI',
  },
  {
    name: 'Business Support',
    description: 'Business support functions assisting teams with administration and coordination.',
    professionalBody: 'CMI',
  },
  {
    name: 'Office Management',
    description: 'Office management covering facilities coordination, admin teams and workplace running.',
    professionalBody: 'IWFM / CMI',
  },
  {
    name: 'Executive Support',
    description: 'Executive assistance and PA support to senior leaders (business support pathway).',
    professionalBody: 'Executive Support Magazine / CMI',
  },
  // Governance & Risk
  {
    name: 'Corporate Governance',
    description: 'Board and corporate governance frameworks, compliance and accountability.',
    professionalBody: 'Chartered Governance Institute UK & Ireland (CGI)',
  },
  {
    name: 'Enterprise Risk Management',
    description: 'Enterprise risk frameworks identifying, assessing and treating organisational risks.',
    professionalBody: 'Institute of Risk Management (IRM)',
  },
  {
    name: 'Business Continuity',
    description: 'Business continuity and resilience planning for disruption and recovery.',
    professionalBody: 'Business Continuity Institute (BCI)',
  },
  {
    name: 'Internal Controls',
    description: 'Internal control design and monitoring (distinct from statutory audit/accounting).',
    professionalBody: 'IRM / CGI',
  },
  {
    name: 'Corporate Responsibility',
    description: 'Corporate responsibility programmes spanning ethics, community and stakeholder trust.',
    professionalBody: 'IEMA / CGI context',
  },
  {
    name: 'ESG and Sustainability Management',
    description: 'ESG strategy and sustainability management for organisations (business-led).',
    professionalBody: 'IEMA / CISL context',
  },
  // Specialist
  {
    name: 'Product Management',
    description:
      'Business and product-led product management of offerings and roadmaps (distinct from software engineering).',
    professionalBody: 'Product Management community / CMI',
  },
  {
    name: 'Innovation Management',
    description: 'Innovation pipelines, ideation governance and commercialisation of new ideas.',
    professionalBody: 'ISPIM / CMI',
  },
  {
    name: 'Franchise Management',
    description: 'Managing franchise networks, franchisee performance and brand standards.',
    professionalBody: 'British Franchise Association',
  },
  {
    name: 'Export and Trade Management',
    description: 'Export operations, trade compliance and international trade management.',
    professionalBody: 'Institute of Export & International Trade',
  },
  {
    name: 'Business Systems and ERP',
    description:
      'Business-led ERP and business systems implementation, process ownership and change (distinct from IT engineering).',
    professionalBody: 'CMI / BCS (business systems context)',
  },
  {
    name: 'Data-informed Business Management',
    description:
      'Using business intelligence and management information for decisions (distinct from IT Data Science).',
    professionalBody: 'CMI / RSS (management information context)',
  },
  // Academic & Research
  {
    name: 'Business and Management Research',
    description: 'Academic and applied research across business and management disciplines.',
    professionalBody: 'British Academy of Management / ABS',
  },
  {
    name: 'Organisational Behaviour',
    description: 'Research and teaching on organisational behaviour, culture and workplace dynamics.',
    professionalBody: 'British Academy of Management',
  },
  {
    name: 'Entrepreneurship Research',
    description: 'Academic research on entrepreneurship, ventures and entrepreneurial ecosystems.',
    professionalBody: 'ISBE / BAM',
  },
  {
    name: 'Strategy Research',
    description: 'Academic research on strategic management and organisational strategy.',
    professionalBody: 'Strategic Management Society / BAM',
  },
  {
    name: 'Operations Management Research',
    description: 'Academic research on operations, supply chains and service operations management.',
    professionalBody: 'EurOMA / BAM',
  },
]

async function main() {
  const supabase = createServiceClient()
  const { modelId } = await ensureBusinessStageModel(supabase)

  const fieldSlug = normalizeSlug(undefined, 'Business & Management') || FIELD_SLUG
  let fieldId: string
  let fieldCreated = false

  const { data: existingField } = await supabase
    .from('career_library_fields')
    .select('id, name, slug')
    .or(`slug.eq.${fieldSlug},name.ilike.Business & Management`)
    .maybeSingle()

  if (existingField?.id) {
    fieldId = existingField.id
    console.log(`Field already exists: ${existingField.name} (${existingField.slug})`)
  } else {
    const { data: created, error } = await supabase
      .from('career_library_fields')
      .insert({
        name: 'Business & Management',
        slug: fieldSlug,
        description:
          'UK business and management careers spanning operations, projects, commercial, consulting, governance and leadership. Progression is driven by experience and responsibility. Degrees and MBAs may help some routes but are not automatic seniority. Distinct from Accounting & Finance, HR, Marketing, IT, Law and Engineering.',
        status: 'draft',
        active: true,
        sort_order: 50,
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
          regulated_profession: false,
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
      regulated_profession: false,
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

  console.log('\n=== Business & Management foundation ===')
  console.log(`Field: ${fieldCreated ? 'created' : 'existed'} (${fieldSlug})`)
  console.log(`Stage model: business_management_route (${modelId})`)
  console.log(`Specialisms created: ${createdCount}`)
  console.log(`Already present / skipped: ${skipped}`)
  console.log(`Total defined: ${SPECIALISMS.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
