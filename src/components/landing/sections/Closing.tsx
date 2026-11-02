// 08 · The last screen, and 09 · the footer.

import { motion, useReducedMotion } from "framer-motion";
import type { Go, Screen } from "../../../lib/nav";
import { FINAL, FOOTER } from "../../../content/landing";
import { Btn, Lines, Mark } from "../kit";
import { scrollToId } from "../motion";

/** Slow concentric rings behind the last line: the mirror, breathing (4 s in, 6 s out). */
function Rings() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.span key={i} className="absolute rounded-full border border-coal/[0.08]"
          style={{ width: `${30 + i * 18}vmax`, height: `${30 + i * 18}vmax` }}
          animate={reduce ? undefined : { scale: [1, 1.04, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 10, times: [0, 0.4, 0.42, 1], ease: "easeInOut", delay: i * 0.15 }} />
      ))}
    </div>
  );
}

export function Final({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative isolate overflow-hidden bg-paper text-coal">
      <Rings />
      <div className="relative mx-auto flex min-h-svh max-w-[1100px] flex-col items-center justify-center px-4 py-24 text-center">
        <Lines text={FINAL.title} className="t-headline max-w-[20ch] text-balance" />
        <Lines as="p" text={FINAL.last} delay={0.3}
          className="font-display mt-2 text-[clamp(4.5rem,13vw,11rem)] italic text-glow-ink" />
        <div className="mt-12"><Btn onClick={onStart}>{FINAL.cta}</Btn></div>
      </div>
    </section>
  );
}

export function Footer({ go }: { go: Go }) {
  const link = (to: string) => {
    if (to.startsWith("tel:")) return { href: to };
    return { onClick: () => go(to as Screen) };
  };
  return (
    <footer className="bg-paper px-4 pb-20 pt-12 text-coal lg:px-20 lg:pb-10">
      <div className="grid grid-cols-1 gap-x-4 gap-y-12 border-t border-coal/15 pt-12 lg:grid-cols-12">
        <div className="flex flex-col items-start gap-8 lg:col-span-5">
          <button onClick={() => scrollToId("top")} className="flex items-center gap-2.5" aria-label="Back to top">
            <Mark size={28} ring="#232323" fill="#3b45b8" />
            <span className="text-[22px] font-medium tracking-[-0.02em]">MindMirror</span>
          </button>
          <p className="t-body max-w-[360px] text-stone">{FOOTER.blurb}</p>
          <Btn tone="mist" onClick={() => go("breathe")}>Breathe for a minute</Btn>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {FOOTER.cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-4">
              <p className="t-body text-stone">{c.title}</p>
              <ul className="flex flex-col gap-2">
                {c.links.map(([label, to]) => {
                  const p = link(to);
                  const cls = "t-caption-sm text-left underline-offset-4 transition-colors hover:text-glow-ink hover:underline";
                  return <li key={label}>{"href" in p ? <a className={cls} href={p.href}>{label}</a> : <button className={cls} onClick={p.onClick}>{label}</button>}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="t-caption-sm mt-16 flex flex-col gap-2 border-t border-coal/15 pt-6 lg:mt-24 lg:flex-row lg:items-center lg:justify-between">
        <p>© 2026 {FOOTER.copyright}</p>
        <p className="text-stone">{FOOTER.note}</p>
        <a href={FOOTER.repo} target="_blank" rel="noreferrer" className="w-fit text-stone transition-colors hover:text-coal">Source on GitHub ↗</a>
      </div>
    </footer>
  );
}
