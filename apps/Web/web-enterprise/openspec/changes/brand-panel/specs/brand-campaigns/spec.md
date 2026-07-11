# Brand Campaigns Specification

## Purpose

Brands create, manage, and track coupon campaigns — from draft through payment to active and finished states, including store targeting and coupon generation.

## Requirements

### Requirement: Campaign Dashboard

The brand dashboard MUST list all campaigns with status, dates, and key metrics (redemptions, budget spent).

#### Scenario: Campaigns listed
- GIVEN a brand is authenticated
- WHEN they visit `/brand/dashboard`
- THEN all their campaigns are listed with status, dates, redemption count, and budget spent

### Requirement: Campaign Creation

Brands MUST create campaigns via a 2-step form: (1) campaign details and store targeting, (2) coupon configuration and fee preview.

#### Scenario: Full creation flow
- GIVEN a brand is on `/brand/campaigns/new`
- WHEN they complete step 1 (name, description, store tiers, neighborhood, radius, min/max stores) and step 2 (code prefix, count, discount value, fee_fixed, CPO)
- THEN the campaign is created with status `draft`

#### Scenario: Invalid targeting rejected
- GIVEN min stores > max stores
- WHEN the form validates
- THEN an error is shown and the campaign is not created

### Requirement: Campaign State Machine

Campaigns MUST follow: `draft` → `pending_payment` → `active` → `finished`. Brands can edit drafts. Once `pending_payment`, only payment upload is allowed. Once `active`, coupons can be redeemed. `finished` is set by end_date.

#### Scenario: Draft to pending payment
- GIVEN a campaign in `draft`
- WHEN the brand submits it for payment
- THEN status changes to `pending_payment`

#### Scenario: Active to finished
- GIVEN a campaign past its end_date
- WHEN the system checks expiry
- THEN status changes to `finished`

### Requirement: Store Targeting

Campaigns MUST target stores by tier (Gold/Plata/Bronze), neighborhood, radius in km, and min/max store count. The system uses existing store data from the tendero app.

#### Scenario: Stores filtered by criteria
- GIVEN stores with tier and location data exist
- WHEN a campaign targets "Gold" tier stores within 5 km of "Palermo"
- THEN only matching stores are eligible for coupon redemptions

### Requirement: Coupon Generation

When a campaign transitions from `pending_payment` to `active` (payment confirmed), the system MUST bulk-insert N coupon rows. Each coupon has a unique code in format `PREFIX-XXXXXXXX` (8 alphanumeric chars, excluding ambiguous chars like O/0/I/1).

#### Scenario: Bulk generation on activation
- GIVEN a campaign payment is confirmed
- WHEN admin marks payment as confirmed
- THEN N coupon rows are inserted with unique codes and the campaign status becomes `active`

#### Scenario: Duplicate code prevention
- GIVEN coupons already exist for a campaign
- WHEN generation runs
- THEN all codes are unique within the campaign and across the system
