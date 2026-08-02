import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase'
import type {
  CreateRelayInput,
  RelayMessage,
  RelayStatus,
  RelayThread,
  RelayType,
} from './types'
import { RELAY_STATUSES, RELAY_TYPES } from './types'

export function getRelayAdminSupabase() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export async function tableExists(supabase: SupabaseClient, table: string): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  return !/does not exist|relation|schema cache/i.test(error.message || '')
}

export function mapThread(row: Record<string, unknown>): RelayThread {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    type: row.type as RelayType,
    subject: String(row.subject || ''),
    status: (row.status as RelayStatus) || 'open',
    body_preview: row.body_preview ? String(row.body_preview) : null,
    preferred_contact_time: row.preferred_contact_time
      ? String(row.preferred_contact_time)
      : null,
    related_opportunity_id: row.related_opportunity_id ? String(row.related_opportunity_id) : null,
    related_course_id: row.related_course_id ? String(row.related_course_id) : null,
    related_job_id: row.related_job_id ? String(row.related_job_id) : null,
    related_feed_post_id: row.related_feed_post_id ? String(row.related_feed_post_id) : null,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
    user_email: row.user_email ? String(row.user_email) : null,
    message_count: typeof row.message_count === 'number' ? row.message_count : undefined,
  }
}

export function mapMessage(row: Record<string, unknown>): RelayMessage {
  return {
    id: String(row.id),
    thread_id: String(row.thread_id),
    sender_role: row.sender_role as RelayMessage['sender_role'],
    sender_user_id: row.sender_user_id ? String(row.sender_user_id) : null,
    body: String(row.body || ''),
    created_at: String(row.created_at || ''),
  }
}

export function validateCreateRelay(body: Record<string, unknown>): {
  error?: string
  data?: CreateRelayInput
} {
  const type = String(body.type || '').trim()
  if (!(RELAY_TYPES as readonly string[]).includes(type)) {
    return { error: 'Choose a valid message type.' }
  }
  const subject = String(body.subject || '').trim()
  if (subject.length < 3) return { error: 'Please add a short subject.' }
  if (subject.length > 160) return { error: 'Subject is too long.' }
  const message = String(body.message || body.body || '').trim()
  if (message.length < 10) return { error: 'Please write a message (at least 10 characters).' }
  if (message.length > 4000) return { error: 'Message is too long.' }

  return {
    data: {
      type: type as RelayType,
      subject,
      message,
      preferred_contact_time: body.preferred_contact_time
        ? String(body.preferred_contact_time).trim().slice(0, 120) || null
        : null,
      related_opportunity_id: body.related_opportunity_id
        ? String(body.related_opportunity_id).trim() || null
        : null,
      related_course_id: body.related_course_id
        ? String(body.related_course_id).trim() || null
        : null,
      related_job_id: body.related_job_id ? String(body.related_job_id).trim() || null : null,
      related_feed_post_id: body.related_feed_post_id
        ? String(body.related_feed_post_id).trim() || null
        : null,
    },
  }
}

export async function createRelayThread(
  supabase: SupabaseClient,
  userId: string,
  input: CreateRelayInput
): Promise<{ thread: RelayThread; message: RelayMessage }> {
  const now = new Date().toISOString()
  const { data: thread, error: tErr } = await supabase
    .from('relay_threads')
    .insert({
      user_id: userId,
      type: input.type,
      subject: input.subject,
      status: 'open',
      body_preview: input.message.slice(0, 180),
      preferred_contact_time: input.preferred_contact_time || null,
      related_opportunity_id: input.related_opportunity_id || null,
      related_course_id: input.related_course_id || null,
      related_job_id: input.related_job_id || null,
      related_feed_post_id: input.related_feed_post_id || null,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single()

  if (tErr || !thread) throw new Error(tErr?.message || 'Could not create Relay thread')

  const { data: msg, error: mErr } = await supabase
    .from('relay_messages')
    .insert({
      thread_id: thread.id,
      sender_role: 'user',
      sender_user_id: userId,
      body: input.message,
      created_at: now,
    })
    .select('*')
    .single()

  if (mErr || !msg) throw new Error(mErr?.message || 'Could not save message')

  // System note for Phase 1 routing
  await supabase.from('relay_messages').insert({
    thread_id: thread.id,
    sender_role: 'system',
    sender_user_id: null,
    body: 'Your message was sent to the JobAZ Team. Full user-to-user messaging will open later as the community grows.',
    created_at: new Date().toISOString(),
  })

  return {
    thread: mapThread(thread as Record<string, unknown>),
    message: mapMessage(msg as Record<string, unknown>),
  }
}

export function isValidStatus(s: string): s is RelayStatus {
  return (RELAY_STATUSES as readonly string[]).includes(s)
}
