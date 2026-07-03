# Auth Screen Transitions Specification

## Purpose

Define the loading overlay lifecycle and navigation animation behavior for auth screens. The overlay MUST persist across stack transitions to eliminate visual flash, and back navigation MUST respond immediately without artificial delays.

## Non-Goals

- Visual changes to LoadingOverlay, form content, or screen layout
- Pre-auth screens (welcome, splash)
- AuthProvider data logic or backend changes

## Requirements

### Requirement: Loading Overlay Persistence

The loading overlay MUST render outside the Stack navigator in `app/auth/_layout.tsx` as a sibling to `<Stack />`. The overlay visual (`absolute inset-0 z-50`, white background, centered logo) MUST remain unchanged.

#### Scenario: Zero flash during forward navigation

- GIVEN the loading overlay is visible during an async operation
- WHEN `router.push()` navigates to the next screen
- THEN the overlay MUST remain visible throughout the entire stack animation
- AND the overlay MUST NOT flicker or disappear during transition

#### Scenario: Overlay hides after animation completes

- GIVEN the loading overlay is visible
- WHEN the async operation succeeds and navigation begins
- THEN the overlay MUST hide 350ms after navigation starts (300ms animation + 50ms buffer)
- AND the overlay MUST NOT hide before the transition animation completes

### Requirement: Global Auth Loading Context

The auth layout MUST provide `useAuthLoading()` context exporting `setLoading(v: boolean)`. All auth screens SHALL consume loading state from this single context.

#### Scenario: Context available before first render

- GIVEN the auth layout renders
- WHEN any screen calls `useAuthLoading()`
- THEN a noop default `setLoading` SHALL be available before the provider initializes
- AND the provider MUST initialize synchronously during layout render

#### Scenario: Loading state shared across screens

- GIVEN screen A calls `setLoading(true)` during form submit
- WHEN screen B mounts during the stack transition
- THEN the same overlay SHALL cover both screens until `setLoading(false)` is called
- AND `setLoading` from any screen MUST affect the same overlay instance

### Requirement: Inline Overlay Replacement

`enter-email.tsx` and `enter-otp.tsx` MUST use `useAuthLoading()` context and MUST NOT render their own inline loading overlay Views.

#### Scenario: Email screen uses global overlay

- GIVEN the user is on enter-email
- WHEN `setLoading(true)` is called during OTP request
- THEN the global LoadingOverlay in auth layout SHALL render
- AND the inline `View` with logo MUST NOT be present in the JSX tree

#### Scenario: OTP screen uses global overlay

- GIVEN the user is on enter-otp
- WHEN `setLoading(true)` is called during OTP verification
- THEN the global LoadingOverlay in auth layout SHALL render
- AND the inline `View` with logo MUST NOT be present in the JSX tree

### Requirement: Instant Back Navigation

BackButton MUST call `router.back()` synchronously. The 50ms `setTimeout` wrapper SHALL NOT exist.

#### Scenario: Back navigation without perceived lag

- GIVEN the user presses the back button
- WHEN the press handler fires
- THEN `router.back()` SHALL execute in the same microtask
- AND the stack slide animation SHALL start without artificial delay

#### Scenario: Keyboard dismiss before navigation

- GIVEN the keyboard is open
- WHEN the user presses the back button
- THEN `Keyboard.dismiss()` MUST fire before `router.back()`
- AND `Keyboard.dismiss()` MUST NOT block or delay the stack animation

### Requirement: Stack Animation Timing

Auth screen transitions MUST use `slide_from_right` with 300ms duration. The overlay hide timeout SHALL be 350ms (animation duration + 50ms buffer).

#### Scenario: Forward navigation animation

- GIVEN the user navigates forward in the auth stack
- WHEN `router.push()` is called
- THEN the current screen SHALL slide left at 300ms
- AND the new screen SHALL slide in from the right at 300ms

#### Scenario: Back navigation animation

- GIVEN the user presses the back button
- WHEN `router.back()` is called
- THEN the current screen SHALL slide right at 300ms
- AND the previous screen SHALL return from the left at 300ms

## Data Model

No data model changes. Loading state is UI-only (boolean stored in React context).

## UI Contract

- LoadingOverlay visual: `absolute inset-0 z-50` with white background + centered logo — **unchanged**
- AuthScreenShell entrance fade animation (200ms opacity): **unchanged**
- Stack animation: `slide_from_right` at 300ms — **unchanged**
- Overlay hide delay: **changed** from 400ms to 350ms
