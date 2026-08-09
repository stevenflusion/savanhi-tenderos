"use client";

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "../../../src/presentation/components/auth/auth-provider";
import { RoleGuard } from "../../../src/presentation/components/auth/role-guard";
import { AppSidebar } from "../../../src/components/app-sidebar";
import { CampaignForm } from "../../../src/presentation/components/brand/campaign-form";
import type { CampaignFormData } from "../../../src/presentation/components/brand/campaign-form";
import { useCreateCampaign } from "../../../src/presentation/hooks/use-brand-campaigns";
import { getBrandIdByEmail } from "../../../src/application/campaign/campaign-service";
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

export default function NewCampaignPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();
  const { create, isSubmitting, error: createError } = useCreateCampaign();

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  async function handleSubmit(data: CampaignFormData) {
    if (!user?.email) return;

    const brandId = await getBrandIdByEmail(user.email);
    if (!brandId) {
      throw new Error("No se encontró el perfil de marca.");
    }

    await create({
      brandId,
      ...data,
    });

    router.push("/brand/dashboard");
  }

  if (!isReady || !session || !user) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-6xl">Validando sesión...</div>
      </main>
    );
  }

  return (
    <RoleGuard allowedRoles={["marca"]}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/brand/dashboard">
                      Marca
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/brand/dashboard">
                      Campañas
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nueva campaña</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="mx-auto w-full max-w-2xl">
              <h1 className="mb-6 text-2xl font-bold">Nueva campaña</h1>

              {createError && (
                <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {createError}
                </div>
              )}

              <CampaignForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
