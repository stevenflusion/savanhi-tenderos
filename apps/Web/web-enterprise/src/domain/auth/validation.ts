import type { LoginCredentials, LoginValidationErrors } from "./credentials";

const SAVANHI_PATTERN = /^[A-Za-z0-9]{7,20}$/;

export function validateLoginCredentials(
  credentials: LoginCredentials,
): LoginValidationErrors {
  const errors: LoginValidationErrors = {};

  if (!credentials.savanhiId.trim()) {
    errors.savanhiId = "El SavanhID es obligatorio.";
  } else if (!SAVANHI_PATTERN.test(credentials.savanhiId.trim())) {
    errors.savanhiId = "Debe tener entre 7 y 20 caracteres, solo letras y números.";
  }

  if (!credentials.password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (credentials.password.length < 8) {
    errors.password = "Mínimo 8 caracteres.";
  }

  return errors;
}

export function validateField(
  field: keyof LoginCredentials,
  value: string,
): string | undefined {
  if (field === "savanhiId") {
    if (!value.trim()) return "El SavanhID es obligatorio.";
    if (!SAVANHI_PATTERN.test(value.trim())) {
      return "Debe tener entre 7 y 20 caracteres, solo letras y números.";
    }
    return undefined;
  }

  if (field === "password") {
    if (!value) return "La contraseña es obligatoria.";
    if (value.length < 8) return "Mínimo 8 caracteres.";
    return undefined;
  }

  return undefined;
}
