# Proposal: Register Profile Screens

## Intent

Replace the 2-step wizard (`complete-profile.tsx`) with 5 individual screens for profile registration after OTP verification, plus photo upload and payment method selection — giving users a clearer, focused step per screen.

## Scope

### In Scope
- 5 new screens: assistant-message, person-name, store-name, identity-card, store-photos, payment-method
- `src/utils/cedula.ts` — Ecuadorian cédula validation (módulo 10)
- `src/components/auth/CameraUpload.tsx` — photo picker component (gallery + camera)
- AuthProvider: new fields (`cedula`, `photos`, `paymentMethod`, bank fields) + new methods (`saveProfile`, `saveIdentityCard`, `savePhotos`, `savePaymentMethod`)
- Navigation: update enter-otp redirect, business-location back/success targets
- Remove `complete-profile.tsx` and `diseno.tsx`

### Out of Scope
- Supabase/backend integration
- Secure token/session persistence
- Google sign-in
- Error analytics / deep linking

## Flow

```
BEFORE:
enter-otp → complete-profile (wizard) → business-location → account-created

AFTER:
enter-otp → assistant-message → person-name → store-name → identity-card
→ business-location → store-photos → payment-method → account-created
```

## Screens Detail

| Screen | Purpose | Key Input | Validates |
|--------|---------|-----------|-----------|
| assistant-message | Welcome + branding | CTA only | — |
| person-name | User's full name | TextInput (name) | non-empty |
| store-name | Business/store name | TextInput (storeName) | non-empty |
| identity-card | Ecuadorian ID | Numeric input (10 digits) | Módulo 10 alg. |
| business-location | Map + address search | Google Places + GPS | address set |
| store-photos | Upload up to 5 photos | Camera/gallery picker | ≥ 1 photo |
| payment-method | Cash or bank selection | Radio + inline bank form | method selected |
| account-created | Success screen | CTA → tabs | — |

All screens share: white bg, SafeAreaView, Animated 280ms fade+slide, back arrow (except assistant-message), large title (text-4xl), subtitle (text-gray-500), bottom-pinned CTA (orange-400/gray-100, rounded-full, min-h-50px), loading overlay with logo.

## AuthProvider Changes

**User type additions:** `cedula?`, `photos[]`, `paymentMethod`, `bankAccountName`, `bankAccountNumber`, `bankAccountType`

**New methods (all mock, async):**
- `saveProfile({name, storeName})` — 1s delay, merges to user
- `saveIdentityCard(cedula)` — 800ms delay, merges cedula
- `savePhotos(uris)` — 800ms delay, merges photos[]
- `savePaymentMethod({method, bankName?, bankAccountNumber?, bankAccountType?})` — 800ms delay

`completeProfile` kept for backward compat during transition, then removed.

## Files

### Created
- `app/auth/assistant-message.tsx`
- `app/auth/person-name.tsx`
- `app/auth/store-name.tsx`
- `app/auth/identity-card.tsx`
- `app/auth/store-photos.tsx`
- `app/auth/payment-method.tsx`
- `src/components/auth/CameraUpload.tsx`
- `src/utils/cedula.ts`

### Modified
- `src/components/AuthProvider.tsx` — new fields + methods
- `app/auth/_layout.tsx` — no change needed (auto-registers via Expo Router)
- `app/auth/enter-otp.tsx` — route to `/auth/assistant-message`
- `app/auth/business-location.tsx` — back → identity-card, success → store-photos

### Removed
- `app/auth/complete-profile.tsx`
- `app/auth/diseno.tsx`

## Implementation Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 — State | AuthProvider: new User fields + 4 mock methods | small |
| 2 — Validation | `src/utils/cedula.ts` + tests in code | small |
| 3 — Screens (batch 1) | assistant-message, person-name, store-name, identity-card | medium |
| 4 — Photos | CameraUpload component + store-photos screen | medium |
| 5 — Payment | payment-method screen with radio + inline bank form | medium |
| 6 — Wiring | Update enter-otp, business-location nav; remove old screens | small |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing `expo-image-picker` dependency | High | Add to `package.json` before coding photos |
| Cédula validation wrong for edge cases | Low | Test with known valid EC IDs (10 digits, provinces 01-24) |
| Business-location nav change breaks existing flow | Low | Update route target only; existing map/search logic unchanged |

## Success Criteria

- [ ] All 7 screens render with correct navigation sequence
- [ ] Cédula validation accepts/rejects correct numbers (módulo 10)
- [ ] Photo picker opens camera + gallery, max 5 photos enforced
- [ ] Payment method: bank inline form shows/hides correctly
- [ ] `complete-profile.tsx` removed with no broken imports
- [ ] New user flow completes: OTP → all screens → tabs

## Rollback Plan

1. Revert changes to `enter-otp.tsx` and `business-location.tsx`
2. Restore `complete-profile.tsx` and `diseno.tsx` from git
3. Remove new screen files
4. Revert AuthProvider to previous User type + method signatures
5. Test `enter-otp → complete-profile → business-location → account-created` works
