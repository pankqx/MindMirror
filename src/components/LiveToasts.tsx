import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { db, type VoiceTurn } from "../lib/db";
import { useSpeaking, useThinking } from "../lib/hub";
import type { Go, Screen } from "../lib/nav";
import { NecklaceIcon, SpeakerIcon } from "./Icons";

/** Three dots that breathe while the hub is thinking. */
export function Dots() {
  return (
    <span className="inline-flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-current" animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </span>
  );
}

/** A live sound-wave, used while a reply is being spoken. */
export function Wave({ bars = 5 }: { bars?: number }) {
  return (
    <span className="inline-flex h-4 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <motion.span key={i} className="w-[3px] rounded-full bg-current" animate={{ height: [4, 14, 6, 12, 4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }} />
      ))}
    </span>
  );
}

/** Live cards at the top of the screen: "the necklace heard you" and the reply as it arrives. */
export function LiveToasts({ go, screen }: { go: Go; screen: Screen }) {
  const thinking = useThinking();
  const speaking = useSpeaking();
  const last = useLiveQuery(() => db.voice.toCollection().last(), []);
  const firstId = useRef<number | null | undefined>(undefined);
  const [shown, setShown] = useState<VoiceTurn | null>(null);

  useEffect(() => {
    if (last === undefined) return;
    if (firstId.current === undefined) {
      firstId.current = last?.id ?? null; // don't toast old turns on page load
      return;
    }
    if (last && last.id !== firstId.current && last.source === "necklace") {
      firstId.current = last.id;
      setShown(last);
      const t = window.setTimeout(() => setShown(null), 12000);
      return () => window.clearTimeout(t);
    }
  }, [last]);

  const showThinking = thinking === "necklace";
  const showTurn = !showThinking && shown && screen !== "companion";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
      <AnimatePresence mode="popLayout">
        {showThinking && (
          <motion.div key="thinking" layout initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold text-indigo shadow-soft">
            <NecklaceIcon size={18} />
            <span>Your necklace heard you. Thinking</span>
            <Dots />
          </motion.div>
        )}
        {showTurn && (
          <motion.button key={`turn-${shown.id}`} layout onClick={() => { setShown(null); go("companion"); }}
            initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-full max-w-[480px] rounded-3xl border border-line bg-card p-4 text-left shadow-soft">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-faint">
              <span className="flex items-center gap-1.5"><NecklaceIcon size={14} /> From your necklace, just now</span>
              {speaking && <span className="flex items-center gap-1.5 text-indigo"><SpeakerIcon size={14} /><Wave /></span>}
            </div>
            <p className="mt-2 text-sm text-soft">“{shown.heard}”</p>
            <p className="mt-1.5 font-semibold text-ink">{shown.reply}</p>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
