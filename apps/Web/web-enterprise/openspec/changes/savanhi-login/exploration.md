## Exploration: SavanhID Login with Supabase Auth

### Current State

The existing auth system is a **half-baked prototype** wired to a backend Express API:

1. **Domain layer** (`src/domain/auth/`):
   - `credentials.ts` — Defines `LoginCredentials` with `email: string` field (not SavanhID)
   - `validation.ts` — `validateLoginCredentials` requires email format (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) — completely incompatible with SavanhID
   - `session.ts` — Re-exports `AuthSession`, `AuthUser`, `AuthRole` from `@repo/api-contracts`

2. **Application layer** (`src/application/auth/`):
   - `auth-api.ts` — `login()` calls `POST /auth/login` on Express backend, `saveSession()`/`loadSession()` use `localStorage`. `me()` calls `GET /auth/me` with Bearer token
   - `login-use-case.ts` — Orchestrates: validate → call login API → save to localStorage → return result
   - `session-store.ts` — Just re-exports from `auth-api.ts`

3. **Presentation layer** (`src/presentation/`):
   - `auth-provider.tsx` — React Context that reads localStorage on mount, validates session via `/auth/me`, exposes `user`, `session`, `isReady`, `logout()`, `refreshSession()`
   - `login-form.tsx` — Form with `email` field (labeled "MarcaId" in placeholder but uses email autocmplete), password, submit button
   - `use-login-form.ts` — Hook managing form state, calls `loginUseCase`, redirects to `/dashboard` on success

4. **Pages**:
   - `pages/index.tsx` — Landing page with header + `LoginForm`
   - `pages/dashboard.tsx` — Already exists, uses `useAuth()` to guard access, shows session info
   - `_app.tsx` — Wraps everything in `<AuthProvider>`

5. **Backend** (`apps/Web/backend/`):
   - Uses `@repo/backend-core` which has `createAuthRouter` with Supabase Auth service
   - The backend already authenticates via Supabase (`@supabase/supabase-js` v2.108.2)
   - Login expects `{ email, password }`, returns `AuthResponse` with user profile + session tokens

**Key observation**: The **backend already uses Supabase Auth** for authentication. The frontend calls the backend which delegates to Supabase. The plan to go "direct Supabase Auth" means the frontend calls Supabase directly, skipping the backend entirely for authentication.

**Critical state**: `@supabase/supabase-js` is **NOT installed** in `web-enterprise/package.json`. It's only in `packages/backend-core/package.json`.

### Affected Areas

| File | Why Affected |
|------|-------------|
| `src/domain/auth/credentials.ts` | `LoginCredentials.email` must become `LoginCredentials.savanhiId`. No email field |
| `src/domain/auth/validation.ts` | Must validate SavanhID (non-empty, length, allowed chars) instead of email regex |
| `src/domain/auth/session.ts` | Currently re-exports from `@repo/api-contracts` — those types use `email`, `accessToken`, `refreshToken`. May need domain-specific types or keep them and do internal mapping |
| `src/application/auth/auth-api.ts` | **DELETE** — entire file is backend API + localStorage based |
| `src/application/auth/login-use-case.ts` | **REWRITE** — must call Supabase Auth directly, not backend API |
| `src/application/auth/session-store.ts` | **REWRITE** — Supabase manages sessions via its own client, not localStorage |
| `src/presentation/components/auth/auth-provider.tsx` | **REWRITE** — must use Supabase `onAuthStateChange` instead of localStorage + `/auth/me` |
| `src/presentation/components/auth/login-form.tsx` | Change `email` field to `savanhiId`. Update placeholder, autoComplete, field name |
| `src/presentation/hooks/use-login-form.ts` | Rewrite to call new use-case. Remove `email` -> `savanhiId` |
| `package.json` | Add `@supabase/supabase-js` dependency |
| `.env.local` (needs creation) | Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `pages/dashboard.tsx` | Already exists and uses `useAuth()` — likely compatible if AuthProvider shape is preserved |
| `@repo/api-contracts` types | `AuthUser.email` is required. For Supabase direct auth, we'll get the `User` from Supabase's `auth.getUser()` and need to map it. The `AuthUser` type may need adaptation or we use domain-specific types |

### Approaches

1. **Minimal refactor — wrap Supabase client behind existing interfaces**
   - Create a `supabase-client.ts` in application layer that wraps `@supabase/supabase-js`
   - Modify `auth-api.ts` to use Supabase client instead of fetch + localStorage
   - Keep `LoginCredentials.email` internally but accept SavanhID and map to `admin@savanhi.com`
   - Pros: Minimal change surface, existing interface contracts preserved
   - Cons: Leaky abstraction (email field name is confusing), forces email-based type even though we don't use email, the domain model lies about what it represents
   - Effort: Low

2. **True domain refactor — introduce SavanhID in domain, map at boundary**
   - Change `LoginCredentials` to use `savanhiId: string` (no email)
   - Create new validation for SavanhID in domain layer
   - Create a new `supabase-auth-service.ts` in application that maps SavanhID → email for Supabase calls
   - Rewrite `AuthProvider` to use `supabase.auth.onAuthStateChange` and `supabase.auth.getUser()`
   - Keep the `AuthProvider` public API (user, session, isReady, logout) the same so `dashboard.tsx` works unchanged
   - Create a new `SupabaseSessionStore` that uses Supabase's built-in session management
   - Pros: Clean Architecture properly respected, domain doesn't leak Supabase details, SavanhID is first-class, auth state managed by Supabase's PKCE flow
   - Cons: More files touched, slightly more upfront work
   - Effort: Medium

3. **Full rewrite — Supabase-only with server-side session**
   - Same as Approach 2 but also move AuthProvider to SSR with Next.js middleware for route protection
   - Use `@supabase/ssr` package for cookies-based session
   - Pros: Proper SSR, no Flash of Unauthenticated Content (FOUC), best security
   - Cons: Introduces `@supabase/ssr` as additional dependency. Next.js 14.2 Pages Router may have quirks with SSR package. Overkill for single-admin app
   - Effort: High

### Recommendation

**Approach 2 — True domain refactor with SavanhID at the core.**

Reasons:
- The user explicitly said "Don't base anything on the existing prototype auth code except the UI design" — Approach 1 violates this by keeping the leaky abstraction
- The existing `dashboard.tsx` uses `useAuth()` and expects `user.fullName`, `user.role` — we can preserve the `AuthProvider` public API shape so dashboard works without changes
- The mapping `savanhi` → `admin@savanhi.com` is a single if-statement in the application layer — it belongs at the boundary, not in the domain
- Supabase manages its own session via `localStorage` internally (PKCE flow) — we should let it, not replicate it
- Clean Architecture means the domain doesn't know about Supabase; the application layer translates

**Key design decisions:**
1. `LoginCredentials.savanhiId` replaces `LoginCredentials.email` in domain
2. A new `supabase-auth-service.ts` in application layer handles the SavanhID→email mapping and calls `supabase.auth.signInWithPassword()`
3. `AuthProvider` uses `supabase.auth.onAuthStateChange()` to track session and `supabase.auth.getUser()` to get the user's Supabase `User` object, then maps it to our domain `AuthUser` type
4. The existing `AuthUser` type from `@repo/api-contracts` will need `email` populated even for the admin — we set it to `admin@savanhi.com` internally after successful auth

### Risks

- **Risk 1: `AuthUser.email` from `@repo/api-contracts` is required** — The existing `AuthUser` type has `email: string`. Since our login doesn't use email, this field will be populated with `admin@savanhi.com` after successful authentication. Any code downstream that filters or displays by email should work because it's a valid email.
- **Risk 2: `@supabase/supabase-js` version compatibility** — The backend uses `^2.108.2`. We should match this version in web-enterprise. Check if there are breaking changes between what's installed and latest.
- **Risk 3: Supabase session persistence** — Supabase's `localStorage` persistence is the default for browser environments. Need to ensure it works with Next.js SSR (Pages Router `getServerSideProps` might not have `window`).
- **Risk 4: dashboard.tsx uses `useAuth()` public API** — The public shape (`user`, `session`, `isReady`, `logout`) must be preserved. `user.fullName` maps to Supabase's `user.user_metadata.full_name`. `user.role` needs to be set to `"admin"` in the mapping since we only have one user.
- **Risk 5: No `.env.local` exists** — Must create one with the Supabase credentials. The user provided: URL `https://mrylyitdkahfuqxsnpvf.supabase.co` and the anon key.

### Ready for Proposal

**Yes.** The exploration is complete — all files were read, the architecture is fully understood, the approaches are clear, and the recommendation is backed by the codebase analysis.

The orchestrator should pass to `sdd-propose` with:
- Change name: `savanhi-login`
- Recommendation: Approach 2 (True domain refactor)
- Key constraint: AuthProvider public API must be preserved for dashboard.tsx compatibility
