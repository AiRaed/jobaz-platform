export { isCareerBrainEnabled } from './config'
export { runCareerBrainTurn, type CareerBrainTurnInput } from './orchestrator'
export { detectCareerDomain, isFieldFirstMode, SPECIALIST_DOMAINS } from './domains'
export type {
  CareerProfile,
  ExtractedCareerProfile,
  CareerDomain,
  CareerBrainOutput,
  CareerBrainDebug,
  CareerBrainTurnResult,
  CareerBrainState,
} from './types'
