import { supabase } from "../auth/supabase-client";
import type {
  Campaign,
  CampaignStatus,
  Redemption,
} from "../../domain/campaign";

type DbCampaign = {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  store_tiers: string[];
  neighborhood: string;
  radius_km: number;
  min_stores: number;
  max_stores: number;
  coupon_prefix: string;
  coupon_count: number;
  discount_value: number;
  fee_fixed: number;
  cpo: number;
  start_date: string;
  end_date: string;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

/** Allowed transitions for campaign state machine */
const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["pending_payment"],
  pending_payment: ["receipt_uploaded"],
  receipt_uploaded: ["active", "pending_payment"],
  active: ["finished"],
  finished: [],
};

function toDomainCampaign(row: DbCampaign): Campaign {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    description: row.description,
    status: row.status,
    storeTiers: row.store_tiers as Array<"gold" | "plata" | "bronze">,
    neighborhood: row.neighborhood,
    radiusKm: row.radius_km,
    minStores: row.min_stores,
    maxStores: row.max_stores,
    couponPrefix: row.coupon_prefix,
    couponCount: row.coupon_count,
    discountValue: row.discount_value,
    feeFixed: row.fee_fixed,
    cpo: row.cpo,
    startDate: row.start_date,
    endDate: row.end_date,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

/**
 * Assert that a state transition is valid.
 * Throws if the transition is not allowed.
 */
function assertValidTransition(
  current: CampaignStatus,
  next: CampaignStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new Error(
      `Transición inválida: ${current} → ${next}. ` +
        `Las transiciones permitidas son: ${allowed?.join(", ") ?? "ninguna"}.`,
    );
  }
}

/**
 * Look up the brand_auth UUID using the authenticated user's email.
 * Returns null if not found.
 */
export async function getBrandIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("brand_auth")
    .select("id")
    .eq("email", email)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

/**
 * Create a new campaign with status `draft`.
 */
export async function createCampaign(
  brandId: string,
  input: {
    name: string;
    description: string;
    storeTiers: string[];
    neighborhood: string;
    radiusKm: number;
    minStores: number;
    maxStores: number;
    couponPrefix: string;
    couponCount: number;
    discountValue: number;
    feeFixed: number;
    cpo: number;
    endDate: string;
  },
): Promise<Campaign> {
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      brand_id: brandId,
      name: input.name,
      description: input.description,
      status: "draft",
      store_tiers: input.storeTiers,
      neighborhood: input.neighborhood,
      radius_km: input.radiusKm,
      min_stores: input.minStores,
      max_stores: input.maxStores,
      coupon_prefix: input.couponPrefix,
      coupon_count: input.couponCount,
      discount_value: input.discountValue,
      fee_fixed: input.feeFixed,
      cpo: input.cpo,
      end_date: input.endDate,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear la campaña: ${error.message}`);
  }

  return toDomainCampaign(data as DbCampaign);
}

/**
 * List all campaigns for a brand, ordered by creation date descending.
 */
export async function listCampaigns(brandId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error al listar campañas: ${error.message}`);
  }

  return (data ?? []).map((row) => toDomainCampaign(row as DbCampaign));
}

/**
 * Get a single campaign by ID.
 */
export async function getCampaignById(
  campaignId: string,
): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al obtener la campaña: ${error.message}`);
  }

  return data ? toDomainCampaign(data as DbCampaign) : null;
}

/**
 * Transition a campaign from `draft` → `pending_payment`.
 * The brand has completed the form and is submitting for payment.
 */
export async function submitCampaignForPayment(
  campaignId: string,
): Promise<void> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  assertValidTransition(campaign.status, "pending_payment");

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "pending_payment", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) {
    throw new Error(`Error al actualizar la campaña: ${error.message}`);
  }
}

/**
 * Transition a campaign from `active` → `finished`.
 * Admin sets manually.
 */
export async function finishCampaign(campaignId: string): Promise<void> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) throw new Error("Campaña no encontrada");

  assertValidTransition(campaign.status, "finished");

  const { error } = await supabase
    .from("campaigns")
    .update({ status: "finished", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) {
    throw new Error(`Error al finalizar la campaña: ${error.message}`);
  }
}

/**
 * Get redemption count and metrics for a campaign.
 */
export async function getCampaignMetrics(campaignId: string): Promise<{
  totalRedemptions: number;
  distinctStores: number;
  totalAmountSaved: number;
}> {
  const { data: redemptions, error } = await supabase
    .from("redemptions")
    .select("store_id, amount_saved")
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`Error al obtener métricas: ${error.message}`);
  }

  const totalRedemptions = redemptions?.length ?? 0;
  const distinctStores = new Set(
    (redemptions ?? []).map((r) => r.store_id),
  ).size;
  const totalAmountSaved =
    (redemptions ?? []).reduce(
      (sum, r) => sum + Number(r.amount_saved),
      0,
    );

  return { totalRedemptions, distinctStores, totalAmountSaved };
}

/**
 * Get the top N stores by redemption count for a campaign.
 */
export async function getTopStores(
  campaignId: string,
  limit = 10,
): Promise<Array<{ storeId: string; count: number }>> {
  const { data: redemptions, error } = await supabase
    .from("redemptions")
    .select("store_id")
    .eq("campaign_id", campaignId);

  if (error) {
    throw new Error(`Error al obtener stores: ${error.message}`);
  }

  const storeCounts = new Map<string, number>();
  for (const r of redemptions ?? []) {
    storeCounts.set(r.store_id, (storeCounts.get(r.store_id) ?? 0) + 1);
  }

  return [...storeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([storeId, count]) => ({ storeId, count }));
}
