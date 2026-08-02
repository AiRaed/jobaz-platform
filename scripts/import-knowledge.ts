/**
 * JobAZ Knowledge Layer — import script (Phase 1 placeholder)
 *
 * Purpose (later):
 * - Import /data/knowledge JSON files into Supabase knowledge tables
 *
 * Safety rules (must never change):
 * - Validate JSON first (parse + schema checks)
 * - Do NOT overwrite live data without explicit confirmation
 * - NEVER import or invent private user data
 * - NEVER write API keys, secrets, or credentials from these files
 *   (knowledge files must not contain them anyway)
 *
 * Recommended future flow:
 * 1. Validate all JSON files under data/knowledge
 * 2. Show a dry-run diff of what would change
 * 3. Require an explicit --confirm flag before writing to Supabase
 * 4. Prefer upsert of knowledge records only — never touch users/cvs/assessments
 *
 * Usage (future):
 *   npx tsx scripts/import-knowledge.ts --dry-run
 *   npx tsx scripts/import-knowledge.ts --confirm
 *
 * This Phase 1 file is intentionally a no-op stub so the Knowledge Layer
 * folder/scripts contract exists without touching live data or public pages.
 */

const KNOWLEDGE_DIR = 'data/knowledge'

function main() {
  console.log('[import-knowledge] Phase 1 placeholder — no import performed.')
  console.log(`[import-knowledge] Source folder (later): ${KNOWLEDGE_DIR}`)
  console.log(
    '[import-knowledge] Reminder: validate JSON first; never overwrite live data without confirmation.'
  )
  console.log(
    '[import-knowledge] When implemented: dry-run → confirm → upsert knowledge tables only.'
  )
}

main()
