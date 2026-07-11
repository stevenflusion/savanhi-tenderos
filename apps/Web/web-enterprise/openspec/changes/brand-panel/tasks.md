# Tasks: Brand Panel

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1800–2500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | PR | Base |
|------|------|----|------|
| 1 | Foundation + Auth + Sidebar | PR 1 | main |
| 2 | Campaigns + Payments + Coupons + Admin | PR 2 | PR 1 branch |
| 3 | Metrics + Settlement + Edge Functions | PR 3 | PR 2 branch |

## Phase 1: Foundation & Auth

- [x] 1.1 `src/domain/auth/brand-auth.ts` — BrandAuth entity, BrandProfile type
- [x] 1.2 `src/domain/campaign/` — Campaign, Coupon, Redemption, CampaignStatus enum
- [x] 1.3 `src/domain/payment/` — CampaignPayment, fee types
- [x] 1.4 `supabase-auth-service.ts` — DB-backed brand_auth lookup
- [x] 1.5 `login-use-case.ts` — role-based routing (admin→/admin, brand→/brand)
- [x] 1.6 `auth-provider.tsx` — dynamic profile from DB
- [x] 1.7 `app-sidebar.tsx` + `nav-main.tsx` — role-aware nav + badge
- [x] 1.8 `pages/unauthorized.tsx` — role-blocked page
- [x] 1.9 `pages/index.tsx`, `_app.tsx`, `dashboard.tsx` — brand-aware routing

## Phase 2: Campaigns, Payments & Coupons

- [x] 2.1 `src/application/campaign/` — create, list, state transitions
- [x] 2.2 `src/application/payment/` — receipt upload, fee calc, settlement
- [x] 2.3 `coupon-generator.ts` — SAV-XXXXXXXX bulk code gen
- [x] 2.4 `pages/brand/dashboard.tsx` — campaign list + metrics
- [x] 2.5 `pages/brand/campaigns/new.tsx` — 2-step form
- [x] 2.6 `pages/brand/campaigns/[id].tsx` — detail, upload, settlement
- [x] 2.7 Bulk insert RPC for coupon generation on confirmation
- [x] 2.8 QR rendering (qrcode.react) on campaign detail

## Phase 3: Admin Section

- [x] 3.1 Admin route guard — `admin-guard.tsx`
- [x] 3.2 `brand-auth-service.ts` — register brand, generate SavanhID/pw
- [x] 3.3 `pages/admin/brands/new.tsx` — brand registration form
- [x] 3.4 `pages/admin/payments.tsx` — pending payments + receipt preview
- [x] 3.5 `pages/admin/dashboard.tsx` — admin dashboard
- [x] 3.6 Realtime badge for pending payments in sidebar

## Phase 4: Metrics & Realtime

- [x] 4.1 Realtime hook per campaign — redemption counter
- [x] 4.2 Metrics: rate, budget, active stores
- [x] 4.3 Top 10 stores leaderboard
- [x] 4.4 Wire metrics into campaign detail (active/finished)

## Phase 5: Edge Functions

- [x] 5.1 `supabase/functions/validate-coupon/index.ts`
- [x] 5.2 `supabase/functions/redeem-coupon/index.ts`
- [x] 5.3 `supabase/config.toml` — function deployment entries

## Phase 6: Verification

- [x] 6.1 `tsc --noEmit` — fix type errors
- [x] 6.2 `pnpm --filter web-enterprise build` — fix build errors
- [x] 6.3 Manual auth: login admin/brand, unauthorized redirect
- [x] 6.4 Manual lifecycle: create → payment → confirm → active → metrics
- [x] 6.5 Manual admin: register brand, view payments, confirm/reject
