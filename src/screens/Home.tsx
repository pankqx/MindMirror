import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { ArrowIcon, CalendarIcon, ChatIcon, CheckIcon, NecklaceIcon, PlayIcon, WindIcon } from "../components/Icons";
import { Dots } from "../components/LiveToasts";
import Weather from "../components/Weather";
import { item, list, Pill, SectionTitle, spring, TapCard } from "../components/ui";
import { copy } from "../content/copy";
import { db, localDate } from "../lib/db";
import { useThinking } from "../lib/hub";
import type { Go } from "../lib/nav";
import { usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";
import { streak } from "../lib/series";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

const LEVEL_COLOR = { steady: "var(--sage)", watch: "var(--sun)", "needs care": "var(--coral)", learning: "var(--line)" };

export default function Home({ go }: { go: Go }) {
  const { name } = usePrefs();
  const ins = useInsights();
  const thinking = useThinking();
  const lastTurn = useLiveQuery(() => db.voice.orderBy("at").last(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const today = localDate();
  const doneToday = checkins?.some((c) => c.date === today);
  const days = checkins ? streak(checkins, today) : 0;
  const w = ins ? copy.weather[ins.weather] : null;

  return (
    <motion.div className="space-y-5" variants={list} initial="hidden" animate="show">
      <motion.header variants={item}>
        <p className="text-sm font-semibold text-faint">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-display text-[2rem] font-semibold leading-tight">
          {greeting()}{name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-1 text-soft">How's your mind today?</p>
      </motion.header>

      {ins?.crisis && <motion.div variants={item}><UrgentHelp /></motion.div>}

      {ins && w && (
        <motion.button variants={item} onClick={() => go("insights")} whileTap={{ scale: 0.985 }} transition={spring}
          className="block w-full text-left" aria-label="Open insights">
          <Weather kind={ins.weather} title={ins.weatherTitle} message={w.line} />
        </motion.button>
      )}

      {/* signals at a glance */}
      {ins && (
        <motion.div variants={item}>
          <TapCard onClick={() => go("insights")} className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ins.signals.map((s, i) => (
                  <motion.div key={s.key} className="grid h-10 w-10 place-items-center rounded-2xl text-lg"
                    style={{ background: `color-mix(in oklab, ${LEVEL_COLOR[s.level]} 30%, transparent)` }}
                    initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.3 + i * 0.06 }}
                    title={`${s.name}: ${s.level}`}>
                    {s.icon}
                  </motion.div>
                ))}
              </div>
              <ArrowIcon size={18} className="text-faint" />
            </div>
            <p className="mt-3 text-sm text-soft">
              <span className="font-bold text-ink">{ins.rung.title}.</span> {ins.rung.action}
            </p>
          </TapCard>
        </motion.div>
      )}

      {/* check-in */}
      <motion.div variants={item}>
        {doneToday ? (
          <TapCard onClick={() => go("checkin")} className="flex items-center gap-4 !p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-sage/30 text-sage-ink"><CheckIcon /></span>
            <span className="flex-1">
              <span className="block font-bold">Checked in today</span>
              <span className="block text-sm text-soft">{days > 1 ? `${days} days in a row. ` : ""}Tap to update.</span>
            </span>
          </TapCard>
        ) : (
          <motion.button onClick={() => go("checkin")} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} transition={spring}
            className="group relative w-full overflow-hidden rounded-3xl bg-indigo p-5 text-left text-indigo-ink shadow-soft">
            <motion.span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10"
              animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 4, repeat: Infinity }} />
            <span className="relative block text-xs font-extrabold uppercase tracking-[0.14em] opacity-80">30 seconds</span>
            <span className="relative mt-1 flex items-center justify-between font-display text-2xl font-semibold">
              Check in now <ArrowIcon className="transition-transform group-hover:translate-x-1" />
            </span>
            {days > 0 && <span className="relative mt-1 block text-sm opacity-80">{days} day streak. Keep it gentle.</span>}
          </motion.button>
        )}
      </motion.div>

      {/* necklace */}
      <motion.div variants={item}>
        <SectionTitle>From your necklace</SectionTitle>
        <TapCard onClick={() => go("companion")} className="!p-4">
          {thinking ? (
            <div className="flex items-center gap-3 text-indigo">
              <NecklaceIcon /> <span className="font-bold">Listening to you</span> <Dots />
            </div>
          ) : lastTurn ? (
            <>
              <div className="flex items-center justify-between">
                <Pill tone="indigo"><NecklaceIcon size={13} /> {lastTurn.source === "necklace" ? "Necklace" : "Voice"}</Pill>
                <span className="text-xs text-faint">{ago(lastTurn.at)}</span>
              </div>
              <p className="mt-3 text-sm text-soft">“{lastTurn.heard}”</p>
              <p className="mt-1.5 font-semibold text-ink">{lastTurn.reply}</p>
            </>
          ) : (
            <div className="flex items-center gap-3 text-soft">
              <NecklaceIcon /> Hold the necklace button and just talk. It shows up here.
            </div>
          )}
        </TapCard>
      </motion.div>

      {/* quick calm */}
      <motion.div variants={item}>
        <SectionTitle>Feel lighter</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["breathe", WindIcon, "Breathe", "One minute, 4 in, 6 out", "bg-sky/30 text-indigo"],
            ["play", PlayIcon, "Play room", "Pop, shred, ripple", "bg-sage/30 text-sage-ink"],
            ["companion", ChatIcon, "Talk it out", "Type or hold to talk", "bg-indigo/15 text-indigo"],
            ["planner", CalendarIcon, "Planner", "Deadlines vs hours", "bg-sun/30 text-sun-ink"],
          ] as const).map(([to, Icon, title, line, tint]) => (
            <TapCard key={to} onClick={() => go(to)} className="!p-4">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tint}`}><Icon /></span>
              <span className="mt-3 block font-bold">{title}</span>
              <span className="block text-xs text-soft">{line}</span>
            </TapCard>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="pt-2 text-center">
        <button onClick={() => void loadSample()} className="text-sm font-semibold text-faint underline-offset-4 hover:underline">
          {checkins?.length ? "Reset to sample data (Asha, 3 weeks)" : "Explore with sample data (Asha, 3 weeks)"}
        </button>
        <p className="mt-2 text-xs text-faint">{copy.disclaimer}</p>
      </motion.div>
    </motion.div>
  );
}
