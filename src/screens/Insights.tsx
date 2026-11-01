import { useLiveQuery } from "dexie-react-hooks";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { db, localDate } from "../lib/db";
import { addDays } from "../lib/signals";
import { useInsights } from "../lib/useInsights";
import UrgentHelp from "./UrgentHelp";
import SignalCard from "../components/SignalCard";

export default function Insights() {
  const ins = useInsights();
  const sleep = useLiveQuery(async () => {
    const today = localDate();
    const from = addDays(today, -20);
    const rows = await db.checkins.where("date").between(from, today, true, true).sortBy("date");
    return rows.map((r) => ({ day: r.date.slice(5), hours: r.sleepHours }));
  }, []);

  if (!ins) return null;
  const sleepSignal = ins.signals.find((s) => s.key === "sleep");

  return (
    <div className="space-y-4">
      {ins.crisis && <UrgentHelp />}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm opacity-60">Your mind weather</p>
        <p className="text-2xl font-bold">{ins.weatherTitle}</p>
        <p className="text-sm">{ins.rung.title}: {ins.rung.action}</p>
      </div>

      {ins.signals.map((s) => (
        <SignalCard key={s.key} name={s.name} icon={s.icon} level={s.level} proof={s.text} />
      ))}

      {sleep && sleep.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-2 font-semibold">Sleep, last 3 weeks</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={sleep} margin={{ left: -20, right: 8 }}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[3, 10]} tick={{ fontSize: 10 }} />
              <Tooltip />
              {sleepSignal?.baseline != null && (
                <ReferenceLine y={sleepSignal.baseline} stroke="#8FB9A8" strokeDasharray="6 4"
                  label={{ value: "your usual", fontSize: 10, position: "insideTopRight" }} />
              )}
              <Line type="monotone" dataKey="hours" stroke="#4F5BD5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs opacity-60">
        MindMirror shows changes against your own normal. It is not a medical device and does not diagnose.
      </p>
    </div>
  );
}
