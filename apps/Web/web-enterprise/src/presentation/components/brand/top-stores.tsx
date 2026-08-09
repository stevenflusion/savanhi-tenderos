"use client";

import { useState, useEffect } from "react";
import { getTopStores } from "../../../application/campaign/campaign-service";
import { Crown } from "lucide-react";

type TopStoresProps = {
  campaignId: string;
};

type StoreEntry = {
  storeId: string;
  count: number;
};

/**
 * Displays the top 10 stores by redemption count for a campaign.
 *
 * Fetches data from the server on mount via getTopStores().
 * Shows a numbered leaderboard with redemption counts.
 */
export function TopStores({ campaignId }: TopStoresProps) {
  const [stores, setStores] = useState<StoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    getTopStores(campaignId)
      .then((data) => {
        setStores(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [campaignId]);

  if (isLoading) return null;
  if (stores.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">Top 10 Tiendas</h3>
      <div className="space-y-2">
        {stores.map((store, index) => (
          <div
            key={store.storeId}
            className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="text-sm font-medium">
                {index === 0 && (
                  <Crown className="mr-1 inline h-4 w-4 text-amber-500" />
                )}
                Tienda {store.storeId.slice(0, 8)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {store.count} canje{store.count !== 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
