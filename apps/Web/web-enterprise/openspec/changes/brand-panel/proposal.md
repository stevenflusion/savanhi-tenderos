# Proposal: Brand Panel (web-enterprise)

## Intent

Build the brand-facing enterprise panel for Savanhi. Brands create coupon campaigns, pay upfront fees, monitor real-time redemption metrics, and receive post-campaign settlements — everything the business side needs to generate revenue.

## Context

The current web-enterprise has:
- Auth with SavanhID login (hardcoded for one admin user, `savanhi`)
- Dashboard placeholder with mock data
- Sidebar full of `#` placeholder UI components
- Clean Architecture structure (domain/application/presentation)

## Scope

### In Scope

**Auth (modified)**
- Extend SavanhID login to support brands (DB-backed SavanhID → email mapping)
- Admin registers brands from the panel: email + generated SavanhID + password
- Role-based routing: `role = 'brand'` → campaign dashboard, `role = 'admin'` → admin section
- Unauthorized page for wrong roles

**Sidebar (replaced)**
- Replace all placeholder nav items with real routes
- Admin sidebar: Dashboard, Registrar Marca, Pagos Pendientes (with Realtime badge)
- Brand sidebar: Dashboard (campañas), Nueva Campaña

**Campaign Management (new)**
- Dashboard listing all brand campaigns with status, dates, metrics
- Campaign creation form (2 steps: campaign data + coupon config)
- State machine: draft → pending_payment → active → finished
- Store targeting: tiers (Gold/Plata/Bronze) + neighborhood + radius in km + min/max stores

**Payments (new)**
- Upfront payment (50% of fixed fee)
- Manual receipt upload (image/PDF) to Supabase Storage
- Admin reviews and confirms payments from dashboard
- In-app admin notifications via Realtime subscription
- Settlement view post-campaign with final amounts

**Live Metrics (new)**
- Real-time redemption counters via Supabase Realtime
- Redemption rate, budget executed, active stores
- Top 10 stores leaderboard
- Only accessible for active/finished campaigns

**Coupon Generation (new)**
- Bulk insert of N coupon rows when campaign activates
- Short human-readable code per coupon: `SAV-XXXXXXXX` (8 alphanumeric chars)
- QR code rendered in-browser via qrcode.react (not stored)
- Brand can print/distribute QR sheets

**Edge Functions (new)**
- `validate-coupon`: validates coupon code for tendero app
- `redeem-coupon`: atomic redemption in transaction

**Admin Section (new)**
- `/admin/brands/new`: register brand (email, generate SavanhID, password)
- `/admin/payments`: pending payments with receipt preview and confirmation

### Out of Scope

- DeUna/Stripe payment integration (manual receipts in MVP)
- Email notifications (SendGrid/Resend — Phase 2)
- Admin campaign creation (admin works in Supabase Studio for MVP)
- Map/heatmap of redemptions (Phase 2)
- PDF/CSV export of reports (Phase 2)
- Multiple coupon types per campaign (Phase 2)
- Store registration (comes from tendero app)
- Tier calculation logic (comes from tendero app data)

## Approach

1. **DB layer (new tables)**: campaigns, coupons, redemptions, campaign_payments, brand_auth_mapping
2. **Auth refactor**: replace hardcoded SavanhID map with DB query, add role-based guards
3. **Sidebar rewrite**: role-aware navigation with real routes
4. **Feature by feature**: Dashboard → Create Campaign → Payment → Metrics → Settlement
5. **Admin section**: Register Brand + Payments list
6. **Edge Functions**: validate + redeem coupons (for tendero app consumption)
7. **Realtime**: metrics counters + admin payment notifications

## Dependencies

- Existing Supabase client and auth infrastructure
- Existing stores table (tiers and location data from tendero app)
- `@repo/api-contracts` for AuthRole types
- qrcode.react library for QR rendering
- Supabase Realtime for live updates

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large scope across many files | High | Chained PRs — delivery per feature slice |
| Auth refactor breaks existing login | Medium | Keep backward compat — existing SavanhID still works |
| Realtime subscription limits | Low | One channel per campaign, unsubscribe on unmount |
| Store tier data not yet populated | Low | Campaign targets by tiers regardless of data availability |

## Rollback Plan

1. Revert auth service to hardcoded mapping
2. Restore original sidebar components
3. Drop new DB tables (campaigns, coupons, redemptions, campaign_payments, brand_auth)
4. Remove Edge Functions
