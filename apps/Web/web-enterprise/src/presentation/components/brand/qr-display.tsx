"use client";

import { QRCodeSVG } from "qrcode.react";
import type { Campaign } from "../../../domain/campaign";

type QrDisplayProps = {
  campaign: Campaign;
};

/**
 * Renders a QR code that encodes a deep link or coupon validation URL.
 * The QR is rendered client-side (no storage needed).
 * For MVP, it encodes a placeholder URL. In production this would point
 * to the validate-coupon Edge Function.
 */
export function QrDisplay({ campaign }: QrDisplayProps) {
  if (campaign.status !== "active") return null;

  // Placeholder URL — in production this would be the Edge Function endpoint
  const qrValue = `${typeof window !== "undefined" ? window.location.origin : ""}/api/validate-coupon?campaign=${campaign.id}`;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Código QR de campaña</h3>
      <p className="text-sm text-muted-foreground">
        Escaneá este QR para validar cupones de {campaign.name}.
      </p>
      <div className="inline-block rounded-xl border bg-white p-4">
        <QRCodeSVG
          value={qrValue}
          size={180}
          level="M"
          includeMargin
        />
      </div>
    </div>
  );
}
