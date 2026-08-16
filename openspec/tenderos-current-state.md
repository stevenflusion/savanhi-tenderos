# Tenderos Ecosystem — Current State Snapshot

Date: 2026-08-09
Scope: Current implemented state only. Source of truth is existing code plus commands that compile/build today.

## Verified Stack

- Monorepo: PNPM workspace + Turborepo (`package.json`, `pnpm-workspace.yaml`, `turbo.json`)
- Backend: Node.js + Express + TypeScript + Zod + PostgreSQL + Drizzle
- Web: Next.js 14 + React 18 + Tailwind
- Mobile: Expo 54 + Expo Router + React Native + NativeWind + Mapbox
- Shared contracts: `packages/api-contracts`

## What Is Implemented and Verified

### Backend and shared packages

The following commands passed:

- `pnpm --filter @repo/api-contracts check-types`
- `pnpm --filter @repo/api-contracts build`
- `pnpm --filter @repo/backend-core check-types`
- `pnpm --filter @repo/backend-core build`
- `pnpm --filter tenderos-backend check-types`
- `pnpm --filter tenderos-backend build`

This confirms the current backend/shared implementation is at least buildable and type-safe in the present repo state.

### Tenderos backend capabilities wired to persistence

Implemented in `apps/Tenderos/backend/src/routes/index.ts` and backed by repositories under `packages/backend-core/src/database/repositories/`:

- Tenderos status endpoint
- Store creation and store lookup for the owner
- Product list/create/update/delete
- Order list and order status update

Shared auth is implemented in `packages/backend-core/src/auth/router.ts` and `packages/backend-core/src/auth/service.ts`, with PostgreSQL-backed password login/register and JWT session flows.

### Web apps that build today

The following commands passed:

- `pnpm --filter tenderos-web build`
- `pnpm --filter tenderos-docs build`

This proves both Next.js apps are buildable today.

### Mobile onboarding that exists in code

The mobile app has a real onboarding/auth flow under `apps/Tenderos/mobile/app/auth/*` and an `AuthProvider` that calls backend endpoints for:

- OTP request
- OTP verification
- Session refresh
- Final store creation

The onboarding also includes location capture with Mapbox and local session persistence via Secure Store.

## What Exists but Is NOT Verified as Working Today

### Mobile app runtime

There is no successful proof from this snapshot that the mobile app currently passes tests or type checks.

Observed evidence:

- `pnpm --filter tenderos-mobile exec jest --runInBand` failed because `jest` was not found in the current package environment.
- `pnpm --filter tenderos-mobile exec tsc --noEmit -p tsconfig.json` failed with missing test-related dependencies/types and app-level TypeScript issues.

Therefore, the mobile app exists, but it is not currently validated as healthy from a strict source-of-truth perspective.

## What Is Clearly Incomplete

- `apps/Tenderos/web/app/page.tsx` is currently a placeholder, not a functional Tenderos web product.
- `apps/Tenderos/docs/app/page.tsx` is currently a placeholder.
- Mobile dashboard/product workspace uses local/mock data instead of the Tenderos products/orders backend endpoints.
- Store photos are not persisted in backend storage/database.
- Some onboarding data is kept locally until final completion instead of being persisted progressively.
- Google sign-in UI exists visually but is not wired.

## Cross-App Ecosystem Signals

The broader repo does show a connected ecosystem:

- Clients backend can create orders
- Tenderos backend can consume store orders
- Web/admin backend manages brands and aggregated reporting

These signals indicate a shared commerce model centered on Drizzle tables defined in `packages/backend-core/src/database/schema.ts` and generated migrations.

## Current Truth Summary

- The backend core, API contracts, and Tenderos backend are real and compile today.
- The Tenderos web and docs apps build today, but they are still mostly placeholders.
- The Tenderos mobile onboarding flow exists and is wired to backend auth/store creation.
- The Tenderos mobile operational experience after onboarding is not yet validated and still contains mock/local-only areas.
- The repo already models a real multi-app commerce ecosystem, but the Tenderos experience is only partially end-to-end complete.
