import { r, type SpecialismPack } from './shared'

const MATH_EARTH_SIBLINGS = [
  'mathematics',
  'applied-mathematics',
  'statistics',
  'operational-research',
  'mathematical-modelling',
  'environmental-science',
  'earth-science',
  'geology',
  'geophysics',
  'geochemistry',
  'oceanography',
  'meteorology',
  'climate-science',
  'hydrology',
  'soil-science',
  'conservation-science',
] as const

function siblings(except: string) {
  return MATH_EARTH_SIBLINGS.filter((s) => s !== except)
}

const IMA_SOURCES = [
  'prospects_mathematician_uk',
  'ima_careers',
  'national_careers_service_mathematician',
  'learned_societies_mathematics',
]

const RSS_SOURCES = [
  'prospects_statistician_uk',
  'rss_careers',
  'ons_statistician_routes',
  'national_careers_service_statistician',
]

const OR_SOURCES = [
  'prospects_operational_researcher',
  'or_society_careers',
  'national_careers_service_analyst',
]

const IES_CIEEM_SOURCES = [
  'prospects_environmental_scientist',
  'ies_careers',
  'cieem_ecologist_routes',
  'national_careers_service_environmental',
]

const GSL_SOURCES = [
  'prospects_geologist_uk',
  'geological_society_careers',
  'chartered_geologist_cgeol',
  'national_careers_service_geologist',
]

const RMETS_SOURCES = [
  'prospects_meteorologist_uk',
  'rmets_careers',
  'met_office_careers',
  'national_careers_service_meteorologist',
]

const MARINE_SOURCES = [
  'prospects_oceanographer',
  'challenger_society_careers',
  'national_careers_service_marine_scientist',
]

const BHS_SOURCES = [
  'prospects_hydrologist',
  'british_hydrological_society',
  'ciwem_water_careers',
]

const BSSS_SOURCES = [
  'prospects_soil_scientist',
  'british_society_soil_science',
  'national_careers_service_agricultural',
]

const CONSERVATION_SOURCES = [
  'prospects_ecologist_uk',
  'cieem_chartered_ecologist',
  'national_careers_service_conservation',
  'bes_ecology_careers',
]

// ---------------------------------------------------------------------------
// Mathematical specialisms (IMA / RSS / OR Society)
// ---------------------------------------------------------------------------

const MATHEMATICS: SpecialismPack = {
  slug: 'mathematics',
  label: 'Mathematics',
  professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  relatedBodies: ['London Mathematical Society', 'Royal Statistical Society'],
  sources: IMA_SOURCES,
  siblingSlugs: siblings('mathematics'),
  roles: [
    r('Mathematics Computing Support Technician', 'foundation_technical_entry', 'Supports mathematical computing, proof-assistant tooling and departmental IT for research mathematics groups.', { priority: 10, eligibilityNote: 'Technical mathematics support — not general IT helpdesk or software engineering roles.' }),
    r('Mathematics Graduate Trainee', 'graduate_entry', 'Structured graduate entry into analytical, actuarial-adjacent or research-support mathematics roles.', { priority: 20, eligibilityNote: 'Pure/applied mathematics graduate entry — not Statistics or Operational Research specialist routes.' }),
    r('Graduate Mathematician', 'graduate_entry', 'First professional mathematics role applying rigorous analysis to industry, finance or research problems.', { priority: 30, eligibilityNote: 'Mathematics graduate practitioner — distinct from Data Analyst or IT graduate schemes.' }),
    r('Junior Mathematical Analyst', 'scientific_practitioner', 'Develops mathematical arguments, models and proofs under supervision in applied or industrial contexts.', { priority: 40, eligibilityNote: 'Junior mathematics practitioner — not Junior Statistician or Junior Data Scientist titles.' }),
    r('Mathematician (Analytical)', 'scientific_practitioner', 'Independent delivery of mathematical analysis, optimisation sketches and quantitative reasoning for scientific teams.', { priority: 50, eligibilityNote: 'Core mathematics practitioner — not Mathematical Modeller (dedicated modelling specialism).' }),
    r('Experienced Mathematician (Research Support)', 'experienced_scientist', 'Sustained ownership of mathematical methods for interdisciplinary research programmes.', { priority: 60, eligibilityNote: 'Experienced mathematics scientist — not Experienced Statistician or physicist titles.' }),
    r('Senior Mathematical Analyst', 'experienced_scientist', 'Leads complex analytical workstreams requiring advanced calculus, algebra or discrete methods.', { priority: 70, eligibilityNote: 'Senior mathematics band — experience-led, not automatic from Master’s alone.' }),
    r('Specialist Mathematician (Pure Mathematics)', 'specialist_scientist', 'Deep specialist in pure mathematical domains such as algebra, analysis or geometry for research delivery.', { priority: 80, eligibilityNote: 'Pure mathematics specialist — not Applied Mathematics or Statistics specialist routes.' }),
    r('Specialist Mathematician (Industrial Mathematics)', 'specialist_scientist', 'Domain specialist bridging mathematics with manufacturing, energy or defence quantitative problems.', { priority: 90, eligibilityNote: 'Industrial mathematics specialist — not Operational Research consultant or engineer.' }),
    r('Principal Mathematician', 'senior_principal_scientist', 'Principal-level mathematics authority setting methods standards and mentoring across programmes.', { priority: 100, eligibilityNote: 'Principal mathematics IC — not people-manager unless dual-hat role advertised.' }),
    r('Senior Principal Mathematician', 'senior_principal_scientist', 'Senior principal mathematician influencing organisation-wide quantitative strategy and peer review.', { priority: 110, eligibilityNote: 'Senior principal mathematics — PhD may help for research but is not automatic seniority.' }),
    r('Head of Mathematical Sciences (Research Group)', 'research_lab_leadership', 'Leads a mathematics research group, graduate training and grant portfolio in university or institute settings.', { priority: 120, eligibilityNote: 'Mathematics research leadership — not Head of Statistics or Physics.' }),
    r('Postdoctoral Research Fellow (Mathematics)', 'academic_research', 'Postdoctoral mathematics researcher on fellowship or project contracts in pure or applied mathematics.', { priority: 130, eligibilityNote: 'Mathematics postdoc — not Statistics postdoc or physics postdoc titles.', isResearchRole: true }),
    r('Lecturer in Mathematics', 'academic_research', 'HE lecturer teaching mathematics modules and supervising undergraduate projects.', { priority: 140, eligibilityNote: 'Mathematics academic teaching — not Mathematics Teacher (school) or Data Science lecturer.', isAcademicRole: true }),
    r('Director of Mathematical Sciences', 'executive_scientific_director', 'Executive leadership of mathematics research, consultancy or analytical functions.', { priority: 150, eligibilityNote: 'Executive mathematics leadership — not Chief Data Officer or IT director roles.' }),
  ],
}

const APPLIED_MATHEMATICS: SpecialismPack = {
  slug: 'applied-mathematics',
  label: 'Applied Mathematics',
  professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  relatedBodies: ['London Mathematical Society', 'Society for Industrial and Applied Mathematics (SIAM) context'],
  sources: IMA_SOURCES,
  siblingSlugs: siblings('applied-mathematics'),
  roles: [
    r('Scientific Computing Technician (Applied Mathematics)', 'foundation_technical_entry', 'Maintains numerical codes, HPC jobs and simulation environments for applied mathematics teams.', { priority: 10, eligibilityNote: 'Applied-math computing support — not Software Developer or data-engineering technician.' }),
    r('Applied Mathematics Graduate Trainee', 'graduate_entry', 'Graduate programme applying differential equations, linear algebra and numerical methods to real problems.', { priority: 20, eligibilityNote: 'Applied mathematics entry — not pure Mathematics graduate or Statistics graduate routes.' }),
    r('Graduate Applied Mathematician', 'graduate_entry', 'First applied mathematics role in industry, defence, energy or research institute contexts.', { priority: 30, eligibilityNote: 'Applied mathematics graduate — distinct from Mathematical Modelling graduate titles.' }),
    r('Junior Applied Mathematician', 'scientific_practitioner', 'Builds and validates applied mathematical models under supervision for engineering or science clients.', { priority: 40, eligibilityNote: 'Junior applied mathematics practitioner — not Junior Engineer or Junior Statistician.' }),
    r('Applied Mathematician', 'scientific_practitioner', 'Independent applied mathematician delivering modelling, asymptotics and numerical analysis for projects.', { priority: 50, eligibilityNote: 'Core applied mathematics role — not Mathematical Modeller (dedicated specialism) or physicist.' }),
    r('Applied Mathematician (Computational Methods)', 'experienced_scientist', 'Experienced in finite elements, finite differences and high-performance numerical schemes.', { priority: 60, eligibilityNote: 'Computational applied mathematics — not Computational Scientist (IT) or ML Engineer.' }),
    r('Applied Mathematician (Fluid Dynamics)', 'experienced_scientist', 'Experienced contributor in fluid-flow mathematics for aerospace, marine or environmental applications.', { priority: 70, eligibilityNote: 'Fluid dynamics mathematics — not CFD Engineer (mechanical) unless mathematics-led.' }),
    r('Specialist Applied Mathematician (Mathematical Biology)', 'specialist_scientist', 'Specialist in dynamical systems and stochastic models for biological and epidemiological systems.', { priority: 80, eligibilityNote: 'Mathematical biology specialist — not Biostatistician (Statistics specialism).' }),
    r('Specialist Applied Mathematician (Wave Propagation)', 'specialist_scientist', 'Specialist in wave equations, scattering and signal mathematics for acoustics or seismology contexts.', { priority: 90, eligibilityNote: 'Wave mathematics specialist — not Geophysicist (Earth Science specialism).' }),
    r('Senior Applied Mathematician', 'senior_principal_scientist', 'Senior applied mathematics authority on complex multi-physics and industrial modelling programmes.', { priority: 100, eligibilityNote: 'Senior applied mathematics — not Senior Data Scientist or engineering lead.' }),
    r('Principal Applied Mathematician', 'senior_principal_scientist', 'Principal IC setting applied mathematics standards, peer review and cross-team methods guidance.', { priority: 110, eligibilityNote: 'Principal applied mathematics — experience-led progression.' }),
    r('Lead Applied Mathematician (Research Team)', 'research_lab_leadership', 'Leads applied mathematics research team delivery, student supervision and grant writing.', { priority: 120, eligibilityNote: 'Applied mathematics team lead — not Head of Mathematical Modelling (separate specialism).' }),
    r('Postdoctoral Research Fellow (Applied Mathematics)', 'academic_research', 'Postdoctoral researcher in applied mathematics institutes or interdisciplinary science departments.', { priority: 130, eligibilityNote: 'Applied mathematics postdoc — not physics or engineering postdoc titles.', isResearchRole: true }),
    r('Lecturer in Applied Mathematics', 'academic_research', 'University lecturer teaching applied mathematics and supervising MSc projects.', { priority: 140, eligibilityNote: 'Applied mathematics academic — not Lecturer in Mathematics (pure) or Statistics.', isAcademicRole: true }),
    r('Director of Applied Mathematics', 'executive_scientific_director', 'Executive owner of applied mathematics capability across consultancy, R&D or national laboratory.', { priority: 150, eligibilityNote: 'Executive applied mathematics — not Director of Data Science or Engineering.' }),
  ],
}

const STATISTICS: SpecialismPack = {
  slug: 'statistics',
  label: 'Statistics',
  professionalBody: 'Royal Statistical Society (RSS)',
  relatedBodies: ['Office for National Statistics', 'Institute of Mathematics and its Applications'],
  sources: RSS_SOURCES,
  siblingSlugs: siblings('statistics'),
  roles: [
    r('Statistical Data Support Technician', 'foundation_technical_entry', 'Prepares datasets, runs quality checks and supports survey processing under statistician supervision.', { priority: 10, eligibilityNote: 'Statistics support technician — not Data Engineer, BI Developer or IT analyst routes.' }),
    r('Graduate Statistician', 'graduate_entry', 'RSS-aligned graduate entry into government, research or industry statistical teams.', { priority: 20, eligibilityNote: 'Statistics graduate entry — explicitly not Data Scientist or ML Engineer (IT field).' }),
    r('RSS Graduate Statistician Trainee', 'graduate_entry', 'Structured RSS/ONS-style trainee developing sampling, estimation and official statistics methods.', { priority: 30, eligibilityNote: 'RSS trainee statistician — not Data Analytics graduate or AI graduate schemes.' }),
    r('Junior Statistician', 'scientific_practitioner', 'Produces analyses, confidence intervals and experimental designs under senior statistician guidance.', { priority: 40, eligibilityNote: 'Junior statistician — not Junior Data Analyst or Junior Data Scientist titles.' }),
    r('Statistician', 'scientific_practitioner', 'Independent statistician designing studies, analysing trials and reporting uncertainty for stakeholders.', { priority: 50, eligibilityNote: 'Core statistician role — distinct from Statistical Scientist (experienced band) and data-science ML roles.' }),
    r('Statistical Scientist', 'experienced_scientist', 'Experienced statistical scientist leading inference, modelling and methodological review for complex studies.', { priority: 60, eligibilityNote: 'Statistical Scientist (RSS career path) — not Data Scientist or Machine Learning Engineer.' }),
    r('Survey Statistician', 'experienced_scientist', 'Experienced in survey design, weighting, non-response adjustment and official statistics production.', { priority: 70, eligibilityNote: 'Survey statistics specialist — not Market Research Analyst without statistical science remit.' }),
    r('Survey Methodologist', 'specialist_scientist', 'Specialist in questionnaire design, sampling frames and survey error models for national or social surveys.', { priority: 80, eligibilityNote: 'Survey Methodologist (RSS) — not UX Researcher or Data Analyst reporting roles.' }),
    r('Biostatistician (Research)', 'specialist_scientist', 'Specialist biostatistician supporting clinical trials, epidemiology and health research study design.', { priority: 90, eligibilityNote: 'Research biostatistician — not Clinical Trial Manager or medical doctor roles; distinct from healthcare HCPC routes.' }),
    r('Senior Statistician', 'senior_principal_scientist', 'Senior statistical authority on programme-wide methods, governance and mentoring of statisticians.', { priority: 100, eligibilityNote: 'Senior statistician — not Senior Data Scientist or analytics manager.' }),
    r('Principal Statistical Scientist', 'senior_principal_scientist', 'Principal-level statistical scientist setting organisation methods policy and external peer engagement.', { priority: 110, eligibilityNote: 'Principal statistical science — RSS-aligned, not AI/ML principal engineer.' }),
    r('Chartered Statistician (RSS CStat)', 'senior_principal_scientist', 'RSS Chartered Statistician providing expert statistical assurance on high-impact studies and programmes.', { priority: 120, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'RSS CStat professional grade — not BCS chartered IT professional or data-science certification.' }),
    r('Head of Official Statistics (Methodology)', 'research_lab_leadership', 'Leads government or agency statistical methodology, quality and publication governance.', { priority: 130, eligibilityNote: 'Official statistics leadership — not Head of Data Engineering or BI.' }),
    r('Postdoctoral Research Fellow (Statistics)', 'academic_research', 'Postdoctoral statistician in university or research institute developing new inference methods.', { priority: 140, eligibilityNote: 'Statistics academic research — not Data Science postdoc or computer-science postdoc.', isResearchRole: true }),
    r('Lecturer in Statistics', 'academic_research', 'HE lecturer teaching statistical theory, R/SAS practicals and supervising student dissertations.', { priority: 150, eligibilityNote: 'Statistics academic — not Lecturer in Data Science or Machine Learning.', isAcademicRole: true }),
  ],
}

const OPERATIONAL_RESEARCH: SpecialismPack = {
  slug: 'operational-research',
  label: 'Operational Research',
  professionalBody: 'The OR Society',
  relatedBodies: ['Institute of Mathematics and its Applications', 'Chartered Institute of Logistics and Transport'],
  sources: OR_SOURCES,
  siblingSlugs: siblings('operational-research'),
  roles: [
    r('Operational Research Support Technician', 'foundation_technical_entry', 'Prepares data extracts, scenario inputs and simulation dashboards for OR analysts.', { priority: 10, eligibilityNote: 'OR support technician — not IT service desk or generic business analyst apprentice.' }),
    r('Operational Research Graduate Trainee', 'graduate_entry', 'Graduate entry into OR consulting, transport planning or public-sector decision-science teams.', { priority: 20, eligibilityNote: 'OR graduate entry — not Data Analytics graduate or Management Consultant (general) routes.' }),
    r('Graduate Operational Research Analyst', 'graduate_entry', 'First OR role building optimisation models, simulation studies and decision-support briefings.', { priority: 30, eligibilityNote: 'OR graduate analyst — distinct from Graduate Statistician and Graduate Data Analyst.' }),
    r('Junior Operational Research Analyst', 'scientific_practitioner', 'Supports LP/MIP models, discrete-event simulation and what-if analysis under OR mentor supervision.', { priority: 40, eligibilityNote: 'Junior OR practitioner — not Junior Business Intelligence Developer.' }),
    r('Operational Research Analyst', 'scientific_practitioner', 'Independent OR analyst delivering optimisation, simulation and decision-analysis for operations.', { priority: 50, eligibilityNote: 'Core OR analyst — not Data Analyst (reporting) or Software Engineer.' }),
    r('Operational Research Scientist', 'experienced_scientist', 'Experienced OR scientist owning complex scheduling, routing and resource-allocation programmes.', { priority: 60, eligibilityNote: 'Experienced OR scientist — not Experienced Data Scientist or supply-chain engineer alone.' }),
    r('Simulation Analyst (Operations Research)', 'experienced_scientist', 'Experienced in discrete-event and system-dynamics simulation for process and capacity planning.', { priority: 70, eligibilityNote: 'OR simulation analyst — not Game Developer or ML simulation engineer.' }),
    r('Specialist Operational Research Consultant', 'specialist_scientist', 'Specialist OR consultant on stochastic programming, robust optimisation or multi-criteria decision analysis.', { priority: 80, eligibilityNote: 'OR specialist consultant — not Management Consultant without OR methods remit.' }),
    r('Specialist Decision Scientist (Operational Research)', 'specialist_scientist', 'Specialist integrating OR, analytics and stakeholder facilitation for strategic decisions.', { priority: 90, eligibilityNote: 'OR decision scientist — not IT Decision Scientist / ML product roles.' }),
    r('Senior Operational Research Analyst', 'senior_principal_scientist', 'Senior OR authority mentoring analysts and signing off model assumptions for client delivery.', { priority: 100, eligibilityNote: 'Senior OR — not Senior Data Scientist or analytics manager.' }),
    r('Principal Operational Research Scientist', 'senior_principal_scientist', 'Principal OR scientist setting modelling standards across consultancy or government OR units.', { priority: 110, eligibilityNote: 'Principal OR — experience-led, not PhD-automatic seniority.' }),
    r('Head of Operational Research', 'research_lab_leadership', 'Leads OR team portfolio, methods governance and client engagement for OR practice.', { priority: 120, eligibilityNote: 'OR function leadership — not Head of Analytics or Data Science.' }),
    r('Lecturer in Operational Research', 'academic_research', 'University lecturer teaching optimisation, simulation and OR case studies.', { priority: 130, eligibilityNote: 'OR academic teaching — realistic at MSc/PhD OR programmes; not school teacher routes.', isAcademicRole: true }),
    r('Research Fellow (Operational Research Methods)', 'academic_research', 'Research fellow developing new OR algorithms or stochastic optimisation methods.', { priority: 140, eligibilityNote: 'OR methods research — not computer-science algorithms postdoc.', isResearchRole: true }),
    r('Director of Decision Science (Operational Research)', 'executive_scientific_director', 'Executive leadership of enterprise OR/decision-science capability and investment.', { priority: 150, eligibilityNote: 'OR executive director — not Chief Data Officer or CIO.' }),
  ],
}

const MATHEMATICAL_MODELLING: SpecialismPack = {
  slug: 'mathematical-modelling',
  label: 'Mathematical Modelling',
  professionalBody: 'Institute of Mathematics and its Applications (IMA)',
  relatedBodies: ['The OR Society', 'Royal Statistical Society'],
  sources: IMA_SOURCES,
  siblingSlugs: siblings('mathematical-modelling'),
  roles: [
    r('Mathematical Modelling Support Technician', 'foundation_technical_entry', 'Runs model scripts, calibrates parameters and maintains version control for modelling teams.', { priority: 10, eligibilityNote: 'Modelling support technician — not Software Developer or data-pipeline engineer.' }),
    r('Mathematical Modelling Graduate Trainee', 'graduate_entry', 'Graduate trainee building and validating mathematical models for science or industry clients.', { priority: 20, eligibilityNote: 'Modelling graduate entry — not Applied Mathematics or Statistics graduate titles.' }),
    r('Graduate Mathematical Modeller', 'graduate_entry', 'First professional modeller translating real systems into equations, ODEs/PDEs and simulations.', { priority: 30, eligibilityNote: 'Mathematical modeller graduate — distinct from Data Scientist or ML Engineer.' }),
    r('Junior Mathematical Modeller', 'scientific_practitioner', 'Develops prototype models, sensitivity analyses and validation plots under senior modeller supervision.', { priority: 40, eligibilityNote: 'Junior modeller — not Junior Data Analyst or CFD engineer (unless modelling-led).' }),
    r('Mathematical Modeller', 'scientific_practitioner', 'Independent mathematical modeller delivering calibrated models for policy, engineering or research.', { priority: 50, eligibilityNote: 'Core mathematical modeller — not Climate Modeller (Climate Science specialism) alone.' }),
    r('Mathematical Modeller (Systems Simulation)', 'experienced_scientist', 'Experienced in system-dynamics and agent-based mathematical models for complex systems.', { priority: 60, eligibilityNote: 'Systems simulation modeller — not game-engine or robotics simulation developer.' }),
    r('Mathematical Modeller (Epidemiological Models)', 'experienced_scientist', 'Experienced in compartment models, stochastic epidemic simulation and public-health scenario modelling.', { priority: 70, eligibilityNote: 'Epidemiological mathematical modeller — not Epidemiologist (medical/public health) unless dual remit.' }),
    r('Specialist Mathematical Modeller (Computational)', 'specialist_scientist', 'Specialist in numerical implementation, uncertainty quantification and HPC model runs.', { priority: 80, eligibilityNote: 'Computational modelling specialist — not ML model deployment engineer.' }),
    r('Specialist Mathematical Modeller (Engineering Systems)', 'specialist_scientist', 'Specialist modeller for structural, thermal or control systems using rigorous mathematical frameworks.', { priority: 90, eligibilityNote: 'Engineering systems modeller — mathematics-led, not Mechanical Engineer default route.' }),
    r('Senior Mathematical Modeller', 'senior_principal_scientist', 'Senior modeller accountable for model audit trails, peer review and client sign-off.', { priority: 100, eligibilityNote: 'Senior mathematical modeller — not Senior Data Scientist.' }),
    r('Principal Mathematical Modeller', 'senior_principal_scientist', 'Principal modelling authority defining standards for model documentation and validation.', { priority: 110, eligibilityNote: 'Principal modeller IC — experience-led progression.' }),
    r('Lead Mathematical Modelling Team', 'research_lab_leadership', 'Leads modelling team delivery, code review practices and cross-disciplinary model integration.', { priority: 120, eligibilityNote: 'Modelling team leadership — not Head of Applied Mathematics.' }),
    r('Postdoctoral Research Fellow (Mathematical Modelling)', 'academic_research', 'Postdoctoral researcher advancing mathematical modelling methods in university or national lab.', { priority: 130, eligibilityNote: 'Modelling research postdoc — not AI/ML postdoc titles.', isResearchRole: true }),
    r('Lecturer in Mathematical Modelling', 'academic_research', 'HE lecturer teaching modelling modules and supervising project-based model builds.', { priority: 140, eligibilityNote: 'Modelling academic — not Lecturer in Data Science.', isAcademicRole: true }),
    r('Director of Modelling and Simulation', 'executive_scientific_director', 'Executive leadership of enterprise mathematical modelling and simulation capability.', { priority: 150, eligibilityNote: 'Modelling executive — not VP Engineering or Chief AI Officer.' }),
  ],
}

// ---------------------------------------------------------------------------
// Earth & environmental specialisms (IES / GSL / RMetS / CIEEM)
// ---------------------------------------------------------------------------

const ENVIRONMENTAL_SCIENCE: SpecialismPack = {
  slug: 'environmental-science',
  label: 'Environmental Science',
  professionalBody: 'Institution of Environmental Sciences (IES) / CIEEM',
  relatedBodies: ['CIEEM', 'Environment Agency', 'Chartered Institute of Water and Environmental Management'],
  sources: IES_CIEEM_SOURCES,
  siblingSlugs: siblings('environmental-science'),
  roles: [
    r('Environmental Field Technician', 'foundation_technical_entry', 'Collects field samples, calibrates monitors and maintains environmental monitoring equipment on site.', { priority: 10, eligibilityNote: 'Environmental field technician entry — not general construction labourer or ecology-only assistant without monitoring remit.' }),
    r('Environmental Science Laboratory Technician', 'foundation_technical_entry', 'Prepares environmental samples, runs basic wet chemistry and logs chain-of-custody in commercial or agency labs.', { priority: 20, eligibilityNote: 'Environmental lab technician — not HCPC biomedical laboratory assistant routes.' }),
    r('Environmental Science Graduate Trainee', 'graduate_entry', 'Graduate trainee in environmental consultancies or regulators building monitoring and assessment skills.', { priority: 30, eligibilityNote: 'Environmental science graduate — not Environmental Engineer (Engineering field) graduate titles.' }),
    r('Graduate Environmental Scientist', 'graduate_entry', 'First professional environmental scientist role in monitoring, auditing or sustainability teams.', { priority: 40, eligibilityNote: 'Environmental scientist graduate — distinct from Graduate Ecologist (Conservation Science).' }),
    r('Junior Environmental Scientist', 'scientific_practitioner', 'Delivers environmental baseline surveys, data QA and report sections under senior scientist supervision.', { priority: 50, eligibilityNote: 'Junior environmental scientist — not Junior Sustainability Consultant without science remit.' }),
    r('Environmental Scientist', 'scientific_practitioner', 'Independent environmental scientist assessing pollution, land use and environmental compliance evidence.', { priority: 60, eligibilityNote: 'Core environmental scientist — not Environmental Health Officer (regulated local authority route).' }),
    r('Environmental Scientist (Contaminated Land)', 'experienced_scientist', 'Experienced in contaminated land assessment, remediation options appraisal and regulatory liaison.', { priority: 70, eligibilityNote: 'Contaminated land environmental scientist — not Chartered Engineer (geo-environmental) unless dual remit.' }),
    r('Environmental Scientist (Air Quality)', 'experienced_scientist', 'Experienced in ambient and emissions monitoring, dispersion modelling inputs and air-quality management plans.', { priority: 80, eligibilityNote: 'Air quality environmental scientist — not Meteorologist (forecasting specialism).' }),
    r('Specialist Environmental Scientist (Ecotoxicology)', 'specialist_scientist', 'Specialist assessing chemical effects on ecosystems, bioassays and environmental risk characterisation.', { priority: 90, eligibilityNote: 'Ecotoxicology specialist — not Toxicologist (chemical/pharma specialism) unless shared remit.' }),
    r('Specialist Environmental Scientist (Environmental Impact Assessment)', 'specialist_scientist', 'Specialist lead for EIA chapters, scoping and technical appendices on major development projects.', { priority: 100, eligibilityNote: 'EIA specialist environmental scientist — not planning lawyer or non-scientific project manager.' }),
    r('Senior Environmental Scientist', 'senior_principal_scientist', 'Senior environmental scientist signing off technical work and mentoring junior field and lab staff.', { priority: 110, eligibilityNote: 'Senior environmental scientist — IES chartership may be desirable; not automatic from Master’s.' }),
    r('Principal Environmental Scientist', 'senior_principal_scientist', 'Principal environmental authority on multi-site programmes and client technical assurance.', { priority: 120, eligibilityNote: 'Principal environmental scientist IC — experience-led progression.' }),
    r('Head of Environmental Science (Consultancy)', 'research_lab_leadership', 'Leads environmental science practice, methods and technical quality across consultancy or agency teams.', { priority: 130, eligibilityNote: 'Environmental science leadership — not Head of Ecology (Conservation Science).' }),
    r('Chartered Environmentalist (CEnv) — Environmental Science', 'senior_principal_scientist', 'IES/CIEEM-aligned Chartered Environmentalist providing senior assurance on environmental programmes.', { priority: 140, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'CEnv professional grade — environmental science context, not generic sustainability manager.' }),
    r('Director of Environmental Science Services', 'executive_scientific_director', 'Executive leadership of environmental science capability, accreditation and major client portfolios.', { priority: 150, eligibilityNote: 'Environmental science executive — not HSE director or facilities executive.' }),
  ],
}

const EARTH_SCIENCE: SpecialismPack = {
  slug: 'earth-science',
  label: 'Earth Science',
  professionalBody: 'Geological Society of London',
  relatedBodies: ['Natural Environment Research Council', 'British Geological Survey'],
  sources: GSL_SOURCES,
  siblingSlugs: siblings('earth-science'),
  roles: [
    r('Earth Science Field Technician', 'foundation_technical_entry', 'Supports geological and earth-system field campaigns, sample logging and GPS/site surveying.', { priority: 10, eligibilityNote: 'Earth science field technician — not Geology field technician (Geology specialism) unless general earth-science remit.' }),
    r('Earth Science Laboratory Assistant', 'foundation_technical_entry', 'Prepares rock, sediment and core samples for analysis in earth-science teaching or research labs.', { priority: 20, eligibilityNote: 'Earth science lab assistant — not chemistry-only lab technician without geological samples.' }),
    r('Earth Science Graduate Trainee', 'graduate_entry', 'Graduate trainee in BGS, universities or geoscience consultancies building broad earth-system skills.', { priority: 30, eligibilityNote: 'Earth science graduate — broader than Geology or Geophysics specialist entry alone.' }),
    r('Graduate Earth Scientist', 'graduate_entry', 'First professional earth scientist integrating geological, geophysical and geochemical evidence.', { priority: 40, eligibilityNote: 'Earth scientist graduate — not Graduate Geologist (Geology specialism) unless role is explicitly generalist.' }),
    r('Junior Earth Scientist', 'scientific_practitioner', 'Contributes to stratigraphic interpretation, earth-history analysis and interdisciplinary reporting.', { priority: 50, eligibilityNote: 'Junior earth scientist — not Junior Geophysicist or Junior Geochemist specialist titles.' }),
    r('Earth Scientist', 'scientific_practitioner', 'Independent earth scientist synthesising field, lab and remote-sensing data for earth-system questions.', { priority: 60, eligibilityNote: 'Core earth scientist — distinct from Environmental Scientist (environmental specialism).' }),
    r('Earth Scientist (Stratigraphy)', 'experienced_scientist', 'Experienced in stratigraphic correlation, basin analysis and geological time-scale applications.', { priority: 70, eligibilityNote: 'Stratigraphy earth scientist — not Palaeontologist (museum) unless research remit.' }),
    r('Earth Scientist (Palaeoenvironments)', 'experienced_scientist', 'Experienced in reconstructing past climates and environments from geological archives.', { priority: 80, eligibilityNote: 'Palaeoenvironment earth scientist — related to but distinct from Climate Scientist (modelling specialism).' }),
    r('Specialist Earth Scientist (Planetary Geology)', 'specialist_scientist', 'Specialist applying earth-science methods to planetary surfaces, impact structures and comparative geology.', { priority: 90, eligibilityNote: 'Planetary geology specialist — not Astrophysicist (Physics specialism) unless dual remit.' }),
    r('Specialist Earth Scientist (Earth Systems Integration)', 'specialist_scientist', 'Specialist integrating geology, hydrology and biogeochemistry for whole-earth-system assessments.', { priority: 100, eligibilityNote: 'Earth systems specialist — not Climate Modeller alone.' }),
    r('Senior Earth Scientist', 'senior_principal_scientist', 'Senior earth scientist leading multi-disciplinary geoscience work packages and peer review.', { priority: 110, eligibilityNote: 'Senior earth scientist — Chartered Geologist may be desirable for some employers.' }),
    r('Principal Earth Scientist', 'senior_principal_scientist', 'Principal earth-science authority on national surveys, research programmes or major consultancy studies.', { priority: 120, eligibilityNote: 'Principal earth scientist IC — experience-led, not PhD-automatic.' }),
    r('Head of Earth Science Research', 'research_lab_leadership', 'Leads earth-science research group, field campaigns and postgraduate training.', { priority: 130, eligibilityNote: 'Earth science research leadership — not Head of Geology (Geology specialism).' }),
    r('Postdoctoral Research Fellow (Earth Science)', 'academic_research', 'Postdoctoral researcher in earth-system science, geodynamics or interdisciplinary geoscience.', { priority: 140, eligibilityNote: 'Earth science postdoc — realistic academic route; not medical research fellow.', isResearchRole: true }),
    r('Director of Earth Science Programme', 'executive_scientific_director', 'Executive leadership of national or institutional earth-science portfolio and strategy.', { priority: 150, eligibilityNote: 'Earth science executive — not mining operations director without science remit.' }),
  ],
}

const GEOLOGY: SpecialismPack = {
  slug: 'geology',
  label: 'Geology',
  professionalBody: 'Geological Society of London',
  relatedBodies: ['Chartered Geologist (CGeol)', 'British Geological Survey', 'Engineering Council (via CGeol)'],
  sources: GSL_SOURCES,
  siblingSlugs: siblings('geology'),
  roles: [
    r('Geology Field Technician', 'foundation_technical_entry', 'Logs core, collects rock samples and supports geological mapping parties in the field.', { priority: 10, eligibilityNote: 'Geology field technician entry — realistic apprenticeship/HND route; not Geophysicist survey crew without geological logging.' }),
    r('Geological Core Logging Technician', 'foundation_technical_entry', 'Describes drill-core, prepares geological logs and maintains sample archives for exploration teams.', { priority: 20, eligibilityNote: 'Core logging technician — geology-specific; not general warehouse or drilling rig operator alone.' }),
    r('Geology Graduate Trainee', 'graduate_entry', 'Graduate trainee with consultancies, BGS or mining companies building geological mapping and reporting skills.', { priority: 30, eligibilityNote: 'Geology graduate entry — not Geophysics or Geochemistry graduate specialist titles.' }),
    r('Graduate Geologist', 'graduate_entry', 'First professional geologist role in exploration, site investigation or geological survey organisations.', { priority: 40, eligibilityNote: 'Graduate geologist — distinct from Graduate Earth Scientist (broader earth-science specialism).' }),
    r('Junior Geologist', 'scientific_practitioner', 'Produces geological sections, sample descriptions and report text under chartered geologist supervision.', { priority: 50, eligibilityNote: 'Junior geologist — not Junior Geophysicist or environmental scientist.' }),
    r('Geologist', 'scientific_practitioner', 'Independent geologist interpreting geological structures, lithology and resource potential.', { priority: 60, eligibilityNote: 'Core geologist practitioner — Geological Society professional context.' }),
    r('Geologist (Mineral Exploration)', 'experienced_scientist', 'Experienced exploration geologist targeting ore deposits, managing drill programmes and geological models.', { priority: 70, eligibilityNote: 'Exploration geologist — not Mining Engineer (Engineering field) unless dual remit.' }),
    r('Geologist (Site Investigation)', 'experienced_scientist', 'Experienced in ground investigation for construction, slope stability and foundation geology.', { priority: 80, eligibilityNote: 'Site investigation geologist — not Structural Engineer default route.' }),
    r('Specialist Engineering Geologist', 'specialist_scientist', 'Specialist engineering geologist assessing ground hazards, rock mass classification and geotechnical inputs.', { priority: 90, professionalRegistrationRequirement: 'desirable', eligibilityNote: 'Engineering geology specialist — CGeol commonly expected at senior levels; not Civil Engineer alone.' }),
    r('Specialist Geologist (Resource Geology)', 'specialist_scientist', 'Specialist in resource estimation, geological modelling and JORC/UK-style reporting support.', { priority: 100, eligibilityNote: 'Resource geology specialist — not Financial Analyst or mine manager without geology remit.' }),
    r('Senior Geologist (Chartered Geologist Route)', 'senior_principal_scientist', 'Senior geologist progressing toward or holding Geological Society chartership with technical sign-off.', { priority: 110, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'Senior geologist CGeol route — Geological Society; not automatic from Master’s alone.' }),
    r('Chartered Geologist (CGeol)', 'senior_principal_scientist', 'Geological Society Chartered Geologist providing professional assurance on geological interpretations and reports.', { priority: 120, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'CGeol registered geologist — desirable/commonly expected for senior UK geology sign-off roles.' }),
    r('Principal Geologist', 'senior_principal_scientist', 'Principal geologist leading regional studies, peer review and mentoring of geological teams.', { priority: 130, eligibilityNote: 'Principal geologist IC — experience-led progression toward CGeol.' }),
    r('Head of Geology', 'research_lab_leadership', 'Leads geology team delivery, field safety, QA and client technical management.', { priority: 140, eligibilityNote: 'Geology practice leadership — not Head of Geophysics (Geophysics specialism).' }),
    r('Director of Geological Services', 'executive_scientific_director', 'Executive leadership of geological consultancy, survey or exploration science functions.', { priority: 150, eligibilityNote: 'Geology executive director — not quarry operations manager without professional geology remit.' }),
  ],
}

const GEOPHYSICS: SpecialismPack = {
  slug: 'geophysics',
  label: 'Geophysics',
  professionalBody: 'Geological Society of London / Royal Astronomical Society',
  relatedBodies: ['British Geophysical Association', 'Chartered Geologist (CGeol) where applicable'],
  sources: GSL_SOURCES,
  siblingSlugs: siblings('geophysics'),
  roles: [
    r('Geophysical Survey Technician', 'foundation_technical_entry', 'Deploys seismic, gravity or magnetic instruments and maintains geophysical acquisition equipment in the field.', { priority: 10, eligibilityNote: 'Geophysical survey technician — realistic field entry; not Geology core logger without geophysical acquisition.' }),
    r('Geophysics Field Assistant', 'foundation_technical_entry', 'Assists geophysical crews with line setup, GPS positioning and daily QC of raw geophysical data.', { priority: 20, eligibilityNote: 'Geophysics field assistant — not Meteorological observing technician (Meteorology specialism).' }),
    r('Geophysics Graduate Trainee', 'graduate_entry', 'Graduate trainee with geophysical contractors or research groups learning acquisition and processing workflows.', { priority: 30, eligibilityNote: 'Geophysics graduate entry — not Geology or Geochemistry graduate specialist titles.' }),
    r('Graduate Geophysicist', 'graduate_entry', 'First professional geophysicist role interpreting geophysical datasets for exploration or engineering.', { priority: 40, eligibilityNote: 'Graduate geophysicist — distinct from Graduate Physicist (Physics specialism) unless explicitly geophysics.' }),
    r('Junior Geophysicist', 'scientific_practitioner', 'Processes seismic/refraction/gravity data and prepares interpretation sections under supervision.', { priority: 50, eligibilityNote: 'Junior geophysicist — not Junior Data Scientist or seismic software developer alone.' }),
    r('Geophysicist', 'scientific_practitioner', 'Independent geophysicist delivering acquisition design, processing and geological integration.', { priority: 60, eligibilityNote: 'Core geophysicist — Geological Society / BGA professional context.' }),
    r('Geophysicist (Seismic Interpretation)', 'experienced_scientist', 'Experienced in 2D/3D seismic interpretation, horizon mapping and structural trap analysis.', { priority: 70, eligibilityNote: 'Seismic interpretation geophysicist — not Petroleum Engineer default route.' }),
    r('Geophysicist (Near-Surface Investigation)', 'experienced_scientist', 'Experienced in GPR, electrical resistivity and seismic refraction for engineering and environmental site investigation.', { priority: 80, eligibilityNote: 'Near-surface geophysicist — not Geotechnical Engineer alone.' }),
    r('Specialist Geophysicist (Marine Geophysics)', 'specialist_scientist', 'Specialist in marine seismic, sub-bottom profiling and offshore geophysical survey design.', { priority: 90, eligibilityNote: 'Marine geophysics specialist — not Oceanographer (Oceanography specialism) unless dual remit.' }),
    r('Specialist Geophysicist (Potential Fields)', 'specialist_scientist', 'Specialist in gravity, magnetic and magnetotelluric methods for crustal and resource studies.', { priority: 100, eligibilityNote: 'Potential-fields specialist — not Astrophysicist (Physics specialism).' }),
    r('Senior Geophysicist', 'senior_principal_scientist', 'Senior geophysicist accountable for survey specifications, interpretation QA and team mentoring.', { priority: 110, eligibilityNote: 'Senior geophysicist — CGeol may be desirable for some integrated geoscience sign-off.' }),
    r('Principal Geophysicist', 'senior_principal_scientist', 'Principal geophysical authority on multi-client programmes and advanced interpretation products.', { priority: 120, eligibilityNote: 'Principal geophysicist IC — experience-led progression.' }),
    r('Head of Geophysics', 'research_lab_leadership', 'Leads geophysics team, acquisition partnerships and technical standards.', { priority: 130, eligibilityNote: 'Geophysics leadership — not Head of Geology (Geology specialism).' }),
    r('Postdoctoral Research Fellow (Geophysics)', 'academic_research', 'Postdoctoral geophysicist in seismology, geodynamics or exploration geophysics research groups.', { priority: 140, eligibilityNote: 'Geophysics academic research — realistic postdoc route; not IT research fellow.', isResearchRole: true }),
    r('Director of Geophysical Surveys', 'executive_scientific_director', 'Executive leadership of geophysical survey business or national geophysical programme.', { priority: 150, eligibilityNote: 'Geophysics executive — not offshore installation manager without geophysical science remit.' }),
  ],
}

const GEOCHEMISTRY: SpecialismPack = {
  slug: 'geochemistry',
  label: 'Geochemistry',
  professionalBody: 'Geological Society of London / Royal Society of Chemistry',
  relatedBodies: ['British Geological Survey', 'Association of Applied Geochemists'],
  sources: GSL_SOURCES,
  siblingSlugs: siblings('geochemistry'),
  roles: [
    r('Geochemistry Laboratory Technician', 'foundation_technical_entry', 'Prepares geological samples for ICP-MS, XRF and isotope analysis in geochemistry laboratories.', { priority: 10, eligibilityNote: 'Geochemistry lab technician — not general chemistry technician without geological sample focus.' }),
    r('Geochemical Sample Preparation Technician', 'foundation_technical_entry', 'Crushes, splits and digests rock and sediment samples following geochemical lab protocols.', { priority: 20, eligibilityNote: 'Sample prep technician — geochemistry-specific; not environmental lab assistant alone.' }),
    r('Geochemistry Graduate Trainee', 'graduate_entry', 'Graduate trainee building skills in geochemical analysis, data interpretation and QA/QC.', { priority: 30, eligibilityNote: 'Geochemistry graduate entry — not Analytical Chemistry (Chemistry specialism) unless geochemistry remit.' }),
    r('Graduate Geochemist', 'graduate_entry', 'First professional geochemist role in exploration, environmental forensics or research laboratories.', { priority: 40, eligibilityNote: 'Graduate geochemist — distinct from Graduate Geologist (Geology specialism).' }),
    r('Junior Geochemist', 'scientific_practitioner', 'Runs geochemical analyses, plots discrimination diagrams and drafts technical memo sections.', { priority: 50, eligibilityNote: 'Junior geochemist — not Junior Analytical Chemist without geological interpretation.' }),
    r('Geochemist', 'scientific_practitioner', 'Independent geochemist interpreting elemental and isotopic data for geological and environmental questions.', { priority: 60, eligibilityNote: 'Core geochemist — Geological Society / RSC context.' }),
    r('Geochemist (Isotope Geochemistry)', 'experienced_scientist', 'Experienced in stable and radiogenic isotope systems for dating and provenance studies.', { priority: 70, eligibilityNote: 'Isotope geochemistry — not Radiocarbon lab technician without geochemical interpretation remit.' }),
    r('Geochemist (Exploration Geochemistry)', 'experienced_scientist', 'Experienced in soil/stream sediment geochemical surveys and anomaly interpretation for exploration.', { priority: 80, eligibilityNote: 'Exploration geochemist — not Exploration Geologist alone unless integrated role.' }),
    r('Specialist Geochemist (Ore Deposit Geochemistry)', 'specialist_scientist', 'Specialist in ore-forming processes, fluid inclusion studies and deposit geochemical signatures.', { priority: 90, eligibilityNote: 'Ore deposit geochemistry specialist — not Mining Metallurgist (Engineering).' }),
    r('Specialist Geochemist (Environmental Geochemistry)', 'specialist_scientist', 'Specialist tracing contaminant pathways, speciation and geochemical risk in land and water systems.', { priority: 100, eligibilityNote: 'Environmental geochemistry — related to but distinct from Environmental Scientist (Environmental Science specialism).' }),
    r('Senior Geochemist', 'senior_principal_scientist', 'Senior geochemist signing off analytical programmes, method validation and interpretation reports.', { priority: 110, eligibilityNote: 'Senior geochemist — experience-led; CGeol may be desirable in integrated geoscience consultancies.' }),
    r('Principal Geochemist', 'senior_principal_scientist', 'Principal geochemical authority on national geochemical surveys or major exploration programmes.', { priority: 120, eligibilityNote: 'Principal geochemist IC — not lab manager without geochemical science remit.' }),
    r('Head of Geochemistry', 'research_lab_leadership', 'Leads geochemistry laboratory or research group, method development and student/postdoc supervision.', { priority: 130, eligibilityNote: 'Geochemistry leadership — not Head of Analytical Chemistry (Chemistry specialism).' }),
    r('Postdoctoral Research Fellow (Geochemistry)', 'academic_research', 'Postdoctoral geochemist in cosmochemistry, petrology or environmental geochemistry research.', { priority: 140, eligibilityNote: 'Geochemistry postdoc — realistic academic route.', isResearchRole: true }),
    r('Director of Geochemical Analysis Services', 'executive_scientific_director', 'Executive leadership of commercial or national geochemical analytical and interpretation services.', { priority: 150, eligibilityNote: 'Geochemistry executive — not generic laboratory facilities director without geoscience remit.' }),
  ],
}

const OCEANOGRAPHY: SpecialismPack = {
  slug: 'oceanography',
  label: 'Oceanography',
  professionalBody: 'Challenger Society for Marine Science',
  relatedBodies: ['National Oceanography Centre', 'Marine Biological Association'],
  sources: MARINE_SOURCES,
  siblingSlugs: siblings('oceanography'),
  roles: [
    r('Oceanographic Field Technician', 'foundation_technical_entry', 'Deploys CTD rosettes, moorings and water samplers on research vessels and coastal stations.', { priority: 10, eligibilityNote: 'Oceanographic field technician — realistic marine science entry; not commercial fishing deckhand.' }),
    r('Marine Instrumentation Technician (Oceanography)', 'foundation_technical_entry', 'Maintains ADCP, glider and buoy instrumentation for oceanographic monitoring programmes.', { priority: 20, eligibilityNote: 'Marine instrumentation technician — oceanography context; not offshore oil-rig mechanic alone.' }),
    r('Oceanography Graduate Trainee', 'graduate_entry', 'Graduate trainee at NOC, Cefas or marine consultancies building observational oceanography skills.', { priority: 30, eligibilityNote: 'Oceanography graduate entry — not Marine Biologist (Biology specialism) unless explicitly physical/chemical oceanography.' }),
    r('Graduate Oceanographer', 'graduate_entry', 'First professional oceanographer role analysing physical, chemical or biological ocean data.', { priority: 40, eligibilityNote: 'Graduate oceanographer — distinct from Graduate Meteorologist (Meteorology specialism).' }),
    r('Junior Oceanographer', 'scientific_practitioner', 'Processes hydrographic data, quality-controls cruise datasets and contributes to technical reports.', { priority: 50, eligibilityNote: 'Junior oceanographer — not Junior Data Engineer or marine GIS technician alone.' }),
    r('Oceanographer', 'scientific_practitioner', 'Independent oceanographer interpreting circulation, biogeochemistry or marine monitoring programmes.', { priority: 60, eligibilityNote: 'Core oceanographer — Challenger Society professional context.' }),
    r('Physical Oceanographer (Experienced)', 'experienced_scientist', 'Experienced in currents, mixing, sea-level variability and ocean circulation analysis.', { priority: 70, eligibilityNote: 'Physical oceanographer — not Meteorologist (atmospheric specialism) unless coupled modelling remit.' }),
    r('Chemical Oceanographer (Experienced)', 'experienced_scientist', 'Experienced in marine nutrient cycles, carbonate chemistry and ocean tracer studies.', { priority: 80, eligibilityNote: 'Chemical oceanographer — not Analytical Chemist (Chemistry specialism) without marine geochemical context.' }),
    r('Specialist Oceanographer (Marine Acoustics)', 'specialist_scientist', 'Specialist in underwater acoustics, sonar oceanography and marine mammal monitoring applications.', { priority: 90, eligibilityNote: 'Marine acoustics oceanographer — not Sonar Engineer (Engineering) unless science-led.' }),
    r('Specialist Oceanographer (Coastal Processes)', 'specialist_scientist', 'Specialist in nearshore hydrodynamics, sediment transport and coastal monitoring programmes.', { priority: 100, eligibilityNote: 'Coastal oceanography specialist — related to Hydrology/Hydraulics but ocean-focused.' }),
    r('Senior Oceanographer', 'senior_principal_scientist', 'Senior oceanographer leading cruise planning, data interpretation QA and team mentoring.', { priority: 110, eligibilityNote: 'Senior oceanographer — experience-led progression.' }),
    r('Principal Oceanographer', 'senior_principal_scientist', 'Principal oceanographic authority on national marine climate indicators and large research programmes.', { priority: 120, eligibilityNote: 'Principal oceanographer IC — not vessel captain or port manager.' }),
    r('Head of Oceanographic Research', 'research_lab_leadership', 'Leads oceanographic research group, ship-time bids and postgraduate training.', { priority: 130, eligibilityNote: 'Oceanography research leadership — not Head of Marine Biology.' }),
    r('Postdoctoral Research Fellow (Oceanography)', 'academic_research', 'Postdoctoral oceanographer at NOC, university marine institutes or international ocean programmes.', { priority: 140, eligibilityNote: 'Oceanography postdoc — realistic academic/research institute route.', isResearchRole: true }),
    r('Director of Marine Science (Oceanography)', 'executive_scientific_director', 'Executive leadership of national or institutional oceanographic science portfolio.', { priority: 150, eligibilityNote: 'Oceanography executive — not harbour master or shipping operations director.' }),
  ],
}

const METEOROLOGY: SpecialismPack = {
  slug: 'meteorology',
  label: 'Meteorology',
  professionalBody: 'Royal Meteorological Society (RMetS)',
  relatedBodies: ['Met Office', 'World Meteorological Organization context'],
  sources: RMETS_SOURCES,
  siblingSlugs: siblings('meteorology'),
  roles: [
    r('Meteorological Observing Technician', 'foundation_technical_entry', 'Operates synoptic weather stations, radiosonde launches and instrument calibration for Met Office or agency networks.', { priority: 10, eligibilityNote: 'Meteorological observing technician — realistic Met Office/RMetS entry; not general facilities maintenance.' }),
    r('Weather Station Technician', 'foundation_technical_entry', 'Maintains automatic weather stations, data loggers and field meteorological sensors.', { priority: 20, eligibilityNote: 'Weather station technician — meteorology-specific; not Environmental Field Technician alone.' }),
    r('Met Office Foundation Meteorologist Trainee', 'graduate_entry', 'Met Office foundation programme trainee developing forecasting, observation and NWP fundamentals.', { priority: 30, eligibilityNote: 'Met Office foundation meteorologist — not IT graduate or Data Scientist trainee routes.' }),
    r('Graduate Meteorologist', 'graduate_entry', 'First professional meteorologist role in forecasting, research or commercial weather services.', { priority: 40, eligibilityNote: 'Graduate meteorologist — RMetS/Met Office context; not Climate Scientist (Climate Science specialism) alone.' }),
    r('Junior Meteorologist', 'scientific_practitioner', 'Prepares forecast guidance, verifies model output and supports operational forecasting desks under supervision.', { priority: 50, eligibilityNote: 'Junior meteorologist — not Junior Data Analyst or broadcast presenter without meteorological qualification.' }),
    r('Meteorologist', 'scientific_practitioner', 'Independent meteorologist analysing weather systems, warnings and customer forecast products.', { priority: 60, eligibilityNote: 'Core meteorologist — RMetS professional context.' }),
    r('Weather Forecaster (Met Office Operations)', 'experienced_scientist', 'Experienced operational forecaster issuing public and contingency forecasts on Met Office operational desks.', { priority: 70, eligibilityNote: 'Met Office operational forecaster — distinct from TV weather presenter without meteorological practitioner remit.' }),
    r('Meteorologist (Numerical Weather Prediction)', 'experienced_scientist', 'Experienced in NWP model evaluation, post-processing and meteorological product development.', { priority: 80, eligibilityNote: 'NWP meteorologist — not Software Developer or ML Engineer unless meteorological science-led.' }),
    r('Specialist Meteorologist (Aviation Weather)', 'specialist_scientist', 'Specialist aviation meteorologist producing TAFs, SIGWX guidance and airport weather warnings.', { priority: 90, eligibilityNote: 'Aviation meteorology specialist — not Air Traffic Controller or pilot routes.' }),
    r('Specialist Meteorologist (Marine Forecasting)', 'specialist_scientist', 'Specialist marine meteorologist for shipping, offshore and coastal forecast services.', { priority: 100, eligibilityNote: 'Marine forecasting meteorologist — not Oceanographer (Oceanography specialism) unless dual remit.' }),
    r('Senior Meteorologist (RMetS Chartered Route)', 'senior_principal_scientist', 'Senior meteorologist progressing toward RMetS Registered or Chartered Meteorologist status.', { priority: 110, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'Senior meteorologist RMetS route — commonly expected professional membership at this level.' }),
    r('Principal Meteorologist (Forecasting)', 'senior_principal_scientist', 'Principal meteorologist accountable for forecast methodology, shift leadership and severe-weather decision support.', { priority: 120, eligibilityNote: 'Principal forecasting meteorologist — not Head of News or crisis comms manager alone.' }),
    r('Head of Forecasting Operations', 'research_lab_leadership', 'Leads forecasting desk operations, rostering, quality assurance and forecaster training.', { priority: 130, eligibilityNote: 'Forecasting operations leadership — Met Office/RMetS operational context.' }),
    r('Postdoctoral Research Fellow (Meteorology)', 'academic_research', 'Postdoctoral meteorologist in atmospheric dynamics, convection or NWP research groups.', { priority: 140, eligibilityNote: 'Meteorology postdoc — realistic academic route; not climate-policy researcher without science remit.', isResearchRole: true }),
    r('Director of Meteorological Services', 'executive_scientific_director', 'Executive leadership of meteorological service delivery, R&D and stakeholder engagement.', { priority: 150, eligibilityNote: 'Meteorological services executive — not CIO or Head of Media.' }),
  ],
}

const CLIMATE_SCIENCE: SpecialismPack = {
  slug: 'climate-science',
  label: 'Climate Science',
  professionalBody: 'Royal Meteorological Society / Royal Society',
  relatedBodies: ['Met Office Hadley Centre', 'Intergovernmental Panel on Climate Change context'],
  sources: RMETS_SOURCES,
  siblingSlugs: siblings('climate-science'),
  roles: [
    r('Climate Data Technician', 'foundation_technical_entry', 'Curates climate observational datasets, metadata and QC pipelines for national climate centres.', { priority: 10, eligibilityNote: 'Climate data technician — not Data Engineer (IT) or generic IT support.' }),
    r('Climate Science Graduate Trainee', 'graduate_entry', 'Graduate trainee at Met Office Hadley Centre, universities or NGOs building climate analysis skills.', { priority: 20, eligibilityNote: 'Climate science graduate — not Meteorologist operational forecasting route (Meteorology specialism).' }),
    r('Graduate Climate Scientist', 'graduate_entry', 'First professional climate scientist role in attribution, projections or climate impacts science.', { priority: 30, eligibilityNote: 'Graduate climate scientist — distinct from Environmental Scientist (Environmental Science specialism).' }),
    r('Junior Climate Scientist', 'scientific_practitioner', 'Analyses climate indices, model ensembles and observational trends under senior scientist supervision.', { priority: 40, eligibilityNote: 'Junior climate scientist — not Junior Data Scientist or sustainability analyst alone.' }),
    r('Climate Scientist', 'scientific_practitioner', 'Independent climate scientist interpreting climate variability, projections and uncertainty for stakeholders.', { priority: 50, eligibilityNote: 'Core climate scientist — RMetS/Royal Society research context.' }),
    r('Climate Scientist (Climate Modelling)', 'experienced_scientist', 'Experienced in GCM/RCM configuration, model intercomparison and climate simulation analysis.', { priority: 60, eligibilityNote: 'Climate modeller — not Mathematical Modeller (general specialism) unless climate-specific remit.' }),
    r('Climate Scientist (Attribution Analysis)', 'experienced_scientist', 'Experienced in event attribution, detection methods and extreme-climate statistical framing.', { priority: 70, eligibilityNote: 'Attribution climate scientist — not Statistician (Statistics specialism) unless dual statistical-science remit.' }),
    r('Specialist Climate Scientist (Paleoclimate)', 'specialist_scientist', 'Specialist reconstructing past climates from ice cores, sediments and proxy archives.', { priority: 80, eligibilityNote: 'Paleoclimate specialist — related to Earth Scientist (palaeoenvironments) but climate-science focused.' }),
    r('Specialist Climate Scientist (Regional Projections)', 'specialist_scientist', 'Specialist in downscaling, regional climate projections and climate services for adaptation planning.', { priority: 90, eligibilityNote: 'Regional projections specialist — not urban planner or policy adviser without science delivery.' }),
    r('Senior Climate Scientist', 'senior_principal_scientist', 'Senior climate scientist leading peer review, publication programmes and cross-centre collaborations.', { priority: 100, eligibilityNote: 'Senior climate scientist — experience-led; PhD common but not automatic seniority.' }),
    r('Principal Climate Scientist', 'senior_principal_scientist', 'Principal climate authority on national climate assessments and major research consortia.', { priority: 110, eligibilityNote: 'Principal climate scientist IC — not Chief Sustainability Officer alone.' }),
    r('Head of Climate Research', 'research_lab_leadership', 'Leads climate research group, PhD supervision and grant portfolio at university or national centre.', { priority: 120, eligibilityNote: 'Climate research leadership — not Head of Meteorology operations (Meteorology specialism).' }),
    r('Postdoctoral Research Fellow (Climate Science)', 'academic_research', 'Postdoctoral climate scientist in modelling, observations or impacts research programmes.', { priority: 130, eligibilityNote: 'Climate science postdoc — realistic academic/research institute route.', isResearchRole: true }),
    r('Lecturer in Climate Science', 'academic_research', 'HE lecturer teaching climate dynamics, policy-science interfaces and research methods.', { priority: 140, eligibilityNote: 'Climate science academic — not Geography school teacher routes.', isAcademicRole: true }),
    r('Director of Climate Science Programme', 'executive_scientific_director', 'Executive leadership of institutional climate science strategy, partnerships and major programmes.', { priority: 150, eligibilityNote: 'Climate science executive — not NGO campaigns director without research remit.' }),
  ],
}

const HYDROLOGY: SpecialismPack = {
  slug: 'hydrology',
  label: 'Hydrology',
  professionalBody: 'British Hydrological Society / CIWEM',
  relatedBodies: ['Environment Agency', 'Centre for Ecology & Hydrology'],
  sources: BHS_SOURCES,
  siblingSlugs: siblings('hydrology'),
  roles: [
    r('Hydrological Field Technician', 'foundation_technical_entry', 'Installs and maintains flow gauges, rain gauges and telemetry for hydrological monitoring networks.', { priority: 10, eligibilityNote: 'Hydrological field technician — realistic Environment Agency/CEH entry; not generic construction labourer.' }),
    r('Hydrometry Technician', 'foundation_technical_entry', 'Conducts river flow gaugings, stage-discharge ratings and hydrometric station QA.', { priority: 20, eligibilityNote: 'Hydrometry technician — hydrology-specific; not Meteorological observing technician.' }),
    r('Hydrology Graduate Trainee', 'graduate_entry', 'Graduate trainee with Environment Agency, water companies or consultancies building catchment hydrology skills.', { priority: 30, eligibilityNote: 'Hydrology graduate entry — not Civil Engineer (Engineering field) graduate unless hydrology-science remit.' }),
    r('Graduate Hydrologist', 'graduate_entry', 'First professional hydrologist role in flood estimation, water resources or catchment modelling.', { priority: 40, eligibilityNote: 'Graduate hydrologist — distinct from Graduate Environmental Scientist.' }),
    r('Junior Hydrologist', 'scientific_practitioner', 'Supports hydrological models, data analysis and flood mapping under senior hydrologist supervision.', { priority: 50, eligibilityNote: 'Junior hydrologist — not Junior Data Analyst or GIS technician alone.' }),
    r('Hydrologist', 'scientific_practitioner', 'Independent hydrologist assessing catchment water balance, flows and drought/flood indicators.', { priority: 60, eligibilityNote: 'Core hydrologist — British Hydrological Society professional context.' }),
    r('Hydrologist (Flood Risk Modelling)', 'experienced_scientist', 'Experienced in rainfall-runoff modelling, fluvial flood mapping and scenario analysis for FRMPs.', { priority: 70, eligibilityNote: 'Flood risk hydrologist — not Flood Risk Manager (non-scientific policy) unless science-led.' }),
    r('Hydrologist (Catchment Management)', 'experienced_scientist', 'Experienced in catchment hydrology, land-use effects and natural flood management evidence.', { priority: 80, eligibilityNote: 'Catchment hydrologist — not Ecologist (Conservation Science) unless dual remit.' }),
    r('Specialist Hydrologist (Groundwater–Surface Water)', 'specialist_scientist', 'Specialist integrating groundwater levels, baseflow separation and coupled aquifer–river systems.', { priority: 90, eligibilityNote: 'Groundwater–surface water specialist — related to Engineering Geologist hydrogeology but hydrology-science focused.' }),
    r('Specialist Hydrologist (Water Resources Planning)', 'specialist_scientist', 'Specialist in water resource yield, drought planning and environmental flow assessments.', { priority: 100, eligibilityNote: 'Water resources hydrologist — not Water Company commercial manager without hydrological science.' }),
    r('Senior Hydrologist', 'senior_principal_scientist', 'Senior hydrologist signing off hydrological studies, model audits and regulatory submissions.', { priority: 110, eligibilityNote: 'Senior hydrologist — CIWEM chartership may be desirable; experience-led progression.' }),
    r('Principal Hydrologist', 'senior_principal_scientist', 'Principal hydrological authority on national flood and drought science programmes.', { priority: 120, eligibilityNote: 'Principal hydrologist IC — not dam safety engineer alone.' }),
    r('Head of Hydrological Services', 'research_lab_leadership', 'Leads hydrological monitoring, modelling teams and technical standards for agency or consultancy.', { priority: 130, eligibilityNote: 'Hydrology services leadership — not Head of Water Operations (commercial).' }),
    r('Postdoctoral Research Fellow (Hydrology)', 'academic_research', 'Postdoctoral hydrologist in ecohydrology, remote sensing hydrology or climate-hydrology research.', { priority: 140, eligibilityNote: 'Hydrology postdoc — realistic at CEH/university research groups.', isResearchRole: true }),
    r('Director of Water Resources Science', 'executive_scientific_director', 'Executive leadership of hydrological science capability for national or utility organisations.', { priority: 150, eligibilityNote: 'Hydrology executive — not CFO or commercial director without science remit.' }),
  ],
}

const SOIL_SCIENCE: SpecialismPack = {
  slug: 'soil-science',
  label: 'Soil Science',
  professionalBody: 'British Society of Soil Science',
  relatedBodies: ['Rothamsted Research context', 'ADAS / agricultural research context'],
  sources: BSSS_SOURCES,
  siblingSlugs: siblings('soil-science'),
  roles: [
    r('Soil Survey Field Technician', 'foundation_technical_entry', 'Collects soil cores, horizon descriptions and field moisture samples for survey programmes.', { priority: 10, eligibilityNote: 'Soil survey field technician — realistic BSSS entry; not general farm worker without soil science remit.' }),
    r('Soil Laboratory Technician', 'foundation_technical_entry', 'Runs particle size, organic matter and nutrient analyses in soil science laboratories.', { priority: 20, eligibilityNote: 'Soil lab technician — not biomedical or environmental chemistry lab alone without soil focus.' }),
    r('Soil Science Graduate Trainee', 'graduate_entry', 'Graduate trainee with agricultural research institutes, consultancies or land-management agencies.', { priority: 30, eligibilityNote: 'Soil science graduate entry — not Agronomist (advisory) unless soil-science practitioner remit.' }),
    r('Graduate Soil Scientist', 'graduate_entry', 'First professional soil scientist role in land quality, contamination or agricultural soil health.', { priority: 40, eligibilityNote: 'Graduate soil scientist — distinct from Graduate Environmental Scientist.' }),
    r('Junior Soil Scientist', 'scientific_practitioner', 'Supports soil mapping, fertility interpretation and land capability assessments under supervision.', { priority: 50, eligibilityNote: 'Junior soil scientist — not Junior Ecologist (Conservation Science).' }),
    r('Soil Scientist', 'scientific_practitioner', 'Independent soil scientist assessing soil properties, classification and land-use impacts.', { priority: 60, eligibilityNote: 'Core soil scientist — British Society of Soil Science context.' }),
    r('Soil Scientist (Land Management)', 'experienced_scientist', 'Experienced in soil compaction, erosion risk and sustainable land-management recommendations.', { priority: 70, eligibilityNote: 'Land management soil scientist — not Farm Manager without soil-science delivery.' }),
    r('Soil Scientist (Contaminated Land Soils)', 'experienced_scientist', 'Experienced assessing soil contamination, bioavailability and remediation verification sampling.', { priority: 80, eligibilityNote: 'Contaminated land soils — related to Environmental Scientist (contaminated land) but soil-science specialist.' }),
    r('Specialist Soil Scientist (Pedology)', 'specialist_scientist', 'Specialist in soil genesis, profile description and national soil taxonomy/classification work.', { priority: 90, eligibilityNote: 'Pedology specialist — not Geologist (Geology specialism) unless pedological remit explicit.' }),
    r('Specialist Soil Scientist (Soil Fertility)', 'specialist_scientist', 'Specialist in nutrient cycling, soil organic carbon and precision soil fertility programmes.', { priority: 100, eligibilityNote: 'Soil fertility specialist — not Fertiliser sales agronomist without scientific soil analysis.' }),
    r('Senior Soil Scientist', 'senior_principal_scientist', 'Senior soil scientist leading survey design, method validation and technical report sign-off.', { priority: 110, eligibilityNote: 'Senior soil scientist — experience-led progression.' }),
    r('Principal Soil Scientist', 'senior_principal_scientist', 'Principal soil science authority on national soil monitoring and major agricultural research programmes.', { priority: 120, eligibilityNote: 'Principal soil scientist IC — not estates manager.' }),
    r('Head of Soil Science', 'research_lab_leadership', 'Leads soil science group, field campaigns and postgraduate training at institute or consultancy.', { priority: 130, eligibilityNote: 'Soil science leadership — not Head of Agronomy (commercial).' }),
    r('Postdoctoral Research Fellow (Soil Science)', 'academic_research', 'Postdoctoral soil scientist in carbon sequestration, microbiome or pedology research.', { priority: 140, eligibilityNote: 'Soil science postdoc — realistic academic/agricultural research route.', isResearchRole: true }),
    r('Director of Soil and Land Resources', 'executive_scientific_director', 'Executive leadership of soil science capability for national land-management or research organisations.', { priority: 150, eligibilityNote: 'Soil science executive — not rural estate director without science remit.' }),
  ],
}

const CONSERVATION_SCIENCE: SpecialismPack = {
  slug: 'conservation-science',
  label: 'Conservation Science',
  professionalBody: 'CIEEM / British Ecological Society',
  relatedBodies: ['Natural England', 'Wildlife Trusts', 'JNCC'],
  sources: CONSERVATION_SOURCES,
  siblingSlugs: siblings('conservation-science'),
  roles: [
    r('Ecology Field Survey Technician', 'foundation_technical_entry', 'Conducts Phase 1 habitat surveys, protected-species field signs and ecological data recording on sites.', { priority: 10, eligibilityNote: 'Ecology field survey technician — CIEEM entry context; not generic countryside ranger without survey skills.' }),
    r('Conservation Field Assistant', 'foundation_technical_entry', 'Supports habitat management monitoring, species transects and reserve ecological data collection.', { priority: 20, eligibilityNote: 'Conservation field assistant — realistic NGO/agency entry; not zoo keeper unless field ecology remit.' }),
    r('Conservation Science Graduate Trainee', 'graduate_entry', 'Graduate trainee with ecological consultancies or conservation NGOs building survey and assessment skills.', { priority: 30, eligibilityNote: 'Conservation science graduate — not Environmental Scientist (Environmental Science specialism) unless ecology-focused.' }),
    r('Graduate Ecologist (Conservation Science)', 'graduate_entry', 'First professional ecologist role in biodiversity monitoring, EIA ecology chapters or species recovery.', { priority: 40, eligibilityNote: 'Graduate ecologist — CIEEM career pathway; not Data Scientist or GIS developer alone.' }),
    r('Junior Ecologist (Conservation)', 'scientific_practitioner', 'Delivers ecological surveys, mitigation recommendations and report sections under senior ecologist supervision.', { priority: 50, eligibilityNote: 'Junior conservation ecologist — not Junior Environmental Scientist without ecology remit.' }),
    r('Ecologist (Conservation Science)', 'scientific_practitioner', 'Independent ecologist assessing biodiversity value, habitat condition and conservation interventions.', { priority: 60, eligibilityNote: 'Core conservation ecologist — CIEEM/BES professional context.' }),
    r('Ecologist (Habitat Assessment)', 'experienced_scientist', 'Experienced in UKHab/BNG metrics, habitat condition assessment and ecological impact evaluation.', { priority: 70, eligibilityNote: 'Habitat assessment ecologist — not Planning Officer or landscape architect without ecology science.' }),
    r('Conservation Scientist (Species Recovery)', 'experienced_scientist', 'Experienced designing species recovery programmes, monitoring protocols and reintroduction evidence.', { priority: 80, eligibilityNote: 'Species recovery conservation scientist — not Veterinary Surgeon or zoo curator routes.' }),
    r('Specialist Ecologist (Protected Species)', 'specialist_scientist', 'Specialist licensed surveyor for bats, great crested newts, dormice or other protected UK species.', { priority: 90, professionalRegistrationRequirement: 'desirable', eligibilityNote: 'Protected species ecologist — CIEEM membership commonly expected; licence-holder specialist role.' }),
    r('Specialist Conservation Scientist (Biodiversity Monitoring)', 'specialist_scientist', 'Specialist in long-term biodiversity indicators, citizen-science QA and conservation evidence synthesis.', { priority: 100, eligibilityNote: 'Biodiversity monitoring specialist — not Statistician (Statistics specialism) unless dual remit.' }),
    r('Senior Ecologist (CIEEM Chartered Route)', 'senior_principal_scientist', 'Senior ecologist progressing toward CIEEM Chartered Ecologist with technical sign-off on ecology reports.', { priority: 110, professionalRegistrationRequirement: 'commonly_expected', eligibilityNote: 'Senior ecologist CIEEM chartered route — commonly expected for consultancies at senior sign-off.' }),
    r('Principal Conservation Scientist', 'senior_principal_scientist', 'Principal conservation science authority on landscape-scale recovery and evidence programmes.', { priority: 120, eligibilityNote: 'Principal conservation scientist — not NGO fundraising director without science remit.' }),
    r('Head of Ecology and Conservation', 'research_lab_leadership', 'Leads ecology team, survey standards, training and client/conservation-partner technical management.', { priority: 130, eligibilityNote: 'Ecology and conservation leadership — CIEEM professional context.' }),
    r('Postdoctoral Research Fellow (Conservation Science)', 'academic_research', 'Postdoctoral conservation scientist in population ecology, reintroduction science or conservation genetics.', { priority: 140, eligibilityNote: 'Conservation science postdoc — realistic academic/institute route; not molecular biology postdoc alone.', isResearchRole: true }),
    r('Director of Conservation Science', 'executive_scientific_director', 'Executive leadership of conservation science programme, evidence strategy and major partnerships.', { priority: 150, eligibilityNote: 'Conservation science executive — not Head of Marketing or volunteer coordinator.' }),
  ],
}

export const MATH_EARTH_PACKS: SpecialismPack[] = [
  MATHEMATICS,
  APPLIED_MATHEMATICS,
  STATISTICS,
  OPERATIONAL_RESEARCH,
  MATHEMATICAL_MODELLING,
  ENVIRONMENTAL_SCIENCE,
  EARTH_SCIENCE,
  GEOLOGY,
  GEOPHYSICS,
  GEOCHEMISTRY,
  OCEANOGRAPHY,
  METEOROLOGY,
  CLIMATE_SCIENCE,
  HYDROLOGY,
  SOIL_SCIENCE,
  CONSERVATION_SCIENCE,
]

/** Role counts per specialism (16 packs × 15 roles = 240 total). */
export const MATH_EARTH_PACK_ROLE_COUNTS: Record<string, number> = Object.fromEntries(
  MATH_EARTH_PACKS.map((p) => [p.slug, p.roles.length])
)
