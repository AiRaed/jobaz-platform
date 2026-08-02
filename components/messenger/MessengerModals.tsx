'use client'

import { useState } from 'react'
import { Calendar, Loader2, Phone, Video, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type AppointmentProps = {
  open: boolean
  onClose: () => void
  onSubmit: (proposedTime: string, message: string) => Promise<void>
}

export function AppointmentRequestModal({ open, onClose, onSubmit }: AppointmentProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const submit = async () => {
    if (!date || !time) return
    setLoading(true)
    try {
      const proposed = new Date(`${date}T${time}`).toISOString()
      await onSubmit(proposed, message)
      setDate('')
      setTime('')
      setMessage('')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-slate-950 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            Request appointment
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Propose a time for a professional chat about work or opportunities.</p>
        <div className="grid gap-3 sm:grid-cols-2 mb-3">
          <label className="block text-xs text-slate-500">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
            />
          </label>
          <label className="block text-xs text-slate-500">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
            />
          </label>
        </div>
        <label className="block text-xs text-slate-500 mb-4">
          Message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Brief context for the meeting…"
            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 resize-none"
          />
        </label>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-600/60 px-4 py-2 text-sm text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !date || !time}
            onClick={() => void submit()}
            className={cn(
              'rounded-full bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:opacity-50',
              'inline-flex items-center gap-2'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Send request
          </button>
        </div>
      </div>
    </div>
  )
}

type CallProps = {
  open: boolean
  callType: 'audio' | 'video'
  onClose: () => void
  onSubmit: (scheduledTime: string | null, message: string) => Promise<void>
}

export function CallRequestModal({ open, callType, onClose, onSubmit }: CallProps) {
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const Icon = callType === 'video' ? Video : Phone
  const label = callType === 'video' ? 'video' : 'audio'

  const submit = async () => {
    setLoading(true)
    try {
      let scheduled: string | null = null
      if (mode === 'schedule' && date && time) {
        scheduled = new Date(`${date}T${time}`).toISOString()
      }
      await onSubmit(scheduled, message)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-slate-950 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Icon className="w-5 h-5 text-cyan-400" />
            Request {label} call
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Live calls are coming soon. Use this to agree a time professionally.
        </p>
        <div className="flex gap-2 mb-4">
          {(['now', 'schedule'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs border cursor-pointer',
                mode === m
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-200'
                  : 'border-slate-700 text-slate-400'
              )}
            >
              {m === 'now' ? 'Request now' : 'Schedule later'}
            </button>
          ))}
        </div>
        {mode === 'schedule' && (
          <div className="grid gap-3 sm:grid-cols-2 mb-3">
            <label className="block text-xs text-slate-500">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="block text-xs text-slate-500">
              Time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200"
              />
            </label>
          </div>
        )}
        <label className="block text-xs text-slate-500 mb-4">
          Optional message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-700/60 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 resize-none"
          />
        </label>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-600/60 px-4 py-2 text-sm text-slate-300 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || (mode === 'schedule' && (!date || !time))}
            onClick={() => void submit()}
            className="rounded-full bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-sm font-medium text-white cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Send call request
          </button>
        </div>
      </div>
    </div>
  )
}
