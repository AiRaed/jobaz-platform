import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AnalyticsSectionProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** Reserved for future tabs, filters, or date ranges */
  action?: ReactNode
}

export default function AnalyticsSection({
  title,
  description,
  children,
  className,
  action,
}: AnalyticsSectionProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gray-800 bg-[#0D0D0D] p-6 shadow-xl',
        className
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
