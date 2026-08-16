import type { AuthSession } from "@repo/api-contracts";

import type { AuthRemoteRepository } from "../application/ports/auth-remote-repository";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_TENDEROS_API_URL ?? "http://localhost:4300";

let refreshInFlight: Promise<AuthSession | null> | null = null;

async function parseJson(response: Response) {
  return response.json().catch(() => {
    throw new Error("Respuesta invalida del backend.");
  });
}

async function authorizedFetch(
  accessToken: string,
  path: string,
  init: RequestInit = {},
) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createAuthFetchRepository(): AuthRemoteRepository {
  return {
    async refreshSession(refreshToken) {
      if (refreshInFlight) return refreshInFlight;

      refreshInFlight = (async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) return null;

          const data = await parseJson(response);
          return data.session as AuthSession;
        } catch {
          return null;
        } finally {
          refreshInFlight = null;
        }
      })();

      return refreshInFlight;
    },

    async login(email, password) {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseJson(response);
      if (!response.ok) return { ok: false };

      return {
        ok: true,
        user: data.user,
        session: data.session,
      };
    },

    async register({ name, email, password }) {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email,
          password,
          role: "tendero",
        }),
      });

      const data = await parseJson(response);
      if (!response.ok) return { ok: false };

      return {
        ok: true,
        user: data.user,
        session: data.session,
      };
    },

    async requestOtp(email) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const data = await parseJson(response);
          return {
            success: false,
            error: data.error ?? "No se pudo enviar el código.",
          };
        }

        return { success: true };
      } catch {
        return { success: false, error: "No se pudo conectar con el servidor." };
      }
    },

    async verifyOtp(email, code) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: code }),
        });

        const data = await parseJson(response);
        if (!response.ok) {
          return { success: false, error: data.error ?? "Código inválido" };
        }

        return {
          success: true,
          isNewUser: Boolean(data.isNewUser),
          user: data.user,
          session: data.session,
        };
      } catch {
        return { success: false, error: "No se pudo conectar con el servidor." };
      }
    },

    async completeRegistration({ user, onboardingDraft, accessToken }) {
      try {
        const jsonHeaders = { "Content-Type": "application/json" };

        const profileResponse = await authorizedFetch(accessToken, "/auth/me", {
          method: "PATCH",
          headers: jsonHeaders,
          body: JSON.stringify({ fullName: user.fullName }),
        });
        const profileData = await parseJson(profileResponse);
        if (!profileResponse.ok) {
          return {
            success: false,
            error: profileData.error ?? "No se pudo guardar el perfil.",
          };
        }

        const storeResponse = await authorizedFetch(
          accessToken,
          "/api/v1/tenderos/stores",
          {
            method: "POST",
            headers: jsonHeaders,
            body: JSON.stringify({
              name: onboardingDraft?.storeName,
              address: onboardingDraft?.address,
              latitude: onboardingDraft?.latitude,
              longitude: onboardingDraft?.longitude,
              paymentMethod: onboardingDraft?.paymentMethod,
            }),
          },
        );
        const storeData = await parseJson(storeResponse);
        if (!storeResponse.ok) {
          return {
            success: false,
            error: storeData.error ?? "No se pudo crear la tienda.",
          };
        }

        return {
          success: true,
          data: { fullName: profileData.user.fullName },
        };
      } catch {
        return { success: false, error: "No se pudo conectar con el servidor." };
      }
    },

    async logout({ accessToken }) {
      await authorizedFetch(accessToken, "/auth/logout", { method: "POST" });
    },
  };
}
