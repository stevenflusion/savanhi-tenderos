import type { DatabaseConnection } from "../connection.js";
import { authEvents } from "../schema.js";

import crypto from "node:crypto";

export type AuthEvent = { eventType: string; userId?: string; sessionId?: string; familyId?: string; email?: string; outcome: "success" | "failure"; reason?: string; requestId?: string; ip?: string; userAgent?: string };

export function createAuthLogsRepository(db: DatabaseConnection) {
  async function record(event: AuthEvent) {
    try {
      const { email, ...redactedEvent } = event;
      await db.insert(authEvents).values({
        ...redactedEvent,
        emailHash: email
          ? crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
          : null,
      });
    } catch { /* Audit failure must not break authentication. */ }
  }
  return { record };
}
