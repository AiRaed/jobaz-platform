'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { JazQuickAction } from '@/lib/jaz/quickActions'

type Props = {
  actions: JazQuickAction[]
  onAction: (action: JazQuickAction) => void
  disabled?: boolean
  className?: string
}

export default function JazQuickActionsBar({ actions, onAction, disabled, className }: Props) {
  const router = useRouter()

  return (
    <div className={cn('jaz-quick-actions px-3.5 py-3 border-b border-slate-700/30 bg-slate-900/25', className)}>
      <p className="jaz-quick-actions-label text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
        Quick actions
      </p>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (action.href) {
                router.push(action.href)
                return
              }
              onAction(action)
            }}
            className={cn(
              'jaz-quick-action px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition',
              'border-slate-700/50 bg-slate-800/50 text-slate-300',
              'hover:border-violet-500/40 hover:bg-violet-950/30 hover:text-violet-100',
              'disabled:opacity-40 disabled:pointer-events-none',
              action.intent === 'translate' &&
                'jaz-quick-action--translate border-cyan-500/25 hover:border-cyan-500/40 hover:bg-cyan-950/20 hover:text-cyan-100'
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
