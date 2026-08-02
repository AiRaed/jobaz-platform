# JobAZ local knowledge (`/data/knowledge`)

These files are the **local source / backup** of JobAZ reusable business and career knowledge.

## Why this folder exists

- Preserve route logic, recommendation rules, CV rules, provider rules, Admin AI principles and Site Brain defaults
- Keep knowledge version-controlled in Git
- Support a future Knowledge API and import/export with Supabase

## Safety

These files are **safe to commit to Git** because they contain:

- Public / business knowledge only
- No API keys or secrets
- No user emails, CVs, or private assessment answers

## Relationship to Supabase

| Layer | Role |
| --- | --- |
| **Supabase** | Live operational database |
| **`/data/knowledge`** | Local structured knowledge and backup |

Supabase remains the live operational source of truth for the running product. This folder preserves the reusable knowledge asset.

## Files

| File | Contents |
| --- | --- |
| `career-routes.json` | Route definitions, work-now roles, next upgrades |
| `route-courses.json` | Route → course-type mappings |
| `cv-focus-rules.json` | CV keywords and warning rules by route |
| `recommendation-rules.json` | Global recommendation / Apply Now rules |
| `provider-rules.json` | Provider statuses and Apply Now safety |
| `admin-ai-rules.json` | Admin AI priority and operating principles |
| `site-brain-defaults.json` | Default Site Brain strategic memory |

## Related docs

- `/docs/JOBAZ_KNOWLEDGE_LAYER.md`
- `/docs/JOBAZ_PRODUCT_VISION.md`
- `/docs/JOBAZ_ARCHITECTURE.md`
- `/scripts/export-knowledge.ts` (placeholder)
- `/scripts/import-knowledge.ts` (placeholder)
