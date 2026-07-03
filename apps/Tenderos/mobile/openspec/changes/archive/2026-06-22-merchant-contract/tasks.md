# Tasks: Merchant Contract Form

## Change Summary

Add digital contract acceptance screen between payment-method and account-creation in tendero registration.

## Architecture

| Layer | Files | Depends On |
|-------|-------|------------|
| Types & Contracts | `packages/api-contracts/src/auth.ts` (modify) | — |
| State | `src/components/AuthProvider.tsx` (modify) | Types |
| Messages | `src/components/auth/messages/merchant-contract.messages.ts` (create), `index.ts` (modify) | — |
| UI Component | `src/components/auth/forms/MerchantContractForm.tsx` (create) | State, Messages |
| Screen & Navigation | `app/auth/merchant-contract.tsx` (create), `PaymentMethodForm.tsx` (modify) | UI Component |

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~210 (additions) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Tasks

### Layer 1: Types & Contracts

- [x] **1.1** Add `MerchantContractData` type to `packages/api-contracts/src/auth.ts` — fields: `userId`, `fullName`, `cedula`, `storeName`, `email`, `address`, `paymentMethod`, `termsVersion`, `acceptedAt` (ISO 8601), `ipAddress`, `userAgent`, `signature: "digital"`
- [x] **1.2** Add `ContractStatus` type (`"pending" | "accepted"`) to same file

### Layer 2: State (AuthProvider)

- [x] **2.1** Extend `User` type in `src/components/AuthProvider.tsx` — add optional `contractAccepted?: boolean` and `contractVersion?: string`
- [x] **2.2** Add `saveContract(data: MerchantContractData)` method signature to `AuthContextType` — returns `Promise<{ success: boolean; error?: string }>`
- [x] **2.3** Implement mock `saveContract` in `AuthProvider` — `delay(800)`, `console.log("[MerchantContract] payload:", ...)`, sets `contractAccepted: true` + `contractVersion: data.termsVersion` on user, returns `{ success: true }`. Export via `useMemo`.

### Layer 3: Messages

- [x] **3.1** Create `src/components/auth/messages/merchant-contract.messages.ts` — export `merchantContractMessages` with: `title`, `summaryTitle`, `termsTitle`, `termsPlaceholder` (lorem ipsum placeholder text), `checkbox`, `accept`, `accepting`, `errors.noCheck`, `errors.save`
- [x] **3.2** Add `export { merchantContractMessages } from "./merchant-contract.messages"` to `src/components/auth/messages/index.ts`

### Layer 4: UI Component (MerchantContractForm)

- [x] **4.1** Create `src/components/auth/forms/MerchantContractForm.tsx` — full component with:
  - `SafeAreaView` wrapper (no `AuthScreenShell`)
  - `BackButton` calling `router.back()`
  - `ScreenTitle` with `merchantContractMessages.title`
  - `UserDataSummary` — read-only card from `useAuth().user` showing `fullName`, `cedula`, `storeName`, `email`, `address`, `paymentMethod`
  - `TermsView` — `ScrollView` with placeholder terms from `merchantContractMessages.termsPlaceholder` + `termsVersion` label "Versión: 1.0.0"
  - `Checkbox` — `Pressable` with `checked` state, label from `merchantContractMessages.checkbox`
  - `FormButton` — disabled until checkbox checked, label `accept`, loading label `accepting`
  - Submit handler: builds full `MerchantContractData` payload (with `ipAddress: "unknown"`, `userAgent: "unknown"`, `acceptedAt: new Date().toISOString()`, `signature: "digital"`), logs `console.log('[MerchantContract] Submitting:', JSON.stringify(data, null, 2))`, calls `saveContract(data)`, shows `LoadingOverlay` during submission, on success pushes `/auth/account-created`, on error shows error text for retry
  - Error state: conditional red text below terms view

### Layer 5: Screen & Navigation

- [x] **5.1** Create `app/auth/merchant-contract.tsx` — Expo Router screen, renders `MerchantContractForm` directly (NO `AuthScreenShell` wrapper, NO progress bar)
- [x] **5.2** In `src/components/auth/forms/PaymentMethodForm.tsx` line 88: change `router.push("/auth/account-created")` → `router.push("/auth/merchant-contract")`

## Implementation Order

Layer 1 (types) is dependency-free — do first. Layers 2 (state) and 3 (messages) are independent — can be done in parallel after Layer 1. Layer 4 (form component) depends on Layers 2 and 3 — do fourth. Layer 5 (screen + redirect) depends on Layer 4 — do last. Verify end-to-end: payment-method → merchant-contract → accept → account-created.
