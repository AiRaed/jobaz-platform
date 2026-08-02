import { cn } from '@/lib/utils'

type Props = {
  label: string
  className?: string
}

export default function CoursePurposePill({ label, className }: Props) {
  const text = label.trim()
  if (!text) return null

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-medium tracking-wide rounded-full',
        'border border-cyan-500/35 bg-cyan-950/40 px-2 py-0.5 text-cyan-200',
        className
      )}
    >
      {text}
    </span>
  )
}
