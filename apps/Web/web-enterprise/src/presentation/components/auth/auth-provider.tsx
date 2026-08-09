"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../application/auth/supabase-client";
import { lookupProfileByEmail } from "../../../application/auth/supabase-auth-service";
import type { AuthUser } from "../../../domain/auth/session";
import type { Session } from "@supabase/supabase-js";

type AuthState = {
  user: AuthUser | null;
  session: Session | null;
  isReady: boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession?.user?.email) {
        setSession(currentSession);
        const profile = await lookupProfileByEmail(
          currentSession.user.email,
          currentSession.user.id,
        );
        if (profile) {
          setUser(profile);
        }
      }
      setIsReady(true);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession?.user?.email) {
        setSession(currentSession);
        supabase.auth.getUser().then(async ({ data }) => {
          if (data.user?.email) {
            const profile = await lookupProfileByEmail(
              data.user.email,
              data.user.id,
            );
            if (profile) {
              setUser(profile);
            }
          }
        });
      } else {
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  function logout() {
    supabase.auth.signOut().then(() => {
      setUser(null);
      setSession(null);
      router.push("/");
    });
  }

  const value = useMemo(
    () => ({ user, session, isReady, logout }),
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
