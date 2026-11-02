import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { PageHeader, ease } from "../components/ui";
import Dissolve from "../games/Dissolve";
import Jelly from "../games/Jelly";
import PopSheet from "../games/PopSheet";
import Ripples from "../games/Ripples";
import { unlockAudio } from "../lib/hub";

// The play room: no scores, no timers, no way to lose. Each game opens as its own dark room.

type GameId = "jelly" | "bubbles" | "letgo" | "pond";

const GAMES: { id: GameId; title: string; line: string; tone: [string, string] }[] = [
  { id: "jelly", title: "Jelly", line: "Poke it, squash it, fling it. It always comes back.", tone: ["#a98bff", "#ff8fc7"] },
  { id: "bubbles", title: "Bubble wrap", line: "Press, hold, let go. Drag across a row for a chain.", tone: ["#7fd6ff", "#b9a6ff"] },
  { id: "letgo", title: "Let it go", line: "Write a worry, hold, and watch it drift away as embers.", tone: ["#ffb27a", "#ff7a8a"] },
  { id: "pond", title: "Koi pond", line: "Tap the water. Watch the rings settle and the koi glide.", tone: ["#6fe0c8", "#5f8dff"] },
];

/** Little living previews, drawn with CSS so the list stays light. */
function Preview({ id, tone }: { id: GameId; tone: [string, string] }) {
  if (id === "jelly")
    return (
      <motion.span className="block h-20 w-24 rounded-[45%_55%_48%_52%/55%_50%_50%_45%]"
        style={{ background: `radial-gradient(circle at 35% 30%, #fff8, transparent 30%), linear-gradient(140deg, ${tone[0]}, ${tone[1]})`, boxShadow: `0 0 50px ${tone[0]}66` }}
        animate={{ scaleX: [1, 1.12, 0.94, 1.04, 1], scaleY: [1, 0.88, 1.08, 0.97, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
    );
  if (id === "bubbles")
    return (
      <span className="grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }, (_, i) => (
          <motion.span key={i} className="h-6 w-6 rounded-full"
            style={{ background: `radial-gradient(circle at 32% 30%, #fffd 0 14%, ${i % 2 ? tone[0] : tone[1]}55 45%, ${tone[1]}aa 100%)` }}
            animate={{ scale: [1, 1, 0.75, 0.9, 1], opacity: [1, 1, 0.3, 0.3, 1] }} transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.3, times: [0, 0.5, 0.56, 0.9, 1] }} />
        ))}
      </span>
    );
  if (id === "letgo")
    return (
      <span className="relative block h-20 w-28">
        {Array.from({ length: 16 }, (_, i) => (
          <motion.span key={i} className="absolute h-1 w-1 rounded-full" style={{ left: `${(i * 37) % 100}%`, bottom: 0, background: i % 3 ? tone[0] : "#fff" }}
            animate={{ y: [0, -80], opacity: [0, 1, 0], x: [0, (i % 2 ? 6 : -6)] }} transition={{ duration: 2.4, repeat: Infinity, delay: (i * 0.17) % 2.4, ease: "easeOut" }} />
        ))}
        <span className="absolute inset-x-0 bottom-1 text-center font-display text-lg italic text-white/70">worry</span>
      </span>
    );
  return (
    <span className="relative grid h-20 w-20 place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute h-20 w-20 rounded-full border" style={{ borderColor: tone[0] }}
          animate={{ scale: [0.15, 1.3], opacity: [0.9, 0] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.85, ease: "easeOut" }} />
      ))}
    </span>
  );
}

function Room({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <motion.div className="night mm-grain fixed inset-0 z-[80] flex flex-col overflow-hidden"
      style={{ background: "radial-gradient(80% 60% at 50% 40%, #16142a, #060609 75%)" }}
      initial={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }} transition={{ duration: 0.55, ease }}>
      <header className="flex items-center justify-between p-5 lg:p-8">
        <button onClick={onClose} className="mm-glass flex h-10 items-center gap-2 rounded-full pl-3 pr-4 text-[13px] font-medium transition-colors hover:bg-white/10">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          Play room
        </button>
        <span className="font-display text-[1.6rem]">{title}</span>
        <span className="w-[100px]" />
      </header>
      <div className="mx-auto w-full max-w-[1100px] flex-1 px-3 pb-6 lg:px-8">{children}</div>
    </motion.div>
  );
}

export default function Play() {
  const [open, setOpen] = useState<GameId | null>(null);
  const game = GAMES.find((g) => g.id === open);

  return (
    <div>
      <PageHeader eyebrow="Play room" title={<>Do something <em className="italic">small</em>.</>} lede="No scores. No timers. No way to lose. Doing beats reading when you're stressed." />
      <div className="grid gap-3 sm:grid-cols-2">
        {GAMES.map((g, i) => (
          <motion.button key={g.id} onClick={() => { unlockAudio(); setOpen(g.id); }}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.6, ease }}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
            className="night group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[28px] p-6 text-left lg:min-h-[270px] lg:p-7"
            style={{ background: "radial-gradient(90% 80% at 80% 20%, #1d1a33, #0b0b10 70%)" }}>
            <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
              style={{ background: `linear-gradient(140deg, ${g.tone[0]}, ${g.tone[1]})` }} />
            <span className="relative self-end"><Preview id={g.id} tone={g.tone} /></span>
            <span className="relative">
              <span className="block font-display text-[2.2rem] leading-none text-ink">{g.title}</span>
              <span className="mt-2 block max-w-[30ch] text-[14px] text-soft">{g.line}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {game && (
          <Room key={game.id} title={game.title} onClose={() => setOpen(null)}>
            {game.id === "jelly" && <Jelly />}
            {game.id === "bubbles" && <PopSheet />}
            {game.id === "letgo" && <Dissolve />}
            {game.id === "pond" && <Ripples forceNight />}
          </Room>
        )}
      </AnimatePresence>
    </div>
  );
}
