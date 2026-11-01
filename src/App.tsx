import { useEffect, useState } from "react";
import { saveCheckIn } from "./lib/db";
import { startSavingTurns } from "./lib/hub";
import { useInsights } from "./lib/useInsights";
import Breathe from "./screens/Breathe";
import CheckIn from "./screens/CheckIn";
import Companion from "./screens/Companion";
import Home from "./screens/Home";
import Insights from "./screens/Insights";
import Play from "./screens/Play";
import Support from "./screens/Support";

export type Screen = "home" | "checkin" | "insights" | "companion" | "support" | "play" | "breathe";
export type Go = (s: Screen) => void;

const TITLES: Record<Screen, string> = {
  home: "MindMirror", checkin: "Check in", insights: "Insights", companion: "Companion",
  support: "Support", play: "Play room", breathe: "Breathe",
};

// These screens draw their own title, so App only adds a back button.
const OWN_LAYOUT: Screen[] = ["checkin", "breathe", "play", "support"];

function screenFromHash(): Screen {
  const s = location.hash.replace("#/", "") as Screen;
  return s in TITLES ? s : "home";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const go: Go = (s) => { location.hash = `#/${s}`; };
  const ins = useInsights();

  useEffect(() => {
    const onHash = () => {
      setScreen(screenFromHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Save every necklace / browser voice turn as it happens.
  useEffect(() => startSavingTurns(), []);

  const rung = ((ins?.rung.step ?? 1) - 1) as 0 | 1 | 2 | 3;

  return (
    <main className="min-h-screen bg-[#FBF7F0] text-[#2B2D42]">
      <div className="mx-auto max-w-[480px] p-5">
        {screen !== "home" && (
          <header className="mb-2 flex items-center gap-3">
            <button onClick={() => go("home")} aria-label="Back to home" className="text-2xl min-h-11 min-w-11">&larr;</button>
            {!OWN_LAYOUT.includes(screen) && <h1 className="text-xl font-bold">{TITLES[screen]}</h1>}
          </header>
        )}
        {screen === "home" && <Home go={go} />}
        {screen === "insights" && <Insights />}
        {screen === "companion" && <Companion />}
        {screen === "checkin" && (
          <CheckIn onSave={async (d) => {
            await saveCheckIn({ ...d, note: d.note || undefined });
            go("insights");
          }} />
        )}
        {screen === "breathe" && <Breathe />}
        {screen === "play" && <Play />}
        {screen === "support" && <Support current={rung} />}
      </div>
    </main>
  );
}
