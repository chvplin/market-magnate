(function () {
  if (!window.MM_CONFIG) {
    console.error("MM_CONFIG missing. Copy config.example.js to config.js and fill it out.");
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase client library not loaded.");
    return;
  }

  const supabaseUrl = window.MM_CONFIG.SUPABASE_URL;
  const supabaseAnonKey = window.MM_CONFIG.SUPABASE_ANON_KEY;

  window.mmSupabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
})();