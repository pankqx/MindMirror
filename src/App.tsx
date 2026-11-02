import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { CalendarIcon, ChartIcon, CheckIcon, CloseIcon, FaceIcon, GearIcon, HeartIcon, HomeIcon, PlayIcon, WaveIcon, WindIcon } from "./components/Icons";
import { LiveToasts } from "./components/LiveToasts";
import { Settings } from "./components/Settings";
import { HubStatus, ThemeButton, TopBar, Wordmark } from "./components/TopBar";
import { saveCheckIn } from "./lib/db";
import { startSavingTurns, unlockAudio } from "./lib/hub";
import { IMMERSIVE, TITLES, type Go, type Screen } from "./lib/nav";
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

// The front page and the immersive rooms load only when opened (the rooms bring in 3D).
const Landing = lazy(() => import("./screens/Landing"));
const Dive = lazy(() => import("./immersive/Landing"));
const VoiceMode = lazy(() => import("./immersive/VoiceMode"));
const FaceMode = lazy(() => import("./immersive/FaceMode"));

export type { Go, Screen } from "./lib/nav";

// The menu, in three quiet groups: your day, talking, and calming down.
const TABS = [
  { id: "checkin", label: "Check in", Icon: CheckIcon },
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "insights", label: "Insights", Icon: ChartIcon },
  { id: "support", label: "Support", Icon: HeartIcon },
] as const;

const TALK = [
  { id: "voice", label: "Voice mode", Icon: WaveIcon },
  { id: "face", label: "Face to face", Icon: FaceIcon },
] as const;

const CALM = [
  { id: "breathe", label: "Breathe", Icon: WindIcon },
  { id: "play", label: "Play", Icon: PlayIcon },
  { id: "planner", label: "Planner", Icon: CalendarIcon },
] as const;

const GROUPS = [
  { name: "Talk", items: TALK },
  { name: "Calm", items: CALM },
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


const TAB_IDS: Screen[] = TABS.map((t) => t.id);
const MORE_IDS: Screen[] = [...TALK, ...CALM].map((t) => t.id);

/** Four dots: "more". */
const MoreGlyph = ({ size = 22, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" aria-hidden="true">
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

function screenFromHash(): Screen {
  const s = location.hash.replace("#/", "") as Screen;
  if (!s) return "landing";
  return s in TITLES ? s : "home";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const [settings, setSettings] = useState(false);
  const [more, setMore] = useState(false);
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
        {GROUPS.map((g) => (
          <div key={g.name}>
            <p className="t-caption-sm mb-2 mt-7 flex items-center gap-2 px-3 text-faint"><span className="stitch-x inline-block h-[2px] w-5" aria-hidden="true" />{g.name}</p>
            <nav className="space-y-0.5" aria-label={g.name}>
              {g.items.map(({ id, label, Icon }) => (
                <RailLink key={id} active={screen === id} onClick={() => go(id)} Icon={Icon} label={label} />
              ))}
            </nav>
          </div>
        ))}
        <div className="mt-auto pt-6">
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

      {/* phone: four tabs and "More" for talking and calming down */}
      <AnimatePresence>
        {more && (
          <motion.div key="more" className="fixed inset-0 z-40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-ink/30 backdrop-blur-sm" aria-label="Close" onClick={() => setMore(false)} />
            <motion.div className="absolute inset-x-0 bottom-0 rounded-t-[18px] border-t border-line bg-bg px-5 pt-4 pb-[calc(84px+env(safe-area-inset-bottom))]"
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: "spring", stiffness: 420, damping: 36 }}>
              <div className="mx-auto max-w-[520px]">
                <div className="flex items-center justify-between">
                  <p className="t-caption-sm text-faint">More</p>
                  <button onClick={() => setMore(false)} aria-label="Close" className="grid h-9 w-9 place-items-center text-soft"><CloseIcon size={18} /></button>
                </div>
                {GROUPS.map((g) => (
                  <div key={g.name} className="mt-3">
                    <p className="t-caption-sm mb-1 text-faint">{g.name}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {g.items.map(({ id, label, Icon }) => (
                        <button key={id} onClick={() => { setMore(false); go(id); }}
                          className={`flex flex-col items-center gap-2 rounded-[10px] border border-line py-4 text-[13px] ${screen === id ? "bg-card-2 text-ink" : "text-soft"}`}>
                          <Icon size={22} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/90 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur-xl lg:hidden" aria-label="Main">
        <div className="mx-auto grid max-w-[520px] grid-cols-5 px-2">
          {[...TABS, { id: "more" as const, label: "More", Icon: MoreGlyph }].map(({ id, label, Icon }) => {
            const active = id === "more" ? more || MORE_IDS.includes(screen) : screen === id && !more;
            return (
              <button key={id} onClick={() => (id === "more" ? setMore((m) => !m) : (setMore(false), go(id)))} aria-current={active ? "page" : undefined}
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
