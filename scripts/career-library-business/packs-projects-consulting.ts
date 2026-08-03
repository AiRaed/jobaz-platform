import { r, type SpecialismPack } from './shared'

const PROJECTS_CONSULTING_SIBLINGS = [
  'project-management',
  'programme-management',
  'portfolio-management',
  'pmo',
  'agile-delivery',
  'business-transformation',
  'implementation-management',
  'business-analysis',
  'management-consulting',
  'strategy-consulting',
  'process-improvement',
  'continuous-improvement',
  'service-improvement',
  'business-process-management',
]

function siblings(except: string) {
  return PROJECTS_CONSULTING_SIBLINGS.filter((s) => s !== except)
}

const APM_SOURCES = [
  'apm_careers',
  'prospects_project_manager',
  'national_careers_service_project_manager',
  'prince2_context_apm',
]

const BA_SOURCES = [
  'bcs_business_analysis',
  'iiba_uk_careers',
  'prospects_business_analyst',
  'national_careers_service_business_analyst',
]

const CONSULTING_SOURCES = [
  'institute_of_consulting_careers',
  'mca_consulting_careers',
  'prospects_management_consultant',
  'national_careers_service_management_consultant',
]

const IMPROVEMENT_SOURCES = [
  'lean_competency_system',
  'cqi_careers',
  'prospects_business_improvement',
  'abpmp_careers',
]

const PROJECT_MANAGEMENT: SpecialismPack = {
  slug: 'project-management',
  label: 'Project Management',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'PRINCE2 (desirable)', 'Agile Business Consortium'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('project-management'),
  roles: [
    r(
      'Project Management Apprentice',
      'foundation_business_support',
      'Apprenticeship route into project coordination, documentation and delivery support under qualified project managers.',
      {
        priority: 10,
        eligibilityNote:
          'Project management apprenticeship — not IT Software Development, Engineering or Data apprenticeship routes.',
      }
    ),
    r(
      'Project Coordinator (Entry)',
      'foundation_business_support',
      'Coordinates project schedules, meeting logistics and RAID logs for UK delivery teams under project manager supervision.',
      {
        priority: 20,
        eligibilityNote:
          'Entry project coordination — not Programme Management Office analyst or Business Analyst requirement roles.',
      }
    ),
    r(
      'Graduate Project Manager',
      'graduate_entry',
      'Graduate scheme or first project role supporting planning, stakeholder updates and workstream tracking.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate project management entry — not Graduate Software Developer or Data Analyst roles.',
      }
    ),
    r(
      'Junior Project Manager',
      'junior_practitioner',
      'Manages smaller projects or workstreams with growing ownership of scope, budget tracking and risk reporting.',
      {
        priority: 40,
        eligibilityNote:
          'Junior project manager — experience-led progression; APM membership and PRINCE2 desirable but not required.',
      }
    ),
    r(
      'Assistant Project Manager',
      'junior_practitioner',
      'Supports project managers on planning, procurement coordination and status reporting across UK programmes.',
      {
        priority: 50,
        eligibilityNote:
          'Assistant PM support role — not Assistant Programme Manager on multi-project portfolios.',
      }
    ),
    r(
      'Project Manager',
      'practitioner',
      'Leads end-to-end project delivery to time, cost and quality outcomes in UK public and private sectors.',
      {
        priority: 60,
        eligibilityNote:
          'Core project manager — experience-led; APM qualifications and PRINCE2 desirable, not mandatory for competent delivery.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Project Manager (Infrastructure Delivery)',
      'practitioner',
      'Delivers capital or infrastructure projects including contractors, permits and site coordination accountability.',
      {
        priority: 70,
        eligibilityNote:
          'Infrastructure project management — not Civil Engineering design engineer or Construction Site Manager trade roles.',
      }
    ),
    r(
      'Senior Project Manager',
      'experienced_manager',
      'Leads complex, multi-workstream projects with significant stakeholder, budget and dependency management.',
      {
        priority: 80,
        eligibilityNote:
          'Senior PM — progression by delivery experience; chartered project professional status desirable not required.',
      }
    ),
    r(
      'Lead Project Manager',
      'senior_manager_specialist',
      'Technical and delivery lead across major projects, mentoring PMs and setting delivery standards.',
      {
        priority: 90,
        eligibilityNote:
          'Lead project manager — not Programme Manager coordinating interdependent project portfolios.',
      }
    ),
    r(
      'Principal Project Manager',
      'senior_manager_specialist',
      'Senior specialist accountable for highest-complexity projects, assurance and method governance.',
      {
        priority: 100,
        eligibilityNote:
          'Principal PM specialist — not Portfolio Manager prioritising investment across programmes.',
      }
    ),
    r(
      'Head of Project Management',
      'head_programme_leadership',
      'Leads project management capability, career frameworks and delivery assurance across an organisation.',
      {
        priority: 110,
        eligibilityNote:
          'Head of project management function — not Head of Programme Management or PMO without PM practice remit.',
      }
    ),
    r(
      'Director of Project Management',
      'director_executive',
      'Executive ownership of project delivery standards, resourcing and portfolio-facing project governance.',
      {
        priority: 120,
        eligibilityNote:
          'Director project management — not Director of IT or Engineering without project delivery accountability.',
      }
    ),
    r(
      'Independent Project Management Consultant',
      'consultant_independent',
      'Self-employed or interim project management consultant delivering turnaround, assurance or specialist delivery.',
      {
        priority: 130,
        eligibilityNote:
          'Independent PM consulting — not permanent Programme Director or Portfolio Director executive roles.',
      }
    ),
    r(
      'Lecturer in Project Management (Academic)',
      'academic_research',
      'Teaches and researches project management practice, governance and professional development in UK universities.',
      {
        priority: 140,
        eligibilityNote:
          'Academic project management — not practising NHS Programme Manager or construction site leadership roles.',
      }
    ),
  ],
}

const PROGRAMME_MANAGEMENT: SpecialismPack = {
  slug: 'programme-management',
  label: 'Programme Management',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'MSP (desirable)', 'PRINCE2 (desirable)'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('programme-management'),
  roles: [
    r(
      'Programme Support Officer',
      'foundation_business_support',
      'Administrative and coordination support for programme offices including document control and meeting facilitation.',
      {
        priority: 10,
        eligibilityNote:
          'Programme support entry — not PMO Apprentice or Business Administration-only roles without programme context.',
      }
    ),
    r(
      'Programme Administrator',
      'foundation_business_support',
      'Maintains programme registers, milestone tracking and governance pack preparation for UK transformation programmes.',
      {
        priority: 20,
        eligibilityNote:
          'Programme administration — not Project Coordinator on single-project delivery teams.',
      }
    ),
    r(
      'Graduate Programme Manager',
      'graduate_entry',
      'Graduate entry supporting programme planning, benefits tracking and inter-project dependency management.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate programme management — not Graduate Project Manager on standalone projects only.',
      }
    ),
    r(
      'Junior Programme Manager',
      'junior_practitioner',
      'Manages programme workstreams or smaller programmes under senior programme manager supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Junior programme manager — experience-led; APM programme management credentials desirable not required.',
      }
    ),
    r(
      'Programme Analyst',
      'junior_practitioner',
      'Analyses programme performance, benefits realisation data and dependency maps for steering groups.',
      {
        priority: 50,
        eligibilityNote:
          'Programme analysis — not Business Intelligence Developer or Data Scientist analytics roles.',
      }
    ),
    r(
      'Programme Manager',
      'practitioner',
      'Coordinates related projects to achieve strategic outcomes, benefits and aligned delivery in UK organisations.',
      {
        priority: 60,
        eligibilityNote:
          'Core programme manager — experience-led delivery accountability; MSP/APM desirable, not mandatory.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Programme Manager (Organisational Change)',
      'practitioner',
      'Leads change-heavy programmes integrating people, process and technology workstreams to outcomes.',
      {
        priority: 70,
        eligibilityNote:
          'Change programme management — not Change Manager on single-team adoption without programme scope.',
      }
    ),
    r(
      'Senior Programme Manager',
      'experienced_manager',
      'Accountable for large, multi-project programmes with complex stakeholder and funding arrangements.',
      {
        priority: 80,
        eligibilityNote:
          'Senior programme manager — not Portfolio Manager governing enterprise investment prioritisation.',
      }
    ),
    r(
      'Lead Programme Manager',
      'senior_manager_specialist',
      'Leads programme delivery methods, assurance reviews and mentoring across programme manager community.',
      {
        priority: 90,
        eligibilityNote:
          'Lead programme manager — not Programme Director without hands-on programme delivery remit.',
      }
    ),
    r(
      'Principal Programme Manager',
      'senior_manager_specialist',
      'Senior specialist for highest-risk programmes including turnaround and multi-agency coordination.',
      {
        priority: 100,
        eligibilityNote:
          'Principal programme specialist — not Strategy Consultant advising without programme delivery ownership.',
      }
    ),
    r(
      'Head of Programme Management',
      'head_programme_leadership',
      'Leads programme management practice, career pathways and governance across business units.',
      {
        priority: 110,
        eligibilityNote:
          'Head of programme management — not Head of PMO focused solely on standards and reporting.',
      }
    ),
    r(
      'Director of Programmes',
      'director_executive',
      'Executive leadership of programme portfolio delivery, investment alignment and outcomes accountability.',
      {
        priority: 120,
        eligibilityNote:
          'Director of programmes — not Director of Project Management for single-project delivery function only.',
      }
    ),
    r(
      'Independent Programme Management Consultant',
      'consultant_independent',
      'Interim or self-employed programme manager providing recovery, setup or assurance on UK programmes.',
      {
        priority: 130,
        eligibilityNote:
          'Independent programme consulting — not permanent Portfolio Director executive appointment.',
      }
    ),
    r(
      'Research Fellow (Programme Management Studies)',
      'academic_research',
      'Conducts applied research on programme governance, benefits management and delivery performance in UK academia.',
      {
        priority: 140,
        eligibilityNote:
          'Academic programme management research — not practising Senior Programme Manager in consultancy firms.',
      }
    ),
  ],
}

const PORTFOLIO_MANAGEMENT: SpecialismPack = {
  slug: 'portfolio-management',
  label: 'Portfolio Management',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'MoP (desirable)', 'Institute of Risk Management'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('portfolio-management'),
  roles: [
    r(
      'Portfolio Support Analyst',
      'foundation_business_support',
      'Supports portfolio reporting, investment data collation and dashboard preparation for portfolio offices.',
      {
        priority: 10,
        eligibilityNote:
          'Portfolio support entry — not PMO Analyst without portfolio prioritisation context.',
      }
    ),
    r(
      'Portfolio Coordinator',
      'foundation_business_support',
      'Coordinates portfolio governance meetings, documentation and action tracking across UK organisations.',
      {
        priority: 20,
        eligibilityNote:
          'Portfolio coordination — not Project Coordinator on individual project teams.',
      }
    ),
    r(
      'Graduate Portfolio Analyst',
      'graduate_entry',
      'Graduate role analysing portfolio performance, resource demand and strategic alignment metrics.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate portfolio analysis — not Graduate Data Scientist or Software Engineer analytics roles.',
      }
    ),
    r(
      'Junior Portfolio Manager',
      'junior_practitioner',
      'Supports portfolio prioritisation, pipeline management and benefits tracking under senior portfolio leadership.',
      {
        priority: 40,
        eligibilityNote:
          'Junior portfolio manager — not Junior Programme Manager on single-programme delivery.',
      }
    ),
    r(
      'Portfolio Analyst',
      'junior_practitioner',
      'Produces portfolio insights, scenario analysis and investment recommendations for decision forums.',
      {
        priority: 50,
        eligibilityNote:
          'Portfolio analyst — not Business Analyst eliciting operational requirements for single systems.',
      }
    ),
    r(
      'Portfolio Manager',
      'practitioner',
      'Governs prioritisation, funding and performance of project and programme portfolios to strategic objectives.',
      {
        priority: 60,
        eligibilityNote:
          'Core portfolio manager — experience-led; MoP/APM portfolio credentials desirable not required.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Portfolio Manager (Strategic Investments)',
      'practitioner',
      'Manages investment portfolios balancing risk, capacity and strategic value across UK enterprise change.',
      {
        priority: 70,
        eligibilityNote:
          'Strategic investments portfolio — not Financial Portfolio Manager in investment banking/asset management.',
      }
    ),
    r(
      'Senior Portfolio Manager',
      'experienced_manager',
      'Leads enterprise portfolio governance, capacity planning and executive reporting on delivery outcomes.',
      {
        priority: 80,
        eligibilityNote:
          'Senior portfolio manager — not Programme Manager accountable for one programme’s delivery only.',
      }
    ),
    r(
      'Lead Portfolio Manager',
      'senior_manager_specialist',
      'Sets portfolio management methods, tooling standards and mentoring for portfolio practitioners.',
      {
        priority: 90,
        eligibilityNote:
          'Lead portfolio manager — not Enterprise Architect without portfolio investment governance remit.',
      }
    ),
    r(
      'Head of Portfolio Management',
      'head_programme_leadership',
      'Leads portfolio office, investment governance and alignment with corporate strategy.',
      {
        priority: 100,
        eligibilityNote:
          'Head of portfolio management — not Head of Programme Management for delivery execution only.',
      }
    ),
    r(
      'Director of Portfolio Management',
      'director_executive',
      'Executive accountability for portfolio investment decisions, value realisation and delivery assurance.',
      {
        priority: 110,
        eligibilityNote:
          'Director portfolio management — not CFO or Finance Director without portfolio delivery governance scope.',
      }
    ),
    r(
      'Independent Portfolio Advisory Consultant',
      'consultant_independent',
      'Interim portfolio advisor helping organisations establish prioritisation, governance and recovery approaches.',
      {
        priority: 120,
        eligibilityNote:
          'Independent portfolio advisory — not permanent Director of Programmes executive role.',
      }
    ),
    r(
      'Postdoctoral Researcher (Portfolio Governance)',
      'academic_research',
      'Research on portfolio decision-making, governance models and public-sector investment performance.',
      {
        priority: 130,
        eligibilityNote:
          'Academic portfolio governance research — not practising Portfolio Manager in corporate PMO.',
      }
    ),
  ],
}

const PMO: SpecialismPack = {
  slug: 'pmo',
  label: 'PMO',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'P3O (desirable)', 'Agile Business Consortium'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('pmo'),
  roles: [
    r(
      'PMO Apprentice',
      'foundation_business_support',
      'Apprenticeship into project/programme office support including reporting, templates and governance administration.',
      {
        priority: 10,
        eligibilityNote:
          'PMO apprenticeship — not IT Service Desk or Software Testing apprenticeship routes.',
      }
    ),
    r(
      'PMO Administrator',
      'foundation_business_support',
      'Administers PMO tools, document libraries and meeting schedules for UK delivery organisations.',
      {
        priority: 20,
        eligibilityNote:
          'PMO administration — not general Office Manager without project office context.',
      }
    ),
    r(
      'Graduate PMO Analyst',
      'graduate_entry',
      'Graduate analyst producing status reports, RAID logs and resource tracking for programme offices.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate PMO analyst — not Graduate Business Analyst on requirements discovery workstreams.',
      }
    ),
    r(
      'Junior PMO Analyst',
      'junior_practitioner',
      'Supports assurance, reporting and methodology compliance for project and programme offices.',
      {
        priority: 40,
        eligibilityNote:
          'Junior PMO analyst — not Junior Project Manager with direct project delivery accountability.',
      }
    ),
    r(
      'PMO Analyst',
      'practitioner',
      'Owns PMO reporting cycles, data quality and insight packs for portfolio and programme governance.',
      {
        priority: 50,
        eligibilityNote:
          'PMO analyst practitioner — not Data Analyst building ML models or software engineering pipelines.',
      }
    ),
    r(
      'PMO Coordinator',
      'practitioner',
      'Coordinates PMO services including onboarding projects, template maintenance and training support.',
      {
        priority: 60,
        eligibilityNote:
          'PMO coordination — not Programme Coordinator on benefits realisation without PMO standards remit.',
      }
    ),
    r(
      'Senior PMO Analyst',
      'experienced_manager',
      'Leads PMO reporting standards, tool configuration and quality assurance across delivery units.',
      {
        priority: 70,
        eligibilityNote:
          'Senior PMO analyst — not Senior Project Manager accountable for end-to-end project delivery.',
      }
    ),
    r(
      'PMO Manager',
      'experienced_manager',
      'Manages PMO team services, stakeholder engagement and continuous improvement of delivery support.',
      {
        priority: 80,
        eligibilityNote:
          'PMO manager — experience-led; P3O/APM PMO credentials desirable not required.',
      }
    ),
    r(
      'PMO Assurance Manager',
      'senior_manager_specialist',
      'Leads gateway reviews, health checks and compliance with organisational project delivery standards.',
      {
        priority: 90,
        eligibilityNote:
          'PMO assurance specialist — not Internal Audit Manager in statutory financial audit contexts.',
      }
    ),
    r(
      'PMO Lead (Enterprise)',
      'senior_manager_specialist',
      'Senior PMO lead defining enterprise standards, tooling strategy and community of practice.',
      {
        priority: 100,
        eligibilityNote:
          'Enterprise PMO lead — not Enterprise Architect designing technology reference architectures.',
      }
    ),
    r(
      'Head of PMO',
      'head_programme_leadership',
      'Heads project/programme management office, resourcing models and delivery assurance for UK organisations.',
      {
        priority: 110,
        eligibilityNote:
          'Head of PMO — not Head of Project Management without PMO standards and reporting accountability.',
      }
    ),
    r(
      'Director of PMO',
      'director_executive',
      'Executive leadership of PMO function, investment in delivery capability and governance frameworks.',
      {
        priority: 120,
        eligibilityNote:
          'Director of PMO — not Director of IT Operations without project office governance remit.',
      }
    ),
    r(
      'Independent PMO Consultant',
      'consultant_independent',
      'Interim PMO consultant establishing or recovering project offices, methods and reporting for clients.',
      {
        priority: 130,
        eligibilityNote:
          'Independent PMO consulting — not permanent Portfolio Director accountable for investment decisions.',
      }
    ),
  ],
}

const AGILE_DELIVERY: SpecialismPack = {
  slug: 'agile-delivery',
  label: 'Agile Delivery',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['Agile Business Consortium', 'Scrum.org', 'APM Agile PM'],
  sources: [...APM_SOURCES, 'agile_business_consortium_careers'],
  siblingSlugs: siblings('agile-delivery'),
  roles: [
    r(
      'Agile Delivery Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting agile ceremonies, backlog hygiene and team coordination in UK delivery squads.',
      {
        priority: 10,
        eligibilityNote:
          'Agile delivery apprenticeship — not Software Development apprenticeship building production code.',
      }
    ),
    r(
      'Scrum Team Administrator',
      'foundation_business_support',
      'Administrative support for agile teams including sprint scheduling, impediment logging and tooling upkeep.',
      {
        priority: 20,
        eligibilityNote:
          'Scrum team administration — not IT Service Desk or DevOps platform engineering roles.',
      }
    ),
    r(
      'Graduate Agile Delivery Manager',
      'graduate_entry',
      'Graduate entry facilitating agile delivery, reporting and stakeholder liaison on product-oriented programmes.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate agile delivery — not Graduate Software Engineer in product engineering squads.',
      }
    ),
    r(
      'Junior Agile Delivery Lead',
      'junior_practitioner',
      'Supports agile delivery managers on flow metrics, release planning and cross-team coordination.',
      {
        priority: 40,
        eligibilityNote:
          'Junior agile delivery lead — not Junior Scrum Master without broader delivery management context.',
      }
    ),
    r(
      'Junior Scrum Master',
      'junior_practitioner',
      'Facilitates scrum events, removes impediments and supports team improvement under senior agile coaches.',
      {
        priority: 50,
        eligibilityNote:
          'Junior scrum master — agile facilitation role, not Software Engineer or QA Engineer job titles.',
      }
    ),
    r(
      'Agile Delivery Manager',
      'practitioner',
      'Leads agile delivery across squads ensuring predictable outcomes, stakeholder alignment and continuous improvement.',
      {
        priority: 60,
        eligibilityNote:
          'Agile delivery manager — experience-led; agile certifications desirable not mandatory for competent delivery.',
      }
    ),
    r(
      'Scrum Master (Agile Delivery)',
      'practitioner',
      'Owns scrum process health, team coaching and delivery rhythm for UK agile product and change teams.',
      {
        priority: 70,
        eligibilityNote:
          'Scrum master in delivery context — not Engineering Manager accountable for software architecture decisions.',
      }
    ),
    r(
      'Senior Agile Delivery Manager',
      'experienced_manager',
      'Leads multiple agile teams or trains, resolving systemic impediments and scaling delivery practices.',
      {
        priority: 80,
        eligibilityNote:
          'Senior agile delivery — not Programme Manager on waterfall-major programmes without agile remit.',
      }
    ),
    r(
      'Lead Agile Coach',
      'senior_manager_specialist',
      'Coaches organisations on agile ways of working, maturity assessment and leadership behaviour change.',
      {
        priority: 90,
        eligibilityNote:
          'Lead agile coach — not Organisational Development consultant without agile delivery accountability.',
      }
    ),
    r(
      'Head of Agile Delivery',
      'head_programme_leadership',
      'Leads agile delivery function, community of practice and alignment with portfolio governance.',
      {
        priority: 100,
        eligibilityNote:
          'Head of agile delivery — not Head of Engineering for software product development orgs.',
      }
    ),
    r(
      'Director of Agile Transformation',
      'director_executive',
      'Executive ownership of enterprise agile transformation, investment and outcomes across business units.',
      {
        priority: 110,
        eligibilityNote:
          'Director agile transformation — not CTO or VP Engineering without business agile change remit.',
      }
    ),
    r(
      'Independent Agile Delivery Consultant',
      'consultant_independent',
      'Self-employed agile coach or delivery consultant supporting transformations and squad recovery.',
      {
        priority: 120,
        eligibilityNote:
          'Independent agile consulting — not permanent Director of Agile Transformation executive hire.',
      }
    ),
    r(
      'Lecturer in Agile Project Management',
      'academic_research',
      'Teaches agile project management, empirical methods and delivery research in UK business schools.',
      {
        priority: 130,
        eligibilityNote:
          'Academic agile project management — not practising Scrum Master in technology product companies.',
      }
    ),
  ],
}

const BUSINESS_TRANSFORMATION: SpecialismPack = {
  slug: 'business-transformation',
  label: 'Business Transformation',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'CMI', 'Institute of Consulting'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('business-transformation'),
  roles: [
    r(
      'Transformation Support Officer',
      'foundation_business_support',
      'Supports transformation programmes with workshop logistics, communications and change activity tracking.',
      {
        priority: 10,
        eligibilityNote:
          'Transformation support entry — not HR Administrator or IT Support without transformation programme context.',
      }
    ),
    r(
      'Business Change Administrator',
      'foundation_business_support',
      'Administers change registers, stakeholder lists and transformation governance documentation.',
      {
        priority: 20,
        eligibilityNote:
          'Business change administration — not Project Coordinator on non-transformation projects.',
      }
    ),
    r(
      'Graduate Transformation Manager',
      'graduate_entry',
      'Graduate role supporting operating model design, transition planning and benefits tracking on transformations.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate transformation manager — not Graduate Management Consultant without transformation delivery scope.',
      }
    ),
    r(
      'Junior Transformation Manager',
      'junior_practitioner',
      'Manages transformation workstreams such as process redesign or org restructuring under senior leadership.',
      {
        priority: 40,
        eligibilityNote:
          'Junior transformation manager — experience-led; change certifications desirable not required.',
      }
    ),
    r(
      'Transformation Analyst',
      'junior_practitioner',
      'Analyses current-state operations, impact assessments and readiness data for transformation programmes.',
      {
        priority: 50,
        eligibilityNote:
          'Transformation analyst — not Data Scientist or Software Engineer building analytics platforms.',
      }
    ),
    r(
      'Business Transformation Manager',
      'practitioner',
      'Leads business transformation initiatives integrating people, process, technology and governance change.',
      {
        priority: 60,
        eligibilityNote:
          'Core business transformation manager — delivery experience primary; APM/CMI membership desirable not mandatory.',
      }
    ),
    r(
      'Transformation Lead (Operating Model)',
      'practitioner',
      'Leads operating model design and implementation workstreams within large UK transformation programmes.',
      {
        priority: 70,
        eligibilityNote:
          'Operating model transformation lead — not Enterprise Architect without business operating model accountability.',
      }
    ),
    r(
      'Senior Transformation Manager',
      'experienced_manager',
      'Accountable for major transformation tracks with complex stakeholder, union and regulatory considerations.',
      {
        priority: 80,
        eligibilityNote:
          'Senior transformation manager — not Programme Manager without operating model change remit.',
      }
    ),
    r(
      'Principal Transformation Manager',
      'senior_manager_specialist',
      'Senior specialist leading highest-impact transformations including post-merger integration and turnaround.',
      {
        priority: 90,
        eligibilityNote:
          'Principal transformation specialist — not Strategy Consultant advising without transformation delivery ownership.',
      }
    ),
    r(
      'Head of Business Transformation',
      'head_programme_leadership',
      'Leads transformation capability, methods and portfolio of change initiatives across the enterprise.',
      {
        priority: 100,
        eligibilityNote:
          'Head of business transformation — not Head of HR or IT without enterprise transformation accountability.',
      }
    ),
    r(
      'Director of Business Transformation',
      'director_executive',
      'Executive leadership of enterprise transformation strategy, investment and outcomes realisation.',
      {
        priority: 110,
        eligibilityNote:
          'Director business transformation — not Chief Technology Officer without business change remit.',
      }
    ),
    r(
      'Independent Business Transformation Consultant',
      'consultant_independent',
      'Interim transformation consultant delivering diagnostic, design and recovery on UK change programmes.',
      {
        priority: 120,
        eligibilityNote:
          'Independent transformation consulting — not permanent Director of Business Transformation role.',
      }
    ),
    r(
      'Research Fellow (Organisational Transformation)',
      'academic_research',
      'Academic research on organisational transformation, change adoption and programme outcomes in UK universities.',
      {
        priority: 130,
        eligibilityNote:
          'Academic transformation research — not practising Business Transformation Manager in consulting firms.',
      }
    ),
  ],
}

const IMPLEMENTATION_MANAGEMENT: SpecialismPack = {
  slug: 'implementation-management',
  label: 'Implementation Management',
  professionalBody: 'Association for Project Management (APM)',
  relatedBodies: ['APM', 'CMI', 'BCS (business systems context)'],
  sources: APM_SOURCES,
  siblingSlugs: siblings('implementation-management'),
  roles: [
    r(
      'Implementation Support Coordinator',
      'foundation_business_support',
      'Coordinates implementation activities including training schedules, cutover checklists and user communications.',
      {
        priority: 10,
        eligibilityNote:
          'Implementation support entry — not IT Service Desk or Software Support without business rollout context.',
      }
    ),
    r(
      'Implementation Administrator',
      'foundation_business_support',
      'Maintains implementation plans, issue logs and readiness trackers for UK business change rollouts.',
      {
        priority: 20,
        eligibilityNote:
          'Implementation administration — not Project Administrator on non-implementation projects.',
      }
    ),
    r(
      'Graduate Implementation Manager',
      'graduate_entry',
      'Graduate role supporting go-live planning, hypercare coordination and business readiness on implementations.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate implementation manager — not Graduate Software Developer building system code.',
      }
    ),
    r(
      'Junior Implementation Manager',
      'junior_practitioner',
      'Manages implementation workstreams for process or system rollouts under senior implementation leadership.',
      {
        priority: 40,
        eligibilityNote:
          'Junior implementation manager — experience-led; project credentials desirable not required.',
      }
    ),
    r(
      'Implementation Analyst',
      'junior_practitioner',
      'Analyses readiness, dependency and adoption metrics supporting implementation planning and reporting.',
      {
        priority: 50,
        eligibilityNote:
          'Implementation analyst — not Business Intelligence Developer or Data Engineer roles.',
      }
    ),
    r(
      'Implementation Manager',
      'practitioner',
      'Leads end-to-end implementation of business systems, processes or services into operational use.',
      {
        priority: 60,
        eligibilityNote:
          'Core implementation manager — business-led rollout accountability; APM experience desirable not mandatory.',
      }
    ),
    r(
      'Implementation Manager (ERP Rollout)',
      'practitioner',
      'Manages ERP or business system implementations focusing on process adoption, training and cutover governance.',
      {
        priority: 70,
        eligibilityNote:
          'ERP implementation management — not SAP ABAP Developer or Software Engineer technical build roles.',
      }
    ),
    r(
      'Senior Implementation Manager',
      'experienced_manager',
      'Leads complex multi-site implementations with significant change, data migration and vendor coordination.',
      {
        priority: 80,
        eligibilityNote:
          'Senior implementation manager — not Programme Manager without hands-on rollout accountability.',
      }
    ),
    r(
      'Lead Implementation Manager',
      'senior_manager_specialist',
      'Sets implementation methods, playbooks and quality standards across implementation manager community.',
      {
        priority: 90,
        eligibilityNote:
          'Lead implementation manager — not Solutions Architect designing technical integration patterns only.',
      }
    ),
    r(
      'Head of Implementation',
      'head_programme_leadership',
      'Leads implementation practice, resourcing and assurance for business change rollouts organisation-wide.',
      {
        priority: 100,
        eligibilityNote:
          'Head of implementation — not Head of IT without business adoption and rollout accountability.',
      }
    ),
    r(
      'Director of Implementation',
      'director_executive',
      'Executive ownership of implementation portfolio, vendor partnerships and business readiness outcomes.',
      {
        priority: 110,
        eligibilityNote:
          'Director of implementation — not Director of Software Engineering without business rollout remit.',
      }
    ),
    r(
      'Independent Implementation Consultant',
      'consultant_independent',
      'Interim implementation consultant supporting go-live recovery, readiness assessment and rollout planning.',
      {
        priority: 120,
        eligibilityNote:
          'Independent implementation consulting — not permanent Director of Implementation executive role.',
      }
    ),
  ],
}

const BUSINESS_ANALYSIS: SpecialismPack = {
  slug: 'business-analysis',
  label: 'Business Analysis',
  professionalBody: 'BCS, The Chartered Institute for IT (Business Analysis) / IIBA UK',
  relatedBodies: ['BCS', 'IIBA UK', 'Agile Business Consortium'],
  sources: BA_SOURCES,
  siblingSlugs: siblings('business-analysis'),
  roles: [
    r(
      'Business Analysis Apprentice',
      'foundation_business_support',
      'Apprenticeship learning requirements elicitation, process mapping and stakeholder workshop support.',
      {
        priority: 10,
        eligibilityNote:
          'Business analysis apprenticeship — not Software Development or Data Science apprenticeship routes.',
      }
    ),
    r(
      'Business Support Analyst (Entry)',
      'foundation_business_support',
      'Entry analyst supporting documentation, process notes and meeting capture for business change teams.',
      {
        priority: 20,
        eligibilityNote:
          'Entry business support analyst — not IT Service Desk Analyst or Helpdesk roles.',
      }
    ),
    r(
      'Graduate Business Analyst',
      'graduate_entry',
      'Graduate entry eliciting requirements, mapping processes and supporting agile delivery teams in UK organisations.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate business analyst — not Graduate Software Engineer or Graduate Data Analyst primary routes.',
      }
    ),
    r(
      'Junior Business Analyst',
      'junior_practitioner',
      'Develops user stories, acceptance criteria and as-is/to-be process models under senior BA supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Junior business analyst — BCS/IIBA certifications desirable; experience and analytical skills primary.',
      }
    ),
    r(
      'Trainee Business Analyst',
      'junior_practitioner',
      'Structured trainee route building facilitation, modelling and requirements management competencies.',
      {
        priority: 50,
        eligibilityNote:
          'Trainee BA — not Trainee Software Developer or QA Tester on engineering squads.',
      }
    ),
    r(
      'Business Analyst',
      'practitioner',
      'Elicits and validates business requirements, analyses processes and enables change across UK sectors.',
      {
        priority: 60,
        eligibilityNote:
          'Core business analyst — BCS Business Analysis or IIBA credentials desirable not required for competent practice.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Business Analyst (Requirements Engineering)',
      'practitioner',
      'Specialises in requirements traceability, acceptance testing alignment and solution impact assessment.',
      {
        priority: 70,
        eligibilityNote:
          'Requirements engineering BA — not Systems Developer or Software Engineer building applications.',
      }
    ),
    r(
      'Senior Business Analyst',
      'experienced_manager',
      'Leads complex analysis workstreams, stakeholder negotiation and solution option appraisal on programmes.',
      {
        priority: 80,
        eligibilityNote:
          'Senior business analyst — not Senior Data Scientist or Senior Software Developer engineering roles.',
      }
    ),
    r(
      'Lead Business Analyst',
      'senior_manager_specialist',
      'Leads BA community standards, quality reviews and mentoring on large transformation programmes.',
      {
        priority: 90,
        eligibilityNote:
          'Lead business analyst — not Product Owner in pure software product teams without BA practice remit.',
      }
    ),
    r(
      'Head of Business Analysis',
      'head_programme_leadership',
      'Heads business analysis capability, career frameworks and quality assurance across delivery functions.',
      {
        priority: 100,
        eligibilityNote:
          'Head of business analysis — not Head of Data or IT without business analysis practice accountability.',
      }
    ),
    r(
      'Director of Business Analysis',
      'director_executive',
      'Executive leadership of business analysis profession, tooling investment and strategic change enablement.',
      {
        priority: 110,
        eligibilityNote:
          'Director of business analysis — not CTO or Engineering Director without BA function remit.',
      }
    ),
    r(
      'Independent Business Analyst (Consulting)',
      'consultant_independent',
      'Self-employed or interim business analyst delivering discovery, process redesign and requirements on client engagements.',
      {
        priority: 120,
        eligibilityNote:
          'Independent BA consulting — not permanent Head of Business Analysis internal leadership role.',
      }
    ),
    r(
      'Lecturer in Business Analysis',
      'academic_research',
      'Teaches business analysis methods, requirements engineering and digital change in UK universities.',
      {
        priority: 130,
        eligibilityNote:
          'Academic business analysis — not practising Senior Business Analyst on client delivery programmes.',
      }
    ),
  ],
}

const MANAGEMENT_CONSULTING: SpecialismPack = {
  slug: 'management-consulting',
  label: 'Management Consulting',
  professionalBody: 'Institute of Consulting / Management Consultancies Association (MCA)',
  relatedBodies: ['Institute of Consulting', 'MCA', 'CMI'],
  sources: CONSULTING_SOURCES,
  siblingSlugs: siblings('management-consulting'),
  roles: [
    r(
      'Consulting Graduate Analyst',
      'graduate_entry',
      'Graduate entry supporting client diagnostics, research and slide production on management consulting engagements.',
      {
        priority: 10,
        eligibilityNote:
          'Consulting graduate analyst — not Graduate Software Engineer or Graduate Accountant trainee routes.',
      }
    ),
    r(
      'Associate Consultant (Management Advisory)',
      'junior_practitioner',
      'Early-career consultant contributing analysis, workshop facilitation and deliverable drafting for clients.',
      {
        priority: 20,
        eligibilityNote:
          'Associate management consultant — not IT Technical Consultant or Cyber Security Consultant roles.',
      }
    ),
    r(
      'Junior Management Consultant',
      'junior_practitioner',
      'Develops client recommendations on operations, organisation and performance under partner or manager supervision.',
      {
        priority: 30,
        eligibilityNote:
          'Junior management consultant — Institute of Consulting membership desirable not required at entry.',
      }
    ),
    r(
      'Management Consultant',
      'practitioner',
      'Advises clients on management, operations and organisational problems with structured analysis and implementation support.',
      {
        priority: 40,
        eligibilityNote:
          'Core management consultant — consulting experience and client outcomes primary; formal credentials desirable not mandatory.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Consulting Analyst (Operations Improvement)',
      'practitioner',
      'Conducts operational diagnostics, benchmarking and improvement recommendations for UK client organisations.',
      {
        priority: 50,
        eligibilityNote:
          'Operations consulting analyst — not Data Scientist or Software Engineer in technology consulting firms.',
      }
    ),
    r(
      'Senior Management Consultant',
      'experienced_manager',
      'Leads consulting workstreams, client relationships and quality of recommendations on complex engagements.',
      {
        priority: 60,
        eligibilityNote:
          'Senior management consultant — not Senior Strategy Consultant focused solely on corporate strategy advisory.',
      }
    ),
    r(
      'Principal Management Consultant',
      'senior_manager_specialist',
      'Senior specialist owning methodology, thought leadership and highest-complexity client problems.',
      {
        priority: 70,
        eligibilityNote:
          'Principal management consultant — not Partner without consulting delivery and client leadership experience.',
      }
    ),
    r(
      'Management Consulting Lead',
      'senior_manager_specialist',
      'Leads consulting teams, sales support and knowledge sharing across management advisory practices.',
      {
        priority: 80,
        eligibilityNote:
          'Management consulting lead — not Programme Manager on internal delivery without client advisory remit.',
      }
    ),
    r(
      'Head of Management Consulting',
      'head_programme_leadership',
      'Leads management consulting practice, hiring, offerings and client portfolio for UK consultancy firms.',
      {
        priority: 90,
        eligibilityNote:
          'Head of management consulting — not Head of Strategy Consulting without management advisory portfolio.',
      }
    ),
    r(
      'Partner (Management Consulting)',
      'director_executive',
      'Partner-level client leadership, business development and quality accountability in consulting partnerships.',
      {
        priority: 100,
        eligibilityNote:
          'Management consulting partner — not Finance Partner or Audit Partner in professional services firms.',
      }
    ),
    r(
      'Director of Management Consulting',
      'director_executive',
      'Director leading consulting P&L, offerings and executive client relationships for management advisory services.',
      {
        priority: 110,
        eligibilityNote:
          'Director management consulting — not Director of IT Services without management consulting practice remit.',
      }
    ),
    r(
      'Independent Management Consultant (Interim)',
      'consultant_independent',
      'Self-employed or interim management consultant providing advisory and hands-on improvement for UK clients.',
      {
        priority: 120,
        eligibilityNote:
          'Independent management consultant — explicit interim/self-employed pathway; not permanent Partner hire.',
      }
    ),
    r(
      'Research Fellow (Management Consulting Practice)',
      'academic_research',
      'Academic research on consulting professions, client impact and knowledge transfer in business schools.',
      {
        priority: 130,
        eligibilityNote:
          'Academic consulting research — not practising Management Consultant on live client engagements.',
      }
    ),
  ],
}

const STRATEGY_CONSULTING: SpecialismPack = {
  slug: 'strategy-consulting',
  label: 'Strategy Consulting',
  professionalBody: 'Institute of Consulting / Management Consultancies Association (MCA)',
  relatedBodies: ['Institute of Consulting', 'MCA', 'Strategic Management Society'],
  sources: CONSULTING_SOURCES,
  siblingSlugs: siblings('strategy-consulting'),
  roles: [
    r(
      'Strategy Graduate Analyst',
      'graduate_entry',
      'Graduate analyst supporting market analysis, competitive assessments and strategic option development for clients.',
      {
        priority: 10,
        eligibilityNote:
          'Strategy graduate analyst — not Graduate Investment Analyst or Graduate Software Engineer roles.',
      }
    ),
    r(
      'Junior Strategy Consultant',
      'junior_practitioner',
      'Early-career strategy consultant supporting corporate strategy, growth and portfolio advisory workstreams.',
      {
        priority: 20,
        eligibilityNote:
          'Junior strategy consultant — not Junior Management Consultant focused on operational improvement only.',
      }
    ),
    r(
      'Strategy Consultant',
      'practitioner',
      'Advises organisations on corporate strategy, market entry, M&A support and competitive positioning.',
      {
        priority: 30,
        eligibilityNote:
          'Core strategy consultant — consulting track record primary; Institute of Consulting membership desirable not required.',
        professionalMembershipRequirement: 'desirable',
      }
    ),
    r(
      'Corporate Strategy Analyst (Consulting)',
      'practitioner',
      'Produces strategic analyses, scenario models and executive-ready recommendations for UK client leadership.',
      {
        priority: 40,
        eligibilityNote:
          'Corporate strategy analyst in consulting — not in-house Corporate Strategy Manager without consulting firm context.',
      }
    ),
    r(
      'Senior Strategy Consultant',
      'experienced_manager',
      'Leads strategy engagements, client workshops and synthesis of recommendations for boards and executives.',
      {
        priority: 50,
        eligibilityNote:
          'Senior strategy consultant — not Senior Management Consultant on operational cost reduction programmes only.',
      }
    ),
    r(
      'Principal Strategy Consultant',
      'senior_manager_specialist',
      'Senior specialist on highest-stakes strategy problems including portfolio reshaping and market transformation.',
      {
        priority: 60,
        eligibilityNote:
          'Principal strategy consultant — not Chief Strategy Officer internal executive without consulting delivery background.',
      }
    ),
    r(
      'Strategy Consulting Lead',
      'senior_manager_specialist',
      'Leads strategy consulting teams, proposal development and quality of strategic deliverables.',
      {
        priority: 70,
        eligibilityNote:
          'Strategy consulting lead — not Enterprise Architect or IT Strategy Lead without strategy consulting remit.',
      }
    ),
    r(
      'Head of Strategy Consulting',
      'head_programme_leadership',
      'Heads strategy consulting practice, sector offerings and partner pipeline in UK advisory firms.',
      {
        priority: 80,
        eligibilityNote:
          'Head of strategy consulting — not Head of Corporate Strategy in a single client organisation.',
      }
    ),
    r(
      'Partner (Strategy Consulting)',
      'director_executive',
      'Partner accountable for strategy consulting revenue, key clients and firm-wide strategic advisory reputation.',
      {
        priority: 90,
        eligibilityNote:
          'Strategy consulting partner — not Legal Partner or Audit Partner in unrelated professional services.',
      }
    ),
    r(
      'Director of Strategy Consulting',
      'director_executive',
      'Director leading strategy consulting P&L, talent and executive client relationships.',
      {
        priority: 100,
        eligibilityNote:
          'Director strategy consulting — not Director of Business Development without strategy advisory practice.',
      }
    ),
    r(
      'Independent Strategy Consultant (Interim)',
      'consultant_independent',
      'Self-employed or interim strategy advisor supporting boards, investors and leadership teams on strategic decisions.',
      {
        priority: 110,
        eligibilityNote:
          'Independent strategy consultant — explicit interim/self-employed pathway; not permanent CSO appointment.',
      }
    ),
    r(
      'Lecturer in Strategic Management Consulting',
      'academic_research',
      'Teaches strategic management, consulting methods and case-based strategy in UK business schools.',
      {
        priority: 120,
        eligibilityNote:
          'Academic strategy consulting — not practising Strategy Consultant on live M&A advisory mandates.',
      }
    ),
  ],
}

const PROCESS_IMPROVEMENT: SpecialismPack = {
  slug: 'process-improvement',
  label: 'Process Improvement',
  professionalBody: 'Lean Competency System / Chartered Quality Institute (CQI)',
  relatedBodies: ['Lean Competency System', 'CQI', 'Institute of Consulting'],
  sources: IMPROVEMENT_SOURCES,
  siblingSlugs: siblings('process-improvement'),
  roles: [
    r(
      'Process Improvement Apprentice',
      'foundation_business_support',
      'Apprenticeship learning process mapping, waste identification and improvement workshop support.',
      {
        priority: 10,
        eligibilityNote:
          'Process improvement apprenticeship — not Engineering Manufacturing Apprentice or IT apprenticeship routes.',
      }
    ),
    r(
      'Process Mapping Administrator',
      'foundation_business_support',
      'Maintains process documentation, SIPOC diagrams and improvement action trackers for operational teams.',
      {
        priority: 20,
        eligibilityNote:
          'Process mapping administration — not Document Controller in engineering drawing offices only.',
      }
    ),
    r(
      'Graduate Process Improvement Analyst',
      'graduate_entry',
      'Graduate analyst supporting value stream mapping, baseline measurement and improvement prioritisation.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate process improvement — not Graduate Data Scientist or Software Engineer roles.',
      }
    ),
    r(
      'Junior Process Improvement Analyst',
      'junior_practitioner',
      'Facilitates improvement events, collects performance data and tracks countermeasures under CI lead supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Junior process improvement analyst — not Junior Business Analyst on IT requirements workstreams.',
      }
    ),
    r(
      'Process Improvement Analyst',
      'practitioner',
      'Analyses end-to-end processes, quantifies waste and recommends improvements for UK operational teams.',
      {
        priority: 50,
        eligibilityNote:
          'Process improvement analyst — not Data Analyst building predictive models or ML pipelines.',
      }
    ),
    r(
      'Lean Practitioner (Process Improvement)',
      'practitioner',
      'Applies Lean tools including 5S, value stream mapping and standard work to improve business processes.',
      {
        priority: 60,
        eligibilityNote:
          'Lean practitioner — Lean Competency System credentials desirable not required for competent delivery.',
      }
    ),
    r(
      'Process Improvement Manager',
      'experienced_manager',
      'Leads improvement programmes, coaches teams and embeds sustainable process changes across departments.',
      {
        priority: 70,
        eligibilityNote:
          'Process improvement manager — not Operations Manager without explicit improvement methodology remit.',
      }
    ),
    r(
      'Senior Process Improvement Manager',
      'senior_manager_specialist',
      'Leads enterprise improvement initiatives, master black belt activities and cross-functional value streams.',
      {
        priority: 80,
        eligibilityNote:
          'Senior process improvement manager — not Quality Assurance Manager in software testing contexts.',
      }
    ),
    r(
      'Head of Process Improvement',
      'head_programme_leadership',
      'Heads process improvement capability, training and portfolio of operational excellence initiatives.',
      {
        priority: 90,
        eligibilityNote:
          'Head of process improvement — not Head of Manufacturing Engineering without business process remit.',
      }
    ),
    r(
      'Director of Process Improvement',
      'director_executive',
      'Executive ownership of operational excellence strategy, investment and measurable performance outcomes.',
      {
        priority: 100,
        eligibilityNote:
          'Director process improvement — not Director of IT without business process improvement accountability.',
      }
    ),
    r(
      'Independent Process Improvement Consultant',
      'consultant_independent',
      'Interim consultant delivering Lean diagnostics, rapid improvement events and operating model fixes for clients.',
      {
        priority: 110,
        eligibilityNote:
          'Independent process improvement consulting — not permanent Director of Process Improvement role.',
      }
    ),
    r(
      'Research Fellow (Process Improvement Methods)',
      'academic_research',
      'Academic research on Lean, Six Sigma and operational improvement methods in UK business schools.',
      {
        priority: 120,
        eligibilityNote:
          'Academic process improvement research — not practising Process Improvement Manager in manufacturing only.',
      }
    ),
  ],
}

const CONTINUOUS_IMPROVEMENT: SpecialismPack = {
  slug: 'continuous-improvement',
  label: 'Continuous Improvement',
  professionalBody: 'Lean Competency System / Chartered Quality Institute (CQI)',
  relatedBodies: ['Lean Competency System', 'CQI', 'Institute of Consulting'],
  sources: IMPROVEMENT_SOURCES,
  siblingSlugs: siblings('continuous-improvement'),
  roles: [
    r(
      'Continuous Improvement Apprentice',
      'foundation_business_support',
      'Apprenticeship supporting CI events, visual management boards and standard operating procedure updates.',
      {
        priority: 10,
        eligibilityNote:
          'Continuous improvement apprenticeship — not Software Development or Laboratory Technician apprenticeships.',
      }
    ),
    r(
      'Continuous Improvement Administrator',
      'foundation_business_support',
      'Administers CI registers, KPI tracking and communication for improvement communities of practice.',
      {
        priority: 20,
        eligibilityNote:
          'CI administration — not HR Administrator or Finance Administrator without improvement programme context.',
      }
    ),
    r(
      'Graduate Continuous Improvement Analyst',
      'graduate_entry',
      'Graduate role analysing performance trends, facilitating kaizen events and supporting CI tool deployment.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate continuous improvement — not Graduate Data Scientist or Business Intelligence Developer roles.',
      }
    ),
    r(
      'Junior Continuous Improvement Specialist',
      'junior_practitioner',
      'Supports CI leads on root cause analysis, A3 problem solving and improvement project tracking.',
      {
        priority: 40,
        eligibilityNote:
          'Junior CI specialist — not Junior Process Improvement Analyst where titles are organisation-specific duplicates.',
      }
    ),
    r(
      'Continuous Improvement Specialist',
      'practitioner',
      'Delivers sustained CI programmes using Lean and Six Sigma methods across UK service and operations teams.',
      {
        priority: 50,
        eligibilityNote:
          'Continuous improvement specialist — certifications desirable; demonstrated improvement outcomes primary.',
      }
    ),
    r(
      'Lean Six Sigma Green Belt Practitioner',
      'practitioner',
      'Leads Green Belt improvement projects, statistical process checks and team coaching on CI methods.',
      {
        priority: 60,
        eligibilityNote:
          'Green Belt practitioner — not Quality Engineer in product design verification without CI remit.',
      }
    ),
    r(
      'Continuous Improvement Manager',
      'experienced_manager',
      'Manages CI portfolio, governance and capability building for operational and corporate functions.',
      {
        priority: 70,
        eligibilityNote:
          'Continuous improvement manager — not General Operations Manager without CI methodology accountability.',
      }
    ),
    r(
      'Lean Six Sigma Black Belt (Continuous Improvement)',
      'senior_manager_specialist',
      'Leads complex DMAIC projects, mentors belts and sets statistical standards for improvement community.',
      {
        priority: 80,
        eligibilityNote:
          'Black Belt CI specialist — not Black Belt in software engineering or martial arts unrelated contexts.',
      }
    ),
    r(
      'Senior Continuous Improvement Manager',
      'senior_manager_specialist',
      'Senior leader scaling CI culture, hoshin kanri alignment and cross-site improvement governance.',
      {
        priority: 90,
        eligibilityNote:
          'Senior CI manager — not Senior Quality Manager in ISO audit-only roles without improvement delivery.',
      }
    ),
    r(
      'Head of Continuous Improvement',
      'head_programme_leadership',
      'Heads enterprise CI function, academy training and linkage to strategic performance objectives.',
      {
        priority: 100,
        eligibilityNote:
          'Head of continuous improvement — not Head of Process Improvement where both exist as separate specialisms.',
      }
    ),
    r(
      'Director of Continuous Improvement',
      'director_executive',
      'Executive leadership of continuous improvement strategy, investment and enterprise performance culture.',
      {
        priority: 110,
        eligibilityNote:
          'Director continuous improvement — not Director of Engineering without enterprise CI accountability.',
      }
    ),
    r(
      'Independent Continuous Improvement Consultant',
      'consultant_independent',
      'Interim CI consultant establishing Lean operating systems, belt programmes and performance management.',
      {
        priority: 120,
        eligibilityNote:
          'Independent CI consulting — not permanent Head of Continuous Improvement internal appointment.',
      }
    ),
  ],
}

const SERVICE_IMPROVEMENT: SpecialismPack = {
  slug: 'service-improvement',
  label: 'Service Improvement',
  professionalBody: 'Chartered Management Institute (CMI) / Institute of Customer Service',
  relatedBodies: ['CMI', 'Institute of Customer Service', 'Lean Competency System'],
  sources: [...IMPROVEMENT_SOURCES, 'institute_of_customer_service_careers'],
  siblingSlugs: siblings('service-improvement'),
  roles: [
    r(
      'Service Improvement Administrator',
      'foundation_business_support',
      'Administers service improvement registers, customer feedback logs and action plan tracking.',
      {
        priority: 10,
        eligibilityNote:
          'Service improvement administration — not Contact Centre Team Leader without improvement methodology remit.',
      }
    ),
    r(
      'Customer Service Improvement Coordinator',
      'foundation_business_support',
      'Coordinates service improvement workshops, mystery shopping programmes and frontline feedback loops.',
      {
        priority: 20,
        eligibilityNote:
          'Customer service improvement coordinator — not Retail Supervisor without service design improvement scope.',
      }
    ),
    r(
      'Graduate Service Improvement Analyst',
      'graduate_entry',
      'Graduate analyst measuring service performance, journey pain points and improvement opportunities.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate service improvement — not Graduate Data Scientist or Software Engineer roles.',
      }
    ),
    r(
      'Junior Service Improvement Analyst',
      'junior_practitioner',
      'Supports service blueprinting, SLA analysis and improvement project delivery under service leads.',
      {
        priority: 40,
        eligibilityNote:
          'Junior service improvement analyst — not Junior Business Analyst on back-office IT projects only.',
      }
    ),
    r(
      'Service Improvement Analyst',
      'practitioner',
      'Analyses service metrics, designs improvements and tracks benefits for customer-facing operations.',
      {
        priority: 50,
        eligibilityNote:
          'Service improvement analyst — not IT Service Management Analyst in infrastructure operations only.',
      }
    ),
    r(
      'Service Design Improvement Lead',
      'practitioner',
      'Leads service design improvements integrating customer insight, process change and frontline capability.',
      {
        priority: 60,
        eligibilityNote:
          'Service design improvement lead — not UX Designer or Software Engineer in digital product teams.',
      }
    ),
    r(
      'Service Improvement Manager',
      'experienced_manager',
      'Manages service improvement portfolio, stakeholder engagement and adoption across UK service organisations.',
      {
        priority: 70,
        eligibilityNote:
          'Service improvement manager — not Customer Operations Manager without explicit improvement accountability.',
      }
    ),
    r(
      'Customer Experience Improvement Manager',
      'experienced_manager',
      'Improves end-to-end customer experience through journey redesign, training and performance management.',
      {
        priority: 80,
        eligibilityNote:
          'Customer experience improvement — not Marketing Manager focused on campaigns without service operations remit.',
      }
    ),
    r(
      'Senior Service Improvement Manager',
      'senior_manager_specialist',
      'Leads complex multi-channel service improvements including public sector and regulated service contexts.',
      {
        priority: 90,
        eligibilityNote:
          'Senior service improvement manager — not Clinical Service Manager in NHS clinical pathways without improvement remit.',
      }
    ),
    r(
      'Head of Service Improvement',
      'head_programme_leadership',
      'Heads service improvement function, methods and linkage to customer strategy and operational performance.',
      {
        priority: 100,
        eligibilityNote:
          'Head of service improvement — not Head of Customer Service operations without improvement portfolio.',
      }
    ),
    r(
      'Director of Service Improvement',
      'director_executive',
      'Executive ownership of service improvement investment, outcomes and cross-organisation customer performance.',
      {
        priority: 110,
        eligibilityNote:
          'Director service improvement — not Director of IT Service Management without customer service improvement scope.',
      }
    ),
    r(
      'Independent Service Improvement Consultant',
      'consultant_independent',
      'Interim consultant improving service operations, customer journeys and frontline performance for UK clients.',
      {
        priority: 120,
        eligibilityNote:
          'Independent service improvement consulting — not permanent Director of Service Improvement role.',
      }
    ),
    r(
      'Lecturer in Service Improvement and Design',
      'academic_research',
      'Teaches service improvement, public service design and customer experience research in UK universities.',
      {
        priority: 130,
        eligibilityNote:
          'Academic service improvement — not practising Service Improvement Manager in contact centre operations.',
      }
    ),
  ],
}

const BUSINESS_PROCESS_MANAGEMENT: SpecialismPack = {
  slug: 'business-process-management',
  label: 'Business Process Management',
  professionalBody: 'Association of Business Process Management Professionals (ABPMP) / BCS',
  relatedBodies: ['ABPMP', 'BCS', 'Lean Competency System'],
  sources: IMPROVEMENT_SOURCES,
  siblingSlugs: siblings('business-process-management'),
  roles: [
    r(
      'BPM Administrator',
      'foundation_business_support',
      'Maintains process repositories, version control and BPM governance documentation for UK organisations.',
      {
        priority: 10,
        eligibilityNote:
          'BPM administration — not IT Systems Administrator managing servers without process repository remit.',
      }
    ),
    r(
      'Process Documentation Coordinator',
      'foundation_business_support',
      'Coordinates capture of as-is and to-be processes, RACI matrices and procedure libraries.',
      {
        priority: 20,
        eligibilityNote:
          'Process documentation coordinator — not Technical Writer for software API documentation only.',
      }
    ),
    r(
      'Graduate Business Process Analyst',
      'graduate_entry',
      'Graduate analyst modelling processes, identifying bottlenecks and supporting BPM tool implementation.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate business process analyst — not Graduate Software Engineer or Data Engineer roles.',
      }
    ),
    r(
      'Junior Business Process Analyst',
      'junior_practitioner',
      'Develops process models in BPMN, supports process mining data collection and improvement tracking.',
      {
        priority: 40,
        eligibilityNote:
          'Junior business process analyst — not Junior Business Analyst on single-system requirements only.',
      }
    ),
    r(
      'Business Process Analyst',
      'practitioner',
      'Owns process analysis, performance measurement and redesign recommendations across business functions.',
      {
        priority: 50,
        eligibilityNote:
          'Business process analyst — ABPMP/BCS context desirable; analytical and facilitation skills primary.',
      }
    ),
    r(
      'Process Modelling Specialist (BPM)',
      'practitioner',
      'Specialises in BPMN modelling, process architecture alignment and repository quality standards.',
      {
        priority: 60,
        eligibilityNote:
          'Process modelling specialist — not Enterprise Architect without process modelling accountability.',
      }
    ),
    r(
      'Business Process Manager',
      'experienced_manager',
      'Manages end-to-end process ownership, KPI accountability and cross-functional process governance.',
      {
        priority: 70,
        eligibilityNote:
          'Business process manager — not IT Product Manager or Software Engineering Manager roles.',
      }
    ),
    r(
      'Senior Business Process Manager',
      'senior_manager_specialist',
      'Leads complex process transformation, automation business cases and process centre of excellence.',
      {
        priority: 80,
        eligibilityNote:
          'Senior BPM manager — not RPA Developer or Software Engineer building automation bots.',
      }
    ),
    r(
      'Enterprise Process Architect (BPM)',
      'senior_manager_specialist',
      'Designs enterprise process architecture, standards and integration with operating model strategy.',
      {
        priority: 90,
        eligibilityNote:
          'Enterprise process architect — not Cloud Solutions Architect or Software Architect technical roles.',
      }
    ),
    r(
      'Head of Business Process Management',
      'head_programme_leadership',
      'Heads BPM practice, tooling, process ownership model and linkage to continuous improvement.',
      {
        priority: 100,
        eligibilityNote:
          'Head of BPM — not Head of Business Analysis without process architecture and ownership remit.',
      }
    ),
    r(
      'Director of Business Process Management',
      'director_executive',
      'Executive leadership of process management strategy, investment and enterprise operating performance.',
      {
        priority: 110,
        eligibilityNote:
          'Director BPM — not Director of IT without business process ownership and governance accountability.',
      }
    ),
    r(
      'Independent BPM Consultant',
      'consultant_independent',
      'Interim BPM consultant establishing process repositories, ownership models and improvement roadmaps.',
      {
        priority: 120,
        eligibilityNote:
          'Independent BPM consulting — not permanent Director of Business Process Management role.',
      }
    ),
    r(
      'Lecturer in Business Process Management',
      'academic_research',
      'Teaches BPM methods, process mining research and digital operations in UK business and IS schools.',
      {
        priority: 130,
        eligibilityNote:
          'Academic BPM — not practising Business Process Manager in corporate shared services operations.',
      }
    ),
  ],
}

export const PROJECTS_CONSULTING_PACKS: SpecialismPack[] = [
  PROJECT_MANAGEMENT,
  PROGRAMME_MANAGEMENT,
  PORTFOLIO_MANAGEMENT,
  PMO,
  AGILE_DELIVERY,
  BUSINESS_TRANSFORMATION,
  IMPLEMENTATION_MANAGEMENT,
  BUSINESS_ANALYSIS,
  MANAGEMENT_CONSULTING,
  STRATEGY_CONSULTING,
  PROCESS_IMPROVEMENT,
  CONTINUOUS_IMPROVEMENT,
  SERVICE_IMPROVEMENT,
  BUSINESS_PROCESS_MANAGEMENT,
]
