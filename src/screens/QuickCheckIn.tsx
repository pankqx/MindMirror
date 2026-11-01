import { useState } from "react";
import { saveCheckIn } from "../lib/db";

// Temporary check-in so saving works today. Replaced by Kishore's CheckIn.tsx when his PR lands.
export default function QuickCheckIn({ onDone }: { onDone: () => void }) {
  const [v, setV] = useState({ mood: 3, stress: 3, energy: 3, sleepHours: 7, connected: true, note: "" });
  const num = (k: "mood" | "stress" | "energy", label: string) => (
    <label className="block">
      {label}: <b>{v[k]}</b>
      <input type="range" min={1} max={5} value={v[k]} className="w-full"
        onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
    </label>
  );
  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
      {num("mood", "Mood")}
      {num("stress", "Stress")}
      {num("energy", "Energy")}
      <label className="block">
        Sleep last night: <b>{v.sleepHours} h</b>
        <input type="range" min={0} max={12} step={0.5} value={v.sleepHours} className="w-full"
          onChange={(e) => setV({ ...v, sleepHours: Number(e.target.value) })} />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={v.connected} onChange={(e) => setV({ ...v, connected: e.target.checked })} />
        Talked to someone you like today
      </label>
      <textarea value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })}
        placeholder="Anything on your mind? (optional)" className="w-full rounded-xl border p-2" />
      <button onClick={async () => { await saveCheckIn({ ...v, note: v.note || undefined }); onDone(); }}
        className="w-full rounded-2xl bg-[#4F5BD5] py-3 font-semibold text-white">Save</button>
    </div>
  );
}
