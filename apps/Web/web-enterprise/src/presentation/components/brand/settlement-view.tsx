"use client";

import type { Campaign } from "../../../domain/campaign";
import type { SettlementSummary } from "../../../domain/payment";

type SettlementViewProps = {
  campaign: Campaign;
  settlement: SettlementSummary;
};

export function SettlementView({ campaign, settlement }: SettlementViewProps) {
  if (campaign.status !== "finished") return null;

  const totalFee = Number(campaign.feeFixed);
  const totalCost = totalFee + settlement.totalCpo;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Liquidación final</h3>

      <div className="rounded-xl border bg-card">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Canjes totales</td>
              <td className="px-4 py-3 text-right font-medium">
                {settlement.totalRedemptions}
              </td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Fee fijo total</td>
              <td className="px-4 py-3 text-right font-medium">
                ${totalFee.toLocaleString("es-AR")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">Pagado (50% upfront)</td>
              <td className="px-4 py-3 text-right font-medium text-emerald-600">
                -${settlement.feePaid.toLocaleString("es-AR")}
              </td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-3 text-muted-foreground">
                CPO ({campaign.cpo} × {settlement.totalRedemptions})
              </td>
              <td className="px-4 py-3 text-right font-medium">
                ${settlement.totalCpo.toLocaleString("es-AR")}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold">Saldo pendiente</td>
              <td className="px-4 py-3 text-right font-bold text-lg">
                ${settlement.totalDue.toLocaleString("es-AR")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        * El saldo pendiente incluye el 50% restante del fee fijo más el CPO × canjes reales.
      </p>
    </div>
  );
}
