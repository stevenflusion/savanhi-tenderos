import { supabase } from "./supabase-client";
import type { AuthUser } from "../../domain/auth/session";
import type { Session } from "@supabase/supabase-js";

const ADMIN_SAVANHI_ID = "savanhi";
const ADMIN_EMAIL = "admin@savanhi.com";

/**
 * Look up a brand_auth row by SavanhID.
 * Returns null instead of throwing so callers can handle fallback logic.
 */
async function findBrandAuthBySavanhiId(
  savanhiId: string,
): Promise<{
  email: string;
  brandName: string;
  role: "marca";
} | null> {
  const { data, error } = await supabase
    .from("brand_auth")
    .select("email, brand_name, role")
    .eq("savanhi_id", savanhiId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    email: data.email,
    brandName: data.brand_name,
    role: data.role as "marca",
  };
}

/**
 * Resolve a SavanhID to a profile (email, displayName, role).
 *
 * For the admin bootstrap user "savanhi" the mapping is hardcoded.
 * For all other IDs the `brand_auth` table is queried.
 */
async function resolveProfile(
  savanhiId: string,
): Promise<{
  email: string;
  displayName: string;
  role: "admin" | "marca";
} | null> {
  const normalizedId = savanhiId.toLowerCase().trim();

  if (normalizedId === ADMIN_SAVANHI_ID) {
    return {
      email: ADMIN_EMAIL,
      displayName: "Admin",
      role: "admin",
    };
  }

  const brandAuth = await findBrandAuthBySavanhiId(normalizedId);
  if (!brandAuth) return null;

  return {
    email: brandAuth.email,
    displayName: brandAuth.brandName,
    role: brandAuth.role,
  };
}

export async function signInWithSavanhiId(
  savanhiId: string,
  password: string,
): Promise<{ user: AuthUser; session: Session }> {
  const normalizedId = savanhiId.toLowerCase().trim();
  const profile = await resolveProfile(normalizedId);

  if (!profile) {
    throw new Error("Credenciales inválidas");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error || !data.session) {
    throw new Error("Credenciales inválidas");
  }

  const authUser: AuthUser = {
    id: data.user.id,
    email: profile.email,
    fullName: profile.displayName,
    displayName: profile.displayName,
    savanhiId: normalizedId,
    role: profile.role,
    active: true,
  };

  return { user: authUser, session: data.session };
}

/**
 * Restore a user profile from a Supabase session email.
 * Used by AuthProvider on page refresh to recover the user identity.
 */
export async function lookupProfileByEmail(
  email: string,
  supabaseUserId: string,
): Promise<AuthUser | null> {
  if (email === ADMIN_EMAIL) {
    return {
      id: supabaseUserId,
      email: ADMIN_EMAIL,
      fullName: "Admin",
      displayName: "Admin",
      savanhiId: ADMIN_SAVANHI_ID,
      role: "admin",
      active: true,
    };
  }

  const { data, error } = await supabase
    .from("brand_auth")
    .select("savanhi_id, brand_name, email")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: supabaseUserId,
    email: data.email,
    fullName: data.brand_name,
    displayName: data.brand_name,
    savanhiId: data.savanhi_id,
    role: "marca",
    active: true,
  };
}
