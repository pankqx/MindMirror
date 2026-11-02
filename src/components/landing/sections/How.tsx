// 05 · How it works. A dark window, like an editor: five step files on the left, the open one
// rendered on the right with a real example from the sample data. J / K (or the arrows) move.

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { HOW } from "../../../content/landing";
import { Btn, Lines, Ping } from "../kit";
import { ease, useMedia } from "../motion";

export function How({ onSample }: { onSample: () => void }) {
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { amount: 0.4 });
  const lg = useMedia("(min-width: 1024px)");
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: box, offset: ["start end", "start 25%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const n = HOW.steps.length;
  const step = HOW.steps[i];
  const move = (d: number) => setI((v) => (v + d + n) % n);

  useEffect(() => {
    if (!inView) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "j" || e.key === "ArrowRight") move(1);
      if (e.key === "k" || e.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <section id="how" className="bg-paper px-4 py-18 text-coal lg:px-20 lg:py-40">
      <div className="mb-10 flex flex-col gap-4 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-5">
          <p className="t-caption">{HOW.eyebrow}</p>
          <Lines text={HOW.title} className="t-headline text-balance" />
        </div>
        <p className="t-caption-sm hidden text-stone lg:block">
          <kbd className="rounded-[3px] bg-mist px-1.5 py-0.5 font-[inherit]">J</kbd> <kbd className="rounded-[3px] bg-mist px-1.5 py-0.5 font-[inherit]">K</kbd> to move
        </p>
      </div>

      <motion.div ref={box} style={lg && !reduce ? { scale } : undefined} className="origin-top rounded-[8px] bg-coal p-1.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black lg:p-2">
        <div className="flex flex-col overflow-hidden rounded-[4px] bg-[#1b1b1b] text-white lg:min-h-[600px]">
          {/* title bar */}
          <div className="t-caption-sm flex h-11 items-center justify-between border-b border-white/10 px-4 text-white/45">
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" /><span className="size-2.5 rounded-full bg-white/15" />
            </span>
            <span className="truncate px-3 text-white/70">mindmirror / how-it-works</span>
            <span className="tabular-nums">0{i + 1} / 0{n}</span>
          </div>

          <div className="grid flex-1 grid-cols-1 lg:grid-cols-[260px_1fr]">
            {/* file tree */}
            <nav aria-label="Steps" className="t-caption-sm border-b border-white/10 py-3 lg:border-b-0 lg:border-r">
              <p className="hidden px-4 py-1.5 text-white/40 lg:block">▾ mindmirror/</p>
              <p className="hidden px-4 py-1.5 pl-7 text-white/40 lg:block">▾ how-it-works/</p>
              <ul className="no-scrollbar flex overflow-x-auto px-2 lg:block lg:px-0">
                {HOW.steps.map((s, k) => (
                  <li key={s.file} className="shrink-0">
                    <button onClick={() => setI(k)} aria-current={k === i ? "step" : undefined}
                      className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left transition-colors lg:py-1.5 lg:pl-10 ${k === i ? "bg-white/[0.06] text-glow" : "text-white/55 hover:bg-white/[0.04] hover:text-white"}`}>
                      <span className="flex size-2 items-center justify-center">{k === i && <Ping />}</span>
                      {s.file}
                    </button>
                  </li>
                ))}
              </ul>
              <p className="hidden px-4 py-1.5 pl-7 text-white/30 lg:block">▸ src/lib/signals.ts</p>
              <p className="hidden px-4 py-1.5 pl-7 text-white/30 lg:block">▸ hub/server.mjs</p>
              <p className="hidden px-4 py-1.5 pl-7 text-white/30 lg:block">&nbsp;&nbsp;README.md</p>
            </nav>

            {/* the open file */}
            <div className="relative min-h-[460px] px-5 py-8 lg:px-12 lg:py-12">
              <AnimatePresence mode="wait">
                <motion.article key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }}>
                  <p className="t-caption-sm mb-6 text-white/40">how-it-works / {step.file}</p>
                  <h3 className="t-headline max-w-[22ch] text-balance">
                    <span className="text-white/35">{step.n} / </span>{step.title}
                  </h3>
                  <div className="mt-6 flex max-w-[62ch] flex-col gap-3">
                    {step.body.map((b) => <p key={b} className="t-body-lg text-mist/75">{b}</p>)}
                  </div>
                  {step.code && (
                    <div className="mt-8 max-w-[62ch] overflow-hidden rounded-[4px] border border-white/10 bg-coal-deep">
                      <p className="t-caption-sm border-b border-white/10 px-4 py-2 text-white/40">{step.code.lang}</p>
                      <pre className="no-scrollbar overflow-x-auto px-4 py-4 font-[family-name:var(--font-geist-mono)] text-[12.5px] leading-[1.8] text-white/85 lg:text-[13.5px]">
                        {step.code.lines.map((l, k) => (
                          <motion.span key={k} className="block min-h-[1.8em]" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + k * 0.07, duration: 0.3 }}>
                            {l.replace(/(needs care|soft rain|−1\.6 h)/g, "\u0000$1\u0000").split("\u0000").map((part, j) =>
                              j % 2 ? <span key={j} className="text-glow">{part}</span> : part)}
                          </motion.span>
                        ))}
                      </pre>
                    </div>
                  )}
                </motion.article>
              </AnimatePresence>
              <div className="mt-10 flex items-center gap-2 lg:absolute lg:bottom-8 lg:right-12 lg:mt-0">
                <button onClick={() => move(-1)} className="t-caption-sm h-9 rounded-[3px] bg-white/[0.06] px-3 text-white/70 hover:bg-white/10 hover:text-white">← Prev</button>
                <button onClick={() => move(1)} className="t-caption-sm h-9 rounded-[3px] bg-white/[0.06] px-3 text-white/70 hover:bg-white/10 hover:text-white">Next →</button>
              </div>
            </div>
          </div>

          {/* terminal */}
          <div className="flex flex-col gap-4 border-t border-white/10 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <p className="font-[family-name:var(--font-geist-mono)] text-[12.5px] leading-relaxed text-white/80 lg:text-[13.5px]">
              <span className="text-white/40">{HOW.terminal.path} › </span>{HOW.terminal.cmd}
              <span className="text-white/35">{"   # "}{HOW.terminal.comment}</span>
            </p>
            <Btn tone="paper" onClick={onSample}>{HOW.terminal.cta}</Btn>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
