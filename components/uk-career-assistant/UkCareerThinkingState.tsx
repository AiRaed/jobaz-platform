'use client'

import JazEyeIcon from '@/components/ui/JazEyeIcon'
import TypingDots from './TypingDots'

type Props = {
  message: string
}

export default function UkCareerThinkingState({ message }: Props) {
  const display = message.startsWith('JAZ') ? message : `JAZ ${message}`

  return (
    <div className="flex justify-start items-start gap-3 animate-in fade-in duration-500">
      <JazEyeIcon variant="header" className="flex-shrink-0 uk-thinking-orb" />

      <div className="flex-1 max-w-[90%]">
        <div className="uk-ca-bubble uk-ca-bubble--thinking relative rounded-2xl px-5 py-4 border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-900/60 to-cyan-950/30 backdrop-blur-xl shadow-[0_0_35px_rgba(139,92,246,0.25)] overflow-hidden">
          {/* Waveform */}
          <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-center gap-0.5 opacity-30 px-4 pb-2 pointer-events-none">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-gradient-to-t from-violet-500 to-cyan-400 rounded-full uk-wave-bar"
                style={{ animationDelay: `${i * 0.08}s` }}
              />
            ))}
          </div>

          {/* Radar sweep */}
          <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full border border-cyan-400/20 uk-radar pointer-events-none" />

          <div className="relative flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-violet-300">JAZ</span>
            <span className="text-sm text-slate-200">{display.replace(/^JAZ\s*/i, '')}</span>
            <TypingDots />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes uk-wave {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 18px;
          }
        }
        @keyframes uk-radar-sweep {
          from {
            transform: rotate(0deg);
            opacity: 0.3;
          }
          to {
            transform: rotate(360deg);
            opacity: 0.1;
          }
        }
        @keyframes uk-thinking-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 32px rgba(6, 182, 212, 0.35);
          }
        }
        .uk-wave-bar {
          animation: uk-wave 1.2s ease-in-out infinite;
        }
        .uk-radar {
          animation: uk-radar-sweep 4s linear infinite;
        }
        .uk-thinking-orb {
          animation: uk-thinking-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
