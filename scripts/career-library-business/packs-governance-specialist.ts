import { r, type SpecialismPack } from './shared'

const GOVERNANCE_SPECIALIST_SIBLINGS = [
  'corporate-governance',
  'enterprise-risk-management',
  'business-continuity',
  'internal-controls',
  'corporate-responsibility',
  'esg-and-sustainability-management',
  'product-management',
  'innovation-management',
  'franchise-management',
  'export-and-trade-management',
  'business-systems-and-erp',
  'data-informed-business-management',
  'business-and-management-research',
  'organisational-behaviour',
  'entrepreneurship-research',
  'strategy-research',
  'operations-management-research',
]

function siblings(except: string) {
  return GOVERNANCE_SPECIALIST_SIBLINGS.filter((s) => s !== except)
}

const GOVERNANCE_SOURCES = [
  'cgi_careers',
  'irm_risk_management',
  'bci_business_continuity',
  'prospects_business_management',
  'national_careers_service_business',
]

// ---------------------------------------------------------------------------
// 1) Corporate Governance — CGI (~14 roles)
// ---------------------------------------------------------------------------
const CORPORATE_GOVERNANCE: SpecialismPack = {
  slug: 'corporate-governance',
  label: 'Corporate Governance',
  professionalBody: 'Chartered Governance Institute UK & Ireland (CGI)',
  relatedBodies: ['CGI', 'ICSA', 'FRC'],
  sources: [...GOVERNANCE_SOURCES, 'frc_corporate_governance_code'],
  siblingSlugs: siblings('corporate-governance'),
  roles: [
    r('Governance Administrator', 'foundation_business_support', 'Provides administrative support for board papers, statutory filings and governance records.', { priority: 10, eligibilityNote: 'Governance admin support — not Company Secretary qualified route or statutory audit roles.' }),
    r('Company Secretarial Assistant', 'foundation_business_support', 'Assists company secretarial teams with meeting logistics, registers and compliance documentation.', { priority: 20, eligibilityNote: 'Secretarial assistant — not Chartered Governance Professional or external audit accountant.' }),
    r('Graduate Governance Analyst', 'graduate_entry', 'Graduate entry analysing governance frameworks, board reporting and regulatory compliance requirements.', { priority: 30, eligibilityNote: 'Graduate governance analyst — not Graduate Risk Analyst or Legal graduate trainee solicitor routes.' }),
    r('Trainee Chartered Governance Professional (CGI)', 'graduate_entry', 'Structured trainee route toward CGI qualification with supervised board governance and company secretarial work.', { priority: 40, eligibilityNote: 'CGI trainee pathway — not IRM risk trainee or BCI continuity trainee routes.', professionalMembershipRequirement: 'desirable' }),
    r('Junior Company Secretary', 'junior_practitioner', 'Supports qualified company secretaries with statutory duties, subsidiary governance and shareholder communications.', { priority: 50, eligibilityNote: 'Junior company secretary — not Junior Legal Counsel or Compliance Officer without governance remit.' }),
    r('Governance Officer', 'junior_practitioner', 'Maintains governance policies, committee terms of reference and compliance tracking for UK organisations.', { priority: 60, eligibilityNote: 'Governance officer — not Internal Controls Analyst or ESG Reporting roles.' }),
    r('Board Governance Analyst', 'practitioner', 'Analyses board effectiveness, director induction and governance benchmarking for listed and private companies.', { priority: 70, eligibilityNote: 'Board governance analyst — not Strategy Consultant or Management Consultant generalist roles.' }),
    r('Company Secretary (Corporate Governance)', 'practitioner', 'Qualified or experienced company secretary managing statutory obligations and board governance processes.', { priority: 80, eligibilityNote: 'Company secretary governance — not External Auditor or Tax Accountant statutory roles.', professionalMembershipRequirement: 'desirable' }),
    r('Corporate Governance Manager', 'experienced_manager', 'Manages governance programmes, subsidiary oversight and regulatory reporting for corporate groups.', { priority: 90, eligibilityNote: 'Corporate governance manager — not Enterprise Risk Manager or Head of Compliance without board governance scope.' }),
    r('Senior Company Secretary', 'senior_manager_specialist', 'Senior company secretarial accountability for group governance, AGM/EGM processes and director support.', { priority: 100, eligibilityNote: 'Senior company secretary — not General Counsel or Chief Compliance Officer unless dual governance remit.', professionalMembershipRequirement: 'desirable' }),
    r('Chartered Governance Professional (CGI)', 'senior_manager_specialist', 'CGI-qualified governance professional leading board support, entity management and governance assurance.', { priority: 110, eligibilityNote: 'Chartered governance professional — not Chartered Accountant or IRM risk charter routes.', professionalMembershipRequirement: 'required' }),
    r('Head of Corporate Governance', 'head_programme_leadership', 'Leads governance function, board calendar, policy framework and governance training across the organisation.', { priority: 120, eligibilityNote: 'Head of corporate governance — not Head of Internal Audit or Head of Legal.' }),
    r('Director of Corporate Governance', 'director_executive', 'Executive ownership of governance standards, board effectiveness and group secretarial capability.', { priority: 130, eligibilityNote: 'Director corporate governance — not CFO, General Counsel or CTO without governance accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Corporate Governance Consultant', 'consultant_independent', 'Advises boards and company secretarial teams on governance improvement, listings compliance and best practice.', { priority: 140, eligibilityNote: 'Independent governance consultant — not Management Consulting Partner without governance specialism.' }),
  ],
}

// ---------------------------------------------------------------------------
// 2) Enterprise Risk Management — IRM (~14 roles)
// ---------------------------------------------------------------------------
const ENTERPRISE_RISK_MANAGEMENT: SpecialismPack = {
  slug: 'enterprise-risk-management',
  label: 'Enterprise Risk Management',
  professionalBody: 'Institute of Risk Management (IRM)',
  relatedBodies: ['IRM', 'COSO', 'ISO 31000'],
  sources: [...GOVERNANCE_SOURCES, 'irm_certifications'],
  siblingSlugs: siblings('enterprise-risk-management'),
  roles: [
    r('Risk Administration Apprentice', 'foundation_business_support', 'Apprenticeship supporting risk registers, incident logging and risk reporting administration.', { priority: 10, eligibilityNote: 'Risk admin apprenticeship — not Cyber Security apprenticeship or Insurance underwriting trainee routes.' }),
    r('Risk and Compliance Assistant', 'foundation_business_support', 'Assists risk teams with data collection, control evidence and compliance documentation.', { priority: 20, eligibilityNote: 'Risk compliance assistant — not Accounts Payable Clerk or HR Administrator roles.' }),
    r('Graduate Enterprise Risk Analyst', 'graduate_entry', 'Graduate entry supporting risk assessments, heat maps and risk appetite reporting.', { priority: 30, eligibilityNote: 'Graduate enterprise risk — not Graduate Data Analyst, Actuarial Analyst or Credit Risk banking-only roles.' }),
    r('Trainee Risk Management Professional (IRM)', 'graduate_entry', 'Structured trainee developing risk identification, treatment and monitoring under IRM-aligned frameworks.', { priority: 40, eligibilityNote: 'IRM trainee pathway — not CGI governance trainee or Internal Audit graduate schemes alone.', professionalMembershipRequirement: 'desirable' }),
    r('Junior Enterprise Risk Analyst', 'junior_practitioner', 'Supports enterprise risk assessments, key risk indicators and risk committee papers.', { priority: 50, eligibilityNote: 'Junior enterprise risk — not Junior Cyber Security Analyst or Operational Risk banking silo without ERM scope.' }),
    r('Risk Register Coordinator', 'junior_practitioner', 'Maintains enterprise risk registers, action tracking and risk workshop logistics.', { priority: 60, eligibilityNote: 'Risk register coordinator — not Project Coordinator or PMO Administrator roles.' }),
    r('Enterprise Risk Analyst', 'practitioner', 'Analyses enterprise risks, control effectiveness and risk treatment plans across business units.', { priority: 70, eligibilityNote: 'Enterprise risk analyst — not Financial Analyst or Business Intelligence Analyst reporting-only roles.' }),
    r('Enterprise Risk Manager', 'practitioner', 'Owns risk management processes, risk appetite alignment and risk reporting for organisational leadership.', { priority: 80, eligibilityNote: 'Enterprise risk manager — not Health and Safety Manager or IT Security Manager without ERM remit.' }),
    r('Senior Enterprise Risk Manager', 'experienced_manager', 'Leads enterprise risk programmes, three-lines-of-defence coordination and risk culture initiatives.', { priority: 90, eligibilityNote: 'Senior enterprise risk — not Senior Internal Auditor or Senior Compliance Manager without risk framework ownership.' }),
    r('Head of Enterprise Risk', 'head_programme_leadership', 'Leads enterprise risk function, risk governance forums and integration with strategic planning.', { priority: 100, eligibilityNote: 'Head of enterprise risk — not Head of Internal Controls or Head of Business Continuity alone.' }),
    r('Chief Risk Officer (Enterprise)', 'senior_manager_specialist', 'Senior accountable executive for enterprise risk appetite, oversight and board risk reporting.', { priority: 110, eligibilityNote: 'CRO enterprise — not Chief Information Security Officer or Chief Compliance Officer without enterprise risk remit.' }),
    r('Chartered Enterprise Risk Manager (IRM)', 'senior_manager_specialist', 'IRM-qualified risk professional leading enterprise risk frameworks and assurance across the organisation.', { priority: 120, eligibilityNote: 'Chartered enterprise risk manager — not Chartered Accountant or Chartered Governance Professional routes.', professionalMembershipRequirement: 'required' }),
    r('Director of Enterprise Risk Management', 'director_executive', 'Executive leadership of enterprise risk capability, risk transformation and regulatory risk alignment.', { priority: 130, eligibilityNote: 'Director ERM — not Director of Internal Audit or Director of IT without enterprise risk accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Enterprise Risk Consultant', 'consultant_independent', 'Advises organisations on ERM design, risk maturity assessment and risk governance improvement.', { priority: 140, eligibilityNote: 'Independent ERM consultant — not Cyber Security Consultant or Actuarial Consultant roles.' }),
  ],
}

// ---------------------------------------------------------------------------
// 3) Business Continuity — BCI (~14 roles)
// ---------------------------------------------------------------------------
const BUSINESS_CONTINUITY: SpecialismPack = {
  slug: 'business-continuity',
  label: 'Business Continuity',
  professionalBody: 'Business Continuity Institute (BCI)',
  relatedBodies: ['BCI', 'ISO 22301', 'Civil Contingencies Act context'],
  sources: [...GOVERNANCE_SOURCES, 'bci_good_practice'],
  siblingSlugs: siblings('business-continuity'),
  roles: [
    r('Business Continuity Administrator', 'foundation_business_support', 'Supports business continuity plans, contact lists and exercise scheduling administration.', { priority: 10, eligibilityNote: 'BC admin support — not IT Service Desk or Facilities Reception roles.' }),
    r('Resilience Support Assistant', 'foundation_business_support', 'Assists resilience teams with documentation, room bookings and stakeholder communications for exercises.', { priority: 20, eligibilityNote: 'Resilience support assistant — not Health and Safety Administrator alone.' }),
    r('Graduate Business Continuity Analyst', 'graduate_entry', 'Graduate entry supporting business impact analysis, recovery strategies and continuity plan maintenance.', { priority: 30, eligibilityNote: 'Graduate BC analyst — not Graduate IT Infrastructure or Cyber Incident Response roles.' }),
    r('Trainee Business Continuity Professional (BCI)', 'graduate_entry', 'Structured trainee developing BIA, recovery planning and crisis management under BCI-aligned practice.', { priority: 40, eligibilityNote: 'BCI trainee pathway — not IRM risk trainee or Emergency Planning local authority-only routes.', professionalMembershipRequirement: 'desirable' }),
    r('Junior Business Continuity Analyst', 'junior_practitioner', 'Supports continuity planning, dependency mapping and exercise scenario development.', { priority: 50, eligibilityNote: 'Junior BC analyst — not Junior Disaster Recovery Engineer or Cloud Engineer roles.' }),
    r('Crisis Response Coordinator', 'junior_practitioner', 'Coordinates crisis communication logs, situation rooms and initial response activation procedures.', { priority: 60, eligibilityNote: 'Crisis response coordinator — not PR/Media Coordinator without continuity plan accountability.' }),
    r('Business Continuity Planner', 'practitioner', 'Develops and maintains business continuity plans, recovery procedures and exercise programmes.', { priority: 70, eligibilityNote: 'BC planner — not IT Disaster Recovery Planner without business process recovery scope.' }),
    r('Business Continuity Manager', 'practitioner', 'Owns continuity management system, BIAs and recovery time objectives across critical functions.', { priority: 80, eligibilityNote: 'BC manager — not IT Operations Manager or Facilities Manager without continuity remit.' }),
    r('Senior Business Continuity Manager', 'experienced_manager', 'Leads enterprise continuity programmes, crisis management integration and resilience testing.', { priority: 90, eligibilityNote: 'Senior BC manager — not Senior Enterprise Risk Manager without continuity plan ownership.' }),
    r('Head of Business Continuity', 'head_programme_leadership', 'Leads business continuity function, crisis governance and organisational resilience standards.', { priority: 100, eligibilityNote: 'Head of business continuity — not Head of IT Operations or Head of Security Operations.' }),
    r('Business Resilience Lead', 'senior_manager_specialist', 'Senior specialist integrating continuity, crisis management and operational resilience across the enterprise.', { priority: 110, eligibilityNote: 'Business resilience lead — not Site Reliability Engineering Lead or Network Operations Lead.' }),
    r('Chartered Business Continuity Professional (BCI)', 'senior_manager_specialist', 'BCI-qualified professional leading continuity assurance, standards and recovery capability maturity.', { priority: 120, eligibilityNote: 'Chartered BC professional — not Chartered IT Professional or IRM risk charter routes.', professionalMembershipRequirement: 'required' }),
    r('Director of Business Continuity and Resilience', 'director_executive', 'Executive ownership of organisational resilience, crisis preparedness and continuity investment.', { priority: 130, eligibilityNote: 'Director BC and resilience — not Director of IT or Director of Operations without resilience accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Business Continuity Consultant', 'consultant_independent', 'Advises clients on ISO 22301 alignment, BIA methodology and crisis exercise design.', { priority: 140, eligibilityNote: 'Independent BC consultant — not IT DR consultant or Cyber Incident Response consultant alone.' }),
  ],
}

// ---------------------------------------------------------------------------
// 4) Internal Controls (~14 roles)
// ---------------------------------------------------------------------------
const INTERNAL_CONTROLS: SpecialismPack = {
  slug: 'internal-controls',
  label: 'Internal Controls',
  professionalBody: 'Institute of Risk Management (IRM) / Chartered Governance Institute (CGI)',
  relatedBodies: ['IRM', 'COSO', 'IIA (distinct from internal audit)'],
  sources: GOVERNANCE_SOURCES,
  siblingSlugs: siblings('internal-controls'),
  roles: [
    r('Internal Controls Administrator', 'foundation_business_support', 'Supports controls testing schedules, evidence collection and controls documentation.', { priority: 10, eligibilityNote: 'Internal controls admin — not Accounts Assistant or Payroll Administrator roles.' }),
    r('Controls Testing Assistant', 'foundation_business_support', 'Assists controls assurance teams with walkthrough notes, sample selection and testing logs.', { priority: 20, eligibilityNote: 'Controls testing assistant — not External Audit Junior or Tax Assistant roles.' }),
    r('Graduate Internal Controls Analyst', 'graduate_entry', 'Graduate entry mapping controls, testing design and remediation tracking for finance and operations.', { priority: 30, eligibilityNote: 'Graduate internal controls — not Graduate Internal Auditor (IIA route) unless controls-design remit is clear.' }),
    r('Trainee Internal Controls Specialist', 'graduate_entry', 'Trainee developing SOX/controls frameworks, control owners and deficiency management processes.', { priority: 40, eligibilityNote: 'Trainee internal controls — not Statutory Audit Trainee or Forensic Accountant trainee routes.' }),
    r('Junior Internal Controls Analyst', 'junior_practitioner', 'Supports controls testing, process documentation and control gap identification.', { priority: 50, eligibilityNote: 'Junior internal controls — not Junior Financial Accountant or Credit Controller roles.' }),
    r('SOX Controls Coordinator', 'junior_practitioner', 'Coordinates SOX control cycles, evidence requests and management sign-off for US-listed entities.', { priority: 60, eligibilityNote: 'SOX controls coordinator — not External SOX Audit Senior or IT General Controls engineer-only roles.' }),
    r('Internal Controls Analyst', 'practitioner', 'Tests key controls, evaluates design effectiveness and reports control deficiencies.', { priority: 70, eligibilityNote: 'Internal controls analyst — not Internal Auditor (IIA) unless role is controls framework not audit opinion.' }),
    r('Internal Controls Manager', 'practitioner', 'Owns controls framework, control owner training and remediation programmes across business processes.', { priority: 80, eligibilityNote: 'Internal controls manager — not Financial Controller or Compliance Manager without controls framework ownership.' }),
    r('Senior Internal Controls Manager', 'experienced_manager', 'Leads enterprise controls programmes, regulatory controls mapping and continuous controls monitoring.', { priority: 90, eligibilityNote: 'Senior internal controls — not Head of Internal Audit or Head of Financial Reporting.' }),
    r('Internal Controls Assurance Manager', 'senior_manager_specialist', 'Senior accountability for controls assurance, attestation cycles and cross-functional control governance.', { priority: 100, eligibilityNote: 'Internal controls assurance — not External Audit Manager or Risk Assurance actuarial roles.' }),
    r('Internal Controls Framework Lead', 'senior_manager_specialist', 'Leads controls framework design, COSO alignment and control rationalisation initiatives.', { priority: 110, eligibilityNote: 'Internal controls framework lead — not Enterprise Architect or ERP Technical Consultant roles.' }),
    r('Head of Internal Controls', 'head_programme_leadership', 'Leads internal controls function, control committees and integration with risk and compliance.', { priority: 120, eligibilityNote: 'Head of internal controls — not Head of Internal Audit unless explicitly dual remit with controls design.' }),
    r('Director of Internal Controls', 'director_executive', 'Executive ownership of controls environment, regulatory controls and control transformation.', { priority: 130, eligibilityNote: 'Director internal controls — not CFO or Director of Internal Audit without controls framework accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Internal Controls Consultant', 'consultant_independent', 'Advises organisations on controls design, SOX readiness and controls maturity improvement.', { priority: 140, eligibilityNote: 'Independent internal controls consultant — not External Audit Partner or IT Security Consultant.' }),
  ],
}

// ---------------------------------------------------------------------------
// 5) Corporate Responsibility (~14 roles)
// ---------------------------------------------------------------------------
const CORPORATE_RESPONSIBILITY: SpecialismPack = {
  slug: 'corporate-responsibility',
  label: 'Corporate Responsibility',
  professionalBody: 'IEMA / Chartered Governance Institute (context)',
  relatedBodies: ['Business in the Community', 'IEMA', 'CGI'],
  sources: [...GOVERNANCE_SOURCES, 'bitc_responsible_business'],
  siblingSlugs: siblings('corporate-responsibility'),
  roles: [
    r('Corporate Responsibility Administrator', 'foundation_business_support', 'Supports CSR programmes, volunteer coordination and community initiative administration.', { priority: 10, eligibilityNote: 'CSR admin — not Marketing Assistant or Events Coordinator without responsibility programme remit.' }),
    r('Community Engagement Assistant', 'foundation_business_support', 'Assists community partnership teams with outreach scheduling, reporting and stakeholder lists.', { priority: 20, eligibilityNote: 'Community engagement assistant — not Local Government Community Officer public-sector-only routes.' }),
    r('Graduate Corporate Responsibility Analyst', 'graduate_entry', 'Graduate entry analysing CSR metrics, stakeholder feedback and responsible business reporting.', { priority: 30, eligibilityNote: 'Graduate CSR analyst — not Graduate ESG Analyst (environmental metrics focus) or PR graduate roles.' }),
    r('Trainee CSR Programme Coordinator', 'graduate_entry', 'Trainee coordinating corporate responsibility initiatives, charity partnerships and employee volunteering.', { priority: 40, eligibilityNote: 'CSR trainee — not Sustainability/Carbon trainee or HR Diversity graduate schemes alone.' }),
    r('Junior Corporate Responsibility Officer', 'junior_practitioner', 'Supports CSR strategy delivery, community grants and responsible sourcing communications.', { priority: 50, eligibilityNote: 'Junior CSR officer — not Junior ESG Analyst or Junior Marketing Executive roles.' }),
    r('Stakeholder Engagement Coordinator (CSR)', 'junior_practitioner', 'Coordinates NGO, community and employee stakeholder forums for corporate responsibility programmes.', { priority: 60, eligibilityNote: 'CSR stakeholder coordinator — not Investor Relations Coordinator or Public Affairs roles.' }),
    r('Corporate Responsibility Manager', 'practitioner', 'Owns CSR programmes, community investment and responsible business policy implementation.', { priority: 70, eligibilityNote: 'CSR manager — not ESG Manager (environmental/social metrics) or HR Wellbeing Manager alone.' }),
    r('Community Investment Manager', 'practitioner', 'Manages charitable giving, community partnerships and social impact measurement for corporate programmes.', { priority: 80, eligibilityNote: 'Community investment manager — not Foundation Trust Manager (charity sector) without corporate employer context.' }),
    r('Senior Corporate Responsibility Manager', 'experienced_manager', 'Leads CSR strategy, materiality for social impact and board-level responsibility reporting.', { priority: 90, eligibilityNote: 'Senior CSR manager — not Senior ESG Manager or Senior Communications Manager without CSR ownership.' }),
    r('Ethical Business Programme Manager', 'senior_manager_specialist', 'Leads ethical business, human rights due diligence and supplier responsibility programmes.', { priority: 100, eligibilityNote: 'Ethical business programme — not Procurement Ethics Officer or Legal Compliance Manager alone.' }),
    r('Corporate Citizenship Lead', 'senior_manager_specialist', 'Senior lead for corporate citizenship, community legacy and responsible brand programmes.', { priority: 110, eligibilityNote: 'Corporate citizenship lead — not Brand Manager or Corporate Affairs Director without citizenship remit.' }),
    r('Head of Corporate Responsibility', 'head_programme_leadership', 'Leads corporate responsibility function, NGO partnerships and responsible business governance.', { priority: 120, eligibilityNote: 'Head of CSR — not Head of ESG or Head of Sustainability without social responsibility scope.' }),
    r('Director of Corporate Responsibility', 'director_executive', 'Executive ownership of corporate responsibility strategy, reporting and stakeholder trust.', { priority: 130, eligibilityNote: 'Director CSR — not Director of Marketing or Director of ESG without corporate responsibility accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Corporate Responsibility Consultant', 'consultant_independent', 'Advises organisations on CSR strategy, community impact and responsible business frameworks.', { priority: 140, eligibilityNote: 'Independent CSR consultant — not ESG Consultant or Management Consultant without CSR specialism.' }),
  ],
}

// ---------------------------------------------------------------------------
// 6) ESG and Sustainability Management (~14 roles)
// ---------------------------------------------------------------------------
const ESG_AND_SUSTAINABILITY: SpecialismPack = {
  slug: 'esg-and-sustainability-management',
  label: 'ESG and Sustainability Management',
  professionalBody: 'IEMA / Cambridge Institute for Sustainability Leadership (context)',
  relatedBodies: ['IEMA', 'GRI', 'TCFD', 'SBTi'],
  sources: [...GOVERNANCE_SOURCES, 'iema_environment_sustainability'],
  siblingSlugs: siblings('esg-and-sustainability-management'),
  roles: [
    r('Sustainability Administrator', 'foundation_business_support', 'Supports sustainability data collection, environmental reporting calendars and programme administration.', { priority: 10, eligibilityNote: 'Sustainability admin — not Facilities Energy Coordinator or HSE Administrator alone.' }),
    r('ESG Reporting Assistant', 'foundation_business_support', 'Assists ESG disclosure teams with metrics collation, evidence files and reporting platform uploads.', { priority: 20, eligibilityNote: 'ESG reporting assistant — not Financial Reporting Assistant or Investor Relations admin roles.' }),
    r('Graduate ESG Analyst', 'graduate_entry', 'Graduate entry supporting ESG metrics, disclosure frameworks and sustainability performance analysis.', { priority: 30, eligibilityNote: 'Graduate ESG analyst — not Graduate Data Scientist or Environmental Scientist field-research roles.' }),
    r('Trainee Sustainability Coordinator', 'graduate_entry', 'Trainee developing carbon accounting support, ESG data governance and sustainability communications.', { priority: 40, eligibilityNote: 'Sustainability trainee — not CSR Programme Coordinator (social impact focus) or Energy Engineer trainee.' }),
    r('Junior ESG Analyst', 'junior_practitioner', 'Supports ESG ratings responses, materiality updates and sustainability KPI tracking.', { priority: 50, eligibilityNote: 'Junior ESG analyst — not Junior MI Analyst or Junior Environmental Consultant engineering routes.' }),
    r('Carbon Reporting Coordinator', 'junior_practitioner', 'Coordinates Scope 1–3 data collection, emission factors and carbon disclosure submissions.', { priority: 60, eligibilityNote: 'Carbon reporting coordinator — not Building Services Engineer or Renewable Energy Project Coordinator alone.' }),
    r('ESG Manager', 'practitioner', 'Owns ESG reporting, investor ESG queries and integration of ESG into business planning.', { priority: 70, eligibilityNote: 'ESG manager — not Corporate Responsibility Manager (CSR social programmes) or CFO reporting roles.' }),
    r('Sustainability Manager (Business-Led)', 'practitioner', 'Leads sustainability strategy delivery, environmental targets and supplier sustainability requirements.', { priority: 80, eligibilityNote: 'Business-led sustainability manager — not Environmental Manager (operational HSE/site) without ESG reporting remit.' }),
    r('Senior ESG Manager', 'experienced_manager', 'Leads ESG programme governance, TCFD/SBTi alignment and board ESG committee support.', { priority: 90, eligibilityNote: 'Senior ESG manager — not Senior CSR Manager or Senior Financial Controller roles.' }),
    r('Climate Strategy Manager', 'senior_manager_specialist', 'Develops net-zero roadmaps, climate risk integration and transition planning for the organisation.', { priority: 100, eligibilityNote: 'Climate strategy manager — not Climate Scientist research role or Energy Manager operational-only routes.' }),
    r('Net Zero Programme Lead', 'senior_manager_specialist', 'Leads net-zero programme delivery, decarbonisation workstreams and executive climate reporting.', { priority: 110, eligibilityNote: 'Net zero programme lead — not Engineering Net Zero Project Manager without ESG governance accountability.' }),
    r('Head of ESG and Sustainability', 'head_programme_leadership', 'Leads ESG and sustainability function, disclosure assurance and sustainability governance forums.', { priority: 120, eligibilityNote: 'Head of ESG — not Head of Corporate Responsibility or Head of HSE without ESG reporting scope.' }),
    r('Director of ESG', 'director_executive', 'Executive ownership of ESG strategy, investor engagement and sustainability transformation.', { priority: 130, eligibilityNote: 'Director of ESG — not Director of Operations or Director of Marketing without ESG accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent ESG Consultant', 'consultant_independent', 'Advises organisations on ESG strategy, disclosure readiness and sustainability maturity assessment.', { priority: 140, eligibilityNote: 'Independent ESG consultant — not Environmental Consultant (engineering compliance) or Data Consultant.' }),
  ],
}

// ---------------------------------------------------------------------------
// 7) Product Management — business/product-led (~14 roles)
// ---------------------------------------------------------------------------
const PRODUCT_MANAGEMENT: SpecialismPack = {
  slug: 'product-management',
  label: 'Product Management',
  professionalBody: 'Product Management community / Chartered Management Institute (CMI)',
  relatedBodies: ['CMI', 'Product Management Festival', 'ISPIM (innovation overlap)'],
  sources: [...GOVERNANCE_SOURCES, 'prospects_product_manager_business'],
  siblingSlugs: siblings('product-management'),
  roles: [
    r('Product Operations Assistant', 'foundation_business_support', 'Supports product teams with catalogue updates, launch logistics and customer feedback administration.', { priority: 10, eligibilityNote: 'Product operations assistant — not Software Developer apprentice or IT Support roles.' }),
    r('Product Support Coordinator (Commercial Offering)', 'foundation_business_support', 'Coordinates commercial product documentation, pricing packs and sales enablement materials.', { priority: 20, eligibilityNote: 'Commercial product support — not Technical Support Engineer or SaaS Customer Support roles.' }),
    r('Graduate Product Manager (Commercial Product)', 'graduate_entry', 'Graduate entry managing commercial product requirements, market feedback and launch planning.', { priority: 30, eligibilityNote: 'Graduate commercial product manager — not Graduate Software Developer or Technical Product Manager routes.' }),
    r('Trainee Product Manager (Business Offering)', 'graduate_entry', 'Trainee developing product lifecycle skills for non-software commercial or service offerings.', { priority: 40, eligibilityNote: 'Trainee business product manager — not Associate Product Manager (Software) or UX Designer trainee.' }),
    r('Junior Product Manager (Commercial Product)', 'junior_practitioner', 'Owns feature sets and roadmaps for commercial products with sales and operations stakeholders.', { priority: 50, eligibilityNote: 'Junior commercial product manager — not Junior Software Product Owner or Engineering Product Manager.' }),
    r('Associate Product Manager (Consumer Offering)', 'junior_practitioner', 'Supports consumer product portfolios, packaging updates and channel performance analysis.', { priority: 60, eligibilityNote: 'Associate consumer product manager — not Associate Software Engineer or Digital Product Designer.' }),
    r('Product Manager (Commercial Product)', 'practitioner', 'Manages commercial product strategy, pricing inputs and go-to-market for business-led offerings.', { priority: 70, eligibilityNote: 'Commercial product manager — not Software Product Manager, Platform Product Manager or Backend Developer.' }),
    r('Product Manager (Business Services)', 'practitioner', 'Owns business services product propositions, client feedback loops and service packaging.', { priority: 80, eligibilityNote: 'Business services product manager — not IT Product Manager or API Product Manager roles.' }),
    r('Senior Product Manager (Commercial Portfolio)', 'experienced_manager', 'Leads commercial product portfolio decisions, P&L inputs and cross-functional launch governance.', { priority: 90, eligibilityNote: 'Senior commercial portfolio PM — not Senior Technical Product Manager or Engineering Manager.' }),
    r('Product Portfolio Manager (Commercial Lines)', 'senior_manager_specialist', 'Manages portfolio prioritisation, lifecycle retirement and commercial product investment cases.', { priority: 100, eligibilityNote: 'Commercial portfolio manager — not IT Portfolio Manager or Project Portfolio Manager (APM) alone.' }),
    r('Product Director (Non-Software Offering)', 'senior_manager_specialist', 'Senior product leadership for commercial, consumer or service offerings outside software engineering.', { priority: 110, eligibilityNote: 'Product director non-software — not Director of Product (Software) or VP Engineering product org.' }),
    r('Head of Product (Commercial)', 'head_programme_leadership', 'Leads commercial product management function, methodology and product council governance.', { priority: 120, eligibilityNote: 'Head of commercial product — not Head of Product (Digital/Software) or Head of Engineering.' }),
    r('Director of Product Management (Commercial)', 'director_executive', 'Executive ownership of commercial product strategy, portfolio investment and product organisation.', { priority: 130, eligibilityNote: 'Director commercial product — not CTO, CPO (Software) or Director of Software Development.', academicRequirement: 'masters_relevant' }),
    r('Independent Product Management Consultant (Commercial)', 'consultant_independent', 'Advises organisations on commercial product strategy, portfolio rationalisation and launch excellence.', { priority: 140, eligibilityNote: 'Independent commercial PM consultant — not Agile Coach or Software Architecture Consultant.' }),
  ],
}

// ---------------------------------------------------------------------------
// 8) Innovation Management (~14 roles)
// ---------------------------------------------------------------------------
const INNOVATION_MANAGEMENT: SpecialismPack = {
  slug: 'innovation-management',
  label: 'Innovation Management',
  professionalBody: 'ISPIM / Chartered Management Institute (CMI)',
  relatedBodies: ['ISPIM', 'CMI', 'Innovate UK context'],
  sources: [...GOVERNANCE_SOURCES, 'ispim_innovation_management'],
  siblingSlugs: siblings('innovation-management'),
  roles: [
    r('Innovation Office Administrator', 'foundation_business_support', 'Supports innovation labs, hackathon logistics and idea submission platform administration.', { priority: 10, eligibilityNote: 'Innovation office admin — not R&D Laboratory Administrator or Software QA Administrator roles.' }),
    r('Innovation Programme Assistant', 'foundation_business_support', 'Assists innovation teams with pipeline tracking, workshop scheduling and venture intake records.', { priority: 20, eligibilityNote: 'Innovation programme assistant — not Marketing Campaign Assistant or PMO Administrator alone.' }),
    r('Graduate Innovation Analyst', 'graduate_entry', 'Graduate entry scanning trends, evaluating ideas and supporting innovation funnel reporting.', { priority: 30, eligibilityNote: 'Graduate innovation analyst — not Graduate Data Scientist or Research Scientist laboratory routes.' }),
    r('Trainee Innovation Manager', 'graduate_entry', 'Trainee developing ideation governance, pilot design and innovation metrics under senior mentors.', { priority: 40, eligibilityNote: 'Trainee innovation manager — not Trainee Product Manager (Commercial) or R&D Engineer trainee.' }),
    r('Junior Innovation Analyst', 'junior_practitioner', 'Supports innovation scouting, proof-of-concept planning and stakeholder engagement for new ideas.', { priority: 50, eligibilityNote: 'Junior innovation analyst — not Junior Business Analyst (IT change) or Junior UX Researcher.' }),
    r('Ideation Programme Coordinator', 'junior_practitioner', 'Runs ideation campaigns, challenge statements and employee innovation community events.', { priority: 60, eligibilityNote: 'Ideation coordinator — not Internal Communications Coordinator or HR Engagement roles.' }),
    r('Innovation Manager', 'practitioner', 'Owns innovation pipeline, stage-gate processes and commercialisation handoffs to business units.', { priority: 70, eligibilityNote: 'Innovation manager — not R&D Manager (technical labs) or Software Engineering Manager.' }),
    r('Open Innovation Manager', 'practitioner', 'Manages external partnerships, startup collaborations and co-innovation programmes.', { priority: 80, eligibilityNote: 'Open innovation manager — not Partnership Manager (sales) or Venture Capital Associate roles.' }),
    r('Senior Innovation Manager', 'experienced_manager', 'Leads enterprise innovation programmes, funding decisions and innovation culture initiatives.', { priority: 90, eligibilityNote: 'Senior innovation manager — not Senior Product Manager (Commercial) without innovation pipeline ownership.' }),
    r('Innovation Pipeline Manager', 'senior_manager_specialist', 'Manages innovation portfolio prioritisation, stage gates and venture incubation governance.', { priority: 100, eligibilityNote: 'Innovation pipeline manager — not Portfolio Manager (APM projects) or Investment Portfolio Manager (finance).' }),
    r('Corporate Venturing Lead', 'senior_manager_specialist', 'Leads corporate venture unit, CVC scouting and strategic investment partnerships.', { priority: 110, eligibilityNote: 'Corporate venturing lead — not Private Equity Associate or Angel Investor without corporate innovation remit.' }),
    r('Head of Innovation', 'head_programme_leadership', 'Leads innovation function, labs and executive innovation council governance.', { priority: 120, eligibilityNote: 'Head of innovation — not Head of R&D (technical) or Head of Digital Product (software).' }),
    r('Director of Innovation', 'director_executive', 'Executive ownership of innovation strategy, investment and organisational ambidexterity.', { priority: 130, eligibilityNote: 'Director of innovation — not CTO or Director of Research without business innovation accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Innovation Consultant', 'consultant_independent', 'Advises organisations on innovation operating models, funnel design and culture transformation.', { priority: 140, eligibilityNote: 'Independent innovation consultant — not Management Consultant generalist or Design Thinking freelancer alone.' }),
  ],
}

// ---------------------------------------------------------------------------
// 9) Franchise Management (~14 roles)
// ---------------------------------------------------------------------------
const FRANCHISE_MANAGEMENT: SpecialismPack = {
  slug: 'franchise-management',
  label: 'Franchise Management',
  professionalBody: 'British Franchise Association (bfa)',
  relatedBodies: ['bfa', 'CMI', 'Franchise UK'],
  sources: [...GOVERNANCE_SOURCES, 'bfa_franchise_careers'],
  siblingSlugs: siblings('franchise-management'),
  roles: [
    r('Franchise Support Administrator', 'foundation_business_support', 'Supports franchise operations with onboarding packs, compliance checklists and helpdesk administration.', { priority: 10, eligibilityNote: 'Franchise support admin — not Retail Store Assistant or Hospitality Front-of-House roles.' }),
    r('Franchise Operations Assistant', 'foundation_business_support', 'Assists franchise operations teams with performance reports, visit schedules and document control.', { priority: 20, eligibilityNote: 'Franchise operations assistant — not Logistics Coordinator or Warehouse Administrator roles.' }),
    r('Graduate Franchise Coordinator', 'graduate_entry', 'Graduate entry supporting franchisee recruitment pipelines, disclosure documents and onboarding.', { priority: 30, eligibilityNote: 'Graduate franchise coordinator — not Graduate Retail Manager or Estate Agent graduate schemes.' }),
    r('Trainee Franchise Manager', 'graduate_entry', 'Trainee developing franchise relationship management, brand standards and territory planning.', { priority: 40, eligibilityNote: 'Trainee franchise manager — not Trainee Area Manager (company-owned stores only) without franchise network.' }),
    r('Junior Franchise Manager', 'junior_practitioner', 'Supports franchisee performance reviews, operational visits and compliance remediation.', { priority: 50, eligibilityNote: 'Junior franchise manager — not Junior Operations Manager (wholly owned) or Regional Sales Manager alone.' }),
    r('Franchisee Relationship Coordinator', 'junior_practitioner', 'Coordinates franchisee communications, dispute escalation and network feedback forums.', { priority: 60, eligibilityNote: 'Franchisee relationship coordinator — not Customer Success Manager (B2B SaaS) or Account Manager roles.' }),
    r('Franchise Operations Manager', 'practitioner', 'Owns franchise operating standards, field support and network performance dashboards.', { priority: 70, eligibilityNote: 'Franchise operations manager — not Multi-Site Retail Manager (no franchisees) or Supply Chain Manager.' }),
    r('Area Franchise Manager', 'practitioner', 'Manages franchisees within a geographic territory, brand compliance and local marketing support.', { priority: 80, eligibilityNote: 'Area franchise manager — not Area Sales Manager (direct sales force) without franchisee accountability.' }),
    r('Senior Franchise Manager', 'experienced_manager', 'Leads franchise network development, franchisee selection and operational excellence programmes.', { priority: 90, eligibilityNote: 'Senior franchise manager — not Senior Operations Manager (owned estate) without franchising remit.' }),
    r('Franchise Brand Standards Manager', 'senior_manager_specialist', 'Owns brand standards audits, mystery shopping programmes and franchise quality assurance.', { priority: 100, eligibilityNote: 'Franchise brand standards — not Brand Marketing Manager or Quality Manager (manufacturing) alone.' }),
    r('Franchise Development Lead', 'senior_manager_specialist', 'Leads franchise expansion, master franchise negotiations and new market entry planning.', { priority: 110, eligibilityNote: 'Franchise development lead — not Business Development Director (non-franchise) or Property Development Lead.' }),
    r('Head of Franchising', 'head_programme_leadership', 'Leads franchising function, franchisee council governance and network strategy.', { priority: 120, eligibilityNote: 'Head of franchising — not Head of Retail Operations (company-owned) or Head of Sales.' }),
    r('Director of Franchise Operations', 'director_executive', 'Executive ownership of franchise network performance, legal compliance and franchisor capability.', { priority: 130, eligibilityNote: 'Director franchise operations — not Managing Director (single franchisee unit) or COO without franchisor remit.', academicRequirement: 'masters_relevant' }),
    r('Independent Franchise Consultant', 'consultant_independent', 'Advises franchisors and franchisees on network design, disclosure compliance and operational improvement.', { priority: 140, eligibilityNote: 'Independent franchise consultant — not Business Broker or Commercial Property Consultant alone.' }),
  ],
}

// ---------------------------------------------------------------------------
// 10) Export and Trade Management (~14 roles)
// ---------------------------------------------------------------------------
const EXPORT_AND_TRADE: SpecialismPack = {
  slug: 'export-and-trade-management',
  label: 'Export and Trade Management',
  professionalBody: 'Institute of Export & International Trade (IOE&IT)',
  relatedBodies: ['IOE&IT', 'BCC', 'HMRC trade context'],
  sources: [...GOVERNANCE_SOURCES, 'ioeit_export_careers'],
  siblingSlugs: siblings('export-and-trade-management'),
  roles: [
    r('Export Documentation Administrator', 'foundation_business_support', 'Prepares export documentation, shipping paperwork and customs invoice support under supervision.', { priority: 10, eligibilityNote: 'Export documentation admin — not Import Clerk (freight forwarder only) or Warehouse Operative roles.' }),
    r('Trade Compliance Assistant', 'foundation_business_support', 'Assists trade compliance teams with classification research, licence records and audit files.', { priority: 20, eligibilityNote: 'Trade compliance assistant — not Legal Paralegal or Financial Compliance AML roles.' }),
    r('Graduate Export Coordinator', 'graduate_entry', 'Graduate entry coordinating export orders, Incoterms application and logistics handoffs.', { priority: 30, eligibilityNote: 'Graduate export coordinator — not Graduate Supply Chain Analyst (domestic only) or Customs Broker trainee (brokerage firm).' }),
    r('Trainee International Trade Specialist', 'graduate_entry', 'Trainee developing export controls, trade agreements and customs procedures knowledge.', { priority: 40, eligibilityNote: 'Trainee international trade — not Trainee Freight Forwarder or Import-Export Clerk without trade management scope.' }),
    r('Junior Export Manager', 'junior_practitioner', 'Supports export programme delivery, distributor agreements and market entry documentation.', { priority: 50, eligibilityNote: 'Junior export manager — not Junior Sales Manager (domestic) or Logistics Manager routes.' }),
    r('Import-Export Coordinator (Trade Operations)', 'junior_practitioner', 'Coordinates import-export shipments, customs entries and trade finance documentation.', { priority: 60, eligibilityNote: 'Import-export coordinator trade — not Shipping Coordinator (port operations) or Procurement Coordinator.' }),
    r('Export Manager', 'practitioner', 'Owns export strategy for assigned markets, compliance and distributor performance.', { priority: 70, eligibilityNote: 'Export manager — not International Sales Manager without export compliance accountability.' }),
    r('International Trade Manager', 'practitioner', 'Manages international trade operations, customs processes and cross-border supply arrangements.', { priority: 80, eligibilityNote: 'International trade manager — not Global Supply Chain Manager without trade compliance remit.' }),
    r('Senior Export Manager', 'experienced_manager', 'Leads export programmes, market expansion and trade risk mitigation across regions.', { priority: 90, eligibilityNote: 'Senior export manager — not Senior International Business Development Manager without trade operations ownership.' }),
    r('Customs and Trade Facilitation Manager', 'senior_manager_specialist', 'Owns customs facilitation, bonded warehouse processes and trade agreement utilisation.', { priority: 100, eligibilityNote: 'Customs trade facilitation — not Customs Broker (third-party brokerage) or HMRC Border Force roles.' }),
    r('Global Trade Compliance Lead', 'senior_manager_specialist', 'Leads export controls, sanctions screening and trade compliance governance programmes.', { priority: 110, eligibilityNote: 'Global trade compliance lead — not Financial Crime Compliance Manager or Legal Trade Counsel alone.' }),
    r('Head of International Trade', 'head_programme_leadership', 'Leads international trade function, export policy and trade regulatory relationships.', { priority: 120, eligibilityNote: 'Head of international trade — not Head of Global Sales or Head of Supply Chain without trade remit.' }),
    r('Director of Export and Trade', 'director_executive', 'Executive ownership of export strategy, trade compliance and international market operations.', { priority: 130, eligibilityNote: 'Director export and trade — not Commercial Director or COO without export/trade accountability.', academicRequirement: 'masters_relevant' }),
    r('Independent Export and Trade Consultant', 'consultant_independent', 'Advises businesses on export readiness, trade compliance and market entry strategy.', { priority: 140, eligibilityNote: 'Independent export consultant — not Freight Forwarding Consultant or International Tax Advisor alone.' }),
  ],
}

// ---------------------------------------------------------------------------
// 11) Business Systems and ERP — business functional (~14 roles)
// ---------------------------------------------------------------------------
const BUSINESS_SYSTEMS_AND_ERP: SpecialismPack = {
  slug: 'business-systems-and-erp',
  label: 'Business Systems and ERP',
  professionalBody: 'Chartered Management Institute (CMI) / BCS (business systems context)',
  relatedBodies: ['CMI', 'BCS', 'SAP', 'Microsoft Dynamics'],
  sources: [...GOVERNANCE_SOURCES, 'bcs_business_systems'],
  siblingSlugs: siblings('business-systems-and-erp'),
  roles: [
    r('ERP Support Administrator (Business Systems)', 'foundation_business_support', 'Provides first-line ERP user support, access requests and training schedule administration.', { priority: 10, eligibilityNote: 'ERP support admin business — not IT Service Desk Engineer or Software Developer apprentice routes.' }),
    r('Business Systems Assistant', 'foundation_business_support', 'Assists business systems teams with process documentation, UAT scheduling and change logs.', { priority: 20, eligibilityNote: 'Business systems assistant — not Healthcare ERP Assistant (clinical systems) or IT Helpdesk roles.' }),
    r('Graduate ERP Functional Analyst', 'graduate_entry', 'Graduate entry supporting ERP module configuration, process mapping and user acceptance testing.', { priority: 30, eligibilityNote: 'Graduate ERP functional analyst — not Graduate Software Developer or Backend Developer ERP customisation routes.' }),
    r('Trainee Business Systems Consultant', 'graduate_entry', 'Trainee developing ERP process design, workshop facilitation and business change documentation.', { priority: 40, eligibilityNote: 'Trainee business systems consultant — not Trainee SAP Basis Administrator or Cloud Engineer trainee.' }),
    r('Junior ERP Functional Consultant', 'junior_practitioner', 'Supports ERP functional configuration for finance, HR or supply chain under senior consultants.', { priority: 50, eligibilityNote: 'Junior ERP functional consultant — not Junior ABAP Developer, Junior CRM Developer or IT Backend Developer.' }),
    r('Business Process Configuration Analyst', 'junior_practitioner', 'Maps business processes to ERP workflows, gap analysis and configuration specifications.', { priority: 60, eligibilityNote: 'Business process configuration — not Business Analyst (non-ERP) or Process Engineer (manufacturing).' }),
    r('ERP Functional Consultant (Finance Module)', 'practitioner', 'Delivers finance module configuration, chart of accounts design and period-end process alignment.', { priority: 70, eligibilityNote: 'ERP finance functional — not Financial Accountant, Management Accountant or ERP Technical Developer.' }),
    r('ERP Functional Consultant (Supply Chain Module)', 'practitioner', 'Configures procurement, inventory and order management processes within ERP platforms.', { priority: 80, eligibilityNote: 'ERP supply chain functional — not Supply Chain Planner or Warehouse Systems Engineer roles.' }),
    r('Senior ERP Functional Consultant', 'experienced_manager', 'Leads complex ERP module rollouts, blueprinting and business stakeholder sign-off.', { priority: 90, eligibilityNote: 'Senior ERP functional — not Senior ERP Technical Consultant (ABAP/X++) or Solutions Architect (IT).' }),
    r('Business Systems Transformation Manager', 'experienced_manager', 'Leads ERP-led transformation, process re-engineering and change adoption programmes.', { priority: 100, eligibilityNote: 'Business systems transformation — not IT Programme Manager (infrastructure) or Software Delivery Manager.' }),
    r('ERP Programme Lead (Business Systems)', 'senior_manager_specialist', 'Leads ERP implementation workstreams from business process perspective with functional consultants.', { priority: 110, eligibilityNote: 'ERP programme lead business — not ERP Technical Lead (development) or Cloud Migration Lead.' }),
    r('Head of Business Systems', 'head_programme_leadership', 'Leads business systems function, ERP governance and process ownership standards.', { priority: 120, eligibilityNote: 'Head of business systems — not Head of IT, Head of Software Engineering or Head of Healthcare Informatics.' }),
    r('Director of Business Systems and ERP', 'director_executive', 'Executive ownership of ERP strategy, business process platforms and systems transformation.', { priority: 130, eligibilityNote: 'Director business systems ERP — not CTO, Director of Software Engineering or NHS ERP Programme Director (clinical).', academicRequirement: 'masters_relevant' }),
    r('Independent ERP Functional Consultant', 'consultant_independent', 'Advises clients on ERP process design, module selection and business-led implementation.', { priority: 140, eligibilityNote: 'Independent ERP functional consultant — not Independent Software Developer or IT Infrastructure Consultant.' }),
  ],
}

// ---------------------------------------------------------------------------
// 12) Data-informed Business Management (~14 roles)
// ---------------------------------------------------------------------------
const DATA_INFORMED_BUSINESS: SpecialismPack = {
  slug: 'data-informed-business-management',
  label: 'Data-informed Business Management',
  professionalBody: 'Chartered Management Institute (CMI) / Royal Statistical Society (context)',
  relatedBodies: ['CMI', 'RSS', 'CIPFA (public sector MI context)'],
  sources: [...GOVERNANCE_SOURCES, 'cipfa_management_information'],
  siblingSlugs: siblings('data-informed-business-management'),
  roles: [
    r('MI Reporting Administrator', 'foundation_business_support', 'Supports management information teams with report distribution, data extracts and dashboard access.', { priority: 10, eligibilityNote: 'MI reporting admin — not Data Entry Clerk or Database Administrator roles.' }),
    r('Business Data Support Assistant', 'foundation_business_support', 'Assists business performance teams with spreadsheet models, KPI trackers and meeting packs.', { priority: 20, eligibilityNote: 'Business data support — not IT Data Engineer or Software QA Data roles.' }),
    r('Graduate Management Information Analyst', 'graduate_entry', 'Graduate entry building MI reports, KPI dashboards and business performance commentary.', { priority: 30, eligibilityNote: 'Graduate MI analyst — not Graduate Data Scientist, ML Engineer or BI Developer (IT engineering) routes.' }),
    r('Trainee Business Performance Analyst', 'graduate_entry', 'Trainee developing performance measurement, variance analysis and executive reporting skills.', { priority: 40, eligibilityNote: 'Trainee business performance — not Trainee Financial Analyst (accounting) or Trainee Data Analyst (IT).' }),
    r('Junior MI Analyst', 'junior_practitioner', 'Produces recurring management reports, data validation and ad-hoc business analysis.', { priority: 50, eligibilityNote: 'Junior MI analyst — not Junior Data Scientist or Junior Analytics Engineer roles.' }),
    r('Management Information Coordinator', 'junior_practitioner', 'Coordinates MI calendars, data quality checks and stakeholder report requirements.', { priority: 60, eligibilityNote: 'MI coordinator — not Project Coordinator or PMO Reporting roles without MI ownership.' }),
    r('MI Analyst', 'practitioner', 'Owns management information packs, KPI definitions and business unit performance reporting.', { priority: 70, eligibilityNote: 'MI analyst — not Data Scientist, Machine Learning Engineer or Research Statistician roles.' }),
    r('Business Performance Analyst', 'practitioner', 'Analyses business performance trends, drivers and recommendations for operational leaders.', { priority: 80, eligibilityNote: 'Business performance analyst — not Financial Accountant or Marketing Analyst (campaign) roles.' }),
    r('Senior MI Analyst', 'experienced_manager', 'Leads MI standards, complex performance analysis and cross-functional reporting programmes.', { priority: 90, eligibilityNote: 'Senior MI analyst — not Senior Data Scientist or Senior Analytics Engineer (IT product).' }),
    r('Commercial Insights Manager', 'senior_manager_specialist', 'Translates commercial data into actionable insights for sales, pricing and product leadership.', { priority: 100, eligibilityNote: 'Commercial insights manager — not Marketing Insights Manager (consumer research) or Revenue Operations (SaaS).' }),
    r('Business Intelligence Manager (Management Reporting)', 'senior_manager_specialist', 'Leads business intelligence for management reporting, not IT data platform engineering.', { priority: 110, eligibilityNote: 'BI manager management reporting — not Head of Data Science or Head of Data Engineering.' }),
    r('Head of Management Information', 'head_programme_leadership', 'Leads MI function, KPI governance and executive reporting standards.', { priority: 120, eligibilityNote: 'Head of MI — not Head of Data, Head of Analytics (IT) or Head of Finance (FP&A).' }),
    r('Director of Business Performance and MI', 'director_executive', 'Executive ownership of performance management, MI capability and decision-support analytics.', { priority: 130, eligibilityNote: 'Director business performance MI — not Chief Data Officer or Director of Data Science.', academicRequirement: 'masters_relevant' }),
    r('Independent MI and Business Performance Consultant', 'consultant_independent', 'Advises organisations on KPI design, MI maturity and performance reporting improvement.', { priority: 140, eligibilityNote: 'Independent MI consultant — not Data Science Consultant or Cloud Analytics Consultant.' }),
  ],
}

// ---------------------------------------------------------------------------
// 13) Business and Management Research — academic (~13 roles)
// ---------------------------------------------------------------------------
const BUSINESS_AND_MANAGEMENT_RESEARCH: SpecialismPack = {
  slug: 'business-and-management-research',
  label: 'Business and Management Research',
  professionalBody: 'British Academy of Management (BAM) / ABS',
  relatedBodies: ['BAM', 'ABS', 'ESRC'],
  sources: [...GOVERNANCE_SOURCES, 'bam_academic_careers', 'vitae_researcher_development'],
  siblingSlugs: siblings('business-and-management-research'),
  roles: [
    r('Graduate Research Assistant (Business and Management)', 'graduate_entry', 'Entry research support collecting data, literature reviews and survey administration for management studies.', { priority: 10, eligibilityNote: 'Graduate research assistant management — not Graduate Management Trainee (industry) or Graduate Data Analyst routes.', isResearchRole: true }),
    r('Business Research Associate (University)', 'practitioner', 'Supports applied management research projects, case study fieldwork and research dissemination.', { priority: 20, eligibilityNote: 'Business research associate — not Management Consultant or Business Analyst industry roles.', isResearchRole: true }),
    r('Research Assistant (Management Studies)', 'junior_practitioner', 'Assists faculty with qualitative and quantitative management research, coding and bibliography.', { priority: 30, eligibilityNote: 'Research assistant management studies — not Research Assistant (Clinical) or CRA pharmaceutical roles.', isResearchRole: true }),
    r('Research Programme Lead (Management Studies)', 'senior_manager_specialist', 'Leads multi-partner management research programmes, grant coordination and research team supervision.', { priority: 40, eligibilityNote: 'Research programme lead management — not Programme Manager (industry delivery) or Head of PMO.', isResearchRole: true }),
    r('Doctoral Researcher (Business and Management)', 'academic_research', 'PhD candidate conducting original research in business and management disciplines.', { priority: 50, eligibilityNote: 'Doctoral researcher business — not DBA industry executive part-time without research degree remit.', isResearchRole: true, isAcademicRole: false, academicRequirement: 'phd_relevant' }),
    r('Postdoctoral Research Fellow (Management Studies)', 'academic_research', 'Postdoctoral researcher on fixed-term contracts advancing management theory and empirical studies.', { priority: 60, eligibilityNote: 'Management studies postdoc — not Postdoctoral Fellow (Economics) or Postdoc (Computer Science).', isResearchRole: true, isAcademicRole: false, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Applied Management)', 'academic_research', 'Research fellow leading grant-funded applied management research with publication outputs.', { priority: 70, eligibilityNote: 'Applied management research fellow — not Industry Research Manager (corporate R&D non-academic).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Lecturer in Business and Management', 'academic_research', 'Early-career academic teaching business and management with developing research portfolio.', { priority: 80, eligibilityNote: 'Lecturer business management — not Senior Lecturer in Economics or Accounting without management focus.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Business and Management', 'academic_research', 'Experienced academic with substantial teaching and research leadership in business schools.', { priority: 90, eligibilityNote: 'Senior lecturer business — not Senior Lecturer in Marketing (separate discipline) unless dual appointment.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Reader in Business and Management', 'academic_research', 'Senior academic reader with national research recognition and doctoral supervision.', { priority: 100, eligibilityNote: 'Reader business management — not Reader in Finance or Reader in HR Management without broader remit.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Business and Management', 'academic_research', 'Professor leading research centre, doctoral programmes and international management scholarship.', { priority: 110, eligibilityNote: 'Professor business management — not Professor of Accounting or Professor of Economics alone.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Department (Business School)', 'head_programme_leadership', 'Academic head of business school department with research strategy and faculty leadership.', { priority: 120, eligibilityNote: 'Head of department business school — not Dean of Faculty (whole faculty) or Industry HR Director.', isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Director of Research (Business School)', 'director_executive', 'Executive academic leadership of business school research strategy, REF preparation and centres.', { priority: 130, eligibilityNote: 'Director of research business school — not Director of R&D (corporate) or Director of Innovation (industry).', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

// ---------------------------------------------------------------------------
// 14) Organisational Behaviour — academic (~13 roles)
// ---------------------------------------------------------------------------
const ORGANISATIONAL_BEHAVIOUR: SpecialismPack = {
  slug: 'organisational-behaviour',
  label: 'Organisational Behaviour',
  professionalBody: 'British Academy of Management / Academy of Management (OB division context)',
  relatedBodies: ['BAM', 'AOM', 'CIPD (applied overlap)'],
  sources: [...GOVERNANCE_SOURCES, 'bam_organisational_behaviour'],
  siblingSlugs: siblings('organisational-behaviour'),
  roles: [
    r('Graduate Research Assistant (Organisational Behaviour)', 'graduate_entry', 'Supports OB research including survey design, interview transcription and workplace behaviour studies.', { priority: 10, eligibilityNote: 'Graduate RA OB — not HR Graduate Scheme (industry) or Occupational Psychology BPS practitioner routes.', isResearchRole: true }),
    r('Workplace Behaviour Research Analyst', 'practitioner', 'Analyses workplace behaviour datasets and contributes to applied OB research outputs.', { priority: 20, eligibilityNote: 'Workplace behaviour analyst — not People Analytics Manager (HR industry) or Data Scientist roles.', isResearchRole: true }),
    r('Research Assistant (Organisational Psychology)', 'junior_practitioner', 'Assists OB faculty with psychometric analysis, lab studies and organisational field research.', { priority: 30, eligibilityNote: 'Research assistant organisational psychology — not Assistant Psychologist (NHS HCPC) or I/O practitioner consultant.', isResearchRole: true }),
    r('Organisational Behaviour Research Associate', 'practitioner', 'Conducts field research on teams, culture and leadership behaviours under principal investigator supervision.', { priority: 40, eligibilityNote: 'OB research associate — not Organisational Development Consultant (industry) or HR Business Partner.', isResearchRole: true }),
    r('Doctoral Researcher (Organisational Behaviour)', 'academic_research', 'PhD candidate researching organisational behaviour, culture, teams or leadership phenomena.', { priority: 50, eligibilityNote: 'Doctoral researcher OB — not Occupational Psychology Doctorate ( practitioner) unless research PhD route.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Postdoctoral Research Fellow (Organisational Behaviour)', 'academic_research', 'Postdoctoral OB researcher on funded projects in business schools or research institutes.', { priority: 60, eligibilityNote: 'OB postdoc — not Postdoctoral Fellow (Psychology clinical) or Postdoc (Sociology general).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Workplace Behaviour)', 'academic_research', 'Research fellow publishing on workplace behaviour, motivation and organisational dynamics.', { priority: 70, eligibilityNote: 'Workplace behaviour research fellow — not Employee Engagement Manager (industry HR).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Lecturer in Organisational Behaviour', 'academic_research', 'Teaches OB modules and develops research on teams, culture and workplace psychology.', { priority: 80, eligibilityNote: 'Lecturer OB — not Lecturer in Occupational Psychology (BPS practitioner focus) without OB research.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Organisational Behaviour', 'academic_research', 'Senior academic with established OB research and postgraduate teaching leadership.', { priority: 90, eligibilityNote: 'Senior lecturer OB — not Senior Lecturer in HRM (industrial relations focus) unless dual OB appointment.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Reader in Organisational Psychology', 'academic_research', 'Reader-level academic with international OB/psychology research profile and PhD supervision.', { priority: 100, eligibilityNote: 'Reader organisational psychology — not Reader in Clinical Psychology or Reader in Sociology.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Organisational Behaviour', 'academic_research', 'Professor leading OB research centre, executive education and doctoral supervision.', { priority: 110, eligibilityNote: 'Professor OB — not Professor of Human Resource Management or Professor of Work Psychology alone.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Organisational Behaviour Research Group', 'head_programme_leadership', 'Leads OB research group, grant strategy and interdisciplinary collaboration within business school.', { priority: 120, eligibilityNote: 'Head OB research group — not Head of Organisational Development (industry) or Head of HR.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Director of Organisational Studies (Business School)', 'director_executive', 'Executive academic leadership of organisational studies division, research and faculty development.', { priority: 130, eligibilityNote: 'Director organisational studies — not Director of People (industry) or Director of OD consulting firm.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

// ---------------------------------------------------------------------------
// 15) Entrepreneurship Research — academic (~13 roles)
// ---------------------------------------------------------------------------
const ENTREPRENEURSHIP_RESEARCH: SpecialismPack = {
  slug: 'entrepreneurship-research',
  label: 'Entrepreneurship Research',
  professionalBody: 'Institute for Small Business and Entrepreneurship (ISBE) / BAM',
  relatedBodies: ['ISBE', 'BAM', 'Entrepreneurship scholars community'],
  sources: [...GOVERNANCE_SOURCES, 'isbe_academic_careers'],
  siblingSlugs: siblings('entrepreneurship-research'),
  roles: [
    r('Graduate Research Assistant (Entrepreneurship)', 'graduate_entry', 'Supports entrepreneurship research including venture case studies, survey fieldwork and database building.', { priority: 10, eligibilityNote: 'Graduate RA entrepreneurship — not Startup Founder or Business Development Graduate industry routes.', isResearchRole: true }),
    r('Venture Ecosystem Research Analyst', 'practitioner', 'Analyses startup ecosystem data, venture financing trends and entrepreneurship policy research.', { priority: 20, eligibilityNote: 'Venture ecosystem analyst — not Venture Capital Analyst (investment) or Startup Operations Manager.', isResearchRole: true }),
    r('Research Assistant (Entrepreneurial Studies)', 'junior_practitioner', 'Assists faculty with qualitative venture research, entrepreneur interviews and coding.', { priority: 30, eligibilityNote: 'Research assistant entrepreneurial studies — not Incubator Manager (industry) or Accelerator Programme Manager.', isResearchRole: true }),
    r('Entrepreneurship Research Associate', 'practitioner', 'Conducts applied entrepreneurship research for business schools, innovation agencies or think tanks.', { priority: 40, eligibilityNote: 'Entrepreneurship research associate — not Small Business Advisor (FSB) or Business Coach industry roles.', isResearchRole: true }),
    r('Doctoral Researcher (Entrepreneurship)', 'academic_research', 'PhD candidate researching entrepreneurship, venture creation, scaling or entrepreneurial ecosystems.', { priority: 50, eligibilityNote: 'Doctoral researcher entrepreneurship — not MBA student consulting project or Founder CEO roles.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Postdoctoral Research Fellow (Entrepreneurship)', 'academic_research', 'Postdoctoral researcher on entrepreneurship grants, venture studies and policy evaluation.', { priority: 60, eligibilityNote: 'Entrepreneurship postdoc — not Postdoc (Economics) or Postdoc (Innovation Management industry).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Venture Creation)', 'academic_research', 'Research fellow studying venture creation processes, business model innovation and founder behaviour.', { priority: 70, eligibilityNote: 'Venture creation research fellow — not Head of Startup Studio (corporate) or Venture Builder (industry).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Lecturer in Entrepreneurship Research', 'academic_research', 'Teaches entrepreneurship modules and develops scholarly research on ventures and ecosystems.', { priority: 80, eligibilityNote: 'Lecturer entrepreneurship research — not Lecturer in Entrepreneurship (practice teaching) without PhD research track.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Entrepreneurship', 'academic_research', 'Senior academic with entrepreneurship research portfolio and MBA/executive teaching.', { priority: 90, eligibilityNote: 'Senior lecturer entrepreneurship — not Senior Lecturer in Innovation Management (industry-facing) alone.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Reader in Entrepreneurial Studies', 'academic_research', 'Reader with international entrepreneurship scholarship and doctoral supervision leadership.', { priority: 100, eligibilityNote: 'Reader entrepreneurial studies — not Reader in Finance or Reader in Strategy without entrepreneurship focus.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Entrepreneurship', 'academic_research', 'Professor leading entrepreneurship research centre, spin-out policy and doctoral programmes.', { priority: 110, eligibilityNote: 'Professor entrepreneurship — not Professor of Innovation (technical R&D) or Professor of Economics.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Entrepreneurship Research Centre', 'head_programme_leadership', 'Leads university entrepreneurship research centre, grants and industry-academic partnerships.', { priority: 120, eligibilityNote: 'Head entrepreneurship research centre — not Head of Incubator (industry) or Head of Innovation (corporate).', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Director of Entrepreneurship Research (Business School)', 'director_executive', 'Executive academic leadership of entrepreneurship research strategy and faculty development.', { priority: 130, eligibilityNote: 'Director entrepreneurship research — not Director of Enterprise (university commercialisation) without academic research remit.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

// ---------------------------------------------------------------------------
// 16) Strategy Research — academic (~13 roles)
// ---------------------------------------------------------------------------
const STRATEGY_RESEARCH: SpecialismPack = {
  slug: 'strategy-research',
  label: 'Strategy Research',
  professionalBody: 'Strategic Management Society / British Academy of Management',
  relatedBodies: ['SMS', 'BAM', 'Academy of Management (STR division)'],
  sources: [...GOVERNANCE_SOURCES, 'sms_academic_careers'],
  siblingSlugs: siblings('strategy-research'),
  roles: [
    r('Graduate Research Assistant (Strategic Management)', 'graduate_entry', 'Supports strategy research including competitive analysis datasets, case archives and literature reviews.', { priority: 10, eligibilityNote: 'Graduate RA strategic management — not Strategy Consultant graduate (industry) or Graduate Analyst (investment bank).', isResearchRole: true }),
    r('Competitive Strategy Research Analyst', 'practitioner', 'Analyses industry structure, competitive dynamics and strategy datasets for academic research projects.', { priority: 20, eligibilityNote: 'Competitive strategy research analyst — not Competitive Intelligence Analyst (corporate) or Equity Research Analyst.', isResearchRole: true }),
    r('Research Assistant (Strategy Research)', 'junior_practitioner', 'Assists strategy faculty with case writing, archival research and quantitative strategy studies.', { priority: 30, eligibilityNote: 'Research assistant strategy — not Business Analyst (IT) or Management Consultant analyst roles.', isResearchRole: true }),
    r('Strategy Research Associate', 'practitioner', 'Conducts applied strategy research for business schools, think tanks or policy institutes.', { priority: 40, eligibilityNote: 'Strategy research associate — not Strategy Manager (industry) or Corporate Strategy Analyst (in-house).', isResearchRole: true }),
    r('Doctoral Researcher (Strategic Management)', 'academic_research', 'PhD candidate researching strategic management, competitive advantage or corporate strategy phenomena.', { priority: 50, eligibilityNote: 'Doctoral researcher strategy — not MBA strategy elective student or Strategy Director industry role.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Postdoctoral Research Fellow (Strategy)', 'academic_research', 'Postdoctoral strategy researcher on funded projects in business schools or research centres.', { priority: 60, eligibilityNote: 'Strategy postdoc — not Postdoctoral Fellow (Economics IO) unless explicit strategy faculty appointment.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Competitive Strategy)', 'academic_research', 'Research fellow publishing on competitive strategy, industry evolution and firm performance.', { priority: 70, eligibilityNote: 'Competitive strategy research fellow — not Corporate Strategy Manager (industry) or Head of Strategy (corporate).', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Lecturer in Strategy Research', 'academic_research', 'Teaches strategic management modules and develops scholarly research on strategy topics.', { priority: 80, eligibilityNote: 'Lecturer strategy research — not Lecturer in Strategic Management (practice MBA teaching) without PhD research track.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Strategic Management', 'academic_research', 'Senior academic with strategy research portfolio and executive MBA teaching leadership.', { priority: 90, eligibilityNote: 'Senior lecturer strategy — not Senior Lecturer in Marketing Strategy (marketing discipline) unless dual appointment.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Reader in Strategy', 'academic_research', 'Reader with international strategy scholarship and doctoral supervision in business schools.', { priority: 100, eligibilityNote: 'Reader strategy — not Reader in Finance or Reader in Operations Management without strategy focus.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Strategic Management', 'academic_research', 'Professor leading strategy research centre, doctoral programmes and international scholarship.', { priority: 110, eligibilityNote: 'Professor strategic management — not Professor of Economics or Professor of International Business alone.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Strategy Research Group', 'head_programme_leadership', 'Leads strategy research group, grant applications and interdisciplinary strategy collaborations.', { priority: 120, eligibilityNote: 'Head strategy research group — not Head of Corporate Strategy (industry) or Head of Consulting.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Director of Strategy Research (Business School)', 'director_executive', 'Executive academic leadership of strategy research division and faculty research strategy.', { priority: 130, eligibilityNote: 'Director strategy research — not Director of Strategy (corporate) or Strategy Consulting Partner.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

// ---------------------------------------------------------------------------
// 17) Operations Management Research — academic (~13 roles)
// ---------------------------------------------------------------------------
const OPERATIONS_MANAGEMENT_RESEARCH: SpecialismPack = {
  slug: 'operations-management-research',
  label: 'Operations Management Research',
  professionalBody: 'European Operations Management Association (EurOMA) / BAM',
  relatedBodies: ['EurOMA', 'BAM', 'POMS'],
  sources: [...GOVERNANCE_SOURCES, 'euroma_academic_careers'],
  siblingSlugs: siblings('operations-management-research'),
  roles: [
    r('Graduate Research Assistant (Operations Management)', 'graduate_entry', 'Supports operations management research including process data, supply chain studies and simulation support.', { priority: 10, eligibilityNote: 'Graduate RA operations management — not Graduate Supply Chain Analyst (industry) or Operations Graduate Scheme alone.', isResearchRole: true }),
    r('Service Operations Research Analyst', 'practitioner', 'Analyses service operations datasets and contributes to academic research on operations performance.', { priority: 20, eligibilityNote: 'Service operations research analyst — not Operations Analyst (industry MI) or Data Scientist roles.', isResearchRole: true }),
    r('Research Assistant (Operations Management Research)', 'junior_practitioner', 'Assists OM faculty with empirical studies, survey design and optimisation model testing.', { priority: 30, eligibilityNote: 'Research assistant OM — not Research Assistant (Mathematics OR) unless business school OM appointment.', isResearchRole: true }),
    r('Operations Management Research Associate', 'practitioner', 'Conducts applied operations research for business schools, logistics institutes or policy bodies.', { priority: 40, eligibilityNote: 'OM research associate — not Operations Manager (industry) or Supply Chain Planner roles.', isResearchRole: true }),
    r('Doctoral Researcher (Operations Management)', 'academic_research', 'PhD candidate researching operations, supply chain, service systems or process innovation.', { priority: 50, eligibilityNote: 'Doctoral researcher OM — not EngD Manufacturing student (engineering faculty) unless business school PhD.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Postdoctoral Research Fellow (Operations Management)', 'academic_research', 'Postdoctoral OM researcher on funded projects in business schools or research institutes.', { priority: 60, eligibilityNote: 'OM postdoc — not Postdoctoral Fellow (Industrial Engineering) unless explicit OM business school role.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Service Operations)', 'academic_research', 'Research fellow publishing on service operations, queueing, capacity and service quality.', { priority: 70, eligibilityNote: 'Service operations research fellow — not Service Delivery Manager (industry) or Contact Centre Manager.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Lecturer in Operations Management', 'academic_research', 'Teaches operations management modules and develops scholarly research on OM topics.', { priority: 80, eligibilityNote: 'Lecturer OM — not Lecturer in Engineering Management (engineering faculty) unless business school appointment.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Operations Management', 'academic_research', 'Senior academic with OM research portfolio and postgraduate programme leadership.', { priority: 90, eligibilityNote: 'Senior lecturer OM — not Senior Lecturer in Logistics (vocational) without research PhD track.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Reader in Operations Management', 'academic_research', 'Reader with international OM scholarship and doctoral supervision in business schools.', { priority: 100, eligibilityNote: 'Reader OM — not Reader in Supply Chain Management (industry-facing) without academic research profile.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Operations Management', 'academic_research', 'Professor leading OM research centre, doctoral programmes and industry-academic partnerships.', { priority: 110, eligibilityNote: 'Professor OM — not Professor of Industrial Engineering or Professor of Manufacturing Systems alone.', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Operations Management Research', 'head_programme_leadership', 'Leads OM research group, grant strategy and collaborations with logistics and service sectors.', { priority: 120, eligibilityNote: 'Head OM research — not Head of Operations (industry) or Head of Supply Chain (corporate).', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Director of Operations Research (Business School)', 'director_executive', 'Executive academic leadership of operations management research division and faculty development.', { priority: 130, eligibilityNote: 'Director operations research business school — not Director of Operations (corporate) or Management Scientist (industry).', isResearchRole: true, isAcademicRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

export const GOVERNANCE_SPECIALIST_PACKS: SpecialismPack[] = [
  CORPORATE_GOVERNANCE,
  ENTERPRISE_RISK_MANAGEMENT,
  BUSINESS_CONTINUITY,
  INTERNAL_CONTROLS,
  CORPORATE_RESPONSIBILITY,
  ESG_AND_SUSTAINABILITY,
  PRODUCT_MANAGEMENT,
  INNOVATION_MANAGEMENT,
  FRANCHISE_MANAGEMENT,
  EXPORT_AND_TRADE,
  BUSINESS_SYSTEMS_AND_ERP,
  DATA_INFORMED_BUSINESS,
  BUSINESS_AND_MANAGEMENT_RESEARCH,
  ORGANISATIONAL_BEHAVIOUR,
  ENTREPRENEURSHIP_RESEARCH,
  STRATEGY_RESEARCH,
  OPERATIONS_MANAGEMENT_RESEARCH,
]
