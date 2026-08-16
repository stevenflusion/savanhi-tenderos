import type { AuthUser } from "@repo/api-contracts";

import type { AuthCompletionResult } from "./ports/auth-remote-repository";
import type { StoredAuthSession } from "../domain/auth.types";

export type AuthRequestResult = {
  success: boolean;
  error?: string;
};

export type VerifyAuthOtpResult = AuthRequestResult & {
  isNewUser?: boolean;
  stored?: StoredAuthSession;
};

export type CompleteAuthRegistrationResult = AuthRequestResult & {
  user?: AuthUser;
  onboardingDraft?: null;
  data?: AuthCompletionResult;
};

export type AuthUseCases = {
  initializeAuthSession: () => Promise<StoredAuthSession | null>;
  persistAuthSession: (stored: StoredAuthSession | null) => Promise<void>;
  loginAuth: (email: string, password: string) => Promise<StoredAuthSession | null>;
  registerAuth: (
    name: string,
    email: string,
    password: string,
  ) => Promise<StoredAuthSession | null>;
  requestAuthOtp: (email: string) => Promise<AuthRequestResult>;
  verifyAuthOtp: (email: string, code: string) => Promise<VerifyAuthOtpResult>;
  completeAuthRegistration: (
    stored: StoredAuthSession | null,
  ) => Promise<CompleteAuthRegistrationResult>;
  logoutAuth: (stored: StoredAuthSession | null) => Promise<void>;
};
