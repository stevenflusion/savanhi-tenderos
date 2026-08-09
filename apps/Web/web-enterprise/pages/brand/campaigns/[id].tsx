"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../../../src/presentation/components/auth/auth-provider";
import { RoleGuard } from "../../../src/presentation/components/auth/role-guard";
import { AppSidebar } from "../../../src/components/app-sidebar";
import { CampaignMetrics } from "../../../src/presentation/components/brand/campaign-metrics";
import { ReceiptUpload } from "../../../src/presentation/components/brand/receipt-upload";
import { SettlementView } from "../../../src/presentation/components/brand/settlement-view";
import { QrDisplay } from "../../../src/presentation/components/brand/qr-display";
import { useSingleCampaign } from "../../../src/presentation/hooks/use-brand-campaigns";
import { useCampaignRealtime } from "../../../src/presentation/hooks/use-campaign-realtime";
import { TopStores } from "../../../src/presentation/components/brand/top-stores";
import {
  uploadReceipt,
  createUpfrontPayment,
  markCampaignReceiptUploaded,
  getSettlement,
} from "../../../src/application/payment/payment-service";
import type { SettlementSummary } from "../../../src/domain/payment";
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
import { Button } from "../../../src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_payment: "Esperando pago",
  receipt_uploaded: "Comprobante subido",
  active: "Activa",
  finished: "Finalizada",
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const campaignId = Array.isArray(id) ? id[0] : id;
  const { user, session, isReady } = useAuth();
  const { campaign, metrics, isLoading, error, refresh } =
    useSingleCampaign(campaignId);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [settlement, setSettlement] = useState<SettlementSummary | null>(null);

  // Live redemption counter via Realtime subscription
  const liveRedemptions = useCampaignRealtime(
    campaignId!,
    metrics?.totalRedemptions ?? 0,
  );

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  // Load settlement for finished campaigns
  useEffect(() => {
    if (campaign?.status === "finished") {
      getSettlement(campaignId!, {
        feeFixed: campaign.feeFixed,
        cpo: campaign.cpo,
      })
        .then(setSettlement)
        .catch(() => {});
    }
  }, [campaign?.status, campaign?.feeFixed, campaign?.cpo, campaignId]);

  async function handleReceiptUpload(file: File) {
    if (!campaignId || !campaign) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const receiptUrl = await uploadReceipt(campaignId, file);
      await createUpfrontPayment(
        campaignId,
        receiptUrl,
        campaign.feeFixed,
      );
      await markCampaignReceiptUploaded(campaignId);
      refresh();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Error al subir el comprobante",
      );
    } finally {
      setIsUploading(false);
    }
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
                    <BreadcrumbPage>
                      {campaign?.name ?? "Detalle"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Link
              href="/brand/dashboard"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Link>

            {isLoading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : error ? (
              <p className="text-rose-600">{error}</p>
            ) : !campaign ? (
              <p className="text-muted-foreground">Campaña no encontrada.</p>
            ) : (
              <div className="space-y-6">
                {/* Campaign header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">
                      {campaign.description}
                    </p>
                  </div>
                  <span className="inline-block rounded-full border px-3 py-1 text-sm font-medium">
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </div>

                {/* Campaign info grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Tiendas</p>
                    <p className="font-medium">
                      {campaign.storeTiers
                        .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                        .join(", ")}{" "}
                      — {campaign.neighborhood} ({campaign.radiusKm} km)
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Cupones</p>
                    <p className="font-medium">
                      {campaign.couponCount} cupones de ${campaign.discountValue}
                    </p>
                  </div>
                  <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Tarifas</p>
                    <p className="font-medium">
                      ${campaign.feeFixed} fee + ${campaign.cpo} CPO
                    </p>
                  </div>
                </div>

                {/* Metrics + leaderboard (active/finished only) */}
                {(campaign.status === "active" ||
                  campaign.status === "finished") &&
                  metrics && (
                    <>
                      <CampaignMetrics
                        campaign={campaign}
                        totalRedemptions={liveRedemptions}
                        distinctStores={metrics.distinctStores}
                        totalAmountSaved={metrics.totalAmountSaved}
                      />
                      <TopStores campaignId={campaignId!} />
                    </>
                  )}

                {/* Receipt upload (pending_payment only) */}
                {campaign.status === "pending_payment" && (
                  <div className="rounded-xl border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                      Subir comprobante de pago
                    </h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Subí el comprobante del pago inicial (50% = $
                      {(campaign.feeFixed * 0.5).toLocaleString("es-AR")}) para
                      que el administrador lo confirme.
                    </p>
                    {uploadError && (
                      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {uploadError}
                      </div>
                    )}
                    <ReceiptUpload
                      campaignId={campaignId!}
                      onUpload={handleReceiptUpload}
                      isUploading={isUploading}
                    />
                  </div>
                )}

                {/* Settlement (finished only) */}
                {settlement && (
                  <SettlementView
                    campaign={campaign}
                    settlement={settlement}
                  />
                )}

                {/* QR code (active only) */}
                <QrDisplay campaign={campaign} />
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </RoleGuard>
  );
}
