# Proposal: SavanhID Login with Supabase Auth

## Intent

Replace the broken backend-Express auth prototype with direct Supabase Auth integration using SavanhID (username-style) login. Single admin user only. Clean Architecture preserved.

## Scope

### In Scope
- Domain: `LoginCredentials.savanhiId` replaces `email`
- Domain: SavanhID validation (exactly 8 chars, upper/lower letters + numbers)
- Application: `supabase-client.ts` — Supabase singleton
- Application: `supabase-auth-service.ts` — SavanhID→email mapping + `signInWithPassword`
- Application: Delete `auth-api.ts`, rewrite `login-use-case.ts`, rewrite `session-store.ts`
- Presentation: AuthProvider rewrite using `supabase.auth.onAuthStateChange`
- Presentation: LoginForm with SavanhID field + password toggle + WCAG a11y
- Presentation: Dashboard header with admin name ("Admin") + basic profile
- Infra: `@supabase/supabase-js` dependency + `.env.local` with Supabase creds
- Ops: Admin user creation in Supabase Auth console

### Out of Scope
- Multi-user registration / sign-up flow
- Password reset / forgot-password flow
- Role-based permissions beyond admin/marca distinction
- Backend Express auth routes (`apps/Web/backend/` untouched)
- `@supabase/ssr` or SSR session handling (deferred)

## Capabilities

### New Capabilities
- `savanhi-auth`: SavanhID-based authentication using Supabase Auth, with domain validation (8-char alphanumeric), secure session management via PKCE, and Admin profile resolution

### Modified Capabilities
- None — no existing specs in `openspec/specs/`

## Approach

Approach 2 (true domain refactor). SavanhID as first-class domain concept. Domain validates the SavanhID format. Application layer maps `savanhi` → `admin@savanhi.com` at the Supabase boundary only. AuthProvider uses `supabase.auth.onAuthStateChange` + `supabase.auth.getUser()`. Public API (`user`, `session`, `isReady`, `logout`) preserved for dashboard.tsx compatibility. Supabase manages session persistence internally via localStorage.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/auth/credentials.ts` | Modified | `email` → `savanhiId: string` |
| `src/domain/auth/validation.ts` | Modified | SavanhID regex replaces email validation |
| `src/application/auth/auth-api.ts` | Removed | Entire file deleted |
| `src/application/auth/supabase-client.ts` | New | Supabase client singleton |
| `src/application/auth/supabase-auth-service.ts` | New | SavanhID→email mapping, sign-in logic |
| `src/application/auth/login-use-case.ts` | Rewritten | Calls Supabase instead of backend |
| `src/application/auth/session-store.ts` | Rewritten | Supabase-managed session, not localStorage |
| `src/presentation/auth/auth-provider.tsx` | Rewritten | `onAuthStateChange`-based |
| `src/presentation/auth/login-form.tsx` | Modified | SavanhID field + password toggle + a11y |
| `src/presentation/hooks/use-login-form.ts` | Modified | SavanhID form state, new use-case |
| `pages/dashboard.tsx` | Modified | Header with admin name + profile |
| `package.json` | Modified | Add `@supabase/supabase-js` |
| `.env.local` | New | Supabase URL + anon key |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `AuthUser.email` is required in contracts; SavanhID has no email | High | Set to `admin@savanhi.com` after auth; document as internal mapping |
| Dashboard depends on AuthProvider public API shape | Medium | Public API preserved; map Supabase `user.user_metadata` to `AuthUser` shape |
| Supabase localStorage persistence may conflict with Next.js SSR | Low | Pages Router, no SSR middleware; client-side only |

## Rollback Plan

1. Remove `@supabase/supabase-js` from `package.json` and re-install
2. Delete `.env.local`
3. Restore deleted `auth-api.ts` from git
4. Revert `AuthProvider`, `LoginForm`, `useLoginForm`, `credentials.ts`, `validation.ts`
5. Revert `dashboard.tsx`

## Dependencies

- `@supabase/supabase-js` ^2.108.2 (match backend version)
- Supabase project (already provisioned)
- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Success Criteria

- [ ] Login with SavanhID `savanhi` + correct password succeeds; redirects to `/dashboard`
- [ ] Dashboard shows "Admin" in header with basic profile info
- [ ] Invalid SavanhID or wrong password shows "Credenciales inválidas" (generic error)
- [ ] Auth state survives page refresh (Supabase PKCE session persistence)
- [ ] Logout clears session and redirects to index
