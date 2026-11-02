// 07 · Privacy and technology, set as a ticket: the big promise on the left, the five facts
// behind it on the right, torn along a dotted seam.

import { PRIVACY } from "../../../content/landing";
import { Btn, Fade, Lines } from "../kit";

const TEAM = ["KP", "MD", "AK"];

export function Privacy({ onStart }: { onStart: () => void }) {
  return (
    <section id="about" className="bg-paper px-4 py-18 text-coal lg:px-20 lg:py-40">
      <div className="flex flex-col gap-10 lg:gap-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <Lines text={PRIVACY.title} className="t-headline text-balance" />
          <div className="flex items-center gap-3">
            <div className="flex items-center" aria-hidden="true">
              {TEAM.map((t, i) => (
                <span key={t} className={`t-caption-sm grid size-7 place-items-center rounded-full bg-coal text-[9px] text-paper ring-2 ring-paper ${i ? "-ml-2" : ""}`}>{t}</span>
              ))}
            </div>
            <p className="t-caption-sm text-stone">{PRIVACY.credit}</p>
          </div>
        </div>

        <Fade>
          <div className="grid text-white lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            {/* stub */}
            <div className="relative flex min-h-[340px] flex-col justify-between gap-10 rounded-t-[12px] bg-coal p-5 lg:rounded-l-[12px] lg:rounded-tr-none lg:p-8">
              <p className="t-caption text-white/60">{PRIVACY.ticketLabel}</p>
              <p className="t-display" aria-label={`${PRIVACY.ticketBig} accounts needed`}>{PRIVACY.ticketBig}</p>
              <p className="t-caption-sm max-w-[44ch] text-white/55">
                {PRIVACY.ticketLines.map((l) => <span key={l} className="block">{l}</span>)}
              </p>
            </div>
            {/* the facts */}
            <div className="relative flex flex-col justify-between gap-8 rounded-b-[12px] bg-coal p-5 lg:rounded-r-[12px] lg:rounded-bl-none lg:p-8">
              {/* the dotted tear and its notches */}
              <span className="absolute inset-x-5 top-0 h-px bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.3)_0_4px,transparent_4px_9px)] lg:inset-x-auto lg:inset-y-5 lg:left-0 lg:h-auto lg:w-px lg:bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.3)_0_4px,transparent_4px_9px)]" aria-hidden="true" />
              <span className="absolute -left-3 -top-3 size-6 rounded-full bg-paper lg:-top-3 lg:-left-3" aria-hidden="true" />
              <span className="absolute -right-3 -top-3 size-6 rounded-full bg-paper lg:right-auto lg:-bottom-3 lg:top-auto lg:-left-3" aria-hidden="true" />
              <ul className="font-[family-name:var(--font-geist-mono)] text-[13px] uppercase lg:text-[14px]">
                {PRIVACY.points.map(([n, t, d]) => (
                  <li key={n} className="grid grid-cols-[2.5ch_1fr] gap-x-3 border-b border-white/12 py-3 first:pt-1 lg:first:border-t lg:first:pt-3">
                    <span className="text-white/40">{n}</span>
                    <span>
                      <span className="block text-white">{t}</span>
                      <span className="t-body mt-1 block normal-case text-white/55" style={{ fontFamily: "var(--font-geist)" }}>{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="t-caption-sm max-w-[30ch] text-white/50">{PRIVACY.note.join(" ")}</p>
                <Btn tone="paper" onClick={onStart}>Get started</Btn>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </section>
  );
}
