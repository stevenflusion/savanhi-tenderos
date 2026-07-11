import { supabase } from "../auth/supabase-client";
import type { Campaign } from "../../domain/campaign";
import type { SettlementSummary } from "../../domain/payment";

/**
 * Upload a payment receipt to Supabase Storage for a campaign.
 * The file is stored under `payment-receipts/{campaign_id}/{filename}`.
 * Returns the public URL of the uploaded file.
 */
export async function uploadReceipt(
  campaignId: string,
  file: File,
): Promise<string> {
  // Validate file type
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Formato de archivo no válido");
  }

  const filePath = `${campaignId}/${crypto.randomUUID()}-${file.name}`;
  const bucket = "payment-receipts";

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir el comprobante: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Create a payment record for the upfront fee (50% of fee_fixed).
 * Called when the brand uploads a receipt.
 */
export async function createUpfrontPayment(
  campaignId: string,
  receiptUrl: string,
  feeFixed: number,
): Promise<void> {
  const upfrontAmount = feeFixed * 0.5;

  const { error } = await supabase.from("campaign_payments").insert({
    campaign_id: campaignId,
    type: "upfront",
    amount: upfrontAmount,
    status: "pending",
    receipt_url: receiptUrl,
  });

  if (error) {
    throw new Error(`Error al registrar el pago: ${error.message}`);
  }
}

/**
 * Transition campaign to `receipt_uploaded` status.
 * Must be called after the receipt is uploaded and payment record is created.
 */
export async function markCampaignReceiptUploaded(
  campaignId: string,
): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .update({
      status: "receipt_uploaded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "pending_payment");

  if (error) {
    throw new Error(`Error al actualizar la campaña: ${error.message}`);
  }
}

/**
 * Admin confirms a payment:
 * 1. Updates the payment record status to `confirmed`
 * 2. Calls the `bulk_insert_coupons` RPC to generate coupons
 * 3. Transitions campaign to `active`
 */
export async function confirmPayment(
  campaignId: string,
  campaign: Pick<
    Campaign,
    "couponPrefix" | "couponCount" | "discountValue"
  >,
): Promise<void> {
  // Update payment record
  const { error: paymentError } = await supabase
    .from("campaign_payments")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("campaign_id", campaignId)
    .eq("type", "upfront");

  if (paymentError) {
    throw new Error(
      `Error al confirmar el pago: ${paymentError.message}`,
    );
  }

  // Bulk-insert coupons via RPC
  const { error: rpcError } = await supabase.rpc("bulk_insert_coupons", {
    p_campaign_id: campaignId,
    p_prefix: campaign.couponPrefix,
    p_count: campaign.couponCount,
    p_discount_value: campaign.discountValue,
  });

  if (rpcError) {
    throw new Error(
      `Error al generar los cupones: ${rpcError.message}`,
    );
  }

  // Transition campaign to active
  const { error: campaignError } = await supabase
    .from("campaigns")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "receipt_uploaded");

  if (campaignError) {
    throw new Error(
      `Error al activar la campaña: ${campaignError.message}`,
    );
  }
}

/**
 * Admin rejects a payment:
 * 1. Updates payment status to `rejected`
 * 2. Transitions campaign back to `pending_payment` with reason
 */
export async function rejectPayment(
  campaignId: string,
  reason: string,
): Promise<void> {
  // Update payment record
  const { error: paymentError } = await supabase
    .from("campaign_payments")
    .update({
      status: "rejected",
      rejection_reason: reason,
    })
    .eq("campaign_id", campaignId)
    .eq("type", "upfront");

  if (paymentError) {
    throw new Error(
      `Error al rechazar el pago: ${paymentError.message}`,
    );
  }

  // Return campaign to pending_payment
  const { error: campaignError } = await supabase
    .from("campaigns")
    .update({
      status: "pending_payment",
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .eq("status", "receipt_uploaded");

  if (campaignError) {
    throw new Error(
      `Error al revertir la campaña: ${campaignError.message}`,
    );
  }
}

/**
 * Calculate the settlement summary for a finished campaign.
 *
 * Fee model (hybrid):
 * - Upfront: 50% of fee_fixed (paid at campaign start)
 * - Settlement: remaining 50% + (CPO × actual redemptions)
 */
export async function getSettlement(
  campaignId: string,
  campaign: Pick<Campaign, "feeFixed" | "cpo">,
): Promise<SettlementSummary> {
  const { data: redemptions, error } = await supabase
    .from("redemptions")
    .select("id, amount_saved")
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`Error al obtener canjes: ${error.message}`);
  }

  const totalRedemptions = redemptions?.length ?? 0;
  const feeFixed = Number(campaign.feeFixed);
  const cpo = Number(campaign.cpo);

  const upfrontPaid = feeFixed * 0.5;
  const remainingFixed = feeFixed - upfrontPaid;
  const totalCpo = cpo * totalRedemptions;
  const totalDue = remainingFixed + totalCpo;

  return {
    totalRedemptions,
    redemptionRate: 0, // needs total coupon count — set from campaign detail
    cpoReal: cpo,
    feePaid: upfrontPaid,
    feeRemaining: remainingFixed,
    totalCpo,
    totalDue,
  };
}
