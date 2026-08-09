import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type RegisterBody = {
  brandName: string;
  email: string;
  savanhiId: string;
  password: string;
};

type RegisterResponse = {
  ok: true;
  savanhiId: string;
  email: string;
  brandName: string;
} | {
  ok: false;
  error: string;
};

/**
 * POST /api/admin/register-brand
 *
 * Creates a brand user in Supabase Auth and inserts a row into brand_auth.
 * Requires SUPABASE_SERVICE_ROLE_KEY in server-side env.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>,
) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    res.status(500).json({
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY no configurada",
    });
    return;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!supabaseUrl) {
    res.status(500).json({
      ok: false,
      error: "NEXT_PUBLIC_SUPABASE_URL no configurada",
    });
    return;
  }

  const { brandName, email, savanhiId, password } = req.body as RegisterBody;

  if (!brandName || !email || !savanhiId || !password) {
    res.status(400).json({
      ok: false,
      error: "Faltan campos requeridos: brandName, email, savanhiId, password",
    });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ ok: false, error: "Formato de email inválido" });
    return;
  }

  // Create admin client with service_role key
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check existing brand_auth row for duplicate email or savanhiId
  const { data: existingBrand, error: lookupError } = await supabaseAdmin
    .from("brand_auth")
    .select("id")
    .or(`email.eq.${email},savanhi_id.eq.${savanhiId}`)
    .maybeSingle();

  if (lookupError) {
    res.status(500).json({
      ok: false,
      error: `Error al verificar datos: ${lookupError.message}`,
    });
    return;
  }

  if (existingBrand) {
    res.status(409).json({
      ok: false,
      error: "El email o SavanhID ya están registrados",
    });
    return;
  }

  // Create user in Supabase Auth (auto-confirm email)
  const { data: authData, error: createUserError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        brand_name: brandName,
        role: "marca",
        savanhi_id: savanhiId,
      },
    });

  if (createUserError) {
    // Check if it's a duplicate email error
    if (createUserError.message?.includes("already")) {
      res.status(409).json({
        ok: false,
        error: "El email ya está registrado en el sistema",
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: `Error al crear usuario: ${createUserError.message}`,
    });
    return;
  }

  if (!authData.user) {
    res.status(500).json({
      ok: false,
      error: "Error al crear usuario: no se obtuvo el usuario",
    });
    return;
  }

  // Insert into brand_auth
  const { error: insertError } = await supabaseAdmin
    .from("brand_auth")
    .insert({
      savanhi_id: savanhiId,
      email,
      brand_name: brandName,
      role: "marca",
      active: true,
    });

  if (insertError) {
    // Rollback: delete the auth user we just created
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

    res.status(500).json({
      ok: false,
      error: `Error al registrar marca: ${insertError.message}`,
    });
    return;
  }

  res.status(201).json({
    ok: true,
    savanhiId,
    email,
    brandName,
  });
}
