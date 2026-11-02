import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { SignalGlyph } from "../components/Glyphs";
import { ArrowIcon, CheckIcon, FaceIcon, NecklaceIcon, WaveIcon, WindIcon } from "../components/Icons";
import { Dots } from "../components/LiveToasts";
import Weather from "../components/Weather";
import { item, list, PageHeader, SectionTitle, spring } from "../components/ui";
import { copy } from "../content/copy";
import { db, localDate } from "../lib/db";
import { useThinking } from "../lib/hub";
import type { Go } from "../lib/nav";
import { usePrefs } from "../lib/prefs";
import { loadSample } from "../lib/sample";
import { streak } from "../lib/series";
import { useInsights } from "../lib/useInsights";
import { useFresh } from "../lib/fresh";
import UrgentHelp from "./UrgentHelp";
import { Cloth } from "../components/shisha/Cloth";
import { weave } from "../components/shisha/cloth";

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

export const LEVEL_COLOR = { steady: "var(--sage)", watch: "var(--sun)", "needs care": "var(--coral)", learning: "var(--line)" };

/** A list row: glyph, words, and an arrow that nudges on hover. */
export function Row({ onClick, icon, title, meta, right }: { onClick: () => void; icon: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.99 }} transition={spring}
      className="group flex w-full items-center gap-4 border-b border-line py-4 text-left last:border-b-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-ink">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{title}</span>
        {meta && <span className="mt-0.5 block text-[13px] text-soft">{meta}</span>}
      </span>
      {right ?? <ArrowIcon size={17} className="text-faint transition-transform group-hover:translate-x-1 group-hover:text-ink" />}
    </motion.button>
  );
}

export default function Home({ go }: { go: Go }) {
  const { name } = usePrefs();
  const ins = useInsights();
  const fresh = useFresh();
  const thinking = useThinking();
  const lastTurn = useLiveQuery(() => db.voice.orderBy("at").last(), []);
  const checkins = useLiveQuery(() => db.checkins.toArray(), []);
  const today = localDate();
  const doneToday = checkins?.some((c) => c.date === today);
  const days = checkins ? streak(checkins, today) : 0;
  const w = ins ? copy.weather[ins.weather] : null;

  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        title={<>{greeting()}{name ? <>, <em className="italic">{name}</em></> : ""}.</>}
        lede="How's your mind today?"
      />

      {ins?.crisis && <motion.div variants={item} className="mb-6"><UrgentHelp /></motion.div>}

      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* left: the weather and the one thing to do */}
        <div className="space-y-6">
          {ins && w && (
            <motion.button variants={item} onClick={() => go("insights")} whileTap={{ scale: 0.99 }} transition={spring}
              className="block w-full text-left" aria-label="Open insights">
              <Weather kind={ins.weather} title={ins.weatherTitle} message={w.line} />
            </motion.button>
          )}

          <motion.div variants={item}>
            {doneToday ? (
              <button onClick={() => go("checkin")} className="flex w-full items-center gap-3 text-left text-[15px] text-soft hover:text-ink">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sage text-bg"><CheckIcon size={15} strokeWidth={2.4} /></span>
                Checked in today{days > 1 ? ` · ${days} days in a row` : ""}. <span className="underline decoration-line underline-offset-4">Update</span>
              </button>
            ) : (
              <motion.button onClick={() => go("checkin")} whileTap={{ scale: 0.98 }} transition={spring}
                className="group flex h-14 w-full items-center justify-between rounded-[4px] bg-ink pl-5 pr-2 text-bg transition-colors hover:bg-indigo hover:text-indigo-ink">
                <span className="t-caption">Check in <span className="opacity-60">· 30 seconds</span></span>
                <span className="grid h-10 w-10 place-items-center rounded-[3px] bg-bg/15 transition-transform group-hover:translate-x-0.5"><ArrowIcon size={18} /></span>
              </motion.button>
            )}
          </motion.div>

          {/* this week, one mirror a day */}
          {checkins && checkins.length > 0 && (
            <motion.div variants={item} className="on-neel rounded-[10px] bg-[#171b38] p-4 lg:p-5">
              <div className="t-caption-sm mb-2 flex justify-between text-soft">
                <span>This week · one mirror a day</span>
                <button onClick={() => go("insights")} className="text-faint hover:text-ink">Your cloth →</button>
              </div>
              <Cloth days={weave(checkins, today, 7)} />
            </motion.div>
          )}

          {/* necklace */}
          <motion.div variants={item}>
            <SectionTitle action={lastTurn && !thinking ? <span className="text-[13px] text-faint">{ago(lastTurn.at)}</span> : undefined}>
              <span className="flex items-center gap-2"><NecklaceIcon size={15} /> From your necklace</span>
            </SectionTitle>
            <button onClick={() => go("companion")} className="block w-full py-2 text-left">
              {thinking ? (
                <span className="flex items-center gap-3 text-indigo">Listening to you <Dots /></span>
              ) : lastTurn ? (
                <>
                  <p className="font-display text-[1.6rem] italic leading-snug text-ink">“{lastTurn.heard}”</p>
                  <p className="mt-3 border-l-2 border-indigo pl-4 text-[15px] leading-relaxed text-soft">{lastTurn.reply}</p>
                </>
              ) : (
                <span className="text-[15px] text-soft">Hold the necklace button and just talk. It shows up here.</span>
              )}
            </button>
          </motion.div>
        </div>

        {/* right: the five signals and calm tools */}
        <div>
          {ins && (
            <motion.div variants={item}>
              <SectionTitle action={<button onClick={() => go("insights")} className="text-[13px] font-medium text-indigo">See proof</button>}>
                Five signals, against your own normal
              </SectionTitle>
              <div>
                {ins.signals.map((s, i) => (
                  <motion.button key={s.key} onClick={() => go("insights")}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.4 }}
                    className={`flex w-full items-center gap-4 border-b border-line py-3.5 text-left last:border-b-0 ${fresh.keys.has(s.key) ? "mm-fresh my-1 border-b-0 px-3" : ""}`}>
                    <SignalGlyph k={s.key} size={22} className={fresh.keys.has(s.key) ? "text-indigo" : "text-ink"} />
                    <span className="flex-1 text-[15px] font-medium">
                      {s.name}
                      {fresh.keys.has(s.key) && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo">just heard</span>}
                    </span>
                    <span className="flex items-center gap-2 text-[13px] text-soft">
                      <span className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLOR[s.level] }} />
                      {s.level}
                    </span>
                  </motion.button>
                ))}
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-soft">
                <span className="font-medium text-ink">{ins.rung.title}.</span> {ins.rung.action}
              </p>
            </motion.div>
          )}

          <motion.div variants={item} className="mt-8">
            <SectionTitle>Talk it out</SectionTitle>
            <Row onClick={() => go("face")} icon={<FaceIcon size={19} />} title="Face to face with Reenu or Roman" meta="AI companion and therapist: listens, remembers, knows your signals" />
            <Row onClick={() => go("voice")} icon={<WaveIcon size={19} />} title="Voice mode" meta="Just talk, by phone or necklace" />
            <Row onClick={() => go("breathe")} icon={<WindIcon size={19} />} title="Breathe" meta="One minute, 4 in and 6 out" />
          </motion.div>
        </div>
      </div>

      <motion.div variants={item} className="mt-12 border-t border-line pt-6 text-center lg:text-left">
        <button onClick={() => void loadSample()} className="text-[13px] font-medium text-soft underline decoration-line underline-offset-4 hover:text-ink">
          {checkins?.length ? "Reset to sample data (Asha, 3 weeks)" : "Explore with sample data (Asha, 3 weeks)"}
        </button>
        <p className="mt-2 text-xs text-faint">{copy.disclaimer}</p>
      </motion.div>
    </motion.div>
  );
}
