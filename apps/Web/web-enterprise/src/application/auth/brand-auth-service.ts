/**
 * Brand registration service.
 *
 * Admin flow: generates SavanhID + password, sends them to the API route
 * which creates the Supabase Auth user and inserts into brand_auth.
 */

const API_BASE = "/api/admin";

/** Generate a random 12-char alphanumeric password. */
function generatePassword(): string {
  const chars =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Generate a SavanhID from the brand name.
 * Format: lowercase brand name (no spaces/special chars) + "-" + 4 random chars.
 */
function generateSavanhiId(brandName: string): string {
  const base = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);

  const suffix = Math.random().toString(36).substring(2, 6).toLowerCase();

  return base ? `${base}-${suffix}` : `marca-${suffix}`;
}

type RegisterBrandResult = {
  ok: true;
  savanhiId: string;
  email: string;
  brandName: string;
  password: string;
} | {
  ok: false;
  error: string;
};

/**
 * Register a new brand:
 * 1. Generates a SavanhID and password
 * 2. Sends them to the API route for creation
 * 3. Returns the credentials (shown once to admin)
 *
 * The generated password is returned ONLY by this function and is NOT stored.
 * The admin must share it with the brand.
 */
export async function registerBrand(
  brandName: string,
  email: string,
): Promise<RegisterBrandResult> {
  if (!brandName.trim()) {
    return { ok: false, error: "El nombre de la marca es obligatorio" };
  }

  if (!email.trim()) {
    return { ok: false, error: "El email es obligatorio" };
  }

  const savanhiId = generateSavanhiId(brandName);
  const password = generatePassword();

  try {
    const response = await fetch(`${API_BASE}/register-brand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandName: brandName.trim(), email: email.trim(), savanhiId, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error ?? "Error al registrar la marca",
      };
    }

    return {
      ok: true,
      savanhiId,
      email: email.trim(),
      brandName: brandName.trim(),
      password,
    };
  } catch {
    return {
      ok: false,
      error: "Error de conexión. Intente nuevamente.",
    };
  }
}
