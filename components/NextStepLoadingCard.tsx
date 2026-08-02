'use client'

import { useNextStepLoadingStore } from '@/lib/next-step-loading-store'
import JazEyeIcon from '@/components/ui/JazEyeIcon'

export function NextStepLoadingCard() {
  const nextStepLoading = useNextStepLoadingStore((state) => state.nextStepLoading)

  if (!nextStepLoading) return null

  return (
    <>
      <style jsx global>{`
        @keyframes nextStepDots {
          0%,
          20% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        .next-step-dot-1 {
          animation: nextStepDots 1.4s infinite;
        }
        .next-step-dot-2 {
          animation: nextStepDots 1.4s infinite 0.2s;
        }
        .next-step-dot-3 {
          animation: nextStepDots 1.4s infinite 0.4s;
        }
      `}</style>
      <div className="mb-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 hover:border-violet-500/50 transition-colors group">
        <div className="flex-shrink-0">
          <JazEyeIcon variant="inline" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-violet-300 mb-0.5">
            JAZ is analyzing
            <span className="inline-flex items-center ml-1">
              <span className="next-step-dot-1">.</span>
              <span className="next-step-dot-2">.</span>
              <span className="next-step-dot-3">.</span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
