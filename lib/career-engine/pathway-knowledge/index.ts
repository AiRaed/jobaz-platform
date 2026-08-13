export type {
  CareerPathwayKnowledge,
  CareerPathwayKnowledgeAdapter,
  PathwayMatchSummary,
  PathwayKnowledgeSource,
  PathwayTextBlock,
  PathwayCourseHint,
  PathwayProgressionRole,
} from './types'

export type {
  PathwayDetailResponse,
  PathwayDetailRole,
  PathwayDetailMatchExplanation,
  PathwayDetailProvenance,
  PathwayMatchContextPayload,
  PathwayMatchStatusLabel,
} from './detail-types'

export { emptyPathwayKnowledge, placeholderBlock, filledBlock } from './placeholders'
export {
  createSupabasePathwayKnowledgeAdapter,
  createHttpPathwayKnowledgeAdapter,
  loadPathwayKnowledgeFromLibrary,
  loadPathwayDetailFromLibrary,
  fetchPathwayDetail,
} from './adapter'
export { matchSummaryFromEligibility, matchSummaryFromPublicCard } from './from-match'
export {
  buildPathwayDetailResponse,
  buildMatchExplanationFromContext,
  resolveMatchStatusLabel,
  missingSectionsFromKnowledge,
  roleRowToDetailRole,
} from './build-detail'
