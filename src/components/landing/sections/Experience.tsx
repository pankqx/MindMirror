// 04 · The MindMirror experience. Ten numbered parts stepping down the page in a slow diagonal,
// while a plate on the right draws whichever one you're reading. A field of dots ripples behind.

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EXPERIENCE } from "../../../content/landing";
import { DotField } from "../DotField";
import { Figure } from "../Figures";
import { Chip, Fade, Lines } from "../kit";
import { ease } from "../motion";

const STEP = ["md:ml-0", "md:ml-[14%] lg:ml-[25%]", "md:ml-[28%] lg:ml-[50%]"];

export function Experience() {
  const [active, setActive] = useState(0);
  const f = EXPERIENCE.features[active];

  return (
    <div className="relative isolate overflow-x-clip bg-neel px-4 py-18 text-white lg:px-20 lg:py-40">
      <DotField label={EXPERIENCE.click} />
      <div className="pointer-events-none absolute inset-0 -z-[5] bg-neel-deep/30" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <div className="flex max-w-[520px] flex-col gap-8">
            <Lines text={EXPERIENCE.title} className="t-headline text-balance" />
            <Fade><p className="t-body-lg text-mist/80">{EXPERIENCE.body}</p></Fade>
          </div>

          <ul className="mt-16 flex flex-col gap-14 lg:mt-24 lg:gap-16">
            {EXPERIENCE.features.map((x, i) => (
              <motion.li key={x.n} className={`flex max-w-[560px] flex-col gap-3 lg:max-w-[50%] ${STEP[i % 3]}`}
                onViewportEnter={() => setActive(i)} viewport={{ margin: "-48% 0px -48% 0px" }}>
                <div className="mb-2 aspect-square w-32 border border-white/12 bg-neel/70 p-2 lg:hidden" aria-hidden="true">
                  <Figure i={i} />
                </div>
                <Fade y={10}>
                  <h3 className={`t-caption flex flex-wrap items-center gap-x-2 gap-y-1 transition-colors duration-500 ${active === i ? "text-white" : "lg:text-white/60"}`}>
                    <span>{x.n} / {x.title}</span>
                    {x.status && <Chip className="bg-rani/15 text-rani">{x.status}</Chip>}
                  </h3>
                  <p className="t-body mt-3 text-mist/70">{x.body}</p>
                </Fade>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* the plate */}
        <div className="hidden lg:col-span-5 lg:col-start-8 lg:block">
          <div className="sticky top-[calc(50svh-15rem)]">
            <div className="border border-white/12 bg-neel/80 backdrop-blur-sm">
              <div className="t-caption-sm flex items-center justify-between border-b border-white/12 px-4 py-3 text-white/50">
                <span>Fig. {f.n}</span>
                <span className="text-white/80">{f.title}</span>
              </div>
              <div className="relative aspect-square">
                <AnimatePresence mode="wait">
                  <motion.div key={active} className="absolute inset-0 p-8" initial={{ opacity: 0, filter: "blur(6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(6px)" }} transition={{ duration: 0.45, ease }}>
                    <Figure i={active} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-1 border-t border-white/12 px-4 py-3" aria-hidden="true">
                {EXPERIENCE.features.map((x, i) => (
                  <span key={x.n} className={`h-[3px] flex-1 transition-colors duration-500 ${i <= active ? "bg-rani" : "bg-white/12"}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
