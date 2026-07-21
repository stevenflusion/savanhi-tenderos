export const AUTH_ROLES = ["admin", "marca", "client", "tendero", "delivery"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  active: boolean;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  role?: AuthRole;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  user: AuthUser;
  session: AuthSession;
};

export type OtpRequestRequest = {
  email: string;
};

export type OtpVerifyRequest = {
  email: string;
  token: string;
};

export type OtpVerifyResponse = AuthResponse & {
  isNewUser: boolean;
};

export type UpdateProfileRequest = {
  fullName: string;
};
