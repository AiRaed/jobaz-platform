'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { FeedGroup } from '@/lib/feed/types'

const CATEGORY_ICONS: Record<string, string> = {
  General: '🌐',
  Logistics: '📦',
  Support: '💬',
  Technology: '💻',
  Healthcare: '🏥',
  Creative: '🎨',
  Transport: '🚗',
  Local: '📍',
  Business: '🏪',
  Training: '📜',
}

type Props = {
  open: boolean
  onClose: () => void
  onCreate: (
    group: Omit<FeedGroup, 'id' | 'joined' | 'memberCount' | 'slug' | 'activityLevel' | 'postsToday'> & {
      visibility: 'public' | 'private'
    }
  ) => void
  creating?: boolean
}

export default function CreateGroupModal({ open, onClose, onCreate, creating }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('General')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🌐')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  if (!open) return null

  const handleCreate = () => {
    if (!name.trim() || creating) return
    onCreate({
      name: name.trim(),
      category,
      description: description.trim() || 'A focused JobAZ career circle.',
      icon: (icon.trim() || CATEGORY_ICONS[category]) ?? '🌐',
      visibility,
    })
    setName('')
    setDescription('')
    setIcon(CATEGORY_ICONS[category] ?? '🌐')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-violet-500/30 bg-slate-950 shadow-[0_0_60px_rgba(139,92,246,0.25)] overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-violet-950/80 via-slate-900 to-cyan-950/60 border-b border-slate-800/60 flex items-center justify-center gap-2">
          <span className="text-3xl">{icon || '🌐'}</span>
          <span className="text-xs text-violet-300/80">New JobAZ Circle</span>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Create Circle</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">A focused space for people on similar career paths</p>
            </div>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Circle name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                placeholder="e.g. Newcastle Warehouse Workers"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setIcon(CATEGORY_ICONS[e.target.value] ?? '🌐')
                }}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              >
                {['General', 'Logistics', 'Transport', 'Support', 'Technology', 'Healthcare', 'Local', 'Creative', 'Business', 'Training'].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  )
                )}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Icon / emoji</span>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                placeholder="📦"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What will members share and learn here?"
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100 resize-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-400 mb-1 block">Visibility</span>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
              >
                <option value="public">Public — anyone can find and join</option>
                <option value="private">Private — invite only</option>
              </select>
            </label>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(139,92,246,0.3)]"
            >
              {creating ? 'Creating…' : 'Create Circle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
