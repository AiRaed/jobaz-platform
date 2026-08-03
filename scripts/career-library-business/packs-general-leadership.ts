import { r, type SpecialismPack } from './shared'

const GENERAL_LEADERSHIP_SIBLINGS = [
  'business-management',
  'business-administration',
  'business-operations',
  'business-development',
  'entrepreneurship-and-start-ups',
  'small-business-management',
  'family-business',
  'international-business',
  'general-management',
  'operational-management',
  'strategic-management',
  'change-management',
  'organisational-development',
  'leadership-and-people-management',
  'executive-management',
]

function siblings(except: string) {
  return GENERAL_LEADERSHIP_SIBLINGS.filter((s) => s !== except)
}

const CMI_SOURCES = [
  'prospects_business_management_uk',
  'national_careers_service_manager',
  'cmi_careers',
  'ilo_management',
]

export const GENERAL_LEADERSHIP_PACKS: SpecialismPack[] = [
  // -------------------------------------------------------------------------
  // 1) Business Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'business-management',
    label: 'Business Management',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Leadership', 'IoD'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('business-management'),
    roles: [
      r(
        'Business Management Apprentice',
        'foundation_business_support',
        'Apprenticeship route into business coordination, planning support and organisational administration.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'General business management apprenticeship — not Business Administration office-only or IT/software apprenticeships.',
        }
      ),
      r(
        'Trainee Business Coordinator',
        'foundation_business_support',
        'Entry coordinator learning scheduling, stakeholder liaison and business support processes under supervision.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Trainee coordinator in general management — not Project Management trainee or Executive PA support roles.',
        }
      ),
      r(
        'Business Management Graduate',
        'graduate_entry',
        'Graduate entry into business planning, reporting and cross-functional coordination following relevant degree training.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate business management entry — not Accounting & Finance graduate trainee or HR graduate schemes.',
        }
      ),
      r(
        'Graduate Business Management Trainee',
        'graduate_entry',
        'Structured graduate trainee building exposure to business units, budgets and management reporting.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate scheme trainee in business management — not Management Consulting analyst intake alone.',
        }
      ),
      r(
        'Junior Business Manager',
        'junior_practitioner',
        'Early-career manager supporting team delivery, operational targets and day-to-day business coordination.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior general business manager — not Junior Operations Manager titles owned by Business Operations specialism.',
        }
      ),
      r(
        'Assistant Business Manager',
        'junior_practitioner',
        'Assists business unit managers with planning, performance tracking and stakeholder communication.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant manager in general business context — not Assistant General Manager in multi-site retail-only remits.',
        }
      ),
      r(
        'Business Manager',
        'practitioner',
        'Owns business unit delivery, team coordination and operational performance for a defined area of work.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Core business manager role — not Business Development Manager (growth/sales) or Product Manager titles.',
        }
      ),
      r(
        'Business Management Officer',
        'practitioner',
        'Delivers business management processes including planning cycles, governance support and performance reporting.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Business management officer — not Business Analyst (requirements/change) or Quality Officer roles.',
        }
      ),
      r(
        'Experienced Business Manager',
        'experienced_manager',
        'Experienced manager accountable for budgets, people leadership and sustained business unit outcomes.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experience-led business manager — degree/MBA not automatic seniority requirement.',
        }
      ),
      r(
        'Business Management Team Leader',
        'experienced_manager',
        'Leads a business management team delivering planning, coordination and management information services.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Team leader in business management function — not PMO Team Lead or Change Management team lead.',
        }
      ),
      r(
        'Senior Business Manager',
        'senior_manager_specialist',
        'Senior manager with accountability for multiple workstreams, senior stakeholders and complex business delivery.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior business manager — not Senior General Manager (cross-functional unit P&L) titles in General Management.',
        }
      ),
      r(
        'Head of Business Management',
        'head_programme_leadership',
        'Heads business management capability, standards and delivery across organisational units or programmes.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of function for business management — not Head of Business Operations or Head of Strategy.',
        }
      ),
      r(
        'Director of Business Management',
        'director_executive',
        'Director-level leadership of business management strategy, investment and enterprise-wide coordination.',
        {
          priority: 130,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director role — MBA may be desirable but extensive leadership experience is primary; not CFO or HR Director.',
        }
      ),
      r(
        'Lecturer in Business Management',
        'academic_research',
        'Teaches and researches business management practice, organisational performance and management education.',
        {
          priority: 140,
          eligibilityNote:
            'Academic business management track — doctorate typically required; not CMI practitioner membership route alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 2) Business Administration — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'business-administration',
    label: 'Business Administration',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Administrative Management'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('business-administration'),
    roles: [
      r(
        'Business Administration Apprentice',
        'foundation_business_support',
        'Apprenticeship covering office systems, document management, scheduling and business administration support.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Business administration apprenticeship — not Legal Secretary, Medical Receptionist or IT helpdesk apprenticeships.',
        }
      ),
      r(
        'Trainee Administrative Assistant (Business)',
        'foundation_business_support',
        'Trainee administrator supporting correspondence, records, meetings and office coordination tasks.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Administrative trainee in business settings — not Executive Support PA to C-suite unless admin-systems remit.',
        }
      ),
      r(
        'Business Administration Graduate',
        'graduate_entry',
        'Graduate entry coordinating business administration processes, data entry and office service delivery.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate business administration — not Business Management graduate with P&L or team leadership remit.',
        }
      ),
      r(
        'Graduate Business Administration Trainee',
        'graduate_entry',
        'Graduate trainee learning administration standards, workflow design and business support coordination.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate administration trainee — not Office Management/IWFM facilities-focused graduate routes.',
        }
      ),
      r(
        'Junior Business Administrator',
        'junior_practitioner',
        'Early-career administrator managing routine business records, scheduling and internal service requests.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior business administrator — not Junior Business Manager with people-management accountability.',
        }
      ),
      r(
        'Administrative Coordinator (Business)',
        'junior_practitioner',
        'Coordinates administrative workflows, document control and cross-team business support activities.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Administrative coordinator — not Project Coordinator (APM delivery) or PMO coordinator titles.',
        }
      ),
      r(
        'Business Administrator',
        'practitioner',
        'Independent business administrator owning office systems, correspondence and administrative service quality.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner business administrator — not Business Operations Analyst with process/performance remit.',
        }
      ),
      r(
        'Office Services Administrator (Business)',
        'practitioner',
        'Manages office services including mail, supplies, booking systems and administrative service levels.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Office services administrator — not Facilities Manager (IWFM hard/soft FM) or Workplace Manager titles.',
        }
      ),
      r(
        'Business Administration Supervisor',
        'experienced_manager',
        'Supervises administration teams, quality standards and business support service delivery.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Administration supervisor — experience-led; not HR Supervisor or Customer Operations supervisor roles.',
        }
      ),
      r(
        'Administration Team Manager',
        'experienced_manager',
        'Manages an administration team with hiring, rota planning and service-level accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Administration team manager — not Line Manager (people leadership) titles in Leadership specialism.',
        }
      ),
      r(
        'Senior Business Administrator',
        'senior_manager_specialist',
        'Senior administrator leading complex administration programmes, policy adherence and training of junior staff.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior business administrator — not Senior Office Manager with full workplace/facilities remit.',
        }
      ),
      r(
        'Head of Business Administration',
        'head_programme_leadership',
        'Heads business administration services, standards and continuous improvement of admin operations.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of business administration — not Head of Business Operations or Head of Shared Services.',
        }
      ),
      r(
        'Director of Business Administration',
        'director_executive',
        'Director-level oversight of enterprise administration services, investment and organisational support models.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director administration role — MBA not universally required; not Finance Director or Company Secretary.',
        }
      ),
      r(
        'Business Administration Consultant (Independent)',
        'consultant_independent',
        'Independent consultant advising organisations on administration systems, workflows and office efficiency.',
        {
          priority: 140,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent administration consultant — not Management Consulting partner or Process Improvement Lean consultant.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 3) Business Operations — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'business-operations',
    label: 'Business Operations',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Leadership'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('business-operations'),
    roles: [
      r(
        'Business Operations Apprentice',
        'foundation_business_support',
        'Apprenticeship into operational coordination, process support and day-to-day business delivery tasks.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Business operations apprenticeship — not IT Operations, Manufacturing Production or Logistics apprenticeships.',
        }
      ),
      r(
        'Trainee Operations Coordinator',
        'foundation_business_support',
        'Trainee coordinator supporting operational schedules, service tracking and internal delivery workflows.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Operations coordinator trainee — not Project Coordinator (APM) or Procurement coordinator roles.',
        }
      ),
      r(
        'Business Operations Graduate',
        'graduate_entry',
        'Graduate entry analysing operational data, supporting process owners and coordinating business delivery.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate business operations — not Operational Management graduate with full line-management remit.',
        }
      ),
      r(
        'Graduate Operations Trainee',
        'graduate_entry',
        'Graduate trainee building exposure to operational KPIs, workflow design and service performance reporting.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate operations trainee — not Supply Chain graduate or Engineering operations trainee routes.',
        }
      ),
      r(
        'Junior Operations Coordinator',
        'junior_practitioner',
        'Early-career coordinator managing operational tasks, issue triage and cross-team delivery handoffs.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior operations coordinator — not Junior Operational Manager with direct reports accountability.',
        }
      ),
      r(
        'Assistant Operations Analyst (Business)',
        'junior_practitioner',
        'Assists operations analysts with data gathering, dashboard support and process documentation.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant operations analyst — not Data Scientist, BI Developer or IT Service Analyst roles.',
        }
      ),
      r(
        'Business Operations Analyst',
        'practitioner',
        'Analyses operational performance, identifies bottlenecks and supports process improvement initiatives.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Business operations analyst — not Business Analyst (requirements/change) or Financial Analyst roles.',
        }
      ),
      r(
        'Operations Coordinator (Business)',
        'practitioner',
        'Coordinates day-to-day operational delivery, resource scheduling and internal service execution.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner operations coordinator — not Customer Operations contact-centre coordinator titles.',
        }
      ),
      r(
        'Business Operations Manager',
        'experienced_manager',
        'Manages operational teams, service levels and continuous improvement of business delivery processes.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Business operations manager — not Operational Management Manager (broader P&L/unit remit) or IT Ops Manager.',
        }
      ),
      r(
        'Operations Team Manager',
        'experienced_manager',
        'Leads an operations team accountable for throughput, quality and operational risk management.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Operations team manager — experience-led; not Service Improvement Manager or Quality Manager titles.',
        }
      ),
      r(
        'Senior Business Operations Manager',
        'senior_manager_specialist',
        'Senior manager overseeing complex operational portfolios, vendor coordination and performance governance.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior business operations manager — not Senior Operational Manager in General Management unit context.',
        }
      ),
      r(
        'Head of Business Operations',
        'head_programme_leadership',
        'Heads business operations function, operating rhythms and enterprise operational performance standards.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of business operations — not Head of Operational Management or Head of Shared Services.',
        }
      ),
      r(
        'Director of Business Operations',
        'director_executive',
        'Director-level leadership of business operations strategy, investment and enterprise delivery models.',
        {
          priority: 130,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director operations role — MBA desirable on some postings but not universal; not COO title in Executive Management.',
        }
      ),
      r(
        'Lecturer in Business Operations',
        'academic_research',
        'Teaches and researches business operations, service systems and operational performance in organisations.',
        {
          priority: 140,
          eligibilityNote:
            'Academic business operations track — PhD typically required; not practitioner CMI membership alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 4) Business Development — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'business-development',
    label: 'Business Development',
    professionalBody: 'Institute of Sales Professionals / CMI',
    relatedBodies: ['ISP', 'CMI', 'Institute of Consulting'],
    sources: [...CMI_SOURCES, 'isp_sales_careers'],
    siblingSlugs: siblings('business-development'),
    roles: [
      r(
        'Business Development Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting lead research, CRM administration and introductory client outreach activities.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Business development apprenticeship — not Digital Marketing apprentice or IT sales engineer apprenticeships.',
        }
      ),
      r(
        'Trainee Business Development Representative',
        'foundation_business_support',
        'Trainee representative learning prospecting, pipeline hygiene and introductory commercial conversations.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'BD representative trainee — not pure telesales or retail sales assistant roles without B2B development remit.',
        }
      ),
      r(
        'Business Development Graduate',
        'graduate_entry',
        'Graduate entry supporting market research, partnership mapping and new opportunity qualification.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate business development — not Marketing graduate or Management Consulting analyst intake.',
        }
      ),
      r(
        'Graduate Business Development Trainee',
        'graduate_entry',
        'Structured graduate trainee building pipeline management, proposal support and stakeholder engagement skills.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate BD trainee — not Bid and Proposal Management specialist graduate schemes alone.',
        }
      ),
      r(
        'Junior Business Development Executive',
        'junior_practitioner',
        'Early-career executive developing qualified leads, nurturing relationships and supporting deal progression.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior BD executive — not Junior Account Manager in established account-farming-only remits.',
        }
      ),
      r(
        'Assistant Business Development Manager',
        'junior_practitioner',
        'Assists BD managers with pipeline reporting, partner coordination and opportunity planning.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant BD manager — not Business Manager (internal unit delivery) or Product Manager titles.',
        }
      ),
      r(
        'Business Development Executive',
        'practitioner',
        'Owns prospect development, partnership conversations and conversion of qualified commercial opportunities.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner BD executive — not International Business Executive (cross-border trade focus).',
        }
      ),
      r(
        'Business Development Manager',
        'practitioner',
        'Manages BD targets, key accounts growth initiatives and new market entry support activities.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'BD manager — not Strategic Management Manager (corporate strategy) or Sales Director titles alone.',
        }
      ),
      r(
        'Senior Business Development Manager',
        'experienced_manager',
        'Experienced manager leading major partnership programmes, complex deals and regional growth plans.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior BD manager — experience-led; not Senior International Business Manager (export/trade remit).',
        }
      ),
      r(
        'Business Development Team Leader',
        'experienced_manager',
        'Leads a business development team with coaching, pipeline governance and revenue target accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'BD team leader — not Change Management team lead or Customer Operations team leader roles.',
        }
      ),
      r(
        'Head of Business Development',
        'head_programme_leadership',
        'Heads business development function, partnership strategy and commercial growth programmes.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of BD — not Head of Strategy or Head of Commercial Management (procurement/contracts).',
        }
      ),
      r(
        'Director of Business Development',
        'director_executive',
        'Director-level leadership of growth strategy, major partnerships and enterprise commercial development.',
        {
          priority: 120,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director BD role — MBA may be desirable but not required universally; not CMO or Sales Director alone.',
        }
      ),
      r(
        'Independent Business Development Consultant',
        'consultant_independent',
        'Self-employed consultant helping organisations build pipelines, partnerships and market entry approaches.',
        {
          priority: 130,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent BD consultant — not Strategy Consulting partner or Management Consulting associate titles.',
        }
      ),
      r(
        'Lecturer in Business Development',
        'academic_research',
        'Teaches and researches business development, entrepreneurial sales and commercial growth in organisations.',
        {
          priority: 140,
          eligibilityNote:
            'Academic BD track — doctorate typically required; not ISP sales practitioner certification alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 5) Entrepreneurship and Start-ups — 16 roles (includes founder pathways)
  // -------------------------------------------------------------------------
  {
    slug: 'entrepreneurship-and-start-ups',
    label: 'Entrepreneurship and Start-ups',
    professionalBody: 'Enterprise Nation / Institute of Enterprise and Entrepreneurs',
    relatedBodies: ['Enterprise Nation', 'IoEE', 'CMI'],
    sources: [...CMI_SOURCES, 'enterprise_nation_careers', 'ioee_entrepreneurship'],
    siblingSlugs: siblings('entrepreneurship-and-start-ups'),
    roles: [
      r(
        'Entrepreneurship Apprentice (Business)',
        'foundation_business_support',
        'Apprenticeship supporting start-up hubs, venture programmes and early-stage business administration.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Entrepreneurship apprenticeship — not IT/software start-up engineering apprenticeships.',
        }
      ),
      r(
        'Trainee Venture Support Assistant',
        'foundation_business_support',
        'Trainee assistant supporting incubator operations, founder onboarding and venture programme logistics.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Venture support trainee — not Business Administration office-only or Investment banking analyst routes.',
        }
      ),
      r(
        'Entrepreneurship Graduate',
        'graduate_entry',
        'Graduate entry supporting venture scouting, pitch preparation and start-up ecosystem coordination.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate entrepreneurship entry — not Business Development graduate in corporate BD remits alone.',
        }
      ),
      r(
        'Graduate Start-up Trainee',
        'graduate_entry',
        'Graduate trainee in accelerator or venture studio environments learning venture validation and growth support.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate start-up trainee — not Management Consulting graduate analyst or Product Management graduate.',
        }
      ),
      r(
        'Junior Venture Coordinator',
        'junior_practitioner',
        'Early-career coordinator managing founder cohorts, programme schedules and venture milestone tracking.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior venture coordinator — not Junior Project Manager (APM delivery) or Junior BD Executive roles.',
        }
      ),
      r(
        'Start-up Programme Associate',
        'junior_practitioner',
        'Associate supporting venture curriculum delivery, mentor matching and founder resource coordination.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Start-up programme associate — not Innovation Management associate in corporate R&D-only contexts.',
        }
      ),
      r(
        'Entrepreneurship Officer',
        'practitioner',
        'Delivers entrepreneurship programmes, founder support services and venture readiness assessments.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Entrepreneurship officer — not Business Manager (internal unit) or Change Manager practitioner titles.',
        }
      ),
      r(
        'Venture Development Manager',
        'practitioner',
        'Manages venture pipelines, founder coaching and early-stage growth support for portfolio companies.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Venture development manager — not Small Business Manager (established SME operations) or BD Manager.',
        }
      ),
      r(
        'Start-up Operations Manager',
        'experienced_manager',
        'Manages operational delivery for start-up programmes, investor relations support and scaling readiness.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Start-up operations manager — not Business Operations Manager in mature enterprise contexts alone.',
        }
      ),
      r(
        'Senior Venture Manager',
        'senior_manager_specialist',
        'Senior manager leading complex venture portfolios, scale-up interventions and ecosystem partnerships.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior venture manager — experience-led; not Senior General Manager in corporate unit leadership.',
        }
      ),
      r(
        'Head of Entrepreneurship Programmes',
        'head_programme_leadership',
        'Heads entrepreneurship and start-up programmes, accelerator strategy and founder success outcomes.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of entrepreneurship programmes — not Head of Innovation Management in corporate R&D pipelines.',
        }
      ),
      r(
        'Director of Venture Development',
        'director_executive',
        'Director-level leadership of venture investment support, ecosystem strategy and start-up portfolio growth.',
        {
          priority: 120,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director venture role — MBA not universally required; not VC Partner or Angel investor titles alone.',
        }
      ),
      r(
        'Start-up Founder (Self-employed)',
        'consultant_independent',
        'Self-employed founder building and operating an early-stage venture with direct commercial accountability.',
        {
          priority: 130,
          academicRequirement: 'none',
          eligibilityNote:
            'Founder pathway — not employee promotion ladder; distinct from Small Business Owner in established SME context.',
        }
      ),
      r(
        'Self-employed Entrepreneur',
        'consultant_independent',
        'Independent entrepreneur launching and growing ventures outside traditional employment structures.',
        {
          priority: 140,
          academicRequirement: 'none',
          eligibilityNote:
            'Self-employed entrepreneur — not Franchise Manager or Family Business successor titles alone.',
        }
      ),
      r(
        'Freelance Start-up Advisor',
        'consultant_independent',
        'Independent advisor supporting founders on business models, fundraising readiness and early growth strategy.',
        {
          priority: 150,
          academicRequirement: 'none',
          eligibilityNote:
            'Freelance start-up advisor — not Management Consulting partner or Strategy Consulting associate titles.',
        }
      ),
      r(
        'Lecturer in Entrepreneurship',
        'academic_research',
        'Teaches and researches entrepreneurship, venture creation and entrepreneurial ecosystems.',
        {
          priority: 160,
          eligibilityNote:
            'Academic entrepreneurship track — PhD typically required; not IoEE practitioner membership alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 6) Small Business Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'small-business-management',
    label: 'Small Business Management',
    professionalBody: 'Federation of Small Businesses / CMI',
    relatedBodies: ['FSB', 'CMI', 'Institute of Leadership'],
    sources: [...CMI_SOURCES, 'fsb_careers'],
    siblingSlugs: siblings('small-business-management'),
    roles: [
      r(
        'Small Business Management Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting SME office operations, customer service coordination and basic business records.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'SME management apprenticeship — not Retail Supervisor apprenticeship or Accounting technician apprenticeships.',
        }
      ),
      r(
        'Trainee Small Business Coordinator',
        'foundation_business_support',
        'Trainee coordinator learning SME scheduling, supplier liaison and small-team administrative support.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'SME coordinator trainee — not Business Administration office-only without SME commercial context.',
        }
      ),
      r(
        'Small Business Graduate Trainee',
        'graduate_entry',
        'Graduate entry supporting SME growth planning, operational reporting and small-team coordination.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate SME trainee — not Entrepreneurship graduate in accelerator-only remits without SME operations.',
        }
      ),
      r(
        'Graduate SME Management Trainee',
        'graduate_entry',
        'Graduate trainee building skills in SME budgeting, compliance support and customer relationship management.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate SME management — not Corporate General Management graduate schemes in large enterprises.',
        }
      ),
      r(
        'Junior Small Business Manager',
        'junior_practitioner',
        'Early-career manager supporting day-to-day SME operations, staff coordination and customer delivery.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior SME manager — not Junior Business Manager in large corporate unit structures alone.',
        }
      ),
      r(
        'Assistant SME Manager',
        'junior_practitioner',
        'Assists SME managers with scheduling, stock/service coordination and local supplier management.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant SME manager — not Assistant General Manager in multi-site corporate retail chains alone.',
        }
      ),
      r(
        'Small Business Manager',
        'practitioner',
        'Manages SME operations including staffing, customer service, local marketing support and cashflow awareness.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner SME manager — not Business Operations Manager in enterprise shared-services contexts.',
        }
      ),
      r(
        'SME Operations Coordinator',
        'practitioner',
        'Coordinates SME operational workflows, vendor orders and service delivery across a small business team.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'SME operations coordinator — not Operations Coordinator in large corporate business operations teams.',
        }
      ),
      r(
        'Experienced Small Business Manager',
        'experienced_manager',
        'Experienced manager accountable for SME profitability, team performance and local market competitiveness.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced SME manager — experience-led; not Experienced General Manager in corporate division remits.',
        }
      ),
      r(
        'Small Business Unit Manager',
        'experienced_manager',
        'Manages a defined SME unit or branch with P&L awareness, compliance and customer retention accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'SME unit manager — not Franchise Manager (franchise network standards) or Family Business Manager titles.',
        }
      ),
      r(
        'Senior Small Business Manager',
        'senior_manager_specialist',
        'Senior manager overseeing multiple SME sites or a complex small business with expanded commercial remit.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior SME manager — not Senior Operational Manager in manufacturing or logistics operations contexts.',
        }
      ),
      r(
        'Head of Small Business Services',
        'head_programme_leadership',
        'Heads SME advisory, support services or multi-site small business management programmes.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of SME services — not Head of Business Development or Head of Shared Services in large corporates.',
        }
      ),
      r(
        'Director of SME Growth',
        'director_executive',
        'Director-level leadership of SME growth programmes, regional small business strategy and support investment.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director SME growth — MBA not universally required; not Managing Director of a single SME (see Executive Management).',
        }
      ),
      r(
        'Self-employed Small Business Owner',
        'consultant_independent',
        'Owner-operator managing an established small business with full commercial and operational accountability.',
        {
          priority: 140,
          academicRequirement: 'none',
          eligibilityNote:
            'Small business owner pathway — not Start-up Founder in pre-revenue venture stage or Franchisee titles alone.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 7) Family Business — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'family-business',
    label: 'Family Business',
    professionalBody: 'Institute for Family Business / CMI',
    relatedBodies: ['IFB', 'CMI', 'IoD'],
    sources: [...CMI_SOURCES, 'ifb_family_business'],
    siblingSlugs: siblings('family-business'),
    roles: [
      r(
        'Family Business Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting family enterprise administration, customer coordination and business records.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Family business apprenticeship — not generic Business Administration apprenticeship without family enterprise context.',
        }
      ),
      r(
        'Trainee Family Enterprise Assistant',
        'foundation_business_support',
        'Trainee assistant supporting family business operations, governance meetings and stakeholder coordination.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Family enterprise trainee — not Corporate Governance company secretarial trainee routes alone.',
        }
      ),
      r(
        'Family Business Graduate Trainee',
        'graduate_entry',
        'Graduate entry supporting family business planning, succession documentation and operational reporting.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate family business trainee — not General Management graduate in non-family corporate contexts.',
        }
      ),
      r(
        'Graduate Family Enterprise Trainee',
        'graduate_entry',
        'Graduate trainee learning family governance basics, shareholder communication and business continuity planning.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate family enterprise — not Entrepreneurship graduate in venture accelerator-only environments.',
        }
      ),
      r(
        'Junior Family Business Coordinator',
        'junior_practitioner',
        'Early-career coordinator managing family business schedules, internal communications and operational support.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior family business coordinator — not Junior Business Administrator in non-family corporate settings.',
        }
      ),
      r(
        'Assistant Family Business Manager',
        'junior_practitioner',
        'Assists family business managers with governance support, supplier relations and team coordination.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant family business manager — not Assistant General Manager in publicly listed corporate units.',
        }
      ),
      r(
        'Family Business Manager',
        'practitioner',
        'Manages family enterprise operations balancing commercial delivery, family stakeholder needs and governance.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner family business manager — not Small Business Manager without family ownership/governance remit.',
        }
      ),
      r(
        'Family Enterprise Officer',
        'practitioner',
        'Delivers family enterprise programmes including succession planning support, policy adherence and reporting.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Family enterprise officer — not Organisational Development practitioner or Corporate Governance officer alone.',
        }
      ),
      r(
        'Family Business Operations Manager',
        'experienced_manager',
        'Manages operational delivery in a family-owned business with multi-generational stakeholder considerations.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Family business operations manager — not Business Operations Manager in non-family corporate enterprises.',
        }
      ),
      r(
        'Senior Family Business Manager',
        'senior_manager_specialist',
        'Senior manager leading complex family business transitions, advisory programmes and governance improvements.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior family business manager — experience-led; not Senior General Manager in corporate division leadership.',
        }
      ),
      r(
        'Head of Family Enterprise',
        'head_programme_leadership',
        'Heads family business advisory, succession programmes and enterprise governance support services.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of family enterprise — not Head of Corporate Governance (statutory board compliance) alone.',
        }
      ),
      r(
        'Director of Family Business',
        'director_executive',
        'Director-level leadership of family enterprise strategy, succession governance and multi-generational planning.',
        {
          priority: 120,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director family business — MBA may be desirable; not family member Owner-Director titles without professional remit.',
        }
      ),
      r(
        'Family Business Advisor (Independent)',
        'consultant_independent',
        'Independent advisor supporting family businesses on governance, succession and inter-generational leadership.',
        {
          priority: 130,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent family business advisor — not Management Consulting partner or Legal advisor on family law alone.',
        }
      ),
      r(
        'Lecturer in Family Business',
        'academic_research',
        'Teaches and researches family business governance, succession and entrepreneurial family dynamics.',
        {
          priority: 140,
          eligibilityNote:
            'Academic family business track — PhD typically required; not IFB practitioner network membership alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 8) International Business — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'international-business',
    label: 'International Business',
    professionalBody: 'Institute of Export & International Trade',
    relatedBodies: ['IOE&IT', 'CMI', 'British Chambers of Commerce'],
    sources: [...CMI_SOURCES, 'ioeit_export_careers'],
    siblingSlugs: siblings('international-business'),
    roles: [
      r(
        'International Business Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting export documentation, international shipping coordination and trade compliance basics.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'International business apprenticeship — not Import/Export logistics driver apprenticeships or Customs broker legal routes alone.',
        }
      ),
      r(
        'Trainee International Trade Assistant',
        'foundation_business_support',
        'Trainee assistant learning trade documentation, market research support and cross-border coordination tasks.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'International trade trainee — not Procurement apprentice or Purchasing coordinator roles alone.',
        }
      ),
      r(
        'International Business Graduate',
        'graduate_entry',
        'Graduate entry supporting market entry analysis, international partner liaison and export programme coordination.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate international business — not Business Development graduate without cross-border trade/export remit.',
        }
      ),
      r(
        'Graduate International Business Trainee',
        'graduate_entry',
        'Graduate trainee building skills in international market assessment, trade compliance and global operations support.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate international business trainee — not Export and Trade Management specialist operational roles alone.',
        }
      ),
      r(
        'Junior International Business Executive',
        'junior_practitioner',
        'Early-career executive coordinating international accounts, shipping schedules and overseas partner communications.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior international business executive — not Junior Business Development Executive (domestic BD focus).',
        }
      ),
      r(
        'Assistant International Business Manager',
        'junior_practitioner',
        'Assists international business managers with market reports, compliance checks and overseas visit coordination.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant international business manager — not Assistant Commercial Manager (procurement/contracts focus).',
        }
      ),
      r(
        'International Business Executive',
        'practitioner',
        'Owns international client relationships, export sales support and cross-border commercial coordination.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner international business executive — not Business Development Executive in domestic markets alone.',
        }
      ),
      r(
        'International Business Manager',
        'practitioner',
        'Manages international market operations, distributor relationships and overseas business performance.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'International business manager — not Strategic Management Manager (corporate strategy) or General Manager titles.',
        }
      ),
      r(
        'Senior International Business Manager',
        'experienced_manager',
        'Experienced manager leading regional international portfolios, trade partnerships and market expansion plans.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior international business manager — not Senior Business Development Manager without cross-border remit.',
        }
      ),
      r(
        'Regional International Business Manager',
        'experienced_manager',
        'Manages international business delivery across a defined region with compliance and partner governance accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Regional international manager — experience-led; not Area General Manager in domestic-only operations.',
        }
      ),
      r(
        'Head of International Business',
        'head_programme_leadership',
        'Heads international business function, global market strategy and overseas operational standards.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of international business — not Head of Export and Trade Management (operational export focus) alone.',
        }
      ),
      r(
        'Director of International Business',
        'director_executive',
        'Director-level leadership of global commercial strategy, international partnerships and overseas investment.',
        {
          priority: 120,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director international business — MBA may be desirable; not CFO or Global Supply Chain Director titles.',
        }
      ),
      r(
        'Independent International Business Consultant',
        'consultant_independent',
        'Self-employed consultant advising UK organisations on market entry, export strategy and international partnerships.',
        {
          priority: 130,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent international business consultant — not Strategy Consulting partner or Trade law advisor alone.',
        }
      ),
      r(
        'Lecturer in International Business',
        'academic_research',
        'Teaches and researches international business, global strategy and cross-cultural management.',
        {
          priority: 140,
          eligibilityNote:
            'Academic international business track — PhD typically required; not IOE&IT export practitioner certification alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 9) General Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'general-management',
    label: 'General Management',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Leadership', 'IoD'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('general-management'),
    roles: [
      r(
        'General Management Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting cross-functional business coordination, team assistance and management support tasks.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'General management apprenticeship — not Business Administration office-only or Project Management apprenticeships.',
        }
      ),
      r(
        'Trainee General Manager (Business)',
        'foundation_business_support',
        'Trainee building exposure to unit management support, budget tracking and cross-team coordination.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Trainee general manager pathway — not Operational Management trainee with process-only remit.',
        }
      ),
      r(
        'General Management Graduate',
        'graduate_entry',
        'Graduate entry supporting business unit planning, stakeholder management and performance reporting.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate general management — not Business Management graduate with coordination-only (non P&L) remit.',
        }
      ),
      r(
        'Graduate General Management Trainee',
        'graduate_entry',
        'Structured graduate trainee rotating through business units building general management leadership foundations.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate GM trainee — not Management Consulting analyst or Executive Management graduate board-track alone.',
        }
      ),
      r(
        'Junior General Manager',
        'junior_practitioner',
        'Early-career general manager supporting a business unit with team coordination and operational accountability.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior general manager — not Junior Business Manager without cross-functional unit remit.',
        }
      ),
      r(
        'Assistant General Manager',
        'junior_practitioner',
        'Assists general managers with unit planning, supplier relations and departmental performance monitoring.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant general manager — not Assistant Operational Manager with process-delivery-only accountability.',
        }
      ),
      r(
        'General Manager (Business Unit)',
        'practitioner',
        'Manages a business unit with accountability for people, budget, customer outcomes and cross-functional delivery.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner general manager — not Business Manager (functional coordination) or Product Manager titles.',
        }
      ),
      r(
        'Unit General Manager',
        'practitioner',
        'Owns P&L-aware management of a defined organisational unit including staffing and strategic execution.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Unit general manager — not Small Business Manager (SME context) or Franchise Manager titles.',
        }
      ),
      r(
        'Experienced General Manager',
        'experienced_manager',
        'Experienced general manager leading complex units with multi-team accountability and sustained performance targets.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced general manager — experience-led seniority; degree/MBA not automatic requirements.',
        }
      ),
      r(
        'Area General Manager',
        'experienced_manager',
        'Manages multiple units or a regional area with aggregated performance, staffing and commercial accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Area general manager — not Regional International Business Manager (cross-border trade focus).',
        }
      ),
      r(
        'Senior General Manager',
        'senior_manager_specialist',
        'Senior general manager overseeing large units or multiple areas with executive stakeholder engagement.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior general manager — not Senior Operational Manager (process/efficiency specialist focus) alone.',
        }
      ),
      r(
        'Head of General Management',
        'head_programme_leadership',
        'Heads general management capability, leadership standards and unit management development programmes.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of general management — not Head of Executive Management or Head of Strategic Management.',
        }
      ),
      r(
        'Director of General Management',
        'director_executive',
        'Director-level leadership of business unit portfolios, management investment and enterprise operating model.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director general management — MBA may be desirable on some roles but not universal; not CEO title in Executive Management.',
        }
      ),
      r(
        'Lecturer in General Management',
        'academic_research',
        'Teaches and researches general management practice, unit leadership and managerial decision-making.',
        {
          priority: 140,
          eligibilityNote:
            'Academic general management track — PhD typically required; not CMI Chartered Manager practitioner route alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 10) Operational Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'operational-management',
    label: 'Operational Management',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Leadership', 'Lean Competency System'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('operational-management'),
    roles: [
      r(
        'Operational Management Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting operational planning, workflow tracking and service delivery coordination.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Operational management apprenticeship — not Manufacturing engineering or IT operations apprenticeships.',
        }
      ),
      r(
        'Trainee Operational Manager',
        'foundation_business_support',
        'Trainee building skills in capacity planning support, shift coordination and operational reporting.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Trainee operational manager — not Business Operations coordinator trainee with analytics-only remit.',
        }
      ),
      r(
        'Operational Management Graduate',
        'graduate_entry',
        'Graduate entry supporting operational performance analysis, process documentation and delivery coordination.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate operational management — not Business Operations graduate with shared-services analytics focus alone.',
        }
      ),
      r(
        'Graduate Operational Management Trainee',
        'graduate_entry',
        'Graduate trainee learning operational leadership, service level management and continuous improvement basics.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate operational management trainee — not Process Improvement Lean graduate schemes alone.',
        }
      ),
      r(
        'Junior Operational Manager',
        'junior_practitioner',
        'Early-career operational manager coordinating daily delivery, team rotas and operational issue resolution.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior operational manager — not Junior Business Operations Coordinator without line-management remit.',
        }
      ),
      r(
        'Assistant Operational Manager',
        'junior_practitioner',
        'Assists operational managers with capacity planning, vendor coordination and performance dashboard support.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant operational manager — not Assistant General Manager with full business unit P&L accountability.',
        }
      ),
      r(
        'Operational Manager',
        'practitioner',
        'Manages operational delivery teams, service levels and day-to-day performance against operational targets.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner operational manager — not Business Operations Manager (functional analytics/coordination focus).',
        }
      ),
      r(
        'Operations Delivery Manager',
        'practitioner',
        'Owns end-to-end operational delivery for a service or product line with throughput and quality accountability.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Operations delivery manager — not Project Delivery Manager (APM project lifecycle) or Programme Manager titles.',
        }
      ),
      r(
        'Experienced Operational Manager',
        'experienced_manager',
        'Experienced manager leading complex operational areas with budget, staffing and continuous improvement accountability.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced operational manager — experience-led; not Experienced Business Manager without operational delivery remit.',
        }
      ),
      r(
        'Operational Excellence Manager',
        'experienced_manager',
        'Manages operational excellence initiatives including KPI governance, standard work and performance improvement.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Operational excellence manager — not Continuous Improvement Manager (Lean/Six Sigma specialist) alone.',
        }
      ),
      r(
        'Senior Operational Manager',
        'senior_manager_specialist',
        'Senior manager overseeing multi-team operational portfolios, crisis response and strategic operational planning.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior operational manager — not Senior Business Operations Manager in enterprise analytics/coordination contexts.',
        }
      ),
      r(
        'Head of Operational Management',
        'head_programme_leadership',
        'Heads operational management standards, leadership development and enterprise operational performance.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of operational management — not Head of Business Operations or Head of Service Management (ITSM).',
        }
      ),
      r(
        'Director of Operational Management',
        'director_executive',
        'Director-level leadership of operational strategy, investment in delivery capability and enterprise performance.',
        {
          priority: 130,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director operational management — MBA desirable on some postings; not COO title in Executive Management specialism.',
        }
      ),
      r(
        'Lecturer in Operational Management',
        'academic_research',
        'Teaches and researches operational management, service operations and performance systems in organisations.',
        {
          priority: 140,
          eligibilityNote:
            'Academic operational management track — PhD typically required; not Operations Management Research specialism overlap without teaching remit.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 11) Strategic Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'strategic-management',
    label: 'Strategic Management',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Strategic Management Society', 'Institute of Consulting'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('strategic-management'),
    roles: [
      r(
        'Strategic Management Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting strategy research, market data collection and planning document preparation.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Strategic management apprenticeship — not Business Administration or Marketing apprenticeships alone.',
        }
      ),
      r(
        'Trainee Strategy Analyst (Management)',
        'foundation_business_support',
        'Trainee analyst learning competitive research, scenario support and strategic planning documentation.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Strategy analyst trainee — not Business Analyst (requirements/change) or Financial Analyst roles.',
        }
      ),
      r(
        'Strategic Management Graduate',
        'graduate_entry',
        'Graduate entry supporting strategic planning cycles, market analysis and executive briefing preparation.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate strategic management — not Strategy Consulting graduate analyst in advisory firm contexts alone.',
        }
      ),
      r(
        'Graduate Strategic Management Trainee',
        'graduate_entry',
        'Graduate trainee building skills in corporate planning, portfolio assessment and strategic initiative coordination.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate strategic management trainee — not Business Development graduate with sales pipeline focus.',
        }
      ),
      r(
        'Junior Strategy Manager',
        'junior_practitioner',
        'Early-career strategy manager supporting planning workstreams, stakeholder workshops and initiative tracking.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior strategy manager — not Junior Change Manager (transformation delivery) or Junior Project Manager.',
        }
      ),
      r(
        'Assistant Strategy Manager',
        'junior_practitioner',
        'Assists strategy managers with research synthesis, board paper support and strategic KPI monitoring.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant strategy manager — not Assistant Business Development Manager with commercial growth remit.',
        }
      ),
      r(
        'Strategy Manager',
        'practitioner',
        'Owns strategic planning workstreams, competitive analysis and alignment of initiatives to organisational goals.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner strategy manager — not Strategic Management consultant in external advisory firm titles alone.',
        }
      ),
      r(
        'Strategic Planning Manager',
        'practitioner',
        'Manages corporate planning cycles, long-range forecasts and strategic portfolio prioritisation processes.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Strategic planning manager — not Programme Manager (APM delivery) or Portfolio Manager governance-only titles.',
        }
      ),
      r(
        'Experienced Strategy Manager',
        'experienced_manager',
        'Experienced manager leading major strategic initiatives, cross-functional alignment and executive decision support.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced strategy manager — experience-led; MBA not automatic seniority requirement.',
        }
      ),
      r(
        'Corporate Strategy Manager',
        'experienced_manager',
        'Manages corporate-level strategy development including M&A support, market positioning and growth options analysis.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Corporate strategy manager — not Business Development Manager (partnership/revenue growth) or CFO roles.',
        }
      ),
      r(
        'Senior Strategy Manager',
        'senior_manager_specialist',
        'Senior manager advising executive teams on strategic choices, transformation alignment and competitive response.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior strategy manager — not Senior Change Manager (transformation delivery leadership) alone.',
        }
      ),
      r(
        'Head of Strategic Management',
        'head_programme_leadership',
        'Heads strategic management function, planning standards and enterprise strategy governance.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of strategic management — not Head of Strategy Consulting or Head of Business Development.',
        }
      ),
      r(
        'Director of Strategic Management',
        'director_executive',
        'Director-level leadership of corporate strategy, major investment decisions and long-range enterprise direction.',
        {
          priority: 130,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Director strategic management — MBA may be desirable; not Chief Strategy Officer title in Executive Management alone.',
        }
      ),
      r(
        'Lecturer in Strategic Management',
        'academic_research',
        'Teaches and researches strategic management, competitive strategy and organisational strategy processes.',
        {
          priority: 140,
          eligibilityNote:
            'Academic strategic management track — PhD typically required; not Strategy Research specialism without teaching remit.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 12) Change Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'change-management',
    label: 'Change Management',
    professionalBody: 'CMI / APM Change Management',
    relatedBodies: ['CMI', 'APM', 'Institute of Leadership'],
    sources: [...CMI_SOURCES, 'apm_change_management'],
    siblingSlugs: siblings('change-management'),
    roles: [
      r(
        'Change Management Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting change communications, training logistics and transformation programme administration.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Change management apprenticeship — not Project Management apprentice or IT change/release apprenticeships alone.',
        }
      ),
      r(
        'Trainee Change Coordinator',
        'foundation_business_support',
        'Trainee coordinator supporting change impact assessments, stakeholder lists and adoption activity scheduling.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Change coordinator trainee — not Business Administration office-only or PMO coordinator roles.',
        }
      ),
      r(
        'Change Management Graduate',
        'graduate_entry',
        'Graduate entry supporting transformation programmes, change impact analysis and communications planning.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate change management — not Business Analysis graduate (requirements/process) or Agile Delivery graduate.',
        }
      ),
      r(
        'Graduate Change Management Trainee',
        'graduate_entry',
        'Graduate trainee learning change methodology, stakeholder engagement and adoption measurement techniques.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate change trainee — not Organisational Development graduate with culture/capability focus alone.',
        }
      ),
      r(
        'Junior Change Manager',
        'junior_practitioner',
        'Early-career change manager supporting transformation workstreams, training delivery and resistance management.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior change manager — not Junior Project Manager (APM delivery lifecycle) or Junior Strategy Manager.',
        }
      ),
      r(
        'Assistant Change Manager',
        'junior_practitioner',
        'Assists change managers with communications materials, readiness assessments and adoption tracking.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant change manager — not Assistant Business Transformation Manager with operating-model design remit alone.',
        }
      ),
      r(
        'Change Manager',
        'practitioner',
        'Owns change plans, stakeholder engagement and adoption outcomes for defined transformation initiatives.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner change manager — not Organisational Development Practitioner (culture/capability interventions).',
        }
      ),
      r(
        'Change Delivery Manager',
        'practitioner',
        'Manages change delivery activities including training, communications and benefits realisation support.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Change delivery manager — not Implementation Manager (systems/process go-live) or Programme Manager titles.',
        }
      ),
      r(
        'Experienced Change Manager',
        'experienced_manager',
        'Experienced manager leading complex transformations with multi-workstream adoption and executive sponsorship.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced change manager — experience-led; not Experienced Strategy Manager (planning focus) alone.',
        }
      ),
      r(
        'Change Programme Manager',
        'experienced_manager',
        'Manages integrated change programmes aligning people, process and technology adoption across the organisation.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Change programme manager — not APM Programme Manager without explicit change/adoption accountability.',
        }
      ),
      r(
        'Senior Change Manager',
        'senior_manager_specialist',
        'Senior manager leading enterprise transformations, change governance and senior stakeholder alignment.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior change manager — not Senior Organisational Development Manager (culture/capability focus) alone.',
        }
      ),
      r(
        'Head of Change Management',
        'head_programme_leadership',
        'Heads change management capability, methodology standards and enterprise transformation adoption.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of change management — not Head of Business Transformation or Head of Organisational Development.',
        }
      ),
      r(
        'Director of Change Management',
        'director_executive',
        'Director-level leadership of enterprise change strategy, transformation investment and adoption at scale.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director change management — MBA not universally required; not CIO or CTO technology transformation titles alone.',
        }
      ),
      r(
        'Independent Change Management Consultant',
        'consultant_independent',
        'Self-employed consultant designing and delivering change approaches for organisational transformations.',
        {
          priority: 140,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent change consultant — not Management Consulting partner or Agile coach independent titles alone.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 13) Organisational Development — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'organisational-development',
    label: 'Organisational Development',
    professionalBody: 'CIPD (OD context) / CMI',
    relatedBodies: ['CIPD', 'CMI', 'Institute of Leadership', 'OD Network'],
    sources: CMI_SOURCES,
    siblingSlugs: siblings('organisational-development'),
    roles: [
      r(
        'Organisational Development Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting OD programme logistics, survey administration and learning event coordination.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'OD apprenticeship — not HR Administrator apprenticeship or Learning & Development apprentice routes alone.',
        }
      ),
      r(
        'Trainee OD Coordinator',
        'foundation_business_support',
        'Trainee coordinator supporting culture assessments, workshop scheduling and OD initiative tracking.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'OD coordinator trainee — not Change Management coordinator with transformation communications focus alone.',
        }
      ),
      r(
        'Organisational Development Graduate',
        'graduate_entry',
        'Graduate entry supporting OD diagnostics, capability frameworks and leadership development programme design.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate OD entry — not HR Business Partner graduate or CIPD HR generalist graduate schemes.',
        }
      ),
      r(
        'Graduate OD Trainee',
        'graduate_entry',
        'Graduate trainee learning OD interventions, team effectiveness methods and culture change techniques.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate OD trainee — not Leadership and People Management graduate with line-management focus alone.',
        }
      ),
      r(
        'Junior OD Practitioner',
        'junior_practitioner',
        'Early-career OD practitioner facilitating team sessions, culture surveys and capability assessment support.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior OD practitioner — not Junior Change Manager (transformation adoption) or Junior HR Advisor roles.',
        }
      ),
      r(
        'Assistant OD Manager',
        'junior_practitioner',
        'Assists OD managers with intervention design, stakeholder interviews and programme evaluation support.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant OD manager — not Assistant People Manager (line leadership) in Leadership specialism.',
        }
      ),
      r(
        'Organisational Development Practitioner',
        'practitioner',
        'Delivers OD interventions including team effectiveness, culture workshops and leadership capability programmes.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner OD — not Change Manager (transformation delivery) or HR Business Partner specialist roles.',
        }
      ),
      r(
        'Organisational Development Advisor',
        'practitioner',
        'Advises leaders on OD approaches, diagnostic tools and sustainable culture and capability improvements.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'OD advisor — explicitly not HR Business Partner; focuses on organisation-wide effectiveness not employee relations.',
        }
      ),
      r(
        'Organisational Development Manager',
        'experienced_manager',
        'Manages OD programmes, leadership development portfolios and culture change initiatives across the organisation.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'OD manager — not Change Programme Manager (transformation adoption) or L&D Manager (training catalogue) alone.',
        }
      ),
      r(
        'Senior OD Manager',
        'senior_manager_specialist',
        'Senior manager leading enterprise OD strategy, executive team interventions and complex culture transformations.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior OD manager — not Senior Change Manager or Head of HR People Partnering functions.',
        }
      ),
      r(
        'Head of Organisational Development',
        'head_programme_leadership',
        'Heads OD function, intervention standards and enterprise capability and culture development.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of OD — not Head of Change Management or Head of HR (employee relations/resourcing) functions.',
        }
      ),
      r(
        'Director of Organisational Development',
        'director_executive',
        'Director-level leadership of OD strategy, leadership investment and enterprise culture transformation.',
        {
          priority: 120,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director OD — MBA not universally required; not HR Director or Chief People Officer titles.',
        }
      ),
      r(
        'Independent OD Consultant',
        'consultant_independent',
        'Self-employed consultant delivering OD diagnostics, team interventions and culture change advisory.',
        {
          priority: 130,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent OD consultant — not Executive Coach independent titles or Management Consulting partner alone.',
        }
      ),
      r(
        'Lecturer in Organisational Development',
        'academic_research',
        'Teaches and researches organisational development, culture change and workplace effectiveness.',
        {
          priority: 140,
          eligibilityNote:
            'Academic OD track — PhD typically required; not Organisational Behaviour Research specialism without teaching remit.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 14) Leadership and People Management — 14 roles
  // -------------------------------------------------------------------------
  {
    slug: 'leadership-and-people-management',
    label: 'Leadership and People Management',
    professionalBody: 'Institute of Leadership / CMI',
    relatedBodies: ['Institute of Leadership', 'CMI', 'IoD'],
    sources: [...CMI_SOURCES, 'institute_of_leadership_careers'],
    siblingSlugs: siblings('leadership-and-people-management'),
    roles: [
      r(
        'Leadership and Management Apprentice',
        'foundation_business_support',
        'Apprenticeship developing team supervision basics, workplace coordination and first-line leadership support.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Leadership apprenticeship — not HR Administrator apprenticeship or CIPD HR specialist trainee routes.',
        }
      ),
      r(
        'Trainee Team Leader (Business)',
        'foundation_business_support',
        'Trainee team leader learning shift supervision, performance monitoring and day-to-day people coordination.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Trainee team leader — not Customer Operations team leader in contact-centre-only contexts alone.',
        }
      ),
      r(
        'Leadership Graduate Trainee',
        'graduate_entry',
        'Graduate entry building first-line leadership skills through supervised team management and coaching support.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate leadership trainee — not HR graduate scheme or Organisational Development graduate programmes.',
        }
      ),
      r(
        'Graduate People Leadership Trainee',
        'graduate_entry',
        'Graduate trainee developing line management capability, team performance and people leadership foundations.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate people leadership — not Leadership and People Management overlap with CIPD HR generalist routes.',
        }
      ),
      r(
        'Junior Team Leader',
        'junior_practitioner',
        'Early-career team leader supervising a small team with accountability for tasks, quality and basic coaching.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior team leader — not Junior Project Manager (APM delivery) or Junior Change Manager roles.',
        }
      ),
      r(
        'Assistant People Manager (Line Management)',
        'junior_practitioner',
        'Assists line managers with team scheduling, performance conversations and operational people coordination.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant people manager (line) — not HR Advisor or HR Business Partner specialist people functions.',
        }
      ),
      r(
        'Team Leader (Business)',
        'practitioner',
        'Leads a business team with accountability for delivery, coaching and day-to-day people management.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner team leader — not Organisational Development Practitioner (culture interventions) roles.',
        }
      ),
      r(
        'Line Manager (Business)',
        'practitioner',
        'Manages direct reports with accountability for performance, development conversations and team outcomes.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Line manager — explicitly business leadership track; not HR line partner or employee relations specialist.',
        }
      ),
      r(
        'Experienced People Manager',
        'experienced_manager',
        'Experienced line manager leading larger teams with hiring, performance management and budget accountability.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Experienced people manager — experience-led; not Experienced General Manager with full unit P&L remit alone.',
        }
      ),
      r(
        'Department Manager (People Leadership)',
        'experienced_manager',
        'Manages a department with people leadership accountability, cross-team coordination and operational targets.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Department manager (people leadership) — not Department Manager in HR/resourcing functions.',
        }
      ),
      r(
        'Senior People Manager (Line Leadership)',
        'senior_manager_specialist',
        'Senior line leader managing multiple teams or a large department with strategic people leadership remit.',
        {
          priority: 110,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior people manager (line) — not Senior OD Manager or Head of HR People Partnering titles.',
        }
      ),
      r(
        'Head of People Leadership',
        'head_programme_leadership',
        'Heads people leadership standards, management development and line leadership capability programmes.',
        {
          priority: 120,
          academicRequirement: 'none',
          eligibilityNote:
            'Head of people leadership — not Head of HR, Head of L&D or Head of Organisational Development.',
        }
      ),
      r(
        'Director of People Leadership (Line Management)',
        'director_executive',
        'Director-level leadership of management culture, line leadership investment and people management standards.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'Director people leadership — not HR Director, Chief People Officer or HR Business Partner leadership titles.',
        }
      ),
      r(
        'Lecturer in Leadership and People Management',
        'academic_research',
        'Teaches and researches leadership, people management and managerial behaviour in organisations.',
        {
          priority: 140,
          eligibilityNote:
            'Academic leadership track — PhD typically required; not Institute of Leadership practitioner membership alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // 15) Executive Management — 15 roles
  // -------------------------------------------------------------------------
  {
    slug: 'executive-management',
    label: 'Executive Management',
    professionalBody: 'Chartered Management Institute (CMI)',
    relatedBodies: ['CMI', 'Institute of Leadership', 'IoD'],
    sources: [...CMI_SOURCES, 'iod_director_roles'],
    siblingSlugs: siblings('executive-management'),
    roles: [
      r(
        'Business Leadership Apprentice',
        'foundation_business_support',
        'Apprenticeship supporting executive offices, board meeting logistics and senior leadership programme administration.',
        {
          priority: 10,
          academicRequirement: 'none',
          eligibilityNote:
            'Business leadership apprenticeship — not Executive Support PA apprenticeship or Legal executive assistant routes.',
        }
      ),
      r(
        'Trainee Executive Development Coordinator',
        'foundation_business_support',
        'Trainee coordinator supporting executive development programmes, leadership events and senior stakeholder scheduling.',
        {
          priority: 20,
          academicRequirement: 'none',
          eligibilityNote:
            'Executive development trainee — not Executive PA or Office Manager with facilities-only remit.',
        }
      ),
      r(
        'Executive Management Graduate',
        'graduate_entry',
        'Graduate entry supporting executive programmes, board reporting and senior leadership initiative coordination.',
        {
          priority: 30,
          eligibilityNote:
            'Graduate executive management — not Management Consulting graduate analyst or Finance graduate trainee routes.',
        }
      ),
      r(
        'Graduate Executive Trainee',
        'graduate_entry',
        'Graduate trainee on leadership pathways building exposure to executive decision-making and enterprise governance.',
        {
          priority: 40,
          eligibilityNote:
            'Graduate executive trainee — not General Management graduate with unit management rather than board-track exposure.',
        }
      ),
      r(
        'Junior Executive Manager',
        'junior_practitioner',
        'Early-career executive manager supporting senior leadership teams, strategic initiatives and governance activities.',
        {
          priority: 50,
          academicRequirement: 'none',
          eligibilityNote:
            'Junior executive manager — not Junior General Manager with operational unit P&L rather than executive support remit.',
        }
      ),
      r(
        'Assistant Executive Manager',
        'junior_practitioner',
        'Assists executive managers with board papers, stakeholder engagement and leadership programme delivery.',
        {
          priority: 60,
          academicRequirement: 'none',
          eligibilityNote:
            'Assistant executive manager — not Executive Assistant (PA) or Company Secretary statutory governance roles.',
        }
      ),
      r(
        'Executive Manager',
        'practitioner',
        'Manages executive office functions, leadership programmes and senior stakeholder coordination for the C-suite.',
        {
          priority: 70,
          academicRequirement: 'none',
          eligibilityNote:
            'Practitioner executive manager — not General Manager (business unit) or Strategy Manager planning roles.',
        }
      ),
      r(
        'Divisional Executive Manager',
        'practitioner',
        'Manages divisional executive priorities, leadership alignment and cross-functional executive initiative delivery.',
        {
          priority: 80,
          academicRequirement: 'none',
          eligibilityNote:
            'Divisional executive manager — not Divisional General Manager with full operational P&L without executive remit.',
        }
      ),
      r(
        'Senior Executive Manager',
        'experienced_manager',
        'Senior manager supporting executive leadership with complex governance, transformation and enterprise programmes.',
        {
          priority: 90,
          academicRequirement: 'none',
          eligibilityNote:
            'Senior executive manager — experience-led; not Senior General Manager in unit management contexts alone.',
        }
      ),
      r(
        'Executive Programme Director',
        'senior_manager_specialist',
        'Directs enterprise-wide executive programmes with board visibility, major investment and leadership accountability.',
        {
          priority: 100,
          academicRequirement: 'none',
          eligibilityNote:
            'Executive programme director — not APM Programme Director without C-suite/enterprise executive remit.',
        }
      ),
      r(
        'Chief Operating Officer (Business)',
        'director_executive',
        'Executive accountable for enterprise operations, delivery performance and organisational execution at board level.',
        {
          priority: 110,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'COO executive role — MBA may be desirable; extensive leadership experience primary; not CFO or CTO titles.',
        }
      ),
      r(
        'Managing Director (SME)',
        'director_executive',
        'Managing director of an SME with full executive accountability for strategy, operations and commercial outcomes.',
        {
          priority: 120,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'MD (SME) — not Self-employed Small Business Owner without formal MD title or corporate board remit.',
        }
      ),
      r(
        'Chief Executive Officer (SME)',
        'director_executive',
        'CEO of a small or medium enterprise with ultimate accountability for vision, performance and stakeholder trust.',
        {
          priority: 130,
          academicRequirement: 'degree_relevant',
          eligibilityNote:
            'CEO (SME) — MBA not universally required; not Start-up Founder in pre-scale venture context alone.',
        }
      ),
      r(
        'Independent Executive Advisor',
        'consultant_independent',
        'Self-employed advisor supporting boards and executives on leadership, governance and enterprise decision-making.',
        {
          priority: 140,
          academicRequirement: 'none',
          eligibilityNote:
            'Independent executive advisor — not Non-Executive Director statutory appointment or Management Consulting partner alone.',
        }
      ),
      r(
        'Professor of Executive Management',
        'academic_research',
        'Senior academic researching and teaching executive leadership, board governance and enterprise strategy.',
        {
          priority: 150,
          eligibilityNote:
            'Professor executive management track — PhD and professorial appointment typically required; not CMI Fellow alone.',
          isAcademicRole: true,
        }
      ),
    ],
  },
]
