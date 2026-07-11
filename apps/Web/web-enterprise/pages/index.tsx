"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../src/presentation/components/auth/auth-provider";
import { LoginForm } from "../src/presentation/components/auth/login-form";

export default function Home() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (session && user) {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/brand/dashboard");
      }
    }
  }, [isReady, session, user, router]);

  if (!isReady) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  if (session) {
    return (
      <main className="w-full h-dvh flex items-center justify-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </main>
    );
  }

  return (
    <>
      <main className="w-full h-dvh">
        <header className="w-full h-14 text-sm px-4 flex items-center justify-between">
          <img src="" alt="" />
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center justify-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
                />
              </svg>
              ES
            </div>
            <div>Iniciar Sesion</div>
            <button className="bg-black text-white rounded-full py-2 px-6">
              Empezar
            </button>
          </div>
        </header>

        <section className="w-full p-20 px-80 grid gap-4 items-center justify-center">
          <div className="w-full px-32">
            <div className="bg-gray-100 py-1.5 px-3 rounded-full">
              <div className="flex gap-2 text-sm">
                ¿Eres una marca?{" "}
                <span className="text-gray-400">
                  Descubre cómo usar Tract para crecer.
                </span>
                <div className="bg-black rounded-2xl py-1 px-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="#fff"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <h1 className="text-7xl text-center">Inicia sesión en tu cuenta</h1>
            <p className="text-base text-center text-gray-800">
              Descubre el potencial y metricas al explotar tu promociones y
              descuentos para conectar con tus clientes
            </p>
          </div>
          <LoginForm />
        </section>
      </main>
    </>
  );
}
