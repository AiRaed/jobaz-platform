/**
 * Experience industry → UK job specialisation options (Work in my Experience).
 * Industry is only a parent category — roadmaps are built from specialisation.
 */

import type { ExperienceIndustryId } from './types'
import {
  NEW_EXPERIENCE_INDUSTRY_LABELS,
  NEW_EXPERIENCE_SPECIALISATIONS,
} from './industries/newExperienceSectors'

export type ExperienceSpecialisationOption = {
  value: string
  label: string
  allowFreeText?: boolean
}

export const EXPERIENCE_SPECIALISATIONS: Record<ExperienceIndustryId, ExperienceSpecialisationOption[]> = {
  driving_transport: [
    { value: 'taxi_driver', label: 'Taxi Driver' },
    { value: 'private_hire_driver', label: 'Private Hire Driver' },
    { value: 'delivery_driver', label: 'Delivery Driver' },
    { value: 'van_driver', label: 'Van Driver' },
    { value: 'hgv_driver', label: 'HGV Driver' },
    { value: 'bus_driver', label: 'Bus Driver' },
    { value: 'coach_driver', label: 'Coach Driver' },
    { value: 'forklift_operator', label: 'Forklift Operator' },
    { value: 'courier_driver', label: 'Courier Driver' },
    { value: 'chauffeur', label: 'Chauffeur' },
    { value: 'transport_planner', label: 'Transport Planner' },
    { value: 'fleet_coordinator', label: 'Fleet Coordinator' },
    { value: 'logistics_driver', label: 'Logistics Driver' },
    { value: 'recovery_driver', label: 'Recovery Driver' },
    { value: 'other_driving', label: 'Other', allowFreeText: true },
  ],
  healthcare: [
    { value: 'care_assistant', label: 'Care Assistant' },
    { value: 'senior_care_worker', label: 'Senior Care Worker' },
    { value: 'support_worker', label: 'Support Worker' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'dentist', label: 'Dentist' },
    { value: 'dental_nurse', label: 'Dental Nurse' },
    { value: 'dental_hygienist', label: 'Dental Hygienist' },
    { value: 'physiotherapist', label: 'Physiotherapist' },
    { value: 'occupational_therapist', label: 'Occupational Therapist' },
    { value: 'pharmacist', label: 'Pharmacist' },
    { value: 'healthcare_assistant', label: 'Healthcare Assistant' },
    { value: 'radiographer', label: 'Radiographer' },
    { value: 'social_worker', label: 'Social Worker' },
    { value: 'other_healthcare', label: 'Other', allowFreeText: true },
  ],
  software_developer: [
    { value: 'frontend_developer', label: 'Frontend Developer' },
    { value: 'backend_developer', label: 'Backend Developer' },
    { value: 'full_stack_developer', label: 'Full Stack Developer' },
    { value: 'mobile_developer', label: 'Mobile Developer' },
    { value: 'qa_engineer', label: 'QA Engineer' },
    { value: 'test_automation_engineer', label: 'Test Automation Engineer' },
    { value: 'devops_engineer', label: 'DevOps Engineer' },
    { value: 'cloud_engineer', label: 'Cloud Engineer' },
    { value: 'data_analyst', label: 'Data Analyst' },
    { value: 'data_engineer', label: 'Data Engineer' },
    { value: 'cyber_security', label: 'Cyber Security' },
    { value: 'network_engineer', label: 'Network Engineer' },
    { value: 'it_support', label: 'IT Support' },
    { value: 'system_administrator', label: 'System Administrator' },
    { value: 'other_it', label: 'Other', allowFreeText: true },
  ],
  construction: [
    { value: 'labourer', label: 'Labourer' },
    { value: 'carpenter', label: 'Carpenter' },
    { value: 'electrician', label: 'Electrician' },
    { value: 'plumber', label: 'Plumber' },
    { value: 'bricklayer', label: 'Bricklayer' },
    { value: 'painter', label: 'Painter' },
    { value: 'roofer', label: 'Roofer' },
    { value: 'groundworker', label: 'Groundworker' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'site_manager', label: 'Site Manager' },
    { value: 'quantity_surveyor', label: 'Quantity Surveyor' },
    { value: 'other_construction', label: 'Other', allowFreeText: true },
  ],
  electrician: [
    { value: 'electrician', label: 'Electrician' },
    { value: 'maintenance_electrician', label: 'Maintenance Electrician' },
    { value: 'industrial_electrician', label: 'Industrial Electrician' },
    { value: 'electrical_technician', label: 'Electrical Technician' },
    { value: 'electronics_technician', label: 'Electronics Technician' },
    { value: 'solar_installer', label: 'Solar Installer' },
    { value: 'hvac_technician', label: 'HVAC Technician' },
    { value: 'appliance_engineer', label: 'Appliance Engineer' },
    { value: 'other_electrical', label: 'Other', allowFreeText: true },
  ],
  warehouse_logistics: [
    { value: 'warehouse_operative', label: 'Warehouse Operative' },
    { value: 'picker_packer', label: 'Picker Packer' },
    { value: 'forklift_driver', label: 'Forklift Driver' },
    { value: 'inventory_controller', label: 'Inventory Controller' },
    { value: 'warehouse_supervisor', label: 'Warehouse Supervisor' },
    { value: 'logistics_coordinator', label: 'Logistics Coordinator' },
    { value: 'dispatch_clerk', label: 'Dispatch Clerk' },
    { value: 'supply_chain_assistant', label: 'Supply Chain Assistant' },
    { value: 'other_warehouse', label: 'Other', allowFreeText: true },
  ],
  security: [
    { value: 'door_supervisor', label: 'Door Supervisor' },
    { value: 'security_guard', label: 'Security Guard' },
    { value: 'cctv_operator', label: 'CCTV Operator' },
    { value: 'event_security', label: 'Event Security' },
    { value: 'close_protection', label: 'Close Protection' },
    { value: 'security_supervisor', label: 'Security Supervisor' },
    { value: 'control_room_operator', label: 'Control Room Operator' },
    { value: 'other_security', label: 'Other', allowFreeText: true },
  ],
  chef: [
    { value: 'kitchen_porter', label: 'Kitchen Porter' },
    { value: 'commis_chef', label: 'Commis Chef' },
    { value: 'chef_de_partie', label: 'Chef de Partie' },
    { value: 'sous_chef', label: 'Sous Chef' },
    { value: 'head_chef', label: 'Head Chef' },
    { value: 'pastry_chef', label: 'Pastry Chef' },
    { value: 'catering_assistant', label: 'Catering Assistant' },
    { value: 'other_kitchen', label: 'Other', allowFreeText: true },
  ],
  hospitality: [
    { value: 'waiter', label: 'Waiter' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'hotel_receptionist', label: 'Hotel Receptionist' },
    { value: 'barista', label: 'Barista' },
    { value: 'restaurant_supervisor', label: 'Restaurant Supervisor' },
    { value: 'hotel_duty_manager', label: 'Hotel Duty Manager' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'other_hospitality', label: 'Other', allowFreeText: true },
  ],
  sales: [
    { value: 'sales_assistant', label: 'Sales Assistant' },
    { value: 'retail_sales', label: 'Retail Sales' },
    { value: 'account_manager', label: 'Account Manager' },
    { value: 'business_development_executive', label: 'Business Development Executive' },
    { value: 'sales_manager', label: 'Sales Manager' },
    { value: 'recruitment_consultant', label: 'Recruitment Consultant' },
    { value: 'customer_success', label: 'Customer Success' },
    { value: 'other_sales', label: 'Other', allowFreeText: true },
  ],
  office_admin: [
    { value: 'administrator', label: 'Administrator' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'personal_assistant', label: 'Personal Assistant' },
    { value: 'executive_assistant', label: 'Executive Assistant' },
    { value: 'office_manager', label: 'Office Manager' },
    { value: 'hr_administrator', label: 'HR Administrator' },
    { value: 'payroll_administrator', label: 'Payroll Administrator' },
    { value: 'data_entry_clerk', label: 'Data Entry Clerk' },
    { value: 'other_office', label: 'Other', allowFreeText: true },
  ],
  accountant: [
    { value: 'accounts_assistant', label: 'Accounts Assistant' },
    { value: 'payroll_officer', label: 'Payroll Officer' },
    { value: 'bookkeeper', label: 'Bookkeeper' },
    { value: 'accounts_payable', label: 'Accounts Payable (AP)' },
    { value: 'accounts_receivable', label: 'Accounts Receivable (AR)' },
    { value: 'assistant_accountant', label: 'Assistant Accountant' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'senior_accountant', label: 'Senior Accountant' },
    { value: 'management_accountant', label: 'Management Accountant' },
    { value: 'financial_accountant', label: 'Financial Accountant' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
    { value: 'finance_business_partner', label: 'Finance Business Partner' },
    { value: 'finance_manager', label: 'Finance Manager' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'tax_accountant', label: 'Tax Accountant' },
    { value: 'credit_controller', label: 'Credit Controller' },
    { value: 'other_finance', label: 'Other', allowFreeText: true },
  ],
  ...NEW_EXPERIENCE_SPECIALISATIONS,
  other: [{ value: 'other_role', label: 'Other (type your role)', allowFreeText: true }],
}

export function getExperienceSpecialisationOptions(
  industryId: ExperienceIndustryId
): ExperienceSpecialisationOption[] {
  return EXPERIENCE_SPECIALISATIONS[industryId] ?? EXPERIENCE_SPECIALISATIONS.other
}

export function resolveExperienceSpecialisationLabel(
  industryId: ExperienceIndustryId,
  specialisationId: string,
  freeText?: string
): string {
  if (freeText?.trim()) return freeText.trim()
  const parts = specialisationId.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length > 1) {
    const labels = parts.map((part) => {
      const opt = getExperienceSpecialisationOptions(industryId).find((o) => o.value === part)
      return opt?.label ?? part.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    })
    if (labels.length === 2) return `${labels[0]} / ${labels[1]}`
    return `${labels.slice(0, -1).join(', ')} / ${labels[labels.length - 1]}`
  }
  const opt = getExperienceSpecialisationOptions(industryId).find((o) => o.value === specialisationId)
  if (opt) return opt.label
  return specialisationId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function experienceSpecialisationAllowsFreeText(
  industryId: ExperienceIndustryId,
  specialisationId: string
): boolean {
  const opt = getExperienceSpecialisationOptions(industryId).find((o) => o.value === specialisationId)
  return Boolean(opt?.allowFreeText) || industryId === 'other'
}

export const EXPERIENCE_INDUSTRY_LABELS: Record<ExperienceIndustryId, string> = {
  driving_transport: 'Driving & Transport',
  healthcare: 'Healthcare & Care',
  software_developer: 'Software / IT Development',
  construction: 'Construction',
  electrician: 'Electrical / Trades',
  warehouse_logistics: 'Warehouse & Logistics',
  security: 'Security',
  chef: 'Hospitality Kitchen',
  hospitality: 'Hospitality Front of House',
  sales: 'Sales & Business Development',
  office_admin: 'Office & Administration',
  accountant: 'Accounting & Finance',
  ...NEW_EXPERIENCE_INDUSTRY_LABELS,
  other: 'Other',
}
