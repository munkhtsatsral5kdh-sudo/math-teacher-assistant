-- Анги, сурагч, даалгавар, дүн нэг баримтаар хадгалагдана.
-- Supabase SQL Editor дээр энэ файлыг ажиллуулна.

create table if not exists public.app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "classroom read app_state" on public.app_state;
drop policy if exists "classroom write app_state" on public.app_state;

create policy "classroom read app_state"
  on public.app_state for select
  to anon, authenticated
  using (true);

create policy "classroom write app_state"
  on public.app_state for insert
  to anon, authenticated
  with check (true);

create policy "classroom update app_state"
  on public.app_state for update
  to anon, authenticated
  using (true)
  with check (true);
