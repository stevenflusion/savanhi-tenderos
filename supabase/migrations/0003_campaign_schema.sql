-- Migration: Campaign, Coupon, Payment schema for Brand Panel
-- Adds campaign management, coupon codes, payments, and redemptions

-- Campaign status enum
do $$ begin
  create type campaign_status as enum (
    'draft', 'pending_payment', 'receipt_uploaded', 'active', 'finished'
  );
exception
  when duplicate_object then null;
end $$;

-- Campaigns table
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brand_auth(id) on delete cascade,
  name text not null,
  description text not null default '',
  status campaign_status not null default 'draft',
  store_tiers text[] not null default '{}'::text[],
  neighborhood text not null default '',
  radius_km numeric(6,2) not null default 0,
  min_stores integer not null default 1,
  max_stores integer not null default 10,
  coupon_prefix text not null default 'SAV',
  coupon_count integer not null default 100,
  discount_value numeric(10,2) not null default 0,
  fee_fixed numeric(10,2) not null default 0,
  cpo numeric(10,2) not null default 0,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint campaigns_status_check check (
    status in ('draft', 'pending_payment', 'receipt_uploaded', 'active', 'finished')
  ),
  constraint campaigns_coupon_count_check check (coupon_count > 0),
  constraint campaigns_discount_value_check check (discount_value >= 0),
  constraint campaigns_fee_fixed_check check (fee_fixed >= 0),
  constraint campaigns_cpo_check check (cpo >= 0),
  constraint campaigns_min_max_stores_check check (min_stores <= max_stores),
  constraint campaigns_end_date_check check (end_date > start_date)
);

-- Coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  code text unique not null,
  discount_value numeric(10,2) not null default 0,
  redeemed_at timestamptz,
  redeemed_by_store_id uuid references public.stores(id),
  created_at timestamptz not null default now(),

  constraint coupons_code_format check (code ~ '^[A-Z0-9]+-[A-Z0-9]{8}$')
);

-- Redemptions table
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  store_id uuid not null references public.stores(id),
  redeemed_at timestamptz not null default now(),
  amount_saved numeric(10,2) not null default 0
);

-- Campaign payments table
create table if not exists public.campaign_payments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  type text not null check (type in ('upfront', 'settlement')),
  amount numeric(10,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  receipt_url text,
  rejection_reason text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists campaigns_brand_id_idx on public.campaigns(brand_id);
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists coupons_campaign_id_idx on public.coupons(campaign_id);
create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists redemptions_campaign_id_idx on public.redemptions(campaign_id);
create index if not exists redemptions_store_id_idx on public.redemptions(store_id);
create index if not exists campaign_payments_campaign_id_idx on public.campaign_payments(campaign_id);

-- Enable RLS
alter table public.campaigns enable row level security;
alter table public.coupons enable row level security;
alter table public.redemptions enable row level security;
alter table public.campaign_payments enable row level security;

-- RLS policies: brands can CRUD their own campaigns
create policy "brands_select_own_campaigns" on public.campaigns
  for select
  to authenticated
  using (brand_id in (
    select id from public.brand_auth where email = auth.email()
  ));

create policy "brands_insert_own_campaigns" on public.campaigns
  for insert
  to authenticated
  with check (brand_id in (
    select id from public.brand_auth where email = auth.email()
  ));

create policy "brands_update_own_campaigns" on public.campaigns
  for update
  to authenticated
  using (brand_id in (
    select id from public.brand_auth where email = auth.email()
  ));

-- RLS policies: brands can select coupons for their campaigns
create policy "brands_select_own_coupons" on public.coupons
  for select
  to authenticated
  using (campaign_id in (
    select id from public.campaigns
    where brand_id in (
      select id from public.brand_auth where email = auth.email()
    )
  ));

-- RLS policies: brands can select redemptions for their campaigns
create policy "brands_select_own_redemptions" on public.redemptions
  for select
  to authenticated
  using (campaign_id in (
    select id from public.campaigns
    where brand_id in (
      select id from public.brand_auth where email = auth.email()
    )
  ));

-- RLS policies: brands can select payments for their campaigns
create policy "brands_select_own_payments" on public.campaign_payments
  for select
  to authenticated
  using (campaign_id in (
    select id from public.campaigns
    where brand_id in (
      select id from public.brand_auth where email = auth.email()
    )
  ));

-- Admin sees all
create policy "admin_select_all_campaigns" on public.campaigns
  for select
  to authenticated
  using (true);

create policy "admin_insert_campaigns" on public.campaigns
  for insert
  to authenticated
  with check (true);

create policy "admin_update_campaigns" on public.campaigns
  for update
  to authenticated
  using (true);

create policy "admin_select_all_coupons" on public.coupons
  for select
  to authenticated
  using (true);

create policy "admin_insert_coupons" on public.coupons
  for insert
  to authenticated
  with check (true);

create policy "admin_select_all_redemptions" on public.redemptions
  for select
  to authenticated
  using (true);

create policy "admin_select_all_payments" on public.campaign_payments
  for select
  to authenticated
  using (true);

create policy "admin_insert_payments" on public.campaign_payments
  for insert
  to authenticated
  with check (true);

create policy "admin_update_payments" on public.campaign_payments
  for update
  to authenticated
  using (true);

-- Function: bulk insert coupons atomically
-- Called when admin confirms payment (campaign → active)
create or replace function public.bulk_insert_coupons(
  p_campaign_id uuid,
  p_prefix text,
  p_count integer,
  p_discount_value numeric
)
returns table(
  inserted_id uuid,
  inserted_code text
)
language plpgsql
security definer
as $$
declare
  v_code text;
  v_chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_char_len int := length(v_chars);
  v_i int;
  v_attempts int;
  v_max_attempts constant int := 20;
begin
  for v_i in 1..p_count loop
    v_attempts := 0;

    loop
      v_attempts := v_attempts + 1;

      -- Generate 8-char code
      v_code := '';
      for v_j in 1..8 loop
        v_code := v_code || substr(v_chars, floor(random() * v_char_len + 1)::int, 1);
      end loop;

      v_code := p_prefix || '-' || v_code;

      -- Check uniqueness
      begin
        insert into public.coupons (campaign_id, code, discount_value)
        values (p_campaign_id, v_code, p_discount_value)
        returning id, code into inserted_id, inserted_code;

        -- Success — return the row and exit the loop
        return query select inserted_id, inserted_code;
        exit;
      exception
        when unique_violation then
          if v_attempts >= v_max_attempts then
            raise exception 'Failed to generate unique coupon code after % attempts', v_max_attempts;
          end if;
          -- retry with new code
      end;
    end loop;
  end loop;
end;
$$;
