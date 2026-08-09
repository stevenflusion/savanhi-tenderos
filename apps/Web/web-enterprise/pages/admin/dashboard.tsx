"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../src/presentation/components/auth/auth-provider";
import { RoleGuard } from "../../src/presentation/components/auth/role-guard";
import { AppSidebar } from "../../src/components/app-sidebar";
import { supabase } from "../../src/application/auth/supabase-client";
import { Button } from "../../src/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../src/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
} from "../../src/components/ui/sidebar";
import { useRouter } from "next/router";
import Link from "next/link";
import { ShoppingCart, Building2, Megaphone, ArrowRight } from "lucide-react";

type DashboardStats = {
  activeBrands: number;
  activeCampaigns: number;
  pendingPayments: number;
  totalCampaigns: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeBrands: 0,
    activeCampaigns: 0,
    pendingPayments: 0,
    totalCampaigns: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  useEffect(() => {
    if (!isReady || !session) return;

    async function fetchStats() {
      setIsLoading(true);

      const [brandsResult, campaignsResult, paymentsResult] = await Promise.all(
        [
          supabase
            .from("brand_auth")
            .select("id", { count: "exact", head: true })
            .eq("active", true),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("campaigns")
            .select("id", { count: "exact", head: true })
            .eq("status", "receipt_uploaded"),
        ],
      );

      // Also get total campaigns for a secondary metric
      const { count: totalCampaigns } = await supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true });

      setStats({
        activeBrands: brandsResult.count ?? 0,
        activeCampaigns: campaignsResult.count ?? 0,
        pendingPayments: paymentsResult.count ?? 0,
        totalCampaigns: totalCampaigns ?? 0,
      });
      setIsLoading(false);
    }

    fetchStats();
  }, [isReady, session]);

  if (!isReady || !session || !user) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-6xl">Validando sesión...</div>
      </main>
    );
  }

  const cardClass =
    "rounded-xl bg-muted/50 p-6 transition-colors hover:bg-muted/70";

  return (
    <RoleGuard allowedRoles={["admin"]}>
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
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Stats cards */}
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <Link href="/admin/brands/new" className={cardClass}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      Marcas activas
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {isLoading ? "—" : stats.activeBrands}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </Link>

              <div className={cardClass}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Megaphone className="h-4 w-4" />
                      Campañas activas
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {isLoading ? "—" : stats.activeCampaigns}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stats.totalCampaigns} campañas totales
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/admin/payments" className={cardClass}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                      Pagos pendientes
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {isLoading ? "—" : stats.pendingPayments}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </div>

            {/* Quick actions */}
            <div className="min-h-[30vh] flex-1 rounded-xl bg-muted/50 p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Acciones rápidas
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/brands/new">
                  <Button variant="default" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Registrar marca
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button variant="outline" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Revisar pagos
                    {stats.pendingPayments > 0 && (
                      <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white">
                        {stats.pendingPayments}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>

              <p className="mt-8 text-sm text-muted-foreground">
                Selecciona una sección del menú lateral o usa las acciones
                rápidas para gestionar la plataforma.
              </p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
