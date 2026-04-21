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
    authMessage: () => $("#authMessage"),
    hubAuthChoice: () => $("#hubAuthChoice"),
    hubAuthStage: () => $("#hubAuthStage"),
    hubSignedInRow: () => $("#hubSignedInRow"),
    hubAccountSection: () => $("#hubAccountSection"),
    hubUsernameRow: () => $("#hubUsernameRow"),
    hubPickSignIn: () => $("#hubPickSignIn"),
    hubPickSignUp: () => $("#hubPickSignUp"),
    hubAuthBack: () => $("#hubAuthBack")
  };
  const isIndexPage = /\/index\.html$/i.test(location.pathname) || /\/$/i.test(location.pathname);
  const isSignInPage = /\/signin\.html$/i.test(location.pathname);
  const isSignUpPage = /\/signup\.html$/i.test(location.pathname);
  /** `file:` / Windows paths may use backslashes or omit a leading slash in `pathname`. */
  const isAccountPage = /(^|[\\/])account\.html$/i.test(String(location.pathname || ""));
  /** After sign-out or forced session end on hub pages, return to hub (Sign in / Create account). */
  const MM_HUB_AUTH_LANDING = "./index.html";

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

  /** US short-scale suffixes through decillion; matches game `MM_MONEY_SUFFIX_STEPS` for hub-only pages. */
  const MM_HUB_SUFFIX_STEPS = [
    [1e33, "De"],
    [1e30, "No"],
    [1e27, "Oc"],
    [1e24, "Sp"],
    [1e21, "Sx"],
    [1e18, "Qi"],
    [1e15, "Qa"],
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"]
  ];

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mmEscapeIlikeExact(str) {
    return String(str ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "\\%")
      .replace(/_/g, "\\_");
  }

  function hubFmtMoney(n) {
    const num = Number(n);
    if (!isFinite(num)) return "$0";
    const neg = num < 0;
    const abs = Math.abs(num);
    const p = neg ? "-" : "";
    if (abs < 1000) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: abs >= 100 ? 0 : 2
      }).format(num);
    }
    for (const [th, suf] of MM_HUB_SUFFIX_STEPS) {
      if (abs >= th) {
        const v = abs / th;
        const dec = v >= 100 ? 0 : v >= 10 ? 1 : 2;
        return p + "$" + v.toFixed(dec) + suf;
      }
    }
    const e = Math.floor(Math.log10(abs));
    const m = abs / Math.pow(10, e);
    return p + "$" + m.toFixed(3) + "×10^" + e;
  }

  function hubFmtStat(n) {
    const x = Number(n);
    if (!isFinite(x)) return "0";
    const ri = Math.round(x);
    const a = Math.abs(ri);
    const neg = ri < 0 ? "-" : "";
    if (a < 10000) return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(ri);
    for (const [th, suf] of MM_HUB_SUFFIX_STEPS) {
      if (a >= th) {
        const v = a / th;
        const dec = v >= 100 ? 0 : v >= 10 ? 1 : 2;
        return neg + v.toFixed(dec) + suf;
      }
    }
    const e = Math.floor(Math.log10(a));
    const m = a / Math.pow(10, e);
    return neg + m.toFixed(3) + "×10^" + e;
  }

  function fmtMoney(n) {
    if (n == null || isNaN(n)) return "$0";
    const v = Number(n);
    if (typeof window.mmFormatMoney === "function") return window.mmFormatMoney(v);
    return hubFmtMoney(v);
  }

  function fmtStat(n) {
    const v = Number(n);
    if (typeof window.mmFormatStat === "function") return window.mmFormatStat(v);
    return hubFmtStat(v);
  }

  function hubOnlineRowHtml(row) {
    let isSelf = !!row.__self;
    if (!isSelf) {
      try {
        const hint = JSON.parse(localStorage.getItem("MM_PROFILE_HINT") || "null");
        const su = String(hint?.username || "")
          .trim()
          .toLowerCase();
        const ru = String(row.username || "")
          .trim()
          .toLowerCase();
        if (su && ru && su === ru) isSelf = true;
      } catch (e) {}
    }
    const name = row.display_name || row.username || "Unknown";
    const tier = row.empire_tier || "-";
    const amt = isSelf ? "Online" : fmtMoney(row.net_worth);
    const href = `./index.html?u=${encodeURIComponent(row.username || "")}`;
    return `
      <a class="miniLeadRow livePlayerRow" href="${href}">
        <div class="miniRank">●</div>
        <div class="miniLbMid">
          <div class="miniLbName">${escapeHtml(name)}${isSelf ? " (You)" : ""}</div>
          <div class="miniLbSub muted">${escapeHtml(tier)}</div>
        </div>
        <div class="miniLbAmtCol"><div class="miniLbAmt">${amt}</div></div>
      </a>`;
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

  function hubEnterSignIn() {
    const stage = el.hubAuthStage();
    const choice = el.hubAuthChoice();
    const urow = el.hubUsernameRow();
    if (choice) choice.hidden = true;
    if (stage) stage.hidden = false;
    if (urow) urow.hidden = true;
    if (el.signInBtn()) el.signInBtn().hidden = false;
    if (el.signUpBtn()) el.signUpBtn().hidden = true;
  }

  function hubEnterSignUp() {
    const stage = el.hubAuthStage();
    const choice = el.hubAuthChoice();
    const urow = el.hubUsernameRow();
    if (choice) choice.hidden = true;
    if (stage) stage.hidden = false;
    if (urow) urow.hidden = false;
    if (el.signInBtn()) el.signInBtn().hidden = true;
    if (el.signUpBtn()) el.signUpBtn().hidden = false;
  }

  function hubAuthBack() {
    const stage = el.hubAuthStage();
    const choice = el.hubAuthChoice();
    if (stage) stage.hidden = true;
    if (choice) choice.hidden = false;
    if (el.signInBtn()) el.signInBtn().hidden = true;
    if (el.signUpBtn()) el.signUpBtn().hidden = true;
  }

async function getUser() {
    const { data, error } = await window.mmSupabase.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function refreshAuthUI() {
    const user = await getUser().catch(() => null);
    // Must run before mutating hubSignedInRow: hiding that row removes Play / Sign out from the layout
    // while still on account.html if navigation is slow, blocked, or never runs — looks like "nothing happened".
    if (!user && isAccountPage) {
      try {
        window.location.replace(new URL(MM_HUB_AUTH_LANDING, window.location.href).href);
      } catch (e) {
        try {
          window.location.href = MM_HUB_AUTH_LANDING;
        } catch (e2) {}
      }
      return;
    }

    setText(el.authStatus(), user ? `Signed in as ${user.email}` : "Not signed in");
    const choice = el.hubAuthChoice();
    const stage = el.hubAuthStage();
    const signedRow = el.hubSignedInRow();
    const acct = el.hubAccountSection();

    if (user) {
      if (choice) choice.hidden = true;
      if (stage) stage.hidden = true;
      if (signedRow) signedRow.hidden = false;
      if (acct) acct.hidden = false;
      if (el.signInBtn()) el.signInBtn().hidden = true;
      if (el.signUpBtn()) el.signUpBtn().hidden = true;
    } else {
      if (signedRow) signedRow.hidden = true;
      if (acct) acct.hidden = true;
      if (!stage || stage.hidden) {
        if (choice) choice.hidden = false;
      }
      if (el.signInBtn()) el.signInBtn().hidden = true;
      if (el.signUpBtn()) el.signUpBtn().hidden = true;
    }

    if (el.syncBtn()) el.syncBtn().hidden = true;
    if (el.loadBtn()) el.loadBtn().hidden = true;

    if (user && (isIndexPage || isSignInPage || isSignUpPage)) {
      window.location.href = "./account.html";
      return;
    }
  }

  async function prepareGameSessionHints() {
    try {
      sessionStorage.setItem("MM_SHOW_GAME_LOADING", "1");
      const user = await getUser().catch(() => null);
      if (!user) return;
      localStorage.setItem("MM_LAST_LOGIN", JSON.stringify({ email: user.email || "", id: user.id || "" }));
      const prof = await window.mmSupabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (prof?.data) localStorage.setItem("MM_PROFILE_HINT", JSON.stringify(prof.data));
      const stats = await window.mmSupabase.from("player_stats").select("net_worth").eq("user_id", user.id).maybeSingle();
      sessionStorage.setItem(
        "MM_LOADING_HINT",
        JSON.stringify({
          username: prof?.data?.username || "",
          display_name: prof?.data?.display_name || prof?.data?.username || "",
          net_worth: Number(stats?.data?.net_worth || 0)
        })
      );
    } catch (e) {}
  }

  async function navigateToGame() {
    const user = await getUser().catch(() => null);
    if (!user) {
      flash(el.authMessage(), "Sign in first.", false);
      return;
    }
    await loadMyProfile(true);
    await prepareGameSessionHints();
    window.location.href = "./game.html";
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

    flash(el.authMessage(), "Account created. Redirecting to your account...", true);
    await refreshAuthUI();
    window.location.href = "./account.html";
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

    flash(el.authMessage(), "Signed in. Redirecting to your account...", true);
    await refreshAuthUI();
    window.location.href = "./account.html";
  }

  function clearPersistedSupabaseSession() {
    const strip = (store) => {
      if (!store || typeof store.length !== "number") return;
      const keys = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) keys.push(k);
      }
      keys.forEach((k) => {
        try {
          store.removeItem(k);
        } catch (e) {}
      });
    };
    try {
      strip(localStorage);
      strip(sessionStorage);
    } catch (e) {}
  }

  /** Drop out of `mm_public_online_players` (30m window) while still authenticated. */
  async function clearOwnOnlinePresenceRow(userId) {
    if (!window.mmSupabase || !userId) return;
    const stale = "1970-01-01T00:00:00.000Z";
    try {
      await window.mmSupabase
        .from("online_presence")
        .update({ last_seen: stale, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    } catch (e) {}
  }

  let signOutInFlight = false;
  async function signOut() {
    if (signOutInFlight) return;
    signOutInFlight = true;
    const landingHref = (() => {
      try {
        return new URL(MM_HUB_AUTH_LANDING, window.location.href).href;
      } catch (e) {
        return MM_HUB_AUTH_LANDING;
      }
    })();
    const goLanding = () => {
      try {
        window.location.replace(landingHref);
      } catch (e) {
        try {
          window.location.href = landingHref;
        } catch (e2) {}
      }
    };

    if (!window.mmSupabase) {
      flash(el.authMessage(), "Sign-in is not configured.", false);
      signOutInFlight = false;
      return;
    }

    const safetyNav = window.setTimeout(goLanding, 4000);

    try {
      let userId = null;
      try {
        const { data } = await window.mmSupabase.auth.getSession();
        userId = data?.session?.user?.id || null;
      } catch (e) {}
      if (!userId) {
        try {
          const u = await getUser().catch(() => null);
          userId = u?.id || null;
        } catch (e) {}
      }

      try {
        await Promise.race([
          clearOwnOnlinePresenceRow(userId),
          new Promise((r) => setTimeout(r, 2500))
        ]);
      } catch (e) {}

      try {
        const { error } = await window.mmSupabase.auth.signOut({ scope: "global" });
        if (error) {
          const { error: e2 } = await window.mmSupabase.auth.signOut({ scope: "local" });
          if (e2) {
            try {
              console.warn("[MM] signOut", e2.message || e2);
            } catch (x) {}
          }
        }
      } catch (e) {
        try {
          await window.mmSupabase.auth.signOut({ scope: "local" });
        } catch (e2) {}
        try {
          console.warn("[MM] signOut", e && (e.message || e));
        } catch (x) {}
      }

      clearPersistedSupabaseSession();

      try {
        localStorage.removeItem(HUB_AVATAR_FALLBACK_KEY);
        localStorage.removeItem("MM_LAST_LOGIN");
        localStorage.removeItem("MM_PROFILE_HINT");
      } catch (e) {}
      try {
        if (el.authPassword()) el.authPassword().value = "";
        if (el.authEmail()) el.authEmail().value = "";
        if (el.authUsername()) el.authUsername().value = "";
      } catch (e) {}
      accountDetailsLoadedOnce = false;
      hubAuthBack();
    } catch (e) {
      try {
        console.warn("[MM] signOut failed", e && (e.message || e));
      } catch (x) {}
      clearPersistedSupabaseSession();
    } finally {
      try {
        window.clearTimeout(safetyNav);
      } catch (e) {}
      goLanding();
      signOutInFlight = false;
    }
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

  /** Must match `interval '30 minutes'` in public.mm_public_online_players (leaderboard_public_rpc.sql). */
  const MM_ONLINE_PRESENCE_WINDOW_MS = 30 * 60 * 1000;
  /** When skipWindow is false, use same horizon as SQL (30m). Prefer skipWindow:true in onlineOpts. */
  const MM_ONLINE_UI_MAX_AGE_MS = 30 * 60 * 1000;

  function mmDebugSocial(label, payload) {
    try {
      if (window.MM_DEBUG_SOCIAL) console.debug("[MM]" + label, payload);
    } catch (e) {}
  }

  function mmMapOnlineRpcRowHub(r) {
    return {
      user_id: r.user_id,
      username: r.username || "unknown",
      display_name: r.display_name || r.username || "Unknown",
      net_worth: Number(r.net_worth || 0),
      prestige: Number(r.prestige || 0),
      empire_tier: r.empire_tier || "-",
      updated_at: r.updated_at != null ? r.updated_at : null,
      last_seen: r.last_seen != null ? r.last_seen : null,
      last_active: null,
      avatar_dna: r.avatar_dna != null ? r.avatar_dna : null
    };
  }

  function mmFinalizeOnlineListHub(mappedRows, opts) {
    opts = opts || {};
    const maxSlots = opts.maxSlots || 12;
    const windowMs = opts.windowMs || MM_ONLINE_PRESENCE_WINDOW_MS;
    const skipWindow = opts.skipWindow !== false;
    const now = Date.now();
    const inWindow = r => {
      const raw = r.last_seen || r.updated_at || r.last_active || null;
      if (!raw) return false;
      const t = new Date(raw).getTime();
      if (!Number.isFinite(t)) return false;
      if (skipWindow) return true;
      const age = now - t;
      return age <= windowMs && age >= -120000;
    };
    const stamp = r => new Date(r.last_seen || r.updated_at || r.last_active || 0).getTime();
    const candidates = (mappedRows || []).filter(inWindow);
    candidates.sort((a, b) => stamp(b) - stamp(a));
    const seen = new Set();
    const out = [];
    for (let i = 0; i < candidates.length; i++) {
      const r = candidates[i];
      const uid = r.user_id ? String(r.user_id) : "";
      const key = String(r.username || "")
        .trim()
        .toLowerCase();
      const dedupe = uid || key;
      if (!dedupe || seen.has(dedupe)) continue;
      seen.add(dedupe);
      out.push(r);
      if (out.length >= maxSlots) break;
    }
    return out;
  }

  async function mmRpcPublicLeaderboardHub(limit) {
    try {
      if (!window.mmSupabase || typeof window.mmSupabase.rpc !== "function") {
        console.warn("[MM][rpc] mm_public_leaderboard: no supabase client");
        return null;
      }
      const lim = Math.min(500, Math.max(1, Number(limit) || 100));
      const { data, error } = await window.mmSupabase.rpc("mm_public_leaderboard", { limit_rows: lim });
      if (error) {
        console.warn("[MM][rpc] mm_public_leaderboard ERROR", error.code || "", String(error.message || error));
        return null;
      }
      if (!Array.isArray(data)) {
        console.warn("[MM][rpc] mm_public_leaderboard: data is not an array (RPC missing?)", typeof data);
        return null;
      }
      console.info("[MM][rpc] mm_public_leaderboard ok rows=", data.length);
      return data;
    } catch (e) {
      console.warn("[MM][rpc] mm_public_leaderboard threw", e && (e.message || e));
      return null;
    }
  }

  async function fetchLeaderboardRowsIndex() {
    if (!window.mmSupabase) return [];
    const rpcRows = await mmRpcPublicLeaderboardHub(100);
    if (Array.isArray(rpcRows)) {
      mmDebugSocial("[leaderboard][hub] mm_public_leaderboard rows=", rpcRows.length);
      return rpcRows;
    }
    try {
      console.warn("[MM][lb][hub] using leaderboard_public view fallback (RPC failed or missing)");
      const res = await window.mmSupabase
        .from("leaderboard_public")
        .select("*")
        .order("net_worth", { ascending: false })
        .limit(100);
      if (!res.error && Array.isArray(res.data)) {
        console.info("[MM][lb][hub] leaderboard_public view rows=", res.data.length);
        return res.data;
      }
      if (res.error) console.warn("[MM][lb][hub] view error", res.error.message || res.error);
    } catch (e) {}
    console.warn("[MM][lb][hub] no rows — deploy mm_public_leaderboard + leaderboard_public (see leaderboard_public_rpc.sql)");
    return [];
  }

  /** Single path: RPC mm_public_online_players (online_presence + profiles + player_stats in SQL). */
  async function fetchOnlinePlayersHub(maxRows) {
    if (!window.mmSupabase || !maxRows) return [];
    try {
      const lim = Math.min(500, Math.max(1, Number(maxRows) || 120));
      const { data, error } = await window.mmSupabase.rpc("mm_public_online_players", { limit_rows: lim });
      if (error) {
        console.warn("[MM][online][hub] mm_public_online_players", error.message || error);
        return [];
      }
      if (!Array.isArray(data)) {
        console.warn("[MM][rpc] mm_public_online_players: data is not an array (RPC missing?)", typeof data);
        return [];
      }
      console.info("[MM][rpc] mm_public_online_players ok rows=", data.length);
      return data.map(mmMapOnlineRpcRowHub);
    } catch (e) {
      console.warn("[MM][online][hub] fetch failed", e);
      return [];
    }
  }

async function loadLeaderboard() {
    const data = await fetchLeaderboardRowsIndex();
    const onlineSourceRows = await fetchOnlinePlayersHub(160);
    const onlineOpts = { skipWindow: true, windowMs: MM_ONLINE_UI_MAX_AGE_MS, maxSlots: 24 };

    if (!data.length) {
      leaderboardTargets().forEach(t => {
        const cols = t.id === "signinLeaderboardBody" ? 4 : 5;
        t.innerHTML = `<tr><td colspan="${cols}">No leaderboard data yet.</td></tr>`;
      });

      const onlineWrap = $("#onlinePlayersList");
      const onlineCount = $("#onlineCount");
      if (onlineWrap) {
        const online = mmFinalizeOnlineListHub(onlineSourceRows, onlineOpts);
        console.info("[MM][rail][hub] online after finalize (no lb)=", online.length);
        onlineWrap.innerHTML = online.length
          ? online.map(row => hubOnlineRowHtml(row)).join("")
          : '<div class="muted">No players active right now.</div>';
        if (onlineCount) onlineCount.textContent = `(${online.length})`;
      }
      return;
    }

    const fullRows = (data || []).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.display_name || row.username || "Unknown")}</td>
        <td>${fmtMoney(row.net_worth)}</td>
        <td>${fmtStat(row.prestige || 0)}</td>
        <td>${escapeHtml(row.empire_tier || "-")}</td>
      </tr>`).join("");

    const signRows = (data || []).slice(0, 12).map((row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.display_name || row.username || "Unknown")}</td>
        <td>${fmtMoney(row.net_worth)}</td>
        <td>${escapeHtml(row.empire_tier || "-")}</td>
      </tr>`).join("");

    if ($("#leaderboardBody")) {
      $("#leaderboardBody").innerHTML = fullRows || `<tr><td colspan="5">No players yet.</td></tr>`;
    }
    if ($("#signinLeaderboardBody")) {
      $("#signinLeaderboardBody").innerHTML = signRows || `<tr><td colspan="4">No players yet.</td></tr>`;
    }

    const onlineWrap = $("#onlinePlayersList");
    const onlineCount = $("#onlineCount");
    if (onlineWrap) {
      const online = mmFinalizeOnlineListHub(onlineSourceRows, onlineOpts);
      console.info("[MM][rail][hub] online after finalize=", online.length);
      onlineWrap.innerHTML = online.length
        ? online.map(row => hubOnlineRowHtml(row)).join("")
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
      const uEsc = mmEscapeIlikeExact(String(username).trim());
      const profRes = await window.mmSupabase
        .from("profiles")
        .select("id,username,display_name,bio,favorite_stock,profile_theme,avatar_url,banner_url")
        .ilike("username", uEsc)
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
              <h3 style="margin:0">${escapeHtml(profile.display_name || profile.username)}</h3>
              <p style="margin:6px 0 0">@${escapeHtml(profile.username)}</p>
            </div>
          </div>
          <p style="margin:0 0 12px">${escapeHtml(profile.bio || "")}</p>
          <div class="statGrid">
            <div class="statBox"><span>Net Worth</span><strong>${fmtMoney(stats?.net_worth || 0)}</strong></div>
            <div class="statBox"><span>Prestige</span><strong>${fmtStat(stats?.prestige || 0)}</strong></div>
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
    el.hubPickSignIn()?.addEventListener("click", hubEnterSignIn);
    el.hubPickSignUp()?.addEventListener("click", hubEnterSignUp);
    el.hubAuthBack()?.addEventListener("click", hubAuthBack);
    el.signUpBtn()?.addEventListener("click", signUp);
    el.signInBtn()?.addEventListener("click", signIn);
    // Delegated so the visible account page Sign out always runs (avoids duplicate-id / late-DOM edge cases).
    document.addEventListener(
      "click",
      function mmHubSignOutDelegate(ev) {
        const raw = ev.target;
        const rootEl =
          raw && raw.nodeType === 1 ? raw : raw && raw.parentElement && raw.parentElement.nodeType === 1 ? raw.parentElement : null;
        if (!rootEl || !rootEl.closest) return;
        if (!rootEl.closest("#signOutBtn")) return;
        ev.preventDefault();
        void signOut();
      },
      true
    );
    el.syncBtn()?.addEventListener("click", syncToCloud);
    el.loadBtn()?.addEventListener("click", loadFromCloud);
    el.profileForm()?.addEventListener("submit", saveMyProfile);
    el.playBtn()?.addEventListener("click", async () => {
      try {
        await navigateToGame();
      } catch (e) {
        flash(el.authMessage(), "Could not open the game. Try again.", false);
      }
    });
  }

  let leaderboardRefreshTimer = null;

  async function init() {
    if (!window.mmSupabase) return;
    bindEvents();
    try { ensureHubAvatarStudio(); } catch (e) {}
    await refreshAuthUI();
    void loadLeaderboard().catch(function (e) {
      try {
        console.warn("[MM] early hub leaderboard", e && (e.message || e));
      } catch (x) {}
    });
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
    }, 12000);

    leaderboardRefreshTimer = setInterval(async () => {
      try {
        await loadLeaderboard();
      } catch (e) {}
    }, 8000);

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

  function bootHub() {
    init().catch(function (e) {
      try {
        console.warn("[MM] hub init", e && (e.message || e));
      } catch (x) {}
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootHub);
  } else {
    bootHub();
  }
})();
