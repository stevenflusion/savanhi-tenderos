# Brand Payments Specification

## Purpose

Handle the payment lifecycle: upfront fee payment via manual receipt upload, admin confirmation, and post-campaign settlement.

## Requirements

### Requirement: Fee Model

The system MUST use a hybrid fee model: `fee_fixed + CPO (cost per redemption)`. The admin defines both values per campaign. 50% of `fee_fixed` is paid upfront. Settlement = remaining 50% + (CPO × actual redemptions).

#### Scenario: Fee calculation
- GIVEN a campaign with `fee_fixed = 2000` and `CPO = 50`
- WHEN 100 coupons are redeemed
- THEN upfront payment is 1000, settlement is 1000 + (50 × 100) = 6000

### Requirement: Receipt Upload

Brands MUST upload a payment receipt (image or PDF) to Supabase Storage bucket `payment-receipts`. The upload is tied to the campaign and marks it as `receipt_uploaded`.

#### Scenario: Receipt uploaded
- GIVEN a campaign in `pending_payment` status
- WHEN the brand uploads a valid image or PDF
- THEN the file is stored in `payment-receipts/{campaign_id}/`, campaign status becomes `receipt_uploaded`

#### Scenario: Invalid file type rejected
- GIVEN the brand tries to upload a .exe file
- WHEN the upload is submitted
- THEN the system rejects with "Formato de archivo no válido"

### Requirement: Admin Confirmation

Admin MUST review receipts on `/admin/payments` and confirm or reject. Confirmation triggers coupon generation and status change to `active`. Rejection moves the campaign back to `pending_payment` with a reason.

#### Scenario: Payment confirmed
- GIVEN a campaign with `receipt_uploaded` status
- WHEN the admin confirms the payment
- THEN coupons are bulk-generated and campaign status becomes `active`

#### Scenario: Payment rejected
- GIVEN a campaign with `receipt_uploaded` status
- WHEN the admin rejects with reason "Comprobante ilegible"
- THEN campaign status returns to `pending_payment` and the brand sees the rejection reason

### Requirement: Settlement View

Brands MUST see a settlement summary for finished campaigns showing total redemptions, final fee, amounts paid, and amount due.

#### Scenario: Settlement displayed
- GIVEN a finished campaign with redemptions
- WHEN the brand views the campaign detail
- THEN the settlement shows upfront paid, CPO total, remaining balance, and total fee
