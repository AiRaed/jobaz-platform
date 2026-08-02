import { Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  text: string
  className?: string
}

export default function CourseOfferHelperLine({ text, className }: Props) {
  const hint = text.trim()
  if (!hint) return null

  return (
    <p
      className={cn(
        'flex items-start gap-1 text-[11px] leading-snug text-emerald-400/95',
        className
      )}
    >
      <Tag className="w-3 h-3 shrink-0 mt-0.5 text-cyan-400/90" aria-hidden />
      <span className="line-clamp-2">{hint}</span>
    </p>
  )
}
