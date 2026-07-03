# Tasks: Register Flow Atomic Refactor

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1600–1800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (atomics + tests) → PR 2 (forms + screens) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Atomic components + tests + deps | PR 1 | Base: feature/register-flow-atomic-refactor — 8 new atomics, enhance ProgressBar, install deps, 5 test files |
| 2 | Form components + screen rewiring | PR 2 | Base: PR 1 branch — 6 form components, modify _layout.tsx, rewrite 6 screen files |

## Phase 1: Foundation — install deps + create atomic components

- [x] 1.1 Add `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native` to `package.json` devDependencies
- [x] 1.2 Create `src/components/auth/AuthScreenShell.tsx` — SafeAreaView + KeyboardAvoidingView + ProgressBar + children slot
- [x] 1.3 Create `src/components/auth/BackButton.tsx` — Pressable arrow with haptic, default `router.back()`
- [x] 1.4 Create `src/components/auth/FormButton.tsx` — orange/gray states + loading spinner
- [x] 1.5 Create `src/components/auth/LoadingOverlay.tsx` — absolute fullscreen overlay with logo
- [x] 1.6 Create `src/components/auth/ScreenTitle.tsx` — title text with standard styling
- [x] 1.7 Create `src/components/auth/FormField.tsx` — input with border, error state, hint text
- [x] 1.8 Create `src/components/auth/RadioOption.tsx` — radio with selected/unselected states
- [x] 1.9 Enhance `src/components/auth/ProgressBar.tsx` — add step label + Animated.Value segment transition

## Phase 2: Form components

- [x] 2.1 Create `src/components/auth/forms/PersonNameForm.tsx` — name input + validation + `saveProfile` call
- [x] 2.2 Create `src/components/auth/forms/StoreNameForm.tsx` — store name input + validation + `saveProfile` call
- [x] 2.3 Create `src/components/auth/forms/IdentityCardForm.tsx` — cedula input + `validateCedula()` + `saveIdentityCard` call
- [x] 2.4 Create `src/components/auth/forms/BusinessLocationForm.tsx` — map/GPS layout, compose BackButton/FormButton/LoadingOverlay directly
- [x] 2.5 Create `src/components/auth/forms/StorePhotosForm.tsx` — image picker + photo grid + `savePhotos` call
- [x] 2.6 Create `src/components/auth/forms/PaymentMethodForm.tsx` — radio options + conditional bank form + `savePayment` call

## Phase 3: Screen rewiring

- [x] 3.1 Modify `app/auth/_layout.tsx` — add `animation: 'slide_from_right'` with 300ms
- [x] 3.2 Rewrite `app/auth/person-name.tsx` as `AuthScreenShell` → `PersonNameForm` wrapper
- [x] 3.3 Rewrite `app/auth/store-name.tsx` as `AuthScreenShell` → `StoreNameForm` wrapper
- [x] 3.4 Rewrite `app/auth/identity-card.tsx` as `AuthScreenShell` → `IdentityCardForm` wrapper
- [x] 3.5 Rewrite `app/auth/business-location.tsx` composing BackButton/FormButton/LoadingOverlay directly
- [x] 3.6 Rewrite `app/auth/store-photos.tsx` as `AuthScreenShell` → `StorePhotosForm` wrapper
- [x] 3.7 Rewrite `app/auth/payment-method.tsx` as `AuthScreenShell` → `PaymentMethodForm` wrapper

## Phase 4: Testing — unit tests for atomic components

- [x] 4.1 Write tests for `FormButton` — label, spinner, disabled state, onPress
- [x] 4.2 Write tests for `FormField` — value, error text, hint display
- [x] 4.3 Write tests for `RadioOption` — selected vs unselected styling
- [x] 4.4 Write tests for `BackButton` — fires onPress callback
- [x] 4.5 Write tests for `ProgressBar` — segment count, active step highlight
