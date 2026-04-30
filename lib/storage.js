// Allegedly — settings storage
// Defaults: everything on, but rare. The user can disable anything.

const ALLEGEDLY_DEFAULTS = {
  enabled: true,
  arrival: true,
  search: true,
  narrator: true,
  tabClose: true,
  idleCursor: true,
  idle: true,
  tabHoarder: true,
  lateNight: true,
  // quiet brand expression: a number on the action icon. nothing else.
  tabBadge: true,
  // narrator can occasionally surface "you opened this 47 minutes ago."
  oldestTab: true,
  // narrator can occasionally surface "you have been here 38 minutes today."
  timeOnDomain: true,
  // opt-in extras: quiet by default. the user has to ask.
  whyHere: false,            // rare popup with an input that goes nowhere
  cursorEcho: false,         // faint trail when waking from idleness
  tabAsPersonality: false,   // domain-flavoured close lines
  pixelGarden: false,        // each closed tab adds one pixel, hidden corner
  narratorChancePerMinute: 0.2,
  tabCloseChance: 0.35
};

async function allegedlyGet() {
  if (!self.chrome || !chrome.storage) return { ...ALLEGEDLY_DEFAULTS };
  const stored = await chrome.storage.sync.get(ALLEGEDLY_DEFAULTS);
  return stored;
}

async function allegedlySet(patch) {
  if (!self.chrome || !chrome.storage) return;
  await chrome.storage.sync.set(patch);
}

if (typeof self !== "undefined") {
  self.ALLEGEDLY_DEFAULTS = ALLEGEDLY_DEFAULTS;
  self.allegedlyGet = allegedlyGet;
  self.allegedlySet = allegedlySet;
}
