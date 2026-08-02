import type { JourneyNextAction, JourneySignalInput } from './types'
import { buildJourneySnapshot } from './engine'
import { composeCareerJourneySnapshot } from './storage'

export type ResolvedSmartMove = {
  title: string
  description: string
  href: string
  stateLabel: string
  toolLabel?: string
}

/** Unified next-action resolver for dashboard + assistant */
export function resolveNextSmartMove(signals: JourneySignalInput): ResolvedSmartMove {
  const snapshot = composeCareerJourneySnapshot(signals)
  const primary =
    snapshot.nextActions.find((a) => a.priority === 'primary') ?? snapshot.nextActions[0]

  if (primary) {
    return {
      title: primary.title,
      description: primary.description,
      href: primary.href,
      stateLabel: snapshot.stateLabel,
      toolLabel: primary.toolLabel,
    }
  }

  return {
    title: 'Start your career journey',
    description: 'Talk to JAZ to map Work Now, Build Next, and long-term UK directions.',
    href: '/uk-career-assistant',
    stateLabel: snapshot.stateLabel,
    toolLabel: 'UK Career Assistant',
  }
}

export function resolveNextSmartMoveFromActions(
  actions: JourneyNextAction[],
  stateLabel: string
): ResolvedSmartMove {
  const primary = actions.find((a) => a.priority === 'primary') ?? actions[0]
  if (!primary) {
    return {
      title: 'Continue with JAZ',
      description: 'Your career companion is ready for the next step.',
      href: '/uk-career-assistant',
      stateLabel,
    }
  }
  return {
    title: primary.title,
    description: primary.description,
    href: primary.href,
    stateLabel,
    toolLabel: primary.toolLabel,
  }
}
