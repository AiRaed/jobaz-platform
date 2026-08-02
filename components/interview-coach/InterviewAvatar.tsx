'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type AvatarState = 'speaking' | 'listening' | 'idle' | 'thinking'

type InterviewAvatarProps = {
  state: AvatarState
  statusLabel?: string
}

const DEFAULT_STATUS: Record<AvatarState, string> = {
  speaking: 'AI interviewer is asking the question…',
  listening: 'Listening…',
  idle: 'AI interviewer is ready for the next question.',
  thinking: 'Thinking…',
}

export default function InterviewAvatar({ state, statusLabel }: InterviewAvatarProps) {
  const [src, setSrc] = useState('/avatars/interviewer_idle.png')
  const [speakingFrame, setSpeakingFrame] = useState(0)
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const listeningReturnTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const idleReturnTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const speakingFrames = [
    '/avatars/interviewer_talk_a.png',
    '/avatars/interviewer_talk_o.png',
    '/avatars/interviewer_talk_closed.png',
  ]

  useEffect(() => {
    if (state === 'speaking' || state === 'thinking') {
      const interval = setInterval(() => {
        setSpeakingFrame((prev) => {
          const nextFrame = (prev + 1) % speakingFrames.length
          setSrc(speakingFrames[nextFrame])
          return nextFrame
        })
      }, state === 'thinking' ? 600 : 400)

      setSrc(speakingFrames[0])
      return () => clearInterval(interval)
    }
    setSpeakingFrame(0)
  }, [state, speakingFrames.length])

  useEffect(() => {
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current)
      listeningTimeoutRef.current = null
    }
    if (listeningReturnTimeoutRef.current) {
      clearTimeout(listeningReturnTimeoutRef.current)
      listeningReturnTimeoutRef.current = null
    }

    if (state === 'listening') {
      setSrc('/avatars/interviewer_idle.png')

      const scheduleBlink = () => {
        if (stateRef.current !== 'listening') return
        const openDuration = 3000 + Math.random() * 1000

        listeningTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== 'listening') return
          setSrc('/avatars/interviewer_listen_closed.png')
          const closedDuration = 100 + Math.random() * 30

          listeningReturnTimeoutRef.current = setTimeout(() => {
            if (stateRef.current !== 'listening') return
            setSrc('/avatars/interviewer_idle.png')
            scheduleBlink()
          }, closedDuration)
        }, openDuration)
      }

      scheduleBlink()

      return () => {
        if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current)
        if (listeningReturnTimeoutRef.current) clearTimeout(listeningReturnTimeoutRef.current)
      }
    }
  }, [state])

  useEffect(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = null
    }
    if (idleReturnTimeoutRef.current) {
      clearTimeout(idleReturnTimeoutRef.current)
      idleReturnTimeoutRef.current = null
    }

    if (state === 'idle') {
      setSrc('/avatars/interviewer_idle.png')

      const scheduleBlink = () => {
        if (stateRef.current !== 'idle') return
        const delay = 5000 + Math.random() * 1000

        idleTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== 'idle') return
          setSrc('/avatars/interviewer_listen_closed.png')
          const closedDuration = 100 + Math.random() * 30

          idleReturnTimeoutRef.current = setTimeout(() => {
            if (stateRef.current !== 'idle') return
            setSrc('/avatars/interviewer_idle.png')
            scheduleBlink()
          }, closedDuration)
        }, delay)
      }

      scheduleBlink()

      return () => {
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
        if (idleReturnTimeoutRef.current) clearTimeout(idleReturnTimeoutRef.current)
      }
    }
  }, [state])

  const displayStatus = statusLabel ?? DEFAULT_STATUS[state]

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div
        className={cn(
          'relative w-32 h-32 rounded-full overflow-hidden ring-2 transition-all duration-300 animate-avatar-breathe',
          (state === 'speaking' || state === 'thinking') &&
            'ring-violet-400/80 shadow-lg animate-avatar-speaking',
          state === 'listening' && 'ring-emerald-400/80 shadow-lg animate-avatar-listening',
          state === 'idle' && 'ring-slate-600/60'
        )}
      >
        <div className="w-32 h-32 mx-auto rounded-full bg-black/40 flex items-center justify-center">
          <img
            src={src}
            alt={`AI interviewer avatar (${state})`}
            className="w-24 h-24 object-contain transition-all duration-75"
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-300 text-center max-w-[220px]">{displayStatus}</p>
    </div>
  )
}
