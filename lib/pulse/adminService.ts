import { createServerSupabaseClient } from '@/lib/supabase'
import { parsePulseVideoUrl } from './video'
import type {
  AdminPulsePost,
  AdminPulsePostInput,
  PulseAiSuggestion,
  PulseCircle,
  PulsePostStatus,
  PulsePostType,
  PulseVisibility,
} from './types'
import {
  PULSE_CIRCLES,
  PULSE_POST_TYPES,
  PULSE_STATUSES,
  PULSE_VISIBILITIES,
} from './types'

export function getPulseAdminSupabase() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

export async function tableExists(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  table: string
): Promise<boolean> {
  const { error } = await supabase.from(table).select('id').limit(1)
  if (!error) return true
  return !/does not exist|relation|schema cache/i.test(error.message || '')
}

export async function feedPostsHasColumn(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  column: string
): Promise<boolean> {
  const { error } = await supabase.from('feed_posts').select(column).limit(1)
  if (!error) return true
  return !/column|does not exist|schema cache/i.test(error.message || '')
}

function asTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((t) => t.trim()).filter(Boolean).slice(0, 12)
  if (typeof v === 'string') {
    return v
      .split(/[,#]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12)
  }
  return []
}

export function mapAdminPulsePost(row: Record<string, unknown>): AdminPulsePost {
  return {
    id: String(row.id),
    title: row.title ? String(row.title) : null,
    body: String(row.content || row.body || ''),
    post_type: String(row.post_type || 'career_advice'),
    status: (row.status as PulsePostStatus) || 'draft',
    visibility: String(row.visibility || 'public'),
    circle: String(row.circle || 'general'),
    video_url: row.video_url ? String(row.video_url) : null,
    image_url: row.image_url ? String(row.image_url) : null,
    source_url: row.source_url ? String(row.source_url) : null,
    tags: asTags(row.tags),
    pinned: Boolean(row.pinned),
    featured: Boolean(row.featured),
    created_by_admin: Boolean(row.created_by_admin ?? row.is_jobaz_post),
    ai_suggested: Boolean(row.ai_suggested),
    ai_notes: row.ai_notes ? String(row.ai_notes) : null,
    author_display_name: row.author_display_name ? String(row.author_display_name) : null,
    published_at: row.published_at ? String(row.published_at) : null,
    created_at: String(row.created_at || ''),
    updated_at: String(row.updated_at || ''),
  }
}

export function mapAiSuggestion(row: Record<string, unknown>): PulseAiSuggestion {
  return {
    id: String(row.id),
    suggested_date: String(row.suggested_date || ''),
    title: row.title ? String(row.title) : null,
    body: String(row.body || ''),
    post_type: String(row.post_type || 'career_advice'),
    circle: String(row.circle || 'general'),
    tags: asTags(row.tags),
    reason: row.reason ? String(row.reason) : null,
    video_url: row.video_url ? String(row.video_url) : null,
    source_url: row.source_url ? String(row.source_url) : null,
    status: String(row.status || 'suggested'),
    converted_post_id: row.converted_post_id ? String(row.converted_post_id) : null,
    created_at: String(row.created_at || ''),
  }
}

export function validateAdminPulseInput(body: Record<string, unknown>): {
  error?: string
  data?: AdminPulsePostInput & {
    video_as_source?: string | null
  }
} {
  const content = String(body.body ?? body.content ?? '').trim()
  if (content.length < 20) {
    return { error: 'Body must be at least 20 characters.' }
  }
  if (content.length > 5000) {
    return { error: 'Body is too long (max 5000 characters).' }
  }

  const postType = String(body.post_type || '').trim()
  if (!(PULSE_POST_TYPES as readonly string[]).includes(postType)) {
    return { error: 'Choose a valid post type.' }
  }

  const status = String(body.status || 'draft') as PulsePostStatus
  if (!(PULSE_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Status must be draft, pending_review, published, or archived.' }
  }

  const visibility = String(body.visibility || 'public')
  if (!(PULSE_VISIBILITIES as readonly string[]).includes(visibility)) {
    return { error: 'Visibility must be public, logged_in, or internal.' }
  }

  const circle = String(body.circle || 'general')
  if (!(PULSE_CIRCLES as readonly string[]).includes(circle)) {
    return { error: 'Choose a valid circle/category.' }
  }

  const videoRaw = body.video_url ? String(body.video_url).trim() : ''
  let video_url: string | null = null
  let source_url = body.source_url ? String(body.source_url).trim() || null : null
  let video_as_source: string | null = null

  if (videoRaw) {
    const parsed = parsePulseVideoUrl(videoRaw)
    if (parsed.allowed && parsed.provider !== 'unknown') {
      video_url = parsed.url
    } else {
      // Unknown domains: do not store as video_url; keep as source_url
      video_as_source = videoRaw
      if (!source_url) source_url = videoRaw
    }
  }

  return {
    data: {
      title: body.title ? String(body.title).trim().slice(0, 160) || null : null,
      body: content,
      post_type: postType as PulsePostType,
      status,
      visibility: visibility as PulseVisibility,
      circle: circle as PulseCircle,
      video_url,
      image_url: body.image_url ? String(body.image_url).trim().slice(0, 500) || null : null,
      source_url,
      tags: asTags(body.tags),
      pinned: Boolean(body.pinned),
      featured: Boolean(body.featured),
      ai_suggested: Boolean(body.ai_suggested),
      ai_notes: body.ai_notes ? String(body.ai_notes).slice(0, 2000) : null,
      video_as_source,
    },
  }
}

export function toFeedInsertRow(
  input: AdminPulsePostInput,
  opts?: { now?: string }
): Record<string, unknown> {
  const now = opts?.now || new Date().toISOString()
  const published = input.status === 'published'
  const title = input.title?.trim() || null
  const body = input.body.trim()

  return {
    author_id: null,
    author_display_name: 'JobAZ Career Team',
    content: body,
    title,
    post_type: input.post_type,
    status: input.status || 'draft',
    visibility: input.visibility || 'public',
    circle: input.circle || 'general',
    video_url: input.video_url || null,
    image_url: input.image_url || null,
    source_url: input.source_url || null,
    tags: input.tags || [],
    pinned: Boolean(input.pinned),
    featured: Boolean(input.featured),
    created_by_admin: true,
    is_jobaz_post: true,
    is_official_post: true,
    ai_suggested: Boolean(input.ai_suggested),
    ai_notes: input.ai_notes || null,
    published_at: published ? now : null,
    updated_at: now,
  }
}
