import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface UserBubbleProps {
  content: string
  timestamp?: string
  showTimestamp?: boolean
}

export default function UserBubble({ content, timestamp, showTimestamp = false }: UserBubbleProps) {
  return (
    <div className="flex justify-end items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-1 max-w-[80%] flex justify-end">
        <div className="rounded-xl px-5 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 shadow-lg backdrop-blur-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{content}</p>
          {showTimestamp && timestamp && (
            <p className="text-xs text-cyan-400/50 mt-1.5 text-right">{timestamp}</p>
          )}
        </div>
      </div>
      {/* User Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-400/30 flex items-center justify-center shadow-lg">
        <User className="w-4 h-4 text-cyan-300" />
      </div>
    </div>
  )
}

