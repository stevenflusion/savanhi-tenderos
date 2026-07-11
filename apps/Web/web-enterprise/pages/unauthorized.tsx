"use client";

import { useRouter } from "next/router";
import { useAuth } from "../src/presentation/components/auth/auth-provider";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="w-full h-dvh flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-300">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700">Acceso denegado</h2>
        <p className="text-gray-500 max-w-md">
          No tienes permisos para acceder a esta sección.
          {user && (
            <>
              {" "}Tu rol actual es <strong>{user.role}</strong>.
            </>
          )}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={() => router.push(user ? "/dashboard" : "/")}
            className="rounded-full bg-black text-white px-6 py-2 text-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </main>
  );
}
