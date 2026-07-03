# Tasks: Auth Navigation Transitions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~176 (130 additions + 46 deletions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation — AuthLoadingContext

- [x] 1.1 Create `src/components/auth/AuthLoadingContext.tsx` — `AuthLoadingProvider` (React context + `loading` state + default noop `setLoading`) + `useAuthLoading()` hook

## Phase 2: Structural Wiring — Layout, Shell, BackButton

- [x] 2.1 Update `app/auth/_layout.tsx` — wrap `<Stack>` with `<AuthLoadingProvider>`, render `<LoadingOverlay visible={loading} />` as sibling outside Stack inside a flex-1 View
- [x] 2.2 Update `AuthScreenShell.tsx` — remove `LoadingContext` creation, `LoadingOverlay` import/render, `useFormLoading` export. Keep fade entrance, ProgressBar, SafeAreaView, KeyboardAvoidingView
- [x] 2.3 Fix `BackButton.tsx` — remove `setTimeout(() => { ... }, 50)` wrapper; call `Keyboard.dismiss()` + `router.back()` synchronously

## Phase 3: Form Migration (6 forms)

- [x] 3.1 Update `PersonNameForm.tsx` — replace `useFormLoading` import with `useAuthLoading`, rename `setShellLoading` to `setGlobalLoading`, change 3 call-sites, add `useEffect` cleanup, change 400ms→350ms timer
- [x] 3.2 Update `StoreNameForm.tsx` — same pattern as 3.1
- [x] 3.3 Update `IdentityCardForm.tsx` — same pattern as 3.1
- [x] 3.4 Update `BusinessLocationForm.tsx` — same pattern as 3.1
- [x] 3.5 Update `StorePhotosForm.tsx` — same pattern as 3.1
- [x] 3.6 Update `PaymentMethodForm.tsx` — same pattern as 3.1

## Phase 4: Screen Migration — enter-email, enter-otp

- [x] 4.1 Update `enter-email.tsx` — remove inline overlay View block, import `useAuthLoading`, add `setGlobalLoading(true)` before async call + `setGlobalLoading(false)` in success timeout and error catch, add cleanup `useEffect`, change 400ms→350ms, remove 50ms setTimeout from handleBack
- [x] 4.2 Update `enter-otp.tsx` — same as 4.1; also add `setGlobalLoading(false)` after `router.replace("/(tabs)")` in the returning-user path

## Phase 5: Verify

- [ ] 5.1 Manual check: navigate through all auth screens — no loading flash during transitions
- [ ] 5.2 Manual check: BackButton navigates instantly (no 50ms lag) in all auth screens
- [ ] 5.3 Manual check: LoadingOverlay covers full viewport (not clipped to screen bounds)
- [ ] 5.4 Verify console: no `useAuthLoading()` out-of-provider errors
