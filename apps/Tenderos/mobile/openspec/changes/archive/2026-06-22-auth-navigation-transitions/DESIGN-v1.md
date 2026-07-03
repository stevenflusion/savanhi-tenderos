# Design: Auth Navigation Transitions

## Technical Approach

Lift `LoadingOverlay` from per-screen (`AuthScreenShell`) to the auth layout level — outside the Stack so it survives screen transitions. Introduce a new `AuthLoadingContext` that provides `{ loading, setLoading }` to all auth screens. BackButton and enter-email/enter-otp inline back handlers drop the 50ms `setTimeout`. Hide-overlay timeout tuned from 400ms → 350ms (300ms animation + 50ms buffer).

## Architecture Decisions

### D1: AuthLoadingContext — separate file vs inline in \_layout.tsx

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Separate file** (`AuthLoadingContext.tsx`) | Cleaner separation, testable in isolation, layout stays lean | **Chosen** |
| Inline in `_layout.tsx` | Fewer files, but layout grows; harder to unit-test context | Rejected — layout should own composition, not context impl |

### D2: Local loading state — keep or eliminate

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Keep local `loading` for FormButton + global `setLoading` for overlay** | Button needs its own disabled/spinner state; overlay needs to outlive screen. Dual state is correct here | **Chosen** |
| Eliminate local loading | FormButton can't distinguish "navigating" from "saving"; button would flash enabled after navigation | Rejected — button jank is worse than dual state |

### D3: Cleanup on unmount while loading

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Each form: `useEffect(() => () => setLoading(false), [])`** | Guarantees overlay hides if user navigates back mid-async | **Chosen** — explicit per-form safety net |
| Global cleanup in context | Context can't know which form set loading; could hide legitimate overlay from another form | Rejected |

### D4: setTimeout in BackButton

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Remove entirely** | router.back() starts immediately; stack animation has no artificial lag | **Chosen** |
| Keep 50ms | Was meant to wait for keyboard dismiss; `Keyboard.dismiss()` fires sync before router call | Unnecessary — order in handler already correct |

### D5: Navigation animation duration

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Keep 300ms, hide at 350ms** | Matches proposal; tested in production; 50ms buffer is enough | **Chosen** |
| Increase to 350ms | More fluid but longer perceived delay before overlay hides | Rejected — 300ms already feels fast |

## Component Hierarchy

**Before:**
```
app/auth/_layout.tsx
  └── Stack (slide_from_right, 300ms)
       └── Screen (e.g. person-name.tsx)
            └── AuthScreenShell ──┐
                 ├── LoadingContext.Provider
                 ├── SafeAreaView / KeyboardAvoidingView
                 │    └── ProgressBar
                 │    └── Animated.View (fade)
                 │         └── Form (useFormLoading)
                 └── LoadingOverlay (visible=loading) ← inside screen, scrolls off
```

**After:**
```
app/auth/_layout.tsx
  └── AuthLoadingProvider  ← new: owns { loading, setLoading }
       └── View (flex-1)
            ├── Stack (slide_from_right, 300ms)
            │    └── Screen
            │         └── AuthScreenShell (no loading)
            │              └── Form / enter-email/otp (useAuthLoading)
            └── LoadingOverlay (visible=loading) ← OUTSIDE Stack, persists
```

## Data Flow — Loading Lifecycle

```
Form                    AuthLoadingContext         LoadingOverlay
 │                            │                        │
 ├─ setLoading(true) ────────►│                        │
 │                            ├─ setState(true) ──────►│ render white overlay
 │                            │                        │
 ├─ await saveProfile()       │                        │
 │                            │                        │
 ├─ router.push(next)         │                        │
 │                            │                        │
 ├─ setTimeout(350ms) ───────►│                        │
 │                            ├─ setState(false) ────►│ hide overlay
 │                            │                        │
 │  ← on error path:          │                        │
 ├─ setLoading(false) ───────►│                        │
 │                            ├─ setState(false) ────►│ hide immediately
 │                            │                        │
 │  ← on unmount while load:  │                        │
 ├─ useEffect cleanup ───────►│                        │
 │                            ├─ setState(false) ────►│ hide
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/auth/_layout.tsx` | Modify | Wrap Stack in `AuthLoadingProvider` + View; render `LoadingOverlay` as sibling |
| `src/components/auth/AuthLoadingContext.tsx` | **Create** | `AuthLoadingProvider`, `useAuthLoading()` hook |
| `src/components/auth/AuthScreenShell.tsx` | Modify | Remove `LoadingContext`, `LoadingOverlay` import, `useFormLoading` export |
| `src/components/auth/forms/PersonNameForm.tsx` | Modify | `useFormLoading` → `useAuthLoading`; add cleanup `useEffect` |
| `src/components/auth/forms/StoreNameForm.tsx` | Modify | Same replacement |
| `src/components/auth/forms/IdentityCardForm.tsx` | Modify | Same replacement |
| `src/components/auth/forms/BusinessLocationForm.tsx` | Modify | Same replacement |
| `src/components/auth/forms/StorePhotosForm.tsx` | Modify | Same replacement |
| `src/components/auth/forms/PaymentMethodForm.tsx` | Modify | Same replacement |
| `app/auth/enter-email.tsx` | Modify | Remove inline overlay View; import `useAuthLoading`; remove 50ms from `handleBack` |
| `app/auth/enter-otp.tsx` | Modify | Same as enter-email; remove 50ms from `handleBack` |
| `src/components/auth/BackButton.tsx` | Modify | Remove `setTimeout` wrapper around `router.back()` |

## Interfaces

```typescript
// src/components/auth/AuthLoadingContext.tsx
type AuthLoadingCtx = {
  loading: boolean;
  setLoading: (v: boolean) => void;
};

// Default setLoading is noop — provider initialises synchronously
// so no consumer ever sees the noop at runtime
```

Each affected form (6 forms + enter-email + enter-otp) uses this pattern:

```typescript
const { setLoading } = useAuthLoading();

useEffect(() => {
  return () => setLoading(false);    // cleanup: hide overlay on unmount
}, [setLoading]);

// On success:
router.push("/auth/next-screen");
setTimeout(() => setLoading(false), 350);

// On failure:
setLoading(false);  // immediate
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User navigates back while loading | `useEffect` cleanup fires `setLoading(false)` on unmount — overlay hides |
| Async op fails | `catch`/`else` branch calls `setLoading(false)` immediately |
| Loading state + screen unmounts | Same cleanup effect handles this |
| Context not available on first render | Noop default for `setLoading`; provider mounts synchronously before any screen |

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `enter-email`/`enter-otp` back button still has setTimeout | Medium | Both use inline `handleBack` — must be manually aligned. grep verify |
| Missing cleanup effect in one form | Low | All 6 forms follow identical pattern; diff review catches stragglers |
| `LoadingScreen.tsx` breaks from AuthScreenShell change | Low | It wraps AuthScreenShell but never calls `useFormLoading` — no code change needed |
| Overlay flicker on initial render | Low | `loading` initial state is `false`; React batches first render |

## Rollback

1. `git revert` each file in reverse order (newest first) — or `git checkout HEAD~ -- <file>` per-file
2. If using a feature branch: revert the merge commit
3. Key revert checkpoint: `AuthLoadingContext.tsx` creation + `_layout.tsx` change must be reverted together
