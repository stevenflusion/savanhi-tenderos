"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../application/auth/supabase-client";

/**
 * Hook that subscribes to Realtime changes on campaign_payments
 * and returns the live count of pending payments.
 *
 * Used by the admin sidebar to show a badge on "Pagos Pendientes".
 */
export function usePendingPaymentsCount(): number {
  const [count, setCount] = useState<number>(0);
  const initialized = useRef(false);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("campaign_payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count: pendingCount }) => {
        if (pendingCount != null) {
          setCount(pendingCount);
        }
        initialized.current = true;
      });

    // Realtime subscription: listen for INSERT of pending payments
    const channel = supabase
      .channel("sidebar-pending-payments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campaign_payments",
          filter: "status=eq.pending",
        },
        () => {
          setCount((c) => c + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaign_payments",
        },
        () => {
          // Refetch to get accurate count (a payment may have been confirmed/rejected)
          supabase
            .from("campaign_payments")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .then(({ count: pendingCount }) => {
              if (pendingCount != null) setCount(pendingCount);
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
