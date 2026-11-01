
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Button,
  Card,
  Slider,
  Toggle,
  Screen,
} from "../components/ui";

import { copy } from "../content/copy";

type CheckInData = {
  mood: number;
  stress: number;
  energy: number;
  sleepHours: number;
  connected: boolean;
  note: string;
};

type CheckInProps = {
  onSave: (data: CheckInData) => void;
};

const moods = [
  { value: 1, emoji: "😞", label: "Very low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

export default function CheckIn({
  onSave,
}: CheckInProps) {

  const [step, setStep] = useState(0);

  const [mood, setMood] = useState(3);
  const [stress, setStress] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [sleepHours, setSleepHours] = useState(7);
  const [connected, setConnected] = useState(true);
  const [note, setNote] = useState("");

  const totalSteps = 5;

  function nextStep() {
    setStep((current) =>
      Math.min(current + 1, totalSteps - 1)
    );
  }

  function previousStep() {
    setStep((current) =>
      Math.max(current - 1, 0)
    );
  }

  function handleSave() {
    const data: CheckInData = {
      mood,
      stress,
      energy,
      sleepHours,
      connected,
      note,
    };

    onSave(data);
  }

  function renderQuestion() {

    switch (step) {

      // MOOD
      case 0:
        return (
          <>
            <h2 className="text-xl font-bold mb-2">
              {copy.checkin.mood.title}
            </h2>

            <p className="text-gray-500 mb-6">
              {copy.checkin.mood.description}
            </p>

            <div className="grid grid-cols-5 gap-2">

              {moods.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setMood(item.value)}
                  className={`rounded-2xl p-2 border ${
                    mood === item.value
                      ? "border-indigo bg-indigo/10"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-3xl">
                    {item.emoji}
                  </div>

                  <div className="text-xs mt-2">
                    {item.label}
                  </div>
                </button>
              ))}

            </div>
          </>
        );

      // STRESS
      case 1:
        return (
          <>
            <h2 className="text-xl font-bold mb-2">
              {copy.checkin.stress.title}
            </h2>

            <p className="text-gray-500 mb-6">
              {copy.checkin.stress.description}
            </p>

            <Slider
              label="Stress level"
              value={stress}
              onChange={setStress}
              leftEmoji="😌"
              rightEmoji="😰"
            />
          </>
        );

      // ENERGY
      case 2:
        return (
          <>
            <h2 className="text-xl font-bold mb-2">
              {copy.checkin.energy.title}
            </h2>

            <p className="text-gray-500 mb-6">
              {copy.checkin.energy.description}
            </p>

            <Slider
              label="Energy level"
              value={energy}
              onChange={setEnergy}
              leftEmoji="🥱"
              rightEmoji="⚡"
            />
          </>
        );

      // SLEEP
      case 3:
        return (
          <>
            <h2 className="text-xl font-bold mb-2">
              {copy.checkin.sleep.title}
            </h2>

            <p className="text-gray-500 mb-6">
              {copy.checkin.sleep.description}
            </p>

            <div className="flex items-center justify-center gap-8">

              <button
                onClick={() =>
                  setSleepHours((v) =>
                    Math.max(0, v - 0.5)
                  )
                }
                className="w-12 h-12 rounded-full bg-indigo/10 text-indigo text-2xl"
              >
                −
              </button>

              <div className="text-center">
                <div className="text-5xl font-extrabold text-indigo">
                  {sleepHours}
                </div>

                <div className="text-gray-500">
                  hours
                </div>
              </div>

              <button
                onClick={() =>
                  setSleepHours((v) =>
                    Math.min(12, v + 0.5)
                  )
                }
                className="w-12 h-12 rounded-full bg-indigo/10 text-indigo text-2xl"
              >
                +
              </button>

            </div>
          </>
        );

      // CONNECTION
      case 4:
        return (
          <>
            <h2 className="text-xl font-bold mb-2">
              {copy.checkin.connected.title}
            </h2>

            <p className="text-gray-500 mb-6">
              {copy.checkin.connected.description}
            </p>

            <Toggle
              value={connected}
              onChange={setConnected}
              yesLabel="Yes"
              noLabel="No"
            />
          </>
        );

      default:
        return null;
    }
  }

  return (
    <Screen title="Daily Check-in">

      <div className="mb-5">

        <div className="flex justify-between text-sm mb-2">
          <span>Daily reflection</span>
          <span>{step + 1} of 5</span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

          <div
            className="h-full bg-indigo rounded-full transition-all"
            style={{
              width: `${((step + 1) / totalSteps) * 100}%`,
            }}
          />

        </div>

      </div>

      <AnimatePresence mode="wait">

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >

          <Card className="min-h-[300px]">

            {renderQuestion()}

          </Card>

        </motion.div>

      </AnimatePresence>

      <div className="flex gap-3 mt-5">

        {step > 0 && (
          <Button
            variant="soft"
            onClick={previousStep}
          >
            Back
          </Button>
        )}

        {step < 4 ? (

          <div className="flex-1">
            <Button onClick={nextStep}>
              Continue
            </Button>
          </div>

        ) : (

          <div className="flex-1">
            <Button
              onClick={() => {
                handleSave();
              }}
            >
              Complete check-in
            </Button>
          </div>

        )}

      </div>

      <Card className="mt-5">

        <h3 className="font-bold mb-3">
          {copy.checkin.note.title}
        </h3>

        <p className="text-sm text-gray-500 mb-3">
          {copy.checkin.note.description}
        </p>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something here..."
          className="w-full min-h-24 p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo resize-none"
        />

      </Card>

    </Screen>
  );
}
