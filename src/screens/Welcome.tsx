import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowIcon } from "../components/Icons";
import { Shisha } from "../components/shisha/Shisha";
import { THREAD } from "../components/shisha/palette";
import { ease } from "../components/ui";
import { db } from "../lib/db";
import { copy } from "../content/copy";
import { unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";

type Door = "preview" | "voice" | "checkin";

// Three calm doors instead of a form: look around, just talk, or check in.
const DOORS: { id: Door; title: string; line: string; tone: string; glyph: React.ReactNode }[] = [
  {
    id: "preview", title: "Preview", tone: "var(--sage)",
    line: "Look around first. Three weeks of Asha show how MindMirror notices drift.",
    glyph: <><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>,
  },
  {
    id: "voice", title: "Voice mode", tone: "var(--indigo)",
    line: "Just talk, to your phone or your necklace. What you say counts in your signals.",
    glyph: <path d="M4 12h1M7.5 8.5v7M11 5v14M14.5 8v8M18 10.5v3M20.5 12H20" />,
  },
  {
    id: "checkin", title: "Check-in", tone: "var(--sun)",
    line: "Thirty seconds. Mood, sleep, stress, energy, and who you talked to.",
    glyph: <path d="M3 12h4l2-5 4 10 2-5h6" />,
  },
];

/** First-run welcome: a slow breathing mirror and three ways in. */
export default function Welcome() {
  const p = usePrefs();
  const [name, setName] = useState(p.name);
  const [chosen, setChosen] = useState<Door | "fresh" | null>(null);

  async function enter(d: Door | "fresh") {
    if (chosen) return;
    unlockAudio();
    setChosen(d);
    navigator.vibrate?.(8);
    // let the chosen door glow for a breath before the room changes
    await new Promise((r) => setTimeout(r, 850));
    if (d === "preview" && (await db.checkins.count()) === 0) await loadSample();
    setPrefs({ welcomed: true, name: name.trim() || (d === "preview" ? "Asha" : "") });
    location.hash = d === "preview" || d === "fresh" ? "#/home" : `#/${d}`;
  }

  return (
    <motion.div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.6, ease }}>
      <div className="relative mx-auto flex min-h-full max-w-[1040px] flex-col justify-center px-6 py-12 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20 lg:px-14">
        <div>
        <motion.div className="mb-8 w-fit" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.9, ease }}>
          <Shisha size={112} petals={10} thread={THREAD.rani} accent={THREAD.kesar} follow draw title="A stitched mirror, MindMirror's mark" />
        </motion.div>

        <motion.h1 className="text-[2.9rem] font-medium leading-[1] tracking-[-0.035em] lg:text-[4.4rem] [&_em]:font-display [&_em]:font-normal [&_em]:text-indigo" initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease }}>
          Notice the <em className="italic">drift</em> before it becomes a storm.
        </motion.h1>
        <motion.p className="mt-5 max-w-sm text-[17px] leading-relaxed text-soft" initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, ease }}>
          MindMirror helps students see early signs of stress against their own normal, and find the right support. It never diagnoses.
        </motion.p>
        </div>

        <div>
        <motion.div className="mt-10 lg:mt-0" initial={{ opacity: 0, y: 12 }} animate={{ opacity: chosen ? 0 : 1, y: 0 }}
          transition={{ delay: chosen ? 0 : 0.6, duration: 0.6, ease }}>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="What should we call you? (optional)"
            className="min-h-12 w-full rounded-[4px] border border-ink/20 bg-card px-4 outline-none focus:border-indigo" />
          <p className="mt-6 t-caption-sm text-faint">Where would you like to begin?</p>
        </motion.div>

        <div className="mt-3 flex flex-col gap-3">
          {DOORS.map((d, i) => {
            const me = chosen === d.id;
            const other = !!chosen && !me;
            return (
              <motion.button key={d.id} onClick={() => void enter(d.id)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: other ? 0 : 1, y: other ? 10 : me ? -4 : 0, scale: me ? 1.02 : 1 }}
                transition={{ duration: chosen ? 0.5 : 0.7, delay: chosen ? 0 : 0.75 + i * 0.12, ease }}
                whileHover={chosen ? undefined : { y: -2 }} whileTap={{ scale: 0.985 }}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[6px] border border-ink/15 bg-card p-4 text-left transition-colors hover:border-ink/30"
                style={me ? { borderColor: d.tone } : undefined}>
                <motion.span className="pointer-events-none absolute inset-0" initial={false}
                  animate={{ opacity: me ? 1 : 0 }} transition={{ duration: 0.5 }}
                  style={{ background: `radial-gradient(120% 160% at 8% 50%, color-mix(in oklab, ${d.tone} 26%, transparent), transparent 70%)` }} />
                <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full"
                  style={{ background: `color-mix(in oklab, ${d.tone} 18%, transparent)`, color: d.tone }}>
                  {me && (
                    <motion.span className="absolute inset-0 rounded-full" style={{ background: d.tone }}
                      initial={{ scale: 1, opacity: 0.35 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ duration: 1.1, repeat: Infinity }} />
                  )}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="relative">{d.glyph}</svg>
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block font-display text-[1.6rem] leading-tight">{d.title}</span>
                  <span className="mt-0.5 block text-[14px] leading-snug text-soft">{me ? "Opening gently…" : d.line}</span>
                </span>
                <span className="relative text-faint transition-transform group-hover:translate-x-1"><ArrowIcon size={18} /></span>
              </motion.button>
            );
          })}
        </div>

        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: chosen ? 0 : 1 }} transition={{ delay: chosen ? 0 : 1.3, duration: 0.6 }}>
          <button onClick={() => void enter("fresh")} className="text-[13px] font-medium text-soft underline decoration-line underline-offset-4 hover:text-ink">
            Or start fresh, with nothing in it yet
          </button>
          <p className="pt-2 text-xs text-faint">{copy.disclaimer}</p>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
