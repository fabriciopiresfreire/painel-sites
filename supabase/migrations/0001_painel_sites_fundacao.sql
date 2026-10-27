-- Painel de Sites: tabela central de sites (landing pages).
-- Crie um projeto no Supabase e aplique estas migrations.

create table if not exists public.painel_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  template text not null default 'basico',
  config jsonb not null default '{}'::jsonb,
  slug text not null unique,
  custom_domain text unique,
  status text not null default 'rascunho'
    check (status in ('rascunho','publicado','dominio_pendente','ativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists painel_sites_user_id_idx on public.painel_sites(user_id);
create index if not exists painel_sites_custom_domain_idx on public.painel_sites(custom_domain);

alter table public.painel_sites enable row level security;

-- Cada usuário só enxerga e mexe nos próprios sites.
create policy "painel_sites_select_own" on public.painel_sites
  for select using (auth.uid() = user_id);
create policy "painel_sites_insert_own" on public.painel_sites
  for insert with check (auth.uid() = user_id);
create policy "painel_sites_update_own" on public.painel_sites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "painel_sites_delete_own" on public.painel_sites
  for delete using (auth.uid() = user_id);

-- Mantém updated_at em dia.
create or replace function public.painel_sites_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists painel_sites_set_updated_at on public.painel_sites;
create trigger painel_sites_set_updated_at
  before update on public.painel_sites
  for each row execute function public.painel_sites_touch_updated_at();
