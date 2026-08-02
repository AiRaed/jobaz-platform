import JazEyeIcon from '@/components/ui/JazEyeIcon'

interface AssistantBubbleProps {
  content: string
  timestamp?: string
  showTimestamp?: boolean
}

export default function AssistantBubble({ content, timestamp, showTimestamp = false }: AssistantBubbleProps) {
  return (
    <div className="uk-ca-assistant-row flex justify-start items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <JazEyeIcon variant="header" className="flex-shrink-0" />
      <div className="flex-1 max-w-[88%]">
        <div className="uk-ca-bubble uk-ca-bubble--assistant relative rounded-2xl px-5 py-3.5 border border-violet-500/25 bg-gradient-to-br from-violet-950/35 via-slate-900/70 to-indigo-950/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25),0_0_24px_rgba(139,92,246,0.12)]">
          <p className="uk-ca-label text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 mb-1.5">
            JAZ
          </p>
          <p className="uk-ca-body whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{content}</p>
          {showTimestamp && timestamp && (
            <p className="uk-ca-meta text-xs text-violet-200/40 mt-2">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  )
}
