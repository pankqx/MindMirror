import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { ChartIcon, ChatIcon, HeartIcon, HomeIcon, PlayIcon } from "./components/Icons";
import { LiveToasts } from "./components/LiveToasts";
import { Settings } from "./components/Settings";
import { TopBar } from "./components/TopBar";
import { saveCheckIn } from "./lib/db";
import { startSavingTurns, unlockAudio } from "./lib/hub";
import { TITLES, type Go, type Screen } from "./lib/nav";
import { applyTheme, usePrefs } from "./lib/prefs";
import { useInsights } from "./lib/useInsights";
import Breathe from "./screens/Breathe";
import CheckIn from "./screens/CheckIn";
import Companion from "./screens/Companion";
import Home from "./screens/Home";
import Insights from "./screens/Insights";
import Planner from "./screens/Planner";
import Play from "./screens/Play";
import Support from "./screens/Support";
import Welcome from "./screens/Welcome";

export type { Go, Screen } from "./lib/nav";

const TABS = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "companion", label: "Talk", Icon: ChatIcon },
  { id: "play", label: "Play", Icon: PlayIcon },
  { id: "support", label: "Support", Icon: HeartIcon },
] as const;

const TAB_IDS: Screen[] = TABS.map((t) => t.id);

function screenFromHash(): Screen {
  const s = location.hash.replace("#/", "") as Screen;
  return s in TITLES ? s : "home";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const [settings, setSettings] = useState(false);
  const prefs = usePrefs();
  const go: Go = (s) => {
    if (s === screen) return window.scrollTo({ top: 0, behavior: "smooth" });
    location.hash = `#/${s}`;
  };
  const ins = useInsights();

  useEffect(() => {
    applyTheme();
    const onHash = () => {
      setScreen(screenFromHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onHash);
    // Browsers allow sound only after a click; the first click anywhere unlocks the laptop speaker.
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // Save every necklace / browser voice turn as it happens (and speak necklace replies here).
  useEffect(() => startSavingTurns(), []);

  const rung = ((ins?.rung.step ?? 1) - 1) as 0 | 1 | 2 | 3;
  const isTab = TAB_IDS.includes(screen);
  const back = () => (history.length > 1 ? history.back() : go("home"));

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{!prefs.welcomed && <Welcome key="welcome" />}</AnimatePresence>

      <div className="mx-auto min-h-screen max-w-[520px] px-5 pb-32">
        <TopBar screen={screen} onBack={isTab ? undefined : back} onSettings={() => setSettings(true)} go={go} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={screen}
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {screen === "home" && <Home go={go} />}
            {screen === "insights" && <Insights go={go} />}
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
            {screen === "planner" && <Planner />}
          </motion.main>
        </AnimatePresence>
      </div>

      <LiveToasts go={go} screen={screen} />

      {/* bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 pb-[max(env(safe-area-inset-bottom),12px)]" aria-label="Main">
        <div className="mx-auto max-w-[520px] px-4">
          <div className="grid grid-cols-5 rounded-[1.75rem] border border-line/80 bg-card/80 p-1.5 shadow-soft backdrop-blur-xl">
            {TABS.map(({ id, label, Icon }) => {
              const active = screen === id;
              return (
                <button key={id} onClick={() => go(id)} aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-3xl text-[11px] font-bold transition-colors ${active ? "text-indigo" : "text-faint hover:text-soft"}`}>
                  {active && (
                    <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-3xl bg-indigo/12"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }} />
                  )}
                  <motion.span className="relative" animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }}>
                    <Icon size={22} />
                  </motion.span>
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <Settings open={settings} onClose={() => setSettings(false)} />
    </MotionConfig>
  );
}
