import type { AuthResponse, AuthRole, AuthSession, AuthUser, OtpVerifyResponse } from "@repo/api-contracts/auth";
import type { User } from "@supabase/supabase-js";
import { AppError } from "../errors.js";
import { normalizeRole } from "../roles.js";
import type { DatabaseConnection } from "../database/connection.js";
import type { createAuthLogsRepository } from "../database/repositories/auth-logs.repository.js";
import type { createUsersRepository } from "../database/repositories/users.repository.js";

function buildSessionPayload(session: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
} | null): AuthSession {
  return {
    accessToken: session?.access_token ?? "",
    refreshToken: session?.refresh_token ?? null,
    expiresIn: session?.expires_in ?? null,
  };
}

function buildProfileFromAuthUser(user: User, fallbackRole: AuthRole): AuthUser {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: String(metadata.full_name ?? metadata.name ?? user.email ?? ""),
    role: normalizeRole(metadata.role, fallbackRole),
    active: true,
  };
}

export function createSupabaseAuthService(
  db: DatabaseConnection,
  {
    defaultRegistrationRole = "tendero" as AuthRole,
    authLogs,
    users,
  }: {
    defaultRegistrationRole?: AuthRole;
    authLogs?: ReturnType<typeof createAuthLogsRepository>;
    users: ReturnType<typeof createUsersRepository>;
  }
) {
  return {
    async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
      const { data, error } = await db.anon.auth.signInWithPassword({ email, password });
      if (error) throw new AppError(error.message, error.status ?? 401, error);
      if (!data.user) throw new AppError("Unable to read authenticated user.", 401);

      const fallbackProfile = buildProfileFromAuthUser(data.user, defaultRegistrationRole);
      const user = await users.ensure(fallbackProfile);
      await authLogs?.recordLogin({
        userId: user.id,
        email: user.email,
      });

      return {
        user,
        session: buildSessionPayload(data.session),
      };
    },

    async signUpWithPassword({
      email,
      password,
      fullName,
      role,
    }: {
      email: string;
      password: string;
      fullName: string;
      role?: AuthRole;
    }): Promise<AuthResponse> {
      const normalizedRole = normalizeRole(role, defaultRegistrationRole);
      const { data, error } = await db.anon.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: normalizedRole,
          },
        },
      });

      if (error) throw new AppError(error.message, error.status ?? 400, error);
      if (!data.user) throw new AppError("Unable to create authenticated user.", 502);

      const user = await users.ensure(buildProfileFromAuthUser(data.user, normalizedRole));
      await authLogs?.recordRegister({
        userId: user.id,
        email: user.email,
      });

      return {
        user,
        session: buildSessionPayload(data.session),
      };
    },

    async requestOtp(email: string): Promise<void> {
      const { error } = await db.anon.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new AppError(error.message, error.status ?? 400, error);
    },

    async verifyOtp({
      email,
      token,
      role,
    }: {
      email: string;
      token: string;
      role?: AuthRole;
    }): Promise<OtpVerifyResponse> {
      const { data, error } = await db.anon.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw new AppError(error.message, error.status ?? 401, error);
      if (!data.user) throw new AppError("Unable to read authenticated user.", 401);

      const normalizedRole = normalizeRole(role, defaultRegistrationRole);
      const existingProfile = await users.findById(data.user.id);
      const isNewUser = !existingProfile;

      const user = await users.ensure(existingProfile ?? buildProfileFromAuthUser(data.user, normalizedRole));

      if (isNewUser) {
        await authLogs?.recordRegister({ userId: user.id, email: user.email });
      } else {
        await authLogs?.recordLogin({ userId: user.id, email: user.email });
      }

      return {
        user,
        session: buildSessionPayload(data.session),
        isNewUser,
      };
    },

    async updateProfile(userId: string, payload: { fullName: string }): Promise<AuthUser> {
      return users.updateProfile(userId, payload);
    },

    async refreshSession(refreshToken: string): Promise<AuthSession> {
      const { data, error } = await db.anon.auth.refreshSession({ refresh_token: refreshToken });
      if (error) throw new AppError(error.message, error.status ?? 401, error);
      return buildSessionPayload(data.session);
    },

    async getUserFromAccessToken(accessToken: string): Promise<AuthUser> {
      const { data, error } = await db.anon.auth.getUser(accessToken);
      if (error) throw new AppError(error.message, error.status ?? 401, error);
      if (!data.user) throw new AppError("Unable to read authenticated user.", 401);

      const profile = await users.findById(data.user.id);
      if (!profile) {
        const fallbackProfile = buildProfileFromAuthUser(data.user, defaultRegistrationRole);
        return users.ensure(fallbackProfile);
      }

      return profile;
    },

    async signOut(accessToken: string, profileId?: string | null): Promise<void> {
      const { error } = await db.service.auth.admin.signOut(accessToken);
      if (error) throw new AppError(error.message, error.status ?? 502, error);
    },
  };
}

export type SupabaseAuthService = ReturnType<typeof createSupabaseAuthService>;
