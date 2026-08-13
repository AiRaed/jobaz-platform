/**
 * Work in My Profession — gap / licence course catalog (recommendation types).
 * Used for result training cards + admin "Generate missing Profession course types".
 */

export const WIP_GOAL = 'work_in_profession' as const
export const WIP_GENERATED_SOURCE = 'generated_from_work_in_profession_course_gap' as const

export type WipCourseGroup =
  | 'required_licence'
  | 'recommended_next'
  | 'useful_boosters'
  | 'check_only'

export type WipGapCourseType = {
  title: string
  group: WipCourseGroup
  purpose: string
  priority: number
  /** Match specialism slug or name (case-insensitive substring). Empty = all specialisms in field. */
  specialismHints?: string[]
  /** Match experience option id fragments, e.g. sec_no_sia, care_assistant. */
  experienceHints?: string[]
  notes?: string
  /** DBS-style checks — shown as check, not a course product. */
  isCheckNotCourse?: boolean
}

export type WipGapCatalogPack = {
  id: string
  fieldSlug: string
  fieldLabels: string[]
  courses: WipGapCourseType[]
}

function c(
  title: string,
  group: WipCourseGroup,
  purpose: string,
  priority: number,
  extra?: Partial<WipGapCourseType>
): WipGapCourseType {
  return { title, group, purpose, priority, ...extra }
}

export const WIP_GAP_COURSE_CATALOG: WipGapCatalogPack[] = [
  {
    id: 'security-facilities',
    fieldSlug: 'security-facilities',
    fieldLabels: ['Security & Facilities', 'Security', 'Facilities'],
    courses: [
      c('SIA Door Supervisor', 'required_licence', 'licence', 95, {
        specialismHints: ['door', 'facilities', 'security-supervisor'],
        experienceHints: ['sec_no_sia', 'sec_steward', 'sec_sia_door', 'helper', 'beginner'],
      }),
      c('SIA Security Guard', 'required_licence', 'licence', 90, {
        specialismHints: ['door', 'facilities', 'retail'],
        experienceHints: ['sec_no_sia', 'sec_steward'],
      }),
      c('Event Stewarding / Matchday Stewarding', 'recommended_next', 'skill', 85, {
        specialismHints: ['door', 'event'],
        experienceHints: ['sec_no_sia', 'sec_steward'],
      }),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 70, {
        experienceHints: ['sec_no_sia', 'sec_steward', 'sec_sia_door'],
      }),
      c('SIA CCTV Operator', 'required_licence', 'licence', 94, {
        specialismHints: ['cctv', 'control'],
        experienceHints: ['sec_cctv', 'cctv'],
      }),
      c('SIA Public Space Surveillance (CCTV)', 'recommended_next', 'licence', 88, {
        specialismHints: ['cctv', 'control'],
      }),
    ],
  },
  {
    id: 'care-support',
    fieldSlug: 'care-support',
    fieldLabels: ['Care & Support', 'Care', 'Social Care'],
    courses: [
      c('Care Certificate', 'recommended_next', 'skill', 92),
      c('Safeguarding Adults', 'recommended_next', 'skill', 90),
      c('Moving & Handling', 'recommended_next', 'skill', 88),
      c('Medication Handling', 'useful_boosters', 'skill', 80, {
        specialismHints: ['adult', 'care-assistant', 'senior', 'home'],
      }),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 72),
      c('DBS check', 'check_only', 'check', 95, { isCheckNotCourse: true }),
    ],
  },
  {
    id: 'construction-trades',
    fieldSlug: 'construction-trades',
    fieldLabels: ['Construction & Skilled Trades', 'Construction'],
    courses: [
      c('CSCS Green Card / Level 1 Health & Safety in Construction', 'required_licence', 'licence', 94),
      c('Manual Handling', 'recommended_next', 'skill', 82),
      c('Asbestos Awareness', 'recommended_next', 'skill', 80),
      c('Working at Height', 'useful_boosters', 'skill', 75),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 65),
    ],
  },
  {
    id: 'electrical-technical',
    fieldSlug: 'electrical-technical',
    fieldLabels: ['Electrical & Technical Trades', 'Electrical'],
    courses: [
      c('18th Edition Wiring Regulations', 'useful_boosters', 'professional', 88, {
        specialismHints: ['electrician', 'improver', 'maintenance'],
        notes: 'Professional booster — does not alone make you a fully qualified electrician.',
      }),
      c('PAT Testing', 'recommended_next', 'skill', 86, {
        specialismHints: ['pat', 'electrician', 'improver'],
      }),
      c('Electrical Safety', 'recommended_next', 'skill', 84),
      c('Fire Alarm / Low Voltage Training', 'useful_boosters', 'skill', 78, {
        specialismHints: ['fire', 'lv', 'alarm'],
      }),
      c('CSCS / ECS Card', 'useful_boosters', 'licence', 70, {
        notes: 'Site access where relevant — not a substitute for trade qualification.',
      }),
    ],
  },
  {
    id: 'plumbing-heating',
    fieldSlug: 'plumbing-heating',
    fieldLabels: ['Plumbing / Heating', 'Plumbing'],
    courses: [
      c('Plumbing Basics / Maintenance Plumbing', 'recommended_next', 'skill', 86),
      c('Water Regulations', 'useful_boosters', 'professional', 78),
      c('CSCS Card', 'useful_boosters', 'licence', 70),
      c('Gas Safe pathway awareness', 'useful_boosters', 'professional', 65, {
        notes: 'Regulated pathway — not a simple short course to claim Gas Safe status.',
        specialismHints: ['heating', 'gas'],
      }),
    ],
  },
  {
    id: 'warehouse-logistics',
    fieldSlug: 'warehouse-logistics',
    fieldLabels: ['Warehouse & Logistics', 'Warehouse', 'Logistics'],
    courses: [
      c('Forklift Counterbalance', 'required_licence', 'licence', 94, {
        specialismHints: ['forklift', 'flt', 'warehouse'],
      }),
      c('Forklift Reach Truck', 'recommended_next', 'licence', 88, {
        specialismHints: ['forklift', 'flt'],
      }),
      c('Manual Handling', 'recommended_next', 'skill', 84),
      c('Health & Safety at Work', 'recommended_next', 'skill', 80),
      c('Warehouse Safety', 'recommended_next', 'skill', 82),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 65),
    ],
  },
  {
    id: 'driving-transport',
    fieldSlug: 'driving-transport',
    fieldLabels: ['Driving & Transport', 'Transport', 'Driving'],
    courses: [
      c('PHV / Taxi licensing support', 'recommended_next', 'licence', 88, {
        specialismHints: ['taxi', 'phv'],
      }),
      c('PCV licence training', 'required_licence', 'licence', 94, {
        specialismHints: ['bus', 'pcv'],
        notes: 'Passenger-carrying vehicle licence pathway for Bus / PCV routes',
      }),
      c('Driver CPC (passenger transport)', 'recommended_next', 'licence', 90, {
        specialismHints: ['bus', 'pcv'],
      }),
      c('Tachograph / driver hours awareness', 'recommended_next', 'skill', 82, {
        specialismHints: ['bus', 'pcv', 'hgv', 'lgv'],
      }),
      c('Customer Service for Drivers', 'recommended_next', 'skill', 78, {
        specialismHints: ['bus', 'pcv', 'taxi', 'phv', 'train', 'delivery', 'van'],
      }),
      c('Safeguarding / passenger support', 'useful_boosters', 'skill', 74, {
        specialismHints: ['bus', 'pcv', 'taxi', 'phv'],
      }),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 68, {
        specialismHints: ['bus', 'pcv', 'taxi', 'phv', 'hgv', 'lgv', 'delivery', 'van'],
      }),
      c('English for Work', 'useful_boosters', 'skill', 60, {
        specialismHints: ['bus', 'pcv', 'delivery', 'van', 'taxi', 'phv'],
        notes: 'Optional if English for workplace communication needs strengthening',
      }),
      c('HGV / LGV licence training', 'required_licence', 'licence', 94, {
        specialismHints: ['hgv', 'lgv'],
        notes: 'Goods vehicle licence pathway — not for Bus / PCV',
      }),
      c('Driver CPC (goods transport)', 'recommended_next', 'licence', 90, {
        specialismHints: ['hgv', 'lgv'],
      }),
      c('ADR dangerous goods (optional)', 'useful_boosters', 'licence', 68, {
        specialismHints: ['hgv', 'lgv'],
        notes: 'Optional upgrade only for dangerous goods routes',
      }),
      c('HIAB / lorry loader (optional)', 'useful_boosters', 'licence', 66, {
        specialismHints: ['hgv', 'lgv'],
        notes: 'Optional upgrade only for crane / loading routes',
      }),
      c('Delivery Driver Safety', 'useful_boosters', 'skill', 70, {
        specialismHints: ['delivery', 'van', 'courier'],
      }),
      c('Transport Admin Basics', 'recommended_next', 'skill', 78, {
        specialismHints: ['transport-admin', 'admin', 'coordinator'],
      }),
      c('Microsoft Office', 'recommended_next', 'skill', 76, {
        specialismHints: ['transport-admin', 'admin', 'coordinator'],
      }),
      c('Rail industry awareness', 'recommended_next', 'knowledge_area', 72, {
        specialismHints: ['train'],
        notes: 'Preparation only — not a shortcut to becoming a train driver',
      }),
      c('Mechanical comprehension basics', 'recommended_next', 'skill', 74, {
        specialismHints: ['train'],
      }),
      c('Safety-critical awareness', 'recommended_next', 'skill', 76, {
        specialismHints: ['train'],
      }),
      c('Assessment test preparation', 'recommended_next', 'career_preparation', 78, {
        specialismHints: ['train'],
      }),
      c('Attention / concentration practice', 'useful_boosters', 'skill', 70, {
        specialismHints: ['train'],
      }),
    ],
  },
  {
    id: 'hospitality',
    fieldSlug: 'hospitality',
    fieldLabels: ['Hospitality'],
    courses: [
      c('Food Safety Level 2', 'required_licence', 'licence', 92, {
        specialismHints: ['kitchen', 'chef', 'cook', 'bar'],
      }),
      c('Food Hygiene', 'recommended_next', 'skill', 88, {
        specialismHints: ['kitchen', 'chef', 'cook'],
      }),
      c('Allergy Awareness', 'recommended_next', 'skill', 84, {
        specialismHints: ['kitchen', 'chef', 'front', 'bar'],
      }),
      c('Customer Service', 'useful_boosters', 'booster', 72),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 62),
      c('Fire Marshal', 'useful_boosters', 'booster', 55),
    ],
  },
  {
    id: 'cleaning-facilities',
    fieldSlug: 'cleaning-facilities',
    fieldLabels: ['Cleaning & Facilities', 'Cleaning'],
    courses: [
      c('COSHH', 'recommended_next', 'skill', 88),
      c('Health & Safety at Work', 'recommended_next', 'skill', 84),
      c('Cleaning Safety', 'recommended_next', 'skill', 82),
      c('Manual Handling', 'useful_boosters', 'skill', 75),
      c('Infection Control', 'useful_boosters', 'skill', 78, {
        specialismHints: ['hospital', 'care', 'deep', 'commercial'],
      }),
    ],
  },
  {
    id: 'retail-sales',
    fieldSlug: 'retail-sales',
    fieldLabels: ['Retail & Sales', 'Retail'],
    courses: [
      c('Customer Service', 'recommended_next', 'skill', 86),
      c('Retail Skills', 'recommended_next', 'skill', 84),
      c('Food Safety Level 2', 'useful_boosters', 'licence', 70, {
        specialismHints: ['food', 'cafe', 'bakery'],
      }),
      c('Sales & Communication', 'useful_boosters', 'booster', 72),
      c('Emergency First Aid at Work', 'useful_boosters', 'booster', 55),
    ],
  },
  {
    id: 'office-admin',
    fieldSlug: 'office-admin',
    fieldLabels: ['Office & Administration', 'Admin', 'Office'],
    courses: [
      c('Microsoft Office', 'recommended_next', 'skill', 86),
      c('Excel', 'recommended_next', 'skill', 84),
      c('Admin Skills', 'recommended_next', 'skill', 82),
      c('Customer Service', 'useful_boosters', 'booster', 72),
      c('Business Communication', 'useful_boosters', 'booster', 70),
    ],
  },
  {
    id: 'customer-service',
    fieldSlug: 'customer-service',
    fieldLabels: ['Customer Service & Call Centre', 'Customer Service'],
    courses: [
      c('Customer Service', 'recommended_next', 'skill', 90),
      c('Complaint Handling', 'recommended_next', 'skill', 86),
      c('Call Centre Skills', 'recommended_next', 'skill', 84, {
        specialismHints: ['call', 'handler', 'live'],
      }),
      c('Digital Communication', 'useful_boosters', 'booster', 72),
    ],
  },
  {
    id: 'manufacturing-engineering',
    fieldSlug: 'manufacturing-engineering',
    fieldLabels: ['Manufacturing & Engineering Support', 'Manufacturing'],
    courses: [
      c('Health & Safety at Work', 'recommended_next', 'skill', 86),
      c('Manual Handling', 'recommended_next', 'skill', 82),
      c('COSHH', 'recommended_next', 'skill', 80),
      c('Quality Control Basics', 'useful_boosters', 'skill', 78),
      c('Forklift Counterbalance', 'useful_boosters', 'licence', 70, {
        specialismHints: ['warehouse', 'production', 'machine'],
      }),
    ],
  },
  {
    id: 'digital-it-support',
    fieldSlug: 'digital-it-support',
    fieldLabels: ['Digital & IT Support', 'IT Support', 'Digital'],
    courses: [
      c('IT Support Basics', 'recommended_next', 'skill', 88),
      c('CompTIA A+ style IT Support', 'recommended_next', 'skill', 84),
      c('Microsoft Office', 'useful_boosters', 'booster', 72),
      c('Cyber Security Basics', 'useful_boosters', 'skill', 78),
      c('QA Testing Basics', 'useful_boosters', 'skill', 76, {
        specialismHints: ['qa', 'tester', 'developer'],
      }),
      c('Portfolio / GitHub for Junior Developers', 'useful_boosters', 'booster', 74, {
        specialismHints: ['developer', 'junior', 'web'],
      }),
    ],
  },
  {
    id: 'creative-design',
    fieldSlug: 'creative-design',
    fieldLabels: ['Creative & Design Practical', 'Creative', 'Design'],
    courses: [
      c('Portfolio Building', 'recommended_next', 'skill', 90),
      c('Adobe Photoshop', 'recommended_next', 'skill', 84, {
        specialismHints: ['graphic', 'design', 'photo'],
      }),
      c('Adobe Premiere / Video Editing', 'recommended_next', 'skill', 82, {
        specialismHints: ['video', 'animation', 'photo'],
      }),
      c('UX/UI Basics', 'useful_boosters', 'skill', 76, {
        specialismHints: ['graphic', 'design', 'digital'],
      }),
      c('Social Media Content', 'useful_boosters', 'booster', 78, {
        specialismHints: ['social', 'content'],
      }),
      c('Digital Marketing', 'useful_boosters', 'booster', 70),
    ],
  },
  {
    id: 'beauty-personal',
    fieldSlug: 'beauty-personal',
    fieldLabels: ['Beauty & Personal Services', 'Beauty', 'Barber'],
    courses: [
      c('Barbering', 'recommended_next', 'skill', 88, { specialismHints: ['barber'] }),
      c('Hairdressing', 'recommended_next', 'skill', 88, { specialismHints: ['hair'] }),
      c('Nail Technician', 'recommended_next', 'skill', 86, { specialismHints: ['nail'] }),
      c('Beauty Therapy', 'recommended_next', 'skill', 86, { specialismHints: ['beauty', 'makeup'] }),
      c('Hygiene for Beauty Professionals', 'useful_boosters', 'skill', 74),
      c('Self-employed Basics for Beauty', 'useful_boosters', 'booster', 70),
    ],
  },
  {
    id: 'childcare-education-support',
    fieldSlug: 'childcare-education-support',
    fieldLabels: ['Childcare & Education Support', 'Childcare', 'Teaching Assistant'],
    courses: [
      c('Safeguarding Children', 'required_licence', 'skill', 94),
      c('Teaching Assistant Level 2', 'recommended_next', 'skill', 88, {
        specialismHints: ['teaching', 'ta', 'sen'],
      }),
      c('Teaching Assistant Level 3', 'useful_boosters', 'skill', 80, {
        specialismHints: ['teaching', 'ta'],
      }),
      c('SEN / Autism Awareness', 'recommended_next', 'skill', 84, {
        specialismHints: ['sen', 'teaching', 'nursery'],
      }),
      c('Paediatric First Aid', 'recommended_next', 'skill', 86),
      c('Early Years / Childcare', 'recommended_next', 'skill', 82, {
        specialismHints: ['nursery', 'childcare', 'early'],
      }),
      c('DBS check', 'check_only', 'check', 95, { isCheckNotCourse: true }),
    ],
  },
  {
    id: 'self-employment-local',
    fieldSlug: 'self-employment-local',
    fieldLabels: ['Self Employment / Local Services', 'Self-employed'],
    courses: [
      c('Self-employed Basics', 'recommended_next', 'skill', 90),
      c('Insurance / Invoicing / Tax Basics', 'recommended_next', 'skill', 86),
      c('Customer Service', 'useful_boosters', 'booster', 74),
      c('Marketing for Local Services', 'useful_boosters', 'booster', 76),
      c('Health & Safety at Work', 'useful_boosters', 'skill', 70),
    ],
  },
]

export function findWipCatalogPack(fieldSlug: string): WipGapCatalogPack | null {
  return WIP_GAP_COURSE_CATALOG.find((p) => p.fieldSlug === fieldSlug) ?? null
}

export function allWipCatalogCourseTitles(): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const pack of WIP_GAP_COURSE_CATALOG) {
    for (const course of pack.courses) {
      if (course.isCheckNotCourse) continue
      const key = course.title.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(course.title)
    }
  }
  return out
}

export function courseMatchesHints(
  course: WipGapCourseType,
  specialismSlug: string,
  specialismName: string,
  experienceOptionId?: string | null
): boolean {
  const specBlob = `${specialismSlug} ${specialismName}`.toLowerCase()
  if (course.specialismHints?.length) {
    const ok = course.specialismHints.some((h) => specBlob.includes(h.toLowerCase()))
    if (!ok) return false
  }
  if (course.experienceHints?.length && experienceOptionId) {
    const exp = experienceOptionId.toLowerCase()
    const ok = course.experienceHints.some((h) => exp.includes(h.toLowerCase()))
    // If hints exist but none match, still allow unless hints are exclusive security/care gates
    // Prefer: if any experienceHints, require match when experience is known
    if (!ok) return false
  }
  return true
}
