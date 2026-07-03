# Proposal: Register Flow Atomic Refactor

## Intent

Extract duplicated layout, navigation, and input patterns from 6 registration screens into shared atomic components. Screens created in `register-profile-screens` each reimplement SafeAreaView, back button, title, CTA, loading overlay, and progress indication. This refactor eliminates that duplication, enforces consistency, and makes each screen a thin form component hosted by a single parent shell.

No visual changes. No new features. Pure structural refactor.

## Scope

### In Scope
- 6 atomic UI components in `src/components/auth/`: AuthScreenShell, BackButton, FormButton, FormField, RadioOption, ProgressBar, LoadingOverlay, ScreenTitle
- 6 form components in `src/components/auth/forms/`: PersonNameForm, StoreNameForm, IdentityCardForm, BusinessLocationForm, StorePhotosForm, PaymentMethodForm
- Refactor 6 screen files in `app/auth/` to wrap form components in AuthScreenShell (or compose atomic pieces for business-location)
- Replace per-screen Animated.View transitions with expo-router Stack `slide_from_right` in `app/auth/_layout.tsx`
- Install Jest + React Native Testing Library; write unit tests for atomic components

### Out of Scope
- Visual or behavior changes to existing screens
- Pre-OTP screens (welcome, enter-email, enter-otp)
- Backend or AuthProvider data logic changes

## Capabilities

> Pure refactor — no spec-level behavior changes.

### New Capabilities
None

### Modified Capabilities
None

## Approach

**Shell pattern**: Each screen in `app/auth/` renders `AuthScreenShell`(parent) → form component(child). AuthScreenShell provides SafeAreaView, KeyboardAvoidingView, ProgressBar, and the `slide_from_right` entrance animation. Form components own validation, state, and submit — calling AuthProvider methods directly.

**Special case**: `BusinessLocationForm` bypasses AuthScreenShell (needs map/GPS layout) but composes BackButton, FormButton, LoadingOverlay as standalone pieces.

**Navigation**: Set `animation: slide_from_right` with 300ms duration in `app/auth/_layout.tsx` Stack config. Remove all per-screen Animated.View imports.

**Testing**: Install `jest` + `@testing-library/react-native`. Write unit tests for: FormButton (valid/loading/disabled), FormField (value, error, hint states), RadioOption (selected/unselected), BackButton (press handler), ProgressBar (segment count, active step). Run via `npx jest`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/auth/` | New | 8 atomic components + 6 form components |
| `app/auth/_layout.tsx` | Modified | Stack config — slide_from_right animation |
| `app/auth/person-name.tsx` | Modified | Reduce to AuthScreenShell → PersonNameForm |
| `app/auth/store-name.tsx` | Modified | Reduce to AuthScreenShell → StoreNameForm |
| `app/auth/identity-card.tsx` | Modified | Reduce to AuthScreenShell → IdentityCardForm |
| `app/auth/business-location.tsx` | Modified | Compose atomic pieces directly |
| `app/auth/store-photos.tsx` | Modified | Reduce to AuthScreenShell → StorePhotosForm |
| `app/auth/payment-method.tsx` | Modified | Reduce to AuthScreenShell → PaymentMethodForm |
| `package.json` | Modified | Add jest + RNTL dependencies |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing jest/RNTL config for Expo SDK 54 | Medium | Use `jest-expo` preset; verify with one smoke test first |
| Business-location refactor breaks map/GPS | Low | Keep existing logic, only replace nav/button chrome |

## Rollback Plan

1. Revert `app/auth/_layout.tsx` and all 6 screen files to current HEAD
2. Remove `src/components/auth/` and `src/components/auth/forms/` directories
3. Revert `package.json` to remove test dependencies
4. Verify visual regression on each registration screen

## Dependencies

- `jest`, `jest-expo`, `@testing-library/react-native` (new dev deps)
- Existing form state/validation logic carries over unchanged

## Success Criteria

- [ ] All 6 screens render identically before and after the refactor
- [ ] AuthScreenShell wraps 5 of 6 screens; BusinessLocationForm composes atomic pieces directly
- [ ] Entrance transitions use Stack `slide_from_right` (no per-screen Animated.View)
- [ ] Atomic component unit tests pass (FormButton, FormField, RadioOption, BackButton, ProgressBar)
- [ ] Registration flow completes end-to-end: OTP → all screens → account-created → tabs
