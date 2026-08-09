"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "./auth-provider";

type RoleGuardProps = {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * RoleGuard restricts its children to users with one of the allowed roles.
 * Unauthenticated users are redirected to "/".
 * Users without the required role are redirected to "/unauthorized".
 */
export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace("/");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [isReady, user, allowedRoles, router]);

  if (!isReady || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Validando sesión...</p>
      </main>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback ?? (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </main>
    );
  }

  return <>{children}</>;
}
