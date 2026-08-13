'use client'

import { OptionCard } from './OptionCard'
import { QuestionCard } from './QuestionCard'
import { NOT_SURE_CLARIFICATION_VALUE } from '@/lib/career-engine/work-in-education/clarification-limit'

export type ClarificationOption = {
  specialism_id: string
  name: string
  reason?: string
  score?: number
}

type Props = {
  reason?: string
  options: ClarificationOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  includeNotSure?: boolean
  question?: string
}

export function ClarificationStep({
  reason,
  options,
  selectedId,
  onSelect,
  includeNotSure = false,
  question,
}: Props) {
  return (
    <QuestionCard
      title="We need one more detail"
      description={
        question ||
        (reason?.trim()
          ? reason.replace(/_/g, ' ')
          : 'Which area best matches your qualification? Choose one option to continue.')
      }
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">Preferred specialism</legend>
        {options.map((o) => (
          <OptionCard
            key={o.specialism_id}
            name="clarification-specialism"
            value={o.specialism_id}
            label={o.name}
            helpText={o.reason}
            selected={selectedId === o.specialism_id}
            onSelect={onSelect}
          />
        ))}
        {includeNotSure ? (
          <OptionCard
            name="clarification-specialism"
            value={NOT_SURE_CLARIFICATION_VALUE}
            label="Something else / not sure"
            helpText="Go back and add a specialisation if none of these fit."
            selected={selectedId === NOT_SURE_CLARIFICATION_VALUE}
            onSelect={onSelect}
          />
        ) : null}
      </fieldset>
      <p className="text-xs text-slate-500">
        Choose from the list only — free-text specialisms are not accepted here.
      </p>
    </QuestionCard>
  )
}
