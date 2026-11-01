import { useEffect, useState } from "react";
import { startSavingTurns } from "./lib/hub";
import Companion from "./screens/Companion";
import Home from "./screens/Home";
import Insights from "./screens/Insights";
import QuickCheckIn from "./screens/QuickCheckIn";

export type Screen = "home" | "checkin" | "insights" | "companion" | "support" | "play" | "breathe" | "planner";
export type Go = (s: Screen) => void;

const TITLES: Record<Screen, string> = {
  home: "MindMirror", checkin: "Check in", insights: "Insights", companion: "Companion",
  support: "Support", play: "Play room", breathe: "Breathe", planner: "Planner",
};

// Screens a teammate is building. Swap the placeholder for their import when the PR is merged.
const COMING: Partial<Record<Screen, string>> = {
  support: "Merel is building the Support screen.",
  play: "Merel is building the Play room.",
  breathe: "Kishore is building the Breathe screen.",
  planner: "Planner comes later today.",
};

function screenFromHash(): Screen {
  const s = location.hash.replace("#/", "") as Screen;
  return s in TITLES ? s : "home";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const go: Go = (s) => { location.hash = `#/${s}`; };

  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Save every necklace / browser voice turn as it happens.
  useEffect(() => startSavingTurns(), []);

  return (
    <main className="min-h-screen bg-[#FBF7F0] text-[#2B2D42]">
      <div className="mx-auto max-w-[480px] p-5">
        {screen !== "home" && (
          <header className="mb-4 flex items-center gap-3">
            <button onClick={() => go("home")} aria-label="Back" className="text-2xl min-h-11 min-w-11">&larr;</button>
            <h1 className="text-xl font-bold">{TITLES[screen]}</h1>
          </header>
        )}
        {screen === "home" && <Home go={go} />}
        {screen === "checkin" && <QuickCheckIn onDone={() => go("insights")} />}
        {screen === "insights" && <Insights />}
        {screen === "companion" && <Companion />}
        {COMING[screen] && <p className="rounded-2xl bg-white p-6 text-center shadow-sm">{COMING[screen]}</p>}
      </div>
    </main>
  );
}
