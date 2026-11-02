import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { CalendarIcon, ChartIcon, ChatIcon, CheckIcon, FaceIcon, GearIcon, HeartIcon, HomeIcon, PlayIcon, WaveIcon, WindIcon } from "./components/Icons";
import { LiveToasts } from "./components/LiveToasts";
import { Settings } from "./components/Settings";
import { HubStatus, ThemeButton, TopBar, Wordmark } from "./components/TopBar";
import { saveCheckIn } from "./lib/db";
import { startSavingTurns, unlockAudio } from "./lib/hub";
import { IMMERSIVE, TITLES, type Go, type Screen } from "./lib/nav";
import { applyTheme, usePrefs } from "./lib/prefs";
import { useInsights } from "./lib/useInsights";
import { InkCharacter } from "./character/InkCharacter";
import { characters } from "./character/characters";
import { useCompanion } from "./lib/companion";
import Breathe from "./screens/Breathe";
import CheckIn from "./screens/CheckIn";
import Companion from "./screens/Companion";
import Home from "./screens/Home";
import Insights from "./screens/Insights";
import Planner from "./screens/Planner";
import Play from "./screens/Play";
import Support from "./screens/Support";
import Welcome from "./screens/Welcome";

// The front page and the immersive rooms load only when opened (the rooms bring in 3D).
const Landing = lazy(() => import("./screens/Landing"));
const Dive = lazy(() => import("./immersive/Landing"));
const VoiceMode = lazy(() => import("./immersive/VoiceMode"));
const FaceMode = lazy(() => import("./immersive/FaceMode"));

export type { Go, Screen } from "./lib/nav";

const TABS = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "companion", label: "Talk", Icon: ChatIcon },
  { id: "play", label: "Play", Icon: PlayIcon },
  { id: "support", label: "Support", Icon: HeartIcon },
] as const;

const MORE = [
  { id: "voice", label: "Voice mode", Icon: WaveIcon },
  { id: "face", label: "Face to face", Icon: FaceIcon },
  { id: "checkin", label: "Check in", Icon: CheckIcon },
  { id: "breathe", label: "Breathe", Icon: WindIcon },
  { id: "planner", label: "Planner", Icon: CalendarIcon },
] as const;

function RailLink({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: typeof HomeIcon; label: string }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined}
      className={`t-caption-sm relative flex h-9 w-full items-center gap-3 rounded-[4px] px-3 transition-colors ${active ? "text-ink" : "text-soft hover:bg-card-2 hover:text-ink"}`}>
      {active && <motion.span layoutId="rail-mark" className="absolute inset-0 rounded-[4px] bg-card-2" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      {active && <motion.span layoutId="rail-thread" className="absolute -left-6 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-indigo" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      <Icon size={17} className="relative" />
      <span className="relative">{label}</span>
    </button>
  );
}

/** Your companion, waiting at the foot of the rail: the head and shoulders of Reenu or Roman. */
function RailCompanion({ go }: { go: Go }) {
  const who = useCompanion() ?? "reenu";
  const cfg = characters[who];
  return (
    <button onClick={() => go("companion")} className="group relative mb-3 block h-[132px] w-full overflow-hidden rounded-[6px] border border-line text-left"
      aria-label={`Talk to ${cfg.name}`} style={{ ["--accent" as string]: cfg.accent }}>
      <span className="absolute inset-0 bg-[radial-gradient(closest-side_at_70%_90%,var(--accent),transparent)] opacity-25 transition-opacity group-hover:opacity-40" aria-hidden="true" />
      <span className="absolute -right-[58px] -top-[40px]" aria-hidden="true">
        <InkCharacter config={cfg} state="IDLE" height={300} label={`${cfg.name} (illustration)`} />
      </span>
      <span className="relative block p-3">
        <span className="t-caption-sm block text-soft">Your companion</span>
        <span className="font-display mt-1 block text-[1.9rem] italic leading-none text-[var(--accent)]">{cfg.name}</span>
        <span className="t-caption-sm mt-2 block text-ink">Talk →</span>
      </span>
    </button>
  );
}

const TAB_IDS: Screen[] = TABS.map((t) => t.id);

function screenFromHash(): Screen {
  const s = location.hash.replace("#/", "") as Screen;
  if (!s) return "landing";
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

  if (IMMERSIVE.includes(screen)) {
    return (
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<div className={`fixed inset-0 ${screen === "landing" ? "bg-paper" : "night"}`} />}>
          <AnimatePresence mode="wait">
            <motion.div key={screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              {screen === "landing" && <Landing go={go} />}
              {screen === "dive" && <Dive go={go} />}
              {screen === "voice" && <VoiceMode go={go} />}
              {screen === "face" && <FaceMode go={go} />}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>{!prefs.welcomed && <Welcome key="welcome" />}</AnimatePresence>

      {/* laptop: a quiet side rail */}
      <aside className="on-neel fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-[#171b38] px-6 py-7 lg:flex">
        <button onClick={() => go("landing")} aria-label="Start" className="mb-10 text-left"><Wordmark /></button>
        <nav className="space-y-0.5" aria-label="Main">
          {TABS.map(({ id, label, Icon }) => (
            <RailLink key={id} active={screen === id} onClick={() => go(id)} Icon={Icon} label={label} />
          ))}
        </nav>
        <p className="t-caption-sm mb-2 mt-8 flex items-center gap-2 px-3 text-faint"><span className="stitch-x inline-block h-[2px] w-5" aria-hidden="true" />Tools</p>
        <nav className="space-y-0.5" aria-label="Tools">
          {MORE.map(({ id, label, Icon }) => (
            <RailLink key={id} active={screen === id} onClick={() => go(id)} Icon={Icon} label={label} />
          ))}
        </nav>
        <div className="mt-auto pt-6">
          <RailCompanion go={go} />
          <HubStatus go={go} wide />
          <div className="flex items-center gap-1">
            <ThemeButton />
            <button onClick={() => setSettings(true)} aria-label="Settings"
              className="grid h-9 w-9 place-items-center rounded-[4px] text-soft hover:bg-card-2 hover:text-ink"><GearIcon size={18} /></button>
          </div>
        </div>
      </aside>

      <div className="mx-auto min-h-screen max-w-[520px] px-5 pb-32 lg:ml-[248px] lg:max-w-[1040px] lg:px-14 lg:pb-20">
        <TopBar screen={screen} onBack={isTab ? undefined : back} onSettings={() => setSettings(true)} go={go} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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

      {/* phone: a flat tab bar on a hairline */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur-xl lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-[520px] grid-cols-5 px-2">
          {TABS.map(({ id, label, Icon }) => {
            const active = screen === id;
            return (
              <button key={id} onClick={() => go(id)} aria-current={active ? "page" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1.5 font-[family-name:var(--font-geist-mono)] text-[10px] uppercase tracking-[0.04em] transition-colors ${active ? "text-ink" : "text-faint"}`}>
                {active && (
                  <motion.span layoutId="tab-mark" className="absolute top-0 h-[3px] w-8 rounded-full bg-indigo"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                )}
                <Icon size={22} strokeWidth={active ? 1.9 : 1.6} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <Settings open={settings} onClose={() => setSettings(false)} />
    </MotionConfig>
  );
}
