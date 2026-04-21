-- Shared live tape: one row. `sim_gen` is compare-and-swap: all signed-in clients run the same
-- deterministic market tick for a given sim_gen; the DB advances only when an update matches sim_gen.
-- Run `alter table ... add column if not exists sim_gen` on older installs. Enable Realtime on this table.

create table if not exists public.shared_market_snapshot (
  id int primary key default 1,
  tick bigint not null default 0,
  sim_gen bigint not null default 0,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_market_snapshot add column if not exists sim_gen bigint not null default 0;

insert into public.shared_market_snapshot (id, tick, sim_gen, payload)
values (1, 0, 0, '{"ts":0,"v":0,"stocks":[]}'::jsonb)
on conflict (id) do nothing;

alter table public.shared_market_snapshot enable row level security;

drop policy if exists "shared_market_snapshot_select" on public.shared_market_snapshot;
create policy "shared_market_snapshot_select"
  on public.shared_market_snapshot for select
  using (true);

drop policy if exists "shared_market_snapshot_write" on public.shared_market_snapshot;
create policy "shared_market_snapshot_write"
  on public.shared_market_snapshot for insert
  to authenticated
  with check (id = 1);

drop policy if exists "shared_market_snapshot_mutate" on public.shared_market_snapshot;
create policy "shared_market_snapshot_mutate"
  on public.shared_market_snapshot for update
  to authenticated
  using (id = 1)
  with check (id = 1);

-- Optional: allow anon read only (for guests) — uncomment if you want unsigned players to see tape
-- create policy "shared_market_snapshot_anon_select"
--   on public.shared_market_snapshot for select to anon using (true);
