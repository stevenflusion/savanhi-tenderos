# Design: Register Profile Screens

## Technical Approach

Replace the 2-step wizard with 7 individual Expo Router screens, each owning local form state and persisting via AuthProvider. Navigation is file-based (Stack), animation is the existing 280ms fade+slide, data flows screen→AuthProvider→context. The key challenge — person-name/store-name preserving each other's values — is solved by having each screen read the existing partner field from `user` context before calling `saveProfile`.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| **Nav structure** | Params vs context | AuthProvider context | 7 screens sharing data — params grow unmanageable. Context gives every screen access to prior state. |
| **person-name/store-name data loss** | Query params, context read, local storage | Read partner field from `user` context | Each screen calls `saveProfile({name, storeName: user?.storeName})` preserving the other. Clean, zero extra state. |
| **Cédula validation location** | Screen-level, util, hook | Pure util `src/utils/cedula.ts` | Pure function, no deps, testable, importable anywhere. |
| **Dashed border** | SVG, reanimated, RN borderStyle | `borderStyle: 'dashed'` | RN 0.81 supports dashed on both platforms. Zero deps, trivial. |
| **Image picker** | expo-image-picker vs manual | expo-image-picker | Expo native module, handles permissions, camera/gallery, typed API. Must add to `package.json`. |
| **Animation** | Reanimated vs Animated | `Animated.parallel` (existing pattern) | All current screens use `Animated` with `useNativeDriver: true`. Consistent, no reason to switch. |
| **Loading overlay** | Per-screen vs shared | Per-screen (existing pattern) | Matches current AuthProvider pattern. Shared overlay would complicate the layout. |

## Data Flow

```
 ┌──────────┐   saveProfile({name, storeName})    ┌──────────────┐
 │ person-   │ ──────────────────────────────────→ │              │
 │ name     │                                      │              │
 └──────────┘                                      │              │
                                                   │ AuthProvider │
 ┌──────────┐   saveProfile({name, storeName})    │ (User state) │
 │ store-   │ ──────────────────────────────────→ │              │
 │ name     │                                      │              │
 └──────────┘                                      │              │
                                                   │              │
 ┌──────────┐   saveIdentityCard(cedula)          │              │
 │ identity- │ ──────────────────────────────────→ │              │
 │ card     │                                      └──────┬───────┘
 └──────────┘                                             │
                                                          │ context
 ┌──────────┐   savePhotos(uris)                          │
 │ store-   │ ──────────────────────────────────→         ▼
 │ photos   │                                      ┌──────────────┐
 └──────────┘                                      │   Screen     │
                                                   │ (reads user  │
 ┌──────────┐   savePaymentMethod(data)            │   on mount)  │
 │ payment- │ ──────────────────────────────────→  └──────────────┘
 │ method   │
 └──────────┘
```

**Person-name/store-name detail**: person-name reads `user?.storeName`, store-name reads `user?.name` — both from context — and passes the partner field through `saveProfile`. The merge in AuthProvider (`setUser(prev => prev ? {...prev, ...data} : null)`) preserves any field not in the current payload.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/auth/assistant-message.tsx` | Create | Welcome screen, CTA-only, no back arrow |
| `app/auth/person-name.tsx` | Create | Name input, reads `user?.storeName` for saveProfile |
| `app/auth/store-name.tsx` | Create | Store name input, reads `user?.name` for saveProfile |
| `app/auth/identity-card.tsx` | Create | 10-digit cédula, módulo 10 validation |
| `app/auth/store-photos.tsx` | Create | CameraUpload + gallery, max 5, dashed picker area |
| `app/auth/payment-method.tsx` | Create | Radio (efectivo/Pichincha), inline bank form |
| `src/components/auth/CameraUpload.tsx` | Create | Photo picker component: camera + gallery buttons, thumbnail grid with X remove |
| `src/utils/cedula.ts` | Create | `validateCedula(s)` — módulo 10 implementation |
| `src/components/AuthProvider.tsx` | Modify | Extend User type, add 4 save methods |
| `app/auth/enter-otp.tsx` | Modify | Redirect `/auth/complete-profile` → `/auth/assistant-message` |
| `app/auth/business-location.tsx` | Modify | Success CTA `/auth/account-created` → `/auth/store-photos` |
| `app/auth/complete-profile.tsx` | Delete | Replaced by individual screens |
| `app/auth/diseno.tsx` | Delete | Unused component |

## Interfaces / Contracts

### AuthProvider User type extension

```typescript
type User = {
  name: string
  email: string
  storeName?: string
  address?: string
  latitude?: number
  longitude?: number
  cedula?: string
  photos?: string[]
  paymentMethod?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankAccountType?: string
}
```

### New AuthProvider methods

```typescript
saveProfile(data: { name: string; storeName: string }): Promise<{ success: boolean }>
saveIdentityCard(cedula: string): Promise<{ success: boolean }>
savePhotos(uris: string[]): Promise<{ success: boolean }>
savePaymentMethod(data: {
  method: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountType?: string
}): Promise<{ success: boolean }>
```

### Cédula validation (módulo 10)

```typescript
// src/utils/cedula.ts
export function validateCedula(s: string): { valid: boolean; error?: string }
```

Algorithm: coefficients [2,1,2,1,2,1,2,1,2] applied to digits 1-9. For each product ≥ 10, subtract 9. Sum all. Check digit = `(10 - (sum % 10)) % 10`. Match against digit 10. Province (first 2 digits) must be 00 or 01–24.

### CameraUpload props

```typescript
type CameraUploadProps = {
  photos: string[]
  maxCount: number
  onPhotosChange: (uris: string[]) => void
}
```

Uses `expo-image-picker` — must be added to `package.json`: `"expo-image-picker": "~16.0.0"` (aligns with SDK 54).

## Testing Strategy

No test runner available (`strict_tdd: false`). Validation tested inline during development. Key validation points: cédula module, photo max count, payment method conditional form.

## Migration / Rollout

| Step | What | Details |
|------|------|---------|
| 1 | AuthProvider | Extend User type, add 4 save methods first — no breaking changes (fields optional) |
| 2 | New screens | Create all 7 screens + CameraUpload + cedula util in parallel |
| 3 | enter-otp.tsx | Change redirect target (one line) |
| 4 | business-location.tsx | Change success target (one line) |
| 5 | Cleanup | Delete `complete-profile.tsx` and `diseno.tsx` |
| 6 | Verify | Full flow walkthrough: OTP → all 7 screens → tabs |

No data migration — all mock, no persisted state.

## Open Questions

- [ ] `expo-image-picker` exact version for Expo SDK 54 — verify before adding
