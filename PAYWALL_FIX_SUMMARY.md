# Paywall Flicker Fix - Implementation Summary

## Problem Fixed
During the free trial (15 questions), a paywall overlay was briefly flashing between every question transition, then disappearing before the next question showed. After 15 questions, the lock worked correctly.

## Solution Implemented

### 1. AccessProvider Context (`contexts/AccessProvider.tsx`)
- **Sticky State Management**: Keeps previous stable state during loading to prevent flicker
- **Single Source of Truth**: Manages `access.paid`, `access.freeUsed`, and `access.loading`
- **Smart Loading**: Never resets to defaults during navigation; preserves last known values
- **Controlled Refetching**: Only refetches on mount, after incrementing freeUsed, or after payment verification

### 2. PaywallOverlay Component (`components/PaywallOverlay.tsx`)
- **Conditional Rendering**: Only renders when explicitly locked (via `isLocked` prop)
- **Clean UI**: Modern, accessible overlay with proper ARIA labels

### 3. API Routes
- **`/api/practice/access`**: GET endpoint to fetch current access status
- **`/api/practice/increment`**: POST endpoint to increment freeUsed (only called on answer submission)
- **`/api/practice/verify-payment`**: POST endpoint to verify and set paid status

### 4. Practice Page Pattern (`app/practice/page.example.tsx`)
- **isLocked Calculation**: `!paid && freeUsed >= 15 && !loading`
- **Conditional PaywallOverlay**: Only renders when `isLocked === true`
- **Answer Submission**: Increments freeUsed ONLY when answer is chosen (not on Next button)
- **Input Blocking**: Disables inputs when locked

## Key Requirements Met

✅ **PaywallOverlay renders ONLY when:**
- `access.paid === false`
- AND `access.freeUsed >= FREE_LIMIT (15)`
- AND `access.loading === false`

✅ **No paywall during loading**: Previous stable access state is maintained until fetch completes

✅ **No refetch on every question**: Only fetches:
- Once on page mount
- After incrementing freeUsed (after answer submission)
- After successful payment verification

✅ **freeUsed increments ONLY on answer submission**: Not when pressing Next button

✅ **Sticky access store**: Never resets paid/freeUsed to defaults during navigation

✅ **Immediate lock after question #15**: PaywallOverlay shows and inputs are blocked

## Integration Steps

1. **Wrap your Practice page with AccessProvider:**
```tsx
import { AccessProvider } from '@/contexts/AccessProvider'

export default function PracticePage() {
  return (
    <AccessProvider>
      <YourPracticeComponent />
    </AccessProvider>
  )
}
```

2. **Use useAccess hook in your component:**
```tsx
import { useAccess, FREE_LIMIT } from '@/contexts/AccessProvider'

const { paid, freeUsed, loading, incrementFreeUsed } = useAccess()
const isLocked = !paid && freeUsed >= FREE_LIMIT && !loading
```

3. **Render PaywallOverlay conditionally:**
```tsx
import { PaywallOverlay } from '@/components/PaywallOverlay'

{isLocked && <PaywallOverlay />}
```

4. **Increment freeUsed on answer submission (not on Next):**
```tsx
const handleAnswerSubmit = async (answer: string) => {
  if (isLocked) return
  await incrementFreeUsed() // Only here, not in handleNext
  // ... rest of logic
}
```

## Files Created/Modified

### New Files:
- `contexts/AccessProvider.tsx` - Access state management context
- `components/PaywallOverlay.tsx` - Paywall overlay component
- `app/api/practice/access/route.ts` - Access status API
- `app/api/practice/increment/route.ts` - Increment freeUsed API
- `app/api/practice/verify-payment/route.ts` - Payment verification API
- `app/practice/page.example.tsx` - Example implementation pattern

### Files to Update:
- Your actual Practice page component (replace with pattern from `page.example.tsx`)
- Wrap your app root with `AccessProvider` if not already done

## Testing Checklist

- [ ] Paywall does NOT show during first 15 questions
- [ ] Paywall shows immediately after question #15 is answered
- [ ] No flicker between question transitions
- [ ] freeUsed increments only when answer is submitted
- [ ] freeUsed does NOT increment when pressing Next
- [ ] Access state persists during navigation
- [ ] Loading state doesn't cause paywall to flash
- [ ] After payment, paywall disappears and access is granted

