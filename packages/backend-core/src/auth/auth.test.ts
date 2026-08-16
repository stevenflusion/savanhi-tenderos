import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { eq, inArray } from "drizzle-orm";
import { createAuthService } from "./service.js";
import { createDatabaseConnection } from "../database/connection.js";
import { createAuthLogsRepository } from "../database/repositories/auth-logs.repository.js";
import { createUsersRepository } from "../database/repositories/users.repository.js";
import { authEvents, authSessions, otpChallenges, roles, users } from "../database/schema.js";
import type { BackendEnv } from "../types/env.js";

const email = `auth-test-${randomUUID()}@example.test`;
const env: BackendEnv = {
  serviceName: "auth-tests",
  nodeEnv: "test",
  port: 1,
  allowedOrigins: [],
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://savanhi:savanhi@localhost:5433/savanhi",
  authJwtSecret: "test-secret-that-is-long-enough",
  authJwtIssuer: "auth-tests",
  authJwtAudience: "savanhi-api",
  trustProxy: false,
  otpProvider: "development",
  otpDevCode: "123456",
  rateLimits: { api: 100, login: 10, register: 10, otpRequest: 10, otpVerify: 10, refresh: 10 },
};

test("auth rotation, OTP replay/attempts, and audit redaction", async (t) => {
  const db = createDatabaseConnection(env);
  const authLogs = createAuthLogsRepository(db);
  const service = createAuthService(db, {
    env,
    authLogs,
    users: createUsersRepository(db),
  });
  const [role] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, "tendero"));
  assert.ok(role, "local seed must provide the tendero role");
  const userEmail = `auth-test-${randomUUID()}@example.test`;
  const userIds: string[] = [];

  t.after(async () => {
    await db.delete(otpChallenges).where(eq(otpChallenges.emailNormalized, email));
    for (const userId of userIds) {
      await db.delete(authEvents).where(eq(authEvents.userId, userId));
      await db.delete(authSessions).where(eq(authSessions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
    await db.delete(authEvents).where(eq(authEvents.emailHash, "never-created-hash"));
    await db.pool.end();
  });

  const signedUp = await service.signUpWithPassword({ email: userEmail, password: "Password-123!", fullName: "Test User", role: "tendero" });
  userIds.push(signedUp.user.id);
  const initialRefreshToken = signedUp.session.refreshToken ?? (() => {
    throw new Error("Test session did not include a refresh token");
  })();
  const rotated = await service.refreshSession(initialRefreshToken, { requestId: "request-1" });
  assert.notEqual(rotated.refreshToken, initialRefreshToken);
  await assert.rejects(() => service.refreshSession(initialRefreshToken), /Invalid refresh token/);
  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.id, signedUp.user.id));
  assert.equal(userRow?.id, signedUp.user.id);

  await service.requestOtp(email, { requestId: "request-otp" });
  await assert.rejects(() => service.verifyOtp({ email, token: "000000" }), /Invalid or expired/);
  await assert.rejects(() => service.verifyOtp({ email, token: "000000" }), /Invalid or expired/);
  const verified = await service.verifyOtp({ email, token: "123456" });
  assert.equal(verified.isNewUser, true);
  userIds.push(verified.user.id);
  await assert.rejects(() => service.verifyOtp({ email, token: "123456" }), /Invalid or expired/);

  const attemptEmail = `auth-attempt-${randomUUID()}@example.test`;
  await service.requestOtp(attemptEmail);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await assert.rejects(() => service.verifyOtp({ email: attemptEmail, token: "000000" }), /Invalid or expired/);
  }
  await assert.rejects(() => service.verifyOtp({ email: attemptEmail, token: "123456" }), /Invalid or expired/);
  await db.delete(otpChallenges).where(eq(otpChallenges.emailNormalized, attemptEmail));

  const expiredEmail = `auth-expired-${randomUUID()}@example.test`;
  await service.requestOtp(expiredEmail);
  await db.update(otpChallenges).set({ expiresAt: new Date(Date.now() - 1_000) }).where(eq(otpChallenges.emailNormalized, expiredEmail));
  await assert.rejects(() => service.verifyOtp({ email: expiredEmail, token: "123456" }), /Invalid or expired/);
  await db.delete(otpChallenges).where(eq(otpChallenges.emailNormalized, expiredEmail));

  const events = await db.select().from(authEvents).where(inArray(authEvents.eventType, ["refresh", "otp_request", "otp_verify"]));
  assert.ok(events.length >= 4);
  assert.ok(events.every((event) => !event.emailHash?.includes("123456") && !event.reason?.includes("123456")));
});
