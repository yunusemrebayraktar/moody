// Allegedly — background brain.
// Detects events, opens the popup as if you clicked the icon yourself.

import "../lib/lines.js";
import "../lib/storage.js";

// ---- defaults on install ---------------------------------------------------

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(null);
  const patch = {};
  for (const [k, v] of Object.entries(self.ALLEGEDLY_DEFAULTS)) {
    if (!(k in current)) patch[k] = v;
  }
  if (Object.keys(patch).length > 0) {
    await chrome.storage.sync.set(patch);
  }
});

// ---- rate limits -----------------------------------------------------------
// arrival and tabClose: always fire (no cooldown, no global gap).
// search and narrator: throttled so they don't spam.
// idle: throttled — chrome.idle can fire repeatedly.

const cooldowns = { search: 0, narrator: 0, idle: 0, whyHere: 0 };

const MIN_GAP = {
  search:   10_000,
  narrator: 60_000,
  idle:     90_000,
  whyHere:  20 * 60_000,   // at most every 20 minutes
};

// Global anti-spam only for narrator/search/idle.
let lastThrottledOpen = 0;
const GLOBAL_GAP = 8_000;

// Track tabs that were just created so we don't also fire narrator for them.
const justCreatedTabs = new Set();

// Tab id → domain category, kept in memory only.
// On service-worker restart this empties; we just fall back to default copy.
const tabDomain = new Map();

// Context override probabilities.
const LATE_NIGHT_CHANCE = 0.45;   // during 0–5h, swap to lateNight this often
const TAB_HOARDER_CHANCE = 0.5;   // when many tabs, swap to tabHoarder this often
const TAB_HOARDER_THRESHOLD = 18; // "many tabs"

// Probability that a narrator firing turns into a "why are you here." instead.
const WHY_HERE_TAKEOVER = 0.08;

// Narrator can sometimes turn into one of the templated whispers below.
// These need real data (tab age / domain time) to make sense.
const OLDEST_TAB_TAKEOVER = 0.18;
const TIME_ON_DOMAIN_TAKEOVER = 0.18;
const TAB_COUNT_TAKEOVER = 0.18;

// Thresholds before those whispers are even considered.
const OLDEST_TAB_MIN_MS  = 30 * 60_000;   // 30 minutes
const TIME_ON_DOMAIN_MIN = 10 * 60_000;   // 10 minutes today
const TAB_COUNT_MIN      = 10;            // tabs open before tabCount kicks in

// ---- tab age (in-memory) ---------------------------------------------------
// Tab id → first time we saw it open. Reset on service-worker restart, which
// also means restored tabs after browser launch start their clock from "now".
// That is honest enough for a deadpan extension.

const tabBirth = new Map();

function noteTabBirth(tabId, when) {
  if (typeof tabId !== "number") return;
  if (!tabBirth.has(tabId)) tabBirth.set(tabId, when || Date.now());
}

function getTabAge(tabId) {
  const t = tabBirth.get(tabId);
  if (!t) return 0;
  return Date.now() - t;
}

// Seed from existing tabs on startup so brand-new sessions have something.
async function seedTabBirths() {
  try {
    const tabs = await chrome.tabs.query({});
    const now = Date.now();
    tabs.forEach((t) => noteTabBirth(t.id, now));
  } catch (_) { /* ignore */ }
}

// ---- time on domain (today, in-memory) -------------------------------------

const domainMsToday = new Map();   // host → ms accumulated today
let timeDay = todayKey();
let activeTimer = { tabId: null, host: null, since: 0, idle: false };

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function rolloverIfNewDay() {
  const k = todayKey();
  if (k !== timeDay) {
    timeDay = k;
    domainMsToday.clear();
  }
}

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ""); }
  catch (_) { return null; }
}

function flushActiveTimer() {
  rolloverIfNewDay();
  const t = activeTimer;
  if (!t.host || !t.since || t.idle) {
    return;
  }
  const elapsed = Date.now() - t.since;
  if (elapsed > 0) {
    domainMsToday.set(t.host, (domainMsToday.get(t.host) || 0) + elapsed);
  }
  t.since = Date.now();
}

async function setActiveFromTab(tabId) {
  flushActiveTimer();
  let host = null;
  try {
    const tab = await chrome.tabs.get(tabId);
    host = hostOf(tab && tab.url);
  } catch (_) { /* ignore */ }
  activeTimer = { tabId, host, since: Date.now(), idle: false };
}

function pauseActiveTimer() {
  flushActiveTimer();
  activeTimer.idle = true;
}

function resumeActiveTimer() {
  if (!activeTimer.idle) return;
  activeTimer.idle = false;
  activeTimer.since = Date.now();
}

function timeOnDomainFor(host) {
  if (!host) return 0;
  rolloverIfNewDay();
  // Add live time for the active host so the number is fresh.
  let extra = 0;
  if (activeTimer.host === host && !activeTimer.idle && activeTimer.since) {
    extra = Date.now() - activeTimer.since;
  }
  return (domainMsToday.get(host) || 0) + extra;
}

// ---- action badge ----------------------------------------------------------
// the badge feature lives in the popup chip now. we only ensure no stale
// notification-style number remains on the icon.

async function clearActionBadge() {
  try { await chrome.action.setBadgeText({ text: "" }); } catch (_) {}
}

// ---- core ------------------------------------------------------------------

function categoryForUrl(url) {
  if (!url) return null;
  let host = "";
  try { host = new URL(url).hostname.toLowerCase(); } catch (_) { return null; }
  if (!host) return null;

  // strip leading www.
  host = host.replace(/^www\./, "");

  if (/(^|\.)(youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|netflix\.com|disneyplus\.com)$/.test(host)) return "video";
  if (/(^|\.)(twitter\.com|x\.com|reddit\.com|facebook\.com|instagram\.com|tiktok\.com|linkedin\.com|bsky\.app|threads\.net)$/.test(host)) return "social";
  if (/(^|\.)(github\.com|gitlab\.com|bitbucket\.org|stackoverflow\.com|stackexchange\.com|codepen\.io)$/.test(host)) return "code";
  if (/(^|\.)(wikipedia\.org|fandom\.com|wikimedia\.org)$/.test(host)) return "wiki";
  if (/(^|\.)(amazon\.[a-z.]+|ebay\.[a-z.]+|aliexpress\.com|etsy\.com|trendyol\.com|hepsiburada\.com|n11\.com)$/.test(host)) return "shop";
  if (/(^|\.)(chatgpt\.com|chat\.openai\.com|claude\.ai|gemini\.google\.com|perplexity\.ai|copilot\.microsoft\.com)$/.test(host)) return "ai";
  if (/(^|\.)(developer\.mozilla\.org|readthedocs\.io|docs\.[a-z0-9-]+\.[a-z]+)$/.test(host)) return "docs";
  if (host.startsWith("docs.")) return "docs";

  return null;
}

// ---- core ------------------------------------------------------------------

async function openPopup(kind, line) {
  await chrome.storage.session.set({
    lastEvent: { kind, line, at: Date.now() }
  });
  try {
    if (chrome.action.openPopup) {
      const focused = await chrome.windows.getLastFocused({ populate: false });
      await chrome.action.openPopup({ windowId: focused.id });
    }
  } catch (err) {
    console.debug("[allegedly] openPopup failed:", err && err.message);
  }
}

// Decide if the original kind should be replaced based on current context.
// Late night and tab hoarder can override almost any whisper.
async function contextualKind(kind, settings) {
  // idle whispers are their own thing; don't override them.
  if (kind === "idle") return kind;

  // late night override (00:00–04:59 local time)
  const hour = new Date().getHours();
  if (settings.lateNight && hour >= 0 && hour < 5 && Math.random() < LATE_NIGHT_CHANCE) {
    return "lateNight";
  }

  // tab hoarder override on arrival/narrator only — these are reflective moments.
  if ((kind === "arrival" || kind === "narrator") && settings.tabHoarder) {
    try {
      const tabs = await chrome.tabs.query({});
      if (tabs.length >= TAB_HOARDER_THRESHOLD && Math.random() < TAB_HOARDER_CHANCE) {
        return "tabHoarder";
      }
    } catch (_) { /* ignore */ }
  }

  return kind;
}

// Always fires — no cooldown.
async function whisperAlways(kind, opts = {}) {
  const settings = await self.allegedlyGet();
  if (!settings.enabled || !settings[kind]) return;
  const finalKind = await contextualKind(kind, settings);
  // if contextual override is disabled by user, fall back to original
  const useKind = settings[finalKind] ? finalKind : kind;
  const line = opts.line || self.allegedlyPick(useKind);
  await openPopup(useKind, line);
}

// Throttled — cooldown + global gap.
async function whisperThrottled(kind) {
  const settings = await self.allegedlyGet();
  if (!settings.enabled || !settings[kind]) return;
  const now = Date.now();
  if (now - lastThrottledOpen < GLOBAL_GAP) return;
  if (now - (cooldowns[kind] || 0) < MIN_GAP[kind]) return;

  // narrator → maybe takeover by "why are you here." (also throttled separately)
  let useKind = kind;
  let templatedLine = null;

  if (kind === "narrator") {
    // gather what we'd need for the data-driven takeovers
    let activeTab = null;
    try {
      const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      activeTab = t || null;
    } catch (_) {}

    // 1) why are you here. (input-only, dramatic)
    if (
      settings.whyHere &&
      Math.random() < WHY_HERE_TAKEOVER &&
      now - (cooldowns.whyHere || 0) >= MIN_GAP.whyHere
    ) {
      useKind = "whyHere";
      cooldowns.whyHere = now;
    }
    // 2) "you opened this 47 minutes ago."
    else if (
      settings.oldestTab &&
      activeTab &&
      Math.random() < OLDEST_TAB_TAKEOVER
    ) {
      const age = getTabAge(activeTab.id);
      if (age >= OLDEST_TAB_MIN_MS) {
        useKind = "oldestTab";
        templatedLine = self.allegedlyPickTemplated("oldestTab", {
          age: self.allegedlyHumanizeDuration(age)
        });
      }
    }
    // 3) "you have been here 38 minutes today."
    else if (
      settings.timeOnDomain &&
      activeTab &&
      Math.random() < TIME_ON_DOMAIN_TAKEOVER
    ) {
      const host = hostOf(activeTab.url);
      const ms = timeOnDomainFor(host);
      if (ms >= TIME_ON_DOMAIN_MIN) {
        useKind = "timeOnDomain";
        templatedLine = self.allegedlyPickTemplated("timeOnDomain", {
          time: self.allegedlyHumanizeDuration(ms)
        });
      }
    }
    // 4) "23 tabs. allegedly."
    else if (
      settings.tabBadge &&
      Math.random() < TAB_COUNT_TAKEOVER
    ) {
      let count = 0;
      try {
        const tabs = await chrome.tabs.query({});
        count = tabs.length;
      } catch (_) {}
      if (count >= TAB_COUNT_MIN) {
        useKind = "tabCount";
        templatedLine = self.allegedlyPickTemplated("tabCount", { count });
      }
    }
  }

  cooldowns[kind] = now;
  lastThrottledOpen = now;

  // templated whispers carry their own line; skip contextual override.
  if (templatedLine) {
    await openPopup(useKind, templatedLine);
    return;
  }

  const finalKind = useKind === "whyHere"
    ? "whyHere"
    : await contextualKind(useKind, settings);
  const resolvedKind = settings[finalKind] ? finalKind : useKind;
  await openPopup(resolvedKind, self.allegedlyPick(resolvedKind));
}

// ---- pixel garden ----------------------------------------------------------
// 64x64 grid. Each closed tab adds at most one pixel.
// The garden slowly reveals one of the PNGs in /garden-images/. PNGs are
// listed in /garden-images/index.json. Each tab close mostly reveals a
// random opaque pixel of the current "campaign" PNG (with its real RGB);
// occasionally a faint speck appears on an empty cell as background noise.
// When the picture is essentially complete, the next tab close picks a
// new PNG and clears the grid.
//
// Storage: chrome.storage.local
//   pixelGarden_rgba_v1        base64 of Uint8ClampedArray(64*64*4) RGBA
//   pixelGarden_campaign_v1    { file, painted }

const GARDEN_SIZE = 64;
const GARDEN_KEY = "pixelGarden_rgba_v1";
const GARDEN_CAMPAIGN_KEY = "pixelGarden_campaign_v1";

const GARDEN_INDEX_URL = chrome.runtime.getURL("garden-images/index.json");

// Cached decoded artworks: file -> Uint8ClampedArray(64*64*4)
const artCache = new Map();
let artFilesPromise = null;

function getArtFiles() {
  if (artFilesPromise) return artFilesPromise;
  artFilesPromise = (async () => {
    try {
      const res = await fetch(GARDEN_INDEX_URL);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || !Array.isArray(data.files)) return [];
      return data.files.filter((f) => typeof f === "string" && f.endsWith(".png"));
    } catch (_) {
      return [];
    }
  })();
  return artFilesPromise;
}

async function loadArt(file) {
  if (artCache.has(file)) return artCache.get(file);
  try {
    const url = chrome.runtime.getURL("garden-images/" + file);
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    // scale to 64×64 regardless of source size
    const off = new OffscreenCanvas(GARDEN_SIZE, GARDEN_SIZE);
    const ctx = off.getContext("2d");
    ctx.drawImage(bmp, 0, 0, GARDEN_SIZE, GARDEN_SIZE);
    bmp.close && bmp.close();
    const data = ctx.getImageData(0, 0, GARDEN_SIZE, GARDEN_SIZE).data;
    artCache.set(file, data);
    return data;
  } catch (_) {
    return null;
  }
}

function decodeGardenRGBA(b64) {
  const out = new Uint8ClampedArray(GARDEN_SIZE * GARDEN_SIZE * 4);
  if (!b64) return out;
  try {
    const bin = atob(b64);
    const n = Math.min(bin.length, out.length);
    for (let i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
  } catch (_) {}
  return out;
}

function encodeGardenRGBA(arr) {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    s += String.fromCharCode.apply(null, arr.subarray(i, i + chunk));
  }
  return btoa(s);
}

async function newCampaign() {
  const files = await getArtFiles();
  if (files.length === 0) return null;
  const file = files[Math.floor(Math.random() * files.length)];
  return { file, painted: 0 };
}

// Paint up to n pixels in a single storage round-trip.
async function addGardenPixels(n) {
  let stored;
  try {
    stored = await chrome.storage.local.get([GARDEN_KEY, GARDEN_CAMPAIGN_KEY]);
  } catch (_) { return; }

  let grid = decodeGardenRGBA(stored[GARDEN_KEY]);
  let campaign = stored[GARDEN_CAMPAIGN_KEY];

  let art = null;
  if (campaign && typeof campaign.file === "string") {
    art = await loadArt(campaign.file);
  }
  if (!art) {
    campaign = await newCampaign();
    if (!campaign) return;
    art = await loadArt(campaign.file);
    if (!art) return;
    grid = new Uint8ClampedArray(GARDEN_SIZE * GARDEN_SIZE * 4);
  }

  // Build list of unpainted opaque pixels (deterministic, no collision retries).
  // pixelsPerBatch scales with the image's opaque pixel count so that n tab
  // closes always corresponds to roughly the same reveal fraction regardless
  // of how many opaque pixels the source PNG has.
  const totalOpaque = [];
  for (let i = 0; i < GARDEN_SIZE * GARDEN_SIZE; i++) {
    if (art[i * 4 + 3] > 16) totalOpaque.push(i);
  }

  const unpainted = totalOpaque.filter(i => grid[i * 4 + 3] === 0);

  // Fisher-Yates shuffle so revealed pixels are in random order.
  for (let i = unpainted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unpainted[i], unpainted[j]] = [unpainted[j], unpainted[i]];
  }

  // Scale batch size to the image's opaque pixel count so the reveal pace is
  // consistent regardless of PNG content density.
  // Target: finish in ~40-60 tab closes → each batch = 1.7%–2.5% of opaque pixels.
  const scaledN = Math.max(
    20,
    Math.round(totalOpaque.length * (0.017 + Math.random() * 0.008))
  );
  // Caller's n acts as a minimum so forced seeds still work.
  const batchSize = Math.max(n, scaledN);
  const toPaint = unpainted.slice(0, batchSize);
  for (const idx of toPaint) {
    const off = idx * 4;
    grid[off    ] = art[off    ];
    grid[off + 1] = art[off + 1];
    grid[off + 2] = art[off + 2];
    grid[off + 3] = art[off + 3];
  }

  if (toPaint.length === 0) return;

  // Completion: no more unpainted opaque pixels left.
  const completed = unpainted.length <= batchSize;
  const completedFile = completed ? campaign.file : null;
  if (completed) campaign = null;
  else campaign.painted = (campaign.painted || 0) + toPaint.length;

  try {
    const payload = { [GARDEN_KEY]: encodeGardenRGBA(grid) };
    if (campaign) {
      payload[GARDEN_CAMPAIGN_KEY] = campaign;
    }
    if (completedFile) {
      payload.gardenJustCompleted = completedFile;
      let prevLog = [];
      try {
        const s = await chrome.storage.local.get("gardenCompleted");
        prevLog = Array.isArray(s.gardenCompleted) ? s.gardenCompleted : [];
      } catch (_) {}
      payload.gardenCompleted = [...prevLog, { file: completedFile, ts: Date.now() }].slice(-20);
    }
    await chrome.storage.local.set(payload);
    if (!campaign) {
      try { await chrome.storage.local.remove(GARDEN_CAMPAIGN_KEY); } catch (_) {}
    }
  } catch (_) { /* ignore */ }
  return completedFile || null;
}

// ---- triggers --------------------------------------------------------------

// 1) New tab → arrival. Always fires.
chrome.tabs.onCreated.addListener((tab) => {
  justCreatedTabs.add(tab.id);
  setTimeout(() => justCreatedTabs.delete(tab.id), 3_000);
  noteTabBirth(tab.id, Date.now());
  if (tab && tab.url) {
    const cat = categoryForUrl(tab.url);
    if (cat) tabDomain.set(tab.id, cat);
  }
  setTimeout(() => whisperAlways("arrival"), 600);
});

// Track URL → category for tabs as they navigate.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url && !tab.url) return;
  const cat = categoryForUrl(changeInfo.url || tab.url);
  if (cat) tabDomain.set(tabId, cat);
  else tabDomain.delete(tabId);
  // active tab navigated → restart the domain timer for the new host
  if (activeTimer.tabId === tabId) {
    flushActiveTimer();
    activeTimer.host = hostOf(changeInfo.url || tab.url);
    activeTimer.since = Date.now();
  }
});

// 2) Search submit (from content/detector.js). Throttled.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "allegedly:search") {
    setTimeout(() => whisperThrottled("search"), 400);
  }
});

// 3) Tab close. Always fires (skip window close, skip new-tab chrome pages).
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const cat = tabDomain.get(tabId);
  tabDomain.delete(tabId);
  tabBirth.delete(tabId);
  if (activeTimer.tabId === tabId) flushActiveTimer();

  if (removeInfo.isWindowClosing) return;
  // Don't fire for the tab we just created (edge case: immediate close).
  if (justCreatedTabs.has(tabId)) return;

  const settings = await self.allegedlyGet();

  // Pixel garden: opt-in. Random burst per close so the image builds in
  // a reasonable session (avg ~90 pixels → ~45 tab closes to finish).
  // If the garden just completed, skip the tab-close whisper — garden wins.
  if (settings.enabled && settings.pixelGarden) {
    addGardenPixels(60 + Math.floor(Math.random() * 60)).then((completed) => {
      console.debug("[allegedly] garden batch done, completed:", completed);
      if (completed) {
        console.debug("[allegedly] garden complete — opening popup");
        openPopup("gardenDone");
      }
    }).catch((e) => { console.debug("[allegedly] garden error:", e); });
  }

  // Use a domain-flavoured close line if the user opted in and we know the domain.
  let line;
  if (settings.tabAsPersonality && cat) {
    line = self.allegedlyPickTabClose(cat);
  }
  setTimeout(() => whisperAlways("tabClose", line ? { line } : {}), 200);
});

// 4) Tab switch → narrator. Throttled. Skip brand-new tabs.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  // domain timer follows the active tab
  setActiveFromTab(tabId);
  if (justCreatedTabs.has(tabId)) return;
  setTimeout(() => whisperThrottled("narrator"), 400);
});

// 5) Idle → idle whisper. Throttled. Also pause/resume domain timer.
// Fires when the user has been idle (no input) for the detection interval.
try {
  chrome.idle.setDetectionInterval(60); // 60s of no input = idle
  chrome.idle.onStateChanged.addListener((state) => {
    if (state === "idle" || state === "locked") {
      pauseActiveTimer();
      if (state === "idle") {
        setTimeout(() => whisperThrottled("idle"), 200);
      }
    } else if (state === "active") {
      resumeActiveTimer();
    }
  });
} catch (err) {
  console.debug("[allegedly] idle api unavailable:", err && err.message);
}

// ---- startup wiring --------------------------------------------------------

async function bootSession() {
  await seedTabBirths();
  clearActionBadge();
  // seed the active timer from whatever tab is focused right now
  try {
    const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (t) await setActiveFromTab(t.id);
  } catch (_) {}
}

chrome.runtime.onStartup && chrome.runtime.onStartup.addListener(bootSession);
chrome.runtime.onInstalled.addListener(bootSession);
// also boot on first script load (service worker wake-ups)
bootSession();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.tabBadge || changes.enabled) clearActionBadge();
});

// React to focused-window changes (user may switch windows without activating a tab).
chrome.windows && chrome.windows.onFocusChanged && chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    pauseActiveTimer();
    return;
  }
  resumeActiveTimer();
  try {
    const [t] = await chrome.tabs.query({ active: true, windowId });
    if (t) await setActiveFromTab(t.id);
  } catch (_) {}
});
