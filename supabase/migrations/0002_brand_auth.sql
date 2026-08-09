-- Migration: brand_auth mapping table
-- Links SavanhID to email + role for brand authentication

create table if not exists public.brand_auth (
  id uuid primary key default gen_random_uuid(),
  savanhi_id text unique not null,
  email text unique not null,
  brand_name text not null,
  role text not null default 'marca' check (role in ('marca')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists brand_auth_savanhi_id_idx on public.brand_auth(savanhi_id);
create unique index if not exists brand_auth_email_idx on public.brand_auth(email);

alter table public.brand_auth enable row level security;

create policy "brand_auth_select_authenticated" on public.brand_auth
  for select
  to authenticated
  using (true);
