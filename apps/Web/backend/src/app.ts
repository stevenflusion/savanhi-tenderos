import {
  createAuthRouter,
  createBackendApp,
  createBackendContext,
} from "@repo/backend-core";
import { env } from "./config/env.js";
import { createApiRouter } from "./routes/index.js";

export function createApp() {
  const context = createBackendContext(env, {
    defaultRegistrationRole: "marca",
  });
  const { authRouter, requireRole } = createAuthRouter(context.authService, {
    allowedRegistrationRoles: ["admin", "marca"],
    limits: context.env.rateLimits,
  });

  return createBackendApp({
    env,
    routers: [authRouter, createApiRouter({ context, requireRole })],
  });
}
