import { r, type SpecialismPack } from './shared'

const RESEARCH_OPS_SIBLINGS = [
  'laboratory-science',
  'scientific-research',
  'research-management',
  'science-policy',
  'science-communication',
  'scientific-publishing',
  'laboratory-management',
  'scientific-quality-and-compliance',
]

function siblings(except: string) {
  return RESEARCH_OPS_SIBLINGS.filter((s) => s !== except)
}

const RESEARCH_OPS_SOURCES = [
  'prospects_scientist_uk',
  'national_careers_service_scientist',
  'ukri_research_careers',
  'arma_research_management',
  'rqa_quality_assurance',
]

// ---------------------------------------------------------------------------
// 1) Laboratory Science — cross-cutting laboratory practice (~16 roles)
// ---------------------------------------------------------------------------
const LABORATORY_SCIENCE: SpecialismPack = {
  slug: 'laboratory-science',
  label: 'Laboratory Science',
  professionalBody: 'Institute of Science & Technology (IST) / Royal Society of Biology (RSB)',
  relatedBodies: ['IST', 'RSB', 'Royal Society of Chemistry'],
  sources: RESEARCH_OPS_SOURCES,
  siblingSlugs: siblings('laboratory-science'),
  roles: [
    r(
      'Laboratory Science Apprentice',
      'foundation_technical_entry',
      'Apprenticeship route into bench preparation, basic assays and laboratory housekeeping under qualified scientific supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Technical laboratory apprenticeship — not Healthcare Science STP, Biomedical Science IBMS portfolio or IT laboratory informatics roles.',
      }
    ),
    r(
      'Trainee Laboratory Technician (Scientific)',
      'foundation_technical_entry',
      'Entry technician learning standard operating procedures, sample handling and equipment maintenance in research or industrial laboratories.',
      {
        priority: 20,
        eligibilityNote:
          'Trainee scientific technician — not Medical Laboratory Assistant in NHS pathology or Engineering workshop technician.',
      }
    ),
    r(
      'Graduate Laboratory Scientist',
      'graduate_entry',
      'Graduate entry performing supervised bench work, data recording and method support following relevant science degree training.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate laboratory scientist — not Graduate Data Analyst, Software Developer or HCPC Biomedical Scientist registrant routes.',
      }
    ),
    r(
      'Laboratory Technician (Scientific Support)',
      'scientific_practitioner',
      'Delivers routine and semi-routine laboratory tasks, reagent preparation and quality checks for scientific programmes.',
      {
        priority: 40,
        eligibilityNote:
          'Scientific support technician — not Clinical Laboratory Assistant in patient-facing diagnostic services.',
      }
    ),
    r(
      'Bench Laboratory Technician',
      'scientific_practitioner',
      'Runs established protocols on analytical or preparative benches with growing independence and troubleshooting capability.',
      {
        priority: 50,
        eligibilityNote:
          'Bench technician in scientific settings — not Manufacturing Production Technician or Engineering test technician.',
      }
    ),
    r(
      'Research Support Laboratory Technician',
      'scientific_practitioner',
      'Supports grant-funded experiments, specimen processing and laboratory logistics for university or institute research groups.',
      {
        priority: 60,
        eligibilityNote:
          'Research support technician — not Clinical Research Associate in pharmaceutical trial monitoring.',
        isResearchRole: true,
      }
    ),
    r(
      'Laboratory Scientist',
      'experienced_scientist',
      'Owns method execution, result interpretation support and day-to-day laboratory delivery for scientific projects.',
      {
        priority: 70,
        eligibilityNote:
          'Experienced laboratory scientist — not Analytical Chemist discipline lead titles owned by Chemistry specialism packs.',
      }
    ),
    r(
      'Analytical Laboratory Scientist',
      'experienced_scientist',
      'Performs validated analytical measurements, instrument calibration support and method adherence in regulated or R&D laboratories.',
      {
        priority: 80,
        eligibilityNote:
          'Analytical laboratory scientist — not Data Scientist, ML Engineer or BI Analyst reporting roles.',
      }
    ),
    r(
      'Senior Laboratory Scientist',
      'specialist_scientist',
      'Leads complex bench programmes, trains junior staff and contributes to method improvement within laboratory teams.',
      {
        priority: 90,
        eligibilityNote:
          'Senior laboratory scientist — not Senior Biomedical Scientist in NHS pathology without cross-discipline laboratory remit.',
      }
    ),
    r(
      'Specialist Laboratory Scientist (Methods Development)',
      'specialist_scientist',
      'Develops and optimises laboratory methods, validation documentation and technical guidance for specialist scientific work.',
      {
        priority: 100,
        eligibilityNote:
          'Methods specialist — not Quality Assurance Manager or Laboratory Operations Manager leadership titles.',
      }
    ),
    r(
      'Principal Laboratory Scientist',
      'senior_principal_scientist',
      'Technical authority for laboratory science standards, complex investigations and cross-team scientific problem-solving.',
      {
        priority: 110,
        eligibilityNote:
          'Principal laboratory scientist — not Principal Investigator academic research leadership unless dual remit advertised.',
      }
    ),
    r(
      'Lead Laboratory Scientist',
      'research_lab_leadership',
      'Leads laboratory workstreams, coordinates bench resources and mentors technicians and junior scientists.',
      {
        priority: 120,
        eligibilityNote:
          'Laboratory science team lead — not Engineering Team Lead or IT Infrastructure Lead.',
      }
    ),
    r(
      'Laboratory Methods Lead (Scientific)',
      'research_lab_leadership',
      'Owns method libraries, training programmes and technical consistency across multi-group laboratory operations.',
      {
        priority: 130,
        eligibilityNote:
          'Methods leadership — not Head of Quality Assurance or Research Group Leader academic PI roles.',
      }
    ),
    r(
      'Research Laboratory Technician (University)',
      'academic_research',
      'Provides technical support to academic research laboratories including equipment, samples and health-and-safety compliance.',
      {
        priority: 140,
        eligibilityNote:
          'University research laboratory technician — not Postdoctoral Research Associate or Doctoral Researcher academic track.',
        academicRequirement: 'degree_relevant',
        fitClassification: 'realistic_next',
      }
    ),
    r(
      'Head of Laboratory Science Services',
      'research_lab_leadership',
      'Leads laboratory service delivery, staffing and scientific support standards across research or industrial science facilities.',
      {
        priority: 150,
        eligibilityNote:
          'Head of laboratory science services — not plain Laboratory Manager title used in NHS biomedical pathology contexts.',
      }
    ),
    r(
      'Director of Laboratory Science (Research Organisation)',
      'executive_scientific_director',
      'Executive ownership of laboratory science capability, capital equipment strategy and cross-site scientific support functions.',
      {
        priority: 160,
        eligibilityNote:
          'Director laboratory science — not Director of Engineering, IT Operations or Clinical Laboratory Services in NHS trusts.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 2) Scientific Research — general research careers (~18 roles)
// ---------------------------------------------------------------------------
const SCIENTIFIC_RESEARCH: SpecialismPack = {
  slug: 'scientific-research',
  label: 'Scientific Research',
  professionalBody: 'UK Research and Innovation (UKRI) context / Learned societies',
  relatedBodies: ['UKRI', 'Royal Society', 'Wellcome Trust'],
  sources: [...RESEARCH_OPS_SOURCES, 'vitae_researcher_development'],
  siblingSlugs: siblings('scientific-research'),
  roles: [
    r(
      'Graduate Research Assistant',
      'graduate_entry',
      'Entry research support role collecting data, maintaining records and assisting experiments under principal investigator supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Graduate research assistant — not Research Assistant (Clinical Psychology Doctorate Route) or Clinical Research Associate.',
        isResearchRole: true,
      }
    ),
    r(
      'Research Assistant (Scientific Research)',
      'scientific_practitioner',
      'Supports active research projects through literature reviews, experimental assistance and dataset collation in scientific settings.',
      {
        priority: 20,
        eligibilityNote:
          'Scientific research assistant — not Healthcare clinical research nursing or pharmaceutical CRA monitoring roles.',
        isResearchRole: true,
      }
    ),
    r(
      'Junior Research Scientist',
      'scientific_practitioner',
      'Early-career scientist contributing to hypothesis testing, experimental design support and analysis on research programmes.',
      {
        priority: 30,
        eligibilityNote:
          'Junior research scientist — not Junior Data Scientist, AI Engineer or Software Developer in tech firms.',
        isResearchRole: true,
      }
    ),
    r(
      'Research Technician (Grant-Funded Project)',
      'scientific_practitioner',
      'Technical delivery on funded research contracts including instrumentation, field sampling or laboratory execution.',
      {
        priority: 40,
        eligibilityNote:
          'Grant-funded research technician — not Engineering R&D technician or IT systems technician.',
        isResearchRole: true,
      }
    ),
    r(
      'Research Scientist',
      'experienced_scientist',
      'Designs and delivers scientific investigations, interprets findings and contributes to publications or technical reports.',
      {
        priority: 50,
        eligibilityNote:
          'Research scientist — not Data Scientist predictive modelling or Clinical Scientist HCPC practitioner routes.',
        isResearchRole: true,
      }
    ),
    r(
      'Experimental Research Scientist',
      'experienced_scientist',
      'Leads experimental workstreams, protocol refinement and reproducibility practices on multi-disciplinary research projects.',
      {
        priority: 60,
        eligibilityNote:
          'Experimental research scientist — not Experimental Psychologist clinical HCPC route or Mechanical Test Engineer.',
        isResearchRole: true,
      }
    ),
    r(
      'Senior Research Scientist',
      'specialist_scientist',
      'Senior contributor shaping research direction, mentoring juniors and owning significant scientific work packages.',
      {
        priority: 70,
        eligibilityNote:
          'Senior research scientist — not Senior Software Engineer or Senior Biomedical Scientist NHS pathology lead.',
        isResearchRole: true,
      }
    ),
    r(
      'Principal Research Scientist',
      'senior_principal_scientist',
      'Principal scientific contributor with organisation-wide research credibility and complex programme accountability.',
      {
        priority: 80,
        eligibilityNote:
          'Principal research scientist — not Principal Clinical Scientist or Principal Engineer product development titles.',
        isResearchRole: true,
      }
    ),
    r(
      'Lead Research Scientist',
      'senior_principal_scientist',
      'Technical lead coordinating research squads, methods standards and stakeholder scientific communication.',
      {
        priority: 90,
        eligibilityNote:
          'Lead research scientist — not Lead Data Scientist or Engineering Research Team Lead outside scientific research.',
        isResearchRole: true,
      }
    ),
    r(
      'Research Group Leader',
      'research_lab_leadership',
      'Leads a defined research group’s scientific agenda, people development and grant delivery in institute or industry R&D.',
      {
        priority: 100,
        eligibilityNote:
          'Research group leader — not Engineering Group Leader or IT Delivery Lead without scientific research remit.',
        isResearchRole: true,
      }
    ),
    r(
      'Doctoral Researcher',
      'academic_research',
      'PhD candidate conducting original research, producing thesis outputs and contributing to academic publications.',
      {
        priority: 110,
        eligibilityNote:
          'Doctoral researcher on PhD programme — not Postdoctoral Research Associate or Graduate Research Assistant employed post.',
        isResearchRole: true,
        academicRequirement: 'degree_relevant',
        fitClassification: 'academic_or_research',
      }
    ),
    r(
      'Postdoctoral Research Associate',
      'academic_research',
      'Fixed-term post-PhD researcher delivering grant objectives, co-authoring papers and developing independent research profile.',
      {
        priority: 120,
        eligibilityNote:
          'Postdoctoral research associate — not Clinical Research Fellow medical training or CRA pharmaceutical role.',
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
        fitClassification: 'academic_or_research',
      }
    ),
    r(
      'Research Fellow (Scientific)',
      'academic_research',
      'Fellowship-holder advancing a defined research programme with publication, collaboration and grant development expectations.',
      {
        priority: 130,
        eligibilityNote:
          'Scientific research fellow — not Research Fellow (Clinical Trials) or industry Research Fellow in non-academic HR titles only.',
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
        fitClassification: 'academic_or_research',
      }
    ),
    r(
      'Senior Research Fellow',
      'academic_research',
      'Established fellow leading substantial research portfolios, supervising doctoral researchers and securing major funding.',
      {
        priority: 140,
        eligibilityNote:
          'Senior research fellow — not Senior Lecturer academic teaching post unless dual research fellowship advertised.',
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
        fitClassification: 'academic_or_research',
      }
    ),
    r(
      'Principal Investigator (Scientific Research)',
      'academic_research',
      'Named scientific lead accountable for research design, ethics, funding stewardship and research team delegation.',
      {
        priority: 150,
        eligibilityNote:
          'Principal investigator for scientific research — not Principal Investigator (Clinical Trials, NHS) medically accountable role.',
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
        fitClassification: 'academic_or_research',
      }
    ),
    r(
      'Head of Research (Scientific Institute)',
      'research_lab_leadership',
      'Leads institute research strategy, portfolio coordination and senior researcher recruitment across scientific domains.',
      {
        priority: 160,
        eligibilityNote:
          'Head of scientific research — not Head of IT Research, Head of Data Science or NHS R&D director clinical remit.',
        isResearchRole: true,
      }
    ),
    r(
      'Director of Scientific Research',
      'executive_scientific_director',
      'Executive leadership of enterprise or institute research programmes, partnerships and long-range scientific investment.',
      {
        priority: 170,
        eligibilityNote:
          'Director of scientific research — not Director of Software Engineering or Director of Clinical Research operations.',
        isResearchRole: true,
      }
    ),
    r(
      'Chief Research Scientist (Institute)',
      'executive_scientific_director',
      'Senior scientific executive setting research vision, external scientific representation and cross-disciplinary research standards.',
      {
        priority: 180,
        eligibilityNote:
          'Chief research scientist — not Chief Data Officer, Chief Technology Officer or Chief Medical Officer roles.',
        isResearchRole: true,
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 3) Research Management — ARMA-aligned (~16 roles)
// ---------------------------------------------------------------------------
const RESEARCH_MANAGEMENT: SpecialismPack = {
  slug: 'research-management',
  label: 'Research Management',
  professionalBody: 'Association of Research Managers and Administrators (ARMA)',
  relatedBodies: ['ARMA', 'UKRI', 'Universities UK'],
  sources: [...RESEARCH_OPS_SOURCES, 'arma_professional_standards'],
  siblingSlugs: siblings('research-management'),
  roles: [
    r(
      'Research Administration Apprentice',
      'foundation_technical_entry',
      'Apprenticeship supporting research office processes, document management and compliance administration in HEIs or institutes.',
      {
        priority: 10,
        eligibilityNote:
          'Research administration apprenticeship — not general Business Administration or NHS medical records apprenticeship.',
      }
    ),
    r(
      'Graduate Research Administrator',
      'graduate_entry',
      'Graduate entry coordinating research submissions, filing and liaison between investigators and research support teams.',
      {
        priority: 20,
        eligibilityNote:
          'Graduate research administrator — not Graduate Management Trainee in unrelated corporate functions.',
      }
    ),
    r(
      'Research Support Officer',
      'scientific_practitioner',
      'Provides day-to-day research operations support including costing templates, deadline tracking and funder correspondence.',
      {
        priority: 30,
        eligibilityNote:
          'Research support officer — not Clinical Research Nurse or Trial Coordinator in NHS R&D delivery.',
      }
    ),
    r(
      'Research Grants Administrator',
      'scientific_practitioner',
      'Administers grant applications, award setup and funder reporting workflows for university or institute research offices.',
      {
        priority: 40,
        eligibilityNote:
          'Grants administrator — not Finance Grants Accountant without research office remit or charity fundraising officer.',
      }
    ),
    r(
      'Research Project Coordinator (University)',
      'experienced_scientist',
      'Coordinates multi-partner research projects, milestone tracking and consortium governance for funded programmes.',
      {
        priority: 50,
        eligibilityNote:
          'University research project coordinator — not IT Project Manager or Construction Project Manager.',
      }
    ),
    r(
      'Grants Officer',
      'experienced_scientist',
      'Manages grant portfolios, submission quality checks and post-award compliance for research organisations.',
      {
        priority: 60,
        eligibilityNote:
          'Grants officer in research management — not local authority grants officer for housing or business support.',
      }
    ),
    r(
      'Research Development Officer',
      'experienced_scientist',
      'Identifies funding opportunities, supports bid development and builds investigator-funder relationships.',
      {
        priority: 70,
        eligibilityNote:
          'Research development officer — not Business Development Manager in commercial sales without research remit.',
      }
    ),
    r(
      'Research Development Manager',
      'specialist_scientist',
      'Leads research development strategy, bid win rates and faculty support for major funding competitions.',
      {
        priority: 80,
        eligibilityNote:
          'Research development manager — not Product Development Manager in engineering or software companies.',
      }
    ),
    r(
      'Research Governance Officer',
      'specialist_scientist',
      'Supports research ethics, integrity and governance processes including committee administration and investigator guidance.',
      {
        priority: 90,
        eligibilityNote:
          'Research governance officer — not NHS Governance Manager for clinical governance without university research remit.',
      }
    ),
    r(
      'Research Governance Manager',
      'senior_principal_scientist',
      'Owns research governance frameworks, policy implementation and audit readiness across research portfolios (ARMA-aligned).',
      {
        priority: 100,
        eligibilityNote:
          'Research governance manager — not Data Governance Manager in IT or Clinical Governance Lead in NHS wards.',
      }
    ),
    r(
      'Research Operations Manager',
      'research_lab_leadership',
      'Manages research support services, workflow improvement and service-level delivery for research-intensive organisations.',
      {
        priority: 110,
        eligibilityNote:
          'Research operations manager — not IT Operations Manager or Manufacturing Operations Manager.',
      }
    ),
    r(
      'Head of Research Development',
      'research_lab_leadership',
      'Leads research development function, senior bid support and strategic funder engagement for HEI or research institute.',
      {
        priority: 120,
        eligibilityNote:
          'Head of research development — not Head of Business Development in commercial firms without research funding focus.',
      }
    ),
    r(
      'Head of Research Governance (University)',
      'research_lab_leadership',
      'Senior leadership of research ethics, integrity and regulatory compliance frameworks in higher education research.',
      {
        priority: 130,
        eligibilityNote:
          'Head of research governance — not Head of Quality in GMP manufacturing unless scientific research organisation.',
      }
    ),
    r(
      'Head of Research Services',
      'research_lab_leadership',
      'Leads consolidated research support including pre-award, post-award and research information management services.',
      {
        priority: 140,
        eligibilityNote:
          'Head of research services — not Head of HR Shared Services or Head of IT Service Desk.',
      }
    ),
    r(
      'Director of Research Services',
      'executive_scientific_director',
      'Executive ownership of research management functions, investment and organisational research support transformation.',
      {
        priority: 150,
        eligibilityNote:
          'Director of research services — not Director of IT Services or Director of Clinical Research in pharma without ARMA remit.',
      }
    ),
    r(
      'Director of Research Operations (HEI)',
      'executive_scientific_director',
      'Senior executive accountable for research administration strategy, systems and compliance at institutional scale.',
      {
        priority: 160,
        eligibilityNote:
          'Director research operations HEI — not Director of Engineering Operations or NHS R&D director clinical trials delivery.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 4) Science Policy (~15 roles)
// ---------------------------------------------------------------------------
const SCIENCE_POLICY: SpecialismPack = {
  slug: 'science-policy',
  label: 'Science Policy',
  professionalBody: 'Campaign for Science and Engineering (CaSE) / Learned societies',
  relatedBodies: ['CaSE', 'Royal Society', 'Government Office for Science'],
  sources: [...RESEARCH_OPS_SOURCES, 'case_science_policy'],
  siblingSlugs: siblings('science-policy'),
  roles: [
    r(
      'Graduate Policy Officer (Science)',
      'graduate_entry',
      'Graduate entry supporting science policy briefings, stakeholder mapping and evidence summaries for policy teams.',
      {
        priority: 10,
        eligibilityNote:
          'Graduate science policy officer — not general Civil Service Fast Stream policy without science specialism.',
      }
    ),
    r(
      'Science Policy Research Assistant',
      'scientific_practitioner',
      'Conducts background research, data gathering and literature synthesis to inform science policy recommendations.',
      {
        priority: 20,
        eligibilityNote:
          'Science policy research assistant — not Political Researcher in party headquarters without science focus.',
        isResearchRole: true,
      }
    ),
    r(
      'Evidence Review Officer (Science Policy)',
      'scientific_practitioner',
      'Coordinates systematic evidence reviews and expert input for policy consultations and parliamentary inquiries.',
      {
        priority: 30,
        eligibilityNote:
          'Evidence review officer — not NICE Evidence Reviewer for clinical guidelines unless science-policy remit explicit.',
      }
    ),
    r(
      'Science Policy Analyst',
      'experienced_scientist',
      'Analyses scientific trends, funding landscapes and regulatory developments to advise policy formulation.',
      {
        priority: 40,
        eligibilityNote:
          'Science policy analyst — not Data Analyst, Business Analyst or Health Policy Analyst clinical NHS focus.',
      }
    ),
    r(
      'Policy Adviser (Science)',
      'experienced_scientist',
      'Provides science-informed policy advice to government departments, agencies or learned societies on priority topics.',
      {
        priority: 50,
        eligibilityNote:
          'Policy adviser (science) — not generic Policy Adviser in unrelated domains without scientific evidence remit.',
      }
    ),
    r(
      'Regulatory Science Policy Adviser',
      'experienced_scientist',
      'Advises on science-regulatory interfaces including emerging technologies, standards and international policy alignment.',
      {
        priority: 60,
        eligibilityNote:
          'Regulatory science policy — not MHRA medicines assessor clinical licensing or legal regulatory solicitor roles.',
      }
    ),
    r(
      'Senior Science Policy Analyst',
      'specialist_scientist',
      'Leads complex policy analysis workstreams, stakeholder workshops and draft consultation responses.',
      {
        priority: 70,
        eligibilityNote:
          'Senior science policy analyst — not Senior Intelligence Analyst or Senior Data Scientist.',
      }
    ),
    r(
      'Senior Policy Adviser (Science)',
      'specialist_scientist',
      'Senior adviser shaping science policy positions, public affairs strategy and cross-department liaison.',
      {
        priority: 80,
        eligibilityNote:
          'Senior policy adviser science — not Senior Health Policy Adviser for NHS operational policy without science remit.',
      }
    ),
    r(
      'Science Policy Lead',
      'senior_principal_scientist',
      'Leads thematic science policy programmes, expert engagement and authoritative briefings for senior decision-makers.',
      {
        priority: 90,
        eligibilityNote:
          'Science policy lead — not Engineering Policy Lead or IT Digital Policy Lead unless scientific evidence core.',
      }
    ),
    r(
      'Parliamentary Science Adviser (Secondment)',
      'senior_principal_scientist',
      'Seconded specialist providing scientific scrutiny support to select committees and parliamentary offices.',
      {
        priority: 100,
        eligibilityNote:
          'Parliamentary science adviser secondment — not MP researcher without scientific qualification or remit.',
      }
    ),
    r(
      'Head of Science Policy',
      'research_lab_leadership',
      'Leads science policy team, work programme prioritisation and external stakeholder relationships for organisation.',
      {
        priority: 110,
        eligibilityNote:
          'Head of science policy — not Head of Public Affairs generic corporate lobbying without science focus.',
      }
    ),
    r(
      'Head of Policy (Learned Society)',
      'research_lab_leadership',
      'Leads policy function for scientific membership body including consultations, briefings and advocacy campaigns.',
      {
        priority: 120,
        eligibilityNote:
          'Head of policy learned society — not Head of Membership Services or Head of Events without policy accountability.',
      }
    ),
    r(
      'Director of Science Policy',
      'executive_scientific_director',
      'Executive leadership of science policy strategy, government relations and organisational policy influence.',
      {
        priority: 130,
        eligibilityNote:
          'Director of science policy — not Director of Corporate Affairs or Director of Clinical Policy in NHS.',
      }
    ),
    r(
      'Director of Evidence and Policy (Scientific)',
      'executive_scientific_director',
      'Senior executive integrating research evidence pipelines with policy outputs for national science institutions.',
      {
        priority: 140,
        eligibilityNote:
          'Director evidence and policy — not Director of Analytics or Director of Medical Affairs pharmaceutical commercial.',
      }
    ),
    r(
      'Chief Scientific Policy Adviser (Organisation)',
      'executive_scientific_director',
      'Top policy adviser setting organisational science policy stance, horizon scanning and senior stakeholder representation.',
      {
        priority: 150,
        eligibilityNote:
          'Chief scientific policy adviser — not Government Chief Scientific Adviser civil service role unless explicitly seconded.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 5) Science Communication (~16 roles)
// ---------------------------------------------------------------------------
const SCIENCE_COMMUNICATION: SpecialismPack = {
  slug: 'science-communication',
  label: 'Science Communication',
  professionalBody: 'British Science Association / Association of British Science Writers (ABSW)',
  relatedBodies: ['British Science Association', 'ABSW', 'STEM Learning'],
  sources: [...RESEARCH_OPS_SOURCES, 'absw_careers'],
  siblingSlugs: siblings('science-communication'),
  roles: [
    r(
      'Science Communication Apprentice',
      'foundation_technical_entry',
      'Apprenticeship supporting outreach events, content preparation and visitor engagement in museums or science centres.',
      {
        priority: 10,
        eligibilityNote:
          'Science communication apprenticeship — not Marketing Apprentice or Media Production Apprentice without science remit.',
      }
    ),
    r(
      'Graduate Science Communicator',
      'graduate_entry',
      'Graduate entry producing accessible science content, event support and stakeholder engagement materials.',
      {
        priority: 20,
        eligibilityNote:
          'Graduate science communicator — not Graduate Marketing Executive or Graduate Journalist general news desk.',
      }
    ),
    r(
      'Science Writer',
      'scientific_practitioner',
      'Writes articles, web copy and explanatory materials translating scientific research for public and specialist audiences.',
      {
        priority: 30,
        eligibilityNote:
          'Science writer — not Technical Writer for software documentation or Medical Writer pharmaceutical regulatory.',
      }
    ),
    r(
      'Public Engagement Officer (Science)',
      'scientific_practitioner',
      'Designs and delivers public engagement activities, community partnerships and evaluation for scientific organisations.',
      {
        priority: 40,
        eligibilityNote:
          'Public engagement officer science — not NHS Patient Engagement Officer or corporate PR officer without science focus.',
      }
    ),
    r(
      'Science Outreach Officer',
      'scientific_practitioner',
      'Coordinates school outreach, festival activities and widening-participation programmes for scientific institutions.',
      {
        priority: 50,
        eligibilityNote:
          'Science outreach officer — not University Widening Participation Officer without science programme delivery.',
      }
    ),
    r(
      'Museum Science Interpreter',
      'scientific_practitioner',
      'Delivers live interpretation, demonstrations and educational programmes in museum or science centre settings.',
      {
        priority: 60,
        eligibilityNote:
          'Museum science interpreter — not Gallery Educator in arts museums or Theme Park Entertainer.',
      }
    ),
    r(
      'Digital Science Content Producer',
      'experienced_scientist',
      'Produces video, social and multimedia science content with accuracy review and audience analytics.',
      {
        priority: 70,
        eligibilityNote:
          'Digital science content — not Social Media Manager for retail brands or Game Content Designer.',
      }
    ),
    r(
      'Podcast Producer (Science Media)',
      'experienced_scientist',
      'Researches, records and edits science podcast series with expert guests and factual checking workflows.',
      {
        priority: 80,
        eligibilityNote:
          'Science podcast producer — not general Podcast Producer for entertainment without science editorial accountability.',
      }
    ),
    r(
      'Senior Science Writer',
      'specialist_scientist',
      'Leads major writing commissions, editorial standards and mentoring of junior science communicators.',
      {
        priority: 90,
        eligibilityNote:
          'Senior science writer — not Senior Copywriter in advertising agencies without science specialism.',
      }
    ),
    r(
      'Science Engagement Manager',
      'senior_principal_scientist',
      'Manages engagement portfolios, funding bids for outreach and cross-institution collaboration on public science.',
      {
        priority: 100,
        eligibilityNote:
          'Science engagement manager — not Community Engagement Manager in local authority housing services.',
      }
    ),
    r(
      'Science Editor (Broadcast)',
      'specialist_scientist',
      'Editorial lead for broadcast science segments ensuring accuracy, balance and compliance with broadcaster guidelines.',
      {
        priority: 110,
        eligibilityNote:
          'Broadcast science editor — not News Editor general desk or Sports Editor without science portfolio.',
      }
    ),
    r(
      'Head of Science Communication',
      'research_lab_leadership',
      'Leads science communication team, brand voice and institutional reputation for research organisations.',
      {
        priority: 120,
        eligibilityNote:
          'Head of science communication — not Head of Corporate Communications generic PR without science editorial lead.',
      }
    ),
    r(
      'Head of Public Engagement (Science)',
      'research_lab_leadership',
      'Leads public engagement strategy, funder compliance (e.g. REF/UKRI pathways) and national partnership programmes.',
      {
        priority: 130,
        eligibilityNote:
          'Head of public engagement science — not Head of Customer Engagement in commercial SaaS companies.',
      }
    ),
    r(
      'Director of Science Communication',
      'executive_scientific_director',
      'Executive ownership of science communication strategy, media relations and organisational public trust.',
      {
        priority: 140,
        eligibilityNote:
          'Director of science communication — not Director of Marketing or Director of Communications non-science sector.',
      }
    ),
    r(
      'Director of Public Engagement (Research Institute)',
      'executive_scientific_director',
      'Senior executive accountable for institute-wide engagement, education partnerships and societal impact narrative.',
      {
        priority: 150,
        eligibilityNote:
          'Director public engagement research — not Director of Patient Experience in NHS clinical services.',
      }
    ),
    r(
      'Chief Communications Officer (Scientific Organisation)',
      'executive_scientific_director',
      'Top communications executive integrating science communication, media strategy and stakeholder trust for research body.',
      {
        priority: 160,
        eligibilityNote:
          'Chief communications officer scientific — not CMO in commercial firms or Chief Medical Officer health policy.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 6) Scientific Publishing (~16 roles)
// ---------------------------------------------------------------------------
const SCIENTIFIC_PUBLISHING: SpecialismPack = {
  slug: 'scientific-publishing',
  label: 'Scientific Publishing',
  professionalBody: 'ALPSP / Society publishers',
  relatedBodies: ['ALPSP', 'STM Association', 'Crossref'],
  sources: [...RESEARCH_OPS_SOURCES, 'alpsp_publishing_careers'],
  siblingSlugs: siblings('scientific-publishing'),
  roles: [
    r(
      'Publishing Apprentice (Scientific Journals)',
      'foundation_technical_entry',
      'Apprenticeship supporting manuscript tracking, editorial office administration and publisher workflow systems.',
      {
        priority: 10,
        eligibilityNote:
          'Scientific publishing apprenticeship — not general Publishing Assistant in trade fiction or newspapers.',
      }
    ),
    r(
      'Editorial Assistant (Scientific Publishing)',
      'graduate_entry',
      'Graduate entry coordinating peer review, author correspondence and journal production schedules.',
      {
        priority: 20,
        eligibilityNote:
          'Editorial assistant scientific — not Editorial Assistant in consumer magazines without STM journal remit.',
      }
    ),
    r(
      'Peer Review Coordinator (Journals)',
      'scientific_practitioner',
      'Manages reviewer invitations, timelines and editorial database records for scientific journal offices.',
      {
        priority: 30,
        eligibilityNote:
          'Peer review coordinator — not Clinical Trial Monitor or Research Ethics Committee coordinator.',
      }
    ),
    r(
      'Assistant Journal Editor',
      'scientific_practitioner',
      'Supports editors with manuscript assessment, reviewer selection and editorial decision preparation.',
      {
        priority: 40,
        eligibilityNote:
          'Assistant journal editor — not Assistant Editor in news media or Marketing Content Editor.',
      }
    ),
    r(
      'Copy Editor (Scientific Journals)',
      'scientific_practitioner',
      'Edits manuscripts for clarity, consistency and journal style while preserving scientific meaning.',
      {
        priority: 50,
        eligibilityNote:
          'Scientific copy editor — not Medical Writer regulatory submissions or Software Documentation Editor.',
      }
    ),
    r(
      'Production Editor (STM Publishing)',
      'experienced_scientist',
      'Oversees typesetting, proof stages and publication release for scientific journal or book programmes.',
      {
        priority: 60,
        eligibilityNote:
          'STM production editor — not Video Production Editor or Manufacturing Production Planner.',
      }
    ),
    r(
      'Journal Editor',
      'experienced_scientist',
      'Handles editorial decisions, scope alignment and quality standards for a scientific journal section or title.',
      {
        priority: 70,
        eligibilityNote:
          'Journal editor scientific — not Newspaper Editor or Social Media Editor without peer-review journal accountability.',
      }
    ),
    r(
      'Publishing Editor (STEM)',
      'experienced_scientist',
      'Develops STEM publishing lists, acquires titles or journal content and manages contributor relationships.',
      {
        priority: 80,
        eligibilityNote:
          'Publishing editor STEM — not Educational Publisher primary-school lists or Gaming Publisher.',
      }
    ),
    r(
      'Senior Journal Editor',
      'specialist_scientist',
      'Senior editorial authority for journal portfolio, editorial board engagement and publication ethics cases.',
      {
        priority: 90,
        eligibilityNote:
          'Senior journal editor — not Senior Content Manager in marketing teams without editorial independence.',
      }
    ),
    r(
      'Commissioning Editor (STM Publishing)',
      'specialist_scientist',
      'Commissions books, series or special issues with market analysis and subject expert networks in STM fields.',
      {
        priority: 100,
        eligibilityNote:
          'Commissioning editor STM — not Commissioning Editor in television or radio broadcasting.',
      }
    ),
    r(
      'Managing Editor (Scientific Journals)',
      'senior_principal_scientist',
      'Manages journal office operations, editor workflows and publication metrics for society or commercial publisher.',
      {
        priority: 110,
        eligibilityNote:
          'Managing editor scientific journals — not Managing Editor of general newspaper without STM peer review.',
      }
    ),
    r(
      'Open Access Publishing Manager',
      'senior_principal_scientist',
      'Leads open access policy implementation, licensing models and funder compliance for scientific publishing programmes.',
      {
        priority: 120,
        eligibilityNote:
          'Open access publishing manager — not Open Source Programme Manager in software foundations.',
      }
    ),
    r(
      'Head of Journal Publishing',
      'research_lab_leadership',
      'Leads journal portfolio strategy, editor recruitment and publishing partnerships for STM publisher or society.',
      {
        priority: 130,
        eligibilityNote:
          'Head of journal publishing — not Head of Digital Product in tech firms or Head of Marketing publishing house only.',
      }
    ),
    r(
      'Head of Editorial (STM Publisher)',
      'research_lab_leadership',
      'Senior editorial leadership across STM titles, ethics governance and editor-in-chief relationships.',
      {
        priority: 140,
        eligibilityNote:
          'Head of editorial STM — not Head of Editorial in non-scientific consumer media organisations.',
      }
    ),
    r(
      'Director of Scientific Publishing',
      'executive_scientific_director',
      'Executive ownership of scientific publishing strategy, revenue models and international publishing standards.',
      {
        priority: 150,
        eligibilityNote:
          'Director scientific publishing — not Director of Software Publishing or Director of Academic Marketing only.',
      }
    ),
    r(
      'Director of STM Publishing',
      'executive_scientific_director',
      'Senior executive leading science, technology and medicine publishing division for major UK or global publisher.',
      {
        priority: 160,
        eligibilityNote:
          'Director STM publishing — not Director of Data Products or Director of Engineering in technology companies.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 7) Laboratory Management (~16 roles)
// ---------------------------------------------------------------------------
const LABORATORY_MANAGEMENT: SpecialismPack = {
  slug: 'laboratory-management',
  label: 'Laboratory Management',
  professionalBody: 'Institute of Science & Technology (IST)',
  relatedBodies: ['IST', 'Health and Safety Executive', 'Royal Society of Chemistry'],
  sources: RESEARCH_OPS_SOURCES,
  siblingSlugs: siblings('laboratory-management'),
  roles: [
    r(
      'Laboratory Operations Apprentice',
      'foundation_technical_entry',
      'Apprenticeship learning laboratory logistics, stores control and operational support under laboratory operations supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Laboratory operations apprenticeship — not Warehouse Operative apprenticeship or NHS Porter apprenticeship.',
      }
    ),
    r(
      'Graduate Laboratory Operations Trainee',
      'graduate_entry',
      'Graduate trainee supporting scheduling, equipment bookings and operational procedures in research laboratory facilities.',
      {
        priority: 20,
        eligibilityNote:
          'Graduate laboratory operations trainee — not Graduate Facilities Manager in corporate offices without lab remit.',
      }
    ),
    r(
      'Laboratory Operations Coordinator',
      'scientific_practitioner',
      'Coordinates day-to-day laboratory operations including supplies, equipment readiness and user access processes.',
      {
        priority: 30,
        eligibilityNote:
          'Laboratory operations coordinator — not IT Service Desk Coordinator or HR Operations Coordinator.',
      }
    ),
    r(
      'Laboratory Inventory and Logistics Coordinator',
      'scientific_practitioner',
      'Manages chemical and consumable inventory, goods inward/outward and storage compliance for scientific laboratories.',
      {
        priority: 40,
        eligibilityNote:
          'Laboratory inventory coordinator — not Retail Stock Coordinator or NHS Pharmacy Stores without scientific lab scope.',
      }
    ),
    r(
      'Laboratory Safety Officer (Scientific)',
      'scientific_practitioner',
      'Supports COSHH, risk assessments, safety inspections and incident reporting in research or industrial laboratories.',
      {
        priority: 50,
        eligibilityNote:
          'Laboratory safety officer — not Construction Site Safety Officer or NHS Clinical Safety Officer.',
      }
    ),
    r(
      'Assistant Scientific Laboratory Operations Manager',
      'experienced_scientist',
      'Deputises for laboratory operations leadership covering staffing rosters, equipment maintenance and user services.',
      {
        priority: 60,
        eligibilityNote:
          'Assistant scientific laboratory operations manager — not Assistant Facilities Manager in non-laboratory estates.',
      }
    ),
    r(
      'Laboratory Facilities Coordinator (Research)',
      'experienced_scientist',
      'Coordinates laboratory space planning, equipment installations and refurbishment projects for research facilities.',
      {
        priority: 70,
        eligibilityNote:
          'Laboratory facilities coordinator — not Data Centre Facilities Engineer or Building Services Coordinator only.',
      }
    ),
    r(
      'Biosafety Coordinator (Research Laboratory)',
      'experienced_scientist',
      'Manages biosafety protocols, containment standards and training for microbiological or GMO laboratory work.',
      {
        priority: 80,
        eligibilityNote:
          'Biosafety coordinator research — not NHS Infection Prevention Nurse or clinical microbiology consultant roles.',
      }
    ),
    r(
      'Scientific Laboratory Operations Manager',
      'specialist_scientist',
      'Manages operational delivery, budgets and service standards for multi-user scientific laboratory facilities.',
      {
        priority: 90,
        eligibilityNote:
          'Scientific laboratory operations manager — not plain Laboratory Manager (Biomedical Science Services) NHS pathology title.',
      }
    ),
    r(
      'Laboratory Facilities Manager (Scientific)',
      'senior_principal_scientist',
      'Senior manager accountable for laboratory estate, critical equipment uptime and operational risk in scientific organisations.',
      {
        priority: 100,
        eligibilityNote:
          'Laboratory facilities manager scientific — not Estates Manager for non-laboratory university buildings only.',
      }
    ),
    r(
      'Laboratory Capital Projects Manager (Scientific)',
      'specialist_scientist',
      'Leads laboratory fit-out and equipment capital projects from specification through commissioning and handover.',
      {
        priority: 110,
        eligibilityNote:
          'Laboratory capital projects — not Construction Project Manager on civil infrastructure without lab technical input.',
      }
    ),
    r(
      'Head of Laboratory Operations',
      'research_lab_leadership',
      'Leads laboratory operations function, service performance and operational policy for research-intensive organisation.',
      {
        priority: 120,
        eligibilityNote:
          'Head of laboratory operations — not Head of IT Operations or Head of Manufacturing Plant Operations.',
      }
    ),
    r(
      'Head of Scientific Laboratory Services',
      'research_lab_leadership',
      'Leads shared scientific laboratory services, technical support teams and user community engagement.',
      {
        priority: 130,
        eligibilityNote:
          'Head of scientific laboratory services — not Head of Pathology Services NHS clinical diagnostic leadership.',
      }
    ),
    r(
      'Director of Scientific Laboratory Services',
      'executive_scientific_director',
      'Executive leadership of laboratory services portfolio, investment and cross-site operational strategy.',
      {
        priority: 140,
        eligibilityNote:
          'Director scientific laboratory services — not Director of Clinical Laboratory Medicine or Director of Engineering.',
      }
    ),
    r(
      'Director of Research Laboratory Infrastructure',
      'executive_scientific_director',
      'Senior executive accountable for research laboratory infrastructure, major equipment strategy and operational resilience.',
      {
        priority: 150,
        eligibilityNote:
          'Director research laboratory infrastructure — not Director of Cloud Infrastructure or Director of Property generic.',
      }
    ),
    r(
      'Chief Operating Officer (Research Laboratory Organisation)',
      'executive_scientific_director',
      'Top operational executive for research laboratory organisation integrating facilities, services and operational governance.',
      {
        priority: 160,
        eligibilityNote:
          'COO research laboratory organisation — not COO of software company or NHS Trust COO clinical operations.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// 8) Scientific Quality and Compliance (~16 roles)
// ---------------------------------------------------------------------------
const SCIENTIFIC_QUALITY_AND_COMPLIANCE: SpecialismPack = {
  slug: 'scientific-quality-and-compliance',
  label: 'Scientific Quality and Compliance',
  professionalBody: 'RQA / MHRA context (where applicable)',
  relatedBodies: ['RQA', 'MHRA', 'ISO technical committees'],
  sources: [...RESEARCH_OPS_SOURCES, 'rqa_glp_gmp_guidance'],
  siblingSlugs: siblings('scientific-quality-and-compliance'),
  roles: [
    r(
      'Quality Assurance Apprentice (Laboratory)',
      'foundation_technical_entry',
      'Apprenticeship supporting document control, audit preparation and quality system administration in scientific QA teams.',
      {
        priority: 10,
        eligibilityNote:
          'Laboratory QA apprenticeship — not ISO 9001 manufacturing quality apprenticeship without scientific GLP/GMP context.',
      }
    ),
    r(
      'Graduate Quality Assurance Officer (Scientific)',
      'graduate_entry',
      'Graduate entry supporting quality records, deviation logging and training compliance in research or testing laboratories.',
      {
        priority: 20,
        eligibilityNote:
          'Graduate QA officer scientific — not Graduate Internal Auditor in financial services or IT SOC audit.',
      }
    ),
    r(
      'Quality Assurance Technician (Laboratory)',
      'scientific_practitioner',
      'Maintains quality documentation, sample traceability checks and equipment qualification records in laboratory QA.',
      {
        priority: 30,
        eligibilityNote:
          'QA technician laboratory — not Production Quality Inspector on factory lines without scientific testing remit.',
      }
    ),
    r(
      'Laboratory Quality Coordinator',
      'scientific_practitioner',
      'Coordinates laboratory quality processes including CAPA tracking, SOP updates and audit action closure.',
      {
        priority: 40,
        eligibilityNote:
          'Laboratory quality coordinator — not NHS Quality Improvement Coordinator for clinical ward audits.',
      }
    ),
    r(
      'Audit Coordinator (Scientific Quality)',
      'scientific_practitioner',
      'Schedules internal and external audits, prepares evidence packs and tracks corrective actions for scientific QA.',
      {
        priority: 50,
        eligibilityNote:
          'Audit coordinator scientific — not IT ISO 27001 audit coordinator without laboratory quality remit.',
      }
    ),
    r(
      'GLP Quality Assurance Officer',
      'experienced_scientist',
      'Ensures Good Laboratory Practice compliance through study audits, data integrity review and inspector liaison.',
      {
        priority: 60,
        eligibilityNote:
          'GLP QA officer — not GCP Quality Assurance Monitor in clinical trials or GMP QA in pharmaceutical manufacturing only.',
      }
    ),
    r(
      'GMP Compliance Specialist (Scientific)',
      'experienced_scientist',
      'Supports GMP compliance for scientific testing, batch release support or QC laboratories serving regulated products.',
      {
        priority: 70,
        eligibilityNote:
          'GMP compliance specialist scientific — not Qualified Person (QP) pharmaceutical release without advert stating QP.',
      }
    ),
    r(
      'Validation Specialist (Laboratory Systems)',
      'experienced_scientist',
      'Validates laboratory equipment, computerised systems and methods against quality and data integrity requirements.',
      {
        priority: 80,
        eligibilityNote:
          'Laboratory validation specialist — not Software Validation Engineer in IT GxP without laboratory equipment scope.',
      }
    ),
    r(
      'Quality Systems Officer (Research Organisation)',
      'experienced_scientist',
      'Maintains quality management system documentation, management review inputs and continuous improvement for research QA.',
      {
        priority: 90,
        eligibilityNote:
          'Quality systems officer research — not HR Systems Officer or Finance Systems Officer.',
      }
    ),
    r(
      'Senior GLP Quality Assurance Officer',
      'specialist_scientist',
      'Senior GLP auditor leading complex study inspections, vendor audits and quality investigation oversight.',
      {
        priority: 100,
        eligibilityNote:
          'Senior GLP QA — not Senior Clinical Quality Assurance Auditor in NHS R&D without GLP laboratory remit.',
      }
    ),
    r(
      'Regulatory Compliance Officer (Research)',
      'specialist_scientist',
      'Manages regulatory compliance interfaces for research testing including MHRA, OECD GLP and accreditation bodies.',
      {
        priority: 110,
        eligibilityNote:
          'Regulatory compliance officer research — not Financial Compliance Officer or GDPR Privacy Officer.',
      }
    ),
    r(
      'Quality Assurance Manager (Scientific)',
      'senior_principal_scientist',
      'Manages scientific QA function, audit programme, training and quality metrics for laboratory or CRO organisation.',
      {
        priority: 120,
        eligibilityNote:
          'QA manager scientific — not IT Service Quality Manager or NHS Ward Quality Manager clinical governance.',
      }
    ),
    r(
      'Head of Scientific Quality Assurance',
      'research_lab_leadership',
      'Leads quality assurance department, inspector readiness and quality culture across scientific operations.',
      {
        priority: 130,
        eligibilityNote:
          'Head of scientific QA — not Head of Software Quality Assurance in technology product companies.',
      }
    ),
    r(
      'Head of GLP/GMP Compliance (Scientific)',
      'research_lab_leadership',
      'Leads GLP/GMP compliance strategy, regulatory inspections and quality risk management for scientific organisation.',
      {
        priority: 140,
        eligibilityNote:
          'Head GLP/GMP compliance — not Head of Manufacturing Quality in engineering factories without scientific testing.',
      }
    ),
    r(
      'Director of Scientific Quality and Compliance',
      'executive_scientific_director',
      'Executive ownership of quality and compliance strategy, regulatory relationships and organisational accreditation.',
      {
        priority: 150,
        eligibilityNote:
          'Director scientific quality — not Director of Information Security Compliance or Director of Clinical Governance NHS.',
      }
    ),
    r(
      'Director of Laboratory Quality (Regulated Science)',
      'executive_scientific_director',
      'Senior executive accountable for laboratory quality systems, data integrity programme and multi-site QA governance.',
      {
        priority: 160,
        eligibilityNote:
          'Director laboratory quality — not Director of Data Quality in analytics organisations or NHS pathology quality director clinical.',
      }
    ),
  ],
}

export const RESEARCH_OPS_PACKS: SpecialismPack[] = [
  LABORATORY_SCIENCE,
  SCIENTIFIC_RESEARCH,
  RESEARCH_MANAGEMENT,
  SCIENCE_POLICY,
  SCIENCE_COMMUNICATION,
  SCIENTIFIC_PUBLISHING,
  LABORATORY_MANAGEMENT,
  SCIENTIFIC_QUALITY_AND_COMPLIANCE,
]
