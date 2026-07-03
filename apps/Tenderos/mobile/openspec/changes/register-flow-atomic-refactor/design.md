# Design: Register Flow Atomic Refactor

## Technical Approach

Extract the duplicated SafeAreaView + KeyboardAvoidingView + Animated entrance + back button + CTA + loading overlay pattern from 6 screens into a shared `AuthScreenShell`. Each screen becomes a thin form component rendered as the shell's child. BusinessLocationForm (map/GPS layout) bypasses the shell and composes atomic pieces directly. Per-screen `Animated.View` entrance animations are replaced by expo-router Stack `slide_from_right` in `_layout.tsx`.

## Architecture Decisions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **AuthScreenShell as parent wrapper** vs HOC / render-prop / keep per-screen boilerplate | Shell keeps composition simple (no indirection), TS-friendly, each form owns its data logic. HOC adds nesting without benefit. | **Single shell component** wrapping each screen's form. |
| **Stack `slide_from_right` (300ms)** vs per-screen `Animated.View` fade+slide / reanimated layout transitions / gesture handler | Stack animation is native-driven (zero JS thread cost), zero boilerplate per screen. Reanimated adds dep weight. | **`slide_from_right` in `_layout.tsx`**. Remove all per-screen `useRef` + `Animated.parallel`. |
| **Per-screen Animated.View removal** vs keep both (Stack slide + content fade) | Double animation creates staggered jank — two sequential entrance effects fight each other. | **Remove all per-screen `Animated.View`**. Stack slide IS the entrance. |
| **Route-to-step map inside ProgressBar** vs pass step as prop / render in `_layout.tsx` | Route map keeps each screen zero-config. Shell owns all chrome — ProgressBar is part of that chrome. | **AuthScreenShell maps route name → step index**, renders ProgressBar. |
| **BusinessLocationForm without AuthScreenShell** vs variant prop on shell | Shell is optimised for flex-1/white-bg/keyboard-avoider pattern. Map+GPS+Places+pin layout differs fundamentally. Variant prop would bloat the shell. | **Standalone layout** composing BackButton, FormButton, LoadingOverlay as pieces. |
| **jest-expo + RNTL unit tests** vs Detox / Expo built-in / no tests | jest-expo handles Expo SDK 54 metro config. RNTL queries match user interaction (getByText, getByTestId). Pure UI — no async data, unit tests suffice. | **Install `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`**. |

## Data Flow

```
Screen (app/auth/*.tsx)
  │
  ├─ AuthScreenShell (5 of 6 screens)
  │    ├─ SafeAreaView + KeyboardAvoidingView
  │    ├─ ProgressBar (route → step map)
  │    └─ children slot ← FormComponent
  │
  ├─ BusinessLocationForm (1 screen, no shell)
  │    └─ Composes BackButton + FormButton + LoadingOverlay
  │
  └─ FormComponent (src/components/auth/forms/*.tsx)
       ├─ Owns local state + validation
       ├─ Calls AuthProvider methods (saveProfile, saveIdentityCard, etc.)
       └─ Renders ScreenTitle + FormField / RadioOption / photo zone
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/auth/AuthScreenShell.tsx` | Create | SafeAreaView + KeyboardAvoidingView + ProgressBar + children slot |
| `src/components/auth/BackButton.tsx` | Create | Pressable arrow with haptic, defaults to `router.back()` |
| `src/components/auth/FormButton.tsx` | Create | Bottom CTA: orange when valid/gray when disabled, loading spinner |
| `src/components/auth/LoadingOverlay.tsx` | Create | Absolute fullscreen overlay with logo |
| `src/components/auth/ScreenTitle.tsx` | Create | Title text component with standard styling |
| `src/components/auth/FormField.tsx` | Create | Input with border, error state, hint text |
| `src/components/auth/RadioOption.tsx` | Create | Radio button with selected/unselected state |
| `src/components/auth/ProgressBar.tsx` | Modify | Add step label, animated segment transition |
| `src/components/auth/forms/PersonNameForm.tsx` | Create | Name input + validation + AuthProvider call |
| `src/components/auth/forms/StoreNameForm.tsx` | Create | Store name input + validation + AuthProvider call |
| `src/components/auth/forms/IdentityCardForm.tsx` | Create | Cedula input + `validateCedula()` + AuthProvider call |
| `src/components/auth/forms/BusinessLocationForm.tsx` | Create | Map + GPS + Places autocomplete (special layout, no AuthScreenShell) |
| `src/components/auth/forms/StorePhotosForm.tsx` | Create | Image picker + photo grid + AuthProvider call |
| `src/components/auth/forms/PaymentMethodForm.tsx` | Create | Radio options + conditional bank form + AuthProvider call |
| `app/auth/_layout.tsx` | Modify | Add `animation: 'slide_from_right'` with 300ms to Stack |
| `app/auth/person-name.tsx` | Modify | Rewrite as `AuthScreenShell` → `PersonNameForm` |
| `app/auth/store-name.tsx` | Modify | Rewrite as `AuthScreenShell` → `StoreNameForm` |
| `app/auth/identity-card.tsx` | Modify | Rewrite as `AuthScreenShell` → `IdentityCardForm` |
| `app/auth/business-location.tsx` | Modify | Rewrite composing BackButton/FormButton/LoadingOverlay directly |
| `app/auth/store-photos.tsx` | Modify | Rewrite as `AuthScreenShell` → `StorePhotosForm` |
| `app/auth/payment-method.tsx` | Modify | Rewrite as `AuthScreenShell` → `PaymentMethodForm` |
| `package.json` | Modify | Add `jest`, `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native` |

## Interfaces / Contracts

```typescript
type AuthScreenShellProps = {
  children: React.ReactNode
  currentStep?: number  // 1–6, omit to hide progress
  totalSteps?: number   // default 6
}

type BackButtonProps = { onPress?: () => void }  // defaults to router.back()

type FormButtonProps = {
  label: string
  loadingLabel?: string
  valid: boolean
  loading: boolean
  onPress: () => void
}

type FormFieldProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  error?: string
  hint?: string
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'number-pad' | 'email-address'
  maxLength?: number
  autoFocus?: boolean
}

type LoadingOverlayProps = { visible: boolean }
type RadioOptionProps = { label: string; selected: boolean; onSelect: () => void }
type ScreenTitleProps = { children: string }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | FormButton — label, spinner, disabled, onPress | `render` + `fireEvent.press` + `queryByText` |
| Unit | FormField — value, error text, hint | `render` + `getByDisplayValue` / `getByText` |
| Unit | RadioOption — selected vs unselected | `render` + check container styles |
| Unit | BackButton — fires onPress | `fireEvent.press` on pressable |
| Unit | ProgressBar — segment count, active highlight | `render` + count children + check active class |

## Migration / Rollout

No migration required. Pure refactor: the screen files change but the URL paths (`/auth/person-name`, `/auth/store-name`, etc.) stay identical. The flow from OTP verification continues to push to `/auth/person-name` unchanged.

## Open Questions

- [ ] Does ProgressBar currently animate segments? The existing implementation is static. We should add an `Animated.Value` for the active segment transition.
- [ ] The business-location title reads "¿Cuál es tu dirección de correo electrónico?" – likely a copy bug carried over from a paste. Flag for review but out of scope for this refactor.
- [ ] Confirm `expo-router` `slide_from_right` works with `headerShown: false` and custom headers in SDK 54 — verified via testing.
