import type { AuthUser } from "@repo/api-contracts";

export type AuthPaymentMethod = "efectivo" | "pichincha";

export type AuthOnboardingDraft = {
  storeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  paymentMethod?: AuthPaymentMethod;
};

export type AuthSessionState = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
};

export type StoredAuthSession = {
  user: AuthUser;
  session: AuthSessionState;
  onboardingDraft: AuthOnboardingDraft | null;
};

export type LegacyStoredAuthSession = {
  user: AuthUser & AuthOnboardingDraft;
  session: AuthSessionState;
};
