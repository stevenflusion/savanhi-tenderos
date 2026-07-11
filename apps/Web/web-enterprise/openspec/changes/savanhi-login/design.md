# Design: SavanhID Login with Supabase Auth

## Technical Approach

True domain refactor — SavanhID as first-class domain concept, mapped to email only at the Supabase boundary. Supabase Auth handles all session management via PKCE localStorage. AuthProvider public API (`user`, `session`, `isReady`, `logout`) preserved for `dashboard.tsx` backward compat. Clean Architecture dependency rule maintained: domain → nothing, application → domain, presentation → application.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Auth provider | Direct Supabase (`@supabase/supabase-js`) | Backend Express auth (current, broken), Custom JWT | Supabase manages PKCE, session refresh, localStorage — zero custom session code. Express auth is already broken and adds network hop. |
| SavanhID→email mapping | Application layer (`supabase-auth-service.ts`) | Domain layer, Presentation layer | Domain stays pure (no infra dependencies). Mapping is an infra concern — Supabase requires email. |
| `AuthUser` shape | Local `savanhiId` + `displayName` fields, keep `fullName` for backward compat | Fork `@repo/api-contracts`, Add `displayName` only | `dashboard.tsx` uses `user.fullName`. Adding `displayName` = "Admin" alongside keeps both contracts satisfied without touching shared package. |
| Session persistence | Supabase PKCE localStorage | Custom `localStorage` (current), `@supabase/ssr` | PKCE handles token refresh and expiry automatically. `@supabase/ssr` deferred (Pages Router, no SSR middleware yet). |
| SSR handling | None — client-side only | `@supabase/ssr` with cookie-based session | Pages Router, no SSR middleware. Current auth is fully client-side. Deferred to when SSR is needed. |

## Data Flow

```
LoginForm                    useLoginForm               supabase-auth-service       Supabase
    │                            │                             │                       │
    │  SavanhID + password       │                             │                       │
    ├───────────────────────────►│                             │                       │
    │                            │  validateLoginCredentials   │                       │
    │                            │  (SavanhID regex + length)  │                       │
    │                            ├───────fail? return errors──►│                       │
    │                            │                             │                       │
    │                            │  mapSavanhiToEmail()        │                       │
    │                            │  "savanhi" → "admin@..."    │                       │
    │                            ├────────────────────────────►│                       │
    │                            │                             │ signInWithPassword()   │
    │                            │                             ├──────────────────────►│
    │                            │                             │◄────── Session ──────┤
    │                            │◄──────── mapped AuthUser ───┤                       │
    │◄────── success/error ──────┤                             │                       │
    │                            │                             │                       │
    │                      router.push("/dashboard")           │                       │
    │                            │                             │                       │
    │                            │                             │                       │
    │  AuthProvider (on mount)                                 │                       │
    ├── onAuthStateChange ───────┼─────────────────────────────┤── subscribe ─────────►│
    │◄── SIGNED_IN ──────────────┼─────────────────────────────┤◄─── event ───────────┤
    │  setUser, setSession       │                             │                       │
    │  isReady = true            │                             │                       │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/auth/credentials.ts` | Modify | `email: string` → `savanhiId: string` in `LoginCredentials` |
| `src/domain/auth/validation.ts` | Modify | Email regex → SavanhID regex (`^[A-Za-z0-9]{8}$`), field key `savanhiId` |
| `src/domain/auth/session.ts` | Modify | Replace `@repo/api-contracts` re-export with local `AuthUser` type that adds `savanhiId` + `displayName`; keep `fullName` for backward compat |
| `src/application/auth/auth-api.ts` | Delete | Entire file — replaced by Supabase service |
| `src/application/auth/supabase-client.ts` | **Create** | Supabase client singleton: `createClient(supabaseUrl, supabaseAnonKey)` |
| `src/application/auth/supabase-auth-service.ts` | **Create** | `mapSavanhiToEmail()` lookup, `signInWithSavanhiId()` that calls `supabase.auth.signInWithPassword` with mapped email |
| `src/application/auth/login-use-case.ts` | Rewrite | Call `signInWithSavanhiId` instead of `loginRequest`; return `AuthUser` with `displayName` = "Admin" |
| `src/application/auth/session-store.ts` | Rewrite | Wraps `supabase.auth.getSession()` — Supabase manages persistence; no localStorage CRUD |
| `src/presentation/components/auth/auth-provider.tsx` | Rewrite | Subscribe to `supabase.auth.onAuthStateChange`; `logout` calls `supabase.auth.signOut()`; map `AuthUser` from `getUser()` metadata |
| `src/presentation/components/auth/login-form.tsx` | Modify | SavanhID field replaces email field; password visibility toggle; `autocomplete="username"`, desktop autofocus, `aria-invalid` + `aria-describedby`, icon-based error indicator |
| `src/presentation/hooks/use-login-form.ts` | Modify | Field key `savanhiId` replaces `email`; validate on blur not keystroke |
| `pages/dashboard.tsx` | Modify | Show `user.displayName || user.fullName` in header; add "Cerrar sesión" button calling `logout()` |
| `package.json` | Modify | Add `@supabase/supabase-js@^2.108.2` |
| `.env.local` | **Create** | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Interfaces / Contracts

```typescript
// src/domain/auth/credentials.ts
export type LoginCredentials = {
  savanhiId: string;  // was email
  password: string;
};

// src/domain/auth/session.ts (local, NOT re-export from api-contracts)
export interface AuthUser {
  id: string;
  email: string;       // "admin@savanhi.com" after mapping
  fullName: string;    // "Admin" — kept for dashboard.tsx compat
  displayName: string; // "Admin" — new per spec
  savanhiId: string;   // "savanhi" — new per spec
  role: AuthRole;
  active: boolean;
}

// AuthProvider public API (unchanged shape)
type AuthState = {
  user: AuthUser | null;
  session: Session | null;  // Supabase AuthSession
  isReady: boolean;
  logout: () => void;
};

// src/application/auth/supabase-auth-service.ts
export function signInWithSavanhiId(
  savanhiId: string,
  password: string
): Promise<{ user: AuthUser; session: Session }>;

// Mapper (private to service)
const SAVANHI_TO_EMAIL: Record<string, string> = {
  savanhi: "admin@savanhi.com",
};
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Validation | SavanhID regex (8 chars, A-Za-z0-9), blur behavior | Manual — form render + field test |
| Login flow | Successful login, wrong password, network error | Manual — submit form with each case, verify Supabase console logs |
| Session | Persist on refresh, clear on logout | Manual — login, refresh page, verify dashboard; click logout, verify redirect |
| A11y | `aria-invalid`, `aria-describedby`, autocomplete, autofocus | Manual — inspect DOM in DevTools |

**Note**: No test runner installed. All testing is manual until a framework (Vitest/Jest) is added.

## Migration / Rollout

1. **Supabase Auth console**: Create admin user `admin@savanhi.com` with password via Supabase Dashboard → Authentication → Users → Add User. Password shared out-of-band with the admin.
2. **`.env.local`**: Add Supabase credentials (already provisioned, keys provided).
3. **Install**: `pnpm add @supabase/supabase-js@^2.108.2 --filter web-enterprise`
4. **Verify**: Login at `/` with SavanhID `savanhi` + password, verify redirect to `/dashboard` showing "Admin" in header. Refresh page — session persists. Logout — redirects to `/`.

No data migration required. Rollback: remove `@supabase/supabase-js`, delete `.env.local`, restore deleted files from git.

## Open Questions

- [ ] Admin password for `admin@savanhi.com` — needs to be set in Supabase Auth console and shared with the admin user
- [ ] Confirm `@supabase/supabase-js` v^2.108.2 is compatible with Next.js 14.2.3 Pages Router (should be, client-only)
