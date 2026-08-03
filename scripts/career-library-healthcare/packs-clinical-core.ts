/**
 * Healthcare role packs for Medicine, Nursing, Pharmacy, Dentistry and Midwifery
 * using healthcare_professional_route stage keys.
 */

import { r, type SpecialismPack } from './shared'

const CORE_SLUGS = ['medicine', 'nursing', 'pharmacy', 'dentistry', 'midwifery'] as const

function siblings(self: string): string[] {
  return CORE_SLUGS.filter((s) => s !== self)
}

const NHS_SOURCES = ['nhs_jobs', 'hee_foundation'] as const

export const CLINICAL_CORE_PACKS: SpecialismPack[] = [
  // -------------------------------------------------------------------------
  // Medicine — GMC
  // -------------------------------------------------------------------------
  {
    slug: 'medicine',
    label: 'Medicine',
    professionalBody: 'General Medical Council (GMC)',
    relatedBodies: ['NHS England', 'Health Education England', 'Royal Colleges'],
    sources: [
      ...NHS_SOURCES,
      'prospects_doctor',
      'gmc_careers',
      'hee_foundation',
    ],
    siblingSlugs: siblings('medicine'),
    roles: [
      r(
        'Medical Student',
        'qualification',
        'Undergraduate medical degree with clinical placements; not yet GMC-registered to practise independently.',
        {
          priority: 10,
          eligibilityNote:
            'Medicine qualification stage — not Nursing, Pharmacy, Dentistry or Midwifery student routes.',
        }
      ),
      r(
        'Graduate Entry Medical Student',
        'qualification',
        'Accelerated medical degree for graduates; clinical training toward GMC registration eligibility.',
        {
          priority: 20,
          eligibilityNote: 'Graduate-entry medicine — distinct from standard undergraduate medical student.',
        }
      ),
      r(
        'Foundation Year 1 Doctor (FY1)',
        'registration_licence',
        'First post-qualification foundation year in NHS hospital rotations under supervision with provisional/full GMC registration.',
        {
          priority: 30,
          eligibilityNote:
            'FY1 medicine — GMC registration required; not FY-equivalent in other regulated professions.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Foundation Year 2 Doctor (FY2)',
        'registration_licence',
        'Second foundation year building broader clinical responsibility before core or GP training applications.',
        {
          priority: 40,
          eligibilityNote: 'FY2 medicine — foundation programme completion; not dental or pharmacy foundation roles.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Core Trainee Doctor',
        'practitioner',
        'Post-foundation trainee in core medical or surgical training pathways within NHS trust settings.',
        {
          priority: 50,
          eligibilityNote: 'Core medical/surgical trainee — not GP trainee or specialty registrar yet.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Trust Doctor',
        'practitioner',
        'Trust-employed junior doctor delivering ward, clinic or emergency care under consultant supervision.',
        {
          priority: 60,
          eligibilityNote: 'Trust-grade junior doctor — medicine only; not Trust Nurse or equivalent.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Junior Clinical Fellow',
        'practitioner',
        'Fixed-term junior doctor post gaining subspecialty exposure before higher training appointment.',
        {
          priority: 70,
          eligibilityNote: 'Junior clinical fellow (medicine) — not senior clinical fellow or nursing fellow roles.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Staff Grade Doctor',
        'experienced',
        'Experienced non-training doctor providing autonomous clinical cover in hospital or community settings.',
        {
          priority: 80,
          eligibilityNote: 'Staff grade medicine — experienced doctor band; not Staff Nurse or Staff Pharmacist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialty Trainee (Core)',
        'experienced',
        'Core specialty training (e.g. ST1–ST3 equivalent) building competence toward MRCP/MRCS and registrar progression.',
        {
          priority: 90,
          eligibilityNote: 'Core specialty trainee doctor — pre-registrar phase of medical specialty training.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Teaching Fellow',
        'experienced',
        'Experienced doctor combining clinical sessions with undergraduate or postgraduate medical teaching.',
        {
          priority: 100,
          eligibilityNote:
            'Clinical teaching fellow (medicine) — teaching-focused; not Clinical Lecturer academic appointment.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'SAS Doctor (Specialty Doctor)',
        'experienced',
        'Specialty and Associate Specialist doctor providing senior non-consultant hospital care with GMC registration.',
        {
          priority: 110,
          eligibilityNote: 'SAS doctor — experienced medicine route; not SAS Consultant or nurse consultant.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialty Registrar',
        'specialist',
        'Higher specialty training registrar (ST4+) progressing toward CCT and consultant eligibility.',
        {
          priority: 120,
          eligibilityNote:
            'Medical specialty registrar — hospital specialty training; maps to specialist stage not consultant.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'GP Trainee',
        'specialist',
        'GP specialty training (ST1–ST3) combining placements in general practice and hospital posts.',
        {
          priority: 130,
          eligibilityNote: 'GP trainee doctor — specialty training route; not qualified GP/consultant yet.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Higher Specialty Trainee',
        'specialist',
        'Advanced hospital specialty trainee in subspecialty rotations before completion of training programme.',
        {
          priority: 140,
          eligibilityNote: 'Higher specialty trainee — medicine subspecialty training; not GP trainee.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Oncology Trainee',
        'specialist',
        'Specialty trainee in clinical oncology combining systemic therapy, radiotherapy planning and MDT care.',
        {
          priority: 150,
          eligibilityNote: 'Oncology specialty trainee — medicine; not Oncology Pharmacist or therapy radiographer.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant Physician',
        'advanced_practice_consultant',
        'GMC-registered consultant providing specialist medical diagnosis, treatment and MDT leadership in hospital or community.',
        {
          priority: 160,
          eligibilityNote:
            'Consultant physician — advanced practice/consultant stage; CCT and GMC specialist registration expected.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant Surgeon',
        'advanced_practice_consultant',
        'Consultant surgeon leading operative and perioperative care with full GMC specialist registration.',
        {
          priority: 170,
          eligibilityNote: 'Consultant surgeon — protected consultant title; not specialty registrar or SAS doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'General Practitioner (GP)',
        'advanced_practice_consultant',
        'Independent GP partner or salaried GP providing primary care, prescribing and referral in NHS or private practice.',
        {
          priority: 180,
          eligibilityNote:
            'Qualified GP — consultant-equivalent primary care; not GP Trainee or GP Practice Pharmacist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'SAS Consultant',
        'advanced_practice_consultant',
        'Senior SAS consultant-grade doctor providing consultant-level care without traditional CCT pathway.',
        {
          priority: 190,
          eligibilityNote: 'SAS consultant — advanced medicine; distinct from Consultant Physician/Surgeon CCT route.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Locum Consultant',
        'advanced_practice_consultant',
        'Locum consultant sessions across NHS trusts or private providers; full GMC specialist registration required.',
        {
          priority: 200,
          eligibilityNote: 'Locum consultant (medicine) — temporary consultant cover; not locum pharmacist or dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Director',
        'leadership',
        'Senior doctor leading clinical service delivery, governance and quality for a directorate or care group.',
        {
          priority: 210,
          eligibilityNote:
            'Clinical director (medicine-led) — service leadership; not Clinical Lead Dentist or nurse ward manager.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Medical Director',
        'leadership',
        'Executive medical leader accountable for clinical governance, patient safety and medical workforce across an organisation.',
        {
          priority: 220,
          eligibilityNote: 'Medical director — executive medicine leadership; not Director of Nursing or Midwifery.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Associate Medical Director',
        'leadership',
        'Deputy medical director supporting governance, policy and clinical strategy at trust or ICS level.',
        {
          priority: 230,
          eligibilityNote: 'Associate medical director — medicine executive track; not associate dentist or pharmacist.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Clinical Lecturer',
        'academic_research',
        'University clinical lecturer combining honorary NHS clinical sessions with undergraduate or postgraduate teaching.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Clinical lecturer (medicine) — academic appointment; not Nurse Educator or Midwifery Educator.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Clinical Research Fellow',
        'academic_research',
        'Doctor undertaking structured clinical research within NHS or university settings, often toward higher degree.',
        {
          priority: 250,
          isResearchRole: true,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Clinical research fellow (medicine) — research focus; not Clinical Teaching Fellow service role.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Clinical Academic',
        'academic_research',
        'Dual NHS and university appointment combining consultant-level practice with research and teaching leadership.',
        {
          priority: 260,
          isAcademicRole: true,
          isResearchRole: true,
          academicRequirement: 'phd_relevant',
          eligibilityNote:
            'Clinical academic (medicine) — genuine academic track; PhD or equivalent research profile typically expected.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Nursing — NMC
  // -------------------------------------------------------------------------
  {
    slug: 'nursing',
    label: 'Nursing',
    professionalBody: 'Nursing and Midwifery Council (NMC)',
    relatedBodies: ['NHS England', 'Royal College of Nursing'],
    sources: [...NHS_SOURCES, 'prospects_nurse', 'nmc_careers', 'nmc_standards'],
    siblingSlugs: siblings('nursing'),
    roles: [
      r(
        'Student Nurse',
        'qualification',
        'Approved nursing degree or degree apprenticeship with NMC-aligned clinical placements; not yet registered.',
        {
          priority: 10,
          eligibilityNote:
            'Nursing qualification stage — not Medical, Pharmacy, Dental or Midwifery student routes.',
        }
      ),
      r(
        'Nursing Associate Trainee',
        'qualification',
        'Trainee nursing associate programme bridging support worker and registered nurse roles with NMC registration pathway.',
        {
          priority: 20,
          eligibilityNote: 'Nursing associate trainee — nursing specialism; not healthcare assistant generic route.',
        }
      ),
      r(
        'Newly Qualified Nurse (NMC)',
        'registration_licence',
        'NMC-registered band 5 nurse in first post-registration role, often with preceptorship support in NHS or private care.',
        {
          priority: 30,
          eligibilityNote:
            'Newly qualified nurse — NMC registration required; not Newly Qualified Midwife or Foundation Doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Preceptorship Nurse',
        'registration_licence',
        'Band 5 nurse in structured preceptorship consolidating safe autonomous practice after NMC registration.',
        {
          priority: 40,
          eligibilityNote: 'Preceptorship nurse — early registered nursing; not Preceptorship Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Staff Nurse',
        'practitioner',
        'Registered staff nurse delivering direct patient care on wards, clinics or community teams in NHS or independent sector.',
        {
          priority: 50,
          eligibilityNote: 'Staff nurse — core nursing practitioner; not Staff Grade Doctor or pharmacy staff.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Community Staff Nurse',
        'practitioner',
        'Community-based registered nurse providing home visits, chronic disease support and primary care nursing.',
        {
          priority: 60,
          eligibilityNote: 'Community staff nurse — nursing in community settings; not Community Midwife or GP.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Mental Health Staff Nurse',
        'practitioner',
        'Registered mental health nurse delivering therapeutic care in inpatient, community or crisis services.',
        {
          priority: 70,
          eligibilityNote: 'Mental health staff nurse — nursing specialism; not Mental Health Pharmacist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Theatre Nurse',
        'practitioner',
        'Perioperative registered nurse supporting scrub, anaesthetic or recovery roles in NHS or private theatres.',
        {
          priority: 80,
          eligibilityNote: 'Theatre nurse — perioperative nursing; not ODP or medical trainee surgical roles.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Senior Staff Nurse',
        'experienced',
        'Experienced band 6 nurse with greater clinical autonomy, mentoring and shift coordination responsibility.',
        {
          priority: 90,
          eligibilityNote:
            'Senior staff nurse — experienced nursing band; not Senior Midwife or Senior Dental Officer.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Charge Nurse',
        'experienced',
        'Ward or unit charge nurse overseeing shift delivery, patient flow and junior nurse supervision.',
        {
          priority: 100,
          eligibilityNote: 'Charge nurse — experienced ward leadership at band 6/7; not Ward Manager people-manager band.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Practice Nurse',
        'experienced',
        'GP practice registered nurse delivering immunisations, chronic disease reviews and treatment room care.',
        {
          priority: 110,
          eligibilityNote: 'Practice nurse — primary care nursing; not GP Practice Pharmacist or GP doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Band 6 Staff Nurse',
        'experienced',
        'Experienced band 6 registered nurse with expanded scope, competency leadership and preceptorship duties.',
        {
          priority: 120,
          eligibilityNote: 'Band 6 staff nurse — NHS AfC experienced tier; nursing only.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialist Nurse',
        'specialist',
        'Registered nurse with focused specialist caseload after post-registration training (e.g. diabetes, respiratory, cancer).',
        {
          priority: 130,
          eligibilityNote:
            'Specialist nurse — nursing specialist stage; not Specialty Registrar or Specialty Dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Nurse Specialist',
        'specialist',
        'Band 7/8a clinical nurse specialist leading pathway care, education and service development in a clinical domain.',
        {
          priority: 140,
          eligibilityNote: 'Clinical nurse specialist — nursing CNS role; not Clinical Pharmacist or consultant doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'District Nurse',
        'specialist',
        'Specialist community district nurse leading complex caseloads, wound care and multi-disciplinary community teams.',
        {
          priority: 150,
          eligibilityNote: 'District nurse — community nursing specialist; not District Midwife role.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Diabetes Specialist Nurse',
        'specialist',
        'Specialist nurse supporting insulin initiation, education and long-term diabetes management in NHS or community.',
        {
          priority: 160,
          eligibilityNote: 'Diabetes specialist nurse — nursing; not Diabetes Specialist Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Advanced Nurse Practitioner',
        'advanced_practice_consultant',
        'NMC-registered advanced practitioner with masters-level training undertaking autonomous assessment, diagnosis and prescribing where authorised.',
        {
          priority: 170,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Advanced nurse practitioner — protected advanced practice; not Nurse Consultant or consultant doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Nurse Consultant',
        'advanced_practice_consultant',
        'Senior expert nurse leading clinical innovation, service evaluation and advanced practice at consultant-equivalent level.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Nurse consultant — nursing advanced practice; not medical consultant or Consultant Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Matron',
        'leadership',
        'Senior nursing leader overseeing multiple wards or services, quality standards and patient experience in NHS hospitals.',
        {
          priority: 190,
          eligibilityNote: 'Matron — nursing leadership title; not Maternity Unit Manager or Head of Midwifery.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Ward Manager',
        'leadership',
        'Band 7/8a ward manager with line management, rostering and budget responsibility for a nursing team.',
        {
          priority: 200,
          eligibilityNote: 'Ward manager (nursing) — people leadership; not Clinical Director medical role.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Director of Nursing',
        'leadership',
        'Executive director leading nursing strategy, workforce and quality across a trust, ICS or independent provider.',
        {
          priority: 210,
          eligibilityNote: 'Director of nursing — executive nursing; not Director of Midwifery or Medical Director.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Head of Nursing',
        'leadership',
        'Head of nursing function for a division or care group, bridging operational and strategic nursing leadership.',
        {
          priority: 220,
          eligibilityNote: 'Head of nursing — senior nursing leadership; not Head of Midwifery or Head of Pharmacy.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Nurse Educator (Clinical)',
        'academic_research',
        'Clinical nurse educator delivering post-registration training, simulation and competency programmes within NHS trusts.',
        {
          priority: 230,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Nurse educator (clinical) — limited research; teaching focus; not Clinical Lecturer medicine or university-only post.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Nursing Research Associate',
        'academic_research',
        'Registered nurse supporting nursing or health services research studies within NHS or university partnerships.',
        {
          priority: 240,
          isResearchRole: true,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Nursing research associate — limited research roles in nursing; not Clinical Research Fellow (medicine).',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Neonatal Nurse',
        'practitioner',
        'Registered nurse specialising in neonatal unit care for newborn and premature infants in NHS neonatal networks.',
        {
          priority: 250,
          eligibilityNote: 'Neonatal nurse — nursing practitioner; not Neonatal Midwife specialist midwifery role.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Critical Care Nurse',
        'experienced',
        'Experienced ICU or HDU registered nurse managing ventilated and haemodynamically unstable patients.',
        {
          priority: 260,
          eligibilityNote: 'Critical care nurse — experienced nursing; not critical care doctor or ODP.',
          isRegulatedOrRestricted: true,
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Pharmacy — GPhC
  // -------------------------------------------------------------------------
  {
    slug: 'pharmacy',
    label: 'Pharmacy',
    professionalBody: 'General Pharmaceutical Council (GPhC)',
    relatedBodies: ['Royal Pharmaceutical Society', 'NHS England'],
    sources: [...NHS_SOURCES, 'prospects_pharmacist', 'gphc_careers', 'gphc_standards'],
    siblingSlugs: siblings('pharmacy'),
    roles: [
      r(
        'Pharmacy Student',
        'qualification',
        'Master of Pharmacy (MPharm) degree with experiential learning; working toward GPhC registration eligibility.',
        {
          priority: 10,
          eligibilityNote:
            'Pharmacy qualification stage — not Medical, Nursing, Dental or Midwifery student routes.',
        }
      ),
      r(
        'Pre-registration Pharmacist Trainee',
        'qualification',
        'Final-year or placement trainee completing GPhC-accredited training before registration assessment.',
        {
          priority: 20,
          eligibilityNote: 'Pre-reg pharmacist trainee — pharmacy only; not Pre-registration Pharmacist (registered sitter).',
        }
      ),
      r(
        'Foundation Pharmacist',
        'registration_licence',
        'Newly GPhC-registered pharmacist in NHS or community foundation programme building early post-registration competence.',
        {
          priority: 30,
          eligibilityNote:
            'Foundation pharmacist — GPhC registration required; not Foundation Doctor or Foundation Dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Pre-registration Pharmacist',
        'registration_licence',
        'Trainee completing statutory pre-registration year under supervisor before GPhC registration exam.',
        {
          priority: 40,
          eligibilityNote: 'Pre-registration pharmacist — final training year; distinct from Foundation Pharmacist post-reg.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Community Pharmacist',
        'practitioner',
        'GPhC-registered pharmacist providing dispensing, clinical checks and public health advice in high street or supermarket pharmacy.',
        {
          priority: 50,
          eligibilityNote: 'Community pharmacist — primary community setting; not Community Staff Nurse or Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Hospital Pharmacist',
        'practitioner',
        'Registered hospital pharmacist supporting wards, dispensary and medicines governance in NHS acute trusts.',
        {
          priority: 60,
          eligibilityNote: 'Hospital pharmacist — NHS hospital practice; not Hospital Dentist or ward doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Primary Care Pharmacist',
        'practitioner',
        'PCN or GP federation pharmacist supporting medicines optimisation, reviews and prescribing support in primary care.',
        {
          priority: 70,
          eligibilityNote: 'Primary care pharmacist — PCN/GP context; not GP doctor or Practice Nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Locum Pharmacist',
        'practitioner',
        'Locum GPhC-registered pharmacist covering sessions across community or hospital pharmacies.',
        {
          priority: 80,
          eligibilityNote: 'Locum pharmacist — temporary pharmacy cover; not Locum Consultant doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Pharmacist',
        'experienced',
        'Experienced pharmacist integrated into clinical teams for medicines reconciliation, reviews and patient-facing consultations.',
        {
          priority: 90,
          eligibilityNote: 'Clinical pharmacist — experienced integrated care; not Clinical Nurse Specialist or Clinical Pharmacist trainee.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Ward-Based Pharmacist',
        'experienced',
        'Experienced pharmacist attending ward rounds, answering medicines queries and optimising inpatient therapy.',
        {
          priority: 100,
          eligibilityNote: 'Ward-based pharmacist — hospital experienced tier; not ward nurse or junior doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'GP Practice Pharmacist',
        'experienced',
        'Pharmacist embedded in GP practices managing polypharmacy, structured medication reviews and QOF-related medicines work.',
        {
          priority: 110,
          eligibilityNote: 'GP practice pharmacist — primary care medicines; not GP or Practice Nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Mental Health Pharmacist',
        'experienced',
        'Experienced pharmacist specialising in psychotropic medicines within mental health trusts or community teams.',
        {
          priority: 120,
          eligibilityNote: 'Mental health pharmacist — pharmacy specialism; not Mental Health Staff Nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialist Clinical Pharmacist',
        'specialist',
        'Post-registration specialist pharmacist in areas such as cardiology, renal or critical care after advanced training.',
        {
          priority: 130,
          eligibilityNote: 'Specialist clinical pharmacist — pharmacy specialist stage; not Specialty Registrar doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Oncology Pharmacist',
        'specialist',
        'Specialist pharmacist supporting chemotherapy verification, aseptic preparation oversight and cancer MDT input.',
        {
          priority: 140,
          eligibilityNote: 'Oncology pharmacist — pharmacy; not Clinical Oncology Trainee doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Aseptic Pharmacist',
        'specialist',
        'Specialist pharmacist leading aseptic unit operations, CMIV preparation and clean-room governance.',
        {
          priority: 150,
          eligibilityNote: 'Aseptic pharmacist — pharmacy manufacturing specialism; not theatre nurse or ODP.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Medicines Information Pharmacist',
        'specialist',
        'Specialist pharmacist providing evidence-based medicines queries to clinicians and patients via MI services.',
        {
          priority: 160,
          eligibilityNote: 'Medicines information pharmacist — pharmacy specialist; not medical information physician role.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant Pharmacist',
        'advanced_practice_consultant',
        'Senior GPhC-registered consultant pharmacist leading regional or national medicines practice, often with postgraduate credentials.',
        {
          priority: 170,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Consultant pharmacist — advanced pharmacy practice; not consultant doctor or Nurse Consultant.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Antimicrobial Stewardship Lead Pharmacist',
        'advanced_practice_consultant',
        'Lead pharmacist driving antibiotic governance, formulary compliance and stewardship programmes across a trust.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'AMS lead pharmacist — advanced pharmacy leadership; not infectious diseases consultant doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Chief Pharmacist',
        'leadership',
        'Head of pharmacy service accountable for medicines governance, workforce and budget at trust or ICS level.',
        {
          priority: 190,
          eligibilityNote: 'Chief pharmacist — executive pharmacy; not Chief Nurse, Medical Director or dental lead.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Head of Pharmacy',
        'leadership',
        'Senior pharmacy leader managing operational delivery across hospital, community or integrated pharmacy services.',
        {
          priority: 200,
          eligibilityNote: 'Head of pharmacy — pharmacy leadership; not Head of Nursing or Head of Midwifery.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Pharmacy Manager (Hospital)',
        'leadership',
        'Hospital pharmacy manager overseeing dispensary, procurement and team performance within an NHS trust.',
        {
          priority: 210,
          eligibilityNote: 'Hospital pharmacy manager — operational leadership; not ward manager nursing role.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Pharmacy Superintendent',
        'leadership',
        'Legally responsible superintendent pharmacist for a community pharmacy chain or independent contractor.',
        {
          priority: 220,
          eligibilityNote: 'Pharmacy superintendent — community/regulatory leadership; GPhC superintendent requirements apply.',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Industrial Pharmacist',
        'practitioner',
        'GPhC-registered pharmacist in pharmaceutical industry roles covering QA, regulatory affairs or medical affairs.',
        {
          priority: 230,
          eligibilityNote: 'Industrial pharmacist — private sector pharmacy; not NHS clinical pharmacist ward role.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Pharmacy Research Fellow',
        'academic_research',
        'Pharmacist undertaking health services or pharmacy practice research within university or NHS R&D departments.',
        {
          priority: 240,
          isResearchRole: true,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Pharmacy research fellow — research track; not Clinical Research Fellow (medicine) or nursing research associate.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Clinical Academic Pharmacist',
        'academic_research',
        'Dual university and NHS pharmacist combining advanced practice with teaching and research leadership.',
        {
          priority: 250,
          isAcademicRole: true,
          isResearchRole: true,
          academicRequirement: 'phd_relevant',
          eligibilityNote:
            'Clinical academic pharmacist — genuine academic/research appointment; not routine Clinical Pharmacist ward role.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Dentistry — GDC
  // -------------------------------------------------------------------------
  {
    slug: 'dentistry',
    label: 'Dentistry',
    professionalBody: 'General Dental Council (GDC)',
    relatedBodies: ['British Dental Association', 'NHS England'],
    sources: [...NHS_SOURCES, 'prospects_dentist', 'gdc_careers', 'gdc_standards'],
    siblingSlugs: siblings('dentistry'),
    roles: [
      r(
        'Dental Student',
        'qualification',
        'Undergraduate Bachelor of Dental Surgery (BDS) with clinical placements; not yet GDC-registered to practise independently.',
        {
          priority: 10,
          eligibilityNote:
            'Dentistry qualification stage — not Medical, Nursing, Pharmacy or Midwifery student routes.',
        }
      ),
      r(
        'Dental Foundation Applicant',
        'qualification',
        'Final-year dental student applying for Dental Foundation Training (DFT) after BDS completion.',
        {
          priority: 20,
          eligibilityNote: 'Dental foundation applicant — pre-DFT dentistry; not Foundation Doctor medicine route.',
        }
      ),
      r(
        'Dental Foundation Trainee',
        'registration_licence',
        'Newly qualified dentist in mandatory one-year Dental Foundation Training in general practice under supervision.',
        {
          priority: 30,
          eligibilityNote:
            'Dental foundation trainee — GDC registration; not Foundation Doctor FY1/FY2 or Foundation Pharmacist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Foundation Dentist',
        'registration_licence',
        'Foundation-trained dentist completing early supervised general practice before independent associate or GDP roles.',
        {
          priority: 40,
          eligibilityNote: 'Foundation dentist — early GDC-registered practice; not Foundation Year doctor or pharmacist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Associate Dentist',
        'practitioner',
        'Self-employed or employed associate dentist delivering NHS or private general dentistry in a practice setting.',
        {
          priority: 50,
          eligibilityNote: 'Associate dentist — practitioner GDP pathway; not Associate Medical Director or nurse associate.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'General Dental Practitioner (GDP)',
        'practitioner',
        'Independent GDC-registered GDP providing routine and restorative dentistry in NHS, mixed or private practice.',
        {
          priority: 60,
          eligibilityNote: 'GDP — core general dentistry; not GP doctor or general pharmacy practice.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Community Dentist',
        'practitioner',
        'Salaried dentist providing NHS community dental services for priority groups including children and anxious patients.',
        {
          priority: 70,
          eligibilityNote: 'Community dentist — primary dental services; not Community Staff Nurse or Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Community Dental Officer',
        'practitioner',
        'GDC-registered dentist employed by community dental services delivering outreach and special-care dentistry.',
        {
          priority: 80,
          eligibilityNote: 'Community dental officer — dentistry public health delivery; not medical public health consultant only.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Hospital Dentist',
        'experienced',
        'Experienced dentist working in hospital dental departments supporting oral medicine, surgery or restorative care.',
        {
          priority: 90,
          eligibilityNote: 'Hospital dentist — experienced hospital dentistry; not Hospital Pharmacist or junior doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Senior Dental Officer',
        'experienced',
        'Experienced salaried dentist with expanded responsibility in community or hospital dental services.',
        {
          priority: 100,
          eligibilityNote: 'Senior dental officer — experienced dentistry; not Senior Staff Nurse or Senior Midwife.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Dental Core Trainee',
        'experienced',
        'Hospital dental core trainee gaining experience across specialties before applying to dental specialty training.',
        {
          priority: 110,
          eligibilityNote: 'Dental core trainee — hospital training dentistry; not Core Trainee Doctor medicine.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Sedation Dentist',
        'experienced',
        'Experienced GDP or hospital dentist providing conscious sedation for anxious patients with appropriate postgraduate training.',
        {
          priority: 120,
          eligibilityNote: 'Sedation dentist — experienced dentistry with sedation credential; not anaesthetic doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialty Dentist',
        'specialist',
        'GDC-registered dentist undertaking or completing a GDC-approved dental specialty training programme.',
        {
          priority: 130,
          eligibilityNote: 'Specialty dentist — dental specialty training stage; not Specialty Registrar medicine.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Orthodontist',
        'specialist',
        'Specialist dentist providing orthodontic assessment, braces and aligner treatment after orthodontic specialty training.',
        {
          priority: 140,
          eligibilityNote: 'Orthodontist — GDC specialist list; not Consultant in Orthodontics hospital consultant yet.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Oral Surgery Specialist Dentist',
        'specialist',
        'Specialist dentist performing dentoalveolar and minor oral surgery after oral surgery specialty training.',
        {
          priority: 150,
          eligibilityNote: 'Oral surgery specialist dentist — dental specialty; not Consultant in Oral Surgery hospital grade alone.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Paediatric Dentistry Specialist',
        'specialist',
        'Specialist dentist focused on children\'s dentistry including behaviour management and complex paediatric care.',
        {
          priority: 160,
          eligibilityNote: 'Paediatric dentistry specialist — dental specialty; not paediatric nurse or doctor trainee.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant in Restorative Dentistry',
        'advanced_practice_consultant',
        'Hospital consultant leading complex restorative, prosthodontic and multidisciplinary dental care with GDC specialist registration.',
        {
          priority: 170,
          eligibilityNote:
            'Consultant in restorative dentistry — advanced hospital consultant; not GDP or specialty trainee.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant in Oral Surgery',
        'advanced_practice_consultant',
        'Hospital consultant oral surgeon managing complex surgical caseloads and training within NHS dental hospitals.',
        {
          priority: 180,
          eligibilityNote: 'Consultant in oral surgery — consultant dentistry; not Consultant Surgeon (medicine).',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant in Orthodontics',
        'advanced_practice_consultant',
        'Hospital or specialist practice consultant orthodontist leading complex malocclusion and cleft-related orthodontic care.',
        {
          priority: 190,
          eligibilityNote: 'Consultant in orthodontics — consultant-level orthodontics; not Orthodontist specialty trainee alone.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Dental Public Health Consultant',
        'advanced_practice_consultant',
        'Consultant in dental public health leading population oral health programmes at local or national level.',
        {
          priority: 200,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Dental public health consultant — consultant dentistry/public health; not medical public health consultant only.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Dental Practice Owner',
        'leadership',
        'Principal dentist owning or partnering in a dental practice with business, compliance and clinical leadership responsibility.',
        {
          priority: 210,
          eligibilityNote: 'Dental practice owner — business/clinical leadership; not Dental Practice Manager non-dentist role.',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Clinical Lead Dentist',
        'leadership',
        'Lead dentist for a community, salaried or hospital dental service setting clinical standards and pathways.',
        {
          priority: 220,
          eligibilityNote: 'Clinical lead dentist — dentistry service leadership; not Clinical Director (medicine).',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Head of Dental Services',
        'leadership',
        'Senior manager leading dental service delivery across community or hospital settings within an NHS trust or ICB.',
        {
          priority: 230,
          eligibilityNote: 'Head of dental services — dentistry leadership; not Head of Nursing or Pharmacy.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Dental Clinical Director',
        'leadership',
        'Executive dental leader accountable for clinical governance and dental workforce across an organisation or region.',
        {
          priority: 240,
          eligibilityNote: 'Dental clinical director — dentistry executive; not Medical Director or Clinical Director medicine.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Dental Academic',
        'academic_research',
        'University-based dental academic combining teaching with research in dental schools and hospital partnerships.',
        {
          priority: 250,
          isAcademicRole: true,
          isResearchRole: true,
          academicRequirement: 'phd_relevant',
          eligibilityNote: 'Dental academic — university dentistry; not Dental Research Fellow trainee research post alone.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Dental Research Fellow',
        'academic_research',
        'Dentist undertaking funded oral health or dental materials research within university or NIHR settings.',
        {
          priority: 260,
          isResearchRole: true,
          academicRequirement: 'masters_relevant',
          eligibilityNote: 'Dental research fellow — research dentistry; not Clinical Research Fellow (medicine).',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
    ],
  },

  // -------------------------------------------------------------------------
  // Midwifery — NMC
  // -------------------------------------------------------------------------
  {
    slug: 'midwifery',
    label: 'Midwifery',
    professionalBody: 'Nursing and Midwifery Council (NMC)',
    relatedBodies: ['Royal College of Midwives', 'NHS England'],
    sources: [...NHS_SOURCES, 'prospects_midwife', 'nmc_midwifery', 'nmc_standards'],
    siblingSlugs: siblings('midwifery'),
    roles: [
      r(
        'Student Midwife',
        'qualification',
        'Approved midwifery degree or apprenticeship with NMC-aligned placements; not yet registered midwife.',
        {
          priority: 10,
          eligibilityNote:
            'Midwifery qualification stage — not Student Nurse, Medical, Pharmacy or Dental student routes.',
        }
      ),
      r(
        'Return to Practice Midwife Student',
        'qualification',
        'NMC return-to-practice programme for lapsed midwives restoring registration through supervised clinical updating.',
        {
          priority: 20,
          eligibilityNote: 'Return to practice midwife — midwifery specialism; not Return to Practice Nursing Student.',
        }
      ),
      r(
        'Newly Qualified Midwife',
        'registration_licence',
        'NMC-registered band 5 midwife in first post-registration role with preceptorship in maternity unit or community.',
        {
          priority: 30,
          eligibilityNote:
            'Newly qualified midwife — NMC midwifery registration; not Newly Qualified Nurse or Foundation Doctor.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Preceptorship Midwife',
        'registration_licence',
        'Band 5 midwife in structured preceptorship consolidating autonomous intrapartum and antenatal practice.',
        {
          priority: 40,
          eligibilityNote: 'Preceptorship midwife — early registered midwifery; not Preceptorship Nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Midwife',
        'practitioner',
        'Registered midwife providing antenatal, intrapartum and postnatal care in NHS hospital, birth centre or community settings.',
        {
          priority: 50,
          eligibilityNote: 'Midwife — core midwifery practitioner; protected title; not Staff Nurse or generic nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Community Midwife',
        'practitioner',
        'Community-based midwife delivering home visits, antenatal clinics and postnatal support across a caseload.',
        {
          priority: 60,
          eligibilityNote: 'Community midwife — midwifery in community; not Community Staff Nurse or Community Dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Labour Ward Midwife',
        'practitioner',
        'Midwife specialising in intrapartum care on hospital labour ward or alongside birth centre.',
        {
          priority: 70,
          eligibilityNote: 'Labour ward midwife — intrapartum focus; not Theatre Nurse or obstetric doctor trainee.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Home Birth Midwife',
        'practitioner',
        'Midwife supporting planned home births with autonomous decision-making and emergency escalation protocols.',
        {
          priority: 80,
          eligibilityNote: 'Home birth midwife — community/independent midwifery practice; not independent nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Senior Midwife',
        'experienced',
        'Experienced band 6 midwife with expanded clinical responsibility, mentoring and shift coordination on maternity units.',
        {
          priority: 90,
          eligibilityNote: 'Senior midwife — experienced midwifery; not Senior Staff Nurse or Senior Dental Officer.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Team Leader Midwife',
        'experienced',
        'Experienced midwife leading a community or ward team shift, coordinating staffing and clinical escalation.',
        {
          priority: 100,
          eligibilityNote: 'Team leader midwife — experienced operational lead; not Ward Manager nursing people-management.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Band 6 Midwife',
        'experienced',
        'Experienced band 6 midwife with advanced clinical skills and preceptorship responsibilities on maternity pathways.',
        {
          priority: 110,
          eligibilityNote: 'Band 6 midwife — NHS AfC experienced tier; midwifery only.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Independent Midwife',
        'experienced',
        'Self-employed NMC-registered midwife providing private antenatal, birth and postnatal care with own indemnity arrangements.',
        {
          priority: 120,
          eligibilityNote: 'Independent midwife — private practice midwifery; not independent GP or dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Specialist Midwife',
        'specialist',
        'Registered midwife with post-registration specialist focus such as perinatal mental health or fetal medicine support.',
        {
          priority: 130,
          eligibilityNote: 'Specialist midwife — midwifery specialist stage; not Specialist Nurse or Specialty Dentist.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Diabetes Specialist Midwife',
        'specialist',
        'Specialist midwife supporting diabetic pregnancies with glucose management, education and MDT coordination.',
        {
          priority: 140,
          eligibilityNote: 'Diabetes specialist midwife — midwifery; not Diabetes Specialist Nurse.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Bereavement Specialist Midwife',
        'specialist',
        'Specialist midwife supporting families through pregnancy loss, stillbirth and neonatal bereavement pathways.',
        {
          priority: 150,
          eligibilityNote: 'Bereavement specialist midwife — midwifery specialist; not bereavement nurse alone.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Neonatal Midwife',
        'specialist',
        'Specialist midwife working with neonatal teams supporting transition, breastfeeding and family-centred neonatal care.',
        {
          priority: 160,
          eligibilityNote: 'Neonatal midwife — midwifery specialist; not Neonatal Nurse nursing role.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Fetal Medicine Specialist Midwife',
        'specialist',
        'Specialist midwife in fetal medicine units supporting complex pregnancies, screening and counselling alongside obstetricians.',
        {
          priority: 170,
          eligibilityNote: 'Fetal medicine specialist midwife — midwifery; not fetal medicine consultant obstetrician.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Consultant Midwife',
        'advanced_practice_consultant',
        'Senior expert midwife providing advanced clinical practice, service innovation and consultancy at consultant-equivalent level.',
        {
          priority: 180,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Consultant midwife — advanced midwifery practice; not Nurse Consultant or medical consultant.',
          isRegulatedOrRestricted: true,
        }
      ),
      r(
        'Head of Midwifery',
        'leadership',
        'Senior midwifery leader accountable for maternity service standards, workforce and professional governance in a trust.',
        {
          priority: 190,
          eligibilityNote: 'Head of midwifery — midwifery leadership; not Head of Nursing or Head of Pharmacy.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Director of Midwifery',
        'leadership',
        'Executive director leading midwifery strategy, safety and workforce across an organisation or maternity network.',
        {
          priority: 200,
          eligibilityNote: 'Director of midwifery — executive midwifery; not Director of Nursing or Medical Director.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Maternity Unit Manager',
        'leadership',
        'Band 8a/b manager overseeing operational delivery, staffing and patient experience on a maternity unit.',
        {
          priority: 210,
          eligibilityNote: 'Maternity unit manager — midwifery/nursing management; not Matron general nursing title.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Lead Midwife',
        'leadership',
        'Lead midwife for a service line such as community birth, continuity team or birth centre clinical leadership.',
        {
          priority: 220,
          eligibilityNote: 'Lead midwife — clinical/service leadership; not Lead Pharmacist or Clinical Lead Dentist.',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Clinical Midwife Lead',
        'leadership',
        'Senior midwife leading clinical governance, audit and best practice for a maternity division or locality.',
        {
          priority: 230,
          eligibilityNote: 'Clinical midwife lead — midwifery leadership; not Clinical Director (medicine).',
          professionalRegistrationRequirement: 'commonly_expected',
        }
      ),
      r(
        'Midwifery Educator',
        'academic_research',
        'Midwifery educator delivering pre-registration or post-registration training in university or NHS education departments.',
        {
          priority: 240,
          isAcademicRole: true,
          isResearchRole: false,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Midwifery educator — limited research; teaching focus; not Nurse Educator or Clinical Lecturer medicine.',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
      r(
        'Midwifery Research Fellow',
        'academic_research',
        'Registered midwife undertaking maternity or perinatal research within NIHR, university or NHS R&D partnerships.',
        {
          priority: 250,
          isResearchRole: true,
          academicRequirement: 'masters_relevant',
          eligibilityNote:
            'Midwifery research fellow — limited research track; not Clinical Research Fellow (medicine).',
          professionalRegistrationRequirement: 'desirable',
        }
      ),
    ],
  },
]
