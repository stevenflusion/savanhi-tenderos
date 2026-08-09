"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/presentation/components/auth/auth-provider";

/**
 * Legacy dashboard route — redirects authenticated users to their
 * role-specific dashboard or unauthenticated users to the login page.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (!session || !user) {
      router.replace("/");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/brand/dashboard");
    }
  }, [isReady, session, user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirigiendo...</p>
    </main>
  );
}
