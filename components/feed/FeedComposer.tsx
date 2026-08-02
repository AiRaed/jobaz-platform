'use client'

import { useEffect, useRef, useState } from 'react'
import { Image, Sparkles, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedPostType } from '@/lib/feed/dbTypes'
import { FEED_POST_TYPE_OPTIONS } from '@/lib/feed/dbTypes'
import type { ComposerHubOption, CurrentUserFeedProfile, PostVisibility } from '@/lib/feed/types'

type Props = {
  user: CurrentUserFeedProfile
  hubOptions: ComposerHubOption[]
  lockHub?: boolean
  isAuthenticated: boolean | null
  onRequireAuth: () => void
  onPost: (opts: {
    text: string
    visibility: PostVisibility
    hubId: string | null
    postType: FeedPostType
    imageUrl?: string | null
  }) => void
  onAiImprove: (text: string, postType?: FeedPostType) => Promise<string>
  draftText?: string
  onDraftChange?: (text: string) => void
  onToast?: (message: string) => void
  onUploadImage?: (file: File) => Promise<string>
}

export default function FeedComposer({
  user,
  hubOptions,
  lockHub = false,
  isAuthenticated,
  onRequireAuth,
  onPost,
  onAiImprove,
  draftText,
  onDraftChange,
  onToast,
  onUploadImage,
}: Props) {
  const [internalText, setInternalText] = useState('')
  const text = draftText ?? internalText
  const setText = onDraftChange ?? setInternalText
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [selectedHubId, setSelectedHubId] = useState<string | null>(hubOptions[0]?.id ?? null)
  const [postType, setPostType] = useState<FeedPostType>('discussion')
  const [aiLoading, setAiLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (lockHub && hubOptions[0]) {
      setSelectedHubId(hubOptions[0].id)
      return
    }
    if (!hubOptions.some((h) => h.id === selectedHubId)) {
      setSelectedHubId(hubOptions[0]?.id ?? null)
    }
  }, [hubOptions, lockHub, selectedHubId])

  const handlePost = () => {
    if (!text.trim()) return
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    onPost({ text, visibility, hubId: selectedHubId, postType, imageUrl })
    setText('')
    setImageUrl(null)
  }

  const handleAiImprove = async () => {
    if (!text.trim()) return
    setAiLoading(true)
    try {
      const improved = await onAiImprove(text, postType)
      if (!improved || improved === text) {
        onToast?.('AI writing help is not active yet — try again when Ollama is connected.')
      } else {
        setText(improved)
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleImage = async (file: File) => {
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    if (!onUploadImage) return
    setUploading(true)
    try {
      const url = await onUploadImage(file)
      setImageUrl(url)
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const showHubPicker = hubOptions.length > 0

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-950/90 via-violet-950/15 to-slate-950/90 backdrop-blur-xl shadow-[0_0_30px_rgba(139,92,246,0.08)] p-4 md:p-5">
      <h2 className="text-sm font-bold text-slate-100 mb-1">Share on Pulse</h2>
      <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
        Share progress, opportunities, projects, training, or questions on Pulse.
      </p>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600/50 to-cyan-500/30 border border-violet-400/40 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            user.initials
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Share your career progress, question, or success…"
          className="flex-1 resize-none bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
      </div>

      {imageUrl && (
        <div className="mt-3 md:ml-[52px] relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-40 rounded-xl border border-slate-700/50" />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            className="absolute top-1 right-1 text-[10px] px-2 py-0.5 rounded bg-slate-950/80 text-slate-300"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3 md:ml-[52px]">
        <select
          value={postType}
          onChange={(e) => setPostType(e.target.value as FeedPostType)}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 focus:outline-none"
        >
          {FEED_POST_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {showHubPicker && (
          <select
            value={selectedHubId ?? ''}
            onChange={(e) => setSelectedHubId(e.target.value || null)}
            disabled={lockHub}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 focus:outline-none disabled:opacity-60"
          >
            {hubOptions.map((h) => (
              <option key={h.id ?? 'public'} value={h.id ?? ''}>
                {h.id ? h.name : h.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as PostVisibility)}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 focus:outline-none"
        >
          <option value="public">Public Pulse</option>
          <option value="friends">Connections</option>
          <option value="group">Circle only</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/50">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleImage(f)
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !onUploadImage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700/50 text-slate-300 hover:border-violet-500/30 transition disabled:opacity-50"
        >
          <Image className="w-3.5 h-3.5" />
          {uploading ? 'Uploading…' : 'Add image'}
        </button>
        <button
          type="button"
          onClick={() => onToast?.('Video posts coming soon')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-700/50 text-slate-500 hover:text-slate-400 transition"
        >
          <Video className="w-3.5 h-3.5" />
          Add video
        </button>
        <button
          type="button"
          onClick={() => void handleAiImprove()}
          disabled={aiLoading || !text.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 transition disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {aiLoading ? 'Improving…' : 'Ask AI to improve post'}
        </button>
        <button
          type="button"
          onClick={handlePost}
          disabled={!text.trim()}
          className={cn(
            'ml-auto px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white',
            'shadow-[0_0_16px_rgba(139,92,246,0.3)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition'
          )}
        >
          Share
        </button>
      </div>
    </div>
  )
}
