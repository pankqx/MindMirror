// 06 · Product showcase. Real captures of the running app on sample data, two by two.
// Each one opens that screen.

import { motion } from "framer-motion";
import type { Go } from "../../../lib/nav";
import { SHOWCASE } from "../../../content/landing";
import { Chip, Fade, Lines } from "../kit";
import { ease } from "../motion";

const src = (name: string) => `${import.meta.env.BASE_URL}showcase/${name}.webp`;

export function Showcase({ go }: { go: Go }) {
  return (
    <div className="weave relative isolate overflow-x-clip bg-khadi px-4 py-18 text-neel lg:px-20 lg:py-40">
      <div className="mb-14 flex flex-col gap-5 lg:mb-20">
        <Lines text={SHOWCASE.title} className="t-headline text-balance" />
        <Fade><p className="t-body-lg max-w-[600px] text-stone">{SHOWCASE.body}</p></Fade>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2 lg:gap-y-16">
        {SHOWCASE.shots.map((s, i) => (
          <motion.button key={s.id} onClick={() => go(s.to)} className="group block w-full text-left"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease, delay: (i % 2) * 0.1 }} aria-label={`${SHOWCASE.open} ${s.title}`}>
            <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] bg-khadi-2 shadow-[0_24px_60px_-34px_rgba(23,27,56,0.55)] ring-1 ring-neel/10">
              <img src={src(s.img)} alt={`MindMirror ${s.title} screen`} loading="lazy" decoding="async" width={1200} height={750}
                className="size-full object-cover object-top transition-transform duration-[1.2s] ease-(--ease-lp) group-hover:scale-[1.03]" />
              <span className="t-caption-sm absolute bottom-3 left-3 translate-y-2 rounded-[3px] bg-neel px-2 py-1 text-khadi opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                {SHOWCASE.open} ↗
              </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="t-caption">{s.title}</h3>
                <p className="t-caption-sm mt-1 text-stone">{s.sub}</p>
              </div>
              <Chip className={s.status === "Prototype" ? "bg-rani-ink/10 text-rani-ink" : "bg-neel/[0.07] text-neel/70"}>{s.status}</Chip>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
