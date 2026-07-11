# Tasks: SavanhID Login with Supabase Auth

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–600 (additions + deletions) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Foundation + Domain + Package → PR 2: Application Layer → PR 3: Presentation + Dashboard |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Deps, domain types, validation, Supabase client | PR 1 | base = main; includes `.env.local`, `package.json`, `supabase-client.ts`, `credentials.ts`, `validation.ts`, `session.ts` |
| 2 | Auth service, use-case, session store, delete auth-api | PR 2 | base = main; depends on PR 1 types; standalone testable via console |
| 3 | AuthProvider, LoginForm, useLoginForm, dashboard | PR 3 | base = main; wires everything together |

## Phase 1: Foundation

- [x] 1.1 Install `@supabase/supabase-js@^2.108.2` in `package.json`
- [x] 1.2 Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] 1.3 Create `src/application/auth/supabase-client.ts` — `createClient()` singleton
- [x] 1.4 Update `src/domain/auth/credentials.ts`: rename `email` → `savanhiId`
- [x] 1.5 Rewrite `src/domain/auth/validation.ts`: SavanhID regex `^[A-Za-z0-9]{8}$`, field key `savanhiId`, blur validation
- [x] 1.6 Rewrite `src/domain/auth/session.ts`: local `AuthUser` with `savanhiId`, `displayName`, `fullName`, `role`, `active`; drop `@repo/api-contracts` re-export

## Phase 2: Application Layer

- [x] 2.1 Create `src/application/auth/supabase-auth-service.ts` — `mapSavanhiToEmail()` + `signInWithSavanhiId()` calling `supabase.auth.signInWithPassword`
- [x] 2.2 Rewrite `src/application/auth/login-use-case.ts` — call `signInWithSavanhiId`, return `{ ok, userName, nextRoute }`, drop `auth-api` imports
- [x] 2.3 Delete `src/application/auth/auth-api.ts` — entire file removed
- [x] 2.4 Rewrite `src/application/auth/session-store.ts` — wrap `supabase.auth.getSession()`, no custom localStorage

## Phase 3: Presentation Layer

- [x] 3.1 Rewrite `src/presentation/components/auth/auth-provider.tsx` — subscribe to `supabase.auth.onAuthStateChange`, map `AuthUser` from `getUser()`, preserve `{ user, session, isReady, logout }` API
- [x] 3.2 Rewrite `src/presentation/hooks/use-login-form.ts` — field key `savanhiId`, validate on blur, call rewritten `loginUseCase`
- [x] 3.3 Rewrite `src/presentation/components/auth/login-form.tsx` — SavanhID field, password visibility toggle (eye icon), `autocomplete="username"` / `autocomplete="current-password"`, desktop autofocus (`(hover: hover)`), `aria-invalid` + `aria-describedby`, icon-based error indicators

## Phase 4: Dashboard

- [x] 4.1 Update `pages/dashboard.tsx` — header shows `user.displayName` ("Admin") + basic profile, add "Cerrar sesión" button calling `logout()`

## Phase 5: Verification

- [ ] 5.1 Manual: login with `savanhi` + valid password → redirects to `/dashboard` showing "Admin"
- [ ] 5.2 Manual: invalid SavanhID or wrong password → "Credenciales inválidas" generic error
- [ ] 5.3 Manual: page refresh → session persists (Supabase PKCE)
- [ ] 5.4 Manual: logout → session cleared, redirect to `/`
- [ ] 5.5 Manual: a11y audit — `aria-invalid`, `aria-describedby`, autocomplete, autofocus behavior in DevTools
