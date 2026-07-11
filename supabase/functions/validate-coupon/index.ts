import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { coupon_code } = await req.json();

  if (!coupon_code || typeof coupon_code !== "string") {
    return new Response(
      JSON.stringify({ valid: false, error: "Cupón no encontrado" }),
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
      JSON.stringify({ valid: false, error: "Cupón no encontrado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 2. Check if already redeemed
  if (coupon.redeemed_at) {
    return new Response(
      JSON.stringify({ valid: false, error: "Cupón ya utilizado" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 3. Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("name, status, end_date")
    .eq("id", coupon.campaign_id)
    .single();

  if (campaignError || !campaign) {
    return new Response(
      JSON.stringify({ valid: false, error: "Campaña expirada" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 4. Verify campaign status is active
  if (campaign.status !== "active") {
    return new Response(
      JSON.stringify({ valid: false, error: "Campaña expirada" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 5. Verify campaign has not expired
  const now = new Date().toISOString();
  if (campaign.end_date < now) {
    return new Response(
      JSON.stringify({ valid: false, error: "Campaña expirada" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Valid — return coupon details
  return new Response(
    JSON.stringify({
      valid: true,
      coupon: {
        id: coupon.id,
        campaign_id: coupon.campaign_id,
        discount_value: coupon.discount_value,
        campaign_name: campaign.name,
      },
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
