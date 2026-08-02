export const OPPORTUNITY_STATUSES = [
  'pending_review',
  'draft',
  'published',
  'rejected',
  'filled',
  'deleted',
] as const

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

export const ADMIN_SAVE_STATUSES = ['draft', 'published', 'filled'] as const

export type AdminSaveStatus = (typeof ADMIN_SAVE_STATUSES)[number]

export const OPPORTUNITY_CATEGORIES = [
  'Barber / hair',
  'Delivery',
  'Cleaning',
  'Moving help',
  'Event steward',
  'Handyman',
  'Warehouse',
  'Small business help',
  'Other',
] as const

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number]

export const CONTACT_METHODS = [
  'Apply through JobAZ',
  'Phone',
  'Email',
  'Phone / Email',
] as const

export type ContactMethod = (typeof CONTACT_METHODS)[number]

/** Public-safe opportunity fields (no private contact/user data / notes). */
export type PublicOpportunity = {
  id: string
  title: string
  category: string | null
  location: string | null
  pay_text: string | null
  date_text: string | null
  description: string | null
  poster_name: string | null
  business_name: string | null
  created_by_admin: boolean
  contact_preference: string | null
  /** Safe public contacts only when contact_public is true */
  public_contact_email: string | null
  public_contact_phone: string | null
  created_at: string
}

export type OpportunityRow = {
  id: string
  user_id: string | null
  title: string
  category: string | null
  location: string | null
  pay_text: string | null
  date_text: string | null
  description: string | null
  contact_preference: string | null
  poster_name: string | null
  status: OpportunityStatus
  created_at: string
  updated_at: string
  created_by_admin: boolean
  source: string | null
  internal_note: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  business_name: string | null
  contact_public: boolean
  /** Present on admin list when available */
  user_email?: string | null
}

export type CreateOpportunityInput = {
  title: string
  category: string
  location: string
  pay_text: string
  date_text: string
  description: string
  contact_preference: string
  poster_name: string
  terms_accepted: boolean
}

export type AdminOpportunityPayload = {
  title: string
  category: string
  location: string
  date_text?: string
  pay_text?: string
  description: string
  contact_preference?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  business_name?: string
  poster_name?: string
  source?: string
  internal_note?: string
  contact_public?: boolean
  status: AdminSaveStatus
  confirmed_real?: boolean
}

export const ADMIN_OPPORTUNITY_SELECT =
  'id, user_id, title, category, location, pay_text, date_text, description, contact_preference, poster_name, status, created_at, updated_at, created_by_admin, source, internal_note, contact_name, contact_email, contact_phone, business_name, contact_public'
