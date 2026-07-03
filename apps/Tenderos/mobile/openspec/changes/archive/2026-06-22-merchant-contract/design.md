# Design: Merchant Contract Form

## Technical Approach

Single screen outside the AuthScreenShell progress-bar flow — the contract is a legal step, not data entry. MerchantContractForm owns local checkbox state, reads user data from AuthProvider context, builds a `MerchantContractData` payload on submit, calls `saveContract()` (mock with 800ms delay + console.log), and navigates to `/auth/account-created` on success. Type `MerchantContractData` lives in `@repo/api-contracts` so backend integration can reuse it later.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| **Progress bar** | Show step 7 vs omit | Omit | Legal step is conceptually separate from data entry — progress bar would imply "one more form field" instead of "binding agreement". Same pattern as OTP/assistant-message screens. |
| **Terms source** | API-loaded vs static placeholder | Static placeholder | No backend endpoint exists yet. `termsVersion` is in the data model from day 1 so the schema doesn't change later. Terms text clearly marked as placeholder. |
| **Console.log pattern** | Logging vs silent mock | `console.log(JSON.stringify(payload, null, 2))` | Debugging during mock phase — full payload visibility in Metro logs. Removed when real API is connected. |
| **`termsVersion` presence** | Omit vs include from start | Include | Data model readiness — introducing it later changes the contract type signature. Always set to `"1.0.0"` for now. |
| **Re-acceptance** | Allow vs no-op | No re-acceptance | Product decision: contract is a one-time registration step. No mechanism to re-accept or revisit the terms screen. |
| **Screen layout** | AuthScreenShell (with progress bar) vs standalone | Standalone (SafeAreaView + children) | AuthScreenShell renders ProgressBar unconditionally when route maps to a step. merchant-contract is not in `ROUTE_TO_STEP`. Shell also adds KeyboardAvoidingView which is irrelevant for a scrollable-terms + checkbox layout. |

## Data Flow

```
  AuthProvider (context)
       │
       │  useAuth() → user
       ▼
 MerchantContractForm
       │
       ├─ UserDataSummary (reads user fields)
       ├─ Checkbox (local state: accepted boolean)
       └─ FormButton (disabled until accepted=true)
              │
              │  onPress:
              │    1. Build MerchantContractData payload
              │    2. console.log(JSON.stringify(payload, null, 2))
              │    3. setLoading(true)
              ▼
       AuthProvider.saveContract(data)
              │
              │  delay(800ms)
              │  setUser({ ...prev, contractAccepted: true, contractVersion: "1.0.0" })
              ▼
       { success: true } ──→ router.push("/auth/account-created")
```

### Sequence Diagram

```
User  MerchantContractForm  FormButton  AuthProvider  router
 │          │                  │            │           │
 │  tap checkbox              │            │           │
 │─────────►                  │            │           │
 │          │  enable button  │            │           │
 │          ├────────────────►│            │           │
 │          │                  │            │           │
 │  tap "Aceptar"             │            │           │
 │─────────►                  │            │           │
 │          │  build payload  │            │           │
 │          │  console.log    │            │           │
 │          │─────────────────│            │           │
 │          │  saveContract() │            │           │
 │          ├─────────────────────────────────────────►│
 │          │                              delay(800)  │
 │          │                              setUser     │
 │          │◄─────────────────────────────────────────┤
 │          │                  │            │           │
 │          │  { success }    │            │           │
 │          │  push(account-created)                  │
 │          ├───────────────────────────────────────────►
 │          │                  │            │           │
```

## Component Tree

```
app/auth/merchant-contract.tsx          ← Expo Router screen, SCREEN-level (NOT wrapped in AuthScreenShell)
  └── MerchantContractForm              ← src/components/auth/forms/MerchantContractForm.tsx
        ├── SafeAreaView
        │   ├── BackButton              ← router.back()
        │   ├── ScreenTitle             ← "Contrato de comerciante"
        │   ├── UserDataSummary         ← Read-only card: fullName, cedula, storeName, email, address, paymentMethod
        │   ├── TermsView               ← ScrollView with placeholder legal text
        │   ├── Checkbox                ← "He leído y acepto los términos y condiciones"
        │   └── Error text              ← Conditional, red text when error state
        └── FormButton                  ← Sticky bottom, disabled until checkbox checked
```

**Key structural decision**: `app/auth/merchant-contract.tsx` renders `MerchantContractForm` directly — no `AuthScreenShell` wrapper. The screen component owns the `SafeAreaView`. This keeps the layout simple (no keyboard-avoidance, no progress bar) and makes the legal-step separation explicit.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/auth/merchant-contract.tsx` | Create | Expo Router screen, renders MerchantContractForm in SafeAreaView |
| `src/components/auth/forms/MerchantContractForm.tsx` | Create | Form component: UserDataSummary, TermsView, checkbox, form button |
| `src/components/auth/messages/merchant-contract.messages.ts` | Create | Spanish messages for terms and UI labels |
| `src/components/auth/messages/index.ts` | Modify | Export `merchantContractMessages` |
| `src/components/AuthProvider.tsx` | Modify | Add `contractAccepted`/`contractVersion` to User type, add `saveContract()` mock method |
| `packages/api-contracts/src/auth.ts` | Modify | Add `MerchantContractData` and `ContractStatus` types |
| `src/components/auth/forms/PaymentMethodForm.tsx` | Modify | Redirect `/auth/account-created` → `/auth/merchant-contract` |

## Interfaces / Contracts

### `packages/api-contracts/src/auth.ts` additions

```typescript
export type MerchantContractData = {
  userId: string;
  fullName: string;
  cedula: string;
  storeName: string;
  email: string;
  address: string;
  paymentMethod: string;
  termsVersion: string;
  acceptedAt: string;   // ISO 8601
  ipAddress: string;
  userAgent: string;
  signature: "digital";
};

export type ContractStatus = "pending" | "accepted";
```

### AuthProvider User extension

```typescript
// Add to the User type in AuthProvider.tsx
type User = AuthUser & {
  // ...existing fields...
  contractAccepted?: boolean;
  contractVersion?: string;
};
```

### AuthProvider new method

```typescript
saveContract: (data: MerchantContractData) => Promise<{
  success: boolean;
  error?: string;
}>;
```

Mock implementation:
```typescript
const saveContract = async (data: MerchantContractData) => {
  await delay(800);
  console.log("[MerchantContract] payload:", JSON.stringify(data, null, 2));
  setUser((prev) =>
    prev
      ? { ...prev, contractAccepted: true, contractVersion: data.termsVersion }
      : null,
  );
  return { success: true };
};
```

### `merchant-contract.messages.ts`

```typescript
export const merchantContractMessages = {
  title: "Contrato de comerciante",
  summaryTitle: "Datos del comerciante",
  termsTitle: "Términos y condiciones",
  termsPlaceholder: `(Texto de términos y condiciones — provisional)\n\n`
    + `Lorem ipsum dolor sit amet...`,
  checkbox: "He leído y acepto los términos y condiciones",
  accept: "Aceptar",
  accepting: "Guardando...",
  errors: {
    noCheck: "Debes aceptar los términos y condiciones",
    save: "Error al guardar el contrato. Intenta de nuevo.",
  },
};
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | MerchantContractForm — checkbox enables button, submit builds payload | `render` + `fireEvent.press` on checkbox + verify button enabled |
| Unit | UserDataSummary — reads and renders all user fields | `render` + check text content from mock user |
| Unit | TermsView — scrollable, renders placeholder text | `render` + verify ScrollView + text present |
| Integration | Form submit → saveContract → navigation | Mock AuthProvider, verify `router.push` called with `/auth/account-created` |
| Integration | Error state on failure | Mock `saveContract` returning error, verify error text renders |

## Migration / Rollout

| Step | What | Details |
|------|------|---------|
| 1 | api-contracts | Add `MerchantContractData` and `ContractStatus` types — pure additive, no breaking changes |
| 2 | AuthProvider | Extend User type (optional fields), add `saveContract()` mock |
| 3 | Messages | Create `merchant-contract.messages.ts`, wire into `index.ts` |
| 4 | Form component | Create `MerchantContractForm.tsx` with full layout |
| 5 | Screen | Create `app/auth/merchant-contract.tsx` |
| 6 | Redirect | Change `PaymentMethodForm.tsx` line 88: `/auth/account-created` → `/auth/merchant-contract` |
| 7 | Verify | Walkthrough: payment-method → merchant-contract → accept → account-created |

No data migration — all mock state, no persisted contracts.

## Open Questions

- [ ] `ipAddress` and `userAgent` collection — should we use `expo-constants` and `Platform.OS` now, or defer to the real API integration? Current plan: hardcode "unknown" for both during mock phase, add native collection when backend endpoint is built.
- [ ] SecureStore persistence for `contractAccepted` — not needed now since AuthProvider doesn't persist registration state, but flag for when real API integration happens.
