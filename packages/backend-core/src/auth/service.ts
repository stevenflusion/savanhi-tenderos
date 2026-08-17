import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type {
  AuthResponse,
  AuthRole,
  AuthSession,
  AuthUser,
  OtpVerifyResponse,
} from "@repo/api-contracts/auth";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { AppError } from "../errors.js";
import { normalizeRole } from "../roles.js";
import type { DatabaseConnection } from "../database/connection.js";
import {
  authSessions,
  otpChallenges,
  roles,
  users,
} from "../database/schema.js";
import type { createAuthLogsRepository } from "../database/repositories/auth-logs.repository.js";
import type { createUsersRepository } from "../database/repositories/users.repository.js";
import type { BackendEnv } from "../types/env.js";
import {
  createDevelopmentOtpProvider,
  createResendOtpProvider,
  type OtpProvider,
} from "./otp-provider.js";

const ACCESS_SECONDS = 15 * 60;
const REFRESH_DAYS = 30;
const OTP_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;
const UNUSABLE_PASSWORD = "!otp-managed-user!";
export type AuthRequestMeta = {
  requestId?: string;
  ip?: string;
  userAgent?: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
function constantTimeHashEquals(value: string, expected: string) {
  return crypto.timingSafeEqual(
    Buffer.from(hash(value)),
    Buffer.from(expected),
  );
}
function createRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function createAuthService(
  db: DatabaseConnection,
  {
    env,
    defaultRegistrationRole = "tendero" as AuthRole,
    authLogs,
    users: userRepository,
    otpProvider,
  }: {
    env: BackendEnv;
    defaultRegistrationRole?: AuthRole;
    authLogs?: ReturnType<typeof createAuthLogsRepository>;
    users: ReturnType<typeof createUsersRepository>;
    otpProvider?: OtpProvider;
  },
) {
  const provider =
    otpProvider ??
    (env.otpProvider === "resend"
      ? createResendOtpProvider(env.otpResend!)
      : createDevelopmentOtpProvider());
  async function roleId(role: AuthRole) {
    const [row] = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, role));
    if (!row) throw new AppError(`Role ${role} is not configured.`, 500);
    return row.id;
  }
  function accessToken(userId: string, sessionId: string) {
    return jwt.sign(
      { sub: userId, sid: sessionId, typ: "access" },
      env.authJwtSecret,
      {
        algorithm: "HS256",
        expiresIn: ACCESS_SECONDS,
        issuer: env.authJwtIssuer,
        audience: env.authJwtAudience,
      },
    );
  }
  async function issueSession(
    userId: string,
    familyId = crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`,
    rotation = 0,
  ): Promise<AuthSession> {
    const sessionId = crypto.randomUUID();
    const refreshToken = createRefreshToken();
    const access = accessToken(userId, sessionId);
    await db.insert(authSessions).values({
      id: sessionId,
      userId,
      tokenHash: hash(access),
      refreshTokenHash: hash(refreshToken),
      familyId,
      rotation,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400000),
    });
    return { accessToken: access, refreshToken, expiresIn: ACCESS_SECONDS };
  }
  async function findCredentials(email: string) {
    const normalized = normalizeEmail(email);
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.emailNormalized, normalized));
    return row;
  }
  async function audit(
    eventType: string,
    event: Omit<
      Parameters<NonNullable<typeof authLogs>["record"]>[0],
      "eventType"
    >,
  ) {
    await authLogs?.record({ ...event, eventType });
  }
  return {
    async signInWithPassword(
      email: string,
      password: string,
      meta: AuthRequestMeta = {},
    ): Promise<AuthResponse> {
      const row = await findCredentials(email);
      if (
        !row ||
        !row.active ||
        row.passwordHash === UNUSABLE_PASSWORD ||
        !(await bcrypt.compare(password, row.passwordHash))
      ) {
        await audit("login", {
          email,
          outcome: "failure",
          reason: "invalid_credentials",
          ...meta,
        });
        throw new AppError("Invalid email or password.", 401);
      }
      const user = await userRepository.findById(row.id);
      if (!user) throw new AppError("Unable to read authenticated user.", 401);
      const session = await issueSession(user.id);
      await audit("login", {
        userId: user.id,
        sessionId: undefined,
        email: user.email,
        outcome: "success",
        ...meta,
      });
      return { user, session };
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
      const normalized = normalizeEmail(email);
      if (await findCredentials(normalized)) {
        await audit("registration", {
          email,
          outcome: "failure",
          reason: "duplicate_email",
        });
        throw new AppError("Unable to create account.", 400);
      }
      const selectedRole = normalizeRole(role, defaultRegistrationRole);
      const [row] = await db
        .insert(users)
        .values({
          email: normalized,
          emailNormalized: normalized,
          passwordHash: await bcrypt.hash(password, 12),
          fullName,
          roleId: await roleId(selectedRole),
        })
        .returning({ id: users.id });
      if (!row) throw new AppError("Unable to create user.", 502);
      const user = await userRepository.ensure({
        id: row.id,
        email: normalized,
        fullName,
        role: selectedRole,
        active: true,
      });
      const session = await issueSession(user.id);
      await audit("registration", {
        userId: user.id,
        email: user.email,
        outcome: "success",
      });
      return { user, session };
    },
    async requestOtp(email: string, meta: AuthRequestMeta = {}): Promise<void> {
      const normalized = normalizeEmail(email);
      const code = env.otpDevCode ?? String(crypto.randomInt(100000, 1000000));
      await db
        .update(otpChallenges)
        .set({ lockedAt: new Date() })
        .where(
          and(
            eq(otpChallenges.emailNormalized, normalized),
            isNull(otpChallenges.consumedAt),
            isNull(otpChallenges.lockedAt),
          ),
        );
      await db.insert(otpChallenges).values({
        emailNormalized: normalized,
        codeHash: hash(`${normalized}:${code}:${env.authJwtSecret}`),
        expiresAt: new Date(Date.now() + OTP_SECONDS * 1000),
      });
      try {
        await provider.sendOtp(normalized, code);
        await audit("otp_request", { email, outcome: "success", ...meta });
      } catch {
        await audit("otp_provider_failure", {
          email,
          outcome: "failure",
          reason: "provider_unavailable",
          ...meta,
        });
        throw new AppError(
          "No pudimos enviar el código. Revisá el correo del remitente y la configuración de Resend.",
          503,
        );
      }
    },
    async verifyOtp(
      {
        email,
        token,
      }: {
        email: string;
        token: string;
      },
      meta: AuthRequestMeta = {},
    ): Promise<OtpVerifyResponse> {
      const normalized = normalizeEmail(email);
      const result = await db.transaction(async (tx) => {
        const [challenge] = await tx
          .select()
          .from(otpChallenges)
          .where(
            and(
              eq(otpChallenges.emailNormalized, normalized),
              isNull(otpChallenges.consumedAt),
              isNull(otpChallenges.lockedAt),
              gt(otpChallenges.expiresAt, new Date()),
            ),
          )
          .orderBy(sql`${otpChallenges.createdAt} desc`)
          .limit(1)
          .for("update");
        if (!challenge) return null;
        if (
          challenge.attempts >= MAX_OTP_ATTEMPTS ||
          !constantTimeHashEquals(
            `${normalized}:${token}:${env.authJwtSecret}`,
            challenge.codeHash,
          )
        ) {
          const attempts = challenge.attempts + 1;
          await tx
            .update(otpChallenges)
            .set({
              attempts,
              lockedAt: attempts >= MAX_OTP_ATTEMPTS ? new Date() : null,
            })
            .where(eq(otpChallenges.id, challenge.id));
          return null;
        }
        await tx
          .update(otpChallenges)
          .set({ consumedAt: new Date() })
          .where(eq(otpChallenges.id, challenge.id));
        let [user] = await tx
          .select()
          .from(users)
          .where(eq(users.emailNormalized, normalized));
        let isNewUser = false;
        if (!user) {
          isNewUser = true;
          const [created] = await tx
            .insert(users)
            .values({
              email: normalized,
              emailNormalized: normalized,
              passwordHash: UNUSABLE_PASSWORD,
              fullName: "",
              roleId: await roleId("tendero"),
            })
            .returning();
          user = created;
        }
        return { user, isNewUser };
      });
      if (!result?.user) {
        await audit("otp_verify", {
          email,
          outcome: "failure",
          reason: "invalid_or_expired",
          ...meta,
        });
        throw new AppError("Invalid or expired verification code.", 401);
      }
      const user = await userRepository.findById(result.user.id);
      if (!user) throw new AppError("Unable to read authenticated user.", 401);
      const session = await issueSession(user.id);
      await audit("otp_verify", {
        userId: user.id,
        email,
        outcome: "success",
        ...meta,
      });
      return { user, session, isNewUser: result.isNewUser };
    },
    async updateProfile(
      userId: string,
      payload: { fullName: string },
    ): Promise<AuthUser> {
      return userRepository.updateProfile(userId, payload);
    },
    async refreshSession(
      refreshToken: string,
      meta: AuthRequestMeta = {},
    ): Promise<AuthSession> {
      const result = await db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(authSessions)
          .where(eq(authSessions.refreshTokenHash, hash(refreshToken)))
          .for("update");
        if (!session) return null;
        if (
          session.revokedAt ||
          session.rotatedAt ||
          session.expiresAt <= new Date()
        ) {
          await tx
            .update(authSessions)
            .set({ revokedAt: new Date() })
            .where(eq(authSessions.familyId, session.familyId));
          return null;
        }
        await tx
          .update(authSessions)
          .set({ rotatedAt: new Date(), revokedAt: new Date() })
          .where(eq(authSessions.id, session.id));
        return {
          userId: session.userId,
          familyId: session.familyId,
          rotation: session.rotation + 1,
        };
      });
      if (!result) {
        await audit("refresh", {
          outcome: "failure",
          reason: "invalid_reused_or_expired",
          ...meta,
        });
        throw new AppError("Invalid refresh token.", 401);
      }
      const session = await issueSession(
        result.userId,
        result.familyId as `${string}-${string}-${string}-${string}-${string}`,
        result.rotation,
      );
      await audit("refresh", {
        userId: result.userId,
        familyId: result.familyId,
        outcome: "success",
        ...meta,
      });
      return session;
    },
    async getUserFromAccessToken(accessTokenValue: string): Promise<AuthUser> {
      try {
        const decoded = jwt.verify(accessTokenValue, env.authJwtSecret, {
          algorithms: ["HS256"],
          issuer: env.authJwtIssuer,
          audience: env.authJwtAudience,
        }) as { sub: string; sid: string; typ: string };
        if (decoded.typ !== "access") throw new Error("type");
        const [session] = await db
          .select({ id: authSessions.id })
          .from(authSessions)
          .where(
            and(
              eq(authSessions.id, decoded.sid),
              eq(authSessions.tokenHash, hash(accessTokenValue)),
              isNull(authSessions.revokedAt),
              isNull(authSessions.rotatedAt),
              gt(authSessions.expiresAt, new Date()),
            ),
          );
        if (!session) throw new Error("revoked");
        const user = await userRepository.findById(decoded.sub);
        if (!user || !user.active) throw new Error("inactive");
        return user;
      } catch {
        throw new AppError("Invalid or expired access token.", 401);
      }
    },
    async signOut(accessTokenValue: string): Promise<void> {
      await db
        .update(authSessions)
        .set({ revokedAt: new Date() })
        .where(eq(authSessions.tokenHash, hash(accessTokenValue)));
      await audit("logout", { outcome: "success" });
    },
  };
}
export type AuthService = ReturnType<typeof createAuthService>;
