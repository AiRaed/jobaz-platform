import JazEyeIcon from '@/components/JazEyeIcon'

interface AssistantBubbleProps {
  content: string
  timestamp?: string
  showTimestamp?: boolean
}

export default function AssistantBubble({ content, timestamp, showTimestamp = false }: AssistantBubbleProps) {
  return (
    <div className="flex justify-start items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Assistant Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/40 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
        <JazEyeIcon size={18} ariaLabel="AI Career Intelligence" />
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className="rounded-xl px-5 py-3 bg-gradient-to-r from-purple-600/20 to-indigo-500/20 border border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.25)] backdrop-blur-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{content}</p>
          {showTimestamp && timestamp && (
            <p className="text-xs text-purple-200/50 mt-1.5">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  )
}

