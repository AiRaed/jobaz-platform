import { cn } from '@/lib/utils'

interface UserBubbleProps {
  content: string
  timestamp?: string
  showTimestamp?: boolean
}

export default function UserBubble({ content, timestamp, showTimestamp = false }: UserBubbleProps) {
  return (
    <div className="uk-ca-user-row flex justify-end items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex-1 max-w-[85%] flex justify-end">
        <div className="uk-ca-bubble uk-ca-bubble--user rounded-2xl px-4 py-2.5 bg-gradient-to-r from-cyan-600/25 to-blue-600/20 border border-cyan-400/35 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-sm">
          <p className="uk-ca-body whitespace-pre-wrap text-sm leading-relaxed text-slate-50">{content}</p>
          {showTimestamp && timestamp && (
            <p className="uk-ca-meta text-xs text-cyan-400/50 mt-1.5 text-right">{timestamp}</p>
          )}
        </div>
      </div>
      <div
        className={cn(
          'uk-ca-user-avatar flex-shrink-0 w-8 h-8 rounded-full',
          'bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-400/40',
          'flex items-center justify-center text-[10px] font-bold text-cyan-200 shadow-lg'
        )}
      >
        You
      </div>
    </div>
  )
}
