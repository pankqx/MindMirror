import { motion } from "framer-motion";
import { NecklaceIcon } from "./Icons";

/** What you said, word by word, drifting in from the left and settling, like it is being written into the card. */
export function FlowingWords({ text, delay = 0, max = 18, className = "" }: { text: string; delay?: number; max?: number; className?: string }) {
  const words = text.trim().split(/\s+/);
  const shown = words.slice(0, max);
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">“</span>
      {shown.map((w, i) => (
        <motion.span key={i} aria-hidden="true" className="inline-block whitespace-pre"
          initial={{ opacity: 0, x: -10, y: -6, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          {w}{i < shown.length - 1 ? " " : ""}
        </motion.span>
      ))}
      <span aria-hidden="true">{words.length > max ? "…”" : "”"}</span>
    </span>
  );
}

/** The small "just heard" note on a signal the latest voice turn touched. */
export function HeardNote({ text, source }: { text: string; source: "necklace" | "web" }) {
  return (
    <motion.span className="mt-2 block" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">
        <NecklaceIcon size={13} /> Just heard {source === "necklace" ? "by your necklace" : "in voice mode"}
      </span>
      <FlowingWords text={text} delay={0.25} className="mt-1 block text-[14px] italic leading-snug text-soft" />
    </motion.span>
  );
}
