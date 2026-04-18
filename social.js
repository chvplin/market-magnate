(function () {
  const SAVE_KEY = 'market_magnate_ultra_save_v11';
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
    playBtn: () => $("#playBtn"),
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
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(Number(n));
  }

  function setText(node, text) { if (node) node.textContent = text; }

  function flash(node, text, ok = true) {
    if (!node) return;
    node.textContent = text;
    node.style.color = ok ? "#1d7a44" : "#b42318";
    setTimeout(() => { if (node.textContent === text) node.textContent = ""; }, 4500);
  }

  function currentStage(netWorth) {
    const stages = [
      ['Bedroom Trader', 0],
      ['Small Office', 25000],
      ['Storefront Office', 200000],
      ['Professional Trading Suite', 1500000],
      ['Corporate Office Floor', 15000000],
      ['Skyscraper Headquarters', 150000000],
      ['Multiple Major Corporate Buildings', 1500000000],
      ['Global Financial Titan', 15000000000]
    ];
    let out = 'Bedroom Trader';
    for (const [name, threshold] of stages) if ((netWorth || 0) >= threshold) out = name;
    return out;
  }

  window.MMGameAdapter = window.MMGameAdapter || {
    getGameState() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (err) {
        return null;
      }
    },
    applyLoadedGame(saveData) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      window.location.href = './game.html';
    },
    getStats(saveData) {
      const g = saveData || this.getGameState() || {};
      const stocks = Array.isArray(g.stocks) ? g.stocks : [];
      const portfolio = stocks.reduce((sum, s) => sum + Number(s?.owned || 0) * Number(s?.price || 0), 0);
      const cash = Number(g.cash || 0);
      const debt = Number(g.debt || 0);
      const levEquity = stocks.reduce((sum, s) => {
        const levOwned = Number(s?.levOwned || 0);
        const levAvg = Number(s?.levAvg || 0);
        const levMult = Number(s?.levMult || 1);
        if (!levOwned) return sum;
        const pnl = (Number(s?.price || 0) - levAvg) * levOwned * levMult;
        const margin = (levOwned * levAvg) / Math.max(1, levMult);
        return sum + margin + pnl;
      }, 0);
      const netWorth = Number(g.netWorth || (cash + portfolio + levEquity - debt));
      return {
        net_worth: Number(netWorth || 0),
        cash: Number(cash || 0),
        total_profit: Number(g.totalEarned || g.totalProfit || 0),
        lifetime_trades: Math.round(Number(g.trades || g.totalTrades || 0)),
        highest_net_worth: Number(g.highestNetWorth || netWorth || 0),
        prestige: Math.round(Number(g.legacy || g.prestige || 0)),
        xp: Math.round(Number(g.xp || 0)),
        empire_tier: String(g.empireTier || currentStage(netWorth))
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
    if (el.syncBtn()) el.syncBtn().hidden = true;
    if (el.loadBtn()) el.loadBtn().hidden = true;
    if (el.playBtn()) el.playBtn().hidden = !user;
  }

  async function ensureProfileRow(user, usernameSeed) {
    const { data: existing } = await window.mmSupabase.from("profiles").select("id, username").eq("id", user.id).maybeSingle();
    if (existing) return existing;

    const username = (usernameSeed || "").trim();
    if (!username) throw new Error("Username is required.");

    const { error } = await window.mmSupabase.from("profiles").insert({
      id: user.id,
      username,
      display_name: username,
      bio: "",
      favorite_stock: "",
      profile_theme: "default",
      is_public: true
    });
    if (error) throw error;
    return { id: user.id, username };
  }

  async function signUp() {
    const email = el.authEmail()?.value?.trim();
    const password = el.authPassword()?.value;
    const username = el.authUsername()?.value?.trim();

    if (!email || !password || !username) {
      flash(el.authMessage(), "Email, password, and username are required.", false);
      return;
    }

    const { data, error } = await window.mmSupabase.auth.signUp({ email, password });
    if (error) {
      flash(el.authMessage(), error.message, false);
      return;
    }

    const user = data.user;
    if (!user) {
      flash(el.authMessage(), "Signup started. Confirm your email if required, then sign in.");
      return;
    }

    try {
      await ensureProfileRow(user, username);
    } catch (err) {
      flash(el.authMessage(), err.message || "Could not create profile row.", false);
      return;
    }

    const saveData = window.MMGameAdapter.getGameState() || { cash: 500, netWorth: 500 };
    const stats = window.MMGameAdapter.getStats(saveData);

    await window.mmSupabase.from("player_stats").upsert({
      user_id: user.id,
      ...stats,
      updated_at: new Date().toISOString()
    });

    await window.mmSupabase.from("save_slots").upsert({
      user_id: user.id,
      save_data: saveData,
      updated_at: new Date().toISOString()
    });

    flash(el.authMessage(), "Account created. Redirecting to game...");
    await refreshAuthUI();
    setTimeout(() => { window.location.href = "./game.html"; }, 700);
  }

  async function signIn() {
    const email = el.authEmail()?.value?.trim();
    const password = el.authPassword()?.value;
    const { error } = await window.mmSupabase.auth.signInWithPassword({ email, password });
    if (error) {
      flash(el.authMessage(), error.message, false);
      return;
    }
    flash(el.authMessage(), "Signed in. Redirecting to game...");
    await refreshAuthUI();
    setTimeout(() => { window.location.href = "./game.html"; }, 500);
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
    if (!user) return flash(el.authMessage(), "Sign in first.", false);

    const saveData = window.MMGameAdapter.getGameState();
    if (!saveData) return flash(el.authMessage(), "No local save found.", false);

    const stats = window.MMGameAdapter.getStats(saveData);
    const { error: statsError } = await window.mmSupabase.from("player_stats").upsert({
      user_id: user.id, ...stats, updated_at: new Date().toISOString()
    });
    if (statsError) return flash(el.authMessage(), statsError.message, false);

    const { error: saveError } = await window.mmSupabase.from("save_slots").upsert({
      user_id: user.id, save_data: saveData, updated_at: new Date().toISOString()
    });
    if (saveError) return flash(el.authMessage(), saveError.message, false);

    flash(el.authMessage(), "Cloud save synced.");
    await loadLeaderboard();
    await loadMyProfile();
  }

  window.MMForceCloudSync = syncToCloud;

  async function loadFromCloud() {
    const user = await getUser();
    if (!user) return flash(el.authMessage(), "Sign in first.", false);

    const { data, error } = await window.mmSupabase.from("save_slots").select("save_data").eq("user_id", user.id).single();
    if (error) return flash(el.authMessage(), error.message, false);
    if (!data?.save_data) return flash(el.authMessage(), "No cloud save found.", false);

    window.MMGameAdapter.applyLoadedGame(data.save_data);
  }

  async function loadLeaderboard() {
    const { data, error } = await window.mmSupabase.from("leaderboard_public").select("*").order("net_worth", { ascending: false }).limit(100);
    if (error) {
      if (el.leaderboardBody()) el.leaderboardBody().innerHTML = `<tr><td colspan="5">Failed to load leaderboard.</td></tr>`;
      return;
    }
    const rows = (data || []).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.username || "Unknown"}</td>
        <td>${fmtMoney(row.net_worth)}</td>
        <td>${row.prestige || 0}</td>
        <td>${row.empire_tier || "-"}</td>
      </tr>`).join("");
    if (el.leaderboardBody()) el.leaderboardBody().innerHTML = rows || `<tr><td colspan="5">No players yet.</td></tr>`;
  }

  async function loadMyProfile() {
    const user = await getUser().catch(() => null);
    if (!user) return;
    const { data, error } = await window.mmSupabase.from("profiles").select("*").eq("id", user.id).single();
    if (error || !data) return;
    if (el.profileDisplayName()) el.profileDisplayName().value = data.display_name || "";
    if (el.profileBio()) el.profileBio().value = data.bio || "";
    if (el.profileFavoriteStock()) el.profileFavoriteStock().value = data.favorite_stock || "";
    if (el.profileTheme()) el.profileTheme().value = data.profile_theme || "default";
  }

  async function saveMyProfile(evt) {
    evt.preventDefault();
    const user = await getUser().catch(() => null);
    if (!user) return flash(el.profileMessage(), "Sign in first.", false);

    const { data: existing, error: existingError } = await window.mmSupabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (existingError && existingError.code !== "PGRST116") return flash(el.profileMessage(), existingError.message, false);

    const payload = {
      id: user.id,
      username: existing?.username || el.authUsername()?.value?.trim() || "",
      display_name: el.profileDisplayName()?.value?.trim() || "",
      bio: el.profileBio()?.value?.trim() || "",
      favorite_stock: el.profileFavoriteStock()?.value?.trim() || "",
      profile_theme: el.profileTheme()?.value || "default",
      is_public: true
    };

    if (!payload.username) return flash(el.profileMessage(), "Username is required.", false);

    const { error } = await window.mmSupabase.from("profiles").upsert(payload);
    if (error) return flash(el.profileMessage(), error.message, false);

    flash(el.profileMessage(), "Profile saved.");
  }

  async function loadPublicProfileByUsername(username) {
    const { data, error } = await window.mmSupabase.from("leaderboard_public").select("*").eq("username", username).single();
    if (error || !data) {
      if (el.publicProfileBody()) el.publicProfileBody().innerHTML = "<p>Profile not found.</p>";
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
        </div>`;
    }
  }

  async function maybeLoadProfileFromURL() {
    const params = new URLSearchParams(location.search);
    const username = params.get("u");
    if (username) await loadPublicProfileByUsername(username);
  }

  function bindEvents() {
    el.signUpBtn()?.addEventListener("click", signUp);
    el.signInBtn()?.addEventListener("click", signIn);
    el.signOutBtn()?.addEventListener("click", signOut);
    el.syncBtn()?.addEventListener("click", syncToCloud);
    el.loadBtn()?.addEventListener("click", loadFromCloud);
    el.profileForm()?.addEventListener("submit", saveMyProfile);
    el.playBtn()?.addEventListener("click", () => { window.location.href = "./game.html"; });
  }

  let leaderboardRefreshTimer = null;

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

    // Keep the leaderboard feeling live on the hub page.
    leaderboardRefreshTimer = setInterval(async () => {
      try {
        await loadLeaderboard();
      } catch (e) {}
    }, 10000);

    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        try {
          await loadLeaderboard();
        } catch (e) {}
      }
    });

    window.addEventListener('focus', async () => {
      try {
        await loadLeaderboard();
      } catch (e) {}
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
