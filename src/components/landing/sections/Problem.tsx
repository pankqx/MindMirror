// 03 · The problem. An ordinary week, printed line by line as a receipt while you scroll, with a
// counter that tallies the signals as they appear. The last line is the point: none were heard.

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { PROBLEM } from "../../../content/landing";
import { Chip, Fade, Lines } from "../kit";

const TOTAL = PROBLEM.days.reduce((n, d) => n + d.rows.length, 0);

function Digit({ d }: { d: number }) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden align-top">
      <motion.span className="flex flex-col" animate={{ y: `${-d * 10}%` }} transition={{ type: "spring", stiffness: 140, damping: 22 }}>
        {Array.from({ length: 10 }, (_, i) => <span key={i} className="block h-[1em] leading-none">{i}</span>)}
      </motion.span>
    </span>
  );
}

const Fill = ({ ch }: { ch: string }) => (
  <span className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-neel/30" aria-hidden="true">{ch.repeat(240)}</span>
);
const Edge = ({ ch }: { ch: string }) => <span className="text-neel/30" aria-hidden="true">{ch}</span>;

function Rule({ l, m, r }: { l: string; m: string; r: string }) {
  return <div className="flex"><Edge ch={l} /><Fill ch={m} /><Edge ch={r} /></div>;
}

function Row({ a, b, className = "" }: { a: string; b?: string; className?: string }) {
  return (
    <div className="flex">
      <Edge ch="│" />
      <p className={`flex min-w-0 flex-1 items-end justify-between gap-x-[1ch] px-[1ch] lg:px-[2ch] ${className}`}>
        <span className="min-w-0">{a}</span>
        {b !== undefined && <span className="shrink-0 text-right">{b}</span>}
      </p>
      <Edge ch="│" />
    </div>
  );
}

export function Problem() {
  const ledger = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: q } = useScroll({ target: ledger, offset: ["start 80%", "end 70%"] });
  const clip = useTransform(q, (v) => `inset(0 0 ${(1 - v) * 100}% 0)`);
  const scan = useTransform(q, (v) => `${v * 100}%`);
  const scanOpacity = useTransform(q, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);
  const [count, setCount] = useState(reduce ? TOTAL : 0);
  useMotionValueEvent(q, "change", (v) => !reduce && setCount(Math.min(TOTAL, Math.floor(v * (TOTAL + 1.5)))));

  return (
    <div className="weave bg-khadi px-4 py-18 text-neel lg:px-20 lg:py-40">
      <div className="grid grid-cols-1 gap-x-4 gap-y-14 lg:grid-cols-12">
        <div className="flex flex-col gap-6 self-start lg:sticky lg:top-36 lg:col-span-5">
          <Lines text={PROBLEM.title} className="t-headline text-balance" />
          <Fade><p className="t-body-lg max-w-[440px] text-stone">{PROBLEM.body}</p></Fade>
          <div className="mt-6 flex flex-col gap-3 lg:mt-10">
            <div className="t-display -ml-1 flex tabular-nums" aria-label={`${count} signals this week`}>
              <Digit d={Math.floor(count / 10)} />
              <Digit d={count % 10} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="t-caption">{PROBLEM.counterLabel}</span>
              <Chip className="bg-neel text-khadi">{PROBLEM.chip}</Chip>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:pt-4">
          <div ref={ledger} className="relative mx-auto w-full font-[family-name:var(--font-geist-mono)] text-[13px] uppercase leading-[1.7] sm:text-[14px] lg:max-w-[56ch] lg:text-[15px]">
            <motion.div style={reduce ? undefined : { clipPath: clip }}>
              <Rule l="┌" m="─" r="┐" />
              <Row a={PROBLEM.ledgerTitle} b="Signal" className="font-medium" />
              <Row a={PROBLEM.ledgerNote} className="text-stone" />
              <Rule l="├" m="─" r="┤" />
              {PROBLEM.days.map((d, i) => (
                <div key={d.day}>
                  <Row a={`Day 0${i + 1} · ${d.day}`} className="text-stone" />
                  {d.rows.map(([a, b]) => <Row key={a} a={a} b={b} />)}
                  {i < PROBLEM.days.length - 1 && <Row a="" />}
                </div>
              ))}
              <Rule l="├" m="┄" r="┤" />
              <Row a={PROBLEM.ledgerEnd[0]} b={PROBLEM.ledgerEnd[1]} className="font-medium" />
              <Rule l="└" m="─" r="┘" />
            </motion.div>
            {!reduce && (
              <motion.div className="pointer-events-none absolute inset-x-[-1ch] h-px bg-neel" style={{ top: scan, opacity: scanOpacity }} aria-hidden="true">
                <span className="absolute -top-[3px] left-0 h-[7px] w-[3ch] bg-neel" />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
