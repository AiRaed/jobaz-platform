import JazEyeIcon from '@/components/JazEyeIcon'
import TypingDots from './TypingDots'

interface ThinkingBubbleProps {
  message: string
}

export default function ThinkingBubble({ message }: ThinkingBubbleProps) {
  return (
    <div className="flex justify-start items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/40 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
        <JazEyeIcon size={18} ariaLabel="AI Career Intelligence" />
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="rounded-xl px-5 py-3 bg-gradient-to-r from-purple-600/20 to-indigo-500/20 border border-purple-500/30 shadow-[0_0_35px_rgba(139,92,246,0.35)] backdrop-blur-sm animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-medium">JAZ</span>
            <span className="text-sm text-white">{message}</span>
            <TypingDots />
          </div>
        </div>
      </div>
    </div>
  )
}

