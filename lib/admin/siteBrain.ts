/**
 * Shared Site Brain access for Admin AI tools.
 * Implementation lives in ./ai/siteBrain — this path matches the Phase 2 contract.
 */
export {
  getActiveSiteBrain,
  formatSiteBrainForPrompt,
  buildActiveSiteBrainContextBlock,
  mergeSiteBrainDefaults,
  saveSiteBrain,
  logSiteBrainLoaded,
  toSiteBrainLoadMeta,
  type SiteBrainLoadMeta,
  type SiteBrainEditable,
} from './ai/siteBrain'
