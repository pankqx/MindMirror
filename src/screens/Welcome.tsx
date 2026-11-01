import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowIcon } from "../components/Icons";
import { Logo } from "../components/TopBar";
import { Button, ease } from "../components/ui";
import { copy } from "../content/copy";
import { unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";

const POINTS = [
  ["🌤️", "A 30-second check-in", "Mood, stress, energy, sleep, and who you talked to."],
  ["🪞", "Compared with your own normal", "Not with anyone else. Every signal shows its proof."],
  ["🤝", "Pointed to the right support", "Calm tools now, real people when it matters."],
];

/** First-run welcome: a slow breathing mirror, three promises, and a way in. */
export default function Welcome() {
  const p = usePrefs();
  const [name, setName] = useState(p.name);
  const [busy, setBusy] = useState(false);

  async function enter(sample: boolean) {
    unlockAudio();
    setBusy(true);
    if (sample) await loadSample();
    setPrefs({ welcomed: true, name: name.trim() || (sample ? "Asha" : "") });
    location.hash = "#/home";
  }

  return (
    <motion.div className="fixed inset-0 z-[60] overflow-y-auto bg-bg" initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(6px)" }} transition={{ duration: 0.6, ease }}>
      {/* soft drifting colour */}
      <motion.div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-coral/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sage/30 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -20, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />

      <div className="relative mx-auto flex min-h-full max-w-[480px] flex-col justify-center px-6 py-12">
        <motion.div className="mx-auto mb-8 grid place-items-center" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease }}>
          <div className="relative grid place-items-center">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="absolute h-24 w-24 rounded-full border-2 border-indigo/30"
                animate={{ scale: [1, 2.2], opacity: [0.5, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }} />
            ))}
            <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <Logo size={88} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1 className="text-center font-display text-4xl font-semibold leading-tight" initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7, ease }}>
          MindMirror
        </motion.h1>
        <motion.p className="mx-auto mt-3 max-w-xs text-center text-lg text-soft" initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, ease }}>
          Notice the drift before it becomes a storm.
        </motion.p>

        <div className="mt-10 space-y-3">
          {POINTS.map(([icon, title, line], i) => (
            <motion.div key={title} className="flex items-start gap-4 rounded-3xl border border-line/70 bg-card/80 p-4 shadow-soft backdrop-blur"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.12, duration: 0.6, ease }}>
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-soft">{line}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-8 space-y-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6, ease }}>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="What should we call you? (optional)"
            className="min-h-12 w-full rounded-2xl border border-line bg-card px-4 text-center outline-none focus:border-indigo" />
          <Button onClick={() => void enter(true)} disabled={busy}>
            Explore with sample data <ArrowIcon size={18} />
          </Button>
          <Button variant="soft" onClick={() => void enter(false)} disabled={busy}>Start fresh</Button>
          <p className="pt-2 text-center text-xs text-faint">
            Sample data is three weeks of Asha, a student slowly drifting. {copy.disclaimer}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
