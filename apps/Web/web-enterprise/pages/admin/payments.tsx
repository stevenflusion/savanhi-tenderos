"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../src/presentation/components/auth/auth-provider";
import { AdminGuard } from "../../src/presentation/components/auth/admin-guard";
import { AppSidebar } from "../../src/components/app-sidebar";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
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
import { useAdminPayments } from "../../src/presentation/hooks/use-admin-payments";
import { useRouter } from "next/router";
import {
  CheckCircle,
  XCircle,
  Eye,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const { user, session, isReady } = useAuth();
  const {
    payments,
    isLoading,
    error,
    confirm,
    reject,
    actionFeedback,
    clearFeedback,
  } = useAdminPayments();
  const [rejectModal, setRejectModal] = useState<{
    campaignId: string;
    campaignName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && (!session || !user)) {
      router.replace("/");
    }
  }, [isReady, session, user, router]);

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getFeedbackText(
    fb: NonNullable<typeof actionFeedback>,
  ): string | null {
    if (fb.type === "confirming") return "Confirmando...";
    if (fb.type === "confirm-error") return fb.message ?? "Error al confirmar";
    if (fb.type === "confirm-success") return "✅ Pago confirmado";
    if (fb.type === "rejecting") return "Rechazando...";
    if (fb.type === "reject-error") return fb.message ?? "Error al rechazar";
    if (fb.type === "reject-success") return "✅ Pago rechazado";
    return null;
  }

  function isProcessing(campaignId: string): boolean {
    return (
      actionFeedback?.campaignId === campaignId &&
      (actionFeedback.type === "confirming" ||
        actionFeedback.type === "rejecting")
    );
  }

  async function handleConfirm(campaignId: string) {
    if (isProcessing(campaignId)) return;
    const ok = await confirm(campaignId);
    if (ok) {
      setTimeout(() => clearFeedback(), 3000);
    }
  }

  function openReject(campaignId: string, campaignName: string) {
    setRejectModal({ campaignId, campaignName });
    setRejectReason("");
  }

  async function handleReject() {
    if (!rejectModal || !rejectReason.trim() || isProcessing(rejectModal.campaignId)) return;

    const ok = await reject(rejectModal.campaignId, rejectReason.trim());
    setRejectModal(null);
    setRejectReason("");
    if (ok) {
      setTimeout(() => clearFeedback(), 3000);
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
                    <BreadcrumbPage>Pagos pendientes</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="rounded-xl bg-muted/50 p-6">
              <h1 className="mb-6 text-xl font-semibold">
                Pagos pendientes
              </h1>

              {isLoading ? (
                <p className="text-muted-foreground">
                  Cargando pagos pendientes...
                </p>
              ) : error ? (
                <p className="text-rose-600">{error}</p>
              ) : payments.length === 0 ? (
                <p className="text-muted-foreground">
                  No hay pagos pendientes
                </p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.campaignId}
                      className="rounded-lg border bg-card p-4 transition-colors"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        {/* Info */}
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium">
                            {payment.campaignName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Marca: {payment.brandName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Recibido:{" "}
                            {formatDate(payment.paymentCreatedAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Receipt preview button */}
                          {payment.receiptUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setReceiptPreview(payment.receiptUrl)
                              }
                            >
                              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                              Ver comprobante
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sin comprobante
                            </span>
                          )}

                          <Button
                            variant="default"
                            size="sm"
                            disabled={isProcessing(payment.campaignId)}
                            onClick={() => handleConfirm(payment.campaignId)}
                          >
                            {isProcessing(payment.campaignId) &&
                            actionFeedback?.type === "confirming" ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Confirmar
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isProcessing(payment.campaignId)}
                            onClick={() =>
                              openReject(
                                payment.campaignId,
                                payment.campaignName,
                              )
                            }
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            Rechazar
                          </Button>
                        </div>
                      </div>

                      {/* Action feedback */}
                      {actionFeedback?.campaignId === payment.campaignId && (
                        <p
                          className={`mt-2 text-sm ${
                            actionFeedback.type.includes("error")
                              ? "text-rose-600"
                              : actionFeedback.type.includes("success")
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                          }`}
                        >
                          {getFeedbackText(actionFeedback)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Receipt preview modal */}
      {receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setReceiptPreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-2 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-white/80 dark:bg-gray-900/80"
              onClick={() => setReceiptPreview(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptPreview}
              alt="Comprobante de pago"
              className="max-h-[80vh] w-auto rounded"
            />
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            if (!isProcessing(rejectModal.campaignId)) {
              setRejectModal(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-lg font-semibold">
              Rechazar pago
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Campaña: <strong>{rejectModal.campaignName}</strong>
            </p>
            <p className="mb-2 text-sm font-medium">
              Motivo del rechazo
            </p>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: Comprobante ilegible, monto incorrecto..."
              disabled={isProcessing(rejectModal.campaignId)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModal(null)}
                disabled={isProcessing(rejectModal.campaignId)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={
                  !rejectReason.trim() ||
                  isProcessing(rejectModal.campaignId)
                }
                onClick={handleReject}
              >
                {isProcessing(rejectModal.campaignId) ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Rechazando...
                  </>
                ) : (
                  "Rechazar pago"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
