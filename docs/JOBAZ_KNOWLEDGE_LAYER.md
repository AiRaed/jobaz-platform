# JobAZ Knowledge Layer

The Knowledge Layer stores **reusable JobAZ business and career logic** in a structured form so it is not scattered across prompts, components, and chat history.

## Purpose

Preserve:

- Career route logic
- Course-type mappings
- CV focus rules
- Recommendation and Apply Now rules
- Provider status rules
- Admin AI principles
- Site Brain defaults

So future Admin AI, Career Assistant wiring, and other tools can share one consistent JobAZ knowledge base.

## What belongs here

**Public / business knowledge only**, for example:

- Route definitions and work-now / next-upgrade logic
- Course-type relationships by route
- CV keyword and warning rules
- Global recommendation and provider rules
- Admin AI priority language
- Default Site Brain strategy text

## What must never be stored here

- User emails or names
- Full CVs or private documents
- Private assessment answers
- API keys, tokens, or secrets
- Affiliate credentials
- Any sensitive personal data

## Two sources, one asset

| Location | Role |
| --- | --- |
| **Supabase** | Live operational database (source of truth for running the site) |
| **`/data/knowledge`** | Local source, backup, and version-controlled knowledge files |

They should stay aligned over time. Phase 1 creates the local structure. Later import/export scripts and a Knowledge API can sync and serve this knowledge safely.

## Future Knowledge API

Later projects may consume this knowledge through a Knowledge API that:

- Serves route and rule JSON to admin or internal tools
- Never exposes private user data
- Treats AI engines as consumers of rules, not owners of them

## Related files

- `/data/knowledge/*.json` — structured knowledge
- `/data/knowledge/README.md` — local knowledge folder guide
- `/scripts/export-knowledge.ts` — future export from Supabase (placeholder)
- `/scripts/import-knowledge.ts` — future import into Supabase (placeholder)
- `/docs/JOBAZ_PRODUCT_VISION.md`
- `/docs/JOBAZ_ARCHITECTURE.md`
