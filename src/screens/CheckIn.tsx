import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button, Card, Slider, Toggle, Screen, spring, ease } from "../components/ui";
import { CheckIcon, MinusIcon, PlusIcon } from "../components/Icons";
import { copy } from "../content/copy";

// Kishore's 5-question check-in, plus the optional note as a last step,
// slide transitions in the direction you move, and a small thank-you at the end.

type CheckInData = {
  mood: number;
  stress: number;
  energy: number;
  sleepHours: number;
  connected: boolean;
  note: string;
};

type CheckInProps = {
  onSave: (data: CheckInData) => void | Promise<void>;
};

const moods = [
  { value: 1, emoji: "😞", label: "Very low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const STRESS_WORDS = ["Calm", "Light", "Some", "A lot", "Too much"];
const ENERGY_WORDS = ["Drained", "Low", "Okay", "Good", "Full"];

function Title({ t, d }: { t: string; d: string }) {
  return (
    <>
      <h2 className="mb-1.5 font-display text-2xl font-semibold">{t}</h2>
      <p className="mb-7 text-soft">{d}</p>
    </>
  );
}

export default function CheckIn({ onSave }: CheckInProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);

  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [connected, setConnected] = useState(true);
  const [note, setNote] = useState("");

  const totalSteps = 6;

  function nextStep() {
    setDir(1);
    setStep((c) => Math.min(c + 1, totalSteps - 1));
  }

  function previousStep() {
    setDir(-1);
    setStep((c) => Math.max(c - 1, 0));
  }

  function handleSave() {
    setDone(true);
    window.setTimeout(() => void onSave({ mood, stress, energy, sleepHours, connected, note }), 1500);
  }

  function renderQuestion() {
    switch (step) {
      // MOOD
      case 0:
        return (
          <>
            <Title t={copy.checkin.mood.title} d={copy.checkin.mood.description} />
            <div className="grid grid-cols-5 gap-2">
              {moods.map((m) => {
                const on = mood === m.value;
                return (
                  <motion.button key={m.value} onClick={() => setMood(m.value)} whileTap={{ scale: 0.88 }}
                    className={`relative rounded-2xl px-1 py-3 transition-colors ${on ? "text-indigo" : "text-soft"}`}>
                    {on && <motion.span layoutId="mood-pick" transition={spring} className="absolute inset-0 rounded-2xl border-2 border-indigo bg-indigo/10" />}
                    <motion.div className="relative text-4xl" animate={{ scale: on ? 1.2 : 1, y: on ? -3 : 0, filter: on ? "grayscale(0)" : "grayscale(0.5)" }} transition={spring}>
                      {m.emoji}
                    </motion.div>
                    <div className="relative mt-2 text-[11px] font-bold">{m.label}</div>
                  </motion.button>
                );
              })}
            </div>
          </>
        );

      // STRESS
      case 1:
        return (
          <>
            <Title t={copy.checkin.stress.title} d={copy.checkin.stress.description} />
            <Slider label="Stress level" value={stress} onChange={setStress} leftEmoji="😌" rightEmoji="😰" words={STRESS_WORDS} />
          </>
        );

      // ENERGY
      case 2:
        return (
          <>
            <Title t={copy.checkin.energy.title} d={copy.checkin.energy.description} />
            <Slider label="Energy level" value={energy} onChange={setEnergy} leftEmoji="🥱" rightEmoji="⚡" words={ENERGY_WORDS} />
          </>
        );

      // SLEEP
      case 3:
        return (
          <>
            <Title t={copy.checkin.sleep.title} d={copy.checkin.sleep.description} />
            <div className="flex items-center justify-center gap-8">
              <motion.button whileTap={{ scale: 0.85 }} aria-label="Less sleep" onClick={() => setSleepHours((v) => Math.max(0, v - 0.5))}
                className="grid h-14 w-14 place-items-center rounded-full bg-indigo/12 text-indigo"><MinusIcon /></motion.button>
              <div className="w-28 text-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div key={sleepHours} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="font-display text-6xl font-semibold text-indigo">
                    {sleepHours}
                  </motion.div>
                </AnimatePresence>
                <div className="text-soft">hours</div>
              </div>
              <motion.button whileTap={{ scale: 0.85 }} aria-label="More sleep" onClick={() => setSleepHours((v) => Math.min(12, v + 0.5))}
                className="grid h-14 w-14 place-items-center rounded-full bg-indigo/12 text-indigo"><PlusIcon /></motion.button>
            </div>
            {/* a little moon that fills with your hours */}
            <div className="mx-auto mt-6 h-2 w-48 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-indigo" animate={{ width: `${(sleepHours / 12) * 100}%` }} transition={spring} />
            </div>
          </>
        );

      // CONNECTION
      case 4:
        return (
          <>
            <Title t={copy.checkin.questions[4].question} d={copy.checkin.connected.description} />
            <Toggle value={connected} onChange={setConnected} yesLabel="Yes 🙂" noLabel="Not yet" />
          </>
        );

      // NOTE
      case 5:
        return (
          <>
            <Title t={copy.checkin.note.title} d={copy.checkin.note.description} />
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 280))} placeholder="Write something here…"
              className="min-h-32 w-full resize-none rounded-2xl border border-line bg-card-2 p-4 outline-none focus:border-indigo" />
          </>
        );

      default:
        return null;
    }
  }

  if (done) {
    return (
      <motion.div className="grid min-h-[60vh] place-items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <div className="relative mx-auto grid h-28 w-28 place-items-center">
            {[0, 1].map((i) => (
              <motion.span key={i} className="absolute inset-0 rounded-full bg-sage/30"
                initial={{ scale: 0.5, opacity: 0.8 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 1.4, delay: i * 0.3, ease: "easeOut" }} />
            ))}
            <motion.div className="relative grid h-24 w-24 place-items-center rounded-full bg-sage text-white"
              initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
              <CheckIcon size={44} strokeWidth={2.6} />
            </motion.div>
          </div>
          <motion.p className="mx-auto mt-8 max-w-xs font-display text-2xl font-semibold" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease }}>
            {copy.checkin.thankYou}
          </motion.p>
          <motion.p className="mt-2 text-sm text-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            Updating your mind weather…
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <Screen title="Daily check-in" subtitle="Five quick questions. No right answers.">
      <div className="mb-5">
        <div className="mb-2 flex justify-between text-sm font-semibold text-soft">
          <span>Daily reflection</span>
          <span>{step + 1} of {totalSteps}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full rounded-full bg-indigo" initial={false} animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease }} />
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={step} custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 40 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -40 * d }),
            }}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease }}>
            <Card className="min-h-[320px]">{renderQuestion()}</Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex gap-3">
        {step > 0 && (
          <div className="w-1/3">
            <Button variant="soft" onClick={previousStep}>Back</Button>
          </div>
        )}
        <div className="flex-1">
          {step < totalSteps - 1 ? (
            <Button onClick={nextStep}>Continue</Button>
          ) : (
            <Button onClick={handleSave}>Complete check-in</Button>
          )}
        </div>
      </div>
      {step === totalSteps - 1 && !note && <p className="mt-3 text-center text-xs text-faint">The note is optional. You can skip it.</p>}
    </Screen>
  );
}
