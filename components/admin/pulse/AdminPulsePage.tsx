'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, AlertTriangle, Pin, Sparkles, Star } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PULSE_AI_AUDIENCES,
  PULSE_AI_GOALS,
  PULSE_CIRCLE_LABELS,
  PULSE_CIRCLES,
  PULSE_POST_TYPE_LABELS,
  PULSE_POST_TYPES,
  PULSE_VISIBILITIES,
  type AdminPulsePost,
  type PulseAiAudience,
  type PulseAiGoal,
  type PulseAiSuggestion,
  type PulseCircle,
  type PulsePostType,
  type PulseVisibility,
} from '@/lib/pulse/types'
import { parsePulseVideoUrl } from '@/lib/pulse/video'
import { cn } from '@/lib/utils'

type TabId = 'published' | 'drafts' | 'create' | 'ai' | 'comments' | 'settings'

const TABS: { id: TabId; label: string }[] = [
  { id: 'published', label: 'Published Posts' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'create', label: 'Create Post' },
  { id: 'ai', label: 'AI Suggestions' },
  { id: 'comments', label: 'Comments / Moderation' },
  { id: 'settings', label: 'Settings' },
]

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40'

const emptyForm = {
  title: '',
  body: '',
  post_type: 'career_advice' as PulsePostType,
  circle: 'general' as PulseCircle,
  visibility: 'public' as PulseVisibility,
  tags: '',
  video_url: '',
  image_url: '',
  source_url: '',
  pinned: false,
  featured: false,
}

export default function AdminPulsePage() {
  const [tab, setTab] = useState<TabId>('published')
  const [posts, setPosts] = useState<AdminPulsePost[]>([])
  const [suggestions, setSuggestions] = useState<PulseAiSuggestion[]>([])
  const [comments, setComments] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showPreview, setShowPreview] = useState(false)

  const [aiCount, setAiCount] = useState(3)
  const [aiAudience, setAiAudience] = useState<PulseAiAudience>('general')
  const [aiGoal, setAiGoal] = useState<PulseAiGoal>('educate')
  const [aiCircle, setAiCircle] = useState<PulseCircle>('general')
  const [aiCourse, setAiCourse] = useState('')
  const [aiVideo, setAiVideo] = useState('')
  const [aiSource, setAiSource] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pulse?view=posts&status=all', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setPosts(data.posts || [])
      if (data.note) setNote(data.note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSuggestions = useCallback(async () => {
    const res = await fetch('/api/admin/pulse?view=suggestions', { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setSuggestions(data.suggestions || [])
  }, [])

  const loadComments = useCallback(async () => {
    const res = await fetch('/api/admin/pulse?view=comments', { cache: 'no-store' })
    const data = await res.json()
    if (res.ok) setComments(data.comments || [])
  }, [])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const published = useMemo(() => posts.filter((p) => p.status === 'published'), [posts])
  const drafts = useMemo(
    () => posts.filter((p) => p.status === 'draft' || p.status === 'pending_review'),
    [posts]
  )

  const videoCheck = parsePulseVideoUrl(form.video_url)

  const fillForm = (p: AdminPulsePost) => {
    setEditingId(p.id)
    setForm({
      title: p.title || '',
      body: p.body,
      post_type: (PULSE_POST_TYPES.includes(p.post_type as PulsePostType)
        ? p.post_type
        : 'career_advice') as PulsePostType,
      circle: (PULSE_CIRCLES.includes(p.circle as PulseCircle) ? p.circle : 'general') as PulseCircle,
      visibility: (PULSE_VISIBILITIES.includes(p.visibility as PulseVisibility)
        ? p.visibility
        : 'public') as PulseVisibility,
      tags: (p.tags || []).join(', '),
      video_url: p.video_url || '',
      image_url: p.image_url || '',
      source_url: p.source_url || '',
      pinned: p.pinned,
      featured: p.featured,
    })
    setTab('create')
  }

  const savePost = async (status: 'draft' | 'published') => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingId ? 'update' : 'create',
          id: editingId,
          title: form.title,
          body: form.body,
          post_type: form.post_type,
          circle: form.circle,
          visibility: form.visibility,
          tags: form.tags,
          video_url: form.video_url,
          image_url: form.image_url,
          source_url: form.source_url,
          pinned: form.pinned,
          featured: form.featured,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setMessage(
        status === 'published'
          ? 'Published. Visible on /feed for public users.'
          : 'Draft saved. Not visible publicly.'
      )
      if (data.warning) setNote(data.warning)
      setEditingId(null)
      setForm(emptyForm)
      await loadPosts()
      setTab(status === 'published' ? 'published' : 'drafts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (id: string, status: string) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', id, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setMessage(`Post marked ${status}.`)
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const archivePost = async (id: string) => {
    if (!confirm('Archive this post? It will leave the public feed.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Archive failed')
      setMessage('Post archived.')
      await loadPosts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed')
    } finally {
      setBusy(false)
    }
  }

  const deleteDraft = async (id: string) => {
    if (!confirm('Delete this draft permanently?')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id, hard: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')
      setPosts((prev) => prev.filter((p) => p.id !== id))
      setMessage('Draft deleted.')
      if (editingId === id) {
        setEditingId(null)
        setForm(emptyForm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  const uploadImage = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Image must be under 5MB.')
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowed.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
        throw new Error('Use JPG, PNG, or WebP.')
      }
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/pulse/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(
          data.error || 'Image upload is not configured yet. You can still use Image URL.'
        )
      }
      setForm((prev) => ({ ...prev, image_url: data.url || prev.image_url }))
      setMessage('Image uploaded — preview updates on the right.')
      setShowPreview(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Image upload is not configured yet. You can still use Image URL.'
      )
    } finally {
      setBusy(false)
    }
  }

  const runAi = async () => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai_suggest',
          count: aiCount,
          audience: aiAudience,
          goal: aiGoal,
          circle: aiCircle,
          course_hint: aiCourse || null,
          video_url: aiVideo || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI failed')
      setAiSource(data.source || null)
      setMessage(
        `Generated ${data.suggestions?.length || 0} suggestions (${data.source}). AI never auto-publishes.`
      )
      await loadSuggestions()
      setTab('ai')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI failed')
    } finally {
      setBusy(false)
    }
  }

  const convertSuggestion = async (id: string, publish: boolean) => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'convert_suggestion', suggestion_id: id, publish }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Convert failed')
      setMessage(publish ? 'Suggestion published to Pulse.' : 'Suggestion saved as draft.')
      await Promise.all([loadPosts(), loadSuggestions()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Convert failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin home
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Pulse</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Phase 1: admin-seeded career tips, course guides, opportunities and success stories.
              AI suggests drafts only — you publish.
            </p>
          </div>
        </div>
      </header>

      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-100 flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Public users cannot publish live posts in Phase 1. Community submissions stay pending until
          you approve. Only send published content to{' '}
          <Link href="/feed" className="underline text-amber-50">
            /feed
          </Link>
          .
        </p>
      </div>

      {note && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
          {note}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-100">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              if (t.id === 'ai') void loadSuggestions()
              if (t.id === 'comments') void loadComments()
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              tab === t.id
                ? 'border-emerald-400/50 bg-emerald-600/30 text-white'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 py-12 text-center">Loading Pulse…</p>
      ) : tab === 'published' ? (
        <PostList
          rows={published}
          busy={busy}
          onEdit={fillForm}
          onUnpublish={(id) => void setStatus(id, 'draft')}
          onArchive={(id) => void archivePost(id)}
          empty="No published posts yet. Create and publish from Create Post."
        />
      ) : tab === 'drafts' ? (
        <PostList
          rows={drafts}
          busy={busy}
          onEdit={fillForm}
          onPublish={(id) => void setStatus(id, 'published')}
          onArchive={(id) => void archivePost(id)}
          onDelete={(id) => void deleteDraft(id)}
          empty="No drafts. Create a draft or generate AI suggestions."
        />
      ) : tab === 'create' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <h2 className="text-sm font-semibold text-slate-100">
              {editingId ? 'Edit post' : 'Create post'}
            </h2>
            <label className="block text-xs text-slate-400 space-y-1">
              Post type
              <select
                className={inputClass}
                value={form.post_type}
                onChange={(e) =>
                  setForm({ ...form, post_type: e.target.value as PulsePostType })
                }
              >
                {PULSE_POST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PULSE_POST_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              Category / Future Circle
              <select
                className={inputClass}
                value={form.circle}
                onChange={(e) => setForm({ ...form, circle: e.target.value as PulseCircle })}
              >
                {PULSE_CIRCLES.map((c) => (
                  <option key={c} value={c}>
                    {PULSE_CIRCLE_LABELS[c]}
                  </option>
                ))}
              </select>
              <span className="block text-[10px] text-slate-500 mt-1">
                Used to organise Pulse content now. Circles become interactive later.
              </span>
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              Title (optional)
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short headline"
              />
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              Body
              <textarea
                className={cn(inputClass, 'min-h-[160px]')}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Practical UK career tip…"
              />
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              Tags (comma-separated)
              <input
                className={inputClass}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </label>
            <label className="block text-xs text-slate-400 space-y-1">
              Video URL (YouTube / TikTok / Instagram / LinkedIn)
              <input
                className={inputClass}
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://…"
              />
            </label>
            {form.video_url && !videoCheck.allowed && (
              <p className="text-[11px] text-amber-300">
                Unknown domain — will be saved as source link only (not video embed).
              </p>
            )}
            <label className="block text-xs text-slate-400 space-y-1">
              Image URL (optional)
              <input
                className={inputClass}
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://… or upload below"
              />
            </label>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">Upload image</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                disabled={busy}
                className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-xs file:text-slate-200"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void uploadImage(file)
                  e.target.value = ''
                }}
              />
              <p className="text-[10px] text-slate-500">
                JPG, PNG, or WebP · max 5MB. If storage is not configured, use Image URL instead.
              </p>
            </div>
            <label className="block text-xs text-slate-400 space-y-1">
              Source URL
              <input
                className={inputClass}
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-4 text-xs text-slate-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
                Pin
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                Featured
              </label>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200"
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? 'Hide preview' : 'Preview'}
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200"
                onClick={() => void savePost('draft')}
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                onClick={() => void savePost('published')}
              >
                Publish
              </button>
              {editingId && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400"
                  onClick={() => {
                    setEditingId(null)
                    setForm(emptyForm)
                  }}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-3">Preview</h3>
            {showPreview || form.body ? (
              <PreviewCard form={form} videoCheck={videoCheck} />
            ) : (
              <p className="text-sm text-slate-500">Start writing to preview.</p>
            )}
          </div>
        </div>
      ) : tab === 'ai' ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-300" />
              <h2 className="text-sm font-semibold text-slate-100">Pulse AI Content Planner</h2>
            </div>
            <p className="text-xs text-slate-400">
              AI suggests drafts. Admin decides what becomes public. AI never auto-publishes.
              {aiSource ? ` Last run: ${aiSource}.` : ''}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs text-slate-400 space-y-1">
                Count
                <select
                  className={inputClass}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                >
                  {[1, 3, 5, 7].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                Audience
                <select
                  className={inputClass}
                  value={aiAudience}
                  onChange={(e) => setAiAudience(e.target.value as PulseAiAudience)}
                >
                  {PULSE_AI_AUDIENCES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                Goal
                <select
                  className={inputClass}
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value as PulseAiGoal)}
                >
                  {PULSE_AI_GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                Circle
                <select
                  className={inputClass}
                  value={aiCircle}
                  onChange={(e) => setAiCircle(e.target.value as PulseCircle)}
                >
                  {PULSE_CIRCLES.map((c) => (
                    <option key={c} value={c}>
                      {PULSE_CIRCLE_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Optional course type (not fake provider)"
                value={aiCourse}
                onChange={(e) => setAiCourse(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Optional video URL"
                value={aiVideo}
                onChange={(e) => setAiVideo(e.target.value)}
              />
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAi()}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"
            >
              {busy ? 'Generating…' : 'Suggest posts'}
            </button>
          </div>

          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <p className="text-sm text-slate-500">No AI suggestions yet.</p>
            ) : (
              suggestions.map((s) => (
                <article
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                    <span>{s.post_type}</span>
                    <span>·</span>
                    <span>{s.circle}</span>
                    <span>·</span>
                    <span>{s.status}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{s.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{s.body}</p>
                  {s.reason && <p className="text-[11px] text-slate-500">{s.reason}</p>}
                  {s.status === 'suggested' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
                        onClick={() => void convertSuggestion(s.id, false)}
                      >
                        Create draft
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() => void convertSuggestion(s.id, true)}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500"
                        onClick={() =>
                          void fetch('/api/admin/pulse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'reject_suggestion',
                              suggestion_id: s.id,
                            }),
                          }).then(() => loadSuggestions())
                        }
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      ) : tab === 'comments' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-3">
            Phase 1: view recent comments. Advanced moderation AI is out of scope.
          </p>
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div
                key={String(c.id)}
                className="rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300"
              >
                <p className="text-[10px] text-slate-500 mb-1">
                  post {String(c.post_id).slice(0, 8)}… · {String(c.created_at || '')}
                </p>
                {String(c.content || '')}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 space-y-2 text-sm text-slate-300">
          <p>
            <strong className="text-slate-100">Phase 1 settings</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
            <li>Public feed shows status=published only.</li>
            <li>Public composer is disabled for Phase 1 (admin-seeded content).</li>
            <li>Category / Future Circle organises content; circles are not interactive yet.</li>
            <li>Video: external links only (YouTube, TikTok, Instagram, LinkedIn).</li>
            <li>No direct video upload. No auto-publish from AI.</li>
            <li>
              Public route:{' '}
              <Link href="/feed" className="text-emerald-300 underline">
                /feed
              </Link>
            </li>
          </ul>
        </div>
      )}
    </AppShell>
  )
}

function PostList({
  rows,
  busy,
  onEdit,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
  empty,
}: {
  rows: AdminPulsePost[]
  busy: boolean
  onEdit: (p: AdminPulsePost) => void
  onPublish?: (id: string) => void
  onUnpublish?: (id: string) => void
  onArchive: (id: string) => void
  onDelete?: (id: string) => void
  empty: string
}) {
  if (!rows.length) return <p className="text-sm text-slate-500 py-8">{empty}</p>
  return (
    <div className="space-y-3">
      {rows.map((p) => (
        <article
          key={p.id}
          className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
            <span>{p.post_type}</span>
            <span>·</span>
            <span>{p.circle}</span>
            <span>·</span>
            <span>{p.status}</span>
            {p.pinned && (
              <span className="inline-flex items-center gap-0.5 text-amber-300">
                <Pin className="w-3 h-3" /> pinned
              </span>
            )}
            {p.featured && (
              <span className="inline-flex items-center gap-0.5 text-violet-300">
                <Star className="w-3 h-3" /> featured
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-slate-100">{p.title || 'Untitled'}</h3>
          <p className="text-sm text-slate-400 line-clamp-3 whitespace-pre-wrap">{p.body}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
              onClick={() => onEdit(p)}
            >
              Edit
            </button>
            {onPublish && (
              <button
                type="button"
                disabled={busy}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                onClick={() => onPublish(p.id)}
              >
                Publish
              </button>
            )}
            {onUnpublish && (
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
                onClick={() => onUnpublish(p.id)}
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500"
              onClick={() => onArchive(p.id)}
            >
              Archive
            </button>
            {onDelete && (
              <button
                type="button"
                disabled={busy}
                className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/30"
                onClick={() => onDelete(p.id)}
              >
                Delete
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

function PreviewCard({
  form,
  videoCheck,
}: {
  form: typeof emptyForm
  videoCheck: ReturnType<typeof parsePulseVideoUrl>
}) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-[10px] font-bold text-emerald-200">
          JZ
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">JobAZ Career Team</p>
          <p className="text-[10px] text-slate-500">
            {PULSE_POST_TYPE_LABELS[form.post_type]} · {PULSE_CIRCLE_LABELS[form.circle]}
          </p>
        </div>
      </div>
      {form.title && <h3 className="text-sm font-semibold text-slate-50">{form.title}</h3>}
      <p className="text-sm text-slate-300 whitespace-pre-wrap">{form.body || '…'}</p>
      {videoCheck.allowed && videoCheck.provider === 'youtube' && videoCheck.embedUrl ? (
        <div className="aspect-video rounded-lg overflow-hidden border border-slate-700">
          <iframe
            title="Video preview"
            src={videoCheck.embedUrl}
            className="w-full h-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : form.video_url ? (
        <a
          href={form.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-3 text-sm text-cyan-200"
        >
          Open video ↗
        </a>
      ) : null}
      {form.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.image_url} alt="" className="rounded-lg max-h-48 object-cover w-full" />
      )}
    </div>
  )
}
