-- =============================================================================
-- Server-side exchange + trade RPC (anti-cheat foundation)
-- =============================================================================
-- Run after shared_market_snapshot.sql and shared_world_schema.sql.
-- Clients call: mm_ensure_wallet, mm_fetch_exchange_state, mm_execute_trade
-- =============================================================================

create table if not exists public.player_wallet (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cash numeric not null default 500,
  updated_at timestamptz not null default now()
);

create table if not exists public.player_positions (
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null,
  shares numeric not null default 0,
  avg_cost numeric not null default 0,
  lev_shares numeric not null default 0,
  lev_avg numeric not null default 0,
  lev_mult int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create index if not exists player_positions_user_idx on public.player_positions (user_id);

alter table public.player_wallet enable row level security;
alter table public.player_positions enable row level security;

drop policy if exists "player_wallet_own_select" on public.player_wallet;
create policy "player_wallet_own_select" on public.player_wallet for select using (auth.uid() = user_id);
drop policy if exists "player_wallet_own_update" on public.player_wallet;
create policy "player_wallet_own_update" on public.player_wallet for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "player_positions_own_select" on public.player_positions;
create policy "player_positions_own_select" on public.player_positions for select using (auth.uid() = user_id);
drop policy if exists "player_positions_own_update" on public.player_positions;
create policy "player_positions_own_update" on public.player_positions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Seed wallet once (trusted bootstrap from client local save — call once after login)
-- -----------------------------------------------------------------------------
create or replace function public.mm_ensure_wallet(p_seed_cash numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  wallet_cash numeric;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  insert into public.player_wallet (user_id, cash)
  values (v_uid, greatest(0, coalesce(p_seed_cash, 500)))
  on conflict (user_id) do nothing;
  -- Use := (scalar subselect); some runners misparse `SELECT ... INTO name FROM ...` as `FROM name`.
  wallet_cash := (
    select pw.cash from public.player_wallet pw where pw.user_id = v_uid limit 1
  );
  return jsonb_build_object('ok', true, 'cash', wallet_cash);
end;
$$;

revoke all on function public.mm_ensure_wallet(numeric) from public;
grant execute on function public.mm_ensure_wallet(numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- Fetch wallet + all positions for hydration
-- -----------------------------------------------------------------------------
create or replace function public.mm_fetch_exchange_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  wc numeric;
  pos jsonb;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if not exists (select 1 from public.player_wallet pw where pw.user_id = v_uid) then
    return jsonb_build_object('ok', true, 'cash', null, 'positions', '[]'::jsonb, 'wallet_missing', true);
  end if;
  wc := (select pw.cash from public.player_wallet pw where pw.user_id = v_uid limit 1);
  pos := coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'symbol', pp.symbol,
          'shares', pp.shares,
          'avg_cost', pp.avg_cost,
          'lev_shares', pp.lev_shares,
          'lev_avg', pp.lev_avg,
          'lev_mult', pp.lev_mult
        )
        order by pp.symbol
      )
      from public.player_positions pp
      where pp.user_id = v_uid
    ),
    '[]'::jsonb
  );
  return jsonb_build_object('ok', true, 'cash', wc, 'positions', pos);
end;
$$;

revoke all on function public.mm_fetch_exchange_state() from public;
grant execute on function public.mm_fetch_exchange_state() to authenticated;

-- -----------------------------------------------------------------------------
-- Execute trade: validates wallet + positions against snapshot price, nudges tape
-- -----------------------------------------------------------------------------
create or replace function public.mm_execute_trade(
  p_symbol text,
  p_side text,
  p_qty numeric,
  p_leverage int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  sym text := upper(trim(p_symbol));
  side text := upper(trim(p_side));
  lev int := greatest(1, coalesce(p_leverage, 1));
  qty numeric := floor(p_qty);
  snap record;
  p jsonb;
  stocks jsonb;
  el jsonb;
  new_stocks jsonb := '[]'::jsonb;
  sym_found boolean := false;
  px numeric;
  liq numeric;
  floor_p numeric;
  ceil_p numeric;
  prev_p numeric;
  mag numeric;
  new_px numeric;
  new_ld numeric;
  wcash numeric;
  sh numeric;
  ac numeric;
  lsh numeric;
  lav numeric;
  lm int;
  cost numeric;
  margin numeric;
  mret numeric;
  pnl numeric;
  val numeric;
  notional numeric;
  i int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if sym is null or sym = '' then
    return jsonb_build_object('ok', false, 'error', 'bad_symbol');
  end if;
  if side not in ('BUY', 'SELL') then
    return jsonb_build_object('ok', false, 'error', 'bad_side');
  end if;
  if qty < 1 or qty > 1e12 then
    return jsonb_build_object('ok', false, 'error', 'bad_qty');
  end if;

  insert into public.player_wallet (user_id, cash) values (v_uid, 500)
  on conflict (user_id) do nothing;

  perform 1 from public.shared_market_snapshot sn where sn.id = 1 for update;
  snap := (select sn from public.shared_market_snapshot sn where sn.id = 1 limit 1);
  if snap is null then
    return jsonb_build_object('ok', false, 'error', 'no_snapshot');
  end if;
  p := snap.payload;
  stocks := p -> 'stocks';
  if stocks is null or jsonb_typeof(stocks) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'bad_payload');
  end if;

  for i in 0 .. jsonb_array_length(stocks) - 1 loop
    el := stocks -> i;
    if upper(el ->> 'symbol') = sym then
      px := coalesce((el ->> 'price')::numeric, 0);
      liq := greatest(80000::numeric, coalesce((el ->> 'liquidity')::numeric, 100000::numeric));
      floor_p := coalesce((el ->> 'floorPrice')::numeric, 0.01);
      ceil_p := coalesce((el ->> 'ceilingPrice')::numeric, 1000000::numeric);
      prev_p := px;
      sym_found := true;
      exit;
    end if;
  end loop;
  if not sym_found or px <= 0 then
    return jsonb_build_object('ok', false, 'error', 'symbol_not_found');
  end if;

  perform 1 from public.player_wallet pw where pw.user_id = v_uid for update;
  wcash := (select pw.cash from public.player_wallet pw where pw.user_id = v_uid limit 1);

  perform 1 from public.player_positions pp
  where pp.user_id = v_uid and pp.symbol = sym
  for update;
  sh := coalesce((select pp.shares from public.player_positions pp where pp.user_id = v_uid and pp.symbol = sym limit 1), 0);
  ac := coalesce((select pp.avg_cost from public.player_positions pp where pp.user_id = v_uid and pp.symbol = sym limit 1), 0);
  lsh := coalesce((select pp.lev_shares from public.player_positions pp where pp.user_id = v_uid and pp.symbol = sym limit 1), 0);
  lav := coalesce((select pp.lev_avg from public.player_positions pp where pp.user_id = v_uid and pp.symbol = sym limit 1), 0);
  lm := coalesce((select pp.lev_mult from public.player_positions pp where pp.user_id = v_uid and pp.symbol = sym limit 1), 1);

  if side = 'BUY' and lev > 1 then
    if lsh > 0 and lm <> lev then
      return jsonb_build_object('ok', false, 'error', 'lev_mismatch');
    end if;
    margin := (qty * px) / lev;
    if wcash < margin then
      return jsonb_build_object('ok', false, 'error', 'insufficient_cash');
    end if;
    wcash := wcash - margin;
    if lsh > 0 then
      lav := (lav * lsh + px * qty) / (lsh + qty);
    else
      lav := px;
    end if;
    lsh := lsh + qty;
    lm := lev;
  elsif side = 'BUY' then
    cost := qty * px;
    if wcash < cost then
      return jsonb_build_object('ok', false, 'error', 'insufficient_cash');
    end if;
    wcash := wcash - cost;
    if sh > 0 then
      ac := (ac * sh + cost) / (sh + qty);
    else
      ac := px;
    end if;
    sh := sh + qty;
  elsif side = 'SELL' and lev > 1 then
    if lsh < qty then
      return jsonb_build_object('ok', false, 'error', 'insufficient_lev');
    end if;
    if lm <> lev then
      return jsonb_build_object('ok', false, 'error', 'lev_mismatch');
    end if;
    mret := (qty * lav) / lev;
    pnl := (px - lav) * qty * lev;
    wcash := wcash + mret + pnl;
    lsh := lsh - qty;
    if lsh <= 0 then
      lsh := 0;
      lav := 0;
      lm := 1;
    end if;
  else
    if sh < qty then
      return jsonb_build_object('ok', false, 'error', 'insufficient_shares');
    end if;
    val := qty * px;
    wcash := wcash + val;
    sh := sh - qty;
    if sh <= 0 then
      sh := 0;
      ac := 0;
    end if;
  end if;

  notional := qty * px;
  mag := least(0.014::numeric, (notional / liq) * (case when side = 'BUY' then 0.16 else 0.13 end));
  if mag < 0.000002 then
    mag := 0;
  end if;
  new_px := prev_p * (1 + (case when side = 'BUY' then mag else -mag end));
  new_px := greatest(floor_p, least(ceil_p, new_px));
  new_ld := case when prev_p > 1e-12 then (new_px / prev_p - 1) else 0 end;

  for i in 0 .. jsonb_array_length(stocks) - 1 loop
    el := stocks -> i;
    if upper(el ->> 'symbol') = sym then
      el := el || jsonb_build_object('price', new_px, 'lastDelta', new_ld);
    end if;
    new_stocks := new_stocks || jsonb_build_array(el);
  end loop;

  p := jsonb_set(p, '{stocks}', new_stocks, true);

  update public.shared_market_snapshot
  set
    payload = p,
    tick = (extract(epoch from now()) * 1000)::bigint,
    updated_at = now()
  where id = 1 and sim_gen = snap.sim_gen;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'snapshot_concurrent_update');
  end if;

  update public.player_wallet set cash = wcash, updated_at = now() where user_id = v_uid;

  insert into public.player_positions (user_id, symbol, shares, avg_cost, lev_shares, lev_avg, lev_mult)
  values (v_uid, sym, sh, ac, lsh, lav, lm)
  on conflict (user_id, symbol) do update set
    shares = excluded.shares,
    avg_cost = excluded.avg_cost,
    lev_shares = excluded.lev_shares,
    lev_avg = excluded.lev_avg,
    lev_mult = excluded.lev_mult,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'cash', wcash,
    'symbol', sym,
    'side', side,
    'qty', qty,
    'price', new_px,
    'shares', sh,
    'avg_cost', ac,
    'lev_shares', lsh,
    'lev_avg', lav,
    'lev_mult', lm
  );
end;
$$;

revoke all on function public.mm_execute_trade(text, text, numeric, int) from public;
grant execute on function public.mm_execute_trade(text, text, numeric, int) to authenticated;

-- -----------------------------------------------------------------------------
-- Reset server-side wallet + all positions (gameplay reset / bankruptcy escape)
-- -----------------------------------------------------------------------------
create or replace function public.mm_reset_exchange_state(p_seed_cash numeric default 500)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  sc numeric;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  sc := greatest(0, coalesce(p_seed_cash, 500));
  insert into public.player_wallet (user_id, cash)
  values (v_uid, sc)
  on conflict (user_id) do update set
    cash = excluded.cash,
    updated_at = now();
  delete from public.player_positions where user_id = v_uid;
  return jsonb_build_object('ok', true, 'cash', sc);
end;
$$;

revoke all on function public.mm_reset_exchange_state(numeric) from public;
grant execute on function public.mm_reset_exchange_state(numeric) to authenticated;

-- Allow authenticated users to mutate snapshot payload via SECURITY DEFINER RPC only (not direct table writes for tape).
