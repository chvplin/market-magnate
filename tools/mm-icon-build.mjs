/**
 * Single source for purchasable item icon manifest (mirrors game.html businessData + shoppingData).
 * Run from repo root: node tools/mm-icon-build.mjs
 * Writes: assets/icons/icon-manifest.json, assets/icons/mm-icon-assets.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets", "icons");

const businessData = {
  headquarters: [
    "Bedroom Setup",
    "Second Desk",
    "Office Lighting",
    "Garage Office",
    "Small Office Lease",
    "Storefront HQ",
    "Trading Suite",
    "Corporate Floor",
    "Skyscraper HQ",
    "Global Campuses",
    "Financial District Block",
    "Global Tower Network",
    "Sovereign Capital Campus",
  ],
  employees: [
    "Intern",
    "Junior Trader",
    "Analyst",
    "Senior Analyst",
    "Quant Specialist",
    "Advisor",
    "Portfolio Manager",
    "Research Team",
    "Risk Office",
    "Executive Board",
    "Media Strategist",
    "Deal Syndicate",
    "Institutional Partners",
  ],
  software: [
    "Trading Terminal",
    "Realtime Scanner",
    "Charting Pro",
    "Automation Scripts",
    "Data Feed Bundle",
    "Algo Engine",
    "AI Signal Engine",
    "Cloud Trading Mesh",
    "Institutional Stack",
    "Quantum Simulation Lab",
    "Predictive Macro Engine",
    "Neural Strategy Stack",
    "Sentient Market Core",
  ],
  automation: [
    "Auto Alerts",
    "One-Click Rebalancer",
    "Mobile Ops",
    "Smart Routing",
    "Broker API Access",
    "Semi-Auto Trading",
    "Full Algo Desk",
    "24/7 Trading Grid",
    "Global Arbitrage Net",
    "Autonomous Finance Core",
    "Machine-City Execution Net",
    "Cross-Market Omnibot",
  ],
  prestige: [
    "Brand Reputation",
    "Industry Award",
    "VIP Clients",
    "Legacy Connections",
    "Elite Status",
    "Global Influence",
    "Market Mystic Brand",
    "Financial Dynasty",
    "Private Access Network",
    "Wall Street Royalty",
    "Market Kingmaker",
    "Legendary Financial Aura",
  ],
};

const shoppingData = {
  homes: [
    "Tiny Apartment",
    "Starter House",
    "Suburban Home",
    "Downtown Loft",
    "Luxury Condo",
    "Beach House",
    "Estate Home",
    "Gated Mansion",
    "Island Villa",
    "Mega Estate Compound",
    "Sky Palace Penthouse",
    "Private Island Chain",
  ],
  cars: [
    "Rusty Beater",
    "Used Sedan",
    "Sport Coupe",
    "Executive Sedan",
    "Luxury SUV",
    "Italian Supercar",
    "Electric Hypercar",
    "Carbon Hypercar",
    "Private Helicopter",
    "Private Jet",
    "Superyacht Fleet",
    "Orbital Leisure Shuttle",
  ],
  jewelry: [
    "Silver Ring",
    "Gold Chain",
    "Diamond Pendant",
    "Platinum Set",
    "Rare Gem Collection",
    "Museum-Grade Stones",
    "Crown Jewel Vault",
    "Blue Diamond Reserve",
  ],
  watches: [
    "Everyday Watch",
    "Mechanical Watch",
    "Swiss Luxury Watch",
    "Diamond Bezel Watch",
    "Collector Tourbillon",
    "One-of-One Timepiece",
    "Vault Collection",
    "Astronomical Time Archive",
  ],
  luxury: [
    "VIP Club Access",
    "Exclusive Parties",
    "First-Class Travel",
    "Yacht Weekends",
    "Private Events",
    "Mega Yacht",
    "Private Festival Sponsorships",
    "Luxury Casino Nights",
  ],
  social: [
    "Networking Brunches",
    "VIP Event Tickets",
    "Luxury Photoshoots",
    "Celebrity Friend Group",
    "Private Retreats",
    "Global Influence Tour",
    "Philanthropy Gala Circuit",
    "Global Media Presence",
  ],
  collectibles: [
    "Signed Wall Print",
    "Bronze Trophy Shelf",
    "Designer Sculpture",
    "Rare Trading Card Vault",
    "Limited Art Toy Set",
    "Crystal Installation",
    "Prototype Tech Relic",
    "Space Memorabilia Gallery",
    "Legendary Game Archive",
    "Ancient Artifact Collection",
  ],
  staff: [
    "Personal Assistant",
    "Lifestyle Manager",
    "Private Security Detail",
    "Image Consultant",
    "Content Team",
    "Luxury Concierge Desk",
    "Flight Crew on Retainer",
    "Household Estate Staff",
  ],
  experiences: [
    "Private Concert Night",
    "Film Festival VIP Run",
    "Track Day Experience",
    "Summit Expedition",
    "World Grand Tour",
    "Private Island Festival",
    "Edge-of-Space Vacation",
    "Orbital Leisure Week",
  ],
};

function slugify(name) {
  return String(name || "item")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80) || "item";
}

/** Asset folder (matches /assets/icons/* layout). */
function iconFolder(kind, category, name) {
  const n = String(name || "").toLowerCase();
  if (kind === "business") return "upgrades";
  if (category === "homes") return "properties";
  if (category === "cars") {
    if (n.includes("yacht")) return "yachts";
    if (n.includes("jet") || n.includes("helicopter") || n.includes("shuttle") || n.includes("orbital")) return "jets";
    return "cars";
  }
  if (category === "jewelry") return "jewelry";
  if (category === "watches") return "watches";
  if (category === "luxury") {
    if (n.includes("yacht")) return "yachts";
    return "lifestyle";
  }
  if (category === "social") return "lifestyle";
  if (category === "collectibles") return "misc";
  if (category === "staff") return "outfits";
  if (category === "experiences") return "lifestyle";
  return "misc";
}

function mapItems(obj, kind) {
  const out = [];
  for (const [category, names] of Object.entries(obj)) {
    names.forEach((name, i) => {
      const id = `${kind}_${category}_${i}`;
      const folder = iconFolder(kind, category, name);
      const slug = slugify(name);
      const file = `${slug}.png`;
      const relPath = `assets/icons/${folder}/${file}`;
      out.push({ id, kind, category, name, folder, slug, file, path: relPath });
    });
  }
  return out;
}

const entries = [...mapItems(businessData, "business"), ...mapItems(shoppingData, "shopping")];

const fallbacks = {
  cars: "assets/icons/cars/_fallback.png",
  properties: "assets/icons/properties/_fallback.png",
  jets: "assets/icons/jets/_fallback.png",
  yachts: "assets/icons/yachts/_fallback.png",
  watches: "assets/icons/watches/_fallback.png",
  jewelry: "assets/icons/jewelry/_fallback.png",
  outfits: "assets/icons/outfits/_fallback.png",
  lifestyle: "assets/icons/lifestyle/_fallback.png",
  upgrades: "assets/icons/upgrades/_fallback.png",
  misc: "assets/icons/misc/_fallback.png",
};

const byItemId = {};
const byNameKey = {};
for (const e of entries) {
  byItemId[e.id] = { path: e.path, folder: e.folder, name: e.name, kind: e.kind, category: e.category };
  byNameKey[e.name] = e.path;
}

const manifest = {
  version: 1,
  generated: new Date().toISOString(),
  byItemId,
  byNameKey,
  fallbacks,
};

fs.mkdirSync(ASSETS, { recursive: true });
const dirs = [
  "cars",
  "properties",
  "jets",
  "yachts",
  "watches",
  "jewelry",
  "outfits",
  "lifestyle",
  "upgrades",
  "misc",
];
for (const d of dirs) {
  fs.mkdirSync(path.join(ASSETS, d), { recursive: true });
}

const jsonPath = path.join(ASSETS, "icon-manifest.json");
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2), "utf8");

const jsPath = path.join(ASSETS, "mm-icon-assets.js");
const embedded = JSON.stringify(manifest);
const jsBody = `/* Auto-generated by tools/mm-icon-build.mjs — do not hand-edit manifest body. */
(function () {
  var manifest = ${embedded};
  function mmSlugifyItemName(name) {
    return String(name || "item")
      .normalize("NFD")
      .replace(/\\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 80) || "item";
  }
  function mmIconFolderForItem(item) {
    var kind = item && item.kind;
    var cat = item && item.category;
    var n = String((item && item.name) || "").toLowerCase();
    if (kind === "business") return "upgrades";
    if (cat === "homes") return "properties";
    if (cat === "cars") {
      if (n.indexOf("yacht") >= 0) return "yachts";
      if (n.indexOf("jet") >= 0 || n.indexOf("helicopter") >= 0 || n.indexOf("shuttle") >= 0 || n.indexOf("orbital") >= 0) return "jets";
      return "cars";
    }
    if (cat === "jewelry") return "jewelry";
    if (cat === "watches") return "watches";
    if (cat === "luxury") {
      if (n.indexOf("yacht") >= 0) return "yachts";
      return "lifestyle";
    }
    if (cat === "social") return "lifestyle";
    if (cat === "collectibles") return "misc";
    if (cat === "staff") return "outfits";
    if (cat === "experiences") return "lifestyle";
    return "misc";
  }
  function mmResolveIconPathForItem(item) {
    if (!item || !manifest.byItemId) return null;
    var row = manifest.byItemId[item.id];
    return row && row.path ? row.path : null;
  }
  function mmResolveIconUrlForItem(item) {
    var p = mmResolveIconPathForItem(item);
    if (!p) return null;
    try {
      return new URL(p, document.baseURI || window.location.href).href;
    } catch (e) {
      return p;
    }
  }
  function mmIconFallbackPath(folder) {
    var f = manifest.fallbacks && manifest.fallbacks[folder];
    if (!f) return null;
    try {
      return new URL(f, document.baseURI || window.location.href).href;
    } catch (e2) {
      return f;
    }
  }
  function mmResolveShopCardImageUrl(item, kind) {
    if (!item) return null;
    var primary = mmResolveIconUrlForItem(item);
    if (primary) return primary;
    var folder = mmIconFolderForItem(item);
    return mmIconFallbackPath(folder);
  }
  window.MM_ICON_MANIFEST = manifest;
  window.mmResolveIconPathForItem = mmResolveIconPathForItem;
  window.mmResolveIconUrlForItem = mmResolveIconUrlForItem;
  window.mmIconFallbackPath = mmIconFallbackPath;
  window.mmResolveShopCardImageUrl = mmResolveShopCardImageUrl;
  window.mmIconFolderForItem = mmIconFolderForItem;
  window.mmSlugifyItemName = mmSlugifyItemName;
  window.mmItemIconImgErr = function (img) {
    if (!img) return;
    try {
      var misc = window.mmIconFallbackPath && window.mmIconFallbackPath("misc");
      if (misc && img.src !== misc) {
        img.src = misc;
        return;
      }
    } catch (e1) {}
    try {
      img.style.display = "none";
      if (window.MM_DEBUG_ICONS) console.warn("[MM][icons] missing asset", img.getAttribute("data-mm-item-id"), img.src);
    } catch (e2) {}
  };
})();
`;

fs.writeFileSync(jsPath, jsBody, "utf8");

console.log("Wrote", jsonPath);
console.log("Wrote", jsPath);
console.log("Entries:", entries.length);
