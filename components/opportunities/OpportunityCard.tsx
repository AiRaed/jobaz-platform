'use client'

import Link from 'next/link'
import { MapPin, Calendar, Banknote, Tag, Mail, Phone } from 'lucide-react'
import type { PublicOpportunity } from '@/lib/opportunities/types'
import { isApplyThroughJobazMethod, truncate } from '@/lib/opportunities/mappers'
import { cn } from '@/lib/utils'

type Props = {
  opportunity: PublicOpportunity
  className?: string
}

export default function OpportunityCard({ opportunity, className }: Props) {
  const displayName = opportunity.business_name || opportunity.poster_name
  const applyViaJobaz = isApplyThroughJobazMethod(opportunity.contact_preference)
  const hasPublicContact =
    Boolean(opportunity.public_contact_email) || Boolean(opportunity.public_contact_phone)
  const relayHref = `/messages?type=opportunity_enquiry&opportunity=${encodeURIComponent(opportunity.id)}&subject=${encodeURIComponent(`Opportunity: ${opportunity.title}`)}`

  return (
    <article
      className={cn(
        'jobaz-card flex h-full flex-col rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] p-4',
        'dark:border-slate-700/60 dark:bg-slate-950/50',
        className
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {opportunity.category && (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--jaz-muted)] dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-200">
            <Tag className="h-2.5 w-2.5" aria-hidden />
            {opportunity.category}
          </span>
        )}
        {opportunity.created_by_admin && (
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-cyan-500/30 dark:bg-cyan-950/30 dark:text-cyan-200">
            Posted by JobAZ
          </span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-50 leading-snug mb-1.5">
        {opportunity.title}
      </h3>

      {displayName && (
        <p className="text-xs text-violet-700 dark:text-violet-300 mb-2 truncate">{displayName}</p>
      )}

      <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400 leading-relaxed mb-3 flex-1">
        {truncate(opportunity.description, 140) || 'No description provided.'}
      </p>

      <div className="space-y-1.5 text-[11px] text-[var(--jaz-muted)] dark:text-slate-400 mb-3">
        {opportunity.location && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            {opportunity.location}
          </p>
        )}
        {opportunity.date_text && (
          <p className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            {opportunity.date_text}
          </p>
        )}
        {opportunity.pay_text && (
          <p className="flex items-center gap-1.5 truncate font-medium text-[var(--jaz-text)] dark:text-slate-200">
            <Banknote className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
            {opportunity.pay_text}
          </p>
        )}
      </div>

      <div className="mt-auto space-y-2">
        {applyViaJobaz && (
          <Link href={relayHref} className="jobaz-btn-primary jobaz-btn-primary-sm w-full">
            Apply through JobAZ
          </Link>
        )}

        <Link
          href={relayHref}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--jaz-text)] hover:border-cyan-500/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
        >
          Message about this opportunity
        </Link>

        {!applyViaJobaz && hasPublicContact && (
          <div className="space-y-1 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-2.5 py-2 dark:border-slate-700/50 dark:bg-slate-900/40">
            {opportunity.public_contact_phone && (
              <a
                href={`tel:${opportunity.public_contact_phone}`}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--jaz-text)] hover:text-violet-700 dark:text-slate-200 dark:hover:text-violet-300"
              >
                <Phone className="h-3 w-3" aria-hidden />
                {opportunity.public_contact_phone}
              </a>
            )}
            {opportunity.public_contact_email && (
              <a
                href={`mailto:${opportunity.public_contact_email}`}
                className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--jaz-text)] hover:text-violet-700 dark:text-slate-200 dark:hover:text-violet-300"
              >
                <Mail className="h-3 w-3" aria-hidden />
                {opportunity.public_contact_email}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
