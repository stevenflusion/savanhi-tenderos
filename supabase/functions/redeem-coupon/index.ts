import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { coupon_code, store_id, amount_saved } = await req.json();

  // Validate required fields
  if (!coupon_code || typeof coupon_code !== "string") {
    return new Response(
      JSON.stringify({ success: false, error: "Código de cupón requerido" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (!store_id || typeof store_id !== "string") {
    return new Response(
      JSON.stringify({ success: false, error: "ID de tienda requerido" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Find coupon by code
  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("id, campaign_id, discount_value, redeemed_at")
    .eq("code", coupon_code)
    .single();

  if (couponError || !coupon) {
    return new Response(
      JSON.stringify({ success: false, error: "Cupón no encontrado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Check if already redeemed
  if (coupon.redeemed_at) {
    return new Response(
      JSON.stringify({ success: false, error: "Cupón ya utilizado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Validate campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("status, end_date")
    .eq("id", coupon.campaign_id)
    .single();

  if (campaignError || !campaign) {
    return new Response(
      JSON.stringify({ success: false, error: "Campaña no activa" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (campaign.status !== "active") {
    return new Response(
      JSON.stringify({ success: false, error: "Campaña no activa" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const now = new Date().toISOString();
  if (campaign.end_date < now) {
    return new Response(
      JSON.stringify({ success: false, error: "Cupón expirado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. Atomically mark coupon as redeemed
  // WHERE redeemed_at IS NULL acts as an optimistic lock — only the
  // first concurrent request succeeds, preventing double-redemption.
  const redeemedAt = new Date().toISOString();
  const { data: updatedCoupon, error: updateError } = await supabase
    .from("coupons")
    .update({
      redeemed_at: redeemedAt,
      redeemed_by_store_id: store_id,
    })
    .eq("id", coupon.id)
    .is("redeemed_at", null)
    .select()
    .single();

  if (updateError || !updatedCoupon) {
    return new Response(
      JSON.stringify({ success: false, error: "Cupón ya utilizado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. Insert redemption record
  const { data: redemption, error: insertError } = await supabase
    .from("redemptions")
    .insert({
      coupon_id: coupon.id,
      campaign_id: coupon.campaign_id,
      store_id: store_id,
      amount_saved: amount_saved ?? 0,
    })
    .select("id")
    .single();

  if (insertError || !redemption) {
    // Partial failure: coupon is marked redeemed but redemption INSERT failed.
    // The coupon remains marked to prevent double-spend — admin manual recovery
    // is required to reconcile the missing redemption record.
    return new Response(
      JSON.stringify({ success: false, error: "Error al registrar redención" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ success: true, redemption_id: redemption.id }),
    { headers: { "Content-Type": "application/json" } },
  );
});
