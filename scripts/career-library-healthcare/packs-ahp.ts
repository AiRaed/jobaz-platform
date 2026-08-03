/**
 * Allied Health Professions (AHP) role packs — HCPC-regulated specialisms.
 * UK NHS progression: pre-registration → HCPC registration → Band 5–7 → advanced/consultant → leadership → academic/research.
 */

import { r, type SpecialismPack } from './shared'

const HCPC = 'Health and Care Professions Council (HCPC)'

const SOURCES = [
  'nhs_healthcareers_allied_health_professions',
  'prospects_healthcare_careers',
  'hcpc_register_standards',
  'nhs_agenda_for_change',
]

const AHP_SLUGS = [
  'physiotherapy',
  'occupational-therapy',
  'radiography',
  'paramedic-science',
  'speech-and-language-therapy',
  'dietetics',
  'orthoptics',
  'prosthetics-orthotics',
] as const

function siblings(self: string): string[] {
  return AHP_SLUGS.filter((s) => s !== self)
}

export const AHP_PACKS: SpecialismPack[] = [
  // -------------------------------------------------------------------------
  // Physiotherapy — CSP
  // -------------------------------------------------------------------------
  {
    slug: 'physiotherapy',
    label: 'Physiotherapy',
    professionalBody: HCPC,
    relatedBodies: ['Chartered Society of Physiotherapy (CSP)'],
    sources: SOURCES,
    siblingSlugs: siblings('physiotherapy'),
    roles: [
      r(
        'Physiotherapy Student (Pre-registration)',
        'qualification',
        'Undertakes an HCPC-approved BSc/MSc physiotherapy programme with clinical placements across musculoskeletal, neurological and cardiorespiratory settings.',
        {
          priority: 10,
          eligibilityNote:
            'Pre-registration student — not HCPC registered. Distinct from Occupational Therapy or other AHP student routes.',
        }
      ),
      r(
        'Physiotherapy Clinical Placement Student',
        'qualification',
        'Supervised placement student delivering assessment and rehabilitation under qualified physiotherapists in NHS Trusts, community or private settings.',
        {
          priority: 20,
          eligibilityNote: 'Placement student on accredited programme — not Band 5 qualified physiotherapist.',
        }
      ),
      r(
        'Physiotherapy Degree Apprentice',
        'qualification',
        'Earns while learning on an HCPC-approved physiotherapy degree apprenticeship combining employment and academic study toward registration.',
        {
          priority: 30,
          eligibilityNote: 'Apprenticeship route — not paramedic or OT apprenticeship titles.',
        }
      ),
      r(
        'Band 5 Physiotherapist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered physiotherapist in preceptorship, typically Band 5 in NHS Agenda for Change, building autonomous caseload management.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required to practise. Newly qualified Band 5 — not senior or specialist physiotherapist.',
        }
      ),
      r(
        'Rotational Physiotherapist (Preceptorship)',
        'registration_licence',
        'Rotates through clinical areas during preceptorship year after HCPC registration, consolidating core assessment and treatment skills.',
        {
          priority: 50,
          eligibilityNote: 'Preceptorship rotation — not occupational therapy or radiography preceptorship.',
        }
      ),
      r(
        'Junior Physiotherapist (HCPC Registered)',
        'registration_licence',
        'Early registered physiotherapist delivering treatment plans under mentorship while completing preceptorship competencies.',
        {
          priority: 60,
          eligibilityNote: 'HCPC registered junior — not dietitian or SLT junior titles.',
        }
      ),
      r(
        'Physiotherapist (Musculoskeletal)',
        'practitioner',
        'Registered physiotherapist managing MSK outpatients, orthopaedic pathways and community musculoskeletal caseloads.',
        {
          priority: 70,
          eligibilityNote: 'MSK practice focus — not MSK occupational therapy or sports therapy unregulated routes.',
        }
      ),
      r(
        'Physiotherapist (Community Rehabilitation)',
        'practitioner',
        'Delivers domiciliary and community rehabilitation for frailty, falls prevention and post-hospital discharge recovery.',
        {
          priority: 80,
          eligibilityNote: 'Community physiotherapy — not community OT or district nursing roles.',
        }
      ),
      r(
        'Band 5 Physiotherapist (Ward-Based Acute)',
        'practitioner',
        'Provides early mobilisation, respiratory physiotherapy and discharge planning on acute hospital wards at Band 5 level.',
        {
          priority: 90,
          eligibilityNote: 'Ward-based Band 5 — not Band 6 senior ward physiotherapist.',
        }
      ),
      r(
        'Senior Physiotherapist (Band 6)',
        'experienced',
        'Experienced Band 6 physiotherapist with greater caseload autonomy, complex patient management and informal mentoring of juniors.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior — typically 2+ years post-registration. Not Band 5 or specialist Band 7.',
        }
      ),
      r(
        'Band 6 Physiotherapist (Outpatients)',
        'experienced',
        'Manages complex outpatient caseloads including post-operative rehabilitation and chronic pain programmes at Band 6.',
        {
          priority: 110,
          eligibilityNote: 'Outpatient Band 6 — not diagnostic radiographer or dietitian outpatient roles.',
        }
      ),
      r(
        'Experienced Physiotherapist (Neurological Rehabilitation)',
        'experienced',
        'Delivers specialist neurological rehabilitation for stroke, spinal injury and acquired brain injury with Band 6-level expertise.',
        {
          priority: 120,
          eligibilityNote: 'Neuro rehab focus — not neuro OT or clinical psychology roles.',
        }
      ),
      r(
        'Band 6 Physiotherapist (Cardiorespiratory)',
        'experienced',
        'Provides advanced cardiorespiratory physiotherapy in critical care, respiratory wards and pulmonary rehabilitation programmes.',
        {
          priority: 130,
          eligibilityNote: 'Cardiorespiratory specialist practice at Band 6 — not Band 7 clinical specialist.',
        }
      ),
      r(
        'Specialist Physiotherapist (Neurology)',
        'specialist',
        'Band 7 or equivalent clinical specialist leading complex neurological caseloads and service development in neuro rehab units.',
        {
          priority: 140,
          eligibilityNote: 'Clinical specialist neurology — not consultant neurologist or nurse specialist.',
        }
      ),
      r(
        'Specialist Physiotherapist (Paediatrics)',
        'specialist',
        'Specialist paediatric physiotherapist managing developmental, neuromuscular and orthopaedic conditions in children and young people.',
        {
          priority: 150,
          eligibilityNote: 'Paediatric physio specialist — not paediatric OT or paediatric SLT.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Physiotherapist',
        'specialist',
        'Band 7 clinical specialist providing expert assessment, advanced interventions and clinical leadership within a defined specialty.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 CSP-defined clinical specialist — not advanced practitioner or consultant physiotherapist.',
        }
      ),
      r(
        'Specialist Physiotherapist (Women\'s Health)',
        'specialist',
        'Specialist in pelvic health, antenatal and postnatal musculoskeletal physiotherapy and urogynaecological rehabilitation.',
        {
          priority: 170,
          eligibilityNote: 'Women\'s health physio — not midwifery or gynaecology nursing roles.',
        }
      ),
      r(
        'Advanced Physiotherapy Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced practitioner managing complex caseloads, prescribing exercise programmes and contributing to service redesign.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced practice credential — not consultant physiotherapist or medical doctor.',
        }
      ),
      r(
        'Consultant Physiotherapist',
        'advanced_practice_consultant',
        'Consultant-level physiotherapist providing expert clinical leadership, complex case management and regional specialty influence.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant practitioner route — not medical consultant or nurse consultant.',
        }
      ),
      r(
        'Extended Scope Physiotherapy Practitioner',
        'advanced_practice_consultant',
        'Practitioner with extended scope skills such as injection therapy or advanced MSK diagnostics within agreed governance frameworks.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope physio — not orthopaedic surgeon or radiologist reporting roles.',
        }
      ),
      r(
        'Lead Physiotherapist',
        'leadership',
        'Clinical lead coordinating physiotherapy teams, rotas, competency frameworks and quality improvement within a service area.',
        {
          priority: 210,
          eligibilityNote: 'Clinical lead — not head of allied health professions or general manager without clinical background.',
        }
      ),
      r(
        'Physiotherapy Service Manager',
        'leadership',
        'Manages physiotherapy service delivery, staffing, budgets and performance across hospital or community settings.',
        {
          priority: 220,
          eligibilityNote: 'Service manager — not occupational therapy or radiography service manager titles.',
        }
      ),
      r(
        'Head of Physiotherapy Services',
        'leadership',
        'Senior leadership of physiotherapy across a Trust or integrated care system, setting strategy and professional standards.',
        {
          priority: 230,
          eligibilityNote: 'Head of service — not director of nursing or medical director roles.',
        }
      ),
      r(
        'Lecturer in Physiotherapy',
        'academic_research',
        'University lecturer teaching pre-registration physiotherapy, supervising placements and contributing to curriculum development.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic teaching role — HCPC registration desirable but academic pathway distinct from clinical Band 7+.',
        }
      ),
      r(
        'Physiotherapy Research Fellow',
        'academic_research',
        'Conducts physiotherapy and rehabilitation research in university or NIHR settings, contributing to evidence-based practice.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'Research fellow — not clinical research nurse or biomedical scientist laboratory roles.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Occupational Therapy — RCOT
  // -------------------------------------------------------------------------
  {
    slug: 'occupational-therapy',
    label: 'Occupational Therapy',
    professionalBody: HCPC,
    relatedBodies: ['Royal College of Occupational Therapists (RCOT)'],
    sources: SOURCES,
    siblingSlugs: siblings('occupational-therapy'),
    roles: [
      r(
        'Occupational Therapy Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc/MSc occupational therapy programme with placements in mental health, physical health and social care.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration OT student — not physiotherapy or paramedic student routes.',
        }
      ),
      r(
        'Occupational Therapy Practice Placement Student',
        'qualification',
        'Supervised placement student applying occupational therapy models of practice in NHS, social care or voluntary sector settings.',
        {
          priority: 20,
          eligibilityNote: 'Placement student — not qualified Band 5 occupational therapist.',
        }
      ),
      r(
        'Occupational Therapy Degree Apprentice',
        'qualification',
        'Combines paid employment with academic study on an HCPC-approved occupational therapy degree apprenticeship.',
        {
          priority: 30,
          eligibilityNote: 'OT apprenticeship — not nursing or physiotherapy apprenticeship titles.',
        }
      ),
      r(
        'Band 5 Occupational Therapist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered occupational therapist in NHS preceptorship, typically Band 5, developing autonomous occupational assessment skills.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required. Newly qualified Band 5 — not senior OT or OT assistant (unregulated).',
        }
      ),
      r(
        'Rotational Occupational Therapist (Preceptorship)',
        'registration_licence',
        'Rotates through mental health, acute and community settings during preceptorship after HCPC registration.',
        {
          priority: 50,
          eligibilityNote: 'OT preceptorship — not physiotherapy rotational preceptorship.',
        }
      ),
      r(
        'Junior Occupational Therapist (HCPC Registered)',
        'registration_licence',
        'Early registered OT delivering intervention plans under mentorship while building professional competency.',
        {
          priority: 60,
          eligibilityNote: 'HCPC registered junior OT — not occupational therapy support worker.',
        }
      ),
      r(
        'Occupational Therapist (Mental Health)',
        'practitioner',
        'Registered OT in mental health teams delivering functional assessment, activity grading and recovery-focused interventions.',
        {
          priority: 70,
          eligibilityNote: 'Mental health OT — not mental health nursing or clinical psychology.',
        }
      ),
      r(
        'Occupational Therapist (Community & Social Care)',
        'practitioner',
        'Supports independence at home through equipment provision, housing adaptations and reablement in community settings.',
        {
          priority: 80,
          eligibilityNote: 'Community OT — not social worker or physiotherapy community roles.',
        }
      ),
      r(
        'Band 5 Occupational Therapist (Acute Hospital)',
        'practitioner',
        'Provides ward-based occupational therapy for discharge planning, functional assessment and early rehabilitation at Band 5.',
        {
          priority: 90,
          eligibilityNote: 'Acute Band 5 OT — not Band 6 senior acute OT.',
        }
      ),
      r(
        'Senior Occupational Therapist (Band 6)',
        'experienced',
        'Experienced Band 6 OT managing complex caseloads, advanced assessments and informal supervision of Band 5 colleagues.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior — typically 2+ years post-registration. Not specialist Band 7.',
        }
      ),
      r(
        'Band 6 Occupational Therapist (Rehabilitation)',
        'experienced',
        'Delivers intensive rehabilitation programmes in neuro, orthopaedic or elderly care settings at Band 6 level.',
        {
          priority: 110,
          eligibilityNote: 'Rehab Band 6 OT — not rehabilitation physiotherapist titles.',
        }
      ),
      r(
        'Experienced Occupational Therapist (Paediatrics)',
        'experienced',
        'Band 6-level paediatric OT supporting developmental milestones, school participation and sensory integration approaches.',
        {
          priority: 120,
          eligibilityNote: 'Paediatric OT experienced — not paediatric physiotherapist or paediatric SLT.',
        }
      ),
      r(
        'Band 6 Occupational Therapist (Learning Disabilities)',
        'experienced',
        'Supports people with learning disabilities to develop daily living skills and community participation at Band 6.',
        {
          priority: 130,
          eligibilityNote: 'Learning disabilities OT — not learning disability nursing roles.',
        }
      ),
      r(
        'Specialist Occupational Therapist (Hand Therapy)',
        'specialist',
        'Band 7 specialist in hand and upper limb rehabilitation following trauma, surgery or repetitive strain conditions.',
        {
          priority: 140,
          eligibilityNote: 'Hand therapy OT specialist — not hand surgeon or physiotherapy hand specialist alone.',
        }
      ),
      r(
        'Specialist Occupational Therapist (Neurorehabilitation)',
        'specialist',
        'Clinical specialist leading neuro OT interventions for stroke, brain injury and progressive neurological conditions.',
        {
          priority: 150,
          eligibilityNote: 'Neuro OT specialist — not neuro physiotherapy or neurology medical roles.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Occupational Therapist',
        'specialist',
        'Band 7 clinical specialist providing expert OT practice, service development and advanced clinical decision-making.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 OT clinical specialist — not advanced practitioner or consultant OT.',
        }
      ),
      r(
        'Specialist Occupational Therapist (Forensic & Secure Services)',
        'specialist',
        'Specialist OT in secure mental health or forensic settings addressing occupational participation and risk management.',
        {
          priority: 170,
          eligibilityNote: 'Forensic OT — not forensic psychology or psychiatric nursing.',
        }
      ),
      r(
        'Advanced Occupational Therapy Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced practitioner delivering complex OT interventions and contributing to multi-disciplinary senior decision-making.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced OT practitioner — not medical advanced clinical practitioner.',
        }
      ),
      r(
        'Consultant Occupational Therapist',
        'advanced_practice_consultant',
        'Consultant-level OT providing regional expert practice, complex case leadership and professional consultancy.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant OT — not medical consultant or nurse consultant.',
        }
      ),
      r(
        'Extended Scope Occupational Therapy Practitioner',
        'advanced_practice_consultant',
        'Practitioner with extended competencies such as advanced seating clinics or specialist splinting services within governance frameworks.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope OT — not prosthetist/orthotist clinical roles.',
        }
      ),
      r(
        'Lead Occupational Therapist',
        'leadership',
        'Clinical lead overseeing OT teams, caseload allocation, competency frameworks and quality standards in a service area.',
        {
          priority: 210,
          eligibilityNote: 'OT clinical lead — not lead physiotherapist or generic AHP lead without OT background.',
        }
      ),
      r(
        'Occupational Therapy Service Manager',
        'leadership',
        'Manages OT service delivery, workforce planning, budgets and performance indicators across NHS or social care.',
        {
          priority: 220,
          eligibilityNote: 'OT service manager — not physiotherapy or dietetics service manager.',
        }
      ),
      r(
        'Head of Occupational Therapy Services',
        'leadership',
        'Senior leadership of occupational therapy across an organisation or ICS, shaping strategy and RCOT-aligned standards.',
        {
          priority: 230,
          eligibilityNote: 'Head of OT services — not director of allied health professions generic title alone.',
        }
      ),
      r(
        'Lecturer in Occupational Therapy',
        'academic_research',
        'University lecturer on pre-registration OT programmes, supervising practice education and academic assessment.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic OT lecturer — distinct from clinical Band 7+ practice roles.',
        }
      ),
      r(
        'Occupational Therapy Research Fellow',
        'academic_research',
        'Conducts OT and occupational science research contributing to rehabilitation and social care evidence bases.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'OT research fellow — not clinical research coordinator or biomedical scientist.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Radiography — SoR (diagnostic AND therapeutic)
  // -------------------------------------------------------------------------
  {
    slug: 'radiography',
    label: 'Radiography',
    professionalBody: HCPC,
    relatedBodies: ['Society of Radiographers (SoR)'],
    sources: SOURCES,
    siblingSlugs: siblings('radiography'),
    roles: [
      r(
        'Diagnostic Radiography Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved diagnostic radiography degree with placements in general X-ray, CT, MRI and imaging departments.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration diagnostic student — not therapeutic radiography student or medical imaging physicist.',
        }
      ),
      r(
        'Therapeutic Radiography Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved therapeutic radiography programme with placements in linear accelerator units and treatment planning.',
        {
          priority: 20,
          eligibilityNote: 'Pre-registration therapeutic student — not diagnostic radiography student route.',
        }
      ),
      r(
        'Radiography Clinical Placement Student',
        'qualification',
        'Supervised placement student in imaging or radiotherapy departments learning patient care, positioning and safety protocols.',
        {
          priority: 30,
          eligibilityNote: 'Generic placement student — not qualified diagnostic or therapeutic radiographer.',
        }
      ),
      r(
        'Band 5 Diagnostic Radiographer (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered diagnostic radiographer in preceptorship, typically Band 5, performing general and projection radiography.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registered diagnostic Band 5 — not therapeutic radiographer or radiologist (medical).',
        }
      ),
      r(
        'Band 5 Therapeutic Radiographer (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered therapeutic radiographer delivering radiotherapy treatments under supervision in preceptorship year.',
        {
          priority: 50,
          eligibilityNote: 'HCPC registered therapeutic Band 5 — not diagnostic radiographer newly qualified.',
        }
      ),
      r(
        'Junior Diagnostic Radiographer (HCPC Registered)',
        'registration_licence',
        'Early registered diagnostic radiographer building competency in imaging protocols and patient care during preceptorship.',
        {
          priority: 60,
          eligibilityNote: 'Junior diagnostic — not junior therapeutic radiographer title.',
        }
      ),
      r(
        'Diagnostic Radiographer (General Imaging)',
        'practitioner',
        'Registered diagnostic radiographer performing X-ray, fluoroscopy and emergency imaging in hospital radiology departments.',
        {
          priority: 70,
          eligibilityNote: 'General imaging diagnostic — not CT/MRI specialist or therapeutic treatment delivery.',
        }
      ),
      r(
        'Therapeutic Radiographer (Treatment Delivery)',
        'practitioner',
        'Registered therapeutic radiographer delivering external beam radiotherapy and managing patient care on treatment units.',
        {
          priority: 80,
          eligibilityNote: 'Treatment delivery therapeutic — not diagnostic imaging or oncology nursing.',
        }
      ),
      r(
        'Band 5 Radiographer (Interventional Support)',
        'practitioner',
        'Supports interventional radiology procedures including scrub, imaging assistance and patient monitoring at Band 5 level.',
        {
          priority: 90,
          eligibilityNote: 'Interventional support Band 5 — not interventional radiologist (medical doctor).',
        }
      ),
      r(
        'Senior Diagnostic Radiographer (Band 6)',
        'experienced',
        'Experienced Band 6 diagnostic radiographer with advanced imaging skills and informal mentoring of Band 5 staff.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 diagnostic senior — not senior therapeutic radiographer.',
        }
      ),
      r(
        'Senior Therapeutic Radiographer (Band 6)',
        'experienced',
        'Experienced Band 6 therapeutic radiographer managing complex treatment schedules and pre-treatment verification.',
        {
          priority: 110,
          eligibilityNote: 'Band 6 therapeutic senior — not senior diagnostic radiographer.',
        }
      ),
      r(
        'Band 6 Diagnostic Radiographer (CT/MRI)',
        'experienced',
        'Performs cross-sectional CT and MRI examinations with protocol optimisation and contrast administration at Band 6.',
        {
          priority: 120,
          eligibilityNote: 'CT/MRI Band 6 diagnostic — not radiographer reporting specialist or medical radiologist.',
        }
      ),
      r(
        'Band 6 Therapeutic Radiographer (Planning)',
        'experienced',
        'Supports and contributes to radiotherapy treatment planning, immobilisation and dosimetry at Band 6 level.',
        {
          priority: 130,
          eligibilityNote: 'Planning Band 6 therapeutic — not medical physics clinical scientist alone.',
        }
      ),
      r(
        'Specialist Diagnostic Radiographer (Ultrasound)',
        'specialist',
        'Band 7 specialist performing and reporting ultrasound examinations within agreed scope of practice.',
        {
          priority: 140,
          eligibilityNote: 'Ultrasound radiographer specialist — not sonographer medical doctor or midwife ultrasound.',
        }
      ),
      r(
        'Specialist Therapeutic Radiographer (Brachytherapy)',
        'specialist',
        'Clinical specialist in brachytherapy delivery and patient care within oncology radiotherapy services.',
        {
          priority: 150,
          eligibilityNote: 'Brachytherapy therapeutic specialist — not brachytherapy physicist or oncologist.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Radiographer (Reporting)',
        'specialist',
        'Band 7 reporting radiographer providing preliminary clinical evaluation of images within governance frameworks.',
        {
          priority: 160,
          eligibilityNote: 'Reporting specialist — not consultant radiologist (medical) or reporting-only without HCPC registration.',
        }
      ),
      r(
        'Specialist Radiographer (Mammography)',
        'specialist',
        'Specialist in breast screening and symptomatic mammography within NHS Breast Screening Programme standards.',
        {
          priority: 170,
          eligibilityNote: 'Mammography specialist — not breast surgeon or breast care nurse.',
        }
      ),
      r(
        'Advanced Practitioner Radiographer (Diagnostic)',
        'advanced_practice_consultant',
        'Masters-level advanced diagnostic practitioner with extended reporting, governance and service development responsibilities.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced diagnostic practitioner — not consultant radiographer (therapeutic) or medical radiologist.',
        }
      ),
      r(
        'Consultant Radiographer (Imaging)',
        'advanced_practice_consultant',
        'Consultant-level diagnostic radiographer providing expert imaging practice leadership and regional specialty influence.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant imaging radiographer — not medical consultant radiologist.',
        }
      ),
      r(
        'Consultant Radiographer (Radiotherapy)',
        'advanced_practice_consultant',
        'Consultant-level therapeutic radiographer leading advanced practice in oncology radiotherapy and treatment pathways.',
        {
          priority: 200,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant radiotherapy radiographer — not clinical oncologist (medical).',
        }
      ),
      r(
        'Lead Diagnostic Radiographer',
        'leadership',
        'Clinical lead for diagnostic imaging teams, protocols, training and quality assurance in a radiology department.',
        {
          priority: 210,
          eligibilityNote: 'Lead diagnostic — not lead therapeutic radiographer or radiology department manager non-clinical.',
        }
      ),
      r(
        'Radiotherapy Service Manager',
        'leadership',
        'Manages radiotherapy service delivery, linac scheduling, staffing and performance in oncology centres.',
        {
          priority: 220,
          eligibilityNote: 'Radiotherapy service manager — not diagnostic radiography service manager.',
        }
      ),
      r(
        'Head of Radiography Services',
        'leadership',
        'Senior leadership spanning diagnostic and/or therapeutic radiography across a Trust or cancer alliance.',
        {
          priority: 230,
          eligibilityNote: 'Head of radiography — not head of medical physics or oncology director alone.',
        }
      ),
      r(
        'Lecturer in Radiography',
        'academic_research',
        'University lecturer teaching diagnostic or therapeutic radiography on HCPC-approved pre-registration programmes.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic radiography lecturer — distinct from clinical Band 7+ radiographer roles.',
        }
      ),
      r(
        'Radiography Research Fellow',
        'academic_research',
        'Conducts imaging or radiotherapy research in university, NIHR or cancer research settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'Radiography research — not medical physicist research or clinical trials coordinator alone.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Paramedic Science — College of Paramedics
  // -------------------------------------------------------------------------
  {
    slug: 'paramedic-science',
    label: 'Paramedic Science',
    professionalBody: HCPC,
    relatedBodies: ['College of Paramedics'],
    sources: SOURCES,
    siblingSlugs: siblings('paramedic-science'),
    roles: [
      r(
        'Paramedic Science Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc paramedic science programme with ambulance service and hospital emergency placements.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration paramedic student — not emergency medical technician (non-degree) or nursing student.',
        }
      ),
      r(
        'Student Paramedic (Ambulance Placement)',
        'qualification',
        'Supervised ambulance placement student responding to emergency calls under qualified paramedic mentorship.',
        {
          priority: 20,
          eligibilityNote: 'Placement student — not HCPC-registered paramedic.',
        }
      ),
      r(
        'Paramedic Degree Apprentice',
        'qualification',
        'Earns while learning on an HCPC-approved paramedic degree apprenticeship with an ambulance trust or employer.',
        {
          priority: 30,
          eligibilityNote: 'Paramedic apprenticeship — not nursing or physiotherapy apprenticeship.',
        }
      ),
      r(
        'Band 5 Paramedic (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered paramedic in preceptorship, typically Band 5, responding to 999 and urgent care calls autonomously.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required. Newly qualified Band 5 — not emergency care assistant or technician.',
        }
      ),
      r(
        'Newly Registered Paramedic (HCPC)',
        'registration_licence',
        'Recently HCPC-registered paramedic completing competency sign-off during first year of autonomous practice.',
        {
          priority: 50,
          eligibilityNote: 'Newly registered paramedic — not newly registered physiotherapist or nurse.',
        }
      ),
      r(
        'Paramedic (Preceptorship Year)',
        'registration_licence',
        'Structured preceptorship paramedic building clinical decision-making, trauma care and patient assessment skills.',
        {
          priority: 60,
          eligibilityNote: 'Paramedic preceptorship — not OT or radiography preceptorship titles.',
        }
      ),
      r(
        'Paramedic (Emergency Ambulance)',
        'practitioner',
        'Registered paramedic on emergency ambulance responding to 999 calls, delivering pre-hospital emergency care.',
        {
          priority: 70,
          eligibilityNote: 'Emergency ambulance paramedic — not HART specialist or urgent care practitioner yet.',
        }
      ),
      r(
        'Paramedic (Urgent Care)',
        'practitioner',
        'Provides urgent and unscheduled care in community settings, GP hubs or urgent treatment centres.',
        {
          priority: 80,
          eligibilityNote: 'Urgent care paramedic — not GP or nurse practitioner roles.',
        }
      ),
      r(
        'Band 5 Paramedic (Community Response)',
        'practitioner',
        'Community response paramedic managing lower acuity calls and supporting ambulance service demand management at Band 5.',
        {
          priority: 90,
          eligibilityNote: 'Community response Band 5 — not Band 6 specialist paramedic.',
        }
      ),
      r(
        'Senior Paramedic (Band 6)',
        'experienced',
        'Experienced Band 6 paramedic with advanced clinical skills, complex case management and mentoring responsibilities.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior — typically 2+ years post-registration. Not Band 5 or specialist Band 7.',
        }
      ),
      r(
        'Band 6 Paramedic (Critical Care)',
        'experienced',
        'Delivers enhanced critical care including advanced airway, cardiac and trauma interventions at Band 6 level.',
        {
          priority: 110,
          eligibilityNote: 'Critical care Band 6 — not HART team lead or consultant paramedic.',
        }
      ),
      r(
        'Experienced Paramedic (Emergency Operations)',
        'experienced',
        'Band 6-level paramedic in emergency operations centres or tactical dispatch supporting complex resource allocation.',
        {
          priority: 120,
          eligibilityNote: 'Emergency ops paramedic — not control room manager without clinical registration.',
        }
      ),
      r(
        'Band 6 Paramedic (Hospital Emergency)',
        'experienced',
        'Works in emergency departments or hospital ambulatory settings bridging pre-hospital and in-hospital care at Band 6.',
        {
          priority: 130,
          eligibilityNote: 'Hospital emergency paramedic — not emergency medicine doctor or ED nurse.',
        }
      ),
      r(
        'Specialist Paramedic (Urgent Care)',
        'specialist',
        'Band 7 specialist managing complex urgent care presentations in community and primary care interfaces.',
        {
          priority: 140,
          eligibilityNote: 'Urgent care specialist paramedic — not GP or advanced nurse practitioner.',
        }
      ),
      r(
        'Specialist Paramedic (Mental Health Crisis)',
        'specialist',
        'Specialist paramedic responding to mental health crises with de-escalation and pathway navigation expertise.',
        {
          priority: 150,
          eligibilityNote: 'Mental health crisis paramedic — not mental health nurse or psychiatrist.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Paramedic',
        'specialist',
        'Band 7 clinical specialist providing expert paramedic practice, education and service development in a defined area.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 clinical specialist paramedic — not advanced paramedic practitioner or consultant paramedic.',
        }
      ),
      r(
        'Specialist Paramedic (HART / Hazardous Area)',
        'specialist',
        'Hazardous Area Response Team specialist paramedic for complex, confined-space and major incident environments.',
        {
          priority: 170,
          eligibilityNote: 'HART specialist — not fire service or police tactical medic without HCPC paramedic registration.',
        }
      ),
      r(
        'Advanced Paramedic Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced paramedic practitioner managing undifferentiated urgent and emergency presentations in community settings.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced paramedic practitioner — not medical advanced clinical practitioner or GP.',
        }
      ),
      r(
        'Consultant Paramedic',
        'advanced_practice_consultant',
        'Consultant-level paramedic providing strategic clinical leadership, complex case oversight and regional service influence.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant paramedic — not medical consultant in emergency medicine.',
        }
      ),
      r(
        'Extended Scope Paramedic Practitioner',
        'advanced_practice_consultant',
        'Paramedic with extended scope competencies such as independent prescribing or advanced diagnostics within governance.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope paramedic — not pharmacist prescriber or physician associate.',
        }
      ),
      r(
        'Lead Paramedic (Operations)',
        'leadership',
        'Clinical lead for operational paramedic teams, competency frameworks, clinical governance and shift coordination.',
        {
          priority: 210,
          eligibilityNote: 'Operations clinical lead — not ambulance trust chief executive without paramedic background.',
        }
      ),
      r(
        'Paramedic Service Manager',
        'leadership',
        'Manages paramedic service delivery, rotas, performance and workforce development in ambulance trusts.',
        {
          priority: 220,
          eligibilityNote: 'Paramedic service manager — not physiotherapy or OT service manager.',
        }
      ),
      r(
        'Head of Paramedic Services',
        'leadership',
        'Senior leadership of paramedic practice across an ambulance trust or integrated urgent and emergency care system.',
        {
          priority: 230,
          eligibilityNote: 'Head of paramedic services — not director of nursing or medical director.',
        }
      ),
      r(
        'Lecturer in Paramedic Science',
        'academic_research',
        'University lecturer on HCPC-approved paramedic science programmes, supervising clinical placements and simulation.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic paramedic lecturer — distinct from operational Band 7+ paramedic roles.',
        }
      ),
      r(
        'Paramedic Science Research Fellow',
        'academic_research',
        'Conducts pre-hospital emergency care and paramedic practice research in university or NIHR settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'Paramedic research fellow — not emergency medicine research registrar (medical).',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Speech and Language Therapy — RCSLT
  // -------------------------------------------------------------------------
  {
    slug: 'speech-and-language-therapy',
    label: 'Speech and Language Therapy',
    professionalBody: HCPC,
    relatedBodies: ['Royal College of Speech and Language Therapists (RCSLT)'],
    sources: SOURCES,
    siblingSlugs: siblings('speech-and-language-therapy'),
    roles: [
      r(
        'Speech and Language Therapy Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc/MSc speech and language therapy programme with placements in NHS, education and community.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration SLT student — not physiotherapy or OT student routes.',
        }
      ),
      r(
        'SLT Clinical Placement Student',
        'qualification',
        'Supervised placement student assessing communication and swallowing disorders under qualified SLT mentorship.',
        {
          priority: 20,
          eligibilityNote: 'SLT placement student — not qualified Band 5 speech and language therapist.',
        }
      ),
      r(
        'Speech and Language Therapy Degree Apprentice',
        'qualification',
        'Combines employment with academic study on an HCPC-approved speech and language therapy degree apprenticeship.',
        {
          priority: 30,
          eligibilityNote: 'SLT apprenticeship — not teacher training or nursing apprenticeship.',
        }
      ),
      r(
        'Band 5 Speech and Language Therapist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered SLT in preceptorship, typically Band 5, developing caseload management for communication and swallowing.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required. Newly qualified Band 5 — not SLT assistant (unregulated).',
        }
      ),
      r(
        'Newly Registered Speech and Language Therapist (HCPC)',
        'registration_licence',
        'Recently HCPC-registered SLT completing competency frameworks during first year of autonomous practice.',
        {
          priority: 50,
          eligibilityNote: 'Newly registered SLT — not newly registered dietitian or physiotherapist.',
        }
      ),
      r(
        'Junior Speech and Language Therapist (Preceptorship)',
        'registration_licence',
        'Early registered SLT delivering therapy plans under mentorship across paediatric or adult caseloads.',
        {
          priority: 60,
          eligibilityNote: 'Junior SLT preceptorship — not teaching assistant or learning support worker.',
        }
      ),
      r(
        'Speech and Language Therapist (Paediatrics)',
        'practitioner',
        'Registered SLT supporting children with speech, language, social communication and developmental disorders.',
        {
          priority: 70,
          eligibilityNote: 'Paediatric SLT — not paediatric physiotherapist or educational psychologist.',
        }
      ),
      r(
        'Speech and Language Therapist (Adults & Acquired Conditions)',
        'practitioner',
        'Manages adult communication and swallowing disorders following stroke, head injury, progressive conditions and ENT surgery.',
        {
          priority: 80,
          eligibilityNote: 'Adult acquired SLT — not adult nursing or geriatric medicine roles.',
        }
      ),
      r(
        'Band 5 Speech and Language Therapist (Community)',
        'practitioner',
        'Community-based Band 5 SLT delivering clinics, home visits and early intervention in primary care interfaces.',
        {
          priority: 90,
          eligibilityNote: 'Community Band 5 SLT — not Band 6 senior community SLT.',
        }
      ),
      r(
        'Senior Speech and Language Therapist (Band 6)',
        'experienced',
        'Experienced Band 6 SLT managing complex caseloads, multidisciplinary working and informal supervision of Band 5 staff.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior SLT — typically 2+ years post-registration. Not specialist Band 7.',
        }
      ),
      r(
        'Band 6 Speech and Language Therapist (Acute/Inpatients)',
        'experienced',
        'Provides acute inpatient SLT for dysphagia screening, communication assessment and tracheostomy management at Band 6.',
        {
          priority: 110,
          eligibilityNote: 'Acute inpatient Band 6 SLT — not acute dietitian or acute OT titles.',
        }
      ),
      r(
        'Experienced Speech and Language Therapist (Neurology)',
        'experienced',
        'Band 6-level SLT specialising in neurogenic communication and swallowing disorders in stroke and neurology units.',
        {
          priority: 120,
          eligibilityNote: 'Neuro SLT experienced — not neuro physiotherapy or neurology medical roles.',
        }
      ),
      r(
        'Band 6 Speech and Language Therapist (Schools & Education)',
        'experienced',
        'Supports pupils with SEN communication needs in schools and local authority education services at Band 6.',
        {
          priority: 130,
          eligibilityNote: 'Education Band 6 SLT — not teacher or SENCO without HCPC SLT registration.',
        }
      ),
      r(
        'Specialist Speech and Language Therapist (Voice Disorders)',
        'specialist',
        'Band 7 specialist in voice assessment and therapy for ENT, performers and occupational voice users.',
        {
          priority: 140,
          eligibilityNote: 'Voice specialist SLT — not ENT surgeon or singing teacher without HCPC registration.',
        }
      ),
      r(
        'Specialist Speech and Language Therapist (Dysphagia)',
        'specialist',
        'Clinical specialist leading complex dysphagia management, videofluoroscopy and tracheostomy weaning programmes.',
        {
          priority: 150,
          eligibilityNote: 'Dysphagia specialist SLT — not dietitian nutrition support or gastroenterologist.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Speech and Language Therapist',
        'specialist',
        'Band 7 clinical specialist providing expert SLT practice, service development and advanced clinical decision-making.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 SLT clinical specialist — not advanced SLT practitioner or consultant SLT.',
        }
      ),
      r(
        'Specialist Speech and Language Therapist (Autism & Social Communication)',
        'specialist',
        'Specialist in autism spectrum conditions, social communication and developmental language disorder interventions.',
        {
          priority: 170,
          eligibilityNote: 'Autism/communication specialist SLT — not clinical psychologist or behavioural analyst alone.',
        }
      ),
      r(
        'Advanced Speech and Language Therapy Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced SLT practitioner managing complex caseloads and contributing to service redesign.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced SLT practitioner — not medical advanced clinical practitioner.',
        }
      ),
      r(
        'Consultant Speech and Language Therapist',
        'advanced_practice_consultant',
        'Consultant-level SLT providing regional expert practice, complex case leadership and professional consultancy.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant SLT — not medical consultant or nurse consultant.',
        }
      ),
      r(
        'Extended Scope Speech and Language Therapy Practitioner',
        'advanced_practice_consultant',
        'SLT with extended competencies such as instrumental swallowing assessment leadership within governance frameworks.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope SLT — not radiologist or gastroenterologist performing procedures.',
        }
      ),
      r(
        'Lead Speech and Language Therapist',
        'leadership',
        'Clinical lead coordinating SLT teams, caseload allocation, competency frameworks and quality improvement.',
        {
          priority: 210,
          eligibilityNote: 'SLT clinical lead — not lead physiotherapist or generic therapy lead without SLT background.',
        }
      ),
      r(
        'Speech and Language Therapy Service Manager',
        'leadership',
        'Manages SLT service delivery, workforce, budgets and performance across NHS, education or integrated settings.',
        {
          priority: 220,
          eligibilityNote: 'SLT service manager — not dietetics or OT service manager.',
        }
      ),
      r(
        'Head of Speech and Language Therapy Services',
        'leadership',
        'Senior leadership of SLT across a Trust, ICS or local authority, setting strategy and RCSLT-aligned standards.',
        {
          priority: 230,
          eligibilityNote: 'Head of SLT services — not director of children\'s services alone.',
        }
      ),
      r(
        'Lecturer in Speech and Language Therapy',
        'academic_research',
        'University lecturer on HCPC-approved SLT programmes, supervising clinical education and academic assessment.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic SLT lecturer — distinct from clinical Band 7+ SLT practice roles.',
        }
      ),
      r(
        'Speech and Language Therapy Research Fellow',
        'academic_research',
        'Conducts communication sciences and SLT intervention research in university or NIHR settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'SLT research fellow — not linguistics academic without clinical SLT context.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Dietetics — BDA
  // -------------------------------------------------------------------------
  {
    slug: 'dietetics',
    label: 'Dietetics',
    professionalBody: HCPC,
    relatedBodies: ['British Dietetic Association (BDA)'],
    sources: SOURCES,
    siblingSlugs: siblings('dietetics'),
    roles: [
      r(
        'Dietetics Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc/MSc dietetics programme with placements in acute, community and public health nutrition.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration dietetics student — not nutritionist (non-regulated) or SLT student.',
        }
      ),
      r(
        'Dietetic Practice Placement Student',
        'qualification',
        'Supervised placement student conducting nutritional assessment and dietetic interventions under qualified dietitian mentorship.',
        {
          priority: 20,
          eligibilityNote: 'Dietetic placement student — not qualified Band 5 dietitian.',
        }
      ),
      r(
        'Dietetics Degree Apprentice',
        'qualification',
        'Combines employment with academic study on an HCPC-approved dietetics degree apprenticeship.',
        {
          priority: 30,
          eligibilityNote: 'Dietetics apprenticeship — not nursing or physiotherapy apprenticeship.',
        }
      ),
      r(
        'Band 5 Dietitian (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered dietitian in preceptorship, typically Band 5, developing nutritional assessment and care planning.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required. Newly qualified Band 5 — not nutritionist or dietetic assistant.',
        }
      ),
      r(
        'Newly Registered Dietitian (HCPC)',
        'registration_licence',
        'Recently HCPC-registered dietitian completing competency sign-off during first year of autonomous practice.',
        {
          priority: 50,
          eligibilityNote: 'Newly registered dietitian — not newly registered SLT or physiotherapist.',
        }
      ),
      r(
        'Junior Dietitian (Preceptorship)',
        'registration_licence',
        'Early registered dietitian delivering nutritional care plans under mentorship in hospital or community settings.',
        {
          priority: 60,
          eligibilityNote: 'Junior dietitian preceptorship — not healthcare assistant or food service roles.',
        }
      ),
      r(
        'Dietitian (Acute Hospital Wards)',
        'practitioner',
        'Registered dietitian providing ward-based nutritional assessment, enteral feeding and malnutrition management.',
        {
          priority: 70,
          eligibilityNote: 'Acute ward dietitian — not acute SLT dysphagia specialist or ward nurse.',
        }
      ),
      r(
        'Dietitian (Community & Primary Care)',
        'practitioner',
        'Community dietitian supporting long-term conditions, weight management and primary care nutritional interventions.',
        {
          priority: 80,
          eligibilityNote: 'Community dietitian — not public health nutritionist (non-HCPC) roles.',
        }
      ),
      r(
        'Band 5 Dietitian (Outpatients)',
        'practitioner',
        'Outpatient clinic dietitian at Band 5 managing referrals for diabetes, weight and gastrointestinal conditions.',
        {
          priority: 90,
          eligibilityNote: 'Outpatient Band 5 dietitian — not Band 6 senior outpatient dietitian.',
        }
      ),
      r(
        'Senior Dietitian (Band 6)',
        'experienced',
        'Experienced Band 6 dietitian managing complex caseloads, nutrition support and informal mentoring of Band 5 staff.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior dietitian — typically 2+ years post-registration. Not specialist Band 7.',
        }
      ),
      r(
        'Band 6 Dietitian (Diabetes)',
        'experienced',
        'Specialist interest Band 6 dietitian in diabetes management, structured education and insulin adjustment support.',
        {
          priority: 110,
          eligibilityNote: 'Diabetes Band 6 dietitian — not diabetes specialist nurse or endocrinologist.',
        }
      ),
      r(
        'Experienced Dietitian (Renal & Nutrition Support)',
        'experienced',
        'Band 6-level dietitian in renal nutrition, parenteral nutrition and critical care nutrition support teams.',
        {
          priority: 120,
          eligibilityNote: 'Renal/nutrition support dietitian — not renal nurse or intensivist.',
        }
      ),
      r(
        'Band 6 Dietitian (Public Health Nutrition)',
        'experienced',
        'Delivers population-level nutrition programmes, health improvement initiatives and policy implementation at Band 6.',
        {
          priority: 130,
          eligibilityNote: 'Public health dietitian Band 6 — not public health registrar (medical) or nutritionist.',
        }
      ),
      r(
        'Specialist Dietitian (Oncology)',
        'specialist',
        'Band 7 specialist in oncology nutrition, managing cachexia, treatment side effects and palliative nutritional care.',
        {
          priority: 140,
          eligibilityNote: 'Oncology dietitian specialist — not clinical oncologist or oncology nurse specialist.',
        }
      ),
      r(
        'Specialist Dietitian (Paediatrics)',
        'specialist',
        'Clinical specialist in paediatric nutrition including faltering growth, allergy, enteral feeding and metabolic conditions.',
        {
          priority: 150,
          eligibilityNote: 'Paediatric dietitian specialist — not paediatrician or paediatric nurse.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Dietitian',
        'specialist',
        'Band 7 clinical specialist providing expert dietetic practice, service development and advanced clinical decision-making.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 dietitian clinical specialist — not advanced dietetic practitioner or consultant dietitian.',
        }
      ),
      r(
        'Specialist Dietitian (Gastroenterology & IBD)',
        'specialist',
        'Specialist in gastrointestinal nutrition, inflammatory bowel disease, coeliac disease and intestinal failure.',
        {
          priority: 170,
          eligibilityNote: 'Gastro dietitian specialist — not gastroenterologist or colorectal surgeon.',
        }
      ),
      r(
        'Advanced Dietetic Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced dietitian practitioner managing complex nutritional care and service redesign.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced dietetic practitioner — not medical advanced clinical practitioner.',
        }
      ),
      r(
        'Consultant Dietitian',
        'advanced_practice_consultant',
        'Consultant-level dietitian providing regional expert practice, complex case leadership and professional consultancy.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant dietitian — not medical consultant or nurse consultant.',
        }
      ),
      r(
        'Extended Scope Dietetic Practitioner',
        'advanced_practice_consultant',
        'Dietitian with extended scope such as non-medical prescribing or advanced enteral/parenteral nutrition governance.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope dietitian — not pharmacist prescriber or gastroenterologist.',
        }
      ),
      r(
        'Lead Dietitian',
        'leadership',
        'Clinical lead coordinating dietetic teams, caseload allocation, competency frameworks and audit in a service area.',
        {
          priority: 210,
          eligibilityNote: 'Dietitian clinical lead — not lead SLT or lead physiotherapist.',
        }
      ),
      r(
        'Dietetics Service Manager',
        'leadership',
        'Manages dietetic service delivery, workforce, budgets and performance across hospital or community nutrition services.',
        {
          priority: 220,
          eligibilityNote: 'Dietetics service manager — not catering manager or food service director.',
        }
      ),
      r(
        'Head of Dietetics Services',
        'leadership',
        'Senior leadership of dietetics across a Trust or ICS, setting nutrition strategy and BDA-aligned professional standards.',
        {
          priority: 230,
          eligibilityNote: 'Head of dietetics — not director of public health alone.',
        }
      ),
      r(
        'Lecturer in Dietetics',
        'academic_research',
        'University lecturer on HCPC-approved dietetics programmes, supervising practice education and academic assessment.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic dietetics lecturer — distinct from clinical Band 7+ dietitian roles.',
        }
      ),
      r(
        'Dietetics Research Fellow',
        'academic_research',
        'Conducts nutritional sciences and dietetic intervention research in university or NIHR settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'Dietetics research fellow — not food science academic without clinical dietetics context.',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Orthoptics — BIOS
  // -------------------------------------------------------------------------
  {
    slug: 'orthoptics',
    label: 'Orthoptics',
    professionalBody: HCPC,
    relatedBodies: ['British and Irish Orthoptic Society (BIOS)'],
    sources: SOURCES,
    siblingSlugs: siblings('orthoptics'),
    roles: [
      r(
        'Orthoptics Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc orthoptics programme with placements in hospital eye clinics and community vision services.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration orthoptics student — not optometry (GOC) or ophthalmology medical student.',
        }
      ),
      r(
        'Orthoptic Clinical Placement Student',
        'qualification',
        'Supervised placement student assessing eye movement, binocular vision and visual development under orthoptist mentorship.',
        {
          priority: 20,
          eligibilityNote: 'Orthoptic placement student — not qualified Band 5 orthoptist.',
        }
      ),
      r(
        'Orthoptics Degree Apprentice',
        'qualification',
        'Combines employment with academic study on an HCPC-approved orthoptics degree apprenticeship where available.',
        {
          priority: 30,
          eligibilityNote: 'Orthoptics apprenticeship — not optometry apprenticeship (GOC regulated).',
        }
      ),
      r(
        'Band 5 Orthoptist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered orthoptist in preceptorship, typically Band 5, performing orthoptic assessment in eye clinics.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registration required. Newly qualified Band 5 — not optometrist (GOC) or ophthalmic nurse.',
        }
      ),
      r(
        'Newly Registered Orthoptist (HCPC)',
        'registration_licence',
        'Recently HCPC-registered orthoptist completing competency sign-off during first year of autonomous practice.',
        {
          priority: 50,
          eligibilityNote: 'Newly registered orthoptist — not newly registered optometrist or physiotherapist.',
        }
      ),
      r(
        'Junior Orthoptist (Preceptorship)',
        'registration_licence',
        'Early registered orthoptist delivering assessment and treatment plans under mentorship in ophthalmology departments.',
        {
          priority: 60,
          eligibilityNote: 'Junior orthoptist preceptorship — not ophthalmic technician without HCPC registration.',
        }
      ),
      r(
        'Orthoptist (Outpatient Eye Clinics)',
        'practitioner',
        'Registered orthoptist in hospital outpatient clinics assessing strabismus, diplopia and binocular vision disorders.',
        {
          priority: 70,
          eligibilityNote: 'Outpatient orthoptist — not optometrist refraction or ophthalmologist medical roles.',
        }
      ),
      r(
        'Orthoptist (Paediatric Eye Care)',
        'practitioner',
        'Paediatric orthoptist assessing amblyopia, squint and visual development in children\'s eye services.',
        {
          priority: 80,
          eligibilityNote: 'Paediatric orthoptist — not paediatric ophthalmologist or paediatric optometrist.',
        }
      ),
      r(
        'Band 5 Orthoptist (Hospital Ophthalmology)',
        'practitioner',
        'Ward and clinic-based Band 5 orthoptist supporting pre- and post-operative ophthalmology pathways.',
        {
          priority: 90,
          eligibilityNote: 'Hospital Band 5 orthoptist — not Band 6 senior orthoptist.',
        }
      ),
      r(
        'Senior Orthoptist (Band 6)',
        'experienced',
        'Experienced Band 6 orthoptist managing complex caseloads, advanced assessments and informal mentoring of Band 5 staff.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior orthoptist — typically 2+ years post-registration. Not specialist Band 7.',
        }
      ),
      r(
        'Band 6 Orthoptist (Specialist Eye Clinics)',
        'experienced',
        'Works in specialist clinics including neuro-ophthalmology, thyroid eye disease and complex strabismus at Band 6.',
        {
          priority: 110,
          eligibilityNote: 'Specialist clinic Band 6 orthoptist — not neuro-ophthalmologist (medical).',
        }
      ),
      r(
        'Experienced Orthoptist (Neuro-Ophthalmology)',
        'experienced',
        'Band 6-level orthoptist in neuro-ophthalmology assessing ocular motility in neurological conditions.',
        {
          priority: 120,
          eligibilityNote: 'Neuro-ophthalmology orthoptist — not neurologist or neuro physiotherapist.',
        }
      ),
      r(
        'Band 6 Orthoptist (Community Vision Screening)',
        'experienced',
        'Delivers school vision screening, community orthoptic clinics and referral pathways at Band 6 level.',
        {
          priority: 130,
          eligibilityNote: 'Community vision Band 6 — not health visitor or school nurse vision screening alone.',
        }
      ),
      r(
        'Specialist Orthoptist (Strabismus Surgery Support)',
        'specialist',
        'Band 7 specialist supporting strabismus surgical pathways with pre- and post-operative orthoptic assessment.',
        {
          priority: 140,
          eligibilityNote: 'Strabismus specialist orthoptist — not ophthalmic surgeon performing surgery.',
        }
      ),
      r(
        'Specialist Orthoptist (Low Vision Rehabilitation)',
        'specialist',
        'Clinical specialist in low vision assessment, eccentric viewing training and visual aid recommendations.',
        {
          priority: 150,
          eligibilityNote: 'Low vision orthoptist specialist — not rehabilitation officer visual impairment (non-HCPC).',
        }
      ),
      r(
        'Band 7 Clinical Specialist Orthoptist',
        'specialist',
        'Band 7 clinical specialist providing expert orthoptic practice, service development and advanced clinical decision-making.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 orthoptist clinical specialist — not advanced orthoptic practitioner or consultant orthoptist.',
        }
      ),
      r(
        'Specialist Orthoptist (Visual Development & Amblyopia)',
        'specialist',
        'Specialist in paediatric visual development, amblyopia treatment programmes and early years vision pathways.',
        {
          priority: 170,
          eligibilityNote: 'Visual development specialist — not paediatrician or educational psychologist.',
        }
      ),
      r(
        'Advanced Orthoptic Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced orthoptist practitioner managing complex caseloads and contributing to ophthalmology MDT leadership.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced orthoptic practitioner — not medical ophthalmologist or optometrist with additional qualifications.',
        }
      ),
      r(
        'Consultant Orthoptist',
        'advanced_practice_consultant',
        'Consultant-level orthoptist providing regional expert practice, complex case leadership and professional consultancy.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant orthoptist — not consultant ophthalmologist (medical).',
        }
      ),
      r(
        'Extended Scope Orthoptic Practitioner',
        'advanced_practice_consultant',
        'Orthoptist with extended scope such as independent running of specialist clinics within agreed governance frameworks.',
        {
          priority: 200,
          eligibilityNote: 'Extended scope orthoptist — not orthoptist/optometrist dual registration unless separately GOC registered.',
        }
      ),
      r(
        'Lead Orthoptist',
        'leadership',
        'Clinical lead coordinating orthoptic teams, clinic schedules, competency frameworks and quality standards.',
        {
          priority: 210,
          eligibilityNote: 'Orthoptist clinical lead — not ophthalmology department manager without orthoptic background.',
        }
      ),
      r(
        'Orthoptics Service Manager',
        'leadership',
        'Manages orthoptic service delivery, workforce, budgets and performance in hospital eye departments.',
        {
          priority: 220,
          eligibilityNote: 'Orthoptics service manager — not optometry practice manager (high street retail).',
        }
      ),
      r(
        'Head of Orthoptic Services',
        'leadership',
        'Senior leadership of orthoptics across a Trust or eye care network, setting strategy and BIOS-aligned standards.',
        {
          priority: 230,
          eligibilityNote: 'Head of orthoptic services — not clinical director of ophthalmology (medical) alone.',
        }
      ),
      r(
        'Lecturer in Orthoptics',
        'academic_research',
        'University lecturer on HCPC-approved orthoptics programmes, supervising clinical education and academic assessment.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic orthoptics lecturer — distinct from clinical Band 7+ orthoptist roles.',
        }
      ),
      r(
        'Orthoptics Research Fellow',
        'academic_research',
        'Conducts vision science and orthoptic intervention research in university or NIHR ophthalmology settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'Orthoptics research fellow — not ophthalmology research registrar (medical).',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Prosthetics & Orthotics — BAPO
  // -------------------------------------------------------------------------
  {
    slug: 'prosthetics-orthotics',
    label: 'Prosthetics & Orthotics',
    professionalBody: HCPC,
    relatedBodies: ['British Association of Prosthetists and Orthotists (BAPO)'],
    sources: SOURCES,
    siblingSlugs: siblings('prosthetics-orthotics'),
    roles: [
      r(
        'Prosthetics & Orthotics Student (Pre-registration)',
        'qualification',
        'Studies on an HCPC-approved BSc prosthetics and orthotics programme with placements in NHS limb centres and orthotic workshops.',
        {
          priority: 10,
          eligibilityNote: 'Pre-registration P&O student — not biomedical engineering or physiotherapy student routes.',
        }
      ),
      r(
        'Prosthetics & Orthotics Clinical Placement Student',
        'qualification',
        'Supervised placement student fabricating and fitting devices under prosthetist/orthotist mentorship in limb fitting centres.',
        {
          priority: 20,
          eligibilityNote: 'P&O placement student — not qualified Band 5 prosthetist or orthotist.',
        }
      ),
      r(
        'Prosthetics & Orthotics Degree Apprentice',
        'qualification',
        'Combines employment with academic study on an HCPC-approved prosthetics and orthotics degree apprenticeship.',
        {
          priority: 30,
          eligibilityNote: 'P&O apprenticeship — not engineering apprenticeship or OT apprenticeship.',
        }
      ),
      r(
        'Band 5 Prosthetist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered prosthetist in preceptorship, typically Band 5, fitting prostheses in NHS limb fitting centres.',
        {
          priority: 40,
          eligibilityNote: 'HCPC registered prosthetist Band 5 — not orthotist newly qualified or prosthetic technician (non-regulated).',
        }
      ),
      r(
        'Band 5 Orthotist (Newly Qualified)',
        'registration_licence',
        'Newly HCPC-registered orthotist in preceptorship, typically Band 5, assessing and supplying orthoses in NHS services.',
        {
          priority: 50,
          eligibilityNote: 'HCPC registered orthotist Band 5 — not prosthetist newly qualified or shoe fitter roles.',
        }
      ),
      r(
        'Junior Prosthetist/Orthotist (HCPC Registered)',
        'registration_licence',
        'Early registered P&O clinician completing competency frameworks during first year of device provision practice.',
        {
          priority: 60,
          eligibilityNote: 'Junior P&O dual title — not separate junior prosthetist and junior orthotist duplicate entries.',
        }
      ),
      r(
        'Prosthetist (Lower Limb)',
        'practitioner',
        'Registered prosthetist specialising in lower limb prostheses for amputees in NHS limb centres and rehabilitation settings.',
        {
          priority: 70,
          eligibilityNote: 'Lower limb prosthetist — not orthotist or rehabilitation engineer without HCPC P&O registration.',
        }
      ),
      r(
        'Orthotist (Upper Limb & Spinal)',
        'practitioner',
        'Registered orthotist providing upper limb splints, spinal braces and postural orthoses in hospital and community settings.',
        {
          priority: 80,
          eligibilityNote: 'Upper limb/spinal orthotist — not prosthetist lower limb or OT splinting without HCPC orthotist registration.',
        }
      ),
      r(
        'Band 5 Prosthetist/Orthotist (NHS Limb Centre)',
        'practitioner',
        'Band 5 P&O clinician in NHS limb fitting centre delivering assessment, casting, fabrication and fitting.',
        {
          priority: 90,
          eligibilityNote: 'Limb centre Band 5 — not Band 6 senior prosthetist/orthotist.',
        }
      ),
      r(
        'Senior Prosthetist (Band 6)',
        'experienced',
        'Experienced Band 6 prosthetist managing complex amputee caseloads, advanced socket designs and mentoring Band 5 staff.',
        {
          priority: 100,
          eligibilityNote: 'Band 6 senior prosthetist — not senior orthotist or biomedical engineer.',
        }
      ),
      r(
        'Senior Orthotist (Band 6)',
        'experienced',
        'Experienced Band 6 orthotist managing complex orthotic prescriptions, gait analysis and informal supervision.',
        {
          priority: 110,
          eligibilityNote: 'Band 6 senior orthotist — not senior prosthetist.',
        }
      ),
      r(
        'Band 6 Prosthetist/Orthotist (Rehabilitation)',
        'experienced',
        'Band 6 P&O clinician in multidisciplinary rehabilitation teams supporting amputee and neuromuscular pathways.',
        {
          priority: 120,
          eligibilityNote: 'Rehab Band 6 P&O — not rehabilitation physiotherapist or OT titles.',
        }
      ),
      r(
        'Experienced Orthotist (Diabetic Foot & Podiatry Interface)',
        'experienced',
        'Band 6-level orthotist specialising in diabetic foot orthoses, offloading and footwear prescription at podiatry interface.',
        {
          priority: 130,
          eligibilityNote: 'Diabetic foot orthotist — not podiatrist/chiropodist (different regulator for podiatry HCPC route).',
        }
      ),
      r(
        'Specialist Prosthetist (Amputee Rehabilitation)',
        'specialist',
        'Band 7 specialist prosthetist in complex amputee rehabilitation including trauma, military and congenital limb deficiency.',
        {
          priority: 140,
          eligibilityNote: 'Amputee rehab specialist prosthetist — not vascular surgeon or rehab physician.',
        }
      ),
      r(
        'Specialist Orthotist (Paediatrics)',
        'specialist',
        'Clinical specialist in paediatric orthoses for cerebral palsy, scoliosis and developmental conditions.',
        {
          priority: 150,
          eligibilityNote: 'Paediatric orthotist specialist — not paediatric physiotherapist or paediatric orthopaedic surgeon.',
        }
      ),
      r(
        'Band 7 Clinical Specialist Prosthetist/Orthotist',
        'specialist',
        'Band 7 clinical specialist providing expert P&O practice, service development and advanced clinical decision-making.',
        {
          priority: 160,
          eligibilityNote: 'Band 7 P&O clinical specialist — not advanced P&O practitioner or consultant prosthetist alone.',
        }
      ),
      r(
        'Specialist Prosthetist (Sports & Recreation Limbs)',
        'specialist',
        'Specialist in sports and activity-specific prostheses for athletes and active amputees including blade and recreational limbs.',
        {
          priority: 170,
          eligibilityNote: 'Sports prosthetist specialist — not sports therapist or strength coach.',
        }
      ),
      r(
        'Advanced Prosthetics & Orthotics Practitioner',
        'advanced_practice_consultant',
        'Masters-level advanced P&O practitioner managing complex device provision and contributing to service redesign.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Advanced P&O practitioner — not biomedical engineering consultant alone.',
        }
      ),
      r(
        'Consultant Prosthetist',
        'advanced_practice_consultant',
        'Consultant-level prosthetist providing regional expert practice, complex case leadership and professional consultancy.',
        {
          priority: 190,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant prosthetist — not consultant rehabilitation physician (medical).',
        }
      ),
      r(
        'Consultant Orthotist',
        'advanced_practice_consultant',
        'Consultant-level orthotist leading advanced orthotic practice, complex spinal and neuromuscular device pathways.',
        {
          priority: 200,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Consultant orthotist — not consultant orthopaedic surgeon (medical).',
        }
      ),
      r(
        'Lead Prosthetist/Orthotist',
        'leadership',
        'Clinical lead coordinating P&O teams, workshop standards, competency frameworks and quality improvement.',
        {
          priority: 210,
          eligibilityNote: 'P&O clinical lead — not limb centre general manager without clinical registration.',
        }
      ),
      r(
        'Prosthetics & Orthotics Service Manager',
        'leadership',
        'Manages P&O service delivery, workshop operations, staffing and budgets in NHS limb centres or private providers.',
        {
          priority: 220,
          eligibilityNote: 'P&O service manager — not physiotherapy or OT service manager.',
        }
      ),
      r(
        'Head of Prosthetics & Orthotics Services',
        'leadership',
        'Senior leadership of prosthetics and orthotics across a Trust or regional limb service network.',
        {
          priority: 230,
          eligibilityNote: 'Head of P&O services — not director of rehabilitation without P&O clinical background.',
        }
      ),
      r(
        'Lecturer in Prosthetics & Orthotics',
        'academic_research',
        'University lecturer on HCPC-approved P&O programmes, supervising clinical education and workshop teaching.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Academic P&O lecturer — distinct from clinical Band 7+ prosthetist/orthotist roles.',
        }
      ),
      r(
        'Prosthetics & Orthotics Research Fellow',
        'academic_research',
        'Conducts biomechanics, materials and device innovation research in university or NIHR rehabilitation settings.',
        {
          priority: 250,
          isResearchRole: true,
          eligibilityNote: 'P&O research fellow — not biomedical engineering research without clinical P&O context.',
        }
      ),
    ],
  },
]

/** Per-pack and total role counts for validation. */
export const AHP_PACK_COUNTS = AHP_PACKS.map((p) => ({
  slug: p.slug,
  label: p.label,
  roles: p.roles.length,
  byStage: Object.fromEntries(
    (
      [
        'qualification',
        'registration_licence',
        'practitioner',
        'experienced',
        'specialist',
        'advanced_practice_consultant',
        'leadership',
        'academic_research',
      ] as const
    ).map((stage) => [stage, p.roles.filter((role) => role.stageKey === stage).length])
  ),
}))

export const AHP_TOTAL_ROLES = AHP_PACKS.reduce((n, p) => n + p.roles.length, 0)
