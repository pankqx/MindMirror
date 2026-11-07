// Every word on the landing page (#/landing), in one place.
// Rule: only claim what the app actually does. Prototype parts say so.

import type { Screen } from "../lib/nav";
import { THREAD } from "../components/shisha/palette";

export const NAV = [
  { id: "top", label: "Home" },
  { id: "companion", label: "Companion" },
  { id: "normal", label: "Your normal" },
  { id: "how", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "about", label: "Privacy" },
] as const;

export const TICKER = [
  "Local-first: your entries stay in this browser",
  "No account needed",
  "Necklace hub optional",
  "Compared with your own normal, never with anyone else",
  "Not okay right now? Tele-MANAS 14416, free, 24x7",
];

export const HERO = {
  eyebrow: "Mind Check · for students",
  title: "Understand yourself.\nBefore you lose yourself.",
  body: "Your personal space to understand emotions, recognise patterns, manage stress and build a healthier relationship with yourself.",
  primary: "Get started",
  secondary: "Meet your companion",
  cue: "Scroll into the mirror",
  // the words that circle the mirror in the hero
  vortex: "UNDERSTAND YOURSELF · MOOD · SLEEP · STRESS · ENERGY · PEOPLE · YOUR NORMAL, NOT ANYONE ELSE'S · NOTICE THE DRIFT · BREATHE IN 4, OUT 6 · ",
};

export const PROBLEM = {
  title: "Your mind keeps sending signals.\nAre you listening?",
  body: "Exam pressure, short nights, a tiredness that sleep doesn't fix, a feeling you can't put a name to. Most of it never gets written down, so it never gets noticed, until it's a lot.",
  counterLabel: "Signals this week",
  chip: "Heard: 0",
  ledgerTitle: "An ordinary week",
  ledgerNote: "Example, not real data",
  days: [
    { day: "Mon", rows: [["Two internals and a lab record", "Pressure"], ["Asleep at 2:40, up at 7", "Sleep"]] },
    { day: "Tue", rows: [["Skipped lunch to finish slides", "Overload"], ["Felt off, couldn't say why", "Unnamed"]] },
    { day: "Wed", rows: [["Said \"I'm fine\" four times", "Exhaustion"]] },
    { day: "Thu", rows: [["Read the same page six times", "Overload"], ["Slept 4 h 50", "Sleep"]] },
    { day: "Fri", rows: [["Snapped at a friend", "Exhaustion"], ["Results posted", "Pressure"]] },
    { day: "Sat", rows: [["Slept 11 h, still tired", "Burnout"]] },
    { day: "Sun", rows: [["Dread before Monday", "Burnout"]] },
  ] as { day: string; rows: [string, string][] }[],
  ledgerEnd: ["Signals heard", "0"],
};

export const NORMAL = {
  eyebrow: "Your normal",
  title: "Compared with you.\nNever with anyone else.",
  body: "Every check-in becomes one mirror on your cloth. The thread shows how far that day sat from your own usual: green when you're you, yellow when you drift, red-orange when it's far. This is Asha, the student in our sample data, three weeks in.",
  engine: "What the signal engine says about Asha",
  proof: "The proof it shows her",
  clothTitle: "Asha's last 21 days",
  legend: [["Steady", THREAD.mehendi], ["Drifting", THREAD.haldi], ["Far from usual", THREAD.sindoor], ["Learning", THREAD.khadi]] as [string, string][],
  note: "Bigger mirror = longer sleep. More petals = more energy. Sample data, worked out live in this page.",
};

export interface Feature {
  n: string;
  title: string;
  body: string;
  status?: "Prototype";
}

export const EXPERIENCE = {
  title: "Ten small instruments.\nOne honest mirror.",
  body: "Nothing here is there to impress you. Each part does one small thing: it helps you notice, understand or ease what's going on in your head.",
  features: [
    { n: "001", title: "Emotional check-ins", body: "Thirty seconds, five answers: mood, stress, energy, last night's sleep and whether you talked to someone you like. One a day; a second one replaces the first." },
    { n: "002", title: "Personal insights", body: "Five signals (sleep, pressure, connection, energy and drive), each marked steady, watch or needs care. Every one shows the numbers behind it." },
    { n: "003", title: "AI companion", body: "Type, hold the mic, or hold Space. It listens, reflects, and suggests one small step. It talks about anything, like ChatGPT, and remembers the conversation. With no internet it still answers kindly." },
    { n: "004", title: "Guided breathing", body: "One minute. Four seconds in, six seconds out, with an orb to follow and a ring that fills as the minute passes." },
    { n: "005", title: "Personal journal", body: "Every check-in has room for a line about your day. The note stays with that day, so a bad night keeps its reason next to it." },
    { n: "006", title: "Daily planner", body: "List what's due and how many hours it needs. The planner tells you if the hours you've planned cover it, because unplanned deadlines are where pressure grows." },
    { n: "007", title: "Stress management", body: "A four-step support ladder: look after yourself, a small step today, reach out, talk to someone trained. And a play room: jelly, bubble wrap, a worry that dissolves, a koi pond." },
    { n: "008", title: "MindMirror necklace", body: "An ESP32 pendant with a mic, a speaker and one button. Hold, talk, let go: the laptop hub transcribes, replies and speaks back. Optional, and still a prototype.", status: "Prototype" },
    { n: "009", title: "Privacy-first data", body: "Check-ins, notes and tasks live in your browser's own database. No account to make. One button in Settings deletes all of it." },
    { n: "010", title: "Emotional patterns", body: "It spends five days learning your normal. After that it notices drift: three short nights stand out against your own usual, not against a stranger's." },
  ] as Feature[],
  click: "Click",
};

export interface Step {
  file: string;
  n: string;
  title: string;
  body: string[];
  code?: { lang: string; lines: string[] };
}

export const HOW = {
  eyebrow: "How it works",
  title: "This is how it actually works.",
  hint: "J / K to move",
  steps: [
    {
      file: "01-capture.md", n: "01", title: "Capture your thoughts and feelings.",
      body: [
        "Once a day, thirty seconds. Five sliders and a switch: mood, stress, energy, hours slept, and whether you talked to someone you like.",
        "Add a line about your day if you want. Or skip the screen and just talk, to the companion or through the necklace.",
      ],
      code: { lang: "check-in", lines: ["mood       ●●●○○   3 / 5", "stress     ●●●●○   4 / 5", "energy     ●●○○○   2 / 5", "sleep      5.6 h", "talked to someone   yes", "note       \"Lab record due, stayed up late.\""] },
    },
    {
      file: "02-understand.md", n: "02", title: "Understand your emotional signals.",
      body: [
        "Your entries become five signals: sleep, pressure, connection, energy and drive.",
        "Each one gets a plain level, steady, watch or needs care, instead of a score you have to decode.",
      ],
      code: { lang: "signals", lines: ["sleep        needs care", "pressure     watch", "energy       watch", "connection   steady", "drive        steady"] },
    },
    {
      file: "03-patterns.md", n: "03", title: "Discover patterns over time.",
      body: [
        "MindMirror needs five days to learn your normal. Until then, signals say \"learning\", because guessing would be worse.",
        "Then it compares your last few days with your own earlier weeks, and sums it up as mind weather: clear, clouds, rain or storm.",
      ],
      code: { lang: "your normal", lines: ["days 20 → 4    usual    7.0 h sleep", "days 3 → 0     recent   5.4 h sleep", "", "weather        soft rain"] },
    },
    {
      file: "04-insights.md", n: "04", title: "Receive meaningful insights.",
      body: [
        "Every signal shows its proof, as a sentence you can check yourself.",
        "Code calculates and AI only explains. The levels come from plain, unit-tested maths, never from a model's guess.",
      ],
      code: { lang: "proof", lines: ["You slept 5.4 h on average the last 3 nights;", "your usual is 7.0 h (−1.6 h)."] },
    },
    {
      file: "05-habits.md", n: "05", title: "Build healthier habits.",
      body: [
        "Each kind of weather comes with one next step from the support ladder. A minute of breathing, an earlier night, moving one task, messaging a friend.",
        "When it's a storm, the step is a person: your campus counsellor, or Tele-MANAS on 14416.",
      ],
      code: { lang: "support ladder", lines: ["1  clear    look after yourself", "2  clouds   a small step today", "3  rain     reach out", "4  storm    talk to someone trained"] },
    },
  ] as Step[],
  terminal: { path: "~/mindmirror", cmd: "open --sample", comment: "three weeks of Asha, a student slowly drifting", cta: "Try the sample" },
};

export interface Shot {
  id: string;
  title: string;
  sub: string;
  to: Screen;
  img: string;
  status: "Live" | "Prototype";
}

export const SHOWCASE = {
  title: "The actual app. Not a mockup.",
  body: "Every screen below is a capture of MindMirror running on three weeks of sample data. Open any of them; they're one click away.",
  shots: [
    { id: "home", title: "Dashboard", sub: "Home, with the necklace card", to: "home", img: "home", status: "Live" },
    { id: "insights", title: "Insights and analytics", sub: "Insights", to: "insights", img: "insights", status: "Live" },
    { id: "checkin", title: "Emotional check-in", sub: "Check in", to: "checkin", img: "checkin", status: "Live" },
    { id: "companion", title: "AI companion", sub: "Talk", to: "companion", img: "companion", status: "Live" },
    { id: "breathe", title: "Breathing", sub: "Breathe", to: "breathe", img: "breathe", status: "Live" },
    { id: "planner", title: "Planner", sub: "Planner", to: "planner", img: "planner", status: "Live" },
    { id: "voice", title: "Voice mode", sub: "For tired days", to: "voice", img: "voice", status: "Live" },
    { id: "face", title: "Face to face", sub: "Reenu or Roman, AI companion and therapist", to: "face", img: "face", status: "Prototype" },
    { id: "play", title: "Play room", sub: "Jelly, bubble wrap, let it go, koi pond", to: "play", img: "play", status: "Live" },
    { id: "support", title: "Support ladder", sub: "Real people, one tap away", to: "support", img: "support", status: "Live" },
  ] as Shot[],
  open: "Open",
};

export const PRIVACY = {
  title: "Private by default.\nHonest about the rest.",
  credit: "Built by K S Pankaj, Merel Riha D'souza and Kishore Krishna",
  ticketLabel: "Accounts needed",
  ticketBig: "0",
  ticketLines: ["Your check-ins, notes and tasks are stored", "in IndexedDB, inside this browser."],
  points: [
    ["01", "Local-first", "Entries live on this device, not on a server"],
    ["02", "Code calculates", "Signals come from unit-tested maths, not a model"],
    ["03", "AI only when you talk", "Then your words go to an AI (the hub, Groq or a free model) for the reply"],
    ["04", "Crisis words skip the AI", "They go straight to people: 14416, or 112"],
    ["05", "Delete everything", "One button in Settings clears it all"],
  ],
  note: ["MindMirror is a wellness companion, not a medical device.", "It never diagnoses."],
};

export const FAQ = {
  title: "Before you begin",
  items: [
    ["Is MindMirror a diagnosis?", "No. It's a wellness companion, not a medical device. It notices change against your own normal and points you to calm tools or real people. It never labels you."],
    ["Do I need the necklace?", "No. Check-ins, insights, typed chat, breathing, the planner and the play room all work in the browser on their own. The necklace is a prototype that adds hold-to-talk through the laptop hub."],
    ["Where does my data go?", "Your check-ins, notes, tasks and conversations are stored in your browser's IndexedDB on this device. When you talk to the companion, your words go to an AI to write the reply: through the hub on your laptop when it runs, otherwise straight from the browser to your own Groq or OpenRouter key (set in Settings) or a free public model."],
    ["Why does it wait five days?", "Because \"your normal\" has to be yours. With fewer than five days of check-ins, a signal says \"learning\" instead of guessing."],
    ["Can I try it without my own data?", "Yes. Explore with the sample: three weeks of Asha, a student slowly drifting. Her last three nights are short, so you can see sleep turn to \"needs care\" and the weather turn to soft rain."],
    ["What if I'm not okay right now?", "Please talk to a person. Tele-MANAS is free and open 24x7 on 14416. If you're in danger right now, call 112. If you type crisis words to the companion, it skips the AI and shows you these numbers."],
    ["Who made it?", "Built by K S Pankaj, Merel Riha D'souza and Kishore Krishna (team HTTP Dino), St Aloysius, for CODE MEET 2026 (Problem 2: Mind Check). It uses open-source libraries, Groq and Microsoft Edge TTS."],
  ] as [string, string][],
};

export const FINAL = {
  title: "Start understanding the person you spend your entire life with.",
  last: "Yourself.",
  cta: "Explore MindMirror",
};

export const BREATH_CARD = {
  title: "Not ready to start?",
  body: "That's fine. Take one slow minute first: in for four, out for six.",
  cta: "Breathe",
};

export const FOOTER = {
  blurb: "One quiet check-in a day. Your own normal, your own data, and a person to call when it's more than a bad week.",
  cols: [
    { title: "The app", links: [["Check in", "checkin"], ["Insights", "insights"], ["Talk", "companion"], ["Breathe", "breathe"], ["Play room", "play"]] },
    { title: "Rooms", links: [["Voice mode", "voice"], ["Face to face", "face"], ["The dive", "dive"], ["Planner", "planner"]] },
    { title: "Help", links: [["Support", "support"], ["Tele-MANAS 14416", "tel:14416"], ["Emergency 112", "tel:112"]] },
  ] as { title: string; links: [string, string][] }[],
  repo: "https://github.com/pankqx/MindMirror",
  copyright: "MindMirror. Built by K S Pankaj, Merel Riha D'souza and Kishore Krishna",
  note: "Not a medical device. It never diagnoses.",
};
