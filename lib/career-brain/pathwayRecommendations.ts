/**
 * Deterministic pathway recommendation engine — selects jobs from predefined buckets.
 * AI must not invent Work Now / Build Next / Long-Term titles; it may only explain them.
 */

import type { CareerBrainRecommendation, CareerBrainState, CareerDomain, CareerProfile, PathOrigin } from './types'
import { isStartNewCareerGoal } from './userGoal'
import { blendEducationExperiencePack, filterRolesForPathConsistency, ensureDualPathTrackBalance } from './pathConsistency'

const STUDY_FIELD_BRIDGE_TEXT: Record<string, string> = {
  business_management: 'business management',
  it_computing: 'computer science',
  engineering: 'engineering',
  healthcare: 'healthcare',
  education: 'education',
  science: 'science',
  arts_design: 'animation design',
  media_communications: 'media communications',
  law: 'law',
  construction_trades: 'construction',
  other: 'general studies',
}

function studyFieldBridgeText(value: string): string {
  return STUDY_FIELD_BRIDGE_TEXT[value] ?? value.replace(/_/g, ' ')
}

export type PathwayId =
  | 'NO_EXPERIENCE_PHYSICAL'
  | 'NO_EXPERIENCE_CUSTOMER'
  | 'NO_EXPERIENCE_OFFICE'
  | 'EDUCATION_FIELD_PATH'
  | 'EXPERIENCE_SAME_FIELD'
  | 'EXPERIENCE_DIFFERENT_FIELD'
  | 'EDUCATION_EXPERIENCE_BOTH'
  | 'FAST_EMPLOYMENT'
  | 'GENERAL_FALLBACK'
  | 'LEGACY_DELEGATE'

export type PathwayRole = {
  title: string
  track: 'work_now' | 'build_next' | 'long_term'
  why: string
  origin?: PathOrigin
}

export type PathwayRecommendationResult = {
  pathId: PathwayId
  workNow: PathwayRole[]
  buildNext: PathwayRole[]
  longTerm: PathwayRole[]
  warningNotes: string[]
  explanationContext: string[]
}

export type PathwayAnswers = Record<string, unknown>

export type PathwayProfile = {
  userGoal: string
  experienceLevel: 'no_experience' | 'have_experience' | null
  educationLevel: string | null
  studyFieldSlug: string | null
  studyFieldText: string | null
  fieldAlignment: 'yes' | 'no' | 'both' | null
  experienceFieldText: string | null
  experienceFieldIntent: 'yes' | 'no' | null
  experienceFieldRelation: string | null
  experienceCountry: 'mostly_uk' | 'mostly_international' | 'both' | null
  workPreference: string | null
  physicalAbility: string | null
  customerComfort: string | null
  englishLevel: string | null
  hasDrivingLicence: boolean
  careerDirectionPriority: 'education_field' | 'experience_field' | 'both' | 'not_sure' | 'fast_employment' | null
  wantsCareerChange: boolean
  continueInExperienceField: boolean
  experienceYearsBand: 'under_1' | '1_3' | '3_5' | '5_10' | '10_plus' | null
}

const DRIVER_PATTERN =
  /\b(delivery driver|courier|hgv|taxi|private hire|van driver|driver\b|hgv driver|parcel driver)\b/i

const OFFICE_WORK_NOW_PATTERN =
  /\b(administrator|recruitment assistant|office assistant|office admin|data entry|paralegal|receptionist|office manager)\b/i

const HEAVY_CUSTOMER_PATTERN =
  /\b(customer service advisor|receptionist|retail assistant|call centre|sales assistant)\b/i

function str(a: PathwayAnswers, key: string): string {
  const v = a[key]
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

function has(a: PathwayAnswers, key: string): boolean {
  const v = str(a, key)
  return v.length > 0
}

export function buildPathwayProfile(answers: PathwayAnswers): PathwayProfile {
  const studentField = str(answers, 'cb_student_study_field').toLowerCase()
  const studySlug =
    str(answers, 'cb_first_job_study_field') ||
    str(answers, 'cb_graduate_study_field') ||
    (studentField === 'law'
      ? 'law'
      : studentField === 'animation'
        ? 'arts_design'
        : studentField === 'it' || studentField === 'computing'
          ? 'it_computing'
          : studentField
            ? studentField.replace(/\s+/g, '_')
            : '')
  const studyText = studySlug ? studyFieldBridgeText(studySlug) : studentField || ''

  const expLevel = str(answers, 'cb_experience_level')
  const experienceLevel =
    expLevel === 'no_experience' ? 'no_experience' : expLevel ? 'have_experience' : null

  const alignRaw = str(answers, 'cb_field_alignment') || str(answers, 'cb_first_job_career_preference')
  let fieldAlignment: PathwayProfile['fieldAlignment'] = null
  if (alignRaw === 'yes' || alignRaw === 'yes_only') fieldAlignment = 'yes'
  else if (alignRaw === 'no' || alignRaw === 'open_any') fieldAlignment = 'no'
  else if (alignRaw === 'both' || alignRaw === 'prefer_field') fieldAlignment = 'both'

  const expIntent = str(answers, 'cb_experience_field_intent')
  let experienceFieldIntent: 'yes' | 'no' | null =
    expIntent === 'yes' ? 'yes' : expIntent === 'no' ? 'no' : null
  const continueInField = str(answers, 'cb_continue_in_field')
  if (continueInField === 'yes' && experienceFieldIntent !== 'no') {
    experienceFieldIntent = 'yes'
  } else if (continueInField === 'no') {
    experienceFieldIntent = 'no'
  }

  const priorityRaw = str(answers, 'cb_career_direction_priority')
  if (priorityRaw === 'education_field') {
    fieldAlignment = 'yes'
    experienceFieldIntent = 'no'
  } else if (priorityRaw === 'experience_field') {
    fieldAlignment = 'no'
    experienceFieldIntent = 'yes'
  } else if (priorityRaw === 'both') {
    fieldAlignment = 'both'
    experienceFieldIntent = 'yes'
  } else if (priorityRaw === 'fast_employment') {
    fieldAlignment = 'no'
    experienceFieldIntent = 'yes'
  }

  const country = str(answers, 'cb_experience_country')
  const experienceCountry =
    country === 'mostly_uk'
      ? 'mostly_uk'
      : country === 'mostly_international'
        ? 'mostly_international'
        : country === 'both'
          ? 'both'
          : null

  const yearsRaw = str(answers, 'cb_experience_years')
  const experienceYearsBand =
    yearsRaw === 'under_1' ||
    yearsRaw === '1_3' ||
    yearsRaw === '3_5' ||
    yearsRaw === '5_10' ||
    yearsRaw === '10_plus'
      ? yearsRaw
      : null

  const licence =
    str(answers, 'cb_uk_driving_licence') === 'yes' ||
    str(answers, 'cb_driving_licence') === 'yes'

  return {
    userGoal: str(answers, 'cb_user_goal'),
    experienceLevel,
    educationLevel: str(answers, 'cb_first_job_education_level') || null,
    studyFieldSlug: studySlug || null,
    studyFieldText: studyText || null,
    fieldAlignment,
    experienceFieldText:
      str(answers, 'cb_work_experience_field') ||
      str(answers, 'cb_basic_experience_text') ||
      str(answers, 'cb_professional_field') ||
      null,
    experienceFieldIntent,
    experienceFieldRelation: str(answers, 'cb_experience_field_relation') || null,
    experienceCountry,
    workPreference: str(answers, 'cb_entry_work_preference') || null,
    physicalAbility: str(answers, 'cb_physical_ability') || null,
    customerComfort: str(answers, 'cb_customer_comfort') || null,
    englishLevel: str(answers, 'cb_english') || null,
    hasDrivingLicence: licence,
    careerDirectionPriority: (() => {
      const p = str(answers, 'cb_career_direction_priority')
      if (
        p === 'education_field' ||
        p === 'experience_field' ||
        p === 'both' ||
        p === 'not_sure' ||
        p === 'fast_employment'
      ) {
        return p
      }
      return null
    })(),
    wantsCareerChange:
      isStartNewCareerGoal(str(answers, 'cb_user_goal')) ||
      str(answers, 'cb_change_current_field').length > 0 ||
      /change_field|different_field/.test(
        str(answers, 'cb_professional_field_intent') + str(answers, 'cb_continue_in_field')
      ),
    continueInExperienceField: experienceFieldIntent === 'yes' || continueInField === 'yes',
    experienceYearsBand,
  }
}

function isPostSecondaryEducation(level: string | null): boolean {
  return !!level && !['no_formal', 'gcse_a_levels'].includes(level)
}

function isLowQualification(level: string | null): boolean {
  return !level || level === 'no_formal' || level === 'gcse_a_levels'
}

function prefersPhysical(p: PathwayProfile): boolean {
  if (p.physicalAbility === 'heavy_physical' || p.physicalAbility === 'light_physical') return true
  if (p.physicalAbility === 'yes') return true
  const pref = p.workPreference ?? ''
  if (pref === 'physical_practical' || pref === 'quick_income') return true
  return false
}

function prefersCustomer(p: PathwayProfile): boolean {
  if (p.customerComfort === 'yes' || p.customerComfort === 'sometimes') return true
  return p.workPreference === 'customer_facing'
}

function prefersOffice(p: PathwayProfile): boolean {
  if (p.physicalAbility === 'non_physical') return true
  return p.workPreference === 'office_computer' || p.workPreference === 'creative_work'
}

function hasGoodEnglish(p: PathwayProfile): boolean {
  return p.englishLevel === 'good' || p.englishLevel === 'fluent' || p.englishLevel === 'comfortable'
}

function isBasicEnglish(p: PathwayProfile): boolean {
  return p.englishLevel === 'basic'
}

function wantsStudyField(p: PathwayProfile): boolean {
  return isPostSecondaryEducation(p.educationLevel) && (p.fieldAlignment === 'yes' || p.fieldAlignment === 'both')
}

function wantsExperienceField(p: PathwayProfile): boolean {
  return p.experienceLevel === 'have_experience' && p.experienceFieldIntent === 'yes'
}

function wantsBothPaths(p: PathwayProfile): boolean {
  if (p.careerDirectionPriority === 'both' || p.careerDirectionPriority === 'not_sure') {
    return wantsStudyField(p) && wantsExperienceField(p)
  }
  return false
}

function role(
  title: string,
  track: PathwayRole['track'],
  why: string,
  origin?: PathOrigin
): PathwayRole {
  return { title, track, why, origin }
}

function tagRoleOrigin(r: PathwayRole, origin: PathOrigin): PathwayRole {
  const label = origin === 'education' ? 'education' : origin === 'experience' ? 'experience' : 'blended'
  const tagged = new RegExp(`\\(${label}\\)`, 'i').test(r.why)
  return {
    ...r,
    origin,
    why: tagged ? r.why : `${r.why} (${label})`,
  }
}

function dedupePathwayRoles(roles: PathwayRole[]): PathwayRole[] {
  const out: PathwayRole[] = []
  for (const r of roles) {
    const key = `${r.track}:${r.title.toLowerCase()}`
    if (out.some((o) => `${o.track}:${o.title.toLowerCase()}` === key)) continue
    out.push(r)
  }
  return out
}

const BUCKET_A: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> = {
  workNow: [
    role('Warehouse Operative', 'work_now', 'Physical work — realistic entry with no formal qualifications'),
    role('Production Operative', 'work_now', 'Factory/production hiring is common for new starters'),
    role('Picker/Packer', 'work_now', 'Distribution centres often hire quickly without prior experience'),
    role('Kitchen Assistant', 'work_now', 'Back-of-house practical role when you prefer hands-on work'),
  ],
  buildNext: [
    role('Forklift Licence', 'build_next', 'Build Next — FLT opens higher-paid warehouse roles'),
    role('CSCS Card', 'build_next', 'Build Next — useful if you move toward construction or site logistics'),
    role('Food Hygiene Certificate', 'build_next', 'Build Next — supports kitchen and food production routes'),
    role('Warehouse Team Leader Training', 'build_next', 'Build Next — first step toward supervisor roles'),
  ],
  longTerm: [
    role('Warehouse Supervisor', 'long_term', 'Long-term — progression after UK reliability and training'),
    role('Logistics Coordinator', 'long_term', 'Long-term — coordination route from warehouse experience'),
    role('Operations Supervisor', 'long_term', 'Long-term — site operations leadership'),
  ],
}

const BUCKET_B: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> = {
  workNow: [
    role('Retail Assistant', 'work_now', 'Customer-facing entry — common first UK job'),
    role('Customer Service Assistant', 'work_now', 'Uses everyday communication in a structured role'),
    role('Reception Assistant', 'work_now', 'Front-desk entry when you are comfortable with people'),
  ],
  buildNext: [
    role('Customer Service Certificate', 'build_next', 'Build Next — strengthens applications for service roles'),
    role('Microsoft Office Basics', 'build_next', 'Build Next — supports admin progression later'),
    role('Team Leader Training', 'build_next', 'Build Next — supervisor route in retail/hospitality'),
  ],
  longTerm: [
    role('Customer Service Advisor', 'long_term', 'Long-term — experienced service professional'),
    role('Team Leader', 'long_term', 'Long-term — team leadership in customer environments'),
    role('Office Administrator', 'long_term', 'Long-term — office progression after service experience'),
  ],
}

const BUCKET_C: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> = {
  workNow: [
    role('Office Assistant', 'work_now', 'Office entry — matches computer/office preference and English level'),
    role('Administrator', 'work_now', 'Admin support is a realistic first office role'),
    role('Data Entry Assistant', 'work_now', 'Structured computer work with clear tasks'),
  ],
  buildNext: [
    role('Microsoft Office Certificate', 'build_next', 'Build Next — core skill for UK office roles'),
    role('Excel Basics', 'build_next', 'Build Next — spreadsheets unlock admin progression'),
    role('Business Administration Certificate', 'build_next', 'Build Next — formal admin pathway'),
  ],
  longTerm: [
    role('Office Administrator', 'long_term', 'Long-term — established office career'),
    role('Project Coordinator', 'long_term', 'Long-term — coordination after office experience'),
    role('Operations Coordinator', 'long_term', 'Long-term — operations support progression'),
  ],
}

function educationFieldPack(slug: string | null, studyText: string | null): Omit<
  PathwayRecommendationResult,
  'pathId' | 'warningNotes' | 'explanationContext'
> {
  const s = (slug ?? studyText ?? '').toLowerCase()

  if (s.includes('science') || /biology|chemistry|physics|laboratory/.test(s)) {
    return {
      workNow: [
        role('Laboratory Assistant', 'work_now', 'Closest UK entry into science — matches your qualification'),
        role('Research Assistant', 'work_now', 'Research support uses your degree without claiming senior lab roles'),
        role('Science Technician', 'work_now', 'Technician route is a standard graduate science entry point'),
      ],
      buildNext: [
        role('Laboratory Skills Certificate', 'build_next', 'Build Next — practical lab competencies for UK employers'),
        role('Quality Control Basics', 'build_next', 'Build Next — QC skills align with science technician routes'),
        role('Health & Safety in Laboratories', 'build_next', 'Build Next — expected for regulated lab environments'),
      ],
      longTerm: [
        role('Laboratory Supervisor', 'long_term', 'Long-term — supervision after UK lab experience'),
        role('Research Technician', 'long_term', 'Long-term — research career progression'),
        role('Quality Control Specialist', 'long_term', 'Long-term — specialist science career path'),
      ],
    }
  }

  if (s.includes('media_communications') || (s === 'media_communications')) {
    return {
      workNow: [
        role('Marketing Assistant', 'work_now', 'Marketing/comms entry aligned with your studies'),
        role('Communications Assistant', 'work_now', 'Communications support uses your media background'),
        role('Content Assistant', 'work_now', 'Content role — realistic first step in media/comms'),
      ],
      buildNext: [
        role('Content Producer', 'build_next', 'Build Next — content role after assistant experience'),
        role('Junior Marketing Executive', 'build_next', 'Build Next — marketing progression in media/comms'),
        role('Digital Content Coordinator', 'build_next', 'Build Next — coordinates digital content delivery'),
      ],
      longTerm: [
        role('Motion Designer', 'long_term', 'Long-term — creative motion career path'),
        role('Marketing Manager', 'long_term', 'Long-term — marketing leadership'),
        role('Content Strategist', 'long_term', 'Long-term — content strategy career'),
      ],
    }
  }

  if (s.includes('arts_design') || /\banimation\b/.test(s)) {
    return {
      workNow: [
        role('Content Creator', 'work_now', 'Creative entry aligned with design/animation studies'),
        role('Design Assistant', 'work_now', 'Junior creative hire — realistic first step'),
        role('Production Assistant (creative)', 'work_now', 'Production support in creative studios'),
      ],
      buildNext: [
        role('Junior Motion Designer', 'build_next', 'Build Next — junior creative progression after assistant roles'),
        role('Content Producer', 'build_next', 'Build Next — produces content for brands and studios'),
        role('Digital Content Coordinator', 'build_next', 'Build Next — coordinates creative production'),
      ],
      longTerm: [
        role('Motion Designer', 'long_term', 'Long-term — motion career after portfolio and UK experience'),
        role('Senior Motion Designer', 'long_term', 'Long-term — senior creative progression'),
        role('Creative Lead', 'long_term', 'Long-term — leadership in creative teams'),
      ],
    }
  }

  if (s.includes('media') || /video|creative communications/.test(s)) {
    return {
      workNow: [
        role('Media Assistant', 'work_now', 'Media entry aligned with your study field'),
        role('Content Assistant', 'work_now', 'Content production support uses your qualification'),
        role('Junior Designer', 'work_now', 'Junior creative hire — realistic first step in design/media'),
        role('Video Editing Assistant', 'work_now', 'Video route when your studies include media production'),
      ],
      buildNext: [
        role('Video editing short course', 'build_next', 'Build Next — strengthens creative applications'),
        role('Motion graphics fundamentals', 'build_next', 'Build Next — motion skills for media roles'),
        role('Portfolio development', 'build_next', 'Build Next — showreel/portfolio for creative hiring'),
      ],
      longTerm: [
        role('Content Producer', 'long_term', 'Long-term — content career after portfolio and UK experience'),
        role('Senior Designer', 'long_term', 'Long-term — design progression'),
        role('Creative Lead', 'long_term', 'Long-term — leadership in creative teams'),
      ],
    }
  }

  if (s.includes('education') || /teaching|learning support/.test(s)) {
    return {
      workNow: [
        role('Teaching Assistant', 'work_now', 'Education pathway — standard school/college entry'),
        role('Education Support Worker', 'work_now', 'Support roles use your education background'),
        role('Learning Support Assistant', 'work_now', 'SEN/learning support is a common graduate route'),
      ],
      buildNext: [
        role('Safeguarding training', 'build_next', 'Build Next — required for many education roles'),
        role('Teaching assistant qualification', 'build_next', 'Build Next — formal TA pathway in UK schools'),
        role('SEN support basics', 'build_next', 'Build Next — special educational needs skills'),
      ],
      longTerm: [
        role('Senior Teaching Assistant', 'long_term', 'Long-term — experienced TA progression'),
        role('Learning Mentor', 'long_term', 'Long-term — pupil support specialist'),
        role('Education Coordinator', 'long_term', 'Long-term — coordination in education settings'),
      ],
    }
  }

  if (s.includes('business') || /management|mba/.test(s)) {
    return {
      workNow: [
        role('Admin Assistant', 'work_now', 'Business graduate entry — office operations'),
        role('Operations Assistant', 'work_now', 'Operations support uses your management studies'),
        role('HR Assistant', 'work_now', 'HR admin is a common business graduate entry'),
        role('Project Assistant', 'work_now', 'Project coordination support — realistic junior business role'),
      ],
      buildNext: [
        role('Microsoft Office Certification', 'build_next', 'Build Next — core business software skills'),
        role('Business Administration Certificate', 'build_next', 'Build Next — formal admin credential'),
        role('Bookkeeping Basics', 'build_next', 'Build Next — finance admin progression'),
      ],
      longTerm: [
        role('Business Administrator', 'long_term', 'Long-term — office/business operations career'),
        role('Operations Coordinator', 'long_term', 'Long-term — operations management route'),
        role('Project Coordinator', 'long_term', 'Long-term — project management progression'),
      ],
    }
  }

  if (s.includes('it_computing') || /computer|software|computing/.test(s)) {
    return {
      workNow: [
        role('IT Support Assistant', 'work_now', 'IT entry — helpdesk/support is the standard UK graduate route'),
        role('Junior Web Assistant', 'work_now', 'Junior digital role aligned with computing studies'),
        role('Data Assistant', 'work_now', 'Data support uses analytical skills from your degree'),
      ],
      buildNext: [
        role('CompTIA A+', 'build_next', 'Build Next — recognised IT support certification'),
        role('Google IT Support Certificate', 'build_next', 'Build Next — entry IT credential'),
        role('Junior Web Developer training', 'build_next', 'Build Next — developer progression if you prefer coding'),
      ],
      longTerm: [
        role('IT Support Specialist', 'long_term', 'Long-term — experienced IT support career'),
        role('Systems Analyst', 'long_term', 'Long-term — analysis and infrastructure progression'),
        role('Software Developer', 'long_term', 'Long-term — development career after junior experience'),
      ],
    }
  }

  if (s.includes('healthcare') || /nursing|care|clinical/.test(s)) {
    return {
      workNow: [
        role('Care Assistant', 'work_now', 'Care entry — regulated pathway starts with hands-on support'),
        role('Healthcare Assistant', 'work_now', 'Healthcare assistant uses your health-related studies'),
        role('Support Worker', 'work_now', 'Support work is realistic while building UK care experience'),
      ],
      buildNext: [
        role('Care Certificate', 'build_next', 'Build Next — essential UK care qualification'),
        role('Moving & Handling training', 'build_next', 'Build Next — required for care roles'),
        role('Senior Healthcare Assistant', 'build_next', 'Build Next — progression within care'),
      ],
      longTerm: [
        role('Senior Care Worker', 'long_term', 'Long-term — experienced care professional'),
        role('Healthcare Coordinator', 'long_term', 'Long-term — coordination in care settings'),
        role('Clinical Support Career Pathway', 'long_term', 'Long-term — non-clinical healthcare progression'),
      ],
    }
  }

  if (s.includes('engineering')) {
    return {
      workNow: [
        role('Engineering Technician Assistant', 'work_now', 'Technician route — realistic engineering entry'),
        role('CAD Technician Assistant', 'work_now', 'CAD/drafting support uses technical study background'),
        role('Manufacturing Operative', 'work_now', 'Production floor entry in engineering sectors'),
      ],
      buildNext: [
        role('CAD training', 'build_next', 'Build Next — technical drawing skills for engineering employers'),
        role('HNC Engineering (part-time)', 'build_next', 'Build Next — UK engineering technician qualification'),
        role('Health & Safety on site', 'build_next', 'Build Next — site safety for engineering environments'),
      ],
      longTerm: [
        role('Project Engineer', 'long_term', 'Long-term — project delivery in engineering'),
        role('Engineering Project Coordinator', 'long_term', 'Long-term — coordinates engineering projects'),
        role('Design Engineer', 'long_term', 'Long-term — design route after technician experience'),
      ],
    }
  }

  if (s.includes('law')) {
    return {
      workNow: [
        role('Legal Receptionist', 'work_now', 'Legal sector entry — uses your law studies'),
        role('Legal Admin Assistant', 'work_now', 'Legal administration is the standard graduate entry'),
        role('Casework Assistant', 'work_now', 'Casework support — realistic junior legal role'),
      ],
      buildNext: [
        role('Junior Legal Assistant', 'build_next', 'Build Next — first legal progression after reception/admin experience'),
        role('Legal Administrator', 'build_next', 'Build Next — office legal role with more responsibility'),
        role('Casework Officer', 'build_next', 'Build Next — casework progression in legal teams'),
      ],
      longTerm: [
        role('Legal Assistant', 'long_term', 'Long-term — experienced legal support'),
        role('Paralegal', 'long_term', 'Long-term — paralegal career after UK legal experience'),
        role('Legal Operations Coordinator', 'long_term', 'Long-term — legal operations career'),
      ],
    }
  }

  return {
    workNow: [
      role('Sector Assistant (entry)', 'work_now', 'Junior role related to your qualification field'),
      role('Admin Assistant', 'work_now', 'Office entry while building field-specific experience'),
      role('Customer Service Advisor', 'work_now', 'Service role — common bridge while targeting your field'),
    ],
    buildNext: [
      role('Microsoft Office Certification', 'build_next', 'Build Next — employability for UK offices'),
      role('Industry short course', 'build_next', 'Build Next — field-related training'),
      role('Volunteering in your sector', 'build_next', 'Build Next — UK references in your field'),
    ],
    longTerm: [
      role('Specialist in your field', 'long_term', 'Long-term — progression after UK experience in sector'),
      role('Team Coordinator', 'long_term', 'Long-term — coordination after proven reliability'),
      role('Professional pathway in your sector', 'long_term', 'Long-term — field-aligned career growth'),
    ],
  }
}

function experienceSectorPack(
  expText: string,
  country: PathwayProfile['experienceCountry'],
  studyRelated: boolean,
  yearsBand: PathwayProfile['experienceYearsBand'] = null
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  const e = expText.toLowerCase()
  const mostlyUk = country === 'mostly_uk' || country === 'both'
  const senior = yearsBand === '10_plus' || yearsBand === '5_10'
  const junior = yearsBand === 'under_1' || yearsBand === '1_3' || !yearsBand

  if (/hospitality|bar|hotel|kitchen|restaurant|housekeeping|waiter|waitress|barista/.test(e)) {
    return {
      workNow: [
        role('Hospitality Assistant', 'work_now', 'Hospitality entry using your sector experience'),
        role('Hotel Receptionist', 'work_now', 'Front-of-house role — realistic hospitality Work Now'),
        role('Kitchen Porter', 'work_now', 'Back-of-house hospitality entry with fast hiring'),
      ],
      buildNext: [
        role('Shift Supervisor', 'build_next', 'Build Next — supervisor step in hospitality'),
        role('Front of House Coordinator', 'build_next', 'Build Next — coordination progression in hotels/venues'),
        role('Food Hygiene Certificate', 'build_next', 'Recommended training — supports hospitality progression'),
      ],
      longTerm: [
        role('Hospitality Supervisor', 'long_term', 'Long-term — hospitality team leadership'),
        role('Venue Manager', 'long_term', 'Long-term — venue or hotel management progression'),
      ],
    }
  }

  if (/marketing|digital marketing|social media|communications/.test(e)) {
    if (senior && mostlyUk) {
      return {
        workNow: [
          role('Marketing Coordinator', 'work_now', 'Coordinator level fits your years of marketing experience'),
          role('Marketing Assistant', 'work_now', 'Marketing role using your background'),
          role('Office Administrator', 'work_now', 'Office admin bridge while targeting marketing roles'),
        ],
        buildNext: [
          role('Digital Marketing Certificate', 'build_next', 'Build Next — strengthens marketing applications'),
          role('Google Analytics / social media short course', 'build_next', 'Build Next — practical marketing skills'),
        ],
        longTerm: [
          role('Marketing Manager', 'long_term', 'Long-term — marketing leadership after UK experience'),
          role('Marketing Executive', 'long_term', 'Long-term — experienced marketing career'),
        ],
      }
    }
    return {
      workNow: [
        role('Marketing Assistant', 'work_now', 'Marketing entry using your experience background'),
        role('Marketing Admin Assistant', 'work_now', 'Admin/marketing hybrid — realistic UK entry'),
        role('Customer Service Advisor', 'work_now', 'Service role while building UK marketing references'),
      ],
      buildNext: [
        role('Digital Marketing Certificate', 'build_next', 'Build Next — credential for marketing progression'),
        role('Social media marketing short course', 'build_next', 'Build Next — practical marketing skills'),
      ],
      longTerm: [
        role('Marketing Coordinator', 'long_term', 'Long-term — coordinator after UK marketing experience'),
        role('Marketing Executive', 'long_term', 'Long-term — marketing career progression'),
        role('Marketing Manager', 'long_term', 'Long-term — leadership in marketing'),
      ],
    }
  }

  if (/retail|shop|store|supermarket/.test(e)) {
    if (mostlyUk && senior) {
      return {
        workNow: [
          role('Retail Supervisor', 'work_now', 'Supervisor level matches your years of UK retail experience'),
          role('Team Leader (retail)', 'work_now', 'Leadership route from your retail background'),
          role('Customer Service Advisor', 'work_now', 'Customer service progression from retail'),
        ],
        buildNext: [
          role('Team Leader Training', 'build_next', 'Build Next — formal supervisor skills'),
          role('Customer Service Certification', 'build_next', 'Build Next — strengthens service applications'),
        ],
        longTerm: [
          role('Store Manager', 'long_term', 'Long-term — retail management progression'),
          role('Area Manager', 'long_term', 'Long-term — multi-site retail leadership'),
          role('Retail Operations Manager', 'long_term', 'Long-term — operations career'),
        ],
      }
    }
    if (mostlyUk && junior) {
      return {
        workNow: [
          role('Retail Assistant', 'work_now', 'UK retail entry — appropriate for limited experience so far'),
          role('Customer Service Advisor', 'work_now', 'Service role connected to retail background'),
          role('Stockroom Assistant', 'work_now', 'Back-of-house retail entry'),
        ],
        buildNext: [
          role('Team Leader Training', 'build_next', 'Build Next — supervisor progression after reliability'),
          role('Customer Service Certification', 'build_next', 'Build Next — employability upgrade'),
        ],
        longTerm: [
          role('Retail Supervisor', 'long_term', 'Long-term — supervisor after UK experience'),
          role('Team Leader', 'long_term', 'Long-term — leadership in retail'),
          role('Store Manager', 'long_term', 'Long-term — management progression'),
        ],
      }
    }
    if (mostlyUk) {
      return {
        workNow: [
          role('Retail Supervisor', 'work_now', 'Uses your UK retail experience — realistic next step'),
          role('Customer Service Advisor', 'work_now', 'Customer service progression from retail background'),
          role('Team Leader (retail)', 'work_now', 'Supervisor route when you have UK retail history'),
        ],
        buildNext: [
          role('Team Leader Training', 'build_next', 'Build Next — formal supervisor skills'),
          role('Customer Service Certification', 'build_next', 'Build Next — strengthens service applications'),
        ],
        longTerm: [
          role('Store Manager', 'long_term', 'Long-term — retail management progression'),
          role('Area Manager', 'long_term', 'Long-term — multi-site retail leadership'),
          role('Retail Operations Manager', 'long_term', 'Long-term — operations career'),
        ],
      }
    }
    return {
      workNow: [
        role('Retail Assistant', 'work_now', 'UK-entry bridge — rebuild references in the same sector'),
        role('Customer Service Advisor', 'work_now', 'Service role bridges international retail experience'),
        role('Stockroom Assistant', 'work_now', 'Back-of-house retail entry with lower language pressure'),
      ],
      buildNext: [
        role('UK retail employer references', 'build_next', 'Build Next — local work history for applications'),
        role('Team Leader Training', 'build_next', 'Build Next — progression after UK reliability'),
      ],
      longTerm: [
        role('Retail Supervisor', 'long_term', 'Long-term — supervisor after UK experience'),
        role('Team Leader', 'long_term', 'Long-term — leadership in retail'),
        role('Store Manager', 'long_term', 'Long-term — management progression'),
      ],
    }
  }

  if (/warehouse|logistics|picker|packer|forklift/.test(e)) {
    if (mostlyUk) {
      return {
        workNow: [
          role('Warehouse Operative', 'work_now', 'Matches your warehouse experience in the UK'),
          role('Picker/Packer', 'work_now', 'Distribution work aligned with your background'),
          role('Forklift Operator', 'work_now', 'FLT role if you hold or can obtain a licence'),
        ],
        buildNext: [
          role('Forklift Licence', 'build_next', 'Build Next — FLT for higher warehouse pay'),
          role('Team leader (warehouse)', 'build_next', 'Build Next — supervisor progression'),
        ],
        longTerm: [
          role('Warehouse Supervisor', 'long_term', 'Long-term — site supervision'),
          role('Logistics Coordinator', 'long_term', 'Long-term — logistics office progression'),
        ],
      }
    }
    return {
      workNow: [
        role('Warehouse Operative', 'work_now', 'UK-entry bridge in logistics — same sector'),
        role('Picker/Packer', 'work_now', 'Entry distribution role to gain UK references'),
      ],
      buildNext: [
        role('Forklift Licence', 'build_next', 'Build Next — opens higher-paid warehouse roles'),
        role('UK logistics references', 'build_next', 'Build Next — local employers value UK work history'),
      ],
      longTerm: [
        role('Warehouse Team Leader', 'long_term', 'Long-term — supervision after UK experience'),
        role('Logistics Coordinator', 'long_term', 'Long-term — coordination progression'),
      ],
    }
  }

  if (/care|healthcare|nursing|support worker/.test(e)) {
    return {
      workNow: [
        role('Care Assistant', 'work_now', 'Care sector — builds on your support experience'),
        role('Healthcare Support Worker', 'work_now', 'Healthcare support uses care background'),
      ],
      buildNext: [
        role('Care Certificate', 'build_next', 'Build Next — UK care qualification'),
        role('Moving & Handling training', 'build_next', 'Build Next — required for care roles'),
      ],
      longTerm: [
        role('Senior Care Worker', 'long_term', 'Long-term — experienced care professional'),
        role('Healthcare Coordinator', 'long_term', 'Long-term — care coordination'),
      ],
    }
  }

  if (/driving|driver|delivery|courier|taxi|van driver|hgv/.test(e)) {
    return {
      workNow: [
        role('Delivery Driver', 'work_now', 'Driving experience — realistic UK delivery work'),
        role('Courier', 'work_now', 'Courier roles match your driving background'),
        role('Transport Administrator', 'work_now', 'Office-side transport admin using sector knowledge'),
      ],
      buildNext: [
        role('Delivery Coordinator', 'build_next', 'Build Next — coordination step after driving experience'),
        role('Fleet Administrator', 'build_next', 'Build Next — transport office progression'),
        role('CPC Qualification', 'build_next', 'Recommended training — supports professional driving progression'),
      ],
      longTerm: [
        role('Transport Planner', 'long_term', 'Long-term — planning career in transport'),
        role('Fleet Supervisor', 'long_term', 'Long-term — fleet supervision progression'),
        role('Logistics Coordinator', 'long_term', 'Long-term — logistics coordination career'),
      ],
    }
  }

  if (/admin|office|reception|data entry/.test(e)) {
    return {
      workNow: [
        role('Admin Assistant', 'work_now', 'Office experience transfers to admin roles'),
        role('Office Administrator', 'work_now', mostlyUk ? 'Direct office progression with UK experience' : 'UK office entry bridge'),
        role('Data Entry Clerk', 'work_now', 'Structured office tasks — realistic entry'),
      ],
      buildNext: [
        role('Microsoft Office Certification', 'build_next', 'Build Next — strengthens admin applications'),
        role('Business Administration Certificate', 'build_next', 'Build Next — formal admin pathway'),
      ],
      longTerm: [
        role('Office Manager', 'long_term', 'Long-term — office leadership'),
        role('Operations Coordinator', 'long_term', 'Long-term — operations progression'),
      ],
    }
  }

  if (studyRelated) {
    return {
      workNow: [
        role('Sector Assistant (entry)', 'work_now', 'Bridge role in your experience sector'),
        role('Customer Service Advisor', 'work_now', 'Service bridge while targeting your field'),
      ],
      buildNext: [
        role('UK sector short course', 'build_next', 'Build Next — UK-relevant training'),
        role('Industry certification', 'build_next', 'Build Next — sector credential'),
      ],
      longTerm: [
        role('Specialist in your sector', 'long_term', 'Long-term — progression using transferable experience'),
      ],
    }
  }

  return {
    workNow: [
      role('Customer Service Advisor', 'work_now', 'Transferable people skills from your experience'),
      role('Admin Assistant', 'work_now', 'Office bridge — uses organisational experience'),
      role('Warehouse Operative', 'work_now', 'Practical entry if you need fast UK income'),
    ],
    buildNext: [
      role('Transferable skills CV workshop', 'build_next', 'Build Next — frame experience for UK employers'),
      role('Industry short course', 'build_next', 'Build Next — credential for target sector'),
    ],
    longTerm: [
      role('Team Leader', 'long_term', 'Long-term — leadership after UK reliability'),
      role('Operations Coordinator', 'long_term', 'Long-term — coordination progression'),
    ],
  }
}

function experienceDifferentPack(p: PathwayProfile): Omit<
  PathwayRecommendationResult,
  'pathId' | 'warningNotes' | 'explanationContext'
> {
  const target = p.workPreference ?? ''
  if (target === 'office_computer' || prefersOffice(p)) {
    return {
      workNow: [
        role('Admin Assistant', 'work_now', 'Bridge into office work — uses transferable organisation skills'),
        role('Data Entry Clerk', 'work_now', 'Structured office entry during career change'),
        role('Customer Service Advisor', 'work_now', 'Service bridge — communication from prior roles'),
      ],
      buildNext: [
        role('Microsoft Office Certification', 'build_next', 'Build Next — core office skills for new field'),
        role('Business Administration Certificate', 'build_next', 'Build Next — formal admin pathway'),
      ],
      longTerm: [
        role('Office Administrator', 'long_term', 'Long-term — office career in new field'),
        role('Project Coordinator', 'long_term', 'Long-term — coordination progression'),
      ],
    }
  }
  if (prefersPhysical(p)) {
    return BUCKET_A
  }
  return {
    workNow: [
      role('Customer Service Advisor', 'work_now', 'Bridge role — uses people skills from prior work'),
      role('Admin Assistant', 'work_now', 'Office bridge during field change'),
      role('Retail Assistant', 'work_now', 'Flexible entry while retraining'),
    ],
    buildNext: [
      role('Career change short course', 'build_next', 'Build Next — training for target sector'),
      role('Volunteering in target field', 'build_next', 'Build Next — UK references in new sector'),
    ],
    longTerm: [
      role('Role in your target field', 'long_term', 'Long-term — after bridge experience and training'),
    ],
  }
}

function fastEmploymentPack(
  profile: PathwayProfile
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  const e = (profile.experienceFieldText ?? '').toLowerCase()
  if (/retail|shop|store/.test(e)) {
    return {
      workNow: [
        role('Retail Supervisor', 'work_now', 'Fast entry — retail hires quickly and uses your experience'),
        role('Customer Service Advisor', 'work_now', 'High-volume hiring in customer service'),
        role('Retail Assistant', 'work_now', 'Flexible retail entry if supervisor roles are not immediate'),
      ],
      buildNext: [
        role('Team Leader Training', 'build_next', 'Build Next — quick progression credential'),
        role('Customer Service Certification', 'build_next', 'Build Next — strengthens applications'),
      ],
      longTerm: [
        role('Store Manager', 'long_term', 'Long-term — after proving reliability in UK work'),
        role('Team Leader', 'long_term', 'Long-term — supervision progression'),
      ],
    }
  }
  if (/warehouse|logistics/.test(e)) {
    return {
      workNow: [
        role('Warehouse Operative', 'work_now', 'Warehouse roles hire quickly across the UK'),
        role('Picker/Packer', 'work_now', 'Distribution work — fast entry'),
        role('Warehouse Administrator', 'work_now', 'Admin within logistics — lower barrier than specialist roles'),
      ],
      buildNext: [
        role('Forklift Licence', 'build_next', 'Build Next — quick pay upgrade in logistics'),
        role('Team leader (warehouse)', 'build_next', 'Build Next — supervisor progression'),
      ],
      longTerm: [
        role('Warehouse Supervisor', 'long_term', 'Long-term — logistics leadership'),
        role('Logistics Coordinator', 'long_term', 'Long-term — coordination career'),
      ],
    }
  }
  return {
    workNow: [
      role('Customer Service Advisor', 'work_now', 'High hiring volume — realistic fast UK entry'),
      role('Receptionist', 'work_now', 'Reception hires frequently with basic training'),
      role('Office Assistant', 'work_now', 'Office assistant — quick entry across sectors'),
      role('Retail Assistant', 'work_now', 'Retail remains one of the fastest UK hiring routes'),
    ],
    buildNext: [
      role('Customer Service Certification', 'build_next', 'Build Next — quick employability upgrade'),
      role('Microsoft Office Certification', 'build_next', 'Build Next — office skills for progression'),
    ],
    longTerm: [
      role('Team Leader', 'long_term', 'Long-term — supervision after reliability'),
      role('Office Administrator', 'long_term', 'Long-term — stable office progression'),
      role('Operations Coordinator', 'long_term', 'Long-term — coordination career'),
    ],
  }
}

function generalFallback(p: PathwayProfile): Omit<
  PathwayRecommendationResult,
  'pathId' | 'warningNotes' | 'explanationContext'
> {
  if (prefersPhysical(p)) {
    return {
      workNow: BUCKET_A.workNow.slice(0, 3),
      buildNext: BUCKET_A.buildNext.slice(0, 3),
      longTerm: BUCKET_A.longTerm.slice(0, 2),
    }
  }
  if (prefersCustomer(p) && !isBasicEnglish(p)) {
    return {
      workNow: BUCKET_B.workNow,
      buildNext: BUCKET_B.buildNext.slice(0, 3),
      longTerm: BUCKET_B.longTerm.slice(0, 2),
    }
  }
  if (prefersOffice(p) && hasGoodEnglish(p)) {
    return BUCKET_C
  }
  return {
    workNow: [
      role('Retail Assistant', 'work_now', 'Safe general entry — flexible UK hiring'),
      role('Warehouse Operative', 'work_now', 'Practical entry — often hires quickly'),
      role('Customer Service Assistant', 'work_now', 'Service entry — builds UK work history'),
    ],
    buildNext: [
      role('Customer Service Certification', 'build_next', 'Build Next — employability upgrade'),
      role('Team Leader Training', 'build_next', 'Build Next — progression after reliability'),
    ],
    longTerm: [
      role('Team Leader', 'long_term', 'Long-term — supervision progression'),
      role('Operations Coordinator', 'long_term', 'Long-term — coordination career'),
    ],
  }
}

function mergeBothPaths(
  edu: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'>,
  exp: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'>,
  mode: 'both' | 'not_sure' = 'both'
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  return mergeWeightedDualPaths(edu, exp, mode === 'not_sure' ? 'not_sure' : 'both', {
    experience: 0.5,
    education: 0.5,
  })
}

export function mergeWeightedDualPaths(
  edu: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'>,
  exp: Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'>,
  priority: PathwayProfile['careerDirectionPriority'],
  weights: { experience: number; education: number }
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  const strictBoth = priority === 'both' || priority === 'not_sure'
  const eduWorkSlots = strictBoth ? 2 : weights.education >= 0.5 ? 2 : 1
  const expWorkSlots = strictBoth ? 2 : weights.experience >= 0.5 ? 2 : 1
  const eduBuildSlots = strictBoth ? 1 : weights.education >= 0.5 ? 2 : 1
  const expBuildSlots = strictBoth ? 1 : weights.experience >= 0.5 ? 2 : 1
  const eduLongSlots = strictBoth ? 1 : weights.education >= 0.5 ? 2 : 1
  const expLongSlots = strictBoth ? 1 : weights.experience >= 0.5 ? 2 : 1

  const eduWork = edu.workNow.slice(0, eduWorkSlots).map((r) => tagRoleOrigin(r, 'education'))
  const expWork = exp.workNow.slice(0, expWorkSlots).map((r) => tagRoleOrigin(r, 'experience'))
  const eduBuild = edu.buildNext.slice(0, eduBuildSlots).map((r) => tagRoleOrigin(r, 'education'))
  const expBuild = exp.buildNext.slice(0, expBuildSlots).map((r) => tagRoleOrigin(r, 'experience'))
  const eduLong = edu.longTerm.slice(0, eduLongSlots).map((r) =>
    tagRoleOrigin(r, priority === 'not_sure' ? 'blended' : 'education')
  )
  const expLong = exp.longTerm.slice(0, expLongSlots).map((r) => tagRoleOrigin(r, 'experience'))

  const balanceWorkNow = (): PathwayRole[] => {
    if (!strictBoth) {
      return dedupePathwayRoles([...expWork, ...eduWork]).slice(0, 3)
    }
    const out: PathwayRole[] = []
    if (expWork[0]) out.push(expWork[0])
    if (eduWork[0]) out.push(eduWork[0])
    for (const r of [...expWork.slice(1), ...eduWork.slice(1)]) {
      if (out.length >= 3) break
      if (out.some((x) => x.title.toLowerCase() === r.title.toLowerCase())) continue
      out.push(r)
    }
    return out.slice(0, 3)
  }

  const balanceBuildNext = (): PathwayRole[] => {
    if (!strictBoth) {
      return dedupePathwayRoles([...eduBuild, ...expBuild]).slice(0, 2)
    }
    const out: PathwayRole[] = []
    if (eduBuild[0]) out.push(eduBuild[0])
    if (expBuild[0]) out.push(expBuild[0])
    return out.slice(0, 2)
  }

  const balanceLongTerm = (): PathwayRole[] => {
    if (!strictBoth) {
      return dedupePathwayRoles([...eduLong, ...expLong]).slice(0, 2)
    }
    const out: PathwayRole[] = []
    if (eduLong[0]) out.push(eduLong[0])
    if (expLong[0]) out.push(expLong[0])
    return out.slice(0, 2)
  }

  return {
    workNow: balanceWorkNow(),
    buildNext: balanceBuildNext(),
    longTerm: balanceLongTerm(),
  }
}

export function buildEducationPathRoles(
  profile: PathwayProfile
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  return educationFieldPack(profile.studyFieldSlug, profile.studyFieldText)
}

export function buildExperiencePathRoles(
  profile: PathwayProfile
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  return experienceSectorPack(
    profile.experienceFieldText ?? '',
    profile.experienceCountry,
    false,
    profile.experienceYearsBand
  )
}

export function resolvePathwayId(profile: PathwayProfile): PathwayId {
  if (profile.userGoal === 'first_job' && wantsStudyField(profile) && !profile.experienceLevel) {
    return 'EDUCATION_FIELD_PATH'
  }

  if (profile.careerDirectionPriority === 'fast_employment') {
    return 'FAST_EMPLOYMENT'
  }

  if (profile.careerDirectionPriority === 'education_field' && wantsStudyField(profile)) {
    return 'EDUCATION_FIELD_PATH'
  }

  if (profile.careerDirectionPriority === 'experience_field' && profile.experienceLevel === 'have_experience') {
    if (profile.experienceFieldIntent === 'no' || profile.wantsCareerChange) {
      return 'EXPERIENCE_DIFFERENT_FIELD'
    }
    return 'EXPERIENCE_SAME_FIELD'
  }

  if (wantsBothPaths(profile)) {
    return 'EDUCATION_EXPERIENCE_BOTH'
  }

  if (wantsStudyField(profile) && profile.experienceLevel !== 'have_experience') {
    return 'EDUCATION_FIELD_PATH'
  }

  if (wantsStudyField(profile) && !wantsExperienceField(profile)) {
    return 'EDUCATION_FIELD_PATH'
  }

  if (profile.experienceLevel === 'have_experience') {
    const continueSame =
      profile.continueInExperienceField ||
      wantsExperienceField(profile) ||
      (profile.experienceFieldRelation ?? '').includes('study_related') ||
      (profile.experienceFieldRelation ?? '').includes('both_fields')

    if (
      (profile.wantsCareerChange || profile.experienceFieldIntent === 'no') &&
      !profile.continueInExperienceField
    ) {
      if (wantsStudyField(profile)) return 'EDUCATION_FIELD_PATH'
      return 'EXPERIENCE_DIFFERENT_FIELD'
    }
    if (continueSame) {
      return 'EXPERIENCE_SAME_FIELD'
    }
    const rel = profile.experienceFieldRelation ?? ''
    if (rel.includes('different_field') && !rel.includes('both_fields')) {
      return 'EXPERIENCE_DIFFERENT_FIELD'
    }
  }

  const noExp = profile.experienceLevel !== 'have_experience'
  const lowQual = isLowQualification(profile.educationLevel)

  if (noExp && (lowQual || isPostSecondaryEducation(profile.educationLevel) === false)) {
    if (prefersPhysical(profile) && !prefersOffice(profile)) {
      return 'NO_EXPERIENCE_PHYSICAL'
    }
    if (prefersCustomer(profile) && !isBasicEnglish(profile) && profile.customerComfort !== 'no') {
      return 'NO_EXPERIENCE_CUSTOMER'
    }
    if (prefersOffice(profile) && hasGoodEnglish(profile) && !prefersPhysical(profile)) {
      return 'NO_EXPERIENCE_OFFICE'
    }
    if (isBasicEnglish(profile) || prefersPhysical(profile)) {
      return 'NO_EXPERIENCE_PHYSICAL'
    }
  }

  if (noExp && prefersPhysical(profile)) return 'NO_EXPERIENCE_PHYSICAL'
  if (noExp && prefersCustomer(profile) && hasGoodEnglish(profile)) return 'NO_EXPERIENCE_CUSTOMER'
  if (noExp && prefersOffice(profile) && hasGoodEnglish(profile)) return 'NO_EXPERIENCE_OFFICE'

  if (wantsStudyField(profile)) return 'EDUCATION_FIELD_PATH'

  return 'GENERAL_FALLBACK'
}

function buildBucket(
  pathId: PathwayId,
  profile: PathwayProfile
): Omit<PathwayRecommendationResult, 'pathId' | 'warningNotes' | 'explanationContext'> {
  switch (pathId) {
    case 'NO_EXPERIENCE_PHYSICAL':
      return BUCKET_A
    case 'NO_EXPERIENCE_CUSTOMER':
      return BUCKET_B
    case 'NO_EXPERIENCE_OFFICE':
      return BUCKET_C
    case 'EDUCATION_FIELD_PATH':
      return educationFieldPack(profile.studyFieldSlug, profile.studyFieldText)
    case 'EXPERIENCE_SAME_FIELD':
      return experienceSectorPack(
        profile.experienceFieldText ?? '',
        profile.experienceCountry,
        true,
        profile.experienceYearsBand
      )
    case 'EXPERIENCE_DIFFERENT_FIELD':
      return experienceDifferentPack(profile)
    case 'EDUCATION_EXPERIENCE_BOTH': {
      const blend = blendEducationExperiencePack(profile)
      if (blend) {
        return {
          workNow: blend.workNow.map((r) => tagRoleOrigin(r, r.origin ?? 'blended')),
          buildNext: blend.buildNext.map((r) => tagRoleOrigin(r, r.origin ?? 'blended')),
          longTerm: blend.longTerm.map((r) => tagRoleOrigin(r, 'blended')),
        }
      }
      const edu = educationFieldPack(profile.studyFieldSlug, profile.studyFieldText)
      const exp = experienceSectorPack(
        profile.experienceFieldText ?? '',
        profile.experienceCountry,
        false,
        profile.experienceYearsBand
      )
      const mode = profile.careerDirectionPriority === 'not_sure' ? 'not_sure' : 'both'
      return mergeBothPaths(edu, exp, mode)
    }
    case 'FAST_EMPLOYMENT':
      return fastEmploymentPack(profile)
    case 'GENERAL_FALLBACK':
    default:
      return generalFallback(profile)
  }
}

export function applyPathwayHardConstraints(
  result: PathwayRecommendationResult,
  profile: PathwayProfile
): PathwayRecommendationResult {
  const warnings = [...result.warningNotes]
  const allowOffice =
    prefersOffice(profile) ||
    profile.workPreference === 'customer_facing' ||
    profile.workPreference === 'office_computer'
  const allowCustomer = prefersCustomer(profile) && profile.customerComfort !== 'no'
  const blockOffice = prefersPhysical(profile) && !allowOffice

  const filterRole = (r: PathwayRole): boolean => {
    const t = r.title
    if (!profile.hasDrivingLicence && DRIVER_PATTERN.test(t) && r.track === 'work_now') {
      warnings.push(`Removed "${t}" — no driving licence for Work Now`)
      return false
    }
    if (isBasicEnglish(profile) && HEAVY_CUSTOMER_PATTERN.test(t) && r.track === 'work_now') {
      warnings.push(`Deprioritised "${t}" — basic English limits customer-facing Work Now`)
      return false
    }
    if (blockOffice && OFFICE_WORK_NOW_PATTERN.test(t) && r.track === 'work_now') {
      warnings.push(`Removed "${t}" — physical/practical preference selected, not office work`)
      return false
    }
    if (!allowCustomer && HEAVY_CUSTOMER_PATTERN.test(t) && r.track === 'work_now' && profile.customerComfort === 'no') {
      return false
    }
    return true
  }

  let workNow = result.workNow.filter(filterRole)
  const buildNext = result.buildNext.filter(filterRole)
  const longTerm = result.longTerm.filter(filterRole)

  if (workNow.length === 0) {
    const fallback = prefersPhysical(profile)
      ? BUCKET_A.workNow
      : prefersCustomer(profile) && !isBasicEnglish(profile)
        ? BUCKET_B.workNow
        : BUCKET_A.workNow.slice(0, 3)
    workNow = fallback.filter(filterRole)
    warnings.push('Work Now list rebuilt after applying hard constraints')
  }

  return {
    ...result,
    workNow,
    buildNext,
    longTerm,
    warningNotes: [...new Set(warnings)],
  }
}

export function getCareerRecommendations(answers: PathwayAnswers): PathwayRecommendationResult {
  const profile = buildPathwayProfile(answers)
  const pathId = resolvePathwayId(profile)
  const bucket = buildBucket(pathId, profile)

  const explanationContext: string[] = [
    `Pathway: ${pathId}`,
    `Experience: ${profile.experienceLevel ?? 'unknown'}`,
    `Education: ${profile.educationLevel ?? 'unknown'}`,
  ]
  if (profile.studyFieldSlug) explanationContext.push(`Study field: ${profile.studyFieldSlug}`)
  if (profile.workPreference) explanationContext.push(`Work preference: ${profile.workPreference}`)
  if (profile.englishLevel) explanationContext.push(`English: ${profile.englishLevel}`)
  if (profile.experienceFieldText) explanationContext.push(`Experience field: ${profile.experienceFieldText}`)

  const warningNotes: string[] = []
  if (isBasicEnglish(profile)) {
    warningNotes.push('Basic English — prioritising lower-language-pressure Work Now roles')
  }
  if (!profile.hasDrivingLicence) {
    warningNotes.push('No driving licence — driver/delivery/HGV roles excluded from Work Now')
  }
  if (prefersPhysical(profile)) {
    warningNotes.push('Physical/practical preference — office/admin Work Now roles excluded unless also selected')
  }

  const raw: PathwayRecommendationResult = {
    pathId,
    workNow: bucket.workNow,
    buildNext: bucket.buildNext,
    longTerm: bucket.longTerm,
    warningNotes,
    explanationContext,
  }

  const constrained = applyPathwayHardConstraints(raw, profile)
  return applyPathConsistencyFilter(constrained, profile)
}

function applyPathConsistencyFilter(
  result: PathwayRecommendationResult,
  profile: PathwayProfile
): PathwayRecommendationResult {
  const workNow = filterRolesForPathConsistency(result.workNow, profile)
  const buildNext = filterRolesForPathConsistency(result.buildNext, profile)
  const longTerm = filterRolesForPathConsistency(result.longTerm, profile)

  const ensureMinimum = (
    filtered: PathwayRole[],
    source: PathwayRole[],
    min: number
  ): PathwayRole[] => {
    if (filtered.length >= min) return filtered
    const out = [...filtered]
    for (const r of source) {
      if (out.length >= min) break
      if (!out.some((x) => x.title.toLowerCase() === r.title.toLowerCase())) out.push(r)
    }
    return out
  }

  return {
    ...result,
    workNow: ensureDualPathTrackBalance(
      ensureMinimum(workNow, result.workNow, 2),
      result.workNow,
      profile,
      'work_now',
      3
    ),
    buildNext: ensureDualPathTrackBalance(
      ensureMinimum(buildNext, result.buildNext, 2),
      result.buildNext,
      profile,
      'build_next',
      2
    ),
    longTerm: ensureDualPathTrackBalance(
      ensureMinimum(longTerm, result.longTerm, 2),
      result.longTerm,
      profile,
      'long_term',
      2
    ),
  }
}

function domainForPath(pathId: PathwayId, studySlug: string | null): CareerDomain {
  const s = (studySlug ?? '').toLowerCase()
  if (pathId === 'NO_EXPERIENCE_PHYSICAL') return 'retail_customer_service'
  if (pathId === 'NO_EXPERIENCE_OFFICE') return 'admin_business'
  if (s.includes('it_computing')) return 'IT_digital'
  if (s.includes('science')) return 'no_experience_general'
  if (s.includes('arts') || s.includes('media')) return 'creative_media'
  if (s.includes('healthcare')) return 'healthcare'
  if (s.includes('business')) return 'admin_business'
  return 'no_experience_general'
}

export function pathwayToCareerBrainRecommendations(
  result: PathwayRecommendationResult,
  profile?: CareerProfile,
  studySlug?: string | null,
  pathwayProfile?: PathwayProfile
): CareerBrainRecommendation[] {
  const domain = profile?.domain ?? domainForPath(result.pathId, studySlug ?? null)
  const priority = pathwayProfile?.careerDirectionPriority
  const map = (r: PathwayRole): CareerBrainRecommendation => ({
    title: r.title,
    why: r.why,
    track: r.track,
    field_tag: domain,
    domain,
    source: 'fallback',
    pathOrigin:
      r.origin ??
      (priority === 'education_field'
        ? 'education'
        : priority === 'experience_field'
          ? 'experience'
          : undefined),
    fieldSource:
      r.origin === 'education'
        ? 'education'
        : r.origin === 'experience'
          ? 'experience'
          : r.origin === 'blended'
            ? 'mixed'
            : priority === 'education_field'
              ? 'education'
              : priority === 'experience_field'
                ? 'experience'
                : priority === 'both' || priority === 'not_sure'
                  ? 'mixed'
                  : 'fallback',
  })
  const seen = new Set<string>()
  const out: CareerBrainRecommendation[] = []
  for (const r of [...result.workNow, ...result.buildNext, ...result.longTerm]) {
    const key = `${r.track}:${r.title.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(map(r))
  }
  return out
}

/** True when specialised legacy packs (dual path, bridge, animation, etc.) should run instead. */
export function shouldDelegateToLegacyRecommendations(
  profile: CareerProfile,
  answers: PathwayAnswers,
  state?: CareerBrainState
): boolean {
  const s: CareerBrainState = state ?? { answers }
  const { wantsDualPathMode } = require('./dualPathMode') as typeof import('./dualPathMode')
  const { wantsFlexibleEmploymentMode } = require('./flexibleEmploymentMode') as typeof import('./flexibleEmploymentMode')
  const { wantsBridgeRoleDiscovery } = require('./bridgeRoleIntelligence') as typeof import('./bridgeRoleIntelligence')

  if (wantsFlexibleEmploymentMode(profile, s)) return true
  if (wantsDualPathMode(profile, s)) return true
  if (profile.constraints.includes('student') && wantsBridgeRoleDiscovery(profile, s)) return true
  if (
    str(answers, 'cb_entry_situation') === 'exploring' &&
    str(answers, 'cb_cert_openness') === 'yes' &&
    str(answers, 'cb_experience_level') === 'no_experience'
  ) {
    return true
  }

  if (profile.constraints.includes('student') && profile.domain === 'animation_design') {
    if (str(answers, 'cb_field_alignment') !== 'no') return true
  }
  if (
    (profile.domain === 'animation_design' || profile.domain === 'creative_media') &&
    profile.wantsSameField === true &&
    !str(answers, 'cb_field_alignment').includes('no')
  ) {
    return true
  }
  return false
}

export function getDeterministicCareerRecommendations(
  answers: PathwayAnswers,
  profile?: CareerProfile,
  state?: CareerBrainState
): { result: PathwayRecommendationResult; recommendations: CareerBrainRecommendation[]; reason: string; extraConstraints?: string[] } | null {
  if (profile && shouldDelegateToLegacyRecommendations(profile, answers, state)) {
    return null
  }

  const pathway = getCareerRecommendations(answers)
  if (pathway.pathId === 'LEGACY_DELEGATE') {
    return null
  }

  const pathwayProfile = buildPathwayProfile(answers)
  const recommendations = pathwayToCareerBrainRecommendations(
    pathway,
    profile,
    pathwayProfile.studyFieldSlug,
    pathwayProfile
  )

  const extraConstraints: string[] = ['pathway-deterministic-locked']
  if (pathway.pathId === 'NO_EXPERIENCE_PHYSICAL') extraConstraints.push('physical-work')
  if (pathway.pathId === 'NO_EXPERIENCE_OFFICE') extraConstraints.push('non-physical')
  if (pathway.pathId === 'NO_EXPERIENCE_CUSTOMER') extraConstraints.push('customer-facing-pref')

  return {
    result: pathway,
    recommendations,
    reason: `Deterministic pathway: ${pathway.pathId}`,
    extraConstraints,
  }
}
