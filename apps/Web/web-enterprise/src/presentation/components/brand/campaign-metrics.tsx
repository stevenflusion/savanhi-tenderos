"use client";

import type { Campaign } from "../../../domain/campaign";

type CampaignMetricsProps = {
  campaign: Campaign;
  totalRedemptions: number;
  distinctStores: number;
  totalAmountSaved: number;
};

export function CampaignMetrics({
  campaign,
  totalRedemptions,
  distinctStores,
  totalAmountSaved,
}: CampaignMetricsProps) {
  // Only show metrics for active/finished campaigns
  if (campaign.status !== "active" && campaign.status !== "finished") {
    return null;
  }

  const redemptionRate =
    campaign.couponCount > 0
      ? ((totalRedemptions / campaign.couponCount) * 100).toFixed(1)
      : "0.0";

  const budgetExecuted = Number(campaign.cpo) * totalRedemptions;

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Cupones emitidos</p>
        <p className="text-2xl font-bold">{campaign.couponCount}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Canjes</p>
        <p className="text-2xl font-bold">{totalRedemptions}</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Tasa de canje</p>
        <p className="text-2xl font-bold">{redemptionRate}%</p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Presupuesto ejecutado</p>
        <p className="text-2xl font-bold">
          ${budgetExecuted.toLocaleString("es-AR")}
        </p>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Tiendas activas</p>
        <p className="text-2xl font-bold">{distinctStores}</p>
      </div>
    </div>
  );
}
