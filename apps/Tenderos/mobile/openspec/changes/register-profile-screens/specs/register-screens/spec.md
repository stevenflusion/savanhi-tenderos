# Register Screens

## Purpose

7-screen post-OTP registration flow replacing the 2-step wizard, plus AuthProvider extensions and validation utilities.

## Requirements

### Requirement: R1 — Shared Screen Pattern & Screen Table

Every screen: white bg, SafeAreaView flex-1, 280ms fade+slide Animated.parallel, KeyboardAvoidingView, bottom CTA (rounded-full min-h-[50px]), loading overlay (absolute inset-0). Back arrow: MaterialIcons arrow-back 26/#798091.

| Screen | Title | Input | Valid | Navigates To |
|--------|-------|-------|-------|-------------|
| assistant-message | "¡Hola! Soy tu asistente..." | CTA only | — | /auth/person-name |
| person-name | "¿Cuéntanos cómo te llamas?" | TextInput name | trimmed > 0 | /auth/store-name |
| store-name | "¿Cuál es el nombre de tu negocio?" | TextInput storeName | trimmed > 0 | /auth/identity-card |
| identity-card | "¿Cuál es tu número de cédula?" | Numeric maxLength=10 | módulo 10 | /auth/business-location |
| business-location | Existing (modified nav) | Google Places + map | address set | /auth/store-photos |
| store-photos | "Fotos de tu local" | CameraUpload max 5 | ≥ 1 photo | /auth/payment-method |
| payment-method | "Método de cobro principal" | Radio + bank form | method selected | /auth/account-created |
| account-created | Existing (unchanged) | CTA only | — | (tabs) |

- GIVEN user navigates to any screen → animation 280ms, CTA bg-gray-100 until valid, loading overlay during save

### Requirement: R2 — Assistant Message

No back arrow. CTA "Comenzar". Welcome title + subtitle.

- GIVEN new user verified OTP → /auth/assistant-message with logo, title, CTA → /auth/person-name

### Requirement: R3 — Person Name & Store Name

Person-name: `saveProfile({name, storeName: currentStoreName})`. Store-name: `saveProfile({name: currentName, storeName})`. Each preserves the other. Empty input disables CTA.

- GIVEN valid input and Continuar tapped → saveProfile resolves → next screen

### Requirement: R4 — Identity Card

Módulo 10: 10 digits, province 01-24 or 00, coefficients [2,1,2,1,2,1,2,1,2], check digit match. Error: "Cédula inválida. Verifica el número."

- GIVEN valid cédula → saveIdentityCard called → navigation to /auth/business-location
- GIVEN invalid cédula → error displayed, navigation blocked

### Requirement: R5 — Business Location (Modified)

Back → /auth/identity-card. Success → /auth/store-photos. Existing logic unchanged.

- GIVEN back tapped → /auth/identity-card
- GIVEN address set + CTA → /auth/store-photos

### Requirement: R6 — Store Photos

"Tomar foto" → expo-image-picker. Max 5, thumbnails with X remove. CTA requires ≥ 1.

- GIVEN ≤ 4 photos, picker returns URI → thumbnail with X appears
- GIVEN 5 photos → picker disabled
- GIVEN 0 photos → CTA disabled

### Requirement: R7 — Payment Method

Radio: "Efectivo" / "Banco Pichincha". Pichincha: inline form (nombre titular, número cuenta, tipo cuenta Ahorro/Corriente, all required). CTA calls savePaymentMethod.

- GIVEN "Efectivo" → savePaymentMethod({method:"efectivo"})
- GIVEN Pichincha, incomplete fields → CTA disabled
- GIVEN Pichincha, all filled → savePaymentMethod with bank fields

### Requirement: R8 — Account Created (Unchanged)

Checkmark + "Comenzar" → tabs.

- GIVEN registration done → /auth/account-created → checkmark + CTA → tabs

### Requirement: R9 — AuthProvider Extensions

Add to User: `cedula?`, `photos: string[]`, `paymentMethod?`, `bankAccountName?`, `bankAccountNumber?`, `bankAccountType?`. Mock methods (800-1000ms): saveProfile, saveIdentityCard, savePhotos, savePaymentMethod. Keep completeProfile.

- GIVEN any save method called → delay resolves → user context merges

### Requirement: R10 — Cédula Validation

`src/utils/cedula.ts`: `validateCedula(s): {valid: boolean; error?: string}` using módulo 10.

- GIVEN province 01-24 + correct check digit → {valid: true}
- GIVEN bad length, province > 24, wrong digit → {valid: false}
