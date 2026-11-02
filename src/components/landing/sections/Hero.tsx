// 02 · Hero. Paper on the left, the mirror on the right. On a laptop, scrolling "dives" into the
// mirror: the dark half widens to the whole screen and the rings rush towards you.

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HERO } from "../../../content/landing";
import { Btn, ease, Lines, scrollToId, useMedia } from "../kit";
import { Vortex } from "../Vortex";

export function Hero({ onStart }: { onStart: () => void }) {
  const track = useRef<HTMLElement>(null);
  const lg = useMedia("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const dives = lg && !reduce;
  const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });
  const width = useTransform(p, [0, 0.7], ["49.4%", "100%"]);
  const x = useTransform(p, [0, 0.6], [0, -96]);
  const fade = useTransform(p, [0, 0.45], [1, 0]);
  const dive = useTransform(p, [0.05, 1], [0, 1]);

  return (
    <section id="top" ref={track} className={`relative bg-paper text-coal ${dives ? "h-[200svh]" : ""}`}>
      <div className={`grid grid-cols-1 lg:grid-cols-12 lg:gap-x-4 ${dives ? "sticky top-0 h-svh overflow-hidden" : "lg:h-svh lg:min-h-[640px]"}`}>
        <motion.div className="flex flex-col px-4 pb-12 pt-28 lg:col-span-5 lg:justify-center lg:px-20 lg:pb-0 lg:pt-0"
          style={dives ? { x, opacity: fade } : undefined}>
          <motion.p className="t-caption mb-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}>
            {HERO.eyebrow}
          </motion.p>
          <Lines as="h1" text={HERO.title} className="t-hero mb-8 text-balance" delay={0.35} />
          <motion.p className="t-body-lg max-w-[440px] text-stone" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease }}>
            {HERO.body}
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.9, ease }}>
            <Btn onClick={onStart}>{HERO.primary}</Btn>
            <Btn tone="mist" onClick={() => scrollToId("features")}>{HERO.secondary}</Btn>
          </motion.div>
        </motion.div>

        <motion.figure
          className={`relative m-0 h-[80svh] overflow-hidden bg-coal lg:absolute lg:inset-y-0 lg:right-0 lg:h-full ${dives ? "" : "lg:w-[49.4%]"}`}
          style={dives ? { width } : undefined}
          initial={{ clipPath: "inset(0 0 0 100%)" }} animate={{ clipPath: "inset(0 0 0 0%)" }} transition={{ duration: 1.3, ease, delay: 0.1 }}>
          <Vortex text={HERO.vortex} dive={dives ? dive : undefined} />
          <figcaption className="t-caption-sm pointer-events-none absolute bottom-4 right-4 text-white/40 lg:bottom-6 lg:right-6">Click the mirror</figcaption>
        </motion.figure>

        {/* scroll cue */}
        <motion.button onClick={() => scrollToId("signals")} style={dives ? { opacity: fade } : undefined}
          className="t-caption-sm group absolute bottom-10 left-20 hidden items-center gap-2.5 text-stone transition-colors hover:text-coal lg:flex">
          <span className="relative block size-5 text-coal" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="lp-ring absolute inset-0 rounded-full border border-dotted border-current" style={{ animationDelay: `${i * 0.6}s` }} />
            ))}
            <span className="absolute left-1/2 top-1/2 size-0.5 -translate-1/2 bg-current" />
          </span>
          {HERO.cue}
        </motion.button>
      </div>
    </section>
  );
}
