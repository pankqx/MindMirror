import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneIcon } from "../components/Icons";
import { ease, PageHeader, spring } from "../components/ui";
import { copy } from "../content/copy";
import { setPrefs, usePrefs } from "../lib/prefs";

// Merel's support ladder: where you are, the gentle next step, and real people one tap away.

type Props = {
  current: 0 | 1 | 2 | 3;
};

const DOT = ["var(--sage)", "var(--sun)", "var(--sky)", "var(--coral)"];

export default function Support({ current }: Props) {
  const [showCounsellor, setShowCounsellor] = useState(false);
  const { counsellor } = usePrefs();

  return (
    <div>
      <PageHeader eyebrow="Support" title={<>One step at a <em className="italic">time</em>.</>}
        lede="There's no one right way to feel better. We point to people, never to labels." />
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
      <div>

      <ol className="relative space-y-3">
        {/* the path that links the steps */}
        <div className="absolute bottom-6 left-[27px] top-6 w-0.5 rounded-full bg-line" aria-hidden="true" />

        {copy.ladder.map((step, index) => {
          const here = current === index;
          const next = index === current + 1;
          return (
            <motion.li key={step.title} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, duration: 0.5, ease }}
              className="relative flex gap-4">
              <div className="relative z-10 mt-4 grid h-[56px] w-[56px] shrink-0 place-items-center">
                {here && (
                  <motion.span className="absolute inset-1 rounded-full" style={{ background: DOT[index] }}
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
                )}
                <span className={`relative grid h-10 w-10 place-items-center rounded-full border-2 text-sm font-semibold ${here ? "border-transparent text-ink" : "border-line bg-card text-faint"}`}
                  style={here ? { background: DOT[index] } : undefined}>
                  {index + 1}
                </span>
              </div>
              <div className={`flex-1 rounded-3xl border p-5 transition-colors ${here ? "border-ink/30 bg-card" : "border-line"}`}>
                {here && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-indigo">You are here</p>}
                {next && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-faint">A gentle next step</p>}
                <h2 className="font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm text-soft">{step.line}</p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      </div>
      <div className="space-y-3 lg:sticky lg:top-10 lg:self-start">
        <p className="mb-4 font-display text-3xl leading-tight">Real people, <em className="italic">one tap</em> away.</p>
        <motion.a whileTap={{ scale: 0.97 }} transition={spring} href="tel:14416"
          className="t-caption flex min-h-14 items-center justify-center gap-2 rounded-[4px] bg-ink px-5 py-4 text-center text-bg">
          <PhoneIcon size={20} /> Call Tele-MANAS 14416 <span className="font-semibold opacity-75">· free, 24×7</span>
        </motion.a>

        <motion.a whileTap={{ scale: 0.97 }} transition={spring} href="tel:112"
          className="t-caption flex min-h-14 items-center justify-center gap-2 rounded-[4px] bg-urgent px-5 py-4 text-center text-white">
          <PhoneIcon size={20} /> Emergency 112
        </motion.a>

        <button onClick={() => setShowCounsellor((v) => !v)}
          className="t-caption min-h-14 w-full rounded-[4px] border border-ink/20 px-5 py-4 text-ink">
          Campus counsellor
        </button>

        <AnimatePresence>
          {showCounsellor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-3 rounded-2xl bg-card-2 p-4 text-sm text-soft">
                {counsellor ? (
                  <a href={`tel:${counsellor.replace(/\s/g, "")}`} className="flex items-center gap-2 font-semibold text-indigo">
                    <PhoneIcon size={18} /> Call {counsellor}
                  </a>
                ) : (
                  <p>Add your college counsellor's number here.</p>
                )}
                <input value={counsellor} onChange={(e) => setPrefs({ counsellor: e.target.value.slice(0, 40) })} inputMode="tel"
                  placeholder="Counsellor's phone number" className="min-h-11 w-full rounded-xl border border-line bg-card px-3 outline-none focus:border-indigo" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="pt-4 text-xs text-faint">{copy.disclaimer}</p>
      </div>
      </div>
    </div>
  );
}
