-- =============================================================================
-- Public leaderboard RPC (run in Supabase SQL editor)
-- Lets anon + authenticated clients read leaderboard rows even when RLS on
-- player_stats / profiles blocks direct multi-row SELECT.
-- =============================================================================

-- Backward-compat: older schemas may not have this column yet.
alter table if exists public.player_stats
  add column if not exists avatar_dna jsonb;

create or replace function public.mm_public_leaderboard(limit_rows int default 100)
returns table (
  username text,
  display_name text,
  user_id uuid,
  net_worth numeric,
  prestige bigint,
  empire_tier text,
  updated_at timestamptz,
  avatar_dna jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(nullif(trim(p.username), ''), 'player') as username,
    coalesce(nullif(trim(p.display_name), ''), nullif(trim(p.username), ''), 'Trader') as display_name,
    ps.user_id,
    coalesce(ps.net_worth, 0) as net_worth,
    coalesce(ps.prestige, 0)::bigint as prestige,
    coalesce(ps.empire_tier, '-') as empire_tier,
    ps.updated_at,
    ps.avatar_dna
  from public.player_stats ps
  inner join public.profiles p on p.id = ps.user_id
  order by ps.net_worth desc nulls last
  limit least(coalesce(limit_rows, 100), 500);
$$;

comment on function public.mm_public_leaderboard(int) is 'Market Magnate: public leaderboard for game + hub UI (security definer).';

revoke all on function public.mm_public_leaderboard(int) from public;
grant execute on function public.mm_public_leaderboard(int) to anon, authenticated;

-- =============================================================================
-- Public online players RPC (presence + public leaderboard fields)
-- =============================================================================
create or replace function public.mm_public_online_players(limit_rows int default 120)
returns table (
  user_id uuid,
  username text,
  display_name text,
  net_worth numeric,
  prestige bigint,
  empire_tier text,
  updated_at timestamptz,
  last_seen timestamptz,
  avatar_dna jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with src as (
    select
      op.user_id,
      coalesce(nullif(trim(op.username), ''), nullif(trim(p.username), ''), 'player') as username,
      coalesce(nullif(trim(op.display_name), ''), nullif(trim(p.display_name), ''), nullif(trim(p.username), ''), 'Trader') as display_name,
      coalesce(ps.net_worth, 0) as net_worth,
      coalesce(ps.prestige, 0)::bigint as prestige,
      coalesce(ps.empire_tier, 'Online') as empire_tier,
      coalesce(ps.updated_at, op.updated_at, op.last_seen) as updated_at,
      op.last_seen,
      ps.avatar_dna
    from public.online_presence op
    left join public.profiles p on p.id = op.user_id
    left join public.player_stats ps on ps.user_id = op.user_id
    where op.last_seen > now() - interval '30 minutes'
  )
  select * from src
  order by last_seen desc nulls last
  limit least(coalesce(limit_rows, 120), 500);
$$;

comment on function public.mm_public_online_players(int) is 'Market Magnate: public online players feed (security definer).';

revoke all on function public.mm_public_online_players(int) from public;
grant execute on function public.mm_public_online_players(int) to anon, authenticated;
