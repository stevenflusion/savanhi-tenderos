"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../application/auth/supabase-client";

/**
 * Hook that subscribes to Realtime INSERT events on `redemptions`
 * for a specific campaign and returns the live redemption count.
 *
 * Pattern: one channel per campaign — unsubscribe on unmount.
 *
 * @param campaignId - The campaign to subscribe to
 * @param initialCount - Initial redemption count from server fetch
 * @returns Live redemption count that updates in real time
 */
export function useCampaignRealtime(
  campaignId: string,
  initialCount: number,
): number {
  const [count, setCount] = useState<number>(initialCount);
  const synced = useRef(false);

  // Sync initial value when it changes (e.g., first load or refresh)
  useEffect(() => {
    if (!synced.current) {
      setCount(initialCount);
      synced.current = true;
    }
  }, [initialCount]);

  useEffect(() => {
    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "redemptions",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => {
          setCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return count;
}
