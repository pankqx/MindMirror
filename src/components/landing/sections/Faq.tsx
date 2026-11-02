// Before you begin: the honest questions, as an accordion, with help pinned beside them.

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FAQ } from "../../../content/landing";
import { DotField } from "../DotField";
import { Btn, Lines } from "../kit";
import { ease } from "../motion";

export function Faq({ onStart }: { onStart: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative isolate overflow-x-clip bg-coal px-4 py-18 text-white lg:px-20 lg:py-40">
      <DotField />
      <div className="pointer-events-none absolute inset-0 -z-[5] bg-coal-deep/40" aria-hidden="true" />
      <div className="grid grid-cols-1 gap-x-4 gap-y-14 lg:grid-cols-12">
        <div className="flex flex-col gap-8 self-start lg:sticky lg:top-36 lg:col-span-4">
          <Lines text={FAQ.title} className="t-headline" />
          <Btn tone="paper" onClick={onStart}>Get started</Btn>
          <div className="mt-4 border-t border-white/15 pt-6">
            <p className="t-caption text-white/60">Not okay right now?</p>
            <p className="t-body-lg mt-2 max-w-[32ch] text-mist/80">Tele-MANAS is free and open 24x7. A trained person will listen.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Btn tone="glow" href="tel:14416" label="Call Tele-MANAS on 14416">Call 14416</Btn>
              <Btn tone="ghost" href="tel:112" label="Call emergency services on 112">Emergency 112</Btn>
            </div>
          </div>
        </div>

        <ul className="flex flex-col lg:col-span-7 lg:col-start-6">
          {FAQ.items.map(([q, a], i) => {
            const on = open === i;
            return (
              <li key={q} className="border-b border-white/15">
                <h3>
                  <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} aria-controls={`lp-faq-${i}`}
                    className="t-caption group flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span><span className="text-white/45">Q.00{i + 1} / </span><span className="transition-colors group-hover:text-glow">{q}</span></span>
                    <span className="relative size-3 shrink-0" aria-hidden="true">
                      <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                      <span className={`absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-300 ${on ? "scale-y-0" : ""}`} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div id={`lp-faq-${i}`} className="overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease }}>
                      <p className="t-body-lg max-w-[60ch] pb-6 text-mist/80">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
