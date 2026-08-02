'use client'

import { createPortal } from 'react-dom'
import { MessageCircle, X } from 'lucide-react'

type Props = { open: boolean; onClose: () => void; displayName?: string }

export default function MessengerComingSoonModal({ open, onClose, displayName }: Props) {
  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-violet-500/25 bg-slate-950 p-6 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-slate-100">Relay</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          {displayName ? `Relay with ${displayName} will open from here soon.` : 'Relay will open from here soon.'}{' '}
          Use Pulse to comment or show interest on opportunities in the meantime.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white cursor-pointer transition"
        >
          Got it
        </button>
      </div>
    </div>,
    document.body
  )
}
