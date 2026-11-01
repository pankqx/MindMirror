
import {
  useEffect,
  useState,
} from "react";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  Button,
  Screen,
  Card,
} from "../components/ui";

export default function Breathe() {

  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [phase, setPhase] = useState<"in" | "out">("in");

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

  // BREATHING PHASE

  useEffect(() => {

    if (!running) return;

    const interval = window.setInterval(() => {

      setPhase((previous) =>
        previous === "in" ? "out" : "in"
      );

    }, phase === "in" ? 4000 : 6000);

    return () => window.clearInterval(interval);

  }, [running, phase]);

  // START SESSION

  function startSession() {
    setSecondsLeft(60);
    setPhase("in");
    setRunning(true);
  }

  // STOP SESSION

  function stopSession() {
    setRunning(false);
    setSecondsLeft(60);
    setPhase("in");
  }

  const completed = secondsLeft === 0;

  return (
    <Screen title="Breathe">

      <Card className="text-center">

        <p className="text-gray-500 mb-6">
          Take a moment for yourself.
        </p>

        {/* BREATHING CIRCLE */}

        <div className="h-[280px] flex items-center justify-center">

          <motion.div
            className="w-44 h-44 rounded-full bg-gradient-to-br from-sage to-indigo shadow-lg flex items-center justify-center"
            animate={
              reducedMotion
                ? {}
                : {
                    scale:
                      running
                        ? phase === "in"
                          ? 1.2
                          : 0.75
                        : 1,
                  }
            }
            transition={{
              duration: phase === "in" ? 4 : 6,
              ease: "easeInOut",
            }}
          >

            <span className="text-white text-xl font-bold">
              {running
                ? phase === "in"
                  ? "Breathe in"
                  : "Breathe out"
                : "Breathe"}
            </span>

          </motion.div>

        </div>

        {/* TIMER */}

        <div className="text-3xl font-extrabold text-indigo mt-4">

          {Math.floor(secondsLeft / 60)
            .toString()
            .padStart(2, "0")}

          :

          {(secondsLeft % 60)
            .toString()
            .padStart(2, "0")}

        </div>

        <p className="text-sm text-gray-500 mt-2">
          One minute for yourself
        </p>

        {/* CONTROLS */}

        <div className="flex justify-center gap-3 mt-6">

          {!running && !completed && (
            <Button onClick={startSession}>
              Start
            </Button>
          )}

          {running && (
            <Button
              variant="soft"
              onClick={stopSession}
            >
              Stop
            </Button>
          )}

          {completed && (
            <Button onClick={startSession}>
              Start again
            </Button>
          )}

        </div>

        {/* COMPLETION MESSAGE */}

        {completed && (
          <div className="mt-6 p-4 bg-sage/20 rounded-2xl">

            <h3 className="text-xl font-bold text-ink">
              Well done 🌿
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              You took a moment to slow down.
              Carry that calm with you.
            </p>

          </div>
        )}

      </Card>

    </Screen>
  );
}
