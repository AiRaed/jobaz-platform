import type { OpportunityRow, PublicOpportunity } from './types'

type RawRow = {
  id: string
  user_id?: string | null
  title: string
  category: string | null
  location: string | null
  pay_text: string | null
  date_text: string | null
  description: string | null
  contact_preference?: string | null
  poster_name: string | null
  status?: string
  created_at: string
  updated_at?: string
  created_by_admin?: boolean | null
  source?: string | null
  internal_note?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  business_name?: string | null
  contact_public?: boolean | null
}

function isApplyThroughJobaz(method: string | null | undefined): boolean {
  const m = (method ?? '').toLowerCase()
  return m.includes('apply through jobaz') || m.includes('through jobaz')
}

export function toPublicOpportunity(row: RawRow): PublicOpportunity {
  const contactPublic = Boolean(row.contact_public)
  const method = row.contact_preference ?? null
  const showDirectContact = contactPublic && !isApplyThroughJobaz(method)

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    location: row.location,
    pay_text: row.pay_text,
    date_text: row.date_text,
    description: row.description,
    poster_name: row.poster_name,
    business_name: row.business_name ?? null,
    created_by_admin: Boolean(row.created_by_admin),
    contact_preference: method,
    public_contact_email: showDirectContact ? row.contact_email ?? null : null,
    public_contact_phone: showDirectContact ? row.contact_phone ?? null : null,
    created_at: row.created_at,
  }
}

export function toOpportunityRow(row: RawRow): OpportunityRow {
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    title: row.title,
    category: row.category,
    location: row.location,
    pay_text: row.pay_text,
    date_text: row.date_text,
    description: row.description,
    contact_preference: row.contact_preference ?? null,
    poster_name: row.poster_name,
    status: (row.status as OpportunityRow['status']) ?? 'pending_review',
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    created_by_admin: Boolean(row.created_by_admin),
    source: row.source ?? null,
    internal_note: row.internal_note ?? null,
    contact_name: row.contact_name ?? null,
    contact_email: row.contact_email ?? null,
    contact_phone: row.contact_phone ?? null,
    business_name: row.business_name ?? null,
    contact_public: Boolean(row.contact_public),
  }
}

export function truncate(text: string | null | undefined, max = 160): string {
  const t = (text ?? '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function isApplyThroughJobazMethod(method: string | null | undefined): boolean {
  return isApplyThroughJobaz(method)
}
