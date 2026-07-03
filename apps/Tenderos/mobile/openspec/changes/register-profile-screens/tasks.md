# Tasks: Register Profile Screens

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,020 (680 + 53 + 288) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Batch 1) → PR 3 (Batch 2) → PR 4 (Cleanup) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Notes |
|------|------|----|-------|
| 1 | AuthProvider + cedula + CameraUpload + pkg | PR 1 | ~200 lines |
| 2 | assistant-message, person-name, store-name, identity-card | PR 2 | ~340 lines |
| 3 | store-photos, payment-method, nav updates | PR 3 | ~200 lines |
| 4 | Delete old files + verify flow | PR 4 | ~290 removed |

## Phase 1: Foundation

- [ ] 1.1 **expo-image-picker** — `package.json`: add `"expo-image-picker": "~16.0.0"`, then `npm install`
- [ ] 1.2 **Extend AuthProvider** — `src/components/AuthProvider.tsx`: add `cedula?`, `photos[]`, `paymentMethod?`, `bankAccountName?`, `bankAccountNumber?`, `bankAccountType?` to User type. Add `saveProfile`, `saveIdentityCard`, `savePhotos`, `savePaymentMethod` mock methods with delays. Keep `completeProfile`.
- [ ] 1.3 **cedula.ts** — `src/utils/cedula.ts`: export `validateCedula(s)` with módulo 10, coefficients [2,1,2,1,2,1,2,1,2], province 00-24, check digit validation.

## Phase 2: New Screens

- [ ] 2.1 **assistant-message.tsx** — `app/auth/assistant-message.tsx`: centered logo + welcome text + "Comenzar" CTA. No back arrow. 280ms fade+slide on mount.
- [ ] 2.2 **person-name.tsx** — `app/auth/person-name.tsx`: TextInput name, reads `user?.storeName` for saveProfile, "Continuar" CTA disabled when empty.
- [ ] 2.3 **store-name.tsx** — `app/auth/store-name.tsx`: TextInput storeName, reads `user?.name` for saveProfile, "Continuar" CTA disabled when empty.
- [ ] 2.4 **identity-card.tsx** — `app/auth/identity-card.tsx`: numeric input maxLength=10, validates with cedula.ts inline, error shown when invalid. CTA disabled until valid.
- [ ] 2.5 **CameraUpload.tsx** — `src/components/auth/CameraUpload.tsx`: dashed border zone, "Tomar foto" → expo-image-picker, gallery option. Thumbnail grid with X remove. Max 5 photos. Props: photos, maxCount, onPhotosChange.
- [ ] 2.6 **store-photos.tsx** — `app/auth/store-photos.tsx`: uses CameraUpload, CTA enabled only when ≥1 photo, calls savePhotos.
- [ ] 2.7 **payment-method.tsx** — `app/auth/payment-method.tsx`: radio Efectivo/Banco Pichincha. Conditional bank form (nombre, número, tipo). CTA "Finalizar" calls savePaymentMethod.

## Phase 3: Wiring

- [ ] 3.1 **enter-otp redirect** — `app/auth/enter-otp.tsx`: change `"/auth/complete-profile"` → `"/auth/assistant-message"`
- [ ] 3.2 **business-location nav** — `app/auth/business-location.tsx`: back → `/auth/identity-card`, success → `/auth/store-photos`

## Phase 4: Cleanup

- [ ] 4.1 **Delete complete-profile.tsx** — remove file, verify no broken imports
- [ ] 4.2 **Delete diseno.tsx** — remove file, verify no broken imports
- [ ] 4.3 **Verify flow** — walkthrough: OTP → all 7 screens → tabs. `npx tsc --noEmit` passes.
