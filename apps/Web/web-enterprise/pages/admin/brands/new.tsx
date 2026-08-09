"use client";

import { useState } from "react";
import { useAuth } from "../../../src/presentation/components/auth/auth-provider";
import { AdminGuard } from "../../../src/presentation/components/auth/admin-guard";
import { AppSidebar } from "../../../src/components/app-sidebar";
import { Button } from "../../../src/components/ui/button";
import { Input } from "../../../src/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../src/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
} from "../../../src/components/ui/sidebar";
import { registerBrand } from "../../../src/application/auth/brand-auth-service";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";

type FormState = {
  brandName: string;
  email: string;
};

type Credentials = {
  savanhiId: string;
  password: string;
  brandName: string;
  email: string;
};

export default function AdminBrandNewPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();
  const [form, setForm] = useState<FormState>({ brandName: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.brandName.trim()) {
      setError("El nombre de la marca es obligatorio");
      return;
    }

    if (!form.email.trim()) {
      setError("El email es obligatorio");
      return;
    }

    setIsSubmitting(true);

    const result = await registerBrand(form.brandName, form.email);

    if (result.ok) {
      setCredentials({
        savanhiId: result.savanhiId,
        password: result.password,
        brandName: result.brandName,
        email: result.email,
      });
      setForm({ brandName: "", email: "" });
    } else {
      setError(result.error);
    }

    setIsSubmitting(false);
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (!isReady || !session || !user) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-6xl">Validando sesión...</div>
      </main>
    );
  }

  return (
    <AdminGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/admin/dashboard">
                      Admin
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/admin/brands/new">
                      Marcas
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Registrar nueva</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="rounded-xl bg-muted/50 p-6">
              <h1 className="mb-2 text-xl font-semibold">
                Registrar nueva marca
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Completa los datos para crear una cuenta de marca. El SavanhID y
                la contraseña se generarán automáticamente y se mostrarán una
                sola vez.
              </p>

              {credentials ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <p className="mb-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      ✅ Marca registrada exitosamente
                    </p>
                    <p className="mb-4 text-xs text-emerald-700 dark:text-emerald-400">
                      Guarda estas credenciales. Solo se muestran una vez.
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-md bg-white p-3 dark:bg-black/20">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            SavanhID
                          </p>
                          <p className="font-mono text-sm font-medium">
                            {credentials.savanhiId}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(credentials.savanhiId, "savanhiId")
                          }
                        >
                          {copied === "savanhiId" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 rounded-md bg-white p-3 dark:bg-black/20">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Contraseña
                          </p>
                          <p className="font-mono text-sm font-medium">
                            {showPassword
                              ? credentials.password
                              : "•".repeat(credentials.password.length)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            copyToClipboard(credentials.password, "password")
                          }
                        >
                          {copied === "password" ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="rounded-md bg-white p-3 dark:bg-black/20">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium">
                          {credentials.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => setCredentials(null)}>
                    Registrar otra marca
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="brandName"
                      className="text-sm font-medium"
                    >
                      Nombre de la marca
                    </label>
                    <Input
                      id="brandName"
                      value={form.brandName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, brandName: e.target.value }))
                      }
                      placeholder="Ej: Savanhi Store"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="marca@ejemplo.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-rose-600">{error}</p>
                  )}

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Registrando..."
                      : "Registrar marca"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  );
}
