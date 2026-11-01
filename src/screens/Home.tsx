import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { loadSample } from "../lib/sample";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";
import type { Go } from "../App";

const WEATHER_ICON = { clear: "☀️", clouds: "⛅", rain: "\u{1F327}️", storm: "⛈️" };

export default function Home({ go }: { go: Go }) {
  const ins = useInsights();
  const lastTurn = useLiveQuery(() => db.voice.orderBy("at").last(), []);
  const count = useLiveQuery(() => db.checkins.count(), []);

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm opacity-70">Hi there</p>
        <h1 className="text-2xl font-bold">How's your mind today?</h1>
      </header>

      {ins?.crisis && <UrgentHelp />}

      {ins && (
        <button onClick={() => go("insights")}
          className="w-full rounded-2xl bg-white p-6 text-left shadow-sm">
          <div className="text-6xl">{WEATHER_ICON[ins.weather]}</div>
          <p className="mt-2 text-xl font-bold">{ins.weatherTitle}</p>
          <p className="text-sm opacity-80">{ins.rung.title}: {ins.rung.action}</p>
        </button>
      )}

      <button onClick={() => go("checkin")}
        className="w-full rounded-2xl bg-[#4F5BD5] py-4 text-lg font-semibold text-white">
        Check in (30 seconds)
      </button>

      {lastTurn && (
        <div className="rounded-2xl bg-white p-4 shadow-sm text-sm">
          <p className="opacity-60">{lastTurn.source === "necklace" ? "\u{1F399} From your necklace" : "Last talk"}</p>
          <p className="mt-1">"{lastTurn.heard}"</p>
          <p className="mt-1 text-[#4F5BD5]">{lastTurn.reply}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        {([
          ["insights", "\u{1F4CA}", "Insights"],
          ["companion", "\u{1F33F}", "Companion"],
          ["breathe", "\u{1F32C}️", "Breathe"],
          ["play", "\u{1FAE7}", "Play"],
          ["support", "\u{1F91D}", "Support"],
          ["planner", "\u{1F4C5}", "Planner"],
        ] as const).map(([to, icon, label]) => (
          <button key={to} onClick={() => go(to)} className="rounded-2xl bg-white p-4 shadow-sm min-h-11">
            <div className="text-2xl">{icon}</div>
            {label}
          </button>
        ))}
      </div>

      <button onClick={() => void loadSample()} className="w-full text-sm underline opacity-70">
        {count ? "Reset to sample data (Asha, 3 weeks)" : "Explore with sample data (Asha, 3 weeks)"}
      </button>
    </div>
  );
}
