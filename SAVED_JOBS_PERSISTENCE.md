# Saved Jobs Persistence - Test Checklist

This document outlines the test checklist for verifying that Job Finder "Saved Jobs" persist across browsers/devices using Supabase.

## Migration Summary

- **Feature**: Job Finder "Saved Jobs" persistence
- **Migration**: localStorage → Supabase
- **Scope**: Job Finder only (not Dashboard)
- **Table**: `public.saved_jobs`
- **API Routes**: 
  - `GET /api/saved-jobs/list` - List all saved jobs for authenticated user
  - `POST /api/saved-jobs/toggle` - Toggle save/unsave for a job

## Test Checklist

### Prerequisites
- [ ] Supabase migration has been applied (`supabase/migrations/20240101000000_create_saved_jobs.sql`)
- [ ] User account is created and logged in
- [ ] Job Finder page is accessible at `/job-finder`

### Test 1: Save Job in Browser A
1. [ ] Navigate to Job Finder (`/job-finder`)
2. [ ] Perform a job search
3. [ ] Click "Save" button on a job
4. [ ] Verify job appears in "Saved Jobs" sidebar
5. [ ] Verify "Save" button changes to "Saved" (disabled state)
6. [ ] Check browser console for `[SavedJobs]` logs confirming API call success

### Test 2: Persistence After Refresh (Browser A)
1. [ ] With a job saved (from Test 1)
2. [ ] Refresh the page (F5 or Ctrl+R)
3. [ ] Verify saved job still appears in "Saved Jobs" sidebar after page loads
4. [ ] Verify job still shows "Saved" state in job results
5. [ ] Check browser console for `[SavedJobs]` logs showing successful load from Supabase

### Test 3: Cross-Device Persistence (Browser B)
1. [ ] Open a different browser or device
2. [ ] Log in with the same user account
3. [ ] Navigate to Job Finder (`/job-finder`)
4. [ ] Verify the same saved job from Browser A appears in "Saved Jobs" sidebar
5. [ ] Perform a new search
6. [ ] Verify the previously saved job still shows "Saved" state if it appears in results
7. [ ] Save a new job in Browser B
8. [ ] Switch back to Browser A and refresh
9. [ ] Verify the job saved in Browser B now appears in Browser A

### Test 4: Unsave Job
1. [ ] With a job saved
2. [ ] Click "Save" button again (should be "Saved" state)
3. [ ] Verify job is removed from "Saved Jobs" sidebar
4. [ ] Verify job button changes back to "Save" (enabled state)
5. [ ] Refresh the page
6. [ ] Verify job remains unsaved after refresh
7. [ ] Check browser console for `[SavedJobs]` logs confirming unsave operation

### Test 5: Multiple Jobs
1. [ ] Save 3-5 different jobs
2. [ ] Verify all appear in "Saved Jobs" sidebar
3. [ ] Refresh the page
4. [ ] Verify all saved jobs persist after refresh
5. [ ] Unsave one job
6. [ ] Verify only that job is removed, others remain

### Test 6: Unauthenticated User
1. [ ] Log out
2. [ ] Navigate to Job Finder
3. [ ] Verify "Saved Jobs" sidebar is empty (or shows empty state)
4. [ ] Try to save a job
5. [ ] Verify job is not saved (should fail silently or show error)
6. [ ] Check browser console for `[SavedJobs]` logs showing 401 error

### Test 7: Network Error Handling
1. [ ] With a job saved
2. [ ] Open browser DevTools → Network tab
3. [ ] Set network to "Offline"
4. [ ] Try to save/unsave a job
5. [ ] Verify optimistic update is reverted on error
6. [ ] Set network back to "Online"
7. [ ] Verify saved jobs reload correctly

## Expected Behavior

### Console Logs
All operations should log with `[SavedJobs]` prefix:
- `[SavedJobs] GET /api/saved-jobs/list - Starting request`
- `[SavedJobs] GET /api/saved-jobs/list - User authenticated: <user_id>`
- `[SavedJobs] GET /api/saved-jobs/list - Found X saved jobs`
- `[SavedJobs] POST /api/saved-jobs/toggle - Toggling job_key: <job_id>`
- `[SavedJobs] POST /api/saved-jobs/toggle - Job saved successfully`

### API Responses
- `GET /api/saved-jobs/list`: Returns `{ ok: true, items: [...] }`
- `POST /api/saved-jobs/toggle`: Returns `{ ok: true, saved: boolean }`
- Both return `401` if unauthenticated

### UI Behavior
- Saved jobs persist across page refreshes
- Saved jobs sync across devices/browsers for the same user
- Optimistic updates provide instant UI feedback
- Errors gracefully revert optimistic updates

## Database Verification

### Check Saved Jobs in Supabase
```sql
-- View all saved jobs for a user
SELECT * FROM public.saved_jobs 
WHERE user_id = '<user_id>' 
ORDER BY created_at DESC;

-- Verify RLS policies are working
-- (Should only return rows for authenticated user)
SELECT * FROM public.saved_jobs;
```

### Verify Table Structure
```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'saved_jobs';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'saved_jobs';
```

## Known Limitations

- Saved jobs are only available in Job Finder (not Dashboard)
- Requires user authentication (logged in)
- No localStorage fallback (Supabase only)
- Job caching (sessionStorage) for Adzuna jobs is separate and unchanged

## Rollback Plan

If issues are found:
1. Migration can be rolled back: `DROP TABLE IF EXISTS public.saved_jobs CASCADE;`
2. Code changes are isolated to Job Finder page and new API routes
3. No changes to Dashboard or other features

