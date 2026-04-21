(function () {
  if (!window.MM_CONFIG) {
    console.error("MM_CONFIG missing. Copy config.example.js to config.js and fill it out.");
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase client library not loaded.");
    return;
  }
  // Email/password sign-in persists to localStorage; OAuth/magic-link flows are not used here.
  // detectSessionInUrl:true can clear or skip the stored session on normal navigations (no hash
  // tokens), which makes game.html look signed out / "Guest" right after login.
  window.mmSupabase = window.supabase.createClient(
    window.MM_CONFIG.SUPABASE_URL,
    window.MM_CONFIG.SUPABASE_ANON_KEY,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
  );
})();
