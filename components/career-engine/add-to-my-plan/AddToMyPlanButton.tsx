'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { PlanPickCatalog } from '@/lib/career-assistant/add-to-my-plan/types'
import { catalogSelectionKey } from '@/lib/career-assistant/add-to-my-plan/buildAddToPlanInitialSelection'
import { AddToMyPlanModal } from './AddToMyPlanModal'
import { CA_ACTION_BTN } from '@/components/career-engine/shared/CaUi'

type Props = {
  catalog: PlanPickCatalog | null | undefined
  className?: string
  primary?: boolean
}

export function AddToMyPlanButton({ catalog, className, primary = true }: Props) {
  const [open, setOpen] = useState(false)
  if (!catalog) return null
  const hasItems =
    catalog.roles.length + catalog.training.length + catalog.skills.length > 0
  if (!hasItems) return null

  const selectionKey = catalogSelectionKey(catalog)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          primary
            ? 'inline-flex min-h-10 items-center justify-center rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500'
            : CA_ACTION_BTN,
          className
        )}
      >
        Add to My Plan
      </button>
      {/* Remount when the Career Assistant result identity changes */}
      <AddToMyPlanModal
        key={selectionKey}
        open={open}
        onClose={() => setOpen(false)}
        catalog={catalog}
      />
    </>
  )
}
