// Allegedly — idle cursor.
// After ~12 seconds of no mouse movement, the cursor starts to twitch.
// Like something cold. Or restless. Or both.
// Real cursor is hidden, replaced by a tiny SVG div that shakes in place.
// Any mouse movement restores everything instantly.

(async () => {
  if (window.top !== window.self) return;
  if (location.protocol === "chrome-extension:") return;

  // Check settings — if storage not available yet, assume idleCursor enabled.
  let settings = { enabled: true, idleCursor: true, cursorEcho: false };
  try {
    settings = await chrome.storage.sync.get({
      enabled: true, idleCursor: true, cursorEcho: false
    });
  } catch (_) {
    // storage unavailable — proceed with defaults
  }
  if (!settings.enabled) return;
  if (!settings.idleCursor && !settings.cursorEcho) return;

  const idleCursorOn = !!settings.idleCursor;
  const cursorEchoOn = !!settings.cursorEcho;

  const IDLE_MS = 3_000;      // how long before it starts (test: 3s, production: 12s)
  const SHAKE_INTERVAL = 80;  // ms between jitter frames
  const ECHO_DURATION_MS = 2_400;   // length of the trail after waking up
  const ECHO_DOT_INTERVAL = 40;     // ms between dots while in echo window
  const ECHO_FADE_MS = 1_400;       // each dot fades out over this long

  let pos = { x: -999, y: -999 };
  let idleTimer = null;
  let shakeInterval = null;
  let fakeCursor = null;
  let styleEl = null;
  let active = false;

  // ---- cursor SVG (standard arrow, black with white outline) --------------
  const CURSOR_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 18 24">
      <path d="M2 2 L2 20 L7 15 L11 23 L13 22 L9 14 L16 14 Z"
            fill="#0b0b0b" stroke="#f3f3f3" stroke-width="1.5"
            stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
  `.trim();

  // ---- hide real cursor ---------------------------------------------------
  function hideCursor() {
    if (styleEl) return;
    styleEl = document.createElement("style");
    styleEl.id = "__allegedly_cursor_style";
    styleEl.textContent = "*, *::before, *::after { cursor: none !important; }";
    document.documentElement.appendChild(styleEl);
  }

  function showCursor() {
    if (styleEl) { styleEl.remove(); styleEl = null; }
  }

  // ---- fake cursor element ------------------------------------------------
  function createFakeCursor() {
    const el = document.createElement("div");
    el.id = "__allegedly_cursor";
    Object.assign(el.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "18px",
      height: "24px",
      zIndex: "2147483647",
      pointerEvents: "none",
      userSelect: "none",
      transform: `translate(${pos.x}px, ${pos.y}px)`,
      willChange: "transform",
      transition: "none"
    });
    el.innerHTML = CURSOR_SVG;
    document.documentElement.appendChild(el);
    return el;
  }

  // ---- jitter math --------------------------------------------------------
  // Builds a random micro-displacement that feels like shivering.
  // Amplitude grows slightly over time, like something getting colder.
  let shakePhase = 0;

  function nextJitter() {
    shakePhase = Math.min(shakePhase + 1, 40); // ramp up slowly
    const amp = 0.4 + shakePhase * 0.07;        // 0.4 → ~3.2 px max
    const dx = (Math.random() - 0.5) * 2 * amp;
    const dy = (Math.random() - 0.5) * 2 * amp;
    return { dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10 };
  }

  // ---- activate / deactivate ----------------------------------------------
  function activate() {
    if (!idleCursorOn) return;
    if (active) return;
    active = true;
    shakePhase = 0;
    hideCursor();
    fakeCursor = createFakeCursor();

    shakeInterval = setInterval(() => {
      if (!fakeCursor) return;
      const { dx, dy } = nextJitter();
      fakeCursor.style.transform = `translate(${pos.x + dx}px, ${pos.y + dy}px)`;
    }, SHAKE_INTERVAL);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    clearInterval(shakeInterval);
    shakeInterval = null;
    if (fakeCursor) { fakeCursor.remove(); fakeCursor = null; }
    showCursor();
    shakePhase = 0;
  }

  // ---- cursor echo --------------------------------------------------------
  // After the cursor has been still for a while, the next few seconds of
  // movement leave a faint, slow-fading trail. Then it stops on its own.
  // Off during typing or video playback. Never blocks anything.

  let echoLayer = null;
  let echoUntil = 0;
  let lastDotAt = 0;
  let wasIdleForEcho = false;

  function ensureEchoLayer() {
    if (echoLayer) return echoLayer;
    echoLayer = document.createElement("div");
    echoLayer.id = "__allegedly_echo";
    Object.assign(echoLayer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2147483646",
      overflow: "hidden"
    });
    document.documentElement.appendChild(echoLayer);
    return echoLayer;
  }

  function isTypingTarget() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function videoIsPlaying() {
    const vids = document.getElementsByTagName("video");
    for (let i = 0; i < vids.length; i++) {
      const v = vids[i];
      if (!v.paused && !v.ended && v.currentTime > 0 && v.readyState > 2) return true;
    }
    return false;
  }

  function dropEchoDot(x, y) {
    const layer = ensureEchoLayer();
    const dot = document.createElement("div");
    Object.assign(dot.style, {
      position: "absolute",
      left: (x - 2) + "px",
      top: (y - 2) + "px",
      width: "4px",
      height: "4px",
      borderRadius: "50%",
      background: "rgba(243, 243, 243, 0.55)",
      transition: `opacity ${ECHO_FADE_MS}ms linear, transform ${ECHO_FADE_MS}ms linear`,
      willChange: "opacity, transform",
      pointerEvents: "none"
    });
    layer.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = "0";
      dot.style.transform = "scale(0.4)";
    });
    setTimeout(() => dot.remove(), ECHO_FADE_MS + 100);
  }

  function maybeEcho(x, y) {
    if (!cursorEchoOn) return;
    if (!wasIdleForEcho) return;
    const now = Date.now();
    if (now > echoUntil) {
      wasIdleForEcho = false;
      return;
    }
    if (now - lastDotAt < ECHO_DOT_INTERVAL) return;
    if (isTypingTarget() || videoIsPlaying()) return;
    lastDotAt = now;
    dropEchoDot(x, y);
  }

  // ---- track mouse --------------------------------------------------------
  document.addEventListener("mousemove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;

    if (active) {
      // snap fake cursor back to real position on first movement
      deactivate();
      // first wake-up after idle → open the echo window
      if (cursorEchoOn) {
        wasIdleForEcho = true;
        echoUntil = Date.now() + ECHO_DURATION_MS;
      }
    }

    // emit a trailing dot if we're in the wake-up window
    maybeEcho(pos.x, pos.y);

    // reset idle timer (only matters if idle cursor is on)
    if (idleCursorOn) {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(activate, IDLE_MS);
    } else if (cursorEchoOn) {
      // echo-only mode still needs to track idleness so we know when the
      // user is "waking up". Use a soft timer that just flips a flag.
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        wasIdleForEcho = true;
        echoUntil = 0; // window only opens on next move
      }, IDLE_MS);
    }
  }, { passive: true });

  // start the timer once (in case user never moves mouse on load)
  if (idleCursorOn) {
    idleTimer = setTimeout(activate, IDLE_MS);
  } else if (cursorEchoOn) {
    idleTimer = setTimeout(() => { wasIdleForEcho = true; }, IDLE_MS);
  }

  // deactivate on scroll or key too — user is clearly active
  document.addEventListener("keydown", deactivate, { passive: true });
  document.addEventListener("scroll", deactivate, { passive: true });

  // ---- pause when tab is hidden / window unfocused -----------------------
  // If the user is not on this tab, stop counting idle time and kill any
  // active twitch. Otherwise they come back to a shaking cursor that
  // started while they were elsewhere. The cursor is per-tab anyway.
  function pause() {
    clearTimeout(idleTimer);
    idleTimer = null;
    deactivate();
    wasIdleForEcho = false;
    echoUntil = 0;
  }

  function resume() {
    // fresh start on return — wait for real movement before timing again
    pause();
    // do NOT auto-activate; require the user to actually be on the page
    // and idle there before twitching.
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else resume();
  });
  window.addEventListener("blur", pause);
  window.addEventListener("focus", resume);
  window.addEventListener("pagehide", pause);
})();
