import type { AuthSession, AuthUser } from "@repo/api-contracts";

import type {
  AuthOnboardingDraft,
  AuthPaymentMethod,
} from "../../domain/auth.types";

export type AuthCompletionPayload = {
  user: AuthUser;
  onboardingDraft: AuthOnboardingDraft | null;
  accessToken: string;
};

export type AuthCompletionResult = {
  fullName: string;
};

export type AuthRemoteRepository = {
  refreshSession: (refreshToken: string) => Promise<AuthSession | null>;
  login: (email: string, password: string) => Promise<{
    ok: boolean;
    user?: AuthUser;
    session?: AuthSession;
  }>;
  register: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{
    ok: boolean;
    user?: AuthUser;
    session?: AuthSession;
  }>;
  requestOtp: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (
    email: string,
    code: string,
  ) => Promise<{
    success: boolean;
    isNewUser?: boolean;
    user?: AuthUser;
    session?: AuthSession;
    error?: string;
  }>;
  completeRegistration: (
    payload: AuthCompletionPayload,
  ) => Promise<{ success: boolean; data?: AuthCompletionResult; error?: string }>;
  logout: (input: {
    accessToken: string;
    refreshToken: string | null;
  }) => Promise<void>;
};

export type AuthStorePayload = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  paymentMethod?: AuthPaymentMethod;
};
