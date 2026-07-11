# Admin Section Specification

## Purpose

Admin-only area for brand registration and payment management. Root at `/admin/*` with role-based guarding.

## Requirements

### Requirement: Admin Guard

Routes under `/admin/*` MUST be guarded. Only users with role `admin` can access them. Non-admin users MUST be redirected or shown an unauthorized page.

#### Scenario: Admin accesses admin routes
- GIVEN a user with role `admin`
- WHEN they navigate to `/admin/brands/new`
- THEN the page renders normally

#### Scenario: Brand blocked from admin
- GIVEN a user with role `brand`
- WHEN they navigate to `/admin/payments`
- THEN they are redirected away or shown unauthorized

### Requirement: Brand Registration Form

The page at `/admin/brands/new` MUST provide a form to register a new brand. Input: brand name, email, phone. Output: generated SavanhID + password displayed once. The brand user gets role `brand` in the `brand_auth` table.

#### Scenario: Brand registered
- GIVEN admin is on `/admin/brands/new`
- WHEN they fill brand name, email, and phone and submit
- THEN a SavanhID and password are generated, `brand_auth` row is created, and credentials are displayed

#### Scenario: Failed registration
- GIVEN the email is already registered
- WHEN the admin submits
- THEN an error message is shown and no row is created

### Requirement: Pending Payments List

The page at `/admin/payments` MUST list campaigns with `receipt_uploaded` status. Each entry shows brand name, campaign name, receipt preview (thumbnail), upload date, and action buttons (Confirmar / Rechazar).

#### Scenario: Payments listed
- GIVEN there are 5 campaigns with `receipt_uploaded`
- WHEN admin visits `/admin/payments`
- THEN all 5 are listed with receipt thumbnails

#### Scenario: No pending payments
- GIVEN no campaigns are in `receipt_uploaded`
- WHEN admin visits `/admin/payments`
- THEN a message "No hay pagos pendientes" is shown

### Requirement: Realtime Badge Counter

The sidebar "Pagos Pendientes" item MUST show a Realtime-sourced badge counter of pending (receipt_uploaded) campaigns. The counter updates when new receipts are uploaded.

#### Scenario: Badge updates
- GIVEN admin is on the dashboard with the sidebar visible
- WHEN a brand uploads a receipt
- THEN the badge counter increments via Realtime subscription

### Requirement: Payment Confirmation Flow

Admin MUST be able to confirm or reject each payment from `/admin/payments`. Confirmation triggers coupon generation. Rejection requires a reason and returns the campaign to `pending_payment`.

#### Scenario: Payment confirmed
- GIVEN a campaign with `receipt_uploaded`
- WHEN admin clicks "Confirmar"
- THEN coupons are generated, campaign becomes `active`

#### Scenario: Payment rejected with reason
- GIVEN a campaign with `receipt_uploaded`
- WHEN admin clicks "Rechazar" and enters a reason
- THEN campaign returns to `pending_payment` and reason is stored
