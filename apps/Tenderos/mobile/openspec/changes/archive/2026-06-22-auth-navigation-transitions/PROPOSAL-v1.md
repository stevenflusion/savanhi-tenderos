# Proposal: Auth Navigation Transitions

## Intent

Fix the loading flash during auth screen transitions and refine navigation animations. The LoadingOverlay lives inside each screen's View hierarchy — when the old screen slides away during Stack transition, the overlay goes with it, causing a momentary flash of content behind the new screen.

## Scope

### In Scope
- Move LoadingOverlay from per-screen AuthScreenShell to `app/auth/_layout.tsx` (outside Stack)
- Refactor 6 form components to use global loading context from layout
- Remove inline loading overlays in `enter-email.tsx` and `enter-otp.tsx`
- Remove 50ms `setTimeout` delay in BackButton for instant back navigation
- Tune hide-overlay timeout from 400ms to 350ms (animation duration + 50ms buffer)

### Out of Scope
- Visual or behavior changes to screen content or forms
- Pre-auth screens (welcome, splash)
- Backend or AuthProvider data logic

## Capabilities

### New Capabilities
- `auth-screen-transitions`: Loading overlay lifecycle (show/hide timing, zero-flash guarantee) + forward/back stack animation configuration

### Modified Capabilities
None

## Approach

**Loading overlay lift**: Extract loading state from AuthScreenShell into a new `AuthLoadingProvider` context in `app/auth/_layout.tsx`. Render `<View className="flex-1"><Stack ... /><LoadingOverlay visible={loading} /></View>` — overlay sits outside Stack and persists across screen transitions. All 6 forms call `useAuthLoading().setLoading` instead of `useFormLoading().setLoading`. `enter-email` and `enter-otp` drop their inline overlay Vews and use the same context.

**Navigation animation**: Keep `slide_from_right` (300ms). Forward = current content slides left, new content slides in from right. Back = current content slides right, reveals previous. Overlay hide timeout set to `animationDuration + 50ms` (350ms) instead of 400ms.

**BackButton**: Remove `setTimeout(() => router.back(), 50)` — call `router.back()` immediately so the stack animation starts without lag.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/auth/_layout.tsx` | Modified | Add AuthLoadingProvider + LoadingOverlay sibling to Stack |
| `AuthScreenShell.tsx` | Modified | Remove LoadingContext, LoadingOverlay import; keep fade anim |
| `forms/PersonNameForm.tsx` | Modified | `useFormLoading` → `useAuthLoading` |
| `forms/StoreNameForm.tsx` | Modified | Same replacement |
| `forms/IdentityCardForm.tsx` | Modified | Same replacement |
| `forms/BusinessLocationForm.tsx` | Modified | Same replacement |
| `forms/StorePhotosForm.tsx` | Modified | Same replacement |
| `forms/PaymentMethodForm.tsx` | Modified | Same replacement |
| `app/auth/enter-email.tsx` | Modified | Remove inline overlay, use global context |
| `app/auth/enter-otp.tsx` | Modified | Remove inline overlay, use global context |
| `BackButton.tsx` | Modified | Remove 50ms setTimeout wrapper |
| `LoadingOverlay.tsx` | Unchanged | Already uses absolute inset-0 z-50 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Context not available on first render | Low | Provide noop default for `setLoading`; provider initializes synchronously |
| enter-email/enter-otp loading state conflicts with form flow | Low | Each screen has its own async lifecycle — no overlap possible |

## Rollback Plan

1. Revert `app/auth/_layout.tsx` to HEAD
2. Revert `AuthScreenShell.tsx` to restore LoadingContext + LoadingOverlay
3. Revert 6 form files to restore `useFormLoading` imports
4. Revert `enter-email.tsx` and `enter-otp.tsx` to inline overlays
5. Revert `BackButton.tsx`

## Dependencies

None.

## Success Criteria

- [ ] No loading flash visible during any auth screen → screen transition
- [ ] Loading overlay covers entire viewport during async operations
- [ ] BackButton navigation starts immediately (no 50ms delay)
- [ ] Forward nav: content slides left, new screen slides in from right
- [ ] Back nav: content slides right, previous screen returns
