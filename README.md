# allegedly

> allegedly does not track you.
> allegedly does not improve productivity.
> allegedly, it just has thoughts.

A Chrome extension with quiet, intentional opinions.
Dark, minimal, deadpan. Loadable today. Publishable when ready.

---

## What it does

Allegedly never draws on the page. When you do something, the extension's popup opens by itself, says one thing, and goes away.

| trigger | what happens |
|---|---|
| **arrival whispers** | you open a new tab → the popup may pop up with one line |
| **search whispers** | you submit a search form → the popup may pop up with one line |
| **narrator** | you switch tabs → rarely, the popup may pop up |
| **tab close one-liners** | you close a tab → sometimes, the popup pops up briefly |
| **manual open** | click the icon → a quiet thought, the **nah.** button, and (in a hidden corner) settings |

Probabilities and cooldowns are tuned so that allegedly is rare and forgettable. A mosquito, not a billboard.

Frequencies are tuned to be rare on purpose. Chaos must feel curated, not lazy.

---

## Install (developer mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder.
5. Click the extension icon. Read the thought.

If icons look wrong, regenerate them:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-icons.ps1
```

---

## Project structure

```
manifest.json
background/service-worker.js   the brain: detects events, opens the popup
content/detector.js            silent search-form detector (no UI)
popup/                         the entire UI lives here
lib/lines.js                   the entire copy bank
lib/storage.js                 settings + defaults
icons/                         generated PNGs (+ source SVG)
scripts/generate-icons.ps1     PNG generator
```

All copy lives in `lib/lines.js`. Edit there. One voice, no exceptions.

---

## Voice rules (do not break)

- short. flat. lowercase preferred.
- no exclamation marks. no emojis. no jokes that explain themselves.
- never blocks the user. always proceedable.
- the page is sacred. all UI lives in the popup.
- never makes the browser look broken.

---

## Privacy

No network requests. No analytics. Settings are stored via `chrome.storage.sync`,
which lives in the user's own Google account.

---

## Chrome Web Store description (draft)

> **allegedly** is a quiet Chrome extension with opinions.
>
> It does not track you. It does not optimize you. It does not promise focus.
> It occasionally has thoughts about your tabs, your searches, and your timing.
>
> Five small features. All optional. All deadpan.
>
> Side effects may include: mild self-awareness.

---

## Roadmap (later, allegedly)

- v1.1: idle cursor (rare drift, on long inactivity)
- v1.2: micro reality glitch (200ms blur, scroll-only)
- v1.3: productivity theatre dashboard (fake metrics, very serious)
- v1.4: time liar (±2 minutes; off by default; warned)

### Ideas under consideration

quiet candidates that fit the voice. no network. no tracking. popup or cursor only.

- **why are you here.**
  rare popup. one line, one input, one button.
  > why are you here?
  > [           ]   nah.
  whatever the user types is not saved, not sent, not read. the input
  exists only so the question feels real. on submit, the popup closes.
  variants in the line bank: "was this a choice?", "this could've waited.",
  "you could be elsewhere."

- **cursor echo.**
  extends the planned idle cursor. on long inactivity, the cursor leaves
  a faint, slow-fading trail for a few seconds, then stops. no canvas on
  the page; uses the existing cursor layer. off by default. never during
  typing or video playback.

- **tab as personality.**
  the existing tab-close one-liner gets a domain-aware bank.
  wikipedia closes flat. social closes dry. docs close polite.
  same cooldowns, same rarity, same voice — just sorted copy. no profiling,
  no storage of which sites the user visits; the domain is read at the
  moment of close and then forgotten.

- **dead pixel garden** *(popup-only, opt-in).*
  a tiny square in the popup's hidden corner. each tab closed adds one
  pixel to a 64×64 grid. placement is not random: new pixels prefer
  neighbours of existing ones (≈70%) so the shape grows like moss instead
  of noise. tone follows time of day. no counts, no labels, no hover text.
  the grid lives in `chrome.storage.sync`. clearable. never shown unless
  asked for.

filter for future ideas: if it needs a server, draws on the page, shows
metrics, or uses an emoji — it is not allegedly.
