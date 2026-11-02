// Three weeks of "Asha" drifting, so the demo doesn't need two weeks of real data.
// Her usual: about 7 h sleep, mood 4, stress 2, energy 4, connected most days.
// The last 3 days: short nights (5.4 h), a bit more stress, a bit less energy.
// The engine should show Sleep "needs care", Pressure, Energy and Drive "watch": Soft rain.
// (Drive watches because she told the necklace she does not feel like going to class.)

import { addDays } from "./signals";
import { db, localDate, type CheckIn, type Task, type VoiceTurn } from "./db";

const USUAL_SLEEP = [7, 7.5, 6.5, 7, 7.5, 7, 6.5, 7, 7, 7.5, 6.5, 7, 7, 7.5, 7, 6.5, 7, 7];
const USUAL_MOOD = [4, 4, 5, 4, 3, 4, 4, 5, 4, 4, 3, 4, 4, 5, 4, 4, 4, 4];
const USUAL_STRESS = [2, 2, 3, 2, 2, 1, 2, 2, 3, 2, 2, 2, 1, 2, 2, 3, 2, 2];
const USUAL_ENERGY = [4, 4, 3, 4, 5, 4, 4, 4, 3, 4, 4, 5, 4, 4, 4, 3, 4, 4];
const USUAL_CONNECTED = [true, true, false, true, true, true, true, false, true, true, true, true, true, false, true, true, true, true];

export function sampleData(today = localDate()) {
  const checkins: CheckIn[] = [];
  const at = (date: string, hh: string) => `${date}T${hh}:00:00.000Z`;

  // days 20..3 ago: her usual
  for (let i = 0; i < 18; i++) {
    const date = addDays(today, -(20 - i));
    checkins.push({
      date, at: at(date, "15"), source: "tap",
      sleepHours: USUAL_SLEEP[i], mood: USUAL_MOOD[i], stress: USUAL_STRESS[i],
      energy: USUAL_ENERGY[i], connected: USUAL_CONNECTED[i],
    });
  }
  // the last 3 days: the drift
  const drift = [
    { sleepHours: 5.6, mood: 3, stress: 3, energy: 3, connected: true, note: "Lab record due, stayed up late." },
    { sleepHours: 5.2, mood: 4, stress: 3, energy: 3, connected: false },
    { sleepHours: 5.4, mood: 3, stress: 3, energy: 3, connected: true, note: "Tired but okay." },
  ];
  drift.forEach((d, i) => {
    const date = addDays(today, -(2 - i));
    checkins.push({ ...d, date, at: at(date, "15"), source: "tap" });
  });

  const voice: VoiceTurn[] = [
    {
      at: at(addDays(today, -1), "08"), source: "necklace", mood: "tired", signals: ["sleep", "pressure"],
      heard: "I only slept five hours, I have a lab record and an assignment due.",
      reply: "That sounds like a heavy week. Could you pick just the record for tonight and sleep a little earlier?",
    },
    {
      at: at(today, "07"), source: "necklace", mood: "low", signals: ["motivation"],
      heard: "I don't really feel like going to class today.",
      reply: "That's okay to feel. What's one small thing that would make today a bit easier?",
    },
  ];

  const tasks: Task[] = [
    { title: "DBMS lab record", due: addDays(today, 1), hoursNeeded: 3, hoursPlanned: 3, done: false },
    { title: "Maths assignment 4", due: addDays(today, 4), hoursNeeded: 4, hoursPlanned: 2, done: false },
  ];

  return { checkins, voice, tasks };
}

/** Replace everything in the browser with Asha's three weeks. */
export async function loadSample() {
  const { checkins, voice, tasks } = sampleData();
  await db.transaction("rw", db.checkins, db.voice, db.tasks, async () => {
    await Promise.all([db.checkins.clear(), db.voice.clear(), db.tasks.clear()]);
    await db.checkins.bulkAdd(checkins);
    await db.voice.bulkAdd(voice);
    await db.tasks.bulkAdd(tasks);
  });
}
