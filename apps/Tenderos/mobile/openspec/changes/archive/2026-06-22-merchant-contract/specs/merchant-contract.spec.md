# Merchant Contract Specification

## Purpose

The Merchant Contract screen is a mandatory legal acknowledgment step inserted between payment-method selection and account-creation. Tenderos must accept the digital terms before finalizing registration, producing a versioned consent record.

## Requirements

### Requirement: Navigation Redirect

The `PaymentMethodForm` MUST navigate to `/auth/merchant-contract` instead of `/auth/account-created` on successful payment-method save.

#### Scenario: Redirect after payment method

- GIVEN the user completed payment-method selection successfully
- WHEN `savePaymentMethod` returns `{ success: true }`
- THEN the router pushes to `/auth/merchant-contract`

#### Scenario: Redirect unchanged on failure

- GIVEN `savePaymentMethod` returned `{ success: false }`
- WHEN the submission completes
- THEN the screen stays on payment-method and displays the error

### Requirement: User Data Summary

The screen MUST display a read-only summary card with `fullName`, `cedula`, `storeName`, `email`, `address`, and `paymentMethod`. All data MUST come from `useAuth().user`.

#### Scenario: Summary renders registration data

- GIVEN the user completed all registration steps up to payment-method
- WHEN the merchant-contract screen loads
- THEN a read-only card shows fullName, cedula, storeName, email, address, and paymentMethod

### Requirement: Terms and Acceptance

The screen MUST render scrollable terms text from `merchant-contract.messages.ts`. The `termsVersion` ("1.0.0") MUST be visible. A mandatory checkbox labelled "He leído y acepto los Términos y Condiciones y la Política de Privacidad" MUST control the accept button's enabled state.

#### Scenario: Accept button disabled until checked

- GIVEN the merchant-contract screen is displayed
- WHEN the checkbox is unchecked
- THEN the accept button MUST be disabled
- WHEN the user checks the checkbox
- THEN the accept button MUST become enabled

#### Scenario: Scrollable terms with version

- GIVEN the merchant-contract screen is displayed
- WHEN the user scrolls the terms area
- THEN the terms text scrolls independently
- AND `termsVersion` is displayed near the terms text

### Requirement: Contract Submission Payload

Before calling `saveContract`, the screen MUST log `console.log('[MerchantContract] Submitting:', JSON.stringify(data, null, 2))`. The payload MUST include: `userId`, `fullName`, `cedula`, `storeName`, `email`, `address`, `paymentMethod`, `termsVersion` ("1.0.0"), `acceptedAt` (ISO 8601), `signature` ("digital"), `ipAddress`, and `userAgent`.

#### Scenario: Full payload logged and submitted

- GIVEN the user checked the acceptance checkbox
- WHEN the user presses the accept button
- THEN the screen logs the full JSON payload to console
- AND calls `saveContract` with the complete payload
- AND all required fields are present in the payload

### Requirement: Mock Save Contract

`AuthProvider.saveContract` MUST simulate a delay, update user state with `contractAccepted: true` and `contractVersion: "1.0.0"`, log the data to console, and return `{ success: true }`.

#### Scenario: Successful contract save

- GIVEN the user submits the contract
- WHEN `saveContract` is called
- THEN it awaits a simulated delay
- AND updates user with `contractAccepted: true` and `contractVersion: "1.0.0"`
- AND logs the payload via console.log
- AND returns `{ success: true }`

### Requirement: Screen Shell and UX States

The screen MUST NOT show the ProgressBar from `AuthScreenShell`. During submission the screen MUST display a LoadingOverlay. On error the screen MUST show the error message and remain on screen for retry. On success the screen MUST navigate to `/auth/account-created`.

#### Scenario: No progress bar

- GIVEN the merchant-contract screen renders
- THEN no progress bar is visible
- AND the screen uses a custom shell or overrides AuthScreenShell

#### Scenario: Loading overlay during submission

- GIVEN the user submitted the contract
- WHEN `saveContract` is pending
- THEN a LoadingOverlay is displayed
- AND the accept button and checkbox are disabled

#### Scenario: Error with retry

- GIVEN `saveContract` returned `{ success: false, error: "..." }`
- WHEN the submission completes
- THEN the error message is displayed
- AND the user stays on the merchant-contract screen
- AND the user can retry submission

#### Scenario: Navigation on success

- GIVEN `saveContract` returned `{ success: true }`
- WHEN the submission completes
- THEN the router pushes to `/auth/account-created`
