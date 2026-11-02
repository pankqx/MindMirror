import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowIcon } from "../components/Icons";
import { Shisha } from "../components/shisha/Shisha";
import { THREAD } from "../components/shisha/palette";
import { Button, ease } from "../components/ui";
import { copy } from "../content/copy";
import { unlockAudio } from "../lib/hub";
import { setPrefs, usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";

const POINTS = [
  ["01", "A 30-second check-in", "Mood, stress, energy, sleep, and who you talked to."],
  ["02", "Compared with your own normal", "Not with anyone else. Every signal shows its proof."],
  ["03", "Pointed to the right support", "Calm tools now, real people when it matters."],
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
        <div className="mt-10 lg:mt-0">
          {POINTS.map(([n, title, line], i) => (
            <motion.div key={title} className="flex items-baseline gap-5 border-t border-dashed border-ink/20 py-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.12, duration: 0.6, ease }}>
              <span className="t-caption-sm text-faint">{n}</span>
              <div>
                <p className="text-[15px] font-medium">{title}</p>
                <p className="text-[14px] text-soft">{line}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div className="mt-8 space-y-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6, ease }}>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 30))} placeholder="What should we call you? (optional)"
            className="min-h-12 w-full rounded-[4px] border border-ink/20 bg-card px-4 outline-none focus:border-indigo" />
          <Button onClick={() => void enter(true)} disabled={busy}>
            Explore with sample data <ArrowIcon size={18} />
          </Button>
          <Button variant="soft" onClick={() => void enter(false)} disabled={busy}>Start fresh</Button>
          <p className="pt-2 text-xs text-faint">
            Sample data is three weeks of Asha, a student slowly drifting. {copy.disclaimer}
          </p>
        </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
