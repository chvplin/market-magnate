window.MM_CONFIG = {
  SUPABASE_URL: "https://xftjudptlqmkdwjvvvnl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_dib0KWDZGof7qPsmpaYSAw_MfDP-uT5",
  APP_NAME: "Market Magnate",
  /** When true, stock prices sync via Supabase `shared_market_snapshot` (run SQL in repo). Push requires sign-in. */
  SHARED_STOCK_MARKET: true,
  /**
   * When true, hourly market ticks (sim_gen++) are performed ONLY by the Edge Function
   * `supabase/functions/shared-market-tick` using the service role. Browsers become read-only
   * for bumpGen (they still push tape-only trade nudges when signed in).
   * Deploy function + set secrets, then enable a 3s cron in Supabase Dashboard.
   */
  USE_EDGE_MARKET_AUTHORITY: false,
  /**
   * Dev-only legacy path: signed-in browsers may CAS-advance `sim_gen` and run the full shared
   * tick loop locally. Production shared markets should keep this false and rely on Edge
   * `shared-market-tick` (or another single writer) plus `mm_execute_trade` for tape nudges.
   */
  ALLOW_CLIENT_CAS_MARKET_TICK: true,
  /** When true (default), signed-in trades in shared mode go through `mm_execute_trade` RPC. */
  USE_SERVER_TRADE_RPC: true
};