// The companion stage: Reenu or Roman, drawn almost as tall as the screen, talking with you.
// Same conversation as Face to face: the laptop hub's AI when it runs, kind offline replies when it doesn't.
// They follow your pointer, listen while you speak, think, answer, and react when poked.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { InkCharacter } from "../../character/InkCharacter";
import { characters, pick, type CharacterId, type CharState, type Expression } from "../../character/characters";
import { useConversation } from "../../lib/converse";
import { speakWithBrowser, unlockAudio, useHubOnline } from "../../lib/hub";
import { usePrefs } from "../../lib/prefs";
import UrgentHelp from "../../screens/UrgentHelp";
import { MirrorField, type MirrorFieldHandle } from "./MirrorField";

const STATE: Record<string, CharState> = { idle: "IDLE", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING" };

const SUGGEST = [
  "I can't sleep before exams",
  "I feel off and can't say why",
  "Too many deadlines this week",
  "What does MindMirror do?",
  "Just saying hi",
];

const POKE: Record<CharacterId, string[]> = {
  reenu: ["Hehe, hi! That tickles.", "Okay okay, I'm awake!", "Poke accepted. Now tell me how you are."],
  roman: ["I felt that.", "Noted. Poke logged.", "Right. Talk to me instead?"],
};

/** Questions about MindMirror itself get a straight answer from the page, not a guess from a model. */
function about(text: string, who: CharacterId): string | null {
  if (!/mind ?mirror|what (do|can) you do|how does (this|it) work|who are you/i.test(text)) return null;
  return who === "reenu"
    ? "I'm part of MindMirror! Once a day you tell me how you slept, your mood, stress and energy. After five days I know your normal, and I'll show you, with proof, when you start drifting from it. I never diagnose; I point you to small steps or real people."
    : "Short version: thirty seconds a day, five answers. After five days I know your normal and flag drift from it, with the numbers. No diagnosis. Small steps, or a real person when it's more than that.";
}

function useTyped(text: string) {
  const reduce = useReducedMotion();
  const [t, setT] = useState({ text, n: reduce ? text.length : 0 });
  if (t.text !== text) setT({ text, n: reduce ? text.length : 0 });
  useEffect(() => {
    if (reduce) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      setT((v) => (v.text === text ? { text, n: i } : v));
      if (i >= text.length) window.clearInterval(id);
    }, 18);
    return () => window.clearInterval(id);
  }, [text, reduce]);
  return text.slice(0, t.text === text ? t.n : 0);
}

export function Stage({ who, onSwitch, onApp }: { who: CharacterId; onSwitch: () => void; onApp?: () => void }) {
  const cfg = characters[who];
  const other = characters[who === "reenu" ? "roman" : "reenu"];
  const [voice, setVoice] = useState(false);
  const c = useConversation({ voice });
  const online = useHubOnline();
  const { name } = usePrefs();
  const [draft, setDraft] = useState("");
  const [local, setLocal] = useState<string | null>(null);
  const [poked, setPoked] = useState(false);
  const [greet, setGreet] = useState(true);
  const [log, setLog] = useState<{ me: string; them: string }[]>([]);
  const fig = useRef<HTMLButtonElement>(null);
  const field = useRef<MirrorFieldHandle>(null);
  const seen = useRef("");

  useEffect(() => { const t = window.setTimeout(() => setGreet(false), 2400); return () => window.clearTimeout(t); }, [who]);
  // keep a short transcript of what was said
  useEffect(() => {
    if (!c.reply || c.reply === seen.current) return;
    seen.current = c.reply;
    setLog((l) => [...l, { me: c.heard, them: c.reply }].slice(-12));
  }, [c.reply, c.heard]);

  const intro = `${name ? `Hi ${name}! ` : "Hi! "}I'm ${cfg.name}. ${who === "reenu" ? "Tell me how today really went. I'll ask the second question." : "Tell me what's on your mind. I'll keep it short."}`;
  const showing = local ?? (c.phase === "thinking" ? "…" : c.reply || intro);
  const typed = useTyped(showing);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || c.phase === "thinking") return;
    unlockAudio();
    setDraft("");
    const own = about(t, who);
    if (own) {
      setLocal(own);
      setLog((l) => [...l, { me: t, them: own }].slice(-12));
      if (voice) void speakWithBrowser(own);
      return;
    }
    setLocal(null);
    void c.say(t);
  };

  const poke = (e: React.MouseEvent) => {
    field.current?.flash(e.clientX, e.clientY);
    setPoked(true);
    setLocal(pick(POKE[who]));
    window.setTimeout(() => setPoked(false), 1200);
  };

  const tapMic = () => {
    setLocal(null);
    if (c.phase === "listening") void c.stop();
    else if (c.phase === "speaking") c.cancel();
    else if (c.phase === "idle") void c.start();
  };

  const state: CharState = poked ? "REACTING" : greet && c.phase === "idle" ? "GREETING" : STATE[c.phase];
  const expr: Expression = c.crisis ? "concerned" : poked ? "surprised" : (c.reply || local) && c.phase === "idle" ? "happy" : "neutral";
  const busy = c.phase === "thinking";

  return (
    <div className="relative isolate grid min-h-svh grid-cols-1 overflow-hidden lg:grid-cols-12" style={{ ["--accent" as string]: cfg.accent }}>
      <div className="absolute inset-0 -z-10"><MirrorField ref={field} head={fig} active={c.phase === "thinking" || c.phase === "speaking"} accent={cfg.accent} /></div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_70%_70%,rgba(228,106,154,0.10),transparent_70%)]" aria-hidden="true" />

      {/* the words */}
      <div className="relative z-10 order-2 flex flex-col justify-center gap-5 px-4 pb-24 pt-6 lg:order-1 lg:col-span-5 lg:py-28 lg:pl-20 lg:pr-0">
        <div className="t-caption-sm flex flex-wrap items-center gap-2 text-white/60">
          <span className="rounded-[3px] border border-[var(--accent)] px-2 py-1 text-[var(--accent)]">AI companion · {poked ? "poked" : c.phase}</span>
          <button onClick={onSwitch} className="rounded-[3px] border border-white/20 px-2 py-1 transition-colors hover:border-white hover:text-white">⇄ Meet {other.name}</button>
          {onApp && <button onClick={onApp} className="rounded-[3px] border border-white/20 px-2 py-1 transition-colors hover:border-white hover:text-white">Open the app ↗</button>}
        </div>
        <h2 className="font-display text-[clamp(4.5rem,10vw,10.5rem)] italic leading-[0.82] text-[var(--accent)]">{cfg.name}</h2>
        <p className="t-caption-sm -mt-1 text-white/50">{cfg.tagline} · {online ? "live AI through your laptop hub" : "kind offline replies (hub not running)"}</p>

        <div className="relative max-w-[34rem] rounded-[6px] border border-white/12 bg-neel-deep/70 p-5 backdrop-blur-[2px]" aria-live="polite">
          {c.heard && !local && c.phase !== "idle" && <p className="t-caption-sm mb-2 text-white/45">“{c.heard}”</p>}
          <p className="text-[clamp(1.15rem,1.6vw,1.45rem)] leading-snug text-white">
            {typed}<span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-[var(--accent)]" aria-hidden="true" />
          </p>
          {c.error && <p className="t-caption-sm mt-3 text-haldi">{c.error}</p>}
        </div>
        {c.crisis && <div className="max-w-[34rem]"><UrgentHelp /></div>}

        <div className="flex max-w-[36rem] flex-wrap gap-1.5">
          {SUGGEST.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy}
              className="t-caption-sm rounded-full border border-white/20 px-3 py-1.5 text-white/75 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40">
              {s}
            </button>
          ))}
        </div>

        <form className="flex max-w-[36rem] gap-1.5" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 500))} placeholder={c.phase === "listening" ? "Listening…" : `Say something to ${cfg.name}…`}
            aria-label={`Message ${cfg.name}`}
            className="min-w-0 flex-1 rounded-[4px] border border-white/20 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/35 focus:border-[var(--accent)]" />
          <button type="button" onClick={tapMic} aria-pressed={c.phase === "listening"}
            className={`t-caption-sm rounded-[4px] border px-3.5 transition-colors ${c.phase === "listening" ? "border-[var(--accent)] bg-[var(--accent)] text-neel" : "border-white/20 text-white/80 hover:border-white"}`}>
            {c.phase === "listening" ? "● Done" : c.phase === "speaking" ? "Stop" : "Talk"}
          </button>
          <button type="submit" disabled={!draft.trim() || busy} className="t-caption-sm rounded-[4px] bg-[var(--accent)] px-4 text-neel transition-opacity disabled:opacity-40">Send</button>
        </form>

        <div className="t-caption-sm flex flex-wrap items-center gap-x-5 gap-y-2 text-white/45">
          <label className="flex cursor-pointer items-center gap-2 hover:text-white">
            <input type="checkbox" checked={voice} onChange={(e) => { unlockAudio(); setVoice(e.target.checked); }} className="accent-[var(--accent)]" /> Speak replies
          </label>
          <span>Not a therapist · <a href="tel:14416" className="underline underline-offset-4 hover:text-white">Tele-MANAS 14416</a></span>
          {log.length > 0 && <span>{log.length} said · not saved</span>}
        </div>
      </div>

      {/* the companion */}
      <div className="relative order-1 flex items-end justify-center pt-24 lg:order-2 lg:col-span-7 lg:pt-0">
        <span className="pointer-events-none absolute inset-x-0 bottom-[8%] select-none text-center font-display text-[clamp(8rem,26vw,26rem)] italic leading-none text-white/[0.04]" aria-hidden="true">{cfg.name}</span>
        <AnimatePresence mode="wait">
          <motion.button key={who} ref={fig} onClick={poke} tabIndex={-1} aria-label={`Poke ${cfg.name}`}
            className="relative block cursor-pointer [--fig-h:clamp(400px,56svh,600px)] lg:[--fig-h:min(90svh,980px)]" initial={{ opacity: 0, y: 60, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 30, filter: "blur(10px)" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <span className="absolute inset-x-[-10%] bottom-0 h-[70%] rounded-full bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-[0.18]" aria-hidden="true" />
            <InkCharacter config={cfg} state={state} expression={expr} level={c.phase === "speaking" ? c.level : undefined}
              height="var(--fig-h)" className="relative" label={`${cfg.name}, your MindMirror companion (illustration)`} />
          </motion.button>
        </AnimatePresence>
        <span className="t-caption-sm pointer-events-none absolute bottom-5 right-4 text-white/50 lg:right-8">This is <b className="font-medium text-white">{cfg.name}</b> · AI companion · poke me</span>
      </div>
    </div>
  );
}

/** First visit: who would you like to talk to? Two big figures, one click. */
export function Choose({ onPick }: { onPick: (id: CharacterId) => void }) {
  const [hot, setHot] = useState<CharacterId | null>(null);
  const [picked, setPicked] = useState<CharacterId | null>(null);
  const choose = (id: CharacterId) => {
    if (picked) return;
    setPicked(id);
    window.setTimeout(() => onPick(id), 600);
  };
  return (
    <div className="relative isolate grid min-h-svh grid-cols-1 items-center gap-y-8 overflow-hidden px-4 pb-10 pt-28 lg:grid-cols-12 lg:gap-x-4 lg:px-20 lg:py-24">
      <div className="absolute inset-0 -z-10"><MirrorField /></div>
      <div className="lg:col-span-5">
        <p className="t-caption text-white/60">Someone to talk to</p>
        <h2 className="t-headline mt-5 text-balance text-white">There's someone here for you.<br /><span className="font-display text-[1.15em] italic text-rani">Who would you like to meet?</span></h2>
        <p className="t-body-lg mt-5 max-w-[30rem] text-mist/75">Pick a companion. They listen, reflect, and suggest one small step. You can switch any time, and they'll be waiting inside the app too.</p>
        <p className="t-caption-sm mt-8 text-white/40">Click one to start talking</p>
      </div>
      <div className="grid grid-cols-2 items-end gap-2 lg:col-span-7 lg:gap-6" role="group" aria-label="Choose a companion">
        {(["reenu", "roman"] as CharacterId[]).map((id) => {
          const c = characters[id];
          const st: CharState = picked === id ? "GREETING" : hot === id ? "REACTING" : "IDLE";
          return (
            <button key={id} onClick={() => choose(id)} onPointerEnter={() => setHot(id)} onPointerLeave={() => setHot(null)} onFocus={() => setHot(id)} onBlur={() => setHot(null)}
              className={`group relative flex flex-col items-center transition-all duration-500 ${picked && picked !== id ? "scale-95 opacity-20 blur-[2px]" : ""}`}
              style={{ ["--accent" as string]: c.accent }} aria-label={`Meet ${c.name}: ${c.tagline}`}>
              <span className="absolute bottom-[18%] h-[55%] w-[80%] rounded-full bg-[radial-gradient(closest-side,var(--accent),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-25 group-focus-visible:opacity-25" aria-hidden="true" />
              <InkCharacter config={c} state={st} height="clamp(250px, 56svh, 620px)" className="relative transition-transform duration-500 group-hover:-translate-y-2" label={`${c.name} (illustration)`} />
              <span className="relative -mt-2 font-display text-[clamp(2.4rem,5vw,4.6rem)] italic leading-none text-[var(--accent)]">{c.name}</span>
              <span className="t-caption-sm relative mt-2 text-center text-white/55">{c.tagline}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
