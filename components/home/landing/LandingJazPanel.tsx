'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import JazEyeIcon from '@/components/ui/JazEyeIcon'
import { cn } from '@/lib/utils'
import {
  getGoalRedirect,
  LANDING_GOAL_OPTIONS,
  type LandingGoalOption,
} from './goalOptions'

type Message =
  | { id: string; role: 'assistant'; text: string }
  | { id: string; role: 'user'; text: string }

const GREETING =
  "Hi! I'll help you find the fastest route to work in the UK."
const GOAL_PROMPT = 'What would you like to do today?'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export default function LandingJazPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: 'assistant', text: GREETING },
    { id: uid(), role: 'assistant', text: GOAL_PROMPT },
  ])
  const [selectedGoal, setSelectedGoal] = useState<LandingGoalOption | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [showGoals, setShowGoals] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [messages, isTyping, selectedGoal])

  const appendAssistant = useCallback((text: string) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'assistant', text }])
  }, [])

  const handleGoalSelect = useCallback(
    (goal: LandingGoalOption) => {
      if (selectedGoal || isTyping) return

      setShowGoals(false)
      setMessages((prev) => [...prev, { id: uid(), role: 'user', text: goal.label }])
      setIsTyping(true)

      setTimeout(() => {
        setIsTyping(false)
        setSelectedGoal(goal)
        appendAssistant(goal.followUp)
      }, 750)
    },
    [appendAssistant, isTyping, selectedGoal]
  )

  return (
    <div
      id="jaz-panel"
      className="relative rounded-3xl border border-violet-500/25 bg-slate-950/70 backdrop-blur-xl shadow-[0_0_80px_rgba(139,92,246,0.15)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative px-5 py-4 border-b border-violet-500/15 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <JazEyeIcon variant="header" />
          <div>
            <p className="text-sm font-semibold text-slate-100">JAZ · AI Career Coach</p>
            <p className="text-[11px] text-emerald-400/90 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready to guide you
            </p>
          </div>
        </div>
        <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-violet-300/70 font-semibold">
          Free · 2 min · No sign-up
        </span>
      </div>

      <div
        ref={scrollRef}
        className="relative min-h-[280px] max-h-[360px] overflow-y-auto px-5 py-5 space-y-4 scroll-smooth"
      >
        {messages.map((msg) =>
          msg.role === 'assistant' ? (
            <AssistantLine key={msg.id} text={msg.text} />
          ) : (
            <UserLine key={msg.id} text={msg.text} />
          )
        )}

        {isTyping && <TypingLine />}

        {selectedGoal && !isTyping && (
          <div className="pl-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Link
              href={getGoalRedirect(selectedGoal.id)}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.45)] hover:from-violet-500 hover:to-fuchsia-500 transition"
            >
              Start Free Assessment
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {showGoals && !selectedGoal && (
        <div className="relative px-5 pb-5 pt-1 border-t border-slate-800/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LANDING_GOAL_OPTIONS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                disabled={isTyping}
                onClick={() => handleGoalSelect(goal)}
                className={cn(
                  'text-left rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-200',
                  'hover:border-violet-500/45 hover:bg-violet-950/30 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]',
                  'transition-all duration-200 disabled:opacity-50'
                )}
              >
                <span className="mr-2">{goal.emoji}</span>
                {goal.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AssistantLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <JazEyeIcon variant="header" className="shrink-0" ariaLabel="" />
      <div className="max-w-[90%] rounded-2xl px-4 py-3 border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-slate-900/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 mb-1">JAZ</p>
        <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}

function UserLine({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className="max-w-[85%] rounded-2xl px-4 py-2.5 bg-gradient-to-r from-cyan-600/25 to-blue-600/20 border border-cyan-400/30">
        <p className="text-sm text-slate-50">{text}</p>
      </div>
    </div>
  )
}

function TypingLine() {
  return (
    <div className="flex items-center gap-3 pl-1">
      <JazEyeIcon variant="header" className="shrink-0" ariaLabel="" />
      <div className="rounded-2xl px-4 py-3 border border-violet-500/15 bg-slate-900/50">
        <span className="flex gap-1">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="h-2 w-2 rounded-full bg-violet-400/70 animate-bounce"
              style={{ animationDelay: `${d * 0.12}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
