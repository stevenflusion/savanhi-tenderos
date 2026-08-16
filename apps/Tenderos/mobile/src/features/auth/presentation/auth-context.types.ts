import type { AuthPaymentMethod, AuthOnboardingDraft, StoredAuthSession } from "../domain/auth.types";

export type AuthActionResult = {
  success: boolean;
  error?: string;
};

export type SaveProfileInput = {
  name: string;
  storeName: string;
};

export type SavePaymentMethodInput = {
  method: AuthPaymentMethod;
};

export type SaveLocationInput = {
  address: string;
  latitude: number;
  longitude: number;
};

export type VerifyOtpResult = AuthActionResult & {
  isNewUser?: boolean;
};

export type AuthContextType = {
  isLoggedIn: boolean;
  user: StoredAuthSession["user"] | null;
  onboardingDraft: AuthOnboardingDraft | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  saveProfile: (data: SaveProfileInput) => Promise<AuthActionResult>;
  savePhotos: (uris: string[]) => Promise<AuthActionResult>;
  savePaymentMethod: (data: SavePaymentMethodInput) => Promise<AuthActionResult>;
  saveLocation: (data: SaveLocationInput) => Promise<AuthActionResult>;
  requestOTP: (email: string) => Promise<AuthActionResult>;
  verifyOTP: (email: string, code: string) => Promise<VerifyOtpResult>;
  completeRegistration: () => Promise<AuthActionResult>;
};
