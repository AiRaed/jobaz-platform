# JobAZ Architecture

JobAZ is organised into clear layers so the product, rules, AI engines, and data stay separable.

## Layer overview

### 1. User Product Layer

What users see and use:

- Homepage
- Career Assistant
- My Plan
- Courses / Licences
- Documents
- CV Builder
- Jobs / Opportunities

This layer delivers the practical route journey. It should stay focused on user outcomes.

### 2. Admin Intelligence Layer

What the founder uses to manage and improve the platform:

- AI Manager
- AI Supervisor
- Technical Reports
- Affiliate Scout
- Marketing AI
- Site Brain
- Admin Tasks

This is the **control centre** for a solo founder. Admin AI suggests; the founder decides.

### 3. Knowledge Layer

Reusable JobAZ business and career logic:

- Career routes
- Course mappings
- CV focus rules
- Recommendation rules
- Provider rules
- Site Brain defaults

Local source/backup lives in `/data/knowledge`. Live operational data lives in Supabase.

### 4. AI Engine Layer

OpenAI, Ollama, and similar providers are **language engines**.

They help write, summarise, and suggest. They are **not** the source of truth for JobAZ rules, routes, providers, or metrics.

### 5. Database Layer

**Supabase** is the live operational source of truth for:

- Users, plans, CVs (private)
- Courses, providers, referrals
- Admin reports and tasks
- Site Brain versions

### 6. Local Knowledge Source

`/data/knowledge` holds structured, version-controlled public/business knowledge:

- Safe to commit (no secrets, no private user data)
- Used as backup, documentation, and future Knowledge API input
- Complements — does not replace — Supabase

## Core equation

| Piece | Role |
| --- | --- |
| **Data + Rules** | Asset — reusable JobAZ knowledge |
| **AI** | Engine — generates language and suggestions |
| **Website** | Product — what users experience |
| **Admin AI** | Control Centre — helps the founder manage the product |

## Design rules

- Do not treat model output as truth without Product / Knowledge / Database context
- Do not put secrets or private user data into `/data/knowledge`
- Do not invent providers, prices, metrics, or partnerships
- Keep public product flows stable while Admin Intelligence and Knowledge evolve
