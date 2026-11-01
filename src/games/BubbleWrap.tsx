import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { buzz, chime, pop } from "./sound";

// Merel's bubble wrap. Each pop flattens the bubble, sends out a tiny ring and a few
// droplets, and makes a soft sound. Drag across the sheet to pop many at once.

const COUNT = 48;

function Bubble({ popped, onPop, index }: { popped: boolean; onPop: () => void; index: number }) {
  return (
    <motion.button
      type="button"
      aria-label={`Bubble ${index + 1}${popped ? " popped" : ""}`}
      data-i={index}
      onPointerDown={(e) => {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); // so dragging can pop the next ones
        onPop();
      }}
      disabled={popped}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: popped ? 0.86 : 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 18, delay: popped ? 0 : (index % 8) * 0.015 + Math.floor(index / 8) * 0.03 }}
      whileHover={popped ? undefined : { scale: 1.08 }}
      className="relative aspect-square touch-none rounded-full"
    >
      {/* the bubble */}
      <span
        className={`absolute inset-0 rounded-full transition-all duration-200 ${popped
          ? "bg-sage/30 shadow-none"
          : "bg-gradient-to-br from-white/90 to-sage/50 shadow-[inset_-3px_-4px_8px_rgba(0,0,0,0.08),0_3px_8px_-3px_rgba(0,0,0,0.2)]"}`}
      />
      {!popped && <span className="absolute left-[22%] top-[18%] h-[22%] w-[22%] rounded-full bg-white/90" />}
      {popped && <span className="absolute inset-[30%] rounded-full border border-sage-ink/20" />}

      {/* the burst */}
      <AnimatePresence>
        {popped && (
          <>
            <motion.span key="ring" className="pointer-events-none absolute inset-0 rounded-full border-2 border-white"
              initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.5 }} />
            {[0, 1, 2, 3, 4].map((i) => {
              const a = (i / 5) * Math.PI * 2 + index;
              return (
                <motion.span key={i} className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white"
                  initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * 26, y: Math.sin(a) * 26, opacity: 0, scale: 0.4 }}
                  transition={{ duration: 0.55, ease: "easeOut" }} />
              );
            })}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function BubbleWrap() {
  const [popped, setPopped] = useState<boolean[]>(Array(COUNT).fill(false));
  const [sheet, setSheet] = useState(0);
  const count = popped.filter(Boolean).length;
  const allPopped = count === COUNT;

  const done = useRef<Set<number>>(new Set());

  const popBubble = (index: number) => {
    if (done.current.has(index)) return;
    done.current.add(index);
    pop();
    buzz(8);
    setPopped((prev) => {
      const next = prev.map((v, i) => (i === index ? true : v));
      if (next.every(Boolean)) window.setTimeout(() => chime(2), 150);
      return next;
    });
  };

  const resetGame = () => {
    done.current = new Set();
    setPopped(Array(COUNT).fill(false));
    setSheet((s) => s + 1);
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-sage/30 p-5 text-center lg:p-8">
      <div className="mb-4 flex items-center justify-between text-sm">
        <p className="text-sage-ink">Pop slowly. Breathe out with each one.</p>
        <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="rounded-full bg-card/70 px-3 py-1 font-semibold tabular-nums text-sage-ink">
          {count}/{COUNT}
        </motion.span>
      </div>

      <div key={sheet}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" && e.buttons !== 1) return;
          const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-i]");
          if (el) popBubble(Number(el.dataset.i));
        }}
        className="grid touch-none select-none grid-cols-8 gap-2 rounded-3xl bg-card/40 p-3">
        {popped.map((isPopped, index) => (
          <Bubble key={index} index={index} popped={isPopped} onPop={() => popBubble(index)} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {allPopped ? (
          <motion.p key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 font-display text-3xl text-sage-ink">
            All popped. Lighter?
          </motion.p>
        ) : (
          <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 text-xs text-sage-ink/80">
            Tip: press and drag across the sheet.
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={resetGame}
        className="mt-4 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg">
        {allPopped ? "Wrap a new sheet" : "Reset"}
      </motion.button>
    </div>
  );
}
