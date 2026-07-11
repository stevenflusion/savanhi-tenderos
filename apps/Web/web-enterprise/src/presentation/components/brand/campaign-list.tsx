"use client";

import Link from "next/link";
import type { Campaign } from "../../../domain/campaign";

type CampaignListProps = {
  campaigns: Campaign[];
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_payment: "Esperando pago",
  receipt_uploaded: "Comprobante subido",
  active: "Activa",
  finished: "Finalizada",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending_payment: "bg-amber-100 text-amber-700",
  receipt_uploaded: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  finished: "bg-gray-100 text-gray-600",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl bg-muted/50 p-8 text-center">
        <p className="text-muted-foreground">
          No tenés campañas todavía. ¡Creá tu primera campaña!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((campaign) => (
        <Link
          key={campaign.id}
          href={`/brand/campaigns/${campaign.id}`}
          className="flex items-center justify-between rounded-xl border bg-card p-4 transition hover:shadow-sm hover:bg-accent/50"
        >
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground">
              {formatDate(campaign.startDate)} — {formatDate(campaign.endDate)}
            </p>
          </div>

          <div className="ml-4 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {campaign.couponCount} cupones
            </span>
            <span
              className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${STATUS_STYLES[campaign.status]}`}
            >
              {STATUS_LABELS[campaign.status]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
