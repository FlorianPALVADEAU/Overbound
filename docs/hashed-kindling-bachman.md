# Guest browsing for event registration (auth only before payment)

## Context

Today, a visitor must have an account and be logged in before they can even open the registration form — `src/app/api/events/[id]/register-data/route.ts` 401s anonymous requests, the page redirects to `/auth/login` before rendering anything, and every "Next" button in the flow is `disabled={!isAuthenticated}`. This creates friction at the worst possible moment: before the visitor has invested any time filling in details.

Because check-in day-of requires showing a ticket linked to an account (confirmed with the user — true guest checkout with no account is not viable), the fix is not to remove the account requirement, but to move it to the last possible moment: right before payment. Visitors should be able to browse tickets/pricing, fill in participant details, and read/sign the disclaimer without an account. Only the final "Procéder au paiement" action should require being authenticated, via an inline login/signup step (no full-page redirect), so the account exists before Stripe is touched.

Scope explicitly excludes group/pack (Pack Entreprise) and ambassador-referral registrations for now — those remain gated behind login from the start, since their anchor-sync and points-attribution logic already assumes an authenticated session throughout. This plan only removes the early gate for solo ticket purchases.

## Root cause chain (why 4 layers need to change)

1. **`src/app/api/events/[id]/register-data/route.ts`** (lines 15-21) — 401s if no session. This is the actual blocker; everything downstream is unreachable for guests until this is fixed.
2. **`src/app/events/[id]/register/page.tsx`** (lines 21-26, 28-30, 70-76) — redirects to `/auth/login` in a `useEffect` before the data query even runs, and gates `useEventRegisterData` on `Boolean(session?.user)`.
3. **`StepNavigation.tsx`** (lines 46, 53) and **`RegistrationHeader.tsx`** (lines 50-60) — disable "Suivant" and show a blocking alert whenever `!isAuthenticated`, not just at the payment step.
4. **`useRegistrationDraftSync.ts`** (lines 160-164) — the autosave effect calls `clearRegistrationDraft()` and bails out entirely whenever `config.user` is null, so a guest's in-progress form data would never persist across reloads/tab switches.

## Plan

### 1. Backend: allow anonymous read of register-data
`src/app/api/events/[id]/register-data/route.ts`
- Replace the hard 401 (lines 15-21) with: fetch the session if present, but don't reject when absent.
- `user` field in the response becomes nullable: `{ id, email, fullName } | null`.
- Everything else in the handler (event, tickets, upsells, availableSpots, price tiers) must not depend on `user` being present — verify no downstream query in this route implicitly filters by `user.id` (e.g. existing-registration checks, group membership lookups) and guard those specifically for the anonymous case.

`src/app/api/events/[id]/register-data/registerDataQueries.ts`
- `EventRegisterDataResponse.user` type becomes `EventUser | null` to match.

### 2. Frontend: stop gating page render on session
`src/app/events/[id]/register/page.tsx`
- Remove the `useEffect` redirect-to-login (lines 21-26).
- Change `useEventRegisterData(..., { enabled: Boolean(session?.user) })` to `{ enabled: !sessionLoading }` (or simply always enabled) so guests load event/ticket data.
- Update the early-return loading guard (line 70) to not treat "no session" as a loading state — only actual `sessionLoading`/`isLoading` should show the spinner.
- Pass `user={data.user ? { ...data.user, date_of_birth: ... } : null}` instead of assuming `data.user` exists.

### 3. Frontend: only gate the final payment action, not earlier steps
`src/components/registration/StepNavigation.tsx`
- Remove `disabled={!isAuthenticated}` from the "Suivant" button (line 46) — earlier steps (tickets, participants, options, confirmation) should be freely navigable by guests.
- Keep the payment button enabled regardless of auth state; clicking it while unauthenticated should trigger the inline auth step (see #5) rather than being disabled.

`src/components/registration/RegistrationHeader.tsx`
- Remove the blocking "Vous devez être connecté..." alert (lines 50-60) that currently appears on every step. Optionally replace with a lighter, non-blocking note that account creation happens at payment (not required for this task, cosmetic only).

### 4. Fix draft persistence for guests
`src/hooks/registration/useRegistrationDraftSync.ts`
- The autosave effect (lines 156-246) must not wipe the draft just because `config.user` is null. Change the guard at lines 160-164 to only skip the `userId`/`userEmail` fields when there's no user, not clear the whole draft.
- `RegistrationDraft` type (in `src/store/useRegistrationStore.ts`) has `userId`/`userEmail` as required strings — relax to `string | null` so a guest draft can be saved without an account, and backfill them once the user authenticates at the payment step.

### 5. Inline auth at the payment step
`src/components/registration/MultiStepEventRegistration.tsx`
- In `handleProceedToPayment` (lines 307-314), replace the current block-with-error-message when `!user` with: show an inline auth panel (email + password, with automatic login-vs-signup detection consistent with how `src/app/auth/login/page.tsx` and `src/app/auth/register/page.tsx` already behave) instead of proceeding directly to `ensurePaymentIntent()`.
- New small component, e.g. `src/components/registration/InlineAuthStep.tsx`, embedding the core logic extracted from:
  - `handlePasswordLogin` in `src/app/auth/login/page.tsx` (lines 99-158) — `supabase.auth.signInWithPassword`, post-auth-sync call, `queryClient.setQueryData`/`invalidateQueries` on `SESSION_QUERY_KEY`.
  - `handleRegister` in `src/app/auth/register/page.tsx` (lines 113-180) — `supabase.auth.signUp`. Keep it minimal: if `signUp` returns a session immediately, proceed; if it requires OTP verification, surface that inline too (reuse `verifySignupCode`, lines 296-334) since Overbound's signup flow apparently requires email OTP confirmation before a session exists.
  - Do not pull in OAuth, in-app-browser detection, or full-page layout — only the email/password (or OTP) mechanics.
- After successful inline auth, `user` becomes non-null (via session query invalidation → refetch), the component re-renders with the real user, the draft (already saved anonymously per #4) gets its `userId`/`userEmail` backfilled, and `handleProceedToPayment` can proceed to `ensurePaymentIntent()` automatically without the visitor re-clicking, or with one clear "Continue to payment" confirmation.

### 6. Minor: participant auto-fill after inline login
`src/hooks/registration/useParticipants.ts`
- Optional but recommended: when `user` transitions from null to non-null, backfill participant slot 0's email/birthDate if still blank (currently the seeding effect only applies to newly created slots). Small addition to the existing effect, not a rewrite.

### 7. Groups / Ambassador — explicitly unchanged
No changes to `GroupJoinInline`, group anchor sync, or ambassador promo code logic. If a guest applies an ambassador referral code or is part of a group flow, the existing behavior (already requiring `user`) is preserved — this is out of scope per user decision.

## Verification

- `npm run typecheck` / `npm run build` to catch the type changes (`EventUser | null` propagation, `RegistrationDraft.userId/userEmail` becoming nullable).
- Manual QA in browser (dev server):
  1. Open an event's register page in a private/incognito window (no session) → confirm ticket list, pricing, and participant form render without redirect.
  2. Fill tickets → participants → options → confirmation (disclaimer + signature) fully as a guest → confirm no forced redirect at any of these steps.
  3. Click "Procéder au paiement" → confirm inline auth panel appears (not a redirect) → sign up with a new email → confirm it proceeds to Stripe payment step with the previously-filled draft data intact (tickets/participants/signature not lost).
  4. Repeat step 3 but log in with an existing account instead of signing up → confirm same result.
  5. Confirm existing logged-in-from-the-start flow still works unchanged (regression check).
  6. Confirm group-anchor and ambassador-code registrations still require login as before (regression check, no behavior change expected there).
