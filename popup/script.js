// Allegedly — popup.
// Two modes:
//   1. auto-opened by background after an event → show that line, auto-dismiss
//   2. opened manually by the user → show a default thought, no auto-dismiss

const RECENT_WINDOW_MS = 8_000;  // event must be this fresh to count as auto-opened
const AUTO_DISMISS_MS  = 2_200;  // brief: do not steal the keyboard for long
const FADE_OUT_MS      = 130;    // body fade before window.close — kills the sliver

// One-line, deadpan descriptions used by the help view.
// Same voice as the line bank. Lowercase. Short. No emojis.
const HELP_TEXT = {
  enabled:          "the master switch. off means silence.",
  arrival:          "a one-liner when you open a new tab.",
  search:           "a one-liner when you submit a search.",
  narrator:         "rare commentary when you switch tabs.",
  tabClose:         "a one-liner when you close a tab.",
  idleCursor:       "after long stillness, the cursor twitches in place.",
  idle:             "a one-liner after a stretch of doing nothing.",
  tabHoarder:       "occasional remarks when many tabs are open.",
  lateNight:        "after midnight, the lines get a little darker.",
  tabBadge:         "small count chip in this popup, next to the garden. green/yellow/red.",
  oldestTab:        "sometimes mentions how long this tab has been open.",
  timeOnDomain:     "sometimes mentions how long you have been on this site today.",
  whyHere:          "rarely, asks why you are here. an input that goes nowhere.",
  cursorEcho:       "after stillness, your first movements leave a faint trail.",
  tabAsPersonality: "tab close lines change tone based on the kind of site.",
  pixelGarden:      "each closed tab adds one pixel to a small private grid."
};

function closeSoftly() {
  document.body.classList.add("fading");
  setTimeout(() => window.close(), FADE_OUT_MS);
}

(async () => {
  const lineEl = document.getElementById("line");
  const main = document.getElementById("main");
  const settingsView = document.getElementById("settings");
  const openSettingsBtn = document.getElementById("open-settings");
  const closeSettingsBtn = document.getElementById("close-settings");
  const nahBtn = document.getElementById("nah");
  const whyInput = document.getElementById("why-input");
  const gardenTrigger = document.getElementById("garden-trigger");
  const gardenView = document.getElementById("garden");
  const gardenCanvas = document.getElementById("garden-canvas");
  const gardenClose = document.getElementById("garden-close");
  const gardenClearBottom = document.getElementById("garden-clear-bottom");
  const gardenDownload = document.getElementById("garden-download");
  const gardenBadge = document.getElementById("garden-badge");
  const gardenCaption = document.getElementById("garden-caption");
  const helpView = document.getElementById("help");
  const helpList = document.getElementById("help-list");
  const openHelpBtn = document.getElementById("open-help");
  const closeHelpBtn = document.getElementById("close-help");
  const tabChip = document.getElementById("tab-chip");

  // ---- tab count chip -----------------------------------------------------
  // shown only when the user has the chip enabled. lives in the popup,
  // never on the action icon.
  (async () => {
    if (!tabChip) return;
    let settings = {};
    try { settings = await self.allegedlyGet(); } catch (_) {}
    if (!settings.enabled || !settings.tabBadge) return;
    let count = 0;
    try {
      const tabs = await chrome.tabs.query({});
      count = tabs.length;
    } catch (_) { return; }
    let tone = "green";
    if (count >= 20) tone = "red";
    else if (count >= 10) tone = "yellow";
    tabChip.textContent = String(count);
    tabChip.dataset.tone = tone;
    tabChip.classList.remove("hidden");
  })();

  // ---- decide what to show ------------------------------------------------

  let line = "";
  let kind = "arrival";
  let autoOpened = false;

  try {
    const { lastEvent } = await chrome.storage.session.get("lastEvent");
    if (lastEvent && Date.now() - lastEvent.at < RECENT_WINDOW_MS) {
      line = lastEvent.line;
      kind = lastEvent.kind || "arrival";
      autoOpened = true;
      // consume it so it doesn't replay on a manual open
      await chrome.storage.session.remove("lastEvent");
    }
  } catch (_) {
    // chrome.storage.session may be missing in some contexts; fall through
  }

  if (!line) {
    line = self.allegedlyPick("arrival");
  }

  lineEl.textContent = line;
  requestAnimationFrame(() => lineEl.classList.add("show"));

  // ---- gardenDone: jump straight to the garden view ----------------------
  if (kind === "gardenDone") {
    gardenOrigin = "main";
    showGarden();
  }

  // ---- whyHere mode -------------------------------------------------------
  // The input is theatre. Whatever the user types is never read or stored.
  const isWhyHere = kind === "whyHere";
  if (isWhyHere) {
    whyInput.classList.remove("hidden");
    nahBtn.textContent = "close.";
    setTimeout(() => whyInput.focus(), 60);
    whyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        whyInput.value = "";  // do not store. do not send.
        closeSoftly();
      }
    });
  }

  // ---- nah button ---------------------------------------------------------

  nahBtn.addEventListener("click", () => {
    if (autoOpened) {
      // It's a dismissal; just close.
      closeSoftly();
    } else {
      // Manual mode: nah cycles through nah lines as the new thought.
      // Keep the button compact — long replies belong in the line, not the button.
      const next = self.allegedlyPick("nah");
      lineEl.classList.remove("show");
      requestAnimationFrame(() => {
        lineEl.textContent = next;
        requestAnimationFrame(() => lineEl.classList.add("show"));
      });
    }
  });

  // ---- settings panel -----------------------------------------------------

  openSettingsBtn.addEventListener("click", async () => {
    autoCloseTimer && clearTimeout(autoCloseTimer);
    main.classList.add("hidden");
    main.style.display = "none";
    settingsView.classList.remove("hidden");
    settingsView.setAttribute("aria-hidden", "false");
    await wireToggles();
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsView.classList.add("hidden");
    settingsView.setAttribute("aria-hidden", "true");
    main.style.display = "";
  });

  async function wireToggles() {
    if (settingsView.dataset.wired === "1") return;
    settingsView.dataset.wired = "1";
    const settings = await self.allegedlyGet();
    const inputs = settingsView.querySelectorAll("input[data-key]");
    inputs.forEach((input) => {
      const key = input.dataset.key;
      input.checked = !!settings[key];
      input.addEventListener("change", () =>
        self.allegedlySet({ [key]: input.checked })
      );
    });
  }

  // ---- auto-dismiss when triggered by an event ----------------------------

  let autoCloseTimer = null;
  if (autoOpened && !isWhyHere) {
    autoCloseTimer = setTimeout(closeSoftly, AUTO_DISMISS_MS);
    // Any real keypress closes immediately so the user can keep typing.
    // Modifier-only presses (Shift, Control, Alt, Meta) are ignored — those
    // are usually the lead-in to actually typing something.
    const onKey = (e) => {
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt" || e.key === "Meta") return;
      document.removeEventListener("keydown", onKey, true);
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      closeSoftly();
    };
    document.addEventListener("keydown", onKey, true);
    // Mouse interaction cancels auto-close so the user can read.
    const cancel = () => {
      if (!autoCloseTimer) return;
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    };
    document.addEventListener("mousemove", cancel, { once: true });
    document.addEventListener("click", cancel, { once: true });
  }

  // ---- pixel garden -------------------------------------------------------
  // Hidden corner button opens the garden. No labels, no hover, no counts.

  const GARDEN_SIZE = 64;
  const GARDEN_KEY = "pixelGarden_rgba_v1";
  const GARDEN_CAMPAIGN_KEY = "pixelGarden_campaign_v1";

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

  async function renderGarden() {
    const ctx = gardenCanvas.getContext("2d");
    const w = gardenCanvas.width;
    const h = gardenCanvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, w, h);

    let stored = {};
    try { stored = await chrome.storage.local.get([GARDEN_KEY, "gardenJustCompleted"]); } catch (_) {}
    const data = decodeGardenRGBA(stored[GARDEN_KEY]);

    // draw 64x64 ImageData onto a tiny offscreen canvas, then scale up.
    const off = document.createElement("canvas");
    off.width = GARDEN_SIZE;
    off.height = GARDEN_SIZE;
    const offCtx = off.getContext("2d");
    const img = offCtx.createImageData(GARDEN_SIZE, GARDEN_SIZE);
    img.data.set(data);
    offCtx.putImageData(img, 0, 0);
    ctx.drawImage(off, 0, 0, w, h);

    // completion check: any unpainted opaque pixels left?
    // signaled by gardenJustCompleted flag OR by no active campaign while
    // the canvas has painted pixels.
    let stored2 = {};
    try { stored2 = await chrome.storage.local.get(GARDEN_CAMPAIGN_KEY); } catch (_) {}
    const hasPixels = data.some((v, i) => i % 4 === 3 && v > 0);
    const isFinished = hasPixels && !stored2[GARDEN_CAMPAIGN_KEY];

    if (isFinished) {
      if (gardenBadge) gardenBadge.classList.remove("hidden");
      if (gardenCaption && self.allegedlyPick) {
        gardenCaption.textContent = self.allegedlyPick("gardenDone") || "";
        gardenCaption.classList.remove("hidden");
      }
      if (gardenDownload) {
        gardenDownload.href = gardenCanvas.toDataURL("image/png");
        gardenDownload.classList.remove("hidden");
      }
    } else {
      if (gardenBadge) gardenBadge.classList.add("hidden");
      if (gardenCaption) { gardenCaption.textContent = ""; gardenCaption.classList.add("hidden"); }
      if (gardenDownload) gardenDownload.classList.add("hidden");
    }

    // clear the one-shot flag after first view
    if (stored.gardenJustCompleted) {
      try { await chrome.storage.local.remove("gardenJustCompleted"); } catch (_) {}
    }
  }

  function showGarden() {
    autoCloseTimer && clearTimeout(autoCloseTimer);
    main.style.display = "none";
    settingsView.classList.add("hidden");
    settingsView.setAttribute("aria-hidden", "true");
    gardenView.classList.remove("hidden");
    gardenView.setAttribute("aria-hidden", "false");
    renderGarden();
  }

  function hideGarden() {
    gardenView.classList.add("hidden");
    gardenView.setAttribute("aria-hidden", "true");
    if (gardenOrigin === "settings") {
      settingsView.classList.remove("hidden");
      settingsView.setAttribute("aria-hidden", "false");
    } else {
      main.style.display = "";
    }
    gardenOrigin = "main";
  }

  let gardenOrigin = "main";

  gardenTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    gardenOrigin = "main";
    showGarden();
  });
  gardenClose.addEventListener("click", hideGarden);

  if (gardenClearBottom) {
    gardenClearBottom.addEventListener("click", async () => {
      try { await chrome.storage.local.remove([GARDEN_KEY, GARDEN_CAMPAIGN_KEY]); } catch (_) {}
      renderGarden();
      gardenClearBottom.textContent = "cleared.";
      setTimeout(() => { gardenClearBottom.textContent = "clear"; }, 1200);
    });
  }

  // ---- help view ----------------------------------------------------------
  // One sentence per setting. Same voice. No icons. No tooltips.

  function buildHelp() {
    if (helpList.dataset.built === "1") return;
    helpList.dataset.built = "1";
    // Render in the same order as the toggles in the settings panel.
    const inputs = settingsView.querySelectorAll("input[data-key]");
    inputs.forEach((input) => {
      const key = input.dataset.key;
      const label = input.closest(".row").querySelector(".name").textContent;
      const desc = HELP_TEXT[key] || "";
      if (!desc) return;
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = desc;
      helpList.appendChild(dt);
      helpList.appendChild(dd);
    });
  }

  function showHelp() {
    buildHelp();
    settingsView.classList.add("hidden");
    settingsView.setAttribute("aria-hidden", "true");
    helpView.classList.remove("hidden");
    helpView.setAttribute("aria-hidden", "false");
  }

  function hideHelp() {
    helpView.classList.add("hidden");
    helpView.setAttribute("aria-hidden", "true");
    settingsView.classList.remove("hidden");
    settingsView.setAttribute("aria-hidden", "false");
  }

  if (openHelpBtn) openHelpBtn.addEventListener("click", showHelp);
  if (closeHelpBtn) closeHelpBtn.addEventListener("click", hideHelp);
})();
