import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MicIcon, NecklaceIcon, SendIcon } from "./Icons";
import { Dots, Wave } from "./LiveToasts";
import { spring } from "./ui";

// Kishore's chat: messages, a text box and Hold to talk.
// Now with message bubbles that float in, a typing indicator, and a live mic ring.

export type Message = {
  from: "me" | "mindmirror";
  text: string;
  via?: "necklace" | "web";
  note?: string;
};

export type HoldState = "idle" | "listening" | "thinking" | "speaking";

type ChatProps = {
  messages: Message[];
  onSend: (text: string) => void;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  typing?: boolean;
  hold?: HoldState;
  /** 0..1 mic level while listening. */
  level?: () => number;
  suggestions?: string[];
};

function MicRing({ level, active }: { level?: () => number; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!active || !level) return;
    let raf = 0;
    const tick = () => {
      const l = level();
      if (ref.current) ref.current.style.transform = `scale(${1 + l * 0.9})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, level]);
  return <span ref={ref} className="absolute inset-0 rounded-full bg-coral/30 transition-transform duration-75" />;
}

export default function Chat({ messages, onSend, onHoldStart, onHoldEnd, typing, hold = "idle", level, suggestions = [] }: ChatProps) {
  const [input, setInput] = useState("");
  const holding = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  function handleSend(text = input) {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setInput("");
  }

  function down(e: React.PointerEvent) {
    if (holding.current || hold === "thinking") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    holding.current = true;
    onHoldStart();
  }
  function up() {
    if (!holding.current) return;
    holding.current = false;
    onHoldEnd();
  }

  const label = {
    idle: "Hold to talk",
    listening: "Listening… let go when you're done",
    thinking: "Thinking",
    speaking: "Speaking on this laptop",
  }[hold];

  return (
    <div className="flex flex-col">
      {/* MESSAGES */}
      <div className="min-h-[38vh] space-y-3 pb-4">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
            <p className="font-display text-4xl">What's on your mind?</p>
            <p className="mt-2 text-sm text-soft">I listen, reflect, and suggest one small step. I never diagnose.</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}
              className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
              style={{ transformOrigin: m.from === "me" ? "bottom right" : "bottom left" }}>
              <div className="max-w-[85%]">
                <div className={m.from === "me"
                  ? "rounded-3xl rounded-br-md bg-card-2 px-4 py-3 text-[15px] leading-relaxed text-ink"
                  : "border-l-2 border-indigo py-1 pl-4 text-[17px] leading-relaxed text-ink"}>
                  {m.text}
                </div>
                {(m.via === "necklace" || m.note) && (
                  <div className={`mt-1 flex items-center gap-1 text-xs text-faint ${m.from === "me" ? "justify-end" : ""}`}>
                    {m.via === "necklace" && <><NecklaceIcon size={12} /> from necklace</>}
                    {m.note}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {typing && (
            <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex">
              <div className="border-l-2 border-indigo py-2 pl-4 text-faint"><Dots /></div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} className="h-1" />
      </div>

      {/* SUGGESTIONS */}
      {suggestions.length > 0 && (
        <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
          {suggestions.map((s) => (
            <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => handleSend(s)}
              className="t-caption-sm shrink-0 rounded-full border border-ink/15 px-3.5 py-2 text-soft hover:border-indigo hover:text-indigo">
              {s}
            </motion.button>
          ))}
        </div>
      )}

      {/* INPUT AREA */}
      <div className="sticky bottom-24 z-10 rounded-[1.75rem] border border-line bg-bg/90 p-2 backdrop-blur-xl lg:bottom-6">
        <div className="flex items-center gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Share your thoughts…" aria-label="Message"
            className="min-h-12 min-w-0 flex-1 rounded-2xl bg-transparent px-3 outline-none" />
          <AnimatePresence>
            {input.trim() && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                onClick={() => handleSend()} aria-label="Send" className="grid h-12 w-12 place-items-center rounded-full border border-line text-ink">
                <SendIcon size={20} />
              </motion.button>
            )}
          </AnimatePresence>
          {/* HOLD TO TALK */}
          <motion.button type="button" onPointerDown={down} onPointerUp={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}
            animate={{ scale: hold === "listening" ? 1.12 : 1 }} transition={spring} aria-label="Hold to talk"
            className={`relative grid h-12 w-12 shrink-0 touch-none select-none place-items-center rounded-full text-white ${hold === "listening" ? "bg-coral" : "bg-ink"}`}>
            <MicRing level={level} active={hold === "listening"} />
            <span className="relative text-bg">
              {hold === "speaking" ? <Wave bars={4} /> : hold === "thinking" ? <Dots /> : <MicIcon size={21} />}
            </span>
          </motion.button>
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="px-3 pb-1 pt-1.5 text-center text-xs font-medium text-faint">
            {label}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
