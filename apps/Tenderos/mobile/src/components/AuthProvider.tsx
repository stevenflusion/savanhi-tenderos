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

type Session = Pick<AuthSession, "accessToken" | "refreshToken">;

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    loadSession()
      .then((stored) => {
        if (!stored) return;
        setUser(stored.user);
        setSession(stored.session);
      })
      .finally(() => setIsReady(true));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseJson(response);
    if (!response.ok) return false;

    const nextUser: User = data.user;
    const nextSession: Session = {
      accessToken: data.session.accessToken,
      refreshToken: data.session.refreshToken,
    };

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
    const nextSession: Session = {
      accessToken: data.session.accessToken ?? "",
      refreshToken: data.session.refreshToken ?? null,
    };

    setUser(nextUser);
    setSession(nextSession);
    await persistSession({ user: nextUser, session: nextSession });
    return true;
  };

  const saveProfile = async (data: { name: string; storeName: string }) => {
    await delay(1000);
    setUser((prev) =>
      prev ? { ...prev, fullName: data.name, storeName: data.storeName } : null,
    );
    return { success: true };
  };

  const savePhotos = async (uris: string[]) => {
    await delay(800);
    setUser((prev) => (prev ? { ...prev, photos: uris } : null));
    return { success: true };
  };

  const savePaymentMethod = async (data: {
    method: string;
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankAccountType?: string;
  }) => {
    await delay(800);
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
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
    }

    setUser(null);
    setSession(null);
    await persistSession(null);
  };

  const requestOTP = async (_email: string) => {
    await delay(1500);
    return { success: true };
  };

  const verifyOTP = async (email: string, code: string) => {
    await delay(1500);
    if (code === "123456") {
      // Set the user with the email so the profile screens can work
      setUser({
        id: `mock-${Date.now()}`,
        fullName: "",
        email,
        role: "tendero",
        active: true,
        storeName: "",
      });
      return { success: true, isNewUser: true };
    }
    return { success: false, error: "Código PIN incorrecto" };
  };

  const saveLocation = async (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    await delay(800);
    setUser((prev) => (prev ? { ...prev, ...data } : null));
    return { success: true };
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
      logout,
    }),
    [user, isReady],
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
