import { r, type SpecialismPack } from './shared'

const SCIENCE_MGMT_SIBLINGS = [
  'medicine',
  'nursing',
  'pharmacy',
  'biomedical-science',
  'public-health',
  'healthcare-science',
  'optometry',
  'clinical-psychology',
  'healthcare-management',
  'clinical-research',
  'radiography',
  'physiotherapy',
  'occupational-therapy',
  'paramedic-science',
  'speech-and-language-therapy',
  'dietetics',
]

const BIOMEDICAL_SCIENCE: SpecialismPack = {
  slug: 'biomedical-science',
  label: 'Biomedical Science',
  professionalBody: 'Health and Care Professions Council (HCPC) / Institute of Biomedical Science (IBMS)',
  relatedBodies: ['IBMS', 'HCPC', 'NHS Pathology Networks'],
  sources: [
    'nhs_healthcareers_biomedical_scientist',
    'ibms_careers',
    'hcpc_biomedical_scientist',
    'prospects_biomedical_scientist',
  ],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'biomedical-science'),
  roles: [
    r(
      'Biomedical Science Degree Student (IBMS Accredited)',
      'qualification',
      'Undergraduate on an IBMS-accredited biomedical science degree with NHS laboratory placement training.',
      {
        priority: 10,
        eligibilityNote:
          'Pre-registration biomedical science education — not Medicine, Nursing or Healthcare Science STP trainee routes.',
      }
    ),
    r(
      'Biomedical Science Laboratory Placement Trainee',
      'qualification',
      'Supervised placement trainee in NHS pathology laboratories building IBMS registration portfolio evidence.',
      {
        priority: 20,
        eligibilityNote:
          'Laboratory placement toward HCPC registration — not Clinical Laboratory Assistant in non-biomedical settings.',
      }
    ),
    r(
      'Trainee Biomedical Scientist (Pre-Registration Portfolio)',
      'qualification',
      'Completes IBMS Registration Training Portfolio in haematology, microbiology, biochemistry or histopathology support.',
      {
        priority: 30,
        eligibilityNote:
          'IBMS portfolio trainee — not STP Clinical Scientist or Medical Laboratory Assistant without portfolio.',
      }
    ),
    r(
      'Healthcare Science Assistant (Biomedical Laboratory)',
      'qualification',
      'Support role in diagnostic laboratories assisting specimen processing and basic bench work under BMS supervision.',
      {
        priority: 40,
        eligibilityNote:
          'Assistant route toward biomedical science — not general Healthcare Support Worker on wards.',
      }
    ),
    r(
      'Newly Registered Biomedical Scientist (HCPC)',
      'registration_licence',
      'Newly HCPC-registered biomedical scientist completing IBMS Certificate of Competence requirements.',
      {
        priority: 50,
        eligibilityNote:
          'New HCPC registrant in biomedical science — not newly registered Clinical Scientist or Nurse.',
      }
    ),
    r(
      'HCPC Registered Biomedical Scientist (IBMS Certificate of Competence)',
      'registration_licence',
      'Registered biomedical scientist holding IBMS Certificate of Competence in a pathology discipline.',
      {
        priority: 60,
        eligibilityNote:
          'IBMS-qualified registrant — not HCPC Clinical Scientist in physiological or medical physics sciences.',
      }
    ),
    r(
      'Biomedical Scientist (Registration Portfolio Complete)',
      'registration_licence',
      'Fully registered biomedical scientist authorised for independent bench work in NHS pathology departments.',
      {
        priority: 70,
        eligibilityNote:
          'Post-registration BMS — not Band 5 Staff Nurse or Foundation Doctor clinical roles.',
      }
    ),
    r(
      'Biomedical Scientist (NHS Pathology Laboratory)',
      'practitioner',
      'Registered BMS performing diagnostic testing, quality control and result validation in NHS laboratories.',
      {
        priority: 80,
        eligibilityNote:
          'Core NHS pathology BMS — not Hospital Pharmacist or Radiographer practitioner roles.',
      }
    ),
    r(
      'Biomedical Scientist (Haematology and Transfusion)',
      'practitioner',
      'Practises blood sciences including FBC, coagulation and blood transfusion compatibility testing.',
      {
        priority: 90,
        eligibilityNote:
          'Haematology/transfusion BMS — not Clinical Scientist in cardiac physiology or medical physics.',
      }
    ),
    r(
      'Biomedical Scientist (Medical Microbiology)',
      'practitioner',
      'Identifies pathogens, performs antimicrobial susceptibility testing and supports infection control.',
      {
        priority: 100,
        eligibilityNote:
          'Microbiology BMS — not Infection Prevention Nurse or Clinical Microbiologist (medical) roles.',
      }
    ),
    r(
      'Biomedical Scientist (Clinical Chemistry)',
      'practitioner',
      'Analyses blood and body fluid analytes on automated platforms with clinical interpretation support.',
      {
        priority: 110,
        eligibilityNote:
          'Clinical chemistry BMS — not Biochemistry Research Technician in university-only labs.',
      }
    ),
    r(
      'Senior Biomedical Scientist (Diagnostic Pathology)',
      'experienced',
      'Experienced BMS with extended responsibility for method validation, training and complex case review.',
      {
        priority: 120,
        eligibilityNote:
          'Senior pathology BMS — not Senior Radiographer or Senior Clinical Scientist roles.',
      }
    ),
    r(
      'Senior Biomedical Scientist (Immunology)',
      'experienced',
      'Leads immunology and serology testing including autoimmunity and allergy diagnostics.',
      {
        priority: 130,
        eligibilityNote:
          'Senior immunology BMS — not Immunology Clinical Scientist on STP specialist route.',
      }
    ),
    r(
      'Senior Biomedical Scientist (Cellular Pathology Support)',
      'experienced',
      'Supports histopathology workflows including specimen preparation, cutting and staining quality.',
      {
        priority: 140,
        eligibilityNote:
          'Cellular pathology support BMS — not Histopathologist (medical) or Biomedical Scientist in genetics.',
      }
    ),
    r(
      'Senior Biomedical Scientist (Point-of-Care Testing)',
      'experienced',
      'Oversees POCT governance, device validation and near-patient testing across hospital sites.',
      {
        priority: 150,
        eligibilityNote:
          'POCT senior BMS — not Point-of-Care Coordinator without HCPC biomedical registration.',
      }
    ),
    r(
      'Specialist Biomedical Scientist (Blood Sciences)',
      'specialist',
      'Specialist BMS in transfusion science, haemostasis or blood bank management with advanced competencies.',
      {
        priority: 160,
        eligibilityNote:
          'Blood sciences specialist — not Haematology Registrar or Consultant Haematologist (medical).',
      }
    ),
    r(
      'Specialist Biomedical Scientist (Infection Sciences)',
      'specialist',
      'Focused specialist in bacteriology, virology or mycology with method development responsibility.',
      {
        priority: 170,
        eligibilityNote:
          'Infection sciences specialist BMS — not Infectious Diseases Physician or Clinical Microbiology trainee doctor.',
      }
    ),
    r(
      'Lead Biomedical Scientist (Laboratory Specialism)',
      'specialist',
      'Leads a pathology specialism bench, rotas and competency frameworks within an NHS laboratory.',
      {
        priority: 180,
        eligibilityNote:
          'Laboratory specialism lead BMS — not Laboratory Manager without bench specialism accountability.',
      }
    ),
    r(
      'Advanced Biomedical Scientist (Consultant BMS Route)',
      'advanced_practice_consultant',
      'Advanced practitioner BMS on consultant BMS development pathway with expert clinical advice.',
      {
        priority: 190,
        eligibilityNote:
          'Consultant BMS route — not Consultant Chemical Pathologist (medical) or Clinical Scientist consultant.',
        academicRequirement: 'masters_relevant',
      }
    ),
    r(
      'Consultant Healthcare Scientist (Biomedical Science)',
      'advanced_practice_consultant',
      'Senior consultant-level BMS providing expert scientific advice across pathology networks.',
      {
        priority: 200,
        eligibilityNote:
          'Consultant BMS — not Consultant Physician or Consultant Clinical Scientist in medical physics.',
        academicRequirement: 'masters_relevant',
      }
    ),
    r(
      'Laboratory Manager (Biomedical Science Services)',
      'leadership',
      'Manages pathology laboratory operations, staffing, budgets and accreditation compliance.',
      {
        priority: 210,
        eligibilityNote:
          'Biomedical science laboratory management — not Ward Manager or General Manager (non-laboratory).',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Head Biomedical Scientist (Pathology Directorate)',
      'leadership',
      'Professional lead for biomedical scientists across pathology disciplines in an NHS Trust.',
      {
        priority: 220,
        eligibilityNote:
          'Head BMS — not Director of Nursing or Medical Director roles.',
        professionalRegistrationRequirement: 'required',
      }
    ),
    r(
      'Director of Biomedical Sciences (NHS Trust)',
      'leadership',
      'Executive leadership of pathology scientific workforce, IBMS standards and service strategy.',
      {
        priority: 230,
        eligibilityNote:
          'Director-level BMS leadership — not Chief Operating Officer without pathology scientific remit.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Biomedical Science Research Fellow',
      'academic_research',
      'Postdoctoral or clinical academic fellow researching diagnostic biomarkers or laboratory methods.',
      {
        priority: 240,
        eligibilityNote:
          'Biomedical science research — not Clinical Research Fellow running trials without laboratory focus.',
        isResearchRole: true,
      }
    ),
    r(
      'Lecturer in Biomedical Science (HE)',
      'academic_research',
      'University lecturer teaching IBMS-accredited content and supervising undergraduate research projects.',
      {
        priority: 250,
        eligibilityNote:
          'HE biomedical science teaching — not Lecturer in Medicine or Nursing.',
        isAcademicRole: true,
        academicRequirement: 'phd_relevant',
      }
    ),
    r(
      'Professor of Biomedical Science (Research)',
      'academic_research',
      'Senior academic leading diagnostic science research groups and IBMS-accredited programme direction.',
      {
        priority: 260,
        eligibilityNote:
          'Professor in biomedical science — not Professor of Clinical Medicine or Nursing.',
        isAcademicRole: true,
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
      }
    ),
  ],
}

const PUBLIC_HEALTH: SpecialismPack = {
  slug: 'public-health',
  label: 'Public Health',
  professionalBody: 'UK Public Health Register (UKPHR) / Faculty of Public Health (FPH)',
  relatedBodies: ['FPH', 'UKPHR', 'UK Health Security Agency', 'Office for Health Improvement and Disparities'],
  sources: [
    'nhs_healthcareers_public_health',
    'fph_careers',
    'ukphr_registration',
    'prospects_public_health',
  ],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'public-health'),
  roles: [
    r(
      'Master of Public Health (MPH) Student',
      'qualification',
      'Postgraduate student on an MPH or equivalent public health masters with placement in local or national systems.',
      {
        priority: 10,
        eligibilityNote:
          'Public health masters training — not Medicine MBBS or Clinical Psychology doctorate routes.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Trainee Public Health Practitioner (Level 5/6)',
      'qualification',
      'Apprentice or trainee public health practitioner developing core health improvement and protection skills.',
      {
        priority: 20,
        eligibilityNote:
          'Public health practitioner training — not Healthcare Support Worker or Nursing Associate routes.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Public Health Practitioner Apprentice',
      'qualification',
      'Level 6/7 apprenticeship combining workplace learning in local authority or NHS public health teams.',
      {
        priority: 30,
        eligibilityNote:
          'Public health apprenticeship — not NHS Graduate Management Trainee or Administrative apprenticeship.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Specialty Registrar in Public Health (ST1 Trainee)',
      'qualification',
      'Medical or non-medical trainee beginning specialty training in public health toward FPH fellowship.',
      {
        priority: 40,
        eligibilityNote:
          'Public health specialty training entry — not Core Medical Training or GP specialty trainee routes.',
        academicRequirement: 'masters_relevant',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'UKPHR Registered Public Health Practitioner',
      'registration_licence',
      'Practitioner on the UK Public Health Register delivering defined public health functions.',
      {
        priority: 50,
        eligibilityNote:
          'UKPHR registrant — not HCPC registrant in clinical professions or NMC registered nurse.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'FPH Associate Member (Public Health Trainee)',
      'registration_licence',
      'Trainee associate of the Faculty of Public Health working toward specialist registration.',
      {
        priority: 60,
        eligibilityNote:
          'FPH trainee membership — not GMC provisional registration for Foundation Doctor training.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Newly Registered Specialist Registrar in Public Health (ST1)',
      'registration_licence',
      'Early specialty trainee in public health on the GMC or equivalent specialist training pathway.',
      {
        priority: 70,
        eligibilityNote:
          'ST1 public health — not ST1 Core Medical Training or Clinical Radiology trainee.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Public Health Practitioner (Local Authority)',
      'practitioner',
      'Delivers health improvement programmes, needs assessments and community interventions for councils.',
      {
        priority: 80,
        eligibilityNote:
          'Local authority public health practitioner — not Social Worker or Environmental Health Officer only.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Health Improvement Practitioner (Public Health)',
      'practitioner',
      'Implements behaviour change, screening and prevention initiatives in community and NHS settings.',
      {
        priority: 90,
        eligibilityNote:
          'Health improvement practitioner — not Health Visitor (Nursing) or Occupational Health Nurse.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Public Health Analyst (Entry)',
      'practitioner',
      'Analyses population health data, dashboards and intelligence products for decision-makers.',
      {
        priority: 100,
        eligibilityNote:
          'Public health analyst — not Data Analyst in non-health sectors or Clinical Coder roles.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Environmental Health Practitioner (Public Health Protection)',
      'practitioner',
      'Inspects food premises, housing and environmental hazards supporting health protection outcomes.',
      {
        priority: 110,
        eligibilityNote:
          'Environmental health in public health context — not pure facilities management roles.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Public Health Specialist (Health Protection)',
      'experienced',
      'Experienced practitioner managing outbreaks, immunisation programmes and health protection incidents.',
      {
        priority: 120,
        eligibilityNote:
          'Health protection specialist — not Infection Control Nurse or Microbiology Biomedical Scientist.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Epidemiologist (Public Health Intelligence)',
      'experienced',
      'Conducts epidemiological analysis, surveillance and outbreak investigation for public health agencies.',
      {
        priority: 130,
        eligibilityNote:
          'Public health epidemiologist — not Academic Epidemiologist without applied public health remit.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Public Health Consultant (Band 7 Local Authority)',
      'experienced',
      'Senior consultant-level public health professional leading programmes within local government teams.',
      {
        priority: 140,
        eligibilityNote:
          'Local authority public health consultant — not NHS Medical Consultant or Band 7 Ward Manager.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Health Protection Practitioner (Regional)',
      'experienced',
      'Regional practitioner coordinating health protection responses across integrated care systems.',
      {
        priority: 150,
        eligibilityNote:
          'Regional health protection — not Emergency Planning Officer without public health qualification.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Specialist Registrar in Public Health (ST3+)',
      'specialist',
      'Advanced specialty trainee completing public health training toward consultant certification.',
      {
        priority: 160,
        eligibilityNote:
          'ST3+ public health trainee — not Specialist Registrar in Internal Medicine or Surgery.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Consultant in Public Health (FPH)',
      'specialist',
      'Fellow of the Faculty of Public Health leading specialist public health practice and advisory work.',
      {
        priority: 170,
        eligibilityNote:
          'FPH consultant in public health — not Consultant Physician in hospital medicine specialties.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Deputy Director of Public Health (Local Authority)',
      'specialist',
      'Deputy lead for public health functions supporting the Director of Public Health statutory duties.',
      {
        priority: 180,
        eligibilityNote:
          'Deputy DPH — not Deputy Medical Director or Director of Nursing roles.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Regional Director of Public Health (Interim)',
      'advanced_practice_consultant',
      'Senior consultant providing strategic public health leadership across regional footprints.',
      {
        priority: 190,
        eligibilityNote:
          'Regional public health director — not Regional Medical Director without public health portfolio.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Consultant in Healthcare Public Health',
      'advanced_practice_consultant',
      'Consultant focusing on healthcare public health, service evaluation and population health management.',
      {
        priority: 200,
        eligibilityNote:
          'Healthcare public health consultant — not Consultant in Public Health Medicine on-call rota only.',
        professionalRegistrationRequirement: 'desirable',
      }
    ),
    r(
      'Director of Public Health (Local Authority)',
      'leadership',
      'Statutory director accountable for local public health outcomes and health protection coordination.',
      {
        priority: 210,
        eligibilityNote:
          'Director of Public Health — not Chief Executive of NHS Trust or ICB without DPH remit.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Head of Public Health Intelligence',
      'leadership',
      'Leads analytics, surveillance and intelligence teams supporting public health decision-making.',
      {
        priority: 220,
        eligibilityNote:
          'Public health intelligence leadership — not Head of BI in non-health organisations.',
        professionalRegistrationRequirement: 'none',
      }
    ),
    r(
      'Chief Environmental Health Officer (Public Health)',
      'leadership',
      'Senior environmental health leadership integrating regulatory enforcement with public health outcomes.',
      {
        priority: 230,
        eligibilityNote:
          'Chief EHO public health — not Director of Estates and Facilities in NHS Trusts.',
        professionalRegistrationRequirement: 'commonly_expected',
      }
    ),
    r(
      'Public Health Research Fellow',
      'academic_research',
      'Research fellow evaluating population interventions, health inequalities or prevention programmes.',
      {
        priority: 240,
        eligibilityNote:
          'Public health research — not Clinical Research Fellow in pharmaceutical trials.',
        isResearchRole: true,
      }
    ),
    r(
      'Senior Lecturer in Public Health',
      'academic_research',
      'University senior lecturer teaching epidemiology, health policy and public health practice.',
      {
        priority: 250,
        eligibilityNote:
          'HE public health teaching — not Senior Lecturer in Clinical Medicine.',
        isAcademicRole: true,
        academicRequirement: 'phd_relevant',
      }
    ),
    r(
      'Professor of Epidemiology and Public Health',
      'academic_research',
      'Professor leading population health research and postgraduate public health education.',
      {
        priority: 260,
        eligibilityNote:
          'Professor of epidemiology — not Professor of Clinical Medicine or Surgery.',
        isAcademicRole: true,
        isResearchRole: true,
        academicRequirement: 'phd_relevant',
      }
    ),
  ],
}

const HEALTHCARE_SCIENCE: SpecialismPack = {
  slug: 'healthcare-science',
  label: 'Healthcare Science',
  professionalBody: 'Academy for Healthcare Science (AHCS) / HCPC (where applicable)',
  relatedBodies: ['AHCS', 'HCPC', 'NSHCS', 'NHS Healthcare Science'],
  sources: [
    'nhs_healthcareers_healthcare_science',
    'ahcs_registration',
    'hcpc_clinical_scientist',
    'nshcs_stp',
  ],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'healthcare-science'),
  roles: [
    r('STP Trainee Clinical Scientist', 'qualification', 'Scientist Training Programme trainee in life sciences, physiological sciences or physical sciences.', { priority: 10, eligibilityNote: 'STP trainee — not Biomedical Science IBMS portfolio trainee or Medicine Foundation Doctor.' }),
    r('Healthcare Science Practitioner Degree Apprentice', 'qualification', 'Degree apprenticeship in healthcare science practitioner standards with supervised clinical practice.', { priority: 20, eligibilityNote: 'Healthcare science apprenticeship — not Nursing Associate or Operating Department Practitioner apprentice.', professionalRegistrationRequirement: 'none' }),
    r('Trainee Clinical Physiologist (Healthcare Science)', 'qualification', 'Pre-registration trainee in cardiac, respiratory, neurophysiology or sleep physiology departments.', { priority: 30, eligibilityNote: 'Clinical physiology trainee — not Trainee Physiotherapist or Trainee Radiographer.' }),
    r('Healthcare Science Assistant (Physiological Sciences)', 'qualification', 'Assistant supporting physiological measurement clinics under registered clinical scientist supervision.', { priority: 40, eligibilityNote: 'Healthcare science assistant — not Healthcare Assistant on inpatient wards.', professionalRegistrationRequirement: 'none' }),
    r('HCPC Registered Clinical Scientist (Newly Qualified)', 'registration_licence', 'Newly HCPC-registered clinical scientist following STP or equivalence route.', { priority: 50, eligibilityNote: 'New clinical scientist registrant — not newly registered Biomedical Scientist or Optometrist.' }),
    r('Clinical Scientist (STP Completion / AHCS Registration)', 'registration_licence', 'Clinical scientist completing STP with Academy for Healthcare Science registration where applicable.', { priority: 60, eligibilityNote: 'STP completion — not Specialist Registrar completing medical specialty training.' }),
    r('Newly Registered Healthcare Scientist (Academy Route)', 'registration_licence', 'Healthcare scientist registered with AHCS in practitioner or clinical scientist categories.', { priority: 70, eligibilityNote: 'AHCS registrant — not GOC registered optometrist or HCPC biomedical scientist only.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Clinical Scientist (Medical Physics)', 'practitioner', 'Delivers medical physics services including imaging physics, radiotherapy physics or nuclear medicine.', { priority: 80, eligibilityNote: 'Medical physics clinical scientist — not Diagnostic Radiographer or Radiotherapy Radiographer.' }),
    r('Clinical Scientist (Cardiac Physiology)', 'practitioner', 'Performs echocardiography, cardiac catheterisation support and cardiac diagnostic investigations.', { priority: 90, eligibilityNote: 'Cardiac physiology scientist — not Cardiac Physiologist without healthcare science registration where required.' }),
    r('Healthcare Scientist (Audiology)', 'practitioner', 'Provides diagnostic audiology, hearing assessment and rehabilitation in NHS and community settings.', { priority: 100, eligibilityNote: 'Audiology healthcare scientist — not Speech and Language Therapist or ENT Surgeon roles.' }),
    r('Healthcare Scientist (Genomics Laboratory)', 'practitioner', 'Supports genomic testing pipelines, variant interpretation and laboratory quality in NHS Genomic Medicine Service.', { priority: 110, eligibilityNote: 'Genomics healthcare scientist — not Clinical Genetics Counsellor or Molecular Biology research technician only.' }),
    r('Senior Clinical Scientist (Neurophysiology)', 'experienced', 'Leads EEG, EMG and evoked potential services with complex case interpretation.', { priority: 120, eligibilityNote: 'Senior neurophysiology scientist — not Neurology Registrar or Consultant Neurologist.' }),
    r('Senior Healthcare Scientist (Respiratory Physiology)', 'experienced', 'Experienced scientist in lung function testing, sleep studies and respiratory diagnostics.', { priority: 130, eligibilityNote: 'Senior respiratory physiology — not Respiratory Physiotherapist or Respiratory Nurse Specialist.' }),
    r('Senior Clinical Scientist (Radiation Physics)', 'experienced', 'Senior medical physicist supporting radiotherapy planning, QA and radiation safety.', { priority: 140, eligibilityNote: 'Senior radiation physicist — not Therapeutic Radiographer or Oncology Consultant Physician.' }),
    r('Senior Healthcare Scientist (Rehabilitation Engineering)', 'experienced', 'Designs and supports assistive technology, prosthetics interfaces and rehabilitation devices.', { priority: 150, eligibilityNote: 'Rehabilitation engineering scientist — not Prosthetist/Orthotist HCPC role or Occupational Therapist.' }),
    r('Specialist Clinical Scientist (Critical Care Technology)', 'specialist', 'Specialist in critical care technology, device management and physiological monitoring systems.', { priority: 160, eligibilityNote: 'Critical care technology specialist — not Critical Care Nurse or Anaesthetic Consultant.' }),
    r('Specialist Clinical Scientist (Sleep Physiology)', 'specialist', 'Specialist in sleep disorder diagnostics, polysomnography and CPAP services.', { priority: 170, eligibilityNote: 'Sleep physiology specialist — not Respiratory Consultant without healthcare science credentials.' }),
    r('Lead Clinical Scientist (Physiological Measurement)', 'specialist', 'Leads physiological sciences service lines, training and governance across departments.', { priority: 180, eligibilityNote: 'Physiological measurement lead — not Lead Nurse in cardiology or respiratory services.' }),
    r('Consultant Clinical Scientist (Healthcare Science)', 'advanced_practice_consultant', 'Consultant-level clinical scientist providing expert scientific leadership across NHS services.', { priority: 190, eligibilityNote: 'Consultant clinical scientist — not Consultant Physician or Consultant Biomedical Scientist only.', academicRequirement: 'masters_relevant' }),
    r('Advanced Clinical Scientist (Medical Physics)', 'advanced_practice_consultant', 'Advanced practitioner medical physicist with expert advisory and service development responsibilities.', { priority: 200, eligibilityNote: 'Advanced medical physicist — not Consultant Clinical Oncologist (medical) roles.', academicRequirement: 'masters_relevant' }),
    r('Head of Clinical Engineering (Healthcare Science)', 'leadership', 'Leads clinical engineering and healthcare technology management across an NHS organisation.', { priority: 210, eligibilityNote: 'Clinical engineering leadership — not Head of Estates without healthcare science remit.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Principal Clinical Scientist (Service Lead)', 'leadership', 'Principal scientist accountable for multi-site healthcare science service delivery and workforce.', { priority: 220, eligibilityNote: 'Principal clinical scientist — not Matron or Director of Nursing leadership roles.', professionalRegistrationRequirement: 'required' }),
    r('Director of Healthcare Science (NHS Trust)', 'leadership', 'Executive director for healthcare science workforce, STP pipelines and scientific service strategy.', { priority: 230, eligibilityNote: 'Director of healthcare science — not Medical Director or Chief Operating Officer without scientific portfolio.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Healthcare Science Research Fellow', 'academic_research', 'Research fellow in clinical measurement, medical devices or translational healthcare science.', { priority: 240, eligibilityNote: 'Healthcare science research — not Clinical Research Associate in commercial trial monitoring.', isResearchRole: true }),
    r('Clinical Academic Scientist (Healthcare Science)', 'academic_research', 'Joint NHS and university scientist combining clinical service with funded research programmes.', { priority: 250, eligibilityNote: 'Clinical academic scientist — not Clinical Academic Doctor (medical) without healthcare science registration.', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Clinical Science and Engineering', 'academic_research', 'Professor leading healthcare science research, STP academic partnerships and postgraduate training.', { priority: 260, eligibilityNote: 'Professor of clinical science — not Professor of Surgery or Internal Medicine.', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

const OPTOMETRY: SpecialismPack = {
  slug: 'optometry',
  label: 'Optometry',
  professionalBody: 'General Optical Council (GOC)',
  relatedBodies: ['GOC', 'College of Optometrists', 'ABDO'],
  sources: ['nhs_healthcareers_optometrist', 'college_of_optometrists_careers', 'goc_registration', 'prospects_optometrist'],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'optometry'),
  roles: [
    r('Optometry Student (MOptom Programme)', 'qualification', 'Undergraduate or postgraduate optometry student on GOC-approved MOptom degree with clinical placements.', { priority: 10, eligibilityNote: 'Optometry degree student — not Orthoptics student or Dispensing Optician trainee only.' }),
    r('Pre-Registration Optometrist (Training Year)', 'qualification', 'Graduate completing supervised pre-registration period before full GOC registration.', { priority: 20, eligibilityNote: 'Pre-reg optometry year — not Pre-Registration Pharmacist or Foundation Pharmacist training.', professionalRegistrationRequirement: 'none' }),
    r('Optical Assistant (Pre-Registration Optometry Route)', 'qualification', 'Optical retail assistant progressing toward optometry qualification with employer support.', { priority: 30, eligibilityNote: 'Optical assistant optometry route — not Healthcare Assistant or Pharmacy Dispenser roles.', professionalRegistrationRequirement: 'none' }),
    r('Dispensing Optician to Optometry Conversion Trainee', 'qualification', 'Qualified dispensing optician undertaking further study toward GOC optometrist registration.', { priority: 40, eligibilityNote: 'DO to optometry conversion — not standalone Dispensing Optician without conversion training.', professionalRegistrationRequirement: 'none' }),
    r('GOC Registered Optometrist (Newly Qualified)', 'registration_licence', 'Newly GOC-registered optometrist completing early career development in community or hospital practice.', { priority: 50, eligibilityNote: 'New GOC registrant — not newly registered Orthoptist or HCPC Clinical Scientist.' }),
    r('Pre-Registration Optometrist (Supervised Practice Year)', 'registration_licence', 'Supervised practice year under GOC-approved supervisor before independent registration.', { priority: 60, eligibilityNote: 'Supervised pre-reg optometrist — not Foundation Year Doctor or Band 5 Staff Nurse.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Newly Registered Community Optometrist (GOC)', 'registration_licence', 'Recently registered optometrist in high-street or independent community optical practice.', { priority: 70, eligibilityNote: 'Community optometrist registration — not Hospital Eye Unit medical trainee roles.' }),
    r('Community Optometrist (Primary Eyecare)', 'practitioner', 'Delivers sight tests, refraction and ocular health screening in community optical settings.', { priority: 80, eligibilityNote: 'Primary eyecare optometrist — not Orthoptist or Ophthalmic Nurse roles.' }),
    r('Hospital Optometrist (NHS Eye Unit)', 'practitioner', 'Provides specialist optometric assessment within hospital eye departments and shared care clinics.', { priority: 90, eligibilityNote: 'Hospital optometrist — not Ophthalmology Registrar or Consultant Ophthalmologist (medical).' }),
    r('Optometrist (Contact Lens Specialist Practice)', 'practitioner', 'Fits and manages contact lenses including complex corneal and specialty lens cases.', { priority: 100, eligibilityNote: 'Contact lens optometrist — not Contact Lens Optician without GOC optometrist registration.' }),
    r('Optometrist (Domiciliary Eye Care Provider)', 'practitioner', 'Provides domiciliary eye care for care homes and housebound patients under GOC standards.', { priority: 110, eligibilityNote: 'Domiciliary optometrist — not District Nurse or Community Palliative Care Nurse.' }),
    r('Senior Optometrist (Primary Care Network)', 'experienced', 'Experienced optometrist supporting PCN eyecare pathways and enhanced services.', { priority: 120, eligibilityNote: 'PCN senior optometrist — not GP Partner or Advanced Nurse Practitioner roles.' }),
    r('Senior Optometrist (Low Vision Rehabilitation)', 'experienced', 'Supports patients with visual impairment through low vision assessment and rehabilitation aids.', { priority: 130, eligibilityNote: 'Low vision optometrist — not Rehabilitation Consultant (medical) or Occupational Therapist only.' }),
    r('Lead Optometrist (Minor Eye Conditions Service)', 'experienced', 'Leads MECS provision, triage and treatment of minor eye conditions in primary care.', { priority: 140, eligibilityNote: 'MECS lead optometrist — not Emergency Department Doctor or Eye Casualty medical roles.' }),
    r('Optometrist (Independent Prescriber)', 'experienced', 'GOC registered optometrist with independent prescribing qualification for ocular therapeutics.', { priority: 150, eligibilityNote: 'Independent prescriber optometrist — not Non-Medical Prescriber Nurse or Pharmacist IP roles.', academicRequirement: 'masters_relevant' }),
    r('Specialist Optometrist (Glaucoma Referral Refinement)', 'specialist', 'Specialist in glaucoma referral refinement schemes and shared care with hospital eye services.', { priority: 160, eligibilityNote: 'Glaucoma specialist optometrist — not Glaucoma Consultant Ophthalmologist (medical).' }),
    r('Specialist Optometrist (Paediatric Eye Care)', 'specialist', 'Specialist optometric assessment for children including amblyopia and refractive management.', { priority: 170, eligibilityNote: 'Paediatric optometrist — not Orthoptist or Paediatric Ophthalmology Registrar alone.' }),
    r('Specialist Optometrist (Medical Retina Shared Care)', 'specialist', 'Manages medical retina shared care including AMD monitoring under hospital protocols.', { priority: 180, eligibilityNote: 'Medical retina optometrist — not Medical Retina Consultant Ophthalmologist.' }),
    r('Consultant Optometrist (Hospital Eye Service)', 'advanced_practice_consultant', 'Consultant-level optometrist leading hospital sub-specialty optometric services.', { priority: 190, eligibilityNote: 'Consultant optometrist — not Consultant Ophthalmologist on surgical training pathway.', academicRequirement: 'masters_relevant' }),
    r('Advanced Clinical Practitioner Optometrist (MECS)', 'advanced_practice_consultant', 'Advanced practitioner delivering extended scope primary eyecare and urgent eye care.', { priority: 200, eligibilityNote: 'ACP optometrist — not Advanced Clinical Practitioner Nurse in emergency or primary care.', academicRequirement: 'masters_relevant' }),
    r('Head Optometrist (Primary Eyecare Network)', 'leadership', 'Professional lead for optometrists across a primary eyecare network or optical group.', { priority: 210, eligibilityNote: 'Head optometrist PCN — not Head of Nursing or General Practice Manager roles.', professionalRegistrationRequirement: 'required' }),
    r('Clinical Lead Optometrist (Community Optical Provider)', 'leadership', 'Clinical governance lead for optometry teams in multi-site community optical organisations.', { priority: 220, eligibilityNote: 'Clinical lead optometrist — not Clinical Director of Medicine or Surgery.', professionalRegistrationRequirement: 'required' }),
    r('Director of Optometry Services', 'leadership', 'Executive leadership of optometry workforce and eyecare service strategy across a provider.', { priority: 230, eligibilityNote: 'Director of optometry — not Director of Nursing or Chief Medical Officer roles.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Optometry Research Fellow', 'academic_research', 'Research fellow investigating vision science, ocular disease or public health eyecare.', { priority: 240, eligibilityNote: 'Optometry research — not Ophthalmology Clinical Research Fellow (medical trainee).', isResearchRole: true }),
    r('Lecturer in Optometry (HE)', 'academic_research', 'University lecturer on GOC-approved optometry programmes with clinical teaching responsibilities.', { priority: 250, eligibilityNote: 'HE optometry lecturer — not Lecturer in Orthoptics or Biomedical Science.', isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Vision Science', 'academic_research', 'Professor leading vision science research and doctoral supervision in university optometry departments.', { priority: 260, eligibilityNote: 'Professor of vision science — not Professor of Ophthalmology (medical faculty).', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

const CLINICAL_PSYCHOLOGY: SpecialismPack = {
  slug: 'clinical-psychology',
  label: 'Clinical Psychology',
  professionalBody: 'Health and Care Professions Council (HCPC) / British Psychological Society (BPS)',
  relatedBodies: ['BPS', 'HCPC', 'NHS England Psychological Professions'],
  sources: ['nhs_healthcareers_clinical_psychologist', 'bps_careers_clinical', 'hcpc_practitioner_psychologist', 'prospects_clinical_psychologist'],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'clinical-psychology'),
  roles: [
    r('Clinical Psychology Doctorate Trainee (DClinPsy)', 'qualification', 'Doctorate in Clinical Psychology trainee on HCPC-approved DClinPsy programme with NHS placements.', { priority: 10, eligibilityNote: 'DClinPsy trainee — not Counselling Psychology doctorate or Medicine training routes.', academicRequirement: 'phd_relevant', professionalRegistrationRequirement: 'none' }),
    r('Assistant Psychologist (NHS Clinical Psychology)', 'qualification', 'Pre-doctoral assistant supporting assessments, interventions and research in NHS psychology teams.', { priority: 20, eligibilityNote: 'Assistant psychologist — not Psychological Wellbeing Practitioner qualified role or Mental Health Nurse.', academicRequirement: 'masters_relevant', professionalRegistrationRequirement: 'none' }),
    r('Psychological Wellbeing Practitioner Trainee (IAPT)', 'qualification', 'Trainee delivering low-intensity CBT interventions under IAPT supervision toward PWP qualification.', { priority: 30, eligibilityNote: 'PWP trainee — not DClinPsy trainee or Counsellor without IAPT training.', professionalRegistrationRequirement: 'none' }),
    r('Research Assistant (Clinical Psychology Doctorate Route)', 'qualification', 'Research assistant gaining experience toward clinical psychology doctorate application.', { priority: 40, eligibilityNote: 'Research assistant for DClinPsy — not Clinical Research Associate in pharmaceutical trials.', isResearchRole: true, professionalRegistrationRequirement: 'none' }),
    r('HCPC Registered Clinical Psychologist (Newly Qualified)', 'registration_licence', 'Newly HCPC-registered clinical psychologist following DClinPsy completion.', { priority: 50, eligibilityNote: 'New HCPC clinical psychologist — not newly registered Counselling Psychologist or Psychiatrist.', academicRequirement: 'phd_relevant' }),
    r('Chartered Clinical Psychologist (BPS, Post-DClinPsy)', 'registration_licence', 'BPS chartered clinical psychologist with HCPC registration after doctoral qualification.', { priority: 60, eligibilityNote: 'Chartered clinical psychologist — not Chartered Occupational Psychologist in corporate HR.', academicRequirement: 'phd_relevant' }),
    r('Newly Qualified Clinical Psychologist (NHS)', 'registration_licence', 'Post-doctoral clinical psychologist in first NHS substantive post with preceptorship.', { priority: 70, eligibilityNote: 'Newly qualified clinical psychologist — not Foundation Doctor or Band 5 Staff Nurse.', academicRequirement: 'phd_relevant' }),
    r('Clinical Psychologist (Adult Mental Health NHS)', 'practitioner', 'Delivers psychological assessment and evidence-based therapies in adult mental health services.', { priority: 80, eligibilityNote: 'Adult mental health clinical psychologist — not Adult Psychiatrist or CBT Therapist without HCPC.' }),
    r('Clinical Psychologist (CAMHS)', 'practitioner', 'Provides psychological assessment and intervention for children and young people in CAMHS.', { priority: 90, eligibilityNote: 'CAMHS clinical psychologist — not Child and Adolescent Psychiatrist or Play Therapist only.' }),
    r('Clinical Psychologist (Learning Disabilities)', 'practitioner', 'Supports people with learning disabilities through behavioural and therapeutic interventions.', { priority: 100, eligibilityNote: 'Learning disabilities clinical psychologist — not Learning Disability Nurse without psychology qualification.' }),
    r('Clinical Psychologist (Forensic Services)', 'practitioner', 'Delivers forensic psychological assessment and intervention in secure and community settings.', { priority: 110, eligibilityNote: 'Forensic clinical psychologist — not Forensic Psychiatrist or Probation Officer roles.' }),
    r('Senior Clinical Psychologist (Health Psychology)', 'experienced', 'Experienced psychologist in physical health settings supporting adjustment, pain and long-term conditions.', { priority: 120, eligibilityNote: 'Health clinical psychologist — not Health Psychologist (non-clinical route) without HCPC clinical registration.' }),
    r('Senior Clinical Psychologist (Neuropsychology)', 'experienced', 'Conducts neuropsychological assessment and rehabilitation for acquired brain injury and neurological conditions.', { priority: 130, eligibilityNote: 'Neuropsychology senior CP — not Consultant Neurologist or Neuropsychiatrist (medical).' }),
    r('Senior Clinical Psychologist (Older Adults)', 'experienced', 'Leads psychological services for older adults including dementia and late-life mental health.', { priority: 140, eligibilityNote: 'Older adults clinical psychologist — not Geriatrician or Old Age Psychiatrist without psychology qualification.' }),
    r('Senior Clinical Psychologist (Primary Care Mental Health)', 'experienced', 'Provides specialist psychology input in primary care and PCN mental health services.', { priority: 150, eligibilityNote: 'Primary care clinical psychologist — not GP with Mental Health Practitioner role only.' }),
    r('Specialist Clinical Psychologist (Eating Disorders)', 'specialist', 'Specialist in eating disorder assessment and NICE-aligned psychological treatment.', { priority: 160, eligibilityNote: 'Eating disorders specialist CP — not Dietitian or Eating Disorders Nurse without clinical psychology qualification.' }),
    r('Specialist Clinical Psychologist (Trauma and PTSD)', 'specialist', 'Specialist delivering trauma-focused therapies including EMDR and CPT for complex PTSD.', { priority: 170, eligibilityNote: 'Trauma specialist CP — not Trauma Counsellor without HCPC clinical psychologist registration.' }),
    r('Lead Clinical Psychologist (Psychological Therapies)', 'specialist', 'Leads psychological therapies service line, supervision and clinical governance.', { priority: 180, eligibilityNote: 'Lead clinical psychologist — not Lead Nurse in mental health services.' }),
    r('Consultant Clinical Psychologist (NHS)', 'advanced_practice_consultant', 'Consultant-level clinical psychologist providing expert leadership and complex case oversight.', { priority: 190, eligibilityNote: 'Consultant clinical psychologist — not Consultant Psychiatrist on medical training pathway.', academicRequirement: 'phd_relevant' }),
    r('Principal Clinical Psychologist (Complex Cases)', 'advanced_practice_consultant', 'Principal psychologist managing highly complex cases and regional specialist psychology services.', { priority: 200, eligibilityNote: 'Principal clinical psychologist — not Consultant Physician or Medical Director roles.', academicRequirement: 'phd_relevant' }),
    r('Head of Psychology (NHS Trust)', 'leadership', 'Professional lead for clinical psychology workforce and service standards across a Trust.', { priority: 210, eligibilityNote: 'Head of psychology — not Head of Nursing or Director of Medical Education.', professionalRegistrationRequirement: 'required' }),
    r('Clinical Director of Psychological Services', 'leadership', 'Clinical director accountable for psychological therapies strategy and multi-disciplinary governance.', { priority: 220, eligibilityNote: 'Clinical director psychology — not Clinical Director of Medicine or Surgery.', professionalRegistrationRequirement: 'required' }),
    r('Director of Clinical Psychology (Healthcare Organisation)', 'leadership', 'Executive leadership of clinical psychology services across an ICS, Trust or private provider.', { priority: 230, eligibilityNote: 'Director of clinical psychology — not Chief Medical Officer or Director of Nursing.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Clinical Psychology Research Fellow', 'academic_research', 'Research fellow evaluating psychological interventions, outcomes or implementation science.', { priority: 240, eligibilityNote: 'Clinical psychology research — not Clinical Research Fellow in drug trials without psychology focus.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Senior Lecturer in Clinical Psychology (DClinPsy Route)', 'academic_research', 'University senior lecturer on DClinPsy programmes with research and clinical teaching.', { priority: 250, eligibilityNote: 'Senior lecturer clinical psychology — not Senior Lecturer in Psychiatry (medical faculty).', isAcademicRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Clinical Psychology', 'academic_research', 'Professor leading clinical psychology research, doctoral training and NHS academic partnerships.', { priority: 260, eligibilityNote: 'Professor of clinical psychology — not Professor of Psychiatry or Neuroscience without CP qualification.', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

const HEALTHCARE_MANAGEMENT: SpecialismPack = {
  slug: 'healthcare-management',
  label: 'Healthcare Management',
  professionalBody: 'NHS Leadership Academy / Chartered Management Institute (CMI)',
  relatedBodies: ['NHS Leadership Academy', 'CMI', 'HFMA', 'FMLM'],
  sources: ['nhs_healthcareers_healthcare_manager', 'nhs_graduate_management_training_scheme', 'nhsla_programmes', 'prospects_health_service_manager'],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'healthcare-management'),
  disabledStageKeys: ['registration_licence'],
  roles: [
    r('NHS Graduate Management Trainee', 'qualification', 'Graduate trainee on NHS management training scheme rotating through operational and strategic placements.', { priority: 10, eligibilityNote: 'NHS GMT — not NHS Graduate Management Scheme duplicate of clinical training; not Medicine Foundation Programme.', professionalRegistrationRequirement: 'none' }),
    r('NHS Graduate Management Scheme Trainee', 'qualification', 'Structured graduate scheme developing general management competencies across NHS provider and system roles.', { priority: 20, eligibilityNote: 'Graduate management scheme — not Clinical Psychology DClinPsy or Nursing pre-registration training.', professionalRegistrationRequirement: 'none' }),
    r('Healthcare Management Degree Apprentice', 'qualification', 'Degree apprenticeship combining healthcare leadership study with operational NHS placements.', { priority: 30, eligibilityNote: 'Healthcare management apprenticeship — not Business Administration apprenticeship in non-health sectors.', professionalRegistrationRequirement: 'none' }),
    r('Administrative and Clerical Apprentice (NHS Management Route)', 'qualification', 'Apprentice developing administrative foundations toward healthcare management career pathways.', { priority: 40, eligibilityNote: 'Admin apprentice management route — not Medical Secretary or Clinical Coding apprenticeship only.', professionalRegistrationRequirement: 'none' }),
    r('Ward Manager (Healthcare Operations)', 'practitioner', 'Manages ward or unit operations, staffing, patient flow and quality in acute or community settings.', { priority: 50, eligibilityNote: 'Ward manager operations — not Ward Sister/Charge Nurse clinical nursing leadership without management remit.', professionalRegistrationRequirement: 'none' }),
    r('Service Manager (NHS Acute Trust)', 'practitioner', 'Manages a clinical or corporate service line including budget, performance and stakeholder relationships.', { priority: 60, eligibilityNote: 'NHS service manager — not Band 6 Staff Nurse or Junior Doctor clinical roles.', professionalRegistrationRequirement: 'none' }),
    r('Operations Manager (Community Healthcare)', 'practitioner', 'Oversees community service delivery, rotas and performance for district nursing or therapy providers.', { priority: 70, eligibilityNote: 'Community operations manager — not District Nurse Team Leader with clinical caseload only.', professionalRegistrationRequirement: 'none' }),
    r('Practice Manager (GP Federation)', 'practitioner', 'Manages primary care operations, contracts and workforce across GP federation or PCN sites.', { priority: 80, eligibilityNote: 'GP federation practice manager — not GP Partner clinical role or Receptionist supervisor only.', professionalRegistrationRequirement: 'none' }),
    r('Team Manager (Healthcare Support Services)', 'practitioner', 'Leads non-clinical support teams such as patient access, facilities coordination or diagnostics booking.', { priority: 90, eligibilityNote: 'Healthcare support services manager — not Porter Supervisor or Catering Manager outside NHS context.', professionalRegistrationRequirement: 'none' }),
    r('Senior Service Manager (NHS Trust)', 'experienced', 'Senior manager accountable for multi-team services, transformation projects and performance targets.', { priority: 100, eligibilityNote: 'Senior service manager — not Senior Ward Manager with purely clinical nursing accountability.', professionalRegistrationRequirement: 'none' }),
    r('Programme Manager (NHS Transformation)', 'experienced', 'Manages improvement programmes, change delivery and benefits realisation across healthcare pathways.', { priority: 110, eligibilityNote: 'NHS transformation PM — not IT Project Manager in non-health organisations.', professionalRegistrationRequirement: 'none' }),
    r('General Manager (Community Health Services)', 'experienced', 'General manager for community provider divisions including finance, quality and workforce planning.', { priority: 120, eligibilityNote: 'Community general manager — not General Practitioner or Community Matron clinical roles.', professionalRegistrationRequirement: 'none' }),
    r('Associate Director (Healthcare Operations)', 'experienced', 'Associate director supporting operational delivery, capacity planning and elective recovery programmes.', { priority: 130, eligibilityNote: 'Associate director operations — not Associate Medical Director or Director of Nursing.', professionalRegistrationRequirement: 'none' }),
    r('Divisional Manager (Hospital Directorate)', 'specialist', 'Manages a hospital division or directorate covering multiple departments and clinical services.', { priority: 140, eligibilityNote: 'Divisional manager — not Clinical Director (medical) with on-call consultant responsibilities.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Service Manager (Non-Clinical Leadership)', 'specialist', 'Manages clinical service operations without holding clinical registration; focuses on flow and resources.', { priority: 150, eligibilityNote: 'Non-clinical clinical service manager — not Advanced Nurse Practitioner with clinical caseload.', professionalRegistrationRequirement: 'none' }),
    r('Head of Patient Flow and Capacity (NHS)', 'specialist', 'Leads bed management, elective scheduling and capacity modelling across acute provider sites.', { priority: 160, eligibilityNote: 'Patient flow head — not Emergency Medicine Consultant or Bed Manager without strategic remit.', professionalRegistrationRequirement: 'none' }),
    r('General Manager (Acute Hospital Division)', 'advanced_practice_consultant', 'Senior general manager accountable for divisional performance, safety and financial balance.', { priority: 170, eligibilityNote: 'Acute division GM — not Consultant Surgeon or Medical Director without management portfolio.', professionalRegistrationRequirement: 'none' }),
    r('Deputy Chief Operating Officer (NHS Trust)', 'advanced_practice_consultant', 'Deputy COO overseeing operational performance, incident response and system flow.', { priority: 180, eligibilityNote: 'Deputy COO — not Deputy Medical Director or Deputy Director of Nursing.', professionalRegistrationRequirement: 'none' }),
    r('Chief Operating Officer (NHS Foundation Trust)', 'leadership', 'Executive responsible for operational delivery, quality and performance across Trust services.', { priority: 190, eligibilityNote: 'COO NHS Trust — not Chief Medical Officer or Chief Nurse executive roles.', professionalRegistrationRequirement: 'none' }),
    r('Director of Operations (Healthcare Provider)', 'leadership', 'Director-level leadership of operational functions across hospitals, community and corporate services.', { priority: 200, eligibilityNote: 'Director of operations — not Director of Medical Education or Director of Public Health.', professionalRegistrationRequirement: 'none' }),
    r('Director of Strategy and Transformation (NHS)', 'leadership', 'Leads strategic planning, transformation portfolio and ICS/STP alignment for healthcare providers.', { priority: 210, eligibilityNote: 'Strategy and transformation director — not Management Consultant in non-NHS firms without provider remit.', professionalRegistrationRequirement: 'none' }),
    r('Chief Executive (NHS Trust or ICB)', 'leadership', 'Accountable officer leading NHS Trust, foundation trust or integrated care board strategy and governance.', { priority: 220, eligibilityNote: 'Chief executive healthcare — not Hospital Medical Director or GP Clinical Chair without executive appointment.', professionalRegistrationRequirement: 'none' }),
    r('Healthcare Management Research Fellow', 'academic_research', 'Research fellow studying health policy, organisation science or NHS management effectiveness.', { priority: 230, eligibilityNote: 'Healthcare management research — not Clinical Research Fellow in pharmaceutical trials.', isResearchRole: true, professionalRegistrationRequirement: 'none' }),
    r('Lecturer in Health Management and Policy', 'academic_research', 'University lecturer teaching health management, policy and leadership on postgraduate programmes.', { priority: 240, eligibilityNote: 'HE health management lecturer — not Lecturer in Medicine or Nursing.', isAcademicRole: true, academicRequirement: 'phd_relevant', professionalRegistrationRequirement: 'none' }),
    r('Professor of Health Policy and Management', 'academic_research', 'Professor leading health services research, policy evaluation and executive education.', { priority: 250, eligibilityNote: 'Professor health policy — not Professor of Clinical Medicine or Public Health without management focus.', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant', professionalRegistrationRequirement: 'none' }),
  ],
}

const CLINICAL_RESEARCH: SpecialismPack = {
  slug: 'clinical-research',
  label: 'Clinical Research',
  professionalBody: 'NIHR / MHRA (regulatory context)',
  relatedBodies: ['NIHR', 'MHRA', 'HRA', 'ICH-GCP'],
  sources: ['nhs_healthcareers_clinical_research', 'nihr_research_roles', 'hra_gcp', 'prospects_clinical_research'],
  siblingSlugs: SCIENCE_MGMT_SIBLINGS.filter((s) => s !== 'clinical-research'),
  roles: [
    r('Clinical Research Associate Trainee (GCP Foundation)', 'qualification', 'Entry trainee learning Good Clinical Practice and trial documentation in NHS R&D or CRO settings.', { priority: 10, eligibilityNote: 'CRA trainee — not Clinical Research Nurse requiring NMC registration or Medicine trainee doctor.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Trial Coordinator (Entry / Graduate)', 'qualification', 'Graduate coordinator supporting trial setup, participant recruitment and regulatory filing.', { priority: 20, eligibilityNote: 'Trial coordinator entry — not Data Entry Clerk or Ward Clerk without research remit.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Trials Administrator (NHS R&D)', 'qualification', 'Administrator supporting R&D governance submissions, SOPs and study file management.', { priority: 30, eligibilityNote: 'Trials administrator — not Medical Secretary or Research Grants administrator in non-clinical research.', professionalRegistrationRequirement: 'none' }),
    r('Research Nurse Applicant (Clinical Trials, NMC Route)', 'qualification', 'Nursing student or pre-registration nurse targeting clinical research nursing; NMC registration required to practise.', { priority: 40, eligibilityNote: 'Research nurse applicant — NMC registration required for qualified research nurse roles; not unregistered Healthcare Assistant.', professionalRegistrationRequirement: 'none' }),
    r('Good Clinical Practice Certified Research Coordinator', 'registration_licence', 'GCP-certified coordinator authorised for regulated trial activities under delegated duties.', { priority: 50, eligibilityNote: 'GCP certified coordinator — not HCPC clinical registration routes; GCP is training not professional registration.', professionalRegistrationRequirement: 'none' }),
    r('NIHR Pre-Doctoral Clinical Research Fellow', 'registration_licence', 'Pre-doctoral fellow developing research skills toward doctoral clinical academic training.', { priority: 60, eligibilityNote: 'NIHR pre-doc fellow — not Foundation Doctor or Core Medical Training without research fellowship.', isResearchRole: true, professionalRegistrationRequirement: 'none' }),
    r('Clinical Research Nurse (NMC Registered, Trials)', 'registration_licence', 'NMC-registered nurse delivering trial interventions, consent and safety monitoring in research settings.', { priority: 70, eligibilityNote: 'Clinical research nurse — NMC registration required; not Band 5 Staff Nurse on general wards without research remit.', professionalRegistrationRequirement: 'required' }),
    r('Clinical Research Associate (CRA, Site Monitoring)', 'practitioner', 'Monitors trial sites, verifies source data and ensures GCP compliance for sponsors or CROs.', { priority: 80, eligibilityNote: 'CRA site monitoring — not Clinical Auditor in non-research quality roles.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Trial Coordinator (Phase II/III NHS)', 'practitioner', 'Coordinates multi-centre NHS trials including screening, visits and adverse event reporting.', { priority: 90, eligibilityNote: 'Phase II/III coordinator — not Ward Coordinator or Theatre Coordinator without trial duties.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Research Nurse (Oncology Trials)', 'practitioner', 'Research nurse delivering oncology trial protocols, infusions and patient monitoring.', { priority: 100, eligibilityNote: 'Oncology research nurse — not Chemotherapy Nurse on standard care without trial protocol.', professionalRegistrationRequirement: 'required' }),
    r('Clinical Trials Data Coordinator', 'practitioner', 'Manages CRF completion, query resolution and data integrity for clinical trial databases.', { priority: 110, eligibilityNote: 'Trials data coordinator — not Clinical Coder or Health Records Officer without trial data remit.', professionalRegistrationRequirement: 'none' }),
    r('Senior Clinical Research Associate (Monitoring)', 'experienced', 'Experienced CRA leading monitoring visits, risk-based monitoring and site relationship management.', { priority: 120, eligibilityNote: 'Senior CRA — not Senior Biomedical Scientist or Senior Pharmacist without trial monitoring experience.', professionalRegistrationRequirement: 'none' }),
    r('Senior Clinical Trial Coordinator (Commercial Sponsor)', 'experienced', 'Senior coordinator for industry-sponsored trials managing budgets, vendors and regulatory correspondence.', { priority: 130, eligibilityNote: 'Senior commercial coordinator — not Clinical Trial Manager without coordinator background.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Research Nurse (Cardiology Trials)', 'experienced', 'Experienced research nurse in cardiology trials including device and interventional studies.', { priority: 140, eligibilityNote: 'Cardiology research nurse — not Cardiac Nurse Specialist on standard pathways without research portfolio.', professionalRegistrationRequirement: 'required' }),
    r('Clinical Trials Manager (Site R&D)', 'experienced', 'Manages trial portfolio at NHS site including feasibility, setup and delivery performance.', { priority: 150, eligibilityNote: 'Site trials manager — not R&D Director or Ward Manager without trial portfolio accountability.', professionalRegistrationRequirement: 'none' }),
    r('Lead Clinical Research Associate (Quality Assurance)', 'specialist', 'Lead CRA specialising in audit, CAPA and quality oversight of monitoring programmes.', { priority: 160, eligibilityNote: 'Lead CRA QA — not Quality Assurance Manager in manufacturing without GCP trial experience.', professionalRegistrationRequirement: 'none' }),
    r('Principal Clinical Trial Coordinator (Multi-Centre)', 'specialist', 'Principal coordinator across multiple sites managing complex trial logistics and training.', { priority: 170, eligibilityNote: 'Principal trial coordinator — not Principal Clinical Pharmacist or medical Principal Investigator.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Research Manager (NHS R&D Directorate)', 'specialist', 'Manages R&D delivery teams, study pipelines and commercial contract performance.', { priority: 180, eligibilityNote: 'Clinical research manager R&D — not Research and Development Director in non-health industries.', professionalRegistrationRequirement: 'none' }),
    r('Principal Investigator (Clinical Trials, NHS)', 'advanced_practice_consultant', 'Named PI accountable for trial conduct, safety reporting and delegation logs at NHS site.', { priority: 190, eligibilityNote: 'Principal investigator — commonly medically or clinically qualified; not CRA or coordinator without PI delegation.', professionalRegistrationRequirement: 'commonly_expected' }),
    r('Senior Clinical Research Fellow (NIHR)', 'advanced_practice_consultant', 'Senior research fellow leading clinical studies toward higher academic or consultant clinical academic posts.', { priority: 200, eligibilityNote: 'Senior clinical research fellow — not Specialist Registrar without dedicated research fellowship.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Head of Clinical Research (NHS Trust R&D)', 'leadership', 'Head of R&D function managing trial portfolio, governance and NIHR performance metrics.', { priority: 210, eligibilityNote: 'Head of clinical research — not Head of Nursing or Medical Director without R&D remit.', professionalRegistrationRequirement: 'none' }),
    r('Director of Research and Development (Healthcare Organisation)', 'leadership', 'Director accountable for research strategy, commercial trials income and academic partnerships.', { priority: 220, eligibilityNote: 'Director R&D healthcare — not University Research Dean without NHS provider accountability.', professionalRegistrationRequirement: 'none' }),
    r('Director of Clinical Operations (Contract Research Organisation)', 'leadership', 'Executive leadership of clinical operations, monitoring and data management in CRO/industry.', { priority: 230, eligibilityNote: 'Director clinical operations CRO — not Chief Operating Officer of NHS Trust without CRO remit.', professionalRegistrationRequirement: 'none' }),
    r('Clinical Research Fellow (Academic Trials Unit)', 'academic_research', 'Academic fellow in trials unit designing and delivering investigator-initiated clinical studies.', { priority: 240, eligibilityNote: 'Academic trials fellow — not Biomedical Science Research Fellow in diagnostic labs only.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Research Fellow (Clinical Trials Methodology)', 'academic_research', 'Methodology fellow specialising in trial design, statistics and regulatory science.', { priority: 250, eligibilityNote: 'Trials methodology fellow — not Statistician in non-clinical commercial analytics.', isResearchRole: true, academicRequirement: 'phd_relevant' }),
    r('Professor of Clinical Trials and Methodology', 'academic_research', 'Professor leading clinical trials methodology research and CTU academic programmes.', { priority: 260, eligibilityNote: 'Professor clinical trials — not Professor of Clinical Medicine without trials methodology focus.', isAcademicRole: true, isResearchRole: true, academicRequirement: 'phd_relevant' }),
  ],
}

export const SCIENCE_MGMT_PACKS: SpecialismPack[] = [
  BIOMEDICAL_SCIENCE,
  PUBLIC_HEALTH,
  HEALTHCARE_SCIENCE,
  OPTOMETRY,
  CLINICAL_PSYCHOLOGY,
  HEALTHCARE_MANAGEMENT,
  CLINICAL_RESEARCH,
]

/** Role counts per pack for populate verification. */
export function scienceMgmtPackCounts() {
  return SCIENCE_MGMT_PACKS.map((pack) => {
    const researchRoles = pack.roles.filter((role) => role.isResearchRole).length
    const academicRoles = pack.roles.filter((role) => role.isAcademicRole).length
    return {
      slug: pack.slug,
      total: pack.roles.length,
      researchRoles,
      academicRoles,
      academicResearchStage: pack.roles.filter((r) => r.stageKey === 'academic_research').length,
    }
  })
}
