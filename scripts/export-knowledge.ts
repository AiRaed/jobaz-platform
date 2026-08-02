/**
 * JobAZ Knowledge Layer — export script (Phase 1 placeholder)
 *
 * Purpose (later):
 * - Export selected Supabase *knowledge* tables into /data/knowledge JSON files
 *   (e.g. career routes, course mappings, recommendation rules, Site Brain defaults)
 *
 * Safety rules (must never change):
 * - NEVER export private user data
 * - NEVER export emails, names, phone numbers
 * - NEVER export CVs or document contents
 * - NEVER export private assessment answers
 * - NEVER export API keys, tokens, secrets, or affiliate credentials
 *
 * Scope:
 * - Public / business knowledge only
 * - Admin-safe strategic defaults only
 *
 * Usage (future):
 *   npx tsx scripts/export-knowledge.ts
 *
 * This Phase 1 file is intentionally a no-op stub so the Knowledge Layer
 * folder/scripts contract exists without touching live data or public pages.
 */

const KNOWLEDGE_DIR = 'data/knowledge'

function main() {
  console.log('[export-knowledge] Phase 1 placeholder — no export performed.')
  console.log(`[export-knowledge] Target folder (later): ${KNOWLEDGE_DIR}`)
  console.log(
    '[export-knowledge] Reminder: never export PII, CVs, assessment answers, or secrets.'
  )
  console.log(
    '[export-knowledge] When implemented: pull allowed knowledge tables from Supabase → write JSON.'
  )
}

main()
