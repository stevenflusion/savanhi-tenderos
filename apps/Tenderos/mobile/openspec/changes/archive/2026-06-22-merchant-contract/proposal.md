# Proposal: Merchant Contract Form

## Intent

Add digital contract acceptance between payment-method and account-creation in tendero registration. Users must acknowledge terms before finalizing — no backend yet, but data model includes `termsVersion`.

## Scope

### In Scope
- `app/auth/merchant-contract.tsx` — new screen
- `MerchantContractForm` — terms + checkbox + accept button
- `merchant-contract.messages.ts` — messages
- `saveContract()` on AuthProvider (mock, logs to console)
- `MerchantContractData` type in `@repo/api-contracts` (includes `termsVersion`)
- User data summary card (name, cedula, store, email, address, payment method)
- `console.log(JSON.stringify(data, null, 2))` before submit
- Update `PaymentMethodForm` redirect → `/auth/merchant-contract`
- Override `AuthScreenShell` — hide progress bar for this screen

### Out of Scope
- Dynamic terms loading from API
- Re-acceptance flow
- Contract status in profile
- PDF / signature capture

## Capabilities

### New Capabilities
- `merchant-contract`: Contract acceptance during registration — scrollable terms, mandatory checkbox, versioned acknowledgment submission.

### Modified Capabilities
- None

## Approach

Single screen without `AuthScreenShell` progress bar. Top: read-only user data summary from AuthProvider. Middle: scrollable terms placeholder. Bottom: checkbox ("He leído y acepto los términos y condiciones") + "Aceptar" button. Submit → `console.log` + `saveContract()` → navigate to account-created. Loading via `useAuthLoading`. Follows existing form patterns (BackButton, ScreenTitle, FormButton).

## Affected Areas

| Area | Impact |
|------|--------|
| `app/auth/merchant-contract.tsx` | New |
| `src/components/auth/forms/MerchantContractForm.tsx` | New |
| `src/components/auth/messages/merchant-contract.messages.ts` | New |
| `src/components/auth/messages/index.ts` | Modified |
| `src/components/AuthProvider.tsx` | Modified |
| `packages/api-contracts/src/auth.ts` | Modified |
| `src/components/auth/forms/PaymentMethodForm.tsx` | Modified |

## Risks

| Risk | Mitigation |
|------|------------|
| Screen fatigue (10th screen) | No progress bar signals "separate legal step" |
| Placeholder terms raise wrong expectations | `termsVersion` in model from day 1; text marked as placeholder |
| Network failure (future real API) | Mock for now; error state pattern exists |

## Rollback Plan

1. Revert `PaymentMethodForm.tsx` redirect to `/auth/account-created`
2. Remove new screen, form, messages
3. Revert `index.ts`, `AuthProvider.tsx`, `api-contracts`

## Dependencies

- Existing user data from registration flow
- No new npm packages

## Success Criteria

- [ ] Contract screen renders after payment-method, navigates to account-created on accept
- [ ] Scrollable terms + mandatory checkbox enables "Aceptar" only when checked
- [ ] `console.log` outputs full contract data with `termsVersion`
- [ ] User summary matches AuthProvider registration data
- [ ] Loading overlay + error state work
- [ ] `PaymentMethodForm` now points to `/auth/merchant-contract`
