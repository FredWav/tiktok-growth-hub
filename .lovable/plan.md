

## Problem

When the user refreshes the `/analyse-express/result` page, the `express-analysis` edge function is called again, triggering a **new API analysis job** every time. There is no deduplication — each page load = a new costly API call.

## Root Cause

The `express-analysis` function always calls the external API to create a new job, without checking if one was already created for the same Stripe session. The client-side `launchedRef` guard resets on page refresh.

## Solution

Two-layer fix: **server-side deduplication** (primary) + **client-side caching** (secondary).

### 1. Server-side: Store `job_id` in Stripe session metadata

After the first analysis job is created, update the Stripe checkout session metadata with the `job_id`. On subsequent calls with the same `session_id`, detect the existing `job_id` and return it immediately instead of launching a new analysis.

Changes to `supabase/functions/express-analysis/index.ts`:
- After retrieving the session, check if `session.metadata.job_id` already exists
- If yes, return `{ username, job_id, status: "processing" }` without calling the external API
- If no, proceed as before but after getting the `job_id`, update the Stripe session metadata with `stripe.checkout.sessions.update(session_id, { metadata: { ...existing, job_id } })`

### 2. Client-side: Cache `job_id` in localStorage

Changes to `src/pages/AnalyseExpressResult.tsx`:
- After receiving a `job_id` from `launchAnalysis`, store it in localStorage keyed by `session_id`
- On mount, check localStorage for an existing `job_id` for the current `session_id`
- If found, skip calling `express-analysis` entirely and go straight to polling `express-analysis-status`

### Technical Details

**Edge function change** (`express-analysis/index.ts`):
```typescript
// After retrieving the Stripe session:
const existingJobId = session.metadata?.job_id;
if (existingJobId) {
  return Response({ username, job_id: existingJobId, status: "processing" });
}

// After getting new job_id from API:
await stripe.checkout.sessions.update(session_id, {
  metadata: { ...session.metadata, job_id: jobId },
});
```

**Client-side change** (`AnalyseExpressResult.tsx`):
```typescript
// On mount, check for cached job_id
const cachedJobId = localStorage.getItem(`express_job_${sessionId}`);
if (cachedJobId) {
  jobIdRef.current = cachedJobId;
  // Start polling directly, skip launchAnalysis
} else {
  launchAnalysis();
}

// After receiving job_id in launchAnalysis:
localStorage.setItem(`express_job_${sessionId}`, result.job_id);
```

This ensures that even if the Stripe metadata update somehow fails, the client won't re-trigger unnecessarily, and even if localStorage is cleared, the server will still prevent duplicate API calls.

