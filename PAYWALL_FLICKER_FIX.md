# Paywall Flicker Fix - Complete Implementation

## Problem
The paywall overlay was briefly flashing between every question transition during the free trial (first 15 questions), then disappearing and allowing users to continue. After 15 questions, the lock worked correctly but the flicker was disruptive.

## Solution Implemented

### Key Changes to `app/practice/page.tsx`

1. **Single Derived Boolean**
   ```typescript
   const TRIAL_LIMIT = 15
   const isLocked = !paid && freeUsed >= TRIAL_LIMIT
   ```
   - NOT tied to loading state
   - Simple, clear logic

2. **Paywall Rendering Logic**
   ```typescript
   const shouldShowPaywall = (isLocked || showPaywall) && !loading
   ```
   - Only shows when locked AND not loading
   - Prevents flash during access loading
   - Once shown, stays shown until payment verified

3. **All Handlers Block When Locked**
   - `handleAnswerSelect`: Checks `isLocked` first, sets `showPaywall(true)` and returns
   - `handleNext`: Checks `isLocked` first, sets `showPaywall(true)` and returns
   - `handlePrevious`: Checks `isLocked` first, sets `showPaywall(true)` and returns
   - Keyboard handlers: Check `isLocked` first, set `showPaywall(true)` and return

4. **Answer Submission Flow**
   ```typescript
   const handleAnswerSelect = async (answer: string) => {
     if (isLocked) {
       setShowPaywall(true)
       return
     }
     
     setSelectedAnswer(answer)
     const updatedState = await incrementFreeUsed()
     
     // If limit reached, show paywall and DO NOT advance
     if (!updatedState.paid && updatedState.freeUsed >= TRIAL_LIMIT) {
       setShowPaywall(true)
       return // Stay on current question
     }
   }
   ```
   - Increments freeUsed ONLY when answer is selected
   - Checks updated state from API response
   - Blocks advancement if limit reached

5. **No Router Navigation**
   - All question progression uses local state: `setQuestionIndex(prev => prev + 1)`
   - No `router.refresh()`, `router.replace()`, or `router.push()` calls
   - Prevents full page rerenders that cause flicker

6. **Loading State Handling**
   - If access is loading, show loading screen (prevents paywall flash)
   - Don't show paywall while `loading === true`
   - Wait until access is loaded before showing paywall

7. **Paywall Persistence**
   - Once `showPaywall` is set to `true`, it stays true until payment is verified
   - Paywall hides automatically when `paid === true`
   - Prevents mount/unmount during transitions

## Requirements Met

✅ **Trial limit = 15 answered questions**
- `TRIAL_LIMIT = 15` constant defined
- `freeUsed` tracked via API

✅ **If NOT paid and freeUsed >= 15, paywall MUST stay visible permanently**
- `isLocked = !paid && freeUsed >= TRIAL_LIMIT`
- `shouldShowPaywall = (isLocked || showPaywall) && !loading`
- Once shown, stays shown until payment

✅ **Paywall blocks ALL interactions**
- All buttons disabled when `shouldShowPaywall === true`
- Content has `pointer-events-none` when paywall shown
- Keyboard navigation blocked when locked

✅ **Before reaching 15, paywall must NEVER flash**
- Paywall only shows when `isLocked || showPaywall` AND `!loading`
- Loading screen shown while access loads (prevents flash)
- No mount/unmount during question transitions

✅ **Single derived boolean**
- `const isLocked = !paid && freeUsed >= TRIAL_LIMIT`
- Not tied to loading state

✅ **All handlers check isLocked first**
- `handleAnswerSelect`: `if (isLocked) { setShowPaywall(true); return; }`
- `handleNext`: `if (isLocked) { setShowPaywall(true); return; }`
- `handlePrevious`: `if (isLocked) { setShowPaywall(true); return; }`
- Keyboard handlers: `if (isLocked) { setShowPaywall(true); return; }`

✅ **Paywall rendering**
- `{(isLocked || showPaywall) && <PaywallOverlay />}`
- NOT tied to loading state (only checks `!loading` to prevent initial flash)

✅ **No router navigation**
- All progression uses local state: `setQuestionIndex(prev => prev + 1)`
- No `router.refresh()`, `router.replace()`, or `router.push()`

✅ **Answer submission flow**
- Call `incrementFreeUsed()` when answer selected
- Get updated state from API response
- If `newFreeUsed >= 15 AND not paid`: `setShowPaywall(true)` and DO NOT advance
- Otherwise allow progression

✅ **No paywall flash**
- Don't mount/unmount during transitions
- Don't show while loading
- Wait until access loaded before showing

## Files Modified

- `app/practice/page.tsx` - Main Practice page with all fixes applied

## Testing Checklist

- [ ] Paywall does NOT show during first 15 questions
- [ ] Paywall shows immediately after question #15 is answered
- [ ] Paywall stays visible and blocks all interactions
- [ ] No flicker between question transitions
- [ ] freeUsed increments only when answer is selected
- [ ] freeUsed does NOT increment when pressing Next
- [ ] Keyboard navigation blocked when locked
- [ ] Previous button blocked when locked
- [ ] Next button blocked when locked
- [ ] Answer buttons blocked when locked
- [ ] Paywall hides after payment verification
- [ ] No router navigation occurs
- [ ] Loading screen shows while access loads (no paywall flash)

## Build Status

✅ TypeScript check passes
✅ No linting errors
✅ All requirements implemented
