# Work in My Education — Batch 6 Result Integration Fix

**Date:** 2026-08-03  
**Status:** Complete  

## Problem

After the wizard completed, the public Career Assistant result view looked like a **legacy summary-only page**:

- Qualification matches  
- Confidence  
- Return to Career Assistant  

Immediate / Realistic / Future role cards (and `CareerPathwayCard`) did not appear.

## Root causes

1. **Empty recommendation buckets**  
   Public assessment API used `includeDrafts: false`. Career Library roles are still largely `draft`, so matching returned **zero roles**. `PublicResultExperience` then rendered only the header/footer.

2. **Lazy / null sections**  
   Role sections returned `null` when arrays were empty, so the page collapsed to a summary-only look.

3. **Hard navigation before results painted**  
   `resultHref` used `location.assign` immediately, which made empty-result debugging harder.

## Fixes (result UI only — no scoring / matching algorithm changes)

### 1. Public assessment role visibility

`POST /api/career-assistant/work-in-my-education/assessment`

- Includes draft + approved library roles unless `WIE_PUBLIC_INCLUDE_DRAFTS=false`
- Matching/eligibility/ranking code paths unchanged; only which library rows are loaded

### 2. `PublicResultExperience` rebuilt as Batch 6 result UI

Always renders:

- Immediate Opportunities → `CareerPathwayCard`  
- Realistic Next Step → `CareerPathwayCard`  
- Future Progression → `CareerPathwayCard`  
- Academic & Research → `CareerPathwayCard`  
- Requirements Still Needed → `CareerPathwayCard`  

Each card supports:

- View pathway (knowledge panel)  
- Prepare CV / Cover Letter / Interview Coach / Courses / Save Pathway  

Empty buckets show a clear empty-state message (never hide the section).

### 3. Wizard completion

- Saves public result handoff  
- Sets step to **results** with `PublicResultExperience`  
- Soft-navigates to `/career-assistant/work-in-my-education/result` after handoff commit  

### 4. Result route

`/career-assistant/work-in-my-education/result` normalizes `recommendations` arrays before rendering `PublicResultExperience`.

## Files touched

| File | Change |
|------|--------|
| `app/api/career-assistant/work-in-my-education/assessment/route.ts` | Draft role visibility for KE path |
| `components/.../PublicResultExperience.tsx` | Always render pathway card buckets |
| `components/.../AssessmentWizard.tsx` | Reliable results step + soft redirect |
| `app/career-assistant/work-in-my-education/result/page.tsx` | Normalize recommendations |
| `.env.example` | `WIE_PUBLIC_INCLUDE_DRAFTS` docs |

## Unchanged

- Assessment blueprint / mapping  
- Matcher scoring & eligibility  
- Wizard question flow  
- Legacy `?legacy=1` conversation  

## How to verify

1. Restart `npm run dev` (if needed)  
2. Career Assistant → Work in My Education → complete wizard  
3. Expect Immediate / Realistic / Future sections with pathway cards  
4. Open **View pathway** → knowledge panel  
5. Confirm action buttons on each expanded card  

## Production note

When library roles are approved for publish, set:

```env
WIE_PUBLIC_INCLUDE_DRAFTS=false
```

so only `approved` roles appear in public results.
