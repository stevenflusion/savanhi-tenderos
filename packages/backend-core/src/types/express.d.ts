import type { AuthUser } from "@repo/api-contracts/auth";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: {
        token: string;
        user: AuthUser;
      };
    }
  }
}

export {};
