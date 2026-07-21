import { createBackendContext, createEnv } from "../index.js";

function readBootstrapEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

async function main() {
  const email = readBootstrapEnv("DEV_ADMIN_EMAIL", "dev.admin@savanhi.local");
  const password = readBootstrapEnv("DEV_ADMIN_PASSWORD", "ChangeMe123!");
  const fullName = readBootstrapEnv("DEV_ADMIN_FULL_NAME", "Developer Admin");

  const env = createEnv({
    serviceName: "bootstrap-dev-admin",
    defaultPort: 4300,
  });

  const context = createBackendContext(env, { defaultRegistrationRole: "admin" });
  const normalizedEmail = email.toLowerCase();

  const { data: authUsers, error: listError } = await context.db.service.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Unable to list Supabase users: ${listError.message}`);
  }

  const existingAuthUser = authUsers.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ?? null;
  let userId = existingAuthUser?.id ?? null;

  if (!existingAuthUser) {
    const { data, error } = await context.db.service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin",
      },
    });

    if (error) {
      throw new Error(`Unable to create Supabase auth user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("Supabase did not return a user after creation.");
    }

    userId = data.user.id;
    console.log(`Created auth user ${email} (${userId}).`);
  } else {
    console.log(`Auth user already exists: ${email} (${existingAuthUser.id}).`);
  }

  if (!userId) {
    throw new Error("Unable to resolve the admin user id.");
  }

  const profile = await context.repositories.users.ensure({
    id: userId,
    email,
    fullName,
    role: "admin",
    active: true,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: profile,
        note: "Use role admin for full backend access. There is no separate developer role in the current authorization model.",
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
