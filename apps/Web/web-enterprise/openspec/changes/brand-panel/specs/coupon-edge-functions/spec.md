# Coupon Edge Functions Specification

## Purpose

Supabase Edge Functions for coupon validation and redemption, consumed by the tendero app. Both use `service_role` for database access.

## Requirements

### Requirement: validate-coupon

The system MUST expose a POST Edge Function `validate-coupon` that accepts `{ coupon_code }` and returns coupon validity. It MUST check: (1) coupon code exists, (2) campaign status is `active`, (3) coupon is not yet redeemed, (4) expiry date has not passed. Returns `{ valid: true, coupon }` or `{ valid: false, error }`.

#### Scenario: Valid coupon
- GIVEN a coupon with code `SAV-A3F8K2M1` linked to an active campaign, not redeemed, within expiry
- WHEN POST to `validate-coupon` with `{ coupon_code: "SAV-A3F8K2M1" }`
- THEN response is `{ valid: true, coupon: { id, campaign_id, discount_value, campaign_name } }`

#### Scenario: Already redeemed
- GIVEN the coupon was already redeemed
- WHEN POST to validate
- THEN response is `{ valid: false, error: "Cupón ya utilizado" }`

#### Scenario: Expired campaign
- GIVEN the campaign's end_date has passed
- WHEN POST to validate
- THEN response is `{ valid: false, error: "Campaña expirada" }`

#### Scenario: Non-existent code
- GIVEN the code does not exist in the coupons table
- WHEN POST to validate
- THEN response is `{ valid: false, error: "Cupón no encontrado" }`

### Requirement: redeem-coupon

The system MUST expose a POST Edge Function `redeem-coupon` that accepts `{ coupon_code, store_id }` and atomically: (1) marks the coupon as redeemed (sets `redeemed_at`), (2) inserts a row in `redemptions` with coupon_id, store_id, and timestamp. Uses a database transaction to prevent race conditions.

#### Scenario: Successful redemption
- GIVEN a valid, unredeemed coupon and a valid store_id
- WHEN POST to `redeem-coupon` with `{ coupon_code: "SAV-A3F8K2M1", store_id: "store-123" }`
- THEN the coupon is marked redeemed, a redemption row is inserted, and response is `{ success: true, redemption_id }`

#### Scenario: Double redemption prevented
- GIVEN a coupon that was just redeemed by another request
- WHEN POST to `redeem-coupon` with the same code
- THEN the transaction fails, coupon remains redeemed once, and response is `{ success: false, error: "Cupón ya utilizado" }`

#### Scenario: Invalid campaign status
- GIVEN the coupon's campaign is not in `active` status
- WHEN POST to `redeem-coupon`
- THEN the function returns `{ success: false, error: "Campaña no activa" }`

#### Scenario: Expired coupon
- GIVEN the coupon's expiry date has passed
- WHEN POST to `redeem-coupon`
- THEN the function returns `{ success: false, error: "Cupón expirado" }`
