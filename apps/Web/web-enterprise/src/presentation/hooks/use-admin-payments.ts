"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../application/auth/supabase-client";
import {
  confirmPayment,
  rejectPayment,
} from "../../application/payment/payment-service";
import type { Campaign } from "../../domain/campaign";

export type AdminPayment = {
  campaignId: string;
  campaignName: string;
  brandName: string;
  status: Campaign["status"];
  receiptUrl: string | null;
  paymentId: string;
  paymentCreatedAt: string;
  updatedAt: string;
  rejectionReason: string | null;
  couponPrefix: string;
  couponCount: number;
  discountValue: number;
};

type UseAdminPaymentsReturn = {
  payments: AdminPayment[];
  isLoading: boolean;
  error: string | null;
  confirm: (campaignId: string) => Promise<boolean>;
  reject: (campaignId: string, reason: string) => Promise<boolean>;
  refresh: () => void;
  actionFeedback: { campaignId: string; type: "confirming" | "confirm-error" | "confirm-success" | "rejecting" | "reject-error" | "reject-success"; message?: string } | null;
  clearFeedback: () => void;
};

/**
 * Hook to manage pending payments for admin.
 * Lists campaigns with receipt_uploaded status and provides confirm/reject actions.
 */
export function useAdminPayments(): UseAdminPaymentsReturn {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<UseAdminPaymentsReturn["actionFeedback"]>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    supabase
      .from("campaigns")
      .select(
        `
        id,
        name,
        status,
        updated_at,
        created_at,
        coupon_prefix,
        coupon_count,
        discount_value,
        brand_id,
        brand_auth!inner(brand_name),
        campaign_payments(id, receipt_url, status, created_at, rejection_reason)
      `,
      )
      .eq("status", "receipt_uploaded")
      .order("updated_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
          setIsLoading(false);
          return;
        }

        const mapped: AdminPayment[] = (data ?? []).map((row: Record<string, unknown>) => {
          const brandAuth = row.brand_auth as { brand_name: string } | { brand_name: string }[];
          const brandName = Array.isArray(brandAuth)
            ? brandAuth[0]?.brand_name ?? "—"
            : (brandAuth as { brand_name: string }).brand_name ?? "—";

          const payments = row.campaign_payments as
            | Array<{ id: string; receipt_url: string | null; status: string; created_at: string; rejection_reason: string | null }>
            | undefined;

          const payment = Array.isArray(payments) ? payments[0] : undefined;

          return {
            campaignId: row.id as string,
            campaignName: row.name as string,
            brandName,
            status: row.status as Campaign["status"],
            receiptUrl: payment?.receipt_url ?? null,
            paymentId: payment?.id ?? "",
            paymentCreatedAt: payment?.created_at ?? (row.created_at as string),
            updatedAt: row.updated_at as string,
            rejectionReason: payment?.rejection_reason ?? null,
            couponPrefix: row.coupon_prefix as string,
            couponCount: row.coupon_count as number,
            discountValue: row.discount_value as number,
          };
        });

        setPayments(mapped);
        setIsLoading(false);
      });
  }, [refreshKey]);

  const confirm = useCallback(async (campaignId: string): Promise<boolean> => {
    const payment = payments.find((p) => p.campaignId === campaignId);
    if (!payment) return false;

    setActionFeedback({ campaignId, type: "confirming" });

    try {
      await confirmPayment(campaignId, {
        couponPrefix: payment.couponPrefix,
        couponCount: payment.couponCount,
        discountValue: payment.discountValue,
      });
      setActionFeedback({ campaignId, type: "confirm-success" });
      setRefreshKey((k) => k + 1);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al confirmar";
      setActionFeedback({ campaignId, type: "confirm-error", message });
      return false;
    }
  }, [payments]);

  const reject = useCallback(
    async (campaignId: string, reason: string): Promise<boolean> => {
      setActionFeedback({ campaignId, type: "rejecting" });

      try {
        await rejectPayment(campaignId, reason);
        setActionFeedback({ campaignId, type: "reject-success" });
        setRefreshKey((k) => k + 1);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al rechazar";
        setActionFeedback({ campaignId, type: "reject-error", message });
        return false;
      }
    },
    [],
  );

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const clearFeedback = useCallback(() => {
    setActionFeedback(null);
  }, []);

  return {
    payments,
    isLoading,
    error,
    confirm,
    reject,
    refresh,
    actionFeedback,
    clearFeedback,
  };
}
