import type { LoginCredentials, LoginValidationErrors } from "../../domain/auth/credentials";
import { validateLoginCredentials } from "../../domain/auth/validation";
import { signInWithSavanhiId } from "./supabase-auth-service";

type LoginSuccess = {
  ok: true;
  userName: string;
  nextRoute: string;
  role: "admin" | "marca";
};

type LoginFailure = {
  ok: false;
  errors: LoginValidationErrors;
  message?: string;
};

export type LoginResult = LoginSuccess | LoginFailure;

const ROUTE_MAP: Record<"admin" | "marca", string> = {
  admin: "/admin/dashboard",
  marca: "/brand/dashboard",
};

function getNextRoute(role: "admin" | "marca"): string {
  return ROUTE_MAP[role] ?? "/unauthorized";
}

function hasValidationErrors(errors: LoginValidationErrors): boolean {
  return Boolean(errors.savanhiId || errors.password);
}

export async function loginUseCase(credentials: LoginCredentials): Promise<LoginResult> {
  const errors = validateLoginCredentials(credentials);

  if (hasValidationErrors(errors)) {
    return { ok: false, errors };
  }

  try {
    const { user } = await signInWithSavanhiId(
      credentials.savanhiId,
      credentials.password,
    );

    return {
      ok: true,
      userName: user.displayName,
      role: user.role as "admin" | "marca",
      nextRoute: getNextRoute(user.role as "admin" | "marca"),
    };
  } catch (error) {
    return {
      ok: false,
      errors: {},
      message: "Credenciales inválidas",
    };
  }
}
