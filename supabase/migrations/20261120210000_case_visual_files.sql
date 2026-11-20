-- Private, generated visual assets for existing Mind Maze cases.
create table if not exists public.case_visual_jobs (
  game_id uuid primary key references public.games(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'complete', 'partial', 'failed')),
  error_message text,
  updated_at timestamptz not null default now()
);

create table if not exists public.case_visual_assets (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  asset_key text not null,
  asset_type text not null check (asset_type in ('crime_scene', 'evidence', 'suspect')),
  related_id text,
  name text not null,
  description text not null,
  case_connection text,
  discovered_initially boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  storage_path text,
  mime_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_visual_assets_game_key_unique unique (game_id, asset_key)
);

create index if not exists idx_case_visual_assets_game_order
  on public.case_visual_assets (game_id, sort_order);

create or replace function public.claim_case_visual_job(p_game_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_rows integer;
begin
  insert into public.case_visual_jobs (game_id, status, error_message, updated_at)
  values (p_game_id, 'processing', null, now())
  on conflict (game_id) do update
    set status = 'processing', error_message = null, updated_at = now()
    where public.case_visual_jobs.status <> 'processing';
  get diagnostics claimed_rows = row_count;
  return claimed_rows = 1;
end;
$$;
revoke all on function public.claim_case_visual_job(uuid) from public, anon, authenticated;
grant execute on function public.claim_case_visual_job(uuid) to service_role;

alter table public.case_visual_jobs enable row level security;
alter table public.case_visual_assets enable row level security;
grant all on table public.case_visual_jobs, public.case_visual_assets to service_role;
-- Access is intentionally server-only: the app uses its own JWT auth and the
-- service role. Backend ownership checks precede issuing expiring signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('case-visuals', 'case-visuals', false, 8388608, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];
