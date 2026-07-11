"use client";

import { useAuth } from "../../src/presentation/components/auth/auth-provider";
import { RoleGuard } from "../../src/presentation/components/auth/role-guard";
import { AppSidebar } from "../../src/components/app-sidebar";
import { CampaignList } from "../../src/presentation/components/brand/campaign-list";
import { CampaignMetrics } from "../../src/presentation/components/brand/campaign-metrics";
import { useBrandCampaigns } from "../../src/presentation/hooks/use-brand-campaigns";
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
import Link from "next/link";
import { Button } from "../../src/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function BrandDashboardPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();
  const { campaigns, isLoading, error } = useBrandCampaigns();

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  if (!isReady || !session || !user) {
    return (
      <main className="min-h-screen px-5 py-8">
        <div className="mx-auto max-w-6xl">Validando sesión...</div>
      </main>
    );
  }

  // Aggregate metrics from active/finished campaigns
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "active" || c.status === "finished",
  );
  const totalRedemptions = 0; // would need aggregation — placeholder for now
  const totalInvestment = campaigns.reduce(
    (sum, c) => sum + Number(c.feeFixed),
    0,
  );

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
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Metrics cards */}
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-6">
                <p className="text-sm text-muted-foreground">
                  Campañas activas
                </p>
                <p className="text-3xl font-bold">
                  {activeCampaigns.length}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-6">
                <p className="text-sm text-muted-foreground">
                  Cupones canjeados
                </p>
                <p className="text-3xl font-bold">{totalRedemptions}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-6">
                <p className="text-sm text-muted-foreground">
                  Inversión total
                </p>
                <p className="text-3xl font-bold">
                  ${totalInvestment.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            {/* Campaign list */}
            <div className="min-h-[40vh] flex-1 rounded-xl bg-muted/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Mis campañas</h2>
                <Link href="/brand/campaigns/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva campaña
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <p className="text-muted-foreground">Cargando campañas...</p>
              ) : error ? (
                <p className="text-rose-600">{error}</p>
              ) : (
                <CampaignList campaigns={campaigns} />
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
