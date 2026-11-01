import { useLiveQuery } from "dexie-react-hooks";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { CheckIcon, PlusIcon, TrashIcon } from "../components/Icons";
import { Button, Card, item, list, SectionTitle, spring } from "../components/ui";
import { db, localDate } from "../lib/db";
import { addDays } from "../lib/signals";

// Planner: work due vs hours planned. The Pressure signal reads the next 3 days from here.

function dueLabel(due: string, today: string) {
  if (due === today) return "Today";
  if (due === addDays(today, 1)) return "Tomorrow";
  if (due < today) return "Overdue";
  return new Date(due + "T00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function Num({ v, set, label }: { v: number; set: (n: number) => void; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-card-2 p-3">
      <p className="text-xs font-bold text-faint">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <button onClick={() => set(Math.max(0, v - 0.5))} className="h-8 w-8 rounded-full bg-card font-bold text-indigo" aria-label={`Less ${label}`}>−</button>
        <span className="font-display text-xl font-semibold">{v} h</span>
        <button onClick={() => set(Math.min(40, v + 0.5))} className="h-8 w-8 rounded-full bg-card font-bold text-indigo" aria-label={`More ${label}`}>+</button>
      </div>
    </div>
  );
}

export default function Planner() {
  const today = localDate();
  const tasks = useLiveQuery(() => db.tasks.orderBy("due").toArray(), []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(addDays(today, 2));
  const [needed, setNeeded] = useState(2);
  const [planned, setPlanned] = useState(1);

  const soon = new Set([today, addDays(today, 1), addDays(today, 2)]);
  const dueSoon = (tasks ?? []).filter((t) => !t.done && soon.has(t.due));
  const need = dueSoon.reduce((a, t) => a + t.hoursNeeded, 0);
  const plan = dueSoon.reduce((a, t) => a + t.hoursPlanned, 0);
  const max = Math.max(need, plan, 1);
  const short = need > plan;

  async function add() {
    if (!title.trim()) return;
    await db.tasks.add({ title: title.trim(), due, hoursNeeded: needed, hoursPlanned: planned, done: false });
    setTitle("");
    setAdding(false);
  }

  return (
    <motion.div className="space-y-4" variants={list} initial="hidden" animate="show">
      <motion.div variants={item}>
        <Card>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-faint">Next 3 days</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            {need === 0 ? "Nothing due soon" : short ? `${need - plan} h short` : "You've planned enough"}
          </h2>
          <div className="mt-4 space-y-3">
            {[["Work needs", need, "var(--coral)"], ["You've planned", plan, "var(--sage)"]].map(([label, v, c]) => (
              <div key={label as string}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-soft">{label}</span><span className="font-bold">{v} h</span></div>
                <div className="h-3 overflow-hidden rounded-full bg-line">
                  <motion.div className="h-full rounded-full" style={{ background: c as string }} initial={{ width: 0 }}
                    animate={{ width: `${((v as number) / max) * 100}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-soft">
            {short ? "This gap feeds your Pressure signal. Moving one task or planning one more hour helps." : "Planned hours cover what's due. That keeps pressure steady."}
          </p>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <SectionTitle action={
          <button onClick={() => setAdding((a) => !a)} className="flex items-center gap-1 text-sm font-bold text-indigo"><PlusIcon size={16} /> Add</button>
        }>Deadlines</SectionTitle>
      </motion.div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Card className="space-y-3">
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} placeholder="e.g. DBMS lab record"
                className="min-h-12 w-full rounded-2xl border border-line bg-card-2 px-4 outline-none focus:border-indigo" />
              <input type="date" value={due} min={today} onChange={(e) => setDue(e.target.value)}
                className="min-h-12 w-full rounded-2xl border border-line bg-card-2 px-4 outline-none focus:border-indigo" />
              <div className="flex gap-2">
                <Num v={needed} set={setNeeded} label="Needs" />
                <Num v={planned} set={setPlanned} label="Planned" />
              </div>
              <Button onClick={() => void add()} disabled={!title.trim()}>Add deadline</Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks?.length === 0 && !adding && (
        <motion.p variants={item} className="py-6 text-center text-sm text-soft">No deadlines yet. Add one to see your pressure.</motion.p>
      )}

      <AnimatePresence initial={false}>
        {tasks?.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }} transition={spring}
            className={`flex items-center gap-3 rounded-3xl border border-line/70 bg-card p-4 shadow-soft ${t.done ? "opacity-60" : ""}`}>
            <motion.button whileTap={{ scale: 0.8 }} onClick={() => void db.tasks.update(t.id!, { done: !t.done })} aria-label={t.done ? "Mark not done" : "Mark done"}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 ${t.done ? "border-sage bg-sage text-white" : "border-line text-transparent"}`}>
              <CheckIcon size={18} />
            </motion.button>
            <div className="min-w-0 flex-1">
              <p className={`truncate font-bold ${t.done ? "line-through" : ""}`}>{t.title}</p>
              <p className="text-xs text-soft">
                <span className={!t.done && soon.has(t.due) ? "font-bold text-coral-ink" : ""}>{dueLabel(t.due, today)}</span>
                {" · "}needs {t.hoursNeeded} h, planned {t.hoursPlanned} h
              </p>
            </div>
            <button onClick={() => void db.tasks.delete(t.id!)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-full text-faint hover:text-coral-ink">
              <TrashIcon size={17} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
