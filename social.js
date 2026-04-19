(function () {
  const SAVE_KEY = 'market_magnate_ultra_save_v11';
  const HUB_AVATAR_FALLBACK_KEY = 'market_magnate_hub_avatar_dna_v1';
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
    profileUsername: () => $("#profileUsername"),
    profileDisplayName: () => $("#profileDisplayName"),
    profileBio: () => $("#profileBio"),
    profileFavoriteStock: () => $("#profileFavoriteStock"),
    profileTheme: () => $("#profileTheme"),
    ownedAvatarInventory: () => $("#ownedAvatarInventory"),
    ownedBannerInventory: () => $("#ownedBannerInventory"),
    profileMessage: () => $("#profileMessage"),
    authMessage: () => $("#authMessage")
  };

  function readHubAvatarDNA() {
    if (!window.MM_AVATAR) return {};
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        return window.MM_AVATAR.normalizeAvatarDNA(o.avatarDNA || {});
      }
      const hubRaw = localStorage.getItem(HUB_AVATAR_FALLBACK_KEY);
      if (hubRaw) return window.MM_AVATAR.normalizeAvatarDNA(JSON.parse(hubRaw));
    } catch (e) {}
    return window.MM_AVATAR.defaultAvatarDNA();
  }

  function writeHubAvatarDNA(d) {
    if (!window.MM_AVATAR) return;
    const norm = window.MM_AVATAR.normalizeAvatarDNA(d);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        o.avatarDNA = norm;
        localStorage.setItem(SAVE_KEY, JSON.stringify(o));
        try { localStorage.removeItem(HUB_AVATAR_FALLBACK_KEY); } catch (e2) {}
        return;
      }
      localStorage.setItem(HUB_AVATAR_FALLBACK_KEY, JSON.stringify(norm));
    } catch (e) {}
  }

  let refreshHubAvatarStudio = null;
  function ensureHubAvatarStudio() {
    const studio = document.getElementById("hubAvatarStudio");
    const host = document.getElementById("hubAvatarHost");
    if (!studio || !host || !window.MM_AVATAR) return;
    if (!refreshHubAvatarStudio) {
      refreshHubAvatarStudio = window.MM_AVATAR.mountStudio(studio, host, {
        get: readHubAvatarDNA,
        set: writeHubAvatarDNA,
        save: function () {},
        flex: function () { return {}; }
      });
    } else {
      refreshHubAvatarStudio();
    }
  }


const accountAvatarShop = [
  ['default_avatar','💹','Market Default'],
  ['profile_avatar_bull','🐂','Bull Titan'],['profile_avatar_bear','🐻','Bear Baron'],['profile_avatar_wolf','🐺','Wolf Trader'],['profile_avatar_fox','🦊','Fox Analyst'],['profile_avatar_lion','🦁','Lion Mogul'],
  ['profile_avatar_eagle','🦅','Eagle Eye'],['profile_avatar_shark','🦈','Shark Fund'],['profile_avatar_dragon','🐉','Dragon Capital'],['profile_avatar_owl','🦉','Night Owl'],['profile_avatar_tiger','🐯','Tiger Desk'],
  ['profile_avatar_robot','🤖','Quant Bot'],['profile_avatar_alien','👽','Cosmic Whale'],['profile_avatar_ghost','👻','Ghost Trader'],['profile_avatar_crown','👑','Crown Holder'],['profile_avatar_diamond','💎','Diamond Hands'],
  ['profile_avatar_rocket','🚀','Rocket Lord'],['profile_avatar_lightning','⚡','Lightning Tape'],['profile_avatar_fire','🔥','Fire Momentum'],['profile_avatar_orb','🔮','Oracle Orb'],['profile_avatar_saturn','🪐','Saturn Tycoon']
].map(a => ({ key:a[0], icon:a[1], name:a[2] }));

const accountBannerShop = [
  ['default_banner','Market Default','linear-gradient(135deg,#1877f2,#42b72a)'],
  ['profile_banner_gold','Gold Lux','linear-gradient(135deg,#f6d365,#fda085)'],['profile_banner_neon','Neon Grid','linear-gradient(135deg,#7b2ff7,#00c6ff)'],['profile_banner_midnight','Midnight Tape','linear-gradient(135deg,#0f172a,#1e3a8a)'],
  ['profile_banner_aurora','Aurora Rise','linear-gradient(135deg,#43cea2,#185a9d)'],['profile_banner_rose','Rose Surge','linear-gradient(135deg,#f857a6,#ff5858)'],['profile_banner_mint','Mint Wave','linear-gradient(135deg,#11998e,#38ef7d)'],['profile_banner_sunburst','Sunburst','linear-gradient(135deg,#ff9966,#ff5e62)'],['profile_banner_platinum','Platinum','linear-gradient(135deg,#cfd9df,#e2ebf0)'],['profile_banner_void','Void Pulse','linear-gradient(135deg,#232526,#414345)'],['profile_banner_sapphire','Sapphire','linear-gradient(135deg,#4facfe,#00f2fe)'],
  ['profile_banner_emerald','Emerald','linear-gradient(135deg,#56ab2f,#a8e063)'],['profile_banner_orchid','Orchid','linear-gradient(135deg,#DA22FF,#9733EE)'],['profile_banner_lagoon','Lagoon','linear-gradient(135deg,#43e97b,#38f9d7)'],['profile_banner_chrome','Chrome','linear-gradient(135deg,#bdc3c7,#2c3e50)'],['profile_banner_inferno','Inferno','linear-gradient(135deg,#f12711,#f5af19)'],['profile_banner_tropics','Tropics','linear-gradient(135deg,#30cfd0,#330867)'],['profile_banner_starlight','Starlight','linear-gradient(135deg,#654ea3,#eaafc8)'],['profile_banner_oasis','Oasis','linear-gradient(135deg,#00b09b,#96c93d)'],
  ['profile_banner_frost','Frost','linear-gradient(135deg,#a1c4fd,#c2e9fb)'],['profile_banner_royal','Royal Crest','linear-gradient(135deg,#1a2a6c,#b21f1f,#fdbb2d)']
].map(a => ({ key:a[0], name:a[1], gradient:a[2] }));

let selectedAccountAvatar = "💹";
let selectedAccountBanner = "default_banner";

function avatarFromKey(key){
  const found = accountAvatarShop.find(a => a.key === key);
  return found || accountAvatarShop[0];
}
function bannerFromKey(key){
  const found = accountBannerShop.find(b => b.key === key);
  return found || accountBannerShop[0];
}

async function loadOwnedAccountCosmetics(userId){
  if (!userId) return { avatars:["default_avatar"], banners:["default_banner","profile_banner_gold","profile_banner_neon","profile_banner_midnight"] };

  const avatars = ["default_avatar"];
  const banners = ["default_banner","profile_banner_gold","profile_banner_neon","profile_banner_midnight"];

  const { data, error } = await window.mmSupabase
    .from("player_assets")
    .select("category,item_key")
    .eq("user_id", userId);

  if (!error) {
    (data || []).forEach(item => {
      if (item.category === "profile_avatar") avatars.push(item.item_key);
      if (item.category === "profile_banner") banners.push(item.item_key);
    });
  }

  try {
    const saveRes = await window.mmSupabase
      .from("save_slots")
      .select("save_data")
      .eq("user_id", userId)
      .single();

    const saveData = saveRes?.data?.save_data || null;
    if (saveData) {
      (saveData.ownedProfileAvatars || []).forEach(key => avatars.push(key));
      (saveData.ownedProfileBanners || []).forEach(key => banners.push(key));
    }
  } catch (e) {}

  return {
    avatars: [...new Set(avatars)],
    banners: [...new Set(banners)]
  };
}

function renderOwnedAccountCosmetics(owned){
  if (el.ownedAvatarInventory()) {
    const avatarKeys = owned?.avatars || ["default_avatar"];
    el.ownedAvatarInventory().innerHTML = avatarKeys.map(key => {
      const a = avatarFromKey(key);
      const active = a.icon === selectedAccountAvatar ? " active" : "";
      return `<button type="button" class="invAvatarBtn${active}" data-avatar-key="${a.key}" title="${a.name}">${a.icon}</button>`;
    }).join("");
    el.ownedAvatarInventory().querySelectorAll("[data-avatar-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        const a = avatarFromKey(btn.dataset.avatarKey);
        selectedAccountAvatar = a.icon;
        renderOwnedAccountCosmetics(owned);
      });
    });
  }
  if (el.ownedBannerInventory()) {
    const bannerKeys = owned?.banners || ["default_banner"];
    el.ownedBannerInventory().innerHTML = bannerKeys.map(key => {
      const b = bannerFromKey(key);
      const active = b.key === selectedAccountBanner ? " active" : "";
      return `<button type="button" class="invBannerBtn${active}" data-banner-key="${b.key}" title="${b.name}" style="background:${b.gradient}"></button>`;
    }).join("");
    el.ownedBannerInventory().querySelectorAll("[data-banner-key]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedAccountBanner = btn.dataset.bannerKey;
        renderOwnedAccountCosmetics(owned);
      });
    });
  }
}


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

  
  let profileFormDirty = false;
  let suppressProfileDirty = false;

  function bindProfileDirtyTracking() {
    const form = $("#profileForm");
    if (!form || form.dataset.dirtyBound === "1") return;
    form.dataset.dirtyBound = "1";
    form.addEventListener("input", () => {
      if (!suppressProfileDirty) profileFormDirty = true;
    });
    form.addEventListener("change", () => {
      if (!suppressProfileDirty) profileFormDirty = true;
    });
  }


  let accountDetailsLoadedOnce = false;

async function getUser() {
    const { data, error } = await window.mmSupabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function refreshAuthUI() {
    const user = await getUser().catch(() => null);
    setText(el.authStatus(), user ? `Signed in as ${user.email}` : "Not signed in");
    if (el.signOutBtn()) el.signOutBtn().hidden = !user;
    if (el.signInBtn()) el.signInBtn().hidden = !!user;
    if (el.signUpBtn()) el.signUpBtn().hidden = !!user;
    if (el.authUsername()) el.authUsername().closest('.usernameRow')?.classList.toggle('hidden', !!user);
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

    try {
      const user = await getUser();
      if (user) {
        localStorage.setItem("MM_LAST_LOGIN", JSON.stringify({ email: user.email || "", id: user.id || "" }));
        const prof = await window.mmSupabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (prof?.data) localStorage.setItem("MM_PROFILE_HINT", JSON.stringify(prof.data));
      }
    } catch (e) {}

    try {
      sessionStorage.setItem("MM_SHOW_GAME_LOADING", "1");
      const user = await getUser().catch(() => null);
      let profileHint = null;
      if (user) {
        const prof = await window.mmSupabase.from("profiles").select("username,display_name").eq("id", user.id).maybeSingle();
        profileHint = prof?.data || null;
        const stats = await window.mmSupabase.from("player_stats").select("net_worth").eq("user_id", user.id).maybeSingle();
        sessionStorage.setItem("MM_LOADING_HINT", JSON.stringify({
          username: profileHint?.username || "",
          display_name: profileHint?.display_name || profileHint?.username || "",
          net_worth: Number(stats?.data?.net_worth || 0)
        }));
      }
    } catch (e) {}
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
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(HUB_AVATAR_FALLBACK_KEY);
      localStorage.removeItem("MM_LAST_LOGIN");
      localStorage.removeItem("MM_PROFILE_HINT");
    } catch (e) {}
    flash(el.authMessage(), "Signed out.");
    await refreshAuthUI();
    setTimeout(() => { window.location.href = "./index.html"; }, 250);
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

  
  async function fetchLeaderboardRowsIndex() {
    // primary path
    try {
      const res = await window.mmSupabase
        .from("leaderboard_public")
        .select("*")
        .order("net_worth", { ascending: false })
        .limit(100);
      if (!res.error && Array.isArray(res.data)) return res.data;
    } catch (e) {}

    // fallback path
    try {
      const statsRes = await window.mmSupabase
        .from("player_stats")
        .select("*")
        .order("net_worth", { ascending: false })
        .limit(100);
      if (statsRes.error || !Array.isArray(statsRes.data)) return [];
      const statsRows = statsRes.data || [];
      const profileRes = await window.mmSupabase.from("profiles").select("id,username,display_name");
      const profiles = Array.isArray(profileRes.data) ? profileRes.data : [];
      const byId = new Map(profiles.map(p => [p.id, p]));
      return statsRows.map(r => {
        const p = byId.get(r.user_id) || {};
        return {
          username: p.username || "unknown",
          display_name: p.display_name || p.username || "Unknown",
          net_worth: r.net_worth || 0,
          prestige: r.prestige || 0,
          empire_tier: r.empire_tier || "-",
          updated_at: r.updated_at || null
        };
      });
    } catch (e) {
      return [];
    }
  }

async function loadLeaderboard() {
    const data = await fetchLeaderboardRowsIndex();

    if (!data.length) {
      leaderboardTargets().forEach(t => {
        const cols = t.id === 'signinLeaderboardBody' ? 3 : 5;
        t.innerHTML = `<tr><td colspan="${cols}">No leaderboard data yet.</td></tr>`;
      });

      const onlineWrap = $("#onlinePlayersList");
      const onlineCount = $("#onlineCount");
      if (onlineWrap) {
        try {
          const selfProfile = JSON.parse(localStorage.getItem("MM_PROFILE_HINT") || "null");
          if (selfProfile?.username) {
            onlineWrap.innerHTML = `
              <a class="miniLeadRow livePlayerRow" href="./index.html?u=${encodeURIComponent(selfProfile.username)}">
                <div class="miniRank">●</div>
                <div><div style="font-weight:900">${selfProfile.display_name || selfProfile.username} (You)</div><div class="muted" style="font-size:.8rem">Online</div></div>
                <div style="font-weight:900">Online</div>
              </a>`;
            if (onlineCount) onlineCount.textContent = "(1)";
            return;
          }
        } catch (e) {}
        onlineWrap.innerHTML = '<div class="muted">No players active right now.</div>';
        if (onlineCount) onlineCount.textContent = "(0)";
      }
      return;
    }

    const fullRows = (data || []).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.display_name || row.username || "Unknown"}</td>
        <td>${fmtMoney(row.net_worth)}</td>
        <td>${row.prestige || 0}</td>
        <td>${row.empire_tier || "-"}</td>
      </tr>`).join("");

    const signRows = (data || []).slice(0, 12).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.display_name || row.username || "Unknown"}</td>
        <td>${fmtMoney(row.net_worth)}</td>
      </tr>`).join("");

    if ($("#leaderboardBody")) {
      $("#leaderboardBody").innerHTML = fullRows || `<tr><td colspan="5">No players yet.</td></tr>`;
    }
    if ($("#signinLeaderboardBody")) {
      $("#signinLeaderboardBody").innerHTML = signRows || `<tr><td colspan="3">No players yet.</td></tr>`;
    }

    const onlineWrap = $("#onlinePlayersList");
    const onlineCount = $("#onlineCount");
    if (onlineWrap) {
      const now = Date.now();
      let online = (data || []).filter(row => {
        const t = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        return t && (now - t) <= 120000;
      }).slice(0, 12);

      try {
        const selfProfile = JSON.parse(localStorage.getItem("MM_PROFILE_HINT") || "null");
        if (selfProfile?.username && !online.some(r => (r.username || "") === selfProfile.username)) {
          online.unshift({
            username: selfProfile.username,
            display_name: selfProfile.display_name || selfProfile.username,
            empire_tier: "Online",
            net_worth: 0,
            __self: true
          });
        }
      } catch (e) {}

      online = online.slice(0, 12);

      onlineWrap.innerHTML = online.length
        ? online.map(row => `
            <a class="miniLeadRow livePlayerRow" href="./index.html?u=${encodeURIComponent(row.username || "")}">
              <div class="miniRank">●</div>
              <div><div style="font-weight:900">${row.display_name || row.username || "Unknown"}${row.__self ? " (You)" : ""}</div><div class="muted" style="font-size:.8rem">${row.empire_tier || "-"}</div></div>
              <div style="font-weight:900">${row.__self ? "Online" : fmtMoney(row.net_worth)}</div>
            </a>
          `).join("")
        : '<div class="muted">No players active right now.</div>';

      if (onlineCount) onlineCount.textContent = `(${online.length})`;
    }
  }

  async function loadMyProfile(force = false) {
    const user = await getUser().catch(() => null);
    if (!user) return;
    if (profileFormDirty && !force) return;
    if (accountDetailsLoadedOnce && !force) return;

    const { data, error } = await window.mmSupabase.from("profiles").select("*").eq("id", user.id).single();
    if (error || !data) return;

    suppressProfileDirty = true;
    try {
      if (el.profileUsername()) el.profileUsername().value = data.username || "";
      if (el.profileDisplayName()) el.profileDisplayName().value = data.display_name || "";
      if (el.profileBio()) el.profileBio().value = data.bio || "";
      if (el.profileFavoriteStock()) el.profileFavoriteStock().value = data.favorite_stock || "";
      if (el.profileTheme()) el.profileTheme().value = data.profile_theme || "default";
      selectedAccountAvatar = data.avatar_url || "💹";
      selectedAccountBanner = data.banner_url || "default_banner";
      const owned = await loadOwnedAccountCosmetics(user.id);
      renderOwnedAccountCosmetics(owned);
      accountDetailsLoadedOnce = true;
    } finally {
      suppressProfileDirty = false;
      try { ensureHubAvatarStudio(); } catch (e) {}
    }
  }

  async function saveMyProfile(evt) {
    evt.preventDefault();
    const user = await getUser().catch(() => null);
    if (!user) return flash(el.profileMessage(), "Sign in first.", false);

    const { data: existing, error: existingError } = await window.mmSupabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    if (existingError && existingError.code !== "PGRST116") return flash(el.profileMessage(), existingError.message, false);

    const payload = {
      id: user.id,
      username: el.profileUsername()?.value?.trim() || existing?.username || el.authUsername()?.value?.trim() || "",
      display_name: el.profileDisplayName()?.value?.trim() || "",
      bio: el.profileBio()?.value?.trim() || "",
      favorite_stock: el.profileFavoriteStock()?.value?.trim() || "",
      profile_theme: el.profileTheme()?.value || "default",
      avatar_url: selectedAccountAvatar || "💹",
      banner_url: selectedAccountBanner || "default_banner",
      is_public: true
    };

    if (!payload.username) return flash(el.profileMessage(), "Username is required.", false);

    const { error } = await window.mmSupabase.from("profiles").upsert(payload);
    if (error) return flash(el.profileMessage(), error.message, false);

    profileFormDirty = false;
    accountDetailsLoadedOnce = true;
    flash(el.profileMessage(), "Profile saved.");
  }

  async function loadPublicProfileByUsername(username) {
    const body = el.publicProfileBody?.() || document.getElementById("publicProfileBody");
    if (!body || !username) return;

    body.innerHTML = '<div class="muted">Loading profile...</div>';

    try {
      const profRes = await window.mmSupabase
        .from("profiles")
        .select("id,username,display_name,bio,favorite_stock,profile_theme,avatar_url,banner_url")
        .eq("username", username)
        .maybeSingle();

      const profile = profRes?.data || null;
      if (!profile) {
        body.innerHTML = "<p>Profile not found.</p>";
        return;
      }

      let stats = null;
      try {
        const statsRes = await window.mmSupabase
          .from("player_stats")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle();
        stats = statsRes?.data || null;
      } catch (e) {}

      const bannerMap = {
        default_banner: 'linear-gradient(135deg,#1877f2,#42b72a)',
        profile_banner_gold: 'linear-gradient(135deg,#f6d365,#fda085)',
        profile_banner_neon: 'linear-gradient(135deg,#7b2ff7,#00c6ff)',
        profile_banner_midnight: 'linear-gradient(135deg,#0f172a,#1e3a8a)'
      };
      const banner = bannerMap[profile.banner_url] || 'linear-gradient(135deg,#1877f2,#42b72a)';
      const avatar = profile.avatar_url || "💹";

      body.innerHTML = `
        <div class="profileCard">
          <div style="min-height:120px;border-radius:14px;border:1px solid #d7dee7;background:${banner};margin-bottom:12px"></div>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            <div style="width:58px;height:58px;border-radius:16px;border:2px solid #fff;background:#f3f4f6;display:grid;place-items:center;font-size:1.7rem;box-shadow:0 10px 24px rgba(0,0,0,.08)">${avatar}</div>
            <div>
              <h3 style="margin:0">${profile.display_name || profile.username}</h3>
              <p style="margin:6px 0 0">@${profile.username}</p>
            </div>
          </div>
          <p style="margin:0 0 12px">${profile.bio || ""}</p>
          <div class="statGrid">
            <div class="statBox"><span>Net Worth</span><strong>${fmtMoney(stats?.net_worth || 0)}</strong></div>
            <div class="statBox"><span>Prestige</span><strong>${stats?.prestige || 0}</strong></div>
            <div class="statBox"><span>Empire</span><strong>${stats?.empire_tier || "-"}</strong></div>
            <div class="statBox"><span>Favorite Stock</span><strong>${profile.favorite_stock || "-"}</strong></div>
          </div>
        </div>`;
    } catch (e) {
      body.innerHTML = "<p>Failed to load profile.</p>";
    }
  }

  async function maybeLoadProfileFromURL() {
    const params = new URLSearchParams(location.search);
    const username = params.get("u");
    const panel = document.getElementById("publicProfileCard") || document.getElementById("publicProfilePanel");
    if (username) {
      if (panel) panel.style.display = "";
      await loadPublicProfileByUsername(username);
    } else {
      if (panel) panel.style.display = "none";
    }
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
    try { ensureHubAvatarStudio(); } catch (e) {}
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
    }, 1500);

    // Keep the leaderboard feeling live on the hub page.
    leaderboardRefreshTimer = setInterval(async () => {
      try {
        await loadLeaderboard();
      } catch (e) {}
    }, 1500);

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
