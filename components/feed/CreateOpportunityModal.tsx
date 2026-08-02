'use client'

import { useState } from 'react'
import { Briefcase, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { OPPORTUNITY_TYPE_OPTIONS } from '@/lib/feed/dbTypes'
import type { CreateOpportunityPayload, PostVisibility } from '@/lib/feed/types'

type Props = {
  open: boolean
  onClose: () => void
  groups: { id: string; name: string }[]
  onSubmit: (payload: CreateOpportunityPayload) => Promise<void>
}

export default function CreateOpportunityModal({ open, onClose, groups, onSubmit }: Props) {
  const [title, setTitle] = useState('')
  const [opportunityType, setOpportunityType] = useState<CreateOpportunityPayload['opportunityType']>('job')
  const [location, setLocation] = useState('United Kingdom')
  const [details, setDetails] = useState('')
  const [pay, setPay] = useState('')
  const [contactPref, setContactPref] = useState<CreateOpportunityPayload['contactPref']>('interest')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [groupId, setGroupId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    if (!title.trim() || !details.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        title: title.trim(),
        opportunityType,
        location: location.trim(),
        details: details.trim(),
        pay: pay.trim() || undefined,
        contactPref,
        visibility,
        groupId: visibility === 'group' && groupId ? groupId : null,
      })
      setTitle('')
      setDetails('')
      setPay('')
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-950 to-cyan-950/20 shadow-[0_0_48px_rgba(6,182,212,0.15)] p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            Add opportunity
          </h2>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Opportunity title *</label>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Type</label>
              <select
                className={inputClass}
                value={opportunityType}
                onChange={(e) => setOpportunityType(e.target.value as CreateOpportunityPayload['opportunityType'])}
              >
                {OPPORTUNITY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Details *</label>
            <textarea
              className={cn(inputClass, 'min-h-[100px]')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Pay / salary (optional)</label>
            <input className={inputClass} value={pay} onChange={(e) => setPay(e.target.value)} placeholder="e.g. £12/hr" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Contact preference</label>
              <select
                className={inputClass}
                value={contactPref}
                onChange={(e) => setContactPref(e.target.value as CreateOpportunityPayload['contactPref'])}
              >
                <option value="interest">Show Interest</option>
                <option value="comment">Comment</option>
                <option value="message">Message later</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Visibility</label>
              <select
                className={inputClass}
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              >
                <option value="public">Public Pulse</option>
                <option value="friends">Connections</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>
          {visibility === 'group' && (
            <select className={inputClass} value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">Select group</option>
              {groups.filter((g) => g.id).map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          disabled={saving || !title.trim() || !details.trim()}
          onClick={() => void handleSubmit()}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-600 to-violet-600 text-white disabled:opacity-40"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting…
            </span>
          ) : (
            'Post opportunity'
          )}
        </button>
      </div>
    </div>
  )
}
