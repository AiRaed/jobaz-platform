'use client'

import { X } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  toolLabel: string
  onUseSaved: () => void
  onUseGuest: () => void
  /** Optional explicit "merge later" — same as close if omitted */
  onMergeLater?: () => void
}

export default function GuestDraftPickerModal({
  isOpen,
  onClose,
  toolLabel,
  onUseSaved,
  onUseGuest,
  onMergeLater,
}: Props) {
  if (!isOpen) return null

  const handleLater = () => {
    onMergeLater?.()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleLater}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-violet-500/30 bg-slate-950/95 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleLater}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-slate-50 mb-2 pr-8">Choose which CV to open</h2>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          We found a guest {toolLabel.toLowerCase()} draft and a saved CV on your account. Pick one for
          this session — Documents always uses your saved account CV.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              onUseSaved()
              onClose()
            }}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition"
          >
            Continue saved version
          </button>
          <button
            type="button"
            onClick={() => {
              onUseGuest()
              onClose()
            }}
            className="w-full rounded-xl border border-[rgba(64,135,255,0.35)] bg-[rgba(30,144,255,0.08)] px-4 py-3 text-sm font-semibold text-[#8ec8ff] hover:bg-[rgba(30,144,255,0.15)] transition"
          >
            Use guest draft
          </button>
          <button
            type="button"
            onClick={handleLater}
            className="w-full rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-300 transition"
          >
            Decide later
          </button>
        </div>
      </div>
    </div>
  )
}
