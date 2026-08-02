/**
 * Education field → specialisation options (Career Brain v2).
 * Step 1: broad field. Step 2: profession-specific specialisation.
 */

import type { EducationFieldId } from './types'

export type EducationSpecialisationOption = {
  value: string
  label: string
  allowFreeText?: boolean
}

export const EDUCATION_SPECIALISATIONS: Record<EducationFieldId, EducationSpecialisationOption[]> = {
  healthcare: [
    { value: 'registered_nurse', label: 'Registered Nurse' },
    { value: 'doctor_physician', label: 'Doctor / Physician' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'physiotherapist', label: 'Physiotherapist' },
    { value: 'occupational_therapist', label: 'Occupational Therapist' },
    { value: 'radiographer', label: 'Radiographer' },
    { value: 'biomedical_scientist', label: 'Biomedical Scientist' },
    { value: 'midwife', label: 'Midwife' },
    { value: 'laboratory_scientist', label: 'Laboratory Scientist' },
    { value: 'paramedic', label: 'Paramedic' },
    { value: 'healthcare_assistant', label: 'Healthcare Assistant' },
    { value: 'public_health', label: 'Public Health' },
    { value: 'nutrition_dietetics', label: 'Nutrition & Dietetics' },
    { value: 'other_healthcare', label: 'Other Healthcare', allowFreeText: true },
  ],
  engineering: [
    { value: 'civil_engineering', label: 'Civil Engineering' },
    { value: 'mechanical_engineering', label: 'Mechanical Engineering' },
    { value: 'electrical_engineering', label: 'Electrical Engineering' },
    { value: 'electronic_engineering', label: 'Electronic Engineering' },
    { value: 'chemical_engineering', label: 'Chemical Engineering' },
    { value: 'industrial_engineering', label: 'Industrial Engineering' },
    { value: 'aerospace_engineering', label: 'Aerospace Engineering' },
    { value: 'automotive_engineering', label: 'Automotive Engineering' },
    { value: 'environmental_engineering', label: 'Environmental Engineering' },
    { value: 'petroleum_engineering', label: 'Petroleum Engineering' },
    { value: 'mechatronics', label: 'Mechatronics' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'quantity_surveying', label: 'Quantity Surveying' },
    { value: 'other_engineering', label: 'Other Engineering', allowFreeText: true },
  ],
  business_finance: [
    { value: 'accounting', label: 'Accounting' },
    { value: 'finance', label: 'Finance' },
    { value: 'banking', label: 'Banking' },
    { value: 'economics', label: 'Economics' },
    { value: 'business_administration', label: 'Business Administration' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'human_resources', label: 'Human Resources' },
    { value: 'supply_chain', label: 'Supply Chain' },
    { value: 'project_management', label: 'Project Management' },
    { value: 'international_business', label: 'International Business' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'procurement', label: 'Procurement' },
    { value: 'other_business', label: 'Other Business', allowFreeText: true },
  ],
  it: [
    { value: 'computer_science', label: 'Computer Science' },
    { value: 'software_engineering', label: 'Software Engineering' },
    { value: 'web_development', label: 'Web Development' },
    { value: 'mobile_development', label: 'Mobile Development' },
    { value: 'cyber_security', label: 'Cyber Security' },
    { value: 'networking', label: 'Networking' },
    { value: 'cloud_computing', label: 'Cloud Computing' },
    { value: 'data_science', label: 'Data Science' },
    { value: 'artificial_intelligence', label: 'Artificial Intelligence' },
    { value: 'machine_learning', label: 'Machine Learning' },
    { value: 'devops', label: 'DevOps' },
    { value: 'database_administration', label: 'Database Administration' },
    { value: 'it_support', label: 'IT Support' },
    { value: 'other_it', label: 'Other IT', allowFreeText: true },
  ],
  education: [
    { value: 'primary_education', label: 'Primary Education' },
    { value: 'secondary_education', label: 'Secondary Education' },
    { value: 'mathematics_teacher', label: 'Mathematics Teacher' },
    { value: 'english_teacher', label: 'English Teacher' },
    { value: 'science_teacher', label: 'Science Teacher' },
    { value: 'early_years', label: 'Early Years Education' },
    { value: 'special_education', label: 'Special Education' },
    { value: 'educational_leadership', label: 'Educational Leadership' },
    { value: 'tesol_esl', label: 'TESOL / ESL' },
    { value: 'other_education', label: 'Other Education', allowFreeText: true },
  ],
  law: [
    { value: 'solicitor', label: 'Solicitor' },
    { value: 'barrister', label: 'Barrister' },
    { value: 'legal_assistant', label: 'Legal Assistant' },
    { value: 'legal_advisor', label: 'Legal Advisor' },
    { value: 'corporate_law', label: 'Corporate Law' },
    { value: 'criminal_law', label: 'Criminal Law' },
    { value: 'international_law', label: 'International Law' },
    { value: 'family_law', label: 'Family Law' },
    { value: 'other_legal', label: 'Other Legal', allowFreeText: true },
  ],
  science: [
    { value: 'biology', label: 'Biology' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'physics', label: 'Physics' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'statistics', label: 'Statistics' },
    { value: 'biotechnology', label: 'Biotechnology' },
    { value: 'environmental_science', label: 'Environmental Science' },
    { value: 'geology', label: 'Geology' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'genetics', label: 'Genetics' },
    { value: 'laboratory_scientist', label: 'Laboratory Science' },
    { value: 'clinical_laboratory', label: 'Clinical Laboratory' },
    { value: 'forensic_science', label: 'Forensic Science' },
    { value: 'other_science', label: 'Other Science', allowFreeText: true },
  ],
  creative_arts: [
    { value: 'graphic_design', label: 'Graphic Design' },
    { value: 'animation', label: 'Animation' },
    { value: 'game_design', label: 'Game Design' },
    { value: 'film_video', label: 'Film & Video' },
    { value: 'photography', label: 'Photography' },
    { value: 'ux_ui_design', label: 'UX/UI Design' },
    { value: 'interior_design', label: 'Interior Design' },
    { value: 'fashion_design', label: 'Fashion Design' },
    { value: 'music', label: 'Music' },
    { value: 'fine_arts', label: 'Fine Arts' },
    { value: 'architecture_design', label: 'Architecture Design' },
    { value: 'other_creative', label: 'Other Creative Arts', allowFreeText: true },
  ],
  construction: [
    { value: 'construction_management', label: 'Construction Management' },
    { value: 'civil_construction', label: 'Civil Construction' },
    { value: 'building_surveying', label: 'Building Surveying' },
    { value: 'quantity_surveying_construction', label: 'Quantity Surveying' },
    { value: 'site_engineering', label: 'Site Engineering' },
    { value: 'carpentry', label: 'Carpentry' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical_installation', label: 'Electrical Installation' },
    { value: 'painting_decorating', label: 'Painting & Decorating' },
    { value: 'bricklaying', label: 'Bricklaying' },
    { value: 'roofing', label: 'Roofing' },
    { value: 'other_construction', label: 'Other Construction', allowFreeText: true },
  ],
  hospitality: [
    { value: 'hotel_management', label: 'Hotel Management' },
    { value: 'tourism', label: 'Tourism' },
    { value: 'chef', label: 'Chef' },
    { value: 'restaurant_management', label: 'Restaurant Management' },
    { value: 'event_management', label: 'Event Management' },
    { value: 'catering', label: 'Catering' },
    { value: 'food_production', label: 'Food Production' },
    { value: 'front_office', label: 'Front Office' },
    { value: 'housekeeping_management', label: 'Housekeeping Management' },
    { value: 'other_hospitality', label: 'Other Hospitality', allowFreeText: true },
  ],
  social_care: [
    { value: 'social_worker', label: 'Social Worker' },
    { value: 'care_assistant', label: 'Care Assistant' },
    { value: 'support_worker', label: 'Support Worker' },
    { value: 'youth_worker', label: 'Youth Worker' },
    { value: 'family_support', label: 'Family Support' },
    { value: 'mental_health_support', label: 'Mental Health Support' },
    { value: 'substance_misuse', label: 'Substance Misuse Support' },
    { value: 'residential_care', label: 'Residential Care' },
    { value: 'other_social_care', label: 'Other Social Care', allowFreeText: true },
  ],
  logistics_transport: [
    { value: 'supply_chain', label: 'Supply Chain' },
    { value: 'warehouse_operations', label: 'Warehouse Operations' },
    { value: 'hgv_driver', label: 'HGV / LGV Driver' },
    { value: 'delivery_driver', label: 'Delivery Driver' },
    { value: 'freight_forwarding', label: 'Freight Forwarding' },
    { value: 'inventory_management', label: 'Inventory Management' },
    { value: 'transport_planning', label: 'Transport Planning' },
    { value: 'procurement_logistics', label: 'Procurement (Logistics)' },
    { value: 'other_logistics', label: 'Other Logistics', allowFreeText: true },
  ],
  media_communications: [
    { value: 'journalism', label: 'Journalism' },
    { value: 'broadcasting', label: 'Broadcasting (TV/Radio)' },
    { value: 'public_relations', label: 'Public Relations' },
    { value: 'digital_marketing', label: 'Digital Marketing' },
    { value: 'content_strategy', label: 'Content Strategy' },
    { value: 'copywriting', label: 'Copywriting' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'media_production', label: 'Media Production' },
    { value: 'communications', label: 'Corporate Communications' },
    { value: 'other_media', label: 'Other Media', allowFreeText: true },
  ],
  public_sector: [
    { value: 'civil_service', label: 'Civil Service' },
    { value: 'local_government', label: 'Local Government' },
    { value: 'policy_officer', label: 'Policy Officer' },
    { value: 'welfare_advisor', label: 'Welfare / Benefits Advisor' },
    { value: 'housing_officer', label: 'Housing Officer' },
    { value: 'probation_officer', label: 'Probation Officer' },
    { value: 'other_public_sector', label: 'Other Public Sector', allowFreeText: true },
  ],
  manufacturing: [
    { value: 'production_engineer', label: 'Production Engineering' },
    { value: 'quality_assurance', label: 'Quality Assurance' },
    { value: 'process_engineering', label: 'Process Engineering' },
    { value: 'maintenance_engineering', label: 'Maintenance Engineering' },
    { value: 'industrial_engineering', label: 'Industrial Engineering' },
    { value: 'food_manufacturing', label: 'Food Manufacturing' },
    { value: 'pharmaceutical_manufacturing', label: 'Pharmaceutical Manufacturing' },
    { value: 'other_manufacturing', label: 'Other Manufacturing', allowFreeText: true },
  ],
  property_real_estate: [
    { value: 'estate_agent', label: 'Estate Agent' },
    { value: 'surveyor_property', label: 'Chartered Surveyor' },
    { value: 'property_management', label: 'Property Management' },
    { value: 'commercial_property', label: 'Commercial Property' },
    { value: 'lettings', label: 'Lettings Negotiator' },
    { value: 'facilities_management', label: 'Facilities Management' },
    { value: 'other_property', label: 'Other Property', allowFreeText: true },
  ],
  other: [{ value: 'other_degree', label: 'Other (type your degree)', allowFreeText: true }],
}

export function getSpecialisationOptions(fieldId: EducationFieldId): EducationSpecialisationOption[] {
  return EDUCATION_SPECIALISATIONS[fieldId] ?? EDUCATION_SPECIALISATIONS.other
}

export function resolveSpecialisationLabel(
  fieldId: EducationFieldId,
  specialisationId: string,
  freeText?: string
): string {
  if (freeText?.trim()) return freeText.trim()
  const opt = getSpecialisationOptions(fieldId).find((o) => o.value === specialisationId)
  if (opt) return opt.label
  return specialisationId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function specialisationAllowsFreeText(
  fieldId: EducationFieldId,
  specialisationId: string
): boolean {
  const opt = getSpecialisationOptions(fieldId).find((o) => o.value === specialisationId)
  return Boolean(opt?.allowFreeText) || fieldId === 'other'
}
