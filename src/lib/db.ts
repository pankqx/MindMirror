
import Dexie, { type Table } from "dexie";

export interface CheckIn {
  id?: number;
  date: string; // "2026-11-01" (one per day)
  at: string; // ISO time
  mood: number; // 1..5
  stress: number; // 1..5
  energy: number; // 1..5
  sleepHours: number; // 0..12
  connected: boolean;
  note?: string;
  source: "tap" | "voice";
}

export type Mood = "good" | "okay" | "low" | "stressed" | "tired";

export interface VoiceTurn {
  id?: number;
  at: string;
  heard: string;
  reply: string;
  mood: Mood;
  signals: string[];
  source: "necklace" | "web";
}

export interface Task {
  id?: number;
  title: string;
  due: string;
  hoursNeeded: number;
  hoursPlanned: number;
  done: boolean;
}

class DB extends Dexie {
  checkins!: Table<CheckIn, number>;
  voice!: Table<VoiceTurn, number>;
  tasks!: Table<Task, number>;

  constructor() {
    super("mindmirror");

    this.version(1).stores({
      checkins: "++id, date",
      voice: "++id, at",
      tasks: "++id, due, done",
    });
  }
}

export const db = new DB();

/** Today's date in the student's own time zone, as YYYY-MM-DD. */
export function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

/** Save today's check-in. A second check-in on the same day replaces the first. */
export async function saveCheckIn(
  data: Omit<CheckIn, "id" | "date" | "at" | "source"> & {
    source?: CheckIn["source"];
  },
) {
  const date = localDate();

  const entry: CheckIn = {
    ...data,
    source: data.source ?? "tap",
    date,
    at: new Date().toISOString(),
  };

  await db.transaction("rw", db.checkins, async () => {
    await db.checkins.where("date").equals(date).delete();
    await db.checkins.add(entry);
  });

  return entry;
}

/** Wipe everything stored in this browser. */
export async function deleteAllData() {
  await db.transaction(
    "rw",
    db.checkins,
    db.voice,
    db.tasks,
    async () => {
      await Promise.all([
        db.checkins.clear(),
        db.voice.clear(),
        db.tasks.clear(),
      ]);
    },
  );
}
