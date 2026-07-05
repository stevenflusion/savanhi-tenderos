import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import type { AuthSession, AuthUser } from "@repo/api-contracts";

type User = AuthUser & {
  storeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  paymentMethod?: "efectivo" | "pichincha";
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankAccountType?: "ahorro" | "corriente";
};

type Session = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
};

type StoredSession = {
  user: User;
  session: Session;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: User | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  saveProfile: (data: {
    name: string;
    storeName: string;
  }) => Promise<{ success: boolean; error?: string }>;
  savePhotos: (uris: string[]) => Promise<{ success: boolean; error?: string }>;
  savePaymentMethod: (data: {
    method: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  saveLocation: (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => Promise<{ success: boolean; error?: string }>;
  requestOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (
    email: string,
    code: string,
  ) => Promise<{ success: boolean; isNewUser?: boolean; error?: string }>;
  completeRegistration: () => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "savanhi-mobile-session";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_TENDEROS_API_URL ?? "http://localhost:4300";

async function parseJson(response: Response) {
  return response.json().catch(() => {
    throw new Error("Respuesta invalida del backend.");
  });
}

async function persistSession(value: StoredSession | null) {
  if (value) {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(value));
  } else {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  }
}

async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return null;
  }
}

const SESSION_REFRESH_MARGIN_MS = 60_000;

function toSession(session: AuthSession): Session {
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresIn ? Date.now() + session.expiresIn * 1000 : null,
  };
}

async function refreshWithToken(refreshToken: string): Promise<Session | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const data = await parseJson(response);
    return toSession(data.session);
  } catch {
    return null;
  }
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadSession();
      if (!stored) {
        setIsReady(true);
        return;
      }

      const expiresSoon =
        !stored.session.expiresAt ||
        stored.session.expiresAt - Date.now() < SESSION_REFRESH_MARGIN_MS;

      if (!expiresSoon) {
        setUser(stored.user);
        setSession(stored.session);
        setIsReady(true);
        return;
      }

      const refreshed = stored.session.refreshToken
        ? await refreshWithToken(stored.session.refreshToken)
        : null;

      if (refreshed) {
        setUser(stored.user);
        setSession(refreshed);
        await persistSession({ user: stored.user, session: refreshed });
      } else {
        await persistSession(null);
      }
      setIsReady(true);
    })();
  }, []);

  const authorizedFetch = async (path: string, init: RequestInit = {}) => {
    if (!session) throw new Error("No hay sesión activa.");

    const buildInit = (accessToken: string): RequestInit => ({
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
    });

    let response = await fetch(`${API_BASE_URL}${path}`, buildInit(session.accessToken));

    if (response.status === 401 && session.refreshToken) {
      const refreshed = await refreshWithToken(session.refreshToken);
      if (refreshed) {
        setSession(refreshed);
        if (user) await persistSession({ user, session: refreshed });
        response = await fetch(`${API_BASE_URL}${path}`, buildInit(refreshed.accessToken));
      } else {
        setUser(null);
        setSession(null);
        await persistSession(null);
      }
    }

    return response;
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJson(response);
    if (!response.ok) return false;

    const nextUser: User = data.user;
    const nextSession = toSession(data.session);

    setUser(nextUser);
    setSession(nextSession);
    await persistSession({ user: nextUser, session: nextSession });
    return true;
  };

  const register = async (name: string, email: string, password: string) => {
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
    if (!response.ok) return false;

    const nextUser: User = data.user;
    const nextSession = toSession(data.session);

    setUser(nextUser);
    setSession(nextSession);
    await persistSession({ user: nextUser, session: nextSession });
    return true;
  };

  const saveProfile = async (data: { name: string; storeName: string }) => {
    setUser((prev) =>
      prev ? { ...prev, fullName: data.name, storeName: data.storeName } : null,
    );
    return { success: true };
  };

  const savePhotos = async (uris: string[]) => {
    setUser((prev) => (prev ? { ...prev, photos: uris } : null));
    return { success: true };
  };

  const savePaymentMethod = async (data: {
    method: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
  }) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            paymentMethod: data.method as "efectivo" | "pichincha",
            bankAccountName: data.bankAccountName,
            bankAccountNumber: data.bankAccountNumber,
            bankAccountType: data.bankAccountType as
              | "ahorro"
              | "corriente"
              | undefined,
          }
        : null,
    );
    return { success: true };
  };

  const logout = async () => {
    if (session) {
      await authorizedFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    }

    setUser(null);
    setSession(null);
    await persistSession(null);
  };

  const requestOTP = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await parseJson(response);
        return { success: false, error: data.error ?? "No se pudo enviar el código." };
      }

      return { success: true };
    } catch {
      return { success: false, error: "No se pudo conectar con el servidor." };
    }
  };

  const verifyOTP = async (email: string, code: string) => {
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

      const nextUser: User = data.user;
      const nextSession = toSession(data.session);

      setUser(nextUser);
      setSession(nextSession);
      await persistSession({ user: nextUser, session: nextSession });
      return { success: true, isNewUser: Boolean(data.isNewUser) };
    } catch {
      return { success: false, error: "No se pudo conectar con el servidor." };
    }
  };

  const saveLocation = async (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
    return { success: true };
  };

  const completeRegistration = async () => {
    if (!user || !session) {
      return { success: false, error: "Sesión no encontrada." };
    }

    try {
      const jsonHeaders = { "Content-Type": "application/json" };

      const profileResponse = await authorizedFetch("/auth/me", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ fullName: user.fullName }),
      });
      const profileData = await parseJson(profileResponse);
      if (!profileResponse.ok) {
        return { success: false, error: profileData.error ?? "No se pudo guardar el perfil." };
      }

      const storeResponse = await authorizedFetch("/api/v1/tenderos/stores", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          name: user.storeName,
          address: user.address,
          latitude: user.latitude,
          longitude: user.longitude,
          paymentMethod: user.paymentMethod,
          bankAccountName: user.bankAccountName,
          bankAccountNumber: user.bankAccountNumber,
          bankAccountType: user.bankAccountType,
        }),
      });
      const storeData = await parseJson(storeResponse);
      if (!storeResponse.ok) {
        return { success: false, error: storeData.error ?? "No se pudo crear la tienda." };
      }

      setUser((prev) => (prev ? { ...prev, fullName: profileData.user.fullName } : prev));
      return { success: true };
    } catch {
      return { success: false, error: "No se pudo conectar con el servidor." };
    }
  };

  const value = useMemo(
    () => ({
      isLoggedIn: user !== null,
      user,
      isReady,
      login,
      register,
      saveProfile,
      savePhotos,
      savePaymentMethod,
      saveLocation,
      requestOTP,
      verifyOTP,
      completeRegistration,
      logout,
    }),
    [user, session, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
