// Your normal: the heart of Mind Check. Asha's three sample weeks, embroidered one mirror a day,
// next to what the real signal engine says about her (computed here, in the page, from the same
// sample data; nothing is saved).

import { useMemo } from "react";
import { NORMAL } from "../../../content/landing";
import { localDate } from "../../../lib/db";
import { sampleData } from "../../../lib/sample";
import { computeInsights } from "../../../lib/signals";
import { Cloth } from "../../shisha/Cloth";
import { weave } from "../../shisha/cloth";
import { LEVEL_THREAD } from "../../shisha/palette";
import { Chip, Fade, Lines } from "../kit";

export function Normal() {
  const { cloth, ins } = useMemo(() => {
    const today = localDate();
    const { checkins, voice, tasks } = sampleData(today);
    return { cloth: weave(checkins, today, 21), ins: computeInsights(checkins, voice, tasks, today) };
  }, []);
  const care = ins.signals.find((s) => s.level === "needs care") ?? ins.signals[0];

  return (
    <div className="relative bg-neel px-4 py-18 text-white lg:px-20 lg:py-40">
      <div className="grid grid-cols-1 gap-x-4 gap-y-14 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <p className="t-caption text-white/60">{NORMAL.eyebrow}</p>
          <Lines text={NORMAL.title} className="t-headline text-balance" />
          <Fade><p className="t-body-lg max-w-[460px] text-mist/75">{NORMAL.body}</p></Fade>

          <Fade delay={0.1}>
            <div className="mt-4 max-w-[460px] border-t border-white/12">
              <div className="t-caption-sm flex items-center justify-between py-3 text-white/50">
                <span>{NORMAL.engine}</span>
                <Chip className="bg-white/[0.08] text-white/80">{ins.weatherTitle}</Chip>
              </div>
              <ul>
                {ins.signals.map((s) => (
                  <li key={s.key} className="t-caption-sm flex items-center justify-between border-t border-white/[0.08] py-2.5">
                    <span className="flex items-center gap-2.5 text-white/85">
                      <span className="size-2 rounded-full" style={{ background: LEVEL_THREAD[s.level] }} aria-hidden="true" />{s.name}
                    </span>
                    <span style={{ color: LEVEL_THREAD[s.level] }}>{s.level}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-l-2 pl-4 text-[15px] leading-relaxed text-white/80" style={{ borderColor: LEVEL_THREAD[care.level] }}>
                <span className="t-caption-sm mb-1 block text-white/45">{NORMAL.proof}</span>
                {care.text}
              </p>
            </div>
          </Fade>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="lg:sticky lg:top-28">
            <div className="t-caption-sm mb-4 flex flex-wrap items-center justify-between gap-2 text-white/50">
              <span>{NORMAL.clothTitle}</span>
              <span className="flex flex-wrap gap-3">
                {NORMAL.legend.map(([label, thread]) => (
                  <span key={label} className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: thread }} />{label}</span>
                ))}
              </span>
            </div>
            <Cloth days={cloth} />
            <p className="t-caption-sm mt-2 text-white/35">{NORMAL.note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
