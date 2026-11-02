// The small things that float over the landing: the way into the particle "dive", help that's
// always one tap away, and a gentle card for anyone not ready to start.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BREATH_CARD } from "../../content/landing";
import type { Go } from "../../lib/nav";
import { Btn, ease } from "./kit";

export function DiveTile({ go }: { go: Go }) {
  return (
    <motion.button onClick={() => go("dive")} aria-label="Take the dive: the particle-field intro"
      className="group fixed right-6 top-6 z-40 hidden aspect-video h-14 overflow-hidden rounded-[3px] bg-coal text-white ring-1 ring-white/10 lg:block"
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.8, ease }}>
      <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="lp-ring absolute size-16 rounded-full border border-dotted border-glow/70" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
      </span>
      <span className="t-caption-sm absolute bottom-1 left-1.5 text-[10px] text-white/80 transition-colors group-hover:text-glow">The dive ↗</span>
    </motion.button>
  );
}

export function HelpPill() {
  return (
    <a href="tel:14416" className="t-caption-sm fixed bottom-4 right-4 z-40 flex h-9 items-center gap-2 rounded-[3px] bg-coal px-3 text-white ring-1 ring-white/10 transition-colors hover:bg-black lg:bottom-6 lg:right-6"
      aria-label="Need help now? Call Tele-MANAS on 14416, free, 24x7">
      <span className="size-1.5 rounded-full bg-[#ff6b5e]" aria-hidden="true" />
      Help now · 14416
    </a>
  );
}

const KEY = "mindmirror.lp.breathcard";

export function BreathCard({ go }: { go: Go }) {
  const [show, setShow] = useState(false);
  const [gone, setGone] = useState(() => {
    try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (gone) return;
    const on = () => setShow(window.scrollY > window.innerHeight * 2.2 && window.innerHeight + window.scrollY < document.body.scrollHeight - window.innerHeight * 1.5);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [gone]);

  const close = () => {
    setGone(true);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode: just hide it */ }
  };

  return (
    <AnimatePresence>
      {show && !gone && (
        <motion.aside aria-label={BREATH_CARD.title}
          className="fixed inset-x-4 bottom-16 z-40 flex flex-col gap-4 rounded-[8px] border border-white/20 bg-coal p-4 text-white lg:inset-x-auto lg:bottom-6 lg:left-6 lg:w-[440px] lg:p-6"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.5, ease }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[18px] font-medium leading-tight">{BREATH_CARD.title}</p>
              <p className="t-body mt-2 text-mist/75">{BREATH_CARD.body}</p>
            </div>
            <button onClick={close} aria-label="Close" className="grid size-7 shrink-0 place-items-center rounded-[3px] bg-white/10 hover:bg-white/20">
              <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
            </button>
          </div>
          <Btn tone="paper" onClick={() => { close(); go("breathe"); }}>{BREATH_CARD.cta}</Btn>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
