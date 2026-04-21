-- =============================================================================
-- Market Magnate social core schema (profiles/stats/presence/leaderboard view)
-- Run this in Supabase SQL editor before leaderboard_public_rpc.sql.
-- =============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  favorite_stock text,
  profile_theme text default 'default',
  avatar_url text default '💹',
  banner_url text default 'default_banner',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  net_worth numeric not null default 0,
  cash numeric not null default 0,
  total_profit numeric not null default 0,
  lifetime_trades bigint not null default 0,
  highest_net_worth numeric not null default 0,
  prestige bigint not null default 0,
  xp bigint not null default 0,
  empire_tier text not null default 'Bedroom Trader',
  avatar_dna jsonb,
  last_seen timestamptz,
  last_active timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.online_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));
create index if not exists player_stats_net_idx on public.player_stats (net_worth desc);
create index if not exists player_stats_updated_idx on public.player_stats (updated_at desc);
create index if not exists online_presence_seen_idx on public.online_presence (last_seen desc);

alter table public.profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.online_presence enable row level security;

drop policy if exists "profiles_select_public_or_self" on public.profiles;
create policy "profiles_select_public_or_self"
on public.profiles for select
using (coalesce(is_public, true) = true or auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "player_stats_select_all" on public.player_stats;
create policy "player_stats_select_all"
on public.player_stats for select
using (true);

drop policy if exists "player_stats_insert_self" on public.player_stats;
create policy "player_stats_insert_self"
on public.player_stats for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "player_stats_update_self" on public.player_stats;
create policy "player_stats_update_self"
on public.player_stats for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "online_presence_select_all" on public.online_presence;
create policy "online_presence_select_all"
on public.online_presence for select
using (true);

drop policy if exists "online_presence_insert_own" on public.online_presence;
create policy "online_presence_insert_own"
on public.online_presence for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "online_presence_update_own" on public.online_presence;
create policy "online_presence_update_own"
on public.online_presence for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.player_stats to anon, authenticated;
grant select on public.online_presence to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update on public.player_stats to authenticated;
grant insert, update on public.online_presence to authenticated;

drop view if exists public.leaderboard_public;

create view public.leaderboard_public as
select
  p.id as user_id,
  coalesce(nullif(trim(p.username), ''), 'player') as username,
  coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.username), ''), 'Trader') as display_name,
  coalesce(ps.net_worth, 0) as net_worth,
  coalesce(ps.prestige, 0)::bigint as prestige,
  coalesce(ps.empire_tier, '-') as empire_tier,
  ps.updated_at,
  ps.avatar_dna
from public.profiles p
left join public.player_stats ps on ps.user_id = p.id
where coalesce(p.is_public, true) = true
order by coalesce(ps.net_worth, 0) desc nulls last;

grant select on public.leaderboard_public to anon, authenticated;

