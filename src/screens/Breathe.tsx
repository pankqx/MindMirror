import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button, Screen, Card } from "../components/ui";

// Kishore's one-minute breathing room: 4 seconds in, 6 seconds out.
// The orb, its ripples and a ring that fills with the minute.

const SESSION = 60;

export default function Breathe() {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SESSION);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [breaths, setBreaths] = useState(0);

  const reducedMotion = useReducedMotion();

  // SESSION TIMER
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          setRunning(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  // BREATHING PHASE (4 s in, 6 s out)
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => {
      setPhase((p) => (p === "in" ? "out" : "in"));
      if (phase === "out") setBreaths((b) => b + 1);
    }, phase === "in" ? 4000 : 6000);
    return () => window.clearTimeout(t);
  }, [running, phase]);

  function startSession() {
    setSecondsLeft(SESSION);
    setPhase("in");
    setBreaths(0);
    setRunning(true);
  }

  function stopSession() {
    setRunning(false);
    setSecondsLeft(SESSION);
    setPhase("in");
  }

  const completed = secondsLeft === 0;
  const scale = running ? (phase === "in" ? 1.25 : 0.8) : 1;
  const dur = phase === "in" ? 4 : 6;
  const R = 130;
  const C = 2 * Math.PI * R;
  const progress = 1 - secondsLeft / SESSION;

  return (
    <Screen title="Breathe" subtitle="Take a moment for yourself.">
      <Card className="overflow-hidden text-center">
        {/* BREATHING ORB */}
        <div className="relative mx-auto grid h-[300px] w-[300px] place-items-center">
          <svg viewBox="0 0 300 300" className="absolute inset-0 -rotate-90">
            <circle cx="150" cy="150" r={R} fill="none" stroke="var(--line)" strokeWidth="4" />
            <motion.circle cx="150" cy="150" r={R} fill="none" stroke="var(--indigo)" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={C} animate={{ strokeDashoffset: C * (1 - progress) }} transition={{ duration: 1, ease: "linear" }} />
          </svg>

          {[0.9, 0.7].map((o, i) => (
            <motion.div key={i} className="absolute h-44 w-44 rounded-full bg-sage/25"
              animate={reducedMotion ? {} : { scale: running ? (phase === "in" ? 1.25 + (i + 1) * 0.12 : 0.85) : 1 + i * 0.06, opacity: running ? o * 0.6 : 0.3 }}
              transition={{ duration: dur, ease: "easeInOut", delay: i * 0.15 }} />
          ))}

          <motion.div
            className="relative grid h-44 w-44 place-items-center rounded-full bg-indigo"
            animate={reducedMotion ? {} : { scale }}
            transition={{ duration: dur, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              <motion.span key={running ? phase : "idle"} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.5 }} className="font-display text-3xl text-indigo-ink">
                {running ? (phase === "in" ? "Breathe in" : "Breathe out") : completed ? "Done" : "Breathe"}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* TIMER */}
        <div className="mt-2 font-display text-5xl tabular-nums text-ink">
          {Math.floor(secondsLeft / 60).toString().padStart(2, "0")}:{(secondsLeft % 60).toString().padStart(2, "0")}
        </div>
        <p className="mt-1 text-sm text-soft">
          {running ? `${breaths} slow breath${breaths === 1 ? "" : "s"} so far` : "One minute for yourself. 4 seconds in, 6 out."}
        </p>

        {/* CONTROLS */}
        <div className="mx-auto mt-6 max-w-[240px]">
          {!running && !completed && <Button onClick={startSession}>Start</Button>}
          {running && <Button variant="soft" onClick={stopSession}>Stop</Button>}
          {completed && <Button onClick={startSession}>Start again</Button>}
        </div>

        {/* COMPLETION MESSAGE */}
        <AnimatePresence>
          {completed && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-6 border-t border-line pt-5">
              <h3 className="font-display text-3xl text-ink">Well done.</h3>
              <p className="mt-2 text-sm text-soft">You took a moment to slow down. Carry that calm with you.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </Screen>
  );
}
