'use client'

import { Clock, HelpCircle, Shield, Sparkles, UserCircle } from 'lucide-react'
import type { InterviewBriefConfig } from '@/lib/interview-coach/briefConfig'
import { PremiumButton, PremiumCard } from './shared'

type Props = {
  brief: InterviewBriefConfig
  onStart: () => void
  disabled?: boolean
}

export default function InterviewBriefCard({ brief, onStart, disabled }: Props) {
  return (
    <PremiumCard glow className="overflow-hidden">
      <div className="px-5 py-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-slate-950/80">
        <p className="text-[10px] uppercase tracking-widest text-violet-400 font-semibold mb-1">
          Interview Briefing
        </p>
        <h3 className="text-lg font-semibold text-slate-100">Your session is ready</h3>
        <p className="text-xs text-slate-400 mt-1">
          Review the details below, then start when you are prepared.
        </p>
      </div>

      <div className="p-5 grid sm:grid-cols-2 gap-4">
        <BriefRow label="Company" value={brief.company} />
        <BriefRow label="Role" value={brief.jobTitle} />
        <BriefRow label="Interview Type" value={brief.interviewType} icon={<Shield className="w-3.5 h-3.5" />} />
        <BriefRow label="Questions" value={String(brief.questionCount)} icon={<HelpCircle className="w-3.5 h-3.5" />} />
        <BriefRow
          label="Duration"
          value={`${brief.estimatedDurationMinutes} minutes`}
          icon={<Clock className="w-3.5 h-3.5" />}
        />
        <BriefRow label="Difficulty" value={brief.difficulty} />
        <BriefRow
          label="AI Interviewer"
          value={brief.interviewerName}
          icon={<UserCircle className="w-3.5 h-3.5" />}
          className="sm:col-span-2"
        />
      </div>

      <div className="px-5 pb-5">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Evaluation
        </p>
        <ul className="flex flex-wrap gap-2">
          {brief.evaluationSkills.map((skill) => (
            <li
              key={skill}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-violet-500/25 bg-violet-500/10 text-violet-200"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>

      <div className="px-5 pb-5">
        <PremiumButton
          onClick={onStart}
          disabled={disabled}
          className="w-full"
          dataJazAction="ic_sim_start"
        >
          <Sparkles className="w-4 h-4" />
          Start Interview
        </PremiumButton>
      </div>
    </PremiumCard>
  )
}

function BriefRow({
  label,
  value,
  icon,
  className,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-100 flex items-center gap-1.5">
        {icon && <span className="text-violet-400">{icon}</span>}
        {value}
      </p>
    </div>
  )
}
