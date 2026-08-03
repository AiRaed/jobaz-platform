import { r, type SpecialismPack } from './shared'

const CHEM_PHYS_SLUGS = [
  'chemistry',
  'analytical-chemistry',
  'medicinal-chemistry',
  'materials-chemistry',
  'physics',
  'applied-physics',
  'astrophysics-and-astronomy',
  'medical-physics',
  'nuclear-science',
  'materials-science',
  'nanoscience-and-nanotechnology',
] as const

function siblings(self: string): string[] {
  return CHEM_PHYS_SLUGS.filter((s) => s !== self)
}

const RSC_SOURCES = [
  'prospects_chemist',
  'rsc_careers',
  'national_careers_service_chemist',
  'prospects_research_scientist',
]

const IOP_SOURCES = [
  'prospects_physicist',
  'iop_careers',
  'national_careers_service_physicist',
  'prospects_research_scientist',
]

const MEDICAL_PHYSICS_SOURCES = [
  'nhs_health_careers_medical_physics',
  'ipem_careers',
  'hcpc_clinical_scientist',
  'prospects_medical_physicist',
  'national_careers_service_medical_physicist',
]

// ---------------------------------------------------------------------------
// Chemistry family (RSC)
// ---------------------------------------------------------------------------

const CHEMISTRY: SpecialismPack = {
  slug: 'chemistry',
  label: 'Chemistry',
  professionalBody: 'Royal Society of Chemistry (RSC)',
  relatedBodies: ['RSC', 'SCI', 'Chemistry Council'],
  sources: RSC_SOURCES,
  siblingSlugs: siblings('chemistry'),
  roles: [
    r(
      'Laboratory Technician (Chemistry)',
      'foundation_technical_entry',
      'Supports bench chemistry work — preparation, titrations, basic analysis and laboratory housekeeping under supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Core chemistry technician route — not Analytical Chemistry or Medicinal Chemistry specialist technician titles.',
      }
    ),
    r(
      'Chemical Science Apprentice',
      'foundation_technical_entry',
      'Level 3–5 laboratory science apprenticeship building practical chemistry skills in industry or research settings.',
      {
        priority: 20,
        eligibilityNote:
          'Broad chemical science apprenticeship — not pharmaceutical-only or materials-only apprenticeship routes.',
      }
    ),
    r(
      'Graduate Chemist',
      'graduate_entry',
      'First professional chemistry role after a relevant degree, typically in R&D, manufacturing or analytical support.',
      {
        priority: 30,
        eligibilityNote:
          'General graduate chemist entry — not Graduate Analytical Chemist or Graduate Medicinal Chemist titles.',
      }
    ),
    r(
      'Chemistry Graduate Scheme Trainee',
      'graduate_entry',
      'Structured graduate programme in chemicals, FMCG or research organisations building core chemistry capability.',
      {
        priority: 40,
        eligibilityNote:
          'Graduate scheme chemistry entry — not Materials Chemistry or Medicinal Chemistry graduate trainees.',
      }
    ),
    r(
      'Chemist',
      'scientific_practitioner',
      'Independent delivery of synthesis, analysis or process chemistry with method ownership and quality documentation.',
      {
        priority: 50,
        eligibilityNote:
          'Core practitioner chemist — distinct from Analytical Chemist or Medicinal Chemist practitioner roles.',
      }
    ),
    r(
      'Research Chemist (Laboratory)',
      'scientific_practitioner',
      'Conducts experimental chemistry in academic or industrial labs — reaction optimisation, purification and characterisation.',
      {
        priority: 60,
        eligibilityNote:
          'Laboratory research chemist — not Postdoctoral Research Fellow (Chemistry) academic track.',
        isResearchRole: true,
      }
    ),
    r(
      'Chemist (Industrial Synthesis)',
      'experienced_scientist',
      'Develops and scales chemical processes for manufacturing with safety, yield and purity accountability.',
      {
        priority: 70,
        eligibilityNote:
          'Industrial synthesis chemist — not Chemical Engineer or Process Engineer (Engineering field).',
      }
    ),
    r(
      'Chemist (Quality and Compliance)',
      'experienced_scientist',
      'Ensures chemical products and processes meet GMP/ISO standards through testing, audits and documentation.',
      {
        priority: 80,
        eligibilityNote:
          'Quality-focused chemist — not Scientific Quality and Compliance cross-discipline specialism owner.',
      }
    ),
    r(
      'Specialist Chemist (Organic Chemistry)',
      'specialist_scientist',
      'Deep expertise in organic synthesis, reaction mechanisms and structure elucidation for R&D programmes.',
      {
        priority: 90,
        eligibilityNote:
          'Organic chemistry specialist — not Specialist Medicinal Chemist (Hit-to-Lead) drug-discovery focus.',
      }
    ),
    r(
      'Specialist Chemist (Inorganic Chemistry)',
      'specialist_scientist',
      'Focused on inorganic synthesis, coordination chemistry and materials-relevant inorganic systems.',
      {
        priority: 100,
        eligibilityNote:
          'Inorganic chemistry specialist — not Materials Chemist or Materials Scientist titles.',
      }
    ),
    r(
      'Senior Chemist (R&D)',
      'senior_principal_scientist',
      'Leads complex chemistry projects, mentors junior chemists and owns technical decisions in R&D programmes.',
      {
        priority: 110,
        eligibilityNote:
          'Senior R&D chemist — not Senior Analytical Chemist or Senior Medicinal Chemist roles.',
      }
    ),
    r(
      'Principal Chemist (Formulation)',
      'senior_principal_scientist',
      'Principal-level authority on formulation chemistry, product stability and scale-up strategy.',
      {
        priority: 120,
        eligibilityNote:
          'Principal formulation chemist — not Principal Materials Chemist or Principal Analytical Scientist.',
      }
    ),
    r(
      'Chemistry Laboratory Manager',
      'research_lab_leadership',
      'Manages chemistry laboratory operations, safety, staffing and equipment for research or production labs.',
      {
        priority: 130,
        eligibilityNote:
          'Chemistry lab management — not Laboratory Management cross-discipline or Medical Physics lab lead.',
      }
    ),
    r(
      'Head of Chemistry Research',
      'research_lab_leadership',
      'Leads a chemistry research group or department — programme direction, grants and scientific strategy.',
      {
        priority: 140,
        eligibilityNote:
          'Chemistry research leadership — not Head of Medicinal Chemistry or Head of Analytical Chemistry.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Chemistry)',
      'academic_research',
      'Post-PhD researcher conducting independent chemistry research under academic supervision.',
      {
        priority: 150,
        eligibilityNote:
          'Postdoc chemistry research — not Lecturer in Chemistry or Research Chemist (Laboratory) industry role.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Chemistry',
      'academic_research',
      'University lecturer teaching chemistry and supervising undergraduate and postgraduate research projects.',
      {
        priority: 160,
        eligibilityNote:
          'HE chemistry teaching — not Lecturer in Medicinal Chemistry or Lecturer in Materials Chemistry.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Chemistry (R&D)',
      'executive_scientific_director',
      'Executive leadership of chemistry R&D function — portfolio strategy, investment and scientific governance.',
      {
        priority: 170,
        eligibilityNote:
          'Director-level chemistry leadership — not Director of Analytical Science or Director of Medicinal Chemistry.',
      }
    ),
  ],
}

const ANALYTICAL_CHEMISTRY: SpecialismPack = {
  slug: 'analytical-chemistry',
  label: 'Analytical Chemistry',
  professionalBody: 'Royal Society of Chemistry (RSC)',
  relatedBodies: ['RSC', 'Royal Society of Chemistry Analytical Division'],
  sources: [
    'prospects_analytical_chemist',
    'rsc_analytical_chemistry',
    'national_careers_service_chemist',
    'prospects_research_scientist',
  ],
  siblingSlugs: siblings('analytical-chemistry'),
  roles: [
    r(
      'Analytical Laboratory Technician',
      'foundation_technical_entry',
      'Prepares samples, runs routine chromatography and spectroscopy under analytical chemist supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Analytical technician route — not general Laboratory Technician (Chemistry) or biomedical lab assistant.',
      }
    ),
    r(
      'Analytical Chemistry Apprentice',
      'foundation_technical_entry',
      'Apprenticeship focused on chemical measurement, instrument calibration and method following in QC labs.',
      {
        priority: 20,
        eligibilityNote:
          'Analytical chemistry apprenticeship — not Chemical Science Apprentice broad route.',
      }
    ),
    r(
      'Graduate Analytical Chemist',
      'graduate_entry',
      'Entry analytical role performing method validation, sample analysis and data reporting after a chemistry degree.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate analytical entry — not Graduate Chemist general or Graduate Materials Chemist titles.',
      }
    ),
    r(
      'Trainee Analytical Scientist',
      'graduate_entry',
      'Structured trainee building expertise in HPLC, GC-MS, ICP and laboratory quality systems.',
      {
        priority: 40,
        eligibilityNote:
          'Analytical scientist trainee — not Trainee Biomedical Scientist or STP Clinical Scientist routes.',
      }
    ),
    r(
      'Analytical Chemist',
      'scientific_practitioner',
      'Independent analytical work — chromatography, spectroscopy, wet chemistry and result interpretation.',
      {
        priority: 50,
        eligibilityNote:
          'Core analytical practitioner — distinct from Chemist (Quality and Compliance) broader remit.',
      }
    ),
    r(
      'Analytical Scientist (Chromatography)',
      'scientific_practitioner',
      'Specialises in HPLC, GC and LC-MS method operation, troubleshooting and data quality.',
      {
        priority: 60,
        eligibilityNote:
          'Chromatography practitioner — not Analytical Scientist in non-chemistry disciplines.',
      }
    ),
    r(
      'Analytical Chemist (Method Development)',
      'experienced_scientist',
      'Develops and validates new analytical methods for pharmaceuticals, environment or materials testing.',
      {
        priority: 70,
        eligibilityNote:
          'Method development analytical chemist — not Medicinal Chemist (Lead Optimisation) synthesis focus.',
      }
    ),
    r(
      'Analytical Chemist (Spectroscopy)',
      'experienced_scientist',
      'Expert in NMR, IR, UV-Vis and mass spectrometry for structural confirmation and impurity profiling.',
      {
        priority: 80,
        eligibilityNote:
          'Spectroscopy analytical chemist — not Physicist (Experimental) or Materials Characterisation Scientist.',
      }
    ),
    r(
      'Specialist Analytical Chemist (Mass Spectrometry)',
      'specialist_scientist',
      'Advanced MS specialist — method development, instrument maintenance and complex spectral interpretation.',
      {
        priority: 90,
        eligibilityNote:
          'MS analytical specialist — not Specialist Materials Scientist (Failure Analysis) metallurgical focus.',
      }
    ),
    r(
      'Specialist Analytical Chemist (GLP Validation)',
      'specialist_scientist',
      'Leads GLP/GMP analytical validation, audit readiness and regulatory submission support.',
      {
        priority: 100,
        eligibilityNote:
          'GLP validation specialist — not Scientific Quality and Compliance cross-discipline manager.',
      }
    ),
    r(
      'Senior Analytical Chemist',
      'senior_principal_scientist',
      'Senior analytical authority — complex problem-solving, mentoring and laboratory technical leadership.',
      {
        priority: 110,
        eligibilityNote:
          'Senior analytical chemist — not Senior Chemist (R&D) or Senior Medicinal Chemist roles.',
      }
    ),
    r(
      'Principal Analytical Scientist',
      'senior_principal_scientist',
      'Principal-level analytical science authority across multiple techniques and business-critical programmes.',
      {
        priority: 120,
        eligibilityNote:
          'Principal analytical scientist — not Principal Chemist (Formulation) or Principal Materials Chemist.',
      }
    ),
    r(
      'Analytical Laboratory Supervisor',
      'research_lab_leadership',
      'Supervises analytical laboratory teams, rotas, instrument schedules and method compliance.',
      {
        priority: 130,
        eligibilityNote:
          'Analytical lab supervision — not Chemistry Laboratory Manager general chemistry remit.',
      }
    ),
    r(
      'Head of Analytical Chemistry Services',
      'research_lab_leadership',
      'Leads analytical chemistry service delivery — capacity, accreditation and client/internal stakeholder management.',
      {
        priority: 140,
        eligibilityNote:
          'Head of analytical services — not Head of Chemistry Research or Head of Medicinal Chemistry.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Analytical Chemistry)',
      'academic_research',
      'Post-PhD researcher developing novel analytical techniques or instrumentation in university settings.',
      {
        priority: 150,
        eligibilityNote:
          'Analytical chemistry postdoc — not Postdoctoral Research Fellow (Chemistry) general title.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Analytical Chemistry',
      'academic_research',
      'University lecturer teaching analytical methods, instrumentation and supervising research students.',
      {
        priority: 160,
        eligibilityNote:
          'HE analytical chemistry teaching — not Lecturer in Chemistry general or Lecturer in Medicinal Chemistry.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Analytical Science',
      'executive_scientific_director',
      'Executive leadership of analytical science capability — strategy, investment and regulatory alignment.',
      {
        priority: 170,
        eligibilityNote:
          'Director analytical science — not Director of Chemistry (R&D) or Director of Materials Science.',
      }
    ),
  ],
}

const MEDICINAL_CHEMISTRY: SpecialismPack = {
  slug: 'medicinal-chemistry',
  label: 'Medicinal Chemistry',
  professionalBody: 'Royal Society of Chemistry (RSC)',
  relatedBodies: ['RSC', 'British Pharmacological Society', 'ABPI'],
  sources: [
    'prospects_medicinal_chemist',
    'rsc_medicinal_chemistry',
    'national_careers_service_chemist',
    'prospects_pharma_research',
  ],
  siblingSlugs: siblings('medicinal-chemistry'),
  roles: [
    r(
      'Medicinal Chemistry Laboratory Technician',
      'foundation_technical_entry',
      'Supports drug-discovery chemistry — compound handling, library prep and basic purification under supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Medicinal chemistry technician — not Pharmaceutical Chemistry Apprentice or general lab technician.',
      }
    ),
    r(
      'Pharmaceutical Chemistry Apprentice',
      'foundation_technical_entry',
      'Apprenticeship in pharmaceutical R&D or manufacturing chemistry labs building GMP-aware skills.',
      {
        priority: 20,
        eligibilityNote:
          'Pharmaceutical chemistry apprenticeship — not Chemical Science Apprentice broad industry route.',
      }
    ),
    r(
      'Graduate Medicinal Chemist',
      'graduate_entry',
      'Entry role in drug discovery synthesising and profiling candidate molecules after a chemistry or medicinal chemistry degree.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate medicinal chemist — not Graduate Chemist general or Pharmacology graduate routes.',
      }
    ),
    r(
      'Medicinal Chemistry Graduate Trainee',
      'graduate_entry',
      'Structured trainee in pharma/biotech discovery teams learning SAR, library design and ADME support.',
      {
        priority: 40,
        eligibilityNote:
          'Medicinal chemistry graduate trainee — not Medicinal Chemistry Graduate Scheme in non-chemistry contexts.',
      }
    ),
    r(
      'Medicinal Chemist',
      'scientific_practitioner',
      'Designs and synthesises bioactive compounds, interprets SAR data and collaborates with biology teams.',
      {
        priority: 50,
        eligibilityNote:
          'Core medicinal chemist practitioner — not Chemist (Industrial Synthesis) manufacturing focus.',
      }
    ),
    r(
      'Medicinal Chemist (Drug Discovery)',
      'scientific_practitioner',
      'Works in discovery project teams on hit identification, lead series expansion and optimisation.',
      {
        priority: 60,
        eligibilityNote:
          'Discovery medicinal chemist — not Clinical Research roles or Pharmacologist (research) titles.',
        isResearchRole: true,
      }
    ),
    r(
      'Medicinal Chemist (Lead Optimisation)',
      'experienced_scientist',
      'Leads lead-optimisation chemistry — potency, selectivity, PK and developability trade-offs.',
      {
        priority: 70,
        eligibilityNote:
          'Lead optimisation medicinal chemist — not Analytical Chemist (Method Development) or Process Chemist.',
      }
    ),
    r(
      'Medicinal Chemist (Structure-Activity Relationships)',
      'experienced_scientist',
      'Deep SAR analysis linking molecular changes to biological activity for programme decision-making.',
      {
        priority: 80,
        eligibilityNote:
          'SAR-focused medicinal chemist — not Computational Chemistry roles owned by other specialisms.',
      }
    ),
    r(
      'Specialist Medicinal Chemist (Hit-to-Lead)',
      'specialist_scientist',
      'Specialist in progressing screening hits to lead series with multi-parameter optimisation.',
      {
        priority: 90,
        eligibilityNote:
          'Hit-to-lead specialist — not Specialist Chemist (Organic Chemistry) without drug-discovery context.',
      }
    ),
    r(
      'Specialist Medicinal Chemist (Computational Chemistry Support)',
      'specialist_scientist',
      'Integrates computational modelling with bench chemistry for design, docking and property prediction.',
      {
        priority: 100,
        eligibilityNote:
          'Computational medicinal chemistry — not IT Data Scientist or pure Computational Physics roles.',
      }
    ),
    r(
      'Senior Medicinal Chemist',
      'senior_principal_scientist',
      'Senior discovery chemist leading project chemistry workstreams and mentoring junior medicinal chemists.',
      {
        priority: 110,
        eligibilityNote:
          'Senior medicinal chemist — not Senior Chemist (R&D) non-pharma or Senior Pharmacologist.',
      }
    ),
    r(
      'Principal Medicinal Chemist (Discovery)',
      'senior_principal_scientist',
      'Principal authority on discovery chemistry strategy, target selection support and portfolio chemistry.',
      {
        priority: 120,
        eligibilityNote:
          'Principal discovery medicinal chemist — not Principal Analytical Scientist or Principal Chemist (Formulation).',
      }
    ),
    r(
      'Medicinal Chemistry Team Leader',
      'research_lab_leadership',
      'Leads a medicinal chemistry team — project allocation, lab safety and delivery against discovery milestones.',
      {
        priority: 130,
        eligibilityNote:
          'Medicinal chemistry team lead — not Head of Chemistry Research academic group leadership.',
      }
    ),
    r(
      'Head of Medicinal Chemistry',
      'research_lab_leadership',
      'Department head for medicinal chemistry in pharma/biotech — hiring, pipeline and scientific standards.',
      {
        priority: 140,
        eligibilityNote:
          'Head of medicinal chemistry — not Head of Analytical Chemistry Services or Clinical Research lead.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Medicinal Chemistry)',
      'academic_research',
      'Post-PhD researcher in academic drug-discovery chemistry or chemical biology programmes.',
      {
        priority: 150,
        eligibilityNote:
          'Medicinal chemistry postdoc — not Postdoctoral Research Fellow (Chemistry) general or Clinical Research Fellow.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Medicinal Chemistry',
      'academic_research',
      'University lecturer teaching medicinal chemistry, drug design and supervising postgraduate research.',
      {
        priority: 160,
        eligibilityNote:
          'HE medicinal chemistry teaching — not Lecturer in Pharmacology or Lecturer in Chemistry general.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Medicinal Chemistry',
      'executive_scientific_director',
      'Executive leadership of medicinal chemistry discovery function — portfolio, partnerships and investment.',
      {
        priority: 170,
        eligibilityNote:
          'Director medicinal chemistry — not Director of Chemistry (R&D) general or Medical Director (clinical).',
      }
    ),
  ],
}

const MATERIALS_CHEMISTRY: SpecialismPack = {
  slug: 'materials-chemistry',
  label: 'Materials Chemistry',
  professionalBody: 'Royal Society of Chemistry (RSC)',
  relatedBodies: ['RSC', 'Institute of Materials, Minerals and Mining (IOM3)'],
  sources: [
    'prospects_materials_chemist',
    'rsc_materials_chemistry',
    'national_careers_service_chemist',
    'iom3_careers',
  ],
  siblingSlugs: siblings('materials-chemistry'),
  roles: [
    r(
      'Materials Chemistry Laboratory Technician',
      'foundation_technical_entry',
      'Supports synthesis and testing of novel materials — sample prep, furnaces and basic characterisation.',
      {
        priority: 10,
        eligibilityNote:
          'Materials chemistry technician — not Materials Testing Technician (Materials Science) or general chemistry tech.',
      }
    ),
    r(
      'Materials Chemistry Apprentice',
      'foundation_technical_entry',
      'Apprenticeship in materials R&D labs learning polymer, ceramic or composite chemistry preparation.',
      {
        priority: 20,
        eligibilityNote:
          'Materials chemistry apprenticeship — not Materials Science Laboratory Apprentice (science not chemistry focus).',
      }
    ),
    r(
      'Graduate Materials Chemist',
      'graduate_entry',
      'Entry role designing and synthesising functional materials after a chemistry or materials chemistry degree.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate materials chemist — not Graduate Materials Scientist or Graduate Chemist general titles.',
      }
    ),
    r(
      'Materials Chemistry Graduate Trainee',
      'graduate_entry',
      'Structured trainee in coatings, battery materials or advanced polymer chemistry programmes.',
      {
        priority: 40,
        eligibilityNote:
          'Materials chemistry graduate trainee — not Materials Science Graduate Trainee (structure-property focus).',
      }
    ),
    r(
      'Materials Chemist',
      'scientific_practitioner',
      'Synthesises and characterises novel materials — polymers, MOFs, nanomaterials or functional coatings.',
      {
        priority: 50,
        eligibilityNote:
          'Core materials chemist — distinct from Materials Scientist (Metallurgy) and Chemist (Industrial Synthesis).',
      }
    ),
    r(
      'Materials Chemist (Polymer Chemistry)',
      'scientific_practitioner',
      'Focuses on polymer synthesis, formulation chemistry and macromolecular structure–property relationships.',
      {
        priority: 60,
        eligibilityNote:
          'Polymer chemistry practitioner — not Materials Scientist (Ceramics and Polymers) science framing.',
      }
    ),
    r(
      'Materials Chemist (Surface Chemistry)',
      'experienced_scientist',
      'Develops surface treatments, coatings and interface chemistry for industrial or research applications.',
      {
        priority: 70,
        eligibilityNote:
          'Surface chemistry materials chemist — not Corrosion Engineer (Engineering field) titles.',
      }
    ),
    r(
      'Materials Chemist (Characterisation)',
      'experienced_scientist',
      'Expert in XRD, TEM, DSC and spectroscopic characterisation of synthesized materials.',
      {
        priority: 80,
        eligibilityNote:
          'Materials chemistry characterisation — not Materials Characterisation Scientist (Materials Science pack).',
      }
    ),
    r(
      'Specialist Materials Chemist (Nanomaterials Synthesis)',
      'specialist_scientist',
      'Specialist in bottom-up synthesis of nanomaterials — quantum dots, nanoparticles and 2D materials.',
      {
        priority: 90,
        eligibilityNote:
          'Nanomaterials synthesis chemist — not Nanoscientist or Nanotechnology Research Scientist titles.',
      }
    ),
    r(
      'Specialist Materials Chemist (Catalysis)',
      'specialist_scientist',
      'Designs heterogeneous and homogeneous catalysts for industrial and research applications.',
      {
        priority: 100,
        eligibilityNote:
          'Catalysis materials chemist — not Specialist Chemist (Inorganic Chemistry) without materials focus.',
      }
    ),
    r(
      'Senior Materials Chemist',
      'senior_principal_scientist',
      'Senior materials chemistry authority — programme leadership, mentoring and IP generation.',
      {
        priority: 110,
        eligibilityNote:
          'Senior materials chemist — not Senior Materials Scientist or Senior Chemist (R&D) general.',
      }
    ),
    r(
      'Principal Materials Chemist',
      'senior_principal_scientist',
      'Principal-level materials chemistry expert shaping R&D roadmaps and external collaborations.',
      {
        priority: 120,
        eligibilityNote:
          'Principal materials chemist — not Principal Materials Scientist or Principal Chemist (Formulation).',
      }
    ),
    r(
      'Materials Chemistry Laboratory Manager',
      'research_lab_leadership',
      'Manages materials chemistry lab operations, equipment and safety for R&D or production teams.',
      {
        priority: 130,
        eligibilityNote:
          'Materials chemistry lab manager — not Chemistry Laboratory Manager or Nanotechnology Laboratory Manager.',
      }
    ),
    r(
      'Head of Materials Chemistry Research',
      'research_lab_leadership',
      'Leads materials chemistry research group — grants, publications and team scientific direction.',
      {
        priority: 140,
        eligibilityNote:
          'Head of materials chemistry research — not Head of Materials Science Research (science not chemistry).',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Materials Chemistry)',
      'academic_research',
      'Post-PhD researcher in academic materials chemistry — synthesis, catalysis or energy materials.',
      {
        priority: 150,
        eligibilityNote:
          'Materials chemistry postdoc — not Postdoctoral Research Fellow (Materials Science) or (Chemistry) general.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Materials Chemistry',
      'academic_research',
      'University lecturer teaching materials chemistry and supervising postgraduate materials research.',
      {
        priority: 160,
        eligibilityNote:
          'HE materials chemistry teaching — not Lecturer in Materials Science or Lecturer in Chemistry general.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Materials Chemistry',
      'executive_scientific_director',
      'Executive leadership of materials chemistry R&D — portfolio strategy and industrial partnerships.',
      {
        priority: 170,
        eligibilityNote:
          'Director materials chemistry — not Director of Materials Science or Director of Chemistry (R&D).',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// Physics family (IOP)
// ---------------------------------------------------------------------------

const PHYSICS: SpecialismPack = {
  slug: 'physics',
  label: 'Physics',
  professionalBody: 'Institute of Physics (IOP)',
  relatedBodies: ['IOP', 'Royal Society', 'Institute of Physics and Engineering in Medicine (IPEM)'],
  sources: IOP_SOURCES,
  siblingSlugs: siblings('physics'),
  roles: [
    r(
      'Physics Laboratory Technician',
      'foundation_technical_entry',
      'Maintains physics lab equipment, prepares experiments and supports measurement activities under supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Physics lab technician — not Applied Physics Technician or Medical Physics Technician titles.',
      }
    ),
    r(
      'Physics Technical Apprentice',
      'foundation_technical_entry',
      'Apprenticeship building practical physics and instrumentation skills in research, defence or industry labs.',
      {
        priority: 20,
        eligibilityNote:
          'Physics technical apprenticeship — not Instrumentation Physics Apprentice (Applied Physics pack).',
      }
    ),
    r(
      'Graduate Physicist',
      'graduate_entry',
      'First professional physics role after a physics degree — research, instrumentation or technical consultancy.',
      {
        priority: 30,
        eligibilityNote:
          'General graduate physicist — not Graduate Applied Physicist or Graduate Astrophysicist titles.',
      }
    ),
    r(
      'Physics Graduate Scheme Trainee',
      'graduate_entry',
      'Structured graduate programme in defence, energy, instrumentation or research organisations.',
      {
        priority: 40,
        eligibilityNote:
          'Physics graduate scheme — not Medical Physics Graduate or Nuclear Science Graduate Trainee.',
      }
    ),
    r(
      'Physicist',
      'scientific_practitioner',
      'Independent physics work — modelling, experimentation, data analysis and technical reporting.',
      {
        priority: 50,
        eligibilityNote:
          'Core physicist practitioner — distinct from Applied Physicist or Medical Physicist roles.',
      }
    ),
    r(
      'Research Physicist (Laboratory)',
      'scientific_practitioner',
      'Conducts experimental or theoretical physics research in university, national lab or industry settings.',
      {
        priority: 60,
        eligibilityNote:
          'Laboratory research physicist — not Postdoctoral Research Fellow (Physics) academic postdoc track.',
        isResearchRole: true,
      }
    ),
    r(
      'Physicist (Experimental)',
      'experienced_scientist',
      'Designs and executes complex physics experiments — detectors, optics, low-temperature or particle systems.',
      {
        priority: 70,
        eligibilityNote:
          'Experimental physicist — not Physicist (Computational Modelling) or Astrophysicist (Observational).',
      }
    ),
    r(
      'Physicist (Computational Modelling)',
      'experienced_scientist',
      'Develops physics simulations, numerical models and high-performance computing workflows.',
      {
        priority: 80,
        eligibilityNote:
          'Computational physics scientist — not IT Software Developer or Mathematical Modelling specialism owner.',
      }
    ),
    r(
      'Specialist Physicist (Condensed Matter)',
      'specialist_scientist',
      'Deep expertise in solid-state, semiconductor or soft-matter physics for research and applied programmes.',
      {
        priority: 90,
        eligibilityNote:
          'Condensed matter specialist — not Specialist Applied Physicist (Semiconductor Characterisation).',
      }
    ),
    r(
      'Specialist Physicist (Optics and Photonics)',
      'specialist_scientist',
      'Specialist in laser systems, optical design and photonics for research or product development.',
      {
        priority: 100,
        eligibilityNote:
          'Optics and photonics physicist — not Optometrist (Healthcare) or Optical Engineer (Engineering).',
      }
    ),
    r(
      'Senior Physicist',
      'senior_principal_scientist',
      'Senior physics authority — complex programme delivery, mentoring and technical decision-making.',
      {
        priority: 110,
        eligibilityNote:
          'Senior physicist — not Senior Applied Physicist or Senior Clinical Scientist (Medical Physics).',
      }
    ),
    r(
      'Principal Physicist',
      'senior_principal_scientist',
      'Principal-level physics expert with organisation-wide technical influence and R&D strategy input.',
      {
        priority: 120,
        eligibilityNote:
          'Principal physicist — not Principal Applied Physicist or Principal Medical Physicist.',
      }
    ),
    r(
      'Physics Laboratory Manager',
      'research_lab_leadership',
      'Manages physics laboratory facilities, equipment budgets and technical staff for research teams.',
      {
        priority: 130,
        eligibilityNote:
          'Physics lab manager — not Applied Physics Laboratory Supervisor or Observatory Operations Manager.',
      }
    ),
    r(
      'Head of Physics Research Group',
      'research_lab_leadership',
      'Leads a physics research group — funding, publications and scientific direction.',
      {
        priority: 140,
        eligibilityNote:
          'Physics research group head — not Head of Applied Physics or Head of Astronomy Research.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Physics)',
      'academic_research',
      'Post-PhD researcher conducting independent physics research under academic supervision.',
      {
        priority: 150,
        eligibilityNote:
          'Physics postdoc — not Research Physicist (Laboratory) industry role or Lecturer in Physics.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Physics',
      'academic_research',
      'University lecturer teaching physics and supervising undergraduate and postgraduate research.',
      {
        priority: 160,
        eligibilityNote:
          'HE physics teaching — not Lecturer in Applied Physics or Lecturer in Astrophysics.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Physics Research',
      'executive_scientific_director',
      'Executive leadership of physics research portfolio — investment, partnerships and scientific governance.',
      {
        priority: 170,
        eligibilityNote:
          'Director physics research — not Director of Applied Physics or Director of Astronomical Research.',
      }
    ),
  ],
}

const APPLIED_PHYSICS: SpecialismPack = {
  slug: 'applied-physics',
  label: 'Applied Physics',
  professionalBody: 'Institute of Physics (IOP)',
  relatedBodies: ['IOP', 'Institution of Engineering and Technology (IET)', 'IPEM'],
  sources: [
    'prospects_applied_physicist',
    'iop_careers',
    'national_careers_service_physicist',
    'prospects_research_scientist',
  ],
  siblingSlugs: siblings('applied-physics'),
  roles: [
    r(
      'Applied Physics Technician',
      'foundation_technical_entry',
      'Supports applied physics labs — instrument setup, calibration, data acquisition and maintenance.',
      {
        priority: 10,
        eligibilityNote:
          'Applied physics technician — not Physics Laboratory Technician general or Electronics Technician (Engineering).',
      }
    ),
    r(
      'Instrumentation Physics Apprentice',
      'foundation_technical_entry',
      'Apprenticeship focused on scientific instrumentation, sensors and measurement systems.',
      {
        priority: 20,
        eligibilityNote:
          'Instrumentation physics apprenticeship — not Physics Technical Apprentice broad route.',
      }
    ),
    r(
      'Graduate Applied Physicist',
      'graduate_entry',
      'Entry applied physics role in instrumentation, semiconductors, sensors or defence technology.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate applied physicist — not Graduate Physicist general or Graduate Materials Scientist.',
      }
    ),
    r(
      'Applied Physics Graduate Trainee',
      'graduate_entry',
      'Structured trainee building applied physics skills in industry R&D or national laboratory settings.',
      {
        priority: 40,
        eligibilityNote:
          'Applied physics graduate trainee — not Physics Graduate Scheme Trainee general route.',
      }
    ),
    r(
      'Applied Physicist',
      'scientific_practitioner',
      'Applies physics principles to technology development — sensors, imaging, materials testing or energy systems.',
      {
        priority: 50,
        eligibilityNote:
          'Core applied physicist — distinct from Physicist (Experimental) research focus and Medical Physicist.',
      }
    ),
    r(
      'Applied Physicist (Instrumentation)',
      'scientific_practitioner',
      'Designs and validates scientific instruments, measurement chains and data acquisition systems.',
      {
        priority: 60,
        eligibilityNote:
          'Instrumentation applied physicist — not Control and Instrumentation Engineer (Engineering field).',
      }
    ),
    r(
      'Applied Physicist (Sensor Systems)',
      'experienced_scientist',
      'Develops sensor technologies — MEMS, optical, magnetic or radiation detectors for industrial use.',
      {
        priority: 70,
        eligibilityNote:
          'Sensor systems applied physicist — not Electronics Engineer or Embedded Software Engineer (IT).',
      }
    ),
    r(
      'Applied Physicist (Semiconductor Characterisation)',
      'experienced_scientist',
      'Characterises semiconductor devices and materials using electrical, optical and thermal methods.',
      {
        priority: 80,
        eligibilityNote:
          'Semiconductor characterisation applied physicist — not Materials Scientist (Metallurgy) or Process Engineer.',
      }
    ),
    r(
      'Specialist Applied Physicist (Vacuum Systems)',
      'specialist_scientist',
      'Expert in vacuum technology, thin-film deposition and surface science for research and manufacturing.',
      {
        priority: 90,
        eligibilityNote:
          'Vacuum systems specialist — not Specialist Physicist (Condensed Matter) academic research focus.',
      }
    ),
    r(
      'Specialist Applied Physicist (Metrology)',
      'specialist_scientist',
      'Specialist in precision measurement, calibration standards and uncertainty analysis.',
      {
        priority: 100,
        eligibilityNote:
          'Metrology applied physicist — not Quality Engineer (Engineering) or Analytical Chemist (GLP Validation).',
      }
    ),
    r(
      'Senior Applied Physicist',
      'senior_principal_scientist',
      'Senior applied physics authority — product development leadership and cross-disciplinary technical guidance.',
      {
        priority: 110,
        eligibilityNote:
          'Senior applied physicist — not Senior Physicist general or Senior Materials Scientist.',
      }
    ),
    r(
      'Principal Applied Physicist',
      'senior_principal_scientist',
      'Principal-level applied physics expert shaping technology roadmaps and IP strategy.',
      {
        priority: 120,
        eligibilityNote:
          'Principal applied physicist — not Principal Physicist research or Principal Medical Physicist.',
      }
    ),
    r(
      'Applied Physics Laboratory Supervisor',
      'research_lab_leadership',
      'Supervises applied physics laboratory teams, equipment schedules and project delivery.',
      {
        priority: 130,
        eligibilityNote:
          'Applied physics lab supervisor — not Physics Laboratory Manager or Materials Characterisation Laboratory Manager.',
      }
    ),
    r(
      'Head of Applied Physics',
      'research_lab_leadership',
      'Leads applied physics function — programme portfolio, hiring and stakeholder management.',
      {
        priority: 140,
        eligibilityNote:
          'Head of applied physics — not Head of Physics Research Group or Head of Medical Physics (NHS).',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Applied Physics)',
      'academic_research',
      'Post-PhD researcher in applied physics — instrumentation, photonics or materials physics applications.',
      {
        priority: 150,
        eligibilityNote:
          'Applied physics postdoc — not Postdoctoral Research Fellow (Physics) general title.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Applied Physics',
      'academic_research',
      'University lecturer teaching applied physics, instrumentation and industry-relevant physics modules.',
      {
        priority: 160,
        eligibilityNote:
          'HE applied physics teaching — not Lecturer in Physics general or Lecturer in Engineering.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Applied Physics',
      'executive_scientific_director',
      'Executive leadership of applied physics capability — technology strategy and commercial partnerships.',
      {
        priority: 170,
        eligibilityNote:
          'Director applied physics — not Director of Physics Research or Director of Medical Physics.',
      }
    ),
  ],
}

const ASTROPHYSICS_AND_ASTRONOMY: SpecialismPack = {
  slug: 'astrophysics-and-astronomy',
  label: 'Astrophysics and Astronomy',
  professionalBody: 'Royal Astronomical Society (RAS) / Institute of Physics (IOP)',
  relatedBodies: ['RAS', 'IOP', 'UK Space Agency', 'STFC'],
  sources: [
    'prospects_astronomer',
    'iop_careers',
    'ras_careers',
    'national_careers_service_physicist',
  ],
  siblingSlugs: siblings('astrophysics-and-astronomy'),
  roles: [
    r(
      'Observatory Technician',
      'foundation_technical_entry',
      'Maintains telescopes, dome systems and observational equipment at university or public observatories.',
      {
        priority: 10,
        eligibilityNote:
          'Observatory technician — not Physics Laboratory Technician or Astronomy Technical Apprentice trainee title.',
      }
    ),
    r(
      'Astronomy Technical Apprentice',
      'foundation_technical_entry',
      'Apprenticeship supporting astronomical data systems, telescope operations and instrument maintenance.',
      {
        priority: 20,
        eligibilityNote:
          'Astronomy technical apprenticeship — not Physics Technical Apprentice general route.',
      }
    ),
    r(
      'Graduate Astrophysicist',
      'graduate_entry',
      'Entry astrophysics role — data reduction, survey support or research assistant in astronomy groups.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate astrophysics entry — not Graduate Physicist general or Space Systems Engineer (Engineering).',
      }
    ),
    r(
      'Astronomy Graduate Trainee',
      'graduate_entry',
      'Structured trainee at observatory, planetarium or space-agency contractor building astronomy skills.',
      {
        priority: 40,
        eligibilityNote:
          'Astronomy graduate trainee — not Astrophysics Graduate Scheme in non-astronomy contexts.',
      }
    ),
    r(
      'Astrophysicist (Data Analysis)',
      'scientific_practitioner',
      'Analyses astronomical survey data — photometry, spectroscopy pipelines and catalogue production.',
      {
        priority: 50,
        eligibilityNote:
          'Astrophysics data analyst — not IT Data Analyst or Data Scientist (IT field) titles.',
      }
    ),
    r(
      'Astronomical Research Assistant',
      'scientific_practitioner',
      'Supports observational campaigns, proposal preparation and data collection for astronomy research teams.',
      {
        priority: 60,
        eligibilityNote:
          'Astronomical research assistant — not Research Assistant (Biology) or general Research Physicist.',
        isResearchRole: true,
      }
    ),
    r(
      'Astrophysicist (Observational)',
      'experienced_scientist',
      'Leads observational astronomy programmes — telescope time, instrument configuration and data interpretation.',
      {
        priority: 70,
        eligibilityNote:
          'Observational astrophysicist — not Astrophysicist (Theoretical) or Physicist (Experimental) general.',
      }
    ),
    r(
      'Astrophysicist (Theoretical)',
      'experienced_scientist',
      'Develops theoretical models of stellar evolution, cosmology, exoplanets or galactic dynamics.',
      {
        priority: 80,
        eligibilityNote:
          'Theoretical astrophysicist — not Physicist (Computational Modelling) general or Applied Mathematician.',
      }
    ),
    r(
      'Specialist Astrophysicist (Exoplanets)',
      'specialist_scientist',
      'Specialist in exoplanet detection, transit analysis and atmospheric characterisation methods.',
      {
        priority: 90,
        eligibilityNote:
          'Exoplanet specialist — not Specialist Astrophysicist (Cosmology) or Planetary Geologist (Earth Science).',
      }
    ),
    r(
      'Specialist Astrophysicist (Cosmology)',
      'specialist_scientist',
      'Deep expertise in cosmological simulations, CMB analysis and large-scale structure research.',
      {
        priority: 100,
        eligibilityNote:
          'Cosmology specialist — not Specialist Nuclear Research Scientist or Particle Physicist (general Physics).',
      }
    ),
    r(
      'Senior Astrophysicist',
      'senior_principal_scientist',
      'Senior astronomy research authority — grant leadership, mentoring and major survey participation.',
      {
        priority: 110,
        eligibilityNote:
          'Senior astrophysicist — not Senior Physicist general or Principal Astronomer (Research).',
      }
    ),
    r(
      'Principal Astronomer (Research)',
      'senior_principal_scientist',
      'Principal research astronomer with international collaboration leadership and survey co-investigator roles.',
      {
        priority: 120,
        eligibilityNote:
          'Principal astronomer research — not Principal Physicist or Observatory Operations Manager.',
      }
    ),
    r(
      'Observatory Operations Manager',
      'research_lab_leadership',
      'Manages observatory operations, scheduling, maintenance contracts and visitor/public programmes.',
      {
        priority: 130,
        eligibilityNote:
          'Observatory operations manager — not Physics Laboratory Manager or Planetarium Manager (education).',
      }
    ),
    r(
      'Head of Astronomy Research',
      'research_lab_leadership',
      'Leads astronomy research department — faculty hiring, telescope access strategy and REF impact.',
      {
        priority: 140,
        eligibilityNote:
          'Head of astronomy research — not Head of Physics Research Group or Head of Space Engineering.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Astrophysics)',
      'academic_research',
      'Post-PhD researcher in astrophysics — observational, theoretical or computational astronomy.',
      {
        priority: 150,
        eligibilityNote:
          'Astrophysics postdoc — not Postdoctoral Research Fellow (Physics) general title.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Astrophysics',
      'academic_research',
      'University lecturer teaching astrophysics and astronomy and supervising postgraduate research.',
      {
        priority: 160,
        eligibilityNote:
          'HE astrophysics teaching — not Lecturer in Physics general or Lecturer in Planetary Science.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Astronomical Research',
      'executive_scientific_director',
      'Executive leadership of astronomical research institute or major observatory scientific programme.',
      {
        priority: 170,
        eligibilityNote:
          'Director astronomical research — not Director of Physics Research or Space Agency executive (policy).',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// Medical Physics (IPEM / HCPC — clinical scientist routes, not medical doctors)
// ---------------------------------------------------------------------------

const MEDICAL_PHYSICS: SpecialismPack = {
  slug: 'medical-physics',
  label: 'Medical Physics',
  professionalBody: 'Institute of Physics and Engineering in Medicine (IPEM) / HCPC (Clinical Scientist)',
  relatedBodies: ['IPEM', 'HCPC', 'NHS Healthcare Science', 'Society for Radiological Protection'],
  sources: MEDICAL_PHYSICS_SOURCES,
  siblingSlugs: siblings('medical-physics'),
  roles: [
    r(
      'Medical Physics Technician',
      'foundation_technical_entry',
      'Supports medical physics departments — equipment checks, QA measurements and clinical engineering liaison.',
      {
        priority: 10,
        eligibilityNote:
          'Medical physics technician — not Clinical Engineering Technician (Engineering) or Radiographer.',
      }
    ),
    r(
      'Healthcare Science Assistant (Medical Physics)',
      'foundation_technical_entry',
      'Assistant role in NHS medical physics supporting dosimetry, imaging QA and departmental workflows.',
      {
        priority: 20,
        eligibilityNote:
          'Healthcare science assistant (medical physics) — not Healthcare Support Worker or Biomedical Scientist.',
      }
    ),
    r(
      'Medical Physics Graduate',
      'graduate_entry',
      'Graduate entry in medical physics department before or alongside STP application — QA and project support.',
      {
        priority: 30,
        eligibilityNote:
          'Medical physics graduate entry — not Foundation Doctor, Radiographer or Clinical Engineer graduate routes.',
      }
    ),
    r(
      'STP Trainee Clinical Scientist (Medical Physics)',
      'graduate_entry',
      'NHS Scientist Training Programme trainee in medical physics — three-year structured clinical scientist training.',
      {
        priority: 40,
        eligibilityNote:
          'STP medical physics trainee — not STP Clinical Scientist in other healthcare science specialties or medical doctor training.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'HCPC Clinical Scientist (Medical Physics)',
      'scientific_practitioner',
      'HCPC-registered clinical scientist practising medical physics in NHS or equivalent healthcare settings.',
      {
        priority: 50,
        eligibilityNote:
          'HCPC clinical scientist (medical physics) — not Consultant Radiologist or Radiotherapy Physicist without HCPC registration context.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Medical Physicist (Diagnostic Imaging)',
      'scientific_practitioner',
      'Supports X-ray, CT, MRI and ultrasound physics — image quality, dose optimisation and equipment acceptance.',
      {
        priority: 60,
        eligibilityNote:
          'Diagnostic imaging medical physicist — not Diagnostic Radiographer or Radiology Registrar (medical).',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Medical Physicist (Radiotherapy Physics)',
      'experienced_scientist',
      'Calculates radiotherapy treatment plans, performs linac QA and supports clinical radiotherapy delivery.',
      {
        priority: 70,
        eligibilityNote:
          'Radiotherapy medical physicist — not Therapeutic Radiographer or Clinical Oncologist (medical doctor).',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Medical Physicist (Radiation Protection)',
      'experienced_scientist',
      'Advises on ionising radiation safety in hospitals — RPA support, shielding design and regulatory compliance.',
      {
        priority: 80,
        eligibilityNote:
          'Hospital radiation protection medical physicist — not Health Physicist (Research and Industry) nuclear science route.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Specialist Clinical Scientist (Medical Physics)',
      'specialist_scientist',
      'Post-registration specialist in nuclear medicine, MRI, radiotherapy or radiation protection clinical science.',
      {
        priority: 90,
        eligibilityNote:
          'Specialist clinical scientist (medical physics) — not Specialist Biomedical Scientist or Clinical Scientist in other STP specialties.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Specialist Medical Physicist (MRI Physics)',
      'specialist_scientist',
      'Deep MRI physics expertise — sequence optimisation, safety, artefact troubleshooting and scanner acceptance.',
      {
        priority: 100,
        eligibilityNote:
          'MRI physics specialist — not MRI Radiographer or Neuroradiologist (medical doctor).',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Senior Clinical Scientist (Medical Physics)',
      'senior_principal_scientist',
      'Senior HCPC-registered clinical scientist leading service development, audit and junior staff supervision.',
      {
        priority: 110,
        eligibilityNote:
          'Senior clinical scientist (medical physics) — not Senior Radiographer or Consultant Physician roles.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Principal Medical Physicist',
      'senior_principal_scientist',
      'Principal medical physics authority — complex casework, research translation and departmental technical standards.',
      {
        priority: 120,
        eligibilityNote:
          'Principal medical physicist — not Principal Physicist (general physics) or Principal Clinical Scientist in other specialties.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Head of Medical Physics (NHS)',
      'research_lab_leadership',
      'Professional lead for medical physics service in NHS Trust — staffing, equipment and clinical governance.',
      {
        priority: 130,
        eligibilityNote:
          'Head of medical physics NHS — not Head of Radiology (medical) or Head of Clinical Engineering.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Consultant Clinical Scientist (Medical Physics)',
      'research_lab_leadership',
      'Consultant-level HCPC clinical scientist providing expert medical physics advice — not a medical doctor consultant.',
      {
        priority: 140,
        eligibilityNote:
          'Consultant clinical scientist (medical physics) — NOT Consultant Radiologist, Clinical Oncologist or any medical doctor consultant route.',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Research Fellow (Medical Physics)',
      'academic_research',
      'Postdoctoral or clinical academic fellow researching imaging, dosimetry or radiation biology applications.',
      {
        priority: 150,
        eligibilityNote:
          'Medical physics research fellow — not Clinical Research Fellow (medicine) or Research Fellow (Physics) general.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Medical Physics',
      'academic_research',
      'University lecturer teaching medical physics and supervising MSc/PhD research in healthcare technologies.',
      {
        priority: 160,
        eligibilityNote:
          'HE medical physics teaching — not Lecturer in Physics general or Lecturer in Radiography.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Medical Physics',
      'executive_scientific_director',
      'Executive leadership of medical physics services or academic medical physics department.',
      {
        priority: 170,
        eligibilityNote:
          'Director medical physics — not Medical Director (clinical executive) or Director of Radiology (medical).',
        isRegulatedOrRestricted: true,
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// Nuclear Science (radiation research/industry — not Nuclear Engineering)
// ---------------------------------------------------------------------------

const NUCLEAR_SCIENCE: SpecialismPack = {
  slug: 'nuclear-science',
  label: 'Nuclear Science',
  professionalBody: 'Institute of Physics (IOP) / Nuclear Institute',
  relatedBodies: ['IOP', 'Nuclear Institute', 'Society for Radiological Protection', 'ONR context'],
  sources: [
    'prospects_nuclear_scientist',
    'iop_careers',
    'nuclear_institute_careers',
    'national_careers_service_physicist',
  ],
  siblingSlugs: siblings('nuclear-science'),
  roles: [
    r(
      'Radiation Laboratory Technician',
      'foundation_technical_entry',
      'Supports radiation laboratories — sample handling, contamination monitoring and waste segregation under supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Radiation lab technician — not Nuclear Engineering Technician or Reactor Operator (Engineering field).',
      }
    ),
    r(
      'Nuclear Science Apprentice',
      'foundation_technical_entry',
      'Apprenticeship in radiation science, radiochemistry or nuclear laboratory operations.',
      {
        priority: 20,
        eligibilityNote:
          'Nuclear science apprenticeship — not Nuclear Engineering Apprentice or Mechanical Engineering apprenticeship.',
      }
    ),
    r(
      'Graduate Radiation Scientist',
      'graduate_entry',
      'Entry radiation science role in research, environmental monitoring or nuclear industry laboratory settings.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate radiation scientist — not Graduate Nuclear Engineer or Graduate Physicist general titles.',
      }
    ),
    r(
      'Nuclear Science Graduate Trainee',
      'graduate_entry',
      'Structured trainee in national laboratory, nuclear operator or research institute radiation science teams.',
      {
        priority: 40,
        eligibilityNote:
          'Nuclear science graduate trainee — not Nuclear Science Graduate Scheme in engineering contexts.',
      }
    ),
    r(
      'Radiochemist',
      'scientific_practitioner',
      'Prepares and analyses radioactive samples, develops separation methods and supports nuclear research programmes.',
      {
        priority: 50,
        eligibilityNote:
          'Radiochemist practitioner — not Analytical Chemist (Spectroscopy) non-radiological or Nuclear Engineer.',
      }
    ),
    r(
      'Nuclear Research Scientist',
      'scientific_practitioner',
      'Conducts nuclear physics or radiation science research in university, NNL or industry R&D settings.',
      {
        priority: 60,
        eligibilityNote:
          'Nuclear research scientist — not Nuclear Engineer (design) or Physicist (Experimental) general title.',
        isResearchRole: true,
      }
    ),
    r(
      'Health Physicist (Research and Industry)',
      'experienced_scientist',
      'Radiation protection scientist in research or industrial settings — dosimetry, monitoring and ALARP assessments.',
      {
        priority: 70,
        eligibilityNote:
          'Research/industry health physicist — not Medical Physicist (Radiation Protection) NHS clinical route.',
      }
    ),
    r(
      'Radiation Protection Scientist',
      'experienced_scientist',
      'Develops radiation protection programmes, shielding assessments and regulatory compliance for facilities.',
      {
        priority: 80,
        eligibilityNote:
          'Radiation protection scientist — not Radiation Protection Adviser (RPA) statutory role without qualification context.',
      }
    ),
    r(
      'Specialist Radiation Scientist (Dosimetry)',
      'specialist_scientist',
      'Specialist in radiation dosimetry — calibration, phantom measurements and dose calculation methods.',
      {
        priority: 90,
        eligibilityNote:
          'Dosimetry radiation specialist — not Specialist Medical Physicist (MRI Physics) clinical imaging focus.',
      }
    ),
    r(
      'Specialist Nuclear Research Scientist (Isotope Production)',
      'specialist_scientist',
      'Expert in radioisotope production, target chemistry and radiopharmaceutical precursor supply.',
      {
        priority: 100,
        eligibilityNote:
          'Isotope production specialist — not Nuclear Medicine Technologist (Healthcare) or Radiopharmacist.',
      }
    ),
    r(
      'Senior Nuclear Research Scientist',
      'senior_principal_scientist',
      'Senior authority in nuclear science research — programme leadership, safety cases and mentoring.',
      {
        priority: 110,
        eligibilityNote:
          'Senior nuclear research scientist — not Senior Nuclear Engineer or Senior Physicist general.',
      }
    ),
    r(
      'Principal Radiation Scientist',
      'senior_principal_scientist',
      'Principal-level radiation science expert advising on complex radiation programmes and regulatory submissions.',
      {
        priority: 120,
        eligibilityNote:
          'Principal radiation scientist — not Principal Medical Physicist or Principal Physicist general.',
      }
    ),
    r(
      'Radiation Science Laboratory Manager',
      'research_lab_leadership',
      'Manages radiation science laboratory — containment, waste, staffing and regulatory inspection readiness.',
      {
        priority: 130,
        eligibilityNote:
          'Radiation science lab manager — not Nuclear Engineering Project Manager or Chemistry Laboratory Manager.',
      }
    ),
    r(
      'Head of Nuclear Research',
      'research_lab_leadership',
      'Leads nuclear science research group or national laboratory division — strategy, funding and safety culture.',
      {
        priority: 140,
        eligibilityNote:
          'Head of nuclear research — not Head of Nuclear Engineering or Head of Medical Physics (NHS).',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Nuclear Science)',
      'academic_research',
      'Post-PhD researcher in nuclear physics, radiochemistry or radiation effects science.',
      {
        priority: 150,
        eligibilityNote:
          'Nuclear science postdoc — not Postdoctoral Research Fellow (Physics) general or Nuclear Engineering researcher.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Nuclear Science',
      'academic_research',
      'University lecturer teaching nuclear science, radiation physics and supervising postgraduate research.',
      {
        priority: 160,
        eligibilityNote:
          'HE nuclear science teaching — not Lecturer in Nuclear Engineering or Lecturer in Physics general.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Nuclear Science',
      'executive_scientific_director',
      'Executive leadership of nuclear science research institute or radiation science programme portfolio.',
      {
        priority: 170,
        eligibilityNote:
          'Director nuclear science — not Director of Nuclear Engineering or Director of Physics Research.',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// Materials Science (science titles — not Materials Engineering)
// ---------------------------------------------------------------------------

const MATERIALS_SCIENCE: SpecialismPack = {
  slug: 'materials-science',
  label: 'Materials Science',
  professionalBody: 'Institute of Materials, Minerals and Mining (IOM3)',
  relatedBodies: ['IOM3', 'Royal Society of Chemistry (RSC)', 'Institute of Physics (IOP)'],
  sources: [
    'prospects_materials_scientist',
    'iom3_careers',
    'national_careers_service_materials_scientist',
    'prospects_research_scientist',
  ],
  siblingSlugs: siblings('materials-science'),
  roles: [
    r(
      'Materials Testing Technician',
      'foundation_technical_entry',
      'Performs tensile, hardness, microscopy and thermal testing under materials scientist supervision.',
      {
        priority: 10,
        eligibilityNote:
          'Materials testing technician — not Materials Chemistry Laboratory Technician or Mechanical Engineering technician.',
      }
    ),
    r(
      'Materials Science Laboratory Apprentice',
      'foundation_technical_entry',
      'Apprenticeship in materials testing, microscopy sample prep and laboratory quality procedures.',
      {
        priority: 20,
        eligibilityNote:
          'Materials science lab apprenticeship — not Materials Chemistry Apprentice (synthesis focus).',
      }
    ),
    r(
      'Graduate Materials Scientist',
      'graduate_entry',
      'Entry materials science role investigating structure–property relationships after a relevant degree.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate materials scientist — not Graduate Materials Chemist or Graduate Metallurgical Engineer.',
      }
    ),
    r(
      'Materials Science Graduate Trainee',
      'graduate_entry',
      'Structured trainee in aerospace, automotive or advanced manufacturing materials research teams.',
      {
        priority: 40,
        eligibilityNote:
          'Materials science graduate trainee — not Materials Chemistry Graduate Trainee (synthesis focus).',
      }
    ),
    r(
      'Materials Scientist',
      'scientific_practitioner',
      'Investigates material structure, properties and performance for research or product development.',
      {
        priority: 50,
        eligibilityNote:
          'Core materials scientist — distinct from Materials Chemist (synthesis) and Materials Engineer (Engineering).',
      }
    ),
    r(
      'Materials Characterisation Scientist',
      'scientific_practitioner',
      'Expert in SEM, TEM, XRD, DSC and mechanical testing for materials identification and failure investigation.',
      {
        priority: 60,
        eligibilityNote:
          'Materials characterisation scientist — not Materials Chemist (Characterisation) chemistry synthesis context.',
      }
    ),
    r(
      'Materials Scientist (Metallurgy)',
      'experienced_scientist',
      'Focuses on metal microstructures, heat treatment effects and alloy development for industrial applications.',
      {
        priority: 70,
        eligibilityNote:
          'Metallurgy materials scientist — not Metallurgical Engineer or Materials Engineer (Engineering field).',
      }
    ),
    r(
      'Materials Scientist (Ceramics and Polymers)',
      'experienced_scientist',
      'Studies ceramic and polymer structure–property relationships for aerospace, medical or consumer products.',
      {
        priority: 80,
        eligibilityNote:
          'Ceramics and polymers materials scientist — not Materials Chemist (Polymer Chemistry) synthesis focus.',
      }
    ),
    r(
      'Specialist Materials Scientist (Corrosion Science)',
      'specialist_scientist',
      'Specialist in corrosion mechanisms, electrochemical testing and protective coating evaluation.',
      {
        priority: 90,
        eligibilityNote:
          'Corrosion science specialist — not Corrosion Engineer (Engineering) or Coatings Engineer titles.',
      }
    ),
    r(
      'Specialist Materials Scientist (Failure Analysis)',
      'specialist_scientist',
      'Leads forensic materials investigations — fracture analysis, contamination and root-cause determination.',
      {
        priority: 100,
        eligibilityNote:
          'Failure analysis materials specialist — not Forensic Engineer (Engineering) or Analytical Chemist (GLP).',
      }
    ),
    r(
      'Senior Materials Scientist',
      'senior_principal_scientist',
      'Senior materials science authority — programme leadership, customer technical support and mentoring.',
      {
        priority: 110,
        eligibilityNote:
          'Senior materials scientist — not Senior Materials Chemist or Senior Metallurgical Engineer.',
      }
    ),
    r(
      'Principal Materials Scientist',
      'senior_principal_scientist',
      'Principal-level materials expert shaping R&D strategy, standards engagement and IP portfolio.',
      {
        priority: 120,
        eligibilityNote:
          'Principal materials scientist — not Principal Materials Chemist or Principal Engineer (Engineering).',
      }
    ),
    r(
      'Materials Characterisation Laboratory Manager',
      'research_lab_leadership',
      'Manages materials characterisation facility — instrument scheduling, accreditation and client service delivery.',
      {
        priority: 130,
        eligibilityNote:
          'Materials characterisation lab manager — not Materials Chemistry Laboratory Manager or Physics Laboratory Manager.',
      }
    ),
    r(
      'Head of Materials Science Research',
      'research_lab_leadership',
      'Leads materials science research department — grants, industry partnerships and team scientific direction.',
      {
        priority: 140,
        eligibilityNote:
          'Head of materials science research — not Head of Materials Chemistry Research or Head of Engineering Materials.',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Materials Science)',
      'academic_research',
      'Post-PhD researcher in academic materials science — alloys, composites, biomaterials or functional materials.',
      {
        priority: 150,
        eligibilityNote:
          'Materials science postdoc — not Postdoctoral Research Fellow (Materials Chemistry) or (Physics) general.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Materials Science',
      'academic_research',
      'University lecturer teaching materials science and supervising postgraduate materials research.',
      {
        priority: 160,
        eligibilityNote:
          'HE materials science teaching — not Lecturer in Materials Chemistry or Lecturer in Engineering.',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Materials Science',
      'executive_scientific_director',
      'Executive leadership of materials science R&D function — portfolio, partnerships and scientific governance.',
      {
        priority: 170,
        eligibilityNote:
          'Director materials science — not Director of Materials Chemistry or Director of Engineering (materials).',
      }
    ),
  ],
}

// ---------------------------------------------------------------------------
// Nanoscience and Nanotechnology
// ---------------------------------------------------------------------------

const NANOSCIENCE_AND_NANOTECHNOLOGY: SpecialismPack = {
  slug: 'nanoscience-and-nanotechnology',
  label: 'Nanoscience and Nanotechnology',
  professionalBody: 'Institute of Physics (IOP) / Royal Society of Chemistry (RSC)',
  relatedBodies: ['IOP', 'RSC', 'IOM3', 'Royal Society'],
  sources: [
    'prospects_nanotechnologist',
    'iop_careers',
    'rsc_nanotechnology',
    'national_careers_service_research_scientist',
  ],
  siblingSlugs: siblings('nanoscience-and-nanotechnology'),
  roles: [
    r(
      'Nanotechnology Laboratory Technician',
      'foundation_technical_entry',
      'Supports nanofabrication and characterisation labs — cleanroom protocols, sample prep and instrument operation.',
      {
        priority: 10,
        eligibilityNote:
          'Nanotechnology lab technician — not Materials Testing Technician or general Laboratory Technician (Chemistry).',
      }
    ),
    r(
      'Nanoscience Apprentice',
      'foundation_technical_entry',
      'Apprenticeship in nanomaterials preparation, microscopy support and laboratory safety in nano-facilities.',
      {
        priority: 20,
        eligibilityNote:
          'Nanoscience apprenticeship — not Materials Science Laboratory Apprentice (bulk materials focus).',
      }
    ),
    r(
      'Graduate Nanoscientist',
      'graduate_entry',
      'Entry nanoscience role in university cleanroom, spin-out or industrial nanotechnology R&D after relevant degree.',
      {
        priority: 30,
        eligibilityNote:
          'Graduate nanoscientist — not Graduate Materials Scientist or Graduate Materials Chemist titles.',
      }
    ),
    r(
      'Nanotechnology Graduate Trainee',
      'graduate_entry',
      'Structured trainee building nanofabrication, characterisation and device prototyping skills.',
      {
        priority: 40,
        eligibilityNote:
          'Nanotechnology graduate trainee — not Nanotechnology Graduate Scheme in non-science business contexts.',
      }
    ),
    r(
      'Nanoscientist',
      'scientific_practitioner',
      'Conducts nanoscale science — synthesis, assembly, characterisation and property measurement of nanomaterials.',
      {
        priority: 50,
        eligibilityNote:
          'Core nanoscientist — distinct from Nanomaterials Scientist (experienced stage) and Materials Chemist.',
      }
    ),
    r(
      'Nanotechnology Research Scientist',
      'scientific_practitioner',
      'Research-focused nanotechnology scientist developing novel nanomaterials or nano-devices.',
      {
        priority: 60,
        eligibilityNote:
          'Nanotechnology research scientist — not Nanotechnology Software Engineer (IT) or MEMS Engineer (Engineering).',
        isResearchRole: true,
      }
    ),
    r(
      'Nanomaterials Scientist',
      'experienced_scientist',
      'Develops nanoparticles, quantum dots, nanowires and 2D materials with defined functional properties.',
      {
        priority: 70,
        eligibilityNote:
          'Nanomaterials scientist — not Specialist Materials Chemist (Nanomaterials Synthesis) chemistry framing.',
      }
    ),
    r(
      'Nanotechnology Scientist (Characterisation)',
      'experienced_scientist',
      'Expert in AFM, SEM/TEM, DLS and spectroscopic methods for nanoscale structure determination.',
      {
        priority: 80,
        eligibilityNote:
          'Nanotechnology characterisation scientist — not Materials Characterisation Scientist bulk materials focus.',
      }
    ),
    r(
      'Specialist Nanoscientist (Self-Assembly)',
      'specialist_scientist',
      'Specialist in molecular self-assembly, supramolecular nanostructures and bottom-up fabrication.',
      {
        priority: 90,
        eligibilityNote:
          'Self-assembly nanoscience specialist — not Specialist Materials Chemist (Catalysis) or Polymer Chemist.',
      }
    ),
    r(
      'Specialist Nanotechnologist (Device Fabrication)',
      'specialist_scientist',
      'Specialist in nano-device fabrication — lithography, etching and cleanroom process integration.',
      {
        priority: 100,
        eligibilityNote:
          'Nano-device fabrication specialist — not Semiconductor Process Engineer (Engineering field).',
      }
    ),
    r(
      'Senior Nanoscientist',
      'senior_principal_scientist',
      'Senior nanoscience authority — programme leadership, grant writing and cross-disciplinary collaboration.',
      {
        priority: 110,
        eligibilityNote:
          'Senior nanoscientist — not Senior Materials Scientist or Senior Materials Chemist roles.',
      }
    ),
    r(
      'Principal Nanotechnology Scientist',
      'senior_principal_scientist',
      'Principal-level nanotechnology expert shaping R&D roadmaps and commercialisation strategy.',
      {
        priority: 120,
        eligibilityNote:
          'Principal nanotechnology scientist — not Principal Materials Scientist or Principal Physicist.',
      }
    ),
    r(
      'Nanotechnology Laboratory Manager',
      'research_lab_leadership',
      'Manages nanotechnology cleanroom and characterisation facilities — safety, access and equipment lifecycle.',
      {
        priority: 130,
        eligibilityNote:
          'Nanotechnology lab manager — not Materials Characterisation Laboratory Manager or Chemistry Laboratory Manager.',
      }
    ),
    r(
      'Head of Nanoscience Research',
      'research_lab_leadership',
      'Leads nanoscience research group or centre — funding, publications and industry engagement.',
      {
        priority: 140,
        eligibilityNote:
          'Head of nanoscience research — not Head of Materials Science Research or Head of Nanotechnology (Engineering).',
      }
    ),
    r(
      'Postdoctoral Research Fellow (Nanoscience)',
      'academic_research',
      'Post-PhD researcher in academic nanoscience — nanomaterials, nano-bio interfaces or quantum nanostructures.',
      {
        priority: 150,
        eligibilityNote:
          'Nanoscience postdoc — not Postdoctoral Research Fellow (Materials Science) or (Chemistry) general.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Nanoscience and Nanotechnology',
      'academic_research',
      'University lecturer teaching nanoscience and supervising postgraduate nanotechnology research.',
      {
        priority: 160,
        eligibilityNote:
          'HE nanoscience teaching — not Lecturer in Materials Science or Lecturer in Engineering (nano).',
        isAcademicRole: true,
      }
    ),
    r(
      'Director of Nanotechnology Research',
      'executive_scientific_director',
      'Executive leadership of nanotechnology research institute or corporate nanoscience R&D portfolio.',
      {
        priority: 170,
        eligibilityNote:
          'Director nanotechnology research — not Director of Materials Science or Director of Applied Physics.',
      }
    ),
  ],
}

export const CHEM_PHYS_PACKS: SpecialismPack[] = [
  CHEMISTRY,
  ANALYTICAL_CHEMISTRY,
  MEDICINAL_CHEMISTRY,
  MATERIALS_CHEMISTRY,
  PHYSICS,
  APPLIED_PHYSICS,
  ASTROPHYSICS_AND_ASTRONOMY,
  MEDICAL_PHYSICS,
  NUCLEAR_SCIENCE,
  MATERIALS_SCIENCE,
  NANOSCIENCE_AND_NANOTECHNOLOGY,
]
