import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { copy } from "../content/copy";
import BubbleWrap from "../games/BubbleWrap";
import WorryShredder from "../games/WorryShredder";
import Ripples from "../games/Ripples";
import { BackIcon } from "../components/Icons";
import { PageHeader } from "../components/ui";
import { ease } from "../components/ui";

// Merel's Play room: no scores, no timers, no way to lose.

type GameName = "bubbleWrap" | "worryShredder" | "ripples";

const TINT: Record<GameName, string> = {
  bubbleWrap: "bg-sage/35",
  worryShredder: "bg-sun/30",
  ripples: "bg-sky/40",
};


/** Small looping preview on each game card. */
function Preview({ id }: { id: GameName }) {
  if (id === "bubbleWrap")
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <motion.span key={i} className="h-4 w-4 rounded-full bg-white/80 shadow-sm"
            animate={{ scale: [1, 1, 0.7, 1] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.35, times: [0, 0.6, 0.7, 1] }} />
        ))}
      </div>
    );
  if (id === "worryShredder")
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <motion.span key={i} className="h-10 w-2 rounded-sm bg-white/85"
            animate={{ y: [0, 0, 14], opacity: [1, 1, 0], rotate: [0, 0, i % 2 ? 10 : -10] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.06, times: [0, 0.5, 1] }} />
        ))}
      </div>
    );
  return (
    <div className="relative grid h-12 w-12 place-items-center">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute h-12 w-12 rounded-full border-2 border-white/80"
          animate={{ scale: [0.2, 1.3], opacity: [0.9, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }} />
      ))}
    </div>
  );
}

export default function Play() {
  const [activeGame, setActiveGame] = useState<GameName | null>(null);

  const games = [
    { id: "bubbleWrap" as const, component: <BubbleWrap /> },
    { id: "worryShredder" as const, component: <WorryShredder /> },
    { id: "ripples" as const, component: <Ripples /> },
  ];

  const selected = games.find((game) => game.id === activeGame);

  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div key={selected.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease }}>
          <button onClick={() => setActiveGame(null)}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink">
            <BackIcon size={16} /> Play room
          </button>
          {selected.component}
        </motion.div>
      ) : (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PageHeader eyebrow="Play room" title={<>Do something <em className="italic">small</em>.</>} lede="No scores. No timers. No way to lose." />

          <div className="grid gap-3 lg:grid-cols-3">
            {games.map((game, i) => {
              const details = copy.games[game.id];
              return (
                <motion.button key={game.id} onClick={() => setActiveGame(game.id)}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                  className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl border border-line p-5 text-left transition-colors hover:border-ink/25 lg:min-h-[260px] lg:flex-col lg:items-start lg:justify-between lg:p-6`}>
                  <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${TINT[game.id]} text-ink lg:h-24 lg:w-24`}>
                    <Preview id={game.id} />
                  </span>
                  <span className="flex-1 lg:flex-none">
                    <span className="flex items-center gap-2 font-display text-[1.7rem] leading-tight">{details.title}</span>
                    <span className="mt-1 block text-[15px] text-soft">{details.description}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-faint">
            Doing beats reading when you're stressed. Try one for a minute.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
