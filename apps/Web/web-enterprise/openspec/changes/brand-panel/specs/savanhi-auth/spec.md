# Delta for savanhi-auth

## ADDED Requirements

### Requirement: Admin Brand Registration

Admins MUST register brands from `/admin/brands/new`. The form collects email; the system generates a unique 8-char SavanhID and password, persists the mapping in `brand_auth`, and displays credentials once.

#### Scenario: Brand registered
- GIVEN an admin is on `/admin/brands/new`
- WHEN they enter a valid email and submit
- THEN a SavanhID and password are generated, persisted, and shown once

#### Scenario: Duplicate email
- GIVEN the email exists in `brand_auth`
- WHEN the admin submits
- THEN error "El email ya está registrado" is shown

### Requirement: Role-Based Routing

The system MUST redirect users by role after login: admin → `/admin/dashboard`, brand → `/brand/dashboard`. Unknown roles show an unauthorized page.

#### Scenario: Admin routing
- GIVEN role is `admin`
- WHEN login completes
- THEN redirect to `/admin/dashboard`

#### Scenario: Brand routing
- GIVEN role is `brand`
- WHEN login completes
- THEN redirect to `/brand/dashboard`

#### Scenario: Unknown role blocked
- GIVEN role is neither `admin` nor `brand`
- WHEN login resolves
- THEN unauthorized page renders

## MODIFIED Requirements

### Requirement: Login Execution

The system MUST look up SavanhID in `brand_auth` table, obtain the mapped email, call `supabase.auth.signInWithPassword`, and return a session with role. SavanhID `savanhi` maps to `admin@savanhi.com` (role `admin`). On auth failure show "Credenciales inválidas". Only roles `brand` and `admin` are allowed post-auth.
(Previously: hardcoded single mapping for admin user)

#### Scenario: Admin login
- GIVEN "savanhi" has valid credentials
- WHEN login is submitted
- THEN email is resolved, signIn succeeds, redirect to `/admin/dashboard`

#### Scenario: Brand login
- GIVEN a brand SavanhID in `brand_auth` with valid credentials
- WHEN login is submitted
- THEN signIn succeeds with mapped email, redirect to `/brand/dashboard`

#### Scenario: Invalid credentials
- GIVEN wrong credentials
- WHEN submitted
- THEN "Credenciales inválidas" shown generically

#### Scenario: Wrong role denied
- GIVEN role is not `brand` or `admin`
- WHEN login resolves
- THEN unauthorized page shown

### Requirement: AuthProvider Public API

The AuthProvider MUST expose `{ user, session, isReady, logout }`. The `user` object MUST include `{ savanhiId, email, displayName, role }`. Admin: `role = "admin"`, `displayName = "Admin"`. Brand: `role = "brand"`, `displayName = {brand_name}`.
(Previously: hardcoded admin-only profile)

#### Scenario: Admin profile
- GIVEN authenticated as admin
- WHEN context is read
- THEN `user.role` is `"admin"`, `displayName` is `"Admin"`

#### Scenario: Brand profile
- GIVEN authenticated as brand
- WHEN context is read
- THEN `user.role` is `"brand"`, `displayName` is the brand name
