'use client'

import { cn } from '@/lib/utils'

export function PremiumCard({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={cn(
        'jobaz-card rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]',
        'dark:border-slate-700/60 dark:bg-slate-950/70',
        glow && 'border-violet-500/30 dark:shadow-[0_0_40px_rgba(139,92,246,0.12)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function HorizontalProgressBar({
  value,
  max = 100,
  className,
  barClassName,
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('h-2 rounded-full bg-slate-800 overflow-hidden', className)}>
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-700 ease-out',
          barClassName
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function CircularProgress({
  value,
  max = 10,
  size = 88,
  label,
  sublabel,
  tone = 'violet',
}: {
  value: number
  max?: number
  size?: number
  label: string
  sublabel?: string
  tone?: 'violet' | 'emerald' | 'amber'
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const toneColor =
    tone === 'emerald' ? '#34d399' : tone === 'amber' ? '#fbbf24' : '#a78bfa'

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(51,65,85,0.6)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={toneColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-100 tabular-nums">
            {typeof value === 'number' ? value.toFixed(1) : value}
          </span>
          <span className="text-[9px] text-slate-500">/ {max}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-200 mt-2">{label}</p>
      {sublabel && <p className="text-[10px] text-slate-500 mt-0.5">{sublabel}</p>}
    </div>
  )
}

export function MetricRow({
  label,
  value,
  max = 10,
}: {
  label: string
  value: number
  max?: number
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-violet-300 font-medium tabular-nums">
          {value}/{max}
        </span>
      </div>
      <HorizontalProgressBar value={value} max={max} className="h-1.5" />
    </div>
  )
}

export function PremiumButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className,
  type = 'button',
  dataJazAction,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  className?: string
  type?: 'button' | 'submit'
  dataJazAction?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-jaz-action={dataJazAction}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' &&
          'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-fuchsia-500',
        variant === 'secondary' &&
          'border border-slate-600/70 bg-slate-900/80 text-slate-200 hover:border-violet-400/50 hover:text-violet-100',
        variant === 'danger' &&
          'bg-rose-600/90 text-white hover:bg-rose-500',
        className
      )}
    >
      {children}
    </button>
  )
}
