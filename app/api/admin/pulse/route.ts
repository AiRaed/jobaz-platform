import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import {
  feedPostsHasColumn,
  generatePulseAiSuggestions,
  getPulseAdminSupabase,
  mapAdminPulsePost,
  mapAiSuggestion,
  tableExists,
  toFeedInsertRow,
  validateAdminPulseInput,
  type PulseAiAudience,
  type PulseAiGoal,
  type PulseCircle,
} from '@/lib/pulse'

export const dynamic = 'force-dynamic'

const SELECT_COLS =
  'id, title, content, post_type, status, visibility, circle, video_url, image_url, source_url, tags, pinned, featured, created_by_admin, is_jobaz_post, ai_suggested, ai_notes, author_display_name, published_at, created_at, updated_at'

/** GET — list posts, comments pending, or AI suggestions */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getPulseAdminSupabase()
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      posts: [],
      comments: [],
      suggestions: [],
      note: 'Supabase service role not configured',
    })
  }

  if (!(await tableExists(supabase, 'feed_posts'))) {
    return NextResponse.json({
      ok: true,
      posts: [],
      comments: [],
      suggestions: [],
      note: 'feed_posts: Not tracked yet — run Pulse migrations',
    })
  }

  const url = new URL(req.url)
  const view = url.searchParams.get('view') || 'posts'
  const status = url.searchParams.get('status') || 'all'
  const id = url.searchParams.get('id')

  if (id) {
    const { data, error } = await supabase.from('feed_posts').select(SELECT_COLS).eq('id', id).maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      post: data ? mapAdminPulsePost(data as Record<string, unknown>) : null,
    })
  }

  if (view === 'suggestions') {
    if (!(await tableExists(supabase, 'pulse_ai_suggestions'))) {
      return NextResponse.json({
        ok: true,
        suggestions: [],
        note: 'pulse_ai_suggestions: Not tracked yet',
      })
    }
    const { data } = await supabase
      .from('pulse_ai_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({
      ok: true,
      suggestions: (data ?? []).map((r) => mapAiSuggestion(r as Record<string, unknown>)),
    })
  }

  if (view === 'comments') {
    if (!(await tableExists(supabase, 'feed_comments'))) {
      return NextResponse.json({ ok: true, comments: [], note: 'feed_comments: Not tracked yet' })
    }
    const { data } = await supabase
      .from('feed_comments')
      .select('id, post_id, author_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ ok: true, comments: data ?? [] })
  }

  let query = supabase
    .from('feed_posts')
    .select(SELECT_COLS)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(150)

  const hasStatus = await feedPostsHasColumn(supabase, 'status')
  if (hasStatus && status !== 'all') {
    query = query.eq('status', status)
  } else if (hasStatus && status === 'all') {
    // show all except nothing filtered
  }

  const { data, error } = await query
  if (error) {
    // Fallback without new columns
    const fallback = await supabase
      .from('feed_posts')
      .select('id, content, post_type, visibility, video_url, image_url, is_jobaz_post, author_display_name, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(150)
    if (fallback.error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      posts: (fallback.data ?? []).map((r) =>
        mapAdminPulsePost({
          ...(r as Record<string, unknown>),
          status: 'published',
          circle: 'general',
          created_by_admin: Boolean((r as { is_jobaz_post?: boolean }).is_jobaz_post),
        })
      ),
      note: 'Phase 1 columns not applied yet — run migration 20250728200000_pulse_phase1_admin.sql',
    })
  }

  return NextResponse.json({
    ok: true,
    posts: (data ?? []).map((r) => mapAdminPulsePost(r as Record<string, unknown>)),
  })
}

/** POST — create / update / publish / archive / AI suggest / convert */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getPulseAdminSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role not configured' }, { status: 503 })
  }
  if (!(await tableExists(supabase, 'feed_posts'))) {
    return NextResponse.json({ error: 'feed_posts missing — run migrations' }, { status: 503 })
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const action = String(body.action || 'create')

  if (action === 'create' || action === 'update') {
    const validated = validateAdminPulseInput(body)
    if (validated.error || !validated.data) {
      return NextResponse.json({ error: validated.error || 'Invalid payload' }, { status: 400 })
    }
    const row = toFeedInsertRow(validated.data)

    if (action === 'update') {
      const id = String(body.id || '')
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
      const { data, error } = await supabase
        .from('feed_posts')
        .update(row)
        .eq('id', id)
        .select(SELECT_COLS)
        .maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({
        ok: true,
        post: data ? mapAdminPulsePost(data as Record<string, unknown>) : null,
        warning: validated.data.video_as_source
          ? 'Unknown video domain stored as source_url only.'
          : undefined,
      })
    }

    const { data, error } = await supabase
      .from('feed_posts')
      .insert({ ...row, created_at: new Date().toISOString() })
      .select(SELECT_COLS)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      post: data ? mapAdminPulsePost(data as Record<string, unknown>) : null,
      warning: validated.data.video_as_source
        ? 'Unknown video domain stored as source_url only.'
        : undefined,
    })
  }

  if (action === 'set_status') {
    const id = String(body.id || '')
    const status = String(body.status || '')
    if (!id || !['draft', 'published', 'archived', 'pending_review'].includes(status)) {
      return NextResponse.json({ error: 'id and valid status required' }, { status: 400 })
    }
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (status === 'published') {
      patch.published_at = new Date().toISOString()
      patch.is_jobaz_post = true
      patch.is_official_post = true
      patch.created_by_admin = true
      patch.author_display_name = 'JobAZ Career Team'
    }
    const { data, error } = await supabase
      .from('feed_posts')
      .update(patch)
      .eq('id', id)
      .select(SELECT_COLS)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      post: data ? mapAdminPulsePost(data as Record<string, unknown>) : null,
    })
  }

  if (action === 'delete') {
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const hard = body.hard === true

    if (hard) {
      const { data: existing } = await supabase
        .from('feed_posts')
        .select('id, status')
        .eq('id', id)
        .maybeSingle()
      if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      const st = String((existing as { status?: string }).status || '')
      if (st === 'published') {
        return NextResponse.json(
          { error: 'Published posts cannot be hard-deleted. Unpublish or archive instead.' },
          { status: 400 }
        )
      }
      const { error } = await supabase.from('feed_posts').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, deleted: true })
    }

    const { error } = await supabase
      .from('feed_posts')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, archived: true })
  }

  if (action === 'ai_suggest') {
    const count = Number(body.count) || 3
    const audience = (String(body.audience || 'general') as PulseAiAudience) || 'general'
    const goal = (String(body.goal || 'educate') as PulseAiGoal) || 'educate'
    const circle = (String(body.circle || 'general') as PulseCircle) || 'general'
    const result = await generatePulseAiSuggestions({
      count,
      audience,
      goal,
      circle,
      courseHint: body.course_hint ? String(body.course_hint) : null,
      videoUrl: body.video_url ? String(body.video_url) : null,
    })

    const saved: ReturnType<typeof mapAiSuggestion>[] = []
    if (await tableExists(supabase, 'pulse_ai_suggestions')) {
      for (const s of result.suggestions) {
        const { data } = await supabase
          .from('pulse_ai_suggestions')
          .insert({
            title: s.title,
            body: s.body,
            post_type: s.post_type,
            circle: s.circle,
            tags: s.tags,
            reason: s.reason,
            video_url: s.video_url || null,
            source_url: s.source_url || null,
            status: 'suggested',
            created_by: auth.user.id,
          })
          .select('*')
          .maybeSingle()
        if (data) saved.push(mapAiSuggestion(data as Record<string, unknown>))
      }
    }

    return NextResponse.json({
      ok: true,
      source: result.source,
      siteBrain: result.siteBrain || null,
      error: result.error,
      suggestions: saved.length ? saved : result.suggestions,
      note: 'AI suggestions are drafts only — never auto-published.',
    })
  }

  if (action === 'convert_suggestion') {
    const suggestionId = String(body.suggestion_id || '')
    const publish = Boolean(body.publish)
    if (!suggestionId) {
      return NextResponse.json({ error: 'suggestion_id required' }, { status: 400 })
    }
    if (!(await tableExists(supabase, 'pulse_ai_suggestions'))) {
      return NextResponse.json({ error: 'pulse_ai_suggestions missing' }, { status: 503 })
    }
    const { data: sug } = await supabase
      .from('pulse_ai_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .maybeSingle()
    if (!sug) return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })

    const validated = validateAdminPulseInput({
      title: sug.title,
      body: sug.body,
      post_type: sug.post_type,
      status: publish ? 'published' : 'draft',
      visibility: 'public',
      circle: sug.circle,
      tags: sug.tags,
      video_url: sug.video_url,
      source_url: sug.source_url,
      ai_suggested: true,
      ai_notes: sug.reason,
    })
    if (validated.error || !validated.data) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const row = toFeedInsertRow(validated.data)
    const { data: post, error } = await supabase
      .from('feed_posts')
      .insert({ ...row, created_at: new Date().toISOString() })
      .select(SELECT_COLS)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase
      .from('pulse_ai_suggestions')
      .update({
        status: 'converted_to_post',
        converted_post_id: post?.id ?? null,
      })
      .eq('id', suggestionId)

    return NextResponse.json({
      ok: true,
      post: post ? mapAdminPulsePost(post as Record<string, unknown>) : null,
      published: publish,
    })
  }

  if (action === 'reject_suggestion') {
    const suggestionId = String(body.suggestion_id || '')
    if (!suggestionId) return NextResponse.json({ error: 'suggestion_id required' }, { status: 400 })
    await supabase
      .from('pulse_ai_suggestions')
      .update({ status: 'rejected' })
      .eq('id', suggestionId)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
