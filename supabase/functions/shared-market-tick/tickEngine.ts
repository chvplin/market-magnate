/**
 * AUTHORITATIVE MARKET TICK (server-side)
 * ---------------------------------------
 * This module mirrors the browser `marketTick` deterministic path in `game.html`.
 * Only the Edge Function should call it. Clients hydrate from `shared_market_snapshot`.
 *
 * Tuning: volatility lives in per-stock `baseVol` and macro/sector decay constants
 * (copied from game.html — change both places if you adjust the sim).
 */
export const SIM_HOURS_PER_CAL_DAY = 24;
export const MM_WORLD_PULSE_MS = 12 * 60 * 1000;
export const MM_SHARED_SIM_T0 = 1704067200000;

export function clamp(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

export function mmRngIrand(rng: ReturnType<typeof mmCreateSharedRng>, a: number, b: number): number {
  return Math.floor(rng.rand(a, b + 1 - 1e-9));
}

export function mmCreateSharedRng(baseGen: number) {
  const gen = (Number(baseGen) >>> 0) || 0;
  let i = 0;
  function u01(): number {
    i += 1;
    let x = Math.imul(gen ^ (i * 0x85ebca6b), 0x9e3779b9 + i) >>> 0;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x >>>= 0;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  }
  return {
    u01,
    rand(a: number, b: number): number {
      return u01() * (b - a) + a;
    },
    randn(): number {
      let u = 0;
      let v = 0;
      while (u <= 1e-12) u = u01();
      while (v <= 1e-12) v = u01();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance(p: number): boolean {
      return u01() < p;
    },
  };
}

function getWallClockWorldPulse(): { slot: number; title: string; sectors: string[]; drift: number; vol: number; until: number } {
  const slot = Math.floor(Date.now() / MM_WORLD_PULSE_MS);
  const kinds = [
    { title: "Tech boom", sectors: ["Technology", "Software", "Cybersecurity", "Speculative Tech", "Media"], drift: 0.0072, vol: 0.004 },
    { title: "Market risk-off", sectors: ["*"], drift: -0.0058, vol: 0.0065 },
    { title: "AI hype cycle", sectors: ["Technology", "Software", "Speculative Tech"], drift: 0.0084, vol: 0.007 },
    { title: "Oil & logistics squeeze", sectors: ["Energy", "Logistics", "Materials"], drift: 0.0065, vol: 0.0055 },
    { title: "Credit tightening", sectors: ["Finance", "Technology", "Software", "EV", "Biotech"], drift: -0.005, vol: 0.005 },
    { title: "Retail melt-up", sectors: ["Retail", "Entertainment", "Media", "EV"], drift: 0.006, vol: 0.0075 },
    { title: "Defensive rotation", sectors: ["Healthcare", "Agriculture", "Finance"], drift: 0.0038, vol: 0.0035 },
    { title: "Commodity super-cycle", sectors: ["Materials", "Energy", "Agriculture"], drift: 0.0068, vol: 0.006 },
  ];
  const k = kinds[slot % kinds.length];
  return { slot, title: k.title, sectors: k.sectors, drift: k.drift, vol: k.vol, until: (slot + 1) * MM_WORLD_PULSE_MS };
}

function mmSyncedPulseAffectsStock(s: any, pulse: ReturnType<typeof getWallClockWorldPulse>): boolean {
  if (!pulse || !s) return false;
  if (pulse.sectors.includes("*")) return true;
  return pulse.sectors.includes(s.sector);
}

function eventAffectsStock(s: any, globalEvent: any): boolean {
  const e = globalEvent;
  if (!e || e.ticks <= 0) return false;
  if (e.symbol) return s.symbol === e.symbol;
  if (e.sectors.includes("*")) return true;
  return e.sectors.includes(s.sector);
}

function maybeTriggerGlobalEvent(g: any, rng: ReturnType<typeof mmCreateSharedRng>): void {
  const rIr = (a: number, b: number) => mmRngIrand(rng, a, b);
  const defs = [
    { title: "Tech Boom", desc: "Tech and software names catch fire for a minute.", sectors: ["Technology", "Software", "Cybersecurity", "Speculative Tech"], drift: 0.018, vol: 0.012, duration: 70 },
    { title: "Flash Crash", desc: "A nasty risk-off wave hits almost everything.", sectors: ["*"], drift: -0.026, vol: 0.02, duration: 55 },
    { title: "Meme Frenzy", desc: "Retail traders pile into the wildest names.", sectors: ["Media", "Entertainment", "Speculative Tech", "EV"], drift: 0.024, vol: 0.028, duration: 65 },
    { title: "Rate Hike Panic", desc: "Higher rates hit growth names and optimism.", sectors: ["Technology", "Software", "EV", "Biotech"], drift: -0.022, vol: 0.016, duration: 60 },
    { title: "Energy Shock", desc: "Energy and logistics get violently repriced.", sectors: ["Energy", "Logistics"], drift: 0.02, vol: 0.018, duration: 75 },
    { title: "Short Squeeze", desc: "One crowded short turns into a vertical spike.", sectors: ["*single*"], drift: 0.04, vol: 0.03, duration: 35 },
  ];
  const d = defs[rIr(0, defs.length - 1)];
  const event = Object.assign({}, d, { ticks: d.duration });
  if (d.sectors[0] === "*single*") {
    const target = g.stocks[rIr(0, g.stocks.length - 1)];
    event.symbol = target.symbol;
    event.title = `${target.symbol} Short Squeeze`;
    event.desc = `${target.symbol} is ripping as shorts get crushed.`;
  }
  g.globalEvent = event;
}

function makeNews(g: any, rng: ReturnType<typeof mmCreateSharedRng>): void {
  const rR = (a: number, b: number) => rng.rand(a, b);
  const rIr = (a: number, b: number) => mmRngIrand(rng, a, b);
  const rCh = (p: number) => rng.chance(p);
  const s = g.stocks[rIr(0, g.stocks.length - 1)];
  const positive = rCh(0.53);
  const buyerMillions = positive ? rR(0.08, Math.max(0.25, s.participants / 220000)) : rR(0.04, Math.max(0.18, s.participants / 300000));
  const templatesPos = [
    `${s.name} posts a surprise beat and ${buyerMillions.toFixed(2)}M buyers rush in.`,
    `Retail hype explodes around ${s.symbol} as forums pile on.`,
    `${s.name} hints at a major partnership and market demand surges.`,
    `Analysts lift ${s.symbol} after strong forward guidance.`,
    `${s.name} trends across finance feeds and buying pressure snowballs.`,
  ];
  const templatesNeg = [
    `${s.name} disappoints traders and roughly ${buyerMillions.toFixed(2)}M sellers rush for the exit.`,
    `${s.symbol} gets hit with a nasty downgrade and panic selling spreads.`,
    `A rough outlook dents confidence in ${s.name}.`,
    `${s.symbol} stumbles after a weak forecast and momentum flips red.`,
    `Concern spreads around ${s.name} and sellers lean heavily on the tape.`,
  ];
  const effects = positive ? rR(0.015, 0.06) : -rR(0.015, 0.07);
  const volBoost = rR(0.006, 0.022);
  const effectHours = rIr(8, 28);
  const headlineWallSec = rIr(14, 48);
  s.newsEffect += effects;
  s.newsVol += volBoost;
  s.newsTicks = Math.max(s.newsTicks || 0, effectHours);
  s.hype += positive ? rR(0.16, 0.65) : -rR(0.18, 0.75);
  s.sentiment = clamp(s.sentiment + effects * 2.2, -1.2, 1.2);
  const fundamentalShift = positive ? rR(0.01, 0.05) : -rR(0.01, 0.06);
  s.fairValue = clamp(s.fairValue * (1 + fundamentalShift), s.floorPrice, s.ceilingPrice * 0.92);
  const crowdFlow = Math.round((buyerMillions * 1000000) * (positive ? 1 : -1));
  const nid = (Number(g._sharedSimGen) || 0) * 1000000 + rIr(1, 899999);
  const card = {
    id: nid,
    tone: positive ? "Bullish" : "Bearish",
    text: (positive ? templatesPos : templatesNeg)[rIr(0, 4)],
    ticker: s.symbol,
    expires: headlineWallSec,
    effect: effects,
    vol: volBoost,
    crowd: crowdFlow,
  };
  if (!Array.isArray(g.newsArchive)) g.newsArchive = [];
  const wallTime = Date.now();
  g.newsArchive.unshift(Object.assign({}, card, { wallTime, simDay: Number(g.dayCount) || 1 }));
  if (g.newsArchive.length > 300) g.newsArchive.length = 300;
  if (!Array.isArray(g.news)) g.news = [];
  g.news.unshift(card);
  if (g.news.length > 24) g.news.length = 24;
  g.newsBonusPool = (typeof g.newsBonusPool === "number" ? g.newsBonusPool : 0) + Math.max(50, Math.abs(effects) * 20000);
}

function ensureStockDefaults(s: any, rRand: (a: number, b: number) => number, rRandn: () => number): void {
  if (typeof s.newsTicks !== "number") s.newsTicks = 0;
  if (typeof s.newsEffect !== "number") s.newsEffect = 0;
  if (typeof s.newsVol !== "number") s.newsVol = 0;
  if (typeof s.hype !== "number") s.hype = 0;
  if (typeof s.sentiment !== "number") s.sentiment = 0;
  if (typeof s.momentum !== "number") s.momentum = 0;
  if (typeof s.bubble !== "number") s.bubble = 0;
  if (typeof s.drift !== "number") s.drift = 0;
  if (!Array.isArray(s.history)) s.history = [s.price];
  if (!Number.isFinite(s._openForSimDay) || s._openForSimDay <= 0) {
    s._openForSimDay = Math.max(1e-9, Number(s.price) || 1);
  }
}

/**
 * One authoritative hour-tick. Mutates `g` in place (clone before call).
 */
export function runAuthoritativeMarketTick(g: any, simGen: number): { dayAdvanced: boolean } {
  const rng = mmCreateSharedRng(Number(simGen) || 0);
  const rRand = (a: number, b: number) => rng.rand(a, b);
  const rRandn = () => rng.randn();
  const rChance = (p: number) => rng.chance(p);

  g.network = g.network || 0;
  g.simHourOfDay = Number(g.simHourOfDay) || 0;
  let dayAdvanced = false;
  g.simHourOfDay++;
  if (g.simHourOfDay >= SIM_HOURS_PER_CAL_DAY) {
    g.simHourOfDay = 0;
    dayAdvanced = true;
    g.dayCount = Number(g.dayCount || 1) + 1;
  }

  const t = (Number(g.dayCount || 1) - 1) * SIM_HOURS_PER_CAL_DAY + Number(g.simHourOfDay || 0);
  const _h = 1 / SIM_HOURS_PER_CAL_DAY;
  const decayH = (pow: number) => Math.pow(pow, _h);
  const hod = Math.max(1, Math.min(SIM_HOURS_PER_CAL_DAY, Number(g.simHourOfDay) || 1));
  const intradayVolFactor = 0.76 + 0.44 * Math.pow(Math.sin(((hod - 0.5) / SIM_HOURS_PER_CAL_DAY) * Math.PI), 2);
  const isNewDayStart = dayAdvanced;
  const openGapMkt = isNewDayStart ? rRandn() * 0.0026 + (typeof g._macroShock === "number" ? g._macroShock : 0) * 0.0034 : 0;
  const sessionMkt =
    (typeof g._macroShock === "number" ? g._macroShock : 0) * 0.0044 * intradayVolFactor +
    rRandn() * (0.00062 + Math.abs(g._macroShock || 0) * 0.002) * intradayVolFactor;
  if (typeof g._sessionMktEwma !== "number") g._sessionMktEwma = 0;
  const sessionMktEwmaPrev = g._sessionMktEwma;

  if (g.globalEvent) {
    g.globalEvent.ticks--;
    if (g.globalEvent.ticks <= 0) g.globalEvent = null;
  }

  if (typeof g._macroShock !== "number") g._macroShock = 0;
  g._macroShock = clamp(
    g._macroShock * decayH(0.965) + rRand(-0.0048, 0.0048) / SIM_HOURS_PER_CAL_DAY + (rChance(0.018 / SIM_HOURS_PER_CAL_DAY) ? rRand(-0.014, 0.014) : 0),
    -0.055,
    0.055,
  );
  if (!g._sectorShock || typeof g._sectorShock !== "object") g._sectorShock = Object.create(null);
  const sectorShock = g._sectorShock;
  const sectorsSeen = new Set<string>();
  for (const st of g.stocks) {
    const sec = st.sector || "Other";
    if (sectorsSeen.has(sec)) continue;
    sectorsSeen.add(sec);
    const prev = typeof sectorShock[sec] === "number" ? sectorShock[sec] : rRand(-0.04, 0.04);
    sectorShock[sec] = clamp(
      prev * decayH(0.955) + rRand(-0.0065, 0.0065) / SIM_HOURS_PER_CAL_DAY + (rChance(0.012 / SIM_HOURS_PER_CAL_DAY) ? rRand(-0.018, 0.018) : 0),
      -0.095,
      0.095,
    );
  }

  const wPulse = getWallClockWorldPulse();
  if (g._mmPulseAnnouncedSlot !== wPulse.slot) {
    g._mmPulseAnnouncedSlot = wPulse.slot;
    if (!Array.isArray(g._arenaFeed)) g._arenaFeed = [];
    g._arenaFeed.unshift({ t: Date.now(), kind: "world", text: `Everyone: ${wPulse.title}` });
    if (g._arenaFeed.length > 48) g._arenaFeed.length = 48;
  }

  const heroOpenSnap = isNewDayStart ? g.stocks.map((s: any) => Number(s.price) || 0) : null;

  for (const s of g.stocks) {
    ensureStockDefaults(s, rRand, rRandn);
    if (isNewDayStart) {
      s.dayHigh = s.price;
      s.dayLow = s.price;
    }
    if (typeof s.idioPhase !== "number") s.idioPhase = rRand(0, Math.PI * 2);
    if (typeof s.latent !== "number") s.latent = rRand(-0.12, 0.12);
    if (typeof s.volCluster !== "number") s.volCluster = s.baseVol;
    if (typeof s.microAmp !== "number") s.microAmp = rRand(0.00065, 0.0028);

    s.latent = clamp(
      (s.latent * decayH(0.9)) +
        rRandn() * (0.009 + s.baseVol * 0.14) / SIM_HOURS_PER_CAL_DAY +
        (s.newsEffect || 0) * 0.014 / SIM_HOURS_PER_CAL_DAY,
      -0.42,
      0.42,
    );

    if (typeof s.microWalk !== "number") s.microWalk = rRandn() * 0.006;
    s.microWalk = clamp(
      s.microWalk * decayH(0.85) +
        rRandn() * (0.00135 + s.baseVol * 0.0026) * intradayVolFactor / SIM_HOURS_PER_CAL_DAY,
      -0.048,
      0.048,
    );

    const idioWave = Math.sin(t * (0.052 + s.baseVol * 0.95) + s.idioPhase) * s.microAmp * 1.38;
    const sym = s.symbol || "ZZ";
    const symJ = (sym.length * 23 + sym.charCodeAt(0) * 5 + (s.colorHue || 0)) * 0.017;
    const weakGlobal = Math.sin(t * (0.027 + s.baseVol * 0.014) + (s.colorHue || 0) * 0.022 + symJ) * 0.00078;
    const secKey = s.sector || "Other";
    const secBase = sectorShock[secKey] || 0;
    const secPulse = secBase * (0.48 + ((s.colorHue || 0) % 113) / 220);
    const sectorComp = secPulse * 0.0105;
    const macroBeta = 0.52 + (((sym.charCodeAt(0) * 11 + (s.colorHue || 0)) % 95) / 200);
    const macroComp = g._macroShock * 0.02 * macroBeta;
    const idioNoise = rRandn() * s.baseVol * 0.007 * intradayVolFactor;
    const cyc = idioWave + weakGlobal * 0.45 + sectorComp + macroComp + s.latent * 0.0024 + s.microWalk + idioNoise;

    if (typeof s.anchorDrift !== "number") s.anchorDrift = 0;
    s.anchorDrift = clamp(s.anchorDrift * decayH(0.93) + rRandn() * 0.0002 / SIM_HOURS_PER_CAL_DAY, -0.0022, 0.0022);
    s.anchorPrice = clamp(
      s.anchorPrice * (1 + s.anchorDrift / SIM_HOURS_PER_CAL_DAY),
      Math.max(s.floorPrice * 1.12, s.price * 0.35),
      s.ceilingPrice * 0.9,
    );
    const anchor = Number(s.anchorPrice) > 0 ? s.anchorPrice : Math.max(s.floorPrice, s.price);
    const fairPull = (anchor - s.fairValue) / Math.max(anchor, 1e-6);
    const minFair = Math.max(s.floorPrice * 1.02, Math.min(anchor * 0.45, s.ceilingPrice * 0.9));
    s.fairValue = clamp(
      s.fairValue *
        (1 +
          (rRandn() * 0.00265 + s.drift * 0.075 + (s.newsEffect || 0) * 0.032 + fairPull * 0.24) / SIM_HOURS_PER_CAL_DAY),
      minFair,
      s.ceilingPrice * 0.94,
    );

    const valuationGap = (s.price - s.fairValue) / Math.max(1, s.fairValue);
    const overheat = Math.max(0, (s.price / Math.max(1, s.fairValue)) - 1.35);
    const underheat = Math.max(0, 0.78 - (s.price / Math.max(1, s.fairValue)));

    s.drift = clamp(
      s.drift * decayH(0.94) +
        rRandn() * 0.00085 / SIM_HOURS_PER_CAL_DAY +
        s.sentiment * 0.00026 / SIM_HOURS_PER_CAL_DAY -
        valuationGap * 0.0025 / SIM_HOURS_PER_CAL_DAY,
      -0.012,
      0.012,
    );

    if (s.newsTicks > 0) {
      s.newsTicks--;
      if (s.newsTicks === 0) {
        s.newsEffect = 0;
        s.newsVol = 0;
      }
    }

    s.hype *= decayH(0.91);
    s.bubble = clamp((s.bubble || 0) * decayH(0.9) + (overheat * 0.75 + Math.max(0, s.hype) * 0.08) / SIM_HOURS_PER_CAL_DAY, 0, 2.8);
    s.momentum = clamp(s.momentum * decayH(0.56) + s.lastDelta * 0.42 - valuationGap * 0.05 / SIM_HOURS_PER_CAL_DAY, -0.16, 0.16);
    s.sentiment = clamp(s.sentiment * decayH(0.94) + (s.newsEffect * 0.12 - overheat * 0.08 + underheat * 0.03) / SIM_HOURS_PER_CAL_DAY, -1.05, 1.05);

    const eventBoost = eventAffectsStock(s, g.globalEvent) ? g.globalEvent : null;
    const eventDrift = eventBoost ? eventBoost.drift / SIM_HOURS_PER_CAL_DAY : 0;
    const eventVol = eventBoost ? eventBoost.vol / SIM_HOURS_PER_CAL_DAY : 0;
    const clusterBoost = Math.min(0.055, Math.max(0, (s.volCluster - s.baseVol) * 0.42));
    const pulseVolBoost = mmSyncedPulseAffectsStock(s, wPulse) ? (wPulse.vol || 0) * 0.42 : 0;
    const effectiveVol =
      s.baseVol * 0.48 +
      (s.newsVol || 0) * 0.78 +
      Math.abs(s.hype) * 0.0065 +
      g.network * 0.0011 +
      (s.bubble || 0) * 0.0045 +
      eventVol +
      clusterBoost +
      pulseVolBoost;

    const priorDelta = Number(s.lastDelta) || 0;
    const chase = Math.max(0, priorDelta);
    const panic = Math.max(0, -priorDelta);
    let buyerBias =
      0.495 +
      s.sentiment * 0.05 +
      Math.max(0, s.momentum) * 0.045 +
      Math.max(0, s.hype) * 0.025 -
      overheat * 0.07 +
      chase * 4.05 -
      panic * 1.95;
    let sellerBias =
      0.492 -
      s.sentiment * 0.05 +
      Math.max(0, -s.momentum) * 0.05 +
      Math.max(0, -s.hype) * 0.03 +
      overheat * 0.12 +
      panic * 4.25 -
      chase * 1.78;
    buyerBias = clamp(buyerBias, 0.22, 0.82);
    sellerBias = clamp(sellerBias, 0.22, 0.82);

    const buyers = Math.max(2200, s.participants * (buyerBias + rRandn() * 0.019));
    const sellers = Math.max(2200, s.participants * (sellerBias + rRandn() * 0.019));
    const netFlow = buyers - sellers;
    s.lastFlow = netFlow;

    const prevFlowSm = typeof s.flowSmooth === "number" ? s.flowSmooth : netFlow;
    s.flowSmooth = prevFlowSm * 0.86 + netFlow * 0.14;
    const flowBlend = prevFlowSm * 0.55 + netFlow * 0.45;
    const crowdPressure = (flowBlend / Math.max(50000, s.liquidity)) * (0.12 + s.baseVol * 1.38);
    const discountDepth = Math.max(0, (s.fairValue - s.price) / Math.max(s.fairValue, 1e-6));
    const meanReversion =
      -valuationGap * (0.055 + overheat * 0.12) + discountDepth * (0.045 + underheat * 0.06);
    const capPressure = s.price > s.ceilingPrice * 0.9 ? -((s.price / (s.ceilingPrice * 0.9)) - 1) * 0.22 : 0;
    const floorRatio = s.price / Math.max(s.floorPrice, 1e-9);
    const floorBounce =
      floorRatio < 1.38 ? ((1.38 / floorRatio) - 1) * 0.055 + (floorRatio < 1.06 ? 0.014 : 0) : 0;
    const crashChance = s.price > s.fairValue * 1.9 ? Math.min(0.2 / SIM_HOURS_PER_CAL_DAY, (0.018 + overheat * 0.06 + s.bubble * 0.02) / SIM_HOURS_PER_CAL_DAY) : 0;
    const crashShock = rChance(crashChance) ? -rRand(0.08, 0.22) : 0;

    let idioJump = 0;
    const jumpP = Math.min(0.032 / SIM_HOURS_PER_CAL_DAY, (0.0032 + (s.baseVol || 0.03) * 0.16) / SIM_HOURS_PER_CAL_DAY);
    if (rChance(jumpP)) {
      const mag = Math.min(0.09, Math.exp(rRandn() * 0.38 - 1.35) * (0.022 + s.baseVol * 0.45));
      idioJump = (rChance(0.48) ? -1 : 1) * mag;
    }

    const asym = rRandn() * effectiveVol * 0.065;
    const shock =
      rRandn() * effectiveVol * (0.46 + intradayVolFactor * 0.24) +
      (rChance(0.035) ? rRandn() * effectiveVol * 0.48 : 0) +
      asym;

    const stockBeta = 0.78 + (((s.colorHue || 0) % 118) / 290) + (s.baseVol || 0.03) * 0.35;
    const mktBlock = ((sessionMkt || 0) * 0.58 + sessionMktEwmaPrev * 0.42) * stockBeta + openGapMkt * stockBeta;
    const pulseTerm = mmSyncedPulseAffectsStock(s, wPulse) ? wPulse.drift / SIM_HOURS_PER_CAL_DAY : 0;

    const delta = clamp(
      s.drift * 0.14 +
        eventDrift +
        cyc +
        (s.newsEffect || 0) * 0.024 +
        crowdPressure * 0.5 +
        meanReversion +
        capPressure +
        floorBounce +
        crashShock +
        idioJump +
        shock +
        mktBlock +
        pulseTerm,
      -0.2,
      0.2,
    );

    const prevPx = s.price;
    s.price = clamp(prevPx * (1 + delta), s.floorPrice, s.ceilingPrice);
    s.lastDelta = prevPx > 1e-12 ? s.price / prevPx - 1 : 0;
    s.volCluster = (s.volCluster || s.baseVol) * decayH(0.86) + (Math.abs(delta) * 0.5 + s.baseVol * 0.14) / SIM_HOURS_PER_CAL_DAY;
    s.history.push(s.price);
    if (s.history.length > 100) s.history.shift();
    s.dayHigh = Math.max(s.dayHigh, s.price);
    s.dayLow = Math.min(s.dayLow, s.price);

    if (rChance(0.06 / SIM_HOURS_PER_CAL_DAY)) {
      s.participants = Math.max(
        30000,
        Math.round(s.participants * (1 + rRand(-0.04, 0.05) + Math.max(0, s.hype) * 0.015 - overheat * 0.03)),
      );
    }
    if (rChance(0.05 / SIM_HOURS_PER_CAL_DAY)) {
      s.liquidity = Math.max(50000, s.liquidity * (1 + rRand(-0.04, 0.04)));
    }
  }

  if (isNewDayStart && heroOpenSnap && heroOpenSnap.length === g.stocks.length) {
    const rets = g.stocks.map((s: any, i: number) => {
      const c = heroOpenSnap[i];
      const d = Number(s._openForSimDay);
      return d > 1e-12 && c > 0 ? c / d - 1 : 0;
    });
    const nR = rets.length;
    let moodScoreD = 0;
    const dc = Number(g.dayCount) || 1;
    let idxD = ((dc - 1) * 7) % Math.max(1, nR);
    const stepsD = Math.min(8, nR);
    for (let k = 0; k < stepsD; k++) {
      moodScoreD += Number(rets[idxD]) || 0;
      idxD = (idxD + Math.max(1, Math.floor(nR / 5))) % nR;
    }
    g.mood =
      moodScoreD > 0.06
        ? "Euphoric"
        : moodScoreD < -0.06
          ? "Capitulation"
          : moodScoreD > 0.02
            ? "Risk-On"
            : moodScoreD < -0.02
              ? "Shaky"
              : "Balanced";
    for (let i = 0; i < g.stocks.length; i++) {
      g.stocks[i]._openForSimDay = heroOpenSnap[i] || g.stocks[i].price;
    }
  } else {
    const n = g.stocks.length;
    let moodScore = 0;
    let idx = (t * 7) % Math.max(1, n);
    const steps = Math.min(8, n);
    for (let k = 0; k < steps; k++) {
      moodScore += g.stocks[idx].lastDelta || 0;
      idx = (idx + Math.max(1, Math.floor(n / 5))) % n;
    }
    g.mood = moodScore > 0.06 ? "Euphoric" : moodScore < -0.06 ? "Capitulation" : moodScore > 0.02 ? "Risk-On" : moodScore < -0.02 ? "Shaky" : "Balanced";
  }

  g._sessionMktEwma = sessionMktEwmaPrev * 0.84 + sessionMkt * 0.16;

  const g0 = Number(simGen) || 0;
  const metaRng = mmCreateSharedRng((g0 >>> 0) ^ 0xb7e15163);
  if (g._nextBonusGen == null || !Number.isFinite(g._nextBonusGen)) {
    g._nextBonusGen = g0 + mmRngIrand(metaRng, 8, 40);
  }
  if (g0 >= g._nextBonusGen) {
    metaRng.rand(0.0015, 0.006);
    g._nextBonusGen = g0 + mmRngIrand(metaRng, 12, 55);
  }
  if (g._nextGlobalGen == null || !Number.isFinite(g._nextGlobalGen)) {
    g._nextGlobalGen = g0 + mmRngIrand(metaRng, 15, 80);
  }
  if (g0 >= g._nextGlobalGen) {
    maybeTriggerGlobalEvent(g, metaRng);
    g._nextGlobalGen = g0 + mmRngIrand(metaRng, 20, 120);
  }
  const newsRng = mmCreateSharedRng((g0 >>> 0) ^ 0xdeadbeef);
  g.ticksUntilNextNews = (Number.isFinite(g.ticksUntilNextNews) ? g.ticksUntilNextNews : 24) - 1;
  if (g.ticksUntilNextNews <= 0) {
    makeNews(g, newsRng);
    g.ticksUntilNextNews = mmRngIrand(newsRng, 18, 48);
  }

  return { dayAdvanced };
}

export function buildSnapshotPayload(g: any, nextGen: number, dayAdvanced: boolean, writeVersion: number): Record<string, unknown> {
  const arena = {
    feed: Array.isArray(g._arenaFeed) ? g._arenaFeed.slice(0, 48) : [],
    sprint: g.arenaSprint && typeof g.arenaSprint === "object" ? g.arenaSprint : null,
    contract: g.arenaContract && typeof g.arenaContract === "object" ? g.arenaContract : null,
  };
  return {
    ts: Date.now(),
    gen: nextGen,
    v: writeVersion,
    dayCount: g.dayCount,
    simHourOfDay: g.simHourOfDay,
    mood: g.mood,
    _macroShock: g._macroShock,
    _sectorShock: g._sectorShock,
    _sessionMktEwma: g._sessionMktEwma,
    globalEvent: g.globalEvent,
    newsBonusPool: typeof g.newsBonusPool === "number" ? g.newsBonusPool : 0,
    news: Array.isArray(g.news) ? g.news.slice(0, 24) : [],
    newsArchive: Array.isArray(g.newsArchive) ? g.newsArchive.slice(0, 120) : [],
    arena,
    ticksUntilNextNews: Number.isFinite(g.ticksUntilNextNews) ? Math.max(0, Math.floor(g.ticksUntilNextNews)) : 24,
    _nextBonusGen: typeof g._nextBonusGen === "number" && Number.isFinite(g._nextBonusGen) ? g._nextBonusGen : null,
    _nextGlobalGen: typeof g._nextGlobalGen === "number" && Number.isFinite(g._nextGlobalGen) ? g._nextGlobalGen : null,
    _mmPulseAnnouncedSlot: g._mmPulseAnnouncedSlot ?? null,
    dayAdvanced,
    stocks: (g.stocks as any[]).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
      colorHue: s.colorHue,
      baseVol: s.baseVol,
      floorPrice: s.floorPrice,
      ceilingPrice: s.ceilingPrice,
      price: s.price,
      fairValue: s.fairValue,
      anchorPrice: s.anchorPrice,
      anchorDrift: s.anchorDrift,
      dayHigh: s.dayHigh,
      dayLow: s.dayLow,
      lastDelta: s.lastDelta,
      history: Array.isArray(s.history) ? s.history.slice(-100) : [],
      idioPhase: s.idioPhase,
      latent: s.latent,
      volCluster: s.volCluster,
      microAmp: s.microAmp,
      microWalk: s.microWalk,
      drift: s.drift,
      hype: s.hype,
      bubble: s.bubble,
      momentum: s.momentum,
      sentiment: s.sentiment,
      newsEffect: s.newsEffect,
      newsVol: s.newsVol,
      newsTicks: s.newsTicks,
      participants: s.participants,
      liquidity: s.liquidity,
      lastFlow: s.lastFlow,
      flowSmooth: s.flowSmooth,
    })),
  };
}
