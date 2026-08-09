# Brand Metrics Specification

## Purpose

Provide real-time campaign performance data for brands — live redemption counters, budget tracking, and store leaderboard — via Supabase Realtime subscriptions.

## Requirements

### Requirement: Real-Time Redemption Counter

The brand dashboard MUST display live redemption counts for active/finished campaigns via Supabase Realtime subscription on the `redemptions` table filtered by `campaign_id`. Counters update without page reload.

#### Scenario: Counter updates in real time
- GIVEN a brand is viewing an active campaign dashboard
- WHEN a coupon is redeemed (new row inserted in `redemptions`)
- THEN the redemption counter increments without page refresh

#### Scenario: Multiple campaigns subscribed
- GIVEN a brand has 3 active campaigns
- WHEN the dashboard mounts
- THEN a Realtime channel per campaign is subscribed, each with its own counter

### Requirement: Metrics Display

For each campaign with status `active` or `finished`, the system MUST display: total redemptions, redemption rate (redemptions / total coupons), budget executed (CPO × redemptions), and active stores (distinct stores with ≥1 redemption).

#### Scenario: Metrics calculated correctly
- GIVEN a campaign with 500 coupons, 50 redemptions, CPO = 50, across 10 stores
- WHEN the metrics component renders
- THEN it shows: 50 redemptions, 10% rate, 2500 budget executed, 10 active stores

### Requirement: Top Stores Leaderboard

The system MUST display the top 10 stores by redemption count for each active/finished campaign.

#### Scenario: Leaderboard sorted
- GIVEN 15 stores have redemptions for a campaign
- WHEN the leaderboard component renders
- THEN exactly the top 10 stores (by redemption count descending) are shown with their counts

### Requirement: Access Restriction

Metrics MUST only be accessible for campaigns with status `active` or `finished`. Draft and pending_payment campaigns show no metrics.

#### Scenario: Draft campaign no metrics
- GIVEN a campaign with status `draft`
- WHEN the brand views its detail page
- THEN no metrics section is rendered

#### Scenario: Finished campaign still shows metrics
- GIVEN a campaign with status `finished`
- WHEN the brand views its detail page
- THEN all metrics (counters, rate, budget, stores) are still displayed
