/**
 * AUTHORITATIVE MARKET LOOP (Supabase Edge Function)
 * ---------------------------------------------------
 * Scheduled via Supabase cron (recommended: every 3s to match MARKET_TICK_MS in game.html).
 * Uses service role to CAS-update `shared_market_snapshot` (same row as the game).
 *
 * Env (Dashboard → Edge Function secrets):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MM_CRON_SECRET (optional; if set, require header `x-mm-cron: <secret>`)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { buildSnapshotPayload, runAuthoritativeMarketTick } from "./tickEngine.ts";

Deno.serve(async (req) => {
  const cron = Deno.env.get("MM_CRON_SECRET");
  if (cron && req.headers.get("x-mm-cron") !== cron) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) {
    return new Response(JSON.stringify({ ok: false, error: "missing env" }), { status: 500 });
  }

  const supabase = createClient(url, key);
  const { data: row, error: readErr } = await supabase.from("shared_market_snapshot").select("*").eq("id", 1).maybeSingle();
  if (readErr || !row) {
    return new Response(JSON.stringify({ ok: false, error: readErr?.message || "no row" }), { status: 500 });
  }

  let payload = row.payload;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "payload json" }), { status: 500 });
    }
  }

  if (!payload || !Array.isArray((payload as any).stocks) || !(payload as any).stocks.length) {
    return new Response(JSON.stringify({ ok: false, error: "empty stocks" }), { status: 400 });
  }

  const g = JSON.parse(JSON.stringify(payload)) as any;
  g._arenaFeed = Array.isArray((payload as any).arena?.feed)
    ? [...(payload as any).arena.feed]
    : (Array.isArray(g._arenaFeed) ? g._arenaFeed : []);
  g.arenaSprint = (payload as any).arena?.sprint ?? null;
  g.arenaContract = (payload as any).arena?.contract ?? null;
  g._mmPulseAnnouncedSlot = (payload as any)._mmPulseAnnouncedSlot ?? g._mmPulseAnnouncedSlot ?? null;
  g._nextBonusGen = (payload as any)._nextBonusGen ?? g._nextBonusGen ?? null;
  g._nextGlobalGen = (payload as any)._nextGlobalGen ?? g._nextGlobalGen ?? null;

  const prevGen = Number(row.sim_gen) || 0;
  g._sharedSimGen = prevGen;

  const { dayAdvanced } = runAuthoritativeMarketTick(g, prevGen);
  const nextGen = prevGen + 1;
  const writeVersion = (Number((payload as any).v) || 0) + 1;
  const newPayload = buildSnapshotPayload(g, nextGen, dayAdvanced, writeVersion);

  const tickBig = Date.now();
  const { data: upd, error: upErr } = await supabase
    .from("shared_market_snapshot")
    .update({
      tick: tickBig,
      sim_gen: nextGen,
      payload: newPayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1)
    .eq("sim_gen", prevGen)
    .select("id,sim_gen");

  if (upErr) {
    return new Response(JSON.stringify({ ok: false, error: upErr.message }), { status: 500 });
  }
  if (!upd || upd.length === 0) {
    return new Response(JSON.stringify({ ok: false, conflict: true }), { status: 409 });
  }

  const stocks = Array.isArray((newPayload as any).stocks) ? (newPayload as any).stocks : [];
  if (stocks.length) {
    const rows = stocks
      .filter((s: any) => s && s.symbol)
      .map((s: any) => ({
        symbol: String(s.symbol),
        tick: tickBig,
        sim_gen: nextGen,
        price: Number(s.price) || 0,
      }));
    if (rows.length) {
      const ins = await supabase.from("shared_stock_history").insert(rows);
      if (ins.error) {
        console.warn("shared_stock_history insert:", ins.error.message);
      }
    }
  }
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const del = await supabase.from("shared_stock_history").delete().lt("created_at", weekAgo);
  if (del.error) {
    console.warn("shared_stock_history prune:", del.error.message);
  }

  return new Response(JSON.stringify({ ok: true, sim_gen: nextGen }), {
    headers: { "content-type": "application/json" },
  });
});
