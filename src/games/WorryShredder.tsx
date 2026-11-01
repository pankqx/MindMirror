import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { chime, shred as shredSound } from "./sound";
import { LeafIcon } from "../components/Icons";

// Merel's worry shredder. Write it down, feed it in, and watch it come out in strips
// that fall and fade. Nothing is saved.

const STRIPS = 12;

function Paper({ text }: { text: string }) {
  return (
    <div className="min-h-36 w-full whitespace-pre-wrap break-words rounded-2xl bg-[#fffdf8] p-4 text-left font-display text-lg leading-relaxed text-[#3a3a4a] shadow-md"
      style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e8e2d4 32px)" }}>
      {text}
    </div>
  );
}

export default function WorryShredder() {
  const [note, setNote] = useState("");
  const [stage, setStage] = useState<"write" | "feeding" | "strips" | "done">("write");

  const shred = () => {
    if (!note.trim()) return;
    setStage("feeding");
    shredSound(1.6);
    window.setTimeout(() => setStage("strips"), 900);
    window.setTimeout(() => {
      setStage("done");
      chime(0);
    }, 2900);
  };

  const reset = () => {
    setNote("");
    setStage("write");
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-line p-6 text-center lg:p-10">
      <h2 className="mb-1 font-display text-4xl">Worry shredder</h2>

      <AnimatePresence mode="wait">
        {stage === "done" ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-8">
            <motion.div className="mx-auto mb-4 text-5xl" initial={{ y: 10, rotate: -10 }} animate={{ y: [10, -6, 0], rotate: 0 }} transition={{ duration: 0.8 }}>
              <LeafIcon size={44} className="mx-auto text-sage-ink" strokeWidth={1.3} />
            </motion.div>
            <p className="mx-auto max-w-xs text-sage-ink">It's still real, but it's lighter in your hands now.</p>
            <motion.button whileTap={{ scale: 0.95 }} onClick={reset} className="mt-6 rounded-full bg-ink px-7 py-3 font-semibold text-bg">
              Write another
            </motion.button>
          </motion.div>
        ) : (
          <motion.div key="write" exit={{ opacity: 0 }}>
            <p className="mb-4 text-sm text-soft">What's weighing on you? Nothing here is saved.</p>

            {/* the paper, above the slot */}
            <div className="relative h-40 overflow-hidden">
              {stage === "write" ? (
                <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} maxLength={140} placeholder="Write it down here…"
                  className="h-full w-full resize-none rounded-2xl border border-line bg-[#fffdf8] p-4 font-display text-lg leading-relaxed text-[#3a3a4a] outline-none focus:ring-2 focus:ring-sage"
                  style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #e8e2d4 32px)" }} />
              ) : (
                <motion.div className="absolute inset-x-0 top-0" initial={{ y: 0 }} animate={{ y: 170 }} transition={{ duration: 1.6, ease: "easeIn" }}>
                  <Paper text={note} />
                </motion.div>
              )}
            </div>

            {stage === "write" && <p className="mb-2 mt-1 text-right text-xs text-faint">{note.length}/140</p>}

            {/* the shredder */}
            <div className="relative z-10 mt-2 rounded-2xl bg-ink px-4 py-3 text-bg shadow-lg">
              <div className="mx-auto mb-2 h-1.5 w-[92%] rounded-full bg-black/60" />
              <div className="flex items-center justify-between text-xs font-semibold tracking-[0.2em]">
                <span>SHREDDER</span>
                <motion.span className="h-2 w-2 rounded-full" animate={{ background: stage === "write" ? "#8fb9a8" : ["#e8836b", "#f5c66b", "#e8836b"] }}
                  transition={{ duration: 0.4, repeat: stage === "write" ? 0 : Infinity }} />
              </div>
              {stage !== "write" && (
                <motion.div className="absolute inset-0 rounded-2xl" animate={{ x: [-1, 1, -1] }} transition={{ duration: 0.08, repeat: Infinity }} />
              )}
            </div>

            {/* strips falling out the bottom */}
            <div className="relative -mt-1 h-44">
              {stage !== "write" &&
                Array.from({ length: STRIPS }, (_, i) => (
                  <motion.div key={i} className="absolute top-0 overflow-hidden" style={{ left: `${(i * 100) / STRIPS}%`, width: `${100 / STRIPS}%` }}
                    initial={{ y: -150, opacity: 1, rotate: 0 }}
                    animate={{ y: [-150, -20, 160 + (i % 3) * 20], opacity: [1, 1, 0], rotate: [0, 0, (i % 2 ? 1 : -1) * (8 + (i % 4) * 6)], x: [0, 0, (i - STRIPS / 2) * 4] }}
                    transition={{ duration: 2.4, delay: 0.2 + (i % 4) * 0.05, times: [0, 0.4, 1], ease: "easeIn" }}>
                    <div style={{ width: `${STRIPS * 100}%`, marginLeft: `-${i * 100}%` }}>
                      <Paper text={note} />
                    </div>
                  </motion.div>
                ))}
              {stage === "write" && (
                <div className="pt-6">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={shred} disabled={!note.trim()}
                    className="rounded-full bg-ink px-8 py-3.5 font-semibold text-bg disabled:opacity-30">
                    Shred it
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
