// A panel of embroidered days: seven mirrors to a row, joined by running stitch.
// Hover or focus a mirror to read that day in plain words.

import { useState } from "react";
import type { ClothDay } from "./cloth";
import { Shisha } from "./Shisha";

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export function Cloth({ days, cols = 7, draw = true, dark = true, className = "" }: { days: ClothDay[]; cols?: number; draw?: boolean; dark?: boolean; className?: string }) {
  const [on, setOn] = useState<number | null>(null);
  const shown = on === null ? days.length - 1 : on;
  const d = days[shown];
  const seam = dark ? "text-white/15" : "text-neel/15";
  return (
    <div className={className}>
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {/* running-stitch seams between rows and columns */}
        <div className={`pointer-events-none absolute inset-0 ${seam}`} aria-hidden="true">
          {Array.from({ length: Math.ceil(days.length / cols) }, (_, r) => (
            <span key={r} className="stitch-x absolute inset-x-[4%] h-[2px]" style={{ top: `${((r + 0.5) / Math.ceil(days.length / cols)) * 100}%` }} />
          ))}
        </div>
        {days.map((day, i) => (
          <button key={day.date} type="button" onPointerEnter={() => setOn(i)} onPointerLeave={() => setOn(null)} onFocus={() => setOn(i)} onBlur={() => setOn(null)}
            className={`relative grid aspect-square place-items-center rounded-full transition-transform duration-300 hover:scale-110 focus-visible:scale-110 ${shown === i ? "z-10" : ""}`}
            aria-label={`${fmt(day.date)}: ${day.line}`}>
            <span className={`absolute inset-[18%] rounded-full ${dark ? "bg-neel" : "bg-khadi"}`} aria-hidden="true" />
            <Shisha size="100%" className="relative" thread={day.thread} accent={day.thread} petals={day.tone === "empty" ? 0 : Math.min(10, day.petals)}
              mirror={day.mirror} empty={day.tone === "empty"} draw={draw} delay={(i % cols) * 0.06 + Math.floor(i / cols) * 0.18} />
          </button>
        ))}
      </div>
      <p className={`t-caption-sm mt-5 min-h-[2.6em] ${dark ? "text-white/60" : "text-stone"}`} aria-live="polite">
        <span className={dark ? "text-white" : "text-neel"}>{fmt(d.date)}</span> · {d.line}
      </p>
    </div>
  );
}
