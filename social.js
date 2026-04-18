(function () {
  const $ = (sel) => document.querySelector(sel);
  const el = {
    authStatus: () => $("#authStatus"),
    authEmail: () => $("#authEmail"),
    authPassword: () => $("#authPassword"),
    authUsername: () => $("#authUsername"),
    signUpBtn: () => $("#signUpBtn"),
    signInBtn: () => $("#signInBtn"),
    signOutBtn: () => $("#signOutBtn"),
    syncBtn: () => $("#syncBtn"),
    loadBtn: () => $("#loadBtn"),
    leaderboardBody: () => $("#leaderboardBody"),
    publicProfileBody: () => $("#publicProfileBody"),
    profileForm: () => $("#profileForm"),
    profileDisplayName: () => $("#profileDisplayName"),
    profileBio: () => $("#profileBio"),
    profileFavoriteStock: () => $("#profileFavoriteStock"),
    profileTheme: () => $("#profileTheme"),
    profileMessage: () => $("#profileMessage"),
    authMessage: () => $("#authMessage")
  };

  function fmtMoney(n) {
    if (n == null || isNaN(n)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: n >= 1000 ? 0 : 2
    }).format(Number(n));
  }

  function setText(node, text) {
    if (node) node.textContent = text;
  }

  function flash(node, text, ok = true) {
    if (!node) return;
    node.textContent = text;
    node.style.color = ok ? "#1d7a44" : "#b42318";
    setTimeout(() => {
      if (node.textContent === text) node.textContent = "";
    }, 4000);
  }

  window.MMGameAdapter = window.MMGameAdapter || {
    getGameState() {
      try {
        const raw = localStorage.getItem("marketMagnateSave");
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },
    applyLoadedGame(saveData) {
      localStorage.setItem("marketMagnateSave", JSON.stringify(saveData));
      location.reload();
    },
    getStats(saveData) {
      const g = saveData || this.getGameState() || {};
      return {
        net_worth: Number(g.netWorth || g.net_worth || g.money || 0),
        cash: Number(g.cash || g.money || 0),
        total_profit: Number(g.totalProfit || 0),
        lifetime_trades: Number(g.totalTrades || 0),
        highest_net_worth: Number(g.highestNetWorth || g.netWorth || g.money || 0),
        prestige: Number(g.prestige || 0),
        xp: Number(g.xp || 0),
        empire_tier: String(g.empireTier || g.businessStage || "Bedroom Trader")
      };
    }
  };

  async function getUser() {
    const { data, error } = await window.mmSupabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function refreshAuthUI() {
    const user = await getUser().catch(() => null);
    setText(el.authStatus(), user ? `Signed in as ${user.email}` : "Not signed in");
    if (el.signOutBtn()) el.signOutBtn().hidden = !user;
    if (el.syncBtn()) el.syncBtn().disabled = !user;
    if (el.loadBtn()) el.loadBtn().disabled = !user;
  }

  async function signUp() {
  const email = el.authEmail()?.value?.trim();
  const password = el.authPassword()?.value;
  const username = el.authUsername()?.value?.trim();

  if (!email || !password || !username) {
    flash(el.authMessage(), "Email, password, and username are required.", false);
    return;
  }

  const { data, error } = await window.mmSupabase.auth.signUp({
    email,
    password
  });

  if (error) {
    flash(el.authMessage(), error.message, false);
    return;
  }

  flash(
    el.authMessage(),
    "Account created. If email confirmation is enabled, confirm your email, then sign in."
  );

  const user = data.user;
  if (!user) return;

  // Try creating profile row, but don't crash signup if auth confirmation blocks it
  const { error: profileError } = await window.mmSupabase.from("profiles").upsert({
    id: user.id,
    username,
    display_name: username,
    bio: "",
    favorite_stock: "",
    profile_theme: "default",
    is_public: true
  });

  if (profileError) {
    console.warn("Profile creation deferred until first sign-in:", profileError.message);
  }
  }

  async function signIn() {
    const email = el.authEmail()?.value?.trim();
    const password = el.authPassword()?.value;

    const { error } = await window.mmSupabase.auth.signInWithPassword({ email, password });
    if (error) {
      flash(el.authMessage(), error.message, false);
      return;
    }
    flash(el.authMessage(), "Signed in.");
    refreshAuthUI();
    loadMyProfile();
    loadLeaderboard();
  }

  async function signOut() {
    const { error } = await window.mmSupabase.auth.signOut();
    if (error) {
      flash(el.authMessage(), error.message, false);
      return;
    }
    flash(el.authMessage(), "Signed out.");
    refreshAuthUI();
  }

  async function syncToCloud() {
    const user = await getUser();
    if (!user) {
      flash(el.authMessage(), "Sign in first.", false);
      return;
    }

    const saveData = window.MMGameAdapter.getGameState();
    if (!saveData) {
      flash(el.authMessage(), "No local save found.", false);
      return;
    }

    const stats = window.MMGameAdapter.getStats(saveData);

    const { error: statsError } = await window.mmSupabase.from("player_stats").upsert({
      user_id: user.id,
      ...stats,
      updated_at: new Date().toISOString()
    });

    if (statsError) {
      flash(el.authMessage(), statsError.message, false);
      return;
    }

    const { error: saveError } = await window.mmSupabase.from("save_slots").upsert({
      user_id: user.id,
      save_data: saveData,
      updated_at: new Date().toISOString()
    });

    if (saveError) {
      flash(el.authMessage(), saveError.message, false);
      return;
    }

    flash(el.authMessage(), "Cloud save synced.");
    loadLeaderboard();
  }

  async function loadFromCloud() {
    const user = await getUser();
    if (!user) {
      flash(el.authMessage(), "Sign in first.", false);
      return;
    }

    const { data, error } = await window.mmSupabase
      .from("save_slots")
      .select("save_data")
      .eq("user_id", user.id)
      .single();

    if (error) {
      flash(el.authMessage(), error.message, false);
      return;
    }

    if (!data?.save_data) {
      flash(el.authMessage(), "No cloud save found.", false);
      return;
    }

    window.MMGameAdapter.applyLoadedGame(data.save_data);
  }

  async function loadLeaderboard() {
    const { data, error } = await window.mmSupabase
      .from("leaderboard_public")
      .select("*")
      .order("net_worth", { ascending: false })
      .limit(100);

    if (error) {
      if (el.leaderboardBody()) {
        el.leaderboardBody().innerHTML = `<tr><td colspan="5">Failed to load leaderboard.</td></tr>`;
      }
      return;
    }

    const rows = (data || []).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.username || "Unknown"}</td>
        <td>${fmtMoney(row.net_worth)}</td>
        <td>${row.prestige || 0}</td>
        <td>${row.empire_tier || "-"}</td>
      </tr>
    `).join("");

    if (el.leaderboardBody()) {
      el.leaderboardBody().innerHTML = rows || `<tr><td colspan="5">No players yet.</td></tr>`;
    }
  }

  async function loadMyProfile() {
    const user = await getUser().catch(() => null);
    if (!user) return;

    const { data, error } = await window.mmSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !data) return;

    if (el.profileDisplayName()) el.profileDisplayName().value = data.display_name || "";
    if (el.profileBio()) el.profileBio().value = data.bio || "";
    if (el.profileFavoriteStock()) el.profileFavoriteStock().value = data.favorite_stock || "";
    if (el.profileTheme()) el.profileTheme().value = data.profile_theme || "default";
  }

  async function saveMyProfile(evt) {
  evt.preventDefault();
  const user = await getUser().catch(() => null);
  if (!user) {
    flash(el.profileMessage(), "Sign in first.", false);
    return;
  }

  // First fetch the existing profile so we keep username intact
  const { data: existing, error: existingError } = await window.mmSupabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    flash(el.profileMessage(), existingError.message, false);
    return;
  }

  const payload = {
    id: user.id,
    username: existing?.username || el.authUsername()?.value?.trim() || "",
    display_name: el.profileDisplayName()?.value?.trim() || "",
    bio: el.profileBio()?.value?.trim() || "",
    favorite_stock: el.profileFavoriteStock()?.value?.trim() || "",
    profile_theme: el.profileTheme()?.value || "default"
  };

  if (!payload.username) {
    flash(el.profileMessage(), "Username is required.", false);
    return;
  }

  const { error } = await window.mmSupabase.from("profiles").upsert(payload);

  if (error) {
    flash(el.profileMessage(), error.message, false);
    return;
  }

  flash(el.profileMessage(), "Profile saved.");
  }

  async function loadPublicProfileByUsername(username) {
    const { data, error } = await window.mmSupabase
      .from("leaderboard_public")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      if (el.publicProfileBody()) {
        el.publicProfileBody().innerHTML = "<p>Profile not found.</p>";
      }
      return;
    }

    if (el.publicProfileBody()) {
      el.publicProfileBody().innerHTML = `
        <div class="profileCard">
          <h3>${data.display_name || data.username}</h3>
          <p>@${data.username}</p>
          <p>${data.bio || ""}</p>
          <div class="statGrid">
            <div class="statBox"><span>Net Worth</span><strong>${fmtMoney(data.net_worth)}</strong></div>
            <div class="statBox"><span>Prestige</span><strong>${data.prestige || 0}</strong></div>
            <div class="statBox"><span>Empire</span><strong>${data.empire_tier || "-"}</strong></div>
            <div class="statBox"><span>Favorite Stock</span><strong>${data.favorite_stock || "-"}</strong></div>
          </div>
        </div>
      `;
    }
  }

  async function maybeLoadProfileFromURL() {
    const params = new URLSearchParams(location.search);
    const username = params.get("u");
    if (username) {
      await loadPublicProfileByUsername(username);
    }
  }

  function bindEvents() {
    el.signUpBtn()?.addEventListener("click", signUp);
    el.signInBtn()?.addEventListener("click", signIn);
    el.signOutBtn()?.addEventListener("click", signOut);
    el.syncBtn()?.addEventListener("click", syncToCloud);
    el.loadBtn()?.addEventListener("click", loadFromCloud);
    el.profileForm()?.addEventListener("submit", saveMyProfile);
  }

  async function init() {
    if (!window.mmSupabase) return;
    bindEvents();
    await refreshAuthUI();
    await loadMyProfile();
    await loadLeaderboard();
    await maybeLoadProfileFromURL();

    window.mmSupabase.auth.onAuthStateChange(async () => {
      await refreshAuthUI();
      await loadMyProfile();
      await loadLeaderboard();
    });

    setInterval(async () => {
      const user = await getUser().catch(() => null);
      if (!user) return;
      await syncToCloud().catch(() => {});
    }, 20000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();