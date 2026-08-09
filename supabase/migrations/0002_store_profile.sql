alter table public.stores
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists payment_method text check (payment_method in ('efectivo', 'pichincha')),
  add column if not exists bank_account_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_type text check (bank_account_type in ('ahorro', 'corriente'));
