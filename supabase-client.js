(function () {
  if (!window.MM_CONFIG) {
    console.error("MM_CONFIG missing. Copy config.example.js to config.js and fill it out.");
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase client library not loaded.");
    return;
  }
  window.mmSupabase = window.supabase.createClient(
    window.MM_CONFIG.SUPABASE_URL,
    window.MM_CONFIG.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
  );
})();
