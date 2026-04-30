// Allegedly — copy bank
// Tone: dark, quietly poetic, passive-aggressive, dry absurd.
// Rule: short. flat. no exclamation marks. no emojis. lowercase preferred.
// Goofy is allowed only as deadpan absurdism. never slapstick. never quirky.
// if a line would work as a fridge magnet, delete it.

const ALLEGEDLY_LINES = {
  // Popup opens every time a new tab is created.
  arrival: [
    "you opened a new tab. on purpose.",
    "blank slate. again.",
    "still here.",
    "what were you looking for.",
    "the tab is open. you are not.",
    "another beginning, allegedly.",
    "this is the part where you decide.",
    "you came back. expected.",
    "you are not lost. just paused.",
    "you have been here before.",
    "this tab will also close eventually.",
    "another page. another almost.",
    "the page loaded. you have not.",
    "a fresh start. good luck with that.",
    "the cursor blinks. so do you.",
    "new tab. same you.",
    "optimism, disguised as a browser action.",
    "you could just sit here.",
    "the internet is still there. unfortunately.",
    "here again.",
    "the address bar is waiting. it has seen worse.",
    "you do this a lot.",
    "this one might be different. it is not.",
    "going somewhere.",
    "perhaps. perhaps not.",
    "another window into everything and nothing.",
    "the tab is empty. that is fine.",
    "you could close it. you won't.",
    "ready when you are. allegedly.",
    // new — absurd deadpan
    "a tab opens. somewhere, a small bird sighs.",
    "the void has a search bar now.",
    "ctrl t. an ancient summoning.",
    "you have summoned a rectangle of light.",
    "this tab will outlive your intention for it.",
    "your browser has 47 tabs. this one is also you.",
    "a clean tab, like washed dishes. it will not last.",
    "the cursor is blinking morse code. it spells help.",
    "the new tab page is judging you, politely.",
    "you opened it. now what. exactly.",
    "this tab is a houseplant. it expects nothing.",
    "blank. like the inside of a fridge at 3am.",
    "a portal. mostly to nothing.",
    "the dom is loaded. the human is not.",
    "you have opened a small white room. congratulations.",
    "the browser has prepared a stage. nobody auditioned.",
    "another tab. the count goes up. the meaning does not.",
    "fresh tab. faintly hopeful. mostly mistaken.",
    "the wifi router is watching this with mild concern.",
    "this is technically progress."
  ],

  // Popup opens every time a tab is closed.
  tabClose: [
    "one less window into nothing.",
    "good. that one was not helping.",
    "closed. no one will know.",
    "a small mercy.",
    "the tab is gone. so is the time.",
    "you will open it again. probably.",
    "it served its purpose. allegedly.",
    "quietly removed.",
    "another tab. another little death.",
    "you closed it before it closed you.",
    "something ended just now.",
    "that page will not miss you.",
    "closure, of a kind.",
    "one less thing to pretend you were reading.",
    "it is gone. you are still here.",
    "the tab asked nothing of you. and yet.",
    "tidying up. nice try.",
    "it was already dead. you just made it official.",
    "fewer tabs. same amount of problems.",
    "somewhere, a server is relieved.",
    "less is allegedly more.",
    "you were done. the tab was not.",
    "a small act of finality.",
    "closed. returned to the void.",
    "that was not the one either.",
    // new — absurd deadpan
    "the tab dissolved. like a sugar cube. quietly.",
    "ctrl w. a tiny funeral.",
    "the page took a deep breath and left.",
    "one fewer rectangle. the world holds steady.",
    "the tab has been composted.",
    "ram, returned to the wild.",
    "a dom tree, gently uprooted.",
    "it has gone where the cookies go.",
    "you have exiled a website. it will not appeal.",
    "the tab's session is over. it had no notes.",
    "shut. like a door in a house no one lives in.",
    "the favicon is now a memory.",
    "the page is not deleted. it is just elsewhere.",
    "one tab, returned to potential.",
    "you closed it gently. it would not have done the same.",
    "the chrome process exhales.",
    "a tab folds itself. tucks itself in.",
    "swept under the rug labeled history.",
    "the page is offline now. mentally.",
    "good housekeeping, for someone."
  ],

  // Popup opens on search form submit. Throttled.
  search: [
    "you already know the answer.",
    "this will not make you happier.",
    "you have searched this before.",
    "the result will disappoint you. as usual.",
    "are you researching, or avoiding.",
    "this is not the answer you want.",
    "you are looking in the wrong place. as always.",
    "ten more tabs from this. minimum.",
    "what would you do if you found it.",
    "the question is fine. the timing is not.",
    "the internet has an opinion. several, in fact.",
    "you could also just not know.",
    "searching again.",
    "the answer exists. it will not help.",
    "this is your third search today on this.",
    "maybe just sit with the question.",
    "the results are loading. your expectations are not.",
    "another query. another rabbit hole.",
    "you type. the algorithm listens. allegedly.",
    "you could close this tab instead.",
    // new — absurd deadpan
    "you have asked the void a yes or no question.",
    "the search engine sighs and gets to work.",
    "ten blue links. nine wrong. one paywalled.",
    "you are not the first to type this. by far.",
    "the algorithm has noted your concern.",
    "an oracle made of ads is preparing your answer.",
    "this query will join the pile.",
    "your search has been received. by everyone.",
    "the index is consulted. it shrugs.",
    "you typed it like that on purpose.",
    "the internet clears its throat.",
    "somewhere, a data center warms slightly.",
    "you keep asking. it keeps almost answering.",
    "a librarian, somewhere, is weeping.",
    "the question is bigger than the search bar.",
    "ranked, indexed, and still useless.",
    "you will find the second result mildly disappointing.",
    "you spelled it correctly. impressive.",
    "the answer is on page two. it always is.",
    "your search history is a memoir."
  ],

  // Popup opens on tab switch. Heavily throttled (60s).
  narrator: [
    "they open another tab.",
    "a brave attempt at focus.",
    "they scroll. nothing changes.",
    "they return to the same page. of course.",
    "they are reading, but not really.",
    "this is the third time today.",
    "they pause. they consider. they continue.",
    "another minute. another nothing.",
    "they look busy. it is convincing.",
    "the day moves. they do not.",
    "they are doing fine. allegedly.",
    "they switch tabs. hoping something changed.",
    "still scrolling.",
    "a moment of doubt, followed by more scrolling.",
    "they open something new. the old thing is still there.",
    "productivity: pending.",
    "they are everywhere and nowhere.",
    "the browser knows too much.",
    "another tab. another intention.",
    "they will get to it. later.",
    "focus is coming. any minute now.",
    "they sigh. internally.",
    "back again.",
    "something caught their eye. briefly.",
    "they are not procrastinating. they are researching.",
    // new — absurd deadpan
    "they switch tabs at the speed of avoidance.",
    "alt tab. an old reflex.",
    "they have built a small carousel of distractions.",
    "the protagonist returns to a tab they have read four times.",
    "observe: the user, in their natural habitat.",
    "they are foraging for dopamine.",
    "the tab order is now astrological.",
    "they tab through their decisions.",
    "the cursor wanders. it has its reasons.",
    "they are conducting an orchestra of half-read articles.",
    "this is what flow used to look like, allegedly.",
    "a tab, briefly considered. then abandoned.",
    "they are technically working.",
    "the documentary continues.",
    "narrator: it was, in fact, the wrong tab.",
    "they perform the ancient ritual of looking busy.",
    "the user remembers something. then forgets it.",
    "they are gathering tabs like firewood. there will be no fire.",
    "between tabs, briefly, a thought.",
    "they have entered the maze of their own making."
  ],

  // The "nah" button — cycles on each click.
  nah: [
    "nah.",
    "no.",
    "not today.",
    "skip.",
    "pass.",
    "later. never.",
    "decline.",
    "absolutely not.",
    "hard pass.",
    "i'd rather not.",
    "respectfully, no.",
    "not a chance.",
    "maybe never.",
    "no thank you.",
    "next time. also no.",
    "no, but slowly.",
    "negative.",
    "the answer remains no.",
    "still no.",
    "no, with feeling.",
    "we have considered. no.",
    "filed under: no.",
    "noted. ignored.",
    "no, again.",
    "the no stands.",
    "i must decline. quietly.",
    "no, in this economy.",
    "absolutely none of the above.",
    "no, and a small thank you.",
    "the council has voted. no.",
    "technically, still no.",
    "no is a complete sentence.",
    "this offer has been reviewed. no.",
    "regrettably, no.",
    "firmly. softly. no.",
    "no, with respect.",
    "the door is closed on this one.",
    "not at this time, or any other.",
    "it remains a no.",
    "nah, honestly.",
    "nope.",
    "no, i think.",
    "consider this declined.",
    "the answer hasn't changed.",
    "no. (see previous no.)",
    "this isn't it.",
    "not even a little.",
    "not really, no.",
    "kind of no.",
    "extremely no.",
    "politely, absolutely not.",
    "no. gently.",
    "never, probably.",
    "not in the near future.",
    "the vibes say no.",
    "unfortunately, also no.",
    "no. have a good day.",
    "other plans. also no."
  ],

  // Long idle on a tab (no input, no scroll for a while).
  idle: [
    "you have been very still.",
    "the page has been waiting.",
    "are you reading. or buffering.",
    "the cursor has not moved in some time.",
    "the tab is awake. you, less so.",
    "you have entered the staring phase.",
    "this counts as meditation, technically.",
    "the screen is on. the human is loading.",
    "nothing has scrolled in a while.",
    "the page is patient. unusually.",
    "you have been here for several minutes of nothing.",
    "the monitor is doing all the work.",
    "your stillness has been noted.",
    "the cursor blinks alone.",
    "you are not reading. you are looking at letters.",
    "this tab has matured into wallpaper.",
    "have you considered moving.",
    "the page has read itself by now.",
    "you have achieved tab.",
    "the browser thinks you might be a houseplant."
  ],

  // Many tabs open at once.
  tabHoarder: [
    "you have a lot of tabs.",
    "the tabs are starting to look at each other.",
    "this is a collection now.",
    "the tab bar is a horizon.",
    "you will not read all of these.",
    "you know you will not read all of these.",
    "the favicons are getting nervous.",
    "this is a museum of intentions.",
    "each tab is a promise. unkept.",
    "the ram is trying its best.",
    "you have built a small city of pages.",
    "this is more tabs than friends.",
    "the tab bar is now scrollable. impressive.",
    "you opened that one twice. no comment.",
    "every tab here is a tiny later.",
    "a forest of pages. and you, lost in it.",
    "you have a tab problem. allegedly.",
    "the browser is bracing itself.",
    "this many tabs is a personality trait now.",
    "consider this your archive."
  ],

  // Late night usage.
  lateNight: [
    "it is late.",
    "the internet is quieter at this hour. barely.",
    "you should be asleep. allegedly.",
    "nothing good is being decided right now.",
    "the night shift, of one.",
    "the screen is the only thing awake.",
    "the algorithm does not know what time it is. but you do.",
    "the tabs at this hour are a different species.",
    "you will regret this scroll. tomorrow.",
    "the day is over. the tabs are not.",
    "you are reading by the light of a small machine.",
    "the room is dark. the rectangle is bright.",
    "future you is sending complaints.",
    "this tab can wait until morning. it will not have to.",
    "the night is long. the queue, longer.",
    "blue light, served warm.",
    "you and the modem, the only ones still up."
  ]
};

// ---- opt-in: why are you here ---------------------------------------------
// rare popup. one line, one input. the input is theatre.
ALLEGEDLY_LINES.whyHere = [
  "why are you here.",
  "was this a choice.",
  "this could have waited.",
  "you could be elsewhere.",
  "what brought you here.",
  "is this where you meant to be.",
  "say it, just to yourself.",
  "name the reason. then close the tab.",
  "you opened this. for what.",
  "was it the link, or the urge.",
  "you walked in. now what.",
  "the tab is here. so are you. unclear why.",
  "answer in one word. it will be honest enough.",
  "this is not the page you were thinking of.",
  "if you had to defend this, could you."
];

// ---- opt-in: tab as personality -------------------------------------------
// domain-flavoured close lines. same voice. just sorted copy.
// each list is small on purpose; default tabClose still carries most of the load.
ALLEGEDLY_LINES.tabCloseDomains = {
  video: [
    "the video closed mid-sentence. as expected.",
    "you did not finish it. you never do.",
    "the autoplay queue is one shorter.",
    "the next one would have been worse.",
    "you watched enough. allegedly.",
    "the algorithm is mildly hurt.",
    "another window of moving pictures, gone.",
    "the loop is broken. for now."
  ],
  social: [
    "you closed it before it closed you.",
    "the feed will refill itself.",
    "you did not miss anything important.",
    "the timeline does not need you.",
    "scrolling, paused. not stopped.",
    "the discourse continues. without you.",
    "you escaped, briefly.",
    "the thread is still going. it always is."
  ],
  docs: [
    "the documentation closes politely.",
    "you read enough to feel informed.",
    "the spec will be there tomorrow. unfortunately.",
    "marked as read. by you, generously.",
    "you copied the snippet. that counts.",
    "the table of contents waves goodbye."
  ],
  code: [
    "the snippet has been borrowed.",
    "the answer was the second comment. as always.",
    "the repo is now your problem, in spirit.",
    "you starred nothing. it is fine.",
    "the issue remains open. you do not.",
    "the diff is closed. the bug is not."
  ],
  wiki: [
    "you have left the rabbit hole. for now.",
    "the article continues without a reader.",
    "you learned one thing. and forgot two.",
    "an entire civilisation, tabbed away.",
    "the citation needed remains needed."
  ],
  shop: [
    "you did not buy it. good.",
    "the cart will email you about this.",
    "the price will be the same tomorrow.",
    "you closed before you committed. wise.",
    "the wishlist grows in your absence."
  ],
  ai: [
    "the chat ends. mid-thought. as usual.",
    "you got an answer. or something shaped like one.",
    "the model will not remember this. you might.",
    "the conversation is closed. the prompt remains.",
    "you said thanks to a function. it logged it."
  ]
};

// ---- oldest tab whispers ---------------------------------------------------
// surfaced when narrator fires on a tab the user has had open for a while.
// {age} is replaced with a humanised duration like "47 minutes" or "3 hours".
ALLEGEDLY_LINES.oldestTab = [
  "you opened this {age} ago.",
  "this tab has been here {age}.",
  "{age} ago. still open. still you.",
  "this one has been waiting {age}.",
  "{age} ago, you thought this would be quick.",
  "this tab has aged {age}. quietly.",
  "you and this page, together for {age} now.",
  "{age} ago. has anything changed.",
  "this page has been open {age}. it has not improved.",
  "{age} ago you opened this with a plan."
];

// ---- time on domain whispers -----------------------------------------------
// surfaced when narrator fires on a domain the user has spent a while on today.
ALLEGEDLY_LINES.timeOnDomain = [
  "you have been here {time} today.",
  "{time} on this site. so far.",
  "today, you have given this site {time}.",
  "{time} here today. allegedly.",
  "this site has had {time} of you today.",
  "{time}. and counting.",
  "today's contribution to this domain: {time}.",
  "you have spent {time} here today. quietly.",
  "this domain has cost you {time} so far.",
  "{time} today. it adds up."
];

// ---- tab count whispers ----------------------------------------------------
// surfaced occasionally when the user has a noticeable number of tabs open.
// {count} is the current tab count.
ALLEGEDLY_LINES.tabCount = [
  "{count} tabs. allegedly.",
  "you have {count} tabs open. quietly.",
  "{count} tabs. all of them yours.",
  "{count} tabs. some of them, surely, on purpose.",
  "{count} open. you remember opening maybe four.",
  "{count} tabs. a small civilization.",
  "{count} tabs. nothing is closing itself.",
  "{count} tabs. each one a decision deferred.",
  "{count} tabs. a list, of sorts.",
  "{count}. that is the number of tabs."
];

// ---- garden done captions --------------------------------------------------
// shown under the canvas the first time a finished image is viewed.
ALLEGEDLY_LINES.gardenDone = [
  "finished. allegedly.",
  "a picture, of a sort.",
  "this is what closing tabs looks like.",
  "the canvas is full now.",
  "done. you can save it, if you want.",
  "it adds up to something.",
  "all accounted for.",
  "nothing left to reveal.",
  "that's the whole thing.",
  "complete. quietly.",
  "it happened.",
  "the image is what it is.",
  "closed enough tabs for this.",
  "well.",
  "there it is.",
  "finished. no notes.",
  "the last pixel. finally.",
  "it's done.",
  "apparently this is what you were building.",
  "you may now look at it."
];

// ---- pick & helpers --------------------------------------------------------

// Pick a random line from a category.
function allegedlyPick(category) {
  const list = ALLEGEDLY_LINES[category];
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}

// Pick a tabClose line for a domain category, falling back to default.
function allegedlyPickTabClose(domainCategory) {
  const map = ALLEGEDLY_LINES.tabCloseDomains || {};
  const list = domainCategory && map[domainCategory];
  if (list && list.length && Math.random() < 0.7) {
    return list[Math.floor(Math.random() * list.length)];
  }
  return allegedlyPick("tabClose");
}

// Humanise a duration in milliseconds.
// Coarse on purpose — the voice is dry, not precise.
function allegedlyHumanizeDuration(ms) {
  if (!ms || ms < 0) return "no time";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} seconds`;
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? "a minute" : `${m} minutes`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? "an hour" : `${h} hours`;
  const d = Math.floor(h / 24);
  return d === 1 ? "a day" : `${d} days`;
}

// Pick a templated line from a category, replacing {key} with values[key].
function allegedlyPickTemplated(category, values) {
  let line = allegedlyPick(category);
  if (!line) return "";
  for (const [k, v] of Object.entries(values || {})) {
    line = line.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return line;
}

// Expose for service worker (module) and content scripts (global).
if (typeof self !== "undefined") {
  self.ALLEGEDLY_LINES = ALLEGEDLY_LINES;
  self.allegedlyPick = allegedlyPick;
  self.allegedlyPickTabClose = allegedlyPickTabClose;
  self.allegedlyHumanizeDuration = allegedlyHumanizeDuration;
  self.allegedlyPickTemplated = allegedlyPickTemplated;
}
