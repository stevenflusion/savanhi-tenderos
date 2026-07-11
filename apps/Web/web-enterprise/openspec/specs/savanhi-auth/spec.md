# SavanhID Auth Specification

## Purpose

Authenticate admin users via SavanhID (username-style identifier) + password using Supabase Auth with PKCE session management. Single admin user (`savanhi`) mapped to `admin@savanhi.com`.

## Requirements

### Requirement: SavanhID Format Validation

The system MUST validate SavanhID is exactly 8 characters containing only letters (A-Z, a-z) and digits (0-9). Error MUST appear on blur, not on keystroke. Error indicator MUST use icon + color (never color alone). Field MUST have `aria-invalid` and `aria-describedby` attributes when invalid.

#### Scenario: Valid SavanhID accepted
- GIVEN the login form is rendered
- WHEN the user enters "savanhi" in the SavanhID field and blurs
- THEN no validation error appears

#### Scenario: Invalid format rejected on blur
- GIVEN the login form is rendered
- WHEN the user enters "sav" (too short) and blurs
- THEN the field shows `aria-invalid="true"`, an error message with icon, and an `aria-describedby` reference

#### Scenario: Special characters rejected
- GIVEN the login form is rendered
- WHEN the user enters "savanhi!" and blurs
- THEN the field shows `aria-invalid="true"` with "Solo letras y números" error

### Requirement: Password Validation

The system MUST require a password of at least 8 characters. Field MUST have a visibility toggle (eye icon, default hidden). Error MUST show on blur.

#### Scenario: Short password rejected
- GIVEN the login form is rendered
- WHEN the user enters "123" and blurs
- THEN the field shows `aria-invalid="true"` with "Mínimo 8 caracteres" error

#### Scenario: Password visibility toggle
- GIVEN the password field is masked (type="password")
- WHEN the user clicks the eye icon
- THEN the field switches to type="text"

### Requirement: Login Execution

The system MUST map SavanhID to an internal email, call `supabase.auth.signInWithPassword`, and return a session on success. SavanhID `savanhi` MUST map to `admin@savanhi.com`. On auth failure the system MUST show "Credenciales inválidas" — never reveal which field is wrong.

#### Scenario: Successful login
- GIVEN the user has valid credentials for SavanhID "savanhi"
- WHEN they submit the form
- THEN `supabase.auth.signInWithPassword` is called with email "admin@savanhi.com" and the provided password, AND the user is redirected to `/dashboard`

#### Scenario: Invalid credentials
- GIVEN the user submits wrong credentials
- WHEN the form is submitted
- THEN a generic error "Credenciales inválidas" is shown above the form, AND no field-specific error is displayed

#### Scenario: Supabase network error
- GIVEN the Supabase API is unreachable
- WHEN the user submits the form
- THEN "Credenciales inválidas" is shown (generic, no detail leakage)

### Requirement: Session Persistence

Auth state MUST survive page refresh via Supabase PKCE localStorage. The AuthProvider MUST recover the session on mount.

#### Scenario: Session restored on refresh
- GIVEN an active Supabase PKCE session exists in localStorage
- WHEN the page loads and `onAuthStateChange` fires with `SIGNED_IN`
- THEN `user`, `session`, and `isReady` are populated, and the dashboard renders the authenticated view

#### Scenario: No session on mount
- GIVEN no Supabase session exists
- WHEN the page loads
- THEN `user` is null, `session` is null, `isReady` is true, and unauthenticated content renders

### Requirement: AuthProvider Public API

The AuthProvider MUST expose `{ user, session, isReady, logout }` compatible with `dashboard.tsx` consumption. The `user` object MUST include `{ savanhiId: "savanhi", email: "admin@savanhi.com", displayName: "Admin", role: "admin" }`.

#### Scenario: AuthProvider provides profile data
- GIVEN the user is authenticated
- WHEN any child component accesses the auth context
- THEN `user.displayName` is "Admin", `user.role` is "admin", and `user.savanhiId` is "savanhi"

### Requirement: Logout

The system MUST call `supabase.auth.signOut()`, clear the session, and redirect to `/`.

#### Scenario: Logout clears session
- GIVEN the user is authenticated
- WHEN they click "Cerrar sesión"
- THEN `supabase.auth.signOut()` is called, the auth context clears `user` and `session`, and the browser navigates to `/`

### Requirement: Autocomplete Attributes

The SavanhID field MUST have `autocomplete="username"`. The password field MUST have `autocomplete="current-password"`.

#### Scenario: Autocomplete attributes present
- GIVEN the login form is rendered
- WHEN inspecting the DOM
- THEN the SavanhID input has `autocomplete="username"` and the password input has `autocomplete="current-password"`

### Requirement: Desktop Autofocus

The SavanhID field MUST auto-focus on desktop (media query `(hover: hover)`). It MUST NOT auto-focus on touch devices.

#### Scenario: Autofocus on hover-capable devices
- GIVEN a device with hover capability
- WHEN the login form mounts
- THEN the SavanhID input receives `autoFocus`
