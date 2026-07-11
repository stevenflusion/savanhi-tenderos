# Design: Brand Panel (web-enterprise)

## Technical Approach

Extend the existing Clean Architecture pattern to add brand-facing features alongside admin functionality. Auth refactors from hardcoded to DB-backed role resolution. Sidebar becomes role-aware. Campaign management, payments, metrics, and Edge Functions are new domains following the same domain/application/presentation layering.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Auth source**: DB table vs hardcoded map | DB: flexible, multi-tenant. Hardcoded: simple but single-user. | **DB table `brand_auth`** — `savanhi` stays hardcoded as admin bootstrap. |
| **Sidebar**: single component with role branching vs two components | Single: less duplication. Two: cleaner separation. | **Single `AppSidebar` with role-based sections** — follows existing pattern, adds `<RoleGuard>`. |
| **Role enum**: use existing `"marca"` vs normalize to `"brand"` | `"marca"` matches api-contracts. `"brand"` matches spec. | **Use `"marca"` from `@repo/api-contracts`** — project consistency over spec naming. |
| **Coupon generation**: Supabase DB function vs app layer | DB fn: atomic, no round-trips. App: testable, in transaction. | **Application layer within a Supabase RPC** — atomic bulk insert with conflict checks. |
| **Realtime**: per-campaign channel vs single filtered | Per-campaign: granular unsubscribe, predictable billing. Single: simpler. | **One channel per campaign** — unsubscribe on unmount, fits Supabase Realtime model. |
| **Campaign state machine**: DB CHECK constraint vs app-level enum | DB: enforcement at storage level. App: flexible. | **DB enum type `campaign_status`** with CHECK + app-level typed union — defense in depth. |

## Data Flow

```
┌─ LOGIN ──────────────────────────────────────────────────────────┐
│ SavanhID+Password → supabase-auth-service → lookup brand_auth    │
│   → resolve email → supabase.auth.signInWithPassword(email, pw)  │
│   → AuthProvider context (user with role) → role-based redirect  │
└──────────────────────────────────────────────────────────────────┘

┌─ CAMPAIGN CREATION → ACTIVATION ────────────────────────────────┐
│ Brand: 2-step form → POST /api/campaigns → DB insert (draft)    │
│ Brand: upload receipt → Supabase Storage payment-receipts/      │
│   → status: receipt_uploaded                                     │
│ Admin: confirm payment → RPC bulk-insert coupons                │
│   → status: active → Realtime channel opens for metrics          │
└──────────────────────────────────────────────────────────────────┘

┌─ COUPON REDEMPTION ─────────────────────────────────────────────┐
│ Tendero app → Edge Function redeem-coupon → DB transaction       │
│   → mark coupon redeemed → insert redemption row                 │
│   → Realtime broadcast → brand dashboard updates counter         │
└──────────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/auth/brand-auth.ts` | Create | BrandAuth mapping entity, BrandProfile type |
| `src/domain/campaign/` | Create | Campaign, Coupon, Redemption entities + CampaignStatus enum |
| `src/domain/payment/` | Create | CampaignPayment entity, fee calculation types |
| `src/application/auth/supabase-auth-service.ts` | Modify | Replace hardcoded map with `brand_auth` DB lookup |
| `src/application/auth/login-use-case.ts` | Modify | Role-based `nextRoute`: admin→`/admin/dashboard`, brand→`/brand/dashboard` |
| `src/application/auth/brand-auth-service.ts` | Create | Register brand, generate SavanhID/password |
| `src/application/campaign/` | Create | Campaign use cases: create, list, state transitions |
| `src/application/payment/` | Create | Payment use cases: upload receipt, confirm, reject, settlement |
| `src/application/coupon/coupon-generator.ts` | Create | Bulk coupon code generation (SAV-XXXXXXXX, 8-char) |
| `src/presentation/components/auth/auth-provider.tsx` | Modify | Dynamic user profile from DB (name, role, brand name) |
| `src/components/app-sidebar.tsx` | Modify | Role-aware sections: admin vs brand nav items |
| `src/components/nav-main.tsx` | Modify | Accept optional badge prop for Realtime counters |
| `src/components/nav-projects.tsx` | Delete | Replaced by role-specific navigation |
| `src/presentation/components/brand/` | Create | Brand dashboard, campaign form, metrics views |
| `src/presentation/components/admin/` | Create | Brand registration form, payments list with receipt preview |
| `src/presentation/components/admin/admin-guard.tsx` | Create | Route guard component for `/admin/*` |
| `pages/brand/dashboard.tsx` | Create | Brand campaign list dashboard |
| `pages/brand/campaigns/new.tsx` | Create | 2-step campaign creation form |
| `pages/brand/campaigns/[id].tsx` | Create | Campaign detail with metrics & settlement |
| `pages/admin/dashboard.tsx` | Create | Admin dashboard (redirect from /dashboard) |
| `pages/admin/brands/new.tsx` | Create | Brand registration form |
| `pages/admin/payments.tsx` | Create | Pending payments list with confirm/reject |
| `pages/unauthorized.tsx` | Create | Unauthorized role page |
| `supabase/functions/validate-coupon/` | Create | Edge Function: validate coupon |
| `supabase/functions/redeem-coupon/` | Create | Edge Function: atomic redemption |
| `pages/dashboard.tsx` | Modify | Redirect to role-specific dashboard |
| `pages/index.tsx` | Modify | Update copy for brand-aware login page |
| `pages/_app.tsx` | Modify | Add SidebarProvider wrapper if needed |

## Interfaces / Contracts

```typescript
// Domain: New entities
type CampaignStatus = "draft" | "pending_payment" | "receipt_uploaded" | "active" | "finished";

interface Campaign {
  id: string;
  brandId: string;
  name: string;
  description: string;
  status: CampaignStatus;
  storeTiers: Array<"gold" | "plata" | "bronze">;
  neighborhood: string;
  radiusKm: number;
  minStores: number;
  maxStores: number;
  couponPrefix: string;
  couponCount: number;
  discountValue: number;
  feeFixed: number;
  cpo: number;
  startDate: string;
  endDate: string;
  rejectionReason?: string;
}

interface Coupon {
  id: string;
  campaignId: string;
  code: string; // PREFIX-XXXXXXXX
  redeemedAt: string | null;
  redeemedByStoreId: string | null;
}

interface CampaignPayment {
  id: string;
  campaignId: string;
  receiptUrl: string;
  status: "pending" | "confirmed" | "rejected";
  confirmedAt: string | null;
}

interface BrandAuth {
  id: string;
  savanhiId: string;
  email: string;
  brandName: string;
  role: "marca";
}

// Use case signatures
// Login result includes role for routing
type LoginResult = {
  ok: true; user: AuthUser; nextRoute: string;
} | {
  ok: false; errors: Record<string, string>; message: string;
};
```

## Testing Strategy

No test runner configured in the project (per `openspec/config.yaml`). Testing is deferred. Verification relies on TypeScript strict mode (`tsc --noEmit`) and build (`next build`).

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Type safety | All new types, entities, use case signatures | `tsc --noEmit` (strict mode) |
| Build | Full app compilation | `pnpm --filter web-enterprise run build` |
| Manual | Auth flows, campaign lifecycle, payment flows | Browser testing |

## Migration / Rollout

No data migration required — new tables are additive. The existing `savanhi` hardcoded mapping remains as a bootstrap entry. Single PR with size:exception accepted by maintainer.

## Resolved Decisions

- **Role naming**: Use `"marca"` from `@repo/api-contracts` — confirmed by team.
- **Edge Functions**: Located at monorepo root `supabase/functions/{name}/` — independent Deno functions deployable via `supabase functions deploy`. The tendero app calls them as HTTP APIs (`POST /functions/v1/validate-coupon`). Simple enough (~40-50 lines each) that the Deno/Node.js split is negligible.
